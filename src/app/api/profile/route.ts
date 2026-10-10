import { NextRequest, NextResponse } from "next/server";
import { apiError, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner", "recruiter", "reviewer"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  if (actor.profile.role !== "learner") {
    return NextResponse.json({ user: { id: actor.id, displayName: actor.profile.display_name, role: actor.profile.role } });
  }

  const [attemptResult, evidenceResult, consentResult, appealResult] = await Promise.all([
    admin.from("attempts").select("id, task_version_id, rubric_id, boss_round_id, attempt_type, code, explanation_json, ai_disclosure, submitted_at").eq("user_id", actor.id).order("submitted_at", { ascending: false }),
    admin.from("evidence").select("id, attempt_id, skill, language, level, confidence, assessed_at").eq("user_id", actor.id).order("assessed_at", { ascending: false }),
    admin.from("consents").select("id, skill, scope, include_submissions, shared, granted_at, revoked_at, updated_at").eq("user_id", actor.id),
    admin.from("appeals").select("id, attempt_id, criterion, reason, status, resolution, resolved_at, created_at").eq("user_id", actor.id).order("created_at", { ascending: false }),
  ]);
  if (attemptResult.error || evidenceResult.error || consentResult.error || appealResult.error) return apiError("Could not load the learner profile.", 503);
  const attempts = attemptResult.data ?? [];
  const ids = attempts.map((item) => item.id);
  const [scores, followups] = ids.length ? await Promise.all([
    admin.from("criterion_scores").select("id, attempt_id, criterion, score, max_score, source, feedback, confidence, run_scores, created_at").in("attempt_id", ids).order("created_at"),
    admin.from("followups").select("id, attempt_id, bank_id, bank_version, position, gap_tags, question_shown, answer_text, score, ai_reason, evidence_quote, run_scores, answered_at").in("attempt_id", ids).order("position"),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (scores.error || followups.error) return apiError("Could not load assessment evidence.", 503);
  const { data: profile } = await admin.from("profiles").select("display_name, role, synthetic_candidate_id").eq("id", actor.id).single();
  return NextResponse.json({
    user: { id: actor.id, displayName: profile?.display_name ?? actor.profile.display_name, role: profile?.role ?? actor.profile.role, syntheticCandidateId: profile?.synthetic_candidate_id ?? actor.profile.synthetic_candidate_id },
    attempts, criterionScores: scores.data ?? [], followups: followups.data ?? [],
    evidence: evidenceResult.data ?? [], consents: consentResult.data ?? [], appeals: appealResult.data ?? [],
  }, { headers: { "cache-control": "private, no-store" } });
}
