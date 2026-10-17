
import "./src/config.js";
import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();

  console.log("Connected to Tiger Data!");

  const schema = await fs.readFile(
    new URL("./src/db/schema.sql", import.meta.url),
    "utf8"
  );

  await client.query(schema);

  console.log("PostgreSQL tables created successfully!");

  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log("Tables:", result.rows.map(row => row.table_name));
} catch (error) {
  console.error("Database setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
