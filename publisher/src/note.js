function yaml(value) {
  return JSON.stringify(String(value ?? ""));
}

function cleanBody(value = "") {
  return value.replace(/\r\n/g, "\n").trim();
}

export function buildNote({ id, draftId, payload, mediaUrl = null, link = null }) {
  const date = new Date(payload.sentAt * 1000).toISOString();
  const body = cleanBody(payload.text);
  const summary = body.slice(0, 300) || (mediaUrl ? "Photo note." : `Note ${id}.`);
  const lines = [
    "---",
    "layout: note",
    `title: ${yaml(`Note ${id}`)}`,
    `note_id: ${id}`,
    `date: ${yaml(date)}`,
    `summary: ${yaml(summary)}`,
    `permalink: /notes/${id}/`,
    "author: emmetc",
    "source: telegram",
    `telegram_draft_id: ${yaml(draftId)}`,
    `telegram_message_id: ${payload.messageId}`,
  ];

  if (mediaUrl) {
    lines.push(`media_url: ${yaml(mediaUrl)}`);
    lines.push(`media_alt: ${yaml(body)}`);
  }

  if (link) {
    lines.push(`link_url: ${yaml(link.url)}`);
    lines.push(`link_host: ${yaml(link.host)}`);
    lines.push(`link_title: ${yaml(link.title || link.url)}`);
    if (link.description) lines.push(`link_description: ${yaml(link.description)}`);
    if (link.image) lines.push(`link_image: ${yaml(link.image)}`);
  }

  lines.push("---", "", body);
  return `${lines.join("\n")}\n`;
}
