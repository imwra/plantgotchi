import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getPlantForUser } from "../../../../lib/db/queries";
import { transitionPlantPhase } from "../../../../lib/db/lifecycle-queries";
import { PHASES, type Phase } from "../../../../lib/db/lifecycle-types";
import { checkAndUnlock } from "../../../../lib/agents/achievement-engine";
import { captureServerEvent } from "../../../../lib/posthog";
import { ServerAnalytics } from "../../../../lib/analytics.server";

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const session = await getSession(request);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const plant = await getPlantForUser(params.id!, session.user.id);
    if (!plant) return new Response("Not found", { status: 404 });

    const body = await request.json();
    const { target_phase, notes } = body;

    if (!target_phase || !PHASES.has(target_phase as Phase)) {
      return new Response(
        JSON.stringify({ error: "Invalid target phase" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await transitionPlantPhase(
      params.id!,
      target_phase as Phase,
      session.user.id,
      notes ?? undefined
    );

    captureServerEvent(session.user.id, "phase_transitioned", {
      plant_id: params.id,
      from_phase: plant.current_phase ?? "none",
      to_phase: target_phase,
    });

    await checkAndUnlock(session.user.id);

    return new Response(
      JSON.stringify({
        plant_id: params.id,
        from_phase: plant.current_phase ?? "none",
        to_phase: target_phase,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    ServerAnalytics.captureException(
      'unknown',
      error instanceof Error ? error : new Error(String(error)),
      { endpoint: '/api/plants/[id]/phase', method: 'POST' }
    );
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
