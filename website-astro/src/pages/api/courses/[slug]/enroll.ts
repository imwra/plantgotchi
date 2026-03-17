import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getCourseBySlug, getEnrollment, enrollUser } from "../../../../lib/db/lms-queries";
import { ServerAnalytics } from "../../../../lib/analytics.server";

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course || course.status !== 'published') return new Response("Not found", { status: 404 });

  const existing = await getEnrollment(course.id, session.user.id);
  if (existing) {
    return new Response(JSON.stringify({ error: "Already enrolled" }), { status: 409, headers: { "Content-Type": "application/json" } });
  }

  const enrollment = await enrollUser(course.id, session.user.id, course.price_cents);
  ServerAnalytics.track(session.user.id, 'course_enrolled', { course_id: course.id, course_slug: params.slug });
  return new Response(JSON.stringify(enrollment), { status: 201, headers: { "Content-Type": "application/json" } });
};
