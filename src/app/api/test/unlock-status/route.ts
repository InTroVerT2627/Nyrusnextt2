import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, requireActor } from "@/lib/server/api";
import { canUnlockFinalTest } from "@/lib/server/final-test-engine";

export const runtime = "nodejs";

const schema = z.object({
  pathSlug: z.string().min(1).max(80),
});

export async function POST(request: NextRequest) {
  let userId = "demo-learner-id";
  if (process.env.NEXT_PUBLIC_BACKEND_MODE === "supabase") {
    const { response, actor } = await requireActor(request, ["learner"]);
    if (response || !actor) return response;
    userId = actor.id;
  }

  try {
    const body = schema.parse(await request.json());
    const status = await canUnlockFinalTest(userId, body.pathSlug);
    return NextResponse.json(status);
  } catch (err: any) {
    return apiError(err?.message || "Failed to check final test status.");
  }
}
