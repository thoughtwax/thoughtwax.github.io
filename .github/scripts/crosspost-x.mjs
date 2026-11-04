// Cross-posts newly added notes to X.
//
// Usage: node crosspost-x.mjs <file> [<file> ...]
// Only files with `layout: note` and `crosspost: x` in their front matter are posted.
// Needs X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET in the environment.
// Set DRY_RUN=1 to print what would be posted without calling X.

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createHmac, randomBytes } from 'node:crypto';

const SITE = 'https://thoughtwax.com';
const LIMIT = 280;
const URL_LEN = 23; // X counts every link as 23 characters

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

export function wantsX(front) {
  return front.layout === 'note' && /(^|[\s,\[])x([\s,\]]|$)/i.test(front.crosspost || '');
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

// The whole note if it fits; otherwise a shortened version ending with a link back.
export function composePost(text, url) {
  if (xLength(text) <= LIMIT) return text;
  const room = LIMIT - URL_LEN - 2; // "…" + space
  let cut = '';
  for (const word of text.split(/(\s+)/)) {
    if (xLength(cut + word) > room) break;
    cut += word;
  }
  if (!cut.trim()) cut = [...text].slice(0, room).join(''); // one enormous word
  return `${cut.trimEnd()}… ${url}`;
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

async function postToX(text, creds) {
  const endpoint = 'https://api.x.com/2/tweets';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: oauthHeader('POST', endpoint, creds), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X said ${res.status}: ${JSON.stringify(data)}`);
  return data.data;
}

async function main(files) {
  const dryRun = process.env.DRY_RUN === '1';
  const creds = {
    apiKey: process.env.X_API_KEY,
    apiSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  };
  const notes = [];
  for (const file of files) {
    const note = parseNote(readFileSync(file, 'utf8'));
    if (note && wantsX(note.front)) notes.push({ file, ...note });
  }
  if (!notes.length) { console.log('No notes marked for X.'); return; }
  if (!dryRun && Object.values(creds).some((v) => !v)) {
    throw new Error('A note asked to cross-post to X, but the X_* repository secrets are not set. See .github/workflows/crosspost-x.yml.');
  }

  let failed = false;
  for (const { file, front, body } of notes) {
    const url = permalink(file, front);
    const text = composePost(toPlainText(body), url);
    console.log(`\n${file}\n${url}\n---\n${text}\n---`);
    if (dryRun) continue;
    try {
      if (!(await waitUntilLive(url))) console.warn(`Note isn't live yet at ${url}; posting anyway.`);
      const tweet = await postToX(text, creds);
      console.log(`Posted to X: https://x.com/i/status/${tweet.id}`);
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
