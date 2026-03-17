import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getReactionOwner, removeReaction } from "../../../../lib/db/chat-queries";

export const DELETE: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = params;
  if (!id) return new Response("Not found", { status: 404 });

  const owner = await getReactionOwner(id);
  if (!owner) return new Response("Not found", { status: 404 });

  if (owner !== session.user.id) {
    return new Response(JSON.stringify({ error: "Cannot delete another user's reaction" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  await removeReaction(id, session.user.id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
