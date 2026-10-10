import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { appendAudit, apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { hasManipulationFlag, MODEL_NAME, PROMPT_VERSION, SCORING_CONFIGURED, scoreFollowup } from "@/lib/server/gemini";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({ attemptId: z.string().uuid(), questionId: z.string().uuid().optional(), position: z.number().int().min(1).max(3), answer: z.string().max(4000) });
type Question = { id: string; question: string; key: string[]; trigger: string; version: number };

function confidenceFor(values: { runs: number[]; flags: boolean; ambiguous: boolean }[], testsPassed: boolean, runnerFailure: boolean) {
  const differences = values.map((item) => Math.abs(item.runs[0] - item.runs[1]));
  if (runnerFailure || values.some((item) => item.flags || item.ambiguous) || differences.some((value) => value > 1)) return "low";
  if (!testsPassed || differences.some((value) => value === 1) || values.some((item) => item.runs[0] < 2)) return "medium";
  return "high";
}

export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  try { if (!await consumeRateLimit(actor.id, "followup-answer", 30, 3600)) return apiError("You have reached the follow-up submission limit.", 429); }
  catch { return apiError("Assessment service is temporarily unavailable.", 503); }
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await request.json()); }
  catch { return apiError("Provide a valid attempt, question position, and answer."); }

  const { data: attempt } = await admin.from("attempts").select("id, user_id, attempt_type, task_version_id, rubric_id, boss_round_id, explanation_json").eq("id", body.attemptId).maybeSingle();
  if (!attempt || attempt.user_id !== actor.id) return apiError("Assessment attempt was not found.", 404);
  const explanation = attempt.explanation_json as { selected_question_ids?: string[]; gap_tags?: string[]; similarity_review?: boolean; test_summary?: { visible_total?: number; visible_passed?: number; hidden_total?: number; hidden_passed?: number; valid?: boolean }; model_runs?: { root_cause: number; explanation: number; injection_suspected: boolean; ambiguous: boolean }[] };
  const selectedIds = explanation.selected_question_ids ?? [];
  if (body.position > selectedIds.length || body.position !== (await admin.from("followups").select("id", { count: "exact", head: true }).eq("attempt_id", attempt.id)).count! + 1) return apiError("Follow-up questions must be answered in order.", 409);
  const expectedId = selectedIds[body.position - 1];
  if (body.questionId && body.questionId !== expectedId) return apiError("Question does not belong to this assessment.", 400);

  let question: Question;
  if (attempt.attempt_type === "boss") {
    if (!attempt.boss_round_id) return apiError("Boss assessment is incomplete.", 503);
    const { data: boss } = await admin.from("boss_rounds").select("version, followup_bank").eq("id", attempt.boss_round_id).maybeSingle();
    const bank = Array.isArray(boss?.followup_bank) ? boss.followup_bank as { id?: string; trigger?: string; question?: string; key?: string[] }[] : [];
    const item = bank.find((entry) => entry.id === expectedId);
    if (!item?.question || !Array.isArray(item.key)) return apiError("Boss follow-up question is unavailable.", 503);
    question = { id: expectedId, question: item.question, key: item.key, trigger: item.trigger ?? "always", version: boss?.version ?? 1 };
  } else {
    const { data: bank } = await admin.from("followup_bank").select("id, version, question_template, expected_key_points, trigger_json").eq("id", expectedId).maybeSingle();
    if (!bank) return apiError("Follow-up question is unavailable.", 503);
    question = { id: bank.id, question: bank.question_template, key: bank.expected_key_points as string[], trigger: JSON.stringify(bank.trigger_json), version: bank.version };
  }

  const flagged = hasManipulationFlag(body.answer);
  let runs: { score: number; evidence_quote: string; reason: string; injection_suspected: boolean; ambiguous: boolean }[] = [];
  let modelError = false;
  if (SCORING_CONFIGURED) {
    try {
      const result = await scoreFollowup({ question: question.question, keyPoints: question.key, learnerText: body.answer });
      runs = [...result.runs];
    } catch { modelError = true; }
  } else modelError = true;
  const scores = runs.map((run) => run.score);
  const finalScore = runs.length === 2 ? Math.min(...scores) : 0;
  const answerFlags = flagged || runs.some((run) => run.injection_suspected);
  const ambiguous = runs.some((run) => run.ambiguous);

  const { data: bossRow } = attempt.attempt_type === "boss" && attempt.boss_round_id
    ? await admin.from("boss_rounds").select("version, language").eq("id", attempt.boss_round_id).maybeSingle()
    : { data: null };
  const taskBank = attempt.task_version_id
    ? await admin.from("task_versions").select("version, task_id").eq("id", attempt.task_version_id).maybeSingle()
    : { data: null };
  const taskId = taskBank.data?.task_id ?? null;
  const bankVersion = question.version;
  const { error: saveAnswerError } = await admin.from("followups").insert({
    attempt_id: attempt.id, bank_id: attempt.attempt_type === "mission" ? expectedId : null,
    bank_version: bankVersion, position: body.position, gap_tags: [...(explanation.gap_tags ?? []), ...(answerFlags ? ["injection_precheck"] : []), ...(modelError ? ["grader_unavailable"] : [])],
    question_shown: question.question, answer_text: body.answer,
    score: finalScore, ai_reason: runs[0]?.reason ?? "AI unavailable; sent for human review.",
    evidence_quote: runs[0]?.evidence_quote ?? "", run_scores: scores, answered_at: new Date().toISOString(),
  });
  if (saveAnswerError) return apiError("The answer could not be saved.", 503);

  if (runs && runs.length === 2) {
    try {
      await admin.from("grader_runs").insert([
        {
          attempt_id: attempt.id,
          run_no: 1,
          run_type: "followup",
          model_name: MODEL_NAME,
          prompt_version: PROMPT_VERSION,
          rubric_version: bankVersion,
          output_json: runs[0],
        },
        {
          attempt_id: attempt.id,
          run_no: 2,
          run_type: "followup",
          model_name: MODEL_NAME,
          prompt_version: PROMPT_VERSION,
          rubric_version: bankVersion,
          output_json: runs[1],
        },
      ]);
    } catch {}
  }

  const questionRun = { runs: scores.length === 2 ? scores : [0, 0], flags: answerFlags || modelError, ambiguous };
  const previousResult = await admin.from("followups").select("score, run_scores, ai_reason, gap_tags").eq("attempt_id", attempt.id).lt("position", body.position).order("position");
  const previousRuns = (previousResult.data ?? []).map((row) => {
    const previousScores = row.run_scores as number[] | null;
    const gapTags = row.gap_tags as string[];
    return { runs: previousScores?.length === 2 ? previousScores : [0, 0], flags: gapTags.includes("injection_precheck") || gapTags.includes("grader_unavailable"), ambiguous: false };
  });
  const allRuns = [...previousRuns, questionRun];
  const previousAllStrong = previousRuns.every((item) => item.runs[0] === 2 && item.runs[1] === 2 && !item.flags);
  const allCurrentStrong = questionRun.runs[0] === 2 && questionRun.runs[1] === 2 && !questionRun.flags && !questionRun.ambiguous;
  const stopEarly = previousAllStrong && allCurrentStrong;
  const nextPosition = body.position + 1;
  const nextId = selectedIds[nextPosition - 1];
  if (!stopEarly && nextId) {
    if (attempt.attempt_type === "boss" && attempt.boss_round_id) {
      const { data: boss } = await admin.from("boss_rounds").select("followup_bank").eq("id", attempt.boss_round_id).maybeSingle();
      const item = (boss?.followup_bank as { id?: string; question?: string }[] | null)?.find((entry) => entry.id === nextId);
      if (!item) return apiError("Next follow-up question is unavailable.", 503);
      return NextResponse.json({ complete: false, nextQuestion: { id: nextId, position: nextPosition, question: item.question } });
    }
    const { data: item } = await admin.from("followup_bank").select("id, version, question_template").eq("id", nextId).maybeSingle();
    if (!item) return apiError("Next follow-up question is unavailable.", 503);
    return NextResponse.json({ complete: false, nextQuestion: { id: item.id, position: nextPosition, bankVersion: item.version, question: item.question_template } });
  }

  const answerRows = [...(previousResult.data ?? []), { score: finalScore, run_scores: scores }];
  const followupMean = answerRows.length ? answerRows.reduce((sum, row) => sum + (row.score ?? 0), 0) / answerRows.length : 0;
  const testSummary = explanation.test_summary;
  const testsPassed = attempt.attempt_type === "boss"
    ? Boolean(testSummary?.valid)
    : Boolean(testSummary && testSummary.visible_passed === testSummary.visible_total && testSummary.hidden_passed === testSummary.hidden_total);
  const explanationPair = explanation.model_runs ?? [];
  const analysisRuns = explanationPair.length === 2 ? [
    { runs: [explanationPair[0].root_cause, explanationPair[1].root_cause], flags: explanationPair.some((run) => run.injection_suspected), ambiguous: explanationPair.some((run) => run.ambiguous) },
    { runs: [explanationPair[0].explanation, explanationPair[1].explanation], flags: explanationPair.some((run) => run.injection_suspected), ambiguous: explanationPair.some((run) => run.ambiguous) },
  ] : [{ runs: [0, 0], flags: true, ambiguous: true }];
  const finalConfidence = modelError ? "low" : confidenceFor([...analysisRuns, ...allRuns], testsPassed, false);
  const followupScore = attempt.attempt_type === "boss" ? Math.round(followupMean * 10) / 10 : followupMean;
  const followupMax = attempt.attempt_type === "boss" ? 20 : 2;
  const { error: finalScoreError } = await admin.from("criterion_scores").insert({
    attempt_id: attempt.id, criterion: "followup_reasoning", score: followupScore,
    max_score: followupMax, source: "followups", feedback: `${answerRows.length} answer(s) averaged equally; question count does not affect the score.`, confidence: finalConfidence,
    run_scores: answerRows.flatMap((row) => (row.run_scores as number[] | null) ?? []),
  });
  if (finalScoreError) return apiError("Answers were saved but the final score record could not be completed.", 503);

  const similarityReview = explanation.similarity_review === true;
  const effectiveConfidence = answerFlags || flagged || modelError || similarityReview ? "low" : finalConfidence;
  const isBoss = attempt.attempt_type === "boss";
  const skill = isBoss ? "reviewing-ai-written-code" : "debugging";
  const language = isBoss ? bossRow?.language ?? "JavaScript"
    : taskBank.data && taskId
      ? (await admin.from("tasks").select("language").eq("id", taskId).maybeSingle()).data?.language ?? "JavaScript"
      : "JavaScript";
  const priorEvidence = await admin.from("evidence").select("attempt_id").eq("user_id", actor.id).eq("skill", skill).eq("language", language).neq("level", "insufficient");
  const priorAttemptIds = (priorEvidence.data ?? []).map((item) => item.attempt_id);
  const priorAttempts = priorAttemptIds.length
    ? await admin.from("attempts").select("id, attempt_type, task_version_id, boss_round_id").in("id", priorAttemptIds)
    : { data: [] };
  const priorVersionIds = (priorAttempts.data ?? []).map((item) => item.task_version_id).filter(Boolean);
  const priorVersions = priorVersionIds.length
    ? await admin.from("task_versions").select("task_id").in("id", priorVersionIds)
    : { data: [] };
  const distinctTaskIds = new Set((priorVersions.data ?? []).map((item) => item.task_id));
  if (!isBoss && taskId) distinctTaskIds.add(taskId);
  const distinctBossRounds = new Set((priorAttempts.data ?? []).filter((item) => item.attempt_type === "boss").map((item) => item.boss_round_id));
  const sampleCount = isBoss ? distinctBossRounds.size + 1 : distinctTaskIds.size;
  const scoreRows = await admin.from("criterion_scores").select("criterion, score, max_score").eq("attempt_id", attempt.id).order("created_at");
  const scored = new Map<string, { score: number; max: number }>();
  for (const row of scoreRows.data ?? []) scored.set(row.criterion, { score: Number(row.score), max: Number(row.max_score) });
  let composite = 0;
  let reasoningReady = false;
  if (isBoss) {
    const weights: Record<string, number> = { failing_test: 40, flaw_located: 15, flaw_explanation: 25, followup_reasoning: 20 };
    composite = Object.entries(weights).reduce((sum, [criterion, weight]) => sum + weight * (scored.get(criterion)?.score ?? 0) / (scored.get(criterion)?.max ?? weight), 0);
    reasoningReady = (scored.get("flaw_explanation")?.score ?? 0) >= 17;
  } else if (attempt.rubric_id) {
    const { data: rubricRow } = await admin.from("rubrics").select("criteria_json").eq("id", attempt.rubric_id).maybeSingle();
    const criteria = (rubricRow?.criteria_json as { criteria?: { id: string; weight: number }[] } | null)?.criteria ?? [];
    const totalWeight = criteria.reduce((sum, item) => sum + item.weight, 0);
    composite = totalWeight ? criteria.reduce((sum, item) => sum + item.weight * (scored.get(item.id)?.score ?? 0) / (scored.get(item.id)?.max ?? 1), 0) / totalWeight * 100 : 0;
    reasoningReady = (scored.get("root_cause")?.score ?? 0) >= 2 && (scored.get("explanation")?.score ?? 0) >= 1;
  }
  const activeAppeal = await admin.from("appeals").select("id").eq("attempt_id", attempt.id).in("status", ["open", "in_review"]).limit(1);
  const eligible = testsPassed && reasoningReady && effectiveConfidence !== "low" && !activeAppeal.data?.length;
  const level = !eligible ? "insufficient" : !isBoss && sampleCount < 2 ? "beginner" : composite >= 85 ? "advanced" : composite >= 70 ? "proficient" : composite >= 50 ? "developing" : "beginner";
  const { data: evidence, error: evidenceError } = await admin.from("evidence").insert({
    attempt_id: attempt.id, user_id: actor.id, skill, language, level, confidence: effectiveConfidence,
  }).select("id, skill, language, level, confidence, assessed_at").single();
  if (evidenceError) return apiError("Answers were saved, but the evidence card could not be finalized.", 503);

  await appendAudit({
    actor: actor.id, action: "followup_answered", attemptId: attempt.id,
    taskVersion: taskBank.data?.version ?? null, bankVersion, modelName: runs.length ? MODEL_NAME : null,
    promptVersion: PROMPT_VERSION, flags: [answerFlags ? "injection_precheck" : "", similarityReview ? "near_identical_submission" : "", modelError ? "grading_provider_unavailable" : "", effectiveConfidence === "low" ? "low_confidence" : ""].filter(Boolean),
    output: { followup_scores: scores, final_score: finalScore, followup_mean: followupMean, confidence: effectiveConfidence, question_count: answerRows.length, early_stop: stopEarly, similarity_review: similarityReview },
  });
  return NextResponse.json({ complete: true, earlyStop: stopEarly, evidence, confidence: effectiveConfidence, followupScore, score: finalScore, taskId });
}
