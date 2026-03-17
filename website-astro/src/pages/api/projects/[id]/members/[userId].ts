import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { removeProjectMember } from "../../../../../lib/db/project-queries";

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await removeProjectMember(params.id!, params.userId!);
  return new Response(null, { status: 204 });
};
