import { createHash } from "node:crypto";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { appendAudit, apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { executeSource } from "@/lib/server/judge0";
import { MODEL_NAME, PROMPT_VERSION, SCORING_CONFIGURED, hasManipulationFlag, scoreExplanation } from "@/lib/server/gemini";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { evidencedDebuggingSlugs } from "@/lib/server/progression";

export const runtime = "nodejs";
export const maxDuration = 60;
const schema = z.object({ decision: z.enum(["accept", "reject"]), flaggedLines: z.array(z.number().int().min(1).max(20)).max(20), testCode: z.string().max(4000), explanation: z.string().max(3000) });
const bossAssertions = (text: string) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 1 || lines.length > 5) return null;
  const result: { input: string; expected: number }[] = [];
  for (const line of lines) {
    const match = line.match(/^assertWords\(\s*("(?:[^"\\]|\\.)*")\s*,\s*(\d+)\s*\)\s*;?$/);
    if (!match) return null;
    let input: unknown;
    try { input = JSON.parse(match[1]); } catch { return null; }
    if (typeof input !== "string" || input.length > 200) return null;
    result.push({ input, expected: Number(match[2]) });
  }
  return result;
};

function makeBossProgram(implementation: string) {
  return `const fs=require('node:fs');\nconst countWords=(${implementation});\nconst tests=JSON.parse(fs.readFileSync(0,'utf8'));\ntry { for (const t of tests) { if (countWords(t.input) !== t.expected) throw new Error(); } process.stdout.write('PASS'); } catch { process.stdout.write('FAIL'); }`;
}

async function runVariant(implementation: string, tests: { input: string; expected: number }[]) {
  const result = await executeSource("JavaScript", makeBossProgram(implementation), JSON.stringify(tests));
  if (result.statusId !== 3 || result.exitCode !== 0) throw new Error("Boss test runner failed.");
  return result.stdout.trim() === "PASS";
}

export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  try { if (!await consumeRateLimit(actor.id, "boss-submit", 5, 3600)) return apiError("You have reached the boss-round submission limit.", 429); }
  catch { return apiError("Assessment service is temporarily unavailable.", 503); }
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await request.json()); }
  catch { return apiError("Provide a review decision, line selections, test assertions, and explanation."); }
  const tests = body.decision === "reject" ? bossAssertions(body.testCode) : [];
  if (body.decision === "reject" && !tests) return apiError('Use one to five assertions in the form: assertWords("  red   blue ", 2);');
  let unlockedNodes: Set<string>;
  try { unlockedNodes = await evidencedDebuggingSlugs(admin, actor.id); }
  catch { return apiError("Could not evaluate skill progression.", 503); }
  if (unlockedNodes.size < 3) return apiError("Complete three debugging skill nodes before submitting the boss round.", 403);
  const { data: boss } = await admin.from("boss_rounds").select("id, version, language, flawed_code, flaw_lines, reference_code, alt_reference_code, expected_flaw_key, followup_bank").eq("slug", "catch-the-ai-mistake").maybeSingle();
  if (!boss) return apiError("Boss round is not configured.", 503);
  const assertionCases = tests ?? [];
  let flawed = false, reference = false, alternate = false;
  try {
    [flawed, reference, alternate] = await Promise.all([
      runVariant(boss.flawed_code, assertionCases),
      runVariant(boss.reference_code, assertionCases),
      runVariant(boss.alt_reference_code, assertionCases),
    ]);
  } catch { return apiError("Boss code runner failed. No test score was recorded; the attempt needs review.", 503); }
  const validTests = body.decision === "reject" && !flawed && reference && alternate;
  const flawLines = boss.flaw_lines as number[];
  const flawLocated = body.flaggedLines.some((line) => flawLines.includes(line));
  const learnerText = body.explanation.slice(0, 3000);
  const flagged = hasManipulationFlag(`${body.testCode}\n${learnerText}`);
  let runs: Awaited<ReturnType<typeof scoreExplanation>>["runs"] | null = null;
  if (SCORING_CONFIGURED) {
    try {
      const scored = await scoreExplanation({ prompt: "Explain the failure in the AI-generated patch.", reference: JSON.stringify(boss.expected_flaw_key), rubric: { flaw_explanation: "Names the wrong behavior and an input that triggers it." }, learnerText });
      runs = scored.runs;
    } catch { runs = null; }
  }
  const score = runs ? Math.min(...runs.map((run) => run.root_cause)) : 0;
  const bank = boss.followup_bank as { id: string; trigger: string; question: string; key: string[] }[];
  const selected = bank.filter((entry) => entry.trigger === "always" || (body.decision === "accept" && entry.trigger === "accepted_patch") || (assertionCases.length === 1 && entry.trigger === "test_is_narrow")).slice(0, 2);
  const selectedIds = selected.map((item) => item.id);
  const needsReview = flagged || !runs || runs.some((run) => run.ambiguous || run.injection_suspected || run.root_cause < 2) || Math.abs((runs?.[0].root_cause ?? 0) - (runs?.[1].root_cause ?? 0)) > 1;
  const { data: attempt, error } = await admin.from("attempts").insert({
    user_id: actor.id, boss_round_id: boss.id, attempt_type: "boss", code: body.testCode, ai_disclosure: false,
    explanation_json: { decision: body.decision, flagged_lines: body.flaggedLines, explanation: body.explanation, selected_question_ids: selectedIds, gap_tags: flagged ? ["injection_precheck"] : [], model_runs: runs, test_summary: { valid: validTests } },
  }).select("id, submitted_at").single();
  if (error || !attempt) return apiError("Boss attempt could not be saved.", 503);
  const criteria = [
    { criterion: "failing_test", score: validTests ? 40 : 0, max_score: 40, source: "test", feedback: validTests ? "The assertions fail on the AI patch and pass on both independent correct implementations." : "The assertions did not meet the three-version validation rule.", confidence: "high" },
    { criterion: "flaw_located", score: flawLocated ? 15 : 0, max_score: 15, source: "test", feedback: flawLocated ? "The patch line containing the flawed behavior was selected." : "The flawed line was not selected.", confidence: "high" },
    { criterion: "flaw_explanation", score: runs ? Math.round(score * 25 / 3) : 0, max_score: 25, source: "ai", feedback: runs?.[0].reason ?? "AI scoring is unavailable; human review is required.", confidence: needsReview ? "low" : "medium", run_scores: runs?.map((run) => Math.round(run.root_cause * 25 / 3)) ?? [] },
  ];
  const { error: scoreError } = await admin.from("criterion_scores").insert(criteria.map((item) => ({ ...item, attempt_id: attempt.id })));
  if (scoreError) return apiError("Boss attempt saved but rubric results could not be finalized.", 503);
  const { error: submissionError } = await admin.from("boss_submissions").insert({
    attempt_id: attempt.id, decision: body.decision, flagged_lines: body.flaggedLines, test_code: body.testCode,
    fails_on_flawed: body.decision === "reject" ? !flawed : false, passes_on_reference: body.decision === "reject" ? reference : false,
    passes_on_alt: body.decision === "reject" ? alternate : false,
    check_results: { valid_tests: validTests, flaw_located: flawLocated },
  });
  if (submissionError) return apiError("Boss results could not be persisted.", 503);
  const inputHash = createHash("sha256").update(`${body.testCode}\n${learnerText}`).digest("hex");
  await appendAudit({ actor: actor.id, action: "boss_attempt_submitted", attemptId: attempt.id, bankVersion: boss.version, modelName: runs ? MODEL_NAME : null, promptVersion: PROMPT_VERSION, inputHash, flags: [flagged ? "injection_precheck" : "", needsReview ? "low_confidence" : ""].filter(Boolean), output: { variant_checks: { flawed_passed: flawed, reference_passed: reference, alternate_passed: alternate }, flaw_located: flawLocated, explanation_runs: runs } });
  return NextResponse.json({ attemptId: attempt.id, submittedAt: attempt.submitted_at, confidence: needsReview ? "low" : "medium", scores: { failing_test: validTests ? 40 : 0, flaw_located: flawLocated ? 15 : 0, flaw_explanation: runs ? Math.round(score * 25 / 3) : 0 }, checks: { failsOnFlawed: body.decision === "reject" && !flawed, passesOnReference: body.decision === "reject" && reference, passesOnAlternate: body.decision === "reject" && alternate }, status: runs ? "followup_required" : "review_required", questions: selected.map((item, index) => ({ id: item.id, position: index + 1, question: item.question })) }, { status: 201 });
}
