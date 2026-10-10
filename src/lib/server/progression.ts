import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const missionSlugs = ["find-max", "remove-duplicates", "async-results", "customer-key"];

export async function evidencedDebuggingSlugs(admin: SupabaseClient, userId: string) {
  const { data: evidenceRows, error: evidenceError } = await admin.from("evidence")
    .select("attempt_id").eq("user_id", userId).eq("skill", "debugging")
    .in("confidence", ["high", "medium"]).neq("level", "insufficient");
  if (evidenceError) throw new Error("Could not read learner progress.");
  const evidenceIds = [...new Set((evidenceRows ?? []).map((row) => row.attempt_id))];
  if (!evidenceIds.length) return new Set<string>();

  const [appeals, attempts] = await Promise.all([
    admin.from("appeals").select("attempt_id").in("attempt_id", evidenceIds).in("status", ["open", "in_review"]),
    admin.from("attempts").select("id, task_version_id, attempt_type").in("id", evidenceIds).eq("attempt_type", "mission"),
  ]);
  if (appeals.error || attempts.error) throw new Error("Could not read learner progress.");
  const appealed = new Set((appeals.data ?? []).map((row) => row.attempt_id));
  const versionIds = (attempts.data ?? []).filter((row) => !appealed.has(row.id)).map((row) => row.task_version_id).filter(Boolean);
  if (!versionIds.length) return new Set<string>();

  const { data: versions, error: versionError } = await admin.from("task_versions").select("task_id").in("id", versionIds);
  if (versionError) throw new Error("Could not read learner progress.");
  const taskIds = [...new Set((versions ?? []).map((row) => row.task_id))];
  if (!taskIds.length) return new Set<string>();
  const { data: tasks, error: taskError } = await admin.from("tasks").select("slug").in("id", taskIds).in("slug", missionSlugs);
  if (taskError) throw new Error("Could not read learner progress.");
  return new Set((tasks ?? []).map((row) => row.slug));
}
