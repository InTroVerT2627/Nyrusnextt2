import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { interruptAttempt } from "@/lib/server/final-test-engine";

export const runtime = "nodejs";

const interruptSchema = z.object({
  attemptId: z.string().uuid(),
  token: z.string().uuid(),
  reason: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const body = interruptSchema.parse(await request.json());
    const result = await interruptAttempt(body.attemptId, body.token, body.reason);
    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err?.message || "Failed to record interruption.", 400);
  }
}
