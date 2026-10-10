"use client";

import React, { useState } from "react";
import CodeEditor from "@/components/CodeEditor";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Shield,
  Layers,
  Send,
  HelpCircle,
} from "lucide-react";

interface BossWorkbenchProps {
  boss: Record<string, unknown>;
  onBack: () => void;
  onComplete: () => Promise<void>;
}

interface SelectedQuestion {
  id: string;
  position: number;
  question: string;
}

export default function BossRoundWorkbench({
  boss,
  onBack,
  onComplete,
}: BossWorkbenchProps) {
  const [decision, setDecision] = useState<"accept" | "reject">("reject");
  const [flaggedLines, setFlaggedLines] = useState<number[]>([3]);
  const [testCode, setTestCode] = useState('assertWords("  red   blue ", 2);\nassertWords("word", 1);');
  const [explanation, setExplanation] = useState(
    "The regex splits on single space rather than one or more whitespace tokens, causing extra empty elements and inaccurate counts for multi-space strings."
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [question, setQuestion] = useState<SelectedQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [attemptId, setAttemptId] = useState("");

  const flawedCode = String(
    boss.flawedCode ??
      `function countWords(str) {\n  if (!str) return 0;\n  const parts = str.trim().split(" ");\n  return parts.length;\n}`
  );
  const codeLines = flawedCode.split("\n");

  const referenceCode = `function countWords(str) {\n  if (!str) return 0;\n  const matches = str.trim().match(/\\S+/g);\n  return matches ? matches.length : 0;\n}`;

  const toggleLineFlag = (lineNumber: number) => {
    setFlaggedLines((prev) =>
      prev.includes(lineNumber)
        ? prev.filter((n) => n !== lineNumber)
        : [...prev, lineNumber]
    );
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/boss/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision,
          flaggedLines,
          testCode,
          explanation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Boss submission failed.");
      }

      setResult(data);
      setAttemptId(String(data.attemptId));
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestion(data.questions[0]);
      } else {
        await onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Boss submission failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!question || !attemptId || !answer.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/assessment/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId: question.id,
          position: question.position,
          answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Answer submission failed.");
      }

      if (data.complete) {
        await onComplete();
      } else if (data.nextQuestion) {
        setQuestion(data.nextQuestion);
        setAnswer("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Follow-up failed.");
    } finally {
      setBusy(false);
    }
  };

  const checks = result?.checks as {
    failsOnFlawed?: boolean;
    passesOnReference?: boolean;
    passesOnAlternate?: boolean;
  } | undefined;

  return (
    <div className="boss-workbench-container">
      {/* Header */}
      <div className="workspace-top-bar">
        <button className="back-link-btn" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Back to skill tree</span>
        </button>

        <div className="workspace-title-box">
          <span className="workspace-kicker">BOSS ROUND · ADVERSARIAL AI CODE REVIEW</span>
          <h1 className="workspace-main-title">Catch the AI&apos;s Mistake</h1>
        </div>
      </div>

      <div className="boss-grid">
        {/* Left Column: Side-by-Side Diff & Inspection */}
        <div className="boss-main-col">
          <div className="panel boss-diff-panel">
            <div className="diff-header-bar">
              <span className="diff-title">1. Review Suggested Patch vs Reference Invariants</span>
              <span className="diff-instruction">Click line numbers to flag the flaw</span>
            </div>

            {/* Side-by-side diff */}
            <div className="diff-side-by-side">
              {/* Flawed AI Patch */}
              <div className="diff-pane ai-patch-pane">
                <div className="diff-pane-title">
                  <Sparkles size={13} />
                  <span>AI-GENERATED PATCH (PRE-WRITTEN)</span>
                </div>
                <div className="code-lines-container">
                  {codeLines.map((line, idx) => {
                    const lineNum = idx + 1;
                    const isFlagged = flaggedLines.includes(lineNum);
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`diff-line-btn ${isFlagged ? "flagged" : ""}`}
                        onClick={() => toggleLineFlag(lineNum)}
                        aria-pressed={isFlagged}
                      >
                        <span className="line-num">{lineNum}</span>
                        <code className="line-text">{line}</code>
                        {isFlagged && <span className="flagged-indicator">FLAW FLAGGED</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference Implementation Invariants */}
              <div className="diff-pane reference-pane">
                <div className="diff-pane-title">
                  <CheckCircle2 size={13} />
                  <span>REFERENCE SPECIFICATION INVARIANTS</span>
                </div>
                <div className="code-lines-container">
                  <pre className="reference-code-block">{referenceCode}</pre>
                </div>
              </div>
            </div>

            {/* Review Decision Buttons */}
            <div className="decision-toggle-box">
              <span className="decision-prompt">Your evaluation decision:</span>
              <div className="decision-buttons-row">
                <button
                  type="button"
                  className={`decision-btn ${decision === "reject" ? "active-reject" : ""}`}
                  onClick={() => setDecision("reject")}
                >
                  <XCircle size={15} />
                  <span>Reject Patch (Flaw Exists)</span>
                </button>
                <button
                  type="button"
                  className={`decision-btn ${decision === "accept" ? "active-accept" : ""}`}
                  onClick={() => setDecision("accept")}
                >
                  <CheckCircle2 size={15} />
                  <span>Accept Patch (Safe to Ship)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Test Editor & Explanation */}
          <div className="panel boss-test-panel">
            <div className="pane-header">
              <span className="pane-label">2. Prove Failure with Test Assertions</span>
            </div>

            <p className="test-guide-text">
              Assertions run against <strong>three independent code variants</strong> in Judge0.
              A valid test fails on the flawed patch and passes on both reference variants.
              Trivial assertions (e.g. <code>assert(false)</code>) are automatically rejected.
            </p>

            <label className="field-group">
              <span>Write test assertions:</span>
              <CodeEditor
                language="javascript"
                value={testCode}
                onChange={setTestCode}
                minHeight="140px"
              />
            </label>

            <label className="field-group" style={{ marginTop: "14px" }}>
              <span>Explain which input triggers the failure and why:</span>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="For example: multi-space strings cause empty tokens..."
                rows={3}
                maxLength={3000}
              />
            </label>

            {error && (
              <div className="notice error" style={{ marginTop: "12px" }}>
                <span>{error}</span>
              </div>
            )}

            <div className="boss-submit-bar">
              <button
                type="button"
                className="primary btn-cyan"
                disabled={busy}
                onClick={handleSubmit}
              >
                <span>{busy ? "Executing 3-variant test harness…" : "Run 3-Step Verification"}</span>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 3-Step Run Indicator & Follow-up */}
        <aside className="boss-status-col">
          <div className="panel three-step-indicator-card">
            <div className="pane-header">
              <span className="pane-label">3-STEP VARIANT EXECUTION PIPELINE</span>
            </div>

            <div className="step-pipeline-list">
              {/* Step 1: Flawed patch check */}
              <div
                className={`pipeline-step ${
                  checks
                    ? checks.failsOnFlawed
                      ? "step-pass"
                      : "step-fail"
                    : "step-idle"
                }`}
              >
                <div className="step-header">
                  <span className="step-badge">STEP 1</span>
                  <strong>Flawed Patch Check</strong>
                </div>
                <p className="step-desc">Must FAIL your test assertions.</p>
                <div className="step-outcome">
                  {checks ? (
                    checks.failsOnFlawed ? (
                      <span className="outcome-tag pass">
                        <CheckCircle2 size={12} /> Flaw Detected (Assertion Failed)
                      </span>
                    ) : (
                      <span className="outcome-tag fail">
                        <XCircle size={12} /> Flaw Missed (Assertion Passed)
                      </span>
                    )
                  ) : (
                    <span className="outcome-tag idle">Awaiting verification run</span>
                  )}
                </div>
              </div>

              {/* Step 2: Reference Implementation check */}
              <div
                className={`pipeline-step ${
                  checks
                    ? checks.passesOnReference
                      ? "step-pass"
                      : "step-fail"
                    : "step-idle"
                }`}
              >
                <div className="step-header">
                  <span className="step-badge">STEP 2</span>
                  <strong>Reference Implementation Check</strong>
                </div>
                <p className="step-desc">Must PASS your test assertions.</p>
                <div className="step-outcome">
                  {checks ? (
                    checks.passesOnReference ? (
                      <span className="outcome-tag pass">
                        <CheckCircle2 size={12} /> Passed Correct Implementation
                      </span>
                    ) : (
                      <span className="outcome-tag fail">
                        <XCircle size={12} /> Failed Correct Implementation
                      </span>
                    )
                  ) : (
                    <span className="outcome-tag idle">Awaiting verification run</span>
                  )}
                </div>
              </div>

              {/* Step 3: Alternate Reference check */}
              <div
                className={`pipeline-step ${
                  checks
                    ? checks.passesOnAlternate
                      ? "step-pass"
                      : "step-fail"
                    : "step-idle"
                }`}
              >
                <div className="step-header">
                  <span className="step-badge">STEP 3</span>
                  <strong>Alternate Variant Check</strong>
                </div>
                <p className="step-desc">Must PASS independent alternative logic.</p>
                <div className="step-outcome">
                  {checks ? (
                    checks.passesOnAlternate ? (
                      <span className="outcome-tag pass">
                        <CheckCircle2 size={12} /> Passed Alternate Implementation
                      </span>
                    ) : (
                      <span className="outcome-tag fail">
                        <XCircle size={12} /> Failed Alternate Implementation
                      </span>
                    )
                  ) : (
                    <span className="outcome-tag idle">Awaiting verification run</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up question if required */}
          {question && (
            <div className="panel boss-followup-card">
              <div className="pane-header">
                <HelpCircle size={14} />
                <span className="pane-label">REASONING DEFENSE</span>
              </div>

              <div className="chat-bubble examiner-bubble">
                <p className="bubble-text">{question.question}</p>
              </div>

              <div className="reply-box">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Defend your reasoning..."
                  rows={3}
                />
                <button
                  type="button"
                  className="primary btn-cyan small"
                  disabled={busy || !answer.trim()}
                  onClick={handleAnswerSubmit}
                >
                  <span>{busy ? "Submitting…" : "Finalize Boss Evidence"}</span>
                  <Send size={13} />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
