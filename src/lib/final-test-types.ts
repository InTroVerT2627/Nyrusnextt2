export type QuestionType =
  | "spot_mistake"
  | "case_decision"
  | "fix_it"
  | "interpret"
  | "triage"
  | "rewrite";

export type QuestionDifficulty = "foundation" | "intermediate" | "advanced";

export type PlantedError = {
  id: string;
  startChar: number;
  endChar: number;
  faultyText: string;
  explanationKey: string;
  correctionKey: string;
};

export type FollowupQuestion = {
  id: string;
  prompt: string;
  expectedKeyPoints: string[];
};

export type TieredHints = {
  nudge: { deduction: number; text: string };
  pointer: { deduction: number; text: string };
  strong: { deduction: number; text: string };
};

export type QuestionOption = {
  id: string;
  label: string;
  detail?: string;
};

/**
 * Public payload safely sent to the client.
 * ZERO answer keys, flaw spans, hidden tests, or rubrics.
 */
export type FinalTestQuestionClient = {
  id: string;
  pathSlug: string;
  slug: string;
  type: QuestionType;
  title: string;
  scenario: string;
  prompt: string;
  options?: QuestionOption[];
  starterContent?: string;
  difficulty: QuestionDifficulty;
  order: number;
  revealedHints: { tier: "nudge" | "pointer" | "strong"; text: string; deduction: number }[];
  draftNotice: string;
};

export type OptimalityCriterion = {
  id: string;
  name: string;
  points: number;
  test: (input: string) => { passed: boolean; message: string };
};

export type OptimalityRubric = {
  maxScore: number;
  criteria: OptimalityCriterion[];
};

/**
 * Full Server-Side Question Schema with Isolated Secrets
 */
export type FinalTestQuestionServer = {
  client: Omit<FinalTestQuestionClient, "order" | "revealedHints" | "draftNotice">;
  plantedErrors?: PlantedError[];
  expectedChoiceId?: string;
  expectedExecutionTest?: (input: string) => Promise<{ passed: boolean; message?: string }>;
  optimalityRubric?: OptimalityRubric;
  referenceCriteria?: string[];
  followupBank: FollowupQuestion[];
  hints: TieredHints;
};

export type TestAttemptStatus = "in_progress" | "completed" | "timed_out" | "interrupted";
export type ProctorMode = "device_checked" | "unproctored";

export type FinalTestAttemptSummary = {
  id: string;
  userId: string;
  pathSlug: string;
  status: TestAttemptStatus;
  cameraVerified: boolean;
  micVerified: boolean;
  proctorMode: ProctorMode;
  hasAccommodation: boolean;
  startedAt: number;
  expiresAt: number;
  timeRemainingSeconds: number;
  totalScore?: number;
  overallLevel?: "insufficient" | "developing" | "proficient" | "advanced";
  confidence?: "high" | "medium" | "low";
  currentQuestionIndex: number;
  totalQuestions: number;
  interruptionReason?: string | null;
};

export type LearnerQuestionSubmission = {
  questionId: string;
  highlightedSpans?: { start: number; end: number; text: string }[];
  whyWrong?: string;
  correction?: string;
  choiceId?: string;
  justification?: string;
  codeOrQuery?: string;
  prioritizedIds?: string[];
  rewriteText?: string;
};

export type QuestionScoreResult = {
  questionId: string;
  baseScore: number;
  optimalityScore: number;
  hintsDeduction: number;
  followupScore: number;
  finalScore: number;
  confidence: "high" | "medium" | "low";
  feedback: string;
  evidenceQuotes: string[];
  followupRequired: boolean;
  nextFollowup?: { id: string; prompt: string; index: number } | null;
};
