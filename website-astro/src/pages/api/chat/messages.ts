import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import {
  getConversation,
  getMessages,
  getLatestMessageTimestamp,
  getActiveTypers,
  createMessage,
} from "../../../lib/db/chat-queries";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  const after = url.searchParams.get("after") || undefined;
  const poll = url.searchParams.get("poll") === "true";

  if (!conversationId) {
    return new Response(JSON.stringify({ error: "conversationId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify membership
  const conversation = await getConversation(conversationId, session.user.id);
  if (!conversation) return new Response("Not found", { status: 404 });

  if (poll && after) {
    // Long poll: wait up to 20 seconds for new messages
    const maxWait = 20;
    for (let i = 0; i < maxWait; i++) {
      const latestTs = await getLatestMessageTimestamp(conversationId);
      if (latestTs && latestTs > after) {
        break;
      }
      if (i < maxWait - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  const messages = await getMessages(conversationId, after);
  const typers = await getActiveTypers(conversationId, session.user.id);

  return new Response(JSON.stringify({ messages, typers }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { conversationId, type, content } = body;

  if (!conversationId || !content) {
    return new Response(JSON.stringify({ error: "conversationId and content are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify membership
  const conversation = await getConversation(conversationId, session.user.id);
  if (!conversation) return new Response("Not found", { status: 404 });

  const msgType = type === "image" ? "image" : "text";
  const id = crypto.randomUUID();

  await createMessage(id, conversationId, session.user.id, msgType, content);

  return new Response(
    JSON.stringify({ id, conversation_id: conversationId, sender_id: session.user.id, type: msgType, content, created_at: new Date().toISOString() }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
};
