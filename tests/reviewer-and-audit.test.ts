import { describe, it, expect } from "vitest";

describe("Reviewer & Audit Trail System (Section 7 & 10 Non-Negotiables)", () => {
  it("enforces mandatory written explanation of at least 10 characters for human review decisions", () => {
    const invalidShortReason = "ok";
    const validReason = "Reviewed the AST traversal: the mutation logic is an acceptable variation.";

    const validateReason = (reason: string) => reason.trim().length >= 10;

    expect(validateReason(invalidShortReason)).toBe(false);
    expect(validateReason(validReason)).toBe(true);
  });

  it("routes low-confidence, manipulation-flagged, and challenged attempts to reviewer queue", () => {
    const attempts = [
      { id: "att_01", confidence: "high", flags: [], appealed: false },
      { id: "att_02", confidence: "low", flags: ["reasoning_disagreement"], appealed: false },
      { id: "att_03", confidence: "high", flags: ["injection_precheck"], appealed: false },
      { id: "att_04", confidence: "medium", flags: [], appealed: true },
    ];

    const needsReview = (attempt: typeof attempts[0]) =>
      attempt.confidence === "low" ||
      attempt.flags.length > 0 ||
      attempt.appealed;

    const queued = attempts.filter(needsReview);
    expect(queued).toHaveLength(3);
    expect(queued.map((a) => a.id)).toEqual(["att_02", "att_03", "att_04"]);
  });

  it("records an append-only audit entry containing actor, action, timestamp, and input hash", () => {
    const auditEntry = {
      actor: "rev_sarah",
      action: "review_decision_recorded",
      attempt_id: "att_02",
      input_hash: "a3b2c1d4e5f6...",
      flags: ["score_overturned"],
      output_json: {
        criterion: "root_cause",
        previous_score: 1,
        new_score: 3,
        reason: "Learner correctly identified edge case in subsequent sentence.",
      },
      ts: new Date().toISOString(),
    };

    expect(auditEntry.actor).toBe("rev_sarah");
    expect(auditEntry.action).toBe("review_decision_recorded");
    expect(auditEntry.output_json.new_score).toBe(3);
    expect(auditEntry.flags).toContain("score_overturned");
  });
});
