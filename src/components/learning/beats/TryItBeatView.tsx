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
