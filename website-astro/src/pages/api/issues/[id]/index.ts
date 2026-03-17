import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { getIssue, updateIssue, deleteIssue } from "../../../../lib/db/project-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const issue = await getIssue(params.id!);
  if (!issue) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify(issue), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  await updateIssue(params.id!, {
    title: body.title,
    description: body.description,
    status: body.status,
    parentIssueId: body.parentIssueId,
  });
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await deleteIssue(params.id!);
  return new Response(null, { status: 204 });
};
