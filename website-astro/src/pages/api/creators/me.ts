import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { getCreatorByUserId, updateCreatorProfile } from "../../../lib/db/lms-queries";
import { ServerAnalytics } from "../../../lib/analytics.server";

export const PATCH: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response(JSON.stringify({ error: "Not a creator" }), { status: 403, headers: { "Content-Type": "application/json" } });

  const body = await request.json();
  await updateCreatorProfile(creator.id, body);
  ServerAnalytics.track(session.user.id, 'creator_profile_updated', { creator_id: creator.id });
  return new Response(JSON.stringify({ success: true, id: creator.id }), { headers: { "Content-Type": "application/json" } });
};

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response(JSON.stringify(null), { headers: { "Content-Type": "application/json" } });

  return new Response(JSON.stringify(creator), { headers: { "Content-Type": "application/json" } });
};
