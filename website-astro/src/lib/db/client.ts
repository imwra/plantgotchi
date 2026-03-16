import { createClient, type Client } from "@libsql/client";

let db: Client | null = null;

export function getDb(): Client {
  if (db) return db;

  const url = import.meta.env.TURSO_URL;
  const authToken = import.meta.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.warn("TURSO_URL not set, using in-memory SQLite");
    db = createClient({ url: ":memory:" });
  } else {
    db = createClient({ url, authToken });
  }

  return db;
}
