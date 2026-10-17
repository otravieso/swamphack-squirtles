// Users table. Rows are created automatically the first time someone logs in.
import { getDb } from './db.js';

/**
 * Create the user if new, otherwise refresh username and last_login.
 * @param {{ id: string, username?: string|null }} user
 */
export function upsertUser({ id, username = null }, db = getDb()) {
  db.prepare(
    `INSERT INTO users (id, username) VALUES (?, ?)
     ON CONFLICT(id) DO UPDATE SET
       username   = COALESCE(excluded.username, users.username),
       last_login = datetime('now')`
  ).run(id, username);
  return getUser(id, db);
}

export function getUser(id, db = getDb()) {
  return db.prepare('SELECT id, username, created_at, last_login FROM users WHERE id = ?').get(id) ?? null;
}
