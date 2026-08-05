# Thoughtwax notes publisher

This Cloudflare Worker turns a private Telegram conversation into notes on
Thoughtwax. It presents every incoming text, link, or single photo as a draft,
then publishes only after the allowed user presses **Publish**.

Published notes are committed to `_notes/<id>.markdown` through GitHub's API.
The D1 database stores draft state, reserves monotonically increasing integer
IDs, prevents duplicate webhook deliveries, and powers **Discard**, **Retry**,
and **Undo**.

## Telegram interaction

1. Send text, a link, or a photo with an optional caption to the bot.
2. Review the bot's preview.
3. Press **Publish** or **Discard**.
4. After publishing, use the returned permalink or press **Undo**.

Only a private message whose sender matches `TELEGRAM_ALLOWED_USER_ID` is
accepted. Video, audio, voice messages, documents, and photo albums are deferred
until after the first end-to-end version.

## One-time setup

Requirements: a Telegram bot token, a Cloudflare account, and a GitHub
fine-grained personal access token limited to this repository with **Contents:
Read and write** permission.

1. In Telegram, message `@BotFather`, create a bot, and save its token.
2. Send any message to the new bot, then open
   `https://api.telegram.org/bot<token>/getUpdates`. The value at
   `result[0].message.from.id` is your allowed Telegram user ID.
3. Install and authenticate Wrangler:

   ```sh
   npm install
   npx wrangler login
   ```

4. Create the database:

   ```sh
   npx wrangler d1 create thoughtwax-notes-publisher
   ```

5. Copy the returned database ID into `wrangler.toml`, then initialize it:

   ```sh
   npm run db:remote
   ```

6. Add the four secrets when prompted:

   ```sh
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
   npx wrangler secret put TELEGRAM_ALLOWED_USER_ID
   npx wrangler secret put GITHUB_TOKEN
   ```

   `TELEGRAM_WEBHOOK_SECRET` should be a fresh random string, for example one
   produced by `openssl rand -hex 32`.

7. Deploy the Worker:

   ```sh
   npm run deploy
   ```

8. Register its URL with Telegram:

   ```sh
   TELEGRAM_BOT_TOKEN='…' \
   TELEGRAM_WEBHOOK_SECRET='…' \
   WORKER_URL='https://thoughtwax-notes-publisher.<account>.workers.dev' \
   npm run webhook:set
   ```

The webhook endpoint is `/telegram`; `/` is a public health check containing no
credentials or user data.

## Local development

Copy `.dev.vars.example` to `.dev.vars`, fill in local-only secrets, initialize
the local D1 database with `npm run db:local`, and run `npm run dev`. Telegram
requires a public HTTPS webhook, so live Telegram testing should use the
deployed Worker rather than exposing a development machine.

Run the unit tests with:

```sh
npm test
```
