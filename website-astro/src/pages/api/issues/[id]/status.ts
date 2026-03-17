import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { updateIssueStatus } from "../../../../lib/db/project-queries";

const VALID_STATUSES = ["todo", "in_progress", "done", "blocked", "archived"];

export const PUT: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return new Response(
      JSON.stringify({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  await updateIssueStatus(params.id!, body.status);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
