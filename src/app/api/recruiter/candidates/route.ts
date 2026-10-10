import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { appendAudit, apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { candidateMeetsRole, type RoleRequirement } from "@/lib/server/recruiter";

const levelRank: Record<string, number> = { insufficient: 0, beginner: 1, developing: 2, proficient: 3, advanced: 4 };

export async function GET(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["recruiter"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  try { if (!await consumeRateLimit(actor.id, "recruiter-search", 30, 3600)) return apiError("You have reached the recruiter search limit.", 429); }
  catch { return apiError("Recruiter search is temporarily unavailable.", 503); }
  const roleSlug = new URL(request.url).searchParams.get("role") ?? "junior-java-developer";
  const { data: role } = await admin.from("roles").select("id, title, requirements_json").eq("slug", roleSlug).eq("active", true).maybeSingle();
  if (!role) return apiError("Role was not found.", 404);
  const requirement = ((role.requirements_json as { skills?: RoleRequirement[] }).skills ?? [])[0];
  if (!requirement) return apiError("Role requirements are not configured.", 503);
  const { data: consents, error: consentError } = await admin.from("consents").select("user_id, skill, scope, include_submissions").eq("skill", requirement.skill).eq("shared", true).is("revoked_at", null).limit(200);
  if (consentError) return apiError("Consent search is unavailable.", 503);
  const candidateIds = [...new Set((consents ?? []).map((item) => item.user_id))];
  if (!candidateIds.length) return NextResponse.json({ role: { slug: roleSlug, title: role.title, requirements: requirement }, candidates: [] }, { headers: { "cache-control": "private, no-store" } });
  const { data: evidenceRows } = await admin.from("evidence").select("id, attempt_id, user_id, skill, language, level, confidence, assessed_at").in("user_id", candidateIds).eq("skill", requirement.skill).eq("language", requirement.language).gte("assessed_at", new Date(Date.now() - requirement.max_age_days * 86_400_000).toISOString()).order("assessed_at", { ascending: false });
  const evidence = evidenceRows ?? [];
  const usersWithEvidence = [...new Set(evidence.map((row) => row.user_id))];
  if (!usersWithEvidence.length) return NextResponse.json({ role: { slug: roleSlug, title: role.title, requirements: requirement }, candidates: [] }, { headers: { "cache-control": "private, no-store" } });
  const [profiles, attempts, scores, followups, appealRows] = await Promise.all([
    admin.from("profiles").select("id, synthetic_candidate_id").in("id", usersWithEvidence),
    admin.from("attempts").select("id, user_id, task_version_id, code, explanation_json, ai_disclosure, submitted_at").in("user_id", usersWithEvidence),
    admin.from("criterion_scores").select("attempt_id, criterion, score, confidence").in("attempt_id", evidence.map((item) => item.attempt_id)),
    admin.from("followups").select("attempt_id, question_shown, answer_text, score, position").in("attempt_id", evidence.map((item) => item.attempt_id)).order("position"),
    admin.from("appeals").select("attempt_id, status").in("attempt_id", evidence.map((item) => item.attempt_id)).in("status", ["open", "in_review"]),
  ]);
  if (profiles.error || attempts.error || scores.error || followups.error || appealRows.error) return apiError("Could not load consented role evidence.", 503);
  const taskVersionResult = attempts.data?.length
    ? await admin.from("task_versions").select("id, task_id").in("id", attempts.data.map((item) => item.task_version_id).filter(Boolean))
    : { data: [], error: null };
  if (taskVersionResult.error) return apiError("Could not map attempt versions to role tasks.", 503);
  const taskVersions = taskVersionResult.data ?? [];
  const taskResult = taskVersions.length
    ? await admin.from("tasks").select("id, slug, language").in("id", taskVersions.map((item) => item.task_id))
    : { data: [], error: null };
  if (taskResult.error) return apiError("Could not map evidence to the role requirements.", 503);
  const tasks = taskResult.data ?? [];
  const minimumLevel = levelRank[requirement.minimum_level] ?? 0;
  const candidates = (profiles.data ?? []).flatMap((profile) => {
    const latestByAttempt = new Map<string, typeof evidence[number]>();
    for (const row of evidence) if (row.user_id === profile.id && !latestByAttempt.has(row.attempt_id)) latestByAttempt.set(row.attempt_id, row);
    const activeAppeals = new Set((appealRows.data ?? []).map((row) => row.attempt_id));
    const matching = [...latestByAttempt.values()].filter((row) => !activeAppeals.has(row.attempt_id) && (levelRank[row.level] ?? 0) >= minimumLevel);
    const userAttempts = attempts.data?.filter((row) => row.user_id === profile.id) ?? [];
    const matchingLanguageTasks = new Set(tasks.filter((task) => task.language === requirement.language).map((task) => task.id));
    const verifiedAttemptIds = new Set([...latestByAttempt.values()].filter((row) => !activeAppeals.has(row.attempt_id) && row.level !== "insufficient" && ["high", "medium"].includes(row.confidence)).map((row) => row.attempt_id));
    const taskIds = new Set(userAttempts.filter((row) => verifiedAttemptIds.has(row.id)).map((row) => taskVersions?.find((version) => version.id === row.task_version_id)?.task_id).filter((taskId) => taskId && matchingLanguageTasks.has(taskId)));
    if (taskIds.size < requirement.minimum_tasks || matching.length === 0) return [];
    const consent = consents?.find((row) => row.user_id === profile.id && row.skill === requirement.skill);
    const cards = matching.map((row) => {
      const matchingScores = scores.data?.filter((score) => score.attempt_id === row.attempt_id) ?? [];
      const answerRows = followups.data?.filter((answer) => answer.attempt_id === row.attempt_id) ?? [];
      const attempt = userAttempts.find((item) => item.id === row.attempt_id);
      const version = taskVersions.find((item) => item.id === attempt?.task_version_id);
      const task = tasks.find((item) => item.id === version?.task_id);
      return {
        evidenceId: row.id, attemptId: row.attempt_id, taskId: task?.slug ?? "debugging-task",
        level: row.level, confidence: row.confidence, assessedAt: row.assessed_at,
        criteria: Object.fromEntries(matchingScores.map((score) => [score.criterion, score.score])),
        followupsAsked: answerRows.length,
        ...(consent?.include_submissions ? {
          submission: attempt?.code,
          incidentReport: (attempt?.explanation_json as { report?: unknown })?.report,
          followups: answerRows.map(({ question_shown, answer_text, score }) => ({ question: question_shown, answer: answer_text, score })),
          aiDisclosure: attempt?.ai_disclosure,
        } : {}),
      };
    });
    return [{ candidateId: profile.synthetic_candidate_id, displayName: `Candidate ${profile.synthetic_candidate_id}`, whySurfaced: `Meets ${requirement.skill}/${requirement.language} ≥ ${requirement.minimum_level}; ${taskIds.size} task attempts; evidence within ${requirement.max_age_days} days.`, evidence: cards }];
  });
  for (const candidate of candidates) for (const card of candidate.evidence) await appendAudit({ actor: actor.id, action: "recruiter_evidence_viewed", attemptId: card.attemptId, flags: [], output: { role_id: role.id, evidence_id: card.evidenceId, candidate_id: candidate.candidateId } });
  return NextResponse.json({ role: { slug: roleSlug, title: role.title, requirements: requirement, humanDecisionRequired: true }, candidates }, { headers: { "cache-control": "private, no-store" } });
}

const decisionSchema = z.object({ roleSlug: z.string().min(1).max(80), candidateId: z.string().min(1).max(80), decision: z.enum(["reviewed", "shortlisted"]), note: z.string().max(1000).optional() });
export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["recruiter"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  try { if (!await consumeRateLimit(actor.id, "recruiter-decision", 40, 3600)) return apiError("You have reached the recruiter decision limit.", 429); }
  catch { return apiError("Recruiter decisions are temporarily unavailable.", 503); }
  let body: z.infer<typeof decisionSchema>;
  try { body = decisionSchema.parse(await request.json()); }
  catch { return apiError("Provide a role, visible candidate ID, and human decision."); }
  const { data: role } = await admin.from("roles").select("id, requirements_json").eq("slug", body.roleSlug).eq("active", true).maybeSingle();
  const { data: profile } = await admin.from("profiles").select("id").eq("synthetic_candidate_id", body.candidateId).maybeSingle();
  if (!role || !profile) return apiError("Candidate or role was not found.", 404);
  const requirement = ((role.requirements_json as { skills?: RoleRequirement[] }).skills ?? [])[0];
  if (!requirement || !await candidateMeetsRole(admin, profile.id, requirement)) return apiError("Candidate no longer meets this consented role search.", 403);
  const { data: saved, error } = await admin.from("recruiter_decisions").insert({ recruiter_id: actor.id, candidate_id: profile.id, role_id: role.id, decision: body.decision, note: body.note ?? null }).select("id, decision, created_at").single();
  if (error || !saved) return apiError("Recruiter decision could not be saved.", 503);
  await appendAudit({ actor: actor.id, action: `recruiter_${body.decision}`, flags: [], output: { candidate_id: body.candidateId, role_id: role.id, decision_id: saved.id } });
  return NextResponse.json({ decision: saved }, { status: 201 });
}
