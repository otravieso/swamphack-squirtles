
import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

// Shared connection pool for Tiger Data PostgreSQL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get the database connection pool.
export function getDb() {
  return pool;
}

// Check that Tiger Data is reachable.
export async function testConnection() {
  const result = await pool.query("SELECT NOW() AS current_time");
  return result.rows[0];
}

// Close database connections when needed.
export async function closeDatabase() {
  await pool.end();
}
