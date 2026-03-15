import type { APIRoute } from "astro";
import { getSession } from "../../lib/auth";
import { getPlantForUser, addCareLog, getCareLogs } from "../../lib/db/queries";


const VALID_ACTIONS = [
  "water",
  "fertilize",
  "repot",
  "prune",
  "mist",
  "pest_treatment",
  "other",
] as const;

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const plantId = url.searchParams.get("plantId");
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  if (!plantId) {
    return new Response(JSON.stringify({ error: "plantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = await getPlantForUser(plantId, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const logs = await getCareLogs(plantId, limit);
  return new Response(JSON.stringify(logs), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { plant_id, action, notes } = body;

  if (!plant_id || !action) {
    return new Response(JSON.stringify({ error: "plant_id and action required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!(VALID_ACTIONS as readonly string[]).includes(action)) {
    return new Response(
      JSON.stringify({ error: `Invalid action. Valid: ${VALID_ACTIONS.join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const plant = await getPlantForUser(plant_id, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const careLog = {
    id: crypto.randomUUID(),
    plant_id,
    user_id: session.user.id,
    action,
    notes: notes || null,
  };

  await addCareLog(careLog);

  return new Response(JSON.stringify({ ...careLog, created_at: new Date().toISOString() }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
