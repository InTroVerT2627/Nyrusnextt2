import { NextRequest, NextResponse } from "next/server";
import { apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { findNearIdenticalSubmission } from "@/lib/server/submission-similarity";

export async function GET(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["reviewer"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  try { if (!await consumeRateLimit(actor.id, "review-queue", 60, 3600)) return apiError("You have reached the reviewer queue limit.", 429); }
  catch { return apiError("Review service is temporarily unavailable.", 503); }
  const [appeals, lowScores] = await Promise.all([
    admin.from("appeals").select("id, attempt_id, user_id, criterion, reason, status, created_at").in("status", ["open", "in_review"]).order("created_at").limit(100),
    admin.from("criterion_scores").select("attempt_id, criterion, created_at").eq("confidence", "low").limit(500),
  ]);
  if (appeals.error || lowScores.error) return apiError("Could not load the review queue.", 503);
  const appealedAttemptIds = new Set((appeals.data ?? []).map((item) => item.attempt_id));
  const lowAttemptIdsAll = [...new Set((lowScores.data ?? []).map((item) => item.attempt_id).filter((id) => !appealedAttemptIds.has(id)))];
  const { data: priorReviews, error: priorReviewError } = lowAttemptIdsAll.length
    ? await admin.from("review_decisions").select("attempt_id, criterion, created_at").in("attempt_id", lowAttemptIdsAll)
    : { data: [], error: null };
  if (priorReviewError) return apiError("Could not check prior review decisions.", 503);
  const lowAttemptIds = lowAttemptIdsAll.filter((attemptId) => {
    const criteria = (lowScores.data ?? []).filter((item) => item.attempt_id === attemptId);
    return criteria.some((item) => !(priorReviews ?? []).some((review) => review.attempt_id === attemptId && review.criterion === item.criterion && review.created_at >= item.created_at));
  });
  const appealAttemptIds = [...appealedAttemptIds];
  const allIds = [...new Set([...appealAttemptIds, ...lowAttemptIds])];
  if (!allIds.length) return NextResponse.json({ items: [] }, { headers: { "cache-control": "private, no-store" } });
  const lowAttemptRows = lowAttemptIds.length ? await admin.from("attempts").select("user_id").in("id", lowAttemptIds) : { data: [], error: null };
  if (lowAttemptRows.error) return apiError("Could not load review assignments.", 503);
  const profileIds = [...new Set([...(appeals.data ?? []).map((item) => item.user_id), ...(lowAttemptRows.data ?? []).map((item) => item.user_id)])];
  const [attempts, scores, followups, profiles, appealsByAttempt] = await Promise.all([
    admin.from("attempts").select("id, user_id, task_version_id, boss_round_id, attempt_type, code, explanation_json, ai_disclosure, submitted_at").in("id", allIds),
    admin.from("criterion_scores").select("attempt_id, criterion, score, max_score, source, feedback, confidence, run_scores").in("attempt_id", allIds).order("created_at"),
    admin.from("followups").select("attempt_id, position, question_shown, answer_text, score, evidence_quote, ai_reason").in("attempt_id", allIds).order("position"),
    profileIds.length ? admin.from("profiles").select("id, display_name, synthetic_candidate_id").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
    admin.from("appeals").select("id, attempt_id, user_id, criterion, reason, status, created_at").in("attempt_id", allIds),
  ]);
  if (attempts.error || scores.error || followups.error || profiles.error || appealsByAttempt.error) return apiError("Could not load review material.", 503);
  const { data: versions } = await admin.from("task_versions").select("id, task_id, version, prompt, starter_code").in("id", (attempts.data ?? []).map((item) => item.task_version_id).filter(Boolean));
  const { data: tasks } = await admin.from("tasks").select("id, slug, language, mission_json").in("id", (versions ?? []).map((item) => item.task_id));
  const items = await Promise.all((attempts.data ?? []).map(async (attempt) => {
    const version = versions?.find((item) => item.id === attempt.task_version_id);
    const task = tasks?.find((item) => item.id === version?.task_id);
    const appeal = appealsByAttempt.data?.find((item) => item.attempt_id === attempt.id);
    const profile = profiles.data?.find((item) => item.id === attempt.user_id);
    const similarityFlag = (attempt.explanation_json as { similarity_review?: boolean }).similarity_review === true;
    const similarityComparison = similarityFlag && version?.starter_code
      ? await findNearIdenticalSubmission(admin, version.id, attempt.user_id, attempt.code, version.starter_code)
      : null;
    return {
      attemptId: attempt.id, attemptType: attempt.attempt_type, submittedAt: attempt.submitted_at,
      code: attempt.code, report: (attempt.explanation_json as { report?: unknown }).report,
      similarityFlag, similarityComparison,
      aiDisclosure: attempt.ai_disclosure, task: task ? { slug: task.slug, language: task.language, mission: task.mission_json, prompt: version?.prompt } : null,
      candidate: { id: profile?.synthetic_candidate_id, displayName: profile?.display_name },
      criteria: scores.data?.filter((row) => row.attempt_id === attempt.id) ?? [],
      followups: followups.data?.filter((row) => row.attempt_id === attempt.id) ?? [],
      appeal: appeal ?? null,
    };
  }));
  return NextResponse.json({ items }, { headers: { "cache-control": "private, no-store" } });
}
