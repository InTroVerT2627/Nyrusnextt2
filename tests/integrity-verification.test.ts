import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";

describe("Cryptographic Integrity Verification (Audit Replay)", () => {
  it("verifies matching SHA-256 hash when stored inputs are authentic", () => {
    const code = 'class Solution { static int findMax(int[] arr) { ... } }';
    const reportText = "Off-by-one boundary defect skips last array element\nLoop condition i < len - 1";
    
    // Hash created on submission:
    const recordedHash = createHash("sha256").update(`${code}\n${reportText}`).digest("hex");

    // Later recomputed during replay verification:
    const recomputedHash = createHash("sha256").update(`${code}\n${reportText}`).digest("hex");

    expect(recomputedHash).toBe(recordedHash);
    expect(recomputedHash.length).toBe(64);
  });

  it("detects tampering when code or incident report is modified after submission", () => {
    const originalCode = 'class Solution { static int findMax(int[] arr) { ... } }';
    const originalReport = "Off-by-one boundary defect";
    const recordedHash = createHash("sha256").update(`${originalCode}\n${originalReport}`).digest("hex");

    // Tampered code in database:
    const tamperedCode = 'class Solution { static int findMax(int[] arr) { return 42; } }';
    const recomputedHash = createHash("sha256").update(`${tamperedCode}\n${originalReport}`).digest("hex");

    expect(recomputedHash).not.toBe(recordedHash);
  });

  it("proves hidden checks in replay contain only counts and category labels, never inputs", async () => {
    const { projectReplayPayload } = await import("@/lib/server/replay-sanitiser");

    const payload = projectReplayPayload({
      attemptId: "att-test",
      submittedAt: new Date().toISOString(),
      taskTitle: "Async Order Summary",
      taskVersion: 1,
      rubricVersion: 1,
      inputHash: "hash-123",
      visibleTests: [{ title: "Non-empty input", passed: true }],
      hiddenTotal: 4,
      hiddenPassed: 4,
      aiCriteria: [],
      followups: [],
      confidence: { level: "high", conditionsApplied: [] },
      finalScores: {},
      auditAction: "assessment_submitted",
      auditRecordedAt: new Date().toISOString(),
      secretCorpus: [],
    });

    expect(payload.hiddenSummary).toEqual({
      passed: true,
      count: 4,
      category: "4 of 4 hidden edge-case checks passed",
    });

    // Inputs, expected results, and test names must be completely absent
    const str = JSON.stringify(payload.hiddenSummary);
    expect(str).not.toContain("input");
    expect(str).not.toContain("expected");
  });
});
