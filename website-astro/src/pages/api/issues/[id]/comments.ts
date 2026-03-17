import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { listComments, createComment } from "../../../../lib/db/project-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const comments = await listComments(params.id!);
  return new Response(JSON.stringify(comments), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.body) {
    return new Response(JSON.stringify({ error: "body is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const id = await createComment(params.id!, auth.userId, body.body);
  return new Response(JSON.stringify({ id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
