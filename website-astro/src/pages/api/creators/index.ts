import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { createCreatorProfile, getCreatorByUserId } from "../../../lib/db/lms-queries";

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const existing = await getCreatorByUserId(session.user.id);
  if (existing) {
    return new Response(JSON.stringify({ error: "Already a creator" }), { status: 409, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  const { display_name, bio } = body;
  if (!display_name) {
    return new Response(JSON.stringify({ error: "display_name is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const profile = await createCreatorProfile(session.user.id, display_name, bio);
  return new Response(JSON.stringify(profile), { status: 201, headers: { "Content-Type": "application/json" } });
};
