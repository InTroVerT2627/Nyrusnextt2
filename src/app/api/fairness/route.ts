import { NextRequest, NextResponse } from "next/server";
import { apiError, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { executeFairnessEvaluation } from "@/lib/server/fairness-engine";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["reviewer"]);
  if (response || !actor) return response;

  const admin = createSupabaseAdminClient();
  const summary = await executeFairnessEvaluation(admin, { forceLiveRefresh: false });

  return NextResponse.json(summary);
}
