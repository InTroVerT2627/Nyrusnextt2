"use client";

import React, { useState } from "react";
import { Shield, Clock, Eye, Pause, Sparkles, Check } from "lucide-react";

type HowItWorksModalProps = {
  isOpen: boolean;
  onConfirm: (relaxedMode: boolean) => void;
};

export default function HowItWorksModal({ isOpen, onConfirm }: HowItWorksModalProps) {
  const [relaxedMode, setRelaxedMode] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="how-it-works-overlay" role="dialog" aria-modal="true" aria-labelledby="hiw-title">
      <div className="how-it-works-card">
        <div className="hiw-header">
          <div className="hiw-icon-badge">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="hiw-kicker">FOCUSED LEARNING ENVIRONMENT</span>
            <h2 id="hiw-title">How Learning Modules Work</h2>
          </div>
        </div>

        <p className="hiw-intro">
          NextLearn learning modules are designed like focused software workspaces to help you build genuine understanding through reading, worked examples, and try-it activities.
        </p>

        <div className="hiw-rules-grid">
          <div className="hiw-rule-item">
            <div className="rule-icon-wrap">
              <Clock size={16} />
            </div>
            <div className="rule-copy">
              <strong>Calm Reading-Time Ring</strong>
              <p>Each page features a pacing ring to encourage thorough reading before advancing. It is a fill-up aid, not a stressful countdown.</p>
            </div>
          </div>

          <div className="hiw-rule-item">
            <div className="rule-icon-wrap">
              <Eye size={16} />
            </div>
            <div className="rule-copy">
              <strong>Stay on Page Focus</strong>
              <p>To preserve immersion, leaving the tab or window ends the session. A 3-second grace period absorbs accidental window switches.</p>
            </div>
          </div>

          <div className="hiw-rule-item">
            <div className="rule-icon-wrap">
              <Pause size={16} />
            </div>
            <div className="rule-copy">
              <strong>Deliberate Pause</strong>
              <p>Need a break? Use the Pause button between content pages to step away without penalty. You can pause once per module attempt.</p>
            </div>
          </div>

          <div className="hiw-rule-item">
            <div className="rule-icon-wrap">
              <Shield size={16} />
            </div>
            <div className="rule-copy">
              <strong>Private to You</strong>
              <p>Timing metrics, pauses, and interruption records are private to you. They are never shown to recruiters or used in candidate rankings.</p>
            </div>
          </div>
        </div>

        {/* Relaxed Mode Accessibility Toggle */}
        <div className="relaxed-mode-panel">
          <label className="relaxed-mode-label">
            <input
              type="checkbox"
              checked={relaxedMode}
              onChange={(e) => setRelaxedMode(e.target.checked)}
            />
            <div className="relaxed-label-text">
              <strong>Enable Relaxed Focus Mode (For Accessibility Needs)</strong>
              <span>Disables the tab-switch lock and shortens reading ring pacing by 50%. Available to anyone with no justification required.</span>
            </div>
          </label>
        </div>

        <div className="hiw-footer">
          <button className="primary-btn start-module-ack-btn" onClick={() => onConfirm(relaxedMode)}>
            <Check size={16} />
            <span>I understand, begin module</span>
          </button>
        </div>
      </div>
    </div>
  );
}
