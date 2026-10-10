import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, requireActor } from "@/lib/server/api";
import { startTestAttempt } from "@/lib/server/final-test-engine";

export const runtime = "nodejs";

const startSchema = z.object({
  pathSlug: z.string().min(1).max(80),
  proctorMode: z.enum(["device_checked", "unproctored"]),
  cameraVerified: z.boolean(),
  micVerified: z.boolean(),
  hasAccommodation: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  let userId = "demo-learner-id";
  if (process.env.NEXT_PUBLIC_BACKEND_MODE === "supabase") {
    const { response, actor } = await requireActor(request, ["learner"]);
    if (response || !actor) return response;
    userId = actor.id;
  }

  try {
    const body = startSchema.parse(await request.json());
    const result = await startTestAttempt({
      userId,
      pathSlug: body.pathSlug,
      proctorMode: body.proctorMode,
      cameraVerified: body.cameraVerified,
      micVerified: body.micVerified,
      hasAccommodation: body.hasAccommodation,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return apiError(err?.message || "Failed to start final test attempt.", 400);
  }
}
