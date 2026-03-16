import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { getAllUsers } from "../../../lib/db/admin-queries";

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const result = await getAllUsers(limit, offset);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};
