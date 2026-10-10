import "server-only";

export type ReplayAllowlist = {
  attemptId: string;
  submittedAt: string;
  taskTitle: string;
  taskVersion: number;
  rubricVersion: number;
  inputHash: string;
  visibleTests: { title: string; passed: boolean }[];
  hiddenSummary: { passed: boolean; count: number; category: string };
  optimalityTier?: { tier: string; genericReason: string };
  aiReasoning: {
    criterion: string;
    criterionTitle: string;
    run1Score: number;
    run2Score: number;
    agreement: "agree" | "differ_1" | "differ_2_plus";
    evidenceQuote: string;
    shortReason: string;
    injectionFlag: boolean;
    ambiguousFlag: boolean;
  }[];
  followups: {
    position: number;
    gapTags: string[];
    questionText: string;
    learnerAnswer: string;
    score: number | null;
    stopRuleOutcome?: string;
  }[];
  confidence: {
    level: "high" | "medium" | "low";
    conditionsApplied: string[];
  };
  finalScores: Record<string, { score: number; maxScore: number }>;
  auditEntry: {
    action: string;
    inputHash: string;
    recordedAt: string;
  };
};

export type RecruiterMethodCard = {
  assessmentName: string;
  taskVersion: number;
  rubricVersion: number;
  confidenceLevel: "high" | "medium" | "low";
  confidenceDerivation: string;
  aiDisclosure: boolean;
  flagsRaised: string[];
  submissionConsented: boolean;
  consentedSubmissionText?: string;
  consentedReport?: Record<string, string>;
};

/**
 * Tokenize a string into alphanumeric word tokens.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Extract word n-grams from a token array.
 */
function extractNgrams(tokens: string[], n: number): Set<string> {
  const ngrams = new Set<string>();
  if (tokens.length < n) return ngrams;
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

/**
 * Calculates n-gram overlap between reason text and secret reference text.
 * Returns overlap ratio between 0.0 and 1.0.
 */
export function calculateNgramOverlap(reason: string, secretText: string, n = 3): number {
  const reasonTokens = tokenize(reason);
  const secretTokens = tokenize(secretText);
  if (reasonTokens.length < n || secretTokens.length < n) return 0;

  const reasonNgrams = extractNgrams(reasonTokens, n);
  const secretNgrams = extractNgrams(secretTokens, n);
  if (reasonNgrams.size === 0) return 0;

  let overlap = 0;
  for (const gram of reasonNgrams) {
    if (secretNgrams.has(gram)) {
      overlap++;
    }
  }

  return overlap / reasonNgrams.size;
}

/**
 * Sanitize and guard an AI reason against accidental answer-key / reference solution leakage.
 * If n-gram overlap exceeds threshold (default 0.25), redacts the reason.
 * Always truncates to maxLength (default 250 chars).
 */
export function sanitizeReasonText(
  reason: string,
  secretCorpus: string[],
  maxOverlapThreshold = 0.25,
  maxLength = 250
): string {
  if (!reason || typeof reason !== "string") return "";

  const trimmed = reason.trim().slice(0, maxLength);

  for (const secret of secretCorpus) {
    if (!secret) continue;
    const overlap = calculateNgramOverlap(trimmed, secret, 3);
    if (overlap >= maxOverlapThreshold) {
      return "Reasoning evaluated against rubric descriptors. Technical details summarized for security.";
    }
  }

  return trimmed;
}

/**
 * Filter an un-sanitized raw attempt and audit bundle into a strictly allowlisted Replay payload.
 * Guaranteeing no secret keys, hidden inputs, or thresholds ever reach the client.
 */
export function projectReplayPayload(raw: {
  attemptId: string;
  submittedAt: string;
  taskTitle: string;
  taskVersion: number;
  rubricVersion: number;
  inputHash: string;
  visibleTests: { title: string; passed: boolean }[];
  hiddenTotal: number;
  hiddenPassed: number;
  optimalityTier?: string;
  aiCriteria: {
    criterion: string;
    criterionTitle: string;
    run1Score: number;
    run2Score: number;
    evidenceQuote: string;
    rawReason: string;
    injectionFlag: boolean;
    ambiguousFlag: boolean;
  }[];
  followups: {
    position: number;
    gapTags: string[];
    questionText: string;
    learnerAnswer: string;
    score: number | null;
    rawReason?: string;
    stopRuleOutcome?: string;
  }[];
  confidence: {
    level: "high" | "medium" | "low";
    conditionsApplied: string[];
  };
  finalScores: Record<string, { score: number; maxScore: number }>;
  auditAction: string;
  auditRecordedAt: string;
  secretCorpus: string[];
}): ReplayAllowlist {
  const sanitizedAi = raw.aiCriteria.map((c) => {
    const diff = Math.abs(c.run1Score - c.run2Score);
    const agreement: "agree" | "differ_1" | "differ_2_plus" =
      diff === 0 ? "agree" : diff === 1 ? "differ_1" : "differ_2_plus";

    return {
      criterion: c.criterion,
      criterionTitle: c.criterionTitle,
      run1Score: c.run1Score,
      run2Score: c.run2Score,
      agreement,
      evidenceQuote: (c.evidenceQuote || "").slice(0, 300),
      shortReason: sanitizeReasonText(c.rawReason, raw.secretCorpus),
      injectionFlag: Boolean(c.injectionFlag),
      ambiguousFlag: Boolean(c.ambiguousFlag),
    };
  });

  return {
    attemptId: raw.attemptId,
    submittedAt: raw.submittedAt,
    taskTitle: raw.taskTitle,
    taskVersion: raw.taskVersion,
    rubricVersion: raw.rubricVersion,
    inputHash: raw.inputHash,
    visibleTests: raw.visibleTests.map((t) => ({ title: t.title, passed: Boolean(t.passed) })),
    hiddenSummary: {
      passed: raw.hiddenPassed === raw.hiddenTotal,
      count: raw.hiddenTotal,
      category: `${raw.hiddenPassed} of ${raw.hiddenTotal} hidden edge-case checks passed`,
    },
    optimalityTier: raw.optimalityTier
      ? {
          tier: raw.optimalityTier,
          genericReason: "Execution time and memory usage align with efficient implementation patterns.",
        }
      : undefined,
    aiReasoning: sanitizedAi,
    followups: raw.followups.map((f) => ({
      position: f.position,
      gapTags: f.gapTags || [],
      questionText: f.questionText,
      learnerAnswer: f.learnerAnswer,
      score: f.score,
      stopRuleOutcome: f.stopRuleOutcome,
    })),
    confidence: raw.confidence,
    finalScores: raw.finalScores,
    auditEntry: {
      action: raw.auditAction,
      inputHash: raw.inputHash,
      recordedAt: raw.auditRecordedAt,
    },
  };
}

/**
 * Builds the Recruiter Method Card.
 * Exposes NO raw model output, NO key answers, and NO learner text unless separate submission consent was granted.
 */
export function buildRecruiterMethodCard(input: {
  assessmentName: string;
  taskVersion: number;
  rubricVersion: number;
  confidenceLevel: "high" | "medium" | "low";
  aiDisclosure: boolean;
  flagsRaised: string[];
  submissionConsented: boolean;
  submissionCode?: string;
  report?: Record<string, string>;
}): RecruiterMethodCard {
  return {
    assessmentName: input.assessmentName,
    taskVersion: input.taskVersion,
    rubricVersion: input.rubricVersion,
    confidenceLevel: input.confidenceLevel,
    confidenceDerivation:
      input.confidenceLevel === "high"
        ? "Derived from dual independent Gemini scoring agreement, deterministic test suite pass, and zero safety flags."
        : input.confidenceLevel === "medium"
        ? "Derived from minor run score variance (within 1 point) or partial edge-case coverage."
        : "Low confidence triggered due to run disagreement (>1 point), safety flags, or runner retry.",
    aiDisclosure: input.aiDisclosure,
    flagsRaised: input.flagsRaised,
    submissionConsented: input.submissionConsented,
    ...(input.submissionConsented
      ? {
          consentedSubmissionText: input.submissionCode,
          consentedReport: input.report,
        }
      : {}),
  };
}
