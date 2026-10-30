import assert from "assert";
import { extractVkBinding, phoneLookupVariants } from "../src/services/vk-binding";

const phone = "79001111111";

const linked = extractVkBinding({
  type: "message_new",
  object: {
    message: { from_id: 501, text: "Начать", ref: phone },
    client_info: {},
  },
});
assert.deepStrictEqual(linked, { kind: "bind", peerId: "501", phone });

const plainStart = extractVkBinding({
  type: "message_new",
  object: { message: { from_id: 501, text: "Начать" } },
});
assert.deepStrictEqual(plainStart, { kind: "prompt", peerId: "501" });

const typedPhone = extractVkBinding({
  type: "message_new",
  object: { message: { from_id: 501, text: "+7 (900) 111-11-11" } },
});
assert.deepStrictEqual(typedPhone, {
  kind: "bind",
  peerId: "501",
  phone: "+79001111111",
});

const chatter = extractVkBinding({
  type: "message_new",
  object: { message: { from_id: 501, text: "привет" } },
});
assert.deepStrictEqual(chatter, { kind: "prompt", peerId: "501" });

const otherEvent = extractVkBinding({ type: "wall_post_new", object: {} });
assert.deepStrictEqual(otherEvent, { kind: "ignore" });

const communitySender = extractVkBinding({
  type: "message_new",
  object: { message: { from_id: -242635921, ref: phone } },
});
assert.deepStrictEqual(communitySender, { kind: "ignore" });

const legacyShape = extractVkBinding({
  type: "message_new",
  object: { from_id: 77, ref: "+79002222222", text: "Начать" },
});
assert.deepStrictEqual(legacyShape, {
  kind: "bind",
  peerId: "77",
  phone: "+79002222222",
});

assert.ok(phoneLookupVariants("+7 (900) 000-00-00").includes("79000000000"));
assert.ok(phoneLookupVariants("89000000000").includes("79000000000"));

console.log("vk-binding tests passed");
