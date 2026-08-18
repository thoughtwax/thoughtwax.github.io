CREATE TABLE IF NOT EXISTS note_sequence (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  last_id INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO note_sequence (singleton, last_id) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  telegram_chat_id TEXT NOT NULL,
  telegram_user_id TEXT NOT NULL,
  telegram_message_id INTEGER NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  note_id INTEGER,
  note_path TEXT,
  media_path TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (telegram_chat_id, telegram_message_id)
);

CREATE INDEX IF NOT EXISTS drafts_status_idx ON drafts (status);
