import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { listIssues, createIssue } from "../../../lib/db/project-queries";

export const GET: APIRoute = async ({ request, url }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const status = url.searchParams.get("status") || undefined;
  const assignee = url.searchParams.get("assignee") || undefined;
  const parentId = url.searchParams.get("parentId") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const limit = Number(url.searchParams.get("limit") || 50);
  const offset = Number(url.searchParams.get("offset") || 0);

  const issues = await listIssues({ status, assignee, parentId, search, limit, offset });
  return new Response(JSON.stringify(issues), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.title) {
    return new Response(JSON.stringify({ error: "title is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const id = await createIssue(body.title, body.description || "", body.status || "todo", body.parentIssueId || null, auth.userId);
  return new Response(JSON.stringify({ id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
