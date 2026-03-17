import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { updateProjectField, deleteProjectField } from "../../../../../lib/db/project-queries";

export const PUT: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  await updateProjectField(params.fieldId!, body.name, JSON.stringify(body.options || []), body.position ?? 0);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await deleteProjectField(params.fieldId!);
  return new Response(null, { status: 204 });
};
