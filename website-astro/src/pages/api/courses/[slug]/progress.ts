import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getCourseBySlug, getEnrollment, getCourseProgress } from "../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const enrollment = await getEnrollment(course.id, session.user.id);
  if (!enrollment && course.price_cents > 0) {
    return new Response(JSON.stringify({ error: "Not enrolled" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const progress = await getCourseProgress(course.id, session.user.id);
  return new Response(JSON.stringify(progress), { headers: { "Content-Type": "application/json" } });
};
