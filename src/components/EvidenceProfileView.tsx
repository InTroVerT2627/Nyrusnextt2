"use client";

import React, { useState, useMemo } from "react";
import {
  FileCheck2,
  Lock,
  Unlock,
  Shield,
  HelpCircle,
  Eye,
  RotateCw,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Evidence {
  id: string;
  attempt_id: string;
  skill: string;
  language: string;
  level: string;
  confidence: string;
  assessed_at: string;
}

interface Attempt {
  id: string;
  task_version_id: string | null;
  rubric_id: string | null;
  boss_round_id: string | null;
  attempt_type: "mission" | "boss";
  code: string;
  explanation_json: {
    report?: Record<string, string>;
    selected_question_ids?: string[];
    gap_tags?: string[];
    test_summary?: Record<string, number | boolean>;
    decision?: string;
    flagged_lines?: number[];
  };
  ai_disclosure: boolean;
  submitted_at: string;
}

interface Score {
  id: string;
  attempt_id: string;
  criterion: string;
  score: number;
  max_score: number;
  source: string;
  feedback: string;
  confidence: string;
  run_scores: number[] | null;
  created_at: string;
}

interface Followup {
  id: string;
  attempt_id: string;
  bank_id: string | null;
  bank_version: number;
  position: number;
  gap_tags: string[];
  question_shown: string;
  answer_text: string | null;
  score: number | null;
  ai_reason: string | null;
  evidence_quote: string | null;
  run_scores: number[] | null;
  answered_at: string | null;
}

interface Consent {
  skill: string;
  scope: string;
  include_submissions: boolean;
  shared: boolean;
  granted_at: string | null;
  revoked_at: string | null;
}

interface Profile {
  user: { id: string; displayName: string; role: string; syntheticCandidateId: string };
  attempts: Attempt[];
  criterionScores: Score[];
  followups: Followup[];
  evidence: Evidence[];
  consents: Consent[];
  appeals: {
    id: string;
    attempt_id: string;
    criterion: string;
    reason: string;
    status: string;
    resolution: string | null;
  }[];
}

interface EvidenceProfileViewProps {
  profile: Profile;
  onConsent: (skill: string, shared: boolean, includeSubmissions: boolean) => void;
  onOpenAttempt: (attempt: Attempt) => void;
}

const SKILL_CONFIG = [
  {
    skill: "debugging",
    name: "Production Debugging",
    description: "Java & JavaScript defect isolation, boundary fixes, and root-cause defense.",
  },
  {
    skill: "reviewing-ai-written-code",
    name: "Reviewing AI-Written Code",
    description: "Adversarial patch evaluation, line flaw detection, and failing test harnesses.",
  },
  {
    skill: "data-analytics",
    name: "Data Analytics (SQL)",
    description: "In-browser WASM SQLite queries, deterministic result checks, and insight memos.",
  },
  {
    skill: "business-analytics",
    name: "Business Analytics (Spreadsheet)",
    description: "SaaS financial unit economics modeling (CAC, LTV, Payback) and strategic memo.",
  },
  {
    skill: "workplace-communication",
    name: "Technical Communication",
    description: "P0 outage incident escalation, stakeholder updates, and revision loops.",
  },
];

export default function EvidenceProfileView({
  profile,
  onConsent,
  onOpenAttempt,
}: EvidenceProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"cards" | "timeline" | "consent">("cards");
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>("all");
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);
  const [activeConfidenceTooltip, setActiveConfidenceTooltip] = useState<string | null>(null);

  const getAreaKey = (skill: string) => {
    if (skill.includes("data")) return "data";
    if (skill.includes("business") || skill.includes("spreadsheet")) return "biz";
    if (skill.includes("communication")) return "comm";
    return "debug";
  };

  const areaCounts = useMemo(() => {
    const counts = { all: profile.evidence.length, debug: 0, data: 0, biz: 0, comm: 0 };
    for (const ev of profile.evidence) {
      const area = getAreaKey(ev.skill);
      counts[area] = (counts[area] || 0) + 1;
    }
    return counts;
  }, [profile.evidence]);

  const filteredEvidence = useMemo(() => {
    if (selectedAreaFilter === "all") return profile.evidence;
    return profile.evidence.filter((ev) => getAreaKey(ev.skill) === selectedAreaFilter);
  }, [profile.evidence, selectedAreaFilter]);

  // Map newest evidence per attempt
  const newestEvidence = useMemo(() => {
    const map = new Map<string, Evidence>();
    for (const item of [...profile.evidence].sort((a, b) => b.assessed_at.localeCompare(a.assessed_at))) {
      if (!map.has(item.attempt_id)) map.set(item.attempt_id, item);
    }
    return map;
  }, [profile.evidence]);

  // Group attempts by mission/track for retry improvement timeline
  const attemptsByGroup = useMemo(() => {
    const groups: Record<string, Attempt[]> = {};
    for (const a of profile.attempts) {
      const key = a.attempt_type === "boss" ? "Boss Round: AI Code Review" : (a.task_version_id || "Debugging Mission");
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }
    for (const k in groups) {
      groups[k].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
    }
    return groups;
  }, [profile.attempts]);

  // Recruiter Live Preview Calculation
  const activeConsents = useMemo(() => {
    return profile.consents.filter((c) => c.shared);
  }, [profile.consents]);

  const includeSubmissionsConsent = useMemo(() => {
    return profile.consents.some((c) => c.shared && c.include_submissions);
  }, [profile.consents]);

  const renderConfidenceMeter = (confidenceStr: string, id: string) => {
    const conf = confidenceStr?.toLowerCase() || "low";
    const level = conf === "high" ? 3 : conf === "medium" ? 2 : 1;
    const isTooltipOpen = activeConfidenceTooltip === id;

    const tooltipExplanation =
      conf === "high"
        ? "High Confidence: Deterministic tests passed in Judge0 + Dual-run Gemini reasoning aligned without ambiguity flags."
        : conf === "medium"
        ? "Medium Confidence: Tests passed, but explanation required adaptive follow-up probing or minor run variance."
        : "Low Confidence: Divergent AI runs, uncertainty flag, prompt manipulation suspicion, or active appeal.";

    return (
      <div className="confidence-meter-container">
        <button
          type="button"
          className="confidence-meter-pill"
          onClick={() => setActiveConfidenceTooltip(isTooltipOpen ? null : id)}
          aria-expanded={isTooltipOpen}
        >
          <div className="meter-bars">
            <span className={`meter-bar ${level >= 1 ? "fill-" + conf : ""}`} />
            <span className={`meter-bar ${level >= 2 ? "fill-" + conf : ""}`} />
            <span className={`meter-bar ${level >= 3 ? "fill-" + conf : ""}`} />
          </div>
          <span className="meter-text">{conf.toUpperCase()} CONFIDENCE</span>
          <HelpCircle size={12} className="meter-help-icon" />
        </button>

        {isTooltipOpen && (
          <div className="confidence-popover" role="tooltip">
            <strong>How Confidence Is Derived</strong>
            <p>{tooltipExplanation}</p>
            <button
              type="button"
              className="popover-close"
              onClick={() => setActiveConfidenceTooltip(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  };

  const calculateRecencyChip = (assessedAtStr: string) => {
    const assessed = new Date(assessedAtStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - assessed.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 90) {
      return (
        <span className="recency-chip warning">
          <Clock size={11} /> Older than 90 days ({diffDays}d ago)
        </span>
      );
    }
    return (
      <span className="recency-chip fresh">
        <Calendar size={11} /> Assessed {diffDays === 0 ? "today" : `${diffDays}d ago`}
      </span>
    );
  };

  return (
    <div className="evidence-profile-wrapper">
      <div className="page-intro">
        <div className="eyebrow">LEARNER-CONTROLLED PORTFOLIO · ZERO AGGREGATE SCORES</div>
        <h1>My Evidence Portfolio</h1>
        <p>
          Every card reflects an immutable assessment linked to its rubric version, deterministic tests, and reasoning history.
          Skills never roll up into an opaque single score or XP. Sharing is off by default and revocable at any second.
        </p>
      </div>

      {/* Main Tabs Navigation */}
      <div className="profile-tabs-header" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "cards"}
          className={`profile-tab-btn ${activeTab === "cards" ? "active" : ""}`}
          onClick={() => setActiveTab("cards")}
        >
          <FileCheck2 size={15} />
          <span>Evidence Cards ({profile.evidence.length})</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "timeline"}
          className={`profile-tab-btn ${activeTab === "timeline" ? "active" : ""}`}
          onClick={() => setActiveTab("timeline")}
        >
          <TrendingUp size={15} />
          <span>Improvement Timeline</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "consent"}
          className={`profile-tab-btn ${activeTab === "consent" ? "active" : ""}`}
          onClick={() => setActiveTab("consent")}
        >
          <Lock size={15} />
          <span>Consent & Privacy Centre</span>
        </button>
      </div>

      {/* TAB 1: Evidence Cards */}
      {activeTab === "cards" && (
        <div className="profile-tab-content">
          {/* Area Filter Segmented Pills */}
          <div className="pill-tabs-track" role="tablist" aria-label="Filter evidence by competency area">
            <button
              type="button"
              className={`pill-tab-item ${selectedAreaFilter === "all" ? "active" : ""}`}
              onClick={() => setSelectedAreaFilter("all")}
            >
              <span>All</span>
              <span className="pill-count-badge">{areaCounts.all}</span>
            </button>
            <button
              type="button"
              className={`pill-tab-item ${selectedAreaFilter === "debug" ? "active" : ""}`}
              onClick={() => setSelectedAreaFilter("debug")}
            >
              <span>Debugging</span>
              <span className="pill-count-badge">{areaCounts.debug}</span>
            </button>
            <button
              type="button"
              className={`pill-tab-item ${selectedAreaFilter === "data" ? "active" : ""}`}
              onClick={() => setSelectedAreaFilter("data")}
            >
              <span>Data Analytics</span>
              <span className="pill-count-badge">{areaCounts.data}</span>
            </button>
            <button
              type="button"
              className={`pill-tab-item ${selectedAreaFilter === "biz" ? "active" : ""}`}
              onClick={() => setSelectedAreaFilter("biz")}
            >
              <span>Business Analytics</span>
              <span className="pill-count-badge">{areaCounts.biz}</span>
            </button>
            <button
              type="button"
              className={`pill-tab-item ${selectedAreaFilter === "comm" ? "active" : ""}`}
              onClick={() => setSelectedAreaFilter("comm")}
            >
              <span>Communication</span>
              <span className="pill-count-badge">{areaCounts.comm}</span>
            </button>
          </div>

          {filteredEvidence.length === 0 ? (
            <div className="empty-state panel">
              <FileCheck2 size={36} strokeWidth={1.5} />
              <h2>No evidence cards in this area yet</h2>
              <p>Complete a mission in this area to produce your first verifiable card.</p>
            </div>
          ) : (
            <div className="evidence-cards-grid">
              {filteredEvidence.map((ev) => {
                const attempt = profile.attempts.find((a) => a.id === ev.attempt_id);
                const scores = profile.criterionScores.filter((s) => s.attempt_id === ev.attempt_id);
                const followups = profile.followups.filter((f) => f.attempt_id === ev.attempt_id);
                const isExpanded = expandedAttemptId === ev.attempt_id;
                const areaKey = getAreaKey(ev.skill);

                return (
                  <article key={ev.id} className="evidence-card-rich panel">
                    <div className="card-top-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div className={`area-tile ${areaKey}`} aria-hidden="true">
                          {areaKey === "debug" ? <FileCheck2 size={22} /> :
                           areaKey === "data" ? <Layers size={22} /> :
                           areaKey === "biz" ? <TrendingUp size={22} /> :
                           <Sparkles size={22} />}
                        </div>
                        <div className="skill-identity">
                          <span className="skill-tag">{ev.language || "CORE"}</span>
                          <h3 className="skill-title">{ev.skill.replace(/-/g, " ").toUpperCase()}</h3>
                        </div>
                      </div>
                      <span className="proficiency-badge">{ev.level.toUpperCase()}</span>
                    </div>

                    <div className="card-metrics-row">
                      {renderConfidenceMeter(ev.confidence, ev.id)}
                      {calculateRecencyChip(ev.assessed_at)}
                    </div>

                    {/* Criteria summary */}
                    <div className="criteria-mini-summary">
                      {scores.slice(0, 4).map((sc) => (
                        <div key={sc.id} className="criterion-pill">
                          <span>{sc.criterion.replace(/_/g, " ")}:</span>
                          <strong>{sc.score}/{sc.max_score}</strong>
                        </div>
                      ))}
                    </div>

                    {/* Expandable Evidence Trail */}
                    <div className="card-footer-actions">
                      <button
                        type="button"
                        className="text-button trail-toggle"
                        onClick={() => setExpandedAttemptId(isExpanded ? null : ev.attempt_id)}
                      >
                        <span>{isExpanded ? "Hide Evidence Trail" : "Inspect Evidence Trail"}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {attempt && (
                        <button
                          type="button"
                          className="secondary small"
                          onClick={() => onOpenAttempt(attempt)}
                        >
                          Challenge / Appeal
                        </button>
                      )}
                    </div>

                    {/* Expanded Trail Content */}
                    {isExpanded && attempt && (
                      <div className="evidence-trail-expansion">
                        <div className="trail-meta-header">
                          <span>Attempt {attempt.id.slice(0, 8)} · Submitted {new Date(attempt.submitted_at).toLocaleString()}</span>
                          <span>AI Disclosed: {attempt.ai_disclosure ? "Yes" : "No"}</span>
                        </div>

                        {/* Criterion feedback details */}
                        <div className="trail-scores-list">
                          <strong>Criterion Breakdown & Evaluator Trace:</strong>
                          {scores.map((sc) => (
                            <div key={sc.id} className="trail-score-item">
                              <div className="score-item-top">
                                <span>{sc.criterion.replace(/_/g, " ")} ({sc.source})</span>
                                <strong>{sc.score} / {sc.max_score} pts</strong>
                              </div>
                              <p className="score-item-feedback">{sc.feedback}</p>
                            </div>
                          ))}
                        </div>

                        {/* Follow-up answers */}
                        {followups.length > 0 && (
                          <div className="trail-followups-list">
                            <strong>Adaptive Follow-Up Questions & Justifications:</strong>
                            {followups.map((f, i) => (
                              <div key={f.id} className="trail-followup-item">
                                <span className="followup-q">Q{i + 1}: {f.question_shown}</span>
                                <p className="followup-a">{f.answer_text || "No recorded answer"}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Code snippet */}
                        <div className="trail-code-box">
                          <strong>Submitted Solution Code:</strong>
                          <pre>{attempt.code}</pre>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Improvement Timeline Across Retries */}
      {activeTab === "timeline" && (
        <div className="profile-tab-content">
          <div className="timeline-intro-card panel">
            <Sparkles size={18} strokeWidth={2} />
            <div>
              <strong>Demonstrated Growth Over Retries</strong>
              <p>
                Retries are encouraged and never penalized. Progression is tracked chronologically per incident mission,
                highlighting where your reasoning and code checks improved.
              </p>
            </div>
          </div>

          <div className="retry-groups-stack">
            {Object.entries(attemptsByGroup).map(([groupTitle, attList]) => (
              <div key={groupTitle} className="retry-group-card panel">
                <div className="group-header">
                  <h3>{groupTitle.toUpperCase()}</h3>
                  <span className="attempts-count-badge">
                    {attList.length} {attList.length === 1 ? "attempt" : "attempts recorded"}
                  </span>
                </div>

                <div className="timeline-steps-chain">
                  {attList.map((att, idx) => {
                    const ev = newestEvidence.get(att.id);
                    const scores = profile.criterionScores.filter((s) => s.attempt_id === att.id);
                    const passedTests = att.explanation_json?.test_summary?.valid === true;

                    return (
                      <div key={att.id} className="timeline-node-step">
                        <div className="step-indicator">
                          <span className={`step-dot ${ev ? "evidenced" : passedTests ? "partial" : "attempted"}`}>
                            {idx + 1}
                          </span>
                          {idx < attList.length - 1 && <span className="step-line" />}
                        </div>

                        <div className="step-content">
                          <div className="step-top-line">
                            <strong>Attempt #{idx + 1} · {new Date(att.submitted_at).toLocaleDateString()}</strong>
                            <span className="step-status-tag">
                              {ev ? "Earned Evidence" : passedTests ? "Tests Passed · Reasoning Needed" : "Initial Attempt"}
                            </span>
                          </div>

                          <div className="step-score-summary">
                            {scores.map((sc) => (
                              <span key={sc.id} className="score-summary-chip">
                                {sc.criterion.replace(/_/g, " ")}: {sc.score}/{sc.max_score}
                              </span>
                            ))}
                          </div>

                          {idx > 0 && (
                            <p className="growth-note">
                              ✓ Improved reasoning defense and test consistency compared to attempt #{idx}.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Consent Centre with Live Recruiter Preview */}
      {activeTab === "consent" && (
        <div className="profile-tab-content consent-split-layout">
          {/* Left Column: Granular Consent Controls */}
          <div className="consent-controls-col">
            <div className="panel consent-intro-card">
              <Shield size={20} strokeWidth={2} />
              <div>
                <strong>Granular, Learner-Controlled Privacy</strong>
                <p>
                  Recruiter search in NxtMove only surfaces candidates who have explicitly opted in.
                  Consent is off by default, granular per competency track, and instantly revocable.
                </p>
              </div>
            </div>

            <div className="consent-switches-stack">
              {SKILL_CONFIG.map((item) => {
                const currentConsent = profile.consents.find((c) => c.skill === item.skill);
                const isShared = currentConsent?.shared ?? false;
                const includeSubs = currentConsent?.include_submissions ?? false;

                return (
                  <div key={item.skill} className="consent-skill-card panel">
                    <div className="skill-text-block">
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                    </div>

                    <div className="switch-controls-group">
                      {/* Master Skill Share Toggle */}
                      <label className="toggle-label-row">
                        <input
                          type="checkbox"
                          checked={isShared}
                          onChange={(e) => onConsent(item.skill, e.target.checked, includeSubs)}
                        />
                        <span className="toggle-status">
                          {isShared ? "Sharing Enabled" : "Sharing Off"}
                        </span>
                      </label>

                      {/* Secondary Submission Raw Code Toggle */}
                      {isShared && (
                        <label className="secondary-toggle-row">
                          <input
                            type="checkbox"
                            checked={includeSubs}
                            onChange={(e) => onConsent(item.skill, isShared, e.target.checked)}
                          />
                          <span>Include raw code / memo submissions</span>
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Recruiter Preview */}
          <aside className="recruiter-live-preview-col">
            <div className="panel preview-box">
              <div className="preview-header-bar">
                <div className="preview-label-wrap">
                  <Eye size={15} />
                  <span>LIVE RECRUITER SEARCH PREVIEW</span>
                </div>
                <span className="preview-live-tag">Updates in real-time</span>
              </div>

              {activeConsents.length === 0 ? (
                <div className="preview-empty-state">
                  <Lock size={28} />
                  <h4>Profile is completely hidden</h4>
                  <p>
                    Because all sharing toggles are Off, NxtMove recruiters cannot search, surface,
                    or inspect your profile under any role criteria.
                  </p>
                </div>
              ) : (
                <div className="preview-candidate-mockup">
                  <div className="mockup-header">
                    <div className="mockup-avatar">{profile.user.displayName[0] || "A"}</div>
                    <div>
                      <strong>{profile.user.displayName}</strong>
                      <small>Synthetic ID: {profile.user.syntheticCandidateId || "cand_0142"}</small>
                    </div>
                  </div>

                  <div className="mockup-surfaced-reason">
                    <span>WHY SURFACED:</span>
                    <p>Candidate consented to share {activeConsents.length} competency track(s).</p>
                  </div>

                  <div className="mockup-skills-list">
                    <strong>Visible Evidence Cards:</strong>
                    {activeConsents.map((c) => (
                      <div key={c.skill} className="mockup-skill-row">
                        <CheckCircle2 size={13} className="check-icon" />
                        <span>{c.skill.replace(/-/g, " ")}</span>
                        <small>{c.include_submissions ? "(With raw submissions)" : "(Scores & cards only)"}</small>
                      </div>
                    ))}
                  </div>

                  <div className="mockup-disclaimer">
                    <span>ⓘ</span>
                    <small>Recruiters must submit written justification for any shortlist decision.</small>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
