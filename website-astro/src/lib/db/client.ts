import { createClient, type Client } from "@libsql/client/http";

let db: Client | null = null;

export function getDb(): Client {
  if (db) return db;

  const url = import.meta.env.TURSO_URL;
  const authToken = import.meta.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_URL environment variable is not set");
  }

  db = createClient({ url, authToken });

  return db;
}
