import assert from "node:assert/strict";
import test from "node:test";
import { extractMessage } from "../src/telegram.js";

test("extractMessage uses a photo's largest available size", () => {
  const payload = extractMessage({
    message_id: 12,
    date: 1_786_000_000,
    chat: { id: 99, type: "private" },
    from: { id: 88 },
    caption: "Photo caption",
    photo: [
      { file_id: "small", file_unique_id: "a", width: 90, height: 90 },
      { file_id: "large", file_unique_id: "b", width: 1280, height: 900, file_size: 12345 },
    ],
  });

  assert.equal(payload.media.fileId, "large");
  assert.equal(payload.text, "Photo caption");
  assert.equal(payload.unsupportedMedia, false);
});

test("extractMessage flags media not included in the first slice", () => {
  const payload = extractMessage({
    message_id: 13,
    date: 1_786_000_000,
    chat: { id: 99, type: "private" },
    from: { id: 88 },
    voice: { file_id: "voice" },
  });
  assert.equal(payload.unsupportedMedia, true);
});
