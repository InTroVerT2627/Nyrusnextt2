import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { evaluateFollowupDefense } from "@/lib/server/final-test-scoring";

export const runtime = "nodejs";

const schema = z.object({
  attemptId: z.string().uuid(),
  token: z.string().uuid(),
  questionId: z.string().min(1),
  followupId: z.string().min(1),
  learnerResponse: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const result = await evaluateFollowupDefense(
      body.attemptId,
      body.token,
      body.questionId,
      body.followupId,
      body.learnerResponse
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err?.message || "Failed to evaluate followup defense.", 400);
  }
}
