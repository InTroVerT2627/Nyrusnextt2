import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor, apiError } from "@/lib/server/api";
import { startModuleSession } from "@/lib/server/learning-session";

export const runtime = "nodejs";

const schema = z.object({
  pathSlug: z.enum(["data-analytics", "business-analytics", "communication"]),
  moduleSlug: z.string().min(1),
  relaxedMode: z.boolean().default(false),
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
    return apiError("Invalid path or module identifier.");
  }

  try {
    const result = await startModuleSession(
      userId,
      body.pathSlug,
      body.moduleSlug,
      body.relaxedMode
    );
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Could not start session.", 500);
  }
}
