import type { APIRoute } from "astro";
import { getSession } from "../../lib/auth";
import { getPlantForUser } from "../../lib/db/queries";
import { addGrowLog, getGrowLogs, getGrowLogsByPhase, getGrowLogsByType } from "../../lib/db/lifecycle-queries";
import { getAvailableActions, PHASES, GROW_LOG_TYPE_LABELS, type Phase, type GrowLogType } from "../../lib/db/lifecycle-types";
import { checkAndUnlock } from "../../lib/agents/achievement-engine";
import { captureServerEvent } from "../../lib/posthog";
import { ServerAnalytics } from "../../lib/analytics.server";


export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const plantId = url.searchParams.get("plantId");
  const phase = url.searchParams.get("phase");
  const logType = url.searchParams.get("logType");
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  if (!plantId) {
    return new Response(JSON.stringify({ error: "plantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = await getPlantForUser(plantId, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  let logs;
  if (phase && PHASES.has(phase as Phase)) {
    logs = await getGrowLogsByPhase(plantId, phase as Phase);
  } else if (logType && logType in GROW_LOG_TYPE_LABELS) {
    logs = await getGrowLogsByType(plantId, logType as GrowLogType);
  } else {
    logs = await getGrowLogs(plantId, limit);
  }

  return new Response(JSON.stringify(logs), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    const { plant_id, phase, log_type, data, photo_url, notes } = body;

    if (!plant_id || !phase || !log_type) {
      return new Response(JSON.stringify({ error: "plant_id, phase, and log_type required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const plant = await getPlantForUser(plant_id, session.user.id);
    if (!plant) return new Response("Not found", { status: 404 });

    const availableActions = getAvailableActions(phase as Phase);
    if (!availableActions.includes(log_type as GrowLogType)) {
      return new Response(
        JSON.stringify({ error: `Action "${log_type}" is not allowed in phase "${phase}". Valid: ${availableActions.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const log = {
      id: crypto.randomUUID(),
      plant_id,
      user_id: session.user.id,
      phase,
      log_type,
      data: data ? JSON.stringify(data) : null,
      photo_url: photo_url ?? null,
      notes: notes ?? null,
    };

    await addGrowLog(log);

    captureServerEvent(session.user.id, "grow_log_added", {
      plant_id,
      log_type,
      phase,
    });

    await checkAndUnlock(session.user.id);

    return new Response(JSON.stringify({ ...log, created_at: new Date().toISOString() }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const userId = session.user.id ?? "anonymous";
    ServerAnalytics.captureException(
      userId,
      error instanceof Error ? error : new Error(String(error)),
      { endpoint: "/api/grow-logs", method: "POST" }
    );
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
