import "dotenv/config";
import { db } from "./db.js";
import { sql } from "drizzle-orm";

async function run() {
  await db.execute(sql`TRUNCATE TABLE problems CASCADE;`);
  console.log("Truncated problems table successfully");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
