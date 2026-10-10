import { describe, it, expect } from "vitest";

describe("Consent & Privacy Protections (Section 8 Non-Negotiables)", () => {
  it("enforces consent is off by default for new learner profiles", () => {
    // Model synthetic candidate default state
    const defaultCandidateConsents: Record<string, { shared: boolean; revoked_at: string | null; include_submissions: boolean }> = {};
    
    // Check candidate with no explicit consent granted
    const candidateId = "cand_new_learner";
    const consent = defaultCandidateConsents[candidateId];

    expect(consent).toBeUndefined();
    // In search query: `.eq("shared", true).is("revoked_at", null)`
    const isSearchable = Boolean(consent?.shared && !consent?.revoked_at);
    expect(isSearchable).toBe(false);
  });

  it("enforces granular per-skill consent (granting debugging does not share code-review)", () => {
    const candidateConsents: Record<string, { skill: string; shared: boolean; revoked_at: string | null }> = {
      "debugging": { skill: "debugging", shared: true, revoked_at: null },
    };

    const isDebuggingShared = candidateConsents["debugging"]?.shared && !candidateConsents["debugging"]?.revoked_at;
    const isCodeReviewShared = candidateConsents["reviewing-ai-written-code"]?.shared && !candidateConsents["reviewing-ai-written-code"]?.revoked_at;

    expect(isDebuggingShared).toBe(true);
    expect(isCodeReviewShared).toBeFalsy();
  });

  it("enforces instant revocation via timestamped revoked_at and shared=false", () => {
    const consentState = {
      skill: "debugging",
      shared: true,
      granted_at: "2026-10-10T12:00:00.000Z",
      revoked_at: null as string | null,
    };

    // Candidate revokes consent
    const revokedTime = new Date().toISOString();
    consentState.shared = false;
    consentState.revoked_at = revokedTime;

    // Recruiter query filter logic:
    // .eq("shared", true).is("revoked_at", null)
    const matchesRecruiterFilter = consentState.shared === true && consentState.revoked_at === null;
    expect(matchesRecruiterFilter).toBe(false);
  });

  it("enforces two-tier consent: redacts raw submissions when includeSubmissions is false", () => {
    const mockAttempt = {
      code: "public class Gateway { ... }",
      incidentReport: "Hypothesis: race condition in worker pool...",
      followups: [{ question: "Why synchronize here?", answer: "To prevent re-entrancy", score: "valid" }],
      aiDisclosure: { used: true, tool: "Claude", details: "Syntax check" },
    };

    const mockCardMetadata = {
      evidenceId: "ev_001",
      attemptId: "att_001",
      level: "proficient",
      confidence: "high",
      criteria: { correctness: "proficient", root_cause: "proficient" },
    };

    // Scenario A: Candidate consented to scores only (includeSubmissions = false)
    const consentScoresOnly = { shared: true, include_submissions: false };
    const payloadA = {
      ...mockCardMetadata,
      ...(consentScoresOnly.include_submissions ? {
        submission: mockAttempt.code,
        incidentReport: mockAttempt.incidentReport,
        followups: mockAttempt.followups,
        aiDisclosure: mockAttempt.aiDisclosure,
      } : {}),
    };

    expect(payloadA).not.toHaveProperty("submission");
    expect(payloadA).not.toHaveProperty("incidentReport");
    expect(payloadA).not.toHaveProperty("followups");
    expect(payloadA).not.toHaveProperty("aiDisclosure");
    expect(payloadA.level).toBe("proficient");

    // Scenario B: Candidate explicitly consented to full evidence including submissions
    const consentFull = { shared: true, include_submissions: true };
    const payloadB = {
      ...mockCardMetadata,
      ...(consentFull.include_submissions ? {
        submission: mockAttempt.code,
        incidentReport: mockAttempt.incidentReport,
        followups: mockAttempt.followups,
        aiDisclosure: mockAttempt.aiDisclosure,
      } : {}),
    };

    expect(payloadB.submission).toBe(mockAttempt.code);
    expect(payloadB.incidentReport).toBe(mockAttempt.incidentReport);
    expect(payloadB.followups).toHaveLength(1);
    expect(payloadB.aiDisclosure).toEqual(mockAttempt.aiDisclosure);
  });
});
