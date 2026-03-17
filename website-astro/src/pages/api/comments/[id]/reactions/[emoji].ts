import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/admin-guard";
import { removeReaction } from "../../../../../lib/db/project-queries";

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await removeReaction(params.id!, auth.userId, decodeURIComponent(params.emoji!));
  return new Response(null, { status: 204 });
};
