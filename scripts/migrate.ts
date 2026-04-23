import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle(pool);

  console.log("Applying migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
