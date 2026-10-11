"use client";

import React, { useState } from "react";
import { TakeawayContent } from "@/lib/learning-experience-types";
import { CheckCircle2, Bookmark, Lock, ArrowRight } from "lucide-react";

type TakeawayBeatViewProps = {
  content: TakeawayContent;
  pathSlug: string;
  moduleSlug: string;
  onFinished: () => void;
};

export default function TakeawayBeatView({
  content,
  pathSlug,
  moduleSlug,
  onFinished,
}: TakeawayBeatViewProps) {
  const [personalReflection, setPersonalReflection] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSaveReflection = () => {
    if (personalReflection.trim()) {
      localStorage.setItem(
        `nextlearn.takeaway.${pathSlug}.${moduleSlug}`,
        personalReflection
      );
      setSaved(true);
    }
  };

  return (
    <div className="takeaway-beat-layout">
      <div className="takeaway-hero-badge">
        <CheckCircle2 size={16} />
        <span>MODULE TAKEAWAY · CONSOLIDATE YOUR LEARNING</span>
      </div>

      <h2 className="takeaway-heading">Key Takeaways from This Module</h2>

      {/* Summary Card */}
      <div className="takeaway-summary-card">
        <ul className="summary-points-list">
          {content.summaryLines.map((line, idx) => (
            <li key={idx}>
              <span className="bullet-point">✦</span>
              <p>{line}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* "What Stays with Me" Private Note */}
      <div className="personal-takeaway-box">
        <div className="takeaway-note-header">
          <Bookmark size={15} />
          <strong>What Stays with Me (Private Note):</strong>
        </div>
        <p className="reflection-prompt-copy">{content.reflectionPrompt}</p>

        <textarea
          rows={3}
          value={personalReflection}
          onChange={(e) => {
            setPersonalReflection(e.target.value);
            setSaved(false);
          }}
          placeholder="Write a quick personal takeaway to anchor this concept in your memory..."
        />

        <div className="takeaway-note-footer">
          <div className="note-privacy-note">
            <Lock size={12} />
            <span>Private note. Never visible to recruiters or reviewers.</span>
          </div>
          <button
            className="secondary-btn save-takeaway-btn"
            disabled={!personalReflection.trim() || saved}
            onClick={handleSaveReflection}
          >
            <span>{saved ? "Saved" : "Save Note"}</span>
          </button>
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="primary-btn"
          onClick={onFinished}
          style={{
            background: "var(--forest)",
            color: "#FFFFFF",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "13.5px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span>Complete Module & Return to Track</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
