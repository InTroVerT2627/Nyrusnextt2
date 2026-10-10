import "server-only";
import { runCase, type CodeLanguage } from "@/lib/server/judge0";

export type TestCase = { title: string; input: unknown; expected: unknown };

export async function runTestSuite(language: CodeLanguage, taskSlug: string, source: string, cases: TestCase[]) {
  const checks = await Promise.all(cases.map(async (testCase) => {
    try {
      const result = await runCase(language, taskSlug, source, testCase.input, testCase.expected);
      return { title: testCase.title, passed: result.passed, compileError: result.compileError, runnerFailure: result.statusId >= 13 };
    } catch {
      return { title: testCase.title, passed: false, runnerFailure: true };
    }
  }));
  return { checks, total: checks.length, passed: checks.filter((item) => item.passed).length, runnerFailure: checks.some((item) => item.runnerFailure === true) };
}

export function hiddenCasesFromSpec(spec: unknown): TestCase[] {
  if (!spec || typeof spec !== "object" || !Array.isArray((spec as { cases?: unknown }).cases)) throw new Error("The private test suite is malformed.");
  const cases = (spec as { cases: unknown[] }).cases;
  return cases.map((value, index) => {
    if (!value || typeof value !== "object" || !("input" in value)) throw new Error("The private test suite is malformed.");
    const item = value as { input: unknown; expected?: unknown; expect_rejection?: boolean; title?: unknown };
    return { title: typeof item.title === "string" ? item.title : `Private case ${index + 1}`, input: item.input, expected: item.expect_rejection ? { $expect_rejection: true } : item.expected };
  });
}

export function visibleCasesFromRows(rows: { title: string; input_json: unknown; expected_json: unknown }[]): TestCase[] {
  return rows.map((row) => ({ title: row.title, input: row.input_json, expected: row.expected_json }));
}

export function languageFor(value: string): CodeLanguage {
  if (value === "Java" || value === "JavaScript") return value;
  throw new Error("Unsupported task language.");
}
