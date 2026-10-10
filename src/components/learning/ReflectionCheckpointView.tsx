"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, RotateCcw, BookOpen, ShieldCheck } from "lucide-react";
import { ReflectionReview } from "@/lib/server/gemini";

export type ReflectionCheckpointProps = {
  pathSlug: "data-analytics" | "business-analytics" | "communication";
  pathTitle: string;
  checkpointNumber: 1 | 2 | 3 | 4;
  onCompleted: () => void;
  onExit?: () => void;
};

type CheckpointConfig = {
  title: string;
  subtitle: string;
  modulesCovered: string[];
  promptSynthesise: string;
  placeholderSynthesise: string;
  promptApply: string;
  placeholderApply: string;
};

const CHECKPOINT_CONFIGS: Record<number, CheckpointConfig> = {
  1: {
    title: "Checkpoint 1 · Connecting the Foundations",
    subtitle: "Reflect on Modules 1 to 3 before advancing",
    modulesCovered: ["Module 1", "Module 2", "Module 3"],
    promptSynthesise: "How do the first three modules connect? What single principle binds them?",
    placeholderSynthesise:
      "Explain how framing the problem, understanding dataset grain, and verifying baseline assumptions form a unified disciplined process…",
    promptApply:
      "Describe a situation from your own experience (or an imagined realistic project) where this principle was violated. What happened, and how would you fix it now?",
    placeholderApply:
      "In a previous sprint or project, someone skipped baseline validation, resulting in…",
  },
  2: {
    title: "Checkpoint 2 · Deepening Technical Practice",
    subtitle: "Reflect on Modules 4 to 6 before advancing",
    modulesCovered: ["Module 4", "Module 5", "Module 6"],
    promptSynthesise:
      "Looking across modules 4–6, what was the most counter-intuitive distinction you encountered?",
    placeholderSynthesise:
      "The contrast between apparent correlation and genuine root cause became evident when…",
    promptApply:
      "How will you verify this in your day-to-day work before sharing results with others?",
    placeholderApply:
      "Before sending charts or numbers, I establish a deterministic check by…",
  },
  3: {
    title: "Checkpoint 3 · Translating Evidence into Impact",
    subtitle: "Reflect on Modules 7 to 9 before advancing",
    modulesCovered: ["Module 7", "Module 8", "Module 9"],
    promptSynthesise:
      "Modules 7–9 moved from technique to communication. Where does good technical work most often fail when translated for non-technical stakeholders?",
    placeholderSynthesise:
      "Engineers and analysts often overwhelm executives with process minutiae rather than bottom-line decisions because…",
    promptApply:
      "Write the opening two sentences of an email reporting a high-impact finding to a sceptical VP.",
    placeholderApply:
      "Our investigation confirmed that evening delivery drop-off was driven by a 40-minute push notification latency spike, not customer attrition. System throughput is fully restored…",
  },
  4: {
    title: "Capstone Reflection · Your Personal Playbook",
    subtitle: "Comprehensive review of the complete 10-module path",
    modulesCovered: ["Modules 1 through 10"],
    promptSynthesise:
      "What is the single most important habit you will take from this 10-module path into your actual work?",
    placeholderSynthesise:
      "The non-negotiable discipline of defining the decision, metric grain, and falsification standard before analyzing any data…",
    promptApply:
      "A junior colleague asks you how to approach this kind of problem. In 3–4 sentences, what is your playbook?",
    placeholderApply:
      "Step 1: Clarify who decides what. Step 2: Test the grain and verify edge cases. Step 3: Present bottom-line answers first with defensible evidence…",
  },
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Multi-lingual sentence splitter helper: recognizes ., ?, !, ।, and newlines
function splitSentences(text: string): string[] {
  return text
    .split(/[.!?।\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function ReflectionCheckpointView({
  pathSlug,
  pathTitle,
  checkpointNumber,
  onCompleted,
  onExit,
}: ReflectionCheckpointProps) {
  const config = CHECKPOINT_CONFIGS[checkpointNumber] || CHECKPOINT_CONFIGS[1];

  const [responseSynthesise, setResponseSynthesise] = useState("");
  const [responseApply, setResponseApply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<ReflectionReview | null>(null);
  const [attempts, setAttempts] = useState(0);

  const wordsSynthesise = useMemo(() => countWords(responseSynthesise), [responseSynthesise]);
  const wordsApply = useMemo(() => countWords(responseApply), [responseApply]);
  const sentencesSynthesise = useMemo(() => splitSentences(responseSynthesise).length, [responseSynthesise]);
  const sentencesApply = useMemo(() => splitSentences(responseApply).length, [responseApply]);

  const meetsWordCount = wordsSynthesise >= 25 && wordsApply >= 25;

  // Simple token overlap check against boilerplate or generic prompt copies
  const tokenWarning = useMemo(() => {
    const combined = (responseSynthesise + " " + responseApply).toLowerCase();
    if (combined.includes("lorem ipsum") || combined.includes("blah blah")) {
      return "Please write an authentic reflection in your own words.";
    }
    return null;
  }, [responseSynthesise, responseApply]);

  const handleSubmit = async () => {
    if (!meetsWordCount || busy) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/learn/reflection/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathSlug,
          checkpointNumber,
          modulesCovered: config.modulesCovered,
          promptSynthesise: config.promptSynthesise,
          responseSynthesise,
          promptApply: config.promptApply,
          responseApply,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit reflection.");
      }

      setFeedback(data.feedback);
      setAttempts((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="reflection-checkpoint-container" style={{ minHeight: "100vh", background: "#EAF6FC", padding: "40px 20px" }}>
      <div
        className="reflection-card"
        style={{
          maxWidth: "840px",
          margin: "0 auto",
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #D9E8F3",
          padding: "36px",
          boxShadow: "0 4px 20px rgba(20, 45, 78, 0.05)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.08em",
                  color: "#06C6E6",
                  textTransform: "uppercase",
                  background: "#142D4E",
                  padding: "3px 8px",
                  borderRadius: "4px",
                }}
              >
                MILESTONE REFLECTION
              </span>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>
                {pathTitle}
              </span>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#142D4E", margin: "4px 0 6px 0" }}>
              {config.title}
            </h1>
            <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
              {config.subtitle}
            </p>
          </div>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              style={{
                background: "transparent",
                border: "1px solid #D9E8F3",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "13px",
                color: "#64748B",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          )}
        </div>

        {/* Privacy Note */}
        <div
          style={{
            background: "#EAF6FC",
            border: "1px solid #D9E8F3",
            borderRadius: "8px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          <ShieldCheck size={18} color="#142D4E" />
          <p style={{ margin: 0, fontSize: "12.5px", color: "#142D4E" }}>
            <strong>Private Learning Practice:</strong> Reflections are personal formative notes. They are never shared with recruiters, scored for hiring, or visible on evidence profiles.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(220, 38, 38, 0.08)",
              border: "1px solid #DC2626",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "20px",
              color: "#DC2626",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {tokenWarning && (
          <div
            style={{
              background: "rgba(217, 119, 6, 0.08)",
              border: "1px solid #D97706",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "20px",
              color: "#D97706",
              fontSize: "13px",
            }}
          >
            {tokenWarning}
          </div>
        )}

        {/* Feedback Display (when submitted) */}
        {feedback && (
          <div
            className="feedback-result-panel"
            style={{
              background: feedback.depth_level === "Solid" ? "rgba(5, 150, 105, 0.06)" : "#EAF6FC",
              border: `1px solid ${feedback.depth_level === "Solid" ? "#059669" : "#06C6E6"}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "32px",
            }}
            role="region"
            aria-live="polite"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} color="#06C6E6" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#142D4E" }}>
                  Formative AI Coaching
                </h3>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background:
                    feedback.depth_level === "Solid"
                      ? "#059669"
                      : feedback.depth_level === "Getting there"
                      ? "#142D4E"
                      : "#D97706",
                  color: "#FFFFFF",
                }}
              >
                {feedback.depth_level}
              </span>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <strong style={{ fontSize: "13px", color: "#059669", display: "block", marginBottom: "4px" }}>
                ✓ What was understood well:
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#334155" }}>
                {feedback.strength}
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <strong style={{ fontSize: "13px", color: "#142D4E", display: "block", marginBottom: "4px" }}>
                ✦ Nuance or growth opportunity:
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#334155" }}>
                {feedback.growth_opportunity}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
              <button
                type="button"
                className="primary-btn"
                onClick={onCompleted}
                style={{
                  background: "#142D4E",
                  color: "#FFFFFF",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span>Continue Learning</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                style={{
                  background: "transparent",
                  border: "1px solid #D9E8F3",
                  color: "#142D4E",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={14} />
                <span>Sharpen Reflection</span>
              </button>
            </div>
          </div>
        )}

        {/* Prompt 1: Synthesise */}
        <div style={{ marginBottom: "28px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              PART 1 · SYNTHESISE
            </span>
            <span style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#142D4E", marginTop: "4px" }}>
              {config.promptSynthesise}
            </span>
          </label>
          <textarea
            value={responseSynthesise}
            onChange={(e) => setResponseSynthesise(e.target.value)}
            placeholder={config.placeholderSynthesise}
            rows={5}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #D9E8F3",
              fontSize: "14px",
              lineHeight: "1.5",
              color: "#334155",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <span style={{ fontSize: "12px", color: wordsSynthesise >= 25 ? "#059669" : "#64748B", fontWeight: wordsSynthesise >= 25 ? "600" : "400" }}>
              {wordsSynthesise >= 25 ? "✓ " : ""}{wordsSynthesise} / 25 words ({sentencesSynthesise} {sentencesSynthesise === 1 ? "sentence" : "sentences"})
            </span>
            <span style={{ fontSize: "11px", color: "#64748B" }}>
              Multi-lingual punctuation supported
            </span>
          </div>
        </div>

        {/* Prompt 2: Apply */}
        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              PART 2 · APPLY TO YOUR CONTEXT
            </span>
            <span style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#142D4E", marginTop: "4px" }}>
              {config.promptApply}
            </span>
          </label>
          <textarea
            value={responseApply}
            onChange={(e) => setResponseApply(e.target.value)}
            placeholder={config.placeholderApply}
            rows={5}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #D9E8F3",
              fontSize: "14px",
              lineHeight: "1.5",
              color: "#334155",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <span style={{ fontSize: "12px", color: wordsApply >= 25 ? "#059669" : "#64748B", fontWeight: wordsApply >= 25 ? "600" : "400" }}>
              {wordsApply >= 25 ? "✓ " : ""}{wordsApply} / 25 words ({sentencesApply} {sentencesApply === 1 ? "sentence" : "sentences"})
            </span>
            <span style={{ fontSize: "11px", color: "#64748B" }}>
              Focus on concrete actions and reasoning
            </span>
          </div>
        </div>

        {/* Action Button */}
        {!feedback && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #D9E8F3", paddingTop: "20px" }}>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
              Write at least 25 words in each section to unlock formative feedback and the next module.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              {attempts >= 2 && (
                <button
                  type="button"
                  onClick={onCompleted}
                  style={{
                    background: "transparent",
                    border: "1px solid #D9E8F3",
                    color: "#64748B",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Continue without review
                </button>
              )}
              <button
                type="button"
                disabled={!meetsWordCount || busy}
                onClick={handleSubmit}
                style={{
                  background: meetsWordCount ? "#142D4E" : "#64748B",
                  color: "#FFFFFF",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  border: "none",
                  cursor: meetsWordCount && !busy ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>{busy ? "Reviewing with AI…" : "Submit Milestone Reflection"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
