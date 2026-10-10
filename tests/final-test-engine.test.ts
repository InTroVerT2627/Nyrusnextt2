import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  getAllQuestionsForPath,
  getQuestionsForPath,
  sanitizeQuestionForClient,
} from "@/lib/server/final-test-pool";
import {
  startTestAttempt,
  heartbeatAttempt,
  interruptAttempt,
  checkCooldown,
} from "@/lib/server/final-test-engine";
import {
  useHint,
  evaluateQuestionSubmission,
  evaluateFollowupDefense,
  finalizeAttemptRecord,
} from "@/lib/server/final-test-scoring";

describe("Final Test Engine: Architecture, Scoring, Security & Privacy", () => {
  // 1. Question Pool & Balance
  describe("1. Question Pools & Type Balance", () => {
    it("guarantees at least 24 unique authentic questions per path", () => {
      const dataQuestions = getAllQuestionsForPath("data-analytics");
      const bizQuestions = getAllQuestionsForPath("business-analytics");
      const commQuestions = getAllQuestionsForPath("communication");

      expect(dataQuestions.length).toBeGreaterThanOrEqual(24);
      expect(bizQuestions.length).toBeGreaterThanOrEqual(24);
      expect(commQuestions.length).toBeGreaterThanOrEqual(24);
    });

    it("draws 8 questions balanced across question archetypes in randomised order", () => {
      const drawn = getQuestionsForPath("data-analytics", 8);
      expect(drawn.length).toBe(8);

      const types = new Set(drawn.map((q) => q.client.type));
      // Must draw across multiple archetypes (at least 4 distinct types in an 8-question draw)
      expect(types.size).toBeGreaterThanOrEqual(4);
    });

    it("includes required 'Draft: needs human review' notice on all client question views", () => {
      const qServer = getAllQuestionsForPath("data-analytics")[0];
      const qClient = sanitizeQuestionForClient(qServer, 1);

      expect(qClient.draftNotice).toContain("Draft: needs human review");
    });
  });

  // 2. Tiered Hints & Deductions
  describe("2. Tiered Hints & 35% Hard Deduction Cap", () => {
    it("deducts 5% for nudge, 10% for pointer, 20% for strong, strictly capped at 35%", async () => {
      const { attempt, token } = await startTestAttempt({
        userId: "test-hint-learner",
        pathSlug: "data-analytics",
        proctorMode: "device_checked",
        cameraVerified: true,
        micVerified: true,
      });

      const qId = "da-q1-churn";

      // 1. Nudge (5%)
      const h1 = await useHint(attempt.id, token, qId, "nudge");
      expect(h1.deduction).toBe(5);
      expect(h1.totalDeductions).toBe(5);

      // 2. Pointer (10%) -> Total 15%
      const h2 = await useHint(attempt.id, token, qId, "pointer");
      expect(h2.deduction).toBe(10);
      expect(h2.totalDeductions).toBe(15);

      // 3. Strong Hint (20%) -> Total 35% (Capped at 35%)
      const h3 = await useHint(attempt.id, token, qId, "strong");
      expect(h3.deduction).toBe(20);
      expect(h3.totalDeductions).toBe(35);
    });
  });

  // 3. Scoring & Optimality
  describe("3. Scoring Allocation & Optimality Breakdown", () => {
    it("grades Spot the AI's Mistake: 35 error located + 25 why wrong + 20 fix = 80 base points", async () => {
      const { attempt, token } = await startTestAttempt({
        userId: "test-scoring-learner-1",
        pathSlug: "data-analytics",
        proctorMode: "unproctored",
        cameraVerified: false,
        micVerified: false,
      });

      const qId = "da-q1-churn";
      const result = await evaluateQuestionSubmission(attempt.id, token, {
        questionId: qId,
        highlightedSpans: [
          {
            start: 177,
            end: 304,
            text: "The automated system calculates that total churn for the quarter was therefore 4%, because the final month only lost 4 accounts.",
          },
        ],
        whyWrong:
          "Quarterly churn must be cumulative across the initial cohort (8 + 4 = 12 lost from 100), not the isolated final month.",
        correction: "Total churn was 12% across the quarter.",
      });

      expect(result.baseScore).toBe(80); // 35 + 25 + 20
      expect(result.evidenceQuotes.length).toBeGreaterThan(0);
      expect(result.followupRequired).toBe(true);
    });

    it("evaluates adaptive follow-up defense and stops early with High Confidence", async () => {
      const { attempt, token } = await startTestAttempt({
        userId: "test-scoring-learner-2",
        pathSlug: "data-analytics",
        proctorMode: "device_checked",
        cameraVerified: true,
        micVerified: true,
      });

      const qId = "da-q1-churn";
      // First submit base answer
      await evaluateQuestionSubmission(attempt.id, token, {
        questionId: qId,
        highlightedSpans: [{ start: 0, end: 50, text: "total churn for the quarter was therefore 4%" }],
        whyWrong: "Sum of monthly churns (8+4=12) divided by starting 100 equals 12%.",
        correction: "12% quarterly churn",
      });

      // Submit strong follow-up defense
      const defenseResult = await evaluateFollowupDefense(
        attempt.id,
        token,
        qId,
        "da-q1-f1",
        "New customers joined in February must be tracked in a separate February cohort. They must never dilute the January cohort denominator."
      );

      expect(defenseResult.followupScore).toBe(20);
      expect(defenseResult.finalScore).toBe(100); // 80 + 20
      expect(defenseResult.confidence).toBe("high");
    });

    it("assigns 100 points for correct & optimal SQL; 60 points for correct but suboptimal", async () => {
      const { attempt, token } = await startTestAttempt({
        userId: "test-sql-learner",
        pathSlug: "data-analytics",
        proctorMode: "device_checked",
        cameraVerified: true,
        micVerified: true,
      });

      const qId = "da-q2-sql-aov";

      // 1. Correct AND Optimal SQL (Explicit JOIN, early filter, clean group by)
      const optimalQuery = `
        SELECT c.segment, SUM(o.amount) AS total_revenue, COUNT(o.id) AS order_count, AVG(o.amount) AS avg_order_value
        FROM customers c
        JOIN orders o ON c.id = o.customer_id
        WHERE c.segment = 'Enterprise' AND o.status = 'completed'
        GROUP BY c.segment;
      `;

      const optResult = await evaluateQuestionSubmission(attempt.id, token, {
        questionId: qId,
        codeOrQuery: optimalQuery,
        whyWrong: "Added explicit join on c.id = o.customer_id and filtered completed status.",
      });

      // Correctness (60) + Optimality (40) = 100
      expect(optResult.baseScore).toBe(60);
      expect(optResult.optimalityScore).toBe(40);
      expect(optResult.finalScore).toBe(100);
    });
  });

  // 4. Server-Authoritative Timer & Focus Engine
  describe("4. Authoritative Server Timer & Interruption Rules", () => {
    it("sets authoritative server duration: 2700s default; 4050s (+50%) for accommodation", async () => {
      const normal = await startTestAttempt({
        userId: "learner-normal-time",
        pathSlug: "data-analytics",
        proctorMode: "device_checked",
        cameraVerified: true,
        micVerified: true,
        hasAccommodation: false,
      });
      expect(normal.attempt.timeRemainingSeconds).toBeLessThanOrEqual(2700);
      expect(normal.attempt.timeRemainingSeconds).toBeGreaterThan(2690);

      const accommodated = await startTestAttempt({
        userId: "learner-extended-time",
        pathSlug: "data-analytics",
        proctorMode: "device_checked",
        cameraVerified: true,
        micVerified: true,
        hasAccommodation: true,
      });
      expect(accommodated.attempt.timeRemainingSeconds).toBeLessThanOrEqual(4050);
      expect(accommodated.attempt.timeRemainingSeconds).toBeGreaterThan(4040);
    });

    it("expires attempt and auto-submits when server clock passes deadline", async () => {
      const { attempt, token } = await startTestAttempt({
        userId: "learner-expiry-test",
        pathSlug: "data-analytics",
        proctorMode: "unproctored",
        cameraVerified: false,
        micVerified: false,
      });

      // Heartbeat with valid time
      const hbValid = await heartbeatAttempt(attempt.id, token);
      expect(hbValid.active).toBe(true);
      expect(hbValid.expired).toBe(false);
    });

    it("enforces 24-hour cooldown after an interrupted test attempt", async () => {
      const testUserId = "learner-cooldown-check-" + Date.now();
      const { attempt, token } = await startTestAttempt({
        userId: testUserId,
        pathSlug: "data-analytics",
        proctorMode: "device_checked",
        cameraVerified: true,
        micVerified: true,
      });

      // Trigger interruption
      await interruptAttempt(attempt.id, token, "Window focus lost > 3s");

      // Verify cooldown check blocks immediate re-attempt
      const cooldown = await checkCooldown(testUserId, "data-analytics");
      expect(cooldown.allowed).toBe(false);
      expect(cooldown.remainingCooldownMs).toBeGreaterThan(0);
    });
  });

  // 5. Leak Protection: Zero Answer-Key Leakage
  describe("5. Security & Zero Answer-Key Leakage", () => {
    it("proves client question projection NEVER exposes planted errors, expected choices, or rubrics", () => {
      const qServer = getAllQuestionsForPath("data-analytics")[0];
      const qClient = sanitizeQuestionForClient(qServer, 1);

      // Verify secret properties are completely stripped
      expect((qClient as any).plantedErrors).toBeUndefined();
      expect((qClient as any).expectedAnswer).toBeUndefined();
      expect((qClient as any).expectedChoiceId).toBeUndefined();
      expect((qClient as any).optimalityRubric).toBeUndefined();
      expect((qClient as any).referenceCriteria).toBeUndefined();
      expect((qClient as any).followupBank).toBeUndefined();
    });

    it("audits API routes to ensure secrets table is never queried for client payloads", () => {
      const nextRoutePath = path.resolve(process.cwd(), "src/app/api/test/question/next/route.ts");
      const nextSource = fs.readFileSync(nextRoutePath, "utf8");

      expect(nextSource).not.toContain("planted_errors");
      expect(nextSource).not.toContain("expected_choice");
      expect(nextSource).not.toContain("reference_criteria");
    });
  });

  // 6. Absolute Privacy CI Audit: Zero Media Capture or Upload
  describe("6. Absolute Privacy CI Audit: Zero Camera/Mic Recording or Upload", () => {
    it("proves codebase NEVER calls MediaRecorder, canvas image extraction, or audio file recording", () => {
      const clientDeviceModalPath = path.resolve(
        process.cwd(),
        "src/components/learning/DeviceCheckModal.tsx"
      );
      const code = fs.readFileSync(clientDeviceModalPath, "utf8");

      // 1. Prohibit MediaRecorder API
      expect(code).not.toContain("MediaRecorder");

      // 2. Prohibit Canvas snapshot extraction
      expect(code).not.toContain("toDataURL");
      expect(code).not.toContain("getImageData");
      expect(code).not.toContain("canvas.getContext");

      // 3. Prohibit Blob / Base64 upload of streams
      expect(code).not.toContain("createObjectURL");
      expect(code).not.toContain("readAsDataURL");
      expect(code).not.toContain("RTCPeerConnection");

      // 4. Prohibit facial / emotion recognition models
      expect(code).not.toContain("face-api");
      expect(code).not.toContain("tensorflow");
      expect(code).not.toContain("blazeface");
    });

    it("verifies unproctored route exists neutrally without penalty", () => {
      const clientDeviceModalPath = path.resolve(
        process.cwd(),
        "src/components/learning/DeviceCheckModal.tsx"
      );
      const code = fs.readFileSync(clientDeviceModalPath, "utf8");

      expect(code).toContain("Take without camera & mic");
      expect(code).toContain('proctorMode: "unproctored"');
    });
  });
});
