"use client";

import { useState } from "react";
import { type UnitEconomicsModel } from "@/lib/work-samples-shared";

type CheckResult = { title: string; passed: boolean; message?: string };
type SelectedQuestion = { id: string; position: number; question: string; bankVersion?: number };

export default function SpreadsheetGrid({ onEvidenceCreated }: { onEvidenceCreated?: () => void }) {
  // Inputs (locked / baseline from case study)
  const spend = 50000;
  const customers = 250;
  const mrr = 120;
  const grossMargin = 0.80;
  const churn = 0.05;

  // Formula cells / calculated outputs
  const [cacFormula, setCacFormula] = useState("=B2/B1");
  const [cacValue, setCacValue] = useState(200);

  const [ltvFormula, setLtvFormula] = useState("=(B3*B4)/B5");
  const [ltvValue, setLtvValue] = useState(1920);

  const [ratioFormula, setRatioFormula] = useState("=B7/B6");
  const [ratioValue, setRatioValue] = useState(9.60);

  const [paybackFormula, setPaybackFormula] = useState("=B6/(B3*B4)");
  const [paybackValue, setPaybackValue] = useState(2.08);

  const [headings] = useState([
    "Unit economics health summary",
    "Churn sensitivity analysis",
    "Capital allocation recommendation",
    "Downside risk mitigation"
  ]);

  const [report, setReport] = useState<Record<string, string>>({
    "Unit economics health summary": "Customer Acquisition Cost is $200.00 and Lifetime Value is $1,920.00, resulting in a 9.60x LTV:CAC ratio and 2.08-month payback period.",
    "Churn sensitivity analysis": "If monthly churn increases from 5% to 8%, LTV drops by 37.5% from $1,920 to $1,200. However, the ratio remains robust at 6.0x.",
    "Capital allocation recommendation": "Recommend increasing Sales & Marketing spend by 40% next quarter while monitoring payback velocity. A 2-month payback affords aggressive expansion.",
    "Downside risk mitigation": "Tie acquisition pacing to cohort retention cohorts and establish a circuit breaker if 3-month retention drops below 92%."
  });

  const [aiDisclosure, setAiDisclosure] = useState(false);
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

  // Recalculate on input changes
  const handleRecalculate = () => {
    const calcCac = spend / customers;
    const calcLtv = (mrr * grossMargin) / churn;
    const calcRatio = calcLtv / calcCac;
    const calcPayback = calcCac / (mrr * grossMargin);

    setCacValue(Number(calcCac.toFixed(2)));
    setLtvValue(Number(calcLtv.toFixed(2)));
    setRatioValue(Number(calcRatio.toFixed(2)));
    setPaybackValue(Number(calcPayback.toFixed(2)));
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    setEvalResult(null);
    try {
      const demoRole = localStorage.getItem("nextlearn.demo_role") || "learner";
      const modelPayload: UnitEconomicsModel = {
        cac: cacValue,
        ltv: ltvValue,
        ltvCacRatio: ratioValue,
        paybackMonths: paybackValue,
      };

      const res = await fetch("/api/work-samples/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-demo-role": demoRole,
        },
        body: JSON.stringify({
          taskSlug: "saas-unit-economics",
          solution: modelPayload,
          report,
          aiDisclosure,
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
          <span>AUTHENTIC WORK SAMPLE</span> · <b>Business Analytics Model</b>
        </div>
        <h2>B2B SaaS Unit Economics & CAC Payback Model</h2>
        <p>
          Construct an interactive unit economics spreadsheet model. Validate CAC, LTV, LTV:CAC, and Payback period deterministically,
          then formulate a strategic capital allocation memo for the CFO.
        </p>
      </div>

      {/* Spreadsheet Grid Panel */}
      <div className="panel spreadsheet-card" style={{ marginBottom: "20px", padding: "16px", background: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <strong>Interactive Spreadsheet Grid (Model v2.4)</strong>
          <button type="button" className="secondary" onClick={handleRecalculate} style={{ fontSize: "12px", padding: "4px 10px" }}>
            ↻ Refresh Formulas
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "8px 12px", width: "40px", color: "var(--text-dim)" }}>#</th>
                <th style={{ padding: "8px 12px" }}>Metric / Parameter</th>
                <th style={{ padding: "8px 12px", width: "180px" }}>Value</th>
                <th style={{ padding: "8px 12px" }}>Formula / Logic</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>B1</td>
                <td style={{ padding: "8px 12px" }}>New Customers Acquired</td>
                <td style={{ padding: "8px 12px", fontWeight: "600" }}>{customers}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>Cohort input</td>
              </tr>
              {/* Row 2 */}
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>B2</td>
                <td style={{ padding: "8px 12px" }}>Sales & Marketing Spend ($)</td>
                <td style={{ padding: "8px 12px", fontWeight: "600" }}>${spend.toLocaleString()}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>Quarterly expense</td>
              </tr>
              {/* Row 3 */}
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>B3</td>
                <td style={{ padding: "8px 12px" }}>Monthly Recurring Revenue per Customer ($)</td>
                <td style={{ padding: "8px 12px", fontWeight: "600" }}>${mrr}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>ARPU input</td>
              </tr>
              {/* Row 4 */}
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>B4</td>
                <td style={{ padding: "8px 12px" }}>Gross Margin %</td>
                <td style={{ padding: "8px 12px", fontWeight: "600" }}>{(grossMargin * 100).toFixed(0)}%</td>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>COGS margin</td>
              </tr>
              {/* Row 5 */}
              <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>B5</td>
                <td style={{ padding: "8px 12px" }}>Monthly Churn Rate %</td>
                <td style={{ padding: "8px 12px", fontWeight: "600" }}>{(churn * 100).toFixed(1)}%</td>
                <td style={{ padding: "8px 12px", color: "var(--text-dim)" }}>Observed churn</td>
              </tr>

              {/* Calculated Outputs */}
              {/* Row 6: CAC */}
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(56, 189, 248, 0.05)" }}>
                <td style={{ padding: "8px 12px", fontWeight: "bold", color: "var(--color-primary, #38bdf8)" }}>B6</td>
                <td style={{ padding: "8px 12px", fontWeight: "600" }}>Customer Acquisition Cost (CAC)</td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="number"
                    value={cacValue}
                    onChange={(e) => setCacValue(Number(e.target.value))}
                    style={{ width: "120px", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)" }}
                  />
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="text"
                    value={cacFormula}
                    onChange={(e) => setCacFormula(e.target.value)}
                    style={{ width: "160px", padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)" }}
                  />
                </td>
              </tr>

              {/* Row 7: LTV */}
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(56, 189, 248, 0.05)" }}>
                <td style={{ padding: "8px 12px", fontWeight: "bold", color: "var(--color-primary, #38bdf8)" }}>B7</td>
                <td style={{ padding: "8px 12px", fontWeight: "600" }}>Customer Lifetime Value (LTV)</td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="number"
                    value={ltvValue}
                    onChange={(e) => setLtvValue(Number(e.target.value))}
                    style={{ width: "120px", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)" }}
                  />
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="text"
                    value={ltvFormula}
                    onChange={(e) => setLtvFormula(e.target.value)}
                    style={{ width: "160px", padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)" }}
                  />
                </td>
              </tr>

              {/* Row 8: Ratio */}
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(56, 189, 248, 0.05)" }}>
                <td style={{ padding: "8px 12px", fontWeight: "bold", color: "var(--color-primary, #38bdf8)" }}>B8</td>
                <td style={{ padding: "8px 12px", fontWeight: "600" }}>LTV to CAC Ratio</td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="number"
                    step="0.01"
                    value={ratioValue}
                    onChange={(e) => setRatioValue(Number(e.target.value))}
                    style={{ width: "120px", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)" }}
                  />
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="text"
                    value={ratioFormula}
                    onChange={(e) => setRatioFormula(e.target.value)}
                    style={{ width: "160px", padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)" }}
                  />
                </td>
              </tr>

              {/* Row 9: Payback */}
              <tr style={{ background: "rgba(56, 189, 248, 0.05)" }}>
                <td style={{ padding: "8px 12px", fontWeight: "bold", color: "var(--color-primary, #38bdf8)" }}>B9</td>
                <td style={{ padding: "8px 12px", fontWeight: "600" }}>CAC Payback Period (Months)</td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="number"
                    step="0.01"
                    value={paybackValue}
                    onChange={(e) => setPaybackValue(Number(e.target.value))}
                    style={{ width: "120px", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)" }}
                  />
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="text"
                    value={paybackFormula}
                    onChange={(e) => setPaybackFormula(e.target.value)}
                    style={{ width: "160px", padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)" }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendation Memo */}
      <div className="memo-section" style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>CFO Investment & Allocation Memo</h3>
        <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "14px" }}>
          Synthesize unit economics, sensitivity to churn fluctuations, and your strategic growth allocation recommendation.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {headings.map((h) => (
            <label key={h} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-dim)" }}>{h}</span>
              <textarea
                value={report[h] || ""}
                onChange={(e) => setReport({ ...report, [h]: e.target.value })}
                rows={4}
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

      {/* AI Disclosure & Submit */}
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
          onClick={submitAssessment}
          style={{ padding: "10px 24px", fontSize: "14px" }}
        >
          {submitting ? "Evaluating Formulas & Scoring Memo…" : "Submit Model for Proof of Skill →"}
        </button>
      </div>

      {/* Assessment Evaluation Feedback */}
      {evalResult && (
        <div className="panel result-panel" style={{ marginTop: "24px", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span className="badge-pill">ASSESSMENT RESULTS</span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: evalResult.deterministicPassed ? "var(--color-success, #3fb950)" : "var(--color-danger, #f85149)" }}>
              {evalResult.deterministicPassed ? "✓ Numeric Formula Checks Passed" : "⚠ Calculations Need Revision"}
            </span>
          </div>

          <p style={{ fontSize: "14px", marginBottom: "16px" }}>{evalResult.feedback}</p>

          <div style={{ marginBottom: "16px" }}>
            <strong style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--text-dim)", display: "block", marginBottom: "8px" }}>
              Deterministic Numeric Checks
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
                This work sample has been recorded to your private portfolio under <code>business-analytics</code>. You can manage recruiter consent from your evidence profile.
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
