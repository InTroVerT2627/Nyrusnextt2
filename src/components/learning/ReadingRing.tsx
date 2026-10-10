"use client";

import React, { useEffect, useState, useRef } from "react";
import { Check } from "lucide-react";

type ReadingRingProps = {
  minSeconds: number;
  onComplete: () => void;
  isPaused?: boolean;
  active?: boolean;
  className?: string;
};

export default function ReadingRing({
  minSeconds,
  onComplete,
  isPaused = false,
  active = true,
  className = "",
}: ReadingRingProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState("");
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onCompleteRef up to date with caller prop
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset when minSeconds or active changes
  useEffect(() => {
    setElapsedSeconds(0);
    setIsCompleted(false);
    setScreenReaderAnnouncement("");
    completedRef.current = false;
  }, [minSeconds, active]);

  // Handle immediate completion if minSeconds <= 0
  useEffect(() => {
    if (!active || isPaused) return;
    if (minSeconds <= 0 && !completedRef.current) {
      completedRef.current = true;
      setIsCompleted(true);
      setScreenReaderAnnouncement("Ready to continue.");
      onCompleteRef.current();
    }
  }, [minSeconds, active, isPaused]);

  // Timer interval for positive minSeconds
  useEffect(() => {
    if (!active || isPaused || isCompleted || minSeconds <= 0) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 0.2;
        if (next >= minSeconds) {
          return minSeconds;
        }
        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [active, isPaused, isCompleted, minSeconds]);

  // Safely trigger onComplete in an effect when elapsedSeconds reaches minSeconds
  useEffect(() => {
    if (minSeconds > 0 && elapsedSeconds >= minSeconds && !completedRef.current) {
      completedRef.current = true;
      setIsCompleted(true);
      setScreenReaderAnnouncement("Ready to continue.");
      onCompleteRef.current();
    }
  }, [elapsedSeconds, minSeconds]);

  // Circular SVG geometry
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progressFraction = Math.min(1, elapsedSeconds / Math.max(1, minSeconds));
  const strokeDashoffset = circumference - progressFraction * circumference;

  return (
    <div
      className={`reading-ring-container ${isCompleted ? "completed" : ""} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(progressFraction * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={isCompleted ? "Reading time satisfied: Ready to continue" : "Reading time in progress"}
    >
      {/* Screen Reader Polite Live Region (Announces ONCE on completion, not every second) */}
      <span className="sr-only" aria-live="polite">
        {screenReaderAnnouncement}
      </span>

      <div className="ring-visual-wrap">
        <svg
          width="40"
          height="40"
          viewBox="0 0 44 44"
          className="reading-ring-svg"
          aria-hidden="true"
        >
          {/* Background circle track */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            className="ring-bg-track"
          />
          {/* Progress fill-up arc */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            className="ring-fill-arc"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="ring-center-icon" aria-hidden="true">
          {isCompleted ? (
            <Check size={14} className="ring-check-icon" />
          ) : (
            <span className="ring-dot" />
          )}
        </div>
      </div>

      <div className="ring-text-block">
        <span className="ring-title">
          {isCompleted ? "Pacing Complete" : "Reading Time"}
        </span>
        <span className="ring-hint">
          {isCompleted ? "Ready to continue" : "Paces session calmly"}
        </span>
      </div>
    </div>
  );
}
