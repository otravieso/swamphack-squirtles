
import pg from "pg";

const { Pool } = pg;

// Dedicated PostgreSQL pool for automated tests.
export const testDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c search_path=test",
  max: 1,
});

// Verify that tests are isolated from real game data.
export async function verifyTestDatabase() {
  const result = await testDb.query(`
    SELECT
      current_schema() AS schema,
      current_database() AS database
  `);

  if (result.rows[0].schema !== "test") {
    throw new Error(
      "SAFETY ERROR: Tests are not connected to the test schema!"
    );
  }

  console.log(
    `Connected to test schema in ${result.rows[0].database}`
  );
}

// Close the pool when tests finish.
export async function closeTestDatabase() {
  await testDb.end();
}
