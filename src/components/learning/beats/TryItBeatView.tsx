"use client";

import React, { useState } from "react";
import { TryItContent } from "@/lib/learning-experience-types";
import { CheckCircle2, AlertCircle, Sparkles, MessageSquare, ArrowRight } from "lucide-react";

type TryItBeatViewProps = {
  content: TryItContent;
  onInteractionComplete: () => void;
};

export default function TryItBeatView({
  content,
  onInteractionComplete,
}: TryItBeatViewProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [explainItBackText, setExplainItBackText] = useState("");
  const [isExplained, setIsExplained] = useState(false);

  const handleSelectChoice = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    setIsAnswerSubmitted(true);
    onInteractionComplete();
  };

  const handleCommitExplanation = () => {
    if (explainItBackText.trim().length > 0) {
      setIsExplained(true);
    }
  };

  const selectedChoice = content.choices?.find((c) => c.id === selectedChoiceId);

  return (
    <div className="tryit-beat-layout">
      <div className="tryit-hero-badge">
        <Sparkles size={16} />
        <span>TRY IT FIRST · LOW-STAKES PRACTICE</span>
      </div>

      <div className="tryit-header">
        <h2 className="tryit-prompt">{content.prompt}</h2>
        <div className="tryit-context-card">
          <span className="context-label">AVAILABLE CONTEXT:</span>
          <p>{content.starterContext}</p>
        </div>
      </div>

      {content.symptom && (
        <div
          className="tryit-symptom-card"
          style={{
            backgroundColor: "var(--forest)",
            color: "#FFFFFF",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "16px",
            borderLeft: "4px solid #D97706",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#D97706", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              PRODUCTION SYMPTOM REPORT
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--lime-light)" }}>{content.symptom}</p>
        </div>
      )}

      {content.clues && content.clues.length > 0 && (
        <div
          className="tryit-clues-card"
          style={{
            backgroundColor: "var(--lime-light)",
            border: "1px solid var(--mint-deep)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest)", marginBottom: "6px" }}>
            🔍 UNFOLDING INVESTIGATION CLUES:
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.5 }}>
            {content.clues.map((clue, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>{clue}</li>
            ))}
          </ul>
        </div>
      )}

      {content.codeSnippet && (
        <div
          className="tryit-code-inspection"
          style={{
            backgroundColor: "var(--forest)",
            border: "1px solid var(--forest)",
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "18px",
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              borderBottom: "1px solid rgba(217, 232, 243, 0.15)",
              paddingBottom: "6px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              CODE INSPECTION: FLAGGED FUNCTION
            </span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>JavaScript</span>
          </div>
          <pre style={{ margin: 0, color: "var(--lime-light)", fontSize: "13px", lineHeight: 1.5, overflowX: "auto" }}>
            <code>{content.codeSnippet}</code>
          </pre>
        </div>
      )}

      {/* Interactive Activity Options */}
      {content.choices && content.choices.length > 0 && (
        <div className="tryit-choices-list" role="radiogroup" aria-label="Practice choices">
          {content.choices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id;
            const isCorrect = choice.isCorrect;

            return (
              <button
                key={choice.id}
                role="radio"
                aria-checked={isSelected}
                disabled={isAnswerSubmitted}
                className={`tryit-choice-card ${isSelected ? (isCorrect ? "correct" : "incorrect") : ""}`}
                onClick={() => handleSelectChoice(choice.id)}
              >
                <div className="choice-marker-circle">
                  {isSelected ? (
                    isCorrect ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />
                  ) : (
                    <span className="dot" />
                  )}
                </div>
                <div className="choice-text">{choice.label}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Immediate Reasoning Feedback */}
      {isAnswerSubmitted && selectedChoice && (
        <div
          className={`tryit-feedback-card ${selectedChoice.isCorrect ? "success" : "review"}`}
          role="status"
        >
          <div className="feedback-top">
            <strong>{selectedChoice.isCorrect ? "Sound Reasoning!" : "Consider this nuance:"}</strong>
          </div>
          <p className="feedback-explanation">{selectedChoice.feedback}</p>
          <div className="expert-guidance-note">
            <span>Core Lesson:</span> {content.reasoningExplanation}
          </div>
        </div>
      )}

      {/* "Explain It Back" Micro-Prompt */}
      {isAnswerSubmitted && (
        <div className="explain-it-back-panel">
          <div className="explain-header">
            <MessageSquare size={14} />
            <strong>Explain It Back (1-Sentence Micro Synthesis):</strong>
          </div>
          <p className="explain-prompt-question">{content.explainItBackPrompt}</p>

          {!isExplained ? (
            <div className="explain-input-row">
              <input
                type="text"
                placeholder="Write your one-sentence explanation here..."
                value={explainItBackText}
                onChange={(e) => setExplainItBackText(e.target.value)}
                maxLength={300}
              />
              <button
                className="secondary-btn save-explain-btn"
                disabled={explainItBackText.trim().length === 0}
                onClick={handleCommitExplanation}
              >
                <span>Save Note</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="explain-saved-card">
              <CheckCircle2 size={14} />
              <span>Your synthesis: &quot;{explainItBackText}&quot;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
