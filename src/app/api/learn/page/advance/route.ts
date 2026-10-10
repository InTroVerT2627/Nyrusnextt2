import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor, apiError } from "@/lib/server/api";
import { verifyAndAdvancePage } from "@/lib/server/learning-session";
import { PageType } from "@/lib/learning-experience-types";

export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().uuid(),
  visitId: z.string().uuid(),
  nextPageIndex: z.number().int().min(0),
  nextPageType: z.enum(["teaser", "scene", "concept", "example", "tryit", "check", "takeaway"]),
  interactionDone: z.boolean().default(true),
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
    return apiError("Invalid page advance payload.");
  }

  try {
    const result = await verifyAndAdvancePage(
      body.sessionId,
      userId,
      body.visitId,
      body.nextPageIndex,
      body.nextPageType as PageType,
      body.interactionDone
    );
    if (!result.success) {
      return apiError(result.error || "Cannot advance page at this time.", 400);
    }
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Could not advance page.", 500);
  }
}
