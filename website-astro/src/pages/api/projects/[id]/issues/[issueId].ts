import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { removeIssueFromProject } from "../../../../../lib/db/project-queries";

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await removeIssueFromProject(params.id!, params.issueId!);
  return new Response(null, { status: 204 });
};
