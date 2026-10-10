import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { evaluateQuestionSubmission } from "@/lib/server/final-test-scoring";

export const runtime = "nodejs";

const schema = z.object({
  attemptId: z.string().uuid(),
  token: z.string().uuid(),
  submission: z.object({
    questionId: z.string().min(1),
    highlightedSpans: z
      .array(
        z.object({
          start: z.number(),
          end: z.number(),
          text: z.string(),
        })
      )
      .optional(),
    whyWrong: z.string().optional(),
    correction: z.string().optional(),
    choiceId: z.string().optional(),
    justification: z.string().optional(),
    codeOrQuery: z.string().optional(),
    prioritizedIds: z.array(z.string()).optional(),
    rewriteText: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const result = await evaluateQuestionSubmission(
      body.attemptId,
      body.token,
      body.submission
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err?.message || "Failed to evaluate question answer.", 400);
  }
}
