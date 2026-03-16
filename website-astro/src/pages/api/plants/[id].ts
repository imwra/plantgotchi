import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import {
  getPlantForUser,
  getLatestReading,
  getRecommendations,
  getCareLogs,
} from "../../../lib/db/queries";

export const GET: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = params;
  if (!id) return new Response("Not found", { status: 404 });

  const plant = await getPlantForUser(id, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const [latestReading, recommendations, recentCareLogs] = await Promise.all([
    getLatestReading(id),
    getRecommendations(id, 5),
    getCareLogs(id, 10),
  ]);

  return new Response(
    JSON.stringify({ plant, latestReading, recommendations, recentCareLogs }),
    { headers: { "Content-Type": "application/json" } }
  );
};
