
import { getDb } from "./db.js";

// Create a user when they first log in.
// Update their username and last login on future visits.
export async function upsertUser({ id, username }, db = getDb()) {
  const result = await db.query(
    `
    INSERT INTO users (id, username)
    VALUES ($1, $2)
    ON CONFLICT (id)
    DO UPDATE SET
      username = EXCLUDED.username,
      last_login = NOW()
    RETURNING id, username, created_at, last_login
    `,
    [id, username ?? null]
  );

  return result.rows[0];
}

// Find a user by their Auth0 ID.
export async function getUser(id, db = getDb()) {
  const result = await db.query(
    `
    SELECT id, username, created_at, last_login
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}
