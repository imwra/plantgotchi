import type { APIRoute } from "astro";
import { getSession } from "../../lib/auth";
import {
  getPlantForUser,
  getRecentReadings,
  addSensorReading,
  addRecommendation,
} from "../../lib/db/queries";
import { evaluatePlant } from "../../lib/agents/rules";


export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const plantId = url.searchParams.get("plantId");
  const days = parseInt(url.searchParams.get("days") || "7", 10);

  if (!plantId) {
    return new Response(JSON.stringify({ error: "plantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = await getPlantForUser(plantId, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const readings = await getRecentReadings(plantId, days);
  return new Response(JSON.stringify(readings), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { plant_id, moisture, temperature, light } = body;

  if (!plant_id) {
    return new Response(JSON.stringify({ error: "plant_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = await getPlantForUser(plant_id, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const sensorId = `manual-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const readingData = {
    plant_id,
    sensor_id: sensorId,
    moisture: moisture ?? null,
    temperature: temperature ?? null,
    light: light ?? null,
    battery: null,
  };

  await addSensorReading(readingData);

  // Evaluate rules engine with synthetic SensorReading (id: 0 is unused by evaluatePlant)
  const syntheticReading = {
    id: 0,
    ...readingData,
    timestamp: now,
  };

  const recommendations = evaluatePlant(plant, syntheticReading);

  // Persist each recommendation
  for (const rec of recommendations) {
    await addRecommendation(rec);
  }

  return new Response(
    JSON.stringify({ reading: syntheticReading, recommendations }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
};
