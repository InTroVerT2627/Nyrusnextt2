import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { useHint } from "@/lib/server/final-test-scoring";

export const runtime = "nodejs";

const schema = z.object({
  attemptId: z.string().uuid(),
  token: z.string().uuid(),
  questionId: z.string().min(1),
  tier: z.enum(["nudge", "pointer", "strong"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const result = await useHint(body.attemptId, body.token, body.questionId, body.tier);
    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err?.message || "Failed to use hint.", 400);
  }
}
