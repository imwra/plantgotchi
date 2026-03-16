import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { getUserDetail } from "../../../../lib/db/admin-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const userId = params.id;
  if (!userId) return new Response("Missing user ID", { status: 400 });

  const detail = await getUserDetail(userId);
  if (!detail) return new Response("User not found", { status: 404 });

  return new Response(JSON.stringify(detail), {
    headers: { "Content-Type": "application/json" },
  });
};
