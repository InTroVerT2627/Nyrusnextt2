"use client";

import React from "react";
import { AlertCircle, RotateCcw, Shield, ArrowLeft } from "lucide-react";

type InterruptedOverlayProps = {
  isOpen: boolean;
  moduleTitle: string;
  onRestart: () => void;
  onExit: () => void;
};

export default function InterruptedOverlay({
  isOpen,
  moduleTitle,
  onRestart,
  onExit,
}: InterruptedOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="interrupted-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="interrupted-title"
      aria-describedby="interrupted-desc"
    >
      <div className="interrupted-card">
        {/* Status Badge: Icon + Text (Never colour alone) */}
        <div className="interrupted-badge">
          <AlertCircle size={16} />
          <span>Unfinished (Interrupted)</span>
        </div>

        <h2 id="interrupted-title">You Left the Module</h2>
        <p id="interrupted-desc">
          You navigated away from <strong>{moduleTitle}</strong> for longer than the grace period, so this session attempt ended.
        </p>

        <div className="interrupted-note">
          <p>
            Start again when you can focus. To preserve immersion, learning modules require staying on the page. Partial answers from this interrupted attempt have been discarded.
          </p>
        </div>

        <div className="interrupted-disclaimer">
          <Shield size={13} />
          <span>This interruption record is completely private to you. It is never shown to recruiters or used in candidate evaluations.</span>
        </div>

        <div className="interrupted-actions">
          <button className="secondary-btn exit-interrupted-btn" onClick={onExit}>
            <ArrowLeft size={14} />
            <span>Return to Learning Overview</span>
          </button>
          <button className="primary-btn restart-interrupted-btn" onClick={onRestart}>
            <RotateCcw size={14} />
            <span>Restart Module from Beginning</span>
          </button>
        </div>
      </div>
    </div>
  );
}
