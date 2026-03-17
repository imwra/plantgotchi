import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getConversation, getConversationMembers } from "../../../../lib/db/chat-queries";

export const GET: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = params;
  if (!id) return new Response("Not found", { status: 404 });

  const conversation = await getConversation(id, session.user.id);
  if (!conversation) return new Response("Not found", { status: 404 });

  const members = await getConversationMembers(id);

  return new Response(JSON.stringify({ conversation, members }), {
    headers: { "Content-Type": "application/json" },
  });
};
