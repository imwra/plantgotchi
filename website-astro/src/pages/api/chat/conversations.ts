import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import {
  getUserConversations,
  findExistingDM,
  createConversation,
} from "../../../lib/db/chat-queries";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const conversations = await getUserConversations(session.user.id);

  return new Response(JSON.stringify(conversations), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { type, userId, name, memberIds } = body;

  if (type === "dm") {
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required for DM" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check for existing DM
    const existing = await findExistingDM(session.user.id, userId);
    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = crypto.randomUUID();
    await createConversation(id, "dm", session.user.id, null, [session.user.id, userId]);

    return new Response(JSON.stringify({ id, type: "dm", name: null, created_by: session.user.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (type === "group") {
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "name is required for group conversations" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return new Response(JSON.stringify({ error: "memberIds must be a non-empty array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = crypto.randomUUID();
    const allMembers = [session.user.id, ...memberIds.filter((mid: string) => mid !== session.user.id)];
    await createConversation(id, "group", session.user.id, name.trim(), allMembers);

    return new Response(JSON.stringify({ id, type: "group", name: name.trim(), created_by: session.user.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "type must be 'dm' or 'group'" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
};
