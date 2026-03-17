import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import {
  getConversation,
  getMemberRole,
  addMembersToConversation,
} from "../../../../lib/db/chat-queries";

export const POST: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = params;
  if (!id) return new Response("Not found", { status: 404 });

  const conversation = await getConversation(id, session.user.id);
  if (!conversation) return new Response("Not found", { status: 404 });

  if (conversation.type !== "group") {
    return new Response(JSON.stringify({ error: "Can only invite members to group conversations" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const role = await getMemberRole(id, session.user.id);
  if (role !== "owner" && role !== "admin") {
    return new Response(JSON.stringify({ error: "Only owners and admins can invite members" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { userIds } = body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return new Response(JSON.stringify({ error: "userIds must be a non-empty array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await addMembersToConversation(id, userIds);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
