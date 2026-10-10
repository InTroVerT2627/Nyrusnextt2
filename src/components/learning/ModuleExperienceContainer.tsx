"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FullModule, PageType } from "@/lib/learning-experience-types";
import ImmersiveLearningShell from "@/components/learning/ImmersiveLearningShell";
import TeaserBeatView from "@/components/learning/beats/TeaserBeatView";
import StorySceneBeatView from "@/components/learning/beats/StorySceneBeatView";
import ConceptBeatView from "@/components/learning/beats/ConceptBeatView";
import WorkedExampleBeatView from "@/components/learning/beats/WorkedExampleBeatView";
import TryItBeatView from "@/components/learning/beats/TryItBeatView";
import KnowledgeCheckBeatView from "@/components/learning/beats/KnowledgeCheckBeatView";
import TakeawayBeatView from "@/components/learning/beats/TakeawayBeatView";
import HowItWorksModal from "@/components/learning/HowItWorksModal";
import InterruptedOverlay from "@/components/learning/InterruptedOverlay";
import { useFocusEngine } from "@/components/learning/useFocusEngine";
import { AlertCircle, Bookmark, ChevronRight, RotateCcw } from "lucide-react";

type ModuleExperienceContainerProps = {
  pathTitle: string;
  module: FullModule;
  onExit: () => void;
  onModuleCompleted: () => void;
};

const beatNames: Record<PageType, string> = {
  teaser: "Curiosity Teaser",
  scene: "Story Scene",
  concept: "Core Concept",
  example: "Worked Example",
  tryit: "Try It First",
  check: "Knowledge Check",
  takeaway: "Key Takeaway",
};

export default function ModuleExperienceContainer({
  pathTitle,
  module,
  onExit,
  onModuleCompleted,
}: ModuleExperienceContainerProps) {
  // Session tracking state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [savedBeatIndex, setSavedBeatIndex] = useState<number | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [minSeconds, setMinSeconds] = useState(10);
  const [isMinTimeSatisfied, setIsMinTimeSatisfied] = useState(false);
  const [isInteractionCompleted, setIsInteractionCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [relaxedMode, setRelaxedMode] = useState(false);
  const [isAudioReading, setIsAudioReading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [advanceError, setAdvanceError] = useState("");

  const handleMinTimeComplete = useCallback(() => {
    setIsMinTimeSatisfied(true);
  }, []);

  const currentPage = module.pages[currentPageIndex];
  const currentPageType: PageType = currentPage.pageType;

  // Detect previous progress for this module so learner can continue where they left off
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`nextlearn.module_beat.${module.pathSlug}.${module.slug}`);
      if (saved) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx > 0 && idx < module.pages.length) {
          setSavedBeatIndex(idx);
          setShowResumeModal(true);
        }
      }
    } catch {}
  }, [module.pathSlug, module.slug, module.pages.length]);

  const initSession = useCallback(async (useRelaxed = false) => {
    setSessionLoading(true);
    setRelaxedMode(useRelaxed);
    try {
      const res = await fetch("/api/learn/session/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathSlug: module.pathSlug,
          moduleSlug: module.slug,
          relaxedMode: useRelaxed,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
        setSessionToken(data.token);
        setIsInterrupted(false);
      } else {
        const fallbackId = `local-sess-${Date.now()}`;
        setSessionId(fallbackId);
        setSessionToken(`local-tok-${Date.now()}`);
        setIsInterrupted(false);
      }
    } catch {
      const fallbackId = `local-sess-${Date.now()}`;
      setSessionId(fallbackId);
      setSessionToken(`local-tok-${Date.now()}`);
      setIsInterrupted(false);
    } finally {
      setSessionLoading(false);
    }
  }, [module.pathSlug, module.slug]);

  // Onboard modal check: first time user sees the card
  useEffect(() => {
    const hasSeen = localStorage.getItem("nextlearn.has_seen_learning_rules");
    if (!hasSeen) {
      setShowHowItWorks(true);
    } else {
      void initSession(false);
    }
  }, [initSession]);

  // Record page enter when currentPageIndex changes
  const enterPage = useCallback(
    async (pageIdx: number, pType: PageType) => {
      setIsMinTimeSatisfied(false);
      setIsInteractionCompleted(["scene", "concept", "example", "takeaway"].includes(pType));
      setAdvanceError("");

      const currentSessId = sessionId || `local-sess-${Date.now()}`;

      try {
        const res = await fetch("/api/learn/page/enter", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSessId,
            pageIndex: pageIdx,
            pageType: pType,
            pageWordCount: 100,
            overrideMinSeconds: module.pages[pageIdx]?.minSecondsOverride,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setMinSeconds(data.minSeconds);
          setVisitId(data.visitId);
          if (data.minSeconds <= 0) {
            setIsMinTimeSatisfied(true);
          }
        } else {
          setMinSeconds(module.pages[pageIdx]?.minSecondsOverride || 8);
          setVisitId(`local-visit-${pageIdx}-${Date.now()}`);
        }
      } catch {
        // fallback minimum
        setMinSeconds(module.pages[pageIdx]?.minSecondsOverride || 8);
        setVisitId(`local-visit-${pageIdx}-${Date.now()}`);
      }
    },
    [sessionId, module.pages]
  );

  const lastEnteredPageRef = useRef<number | null>(null);

  useEffect(() => {
    if (sessionId && !isInterrupted && !isPaused) {
      if (lastEnteredPageRef.current !== currentPageIndex) {
        lastEnteredPageRef.current = currentPageIndex;
        void enterPage(currentPageIndex, currentPageType);
      }
    }
  }, [sessionId, currentPageIndex, currentPageType, isInterrupted, isPaused, enterPage]);

  // Focus engine hook
  const { resetFocusEngine } = useFocusEngine({
    sessionId,
    sessionToken,
    relaxedMode,
    isPaused,
    active: !sessionLoading && !isInterrupted,
    onInterrupted: () => {
      setIsInterrupted(true);
    },
    onWarning: (msg) => {
      setWarningMessage(msg);
      setTimeout(() => setWarningMessage(null), 4000);
    },
  });

  const handleAdvance = async () => {
    // Last page -> Complete module
    if (currentPageIndex === module.pages.length - 1) {
      try {
        localStorage.removeItem(`nextlearn.module_beat.${module.pathSlug}.${module.slug}`);
      } catch {}
      onModuleCompleted();
      return;
    }

    const nextIdx = currentPageIndex + 1;
    const nextType = module.pages[nextIdx].pageType;

    // Persist beat progression so learner can resume anytime
    try {
      localStorage.setItem(`nextlearn.module_beat.${module.pathSlug}.${module.slug}`, String(nextIdx));
    } catch {}

    if (sessionId && visitId && !sessionId.startsWith("local-") && !visitId.startsWith("local-")) {
      try {
        const res = await fetch("/api/learn/page/advance", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            visitId,
            nextPageIndex: nextIdx,
            nextPageType: nextType,
            interactionDone: isInteractionCompleted,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body.error && (body.error.includes("Pacing gate active") || body.error.includes("required interaction"))) {
            setAdvanceError(body.error);
            return;
          }
          console.warn("Server page advance notice:", body.error);
        }
      } catch (err) {
        console.warn("Connection warning while advancing page:", err);
      }
    }

    setIsMinTimeSatisfied(false);
    setCurrentPageIndex(nextIdx);
  };

  const handlePause = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch("/api/learn/session/pause", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        setIsPaused(true);
      }
    } catch {
      // ignore
    }
  };

  const handleResume = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch("/api/learn/session/resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        setIsPaused(false);
      }
    } catch {
      // ignore
    }
  };

  const handleRestart = async () => {
    resetFocusEngine();
    setIsInterrupted(false);
    await initSession(relaxedMode);
  };

  const handleToggleReadAloud = () => {
    if (isAudioReading) {
      window.speechSynthesis.cancel();
      setIsAudioReading(false);
    } else {
      // Extract text content from current beat
      let textToRead = "";
      if (currentPageType === "concept") {
        textToRead = (currentPage.content as { chunks: string[] }).chunks.join(" ");
      } else if (currentPageType === "teaser") {
        textToRead = (currentPage.content as { prompt: string }).prompt;
      } else if (currentPageType === "takeaway") {
        textToRead = (currentPage.content as { summaryLines: string[] }).summaryLines.join(". ");
      }
      if (textToRead && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.onend = () => setIsAudioReading(false);
        utterance.onerror = () => setIsAudioReading(false);
        setIsAudioReading(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Interaction gating logic per beat type
  const isPacedPage = ["teaser", "scene", "concept", "example", "takeaway"].includes(currentPageType);
  const requiresInteraction = ["teaser", "tryit", "check"].includes(currentPageType);
  const canAdvance = (!isPacedPage || isMinTimeSatisfied) && (!requiresInteraction || isInteractionCompleted);

  let advanceReasonHint = "";
  if (isPacedPage && !isMinTimeSatisfied) {
    advanceReasonHint = "Complete the reading time ring to unlock";
  } else if (requiresInteraction && !isInteractionCompleted) {
    if (currentPageType === "teaser") {
      advanceReasonHint = "Pick an option or click 'I'm not sure' to reveal the topic";
    } else if (currentPageType === "tryit") {
      advanceReasonHint = "Attempt the try-it exercise to continue";
    } else if (currentPageType === "check") {
      advanceReasonHint = "Pass at least 2 of 3 questions to unlock next beat";
    }
  }

  // Find story scene for the left panel
  const storyPage = module.pages.find((p) => p.pageType === "scene") || module.pages[1];

  // Render the current beat component
  const renderLearningPanel = () => {
    switch (currentPageType) {
      case "teaser":
        return (
          <TeaserBeatView
            content={currentPage.content as never}
            moduleTitle={module.title}
            onCommitted={() => setIsInteractionCompleted(true)}
          />
        );
      case "scene":
        return <StorySceneBeatView content={currentPage.content as never} isLeftPanel={false} />;
      case "concept":
        return <ConceptBeatView content={currentPage.content as never} />;
      case "example":
        return <WorkedExampleBeatView content={currentPage.content as never} />;
      case "tryit":
        return (
          <TryItBeatView
            content={currentPage.content as never}
            onInteractionComplete={() => setIsInteractionCompleted(true)}
          />
        );
      case "check":
        return (
          <KnowledgeCheckBeatView
            questions={(currentPage.content as { questions: never }).questions}
            pathSlug={module.pathSlug}
            moduleSlug={module.slug}
            onCheckPassed={() => setIsInteractionCompleted(true)}
          />
        );
      case "takeaway":
        return (
          <TakeawayBeatView
            content={currentPage.content as never}
            pathSlug={module.pathSlug}
            moduleSlug={module.slug}
            onFinished={() => setIsInteractionCompleted(true)}
          />
        );
    }
  };

  return (
    <>
      {/* Onboarding Dialog */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onConfirm={(relaxed) => {
          localStorage.setItem("nextlearn.has_seen_learning_rules", "true");
          setShowHowItWorks(false);
          void initSession(relaxed);
        }}
      />

      {/* Pick Up Where You Left Off Dialog */}
      {showResumeModal && savedBeatIndex !== null && (
        <div
          className="resume-module-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-modal-title"
        >
          <div className="resume-module-card">
            <div className="resume-card-kicker">
              <Bookmark size={14} />
              <span>IN-PROGRESS MODULE</span>
            </div>
            <h2 id="resume-modal-title">Continue where you left off?</h2>
            <p>
              You were previously on <strong>Step {savedBeatIndex + 1} of {module.pages.length}: {beatNames[module.pages[savedBeatIndex]?.pageType] || "Lesson Beat"}</strong>.
            </p>
            <div className="resume-card-actions">
              <button
                type="button"
                className="resume-continue-btn"
                onClick={() => {
                  setCurrentPageIndex(savedBeatIndex);
                  setShowResumeModal(false);
                }}
              >
                <span>Continue from Step {savedBeatIndex + 1}</span>
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                className="resume-restart-btn"
                onClick={() => {
                  setCurrentPageIndex(0);
                  try {
                    localStorage.removeItem(`nextlearn.module_beat.${module.pathSlug}.${module.slug}`);
                  } catch {}
                  setShowResumeModal(false);
                }}
              >
                <RotateCcw size={13} />
                <span>Start from the beginning (Step 1)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focus Interruption Screen */}
      <InterruptedOverlay
        isOpen={isInterrupted}
        moduleTitle={module.title}
        onRestart={handleRestart}
        onExit={onExit}
      />

      {/* Warning Toast */}
      {warningMessage && (
        <div className="focus-warning-toast" role="alert">
          <AlertCircle size={15} />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Advance Error Notice */}
      {advanceError && (
        <div className="advance-error-toast" role="alert">
          <AlertCircle size={15} />
          <span>{advanceError}</span>
          <button onClick={() => setAdvanceError("")}>×</button>
        </div>
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <div className="session-paused-overlay">
          <div className="paused-card">
            <h2>Session Paused</h2>
            <p>You took a deliberate pause. The reading ring for this page will restart when you resume.</p>
            <button className="primary-btn resume-btn" onClick={handleResume}>
              Resume Module
            </button>
          </div>
        </div>
      )}

      {/* Master Shell */}
      <ImmersiveLearningShell
        pathTitle={pathTitle}
        module={module}
        currentPageIndex={currentPageIndex}
        currentPageType={currentPageType}
        minSeconds={minSeconds}
        onMinTimeComplete={handleMinTimeComplete}
        canAdvance={canAdvance}
        advanceReasonHint={advanceReasonHint}
        onAdvance={handleAdvance}
        onBack={currentPageIndex > 0 ? () => setCurrentPageIndex((prev) => prev - 1) : undefined}
        isPaused={isPaused}
        onPause={handlePause}
        onResume={handleResume}
        onExit={onExit}
        storyPanel={<StorySceneBeatView content={storyPage.content as never} isLeftPanel={true} />}
        learningPanel={renderLearningPanel()}
        relaxedMode={relaxedMode}
        isAudioReading={isAudioReading}
        onToggleReadAloud={handleToggleReadAloud}
      />
    </>
  );
}
