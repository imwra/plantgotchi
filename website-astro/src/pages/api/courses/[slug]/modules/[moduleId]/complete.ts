import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/auth";
import { getCourseBySlug, getEnrollment, getModule, completeModule } from "../../../../../../lib/db/lms-queries";

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, moduleId } = params;
  if (!slug || !moduleId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  // Check access: enrolled or free course
  if (course.price_cents > 0) {
    const enrollment = await getEnrollment(course.id, session.user.id);
    if (!enrollment) {
      return new Response(JSON.stringify({ error: "Not enrolled" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
  }

  const mod = await getModule(moduleId);
  if (!mod) return new Response("Not found", { status: 404 });

  const body = await request.json().catch(() => ({}));
  const quizAnswers = body.quiz_answers ? JSON.stringify(body.quiz_answers) : undefined;

  const completion = await completeModule(moduleId, session.user.id, quizAnswers);
  return new Response(JSON.stringify(completion), { status: 201, headers: { "Content-Type": "application/json" } });
};
