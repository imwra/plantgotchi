import type { APIRoute } from "astro";
import { getSession } from "../../lib/auth";
import {
  getPlantForUser,
  getRecommendations,
  getRecommendationById,
  markRecommendationActedOn,
} from "../../lib/db/queries";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const plantId = url.searchParams.get("plantId");

  if (!plantId) {
    return new Response(JSON.stringify({ error: "plantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = await getPlantForUser(plantId, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const recommendations = await getRecommendations(plantId);
  return new Response(JSON.stringify(recommendations), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify ownership: fetch the recommendation, then check its plant belongs to user
  const rec = await getRecommendationById(id);
  if (!rec) return new Response("Not found", { status: 404 });

  const plant = await getPlantForUser(rec.plant_id, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  await markRecommendationActedOn(id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
