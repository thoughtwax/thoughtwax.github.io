export async function createDraft(env, payload) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO drafts (
      id, telegram_chat_id, telegram_user_id, telegram_message_id,
      payload, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)`,
  )
    .bind(
      id,
      String(payload.chatId),
      String(payload.userId),
      payload.messageId,
      JSON.stringify(payload),
      now,
      now,
    )
    .run();

  if (result.meta?.changes === 0) {
    const existing = await env.DB.prepare(
      "SELECT * FROM drafts WHERE telegram_chat_id = ? AND telegram_message_id = ?",
    )
      .bind(String(payload.chatId), payload.messageId)
      .first();
    return { draft: existing, created: false };
  }

  return { draft: await getDraft(env, id), created: true };
}

export async function getDraft(env, id) {
  return env.DB.prepare("SELECT * FROM drafts WHERE id = ?").bind(id).first();
}

export async function claimDraftForPublishing(env, id) {
  const current = await getDraft(env, id);
  if (!current) return { claimed: false, reason: "missing" };
  if (current.status === "published") return { claimed: false, reason: "published", draft: current };
  if (current.status === "discarded" || current.status === "undone") {
    return { claimed: false, reason: current.status, draft: current };
  }
  if (current.status === "publishing") return { claimed: false, reason: "publishing", draft: current };

  const now = new Date().toISOString();
  const claim = await env.DB.prepare(
    "UPDATE drafts SET status = 'publishing', error = NULL, updated_at = ? WHERE id = ? AND status IN ('draft', 'failed')",
  )
    .bind(now, id)
    .run();

  if (claim.meta?.changes !== 1) return { claimed: false, reason: "busy", draft: await getDraft(env, id) };

  let draft = await getDraft(env, id);
  if (!draft.note_id) {
    const sequence = await env.DB.prepare(
      "UPDATE note_sequence SET last_id = last_id + 1 WHERE singleton = 1 RETURNING last_id",
    ).first();

    if (!sequence?.last_id) throw new Error("Could not allocate the next note ID");

    await env.DB.prepare("UPDATE drafts SET note_id = ?, updated_at = ? WHERE id = ?")
      .bind(sequence.last_id, now, id)
      .run();
    draft = await getDraft(env, id);
  }

  return { claimed: true, draft };
}

export async function markPublished(env, id, { notePath, mediaPath = null }) {
  await env.DB.prepare(
    "UPDATE drafts SET status = 'published', note_path = ?, media_path = ?, error = NULL, updated_at = ? WHERE id = ?",
  )
    .bind(notePath, mediaPath, new Date().toISOString(), id)
    .run();
  return getDraft(env, id);
}

export async function markFailed(env, id, error) {
  await env.DB.prepare(
    "UPDATE drafts SET status = 'failed', error = ?, updated_at = ? WHERE id = ?",
  )
    .bind(String(error).slice(0, 1000), new Date().toISOString(), id)
    .run();
}

export async function discardDraft(env, id) {
  const result = await env.DB.prepare(
    "UPDATE drafts SET status = 'discarded', updated_at = ? WHERE id = ? AND status IN ('draft', 'failed')",
  )
    .bind(new Date().toISOString(), id)
    .run();
  return result.meta?.changes === 1;
}

export async function markUndone(env, id) {
  await env.DB.prepare(
    "UPDATE drafts SET status = 'undone', updated_at = ? WHERE id = ? AND status = 'published'",
  )
    .bind(new Date().toISOString(), id)
    .run();
}
