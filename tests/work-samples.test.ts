import { describe, it, expect } from "vitest";
import {
  executeSqlCohortQuery,
  evaluateUnitEconomicsModel,
  evaluateCommunicationStructure,
} from "@/lib/server/work-samples";

describe("Work-Sample Authentic Tasks (Section 3 Upgrade)", () => {
  describe("Data Analytics: WASM SQLite Deterministic Result-Set Checks", () => {
    it("verifies accurate SQL cohort query filters Q3, excludes refunds, and calculates AOV", async () => {
      const validQuery = `
        SELECT
          c.segment,
          ROUND(SUM(o.amount), 2) AS completed_revenue,
          COUNT(o.id) AS completed_orders,
          ROUND(AVG(o.amount), 2) AS avg_order_value
        FROM customers c
        JOIN orders o ON c.id = o.customer_id
        WHERE o.status = 'completed'
          AND o.order_date BETWEEN '2026-07-01' AND '2026-09-30'
        GROUP BY c.segment
        ORDER BY completed_revenue DESC;
      `;

      const result = await executeSqlCohortQuery(validQuery);
      expect(result.passed).toBe(true);
      expect(result.rows).toHaveLength(3);

      const enterprise = result.rows.find((r) => String(r.segment).toLowerCase() === "enterprise");
      expect(enterprise).toBeDefined();
      expect(enterprise?.completed_revenue).toBe(32500);
      expect(enterprise?.completed_orders).toBe(3);
      expect(Number(enterprise?.avg_order_value)).toBeCloseTo(10833.33, 1);

      const smb = result.rows.find((r) => String(r.segment).toLowerCase() === "smb");
      expect(smb?.completed_revenue).toBe(4800);
      expect(smb?.completed_orders).toBe(6);
      expect(Number(smb?.avg_order_value)).toBe(800);
    });

    it("rejects SQL query that fails to exclude refunded orders", async () => {
      // Missing WHERE o.status = 'completed'
      const queryWithRefunds = `
        SELECT
          c.segment,
          SUM(o.amount) AS completed_revenue,
          COUNT(o.id) AS completed_orders,
          AVG(o.amount) AS avg_order_value
        FROM customers c
        JOIN orders o ON c.id = o.customer_id
        WHERE o.order_date BETWEEN '2026-07-01' AND '2026-09-30'
        GROUP BY c.segment
        ORDER BY completed_revenue DESC;
      `;

      const result = await executeSqlCohortQuery(queryWithRefunds);
      expect(result.passed).toBe(false);
      expect(result.checks.some((c) => !c.passed && c.title.includes("Enterprise metrics"))).toBe(true);
    });

    it("rejects invalid SQL syntax safely without throwing unhandled exceptions", async () => {
      const malformedQuery = "SELCT * FORM nowhere;";
      const result = await executeSqlCohortQuery(malformedQuery);
      expect(result.passed).toBe(false);
      expect(result.checks[0].passed).toBe(false);
    });
  });

  describe("Business Analytics: Deterministic Numeric Checks on SaaS Model", () => {
    it("passes ground truth SaaS unit economics equations", () => {
      const correctModel = {
        cac: 200.00,
        ltv: 1920.00,
        ltvCacRatio: 9.60,
        paybackMonths: 2.08,
      };

      const result = evaluateUnitEconomicsModel(correctModel);
      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it("detects incorrect payback calculation or missing margin factor", () => {
      const flawedModel = {
        cac: 200.00,
        ltv: 1920.00,
        ltvCacRatio: 9.60,
        paybackMonths: 1.66, // flawed: forgot 80% gross margin discount
      };

      const result = evaluateUnitEconomicsModel(flawedModel);
      expect(result.passed).toBe(false);
      const failedCheck = result.checks.find((c) => !c.passed);
      expect(failedCheck?.title).toContain("CAC Payback Period");
    });
  });

  describe("Communication: Workplace Escalation & Postmortem Verification", () => {
    it("validates comprehensive executive briefing and customer advisory", () => {
      const validPackage = {
        executiveBriefing: "Between 14:15 UTC and 14:33 UTC (18 minutes total duration), an exclusive database lock caused 1,420 payment webhooks to queue up. First-attempt failed volume was $42,000, of which 65% was recovered on automated retry.",
        customerAdvisory: "Between 14:15 UTC and 14:33 UTC today, European transaction processing experienced intermittent latency. Full service was restored automatically at 14:33 UTC, and all transactions have been reconciled.",
      };

      const result = evaluateCommunicationStructure(validPackage);
      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it("flags communication packages missing operational metrics or too brief", () => {
      const briefPackage = {
        executiveBriefing: "The database had a bug.",
        customerAdvisory: "Sorry for the downtime.",
      };

      const result = evaluateCommunicationStructure(briefPackage);
      expect(result.passed).toBe(false);
      expect(result.checks.some((c) => !c.passed)).toBe(true);
    });
  });
});
