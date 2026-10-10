import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { heartbeatAttempt } from "@/lib/server/final-test-engine";

export const runtime = "nodejs";

const heartbeatSchema = z.object({
  attemptId: z.string().uuid(),
  token: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = heartbeatSchema.parse(await request.json());
    const result = await heartbeatAttempt(body.attemptId, body.token);
    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err?.message || "Heartbeat failed.", 400);
  }
}
