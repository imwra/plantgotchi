import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { runMigrations, runLmsMigrations } from "../../../lib/db/schema";

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const tables = await runMigrations();
  const lmsTables = await runLmsMigrations();
  return new Response(JSON.stringify({ success: true, tables: [...tables, ...lmsTables] }), {
    headers: { "Content-Type": "application/json" },
  });
};
