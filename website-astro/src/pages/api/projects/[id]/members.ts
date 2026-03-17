import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { listProjectMembers, addProjectMember } from "../../../../lib/db/project-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const members = await listProjectMembers(params.id!);
  return new Response(JSON.stringify(members), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.userId) {
    return new Response(JSON.stringify({ error: "userId is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  await addProjectMember(params.id!, body.userId, body.role || "member");
  return new Response(JSON.stringify({ success: true }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
