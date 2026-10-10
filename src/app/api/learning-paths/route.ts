import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { findLearningModule, learningPassMark, publicLearningPaths, rotateQuestionChoices } from "@/lib/learning-paths";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const attemptSchema = z.object({
  pathSlug: z.string().min(1).max(80),
  moduleSlug: z.string().min(1).max(80),
  responses: z.array(z.number().int().min(0).max(2)).length(3),
});

type StoredAttempt = { score: number; question_count: number; passed: boolean; submitted_at: string };
type ModuleProgress = { passed: boolean; attempts: number; bestScore: number; lastScore: number; lastAttemptAt: string };

function summarize(rows: StoredAttempt[]): ModuleProgress {
  const latest = rows[0];
  return {
    passed: rows.some((row) => row.passed),
    attempts: rows.length,
    bestScore: rows.reduce((best, row) => Math.max(best, row.score), 0),
    lastScore: latest?.score ?? 0,
    lastAttemptAt: latest?.submitted_at ?? "",
  };
}

async function storedProgress(userId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Server-side database access is not configured.");
  const { data, error } = await admin.from("learning_module_attempts")
    .select("path_slug, module_slug, score, question_count, passed, submitted_at")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });
  if (error) throw new Error("Learning progress could not be loaded.");
  const progress: Record<string, ModuleProgress> = {};
  for (const row of data ?? []) {
    const key = `${row.path_slug}/${row.module_slug}`;
    const existing = progress[key];
    if (!existing) progress[key] = summarize([row]);
    else {
      existing.passed ||= row.passed;
      existing.attempts += 1;
      existing.bestScore = Math.max(existing.bestScore, row.score);
    }
  }
  return progress;
}

export async function GET(request: NextRequest) {
  let progress: Record<string, ModuleProgress> = {};
  if (process.env.NEXT_PUBLIC_BACKEND_MODE === "supabase") {
    const { response, actor } = await requireActor(request, ["learner"]);
    if (response || !actor) return response;
    try { progress = await storedProgress(actor.id); }
    catch (error) { return apiError(error instanceof Error ? error.message : "Learning progress could not be loaded.", 503); }
  }
  return NextResponse.json({ paths: publicLearningPaths(), progress }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  if (process.env.NEXT_PUBLIC_BACKEND_MODE === "supabase") {
    const { response, actor } = await requireActor(request, ["learner"]);
    if (response || !actor) return response;
    userId = actor.id;
    try { if (!await consumeRateLimit(actor.id, "learning-module-attempt", 60, 3600)) return apiError("You have reached the knowledge-check limit. Please try again later.", 429); }
    catch { return apiError("The learning service is temporarily unavailable.", 503); }
  }

  let body: z.infer<typeof attemptSchema>;
  try { body = attemptSchema.parse(await request.json()); }
  catch { return apiError("Submit one answer for each of the three questions."); }
  const found = findLearningModule(body.pathSlug, body.moduleSlug);
  if (!found) return apiError("That learning module could not be found.", 404);
  if (body.responses.length !== found.module.questions.length) return apiError("Answer every question before submitting.");

  const review = found.module.questions.map((question, index) => {
    const correctIndex = rotateQuestionChoices(question).correctIndex;
    return { selectedIndex: body.responses[index], correctIndex, correct: body.responses[index] === correctIndex, explanation: question.explanation };
  });
  const score = review.filter((item) => item.correct).length;
  const passed = score >= learningPassMark;
  const submittedAt = new Date().toISOString();
  let progress: ModuleProgress = { passed, attempts: 1, bestScore: score, lastScore: score, lastAttemptAt: submittedAt };

  if (userId) {
    const admin = createSupabaseAdminClient();
    if (!admin) return apiError("Server-side database access is not configured.", 503);
    const { error } = await admin.from("learning_module_attempts").insert({
      user_id: userId,
      path_slug: body.pathSlug,
      module_slug: body.moduleSlug,
      module_version: 1,
      score,
      question_count: found.module.questions.length,
      responses: body.responses,
      passed,
      submitted_at: submittedAt,
    });
    if (error) return apiError("Your result could not be saved. Please try again.", 503);
    try {
      const allProgress = await storedProgress(userId);
      progress = allProgress[`${body.pathSlug}/${body.moduleSlug}`] ?? progress;
    } catch { /* The immutable attempt is saved; return its result if the progress summary is unavailable. */ }
  }

  return NextResponse.json({ score, questionCount: found.module.questions.length, passMark: learningPassMark, passed, feedback: review, progress });
}
