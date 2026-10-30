export type VkBinding =
  | { kind: "ignore" }
  | { kind: "prompt"; peerId: string }
  | { kind: "bind"; peerId: string; phone: string };

const PHONE_PATTERN = /^\+?\d{10,15}$/;

export function normalizePhone(value: string): string | null {
  const compact = value.trim().replace(/[\s()\-]/g, "");
  return PHONE_PATTERN.test(compact) ? compact : null;
}

export function phoneLookupVariants(phone: string): string[] {
  const compact = normalizePhone(phone);
  if (!compact) return [];

  const digits = compact.replace(/\D/g, "");
  const variants = new Set<string>([compact, digits, `+${digits}`]);
  if (digits.length === 11 && digits.startsWith("8")) {
    variants.add(`7${digits.slice(1)}`);
  }
  if (digits.length === 11 && digits.startsWith("7")) {
    variants.add(`8${digits.slice(1)}`);
  }
  return [...variants];
}

type VkMessage = {
  from_id?: number;
  ref?: string;
  text?: string;
};

function readMessage(object: unknown): VkMessage | null {
  if (!object || typeof object !== "object") return null;
  const record = object as { message?: unknown; from_id?: number; ref?: string; text?: string };
  if (record.message && typeof record.message === "object") {
    return record.message as VkMessage;
  }
  if (typeof record.from_id === "number" || typeof record.ref === "string") {
    return record;
  }
  return null;
}

export function extractVkBinding(update: unknown): VkBinding {
  if (!update || typeof update !== "object") return { kind: "ignore" };
  const event = update as { type?: string; object?: unknown };
  if (event.type !== "message_new") return { kind: "ignore" };

  const message = readMessage(event.object);
  if (!message) return { kind: "ignore" };

  const fromId = message.from_id;
  if (typeof fromId !== "number" || fromId <= 0) return { kind: "ignore" };

  const peerId = String(fromId);
  const refPhone = typeof message.ref === "string" ? normalizePhone(message.ref) : null;
  const textPhone = typeof message.text === "string" ? normalizePhone(message.text) : null;
  const phone = refPhone || textPhone;
  if (phone) return { kind: "bind", peerId, phone };

  return { kind: "prompt", peerId };
}
