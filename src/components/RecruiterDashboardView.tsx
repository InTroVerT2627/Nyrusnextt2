"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileCode,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

type CandidateEvidence = {
  evidenceId: string;
  attemptId: string;
  taskId: string;
  level: string;
  confidence: string;
  assessedAt: string;
  criteria: Record<string, number>;
  followupsAsked: number;
  submission?: string;
  incidentReport?: Record<string, string>;
  followups?: { question: string; answer: string; score: number }[];
  aiDisclosure?: boolean;
};

type Candidate = {
  candidateId: string;
  displayName: string;
  whySurfaced: string;
  evidence: CandidateEvidence[];
};

type RoleData = {
  slug: string;
  title: string;
  requirements: {
    skill: string;
    language: string;
    minimum_level: string;
    minimum_tasks: number;
    max_age_days: number;
  };
  humanDecisionRequired: boolean;
};

type RecruiterSearchResponse = {
  role: RoleData;
  candidates: Candidate[];
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

const quickNotes = [
  "Strong root-cause explanation and thorough prevention plan.",
  "Solid edge-case coverage and clear mental model in follow-ups.",
  "Passing code, but explanation lacked concurrency details.",
  "Follow-up answers showed solid grasp of memory model.",
];

export default function RecruiterDashboardView() {
  const [data, setData] = useState<RecruiterSearchResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState("junior-java-developer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [decisionBusy, setDecisionBusy] = useState("");
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});

  const loadCandidates = useCallback(async (roleSlug = selectedRole) => {
    setLoading(true);
    setError("");
    try {
      const demoRole = typeof window !== "undefined" ? localStorage.getItem("nextlearn.demo_role") : null;
      const headers: Record<string, string> = {
        "content-type": "application/json",
        ...(demoRole ? { "x-demo-role": demoRole } : {}),
      };
      const res = await fetch(`/api/recruiter/candidates?role=${encodeURIComponent(roleSlug)}`, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candidate evidence.");
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const handleRoleChange = async (newRole: string) => {
    setSelectedRole(newRole);
    await loadCandidates(newRole);
  };

  const submitDecision = async (candidateId: string, decision: "reviewed" | "shortlisted") => {
    setDecisionBusy(candidateId);
    setError("");
    setMessage("");
    try {
      const demoRole = typeof window !== "undefined" ? localStorage.getItem("nextlearn.demo_role") : null;
      const headers: Record<string, string> = {
        "content-type": "application/json",
        ...(demoRole ? { "x-demo-role": demoRole } : {}),
      };
      const res = await fetch("/api/recruiter/candidates", {
        method: "POST",
        headers,
        body: JSON.stringify({
          roleSlug: data?.role.slug || selectedRole,
          candidateId,
          decision,
          note: notes[candidateId] || (decision === "shortlisted" ? "Candidate shortlisted based on verified work-sample evidence." : "Reviewed evidence card."),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Decision failed with status ${res.status}`);
      }
      setMessage(
        decision === "shortlisted"
          ? `Candidate ${candidateId} successfully shortlisted. Written decision logged to audit trail.`
          : `Candidate ${candidateId} marked as reviewed. Decision logged to audit trail.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save decision.");
    } finally {
      setDecisionBusy("");
    }
  };

  const toggleSubmission = (key: string) => {
    setExpandedSubmissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="recruiter-workbench">
      {/* Intro Header */}
      <div className="page-intro">
        <div className="eyebrow">NXTMOVE · CONSENT-GATED SEARCH</div>
        <h1>Candidate Evidence for Role</h1>
        <p>
          Filters use explicit skill, language, proficiency, recency, and task-count requirements.
          ProofLoop never auto-rejects candidates; human judgment remains with the recruiter.
        </p>
      </div>

      {/* Role Requirement Selector Card */}
      <section className="role-spec-card">
        <div className="role-spec-header">
          <div className="role-spec-title">
            <span className="spec-kicker">ACTIVE HIRING REQUIREMENT</span>
            <div className="spec-select-row">
              <Briefcase size={18} className="role-icon" />
              <h2>{data?.role.title ?? "Junior Java Developer"}</h2>
              <select
                className="role-dropdown"
                value={selectedRole}
                onChange={(e) => void handleRoleChange(e.target.value)}
                aria-label="Select hiring role"
              >
                <option value="junior-java-developer">Junior Java Developer</option>
                <option value="junior-data-analyst">Junior Data Analyst</option>
                <option value="associate-product-analyst">Associate Product Analyst</option>
              </select>
            </div>
          </div>
          <button
            className="secondary-btn"
            onClick={() => void loadCandidates()}
            disabled={loading}
            title="Refresh candidates"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh candidate search</span>
          </button>
        </div>

        {/* Explicit Filter Chips */}
        <div className="filter-chips-grid">
          <div className="filter-chip">
            <span className="chip-label">Skill Target</span>
            <strong className="chip-val">
              {selectedRole === "junior-java-developer"
                ? "Debugging"
                : selectedRole === "junior-data-analyst"
                ? "Data Analytics"
                : "Business Analytics"}
            </strong>
          </div>
          <div className="filter-chip">
            <span className="chip-label">Language</span>
            <strong className="chip-val">
              {selectedRole === "junior-java-developer" ? "Java" : "JavaScript / SQL"}
            </strong>
          </div>
          <div className="filter-chip">
            <span className="chip-label">Minimum Level</span>
            <strong className="chip-val">Developing or above</strong>
          </div>
          <div className="filter-chip">
            <span className="chip-label">Recency Window</span>
            <strong className="chip-val">Assessed ≤ 90 days ago</strong>
          </div>
          <div className="filter-chip">
            <span className="chip-label">Verified Work Samples</span>
            <strong className="chip-val">
              {selectedRole === "junior-java-developer" ? "≥ 2 Java tasks" : "≥ 1 task"}
            </strong>
          </div>
          <div className="filter-chip verified-chip">
            <span className="chip-label">Consent Gate</span>
            <strong className="chip-val">
              <CheckCircle2 size={12} /> Active Learner Opt-In
            </strong>
          </div>
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

      {/* Candidate Results */}
      {loading ? (
        <div className="candidates-loading">
          <div className="loading-card skeleton-pulse" />
          <div className="loading-card skeleton-pulse" />
        </div>
      ) : data?.candidates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <Shield size={36} />
          </div>
          <h2>No consented matches surfaced</h2>
          <p>
            Candidates who have not explicitly enabled sharing for this skill do not appear in recruiter search.
            When learners enable revocable consent in their Evidence Portfolio, they will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="candidates-list">
          {data?.candidates.map((candidate) => (
            <article className="recruiter-candidate-card" key={candidate.candidateId}>
              {/* Candidate Card Header */}
              <div className="candidate-header">
                <div className="candidate-avatar">
                  <span>{candidate.candidateId.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="candidate-meta">
                  <div className="candidate-kicker">
                    SYNTHETIC CANDIDATE · <span className="cand-id">{candidate.candidateId}</span>
                  </div>
                  <h2>{candidate.displayName}</h2>
                </div>
                <div className="consent-status-badge">
                  <CheckCircle2 size={13} />
                  <span>Consented to role search</span>
                </div>
              </div>

              {/* "Why Surfaced" Explainability Banner */}
              <div className="why-surfaced-banner">
                <Sparkles size={16} className="why-icon" />
                <div className="why-copy">
                  <strong>Why surfaced:</strong> {candidate.whySurfaced}
                </div>
              </div>

              {/* Evidence Work-Sample Cards */}
              <div className="evidence-work-samples">
                <div className="samples-heading">
                  <Layers size={14} />
                  <span>Verified Work-Sample Evidence ({candidate.evidence.length} tasks)</span>
                </div>

                {candidate.evidence.map((item, idx) => {
                  const itemKey = `${candidate.candidateId}-${item.evidenceId}`;
                  const isExpanded = Boolean(expandedSubmissions[itemKey]);

                  return (
                    <div className="evidence-sample-item" key={item.evidenceId}>
                      <div className="sample-summary-bar">
                        <div className="sample-title-group">
                          <span className="sample-index">#{idx + 1}</span>
                          <strong>{item.taskId}</strong>
                          <span className={`sample-level ${item.level.toLowerCase()}`}>
                            {item.level}
                          </span>
                          <span className={`sample-confidence ${item.confidence.toLowerCase()}`}>
                            {item.confidence} confidence
                          </span>
                        </div>
                        <div className="sample-date-group">
                          <Calendar size={12} />
                          <span>{new Date(item.assessedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Criteria Score Breakdown */}
                      <div className="criteria-chips-row">
                        {Object.entries(item.criteria).map(([criterion, score]) => (
                          <span className="criterion-score-chip" key={criterion}>
                            <span className="crit-name">{criterionLabels[criterion] ?? criterion}:</span>
                            <strong className="crit-val">{score}</strong>
                          </span>
                        ))}
                        <span className="followup-count-chip">
                          <HelpCircle size={11} />
                          <span>{item.followupsAsked} follow-ups answered</span>
                        </span>
                      </div>

                      {/* Expandable Submission Details (If Consented) */}
                      {item.submission ? (
                        <div className="submission-accordion">
                          <button
                            className="accordion-trigger"
                            onClick={() => toggleSubmission(itemKey)}
                            aria-expanded={isExpanded}
                          >
                            <FileCode size={13} />
                            <span>
                              {isExpanded ? "Hide submitted code and incident report" : "Inspect candidate submission and defense transcript"}
                            </span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {isExpanded && (
                            <div className="accordion-content">
                              {/* Source Code */}
                              <div className="submission-code-block">
                                <div className="sub-block-title">
                                  <FileCode size={12} />
                                  <span>Submitted Solution</span>
                                </div>
                                <pre className="code-pre">{item.submission}</pre>
                              </div>

                              {/* Incident Report */}
                              {item.incidentReport && (
                                <div className="submission-report-block">
                                  <div className="sub-block-title">
                                    <FileText size={12} />
                                    <span>Incident Diagnostic Report</span>
                                  </div>
                                  <div className="report-sections">
                                    {Object.entries(item.incidentReport).map(([heading, text]) => (
                                      <div className="report-section-row" key={heading}>
                                        <strong>{heading.replaceAll("_", " ")}:</strong>
                                        <p>{String(text)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Follow-up defense transcript */}
                              {item.followups && item.followups.length > 0 && (
                                <div className="submission-followups-block">
                                  <div className="sub-block-title">
                                    <HelpCircle size={12} />
                                    <span>Follow-Up Defense Transcript</span>
                                  </div>
                                  <div className="defense-transcript-list">
                                    {item.followups.map((f, i) => (
                                      <div className="defense-item" key={i}>
                                        <div className="defense-q">
                                          <strong>Q{i + 1}:</strong> {f.question}
                                        </div>
                                        <div className="defense-a">
                                          <strong>Candidate Response:</strong> {f.answer}
                                        </div>
                                        <div className="defense-score">
                                          <span>Criterion Score: {f.score}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="submission-private-notice">
                          <Shield size={12} />
                          <span>Candidate shared rubric summary only; raw code was kept private under candidate consent preferences.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Human Shortlist Decision Panel */}
              <div className="decision-panel">
                <div className="decision-panel-header">
                  <span className="spec-kicker">HUMAN SHORTLIST DECISION · MANDATORY AUDIT NOTE</span>
                  <p>
                    ProofLoop requires a human decision. Record a short review note before shortlisting or passing this candidate.
                  </p>
                </div>

                {/* Quick note suggestions */}
                <div className="quick-notes-bar">
                  <span className="quick-label">Suggested notes:</span>
                  {quickNotes.map((note) => (
                    <button
                      key={note}
                      type="button"
                      className="quick-note-pill"
                      onClick={() =>
                        setNotes((prev) => ({ ...prev, [candidate.candidateId]: note }))
                      }
                    >
                      {note}
                    </button>
                  ))}
                </div>

                <textarea
                  className="decision-notes-input"
                  rows={2}
                  value={notes[candidate.candidateId] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [candidate.candidateId]: e.target.value }))
                  }
                  placeholder="Record your written assessment rationale (required for audit logging)..."
                  maxLength={1000}
                />

                <div className="decision-actions">
                  <div className="decision-disclaimer">
                    <Shield size={12} />
                    <span>Evidence is experimental and not a validated hiring predictor. All recruiter actions are permanently audit logged.</span>
                  </div>

                  <div className="action-buttons-group">
                    <button
                      className="pass-btn"
                      disabled={decisionBusy === candidate.candidateId}
                      onClick={() => void submitDecision(candidate.candidateId, "reviewed")}
                    >
                      <UserX size={14} />
                      <span>{decisionBusy === candidate.candidateId ? "Recording…" : "Mark Reviewed / Pass"}</span>
                    </button>
                    <button
                      className="shortlist-btn"
                      disabled={decisionBusy === candidate.candidateId}
                      onClick={() => void submitDecision(candidate.candidateId, "shortlisted")}
                    >
                      <UserCheck size={14} />
                      <span>{decisionBusy === candidate.candidateId ? "Saving…" : "Shortlist Candidate"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
