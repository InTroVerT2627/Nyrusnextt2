"use client";

import { useState } from "react";

type TestFollowupViewProps = {
  followup: { id: string; prompt: string; index: number };
  questionTitle: string;
  busy: boolean;
  onSubmitFollowup: (followupId: string, response: string) => void;
};

export default function TestFollowupView({
  followup,
  questionTitle,
  busy,
  onSubmitFollowup,
}: TestFollowupViewProps) {
  const [response, setResponse] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim() || busy) return;
    onSubmitFollowup(followup.id, response.trim());
  }

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "20px 0" }}>
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--mint-deep)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(20, 45, 78, 0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--forest)",
              backgroundColor: "var(--forest)",
              padding: "3px 8px",
              borderRadius: "4px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            ADAPTIVE REASONING DEFENSE #{followup.index}
          </span>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            {questionTitle}
          </span>
        </div>

        <h3 style={{ margin: "12px 0 8px", fontSize: "18px", color: "var(--forest)", fontWeight: 700 }}>
          Follow-Up Question
        </h3>

        <div
          style={{
            backgroundColor: "var(--lime-light)",
            borderLeft: "3px solid var(--forest)",
            padding: "14px 18px",
            borderRadius: "0 8px 8px 0",
            marginBottom: "16px",
            fontSize: "15px",
            color: "var(--forest)",
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {followup.prompt}
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--mint-deep)",
            borderRadius: "6px",
            padding: "10px 14px",
            marginBottom: "18px",
            fontSize: "12px",
            color: "var(--muted)",
            lineHeight: 1.5,
          }}
        >
          <strong>Defense Note:</strong> This question tests how deeply you understand the constraints and implications of your previous answer.
          Per NextLearn principles, follow-up answers calibrate assessment confidence and operational maturity; they never penalize your base score.
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="followup-response-input" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--forest)", marginBottom: "6px" }}>
            Your Defense Explanation:
          </label>
          <textarea
            id="followup-response-input"
            rows={5}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Explain your approach, edge cases, and reasoning..."
            required
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--mint-deep)",
              fontSize: "13px",
              color: "var(--ink-soft)",
              lineHeight: 1.5,
              marginBottom: "16px",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={busy || !response.trim()}
              style={{
                padding: "10px 24px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: busy || !response.trim() ? "var(--mint-deep)" : "var(--forest)",
                color: "var(--forest)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: busy || !response.trim() ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Evaluating Defense…" : "Submit Defense →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
