import crypto from "crypto";
import dotenv from "dotenv";
import { DataSource, IsNull, Not } from "typeorm";
import { AdminRepository } from "../repositories/AdminRepository";
import { ClientRepository } from "../repositories/ClientRepository";
import { StaffRepository } from "../repositories/StaffRepository";
import { extractVkBinding, phoneLookupVariants } from "./vk-binding";

dotenv.config();

const VK_API = "https://api.vk.com/method";

type LongPollSession = {
  server: string;
  key: string;
  ts: string;
};

export class VkService {
  private readonly clientRepo: ClientRepository;
  private readonly adminRepo: AdminRepository;
  private readonly staffRepo: StaffRepository;
  private readonly token: string;
  private readonly groupId: string;
  private readonly version: string;
  private readonly enabled: boolean;
  private stopped = false;

  constructor(dataSource: DataSource) {
    this.clientRepo = new ClientRepository(dataSource);
    this.adminRepo = new AdminRepository(dataSource);
    this.staffRepo = new StaffRepository(dataSource);
    this.token = process.env.VK_COMMUNITY_TOKEN?.trim() ?? "";
    this.groupId = process.env.VK_GROUP_ID?.trim() ?? "";
    this.version = process.env.VK_API_VERSION?.trim() || "5.199";
    this.enabled = Boolean(this.token && this.groupId);

    if (!this.enabled) {
      console.warn(
        "VK-уведомления выключены: не задан VK_COMMUNITY_TOKEN или VK_GROUP_ID",
      );
      return;
    }

    console.log(`VK Long Poll запущен для сообщества ${this.groupId}`);
    void this.pollLoop();
  }

  public stop() {
    this.stopped = true;
  }

  public async sendMessageToClient(phone: string, message: string): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      const client = await this.clientRepo.getClientByPhone(phone);
      if (!client?.vk_id) {
        console.log(`Клиент ${phone} не привязал ВКонтакте`);
        return false;
      }
      return this.sendToPeer(client.vk_id, message);
    } catch (error) {
      this.logError("Ошибка отправки сообщения клиенту ВКонтакте", error);
      return false;
    }
  }

  public async sendMessageToAdmin(phone: string, message: string): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      const admin = await this.adminRepo.getAdminByPhone(phone);
      if (!admin?.vk_id) {
        console.log(`Админ ${phone} не привязал ВКонтакте`);
        return false;
      }
      return this.sendToPeer(admin.vk_id, message);
    } catch (error) {
      this.logError("Ошибка отправки сообщения админу ВКонтакте", error);
      return false;
    }
  }

  public async sendMessageToStaff(phone: string, message: string): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      const staff = await this.staffRepo.getStaffByPhone(phone);
      if (!staff?.vk_id) {
        console.log(`Сотрудник ${phone} не привязал ВКонтакте`);
        return false;
      }
      return this.sendToPeer(staff.vk_id, message);
    } catch (error) {
      this.logError("Ошибка отправки сообщения сотруднику ВКонтакте", error);
      return false;
    }
  }

  public async sendMessageToAllStaff(message: string): Promise<void> {
    if (!this.enabled) return;
    try {
      const staffList = await this.staffRepo.find({
        where: { vk_id: Not(IsNull()) },
      });
      for (const staff of staffList) {
        if (!staff.vk_id) continue;
        await this.sendToPeer(staff.vk_id, message);
      }
    } catch (error) {
      this.logError("Ошибка отправки сообщения сотрудникам ВКонтакте", error);
    }
  }

  private async pollLoop() {
    let waitMs = 1000;
    while (!this.stopped) {
      try {
        const session = await this.getLongPollServer();
        waitMs = 1000;
        await this.listen(session);
      } catch (error) {
        this.logError("VK Long Poll", error);
        await this.sleep(waitMs);
        waitMs = Math.min(waitMs * 2, 30_000);
      }
    }
  }

  private async listen(session: LongPollSession) {
    let ts = session.ts;
    while (!this.stopped) {
      const url = new URL(session.server);
      url.searchParams.set("act", "a_check");
      url.searchParams.set("key", session.key);
      url.searchParams.set("ts", ts);
      url.searchParams.set("wait", "25");

      const response = await fetch(url, { signal: AbortSignal.timeout(35_000) });
      const data = (await response.json()) as {
        ts?: string | number;
        failed?: number;
        updates?: unknown[];
      };

      if (data.failed === 1 && data.ts) {
        ts = String(data.ts);
        continue;
      }
      if (data.failed) {
        throw new Error(`сессия Long Poll сброшена (${data.failed})`);
      }

      ts = String(data.ts ?? ts);
      for (const update of data.updates ?? []) {
        await this.handleUpdate(update);
      }
    }
  }

  private async handleUpdate(update: unknown) {
    const binding = extractVkBinding(update);
    if (binding.kind === "ignore") return;

    if (binding.kind === "prompt") {
      await this.sendToPeer(
        binding.peerId,
        "Напишите номер телефона так, как он указан в системе, например 79000000000",
      );
      return;
    }

    try {
      const matched = await this.findAccountsByPhone(binding.phone);
      const client = matched.client;
      const admin = matched.admin;
      const staff = matched.staff;

      if (!client && !admin && !staff) {
        await this.sendToPeer(
          binding.peerId,
          "❌ Пользователь с таким номером телефона не найден",
        );
        return;
      }

      if (client) {
        await this.clientRepo.update(client.id, { vk_id: binding.peerId });
        await this.sendToPeer(
          binding.peerId,
          "Вас приветствует СервисБот! ✅ ВКонтакте успешно привязан к профилю клиента.",
        );
        console.log(`Клиент ${binding.phone} привязал ВКонтакте: vkId=${binding.peerId}`);
      }

      if (admin) {
        await this.adminRepo.update(admin.id, { vk_id: binding.peerId });
        await this.sendToPeer(
          binding.peerId,
          "Вас приветствует СервисБот! ✅ ВКонтакте успешно привязан к профилю администратора.",
        );
        console.log(`Админ ${binding.phone} привязал ВКонтакте: vkId=${binding.peerId}`);
      }

      if (staff) {
        await this.staffRepo.update(staff.id, { vk_id: binding.peerId });
        await this.sendToPeer(
          binding.peerId,
          "Вас приветствует СервисБот! ✅ ВКонтакте успешно привязан к профилю сотрудника.",
        );
        console.log(`Сотрудник ${binding.phone} привязал ВКонтакте: vkId=${binding.peerId}`);
      }
    } catch (error) {
      this.logError("Ошибка привязки ВКонтакте", error);
      await this.sendToPeer(binding.peerId, "⚠ Произошла ошибка, попробуйте позже");
    }
  }

  private async findAccountsByPhone(phone: string) {
    for (const variant of phoneLookupVariants(phone)) {
      const client = await this.clientRepo.getClientByPhone(variant);
      const admin = await this.adminRepo.getAdminByPhone(variant);
      const staff = await this.staffRepo.getStaffByPhone(variant);
      if (client || admin || staff) return { client, admin, staff };
    }
    return { client: null, admin: null, staff: null };
  }

  private async getLongPollServer(): Promise<LongPollSession> {
    const response = (await this.call("groups.getLongPollServer", {
      group_id: this.groupId,
    })) as { server: string; key: string; ts: string | number };
    return {
      server: String(response.server),
      key: String(response.key),
      ts: String(response.ts),
    };
  }

  private async sendToPeer(peerId: string, message: string): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      await this.call("messages.send", {
        peer_id: peerId,
        random_id: String(crypto.randomInt(1, 2_147_483_647)),
        message,
      });
      return true;
    } catch (error) {
      this.logError("Ошибка отправки сообщения ВКонтакте", error);
      return false;
    }
  }

  private async call(method: string, params: Record<string, string>) {
    const body = new URLSearchParams({
      ...params,
      access_token: this.token,
      v: this.version,
    });
    const response = await fetch(`${VK_API}/${method}`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await response.json()) as {
      response?: unknown;
      error?: { error_code?: number; error_msg?: string };
    };
    if (data.error) {
      throw new Error(
        `VK ${method}: ${data.error.error_code ?? "?"} ${data.error.error_msg ?? ""}`.trim(),
      );
    }
    return data.response;
  }

  private logError(scope: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${scope}:`, message.replace(/key=[^&\s]+/g, "key=***"));
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
