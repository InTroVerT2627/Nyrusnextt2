import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RoleRequirement = {
  skill: string;
  language: string;
  minimum_level: string;
  max_age_days: number;
  minimum_tasks: number;
};

const levelRank: Record<string, number> = { insufficient: 0, beginner: 1, developing: 2, proficient: 3, advanced: 4 };

export async function candidateMeetsRole(admin: SupabaseClient, candidateId: string, requirement: RoleRequirement) {
  const { data: consent, error: consentError } = await admin.from("consents")
    .select("user_id").eq("user_id", candidateId).eq("skill", requirement.skill)
    .eq("shared", true).is("revoked_at", null).maybeSingle();
  if (consentError || !consent) return false;

  const since = new Date(Date.now() - requirement.max_age_days * 86_400_000).toISOString();
  const { data: evidenceRows, error: evidenceError } = await admin.from("evidence")
    .select("attempt_id, level, confidence").eq("user_id", candidateId)
    .eq("skill", requirement.skill).eq("language", requirement.language).gte("assessed_at", since)
    .in("confidence", ["high", "medium"]).neq("level", "insufficient");
  if (evidenceError || !evidenceRows?.length) return false;

  const attemptIds = [...new Set(evidenceRows.map((row) => row.attempt_id))];
  const [appeals, attempts] = await Promise.all([
    admin.from("appeals").select("attempt_id").in("attempt_id", attemptIds).in("status", ["open", "in_review"]),
    admin.from("attempts").select("id, task_version_id, attempt_type").in("id", attemptIds).eq("attempt_type", "mission"),
  ]);
  if (appeals.error || attempts.error) return false;
  const openAppeals = new Set((appeals.data ?? []).map((row) => row.attempt_id));
  const cleanRows = evidenceRows.filter((row) => !openAppeals.has(row.attempt_id));
  const matchingRows = cleanRows.filter((row) => (levelRank[row.level] ?? 0) >= (levelRank[requirement.minimum_level] ?? 0));
  if (!matchingRows.length) return false;

  const attemptById = new Map((attempts.data ?? []).map((row) => [row.id, row]));
  const versionIds = [...new Set(cleanRows.map((row) => attemptById.get(row.attempt_id)?.task_version_id).filter(Boolean))];
  const { data: versions, error: versionError } = versionIds.length
    ? await admin.from("task_versions").select("id, task_id").in("id", versionIds)
    : { data: [], error: null };
  if (versionError || !versions?.length) return false;
  const { data: tasks, error: taskError } = await admin.from("tasks").select("id, language").in("id", [...new Set(versions.map((row) => row.task_id))]);
  if (taskError || !tasks) return false;
  const matchingTaskIds = new Set(tasks.filter((task) => task.language === requirement.language).map((task) => task.id));
  const verifiedTaskIds = new Set(cleanRows.map((row) => {
    const versionId = attemptById.get(row.attempt_id)?.task_version_id;
    return versions.find((version) => version.id === versionId)?.task_id;
  }).filter((taskId) => taskId && matchingTaskIds.has(taskId)));
  return verifiedTaskIds.size >= requirement.minimum_tasks;
}
