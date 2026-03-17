import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { getProjectViews, createProjectView } from "../../../../../lib/db/view-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const views = await getProjectViews(params.id!, auth.userId);
  return new Response(JSON.stringify(views), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();

  if (!body.name || !body.viewType) {
    return new Response(JSON.stringify({ error: "name and viewType are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.viewType !== "table" && body.viewType !== "board") {
    return new Response(JSON.stringify({ error: "viewType must be 'table' or 'board'" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const view = await createProjectView({
    projectId: params.id!,
    userId: auth.userId,
    name: body.name,
    viewType: body.viewType,
    config: body.config ? JSON.stringify(body.config) : "{}",
    isDefault: body.isDefault ? 1 : 0,
  });

  return new Response(JSON.stringify(view), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
