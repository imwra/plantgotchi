import { createClient, type Client } from '@libsql/client/web';

let _client: Client | null = null;

export function getDb(): Client {
  if (_client) return _client;

  const url = import.meta.env.PUBLIC_TURSO_URL;
  const authToken = import.meta.env.PUBLIC_TURSO_AUTH_TOKEN;

  if (!url) {
    // Fallback: use in-memory SQLite for development/demo
    _client = createClient({ url: ':memory:' });
    return _client;
  }

  _client = createClient({ url, authToken });
  return _client;
}
