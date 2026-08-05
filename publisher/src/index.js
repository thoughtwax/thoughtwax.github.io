import {
  claimDraftForPublishing,
  createDraft,
  discardDraft,
  getDraft,
  markFailed,
  markPublished,
  markUndone,
} from "./db.js";
import { deleteFile, putFile, bytesToBase64, textToBase64 } from "./github.js";
import { fetchLinkPreview, firstHttpUrl } from "./link-preview.js";
import { buildNote } from "./note.js";
import {
  answerCallback,
  downloadTelegramPhoto,
  editPreview,
  extractMessage,
  sendPreview,
  sendText,
} from "./telegram.js";

function authorized(env, userId) {
  return String(userId) === String(env.TELEGRAM_ALLOWED_USER_ID);
}

async function receiveMessage(env, message) {
  const payload = extractMessage(message);
  if (!payload || payload.chatType !== "private" || !authorized(env, payload.userId)) return;

  if (payload.unsupportedMedia) {
    await sendText(env, payload.chatId, "This first version supports text, links and one photo.", payload.messageId);
    return;
  }
  if (!payload.text.trim() && !payload.media) return;

  const { draft, created } = await createDraft(env, payload);
  if (created) await sendPreview(env, draft);
}

async function publishDraft(env, callback, draftId) {
  const result = await claimDraftForPublishing(env, draftId);
  if (!result.claimed) {
    const messages = {
      published: "Already published",
      publishing: "Publishing is already in progress",
      discarded: "This draft was discarded",
      undone: "This note was undone",
      missing: "Draft not found",
    };
    await answerCallback(env, callback.id, messages[result.reason] || "Draft is busy");
    return;
  }

  const draft = result.draft;
  const payload = JSON.parse(draft.payload);
  await answerCallback(env, callback.id, `Publishing note ${draft.note_id}…`);

  let mediaPath = null;
  try {
    let mediaUrl = null;
    if (payload.media?.type === "photo") {
      const photo = await downloadTelegramPhoto(env, payload.media);
      mediaPath = `uploads/notes/${draft.note_id}.${photo.extension}`;
      await putFile(env, {
        path: mediaPath,
        contentBase64: bytesToBase64(photo.bytes),
        message: `Add media for note ${draft.note_id}`,
        overwrite: true,
      });
      mediaUrl = `/${mediaPath}`;
    }

    const url = firstHttpUrl(payload.text);
    const link = url ? await fetchLinkPreview(url) : null;
    const notePath = `_notes/${draft.note_id}.markdown`;
    const note = buildNote({
      id: draft.note_id,
      draftId: draft.id,
      payload,
      mediaUrl,
      link: link || (url ? { url, host: new URL(url).hostname.replace(/^www\./, ""), title: url } : null),
    });

    await putFile(env, {
      path: notePath,
      contentBase64: textToBase64(note),
      message: `Add note ${draft.note_id}`,
      expectedDraftId: draft.id,
    });
    await markPublished(env, draft.id, { notePath, mediaPath });

    const permalink = `${env.SITE_URL.replace(/\/$/, "")}/notes/${draft.note_id}/`;
    await editPreview(env, callback.message, `Published note ${draft.note_id}\n${permalink}`, [[
      { text: "Undo", callback_data: `undo:${draft.id}` },
    ]]);
  } catch (error) {
    await markFailed(env, draft.id, error.message || error);
    await editPreview(env, callback.message, `Publishing failed\n${String(error.message || error).slice(0, 500)}`, [[
      { text: "Retry", callback_data: `publish:${draft.id}` },
      { text: "Discard", callback_data: `discard:${draft.id}` },
    ]]);
  }
}

async function discard(env, callback, draftId) {
  const changed = await discardDraft(env, draftId);
  await answerCallback(env, callback.id, changed ? "Discarded" : "This draft can no longer be discarded");
  if (changed) await editPreview(env, callback.message, "Discarded", []);
}

async function undo(env, callback, draftId) {
  const draft = await getDraft(env, draftId);
  if (!draft || draft.status !== "published") {
    await answerCallback(env, callback.id, "This note cannot be undone");
    return;
  }

  await answerCallback(env, callback.id, `Removing note ${draft.note_id}…`);
  try {
    await deleteFile(env, draft.note_path, `Undo note ${draft.note_id}`);
    await deleteFile(env, draft.media_path, `Remove media for note ${draft.note_id}`);
    await markUndone(env, draft.id);
    await editPreview(env, callback.message, `Undone note ${draft.note_id}`, []);
  } catch (error) {
    await sendText(env, callback.message.chat.id, `Undo failed: ${String(error.message || error).slice(0, 500)}`);
  }
}

async function receiveCallback(env, callback) {
  if (!callback?.from || !authorized(env, callback.from.id) || !callback.message) return;
  const [action, draftId] = String(callback.data || "").split(":", 2);
  if (!draftId) return;
  if (action === "publish") return publishDraft(env, callback, draftId);
  if (action === "discard") return discard(env, callback, draftId);
  if (action === "undo") return undo(env, callback, draftId);
}

export async function handleUpdate(env, update) {
  if (update.message) return receiveMessage(env, update.message);
  if (update.callback_query) return receiveCallback(env, update.callback_query);
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({ ok: true, service: "thoughtwax-notes-publisher" });
    }
    if (request.method !== "POST" || url.pathname !== "/telegram") {
      return new Response("Not found", { status: 404 });
    }
    if (request.headers.get("x-telegram-bot-api-secret-token") !== env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }

    let update;
    try {
      update = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    context.waitUntil(handleUpdate(env, update));
    return Response.json({ ok: true });
  },
};
