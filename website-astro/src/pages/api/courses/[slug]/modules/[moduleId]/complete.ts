import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/auth";
import { getCourseBySlug, getEnrollment, getModule, completeModule, completeModuleWithScore } from "../../../../../../lib/db/lms-queries";
import { ServerAnalytics } from "../../../../../../lib/analytics.server";

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

  // If quiz scoring data is provided, use the scoring flow
  if (body.quiz_score !== undefined && body.pass_threshold !== undefined) {
    const result = await completeModuleWithScore(
      moduleId,
      session.user.id,
      quizAnswers || '{}',
      body.quiz_score,
      body.pass_threshold,
    );
    ServerAnalytics.track(session.user.id, 'course_quiz_scored', {
      course_id: course.id,
      module_id: moduleId,
      score: body.quiz_score,
      passed: result.passed,
      attempt: result.attemptNumber,
    });
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
  }

  // Standard completion (no scoring)
  const completion = await completeModule(moduleId, session.user.id, quizAnswers);
  ServerAnalytics.track(session.user.id, 'course_lesson_completed', { course_id: course.id, module_id: moduleId });
  return new Response(JSON.stringify({ ...completion, passed: true, attemptNumber: 1 }), { status: 201, headers: { "Content-Type": "application/json" } });
};
