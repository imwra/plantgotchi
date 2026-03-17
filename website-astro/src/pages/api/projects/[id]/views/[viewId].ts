import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { updateProjectView, deleteProjectView } from "../../../../../lib/db/view-queries";

export const PUT: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const updates: { name?: string; config?: string; isDefault?: number } = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.config !== undefined) updates.config = typeof body.config === "string" ? body.config : JSON.stringify(body.config);
  if (body.isDefault !== undefined) updates.isDefault = body.isDefault ? 1 : 0;

  await updateProjectView(params.viewId!, auth.userId, updates);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await deleteProjectView(params.viewId!, auth.userId);
  return new Response(null, { status: 204 });
};
