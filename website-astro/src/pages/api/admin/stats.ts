import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { getOverviewStats } from "../../../lib/db/admin-queries";

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const stats = await getOverviewStats();
  return new Response(JSON.stringify(stats), {
    headers: { "Content-Type": "application/json" },
  });
};
