import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { listProjectFields, createProjectField } from "../../../../../lib/db/project-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const fields = await listProjectFields(params.id!);
  return new Response(JSON.stringify(fields), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.name || !body.field_type) {
    return new Response(JSON.stringify({ error: "name and field_type are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const id = await createProjectField(params.id!, body.name, body.field_type, JSON.stringify(body.options || []), body.position || 0);
  return new Response(JSON.stringify({ id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
