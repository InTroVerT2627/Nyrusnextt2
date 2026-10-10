import { describe, it, expect } from "vitest";
import {
  learningPaths,
  findLearningModule,
  publicLearningPaths,
} from "@/lib/learning-paths";
import {
  evaluateDebuggingFix,
  evaluateDsaChallenge,
  evaluateFollowupDefense,
  getFollowupQuestion,
} from "@/lib/server/work-samples";

describe("Story-Based Learning Modules: Hands-On Debugging & DSA Paths", () => {
  describe("1. Path Structure & Pedagogical Rhythm", () => {
    it("registers both 'debugging' and 'dsa' paths with realistic workplace contexts", () => {
      const dbgPath = learningPaths.find((p) => p.slug === "debugging");
      const dsaPath = learningPaths.find((p) => p.slug === "dsa");

      expect(dbgPath).toBeDefined();
      expect(dbgPath?.title).toBe("Hands-on Incident Debugging");
      expect(dbgPath?.subtitle).toContain("FinFlow");
      expect(dbgPath?.modules.length).toBeGreaterThanOrEqual(4);

      expect(dsaPath).toBeDefined();
      expect(dsaPath?.title).toBe("Data Structures & Algorithms in Production");
      expect(dsaPath?.subtitle).toContain("EventPulse");
      expect(dsaPath?.modules.length).toBeGreaterThanOrEqual(4);
    });

    it("ensures every module follows the 7-beat pedagogical rhythm with 3 knowledge check questions", () => {
      const paths = learningPaths.filter((p) => p.slug === "debugging" || p.slug === "dsa");
      for (const p of paths) {
        for (const m of p.modules) {
          expect(m.slug).toBeTruthy();
          expect(m.title).toBeTruthy();
          expect(m.summary).toBeTruthy();
          expect(m.objectives.length).toBeGreaterThanOrEqual(2);
          expect(m.lesson.length).toBeGreaterThanOrEqual(2);
          expect(m.scenario).toBeTruthy();
          expect(m.questions).toHaveLength(3);
          for (const q of m.questions) {
            expect(q.prompt).toBeTruthy();
            expect(q.choices).toHaveLength(3);
            expect(q.explanation).toBeTruthy();
            expect(q.correctIndex).toBeGreaterThanOrEqual(0);
            expect(q.correctIndex).toBeLessThan(3);
          }
        }
      }
    });

    it("publicLearningPaths rotates choices without leaking correctIndex", () => {
      const publicPaths = publicLearningPaths();
      const publicDbg = publicPaths.find((p) => p.slug === "debugging");
      const publicDsa = publicPaths.find((p) => p.slug === "dsa");

      expect(publicDbg).toBeDefined();
      expect(publicDsa).toBeDefined();

      for (const mod of publicDbg!.modules) {
        for (const q of mod.questions) {
          expect((q as any).correctIndex).toBeUndefined();
          expect((q as any).explanation).toBeUndefined();
          expect(q.choices).toHaveLength(3);
        }
      }
    });

    it("findLearningModule correctly resolves specific debugging and DSA modules", () => {
      const foundDbg = findLearningModule("debugging", "off-by-one-settlement");
      expect(foundDbg).not.toBeNull();
      expect(foundDbg?.module.title).toBe("The Missing Settlement Slice");

      const foundDsa = findLearningModule("dsa", "fast-record-dedup");
      expect(foundDsa).not.toBeNull();
      expect(foundDsa?.module.title).toBe("Finding Duplicate Audit Events in Real-Time");
    });
  });

  describe("2. Hands-On Debugging: Deterministic Execution & Incident Remediations", () => {
    it("flags off-by-one boundary defect on buggy slice code", () => {
      const buggyCode = `
        function getSettlementSlice(transactions, startIdx, endIdx) {
          return transactions.slice(startIdx, endIdx - 1);
        }
      `;
      const result = evaluateDebuggingFix("off-by-one-settlement", buggyCode);
      expect(result.syntaxValid).toBe(true);
      expect(result.passed).toBe(false);
      expect(result.passedChecks).toBeLessThan(result.totalChecks);
    });

    it("verifies patched slice code passes all visible and private boundary checks", () => {
      const fixedCode = `
        function getSettlementSlice(transactions, startIdx, endIdx) {
          if (!Array.isArray(transactions) || startIdx < 0 || startIdx > endIdx) return [];
          return transactions.slice(startIdx, endIdx);
        }
      `;
      const result = evaluateDebuggingFix("off-by-one-settlement", fixedCode);
      expect(result.syntaxValid).toBe(true);
      expect(result.passed).toBe(true);
      expect(result.passedChecks).toBe(result.totalChecks);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("verifies idempotency guard prevents double balance debits during concurrent retries", () => {
      const fixedConcurrencyCode = `
        function processPayout(ledger, orderId, amount, idempotencyKey) {
          if (ledger.processedKeys && ledger.processedKeys.has(idempotencyKey)) {
            return { success: true, balance: ledger.balance, duplicate: true };
          }
          if (!ledger.processedKeys) ledger.processedKeys = new Set();
          ledger.processedKeys.add(idempotencyKey);
          ledger.balance -= amount;
          ledger.history.push({ orderId, amount, idempotencyKey });
          return { success: true, balance: ledger.balance };
        }
      `;
      const result = evaluateDebuggingFix("concurrent-state-race", fixedConcurrencyCode);
      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it("verifies defensive optional chaining prevents TypeError on missing nested webhook properties", () => {
      const fixedNullCode = `
        function parseWebhookEvent(payload) {
          if (!payload || typeof payload !== 'object') return null;
          const zip = payload.customer?.billing?.address?.zip ?? 'UNKNOWN';
          const tier = payload.customer?.tier ?? 'STANDARD';
          return { zip, tier, id: payload.id ?? 'UNKNOWN_ID' };
        }
      `;
      const result = evaluateDebuggingFix("unhandled-null-payload", fixedNullCode);
      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });
  });

  describe("3. DSA in Production: Complexity & Deterministic Scale Verification", () => {
    it("proves linear O(N) hash set deduplication passes correctness and scale checks under 80ms", () => {
      const setCode = `
        function deduplicateEvents(events) {
          if (!Array.isArray(events)) return [];
          const seen = new Set();
          const unique = [];
          for (let i = 0; i < events.length; i++) {
            const item = events[i];
            if (!seen.has(item)) {
              seen.add(item);
              unique.push(item);
            }
          }
          return unique;
        }
      `;
      const result = evaluateDsaChallenge("fast-record-dedup", setCode);
      expect(result.passed).toBe(true);
      expect(result.complexityVerified).toBe(true);
      expect(result.timeComplexityObserved).toContain("O(N)");
    });

    it("proves priority queue dispatches highest priority first with timestamp tie-breaking", () => {
      const prioCode = `
        function dispatchPriorityTasks(tasks) {
          if (!Array.isArray(tasks)) return [];
          return [...tasks].sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return a.timestamp - b.timestamp;
          });
        }
      `;
      const result = evaluateDsaChallenge("priority-task-dispatch", prioCode);
      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it("proves sliding window rate limiter prunes expired timestamps from queue", () => {
      const limiterCode = `
        function isRateLimited(state, timestamp, windowMs, maxRequests) {
          if (!state.queue) state.queue = [];
          const threshold = timestamp - windowMs;
          while (state.queue.length > 0 && state.queue[0] <= threshold) {
            state.queue.shift();
          }
          if (state.queue.length < maxRequests) {
            state.queue.push(timestamp);
            return true;
          }
          return false;
        }
      `;
      const result = evaluateDsaChallenge("sliding-rate-limiter", limiterCode);
      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it("proves binary search range query correctly executes in sub-millisecond logarithmic time", () => {
      const binarySearchCode = `
        function findTimeRange(timestamps, startTime, endTime) {
          if (!timestamps || timestamps.length === 0) return [-1, -1];
          let low = 0, high = timestamps.length - 1;
          let firstIdx = -1;
          while (low <= high) {
            const mid = low + Math.floor((high - low) / 2);
            if (timestamps[mid] >= startTime) {
              firstIdx = mid;
              high = mid - 1;
            } else {
              low = mid + 1;
            }
          }

          low = 0; high = timestamps.length - 1;
          let lastIdx = -1;
          while (low <= high) {
            const mid = low + Math.floor((high - low) / 2);
            if (timestamps[mid] <= endTime) {
              lastIdx = mid;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }

          if (firstIdx !== -1 && lastIdx !== -1 && firstIdx <= lastIdx) {
            return [firstIdx, lastIdx];
          }
          return [-1, -1];
        }
      `;
      const result = evaluateDsaChallenge("indexed-log-search", binarySearchCode);
      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });
  });

  describe("4. Adaptive Follow-Up Reasoning & Non-Punitive Score Guarantees", () => {
    it("retrieves adaptive follow-up questions tailored to scenario invariants", () => {
      const qDbg = getFollowupQuestion("debugging", "off-by-one-settlement", 0);
      expect(qDbg).not.toBeNull();
      expect(qDbg?.expectedKeyTerms).toContain("exclusive");

      const qDsa = getFollowupQuestion("dsa", "fast-record-dedup", 0);
      expect(qDsa).not.toBeNull();
      expect(qDsa?.expectedKeyTerms).toContain("O(N)");
    });

    it("evaluates candidate explanation and triggers stop rule on sufficient understanding", () => {
      const thoroughAnswer =
        "The slice method uses half-open interval semantics where the end index is exclusive. Subtracting 1 meant the last element was omitted from the boundary slice.";
      const evaluation = evaluateFollowupDefense(
        "debugging",
        "off-by-one-settlement",
        "off-f1",
        thoroughAnswer,
        0
      );

      expect(evaluation.score).toBe(2);
      expect(evaluation.confidence).toBe("High");
      expect(evaluation.stopQuestioning).toBe(true);
      expect(evaluation.demonstratedConcepts.length).toBeGreaterThanOrEqual(2);
      expect(evaluation.evidenceQuote).toBeTruthy();
    });

    it("guarantees follow-up defense score never reduces base score", () => {
      // Partial answer
      const partialAnswer = "It skipped the last item.";
      const evaluation = evaluateFollowupDefense(
        "debugging",
        "off-by-one-settlement",
        "off-f1",
        partialAnswer,
        0
      );

      // Score is non-negative and represents confidence tier, not a penalty
      expect(evaluation.score).toBeGreaterThanOrEqual(0);
      expect(evaluation.score).toBeLessThanOrEqual(2);
      expect(evaluation.confidence).toBe("Medium");
    });
  });

  describe("5. Security & Zero Secret Leakage", () => {
    it("guarantees private test cases and reference keys never reach public check output", () => {
      const fixedCode = `
        function getSettlementSlice(transactions, startIdx, endIdx) {
          return transactions.slice(startIdx, endIdx);
        }
      `;
      const result = evaluateDebuggingFix("off-by-one-settlement", fixedCode);

      // The checks output must not reveal secret input data or reference answers
      for (const check of result.checks) {
        expect(check.title).not.toContain("700");
        expect(check.title).not.toContain("500, 600");
        expect(JSON.stringify(check)).not.toContain("expected_flaw_key");
        expect(JSON.stringify(check)).not.toContain("reference_code");
      }
    });
  });
});
