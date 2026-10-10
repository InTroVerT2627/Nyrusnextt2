"use client";

import React, { useState } from "react";
import { Sparkles, HelpCircle, Check, ArrowRight } from "lucide-react";
import { TeaserContent } from "@/lib/learning-experience-types";

type TeaserBeatViewProps = {
  content: TeaserContent;
  moduleTitle: string;
  onCommitted: () => void;
};

export default function TeaserBeatView({
  content,
  moduleTitle,
  onCommitted,
}: TeaserBeatViewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [thinkFirstText, setThinkFirstText] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);

  const handleCommit = (choice?: string) => {
    if (choice) setSelectedOption(choice);
    setIsRevealed(true);
    onCommitted();
  };

  return (
    <div className="teaser-beat-layout">
      <div className="teaser-hero-badge">
        <Sparkles size={16} />
        <span>CURIOSITY FIRST · COMMITTED THINKING</span>
      </div>

      <div className="teaser-header">
        <h2 className="teaser-module-title">{moduleTitle}</h2>
        <p className="teaser-prompt-question">{content.prompt}</p>
      </div>

      {!isRevealed ? (
        <div className="teaser-interaction-box">
          {content.format === "think_first" && (
            <div className="think-first-input-group">
              <label htmlFor="think-first-text">
                Take a moment to predict in your own words before seeing the lesson:
              </label>
              <textarea
                id="think-first-text"
                rows={3}
                placeholder="What is your intuition about this question? (No grades, private to you)..."
                value={thinkFirstText}
                onChange={(e) => setThinkFirstText(e.target.value)}
              />
            </div>
          )}

          {content.options && content.options.length > 0 && (
            <div className="teaser-options-stack" role="radiogroup" aria-label="Teaser options">
              {content.options.map((opt, idx) => (
                <button
                  key={idx}
                  role="radio"
                  aria-checked={selectedOption === opt}
                  className={`teaser-option-card ${selectedOption === opt ? "selected" : ""}`}
                  onClick={() => handleCommit(opt)}
                >
                  <span className="option-marker">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-label-text">{opt}</span>
                </button>
              ))}
            </div>
          )}

          <div className="teaser-commit-row">
            <button
              className="not-sure-btn"
              onClick={() => handleCommit("Not sure")}
            >
              <HelpCircle size={14} />
              <span>I&apos;m not sure — reveal the topic</span>
            </button>
            {content.format === "think_first" && thinkFirstText.trim().length > 0 && (
              <button
                className="primary-btn commit-thought-btn"
                onClick={() => handleCommit(thinkFirstText)}
              >
                <span>Commit & Reveal Topic</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="teaser-reveal-card" role="status">
          <div className="reveal-top">
            <div className="reveal-check-circle">
              <Check size={16} />
            </div>
            <div>
              <h3>Topic Revealed</h3>
              <p className="reaction-text">{content.revealReaction}</p>
            </div>
          </div>

          <div className="real-topic-banner">
            <span className="topic-kicker">WHAT WE ARE EXPLORING:</span>
            <strong>{content.realTopic}</strong>
          </div>

          <p className="teaser-advance-ready">
            Your intuition is locked in. When the reading ring completes, continue to the Story Scene.
          </p>
        </div>
      )}
    </div>
  );
}
