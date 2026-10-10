import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import {
  evaluateDebuggingFix,
  evaluateDsaChallenge,
  evaluateFollowupDefense,
  getFollowupQuestion,
} from "@/lib/server/work-samples";

export const runtime = "nodejs";

const requestSchema = z.object({
  pathSlug: z.enum(["debugging", "dsa"]),
  scenarioId: z.string().min(1).max(80),
  action: z.enum(["test", "followup"]),
  candidateCode: z.string().optional(),
  questionId: z.string().optional(),
  answerText: z.string().optional(),
  answeredCountSoFar: z.number().int().min(0).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());

    if (body.action === "test") {
      if (!body.candidateCode) {
        return apiError("candidateCode is required for code execution.");
      }

      if (body.pathSlug === "debugging") {
        const result = evaluateDebuggingFix(body.scenarioId, body.candidateCode);
        return NextResponse.json(result);
      } else {
        const result = evaluateDsaChallenge(body.scenarioId, body.candidateCode);
        return NextResponse.json(result);
      }
    }

    if (body.action === "followup") {
      if (!body.questionId || body.answerText === undefined) {
        return apiError("questionId and answerText are required for follow-up evaluation.");
      }

      const evaluation = evaluateFollowupDefense(
        body.pathSlug,
        body.scenarioId,
        body.questionId,
        body.answerText,
        body.answeredCountSoFar ?? 0
      );

      const nextQuestion = !evaluation.stopQuestioning
        ? getFollowupQuestion(body.pathSlug, body.scenarioId, (body.answeredCountSoFar ?? 0) + 1)
        : null;

      return NextResponse.json({
        ...evaluation,
        nextQuestion,
      });
    }

    return apiError("Unsupported action", 400);
  } catch (err: any) {
    return apiError(err?.message || "Invalid request payload", 400);
  }
}
