"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
  Terminal,
  FileText,
  HelpCircle,
  Hash,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { ReplayAllowlist, RecruiterMethodCard } from "@/lib/server/replay-sanitiser";

interface AssessmentReplayViewProps {
  attemptId: string;
  onClose?: () => void;
  onOpenAttempt?: (id: string) => void;
}

export default function AssessmentReplayView({
  attemptId,
  onClose,
  onOpenAttempt,
}: AssessmentReplayViewProps) {
  const [data, setData] = useState<{
    role: string;
    replay?: ReplayAllowlist;
    methodCard?: RecruiterMethodCard;
    attemptCode?: string;
    attemptReport?: Record<string, string>;
    retryAttempts?: { id: string; submittedAt: string }[];
    reviewerDetails?: { similarityFlag: boolean; flags: string[] };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
  });

  const [integrityStatus, setIntegrityStatus] = useState<{
    tested: boolean;
    verifying: boolean;
    match: boolean;
    recomputedHash?: string;
    storedHash?: string;
  }>({
    tested: false,
    verifying: false,
    match: false,
  });

  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/attempts/${attemptId}/replay`, {
      headers: {
        "x-demo-role": localStorage.getItem("nextlearn.demo_role") || "learner",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Replay request failed (${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load replay.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  const verifyIntegrity = async () => {
    setIntegrityStatus((prev) => ({ ...prev, verifying: true }));
    try {
      const res = await fetch(`/api/attempts/${attemptId}/replay/verify-integrity`, {
        method: "POST",
        headers: {
          "x-demo-role": localStorage.getItem("nextlearn.demo_role") || "learner",
        },
      });
      const json = await res.json();
      setIntegrityStatus({
        tested: true,
        verifying: false,
        match: Boolean(json.match),
        recomputedHash: json.recomputedHash,
        storedHash: json.storedHash,
      });
    } catch {
      setIntegrityStatus({
        tested: true,
        verifying: false,
        match: false,
      });
    }
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="replay-container loading-state">
        <div className="replay-skeleton">
          <div className="skeleton-bar" style={{ width: "40%", height: "24px" }} />
          <div className="skeleton-bar" style={{ width: "70%", height: "16px", marginTop: "8px" }} />
          <div className="skeleton-box" style={{ height: "320px", marginTop: "24px" }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="replay-container error-state">
        <div className="notice error">
          <span>{error || "Could not load assessment replay."}</span>
        </div>
        {onClose && (
          <button className="secondary" onClick={onClose} style={{ marginTop: "12px" }}>
            Close
          </button>
        )}
      </div>
    );
  }

  // If user is recruiter, show Method Card ONLY
  if (data.role === "recruiter" && data.methodCard) {
    const card = data.methodCard;
    return (
      <div className="replay-container recruiter-method-card-view">
        <div className="replay-header">
          <div className="eyebrow">RECRUITER METHOD CARD · AUDITABLE PROOF</div>
          <h2>{card.assessmentName} Evaluation Method</h2>
          <p className="disclaimer-text">
            Experimental evidence from task-based work. Not a validated predictor of job performance.
          </p>
        </div>

        <div className="method-card-grid">
          <div className="method-card-row">
            <strong>Task Version:</strong>
            <span>v{card.taskVersion}</span>
          </div>
          <div className="method-card-row">
            <strong>Rubric Version:</strong>
            <span>v{card.rubricVersion}</span>
          </div>
          <div className="method-card-row">
            <strong>Confidence Level:</strong>
            <span className={`confidence-pill ${card.confidenceLevel}`}>
              {card.confidenceLevel.toUpperCase()}
            </span>
          </div>
          <div className="method-card-row">
            <strong>Confidence Derivation:</strong>
            <p>{card.confidenceDerivation}</p>
          </div>
          <div className="method-card-row">
            <strong>AI Disclosure:</strong>
            <span>{card.aiDisclosure ? "AI assistance disclosed by learner" : "No AI assistance reported"}</span>
          </div>
          <div className="method-card-row">
            <strong>Safety & Integrity Flags:</strong>
            <span>{card.flagsRaised.length ? card.flagsRaised.join(", ") : "Zero flags raised"}</span>
          </div>
          <div className="method-card-row">
            <strong>Submission Detail Consent:</strong>
            <span>{card.submissionConsented ? "Candidate consented to code inspection" : "Private (Score and evidence only)"}</span>
          </div>

          {card.submissionConsented && card.consentedSubmissionText && (
            <div className="method-card-submission">
              <div className="panel-kicker">CONSENTED SUBMISSION CODE</div>
              <pre>{card.consentedSubmissionText}</pre>
            </div>
          )}
        </div>

        {onClose && (
          <button className="secondary" onClick={onClose} style={{ marginTop: "20px" }}>
            Close Method Card
          </button>
        )}
      </div>
    );
  }

  const replay = data.replay!;
  const steps = [
    { num: 1, title: "Submission Received", subtitle: "Timestamp, task version & SHA-256 input hash" },
    { num: 2, title: "Visible Acceptance Tests", subtitle: "Deterministic visible unit cases" },
    { num: 3, title: "Hidden Verification Checks", subtitle: "Private edge-case checks (counts only)" },
    { num: 4, title: "Optimality & Efficiency Tier", subtitle: "Time and space implementation tier" },
    { num: 5, title: "AI Reasoning (Dual Runs)", subtitle: "Independent Gemini runs scored against rubric" },
    { num: 6, title: "Follow-Up Questions Defense", subtitle: "Gaps probed & stop-rule outcome" },
    { num: 7, title: "Confidence Derivation", subtitle: "Algorithmic confidence conditions evaluated" },
    { num: 8, title: "Final Scores & Cryptographic Integrity", subtitle: "Audit reference and SHA-256 verification" },
  ];

  return (
    <div className="replay-container">
      {/* Top Header */}
      <div className="replay-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="eyebrow">AUDITABLE TRACEABILITY · HOW THIS RESULT WAS PRODUCED</div>
            <h2>{replay.taskTitle}</h2>
            <p className="replay-subhead">
              Step-by-step verified record of tests, dual AI runs, and confidence derivation.
            </p>
          </div>
          {onClose && (
            <button className="icon-button" onClick={onClose} aria-label="Close replay view">
              ×
            </button>
          )}
        </div>

        {/* Step Navigation Bar */}
        <div className="replay-step-nav" role="tablist" aria-label="Replay steps navigation">
          {steps.map((s) => (
            <button
              key={s.num}
              role="tab"
              aria-selected={activeStep === s.num}
              className={`step-nav-btn ${activeStep === s.num ? "active" : ""}`}
              onClick={() => {
                setActiveStep(s.num);
                setExpandedSteps((prev) => ({ ...prev, [s.num]: true }));
              }}
            >
              <span className="step-num">{s.num}</span>
              <span className="step-label">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Previous / Next Controls */}
        <div className="replay-prev-next-bar">
          <button
            className="secondary step-arrow-btn"
            disabled={activeStep <= 1}
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft size={16} />
            <span>Previous Step</span>
          </button>
          <span className="step-indicator-text">
            Step {activeStep} of 8
          </span>
          <button
            className="secondary step-arrow-btn"
            disabled={activeStep >= 8}
            onClick={() => setActiveStep((prev) => Math.min(8, prev + 1))}
          >
            <span>Next Step</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Step Timeline List */}
      <div className="replay-timeline">
        {/* STEP 1: Submission Received */}
        <article className={`replay-step-card ${activeStep === 1 ? "focused" : ""}`}>
          <div className="step-header" onClick={() => toggleStep(1)}>
            <div className="step-badge">
              <span>1</span>
            </div>
            <div className="step-info">
              <h3>Submission Received</h3>
              <p>Task v{replay.taskVersion} · Rubric v{replay.rubricVersion} · {new Date(replay.submittedAt).toLocaleString()}</p>
            </div>
            <button className="expand-btn" aria-label={expandedSteps[1] ? "Collapse step" : "Expand step"}>
              {expandedSteps[1] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSteps[1] && (
            <div className="step-content">
              <div className="replay-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Task Specification</span>
                  <strong>{replay.taskTitle} (v{replay.taskVersion})</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Rubric Applied</span>
                  <strong>Criterion Rubric v{replay.rubricVersion}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Received At</span>
                  <strong>{new Date(replay.submittedAt).toUTCString()}</strong>
                </div>
                <div className="meta-item hash-item">
                  <span className="meta-label">Input SHA-256 Hash</span>
                  <div className="hash-display">
                    <code>{replay.inputHash}</code>
                    <button
                      type="button"
                      className="copy-hash-btn"
                      onClick={() => handleCopyHash(replay.inputHash)}
                      title="Copy SHA-256 hash"
                    >
                      {copiedHash ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {data.attemptCode && (
                <details className="raw-code-toggle" style={{ marginTop: "12px" }}>
                  <summary>View submitted code & report snapshot</summary>
                  <pre className="code-block">{data.attemptCode}</pre>
                  {data.attemptReport && (
                    <div className="report-preview" style={{ marginTop: "8px" }}>
                      {Object.entries(data.attemptReport).map(([k, v]) => (
                        <p key={k}>
                          <strong>{k.replace(/_/g, " ")}:</strong> {v}
                        </p>
                      ))}
                    </div>
                  )}
                </details>
              )}
            </div>
          )}
        </article>

        {/* STEP 2: Visible Acceptance Tests */}
        <article className={`replay-step-card ${activeStep === 2 ? "focused" : ""}`}>
          <div className="step-header" onClick={() => toggleStep(2)}>
            <div className="step-badge">
              <span>2</span>
            </div>
            <div className="step-info">
              <h3>Visible Acceptance Tests</h3>
              <p>{replay.visibleTests.filter((t) => t.passed).length} of {replay.visibleTests.length} tests passed deterministically</p>
            </div>
            <button className="expand-btn">
              {expandedSteps[2] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSteps[2] && (
            <div className="step-content">
              <ul className="visible-test-results">
                {replay.visibleTests.map((test, idx) => (
                  <li key={idx} className={`test-result-row ${test.passed ? "passed" : "failed"}`}>
                    <span className="status-indicator">
                      {test.passed ? <CheckCircle2 size={16} /> : <AlertOctagon size={16} />}
                      <strong>{test.passed ? "PASS" : "FAIL"}</strong>
                    </span>
                    <span className="test-name">{test.title}</span>
                  </li>
                ))}
              </ul>
              <small className="step-footnote">
                Executed in isolated sandbox. Output correctness verified deterministically.
              </small>
            </div>
          )}
        </article>

        {/* STEP 3: Hidden Verification Checks */}
        <article className={`replay-step-card ${activeStep === 3 ? "focused" : ""}`}>
          <div className="step-header" onClick={() => toggleStep(3)}>
            <div className="step-badge">
              <span>3</span>
            </div>
            <div className="step-info">
              <h3>Hidden Verification Checks</h3>
              <p>{replay.hiddenSummary.category}</p>
            </div>
            <button className="expand-btn">
              {expandedSteps[3] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSteps[3] && (
            <div className="step-content">
              <div className="hidden-summary-box">
                <div className="hidden-stat-row">
                  <span className="status-indicator">
                    {replay.hiddenSummary.passed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <strong>{replay.hiddenSummary.passed ? "ALL CHECKS MET" : "PARTIAL PASS"}</strong>
                  </span>
                  <span className="hidden-desc">{replay.hiddenSummary.category}</span>
                </div>
                <div className="hidden-privacy-notice">
                  <HelpCircle size={14} />
                  <span>
                    In accordance with assessment integrity rules, private inputs and expected return values are never transmitted to clients.
                  </span>
                </div>
              </div>
            </div>
          )}
        </article>

        {/* STEP 4: Optimality Tier */}
        <article className={`replay-step-card ${activeStep === 4 ? "focused" : ""}`}>
          <div className="step-header" onClick={() => toggleStep(4)}>
            <div className="step-badge">
              <span>4</span>
            </div>
            <div className="step-info">
              <h3>Optimality Tier</h3>
              <p>{replay.optimalityTier ? replay.optimalityTier.tier : "Evaluated alongside correctness"}</p>
            </div>
            <button className="expand-btn">
              {expandedSteps[4] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSteps[4] && (
            <div className="step-content">
              {replay.optimalityTier ? (
                <div className="optimality-box">
                  <div className="tier-badge">
                    <Layers size={16} />
                    <strong>{replay.optimalityTier.tier}</strong>
                  </div>
                  <p>{replay.optimalityTier.genericReason}</p>
                  <small className="step-footnote">
                    Evaluated without revealing internal thresholds or reference benchmarks.
                  </small>
                </div>
              ) : (
                <p>Standard correctness criteria applied without separate optimality sub-tier.</p>
              )}
            </div>
          )}
        </article>

        {/* STEP 5: AI Reasoning (Two Runs Side-by-Side) */}
        <article className={`replay-step-card ${activeStep === 5 ? "focused" : ""}`}>
          <div className="step-header" onClick={() => toggleStep(5)}>
            <div className="step-badge">
              <span>5</span>
            </div>
            <div className="step-info">
              <h3>AI Reasoning · Dual Independent Runs</h3>
              <p>Two Gemini runs compared side-by-side with agreement status</p>
            </div>
            <button className="expand-btn">
              {expandedSteps[5] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSteps[5] && (
            <div className="step-content">
              <div className="ai-runs-grid">
                {replay.aiReasoning.map((crit) => (
                  <div key={crit.criterion} className="ai-criterion-card">
                    <div className="crit-card-header">
                      <h4>{crit.criterionTitle}</h4>
                      <div className={`agreement-badge ${crit.agreement}`}>
                        {crit.agreement === "agree" ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Agree (0 delta)</span>
                          </>
                        ) : crit.agreement === "differ_1" ? (
                          <>
                            <AlertTriangle size={14} />
                            <span>Differ by 1</span>
                          </>
                        ) : (
                          <>
                            <AlertOctagon size={14} />
                            <span>Differ by 2+</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="dual-scores-row">
                      <div className="run-score-cell">
                        <span className="run-tag">RUN 1</span>
                        <strong className="run-val">{crit.run1Score} pts</strong>
                      </div>
                      <div className="run-score-cell">
                        <span className="run-tag">RUN 2</span>
                        <strong className="run-val">{crit.run2Score} pts</strong>
                      </div>
                    </div>

                    {crit.evidenceQuote && (
                      <div className="evidence-quote-box">
                        <span className="quote-tag">LEARNER EVIDENCE QUOTE:</span>
                        <blockquote>&ldquo;{crit.evidenceQuote}&rdquo;</blockquote>
                      </div>
                    )}

                    <div className="reason-box">
                      <span className="reason-tag">EVALUATOR REASON:</span>
                      <p>{crit.shortReason}</p>
                    </div>

                    {(crit.injectionFlag || crit.ambiguousFlag) && (
                      <div className="flags-box">
                        {crit.injectionFlag && (
                          <span className="flag-pill danger">
                            <AlertOctagon size={12} /> Prompt manipulation flag
                          </span>
                        )}
                        {crit.ambiguousFlag && (
                          <span className="flag-pill warning">
                            <AlertTriangle size={12} /> Phrasing ambiguity flagged
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <small className="step-footnote">
                AI evaluates content only; grammar and phrasing style are strictly unpenalized.
              </small>
            </div>
          )}
        </article>

        {/* STEP 6: Follow-Up Questions Defense */}
        <article className={`replay-step-card ${activeStep === 6 ? "focused" : ""}`}>
          <div className="step-header" onClick={() => toggleStep(6)}>
            <div className="step-badge">
              <span>6</span>
            </div>
            <div className="step-info">
              <h3>Follow-Up Questions Defense</h3>
              <p>{replay.followups.length} adaptive follow-up(s) recorded</p>
            </div>
            <button className="expand-btn">
              {expandedSteps[6] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSteps[6] && (
            <div className="step-content">
              {replay.followups.length > 0 ? (
                <div className="followups-timeline">
                  {replay.followups.map((f) => (
                    <div key={f.position} className="followup-item">
                      <div className="followup-top">
                        <span className="q-pos">QUESTION #{f.position}</span>
                        {f.score !== null && (
                          <span className="score-pill">{f.score} / 2 pts</span>
                        )}
                      </div>
                      <strong className="q-text">{f.questionText}</strong>
                      <p className="learner-ans">
                        <strong>Learner Defense:</strong> {f.learnerAnswer || "No answer recorded"}
                      </p>
                      {f.gapTags.length > 0 && (
                        <div className="gap-tags-row">
                          <span className="gap-kicker">Triggered by gaps:</span>
                          {f.gapTags.map((gt) => (
                            <span key={gt} className="gap-chip">{gt}</span>
                          ))}
                        </div>
                      )}
                      {f.stopRuleOutcome && (
                        <div className="stop-rule-box">
                          <CheckCircle2 size={13} />
                          <span>{f.stopRuleOutcome}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No follow-up questions were required for this task attempt.</p>
              )}

              <div className="non-negotiable-rule-box">
                <HelpCircle size={14} />
                <span>
                  <strong>Non-negotiable rule:</strong> The count of follow-ups never influences your score; it only determines evaluator confidence.
                </span>
              </div>
            </div>
          )}
        </article>

        {/* STEP 7: Confidence Derivation */}
        <article className={`replay-step-card ${activeStep === 7 ? "focused" : ""}`}>
          <div className="step-header" onClick={() => toggleStep(7)}>
            <div className="step-badge">
              <span>7</span>
            </div>
            <div className="step-info">
              <h3>Confidence Derivation</h3>
              <p>Resulting Confidence: <strong className={`conf-${replay.confidence.level}`}>{replay.confidence.level.toUpperCase()}</strong></p>
            </div>
            <button className="expand-btn">
              {expandedSteps[7] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSteps[7] && (
            <div className="step-content">
              <div className="confidence-overview-row">
                <span className={`confidence-banner ${replay.confidence.level}`}>
                  <ShieldCheck size={20} />
                  <span>{replay.confidence.level.toUpperCase()} CONFIDENCE</span>
                </span>
              </div>

              <div className="conditions-checklist">
                <span className="conditions-title">Conditions evaluated against production rule:</span>
                <ul>
                  {replay.confidence.conditionsApplied.map((cond, i) => (
                    <li key={i} className="condition-row">
                      <CheckCircle2 size={15} />
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </article>

        {/* STEP 8: Final Scores & Cryptographic Integrity */}
        <article className={`replay-step-card ${activeStep === 8 ? "focused" : ""}`}>
          <div className="step-header" onClick={() => toggleStep(8)}>
            <div className="step-badge">
              <span>8</span>
            </div>
            <div className="step-info">
              <h3>Final Criterion Scores & Integrity</h3>
              <p>Cryptographic SHA-256 verification against immutable audit log</p>
            </div>
            <button className="expand-btn">
              {expandedSteps[8] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSteps[8] && (
            <div className="step-content">
              {/* Criterion Scores Table */}
              <div className="scores-table">
                <div className="table-header-row">
                  <span>CRITERION</span>
                  <span>SCORE</span>
                </div>
                {Object.entries(replay.finalScores).map(([crit, s]) => (
                  <div key={crit} className="table-data-row">
                    <span className="crit-name">{crit.replace(/_/g, " ")}</span>
                    <strong className="crit-val">{s.score} / {s.maxScore}</strong>
                  </div>
                ))}
              </div>

              {/* Integrity Verification Action */}
              <div className="integrity-panel">
                <div className="integrity-header">
                  <Hash size={18} />
                  <div>
                    <strong>Cryptographic Audit Verification</strong>
                    <p>Recomputes the SHA-256 hash of the stored inputs to prove zero tampering.</p>
                  </div>
                </div>

                <div className="integrity-action-row">
                  <button
                    type="button"
                    className="primary verify-btn"
                    disabled={integrityStatus.verifying}
                    onClick={verifyIntegrity}
                  >
                    <RefreshCw size={14} className={integrityStatus.verifying ? "spin" : ""} />
                    <span>{integrityStatus.verifying ? "Verifying Hash…" : "Verify Integrity"}</span>
                  </button>

                  {integrityStatus.tested && (
                    <div className={`verification-outcome ${integrityStatus.match ? "verified" : "mismatched"}`}>
                      {integrityStatus.match ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>SHA-256 Match: Stored record verified authentic and untampered.</span>
                        </>
                      ) : (
                        <>
                          <AlertOctagon size={16} />
                          <span>SHA-256 Mismatch: Input record discrepancy detected!</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="audit-ref-tag">
                  Audit action: <code>{replay.auditEntry.action}</code> · {new Date(replay.auditEntry.recordedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </article>
      </div>

      {/* Retry Comparison Section (Stretch) */}
      {data.retryAttempts && data.retryAttempts.length > 0 && (
        <section className="replay-retry-section">
          <div className="retry-header">
            <Sparkles size={16} />
            <div>
              <strong>Compare With Other Attempts for this Task</strong>
              <p>You have {data.retryAttempts.length} other attempt(s) recorded.</p>
            </div>
          </div>
          <div className="retry-buttons">
            {data.retryAttempts.map((att) => (
              <button
                key={att.id}
                className="secondary retry-att-btn"
                onClick={() => onOpenAttempt?.(att.id)}
              >
                <span>Attempt {att.id.slice(0, 8)} · {new Date(att.submittedAt).toLocaleDateString()}</span>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="disclaimer-footer">
        <HelpCircle size={14} />
        <p>
          Experimental evidence from a sandbox environment. Not a validated predictor of job performance.
        </p>
      </div>
    </div>
  );
}
