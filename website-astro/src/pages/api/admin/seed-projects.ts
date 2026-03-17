import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { runMigrations } from "../../../lib/db/schema";
import { seedLaunchProject } from "../../../lib/db/seed-projects";

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  // Ensure tables exist first
  await runMigrations();

  // Seed the project
  await seedLaunchProject(auth.userId);

  return new Response(
    JSON.stringify({ success: true, message: "Seeded Launching Plantgotchi project" }),
    { headers: { "Content-Type": "application/json" } }
  );
};
