import type { APIRoute } from "astro";
import { getSession } from "../../../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, listModules, createModule } from "../../../../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { phaseId } = params;
  if (!phaseId) return new Response("Not found", { status: 404 });

  const modules = await listModules(phaseId);
  return new Response(JSON.stringify(modules), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, phaseId } = params;
  if (!slug || !phaseId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  if (!body.title) {
    return new Response(JSON.stringify({ error: "title is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const mod = await createModule(phaseId, body.title, body.description, body.is_preview);
  return new Response(JSON.stringify(mod), { status: 201, headers: { "Content-Type": "application/json" } });
};
