import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Security & Privacy: Zero Answer-Key & Hidden Test Leakage", () => {
  it("proves missions public endpoint payload strips hidden tests and answer keys", () => {
    // Audit the missions route implementation
    const routePath = path.resolve(process.cwd(), "src/app/api/missions/route.ts");
    const routeSource = fs.readFileSync(routePath, "utf8");

    // The query must only select non-secret columns
    expect(routeSource).not.toContain("hidden_test_suites");
    expect(routeSource).not.toContain("expected_key_points");
    expect(routeSource).not.toContain("reference_code");
    expect(routeSource).not.toContain("flaw_lines");
  });

  it("proves boss round endpoint payload strips reference implementations and flaw line keys", () => {
    const routePath = path.resolve(process.cwd(), "src/app/api/boss/route.ts");
    const routeSource = fs.readFileSync(routePath, "utf8");

    // Must NOT select or return reference_code, alt_reference_code, flaw_lines, or expected_flaw_key
    expect(routeSource).not.toContain("reference_code,");
    expect(routeSource).not.toContain("alt_reference_code,");
    expect(routeSource).not.toContain("flaw_lines,");
    expect(routeSource).not.toContain("expected_flaw_key,");

    // Verify flawedCode is exposed but secret fields are never returned
    expect(routeSource).toContain("flawed_code");
    expect(routeSource).not.toContain("reference_code");
    expect(routeSource).not.toContain("alt_reference_code");
    expect(routeSource).not.toContain("flaw_lines");
  });

  it("proves assessment submission responses never return raw hidden test inputs or expected values", () => {
    const routePath = path.resolve(process.cwd(), "src/app/api/assessment/submit/route.ts");
    const routeSource = fs.readFileSync(routePath, "utf8");

    // The response must only summarize hidden count and pass status
    expect(routeSource).toContain("hiddenSummary: { passed: hidden.passed === hidden.total, count: hidden.total }");
    expect(routeSource).not.toContain("hiddenCases: hiddenCases");
    expect(routeSource).not.toContain("hiddenTests: hidden");
  });

  it("proves follow-up question prompt payload never includes expected_key_points", () => {
    const routePath = path.resolve(process.cwd(), "src/app/api/assessment/submit/route.ts");
    const routeSource = fs.readFileSync(routePath, "utf8");

    // When questions are mapped to client JSON:
    // questions.map(({ id, question_template, version: bankVersion }, index) => ({ id, position: index + 1, bankVersion, question: question_template }))
    expect(routeSource).not.toContain("keyPoints: item.expected_key_points");
    expect(routeSource).not.toContain("expected_key_points: item.expected_key_points");
  });

  it("proves client-side bundle nextlearn.ts does not export server-only secret keys", () => {
    const clientLibPath = path.resolve(process.cwd(), "src/lib/nextlearn.ts");
    const clientSource = fs.readFileSync(clientLibPath, "utf8");

    // Ensures client mock data does not leak hidden test suites
    expect(clientSource).not.toContain("hiddenCases");
    expect(clientSource).not.toContain("referenceImplementation");
    expect(clientSource).not.toContain("flawLineNumbers");
  });

  it("proves Replay Sanitiser projects ONLY allowlisted fields and strips secrets", async () => {
    const { projectReplayPayload } = await import("@/lib/server/replay-sanitiser");

    const rawPayload = {
      attemptId: "att-123",
      submittedAt: "2026-10-10T12:00:00Z",
      taskTitle: "Find Max Boundary",
      taskVersion: 1,
      rubricVersion: 1,
      inputHash: "sha256-abc",
      visibleTests: [{ title: "Positive array", passed: true }],
      hiddenTotal: 4,
      hiddenPassed: 3,
      optimalityTier: "Tier 1: Linear Time",
      aiCriteria: [
        {
          criterion: "root_cause",
          criterionTitle: "Root-cause identification",
          run1Score: 3,
          run2Score: 3,
          evidenceQuote: "loop skips last element",
          rawReason: "Identified boundary condition correctly.",
          injectionFlag: false,
          ambiguousFlag: false,
        },
      ],
      followups: [
        {
          position: 1,
          gapTags: ["boundary"],
          questionText: "What breaks when max is last?",
          learnerAnswer: "It returns previous max because of i < len - 1",
          score: 2,
          stopRuleOutcome: "Stopped after 1 question because answers were consistent and strong",
        },
      ],
      confidence: {
        level: "high" as const,
        conditionsApplied: ["Dual runs agreed", "Tests passed"],
      },
      finalScores: { root_cause: { score: 3, maxScore: 3 } },
      auditAction: "assessment_submitted",
      auditRecordedAt: "2026-10-10T12:00:01Z",
      secretCorpus: ["the secret key is that values[i] > best fails at end"],
    };

    const projected = projectReplayPayload(rawPayload as any);

    // Verify allowlisted properties exist
    expect(projected).toHaveProperty("attemptId", "att-123");
    expect(projected).toHaveProperty("hiddenSummary");
    expect(projected.hiddenSummary.category).toBe("3 of 4 hidden edge-case checks passed");

    // Verify secret fields NEVER exist in the projected object
    expect(projected).not.toHaveProperty("hiddenCases");
    expect(projected).not.toHaveProperty("testSpec");
    expect(projected).not.toHaveProperty("referenceCode");
    expect(projected).not.toHaveProperty("expectedKeyPoints");
    expect(projected).not.toHaveProperty("secretCorpus");

    // Hidden checks must only have counts and category
    expect(projected.hiddenSummary).toEqual({
      passed: false,
      count: 4,
      category: "3 of 4 hidden edge-case checks passed",
    });
  });

  it("proves Replay Sanitiser redacts reasons that overlap with answer keys or reference solutions", async () => {
    const { sanitizeReasonText, calculateNgramOverlap } = await import("@/lib/server/replay-sanitiser");

    const secretKey = "the exact bug is off by one at values.length minus one which skips final element";
    const leakyReason = "The candidate explained that the exact bug is off by one at values.length minus one which skips final element completely.";

    const overlap = calculateNgramOverlap(leakyReason, secretKey, 3);
    expect(overlap).toBeGreaterThan(0.4);

    const sanitized = sanitizeReasonText(leakyReason, [secretKey], 0.25);
    expect(sanitized).toBe("Reasoning evaluated against rubric descriptors. Technical details summarized for security.");
    expect(sanitized).not.toContain("off by one");
  });

  it("proves Replay Sanitiser truncates reasons to maximum safe character length", async () => {
    const { sanitizeReasonText } = await import("@/lib/server/replay-sanitiser");

    const longReason = "a".repeat(400);
    const sanitized = sanitizeReasonText(longReason, [], 0.25, 250);
    expect(sanitized.length).toBeLessThanOrEqual(250);
  });

  it("proves Recruiter Method Card redacts raw model output and learner text unless submission consent granted", async () => {
    const { buildRecruiterMethodCard } = await import("@/lib/server/replay-sanitiser");

    // Without submission consent
    const cardWithoutConsent = buildRecruiterMethodCard({
      assessmentName: "Find Max",
      taskVersion: 1,
      rubricVersion: 1,
      confidenceLevel: "high",
      aiDisclosure: true,
      flagsRaised: [],
      submissionConsented: false,
      submissionCode: "function findMax() { ... }",
      report: { what_broke: "Loop bound" },
    });

    expect(cardWithoutConsent).not.toHaveProperty("consentedSubmissionText");
    expect(cardWithoutConsent).not.toHaveProperty("consentedReport");
    expect(cardWithoutConsent).toHaveProperty("confidenceDerivation");

    // With explicit submission consent
    const cardWithConsent = buildRecruiterMethodCard({
      assessmentName: "Find Max",
      taskVersion: 1,
      rubricVersion: 1,
      confidenceLevel: "high",
      aiDisclosure: true,
      flagsRaised: [],
      submissionConsented: true,
      submissionCode: "function findMax() { ... }",
      report: { what_broke: "Loop bound" },
    });

    expect(cardWithConsent.consentedSubmissionText).toBe("function findMax() { ... }");
    expect(cardWithConsent.consentedReport?.what_broke).toBe("Loop bound");
  });
});
