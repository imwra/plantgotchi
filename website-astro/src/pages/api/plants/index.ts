import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import {
  getPlants,
  getLatestReading,
  getCareLogs,
  createPlant,
} from "../../../lib/db/queries";
import { randomUUID } from "node:crypto";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const plants = await getPlants(session.user.id);

  const augmented = await Promise.all(
    plants.map(async (plant) => {
      const [latestReading, recentCareLogs] = await Promise.all([
        getLatestReading(plant.id),
        getCareLogs(plant.id, 5),
      ]);
      return { plant, latestReading, recentCareLogs };
    })
  );

  return new Response(JSON.stringify(augmented), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { name, species, emoji, light_preference, moisture_min, moisture_max, temp_min, temp_max } = body;

  if (!name || !emoji) {
    return new Response(JSON.stringify({ error: "Name and emoji are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = {
    id: randomUUID(),
    user_id: session.user.id,
    name,
    species: species || null,
    emoji,
    photo_url: null,
    light_preference: light_preference || "medium",
    moisture_min: moisture_min ?? 30,
    moisture_max: moisture_max ?? 80,
    temp_min: temp_min ?? 15,
    temp_max: temp_max ?? 30,
  };

  await createPlant(plant);

  return new Response(JSON.stringify(plant), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
