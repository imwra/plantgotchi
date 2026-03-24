import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { runMigrations, runLmsMigrations, runLmsMigrationV2 } from "../../../lib/db/schema";

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const tables = await runMigrations();
  const lmsTables = await runLmsMigrations();
  await runLmsMigrationV2();
  return new Response(JSON.stringify({ success: true, tables: [...tables, ...lmsTables] }), {
    headers: { "Content-Type": "application/json" },
  });
};
