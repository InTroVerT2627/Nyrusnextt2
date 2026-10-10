import { NextRequest, NextResponse } from "next/server";
import { apiError, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  const { data: tasks, error } = await admin.from("tasks").select("id, slug, competency, language, difficulty, skill_node_id, mission_json").eq("active", true).order("skill_node_id");
  if (error || !tasks) return apiError("Could not load missions.", 503);
  const ids = tasks.map((task) => task.id);
  const [versions, rubrics] = await Promise.all([
    admin.from("task_versions").select("id, task_id, version, prompt, starter_code, explanation_prompt").in("task_id", ids).order("version", { ascending: false }),
    admin.from("rubrics").select("id, task_id, version, criteria_json").in("task_id", ids).order("version", { ascending: false }),
  ]);
  if (versions.error || rubrics.error) return apiError("Could not load mission versions.", 503);
  const latest = <T extends { task_id: string; version: number }>(items: T[] | null, taskId: string) => items?.filter((item) => item.task_id === taskId).sort((a,b) => b.version-a.version)[0] ?? null;
  const visibleCases: Record<string, { title: string; input: unknown; expected: unknown }[]> = {};
  for (const task of tasks) {
    const version = latest(versions.data, task.id);
    if (!version) continue;
    const { data } = await admin.from("visible_test_cases").select("title, input_json, expected_json").eq("task_version_id", version.id).order("ordinal");
    if (data) visibleCases[task.id] = data.map((item) => ({ title: item.title, input: item.input_json, expected: item.expected_json }));
  }
  return NextResponse.json({ missions: tasks.map((task) => {
    const version = latest(versions.data, task.id);
    const rubric = latest(rubrics.data, task.id);
    return { ...task, version: version ? { id: version.id, version: version.version, prompt: version.prompt, starterCode: version.starter_code, reportHeadings: (version.explanation_prompt as { headings?: string[] }).headings ?? [] } : null, rubric: rubric ? { version: rubric.version, criteria: rubric.criteria_json } : null, visibleTests: version ? visibleCases[task.id] ?? [] : [] };
  }) }, { headers: { "cache-control": "private, no-store" } });
}
