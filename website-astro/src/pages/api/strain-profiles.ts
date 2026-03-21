import type { APIRoute } from "astro";
import { getSession } from "../../lib/auth";
import { createStrainProfile, getStrainProfiles } from "../../lib/db/lifecycle-queries";
import { captureServerEvent } from "../../lib/posthog";
import { ServerAnalytics } from "../../lib/analytics.server";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const strains = await getStrainProfiles(session.user.id);

    return new Response(JSON.stringify(strains), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const userId = session.user.id ?? 'anonymous';
    ServerAnalytics.captureException(userId, error instanceof Error ? error : new Error(String(error)), { endpoint: '/api/strain-profiles', method: 'GET' });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    const { name, type, flower_weeks_min, flower_weeks_max, difficulty, thresholds_by_phase, notes } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const strain = {
      id: crypto.randomUUID(),
      name,
      type: type ?? null,
      flower_weeks_min: flower_weeks_min ?? null,
      flower_weeks_max: flower_weeks_max ?? null,
      difficulty: difficulty ?? null,
      thresholds_by_phase: thresholds_by_phase ? JSON.stringify(thresholds_by_phase) : null,
      notes: notes ?? null,
      is_custom: true,
      user_id: session.user.id,
    };

    await createStrainProfile(strain);

    captureServerEvent(session.user.id, 'strain_created', {
      strain_id: strain.id,
      strain_name: name,
    });

    return new Response(JSON.stringify(strain), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const userId = session.user.id ?? 'anonymous';
    ServerAnalytics.captureException(userId, error instanceof Error ? error : new Error(String(error)), { endpoint: '/api/strain-profiles', method: 'POST' });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
