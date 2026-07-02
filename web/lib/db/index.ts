import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://buildsafe:buildsafe@127.0.0.1:5432/buildsafe",
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export * as tables from "./schema";
