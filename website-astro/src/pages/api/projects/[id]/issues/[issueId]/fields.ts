import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../../lib/admin-guard";
import { setIssueFieldValues } from "../../../../../../lib/db/project-queries";

export const PUT: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  await setIssueFieldValues(params.id!, params.issueId!, body);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
