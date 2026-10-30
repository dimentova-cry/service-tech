import { AppealRepository } from "../repositories/AppealRepository";
import { AppealStatusRepository } from "../repositories/AppealStatusRepository";
import { ClientRepository } from "../repositories/ClientRepository";
import { StaffRepository } from "../repositories/StaffRepository";
import { DataSource, In } from "typeorm";
import { excelExportService } from "./excel-export.service";
import { TelegramService } from "./TelegramService";
import { VkService } from "./VkService";
import { AdminRepository } from "../repositories/AdminRepository";

/**
 * Сервис для работы с заявками
 */
export class AppealService {
  private appealRepo: AppealRepository;
  private statusRepo: AppealStatusRepository;
  private clientRepo: ClientRepository;
  private staffRepo: StaffRepository;
  private adminRepo: AdminRepository;

  constructor(
    dataSource: DataSource,
    private telegramService: TelegramService,
    private vkService: VkService,
  ) {
    // Инициализация репозиториев
    this.appealRepo = new AppealRepository(dataSource);
    this.statusRepo = new AppealStatusRepository(dataSource);
    this.clientRepo = new ClientRepository(dataSource);
    this.staffRepo = new StaffRepository(dataSource);
    this.adminRepo = new AdminRepository(dataSource);
  }

  private async deliver(telegramSend: Promise<unknown>, vkSend: Promise<unknown>) {
    const telegramSafe = telegramSend.then(
      (value) => value,
      (error) => {
        console.error("Ошибка Telegram:", error);
        return false;
      },
    );
    const telegramLimited = new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.error("Telegram не ответил за 8 секунд, заявка его не ждёт");
        resolve(false);
      }, 8000);
      telegramSafe.then((value) => {
        clearTimeout(timer);
        resolve(value);
      });
    });

    const results = await Promise.allSettled([telegramLimited, vkSend]);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Ошибка уведомления:", result.reason);
      }
    }
  }

  /**
   * Создание новой заявки
   */
  async createAppeal(
    mechanism: string,
    problem: string,
    fioClient: string,
    clientId: number,
    priority: string,
  ) {
    // Проверка существования клиента
    const client = await this.clientRepo.findOne({ where: { id: clientId } });
    if (!client) throw new Error("Клиент не найден");

    // Получение статуса "Новая"
    const status = await this.statusRepo.findByStatusName("new");
    if (!status) throw new Error("Статус не найден");

    // Создание заявки
    const appeal = await this.appealRepo.createAppeal(
      priority,
      mechanism,
      problem,
      fioClient,
      status,
      client,
    );

    // Уведомление администратора
    const admin = await this.adminRepo.getOneAdmin();
    if (!admin) throw new Error("Администратор не найден");

    const newAppealText = `Назначено новое задание: Заявка №${appeal.id} от ${client.company_name}. Приоритет заявки: ${priority}.`;

    await this.deliver(
      this.telegramService.sendMessageToAdmin(
        admin.phone_number_admin,
        newAppealText,
      ),
      this.vkService.sendMessageToAdmin(admin.phone_number_admin, newAppealText),
    );

    await this.notifyAssignedStaff(client.id, newAppealText);

    return appeal;
  }

  private async notifyAssignedStaff(clientId: number, message: string) {
    const clientWithStaff = await this.clientRepo.findOne({
      where: { id: clientId },
      relations: ["assigned_staff"],
    });
    for (const staff of clientWithStaff?.assigned_staff ?? []) {
      if (!staff.phone_number_staff) continue;
      await this.deliver(
        this.telegramService.sendMessageToStaff(staff.phone_number_staff, message),
        this.vkService.sendMessageToStaff(staff.phone_number_staff, message),
      );
    }
  }

  /**
   * Взятие заявки в работу
   */
  private async staffCanAccessClient(staffId: number, clientId?: number) {
    if (!clientId) return false;
    const staff = await this.staffRepo.findOne({
      where: { id: staffId },
      relations: ["assigned_clients"],
    });
    if (!staff) throw new Error("Сотрудник не найден");
    return (staff.assigned_clients ?? []).some(
      (client) => client.id === clientId,
    );
  }

  async takeAppealToWork(appealId: number, staffId: number) {
    // Проверка существования заявки
    const appeal = await this.appealRepo.findOne({
      where: { id: appealId },
      relations: ["company_name_id"],
    });
    if (!appeal) throw new Error("Заявка не найдена");

    const canAccess = await this.staffCanAccessClient(
      staffId,
      appeal.company_name_id?.id,
    );
    if (!canAccess) throw new Error("Нет доступа к заявкам этого заказчика");

    // Проверка существования сотрудника
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });
    if (!staff) throw new Error("Сотрудник не найден");

    // Получение статуса "В работе"
    const status = await this.statusRepo.findByStatusName("in_progress");
    if (!status) throw new Error("Статус не найден");

    // Обновление заявки
    appeal.status = status;
    appeal.fio_staff_open_id = staff;
    appeal.fio_staff = staff.fio_staff;

    return this.appealRepo.save(appeal);
  }

  /**
   * Закрытие заявки
   */
  async closeAppeal(
    appealId: number,
    staffId: number,
    description: string,
    fio_staff: string,
  ) {
    const existing = await this.appealRepo.findOne({
      where: { id: appealId },
      relations: ["company_name_id", "fio_staff_open_id"],
    });
    if (!existing) throw new Error("Заявка не найдена");

    const canAccess = await this.staffCanAccessClient(
      staffId,
      existing.company_name_id?.id,
    );
    const isOpener = existing.fio_staff_open_id?.id === staffId;
    if (!canAccess && !isOpener) {
      throw new Error("Нет доступа к заявкам этого заказчика");
    }

    // Проверка существования сотрудника
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });
    if (!staff) throw new Error("Сотрудник не найден");

    // Получение статуса "Завершено"
    const closedStatus = await this.statusRepo.findByStatusName("completed");
    if (!closedStatus) throw new Error("Статус не найден");

    // Закрытие заявки
    const appeal = await this.appealRepo.closeAppeal(
      appealId,
      staff,
      description,
      fio_staff,
    );

    // Получение клиента для уведомления
    const client = await this.clientRepo.findOne({
      where: { id: appeal.company_name_id.id },
      relations: ["appeals"],
    });

    if (!client) throw new Error("Клиент не найден");

    const closedText = `Заявка №${appeal.id} от ${client.company_name} выполнена (закрыта)`;

    // Уведомление клиента
    await this.deliver(
      this.telegramService.sendMessageToClient(client.phone_number_client, closedText),
      this.vkService.sendMessageToClient(client.phone_number_client, closedText),
    );

    // Уведомление администратора
    const admin = await this.adminRepo.getOneAdmin();
    if (!admin) throw new Error("Администратор не найден");

    await this.deliver(
      this.telegramService.sendMessageToAdmin(admin.phone_number_admin, closedText),
      this.vkService.sendMessageToAdmin(admin.phone_number_admin, closedText),
    );

    const statuses = await this.statusRepo.find({
      where: [
        { st: "completed" },
        { st: "cancel" }, // Добавляем статус отмены
      ],
    });

    if (statuses.length === 0) return [];
    const statusIds = statuses.map((s) => s.id);

    // Генерация отчета
    if (appeal.company_name_id) {
      const appeals = await this.appealRepo.find({
        where: {
          company_name_id: appeal.company_name_id,
          status: In(statusIds),
        },
        relations: [
          "company_name_id",
          "status",
          "fio_staff_close_id",
          "fio_staff_open_id",
        ],
      });
      await excelExportService.getOrCreateReport(client, appeals);
    }

    return appeal;
  }

  /**
   * Отмена заявки
   */
  async cancelAppeal(
    appealId: number,
    userId: number,
    cancelInitiator: string,
  ) {
    // Проверка существования пользователя
    const user = await this.clientRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error("Пользователь не найден");

    // Получение статусов
    const cancelStatus = await this.statusRepo.findByStatusName("cancel");
    // const completedStatus = await this.statusRepo.findByStatusName("completed");

    // Поиск исходной заявки
    const prevAppeal = await this.appealRepo.findOne({
      where: { id: appealId },
      relations: ["company_name_id", "fio_staff_close_id", "fio_staff_open_id"],
    });
    if (!prevAppeal) throw new Error("Заявка не найдена");

    // Создание заявки на отмену (системная запись об отмене)
    // Добавляем информацию об инициаторе в описание этой записи
    // const newAppeal = await this.appealRepo.createAppeal(
    //   "Отмена заявки",
    //   `Отмена заявки от ${prevAppeal.date_start.toLocaleString(
    //     "ru"
    //   )}. Инициатор: ${cancelInitiator}`,
    //   `Инициатор отмены со стороны заказчика: ${cancelInitiator}`,
    //   cancelStatus!,
    //   user
    // );

    // Обновление исходной заявки
    prevAppeal.status = cancelStatus!;
    prevAppeal.date_close = new Date();

    // Формируем подробный комментарий в основной заявке
    prevAppeal.appeal_desc = `Заявка отменена заказчиком [${new Date().toISOString()}]. Инициатор отмены: ${cancelInitiator}`;

    await this.appealRepo.save(prevAppeal);

    const statuses = await this.statusRepo.find({
      where: [
        { st: "completed" },
        { st: "cancel" }, // Добавляем статус отмены
      ],
    });

    if (statuses.length === 0) return [];
    const statusIds = statuses.map((s) => s.id);

    console.log(statusIds, prevAppeal);

    const client = await this.clientRepo.findOne({
      where: { id: prevAppeal.company_name_id.id },
      relations: ["appeals"],
    });

    if (!client) throw new Error("Клиент не найден");

    const admin = await this.adminRepo.getOneAdmin();
    if (!admin) throw new Error("Администратор не найден");

    const cancelText = `Заявка №${prevAppeal.id} от ${client.company_name} отменена заказчиком.`;

    await this.deliver(
      this.telegramService.sendMessageToAdmin(admin.phone_number_admin, cancelText),
      this.vkService.sendMessageToAdmin(admin.phone_number_admin, cancelText),
    );

    await this.deliver(
      this.telegramService.sendMessageToClient(client.phone_number_client, cancelText),
      this.vkService.sendMessageToClient(client.phone_number_client, cancelText),
    );

    await this.notifyAssignedStaff(client.id, cancelText);

    if (prevAppeal.company_name_id) {
      const appeals = await this.appealRepo.find({
        where: {
          company_name_id: prevAppeal.company_name_id,
          status: In(statusIds),
        },
        relations: [
          "company_name_id",
          "status",
          "fio_staff_close_id",
          "fio_staff_open_id",
        ],
      });

      await excelExportService.getOrCreateReport(client, appeals);
    }

    return prevAppeal;
  }

  // Методы получения заявок по статусам
  async getNewAppeals() {
    return this.appealRepo.findNewAppeals();
  }

  async getNewAppealsByClientId(clientId: number) {
    return this.appealRepo.findNewAppealsByClientId(clientId);
  }

  async getAppealsInProgress() {
    return this.appealRepo.findAppealsInProgress();
  }

  async getAppealsInProgressByClientId(clientId: number) {
    return this.appealRepo.getAppealsInProgressByClientId(clientId);
  }

  async getCompletedAppeals() {
    return this.appealRepo.findCompletedAppeals();
  }

  async getCompletedAppealsByClientId(clientId: number) {
    return this.appealRepo.getCompletedAppealsByClientId(clientId);
  }

  private async assignedClientIds(staffId: number) {
    const staff = await this.staffRepo.findOne({
      where: { id: staffId },
      relations: ["assigned_clients"],
    });
    if (!staff) throw new Error("Сотрудник не найден");
    return (staff.assigned_clients ?? []).map((client) => client.id);
  }

  async getNewAppealsForStaff(staffId: number) {
    return this.appealRepo.findNewAppealsByClientIds(
      await this.assignedClientIds(staffId),
    );
  }

  async getAppealsInProgressForStaff(staffId: number) {
    return this.appealRepo.findAppealsInProgressByClientIds(
      await this.assignedClientIds(staffId),
    );
  }

  async getCompletedAppealsForStaff(staffId: number) {
    return this.appealRepo.findCompletedAppealsByClientIds(
      await this.assignedClientIds(staffId),
    );
  }
}
