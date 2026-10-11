"use client";

import { useState } from "react";
import { FinalTestQuestionClient, LearnerQuestionSubmission } from "@/lib/final-test-types";

type TestQuestionViewProps = {
  question: FinalTestQuestionClient;
  busy: boolean;
  onRequestHint: (tier: "nudge" | "pointer" | "strong") => void;
  onSubmitAnswer: (submission: LearnerQuestionSubmission) => void;
};

export default function TestQuestionView({
  question,
  busy,
  onRequestHint,
  onSubmitAnswer,
}: TestQuestionViewProps) {
  // Form fields based on question type
  const [highlightedText, setHighlightedText] = useState("");
  const [whyWrong, setWhyWrong] = useState("");
  const [correction, setCorrection] = useState("");
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [justification, setJustification] = useState("");
  const [codeOrQuery, setCodeOrQuery] = useState(question.starterContent || "");
  const [rewriteText, setRewriteText] = useState("");
  const [prioritizedIds, setPrioritizedIds] = useState<string[]>(
    question.options?.map((o) => o.id) || []
  );

  const totalDeduction = question.revealedHints.reduce((acc, h) => acc + h.deduction, 0);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const submission: LearnerQuestionSubmission = {
      questionId: question.id,
      highlightedSpans: highlightedText
        ? [{ start: 0, end: highlightedText.length, text: highlightedText }]
        : undefined,
      whyWrong: whyWrong.trim() || undefined,
      correction: correction.trim() || undefined,
      choiceId: selectedChoiceId || undefined,
      justification: justification.trim() || undefined,
      codeOrQuery: codeOrQuery.trim() || undefined,
      prioritizedIds: question.type === "triage" ? prioritizedIds : undefined,
      rewriteText: rewriteText.trim() || undefined,
    };

    onSubmitAnswer(submission);
  }

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "20px 0" }}>
      {/* Draft Notice Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          borderRadius: "6px",
          backgroundColor: "var(--lime-light)",
          border: "1px solid var(--mint-deep)",
          marginBottom: "16px",
          fontSize: "12px",
          color: "var(--forest)",
        }}
      >
        <span style={{ color: "#D97706", fontWeight: 700 }}>⚠</span>
        <span>{question.draftNotice}</span>
      </div>

      {/* Scenario & Context Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--mint-deep)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(20, 45, 78, 0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            QUESTION {question.order} · {question.type.replace("_", " ").toUpperCase()} · {question.difficulty.toUpperCase()}
          </span>
          {totalDeduction > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#D97706",
                backgroundColor: "rgba(217, 119, 6, 0.1)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              -{totalDeduction}% Hint Deduction Applied
            </span>
          )}
        </div>

        <h2 style={{ margin: "0 0 12px", fontSize: "20px", color: "var(--forest)", fontWeight: 700 }}>
          {question.title}
        </h2>

        <div
          style={{
            backgroundColor: "var(--lime-light)",
            borderLeft: "3px solid var(--forest)",
            padding: "12px 16px",
            borderRadius: "0 6px 6px 0",
            marginBottom: "16px",
            fontSize: "14px",
            color: "var(--ink-soft)",
            lineHeight: 1.6,
          }}
        >
          <strong>Scenario:</strong> {question.scenario}
        </div>

        <p style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: "var(--forest)" }}>
          {question.prompt}
        </p>

        {/* Revealed Hints Section */}
        {question.revealedHints.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#D97706", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Active Hints:
            </span>
            {question.revealedHints.map((hint, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "rgba(217, 119, 6, 0.06)",
                  border: "1px solid rgba(217, 119, 6, 0.2)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  marginBottom: "6px",
                  fontSize: "13px",
                  color: "var(--ink-soft)",
                }}
              >
                <strong style={{ color: "#D97706" }}>[{hint.tier.toUpperCase()} -{hint.deduction}%]:</strong> {hint.text}
              </div>
            ))}
          </div>
        )}

        {/* Hint Trigger Buttons (if not already revealed) */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid var(--mint-deep)" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>Need assistance?</span>
          {!question.revealedHints.some((h) => h.tier === "nudge") && (
            <button
              type="button"
              onClick={() => onRequestHint("nudge")}
              disabled={busy}
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "4px",
                border: "1px solid var(--mint-deep)",
                backgroundColor: "#FFFFFF",
                color: "var(--forest)",
                cursor: "pointer",
              }}
            >
              Get Nudge (-5%)
            </button>
          )}
          {!question.revealedHints.some((h) => h.tier === "pointer") && (
            <button
              type="button"
              onClick={() => onRequestHint("pointer")}
              disabled={busy}
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "4px",
                border: "1px solid var(--mint-deep)",
                backgroundColor: "#FFFFFF",
                color: "var(--forest)",
                cursor: "pointer",
              }}
            >
              Get Pointer (-10%)
            </button>
          )}
          {!question.revealedHints.some((h) => h.tier === "strong") && (
            <button
              type="button"
              onClick={() => onRequestHint("strong")}
              disabled={busy}
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "4px",
                border: "1px solid var(--mint-deep)",
                backgroundColor: "#FFFFFF",
                color: "#D97706",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Get Strong Hint (-20%)
            </button>
          )}
        </div>
      </div>

      {/* Answer Form */}
      <form onSubmit={handleFormSubmit}>
        {/* Archetype: Spot the AI's Mistake */}
        {question.type === "spot_mistake" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--mint-deep)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "8px" }}>
              1. AI Generated Draft (Copy or type the faulty sentence below):
            </label>
            <div
              style={{
                backgroundColor: "var(--forest)",
                color: "#FFFFFF",
                borderRadius: "8px",
                padding: "16px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "13px",
                lineHeight: 1.6,
                marginBottom: "14px",
                userSelect: "text",
              }}
            >
              {question.starterContent}
            </div>

            <label htmlFor="flaw-text-input" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--forest)", marginBottom: "4px" }}>
              Faulty Sentence / Flaw Quote:
            </label>
            <textarea
              id="flaw-text-input"
              rows={2}
              value={highlightedText}
              onChange={(e) => setHighlightedText(e.target.value)}
              placeholder="Paste or type the erroneous statement here..."
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                color: "var(--ink-soft)",
                marginBottom: "14px",
              }}
            />

            <label htmlFor="flaw-why-input" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--forest)", marginBottom: "4px" }}>
              2. Why is this statement mathematically or conceptually wrong?
            </label>
            <textarea
              id="flaw-why-input"
              rows={3}
              value={whyWrong}
              onChange={(e) => setWhyWrong(e.target.value)}
              placeholder="Explain the underlying flaw..."
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                color: "var(--ink-soft)",
                marginBottom: "14px",
              }}
            />

            <label htmlFor="flaw-correction-input" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--forest)", marginBottom: "4px" }}>
              3. What is the correct number or assertion?
            </label>
            <textarea
              id="flaw-correction-input"
              rows={2}
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="Provide the accurate figure and methodology..."
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                color: "var(--ink-soft)",
              }}
            />
          </div>
        )}

        {/* Archetype: Case Decision */}
        {question.type === "case_decision" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--mint-deep)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "12px" }}>
              Select your diagnostic action or decision:
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {question.options?.map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: selectedChoiceId === opt.id ? "2px solid var(--forest)" : "1px solid var(--mint-deep)",
                    backgroundColor: selectedChoiceId === opt.id ? "var(--lime-light)" : "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="case-choice"
                    value={opt.id}
                    checked={selectedChoiceId === opt.id}
                    onChange={() => setSelectedChoiceId(opt.id)}
                    style={{ marginTop: "3px", accentColor: "var(--forest)" }}
                    required
                  />
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--forest)" }}>
                      {opt.label}
                    </span>
                    {opt.detail && (
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                        {opt.detail}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <label htmlFor="case-justification-input" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--forest)", marginBottom: "4px" }}>
              Written Justification (Explain why you chose this action and what trade-offs you considered):
            </label>
            <textarea
              id="case-justification-input"
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State your operational reasoning..."
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                color: "var(--ink-soft)",
              }}
            />
          </div>
        )}

        {/* Archetype: Fix It (SQL, Formulas, Code) */}
        {question.type === "fix_it" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--mint-deep)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <label htmlFor="code-editor-input" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "8px" }}>
              Repair and optimize the query / formula:
            </label>
            <textarea
              id="code-editor-input"
              rows={8}
              value={codeOrQuery}
              onChange={(e) => setCodeOrQuery(e.target.value)}
              placeholder="Enter your corrected SQL or formula..."
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--mint-deep)",
                backgroundColor: "var(--forest)",
                color: "#FFFFFF",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "13px",
                lineHeight: 1.5,
                marginBottom: "14px",
              }}
            />

            <label htmlFor="fix-justification-input" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--forest)", marginBottom: "4px" }}>
              Brief explanation of what was broken and how you optimized it:
            </label>
            <textarea
              id="fix-justification-input"
              rows={2}
              value={whyWrong}
              onChange={(e) => setWhyWrong(e.target.value)}
              placeholder="Explain the fix..."
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                color: "var(--ink-soft)",
              }}
            />
          </div>
        )}

        {/* Archetype: Interpret */}
        {question.type === "interpret" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--mint-deep)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            {question.starterContent && (
              <div
                style={{
                  backgroundColor: "var(--lime-light)",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "12px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {question.starterContent}
              </div>
            )}
            <label htmlFor="interpret-analysis-input" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "8px" }}>
              Your Data Interpretation:
            </label>
            <textarea
              id="interpret-analysis-input"
              rows={5}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Detail what the metrics claim on the surface vs what they conceal..."
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                color: "var(--ink-soft)",
              }}
            />
          </div>
        )}

        {/* Archetype: Triage / Prioritise */}
        {question.type === "triage" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--mint-deep)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "12px" }}>
              Items to prioritize (Click to rank order):
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {prioritizedIds.map((id, index) => {
                const opt = question.options?.find((o) => o.id === id);
                if (!opt) return null;
                return (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid var(--mint-deep)",
                      backgroundColor: "var(--lime-light)",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: "var(--forest)", marginRight: "8px" }}>
                        #{index + 1}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>{opt.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => {
                          const next = [...prioritizedIds];
                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                          setPrioritizedIds(next);
                        }}
                        style={{ padding: "2px 8px", cursor: index === 0 ? "default" : "pointer" }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === prioritizedIds.length - 1}
                        onClick={() => {
                          const next = [...prioritizedIds];
                          [next[index + 1], next[index]] = [next[index], next[index + 1]];
                          setPrioritizedIds(next);
                        }}
                        style={{ padding: "2px 8px", cursor: index === prioritizedIds.length - 1 ? "default" : "pointer" }}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <label htmlFor="triage-justification-input" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--forest)", marginBottom: "4px" }}>
              Defend your triage priority and explain what you deprioritized:
            </label>
            <textarea
              id="triage-justification-input"
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State the trade-offs and rationale..."
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                color: "var(--ink-soft)",
              }}
            />
          </div>
        )}

        {/* Archetype: Rewrite */}
        {question.type === "rewrite" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--mint-deep)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            {question.starterContent && (
              <div style={{ marginBottom: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Original Draft to Rewrite:
                </span>
                <div
                  style={{
                    backgroundColor: "var(--forest)",
                    color: "#FFFFFF",
                    borderRadius: "6px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {question.starterContent}
                </div>
              </div>
            )}

            <label htmlFor="rewrite-text-input" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "6px" }}>
              Your Revised Message (Calm, structured, executive-ready):
            </label>
            <textarea
              id="rewrite-text-input"
              rows={5}
              value={rewriteText}
              onChange={(e) => setRewriteText(e.target.value)}
              placeholder="Draft your revision here..."
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                color: "var(--ink-soft)",
                marginBottom: "14px",
              }}
            />

            <label htmlFor="rewrite-rationale-input" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--forest)", marginBottom: "4px" }}>
              Explain key changes in tone, structure, and audience accommodation:
            </label>
            <textarea
              id="rewrite-rationale-input"
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Why this version works better..."
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                color: "var(--ink-soft)",
              }}
            />
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "12px 28px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: busy ? "var(--mint-deep)" : "var(--forest)",
              color: "var(--forest)",
              fontSize: "14px",
              fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
              boxShadow: "0 2px 4px rgba(20, 45, 78, 0.08)",
            }}
          >
            {busy ? "Evaluating Answer…" : "Submit & Defend Reasoning →"}
          </button>
        </div>
      </form>
    </div>
  );
}
