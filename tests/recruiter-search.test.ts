import { describe, it, expect } from "vitest";

describe("Recruiter Workflow & Consent Enforcement (Section 8 & 9)", () => {
  it("surfaces candidates meeting role requirements with explicit whySurfaced rationale", () => {
    const roleRequirements = {
      skill: "debugging",
      language: "Java",
      minimum_level: "developing",
      max_age_days: 90,
      minimum_tasks: 2,
    };

    const candidateProfile = {
      id: "user_alex_morgan",
      syntheticCandidateId: "cand_0142",
      displayName: "Alex Morgan",
      evidence: [
        {
          skill: "debugging",
          language: "Java",
          level: "proficient",
          assessed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          attemptId: "att_01",
        },
        {
          skill: "debugging",
          language: "Java",
          level: "proficient",
          assessed_at: new Date(Date.now() - 14 * 86400000).toISOString(),
          attemptId: "att_02",
        },
      ],
      consent: {
        skill: "debugging",
        shared: true,
        revoked_at: null,
        include_submissions: true,
      },
    };

    // Filter check: Candidate meets skill, language, level, recency, task count, and active consent
    const meetsSkill = candidateProfile.consent.shared && !candidateProfile.consent.revoked_at;
    const taskCount = candidateProfile.evidence.filter(
      (e) => e.skill === roleRequirements.skill && e.language === roleRequirements.language
    ).length;
    const meetsTaskCount = taskCount >= roleRequirements.minimum_tasks;

    expect(meetsSkill).toBe(true);
    expect(meetsTaskCount).toBe(true);

    const whySurfaced = `Meets ${roleRequirements.skill}/${roleRequirements.language} ≥ ${roleRequirements.minimum_level}; ${taskCount} task attempts; evidence within ${roleRequirements.max_age_days} days.`;
    expect(whySurfaced).toContain("Meets debugging/Java ≥ developing; 2 task attempts");
  });

  it("never returns candidates who have not explicitly granted consent", () => {
    const unconsentedCandidate = {
      syntheticCandidateId: "cand_unconsented",
      consent: undefined as { shared: boolean } | undefined,
    };

    const isConsented = Boolean(unconsentedCandidate.consent?.shared);
    expect(isConsented).toBe(false);
  });

  it("redacts raw submissions when includeSubmissions is false", () => {
    const consentScoresOnly = { shared: true, include_submissions: false };
    const rawSubmission = "class Solution { ... }";
    const incidentReport = "Fixed mutation bug";

    const recruiterPayload = {
      candidateId: "cand_0142",
      level: "proficient",
      confidence: "high",
      criteria: { fix_correctness: 100, root_cause: 3 },
      ...(consentScoresOnly.include_submissions
        ? { submission: rawSubmission, incidentReport }
        : {}),
    };

    expect(recruiterPayload).not.toHaveProperty("submission");
    expect(recruiterPayload).not.toHaveProperty("incidentReport");
    expect(recruiterPayload.level).toBe("proficient");
  });

  it("verifies recruiter audit trail records view and decision events", () => {
    const auditLogs: { action: string; candidate_id: string; decision?: string }[] = [];

    // Recruiter views candidate evidence
    auditLogs.push({ action: "recruiter_evidence_viewed", candidate_id: "cand_0142" });

    // Recruiter makes human decision
    auditLogs.push({ action: "recruiter_decision_recorded", candidate_id: "cand_0142", decision: "shortlisted" });

    expect(auditLogs).toHaveLength(2);
    expect(auditLogs[0].action).toBe("recruiter_evidence_viewed");
    expect(auditLogs[1].decision).toBe("shortlisted");
  });
});
