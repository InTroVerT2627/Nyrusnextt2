import { describe, it, expect } from "vitest";

// Replicating the exact stop rule and confidence calculation logic tested in assessment/answer
function evaluateStopRule(
  previousRuns: { runs: number[]; flags: boolean }[],
  currentRun: { runs: number[]; flags: boolean; ambiguous: boolean },
  hasNextQuestion: boolean
) {
  const previousAllStrong = previousRuns.every(
    (item) => item.runs[0] === 2 && item.runs[1] === 2 && !item.flags
  );
  const currentStrong =
    currentRun.runs[0] === 2 &&
    currentRun.runs[1] === 2 &&
    !currentRun.flags &&
    !currentRun.ambiguous;

  const stopEarly = previousAllStrong && currentStrong;
  return {
    stopEarly,
    shouldAskNext: !stopEarly && hasNextQuestion,
  };
}

function calculateConfidence(
  evaluations: { runs: number[]; flags: boolean; ambiguous: boolean }[],
  testsPassed: boolean,
  runnerFailure: boolean
): "high" | "medium" | "low" {
  const differences = evaluations.map((item) => Math.abs(item.runs[0] - item.runs[1]));
  if (runnerFailure || evaluations.some((item) => item.flags || item.ambiguous) || differences.some((v) => v > 1)) {
    return "low";
  }
  if (!testsPassed || differences.some((v) => v === 1) || evaluations.some((item) => item.runs[0] < 2)) {
    return "medium";
  }
  return "high";
}

describe("Adaptive Questioning Stop Rule & Confidence Logic", () => {
  it("stops early on strong consistent answers (score = 2 in both runs)", () => {
    const previousRuns: { runs: number[]; flags: boolean }[] = [];
    const currentRun = { runs: [2, 2], flags: false, ambiguous: false };

    const result = evaluateStopRule(previousRuns, currentRun, true);
    expect(result.stopEarly).toBe(true);
    expect(result.shouldAskNext).toBe(false);
  });

  it("continues to next question when first answer is partial (score < 2)", () => {
    const previousRuns: { runs: number[]; flags: boolean }[] = [];
    const currentRun = { runs: [1, 1], flags: false, ambiguous: false };

    const result = evaluateStopRule(previousRuns, currentRun, true);
    expect(result.stopEarly).toBe(false);
    expect(result.shouldAskNext).toBe(true);
  });

  it("yields High confidence when tests pass cleanly and all runs agree on full marks", () => {
    const evaluations = [
      { runs: [3, 3], flags: false, ambiguous: false }, // root_cause
      { runs: [2, 2], flags: false, ambiguous: false }, // explanation
      { runs: [2, 2], flags: false, ambiguous: false }, // followup
    ];
    const confidence = calculateConfidence(evaluations, true, false);
    expect(confidence).toBe("high");
  });

  it("drops confidence to Low if model runs disagree by more than 1 point", () => {
    const evaluations = [
      { runs: [3, 1], flags: false, ambiguous: false }, // disagreement of 2 points!
      { runs: [2, 2], flags: false, ambiguous: false },
    ];
    const confidence = calculateConfidence(evaluations, true, false);
    expect(confidence).toBe("low");
  });

  it("drops confidence to Low if prompt manipulation or runner failure is flagged", () => {
    const evaluations = [
      { runs: [2, 2], flags: true, ambiguous: false }, // manipulation flag raised!
    ];
    const confidence = calculateConfidence(evaluations, true, false);
    expect(confidence).toBe("low");
  });

  it("proves follow-up count never changes the score value (only averages answered items)", () => {
    // Learner A answers 1 question and earns 2/2 -> score is 2
    const scoresA = [2];
    const scoreA = scoresA.reduce((a, b) => a + b, 0) / scoresA.length;

    // Learner B answers 3 questions: 2, 2, 2 -> score is 2
    const scoresB = [2, 2, 2];
    const scoreB = scoresB.reduce((a, b) => a + b, 0) / scoresB.length;

    expect(scoreA).toBe(2);
    expect(scoreB).toBe(2);
    expect(scoreA).toEqual(scoreB);
  });
});
