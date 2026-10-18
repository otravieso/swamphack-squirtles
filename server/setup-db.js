
import "./src/config.js";
import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;

// `node server/setup-db.js --test` sets up the separate "test" schema used by
// `npm test` instead of the real tables.
const useTestSchema = process.argv.includes("--test");
const schemaName = useTestSchema ? "test" : "public";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();

  console.log("Connected to Tiger Data!");

  if (useTestSchema) {
    await client.query("CREATE SCHEMA IF NOT EXISTS test");
    await client.query("SET search_path TO test");
  }

  const schema = await fs.readFile(
    new URL("./src/db/schema.sql", import.meta.url),
    "utf8"
  );

  await client.query(schema);

  console.log(`PostgreSQL tables are up to date (schema: ${schemaName})!`);

  const result = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = $1
     ORDER BY table_name`,
    [schemaName]
  );

  console.log("Tables:", result.rows.map(row => row.table_name));
} catch (error) {
  console.error("Database setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
