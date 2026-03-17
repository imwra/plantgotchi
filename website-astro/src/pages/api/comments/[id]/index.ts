import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { updateComment, deleteComment } from "../../../../lib/db/project-queries";

export const PUT: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.body) {
    return new Response(JSON.stringify({ error: "body is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  await updateComment(params.id!, body.body);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await deleteComment(params.id!);
  return new Response(null, { status: 204 });
};
