import { createHash } from "node:crypto";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { appendAudit, apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { hiddenCasesFromSpec, languageFor, runTestSuite, visibleCasesFromRows } from "@/lib/server/assessment";
import { MODEL_NAME, PROMPT_VERSION, SCORING_CONFIGURED, hasManipulationFlag, scoreExplanation } from "@/lib/server/gemini";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { taskReferences, criterionDescriptors } from "@/lib/server/task-reference";
import { evidencedDebuggingSlugs } from "@/lib/server/progression";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  taskSlug: z.string().min(1).max(80),
  code: z.string().min(1).max(16_000),
  report: z.object({
    what_broke: z.string().max(2000).default(""),
    why_it_broke: z.string().max(2000).default(""),
    the_fix: z.string().max(2000).default(""),
    how_to_prevent: z.string().max(2000).default(""),
  }),
  aiDisclosure: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  let allowed: boolean;
  try { allowed = await consumeRateLimit(actor.id, "assessment-submit", 8, 3600); }
  catch { return apiError("Assessment service is temporarily unavailable.", 503); }
  if (!allowed) return apiError("You have reached the assessment submission limit. Please try again later.", 429);

  let body: z.infer<typeof schema>;
  try { body = schema.parse(await request.json()); }
  catch { return apiError("Provide a task, code submission, and incident report in the expected format."); }

  const { data: task } = await admin.from("tasks").select("id, slug, language, active, skill_node_id").eq("slug", body.taskSlug).eq("active", true).maybeSingle();
  if (!task) return apiError("That task is not available.", 404);
  const prerequisites: Record<string, string[]> = {
    "remove-duplicates": ["find-max"],
    "async-results": ["find-max"],
    "customer-key": ["remove-duplicates", "async-results"],
  };
  const requiredSlugs = prerequisites[task.slug] ?? [];
  if (requiredSlugs.length) {
    let completed: Set<string>;
    try { completed = await evidencedDebuggingSlugs(admin, actor.id); }
    catch { return apiError("Could not evaluate skill progression.", 503); }
    if (!requiredSlugs.every((slug) => completed.has(slug))) return apiError("Complete the prerequisite skill nodes before submitting this mission.", 403);
  }
  const { data: version } = await admin.from("task_versions").select("id, version, prompt").eq("task_id", task.id).order("version", { ascending: false }).limit(1).maybeSingle();
  const { data: rubric } = await admin.from("rubrics").select("id, version, criteria_json").eq("task_id", task.id).order("version", { ascending: false }).limit(1).maybeSingle();
  if (!version || !rubric) return apiError("Task configuration is incomplete.", 503);
  const { data: visibleRows } = await admin.from("visible_test_cases").select("title, input_json, expected_json").eq("task_version_id", version.id).order("ordinal");
  const { data: hiddenRow } = await admin.from("hidden_test_suites").select("test_spec").eq("task_version_id", version.id).maybeSingle();
  const { data: bankRows } = await admin.from("followup_bank").select("id, version, trigger_json, question_template, expected_key_points, ordinal").eq("task_id", task.id).order("ordinal");
  if (!visibleRows?.length || !hiddenRow || !bankRows?.length) return apiError("Task tests or follow-up bank are missing.", 503);
  const latestBankVersion = Math.max(...bankRows.map((row) => row.version));
  const activeBankRows = bankRows.filter((row) => row.version === latestBankVersion);

  let language;
  try { language = languageFor(task.language); }
  catch { return apiError("This task uses an unsupported code language.", 503); }
  const learnerText = Object.values(body.report).filter(Boolean).join("\n");
  const visible = await runTestSuite(language, task.slug, body.code, visibleCasesFromRows(visibleRows));
  const hiddenCases = hiddenCasesFromSpec(hiddenRow.test_spec);
  const hidden = await runTestSuite(language, task.slug, body.code, hiddenCases);
  if (visible.runnerFailure || hidden.runnerFailure) {
    const failureAttempt = await admin.from("attempts").insert({
      user_id: actor.id, task_version_id: version.id, rubric_id: rubric.id, attempt_type: "mission",
      code: body.code, ai_disclosure: body.aiDisclosure,
      explanation_json: {
        report: body.report, prompt_version: PROMPT_VERSION, selected_question_ids: [], gap_tags: ["runner_failure"],
        test_summary: { visible_total: visible.total, visible_passed: visible.passed, hidden_total: hidden.total, hidden_passed: hidden.passed, runner_failure: true },
        runner_failure: true,
      },
    }).select("id, submitted_at").single();
    if (failureAttempt.error || !failureAttempt.data) return apiError("The runner failed before the assessment attempt could be recorded.", 503);
    const failures = [
      { criterion: "fix_correctness", score: 0, max_score: 100, source: "test", feedback: "No correctness result is available because the isolated runner failed.", confidence: "low" },
      { criterion: "edge_cases", score: 0, max_score: 100, source: "test", feedback: "No private edge-case result is available because the isolated runner failed.", confidence: "low" },
      { criterion: "root_cause", score: 0, max_score: 3, source: "ai", feedback: "Reasoning was not graded because the runner failed; human review is required.", confidence: "low" },
      { criterion: "explanation", score: 0, max_score: 2, source: "ai", feedback: "Reasoning was not graded because the runner failed; human review is required.", confidence: "low" },
    ];
    const scoreFailure = await admin.from("criterion_scores").insert(failures.map((item) => ({ ...item, attempt_id: failureAttempt.data.id })));
    if (scoreFailure.error) return apiError("The failed runner attempt was recorded but the review scores could not be finalized.", 503);
    await appendAudit({
      actor: actor.id, action: "assessment_runner_failed", attemptId: failureAttempt.data.id,
      taskVersion: version.version, rubricVersion: rubric.version, bankVersion: 1, promptVersion: PROMPT_VERSION,
      inputHash: createHash("sha256").update(`${body.code}\n${learnerText}`).digest("hex"),
      flags: ["runner_failure", "low_confidence"],
      output: { visible_summary: { total: visible.total, passed: visible.passed }, hidden_summary: { total: hidden.total, passed: hidden.passed } },
    });
    return NextResponse.json({
      attemptId: failureAttempt.data.id, submittedAt: failureAttempt.data.submitted_at,
      status: "review_required", confidence: "low", flags: ["runner_failure"], model: null,
      scores: { fix_correctness: 0, edge_cases: 0, root_cause: 0, explanation: 0 },
      visibleTests: visible.checks.map(({ title, passed }) => ({ title, passed })),
      hiddenSummary: { passed: false, count: hidden.total }, questions: [],
      feedback: "The isolated runner did not return a reliable result. This attempt was saved for human review; no correctness conclusion was made.",
      rubric: criterionDescriptors,
    }, { status: 201 });
  }

  const flagged = hasManipulationFlag(learnerText) || hasManipulationFlag(body.code);
  let explanationRuns: Awaited<ReturnType<typeof scoreExplanation>>["runs"] | null = null;
  let modelError = false;
  if (SCORING_CONFIGURED) {
    try {
      const scored = await scoreExplanation({
        prompt: version.prompt,
        reference: taskReferences[task.slug] ?? "Debug the task and explain the cause.",
        rubric: rubric.criteria_json,
        learnerText,
      });
      explanationRuns = scored.runs;
    } catch { modelError = true; }
  } else { modelError = true; }

  const runDisagreement = (criterion: "root_cause" | "explanation") => {
    if (!explanationRuns) return 2;
    return Math.abs(explanationRuns[0][criterion] - explanationRuns[1][criterion]);
  };
  const differences = [runDisagreement("root_cause"), runDisagreement("explanation")];
  const baseConfidence = flagged || modelError || differences.some((value) => value > 1) || explanationRuns?.some((run) => run.ambiguous || run.injection_suspected)
    ? "low" : differences.some((value) => value === 1) ? "medium" : "medium";
  const rootScore = explanationRuns ? Math.min(...explanationRuns.map((run) => run.root_cause)) : 0;
  const explanationScore = explanationRuns ? Math.min(...explanationRuns.map((run) => run.explanation)) : 0;
  const visibleScore = Math.round(100 * visible.passed / visible.total);
  const hiddenScore = Math.round(100 * hidden.passed / hidden.total);

  const tags: string[] = [];
  if (rootScore < 2) tags.push("root_cause_low");
  if (visible.passed < visible.total) tags.push(task.slug === "remove-duplicates" ? "order_failed" : "visible_test_failed");
  if (hidden.passed < hidden.total) tags.push("hidden_test_failed");
  if (task.slug === "find-max" && hidden.checks.some((item) => item.title === "Empty input" && !item.passed)) tags.push("empty_input");
  if (learnerText.length < 45) tags.push("explanation_vague");
  if (modelError) tags.push("reasoning_review_required");
  const chosen = activeBankRows.filter((row) => {
    const triggers = Array.isArray((row.trigger_json as { tags?: unknown })?.tags) ? (row.trigger_json as { tags: unknown[] }).tags : [];
    return tags.some((tag) => triggers.includes(tag));
  }).slice(0, 2);
  const questions = (chosen.length ? chosen : activeBankRows.filter((row) => (row.trigger_json as { tags?: string[] })?.tags?.includes("stretch")).slice(0, 1)).slice(0, 3);
  const selectedQuestionIds = questions.map((item) => item.id);
  const attemptPayload = {
    user_id: actor.id, task_version_id: version.id, rubric_id: rubric.id,
    attempt_type: "mission" as const, code: body.code, ai_disclosure: body.aiDisclosure,
    explanation_json: {
      report: body.report, prompt_version: PROMPT_VERSION,
      selected_question_ids: selectedQuestionIds, gap_tags: tags,
      test_summary: { visible_total: visible.total, visible_passed: visible.passed, hidden_total: hidden.total, hidden_passed: hidden.passed },
      model_runs: explanationRuns,
    },
  };
  const { data: attempt, error: attemptError } = await admin.from("attempts").insert(attemptPayload).select("id, submitted_at").single();
  if (attemptError || !attempt) return apiError("The assessment result could not be saved.", 503);

  const scoreConfidence = baseConfidence;
  const criteria = [
    { criterion: "fix_correctness", score: visibleScore, max_score: 100, source: "test", feedback: `${visible.passed}/${visible.total} visible tests passed.`, confidence: "high" },
    { criterion: "edge_cases", score: hiddenScore, max_score: 100, source: "test", feedback: `${hidden.passed}/${hidden.total} private edge-case tests passed. Individual cases and expected values are private.`, confidence: "high" },
    { criterion: "root_cause", score: rootScore, max_score: 3, source: "ai", feedback: explanationRuns?.[0].reason ?? "AI scoring is unavailable; human review is required.", confidence: scoreConfidence, run_scores: explanationRuns?.map((run) => run.root_cause) ?? [] },
    { criterion: "explanation", score: explanationScore, max_score: 2, source: "ai", feedback: explanationRuns?.[0].reason ?? "AI scoring is unavailable; human review is required.", confidence: scoreConfidence, run_scores: explanationRuns?.map((run) => run.explanation) ?? [] },
  ];
  const { error: scoresError } = await admin.from("criterion_scores").insert(criteria.map((item) => ({ ...item, attempt_id: attempt.id })));
  if (scoresError) return apiError("The assessment was saved but its criterion record could not be completed. It is in the review queue.", 503);

  const inputHash = createHash("sha256").update(`${body.code}\n${learnerText}`).digest("hex");
  const flags = [flagged ? "injection_precheck" : "", modelError ? "reasoning_provider_unavailable" : "", baseConfidence === "low" ? "low_confidence" : ""].filter(Boolean);
  await appendAudit({
    actor: actor.id, action: "assessment_submitted", attemptId: attempt.id,
    taskVersion: version.version, rubricVersion: rubric.version,
    bankVersion: questions[0]?.version ?? 1, modelName: explanationRuns ? MODEL_NAME : null,
    promptVersion: PROMPT_VERSION, inputHash, flags,
    output: {
      visible: visible.checks.map(({ title, passed }) => ({ title, passed })),
      hidden_summary: { total: hidden.total, passed: hidden.passed },
      explanation_runs: explanationRuns, confidence: baseConfidence,
    },
  });

  return NextResponse.json({
    attemptId: attempt.id, submittedAt: attempt.submitted_at,
    status: modelError ? "review_required" : "followup_required",
    confidence: baseConfidence, flags, model: explanationRuns ? MODEL_NAME : null,
    scores: { fix_correctness: visibleScore, edge_cases: hiddenScore, root_cause: rootScore, explanation: explanationScore },
    visibleTests: visible.checks.map(({ title, passed, compileError }) => ({ title, passed, ...(compileError ? { compileError } : {}) })),
    hiddenSummary: { passed: hidden.passed === hidden.total, count: hidden.total },
    questions: questions.map(({ id, question_template, version: bankVersion }, index) => ({ id, position: index + 1, bankVersion, question: question_template })),
    feedback: explanationRuns?.[0].reason ?? "Your tests have been recorded. Reasoning is pending human review because the AI grader is not configured.",
    rubric: criterionDescriptors,
  });
}
