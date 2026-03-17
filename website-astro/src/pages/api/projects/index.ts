import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { listProjects, createProject } from "../../../lib/db/project-queries";
import { ServerAnalytics } from "../../../lib/analytics.server";

export const GET: APIRoute = async ({ request, url }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const limit = Number(url.searchParams.get("limit") || 50);
  const offset = Number(url.searchParams.get("offset") || 0);

  const projects = await listProjects(limit, offset);
  return new Response(JSON.stringify(projects), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.name) {
    return new Response(JSON.stringify({ error: "name is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const id = await createProject(body.name, body.description || "", auth.userId);
  ServerAnalytics.track(auth.userId, 'project_created', { project_id: id });
  return new Response(JSON.stringify({ id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
