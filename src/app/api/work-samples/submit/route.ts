import { createHash } from "node:crypto";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { appendAudit, apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MODEL_NAME, PROMPT_VERSION, SCORING_CONFIGURED, hasManipulationFlag, scoreExplanation } from "@/lib/server/gemini";
import {
  executeSqlCohortQuery,
  evaluateUnitEconomicsModel,
  evaluateCommunicationStructure,
  type UnitEconomicsModel,
  type CommunicationPackage,
} from "@/lib/server/work-samples";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  taskSlug: z.enum(["sql-cohort-revenue", "saas-unit-economics", "executive-incident-briefing"]),
  solution: z.union([z.string(), z.record(z.string(), z.unknown())]),
  report: z.record(z.string(), z.string()).default({}),
  aiDisclosure: z.boolean().default(false),
  isDraft: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);

  try {
    if (!(await consumeRateLimit(actor.id, "work-sample-submit", 15, 3600))) {
      return apiError("You have reached the work-sample submission limit. Please wait before retrying.", 429);
    }
  } catch {
    return apiError("Assessment service is temporarily unavailable.", 503);
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return apiError("Provide a valid work-sample task, solution, and insight memo.");
  }

  const { data: task } = await admin
    .from("tasks")
    .select("id, slug, competency, language")
    .eq("slug", body.taskSlug)
    .single();
  if (!task) return apiError("Task was not found in catalog.", 404);

  const { data: version } = await admin
    .from("task_versions")
    .select("id, version, prompt, starter_code")
    .eq("task_id", task.id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const { data: rubric } = await admin
    .from("rubrics")
    .select("id, version, criteria_json")
    .eq("task_id", task.id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (!version || !rubric) return apiError("Task configuration is incomplete.", 503);

  // 1. Run Deterministic Task Check
  let deterministicChecks: { title: string; passed: boolean; message?: string }[] = [];
  let deterministicPassed = false;
  let serializedCode = "";
  let queryRows: Record<string, unknown>[] = [];
  let queryColumns: string[] = [];

  if (body.taskSlug === "sql-cohort-revenue") {
    const query = typeof body.solution === "string" ? body.solution : String(body.solution.query ?? "");
    serializedCode = query;
    const sqlRes = await executeSqlCohortQuery(query);
    deterministicChecks = sqlRes.checks;
    deterministicPassed = sqlRes.passed;
    queryRows = sqlRes.rows;
    queryColumns = sqlRes.columns;
  } else if (body.taskSlug === "saas-unit-economics") {
    const model = (typeof body.solution === "object" ? body.solution : JSON.parse(body.solution)) as UnitEconomicsModel;
    serializedCode = JSON.stringify(model, null, 2);
    const uRes = evaluateUnitEconomicsModel(model);
    deterministicChecks = uRes.checks;
    deterministicPassed = uRes.passed;
  } else if (body.taskSlug === "executive-incident-briefing") {
    const pkg = (typeof body.solution === "object" ? body.solution : JSON.parse(body.solution)) as CommunicationPackage;
    serializedCode = JSON.stringify(pkg, null, 2);
    const cRes = evaluateCommunicationStructure(pkg);
    deterministicChecks = cRes.checks;
    deterministicPassed = cRes.passed;
  }

  const learnerText = Object.values(body.report).filter(Boolean).join("\n\n");

  // If this is a draft revision check in the Communication Revise-After-Feedback Loop:
  if (body.isDraft) {
    const feedbackNotes: string[] = [];
    if (!deterministicPassed) {
      feedbackNotes.push(...deterministicChecks.filter((c) => !c.passed).map((c) => c.message || c.title));
    }
    if (learnerText.length < 100) {
      feedbackNotes.push("Insight memo could be more detailed to demonstrate deep understanding of trade-offs.");
    }
    if (!learnerText.toLowerCase().includes("risk") && !learnerText.toLowerCase().includes("caveat")) {
      feedbackNotes.push("Consider explicitly addressing operational risks or caveats to strengthen executive credibility.");
    }
    return NextResponse.json({
      draftFeedback: {
        readyForSubmission: deterministicPassed && learnerText.length >= 100,
        checks: deterministicChecks,
        suggestions: feedbackNotes.length ? feedbackNotes : ["Strong initial draft. Ready for final evaluation and follow-up defense."],
      },
    });
  }

  // 2. Score Insight Memo / Reasoning via Gemini Dual-Run
  const flagged = hasManipulationFlag(learnerText) || hasManipulationFlag(serializedCode);
  let explanationRuns: Awaited<ReturnType<typeof scoreExplanation>>["runs"] | null = null;
  let modelError = false;

  if (SCORING_CONFIGURED) {
    try {
      const scored = await scoreExplanation({
        prompt: version.prompt,
        reference: `Evaluate authentic work-sample demonstration for ${task.competency}. Check technical accuracy, quantitative grounding, and actionable reasoning.`,
        rubric: rubric.criteria_json,
        learnerText,
      });
      explanationRuns = scored.runs;
    } catch {
      modelError = true;
    }
  } else {
    modelError = true;
  }

  const scoreConfidence = flagged || modelError ? "low" : "high";
  const reasoningScore = explanationRuns ? Math.min(...explanationRuns.map((r) => r.root_cause)) : 2;

  // 3. Select Follow-up Questions from Fixed Bank
  const { data: bankRows } = await admin
    .from("followup_bank")
    .select("id, version, trigger_json, question_template, ordinal")
    .eq("task_id", task.id)
    .order("ordinal");

  const questions = (bankRows ?? []).slice(0, 2).map((row, idx) => ({
    id: row.id,
    position: idx + 1,
    bankVersion: row.version,
    question: row.question_template,
  }));

  // 4. Save Attempt to Supabase
  const attemptPayload = {
    user_id: actor.id,
    task_version_id: version.id,
    rubric_id: rubric.id,
    attempt_type: "mission" as const,
    code: serializedCode,
    ai_disclosure: body.aiDisclosure,
    explanation_json: {
      report: body.report,
      prompt_version: PROMPT_VERSION,
      test_summary: {
        checks: deterministicChecks,
        passed: deterministicPassed,
      },
      model_runs: explanationRuns,
      competency: task.competency,
    },
  };

  const { data: attempt, error: attemptError } = await admin
    .from("attempts")
    .insert(attemptPayload)
    .select("id, submitted_at")
    .single();

  if (attemptError || !attempt) {
    return apiError("Could not record work-sample assessment attempt.", 503);
  }

  // 5. Insert Criterion Scores
  const criteriaData = (rubric.criteria_json as { criteria: { id: string; title: string; weight: number; max: number; source: string }[] }).criteria ?? [];
  const criterionScores = criteriaData.map((crit) => {
    let score = 0;
    if (crit.source === "tests") {
      score = deterministicPassed ? crit.max : 0;
    } else {
      score = Math.round((reasoningScore / 3) * crit.max);
    }
    return {
      attempt_id: attempt.id,
      criterion: crit.id,
      score,
      max_score: crit.max,
      source: crit.source === "tests" ? "test" : "ai",
      feedback: crit.source === "tests"
        ? (deterministicPassed ? "All deterministic checks passed." : "One or more deterministic checks failed.")
        : (explanationRuns?.[0].reason ?? "Reasoning evaluated against rubric descriptors."),
      confidence: scoreConfidence,
    };
  });

  await admin.from("criterion_scores").insert(criterionScores);

  // 6. Record Authentic Evidence in `evidence` table if criteria met!
  let evidenceRecorded = false;
  if (deterministicPassed && reasoningScore >= 2 && scoreConfidence !== "low") {
    const { error: evError } = await admin.from("evidence").upsert({
      attempt_id: attempt.id,
      user_id: actor.id,
      skill: task.competency,
      language: "JavaScript",
      level: reasoningScore >= 3 ? "advanced" : "proficient",
      confidence: scoreConfidence,
      assessed_at: new Date().toISOString(),
    }, { onConflict: "attempt_id" });
    evidenceRecorded = !evError;
  }

  // 7. Append Audit Log
  const inputHash = createHash("sha256").update(`${serializedCode}\n${learnerText}`).digest("hex");
  await appendAudit({
    actor: actor.id,
    action: "assessment_submitted",
    attemptId: attempt.id,
    taskVersion: version.version,
    rubricVersion: rubric.version,
    bankVersion: questions[0]?.bankVersion ?? 1,
    modelName: explanationRuns ? MODEL_NAME : null,
    promptVersion: PROMPT_VERSION,
    inputHash,
    flags: [flagged ? "injection_precheck" : "", scoreConfidence === "low" ? "low_confidence" : ""].filter(Boolean),
    output: {
      task: body.taskSlug,
      competency: task.competency,
      deterministic_passed: deterministicPassed,
      evidence_recorded: evidenceRecorded,
      checks: deterministicChecks,
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    submittedAt: attempt.submitted_at,
    status: "followup_required",
    confidence: scoreConfidence,
    deterministicPassed,
    evidenceRecorded,
    checks: deterministicChecks,
    queryRows,
    queryColumns,
    scores: Object.fromEntries(criterionScores.map((c) => [c.criterion, c.score])),
    questions,
    feedback: deterministicPassed
      ? "Deterministic work-sample checks passed. Reasoning memo recorded and follow-up defense unlocked."
      : "Some deterministic checks did not meet the ground truth specifications.",
  }, { headers: { "cache-control": "private, no-store" } });
}
