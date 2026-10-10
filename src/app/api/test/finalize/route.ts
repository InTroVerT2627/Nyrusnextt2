import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { finalizeAttemptRecord } from "@/lib/server/final-test-scoring";

export const runtime = "nodejs";

const schema = z.object({
  attemptId: z.string().uuid(),
  token: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const result = await finalizeAttemptRecord(body.attemptId, body.token);
    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err?.message || "Failed to finalize test attempt.", 400);
  }
}
