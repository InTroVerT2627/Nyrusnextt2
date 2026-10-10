"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  FinalTestAttemptSummary,
  FinalTestQuestionClient,
  LearnerQuestionSubmission,
} from "@/lib/final-test-types";
import TestQuestionView from "@/components/learning/TestQuestionView";
import TestFollowupView from "@/components/learning/TestFollowupView";
import HintConfirmationModal from "@/components/learning/HintConfirmationModal";
import TestResultView, { TestResultData } from "@/components/learning/TestResultView";
import InterruptedOverlay from "@/components/learning/InterruptedOverlay";

type FinalTestShellProps = {
  initialAttempt: FinalTestAttemptSummary;
  initialQuestion: FinalTestQuestionClient;
  token: string;
  pathTitle: string;
  pathSlug: string;
  onExit: () => void;
};

export default function FinalTestShell({
  initialAttempt,
  initialQuestion,
  token,
  pathTitle,
  pathSlug,
  onExit,
}: FinalTestShellProps) {
  const [attempt, setAttempt] = useState<FinalTestAttemptSummary>(initialAttempt);
  const [currentQuestion, setCurrentQuestion] = useState<FinalTestQuestionClient>(initialQuestion);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeFollowup, setActiveFollowup] = useState<{ id: string; prompt: string; index: number } | null>(null);

  // Timing state
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(initialAttempt.timeRemainingSeconds);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  // Modals & Overlays
  const [hintModalTier, setHintModalTier] = useState<"nudge" | "pointer" | "strong" | null>(null);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [interruptionReason, setInterruptionReason] = useState("");
  const [finalResult, setFinalResult] = useState<TestResultData | null>(null);

  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger test finalization
  const handleFinalize = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/test/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id, token }),
      });
      const data = await res.json();
      setFinalResult(data);
    } catch {
      setStatusMessage("Could not finalize test. Please contact reviewer.");
    } finally {
      setBusy(false);
    }
  }, [attempt.id, token]);

  // Handle interruption
  const triggerInterruption = useCallback(async (reason: string) => {
    setIsInterrupted(true);
    setInterruptionReason(reason);
    try {
      await fetch("/api/test/interrupt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id, token, reason }),
      });
    } catch {
      // offline fallback
    }
  }, [attempt.id, token]);

  // 1. Authoritative Server Clock & Countdown
  useEffect(() => {
    if (finalResult || isInterrupted || isTimeExpired) return;

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimeExpired(true);
          void handleFinalize();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [finalResult, isInterrupted, isTimeExpired, handleFinalize]);

  // 2. 5-Second Server Heartbeat
  useEffect(() => {
    if (finalResult || isInterrupted || isTimeExpired) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/test/heartbeat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ attemptId: attempt.id, token }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.expired) {
            setIsTimeExpired(true);
            void handleFinalize();
          } else if (typeof data.timeRemainingSeconds === "number") {
            // Re-sync with server clock
            setTimeRemainingSeconds(data.timeRemainingSeconds);
          }
        }
      } catch {
        // Network flutter handled gracefully
      }
    }, 5000);

    return () => clearInterval(heartbeatInterval);
  }, [attempt.id, token, finalResult, isInterrupted, isTimeExpired, handleFinalize]);

  // 3. Focus Session Guard: Visibility, blur, 3-second grace period
  useEffect(() => {
    if (finalResult || isInterrupted || isTimeExpired) return;

    function handleFocusLost() {
      if (graceTimerRef.current) return;
      graceTimerRef.current = setTimeout(() => {
        void triggerInterruption("Focus lost: tab switch or window minimize exceeded 3-second grace period.");
      }, 3000);
    }

    function handleFocusRegained() {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        handleFocusLost();
      } else {
        handleFocusRegained();
      }
    }

    function onBlur() {
      handleFocusLost();
    }

    function onFocus() {
      handleFocusRegained();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    };
  }, [finalResult, isInterrupted, isTimeExpired, triggerInterruption]);

  // Format time remaining MM:SS
  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isUrgent = timeRemainingSeconds <= 120; // < 2 mins (red)
  const isWarning = timeRemainingSeconds <= 600 && !isUrgent; // < 10 mins (amber)
  const timerColor = isUrgent ? "#DC2626" : isWarning ? "#D97706" : "#06C6E6";

  // Handle Hint Request
  async function confirmHint(tier: "nudge" | "pointer" | "strong") {
    setHintModalTier(null);
    setBusy(true);
    try {
      const res = await fetch("/api/test/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          token,
          questionId: currentQuestion.id,
          tier,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentQuestion((prev) => ({
          ...prev,
          revealedHints: [
            ...prev.revealedHints,
            { tier, text: data.text, deduction: data.deduction },
          ],
        }));
      }
    } catch {
      setStatusMessage("Failed to reveal hint.");
    } finally {
      setBusy(false);
    }
  }

  // Handle Question Answer Submission
  async function handleSubmitAnswer(submission: LearnerQuestionSubmission) {
    setBusy(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/test/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id, token, submission }),
      });
      if (!res.ok) throw new Error("Failed to evaluate answer.");

      const result = await res.json();
      if (result.followupRequired && result.nextFollowup) {
        // Transition to adaptive follow-up defense
        setActiveFollowup(result.nextFollowup);
      } else {
        // Advance to next question
        await advanceNextQuestion();
      }
    } catch (e: any) {
      setStatusMessage(e?.message || "Evaluation error.");
    } finally {
      setBusy(false);
    }
  }

  // Handle Follow-Up Defense Submission
  async function handleSubmitFollowup(followupId: string, response: string) {
    setBusy(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/test/followup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          token,
          questionId: currentQuestion.id,
          followupId,
          learnerResponse: response,
        }),
      });
      if (!res.ok) throw new Error("Failed to evaluate defense.");

      const result = await res.json();
      if (result.followupRequired && result.nextFollowup) {
        setActiveFollowup(result.nextFollowup);
      } else {
        setActiveFollowup(null);
        await advanceNextQuestion();
      }
    } catch (e: any) {
      setStatusMessage(e?.message || "Defense evaluation error.");
    } finally {
      setBusy(false);
    }
  }

  // Advance to next question or finalize
  async function advanceNextQuestion() {
    setBusy(true);
    try {
      const res = await fetch("/api/test/question/next", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          token,
          currentIndex: currentQuestionIndex,
        }),
      });
      const data = await res.json();
      if (data.hasNext && data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setCurrentQuestionIndex(data.currentQuestionIndex);
        setActiveFollowup(null);
      } else {
        // No more questions: finalize attempt!
        await handleFinalize();
      }
    } catch {
      setStatusMessage("Could not advance to next question.");
    } finally {
      setBusy(false);
    }
  }

  // Interruption Overlay Screen
  if (isInterrupted) {
    return (
      <InterruptedOverlay
        reason={interruptionReason || "Window focus was lost for more than 3 seconds."}
        onResumeClick={() => onExit()}
        isTerminated={true}
      />
    );
  }

  // Final Results Screen
  if (finalResult) {
    return <TestResultView data={finalResult} onExit={onExit} />;
  }

  const currentDeduction = currentQuestion.revealedHints.reduce((sum, h) => sum + h.deduction, 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      {/* Top Bar with authoritative server countdown and progress tracker */}
      <header
        style={{
          height: "60px",
          borderBottom: "1px solid #D9E8F3",
          backgroundColor: "#142D4E",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800, backgroundColor: "#06C6E6", color: "#142D4E", padding: "2px 8px", borderRadius: "4px" }}>
              N
            </span>
            <span style={{ fontWeight: 700, fontSize: "15px" }}>nextlearn</span>
          </Link>

          <span style={{ color: "#D9E8F3", fontSize: "14px" }}>|</span>

          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#06C6E6", textTransform: "uppercase" }}>
              FINAL TEST
            </span>
            <span style={{ fontSize: "13px", color: "#FFFFFF", marginLeft: "8px", fontWeight: 600 }}>
              {pathTitle}
            </span>
          </div>
        </div>

        {/* Center: Question Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#EAF6FC", fontWeight: 600 }}>
            Question {currentQuestionIndex + 1} of {attempt.totalQuestions}
          </span>
          <div style={{ width: "120px", height: "6px", backgroundColor: "#334155", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.round(((currentQuestionIndex + 1) / attempt.totalQuestions) * 100)}%`,
                backgroundColor: "#06C6E6",
                transition: "width 200ms ease-out",
              }}
            />
          </div>
        </div>

        {/* Right: Authoritative Server Timer & Exit */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(234, 246, 252, 0.1)",
              border: `1px solid ${timerColor}`,
              padding: "4px 12px",
              borderRadius: "20px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#EAF6FC" }}>TIME LEFT:</span>
            <strong style={{ fontSize: "14px", fontFamily: "JetBrains Mono, monospace", color: timerColor }}>
              {timeFormatted}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Leaving during the Final Test will mark your attempt as interrupted and enforce a 24-hour cooldown. Are you sure you wish to exit?"
                )
              ) {
                void triggerInterruption("Learner initiated early exit.");
              }
            }}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              border: "1px solid #D9E8F3",
              backgroundColor: "transparent",
              color: "#EAF6FC",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Exit Test
          </button>
        </div>
      </header>

      {/* Warning Banners for 10 min and 2 min */}
      {isUrgent && (
        <div style={{ backgroundColor: "#DC2626", color: "#FFFFFF", padding: "6px 16px", textAlign: "center", fontSize: "12px", fontWeight: 700 }}>
          ⚠ Less than 2 minutes remaining! Responses will be automatically submitted when time expires.
        </div>
      )}
      {isWarning && (
        <div style={{ backgroundColor: "#D97706", color: "#FFFFFF", padding: "6px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600 }}>
          Notice: 10 minutes remaining in this test session.
        </div>
      )}

      {statusMessage && (
        <div style={{ backgroundColor: "#DC2626", color: "#FFFFFF", padding: "8px 16px", textAlign: "center", fontSize: "13px" }}>
          {statusMessage}
        </div>
      )}

      {/* Main Workspace Body */}
      <main style={{ flex: 1, padding: "20px 16px", backgroundColor: "#F8FAFC" }}>
        {activeFollowup ? (
          <TestFollowupView
            followup={activeFollowup}
            questionTitle={currentQuestion.title}
            busy={busy}
            onSubmitFollowup={handleSubmitFollowup}
          />
        ) : (
          <TestQuestionView
            question={currentQuestion}
            busy={busy}
            onRequestHint={(tier) => setHintModalTier(tier)}
            onSubmitAnswer={handleSubmitAnswer}
          />
        )}
      </main>

      {/* Tiered Hint Confirmation Modal */}
      {hintModalTier && (
        <HintConfirmationModal
          isOpen={Boolean(hintModalTier)}
          tier={hintModalTier}
          currentDeduction={currentDeduction}
          onCancel={() => setHintModalTier(null)}
          onConfirm={() => confirmHint(hintModalTier)}
        />
      )}
    </div>
  );
}
