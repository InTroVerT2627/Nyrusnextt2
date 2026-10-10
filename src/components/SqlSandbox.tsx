"use client";

import { useEffect, useState } from "react";
import initSqlJs, { type Database } from "sql.js";
import { SQL_SEED_SCRIPT } from "@/lib/work-samples-shared";

type CheckResult = { title: string; passed: boolean; message?: string };
type SelectedQuestion = { id: string; position: number; question: string; bankVersion?: number };

export default function SqlSandbox({ onEvidenceCreated }: { onEvidenceCreated?: () => void }) {
  const [db, setDb] = useState<Database | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [query, setQuery] = useState(`SELECT
  c.segment,
  ROUND(SUM(o.amount), 2) AS completed_revenue,
  COUNT(o.id) AS completed_orders,
  ROUND(AVG(o.amount), 2) AS avg_order_value
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN '2026-07-01' AND '2026-09-30'
GROUP BY c.segment
ORDER BY completed_revenue DESC;`);

  const [headings] = useState([
    "Query findings summary",
    "Operational implications for sales engineering",
    "Data caveats & limitations",
    "Next steps recommendation"
  ]);
  const [report, setReport] = useState<Record<string, string>>({
    "Query findings summary": "Enterprise drove $32,500 across 3 orders with an AOV of $10,833.33, while SMB generated $4,800 across 6 orders with $800 AOV.",
    "Operational implications for sales engineering": "Sales engineering capacity should prioritize Enterprise onboarding due to order value density, while SMB can be served via automated self-serve playbooks.",
    "Data caveats & limitations": "Pending and refunded orders were filtered out to avoid overstating realized cash flow. Customers with zero orders are excluded by the inner join.",
    "Next steps recommendation": "Implement a 30-day cohort retention tracking query and evaluate SMB expansion conversion."
  });

  const [aiDisclosure, setAiDisclosure] = useState(false);
  const [localRows, setLocalRows] = useState<Record<string, unknown>[]>([]);
  const [localColumns, setLocalColumns] = useState<string[]>([]);
  const [localError, setLocalError] = useState("");
  const [localTimeMs, setLocalTimeMs] = useState<number | null>(null);

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

  // Initialize WASM SQLite in browser
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: (file) => `https://sql.js.org/dist/${file}`,
        });
        const database = new SQL.Database();
        database.run(SQL_SEED_SCRIPT);
        if (active) {
          setDb(database);
          setDbLoading(false);
        }
      } catch (e) {
        console.error("WASM SQLite failed to load:", e);
        if (active) setDbLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const runLocalQuery = () => {
    if (!db) return;
    setLocalError("");
    const start = performance.now();
    try {
      const res = db.exec(query);
      const elapsed = Math.round(performance.now() - start);
      setLocalTimeMs(elapsed);
      if (!res.length) {
        setLocalColumns([]);
        setLocalRows([]);
        return;
      }
      const first = res[0];
      setLocalColumns(first.columns);
      const rows = first.values.map((vals) => {
        const rowObj: Record<string, unknown> = {};
        first.columns.forEach((c, idx) => {
          rowObj[c] = vals[idx];
        });
        return rowObj;
      });
      setLocalRows(rows);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Error executing SQL query");
      setLocalColumns([]);
      setLocalRows([]);
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    setEvalResult(null);
    try {
      const demoRole = localStorage.getItem("nextlearn.demo_role") || "learner";
      const res = await fetch("/api/work-samples/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-demo-role": demoRole,
        },
        body: JSON.stringify({
          taskSlug: "sql-cohort-revenue",
          solution: query,
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
          <span>AUTHENTIC WORK SAMPLE</span> · <b>Data Analytics Sandbox</b>
        </div>
        <h2>Customer Cohort Revenue & Retention Analysis</h2>
        <p>
          Write a deterministic SQL query in the in-browser WASM SQLite sandbox to calculate segment revenues for Q3 2026.
          Document your insights in the executive memo. Tests decide query correctness; Gemini evaluates business reasoning.
        </p>
      </div>

      {/* Schema helper */}
      <div className="panel schema-box" style={{ padding: "16px", marginBottom: "20px", background: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <strong>WASM SQLite Schema (In-Memory Database)</strong>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
            {dbLoading ? "Loading WASM engine…" : "✓ SQLite WASM Ready"}
          </span>
        </div>
        <div style={{ fontSize: "12px", fontFamily: "var(--font-mono, monospace)", color: "var(--text-dim)" }}>
          <div><code>customers (id INTEGER, name TEXT, segment TEXT, signup_date TEXT)</code></div>
          <div><code>orders (id INTEGER, customer_id INTEGER, order_date TEXT, amount REAL, status TEXT)</code></div>
        </div>
      </div>

      {/* SQL Editor Area */}
      <div className="editor-card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label htmlFor="sql-query-input">
            <strong>SQL Query Editor</strong>
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="secondary"
              disabled={dbLoading}
              onClick={runLocalQuery}
              style={{ fontSize: "13px", padding: "6px 14px" }}
            >
              ▶ Run Query in WASM SQLite {localTimeMs !== null ? `(${localTimeMs}ms)` : ""}
            </button>
          </div>
        </div>

        <textarea
          id="sql-query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={10}
          style={{
            width: "100%",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "13px",
            lineHeight: "1.5",
            padding: "12px",
            background: "var(--bg-input, #0d1117)",
            color: "var(--text-main, #c9d1d9)",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
          }}
        />

        {localError && (
          <div className="notice error" style={{ marginTop: "10px" }}>
            <span>SQLite Error: {localError}</span>
          </div>
        )}

        {/* Live Result Table */}
        {localColumns.length > 0 && (
          <div style={{ marginTop: "14px", overflowX: "auto" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "var(--text-dim)" }}>
              WASM QUERY RESULTS ({localRows.length} ROWS)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", borderBottom: "2px solid var(--border-color)" }}>
                  {localColumns.map((col) => (
                    <th key={col} style={{ padding: "8px 12px" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {localColumns.map((col) => (
                      <td key={col} style={{ padding: "8px 12px", fontFamily: "var(--font-mono, monospace)" }}>
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insight Write-Up Memo */}
      <div className="memo-section" style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Executive Insight Memo</h3>
        <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "14px" }}>
          Answer the VP of Sales with quantitative findings, operational trade-offs, and critical data limitations.
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
          {submitting ? "Evaluating in WASM & Scoring Memo…" : "Submit Work Sample for Proof of Skill →"}
        </button>
      </div>

      {/* Assessment Evaluation Feedback */}
      {evalResult && (
        <div className="panel result-panel" style={{ marginTop: "24px", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span className="badge-pill">ASSESSMENT RESULTS</span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: evalResult.deterministicPassed ? "var(--color-success, #3fb950)" : "var(--color-danger, #f85149)" }}>
              {evalResult.deterministicPassed ? "✓ Deterministic Checks Passed" : "⚠ Checks Need Revision"}
            </span>
          </div>

          <p style={{ fontSize: "14px", marginBottom: "16px" }}>{evalResult.feedback}</p>

          <div style={{ marginBottom: "16px" }}>
            <strong style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--text-dim)", display: "block", marginBottom: "8px" }}>
              Deterministic Result Checks
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
                This work sample has been recorded to your private portfolio under <code>data-analytics</code>. You can manage recruiter consent from your evidence profile.
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
