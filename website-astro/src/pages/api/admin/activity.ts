import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { getRecentActivity } from "../../../lib/db/admin-queries";

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const activity = await getRecentActivity(limit);
  return new Response(JSON.stringify(activity), {
    headers: { "Content-Type": "application/json" },
  });
};
