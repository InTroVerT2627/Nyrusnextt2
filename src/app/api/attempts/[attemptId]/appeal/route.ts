import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { appendAudit, apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const schema = z.object({ criterion: z.enum(["fix_correctness", "edge_cases", "root_cause", "explanation", "followup_reasoning", "failing_test", "flaw_located", "flaw_explanation"]), reason: z.string().trim().min(10).max(2000) });

export async function POST(request: NextRequest, context: { params: Promise<{ attemptId: string }> }) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;
  const { attemptId } = await context.params;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  try { if (!await consumeRateLimit(actor.id, "appeal-open", 10, 3600)) return apiError("You have reached the appeal limit.", 429); }
  catch { return apiError("Review service is temporarily unavailable.", 503); }
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await request.json()); }
  catch { return apiError("Choose a criterion and provide a challenge reason of at least 10 characters."); }
  const { data: attempt } = await admin.from("attempts").select("id, user_id, attempt_type").eq("id", attemptId).maybeSingle();
  if (!attempt || attempt.user_id !== actor.id) return apiError("Attempt was not found.", 404);
  const { data: criterionScore } = await admin.from("criterion_scores").select("id").eq("attempt_id", attempt.id).eq("criterion", body.criterion).limit(1).maybeSingle();
  if (!criterionScore) return apiError("Choose a criterion that was scored in this attempt.");
  const { data: existing } = await admin.from("appeals").select("id").eq("attempt_id", attempt.id).eq("criterion", body.criterion).in("status", ["open", "in_review"]).maybeSingle();
  if (existing) return apiError("This criterion already has an open challenge.", 409);
  const { data: appeal, error } = await admin.from("appeals").insert({ attempt_id: attempt.id, user_id: actor.id, criterion: body.criterion, reason: body.reason }).select("id, status, created_at").single();
  if (error || !appeal) return apiError("Challenge could not be opened.", 503);
  await appendAudit({ actor: actor.id, action: "appeal_opened", attemptId: attempt.id, flags: [], output: { appeal_id: appeal.id, criterion: body.criterion, reason: body.reason } });
  return NextResponse.json({ appeal }, { status: 201 });
}
