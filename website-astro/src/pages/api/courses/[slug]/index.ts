import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getCourseBySlug, getCourseWithContent, updateCourse, deleteCourse, getCreatorByUserId } from "../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseWithContent(slug);
  if (!course) return new Response("Not found", { status: 404 });

  return new Response(JSON.stringify(course), { headers: { "Content-Type": "application/json" } });
};

export const PATCH: APIRoute = async ({ request, params }) => {
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
  await updateCourse(course.id, body);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};

export const DELETE: APIRoute = async ({ request, params }) => {
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

  await deleteCourse(course.id);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};
