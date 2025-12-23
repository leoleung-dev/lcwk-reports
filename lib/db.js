import { Pool } from "pg";

const poolKey = "__lcwkPgPool";

function getPool() {
  if (!globalThis[poolKey]) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set.");
    }
    globalThis[poolKey] = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }

  return globalThis[poolKey];
}

export async function query(text, params) {
  const { rows } = await getPool().query(text, params);
  return rows;
}

export async function getClient() {
  return getPool().connect();
}
