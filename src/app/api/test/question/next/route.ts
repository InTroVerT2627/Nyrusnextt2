import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { getAttemptSummary } from "@/lib/server/final-test-engine";
import { getAllQuestionsForPath, sanitizeQuestionForClient } from "@/lib/server/final-test-pool";

export const runtime = "nodejs";

const schema = z.object({
  attemptId: z.string().uuid(),
  token: z.string().uuid(),
  currentIndex: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const attempt = await getAttemptSummary(body.attemptId);
    if (!attempt || attempt.sessionToken !== body.token) {
      return apiError("Invalid attempt session token.", 403);
    }

    const nextIndex = body.currentIndex + 1;
    if (nextIndex >= attempt.questionIds.length) {
      return NextResponse.json({ hasNext: false, nextQuestion: null });
    }

    attempt.currentQuestionIndex = nextIndex;
    const nextQId = attempt.questionIds[nextIndex];
    const questions = getAllQuestionsForPath(attempt.pathSlug);
    const qServer = questions.find((q) => q.client.id === nextQId);
    if (!qServer) return apiError("Question not found.", 404);

    const hints = attempt.revealedHintsByQuestion[nextQId] || [];
    const clientQ = sanitizeQuestionForClient(qServer, nextIndex + 1, hints);

    return NextResponse.json({
      hasNext: true,
      nextQuestion: clientQ,
      currentQuestionIndex: nextIndex,
      totalQuestions: attempt.questionIds.length,
    });
  } catch (err: any) {
    return apiError(err?.message || "Failed to fetch next question.", 400);
  }
}
