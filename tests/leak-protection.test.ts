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
});
