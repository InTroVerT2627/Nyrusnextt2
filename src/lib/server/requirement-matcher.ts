import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RoleRequirement = {
  skill: string;
  language: string;
  minimum_level: string;
  max_age_days: number;
  minimum_tasks: number;
  importance?: "must-have" | "nice-to-have";
  confidence_needed?: "high" | "medium";
};

export type RequirementEvaluation = {
  skill: string;
  language: string;
  minimum_level: string;
  max_age_days: number;
  minimum_tasks: number;
  importance: "must-have" | "nice-to-have";
  confidence_needed: "high" | "medium";
  status: "met" | "partly-met" | "not-yet";
  reasons: string[];
  actual_level: string | null;
  actual_confidence: string | null;
  actual_age_days: number | null;
  actual_tasks: number;
  matched_evidence_id: string | null;
  matched_attempt_id: string | null;
  strengthening_advice: string[];
};

export const levelRank: Record<string, number> = {
  insufficient: 0,
  beginner: 1,
  developing: 2,
  proficient: 3,
  advanced: 4,
};

export type UserEvidenceItem = {
  id: string;
  attempt_id: string;
  skill: string;
  language: string;
  level: string;
  confidence: string;
  assessed_at: string;
};

export type UserAttemptItem = {
  id: string;
  task_version_id: string | null;
  attempt_type: string;
  submitted_at: string;
};

/**
 * Pure evaluation function comparing a single candidate's evidence record against a role requirement.
 * Reused identically by Recruiter Search and Learner Role Readiness Map.
 */
export function evaluateRequirement(
  req: RoleRequirement,
  evidenceRows: UserEvidenceItem[],
  attempts: UserAttemptItem[],
  taskIdsByVersionId: Map<string, string>,
  matchingTaskIds: Set<string>,
  activeAppealAttemptIds: Set<string>,
  hasActiveConsent: boolean
): RequirementEvaluation {
  const importance = req.importance ?? "must-have";
  const confidenceNeeded = req.confidence_needed ?? "medium";
  const minLevelRank = levelRank[req.minimum_level] ?? 2;
  const confidenceAccepted = confidenceNeeded === "high" ? ["high"] : ["high", "medium"];

  // Filter evidence for this skill and language
  const skillEvidence = evidenceRows.filter(
    (e) => e.skill.toLowerCase() === req.skill.toLowerCase() &&
           (req.language === "Any" || e.language.toLowerCase() === req.language.toLowerCase())
  );

  if (skillEvidence.length === 0) {
    return {
      skill: req.skill,
      language: req.language,
      minimum_level: req.minimum_level,
      max_age_days: req.max_age_days,
      minimum_tasks: req.minimum_tasks,
      importance,
      confidence_needed: confidenceNeeded,
      status: "not-yet",
      reasons: ["No verified evidence recorded yet for this skill."],
      actual_level: null,
      actual_confidence: null,
      actual_age_days: null,
      actual_tasks: 0,
      matched_evidence_id: null,
      matched_attempt_id: null,
      strengthening_advice: [
        "Complete a foundational mission or practice task to establish initial evidence.",
      ],
    };
  }

  // Remove attempts with active appeals
  const cleanEvidence = skillEvidence.filter((e) => !activeAppealAttemptIds.has(e.attempt_id));

  // Determine latest evidence
  const sorted = [...cleanEvidence].sort((a, b) => b.assessed_at.localeCompare(a.assessed_at));
  const latest = sorted[0];

  const nowMs = Date.now();
  const assessedMs = new Date(latest.assessed_at).getTime();
  const actualAgeDays = Math.max(0, Math.floor((nowMs - assessedMs) / (86_400_000)));

  const attemptById = new Map(attempts.map((a) => [a.id, a]));
  const verifiedTaskIds = new Set<string>();

  for (const row of cleanEvidence) {
    if (row.level !== "insufficient" && ["high", "medium"].includes(row.confidence.toLowerCase())) {
      const att = attemptById.get(row.attempt_id);
      if (att?.task_version_id) {
        const taskId = taskIdsByVersionId.get(att.task_version_id);
        if (taskId && matchingTaskIds.has(taskId)) {
          verifiedTaskIds.add(taskId);
        }
      }
    }
  }

  const actualTasks = verifiedTaskIds.size;
  const reasons: string[] = [];
  const advice: string[] = [];

  const actualRank = levelRank[latest.level] ?? 0;
  const isLevelMet = actualRank >= minLevelRank;
  const isAgeMet = actualAgeDays <= req.max_age_days;
  const isConfidenceMet = confidenceAccepted.includes(latest.confidence.toLowerCase());
  const isTasksMet = actualTasks >= req.minimum_tasks;

  if (!isLevelMet) {
    reasons.push(`Level ${latest.level} is below required ${req.minimum_level}.`);
    advice.push(`Progress to ${req.minimum_level} by solving higher-complexity tasks.`);
  }

  if (!isAgeMet) {
    reasons.push(`Evidence is ${actualAgeDays} days old (exceeds ${req.max_age_days}-day recency window).`);
    advice.push("Evidence is older than the role window: completing a fresh task will renew recency.");
  }

  if (!isConfidenceMet) {
    reasons.push(`Confidence is ${latest.confidence} (requires ${confidenceNeeded}).`);
    advice.push("Ensure dual-run evaluations agree consistently without ambiguity or runner errors.");
  }

  if (!isTasksMet) {
    reasons.push(`Completed ${actualTasks} of ${req.minimum_tasks} distinct tasks needed.`);
    advice.push(`Complete ${req.minimum_tasks - actualTasks} more independent task(s) to demonstrate breadth.`);
  }

  if (actualTasks === 1 && req.minimum_tasks === 1) {
    advice.push("Two independent tasks provide stronger evidence for employers.");
  }

  let status: "met" | "partly-met" | "not-yet" = "not-yet";
  if (isLevelMet && isAgeMet && isConfidenceMet && isTasksMet) {
    status = "met";
  } else if (actualRank > 0 || actualTasks > 0) {
    status = "partly-met";
  }

  return {
    skill: req.skill,
    language: req.language,
    minimum_level: req.minimum_level,
    max_age_days: req.max_age_days,
    minimum_tasks: req.minimum_tasks,
    importance,
    confidence_needed: confidenceNeeded,
    status,
    reasons: reasons.length ? reasons : ["All requirement criteria satisfied."],
    actual_level: latest.level,
    actual_confidence: latest.confidence,
    actual_age_days: actualAgeDays,
    actual_tasks: actualTasks,
    matched_evidence_id: latest.id,
    matched_attempt_id: latest.attempt_id,
    strengthening_advice: advice,
  };
}

/**
 * DB helper querying candidate data and running evaluateRequirement.
 * Used identically for Recruiter Candidate verification and Learner Readiness Map.
 */
export async function evaluateCandidateForRole(
  admin: SupabaseClient,
  candidateId: string,
  requirements: RoleRequirement[]
): Promise<{
  evaluations: RequirementEvaluation[];
  allMet: boolean;
  mustHavesMetCount: number;
  mustHavesTotalCount: number;
  hasConsent: boolean;
}> {
  // 1. Fetch consents for candidate
  const skills = [...new Set(requirements.map((r) => r.skill))];
  const { data: consents } = await admin
    .from("consents")
    .select("skill, shared, revoked_at")
    .eq("user_id", candidateId)
    .in("skill", skills)
    .eq("shared", true)
    .is("revoked_at", null);

  const consentedSkills = new Set((consents ?? []).map((c) => c.skill.toLowerCase()));

  // 2. Fetch evidence
  const { data: evidenceRows } = await admin
    .from("evidence")
    .select("id, attempt_id, skill, language, level, confidence, assessed_at")
    .eq("user_id", candidateId)
    .order("assessed_at", { ascending: false });

  const evList: UserEvidenceItem[] = (evidenceRows ?? []).map((e) => ({
    id: e.id,
    attempt_id: e.attempt_id,
    skill: e.skill,
    language: e.language,
    level: e.level,
    confidence: e.confidence,
    assessed_at: e.assessed_at,
  }));

  const attemptIds = [...new Set(evList.map((e) => e.attempt_id))];

  // 3. Fetch appeals and attempts
  const [appealsRes, attemptsRes] = await Promise.all([
    attemptIds.length
      ? admin.from("appeals").select("attempt_id").in("attempt_id", attemptIds).in("status", ["open", "in_review"])
      : { data: [] },
    attemptIds.length
      ? admin.from("attempts").select("id, task_version_id, attempt_type, submitted_at").in("id", attemptIds)
      : { data: [] },
  ]);

  const activeAppealIds = new Set((appealsRes.data ?? []).map((a) => a.attempt_id));
  const userAttempts: UserAttemptItem[] = (attemptsRes.data ?? []).map((a) => ({
    id: a.id,
    task_version_id: a.task_version_id,
    attempt_type: a.attempt_type,
    submitted_at: a.submitted_at,
  }));

  // 4. Map versions to tasks
  const versionIds = [...new Set(userAttempts.map((a) => a.task_version_id).filter(Boolean))] as string[];
  const { data: versions } = versionIds.length
    ? await admin.from("task_versions").select("id, task_id").in("id", versionIds)
    : { data: [] };

  const taskIdsByVersionId = new Map<string, string>();
  for (const v of versions ?? []) {
    taskIdsByVersionId.set(v.id, v.task_id);
  }

  const taskIds = [...new Set((versions ?? []).map((v) => v.task_id))];
  const { data: tasks } = taskIds.length
    ? await admin.from("tasks").select("id, language").in("id", taskIds)
    : { data: [] };

  const evaluations: RequirementEvaluation[] = [];

  for (const req of requirements) {
    const hasConsent = consentedSkills.has(req.skill.toLowerCase());
    const matchingTasks = new Set(
      (tasks ?? [])
        .filter((t) => req.language === "Any" || t.language.toLowerCase() === req.language.toLowerCase())
        .map((t) => t.id)
    );

    const evalResult = evaluateRequirement(
      req,
      evList,
      userAttempts,
      taskIdsByVersionId,
      matchingTasks,
      activeAppealIds,
      hasConsent
    );

    evaluations.push(evalResult);
  }

  const mustHaves = evaluations.filter((e) => e.importance === "must-have");
  const mustHavesMet = mustHaves.filter((e) => e.status === "met");
  const allMet = mustHaves.length > 0 && mustHavesMet.length === mustHaves.length;

  return {
    evaluations,
    allMet,
    mustHavesMetCount: mustHavesMet.length,
    mustHavesTotalCount: mustHaves.length,
    hasConsent: mustHaves.every((m) => consentedSkills.has(m.skill.toLowerCase())),
  };
}
