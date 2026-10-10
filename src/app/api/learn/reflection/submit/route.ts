import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor, apiError } from "@/lib/server/api";
import { reviewReflection } from "@/lib/server/gemini";
import { saveReflectionRecord } from "@/lib/server/learning-session";

export const runtime = "nodejs";

const submitReflectionSchema = z.object({
  pathSlug: z.enum(["data-analytics", "business-analytics", "communication"]),
  checkpointNumber: z.number().int().min(1).max(4),
  modulesCovered: z.array(z.string()).min(1),
  promptSynthesise: z.string().min(5),
  responseSynthesise: z.string().min(10),
  promptApply: z.string().min(5),
  responseApply: z.string().min(10),
});

export async function POST(request: NextRequest) {
  let userId = "demo-user";
  if (process.env.NEXT_PUBLIC_BACKEND_MODE === "supabase") {
    const { response, actor } = await requireActor(request, ["learner"]);
    if (response || !actor) return response;
    userId = actor.id;
  }

  try {
    const body = await request.json();
    const parsed = submitReflectionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid reflection submission data: " + parsed.error.message, 400);
    }

    const {
      pathSlug,
      checkpointNumber,
      modulesCovered,
      promptSynthesise,
      responseSynthesise,
      promptApply,
      responseApply,
    } = parsed.data;

    // Review reflection with Gemini formative review
    const feedback = await reviewReflection({
      pathSlug,
      checkpointNumber,
      modulesCovered,
      promptSynthesise,
      responseSynthesise,
      promptApply,
      responseApply,
    });

    // Save reflection record in Supabase or memory store
    const record = await saveReflectionRecord({
      userId,
      pathSlug,
      checkpointNumber,
      modulesCovered,
      promptSynthesise,
      responseSynthesise,
      promptApply,
      responseApply,
      feedback,
    });

    return NextResponse.json({
      success: true,
      reflection: record,
      feedback,
      unlocked: feedback.is_genuine_attempt,
    });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : "Failed to record reflection.",
      500
    );
  }
}
