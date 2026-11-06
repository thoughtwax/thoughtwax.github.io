// Federates newly added notes and posts to X (@thoughtwax_bot).
//
// Usage: node crosspost-x.mjs <file> [<file> ...]
// Notes (`layout: note`) go out as their full text, with no link back. X
// accepts long posts from Premium accounts; if it refuses, the note goes out
// as a thread of 280-character posts instead. Posts go out as "Title <link>".
// Skipped: `published: false`, `crosspost: no` in front matter, and anything
// dated more than MAX_AGE_DAYS ago (so backfilled or imported posts stay quiet).
// Needs X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET in the environment.
// Set DRY_RUN=1 to print what would be posted without calling X.

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createHmac, randomBytes } from 'node:crypto';

const SITE = 'https://thoughtwax.com';
const LIMIT = 280;
const URL_LEN = 23; // X counts every link as 23 characters
const MAX_AGE_DAYS = 3;

export function parseNote(source) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const front = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) front[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { front, body: m[2].trim() };
}

export function kindOf(front) {
  if (/^(false|no)$/i.test(front.published || '')) return null;
  if (/^(no|none|false|off)$/i.test(front.crosspost || '')) return null;
  if (front.layout === 'note') return 'note';
  if (front.title) return 'post';
  return null;
}

// Date from front matter if present, otherwise from the filename.
export function postDate(file, front) {
  if (front.date) {
    const d = new Date(front.date.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(?::\d{2})?) ?([+-]\d{2})(\d{2})$/, '$1T$2$3:$4'));
    if (!isNaN(d)) return d;
  }
  const fm = basename(file).match(/^(\d{4}-\d{2}-\d{2})-/);
  return fm ? new Date(fm[1] + 'T12:00:00Z') : null;
}

export function isRecent(file, front, now = Date.now()) {
  const d = postDate(file, front);
  return !!d && now - d.getTime() <= MAX_AGE_DAYS * 86_400_000;
}

// Jekyll permalink is /:year/:month/:title/, with the date taken from front
// matter (built in UTC on GitHub Pages) and the title from the filename.
export function permalink(file, front) {
  const name = basename(file).replace(/\.(markdown|md)$/, '');
  const fm = name.match(/^(\d{4})-(\d{2})-\d{2}-(.+)$/);
  if (!fm) throw new Error(`Unexpected post filename: ${file}`);
  let year = fm[1], month = fm[2];
  if (front.date) {
    const d = new Date(front.date.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(?::\d{2})?) ?([+-]\d{2})(\d{2})$/, '$1T$2$3:$4'));
    if (!isNaN(d)) { year = String(d.getUTCFullYear()); month = String(d.getUTCMonth() + 1).padStart(2, '0'); }
  }
  return `${SITE}/${year}/${month}/${fm[3]}/`;
}

export function toPlainText(md) {
  return md
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, text, href) => (/^https?:\/\//.test(text) ? text : `${text} ${href}`))
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/(^|[^\\])\*([^*\n]+?)\*/g, '$1$2')
    .replace(/^- /gm, '• ')
    .replace(/\\(.)/g, '$1')
    .replace(/ {2}\n/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function xLength(text) {
  return [...text.replace(/https?:\/\/\S+/g, 'x'.repeat(URL_LEN))].length;
}

// Splits text into posts of at most 280 characters, breaking between words.
export function splitThread(text) {
  const parts = [];
  let cur = '';
  for (const word of text.split(/(\s+)/)) {
    if (cur && xLength(cur + word) > LIMIT) { parts.push(cur.trim()); cur = word.trimStart(); }
    else cur += word;
    while (xLength(cur) > LIMIT) { const c = [...cur]; parts.push(c.slice(0, LIMIT).join('')); cur = c.slice(LIMIT).join(''); }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

// A full post goes out as its title and a link.
export function composeLink(title, url) {
  const room = LIMIT - URL_LEN - 1;
  let t = title.trim();
  if ([...t].length > room) t = [...t].slice(0, room - 1).join('').trimEnd() + '…';
  return `${t} ${url}`;
}

// ---- OAuth 1.0a (user context) -------------------------------------------
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

export function oauthHeader(method, url, creds, nonce = randomBytes(16).toString('hex'), timestamp = Math.floor(Date.now() / 1000).toString()) {
  const params = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: creds.accessToken,
    oauth_version: '1.0',
  };
  const u = new URL(url);
  const all = { ...params };
  u.searchParams.forEach((v, k) => { all[k] = v; });
  const paramStr = Object.keys(all).sort().map((k) => `${enc(k)}=${enc(all[k])}`).join('&');
  const base = [method.toUpperCase(), enc(u.origin + u.pathname), enc(paramStr)].join('&');
  const key = `${enc(creds.apiSecret)}&${enc(creds.accessSecret)}`;
  params.oauth_signature = createHmac('sha1', key).update(base).digest('base64');
  return 'OAuth ' + Object.keys(params).sort().map((k) => `${enc(k)}="${enc(params[k])}"`).join(', ');
}

async function waitUntilLive(url, minutes = 10) {
  const until = Date.now() + minutes * 60_000;
  while (Date.now() < until) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 15_000));
  }
  return false;
}

async function postToX(text, creds, replyTo) {
  const endpoint = 'https://api.x.com/2/tweets';
  const body = { text };
  if (replyTo) body.reply = { in_reply_to_tweet_id: replyTo };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: oauthHeader('POST', endpoint, creds), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(`X said ${res.status}: ${JSON.stringify(data)}`); e.status = res.status; throw e; }
  return data.data;
}

async function deleteFromX(id, creds) {
  const endpoint = `https://api.x.com/2/tweets/${id}`;
  const res = await fetch(endpoint, { method: 'DELETE', headers: { Authorization: oauthHeader('DELETE', endpoint, creds) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X said ${res.status} deleting ${id}: ${JSON.stringify(data)}`);
  console.log(`Deleted from X: ${id}`);
}

// Full note in one post; if X won't take a long post, as a thread.
async function postNote(text, creds) {
  try {
    return [await postToX(text, creds)];
  } catch (e) {
    if (xLength(text) <= LIMIT || ![400, 403].includes(e.status)) throw e;
    console.log(`X refused the long post (${e.message}); posting it as a thread.`);
  }
  const tweets = [];
  for (const part of splitThread(text)) tweets.push(await postToX(part, creds, tweets.at(-1)?.id));
  return tweets;
}

async function main(files) {
  const dryRun = process.env.DRY_RUN === '1';
  const creds = {
    apiKey: process.env.X_API_KEY,
    apiSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  };
  const items = [];
  for (const file of files) {
    const entry = parseNote(readFileSync(file, 'utf8'));
    const kind = entry && kindOf(entry.front);
    if (!kind) { console.log(`Skipping ${file} (draft, opted out, or not a note/post).`); continue; }
    if (!process.env.FORCE && !isRecent(file, entry.front)) { console.log(`Skipping ${file} (dated more than ${MAX_AGE_DAYS} days ago).`); continue; }
    items.push({ file, kind, ...entry });
  }
  if (!dryRun && Object.values(creds).some((v) => !v)) {
    console.log('X_* repository secrets are not set yet, so nothing was posted. See .github/workflows/crosspost-x.yml.');
    return;
  }
  for (const id of (process.env.DELETE_IDS || '').split(/[\s,]+/).filter(Boolean)) {
    if (dryRun) console.log(`Would delete ${id}`); else await deleteFromX(id, creds);
  }
  if (!items.length) { console.log('Nothing new to post to X.'); return; }

  let failed = false;
  for (const { file, kind, front, body } of items) {
    const url = permalink(file, front);
    const text = kind === 'note' ? toPlainText(body) : composeLink(toPlainText(front.title), url);
    console.log(`\n${file}\n${url}\n---\n${text}\n---`);
    if (dryRun) { if (kind === 'note' && xLength(text) > LIMIT) console.log(`(as a thread if needed: ${splitThread(text).length} posts)`); continue; }
    try {
      if (!(await waitUntilLive(url))) console.warn(`Not live yet at ${url}; posting anyway.`);
      const tweets = kind === 'note' ? await postNote(text, creds) : [await postToX(text, creds)];
      for (const t of tweets) console.log(`Posted to X: https://x.com/i/status/${t.id}`);
    } catch (e) {
      failed = true;
      console.error(`Could not post ${file}: ${e.message}`);
    }
  }
  if (failed) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1); });
}
