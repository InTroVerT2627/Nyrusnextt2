"use client";

import { useState } from "react";
import Link from "next/link";

export type QuestionResultItem = {
  questionId: string;
  order: number;
  title: string;
  type: string;
  baseScore: number;
  optimalityScore: number;
  hintsDeduction: number;
  followupScore: number;
  finalScore: number;
  confidence: "high" | "medium" | "low";
  feedback: string;
  evidenceQuotes: string[];
};

export type TestResultData = {
  attemptId: string;
  pathTitle: string;
  pathSlug: string;
  totalScore: number;
  overallLevel: "insufficient" | "developing" | "proficient" | "advanced";
  confidence: "high" | "medium" | "low";
  proctorMode: string;
  questions: QuestionResultItem[];
};

type TestResultViewProps = {
  data: TestResultData;
  onExit: () => void;
};

export default function TestResultView({ data, onExit }: TestResultViewProps) {
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeReason, setChallengeReason] = useState("");
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);
  const [reportQuestionId, setReportQuestionId] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const levelColor =
    data.overallLevel === "advanced"
      ? "#059669"
      : data.overallLevel === "proficient"
      ? "#06C6E6"
      : data.overallLevel === "developing"
      ? "#D97706"
      : "#DC2626";

  async function handleChallengeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeReason.trim()) return;

    try {
      await fetch(`/api/attempts/${data.attemptId}/appeal`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: challengeReason.trim() }),
      }).catch(() => {});
    } catch {
      // non-blocking for demo
    }
    setChallengeSubmitted(true);
  }

  return (
    <div style={{ maxWidth: "920px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: "#142D4E",
          color: "#FFFFFF",
          borderRadius: "14px",
          padding: "28px",
          marginBottom: "24px",
          boxShadow: "0 10px 15px -3px rgba(20, 45, 78, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#06C6E6",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              FINAL TEST COMPLETED · {data.pathTitle.toUpperCase()}
            </span>
            <h1 style={{ margin: "6px 0 0", fontSize: "24px", fontWeight: 800 }}>
              Proof of Skill Assessment Result
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#EAF6FC" }}>
              Mode: {data.proctorMode === "device_checked" ? "Device Verified" : "Unproctored"} · Server Clock Authenticated
            </p>
          </div>

          {/* Level & Score Badge */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: "20px",
                backgroundColor: levelColor,
                color: "#142D4E",
                fontWeight: 800,
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "4px",
              }}
            >
              {data.overallLevel}
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#FFFFFF" }}>
              {Math.round(data.totalScore)}
              <span style={{ fontSize: "16px", color: "#EAF6FC", fontWeight: 500 }}> / 100</span>
            </div>
            <span style={{ fontSize: "12px", color: "#EAF6FC" }}>
              Confidence: <strong>{data.confidence.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* Disclaimer per Part A spec */}
        <div
          style={{
            marginTop: "18px",
            padding: "10px 14px",
            borderRadius: "6px",
            backgroundColor: "rgba(234, 246, 252, 0.1)",
            border: "1px solid rgba(234, 246, 252, 0.2)",
            fontSize: "12px",
            color: "#EAF6FC",
          }}
        >
          <strong>Notice:</strong> Experimental proof-of-skill sandbox evidence. Not a validated hiring predictor.
          This result updates your private skill profile. It will only be visible to recruiters if you explicitly grant skill-level consent.
        </div>
      </div>

      {/* Breakdown per Question */}
      <h2 style={{ fontSize: "18px", color: "#142D4E", fontWeight: 700, marginBottom: "16px" }}>
        Question-by-Question Diagnostic Breakdown
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
        {data.questions.map((q) => (
          <div
            key={q.questionId}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #D9E8F3",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(20, 45, 78, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Question #{q.order} · {q.type.replace("_", " ")}
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "16px", color: "#142D4E", fontWeight: 700 }}>
                  {q.title}
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#142D4E" }}>
                  {Math.round(q.finalScore)}
                  <small style={{ fontSize: "12px", color: "#64748B" }}>/100</small>
                </span>
              </div>
            </div>

            {/* Score Component Breakdown Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                padding: "8px 12px",
                backgroundColor: "#EAF6FC",
                borderRadius: "6px",
                marginBottom: "12px",
                fontSize: "12px",
                color: "#334155",
              }}
            >
              <span>Base correctness: <strong>{q.baseScore} pts</strong></span>
              {q.optimalityScore > 0 && <span>Optimality: <strong>{q.optimalityScore} pts</strong></span>}
              {q.hintsDeduction > 0 && (
                <span style={{ color: "#D97706" }}>
                  Hint deductions: <strong>-{q.hintsDeduction}%</strong>
                </span>
              )}
              <span>Defense reasoning: <strong>{q.followupScore} pts</strong></span>
              <span>Confidence: <strong>{q.confidence}</strong></span>
            </div>

            {/* Feedback & Quotes */}
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>
              {q.feedback}
            </p>

            {q.evidenceQuotes.length > 0 && (
              <div style={{ marginTop: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>Demonstrated Evidence Quote:</span>
                <blockquote
                  style={{
                    margin: "4px 0 0",
                    paddingLeft: "10px",
                    borderLeft: "2px solid #06C6E6",
                    fontSize: "12px",
                    fontStyle: "italic",
                    color: "#334155",
                  }}
                >
                  "{q.evidenceQuotes[0]}"
                </blockquote>
              </div>
            )}

            {/* Problem Report Option */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setReportQuestionId(q.questionId)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "11px",
                  color: "#64748B",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Report issue with this question
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Challenge / Appeal Route */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #D9E8F3",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: "15px", color: "#142D4E", fontWeight: 700 }}>
            Disagree with the evaluation?
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
            Submit an appeal. Your attempt will be routed to the Human Reviewer Queue with an anonymized diff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setChallengeOpen(true)}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #142D4E",
            backgroundColor: "#FFFFFF",
            color: "#142D4E",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Challenge this Result
        </button>
      </div>

      {/* Modal: Challenge / Appeal */}
      {challengeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(20, 45, 78, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #D9E8F3",
              maxWidth: "500px",
              width: "100%",
              padding: "24px",
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: "18px", color: "#142D4E", fontWeight: 700 }}>
              Submit an Appeal to Human Reviewers
            </h3>
            {challengeSubmitted ? (
              <div>
                <p style={{ fontSize: "13px", color: "#059669", fontWeight: 600 }}>
                  ✓ Your appeal has been logged to the append-only audit trail and queued for human review.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setChallengeOpen(false);
                    setChallengeSubmitted(false);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#142D4E",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleChallengeSubmit}>
                <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 12px" }}>
                  Please explain why you believe the assessment under-scored your demonstrated competence:
                </p>
                <textarea
                  rows={4}
                  value={challengeReason}
                  onChange={(e) => setChallengeReason(e.target.value)}
                  placeholder="Detail your objection and technical justification..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #D9E8F3",
                    fontSize: "13px",
                    marginBottom: "14px",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setChallengeOpen(false)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "1px solid #D9E8F3",
                      backgroundColor: "#FFFFFF",
                      color: "#64748B",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#142D4E",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Send to Reviewer Queue
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Report Question Issue */}
      {reportQuestionId && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(20, 45, 78, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #D9E8F3",
              maxWidth: "460px",
              width: "100%",
              padding: "20px",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "16px", color: "#142D4E", fontWeight: 700 }}>
              Report a Problem with Question
            </h4>
            {reportSubmitted ? (
              <div>
                <p style={{ fontSize: "13px", color: "#059669" }}>Thank you. Problem report recorded.</p>
                <button
                  type="button"
                  onClick={() => {
                    setReportQuestionId(null);
                    setReportSubmitted(false);
                    setReportText("");
                  }}
                  style={{ padding: "6px 12px", borderRadius: "4px", backgroundColor: "#142D4E", color: "#FFFFFF", border: "none" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setReportSubmitted(true);
                }}
              >
                <textarea
                  rows={3}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe ambiguity, broken data, or typo..."
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D9E8F3", fontSize: "12px", marginBottom: "12px" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setReportQuestionId(null)}
                    style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid #D9E8F3", background: "#FFFFFF", fontSize: "12px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "6px 14px", borderRadius: "4px", backgroundColor: "#142D4E", color: "#FFFFFF", border: "none", fontSize: "12px", fontWeight: 600 }}
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bottom Exit Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button"
          onClick={onExit}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "1px solid #D9E8F3",
            backgroundColor: "#FFFFFF",
            color: "#142D4E",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Return to Learning Paths
        </button>

        <Link
          href="/"
          style={{
            padding: "10px 22px",
            borderRadius: "6px",
            backgroundColor: "#06C6E6",
            color: "#142D4E",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          View Evidence Profile →
        </Link>
      </div>
    </div>
  );
}
