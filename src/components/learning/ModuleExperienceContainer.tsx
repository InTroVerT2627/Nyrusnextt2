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
import { AlertCircle } from "lucide-react";

type ModuleExperienceContainerProps = {
  pathTitle: string;
  module: FullModule;
  onExit: () => void;
  onModuleCompleted: () => void;
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
        setCurrentPageIndex(0);
        setIsInterrupted(false);
      } else {
        const fallbackId = `local-sess-${Date.now()}`;
        setSessionId(fallbackId);
        setSessionToken(`local-tok-${Date.now()}`);
        setCurrentPageIndex(0);
        setIsInterrupted(false);
      }
    } catch {
      const fallbackId = `local-sess-${Date.now()}`;
      setSessionId(fallbackId);
      setSessionToken(`local-tok-${Date.now()}`);
      setCurrentPageIndex(0);
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
      setIsInteractionCompleted(["scene", "concept", "takeaway"].includes(pType));
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

  useEffect(() => {
    if (sessionId && !isInterrupted && !isPaused) {
      void enterPage(currentPageIndex, currentPageType);
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
      onModuleCompleted();
      return;
    }

    const nextIdx = currentPageIndex + 1;
    const nextType = module.pages[nextIdx].pageType;

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
  const canAdvance = (!isPacedPage || isMinTimeSatisfied) && isInteractionCompleted;

  let advanceReasonHint = "";
  if (isPacedPage && !isMinTimeSatisfied) {
    advanceReasonHint = "Complete the reading time ring to unlock";
  } else if (!isInteractionCompleted) {
    advanceReasonHint =
      currentPageType === "teaser"
        ? "Pick an option or reveal the topic to continue"
        : currentPageType === "tryit"
        ? "Attempt the practice activity to continue"
        : currentPageType === "check"
        ? "Pass at least 2 of 3 questions to unlock next module"
        : "Complete required activity to continue";
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
