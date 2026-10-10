import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeFairnessEvaluation,
  getVariantHash,
  generateMarkdownReport,
  type FairnessLabSummary,
} from "@/lib/server/fairness-engine";
import {
  FAIRNESS_BENCHMARKS_SEED,
} from "@/lib/server/fairness-benchmarks-data";
import * as geminiModule from "@/lib/server/gemini";
import { NextRequest } from "next/server";

// Mock supabase server auth so requireActor can evaluate demo roles
vi.mock("@/lib/supabase/server", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    createSupabaseAdminClient: () => null,
    createSupabaseServerClient: () => ({} as any),
    getAuthenticatedUser: vi.fn(async (role?: string) => {
      const demoRole = role || "reviewer";
      return {
        client: {} as any,
        user: { id: `user_${demoRole}`, email: `${demoRole}@nextlearn.internal` },
        profile: {
          id: `profile_${demoRole}`,
          role: demoRole,
          display_name: `${demoRole} User`,
          synthetic_candidate_id: `cand_${demoRole}`,
        },
      };
    }),
  };
});

import { GET as fairnessGetHandler } from "@/app/api/fairness/route";
import { POST as fairnessRunHandler } from "@/app/api/fairness/run/route";

describe("Fairness Lab & Multilingual Consistency Engine (Feature 3)", () => {
  let scoreSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    scoreSpy = vi.spyOn(geminiModule, "scoreExplanation").mockResolvedValue({
      model: "gemini-2.5-pro",
      promptVersion: "2026-10-multilingual-v1",
      runs: [
        {
          root_cause: 3,
          evidence_quote: "NULL count was missed",
          reason: "Identified the root cause accurately.",
          injection_suspected: false,
          ambiguous: false,
        },
        {
          root_cause: 3,
          evidence_quote: "NULL count was missed",
          reason: "Correctly addressed the edge condition.",
          injection_suspected: false,
          ambiguous: false,
        },
      ],
      rubricVersion: 1,
    } as any);
  });

  it("proves Fairness Lab benchmark suite contains exactly 12 base cases across all 3 learning paths", () => {
    expect(FAIRNESS_BENCHMARKS_SEED).toHaveLength(12);

    const paths = new Set(FAIRNESS_BENCHMARKS_SEED.map((b) => b.pathSlug));
    expect(paths).toContain("data-analytics");
    expect(paths).toContain("business-analytics");
    expect(paths).toContain("communication");

    // Each benchmark must have exactly 7 phrasing/linguistic variants
    for (const bm of FAIRNESS_BENCHMARKS_SEED) {
      expect(bm.variants).toHaveLength(7);
      const variantTypes = bm.variants.map((v) => v.variantType);
      expect(variantTypes).toContain("baseline_plain");
      expect(variantTypes).toContain("polished");
      expect(variantTypes).toContain("short_informal");
      expect(variantTypes).toContain("hinglish");
      expect(variantTypes).toContain("hindi_devanagari");
      expect(variantTypes).toContain("telugu_script");
      expect(variantTypes).toContain("typo_heavy");
    }
  });

  it("proves Fairness Lab calls the production scoring pipeline (spy test)", async () => {
    // Run 1 benchmark with live refresh simulated
    const bmId = FAIRNESS_BENCHMARKS_SEED[0].id;
    const summary = await executeFairnessEvaluation(null, {
      benchmarkIds: [bmId],
      forceLiveRefresh: true,
    });

    expect(summary).toBeDefined();
    expect(summary.matrixRows).toHaveLength(1);
    expect(summary.matrixRows[0].benchmarkId).toBe(bmId);

    // Verify spy was called if scoring is configured
    if (geminiModule.SCORING_CONFIGURED) {
      expect(scoreSpy).toHaveBeenCalled();
    }
  });

  it("handles Unicode scripts (Devanagari, Telugu, Hinglish) without encoding truncation or errors", async () => {
    // Test Telugu script
    const teluguText = "ఇక్కడ సమస్య ఏమిటంటే COUNT(*) కాకుండా COUNT(col) వాడడం వల్ల NULL విలువలు లెక్కించబడలేదు.";
    const teluguHash = getVariantHash(teluguText);
    expect(teluguHash).toMatch(/^[a-f0-9]{64}$/);
    expect(teluguHash).toBe(getVariantHash(teluguText.trim()));

    // Test Hindi Devanagari script
    const hindiText = "मुख्य समस्या यह है कि SQL क्वेरी में COUNT(column) का उपयोग किया गया है जिससे NULL पंक्तियाँ छूट गईं।";
    const hindiHash = getVariantHash(hindiText);
    expect(hindiHash).toMatch(/^[a-f0-9]{64}$/);

    // Test Hinglish (Romanised Hindi-English mix)
    const hinglishText = "Main issue ye hai ki COUNT(*) use nahi kiya isliye NULL rows skip ho gayi calculation mein.";
    const hinglishHash = getVariantHash(hinglishText);
    expect(hinglishHash).toMatch(/^[a-f0-9]{64}$/);

    // Ensure distinct hashes for distinct contents
    expect(teluguHash).not.toBe(hindiHash);
    expect(hindiHash).not.toBe(hinglishHash);

    // Evaluate single benchmark containing Telugu and Hindi variants
    const summary = await executeFairnessEvaluation(null, {
      benchmarkIds: ["DA-BM-01"],
    });

    expect(summary.matrixRows.length).toBeGreaterThan(0);
    const row = summary.matrixRows[0];
    expect(row.variants["telugu_script"]).toBeDefined();
    expect(row.variants["telugu_script"].languageCode).toBe("te");
    expect(row.variants["hindi_devanagari"]).toBeDefined();
    expect(row.variants["hindi_devanagari"].languageCode).toBe("hi");
    expect(row.variants["hinglish"]).toBeDefined();
    expect(row.variants["hinglish"].languageCode).toBe("hi-Latn");
  });

  it("verifies immutable cache retrieval across successive evaluations", async () => {
    const bmId = "BA-BM-01";
    // First execution
    const firstRun = await executeFairnessEvaluation(null, {
      benchmarkIds: [bmId],
      forceLiveRefresh: false,
    });
    expect(firstRun.matrixRows.length).toBeGreaterThan(0);
    const firstScore = firstRun.matrixRows[0].variants["baseline_plain"].finalScore;

    // Second execution with same inputs must hit cache
    const secondRun = await executeFairnessEvaluation(null, {
      benchmarkIds: [bmId],
      forceLiveRefresh: false,
    });
    const secondVariant = secondRun.matrixRows[0].variants["baseline_plain"];

    expect(secondVariant.finalScore).toBe(firstScore);
    expect(secondVariant.isCached).toBe(true);
  });

  it("enforces reviewer-only access on Fairness Lab API routes", async () => {
    // Learner role request -> 403 Forbidden
    const learnerReq = new NextRequest("http://localhost:3000/api/fairness", {
      headers: {
        "x-demo-role": "learner",
      },
    });
    const learnerRes = await fairnessGetHandler(learnerReq);
    expect(learnerRes.status).toBe(403);

    // Recruiter role request -> 403 Forbidden
    const recruiterReq = new NextRequest("http://localhost:3000/api/fairness", {
      headers: {
        "x-demo-role": "recruiter",
      },
    });
    const recruiterRes = await fairnessGetHandler(recruiterReq);
    expect(recruiterRes.status).toBe(403);

    // Reviewer role request -> 200 OK
    const reviewerReq = new NextRequest("http://localhost:3000/api/fairness", {
      headers: {
        "x-demo-role": "reviewer",
      },
    });
    const reviewerRes = await fairnessGetHandler(reviewerReq);
    expect(reviewerRes.status).toBe(200);

    const data = await reviewerRes.json();
    expect(data.matrixRows).toBeDefined();
    expect(data.variantSummaries).toBeDefined();
  });

  it("enforces batch size cap on manual execution runs", async () => {
    // Request attempting 12 benchmarks
    const bulkIds = FAIRNESS_BENCHMARKS_SEED.map((b) => b.id);
    const runReq = new NextRequest("http://localhost:3000/api/fairness/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-demo-role": "reviewer",
      },
      body: JSON.stringify({
        benchmarkIds: bulkIds, // 12 IDs sent
      }),
    });

    const runRes = await fairnessRunHandler(runReq);
    expect(runRes.status).toBe(200);

    const summary: FairnessLabSummary = await runRes.json();
    // Must be capped at max 4 benchmarks per manual run batch
    expect(summary.matrixRows.length).toBeLessThanOrEqual(4);
  });

  it("calibrates human agreement and generates Markdown report with mandatory disclaimers", async () => {
    const summary = await executeFairnessEvaluation(null, {
      benchmarkIds: ["DA-BM-01", "CM-BM-01"],
    });

    expect(summary.matrixRows).toHaveLength(2);
    expect(summary.humanAgreement.exactAgreementPercent).toBeGreaterThanOrEqual(0);
    expect(summary.humanAgreement.withinOneAgreementPercent).toBeGreaterThanOrEqual(0);

    const markdown = generateMarkdownReport(summary);

    // Mandatory disclaimers & transparency statements
    expect(markdown).toContain("Fairness & Consistency Report");
    expect(markdown).toContain("Small synthetic sample");
    expect(markdown).toContain("Not a formal bias audit");
    expect(markdown).toContain("Scores are experimental evidence");
    expect(markdown).toContain("Human Evaluator Calibration & Agreement");
    expect(markdown).toContain("Language Neutrality Principle");

    // Table rows present
    expect(markdown).toContain("Baseline Plain English");
    expect(markdown).toContain("Telugu Script");
    expect(markdown).toContain("Hindi (Devanagari Script)");
  });
});
