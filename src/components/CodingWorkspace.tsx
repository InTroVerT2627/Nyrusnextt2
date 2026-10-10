"use client";

import React, { useState, useEffect, useRef } from "react";
import CodeEditor from "@/components/CodeEditor";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bot,
  Terminal,
  Layers,
  Send,
} from "lucide-react";

interface Mission {
  id: string;
  slug: string;
  language: string;
  difficulty: string;
  skill_node_id: number;
  mission_json: {
    title: string;
    short_title: string;
    severity: string;
    description: string;
    symptom: string;
    plain_task: string;
  };
  version: {
    id: string;
    version: number;
    prompt: string;
    starterCode: string;
    reportHeadings: string[];
  };
  visibleTests: { title: string; input: unknown; expected: unknown }[];
  rubric: {
    version: number;
    criteria: {
      criteria: { id: string; title: string; weight: number; max: number; source: string }[];
    };
  };
}

interface SelectedQuestion {
  id: string;
  position: number;
  question: string;
  bankVersion?: number;
}

interface Assessment {
  attemptId: string;
  confidence: string;
  status: string;
  feedback: string;
  scores: Record<string, number>;
  visibleTests: { title: string; passed: boolean; compileError?: string }[];
  hiddenSummary: { passed: boolean; count: number };
  questions: SelectedQuestion[];
}

interface CodingWorkspaceProps {
  mission: Mission;
  busy: boolean;
  attempt: Assessment | null;
  question: SelectedQuestion | null;
  answer: string;
  setAnswer: (val: string) => void;
  onSubmit: (formData: FormData) => void;
  onAnswer: () => void;
  onBack: () => void;
}

const STORAGE_KEY = "proofloop_pane_widths_v2";

export default function CodingWorkspace({
  mission,
  busy,
  attempt,
  question,
  answer,
  setAnswer,
  onSubmit,
  onAnswer,
  onBack,
}: CodingWorkspaceProps) {
  const [plainTaskView, setPlainTaskView] = useState(false);
  const [codeValue, setCodeValue] = useState(mission.version.starterCode);
  const [activeTab, setActiveTab] = useState<"tests" | "ai" | "followups">("tests");
  const [aiDisclosed, setAiDisclosed] = useState(false);

  // Pane widths in percentage
  const [paneWidths, setPaneWidths] = useState<[number, number, number]>([28, 42, 30]);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeResizer = useRef<number | null>(null);

  // Load saved layout
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) {
          setPaneWidths(parsed as [number, number, number]);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save layout
  const saveLayout = (widths: [number, number, number]) => {
    setPaneWidths(widths);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
    } catch {
      // ignore
    }
  };

  // Drag resizer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeResizer.current === null || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const totalWidth = rect.width;

      if (activeResizer.current === 1) {
        // Resizing Pane 1 & Pane 2
        const p1 = Math.min(Math.max((currentX / totalWidth) * 100, 18), 45);
        const remaining = 100 - p1 - paneWidths[2];
        if (remaining > 25) {
          saveLayout([p1, remaining, paneWidths[2]]);
        }
      } else if (activeResizer.current === 2) {
        // Resizing Pane 2 & Pane 3
        const p1 = paneWidths[0];
        const p3 = Math.min(Math.max(((rect.right - e.clientX) / totalWidth) * 100, 18), 45);
        const remaining = 100 - p1 - p3;
        if (remaining > 25) {
          saveLayout([p1, remaining, p3]);
        }
      }
    };

    const handleMouseUp = () => {
      activeResizer.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [paneWidths]);

  // Automatically switch tab when attempt or question updates
  useEffect(() => {
    if (question) {
      setActiveTab("followups");
    } else if (attempt) {
      setActiveTab("tests");
    }
  }, [attempt, question]);

  const startResizing = (dividerIndex: number) => {
    activeResizer.current = dividerIndex;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const headings = mission.version.reportHeadings.length
    ? mission.version.reportHeadings
    : ["What broke", "Why it broke", "The fix", "How to prevent it"];
  const keys = ["what_broke", "why_it_broke", "the_fix", "how_to_prevent"];

  return (
    <div className="workspace-container">
      {/* Top Header */}
      <div className="workspace-top-bar">
        <button className="back-link-btn" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Back to missions</span>
        </button>

        <div className="workspace-title-box">
          <span className="workspace-kicker">
            INCIDENT MISSION · {mission.language} · {mission.mission_json.severity}
          </span>
          <h1 className="workspace-main-title">
            {plainTaskView ? `${mission.language} Task Specification` : mission.mission_json.title}
          </h1>
        </div>

        <div className="workspace-controls-group">
          <button
            type="button"
            className="secondary small"
            onClick={() => setPlainTaskView((prev) => !prev)}
          >
            {plainTaskView ? "Show Incident Story" : "Show Plain Task"}
          </button>
        </div>
      </div>

      {/* 3-Pane Resizable Grid */}
      <div className="workspace-three-panes" ref={containerRef}>
        {/* PANE 1: Ticket & Rubric (Left) */}
        {!leftCollapsed && (
          <aside
            className="workspace-pane pane-ticket"
            style={{ width: `${paneWidths[0]}%` }}
          >
            <div className="pane-header">
              <span className="pane-label">
                {plainTaskView ? "PLAIN TASK SPEC" : "INCIDENT TICKET"}
              </span>
              <button
                className="icon-btn-pane"
                onClick={() => setLeftCollapsed(true)}
                title="Collapse ticket pane"
                aria-label="Collapse ticket pane"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            <div className="pane-scroll-body">
              <div className="ticket-narrative">
                <p className="ticket-text">
                  {plainTaskView ? mission.mission_json.plain_task : mission.version.prompt}
                </p>
                {!plainTaskView && (
                  <>
                    <h4 className="ticket-subhead">Known Context</h4>
                    <p className="ticket-context">{mission.mission_json.description}</p>
                    <h4 className="ticket-subhead">Reported Symptom</h4>
                    <p className="ticket-symptom">{mission.mission_json.symptom}</p>
                  </>
                )}
              </div>

              {/* Visible Acceptance Tests */}
              <div className="pane-section">
                <h4 className="pane-section-title">Visible Acceptance Checks</h4>
                <div className="visible-tests-list">
                  {mission.visibleTests.map((t, idx) => (
                    <div key={idx} className="visible-test-item">
                      <span className="test-number">#{idx + 1}</span>
                      <div className="test-meta">
                        <strong>{t.title}</strong>
                        <code>
                          In: {JSON.stringify(t.input)} → Out: {JSON.stringify(t.expected)}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visible Rubric */}
              <div className="pane-section">
                <h4 className="pane-section-title">Transparent Rubric Criteria</h4>
                <div className="rubric-criteria-list">
                  {mission.rubric.criteria.criteria.map((c) => (
                    <div key={c.id} className="rubric-criteria-row">
                      <div className="rubric-name-wrap">
                        <span className="rubric-name">{c.title}</span>
                        <small className="rubric-source">
                          {c.source === "test" ? "Judge0 tests" : "Gemini reasoning"}
                        </small>
                      </div>
                      <span className="rubric-weight-badge">{c.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Collapsed Left Trigger */}
        {leftCollapsed && (
          <button
            className="collapsed-pane-tab"
            onClick={() => setLeftCollapsed(false)}
            title="Expand incident ticket"
            aria-label="Expand incident ticket"
          >
            <ChevronRight size={14} />
            <span>Ticket & Rubric</span>
          </button>
        )}

        {/* Splitter 1 */}
        {!leftCollapsed && (
          <div
            className="pane-resizer"
            onMouseDown={() => startResizing(1)}
            title="Drag to resize panes"
            role="separator"
            aria-orientation="vertical"
          />
        )}

        {/* PANE 2: Monaco Editor & Incident Report (Centre) */}
        <main
          className="workspace-pane pane-editor"
          style={{
            width: `${
              100 -
              (leftCollapsed ? 2 : paneWidths[0]) -
              (rightCollapsed ? 2 : paneWidths[2])
            }%`,
          }}
        >
          <form
            className="editor-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              onSubmit(fd);
            }}
          >
            <div className="pane-header">
              <div className="editor-header-title">
                <Terminal size={14} />
                <span className="pane-label">MONACO EDITOR · {mission.language.toUpperCase()}</span>
              </div>
              <span className="editor-theme-tag">Theme: proofloop-midnight</span>
            </div>

            {/* Monaco Code Editor */}
            <div className="editor-canvas-box">
              <CodeEditor
                language={mission.language}
                value={codeValue}
                onChange={setCodeValue}
                minHeight="280px"
              />
              <input type="hidden" name="code" value={codeValue} />
            </div>

            {/* 4-Heading Incident Report Form */}
            <div className="incident-report-section">
              <div className="report-header">
                <FileText size={14} />
                <span className="report-label">INCIDENT REASONING REPORT (4 HEADINGS)</span>
              </div>

              <div className="report-headings-grid">
                {headings.slice(0, 4).map((heading, idx) => (
                  <label key={keys[idx]} className="report-field-label">
                    <span className="field-title">{heading}</span>
                    <textarea
                      name={keys[idx]}
                      required={idx < 3}
                      placeholder={`Document ${heading.toLowerCase()}...`}
                      maxLength={2000}
                      rows={2}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* AI Disclosure & Submit Button Bar */}
            <div className="editor-footer-bar">
              <label className="ai-disclosure-row">
                <input
                  type="checkbox"
                  name="ai_disclosure"
                  checked={aiDisclosed}
                  onChange={(e) => setAiDisclosed(e.target.checked)}
                />
                <span>I used AI assistance while working (optional, never penalized).</span>
              </label>

              <div className="submit-action-row">
                <span className="disclosure-note">
                  Deterministic tests run in Judge0 CE. Reasoning scored in two runs by Gemini.
                </span>
                <button type="submit" className="primary btn-cyan" disabled={busy}>
                  <span>{busy ? "Executing isolated tests…" : "Submit incident report"}</span>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </form>
        </main>

        {/* Splitter 2 */}
        {!rightCollapsed && (
          <div
            className="pane-resizer"
            onMouseDown={() => startResizing(2)}
            title="Drag to resize panes"
            role="separator"
            aria-orientation="vertical"
          />
        )}

        {/* PANE 3: Inspection Tabs (Right) */}
        {!rightCollapsed && (
          <aside
            className="workspace-pane pane-inspection"
            style={{ width: `${paneWidths[2]}%` }}
          >
            {/* Tabs Header */}
            <div className="inspection-tabs-bar" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === "tests"}
                className={`tab-btn ${activeTab === "tests" ? "active" : ""}`}
                onClick={() => setActiveTab("tests")}
              >
                <CheckCircle2 size={13} />
                <span>Tests</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === "ai"}
                className={`tab-btn ${activeTab === "ai" ? "active" : ""}`}
                onClick={() => setActiveTab("ai")}
              >
                <Bot size={13} />
                <span>AI Feedback</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === "followups"}
                className={`tab-btn ${activeTab === "followups" ? "active" : ""}`}
                onClick={() => setActiveTab("followups")}
              >
                <HelpCircle size={13} />
                <span>Follow-ups</span>
                {question && <span className="tab-bubble-dot" />}
              </button>

              <button
                className="icon-btn-pane ml-auto"
                onClick={() => setRightCollapsed(true)}
                title="Collapse inspection pane"
                aria-label="Collapse inspection pane"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Tab 1: Deterministic Tests */}
            {activeTab === "tests" && (
              <div className="tab-content-body">
                <div className="verified-tests-badge">
                  <CheckCircle2 size={14} />
                  <span>VERIFIED BY TESTS · DETERMINISTIC EXECUTION</span>
                </div>

                {!attempt ? (
                  <div className="empty-tab-state">
                    <p>Run your submission to see isolated Judge0 test suite results.</p>
                  </div>
                ) : (
                  <div className="tests-results-stack">
                    <div className="results-summary-card">
                      <strong>Visible Acceptance Suite</strong>
                      <div className="visible-results-list">
                        {attempt.visibleTests.map((t, idx) => (
                          <div key={idx} className="test-outcome-row">
                            <span className={`status-icon ${t.passed ? "passed" : "failed"}`}>
                              {t.passed ? "✓" : "×"}
                            </span>
                            <span className="outcome-title">{t.title}</span>
                            <span className={`outcome-text ${t.passed ? "passed" : "failed"}`}>
                              {t.passed ? "Pass" : "Failed"}
                            </span>
                            {t.compileError && (
                              <pre className="compile-error-box">{t.compileError}</pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`edge-case-banner ${
                        attempt.hiddenSummary.passed ? "success" : "warning"
                      }`}
                    >
                      <span className="banner-icon">
                        {attempt.hiddenSummary.passed ? "✓" : "!"}
                      </span>
                      <div className="banner-copy">
                        <strong>Private Server Edge-Case Suite</strong>
                        <p>
                          {attempt.hiddenSummary.passed
                            ? "All private edge-case checks passed."
                            : "One or more private edge-case checks failed."}
                          {" Hidden tests remain strictly server-side."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: AI Feedback */}
            {activeTab === "ai" && (
              <div className="tab-content-body">
                <div className="ai-feedback-badge">
                  <Sparkles size={14} />
                  <span>AI-ASSISTED, EXPERIMENTAL REASONING SCORE</span>
                </div>

                {!attempt ? (
                  <div className="empty-tab-state">
                    <p>AI reasoning feedback will appear after submitting your incident report.</p>
                  </div>
                ) : (
                  <div className="ai-feedback-stack">
                    {/* Criterion Scores */}
                    <div className="criterion-breakdown-card">
                      <strong>Criterion Breakdown</strong>
                      <div className="scores-list">
                        {Object.entries(attempt.scores).map(([crit, val]) => (
                          <div key={crit} className="score-row">
                            <span>{crit.replace(/_/g, " ")}</span>
                            <strong>{val} pts</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Quote */}
                    <div className="feedback-quote-box">
                      <span className="quote-label">EVALUATOR REASONING TRACE</span>
                      <blockquote className="quote-text">{attempt.feedback}</blockquote>
                    </div>

                    {attempt.status === "review_required" && (
                      <div className="human-review-callout">
                        <AlertTriangle size={14} />
                        <p>
                          AI runs showed divergence or uncertainty. This submission has been
                          routed to the human reviewer queue.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Conversational Follow-up Questions */}
            {activeTab === "followups" && (
              <div className="tab-content-body">
                <div className="followup-thread-container">
                  {!question ? (
                    <div className="empty-tab-state">
                      <HelpCircle size={24} />
                      <p>
                        {attempt
                          ? "No active follow-up defense pending for this attempt."
                          : "Follow-up questions will probe your reasoning once submitted."}
                      </p>
                    </div>
                  ) : (
                    <div className="conversational-bubble-thread">
                      {/* Reason why asked banner */}
                      <div className="why-asked-banner">
                        <Sparkles size={13} />
                        <span>Why this was asked: Probing edge-case bounds and empty input defense</span>
                      </div>

                      {/* Conversational bubble */}
                      <div className="chat-bubble examiner-bubble">
                        <div className="bubble-sender">TECHNICAL EVALUATOR</div>
                        <p className="bubble-text">{question.question}</p>
                      </div>

                      {/* Candidate response area */}
                      <div className="chat-bubble-reply">
                        <label className="reply-label">
                          <span>Your technical justification:</span>
                          <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Defend your reasoning in your own words..."
                            maxLength={4000}
                            rows={4}
                          />
                        </label>

                        <div className="reply-actions">
                          <small className="defense-note">
                            Follow-up count never alters your score; it affects confidence only.
                            Grammar and non-native English are never penalized.
                          </small>
                          <button
                            type="button"
                            className="primary btn-cyan small"
                            disabled={busy || !answer.trim()}
                            onClick={onAnswer}
                          >
                            <span>{busy ? "Scoring defense…" : "Submit defense"}</span>
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Collapsed Right Trigger */}
        {rightCollapsed && (
          <button
            className="collapsed-pane-tab"
            onClick={() => setRightCollapsed(false)}
            title="Expand inspection pane"
            aria-label="Expand inspection pane"
          >
            <ChevronLeft size={14} />
            <span>Inspection & Tests</span>
          </button>
        )}
      </div>
    </div>
  );
}
