import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import { base64ToText } from "../src/github.js";

async function waitFor(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("Timed out waiting for background Worker task");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test("Telegram message previews and publishes note 1 exactly once", async (context) => {
  const telegramCalls = [];
  const githubWrites = [];
  const githubDeletes = [];
  let githubFile = null;
  const mf = new Miniflare({
    modules: true,
    modulesRules: [{ type: "ESModule", include: ["**/*.js"] }],
    scriptPath: fileURLToPath(new URL("../src/index.js", import.meta.url)),
    compatibilityDate: "2026-08-04",
    bindings: {
      TELEGRAM_BOT_TOKEN: "telegram-test-token",
      TELEGRAM_WEBHOOK_SECRET: "webhook-test-secret",
      TELEGRAM_ALLOWED_USER_ID: "88",
      GITHUB_TOKEN: "github-test-token",
      GITHUB_OWNER: "thoughtwax",
      GITHUB_REPO: "thoughtwax.github.io",
      GITHUB_BRANCH: "master",
      SITE_URL: "https://thoughtwax.com",
      MAX_PHOTO_BYTES: "10485760",
    },
    d1Databases: ["DB"],
    outboundService: async (request) => {
      const url = new URL(request.url);
      if (url.hostname === "api.telegram.org") {
        const method = url.pathname.split("/").at(-1);
        const payload = await request.json();
        telegramCalls.push({ method, payload });
        return Response.json({ ok: true, result: { message_id: 501, chat: { id: 99 } } });
      }
      if (url.hostname === "api.github.com") {
        if (request.method === "GET") {
          return githubFile
            ? Response.json(githubFile)
            : Response.json({ message: "Not Found" }, { status: 404 });
        }
        if (request.method === "DELETE") {
          githubDeletes.push({ url: request.url, payload: await request.json() });
          githubFile = null;
          return Response.json({ commit: { sha: "delete-sha" } });
        }
        const payload = await request.json();
        githubWrites.push({ url: request.url, payload });
        githubFile = { path: "_notes/1.markdown", sha: "note-sha", content: payload.content };
        return Response.json({
          content: githubFile,
          commit: { sha: "commit-sha" },
        }, { status: 201 });
      }
      if (url.hostname === "example.com") {
        return new Response(`
          <meta property="og:title" content="Example story">
          <meta property="og:description" content="An example description">
        `, { headers: { "content-type": "text/html" } });
      }
      throw new Error(`Unexpected outbound request: ${request.url}`);
    },
  });
  context.after(() => mf.dispose());

  const db = await mf.getD1Database("DB");
  const statements = (await readFile(new URL("../schema.sql", import.meta.url), "utf8"))
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  await db.batch(statements.map((statement) => db.prepare(statement)));

  const messageUpdate = {
    update_id: 1,
    message: {
      message_id: 12,
      date: 1_786_000_000,
      chat: { id: 99, type: "private" },
      from: { id: 88 },
      text: "Read https://example.com/story",
    },
  };
  const messageResponse = await mf.dispatchFetch("https://worker.test/telegram", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "webhook-test-secret",
    },
    body: JSON.stringify(messageUpdate),
  });
  assert.equal(messageResponse.status, 200);
  await waitFor(() => telegramCalls.some((call) => call.method === "sendMessage"));

  const duplicateResponse = await mf.dispatchFetch("https://worker.test/telegram", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "webhook-test-secret",
    },
    body: JSON.stringify(messageUpdate),
  });
  assert.equal(duplicateResponse.status, 200);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(telegramCalls.filter((call) => call.method === "sendMessage").length, 1);

  const preview = telegramCalls.find((call) => call.method === "sendMessage");
  assert.ok(preview);
  const publishData = preview.payload.reply_markup.inline_keyboard[0][0].callback_data;
  assert.match(publishData, /^publish:/);

  const callbackUpdate = {
    update_id: 2,
    callback_query: {
      id: "callback-1",
      from: { id: 88 },
      data: publishData,
      message: { message_id: 501, chat: { id: 99, type: "private" } },
    },
  };
  const callbackResponse = await mf.dispatchFetch("https://worker.test/telegram", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "webhook-test-secret",
    },
    body: JSON.stringify(callbackUpdate),
  });
  assert.equal(callbackResponse.status, 200);
  await waitFor(() => githubWrites.length === 1);
  await waitFor(() => telegramCalls.some((call) => call.method === "editMessageText" && call.payload.text.includes("Published note 1")));

  assert.equal(githubWrites.length, 1);
  const note = base64ToText(githubWrites[0].payload.content);
  assert.match(note, /note_id: 1/);
  assert.match(note, /permalink: \/notes\/1\//);
  assert.match(note, /link_title: "Example story"/);

  const stored = await db.prepare("SELECT status, note_id FROM drafts").first();
  assert.deepEqual(stored, { status: "published", note_id: 1 });
  const publishedEdit = telegramCalls.find(
    (call) => call.method === "editMessageText" && call.payload.text.includes("Published note 1"),
  );
  assert.ok(publishedEdit);

  const undoData = publishedEdit.payload.reply_markup.inline_keyboard[0][0].callback_data;
  const undoResponse = await mf.dispatchFetch("https://worker.test/telegram", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "webhook-test-secret",
    },
    body: JSON.stringify({
      update_id: 3,
      callback_query: {
        id: "callback-2",
        from: { id: 88 },
        data: undoData,
        message: { message_id: 501, chat: { id: 99, type: "private" } },
      },
    }),
  });
  assert.equal(undoResponse.status, 200);
  await waitFor(() => githubDeletes.length === 1);
  await waitFor(() => telegramCalls.some((call) => call.method === "editMessageText" && call.payload.text === "Undone note 1"));
  assert.deepEqual(await db.prepare("SELECT status, note_id FROM drafts").first(), { status: "undone", note_id: 1 });
});
