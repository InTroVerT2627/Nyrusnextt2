import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { appendAudit, apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const schema = z.object({
  attemptId: z.string().uuid(), appealId: z.string().uuid().optional(),
  criterion: z.enum(["fix_correctness", "edge_cases", "root_cause", "explanation", "followup_reasoning", "failing_test", "flaw_located", "flaw_explanation"]),
  decision: z.enum(["confirmed", "overturned"]), score: z.number().min(0).max(100).optional(),
  similarityCleared: z.boolean().default(false),
  reason: z.string().trim().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["reviewer"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  try { if (!await consumeRateLimit(actor.id, "review-decision", 50, 3600)) return apiError("You have reached the reviewer decision limit.", 429); }
  catch { return apiError("Review service is temporarily unavailable.", 503); }
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await request.json()); }
  catch { return apiError("Provide an attempt, criterion, decision, and written review reason."); }
  const { data: attempt } = await admin.from("attempts").select("id, user_id, task_version_id, rubric_id, boss_round_id, attempt_type, explanation_json").eq("id", body.attemptId).maybeSingle();
  if (!attempt) return apiError("Attempt was not found.", 404);
  const similarityFlag = (attempt.explanation_json as { similarity_review?: boolean }).similarity_review === true;
  if (body.similarityCleared && !similarityFlag) return apiError("This attempt has no similarity flag to clear.");
  const previousSimilarityReview = similarityFlag
    ? await admin.from("review_decisions").select("id").eq("attempt_id", attempt.id).eq("similarity_cleared", true).limit(1).maybeSingle()
    : { data: null, error: null };
  if (previousSimilarityReview.error) return apiError("Could not load the prior similarity review.", 503);
  const similarityCleared = !similarityFlag || body.similarityCleared || Boolean(previousSimilarityReview.data);
  if (body.appealId) {
    const { data: appeal } = await admin.from("appeals").select("id, attempt_id, status, criterion").eq("id", body.appealId).maybeSingle();
    if (!appeal || appeal.attempt_id !== attempt.id || appeal.criterion !== body.criterion || !["open", "in_review"].includes(appeal.status)) return apiError("Open appeal was not found.", 404);
  }
  const { data: prior } = await admin.from("criterion_scores").select("score, max_score, confidence").eq("attempt_id", attempt.id).eq("criterion", body.criterion).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!prior) return apiError("Criterion score was not found for this attempt.", 404);
  const score = body.decision === "confirmed" ? Number(prior.score) : body.score;
  if (score === undefined || score > Number(prior.max_score)) return apiError(`Override score must be between 0 and ${prior.max_score}.`);
  const { error: scoreError } = await admin.from("criterion_scores").insert({
    attempt_id: attempt.id, criterion: body.criterion, score, max_score: prior.max_score,
    source: "human", feedback: body.reason, confidence: "medium",
  });
  if (scoreError) return apiError("Reviewer score could not be recorded.", 503);
  if (body.appealId) {
    const { error } = await admin.from("appeals").update({
      status: body.decision, reviewer_id: actor.id, resolution: body.reason, resolved_at: new Date().toISOString(),
    }).eq("id", body.appealId);
    if (error) return apiError("Reviewer score was saved but the appeal could not be closed.", 503);
  }
  const { data: latestEvidence } = await admin.from("evidence").select("skill, language").eq("attempt_id", attempt.id).order("assessed_at", { ascending: false }).limit(1).maybeSingle();
  if (latestEvidence) {
    const { data: scoreRows } = await admin.from("criterion_scores").select("criterion, score, max_score").eq("attempt_id", attempt.id).order("created_at");
    const scored = new Map<string, { score: number; max: number }>();
    for (const row of scoreRows ?? []) scored.set(row.criterion, { score: Number(row.score), max: Number(row.max_score) });
    const isBoss = attempt.attempt_type === "boss";
    const testPassed = isBoss
      ? (scored.get("failing_test")?.score ?? 0) >= (scored.get("failing_test")?.max ?? 40)
      : (scored.get("fix_correctness")?.score ?? 0) >= (scored.get("fix_correctness")?.max ?? 100)
        && (scored.get("edge_cases")?.score ?? 0) >= (scored.get("edge_cases")?.max ?? 100);
    const reasoningReady = isBoss
      ? (scored.get("flaw_located")?.score ?? 0) >= (scored.get("flaw_located")?.max ?? 15)
        && (scored.get("flaw_explanation")?.score ?? 0) >= 17
      : (scored.get("root_cause")?.score ?? 0) >= 2 && (scored.get("explanation")?.score ?? 0) >= 1;
    const activeAppeals = await admin.from("appeals").select("id").eq("attempt_id", attempt.id).in("status", ["open", "in_review"]);
    const previousEvidence = await admin.from("evidence").select("attempt_id").eq("user_id", attempt.user_id).eq("skill", latestEvidence.skill).eq("language", latestEvidence.language).neq("level", "insufficient").neq("attempt_id", attempt.id);
    const previousAttemptIds = (previousEvidence.data ?? []).map((row) => row.attempt_id);
    const previousAttempts = previousAttemptIds.length
      ? await admin.from("attempts").select("id, attempt_type, task_version_id, boss_round_id").in("id", previousAttemptIds)
      : { data: [] };
    const previousVersions = (previousAttempts.data ?? []).map((row) => row.task_version_id).filter(Boolean);
    const previousTasks = previousVersions.length
      ? await admin.from("task_versions").select("task_id").in("id", previousVersions)
      : { data: [] };
    const taskIds = new Set((previousTasks.data ?? []).map((row) => row.task_id));
    const bossIds = new Set((previousAttempts.data ?? []).filter((row) => row.attempt_type === "boss").map((row) => row.boss_round_id));
    if (!isBoss && attempt.task_version_id) {
      const { data: currentVersion } = await admin.from("task_versions").select("task_id").eq("id", attempt.task_version_id).maybeSingle();
      if (currentVersion?.task_id) taskIds.add(currentVersion.task_id);
    }
    if (isBoss && attempt.boss_round_id) bossIds.add(attempt.boss_round_id);
    let composite = 0;
    if (isBoss) {
      const weights: Record<string, number> = { failing_test: 40, flaw_located: 15, flaw_explanation: 25, followup_reasoning: 20 };
      composite = Object.entries(weights).reduce((sum, [criterion, weight]) => sum + weight * (scored.get(criterion)?.score ?? 0) / (scored.get(criterion)?.max ?? weight), 0);
    } else if (attempt.rubric_id) {
      const { data: rubric } = await admin.from("rubrics").select("criteria_json").eq("id", attempt.rubric_id).maybeSingle();
      const criteria = (rubric?.criteria_json as { criteria?: { id: string; weight: number }[] } | null)?.criteria ?? [];
      const weight = criteria.reduce((sum, item) => sum + item.weight, 0);
      composite = weight ? criteria.reduce((sum, item) => sum + item.weight * (scored.get(item.id)?.score ?? 0) / (scored.get(item.id)?.max ?? 1), 0) / weight * 100 : 0;
    }
    const sampleCount = isBoss ? bossIds.size : taskIds.size;
    const eligible = testPassed && reasoningReady && !activeAppeals.data?.length && similarityCleared;
    const level = !eligible ? "insufficient" : !isBoss && sampleCount < 2 ? "beginner" : composite >= 85 ? "advanced" : composite >= 70 ? "proficient" : composite >= 50 ? "developing" : "beginner";
    const { error: evidenceError } = await admin.from("evidence").insert({
      attempt_id: attempt.id, user_id: attempt.user_id, skill: latestEvidence.skill, language: latestEvidence.language,
      level, confidence: "medium",
    });
    if (evidenceError) return apiError("Review was recorded but the evidence snapshot could not be refreshed.", 503);
  }
  const { error: reviewError } = await admin.from("review_decisions").insert({
    attempt_id: attempt.id, reviewer_id: actor.id, criterion: body.criterion,
    decision: body.decision, score, reason: body.reason, similarity_cleared: body.similarityCleared,
  });
  if (reviewError) return apiError("Review decision could not be audited.", 503);
  await appendAudit({ actor: actor.id, action: body.decision === "overturned" ? "human_score_overridden" : "human_score_confirmed", attemptId: attempt.id, flags: [similarityFlag ? (similarityCleared ? "similarity_review_cleared" : "similarity_review_pending") : ""].filter(Boolean), output: { appeal_id: body.appealId ?? null, criterion: body.criterion, score, reason: body.reason, similarity_cleared: body.similarityCleared } });
  return NextResponse.json({ resolved: true, decision: body.decision, criterion: body.criterion, score, confidence: "medium" });
}
