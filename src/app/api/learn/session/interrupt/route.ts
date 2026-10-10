import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor, apiError } from "@/lib/server/api";
import { interruptSession } from "@/lib/server/learning-session";

export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().uuid(),
  reason: z.enum(["tab_hidden", "window_blur", "pagehide", "heartbeat_lost"]),
  durationMs: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  let userId = "demo-learner-01";
  if (process.env.NEXT_PUBLIC_BACKEND_MODE === "supabase") {
    const { response, actor } = await requireActor(request, ["learner"]);
    if (response || !actor) return response;
    userId = actor.id;
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return apiError("Invalid interrupt payload.");
  }

  try {
    const result = await interruptSession(
      body.sessionId,
      userId,
      body.reason,
      body.durationMs
    );
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Interrupt logging error.", 500);
  }
}
