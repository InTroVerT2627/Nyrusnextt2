import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor, apiError } from "@/lib/server/api";
import { pauseSession } from "@/lib/server/learning-session";

export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().uuid(),
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
    return apiError("Invalid pause payload.");
  }

  try {
    const result = await pauseSession(body.sessionId, userId);
    if (!result.paused) {
      return apiError(result.error || "Cannot pause session.", 400);
    }
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Pause error.", 500);
  }
}
