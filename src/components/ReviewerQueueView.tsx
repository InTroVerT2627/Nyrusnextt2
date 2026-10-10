"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Shield,
  HelpCircle,
  RefreshCw,
  Sliders,
  Scale,
  GitCompare,
  FileText,
  User,
  Clock,
} from "lucide-react";
import CalibrationPanel from "@/components/CalibrationPanel";

type Score = {
  criterion: string;
  score: number;
  max_score: number;
  source: string;
  feedback: string;
  confidence: string;
};

type FollowupItem = {
  position: number;
  question_shown: string;
  answer_text: string;
  score: number;
  evidence_quote?: string;
  ai_reason?: string;
};

type ReviewItem = {
  attemptId: string;
  attemptType: string;
  submittedAt: string;
  code: string;
  report?: Record<string, string>;
  similarityFlag: boolean;
  similarityComparison?: {
    code: string;
    similarity: number;
  } | null;
  aiDisclosure?: boolean;
  task?: {
    slug: string;
    language: string;
    mission?: { title?: string; short_title?: string };
    prompt?: string;
  } | null;
  candidate?: {
    id: string;
    displayName: string;
  };
  criteria: Score[];
  followups: FollowupItem[];
  appeal?: {
    id: string;
    criterion: string;
    reason: string;
    status: string;
    created_at: string;
  } | null;
};

type DraftDecision = {
  criterion: string;
  score: string;
  reason: string;
  decision: "confirmed" | "overturned";
  similarityCleared: boolean;
};

const criterionLabels: Record<string, string> = {
  fix_correctness: "Fix correctness",
  edge_cases: "Edge cases",
  root_cause: "Root cause",
  explanation: "Explanation clarity",
  followup_reasoning: "Follow-up reasoning",
  failing_test: "Failing test validity",
  flaw_located: "Flaw located",
  flaw_explanation: "Flaw explanation",
};

const reviewerReasonPresets = [
  "Confirmed: Automated rubric evaluation accurately reflects missing boundary analysis.",
  "Overridden: Candidate explanation accurately articulates root cause despite colloquial phrasing.",
  "Overridden: Follow-up answer demonstrates complete conceptual understanding of concurrency.",
  "Similarity cleared: Code pattern represents standard idiomatic library usage.",
];

export default function ReviewerQueueView({ onDone }: { onDone: () => Promise<void> }) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filterType, setFilterType] = useState<"all" | "appeals" | "low_confidence" | "similarity">("all");
  const [drafts, setDrafts] = useState<Record<string, DraftDecision>>({});

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const demoRole = typeof window !== "undefined" ? localStorage.getItem("nextlearn.demo_role") : null;
      const headers: Record<string, string> = {
        "content-type": "application/json",
        ...(demoRole ? { "x-demo-role": demoRole } : {}),
      };
      const res = await fetch("/api/review/queue", { headers, cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const saveDecision = async (item: ReviewItem) => {
    const id = item.attemptId;
    const form = drafts[id];
    if (!form?.reason || form.reason.trim().length < 10) {
      setError("A written review reason of at least 10 characters is mandatory for the audit log.");
      return;
    }

    setBusyId(id);
    setError("");
    setMessage("");

    try {
      const demoRole = typeof window !== "undefined" ? localStorage.getItem("nextlearn.demo_role") : null;
      const headers: Record<string, string> = {
        "content-type": "application/json",
        ...(demoRole ? { "x-demo-role": demoRole } : {}),
      };
      const res = await fetch("/api/review/resolve", {
        method: "POST",
        headers,
        body: JSON.stringify({
          attemptId: id,
          appealId: item.appeal?.id,
          criterion: form.criterion,
          decision: form.decision,
          ...(form.decision === "overturned" ? { score: Number(form.score) } : {}),
          similarityCleared: form.similarityCleared,
          reason: form.reason.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Review decision could not be recorded.");
      }

      setMessage(`Decision saved for attempt ${id.slice(0, 8)}. Audit log updated.`);
      await loadQueue();
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review decision failed.");
    } finally {
      setBusyId("");
    }
  };

  const appealsCount = items.filter((i) => Boolean(i.appeal)).length;
  const similarityCount = items.filter((i) => Boolean(i.similarityFlag)).length;
  const lowConfidenceCount = items.filter((i) => !i.appeal && !i.similarityFlag).length;

  const filteredItems = items.filter((item) => {
    if (filterType === "appeals") return Boolean(item.appeal);
    if (filterType === "similarity") return Boolean(item.similarityFlag);
    if (filterType === "low_confidence") return !item.appeal && !item.similarityFlag;
    return true;
  });

  return (
    <div className="reviewer-workbench">
      {/* Intro Header */}
      <div className="page-intro">
        <div className="eyebrow">HUMAN-IN-THE-LOOP REVIEW WORKBENCH</div>
        <h1>Human Review Queue</h1>
        <p>
          Prompt manipulation, possible duplicate submissions, ambiguous scoring, runner failures, low confidence, and candidate challenges require a written human decision.
        </p>
      </div>

      {/* Metrics & Filter Bar */}
      <section className="review-stats-card">
        <div className="review-stats-row">
          <div className="stat-box">
            <span className="stat-label">Total in Queue</span>
            <strong className="stat-val">{items.length}</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Learner Appeals</span>
            <strong className="stat-val warning">{appealsCount}</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Similarity Flags</span>
            <strong className="stat-val warning">{similarityCount}</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Low Confidence AI</span>
            <strong className="stat-val">{lowConfidenceCount}</strong>
          </div>
          <button
            className="secondary-btn refresh-btn"
            onClick={() => void loadQueue()}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="review-filters-bar">
          <span className="filter-label">Filter Queue:</span>
          <button
            className={`filter-pill ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Items ({items.length})
          </button>
          <button
            className={`filter-pill ${filterType === "appeals" ? "active" : ""}`}
            onClick={() => setFilterType("appeals")}
          >
            <Scale size={13} />
            Learner Appeals ({appealsCount})
          </button>
          <button
            className={`filter-pill ${filterType === "similarity" ? "active" : ""}`}
            onClick={() => setFilterType("similarity")}
          >
            <GitCompare size={13} />
            Similarity Flags ({similarityCount})
          </button>
          <button
            className={`filter-pill ${filterType === "low_confidence" ? "active" : ""}`}
            onClick={() => setFilterType("low_confidence")}
          >
            <Sliders size={13} />
            Low-Confidence AI ({lowConfidenceCount})
          </button>
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div className="notice error" role="alert">
          <AlertCircle size={15} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">×</button>
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          <CheckCircle2 size={15} />
          <span>{message}</span>
          <button onClick={() => setMessage("")} aria-label="Dismiss message">×</button>
        </div>
      )}

      {/* Queue List */}
      {loading ? (
        <div className="queue-loading">
          <div className="loading-card skeleton-pulse" />
          <div className="loading-card skeleton-pulse" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <CheckCircle2 size={36} />
          </div>
          <h2>The review queue is currently clear</h2>
          <p>
            {filterType === "all"
              ? "All pending attempts, appeals, and similarity flags have been reviewed and audited."
              : `No items matching the "${filterType.replace("_", " ")}" filter.`}
          </p>
        </div>
      ) : (
        <div className="review-items-list">
          {filteredItems.map((item) => {
            const id = item.attemptId;
            const scores = item.criteria;
            const currentDraft = drafts[id] ?? {
              criterion: item.appeal?.criterion ?? scores[0]?.criterion ?? "root_cause",
              score: String(scores[0]?.score ?? 0),
              reason: "",
              decision: "confirmed" as const,
              similarityCleared: false,
            };

            const selectedCriterionScore = scores.find((s) => s.criterion === currentDraft.criterion);
            const comparison = item.similarityComparison;

            return (
              <article className="review-card" key={id}>
                {/* Header Strip */}
                <div className="review-card-header">
                  <div className="header-badges-group">
                    <span
                      className={`review-type-badge ${
                        item.appeal ? "appeal" : item.similarityFlag ? "similarity" : "low-conf"
                      }`}
                    >
                      {item.appeal ? "LEARNER CHALLENGE" : item.similarityFlag ? "SIMILARITY FLAG" : "LOW-CONFIDENCE"}
                    </span>
                    <span className="attempt-badge">ATTEMPT: {id.slice(0, 8)}</span>
                    <span className="type-badge">{item.attemptType.toUpperCase()}</span>
                  </div>
                  <div className="submission-meta">
                    <Clock size={12} />
                    <span>{new Date(item.submittedAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Candidate & Task Info */}
                <div className="review-target-info">
                  <h2>
                    {item.task?.mission?.title || item.task?.slug || "Boss Assessment Task"}
                  </h2>
                  <div className="candidate-ident">
                    <User size={13} />
                    <span>Candidate: {item.candidate?.displayName || item.candidate?.id || "Synthetic Learner"}</span>
                    <span className="ai-disclosure-badge">
                      {item.aiDisclosure ? "AI assistance disclosed" : "No AI assistance disclosed"}
                    </span>
                  </div>
                </div>

                {/* Learner Challenge Callout (If Applicable) */}
                {item.appeal && (
                  <div className="appeal-callout-panel">
                    <div className="appeal-callout-header">
                      <Scale size={15} />
                      <strong>Learner Challenge on criterion: {criterionLabels[item.appeal.criterion] || item.appeal.criterion}</strong>
                    </div>
                    <p className="appeal-reason-text">&quot;{item.appeal.reason}&quot;</p>
                  </div>
                )}

                {/* Similarity Flag Notice & Split Comparison View */}
                {item.similarityFlag && (
                  <div className="similarity-panel">
                    <div className="similarity-header-banner">
                      <AlertTriangle size={15} />
                      <div>
                        <strong>Possible near-identical code detected ({Math.round((comparison?.similarity ?? 0.85) * 100)}% match)</strong>
                        <p>
                          Compare the candidate&apos;s submission against the nearest anonymized peer submission below before determining if it is coincidental or copied.
                        </p>
                      </div>
                    </div>

                    {comparison && (
                      <div className="split-diff-container">
                        <div className="diff-pane candidate-pane">
                          <div className="diff-pane-title">
                            <FileCode size={13} />
                            <span>Candidate Submission ({id.slice(0, 8)})</span>
                          </div>
                          <pre className="diff-code-view">{item.code}</pre>
                        </div>
                        <div className="diff-pane peer-pane">
                          <div className="diff-pane-title">
                            <GitCompare size={13} />
                            <span>Anonymized Peer Submission ({Math.round(comparison.similarity * 100)}% match)</span>
                          </div>
                          <pre className="diff-code-view">{comparison.code}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submitted Code (If not in split view) */}
                {!item.similarityFlag && (
                  <div className="submission-code-section">
                    <div className="section-kicker-bar">
                      <FileCode size={13} />
                      <span>SUBMITTED CODE</span>
                    </div>
                    <pre className="code-view-box">{item.code}</pre>
                  </div>
                )}

                {/* Incident Report Preview */}
                {item.report && (
                  <div className="report-preview-section">
                    <div className="section-kicker-bar">
                      <FileText size={13} />
                      <span>INCIDENT REPORT EXPLANATION</span>
                    </div>
                    <div className="report-content-grid">
                      {Object.entries(item.report).map(([head, body]) => (
                        <div className="report-cell" key={head}>
                          <strong>{head.replaceAll("_", " ")}:</strong>
                          <p>{String(body)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Defense Q&A Transcript */}
                {item.followups.length > 0 && (
                  <div className="followup-defense-section">
                    <div className="section-kicker-bar">
                      <HelpCircle size={13} />
                      <span>FOLLOW-UP DEFENSE QUESTIONS & ANSWERS</span>
                    </div>
                    <div className="followup-items-stack">
                      {item.followups.map((f, i) => (
                        <div className="review-followup-item" key={i}>
                          <div className="f-q">
                            <strong>Q{f.position}: {f.question_shown}</strong>
                          </div>
                          <div className="f-a">
                            <strong>Candidate response:</strong> {f.answer_text}
                          </div>
                          <div className="f-meta">
                            <span>Score: {f.score}</span>
                            {f.ai_reason && <span className="ai-reason">· Grader Note: {f.ai_reason}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Criterion Scores Table */}
                <div className="criteria-overview-section">
                  <div className="section-kicker-bar">
                    <Sliders size={13} />
                    <span>CURRENT CRITERION SCORES</span>
                  </div>
                  <div className="criteria-scores-grid">
                    {scores.map((sc) => (
                      <div className="score-summary-cell" key={sc.criterion}>
                        <span className="crit-title">{criterionLabels[sc.criterion] || sc.criterion}</span>
                        <strong className="crit-score-num">
                          {sc.score} / {sc.max_score}
                        </strong>
                        <small className="crit-source">
                          {sc.source} · {sc.confidence} conf
                        </small>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Human Adjudication Decision Form */}
                <div className="adjudication-form-panel">
                  <div className="adjudication-header">
                    <Shield size={16} />
                    <div>
                      <h3>Human Adjudication & Scoring Decision</h3>
                      <p>
                        Confirm the automated score or override with a human evaluation. All overrides require written rationale.
                      </p>
                    </div>
                  </div>

                  <div className="form-fields-grid">
                    {/* Criterion Selector */}
                    <div className="form-field-group">
                      <label htmlFor={`criterion-${id}`}>Target Criterion</label>
                      <select
                        id={`criterion-${id}`}
                        value={currentDraft.criterion}
                        onChange={(e) => {
                          const newCrit = e.target.value;
                          const critObj = scores.find((s) => s.criterion === newCrit);
                          setDrafts((prev) => ({
                            ...prev,
                            [id]: {
                              ...currentDraft,
                              criterion: newCrit,
                              score: String(critObj?.score ?? 0),
                            },
                          }));
                        }}
                      >
                        {scores.map((s) => (
                          <option key={s.criterion} value={s.criterion}>
                            {criterionLabels[s.criterion] || s.criterion} (current: {s.score}/{s.max_score})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Decision Selector */}
                    <div className="form-field-group">
                      <label htmlFor={`decision-${id}`}>Decision</label>
                      <select
                        id={`decision-${id}`}
                        value={currentDraft.decision}
                        onChange={(e) => {
                          const dec = e.target.value as "confirmed" | "overturned";
                          setDrafts((prev) => ({
                            ...prev,
                            [id]: { ...currentDraft, decision: dec },
                          }));
                        }}
                      >
                        <option value="confirmed">Confirm Current Automated Score</option>
                        <option value="overturned">Override Criterion Score</option>
                      </select>
                    </div>

                    {/* New Score Input (if overturned) */}
                    {currentDraft.decision === "overturned" && (
                      <div className="form-field-group">
                        <label htmlFor={`new-score-${id}`}>
                          New Score (Max: {selectedCriterionScore?.max_score ?? 100})
                        </label>
                        <input
                          id={`new-score-${id}`}
                          type="number"
                          min={0}
                          max={selectedCriterionScore?.max_score ?? 100}
                          value={currentDraft.score}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [id]: { ...currentDraft, score: e.target.value },
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Similarity Flag Clear Checkbox */}
                  {item.similarityFlag && (
                    <label className="similarity-checkbox-label">
                      <input
                        type="checkbox"
                        checked={currentDraft.similarityCleared}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [id]: { ...currentDraft, similarityCleared: e.target.checked },
                          }))
                        }
                      />
                      <span>
                        I have inspected the candidate and peer submissions side by side and confirm this similarity flag should be cleared.
                      </span>
                    </label>
                  )}

                  {/* Written Reason Field */}
                  <div className="reason-field-group">
                    <div className="reason-header">
                      <label htmlFor={`reason-${id}`}>
                        Written Review Rationale <em>(Mandatory for audit trail, min 10 characters)</em>
                      </label>
                      <span className="char-count">
                        {currentDraft.reason.length} / 2000 chars
                      </span>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="reason-presets-bar">
                      <span className="preset-label">Suggested rationale:</span>
                      {reviewerReasonPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className="preset-chip"
                          onClick={() =>
                            setDrafts((prev) => ({
                              ...prev,
                              [id]: { ...currentDraft, reason: preset },
                            }))
                          }
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <textarea
                      id={`reason-${id}`}
                      rows={3}
                      value={currentDraft.reason}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [id]: { ...currentDraft, reason: e.target.value },
                        }))
                      }
                      placeholder="Detail why the score is confirmed or overridden (minimum 10 characters)..."
                      minLength={10}
                      maxLength={2000}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="adjudication-submit-row">
                    <button
                      className="primary-btn submit-decision-btn"
                      disabled={busyId === id || currentDraft.reason.trim().length < 10}
                      onClick={() => void saveDecision(item)}
                    >
                      <Shield size={14} />
                      <span>{busyId === id ? "Saving Human Decision…" : "Save Written Review Decision"}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Calibration Panel Embedded at Bottom */}
      <div className="calibration-wrapper-section">
        <CalibrationPanel />
      </div>
    </div>
  );
}
