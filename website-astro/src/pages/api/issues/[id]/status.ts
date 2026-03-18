import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { updateIssueStatus, getIssue } from "../../../../lib/db/project-queries";
import { ServerAnalytics } from "../../../../lib/analytics.server";

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

  const existingIssue = await getIssue(params.id!);
  const oldStatus = existingIssue?.status ?? null;
  await updateIssueStatus(params.id!, body.status);
  ServerAnalytics.track(auth.userId, 'issue_status_changed', { issue_id: params.id, old_status: oldStatus, new_status: body.status });
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
