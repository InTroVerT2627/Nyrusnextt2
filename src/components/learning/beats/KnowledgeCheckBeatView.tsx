"use client";

import React, { useState } from "react";
import { PublicLearningQuestion } from "@/lib/learning-experience-types";
import { CheckCircle2, AlertCircle, RotateCcw, HelpCircle, ArrowRight } from "lucide-react";

type KnowledgeCheckBeatViewProps = {
  questions: PublicLearningQuestion[];
  pathSlug: string;
  moduleSlug: string;
  onCheckPassed: () => void;
};

type FeedbackItem = {
  questionIndex: number;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
};

export default function KnowledgeCheckBeatView({
  questions,
  pathSlug,
  moduleSlug,
  onCheckPassed,
}: KnowledgeCheckBeatViewProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
    Array(questions.length).fill(-1)
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = (qIdx: number, choiceIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = choiceIdx;
      return next;
    });
  };

  const allAnswered = selectedAnswers.every((a) => a >= 0);

  const handleSubmit = async () => {
    if (!allAnswered || busy) return;
    setBusy(true);
    setError("");

    try {
      // Grade authoritatively via server endpoint without leaking keys to client
      const res = await fetch("/api/learning-paths", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathSlug,
          moduleSlug,
          responses: selectedAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record quiz.");
      }

      const results: FeedbackItem[] = (data.feedback || []).map(
        (f: { selectedIndex: number; correctIndex: number; correct: boolean; explanation: string }, idx: number) => ({
          questionIndex: idx,
          selectedIndex: f.selectedIndex,
          correctIndex: f.correctIndex,
          isCorrect: f.correct,
          explanation: f.explanation,
        })
      );

      setScore(data.score ?? 0);
      setFeedback(results);
      setSubmitted(true);

      if (data.passed) {
        onCheckPassed();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record quiz.");
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers(Array(questions.length).fill(-1));
    setSubmitted(false);
    setScore(0);
    setFeedback([]);
    setError("");
  };

  const passed = score >= 2;

  return (
    <div className="knowledge-check-beat-layout">
      <div className="check-hero-badge">
        <HelpCircle size={16} />
        <span>KNOWLEDGE CHECK · PASS 2 OF 3 TO UNLOCK NEXT MODULE</span>
      </div>

      <div className="check-header">
        <h2>Demonstrate Understanding</h2>
        <p>
          Answer each question carefully. Explanations remain visible after submission, and you can retry as many times as needed to demonstrate mastery.
        </p>
      </div>

      {error && (
        <div className="notice error" role="alert">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Questions Stack */}
      <div className="check-questions-stack">
        {questions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const itemFeedback = submitted ? feedback[qIdx] : null;

          return (
            <fieldset className="check-question-card" key={q.id}>
              <legend className="question-prompt">
                <span className="q-num">Q{qIdx + 1}.</span> {q.prompt}
              </legend>

              <div className="choices-group" role="radiogroup" aria-label={`Choices for Question ${qIdx + 1}`}>
                {q.choices.map((choice, cIdx) => {
                  const isSelected = selected === cIdx;
                  let choiceClass = "";

                  if (submitted && itemFeedback) {
                    if (cIdx === itemFeedback.correctIndex) {
                      choiceClass = "correct-choice";
                    } else if (isSelected && !itemFeedback.isCorrect) {
                      choiceClass = "incorrect-choice";
                    }
                  } else if (isSelected) {
                    choiceClass = "selected-choice";
                  }

                  return (
                    <label
                      key={cIdx}
                      className={`choice-radio-label ${choiceClass}`}
                      onClick={() => handleSelect(qIdx, cIdx)}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() => handleSelect(qIdx, cIdx)}
                      />
                      <span className="choice-text">{choice}</span>
                      {submitted && itemFeedback && cIdx === itemFeedback.correctIndex && (
                        <CheckCircle2 size={16} className="correct-icon" />
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Post-submission explanation */}
              {submitted && itemFeedback && (
                <div className={`explanation-box ${itemFeedback.isCorrect ? "success" : "review"}`}>
                  <strong>{itemFeedback.isCorrect ? "Correct!" : "Explanation:"}</strong>
                  <p>{itemFeedback.explanation}</p>
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      {/* Submission & Score Summary */}
      {!submitted ? (
        <div className="check-submit-row">
          <button
            className="primary-btn submit-quiz-btn"
            disabled={!allAnswered || busy}
            onClick={handleSubmit}
          >
            <span>{busy ? "Grading…" : "Submit Knowledge Check"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className={`check-result-card ${passed ? "passed" : "retry"}`} role="status">
          <div className="result-top">
            <div className="result-score-badge">
              {passed ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <strong>{score} / {questions.length}</strong>
            </div>
            <div>
              <h3>{passed ? "Module Unlocked!" : "Practice Makes Permanent"}</h3>
              <p>
                {passed
                  ? "You demonstrated understanding by passing at least 2 of 3 questions. The next module is unlocked!"
                  : "You need at least 2 of 3 correct to unlock the next module. Review the explanations above and retry."}
              </p>
            </div>
          </div>

          <div className="result-actions">
            {!passed ? (
              <button className="primary-btn retry-quiz-btn" onClick={handleRetry}>
                <RotateCcw size={14} />
                <span>Try Knowledge Check Again</span>
              </button>
            ) : (
              <p className="proceed-hint">
                Continue to the Takeaway beat to record your reflection note.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
