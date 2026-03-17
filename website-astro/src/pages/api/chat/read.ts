import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { getConversation, updateReadReceipt } from "../../../lib/db/chat-queries";

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { conversationId } = body;

  if (!conversationId) {
    return new Response(JSON.stringify({ error: "conversationId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify membership
  const conversation = await getConversation(conversationId, session.user.id);
  if (!conversation) return new Response("Not found", { status: 404 });

  await updateReadReceipt(conversationId, session.user.id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
