import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { togglePin } from "../../../../lib/db/project-queries";

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await togglePin(params.id!);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
