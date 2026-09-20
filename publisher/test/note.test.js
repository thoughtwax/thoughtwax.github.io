import assert from "node:assert/strict";
import test from "node:test";
import { buildNote } from "../src/note.js";

test("buildNote creates an unpadded sequential permalink and preserves text", () => {
  const note = buildNote({
    id: 7,
    draftId: "draft-123",
    payload: {
      sentAt: 1_786_000_000,
      messageId: 42,
      text: "A small thought with café punctuation.",
    },
  });

  assert.match(note, /note_id: 7\n/);
  assert.match(note, /permalink: \/notes\/7\//);
  assert.doesNotMatch(note, /notes\/000007/);
  assert.match(note, /telegram_draft_id: "draft-123"/);
  assert.match(note, /summary: "A small thought with café punctuation\."/);
  assert.match(note, /A small thought with café punctuation\./);
});

test("buildNote includes photo and link metadata", () => {
  const note = buildNote({
    id: 19,
    draftId: "draft-456",
    payload: {
      sentAt: 1_786_000_000,
      messageId: 43,
      text: "Worth keeping https://example.com/story",
    },
    mediaUrl: "/uploads/notes/19.jpg",
    link: {
      url: "https://example.com/story",
      host: "example.com",
      title: "An example",
      description: "Example description",
      image: "https://example.com/card.jpg",
    },
  });

  assert.match(note, /media_url: "\/uploads\/notes\/19\.jpg"/);
  assert.match(note, /link_title: "An example"/);
  assert.match(note, /link_description: "Example description"/);
});
