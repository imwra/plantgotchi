import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { searchUsers } from "../../../lib/db/chat-queries";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";

  if (q.length < 2) {
    return new Response(JSON.stringify({ error: "Query must be at least 2 characters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const users = await searchUsers(q, session.user.id);

  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
};
