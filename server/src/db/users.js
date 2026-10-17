// Users table. Rows are created automatically the first time someone logs in.
import { getDb } from './db.js';

/**
 * Create the user if new, otherwise refresh username/email and last_login.
 * @param {{ id: string, username?: string|null, email?: string|null }} user
 */
export function upsertUser({ id, username = null, email = null }, db = getDb()) {
  db.prepare(
    `INSERT INTO users (id, username, email) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       username   = COALESCE(excluded.username, users.username),
       email      = COALESCE(excluded.email, users.email),
       last_login = datetime('now')`
  ).run(id, username, email);
  return getUser(id, db);
}

export function getUser(id, db = getDb()) {
  return db.prepare('SELECT id, username, email, created_at, last_login FROM users WHERE id = ?').get(id) ?? null;
}
