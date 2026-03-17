import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { addAssignee } from "../../../../../lib/db/project-queries";

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.userId) {
    return new Response(JSON.stringify({ error: "userId is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  await addAssignee(params.id!, body.userId);
  return new Response(JSON.stringify({ success: true }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
