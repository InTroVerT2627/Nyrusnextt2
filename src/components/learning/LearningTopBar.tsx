"use client";

import React from "react";
import {
  BookOpen,
  FileText,
  Edit3,
  Pause,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import ReadingRing from "@/components/learning/ReadingRing";
import { PageType } from "@/lib/learning-experience-types";

type LearningTopBarProps = {
  pathTitle: string;
  moduleTitle: string;
  currentPageType: PageType;
  currentPageIndex: number;
  totalPages: number;
  minSeconds: number;
  onMinTimeComplete: () => void;
  isPaused: boolean;
  isPlainMode: boolean;
  onTogglePlainMode: () => void;
  onOpenNotes: () => void;
  onPause: () => void;
  onExit: () => void;
  canPause: boolean;
  isAudioReading?: boolean;
  onToggleReadAloud?: () => void;
  relaxedMode?: boolean;
};

const beatLabels: Record<PageType, string> = {
  teaser: "Curiosity Teaser",
  scene: "Story Scene",
  concept: "Core Concept",
  example: "Worked Example",
  tryit: "Try It First",
  check: "Knowledge Check",
  takeaway: "Key Takeaway",
};

export default function LearningTopBar({
  pathTitle,
  moduleTitle,
  currentPageType,
  currentPageIndex,
  totalPages,
  minSeconds,
  onMinTimeComplete,
  isPaused,
  isPlainMode,
  onTogglePlainMode,
  onOpenNotes,
  onPause,
  onExit,
  canPause,
  isAudioReading = false,
  onToggleReadAloud,
  relaxedMode = false,
}: LearningTopBarProps) {
  // Pacing ring is active on content reading pages (teaser, scene, concept, example, takeaway)
  // Not active on interaction gating pages (tryit, check)
  const isPacedPage = ["teaser", "scene", "concept", "example", "takeaway"].includes(currentPageType);

  return (
    <header className="learning-topbar" aria-label="Learning session controls">
      {/* Left: Exit & Module Breadcrumb */}
      <div className="topbar-left">
        <button
          className="exit-module-btn"
          onClick={onExit}
          aria-label="Exit module and return to overview"
          title="Exit to path overview"
        >
          <X size={16} />
        </button>
        <div className="module-title-breadcrumb">
          <span className="path-kicker">{pathTitle.toUpperCase()}</span>
          <h1 className="module-heading">{moduleTitle}</h1>
        </div>
      </div>

      {/* Center: Step Dots (7 Beats) */}
      <nav className="topbar-center" aria-label="Module page progression">
        <div className="step-dots-cluster">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const isCurrent = idx === currentPageIndex;
            const isCompleted = idx < currentPageIndex;

            return (
              <div
                key={idx}
                className={`step-dot-wrap ${isCurrent ? "current" : isCompleted ? "completed" : "upcoming"}`}
                title={`Beat ${idx + 1}`}
              >
                <span className="step-dot" />
              </div>
            );
          })}
        </div>
        <div className="current-beat-label">
          <span className="beat-step">Step {currentPageIndex + 1} of {totalPages}:</span>
          <strong className="beat-name">{beatLabels[currentPageType] || currentPageType}</strong>
        </div>
      </nav>

      {/* Right: Reading Ring, Story/Plain Switcher, Notes, Pause, Read Aloud */}
      <div className="topbar-right">
        {/* Calm Reading Ring (Active on content pages) */}
        {isPacedPage ? (
          <ReadingRing
            minSeconds={minSeconds}
            onComplete={onMinTimeComplete}
            isPaused={isPaused}
            active={!isPaused}
          />
        ) : (
          <div className="interactive-beat-pill">
            <span className="pill-dot" />
            <span>Interactive Beat</span>
          </div>
        )}

        {/* Read-Aloud Toggle */}
        {onToggleReadAloud && (
          <button
            className={`tool-icon-btn ${isAudioReading ? "active" : ""}`}
            onClick={onToggleReadAloud}
            aria-label={isAudioReading ? "Stop read-aloud" : "Read aloud with browser speech"}
            title={isAudioReading ? "Stop speech" : "Read lesson aloud"}
          >
            {isAudioReading ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}

        {/* Story / Plain View Toggle */}
        <button
          className={`story-toggle-btn ${isPlainMode ? "plain-active" : ""}`}
          onClick={onTogglePlainMode}
          aria-label={isPlainMode ? "Switch to Story Mode" : "Switch to Plain Text Mode"}
          title={isPlainMode ? "Show story scenes" : "Remove story scenes and show plain lesson"}
        >
          {isPlainMode ? (
            <>
              <BookOpen size={14} />
              <span>Story View</span>
            </>
          ) : (
            <>
              <FileText size={14} />
              <span>Plain View</span>
            </>
          )}
        </button>

        {/* Notes Button */}
        <button
          className="tool-icon-btn"
          onClick={onOpenNotes}
          aria-label="Open private notes drawer"
          title="Open private notes"
        >
          <Edit3 size={15} />
        </button>

        {/* Pause Button */}
        <button
          className="pause-module-btn"
          onClick={onPause}
          disabled={!canPause || isPaused}
          aria-label="Pause learning session without penalty"
          title={canPause ? "Pause session (takes a break without penalty)" : "Cannot pause during knowledge checks or reflections"}
        >
          <Pause size={13} />
          <span>Pause</span>
        </button>

        {relaxedMode && (
          <span className="relaxed-mode-tag" title="Relaxed focus mode enabled for accessibility">
            Relaxed
          </span>
        )}
      </div>
    </header>
  );
}
