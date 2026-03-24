import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/auth";
import { getCourseBySlug, getEnrollment, getModule, completeModule, completeModuleWithScore, listContentBlocks } from "../../../../../../lib/db/lms-queries";
import { ServerAnalytics } from "../../../../../../lib/analytics.server";

function scoreQuizServerSide(
  quizContent: { options: string[]; correct_index?: number; correct_indices?: number[]; pass_threshold?: number },
  selectedIndices: number[],
): { score: number; passThreshold: number; passed: boolean } {
  const correctSet = new Set(
    quizContent.correct_indices ?? (quizContent.correct_index !== undefined ? [quizContent.correct_index] : [])
  );
  let correctCount = 0;
  let wrongCount = 0;
  for (const i of selectedIndices) {
    if (correctSet.has(i)) correctCount++;
    else wrongCount++;
  }
  const score = correctSet.size > 0 ? Math.max(0, (correctCount - wrongCount) / correctSet.size) : 0;
  const passThreshold = quizContent.pass_threshold ?? 0;
  return { score, passThreshold, passed: score >= passThreshold };
}

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

  // Check if this module has quiz blocks that need server-side scoring
  if (body.quiz_answers) {
    const blocks = await listContentBlocks(moduleId);
    const quizBlocks = blocks.filter(b => b.block_type === 'quiz');

    if (quizBlocks.length > 0) {
      // Score each quiz block server-side
      let totalScore = 0;
      let quizCount = 0;
      let passThreshold = 0;

      for (const qBlock of quizBlocks) {
        try {
          const quizContent = JSON.parse(qBlock.content);
          const selectedForBlock = body.quiz_answers[qBlock.id];
          if (selectedForBlock !== undefined) {
            const indices = Array.isArray(selectedForBlock) ? selectedForBlock : [selectedForBlock];
            const result = scoreQuizServerSide(quizContent, indices);
            totalScore += result.score;
            quizCount++;
            passThreshold = Math.max(passThreshold, result.passThreshold);
          }
        } catch { /* skip malformed quiz blocks */ }
      }

      if (quizCount > 0) {
        const avgScore = totalScore / quizCount;
        const result = await completeModuleWithScore(
          moduleId,
          session.user.id,
          quizAnswers || '{}',
          avgScore,
          passThreshold,
        );
        ServerAnalytics.track(session.user.id, 'course_quiz_scored', {
          course_id: course.id,
          module_id: moduleId,
          score: avgScore,
          passed: result.passed,
          attempt: result.attemptNumber,
        });
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
      }
    }
  }

  // Standard completion (no quiz scoring needed)
  const completion = await completeModule(moduleId, session.user.id, quizAnswers);
  ServerAnalytics.track(session.user.id, 'course_lesson_completed', { course_id: course.id, module_id: moduleId });
  return new Response(JSON.stringify({ ...completion, passed: true, attemptNumber: 1 }), { status: 201, headers: { "Content-Type": "application/json" } });
};
