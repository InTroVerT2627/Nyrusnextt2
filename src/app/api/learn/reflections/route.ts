import { NextRequest, NextResponse } from "next/server";
import { requireActor, apiError } from "@/lib/server/api";
import { getReflectionRecords } from "@/lib/server/learning-session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let userId = "demo-user";
  if (process.env.NEXT_PUBLIC_BACKEND_MODE === "supabase") {
    const { response, actor } = await requireActor(request, ["learner"]);
    if (response || !actor) return response;
    userId = actor.id;
  }

  const { searchParams } = new URL(request.url);
  const pathSlug = searchParams.get("pathSlug") || undefined;

  try {
    const reflections = await getReflectionRecords(userId, pathSlug);
    return NextResponse.json({
      reflections,
    });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : "Failed to load reflections.",
      500
    );
  }
}
