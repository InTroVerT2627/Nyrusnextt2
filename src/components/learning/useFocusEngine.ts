"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type FocusEngineOptions = {
  sessionId: string | null;
  sessionToken: string | null;
  relaxedMode: boolean;
  isPaused: boolean;
  active: boolean;
  onInterrupted: (reason: string) => void;
  onWarning: (message: string) => void;
};

const GRACE_PERIOD_MS = 3000;
const HEARTBEAT_INTERVAL_MS = 5000;

export function useFocusEngine({
  sessionId,
  sessionToken,
  relaxedMode,
  isPaused,
  active,
  onInterrupted,
  onWarning,
}: FocusEngineOptions) {
  const [warningCount, setWarningCount] = useState(0);
  const leaveTimeRef = useRef<number | null>(null);
  const isInterruptedRef = useRef(false);

  const reportInterrupt = useCallback(
    async (reason: "tab_hidden" | "window_blur" | "pagehide" | "heartbeat_lost", durationMs: number) => {
      if (!sessionId || isInterruptedRef.current || relaxedMode) return;
      isInterruptedRef.current = true;
      try {
        await fetch("/api/learn/session/interrupt", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, reason, durationMs }),
        });
      } catch {
        // ignore network error
      }
      onInterrupted(reason);
    },
    [sessionId, relaxedMode, onInterrupted]
  );

  // Heartbeat loop
  useEffect(() => {
    if (!sessionId || !sessionToken || isPaused || !active || isInterruptedRef.current) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/learn/session/heartbeat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, sessionToken }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.active && !isInterruptedRef.current) {
            isInterruptedRef.current = true;
            onInterrupted(data.reason || "heartbeat_lost");
          }
        }
      } catch {
        // tolerate momentary network drop < 30s
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [sessionId, sessionToken, isPaused, active, onInterrupted]);

  // Tab switch & Window blur detection
  useEffect(() => {
    if (!sessionId || relaxedMode || isPaused || !active || isInterruptedRef.current) return;

    const handleLeave = () => {
      if (leaveTimeRef.current === null) {
        leaveTimeRef.current = Date.now();
      }
    };

    const handleReturn = () => {
      if (leaveTimeRef.current !== null && !isInterruptedRef.current) {
        const awayMs = Date.now() - leaveTimeRef.current;
        leaveTimeRef.current = null;

        if (awayMs > GRACE_PERIOD_MS) {
          // Exceeded grace period -> end session
          void reportInterrupt("tab_hidden", awayMs);
        } else if (awayMs > 300) {
          // Short leave inside grace period
          setWarningCount((prev) => {
            const next = prev + 1;
            if (next >= 2) {
              // Second short leave counts as interruption
              void reportInterrupt("window_blur", awayMs);
            } else {
              onWarning("Please stay on this page to keep your learning session focused.");
            }
            return next;
          });
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleLeave();
      } else {
        handleReturn();
      }
    };

    const onWindowBlur = () => {
      // Check document.hasFocus() to prevent false alarms on iframe focus
      if (!document.hasFocus()) {
        handleLeave();
      }
    };

    const onWindowFocus = () => {
      handleReturn();
    };

    const onPageHide = () => {
      handleLeave();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [sessionId, relaxedMode, isPaused, active, onWarning, reportInterrupt]);

  return {
    warningCount,
    resetFocusEngine: () => {
      isInterruptedRef.current = false;
      leaveTimeRef.current = null;
      setWarningCount(0);
    },
  };
}
