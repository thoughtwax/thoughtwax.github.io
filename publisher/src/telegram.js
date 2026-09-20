const API_ROOT = "https://api.telegram.org";

export async function telegramApi(env, method, payload = {}) {
  const response = await fetch(`${API_ROOT}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description || response.status}`);
  }
  return data.result;
}

export function extractMessage(message) {
  if (!message?.chat || !message?.from) return null;

  const text = message.text || message.caption || "";
  let media = null;
  if (Array.isArray(message.photo) && message.photo.length > 0) {
    const photo = message.photo.at(-1);
    media = {
      type: "photo",
      fileId: photo.file_id,
      uniqueId: photo.file_unique_id,
      size: photo.file_size || null,
      width: photo.width,
      height: photo.height,
      mimeType: "image/jpeg",
    };
  }

  const unsupportedMedia = !media && Boolean(
    message.video || message.animation || message.audio || message.voice || message.document || message.sticker,
  );

  return {
    chatId: message.chat.id,
    chatType: message.chat.type,
    userId: message.from.id,
    messageId: message.message_id,
    sentAt: message.date,
    text,
    media,
    unsupportedMedia,
  };
}

export async function sendPreview(env, draft) {
  const payload = JSON.parse(draft.payload);
  const excerpt = payload.text.trim().slice(0, 700);
  const label = payload.media ? "Photo note" : payload.text.match(/https?:\/\//i) ? "Link note" : "Text note";
  const text = [`${label} ready to publish`, excerpt].filter(Boolean).join("\n\n");

  return telegramApi(env, "sendMessage", {
    chat_id: payload.chatId,
    text,
    reply_parameters: { message_id: payload.messageId },
    reply_markup: {
      inline_keyboard: [[
        { text: "Publish", callback_data: `publish:${draft.id}` },
        { text: "Discard", callback_data: `discard:${draft.id}` },
      ]],
    },
  });
}

export async function editPreview(env, callbackMessage, text, buttons = []) {
  return telegramApi(env, "editMessageText", {
    chat_id: callbackMessage.chat.id,
    message_id: callbackMessage.message_id,
    text,
    reply_markup: { inline_keyboard: buttons },
  });
}

export async function answerCallback(env, callbackId, text) {
  return telegramApi(env, "answerCallbackQuery", {
    callback_query_id: callbackId,
    text,
  });
}

export async function sendText(env, chatId, text, replyTo = null) {
  const payload = { chat_id: chatId, text };
  if (replyTo) payload.reply_parameters = { message_id: replyTo };
  return telegramApi(env, "sendMessage", payload);
}

export async function downloadTelegramPhoto(env, media) {
  const file = await telegramApi(env, "getFile", { file_id: media.fileId });
  if (!file.file_path) throw new Error("Telegram did not return a photo path");

  const response = await fetch(`${API_ROOT}/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`);
  if (!response.ok) throw new Error(`Telegram photo download failed: ${response.status}`);

  const bytes = await response.arrayBuffer();
  const limit = Number(env.MAX_PHOTO_BYTES || 10 * 1024 * 1024);
  if (bytes.byteLength > limit) throw new Error(`Photo exceeds the ${Math.round(limit / 1024 / 1024)} MB limit`);

  const pathExtension = file.file_path.split(".").at(-1)?.toLowerCase();
  const extension = ["jpg", "jpeg", "png", "webp"].includes(pathExtension) ? pathExtension : "jpg";
  return { bytes, extension };
}
