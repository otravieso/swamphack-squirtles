// Database connection + schema.
// Uses Node's built-in SQLite (node:sqlite, Node 22.13+), so there's nothing to install.
// The database is a single file: server/data/squirtles.db (gitignored).
//
// Only this folder (server/src/db/) touches SQL. Routes call the functions in
// users.js and questionSets.js, so swapping to a hosted database later
// (e.g. Vultr Managed PostgreSQL) only changes this folder.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

const SCHEMA = `
  -- One row per Auth0 account. Passwords are NOT stored here; Auth0 keeps them.
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,               -- Auth0 user id, e.g. "auth0|65f…"
    username    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_login  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- One row per upload of notes (a "study pack").
  CREATE TABLE IF NOT EXISTS question_sets (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    source_files TEXT NOT NULL DEFAULT '[]',     -- JSON array of uploaded file names
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- The questions Gemini generated for a set.
  CREATE TABLE IF NOT EXISTS questions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id        INTEGER NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    position      INTEGER NOT NULL,              -- order within the set
    question      TEXT NOT NULL,
    options       TEXT NOT NULL,                 -- JSON array of answer choices
    answer_index  INTEGER NOT NULL,
    explanation   TEXT,
    topic         TEXT,
    difficulty    INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    source_quote  TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sets_user      ON question_sets(user_id);
  CREATE INDEX IF NOT EXISTS idx_questions_set  ON questions(set_id, position);
`;

export function openDatabase(file = config.databasePath) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

// Small upgrades for database files created by older versions of the code.
export function migrate(db) {
  const userColumns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (userColumns.includes('email')) db.exec('ALTER TABLE users DROP COLUMN email');
}

/** Run `fn` inside a transaction: all of it is saved, or none of it. */
export function transaction(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Shared connection used by the server.
let shared = null;
export function getDb() {
  shared ??= openDatabase();
  return shared;
}
