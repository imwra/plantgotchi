import type { APIRoute } from "astro";
import { getSession } from "../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, listPhases, createPhase } from "../../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const phases = await listPhases(course.id);
  return new Response(JSON.stringify(phases), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

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

  const phase = await createPhase(course.id, body.title, body.description);
  return new Response(JSON.stringify(phase), { status: 201, headers: { "Content-Type": "application/json" } });
};
