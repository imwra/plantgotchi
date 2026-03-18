import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { listProjectIssues, addIssueToProject, createIssueInProject } from "../../../../../lib/db/project-queries";
import { ServerAnalytics } from "../../../../../lib/analytics.server";

export const GET: APIRoute = async ({ request, params, url }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const groupBy = url.searchParams.get("groupBy") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const limit = Number(url.searchParams.get("limit") || 200);
  const offset = Number(url.searchParams.get("offset") || 0);

  const result = await listProjectIssues(params.id!, { groupBy, status, search, limit, offset });
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();

  // If issueId is provided, add existing issue to project
  if (body.issueId) {
    await addIssueToProject(params.id!, body.issueId, body.position || 0);
    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Otherwise create new issue and add to project
  if (!body.title) {
    return new Response(JSON.stringify({ error: "title is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const issueId = await createIssueInProject(params.id!, body.title, body.status || "todo", body.parentIssueId || null, auth.userId);
  ServerAnalytics.track(auth.userId, 'issue_created', { issue_id: issueId, project_id: params.id });
  return new Response(JSON.stringify({ id: issueId }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
