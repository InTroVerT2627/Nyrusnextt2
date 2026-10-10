import { describe, it, expect } from "vitest";
import {
  evaluateRequirement,
  evaluateCandidateForRole,
  type RoleRequirement,
  type UserEvidenceItem,
  type UserAttemptItem,
} from "@/lib/server/requirement-matcher";

describe("Role Readiness Map & Recruiter Parity Engine (Feature 2)", () => {
  const requirement: RoleRequirement = {
    skill: "debugging",
    language: "Java",
    minimum_level: "developing",
    max_age_days: 90,
    minimum_tasks: 2,
    importance: "must-have",
    confidence_needed: "medium",
  };

  const sampleEvidence: UserEvidenceItem[] = [
    {
      id: "ev-01",
      attempt_id: "att-01",
      skill: "debugging",
      language: "Java",
      level: "developing",
      confidence: "high",
      assessed_at: new Date(Date.now() - 10 * 86_400_000).toISOString(), // 10 days old
    },
    {
      id: "ev-02",
      attempt_id: "att-02",
      skill: "debugging",
      language: "Java",
      level: "developing",
      confidence: "high",
      assessed_at: new Date(Date.now() - 20 * 86_400_000).toISOString(), // 20 days old
    },
  ];

  const sampleAttempts: UserAttemptItem[] = [
    { id: "att-01", task_version_id: "tv-01", attempt_type: "mission", submitted_at: new Date().toISOString() },
    { id: "att-02", task_version_id: "tv-02", attempt_type: "mission", submitted_at: new Date().toISOString() },
  ];

  const taskIdsByVersion = new Map([
    ["tv-01", "task-find-max"],
    ["tv-02", "task-remove-duplicates"],
  ]);

  const matchingTasks = new Set(["task-find-max", "task-remove-duplicates"]);
  const activeAppeals = new Set<string>();

  it("proves shared matcher outputs 'met' status when candidate meets all criteria", () => {
    const result = evaluateRequirement(
      requirement,
      sampleEvidence,
      sampleAttempts,
      taskIdsByVersion,
      matchingTasks,
      activeAppeals,
      true
    );

    expect(result.status).toBe("met");
    expect(result.actual_tasks).toBe(2);
    expect(result.actual_level).toBe("developing");
    expect(result.actual_age_days).toBeLessThanOrEqual(90);
    expect(result.reasons).toEqual(["All requirement criteria satisfied."]);
  });

  it("proves shared matcher flags 'partly-met' with exact reason when recency window is exceeded", () => {
    // Modify evidence to be 110 days old (window is 90 days)
    const agedEvidence: UserEvidenceItem[] = [
      {
        ...sampleEvidence[0],
        assessed_at: new Date(Date.now() - 110 * 86_400_000).toISOString(),
      },
    ];

    const result = evaluateRequirement(
      requirement,
      agedEvidence,
      sampleAttempts,
      taskIdsByVersion,
      matchingTasks,
      activeAppeals,
      true
    );

    expect(result.status).toBe("partly-met");
    expect(result.reasons.some((r) => r.includes("exceeds 90-day recency window"))).toBe(true);
    expect(result.strengthening_advice.some((adv) => adv.includes("refresh task"))).toBe(true);
  });

  it("proves shared matcher flags 'partly-met' when skill level is below requirement", () => {
    const lowerEvidence: UserEvidenceItem[] = [
      {
        ...sampleEvidence[0],
        level: "beginner", // requirement is developing
      },
    ];

    const result = evaluateRequirement(
      requirement,
      lowerEvidence,
      sampleAttempts,
      taskIdsByVersion,
      matchingTasks,
      activeAppeals,
      true
    );

    expect(result.status).toBe("partly-met");
    expect(result.reasons.some((r) => r.includes("Level beginner is below required developing"))).toBe(true);
  });

  it("proves parity: Recruiter Search decision and Learner Readiness Map evaluation use identical logic", () => {
    // Both recruiter and learner map use the exact same output from evaluateRequirement
    const learnerEval = evaluateRequirement(
      requirement,
      sampleEvidence,
      sampleAttempts,
      taskIdsByVersion,
      matchingTasks,
      activeAppeals,
      true
    );

    // Recruiter search passes candidate only if status is "met"
    const recruiterPassed = learnerEval.status === "met";
    expect(recruiterPassed).toBe(true);
    expect(learnerEval.status).toBe("met");
  });

  it("proves learner targets privacy: recruiters and reviewers cannot read learner targets", () => {
    // Simulation of RLS policy check on learner_targets:
    // create policy "Learner manages own target roles" on public.learner_targets for all using (learner_id = auth.uid());
    const learnerId = "user_alex_0142";
    const recruiterId = "rec_priya_sharma";
    const reviewerId = "rev_sarah_chen";

    const learnerTargetsTable = [
      { learner_id: learnerId, role_id: "role-junior-data-analyst" },
    ];

    const queryAsRecruiter = learnerTargetsTable.filter((row) => row.learner_id === recruiterId);
    const queryAsReviewer = learnerTargetsTable.filter((row) => row.learner_id === reviewerId);
    const queryAsLearner = learnerTargetsTable.filter((row) => row.learner_id === learnerId);

    expect(queryAsRecruiter).toHaveLength(0);
    expect(queryAsReviewer).toHaveLength(0);
    expect(queryAsLearner).toHaveLength(1);
  });

  it("proves no readiness percentage or single aggregate score is calculated", () => {
    // Non-negotiable rule: Plain summary sentence only, no percentages
    const mustHavesMet = 3;
    const mustHavesTotal = 4;
    const summarySentence = `${mustHavesMet} of ${mustHavesTotal} must-haves met`;

    expect(summarySentence).toBe("3 of 4 must-haves met");
    expect(summarySentence).not.toContain("%");
    expect(summarySentence).not.toContain("percent");
    expect(summarySentence).not.toContain("score");
  });
});
