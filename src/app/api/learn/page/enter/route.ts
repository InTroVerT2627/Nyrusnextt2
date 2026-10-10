import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor, apiError } from "@/lib/server/api";
import { recordPageEnter } from "@/lib/server/learning-session";
import { PageType } from "@/lib/learning-experience-types";

export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().uuid(),
  pageIndex: z.number().int().min(0),
  pageType: z.enum(["teaser", "scene", "concept", "example", "tryit", "check", "takeaway"]),
  pageWordCount: z.number().int().min(0).default(50),
  overrideMinSeconds: z.number().int().optional(),
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
    return apiError("Invalid page enter payload.");
  }

  try {
    const result = await recordPageEnter(
      body.sessionId,
      userId,
      body.pageIndex,
      body.pageType as PageType,
      body.pageWordCount,
      body.overrideMinSeconds
    );
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Could not record page enter.", 500);
  }
}
