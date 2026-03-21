import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getPlantForUser } from "../../../../lib/db/queries";
import { harvestPlant } from "../../../../lib/db/lifecycle-queries";
import { checkAndUnlock } from "../../../../lib/agents/achievement-engine";
import { captureServerEvent } from "../../../../lib/posthog";
import { ServerAnalytics } from "../../../../lib/analytics.server";

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const session = await getSession(request);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const plant = await getPlantForUser(params.id!, session.user.id);
    if (!plant) return new Response("Not found", { status: 404 });

    if (plant.current_phase !== "flowering") {
      return new Response(
        JSON.stringify({
          error: "Plant must be in flowering phase to harvest",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { wet_weight, notes } = body;

    await harvestPlant(
      params.id!,
      session.user.id,
      wet_weight ?? undefined,
      notes ?? undefined
    );

    captureServerEvent(session.user.id, "plant_harvested", {
      plant_id: params.id,
      wet_weight,
    });

    await checkAndUnlock(session.user.id);

    return new Response(
      JSON.stringify({
        plant_id: params.id,
        phase: "drying",
        wet_weight: wet_weight ?? null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    ServerAnalytics.captureException(
      'unknown',
      error instanceof Error ? error : new Error(String(error)),
      { endpoint: '/api/plants/[id]/harvest', method: 'POST' }
    );
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
