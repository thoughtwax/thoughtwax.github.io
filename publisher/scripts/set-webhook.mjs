const required = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "WORKER_URL"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  process.stderr.write(`Missing environment variables: ${missing.join(", ")}\n`);
  process.exit(1);
}

const endpoint = `${process.env.WORKER_URL.replace(/\/$/, "")}/telegram`;
const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url: endpoint,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  }),
});
const result = await response.json();
if (!response.ok || !result.ok) {
  process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(1);
}
process.stdout.write(`Telegram webhook set to ${endpoint}\n`);
