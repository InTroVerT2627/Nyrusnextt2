"use client";

import React, { useState } from "react";
import LearningTopBar from "@/components/learning/LearningTopBar";
import PrivateNotesDrawer from "@/components/learning/PrivateNotesDrawer";
import { FullModule, PageType } from "@/lib/learning-experience-types";
import { ChevronRight, ChevronLeft, BookOpen, Layers } from "lucide-react";

type ImmersiveLearningShellProps = {
  pathTitle: string;
  module: FullModule;
  currentPageIndex: number;
  currentPageType: PageType;
  minSeconds: number;
  onMinTimeComplete: () => void;
  canAdvance: boolean;
  advanceReasonHint?: string;
  onAdvance: () => void;
  onBack?: () => void;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
  storyPanel: React.ReactNode;
  learningPanel: React.ReactNode;
  relaxedMode?: boolean;
  isAudioReading?: boolean;
  onToggleReadAloud?: () => void;
};

export default function ImmersiveLearningShell({
  pathTitle,
  module,
  currentPageIndex,
  currentPageType,
  minSeconds,
  onMinTimeComplete,
  canAdvance,
  advanceReasonHint = "Complete the reading ring and required activity to continue",
  onAdvance,
  onBack,
  isPaused,
  onPause,
  onResume,
  onExit,
  storyPanel,
  learningPanel,
  relaxedMode = false,
  isAudioReading = false,
  onToggleReadAloud,
}: ImmersiveLearningShellProps) {
  const [isPlainMode, setIsPlainMode] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  // Mobile tab state: 'story' vs 'learn'
  const [mobileTab, setMobileTab] = useState<"story" | "learn">("learn");

  const totalPages = module.pages.length;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;

  // Can pause only between pages (not during check or reflection)
  const canPause = currentPageType !== "check";

  return (
    <div className={`immersive-learning-viewport ${isPlainMode ? "plain-mode" : "split-mode"}`}>
      {/* Top Navigation Bar */}
      <LearningTopBar
        pathTitle={pathTitle}
        moduleTitle={module.title}
        currentPageType={currentPageType}
        currentPageIndex={currentPageIndex}
        totalPages={totalPages}
        minSeconds={minSeconds}
        onMinTimeComplete={onMinTimeComplete}
        isPaused={isPaused}
        isPlainMode={isPlainMode}
        onTogglePlainMode={() => setIsPlainMode((prev) => !prev)}
        onOpenNotes={() => setIsNotesOpen(true)}
        onPause={onPause}
        onExit={onExit}
        canPause={canPause}
        isAudioReading={isAudioReading}
        onToggleReadAloud={onToggleReadAloud}
        relaxedMode={relaxedMode}
      />

      {/* Mobile Sticky Segmented Switcher (Visible on <= 900px when not in plain mode) */}
      {!isPlainMode && (
        <div className="mobile-view-switcher" role="tablist" aria-label="Mobile panel switcher">
          <button
            role="tab"
            aria-selected={mobileTab === "story"}
            className={`mobile-tab-btn ${mobileTab === "story" ? "active" : ""}`}
            onClick={() => setMobileTab("story")}
          >
            <BookOpen size={13} />
            <span>Story Scene</span>
          </button>
          <button
            role="tab"
            aria-selected={mobileTab === "learn"}
            className={`mobile-tab-btn ${mobileTab === "learn" ? "active" : ""}`}
            onClick={() => setMobileTab("learn")}
          >
            <Layers size={13} />
            <span>Lesson Beat</span>
          </button>
        </div>
      )}

      {/* Main Split Panels Area */}
      <main className="learning-stage-main">
        {/* Left: Midnight Story Panel */}
        {!isPlainMode && (
          <section
            className={`story-panel-side ${mobileTab === "story" ? "mobile-visible" : "mobile-hidden"}`}
            aria-label="Story narrative"
          >
            <div className="story-panel-content">{storyPanel}</div>
          </section>
        )}

        {/* Right: Clean White Learning Panel */}
        <section
          className={`learning-panel-side ${isPlainMode ? "full-width" : ""} ${
            mobileTab === "learn" || isPlainMode ? "mobile-visible" : "mobile-hidden"
          }`}
          aria-label="Lesson content and activities"
        >
          <div className="learning-panel-inner">
            {learningPanel}

            {/* Bottom Beat Advance Navigation */}
            <footer className="beat-nav-footer">
              <div className="footer-left">
                {!isFirstPage && onBack && (
                  <button className="back-beat-btn" onClick={onBack} aria-label="Go back to previous beat">
                    <ChevronLeft size={16} />
                    <span>Previous Beat</span>
                  </button>
                )}
              </div>

              <div className="footer-right">
                <div className="advance-button-wrap">
                  {!canAdvance && (
                    <span className="advance-locked-hint" role="status">
                      {advanceReasonHint}
                    </span>
                  )}
                  <button
                    className={`advance-beat-btn ${canAdvance ? "ready" : "locked"}`}
                    disabled={!canAdvance}
                    onClick={onAdvance}
                    aria-label={isLastPage ? "Finish module" : "Advance to next beat"}
                  >
                    <span>{isLastPage ? "Complete Module" : "Continue to Next Beat"}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </section>
      </main>

      {/* Slide-Over Private Notes Drawer */}
      <PrivateNotesDrawer
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        pathSlug={module.pathSlug}
        moduleSlug={module.slug}
        moduleTitle={module.title}
      />
    </div>
  );
}
