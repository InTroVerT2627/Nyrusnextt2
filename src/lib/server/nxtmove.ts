import "server-only";
import { appendAudit } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function deliverNxtMoveProfile(userId: string, skill: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Database service is not configured.");
  const { data: profile } = await admin.from("profiles").select("synthetic_candidate_id").eq("id", userId).maybeSingle();
  const { data: consent } = await admin.from("consents").select("shared, scope, include_submissions, granted_at, revoked_at").eq("user_id", userId).eq("skill", skill).maybeSingle();
  const shared = Boolean(consent?.shared && !consent.revoked_at);
  let evidencePayload: Record<string, unknown>[] = [];
  if (shared) {
    const { data: allEvidenceRows } = await admin.from("evidence").select("id, attempt_id, skill, language, level, confidence, assessed_at").eq("user_id", userId).eq("skill", skill).order("assessed_at", { ascending: false }).limit(50);
    const evidenceIds = (allEvidenceRows ?? []).map((row) => row.attempt_id);
    const { data: appeals } = evidenceIds.length
      ? await admin.from("appeals").select("attempt_id").in("attempt_id", evidenceIds).in("status", ["open", "in_review"])
      : { data: [] };
    const appealed = new Set((appeals ?? []).map((row) => row.attempt_id));
    const evidenceRows = (allEvidenceRows ?? []).filter((row) => !appealed.has(row.attempt_id));
    const attemptIds = evidenceRows.map((row) => row.attempt_id);
    const [attempts, scores, followups] = attemptIds.length ? await Promise.all([
      admin.from("attempts").select("id, task_version_id, rubric_id, submitted_at, code, explanation_json, ai_disclosure").in("id", attemptIds),
      admin.from("criterion_scores").select("attempt_id, criterion, score, confidence").in("attempt_id", attemptIds),
      consent?.include_submissions ? admin.from("followups").select("attempt_id, question_shown, answer_text, score").in("attempt_id", attemptIds).order("position") : Promise.resolve({ data: [], error: null }),
    ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
    evidencePayload = (evidenceRows ?? []).map((row) => {
      const attempt = attempts.data?.find((item) => item.id === row.attempt_id);
      const rowScores = scores.data?.filter((item) => item.attempt_id === row.attempt_id) ?? [];
      return {
        evidence_id: row.id, skill: row.skill, language: row.language, level: row.level,
        confidence: row.confidence, assessed_at: row.assessed_at,
        task_version: attempt?.task_version_id, rubric: attempt?.rubric_id,
        criteria: Object.fromEntries(rowScores.map((item) => [item.criterion, item.score])),
        ...(consent?.include_submissions ? {
          submission: attempt?.code,
          incident_report: (attempt?.explanation_json as { report?: unknown } | undefined)?.report,
          followups: followups.data?.filter((item) => item.attempt_id === row.attempt_id).map((item) => ({ question: item.question_shown, answer: item.answer_text, score: item.score })) ?? [],
          ai_disclosure: attempt?.ai_disclosure,
        } : {}),
      };
    });
  }
  const payload = {
    candidate_id: profile?.synthetic_candidate_id ?? "unknown",
    skill,
    evidence: evidencePayload,
    consent: { shared, scope: shared ? consent?.scope ?? "evidence_and_scores" : "none", granted_at: consent?.granted_at ?? null, revoked_at: consent?.revoked_at ?? null },
    disclaimer: "Experimental evidence, not a validated predictor of job performance.",
  };
  const event = shared ? "consent_granted" : "consent_revoked";
  const { data: outbox, error } = await admin.from("handoff_outbox").insert({ user_id: userId, skill, event, payload_json: payload, status: process.env.NXTMOVE_API_URL ? "pending" : "simulated" }).select("id").single();
  if (error || !outbox) throw new Error("Could not queue the NxtMove handoff.");
  const endpoint = process.env.NXTMOVE_API_URL;
  if (!endpoint) {
    await appendAudit({ actor: userId, action: "nxtmove_profile_handoff", flags: [], output: { handoff_id: outbox.id, skill, mode: "simulated", delivered: false } });
    return { mode: "simulated", delivered: false, payload };
  }
  const target = new URL(endpoint);
  if (target.protocol !== "https:" && target.hostname !== "localhost" && target.hostname !== "127.0.0.1") throw new Error("NxtMove endpoint must use HTTPS.");
  const response = await fetch(target, {
    method: "POST", headers: { "content-type": "application/json", ...(process.env.NXTMOVE_API_KEY ? { authorization: `Bearer ${process.env.NXTMOVE_API_KEY}` } : {}) },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(8000), cache: "no-store",
  }).catch(() => null);
  const delivered = Boolean(response?.ok);
  await admin.from("handoff_outbox").update({
    status: delivered ? "delivered" : "failed", attempts: 1,
    last_error: delivered ? null : response ? `Receiver returned ${response.status}` : "Receiver did not respond.",
    delivered_at: delivered ? new Date().toISOString() : null,
  }).eq("id", outbox.id);
  await appendAudit({ actor: userId, action: "nxtmove_profile_handoff", flags: delivered ? [] : ["handoff_failed"], output: { handoff_id: outbox.id, skill, mode: "external", delivered } });
  return { mode: "external", delivered, payload };
}
