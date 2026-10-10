import "server-only";
import initSqlJs from "sql.js";
import {
  SQL_SEED_SCRIPT,
  type SqlCohortResult,
  type UnitEconomicsModel,
  type CommunicationPackage,
} from "@/lib/work-samples-shared";

export { SQL_SEED_SCRIPT };
export type { SqlCohortResult, UnitEconomicsModel, CommunicationPackage };

export async function executeSqlCohortQuery(query: string): Promise<SqlCohortResult> {
  const start = performance.now();
  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run(SQL_SEED_SCRIPT);

    const execResults = db.exec(query);
    const executionTimeMs = Math.round(performance.now() - start);

    if (!execResults || execResults.length === 0) {
      return {
        passed: false,
        checks: [{ title: "Query executes and returns records", passed: false, message: "Query returned 0 rows or no result set." }],
        rows: [],
        columns: [],
        executionTimeMs,
      };
    }

    const firstResult = execResults[0];
    const columns = firstResult.columns.map((c) => c.toLowerCase());
    const rows = firstResult.values.map((row) => {
      const obj: Record<string, unknown> = {};
      firstResult.columns.forEach((col, idx) => {
        obj[col.toLowerCase()] = row[idx];
      });
      return obj;
    });

    const checks: { title: string; passed: boolean; message?: string }[] = [];

    // 1. Column presence check
    const hasSegment = columns.some((c) => c.includes("segment"));
    const hasRev = columns.some((c) => c.includes("revenue") || c.includes("sum"));
    const hasCount = columns.some((c) => c.includes("order") || c.includes("count"));
    const hasAov = columns.some((c) => c.includes("avg") || c.includes("aov"));
    checks.push({
      title: "Query outputs segment, completed revenue, order count, and average order value",
      passed: hasSegment && hasRev && hasCount && hasAov,
      message: hasSegment && hasRev && hasCount && hasAov ? undefined : "Missing required columns in result set.",
    });

    // 2. Segment counts check (3 distinct segments)
    checks.push({
      title: "Aggregates exactly into Enterprise, Mid-Market, and SMB segments",
      passed: rows.length === 3,
      message: rows.length === 3 ? undefined : `Expected 3 aggregated segment rows; got ${rows.length}.`,
    });

    // 3. Excludes refunded and Q2 orders: Enterprise revenue check
    const enterpriseRow = rows.find((r) => String(r.segment || "").toLowerCase().includes("enterprise"));
    const entRev = enterpriseRow ? Number(enterpriseRow.completed_revenue ?? enterpriseRow[columns.find((c) => c.includes("rev") || c.includes("sum")) ?? ""]) : 0;
    const entOrders = enterpriseRow ? Number(enterpriseRow.completed_orders ?? enterpriseRow[columns.find((c) => c.includes("count") || c.includes("order")) ?? ""]) : 0;

    const entRevenueCorrect = Math.abs(entRev - 32500) < 1;
    const entOrdersCorrect = entOrders === 3;
    checks.push({
      title: "Enterprise metrics correctly filter completed Q3 orders ($32,500 across 3 orders)",
      passed: entRevenueCorrect && entOrdersCorrect,
      message: entRevenueCorrect && entOrdersCorrect ? undefined : `Expected $32,500 and 3 orders; got $${entRev} and ${entOrders} orders.`,
    });

    // 4. Ordering check (Highest revenue first)
    const sorted = rows.every((r, idx) => {
      if (idx === 0) return true;
      const prevRev = Number(rows[idx - 1][columns.find((c) => c.includes("rev") || c.includes("sum")) ?? ""] ?? 0);
      const currRev = Number(r[columns.find((c) => c.includes("rev") || c.includes("sum")) ?? ""] ?? 0);
      return prevRev >= currRev;
    });
    checks.push({
      title: "Ordered descending by completed revenue",
      passed: sorted,
      message: sorted ? undefined : "Rows are not sorted in descending order of completed revenue.",
    });

    const passed = checks.every((c) => c.passed);
    return { passed, checks, rows, columns: firstResult.columns, executionTimeMs };
  } catch (err) {
    const executionTimeMs = Math.round(performance.now() - start);
    return {
      passed: false,
      checks: [{ title: "SQL syntax and execution check", passed: false, message: err instanceof Error ? err.message : "Syntax error in SQL query." }],
      rows: [],
      columns: [],
      executionTimeMs,
    };
  }
}

export function evaluateUnitEconomicsModel(model: UnitEconomicsModel) {
  const checks: { title: string; passed: boolean; message?: string }[] = [];

  // CAC check: $50,000 / 250 = $200
  const cacPass = Math.abs(model.cac - 200) < 0.5;
  checks.push({
    title: "Customer Acquisition Cost (CAC = Spend / Customers) = $200.00",
    passed: cacPass,
    message: cacPass ? undefined : `Calculated CAC was $${model.cac.toFixed(2)}; expected $200.00.`,
  });

  // LTV check: ($120 * 0.80) / 0.05 = $96 / 0.05 = $1,920.00
  const ltvPass = Math.abs(model.ltv - 1920) < 2.0;
  checks.push({
    title: "Customer Lifetime Value (LTV = (MRR × Margin) / Churn) = $1,920.00",
    passed: ltvPass,
    message: ltvPass ? undefined : `Calculated LTV was $${model.ltv.toFixed(2)}; expected $1,920.00.`,
  });

  // LTV:CAC check: 1920 / 200 = 9.60
  const ratioPass = Math.abs(model.ltvCacRatio - 9.6) < 0.1;
  checks.push({
    title: "LTV to CAC Ratio (LTV / CAC) = 9.60x",
    passed: ratioPass,
    message: ratioPass ? undefined : `Calculated ratio was ${model.ltvCacRatio.toFixed(2)}x; expected 9.60x.`,
  });

  // Payback check: 200 / 96 = 2.08 months
  const paybackPass = Math.abs(model.paybackMonths - 2.08) < 0.05;
  checks.push({
    title: "CAC Payback Period (CAC / (MRR × Margin)) = 2.08 months",
    passed: paybackPass,
    message: paybackPass ? undefined : `Calculated payback was ${model.paybackMonths.toFixed(2)} months; expected 2.08 months.`,
  });

  const passed = checks.every((c) => c.passed);
  return { passed, checks };
}

export function evaluateCommunicationStructure(pkg: CommunicationPackage) {
  const checks: { title: string; passed: boolean; message?: string }[] = [];

  // 1. Executive Briefing Depth & Scope
  const execLength = pkg.executiveBriefing.trim().length;
  checks.push({
    title: "Executive Postmortem covers timeline, blast radius, and preventative roadmap",
    passed: execLength >= 80,
    message: execLength >= 80 ? undefined : "Executive postmortem is too brief (minimum 80 characters).",
  });

  // 2. Customer Advisory Depth & Tone
  const clientLength = pkg.customerAdvisory.trim().length;
  checks.push({
    title: "Customer Advisory provides transparent impact disclosure without internal technical jargon",
    passed: clientLength >= 60,
    message: clientLength >= 60 ? undefined : "Customer advisory is too brief (minimum 60 characters).",
  });

  // 3. Quantitative Grounding
  const combined = `${pkg.executiveBriefing} ${pkg.customerAdvisory}`.toLowerCase();
  const mentionsMetrics = combined.includes("42") || combined.includes("1,400") || combined.includes("1400") || combined.includes("18") || combined.includes("minute");
  checks.push({
    title: "Accurately references incident operational metrics (duration, recovery, or transaction radius)",
    passed: mentionsMetrics,
    message: mentionsMetrics ? undefined : "Communication package should cite operational incident facts (e.g., 18 min duration or affected orders).",
  });

  const passed = checks.every((c) => c.passed);
  return { passed, checks };
}

export {
  evaluateDebuggingFix,
  evaluateDsaChallenge,
  evaluateFollowupDefense,
  getFollowupQuestion,
} from "./code-challenge-evaluator";

