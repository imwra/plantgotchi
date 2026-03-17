import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { addReaction } from "../../../lib/db/chat-queries";

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { messageId, emoji } = body;

  if (!messageId || !emoji) {
    return new Response(JSON.stringify({ error: "messageId and emoji are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id = crypto.randomUUID();
  await addReaction(id, messageId, session.user.id, emoji);

  return new Response(JSON.stringify({ id, message_id: messageId, user_id: session.user.id, emoji }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
