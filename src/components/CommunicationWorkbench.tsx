"use client";

import { useState } from "react";
import { type CommunicationPackage } from "@/lib/work-samples-shared";

type CheckResult = { title: string; passed: boolean; message?: string };
type SelectedQuestion = { id: string; position: number; question: string; bankVersion?: number };

export default function CommunicationWorkbench({ onEvidenceCreated }: { onEvidenceCreated?: () => void }) {
  const [activeTab, setActiveTab] = useState<"internal" | "external">("internal");

  const [executiveBriefing, setExecutiveBriefing] = useState(
    `INCIDENT RETROSPECTIVE BRIEFING — P0 BILLING LOCK CONTENTION
Incident Window: 2026-10-10 14:15 UTC to 14:33 UTC (18 minutes total duration).
Impacted Services: European checkout processing; 1,420 payment webhook retries queued.
Financial Blast Radius: $42,000 in first-attempt failed checkouts; 65% ($27,300) recovered on automated retry. Zero payment credentials or PII compromised.
Root Cause: Rolling migration script acquired an exclusive row-level lock across active billing sessions without timeout bounds.
Rollback & Recovery: Automated rollback completed at 14:33 UTC; all queued webhooks processed within SLA by 14:50 UTC.
Preventative Controls: Implemented zero-lock migration linters and automated migration sandbox tests prior to production rollout.`
  );

  const [customerAdvisory, setCustomerAdvisory] = useState(
    `SERVICE RESTORATION ADVISORY: EU PAYMENT PROCESSING STABILITY
Dear Valued Partner,
Between 14:15 UTC and 14:33 UTC today, our payment gateway encountered intermittent transaction latency affecting European checkout requests.
Our engineering infrastructure automatically restored full service at 14:33 UTC. No cardholder data was exposed at any time.
All affected transactions have been reconciled, and automated retries are complete. We apologize for the operational friction and have added pre-deployment transaction locks safeguards to prevent recurrence.`
  );

  const [headings] = useState([
    "Executive summary & blast radius",
    "Technical root cause calibrated for stakeholders",
    "Customer advisory & SLA stance",
    "Preventative roadmap"
  ]);

  const [report, setReport] = useState<Record<string, string>>({
    "Executive summary & blast radius": "18-minute outage during EU peak traffic; $42,000 in first-pass attempts affected, 65% recovered with zero data leakage.",
    "Technical root cause calibrated for stakeholders": "Database lock contention during a rolling schema migration prevented concurrent billing worker writes.",
    "Customer advisory & SLA stance": "Transparent external communication focused on data security confirmation, recovery status, and preventative safeguards.",
    "Preventative roadmap": "Mandating zero-lock migration tooling and automated canary migration verification in pre-production."
  });

  const [aiDisclosure, setAiDisclosure] = useState(false);
  const [checkingDraft, setCheckingDraft] = useState(false);
  const [draftSuggestions, setDraftSuggestions] = useState<string[] | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    deterministicPassed: boolean;
    evidenceRecorded: boolean;
    checks: CheckResult[];
    scores: Record<string, number>;
    confidence: string;
    feedback: string;
    questions: SelectedQuestion[];
  } | null>(null);

  const requestDraftFeedback = async () => {
    setCheckingDraft(true);
    setDraftSuggestions(null);
    try {
      const demoRole = localStorage.getItem("nextlearn.demo_role") || "learner";
      const pkg: CommunicationPackage = { executiveBriefing, customerAdvisory };
      const res = await fetch("/api/work-samples/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-demo-role": demoRole,
        },
        body: JSON.stringify({
          taskSlug: "executive-incident-briefing",
          solution: pkg,
          report,
          aiDisclosure,
          isDraft: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft review failed");
      setDraftSuggestions(data.draftFeedback?.suggestions || ["Looks solid!"]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Draft review could not be completed");
    } finally {
      setCheckingDraft(false);
    }
  };

  const submitFinalAssessment = async () => {
    setSubmitting(true);
    setEvalResult(null);
    try {
      const demoRole = localStorage.getItem("nextlearn.demo_role") || "learner";
      const pkg: CommunicationPackage = { executiveBriefing, customerAdvisory };
      const res = await fetch("/api/work-samples/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-demo-role": demoRole,
        },
        body: JSON.stringify({
          taskSlug: "executive-incident-briefing",
          solution: pkg,
          report,
          aiDisclosure,
          isDraft: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setEvalResult(data);
      if (data.evidenceRecorded && onEvidenceCreated) {
        onEvidenceCreated();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="work-sample-container">
      <div className="work-sample-header">
        <div className="badge-pill">
          <span>AUTHENTIC WORK SAMPLE</span> · <b>Workplace Communication</b>
        </div>
        <h2>P0 Incident Escalation & Revise-After-Feedback Loop</h2>
        <p>
          Author an incident communication package for an 18-minute billing outage affecting 1,420 transactions ($42,000 impact).
          Use the automated preliminary review to refine your tone and technical calibration before final submission.
        </p>
      </div>

      {/* Tab Selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          type="button"
          className={activeTab === "internal" ? "primary" : "secondary"}
          onClick={() => setActiveTab("internal")}
          style={{ padding: "8px 16px", fontSize: "13px" }}
        >
          Part A: Internal Executive Postmortem
        </button>
        <button
          type="button"
          className={activeTab === "external" ? "primary" : "secondary"}
          onClick={() => setActiveTab("external")}
          style={{ padding: "8px 16px", fontSize: "13px" }}
        >
          Part B: External Customer Advisory
        </button>
      </div>

      {/* Active Editor Panel */}
      <div className="panel editor-card" style={{ marginBottom: "20px", padding: "16px", background: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        {activeTab === "internal" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong>Internal Executive Briefing (VP Engineering & Head of Customer Ops)</strong>
              <small style={{ color: "var(--text-dim)" }}>Calibrate technical depth without unnecessary jargon</small>
            </div>
            <textarea
              value={executiveBriefing}
              onChange={(e) => setExecutiveBriefing(e.target.value)}
              rows={8}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "13px",
                lineHeight: "1.5",
                borderRadius: "6px",
                background: "var(--bg-input, #0d1117)",
                color: "var(--text-main, #c9d1d9)",
                border: "1px solid var(--border-color)",
              }}
            />
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong>External Customer Advisory (Enterprise Account Notice)</strong>
              <small style={{ color: "var(--text-dim)" }}>Focus on data integrity, SLA stance, and reassurance</small>
            </div>
            <textarea
              value={customerAdvisory}
              onChange={(e) => setCustomerAdvisory(e.target.value)}
              rows={8}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "13px",
                lineHeight: "1.5",
                borderRadius: "6px",
                background: "var(--bg-input, #0d1117)",
                color: "var(--text-main, #c9d1d9)",
                border: "1px solid var(--border-color)",
              }}
            />
          </div>
        )}

        {/* Revise-After-Feedback Loop Trigger */}
        <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="secondary"
            disabled={checkingDraft}
            onClick={requestDraftFeedback}
            style={{ fontSize: "13px", padding: "6px 14px" }}
          >
            {checkingDraft ? "Analyzing Tone & Metrics…" : "↻ Request Preliminary Feedback (Revise Loop)"}
          </button>
        </div>

        {/* Suggestion Box */}
        {draftSuggestions && (
          <div style={{ marginTop: "14px", padding: "12px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid var(--color-primary, #38bdf8)", borderRadius: "6px" }}>
            <strong style={{ fontSize: "13px", color: "var(--color-primary, #38bdf8)" }}>Preliminary Revision Feedback:</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: "20px", fontSize: "13px" }}>
              {draftSuggestions.map((sug, i) => (
                <li key={i}>{sug}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Structured Memo */}
      <div className="memo-section" style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Communication Strategy Rationale</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {headings.map((h) => (
            <label key={h} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-dim)" }}>{h}</span>
              <textarea
                value={report[h] || ""}
                onChange={(e) => setReport({ ...report, [h]: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "13px",
                  borderRadius: "6px",
                  background: "var(--bg-input, #0d1117)",
                  color: "var(--text-main, #c9d1d9)",
                  border: "1px solid var(--border-color)",
                }}
              />
            </label>
          ))}
        </div>
      </div>

      {/* AI Disclosure & Final Submit */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
        <label className="check-row" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={aiDisclosure}
            onChange={(e) => setAiDisclosure(e.target.checked)}
          />
          <span>I used AI assistance (optional and never penalized).</span>
        </label>

        <button
          type="button"
          className="primary"
          disabled={submitting}
          onClick={submitFinalAssessment}
          style={{ padding: "10px 24px", fontSize: "14px" }}
        >
          {submitting ? "Scoring Communication Package…" : "Submit Final Package for Proof of Skill →"}
        </button>
      </div>

      {/* Assessment Results */}
      {evalResult && (
        <div className="panel result-panel" style={{ marginTop: "24px", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span className="badge-pill">ASSESSMENT RESULTS</span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: evalResult.deterministicPassed ? "var(--color-success, #3fb950)" : "var(--color-danger, #f85149)" }}>
              {evalResult.deterministicPassed ? "✓ Communication Checks Passed" : "⚠ Revision Required"}
            </span>
          </div>

          <p style={{ fontSize: "14px", marginBottom: "16px" }}>{evalResult.feedback}</p>

          <div style={{ marginBottom: "16px" }}>
            <strong style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--text-dim)", display: "block", marginBottom: "8px" }}>
              Structural & Quantitative Checks
            </strong>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {evalResult.checks.map((chk, idx) => (
                <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "6px 0", fontSize: "13px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: chk.passed ? "#3fb950" : "#f85149" }}>{chk.passed ? "✓" : "×"}</span>
                  <div>
                    <span>{chk.title}</span>
                    {chk.message && <small style={{ display: "block", color: "var(--text-dim)" }}>{chk.message}</small>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {evalResult.evidenceRecorded && (
            <div className="notice" style={{ background: "rgba(63, 185, 80, 0.1)", border: "1px solid #3fb950", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
              <strong>Proof of Skill Evidence Card Created!</strong>
              <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
                This work sample has been recorded to your private portfolio under <code>workplace-communication</code>. You can manage recruiter consent from your evidence profile.
              </p>
            </div>
          )}

          {evalResult.questions && evalResult.questions.length > 0 && (
            <div>
              <strong style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--text-dim)", display: "block", marginBottom: "8px" }}>
                Adaptive Follow-Up Defense Questions
              </strong>
              {evalResult.questions.map((q) => (
                <div key={q.id} style={{ padding: "10px", background: "var(--bg-input)", borderRadius: "6px", marginBottom: "8px", fontSize: "13px" }}>
                  <strong>{q.position}. {q.question}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
