import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { getProject, updateProject, deleteProject } from "../../../../lib/db/project-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const project = await getProject(params.id!);
  if (!project) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify(project), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  await updateProject(params.id!, body.name, body.description ?? "");
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await deleteProject(params.id!);
  return new Response(null, { status: 204 });
};
