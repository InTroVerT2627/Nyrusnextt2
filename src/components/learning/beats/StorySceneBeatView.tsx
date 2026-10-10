"use client";

import React, { useState } from "react";
import { StorySceneContent } from "@/lib/learning-experience-types";
import StorySceneSvg from "@/components/learning/StorySceneSvg";
import { User, MessageSquare, GitBranch, ArrowRight, CheckCircle2 } from "lucide-react";

type StorySceneBeatViewProps = {
  content: StorySceneContent;
  isLeftPanel?: boolean;
  onChoiceSelected?: (choiceId: string) => void;
};

export default function StorySceneBeatView({
  content,
  isLeftPanel = false,
  onChoiceSelected,
}: StorySceneBeatViewProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  if (isLeftPanel) {
    // Left Midnight Story Panel Rendering
    return (
      <div className="story-scene-left-view">
        {/* SVG Illustration */}
        <StorySceneSvg
          character={content.character}
          setting={content.setting}
          visualMood={content.visualMood}
          sceneObjects={content.sceneObjects}
        />

        {/* Character Info Card */}
        <div className="story-character-card">
          <div className="character-avatar-circle">
            <User size={18} />
          </div>
          <div className="character-details">
            <h3>{content.character}</h3>
            <span>{content.characterRole}</span>
          </div>
        </div>

        {/* Story Narrative Paragraphs */}
        <div className="story-narrative-prose">
          {content.narrative.split("\n\n").map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* Dialogue Exchanges */}
        {content.dialogue && content.dialogue.length > 0 && (
          <div className="story-dialogue-stack">
            {content.dialogue.map((d, idx) => (
              <div className="dialogue-bubble" key={idx}>
                <div className="speaker-tag">
                  <MessageSquare size={12} />
                  <strong>{d.speaker}:</strong>
                </div>
                <p className="speech-quote">&quot;{d.text}&quot;</p>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Decision Branch */}
        {content.decisionBranch && (
          <div className="story-branch-decision-box">
            <div className="branch-header">
              <GitBranch size={16} />
              <h4>{content.decisionBranch.prompt}</h4>
            </div>

            <div className="branch-choices-grid">
              {content.decisionBranch.choices.map((choice) => (
                <button
                  key={choice.id}
                  className={`branch-choice-btn ${selectedBranchId === choice.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedBranchId(choice.id);
                    onChoiceSelected?.(choice.id);
                  }}
                >
                  <span className="choice-label">{choice.label}</span>
                </button>
              ))}
            </div>

            {selectedBranchId && (
              <div className="branch-consequence-card" role="status">
                <div className="consequence-kicker">
                  <CheckCircle2 size={13} />
                  <span>WHAT HAPPENS NEXT:</span>
                </div>
                <p>
                  {
                    content.decisionBranch.choices.find((c) => c.id === selectedBranchId)
                      ?.consequence
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Right Learning Panel Scene Companion View
  return (
    <div className="story-scene-right-view">
      <div className="scene-kicker-bar">
        <span>SCENE 1 BRIEFING</span>
        <strong>{content.setting}</strong>
      </div>

      <div className="scene-dilemma-overview">
        <h2>The Operational Dilemma</h2>
        <p>
          In every organization, pressure to act quickly often conflicts with the need to measure accurately.
          Observe how <strong>{content.character}</strong> handles the immediate panic before jumping to conclusions.
        </p>
      </div>

      <div className="scene-key-tension-card">
        <h3>Why this situation matters:</h3>
        <ul>
          <li>Vague demands lead to wasted time and unindexed database queries.</li>
          <li>Emotional panic often confuses operational symptoms with real root causes.</li>
          <li>Reframing the problem protects both team credibility and system stability.</li>
        </ul>
      </div>

      <div className="scene-ready-prompt">
        <ArrowRight size={16} />
        <span>Review the story scene on the left, then continue to unpack the Core Concept.</span>
      </div>
    </div>
  );
}
