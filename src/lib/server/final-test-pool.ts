import "server-only";
import {
  FinalTestQuestionClient,
  FinalTestQuestionServer,
} from "@/lib/final-test-types";
import { dataAnalyticsQuestions } from "@/lib/server/pools/data-analytics-pool";
import { businessAnalyticsQuestions } from "@/lib/server/pools/business-analytics-pool";
import { communicationQuestions } from "@/lib/server/pools/communication-pool";

// Question registry across all 3 learning paths
const questionPools: Record<string, FinalTestQuestionServer[]> = {
  "data-analytics": dataAnalyticsQuestions,
  "business-analytics": businessAnalyticsQuestions,
  "communication": communicationQuestions,
};

/**
 * Returns all available questions in the question bank for a path
 */
export function getAllQuestionsForPath(pathSlug: string): FinalTestQuestionServer[] {
  return questionPools[pathSlug] || [];
}

/**
 * Draws balanced questions for an attempt (8 questions by default, configurable 5-10)
 * Balanced across types and difficulty, in randomised order.
 */
export function getQuestionsForPath(pathSlug: string, count = 8): FinalTestQuestionServer[] {
  const pool = questionPools[pathSlug] || [];
  if (pool.length <= count) {
    return [...pool];
  }

  // Clone pool to avoid mutating state
  const poolCopy = [...pool];

  // Group by type for type balance
  const byType: Record<string, FinalTestQuestionServer[]> = {};
  for (const q of poolCopy) {
    const type = q.client.type;
    if (!byType[type]) byType[type] = [];
    byType[type].push(q);
  }

  const selected: FinalTestQuestionServer[] = [];
  const types = Object.keys(byType);

  // 1. Pick at least 1 from each type group
  for (const t of types) {
    if (selected.length < count && byType[t].length > 0) {
      const randIdx = Math.floor(Math.random() * byType[t].length);
      selected.push(byType[t].splice(randIdx, 1)[0]);
    }
  }

  // 2. Fill remaining slots from unused questions
  const remaining = Object.values(byType).flat();
  while (selected.length < count && remaining.length > 0) {
    const randIdx = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(randIdx, 1)[0]);
  }

  // 3. Shuffle final selection
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

/**
 * Sanitizes a server question into the safe client view.
 * ZERO answer keys, flaw spans, hidden tests, or rubrics ever reach the client.
 */
export function sanitizeQuestionForClient(
  question: FinalTestQuestionServer,
  order: number,
  revealedHints: { tier: "nudge" | "pointer" | "strong"; text: string; deduction: number }[] = []
): FinalTestQuestionClient {
  return {
    ...question.client,
    order,
    revealedHints,
    draftNotice: "Draft: needs human review. Fictional scenarios only.",
  };
}
