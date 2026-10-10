import { NextRequest, NextResponse } from "next/server";
import { apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { executeFairnessEvaluation } from "@/lib/server/fairness-engine";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["reviewer"]);
  if (response || !actor) return response;

  const admin = createSupabaseAdminClient();

  // Enforce rate limit (max 5 run batches per hour)
  if (admin) {
    try {
      const allowed = await consumeRateLimit(actor.id, "fairness-run-batch", 5, 3600);
      if (!allowed) {
        return apiError("Fairness Lab run batch limit reached (5 batches / hr).", 429);
      }
    } catch {}
  }

  let body: {
    benchmarkIds?: string[];
    forceLiveRefresh?: boolean;
    confirmedEstimatedCalls?: number;
  } = {};

  try {
    body = await request.json();
  } catch {}

  // Cap batch size to max 4 benchmarks (28 variant evaluations) per manual run batch
  const benchmarkIds = (body.benchmarkIds || []).slice(0, 4);

  const summary = await executeFairnessEvaluation(admin, {
    benchmarkIds: benchmarkIds.length ? benchmarkIds : undefined,
    forceLiveRefresh: Boolean(body.forceLiveRefresh),
  });

  return NextResponse.json(summary);
}
