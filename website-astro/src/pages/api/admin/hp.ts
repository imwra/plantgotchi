import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { getAllPlantsForHP } from "../../../lib/db/admin-queries";
import { computeHPBreakdown, HP_VERSION } from "../../../lib/hp";

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const plants = await getAllPlantsForHP();

  const results = plants.map((p) => {
    const breakdown = computeHPBreakdown({
      moisture: p.moisture,
      temperature: p.temperature,
      light: p.light,
      moistureMin: p.moistureMin,
      moistureMax: p.moistureMax,
      tempMin: p.tempMin,
      tempMax: p.tempMax,
      lightPreference: p.lightPreference,
      waterEventsLast14Days: p.waterEventsLast14Days,
    });

    return {
      id: p.id,
      name: p.name,
      species: p.species,
      emoji: p.emoji,
      ownerEmail: p.ownerEmail,
      breakdown,
    };
  });

  return new Response(JSON.stringify({ plants: results, version: HP_VERSION }), {
    headers: { "Content-Type": "application/json" },
  });
};
