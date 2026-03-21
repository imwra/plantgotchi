import type { APIRoute } from "astro";
import { getSession } from "../../lib/auth";
import { getAchievements, getTotalPoints } from "../../lib/db/lifecycle-queries";
import { ACHIEVEMENT_DEFS } from "../../lib/db/lifecycle-types";
import { ServerAnalytics } from "../../lib/analytics.server";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const unlocked = await getAchievements(session.user.id);
    const totalPoints = await getTotalPoints(session.user.id);

    return new Response(JSON.stringify({ unlocked, totalPoints, allAchievements: ACHIEVEMENT_DEFS }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const userId = session.user.id ?? 'anonymous';
    ServerAnalytics.captureException(userId, error instanceof Error ? error : new Error(String(error)), { endpoint: '/api/achievements', method: 'GET' });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
