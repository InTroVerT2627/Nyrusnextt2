import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { deliverNxtMoveProfile } from "@/lib/server/nxtmove";

const schema = z.object({ skill: z.enum(["debugging", "reviewing-ai-written-code"]) });

export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;
  try { if (!await consumeRateLimit(actor.id, "nxtmove-handoff", 10, 3600)) return apiError("You have reached the NxtMove handoff limit.", 429); }
  catch { return apiError("NxtMove service is temporarily unavailable.", 503); }
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await request.json()); }
  catch { return apiError("Choose a skill profile to hand off."); }
  try {
    const result = await deliverNxtMoveProfile(actor.id, body.skill);
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return apiError("The NxtMove handoff could not be completed. The consent change remains saved.", 503);
  }
}
