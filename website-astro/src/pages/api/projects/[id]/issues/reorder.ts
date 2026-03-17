import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { reorderProjectIssues } from "../../../../../lib/db/project-queries";

export const PUT: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();

  if (!Array.isArray(body.issueIds) || body.issueIds.length === 0) {
    return new Response(JSON.stringify({ error: "issueIds must be a non-empty array of strings" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.issueIds.every((id: any) => typeof id === "string")) {
    return new Response(JSON.stringify({ error: "issueIds must be an array of strings" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await reorderProjectIssues(params.id!, body.issueIds);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
