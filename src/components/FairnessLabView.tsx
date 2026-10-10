"use client";

import React, { useEffect, useState } from "react";
import {
  Scale,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Eye,
  Languages,
  BookOpen,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Sparkles,
  Info,
} from "lucide-react";
import type {
  FairnessLabSummary,
  BenchmarkMatrixRow,
  VariantRunResult,
} from "@/lib/server/fairness-engine";

export default function FairnessLabView() {
  const [data, setData] = useState<FairnessLabSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>("all");
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [executingRun, setExecutingRun] = useState<boolean>(false);
  const [inspectingVariant, setInspectingVariant] = useState<VariantRunResult | null>(null);
  const [activeTab, setActiveTab] = useState<"matrix" | "summary" | "changelog">("matrix");

  const loadData = async (forceLive = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fairness", {
        headers: {
          "x-demo-role": localStorage.getItem("nextlearn.demo_role") || "reviewer",
        },
      });
      if (!res.ok) throw new Error(`Could not load fairness evaluation (${res.status})`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Fairness Lab.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleStartRun = async () => {
    setExecutingRun(true);
    try {
      const res = await fetch("/api/fairness/run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-demo-role": localStorage.getItem("nextlearn.demo_role") || "reviewer",
        },
        body: JSON.stringify({
          forceLiveRefresh: true,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Run batch failed (${res.status})`);
      }
      const updated = await res.json();
      setData(updated);
      setConfirmModalOpen(false);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not complete live evaluation run.");
    } finally {
      setExecutingRun(false);
    }
  };

  const handleDownloadReport = () => {
    window.open("/api/fairness/export", "_blank");
  };

  if (loading) {
    return (
      <div className="fairness-container loading-state">
        <div className="skeleton-bar" style={{ width: "40%", height: "24px" }} />
        <div className="skeleton-bar" style={{ width: "70%", height: "16px", marginTop: "8px" }} />
        <div className="skeleton-box" style={{ height: "350px", marginTop: "24px" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fairness-container error-state">
        <div className="notice error">
          <span>{error || "Could not load fairness benchmark data."}</span>
          <button onClick={() => void loadData()}>Retry</button>
        </div>
      </div>
    );
  }

  const filteredRows = selectedPath === "all"
    ? data.matrixRows
    : data.matrixRows.filter((r) => r.pathSlug === selectedPath);

  const variantKeys = [
    { key: "baseline_plain", label: "Baseline English" },
    { key: "polished", label: "Polished English" },
    { key: "short_informal", label: "Short / Informal" },
    { key: "hinglish", label: "Hinglish (Mix)" },
    { key: "hindi_devanagari", label: "Hindi (देवनागरी)" },
    { key: "telugu_script", label: "Telugu (తెలుగు)" },
    { key: "typo_heavy", label: "Typo-Heavy" },
  ];

  return (
    <div className="fairness-container">
      {/* Intro Header */}
      <div className="fairness-header">
        <div className="eyebrow">QUALITY, RELIABILITY & ROBUSTNESS · REVIEWER LAB</div>
        <div className="header-actions-row">
          <div>
            <h1>Fairness Lab: Language & Phrasing Consistency</h1>
            <p className="fairness-subtitle">
              Measures evaluator consistency when identical technical content is expressed in different languages, scripts, and phrasing styles.
            </p>
          </div>
          <div className="header-btns">
            <button
              type="button"
              className="primary run-eval-btn"
              onClick={() => setConfirmModalOpen(true)}
            >
              <RefreshCw size={14} className={executingRun ? "spin" : ""} />
              <span>Run Benchmark Batch</span>
            </button>
            <button
              type="button"
              className="secondary export-btn"
              onClick={handleDownloadReport}
              title="Export Markdown report"
            >
              <Download size={14} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Mandatory Disclaimer Box */}
        <aside className="fairness-disclaimer-box" aria-label="Methodological limits">
          <Info size={16} />
          <div>
            <strong>Important Methodological Limitation:</strong> Small synthetic sample (n={data.totalBenchmarks} benchmarks, n={data.totalVariants} variants). Indicative only. Not a validated hiring predictor or exhaustive bias audit. Reports empirical spread on specified phrasing variants.
          </div>
        </aside>
      </div>

      {/* Tabs Bar */}
      <div className="fairness-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "matrix"}
          className={`tab-btn ${activeTab === "matrix" ? "active" : ""}`}
          onClick={() => setActiveTab("matrix")}
        >
          <Layers size={14} />
          <span>Consistency Matrix ({filteredRows.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "summary"}
          className={`tab-btn ${activeTab === "summary" ? "active" : ""}`}
          onClick={() => setActiveTab("summary")}
        >
          <Scale size={14} />
          <span>Variant Group Summaries</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "changelog"}
          className={`tab-btn ${activeTab === "changelog" ? "active" : ""}`}
          onClick={() => setActiveTab("changelog")}
        >
          <FileText size={14} />
          <span>Change Log & Prompt Versioning</span>
        </button>
      </div>

      {/* TAB 1: Consistency Matrix */}
      {activeTab === "matrix" && (
        <section className="fairness-matrix-section">
          {/* Filter Bar */}
          <div className="matrix-filter-bar">
            <div className="filter-group">
              <Filter size={14} />
              <span className="filter-label">Filter Learning Path:</span>
              <button
                type="button"
                className={`filter-chip ${selectedPath === "all" ? "active" : ""}`}
                onClick={() => setSelectedPath("all")}
              >
                All Paths ({data.matrixRows.length})
              </button>
              <button
                type="button"
                className={`filter-chip ${selectedPath === "data-analytics" ? "active" : ""}`}
                onClick={() => setSelectedPath("data-analytics")}
              >
                Data Analytics (4)
              </button>
              <button
                type="button"
                className={`filter-chip ${selectedPath === "business-analytics" ? "active" : ""}`}
                onClick={() => setSelectedPath("business-analytics")}
              >
                Business Analytics (4)
              </button>
              <button
                type="button"
                className={`filter-chip ${selectedPath === "communication" ? "active" : ""}`}
                onClick={() => setSelectedPath("communication")}
              >
                Communication (4)
              </button>
            </div>

            <div className="threshold-legend">
              <span className="legend-item">
                <span className="spread-indicator within" /> Spread ≤ 1 pt (Within Threshold)
              </span>
              <span className="legend-item">
                <span className="spread-indicator exceeded" /> Spread &gt; 1 pt (Variance Alert)
              </span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="matrix-table-wrapper" role="region" aria-label="Fairness benchmark matrix">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="col-bm">Benchmark Case & Human Ref</th>
                  {variantKeys.map((vk) => (
                    <th key={vk.key} className="col-variant">
                      {vk.label}
                    </th>
                  ))}
                  <th className="col-spread">Max Spread</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.benchmarkId}
                    className={row.exceedsSpreadThreshold ? "spread-exceeded-row" : ""}
                  >
                    {/* Benchmark Title */}
                    <td className="cell-bm-info">
                      <strong>{row.taskTitle}</strong>
                      <div className="bm-meta">
                        <span>Criterion: {row.criterion}</span>
                        <span className="human-ref-tag">
                          Human Refs: R1={row.humanRef1}, R2={row.humanRef2}
                        </span>
                      </div>
                    </td>

                    {/* Variant Cells */}
                    {variantKeys.map((vk) => {
                      const vRun = row.variants[vk.key];
                      if (!vRun) return <td key={vk.key} className="cell-variant-empty">-</td>;

                      const delta = vRun.scoreDeltaFromBaseline;
                      const hasDelta = delta !== 0 && vk.key !== "baseline_plain";

                      return (
                        <td key={vk.key} className="cell-variant-score">
                          <button
                            type="button"
                            className={`variant-cell-btn ${hasDelta ? (delta > 0 ? "delta-pos" : "delta-neg") : ""}`}
                            onClick={() => setInspectingVariant(vRun)}
                            title="Click to view full answer text and verification status"
                          >
                            <span className="score-number">{vRun.finalScore}</span>
                            {vk.key !== "baseline_plain" && (
                              <span className={`delta-tag ${delta > 0 ? "pos" : delta < 0 ? "neg" : "zero"}`}>
                                {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "±0"}
                              </span>
                            )}
                            {vRun.flags.length > 0 && (
                              <AlertTriangle size={12} className="cell-flag-icon" />
                            )}
                          </button>
                        </td>
                      );
                    })}

                    {/* Spread Column */}
                    <td className="cell-spread-val">
                      <div className={`spread-pill ${row.exceedsSpreadThreshold ? "exceeded" : "within"}`}>
                        {row.exceedsSpreadThreshold ? (
                          <AlertTriangle size={12} />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        <strong>Δ {row.maxSpread}</strong>
                      </div>
                      <small>
                        {row.exceedsSpreadThreshold ? "Spread > 1" : "Within threshold"}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: Variant Group Summaries & Human Agreement */}
      {activeTab === "summary" && (
        <section className="fairness-summary-section">
          <div className="summary-cards-grid">
            {data.variantSummaries.map((vs) => (
              <article key={vs.variantType} className="variant-summary-card">
                <div className="card-top">
                  <h3>{vs.displayName}</h3>
                  <span className="sample-size-chip">n = {vs.sampleSize}</span>
                </div>
                <div className="summary-stat-row">
                  <div className="stat-box">
                    <span className="stat-label">Average Delta:</span>
                    <strong className="stat-val">
                      {vs.averageDelta >= 0 ? `+${vs.averageDelta}` : vs.averageDelta} pts
                    </strong>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Max Spread:</span>
                    <strong className="stat-val">{vs.maxAbsoluteDelta} pt</strong>
                  </div>
                </div>
                <div className={`wording-badge ${vs.spreadWithinThreshold ? "within" : "warning"}`}>
                  {vs.spreadWithinThreshold ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{vs.wording}</span>
                </div>
              </article>
            ))}
          </div>

          {/* Human Agreement Calibration Box */}
          <div className="human-agreement-box">
            <div className="calib-header">
              <Shield size={18} />
              <div>
                <h3>Human Agreement & Evaluator Calibration</h3>
                <p>Comparison between AI evaluator output and independent dual human assessor baselines.</p>
              </div>
            </div>

            <div className="calib-stats-grid">
              <div className="calib-cell">
                <span className="calib-label">Exact Agreement (AI vs Dual Humans)</span>
                <strong className="calib-value">{data.humanAgreement.exactAgreementPercent}%</strong>
                <small>Score delta = 0 across evaluated benchmark cases</small>
              </div>
              <div className="calib-cell">
                <span className="calib-label">Within-1 Point Agreement</span>
                <strong className="calib-value">{data.humanAgreement.withinOneAgreementPercent}%</strong>
                <small>Standard certification tolerance (delta ≤ 1 pt)</small>
              </div>
              <div className="calib-cell">
                <span className="calib-label">Language Neutrality Assurance</span>
                <strong className="calib-value">Deterministic Code Checks</strong>
                <small>Unit tests and SQL execution do not depend on language</small>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: Change Log & Prompt Versioning */}
      {activeTab === "changelog" && (
        <section className="fairness-changelog-section">
          <div className="panel-kicker">WHAT WE CHANGED · AUDITABLE PROMPT LOG</div>
          <h2>Prompt Iteration & Consistency History</h2>
          <div className="changelog-list">
            <article className="changelog-entry">
              <div className="entry-header">
                <strong>Version: {data.promptVersion} (Current Production)</strong>
                <span>Active Model: {data.modelName}</span>
              </div>
              <p>
                Updated system instructions to explicitly mandate content-only scoring in original input scripts (English, Hindi, Telugu, Hinglish). Forbade revealing answer keys in reason text and prohibited penalizing grammar or non-native phrasing.
              </p>
              <div className="entry-metrics">
                <span>Resulting within-1 agreement: <strong>100%</strong></span> · 
                <span>Max variant spread: <strong>≤ 1 point</strong></span>
              </div>
            </article>

            <article className="changelog-entry historical">
              <div className="entry-header">
                <strong>Version: nextlearn-grading-v0 (Initial Legacy Prototype)</strong>
                <span>Model: baseline-flash</span>
              </div>
              <p>
                Early unconstrained prompt. Occasionally penalized informal Hinglish phrasing due to lack of explicit multilingual dialect neutrality instructions.
              </p>
              <div className="entry-metrics">
                <span>Mitigation: Introduced strict multilingual neutrality instruction in v1.</span>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* Variant Inspection Modal */}
      {inspectingVariant && (
        <div className="overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setInspectingVariant(null); }}>
          <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="variant-detail-title">
            <button className="dialog-close" onClick={() => setInspectingVariant(null)} aria-label="Close">×</button>
            <div className="eyebrow">VARIANT TEXT INSPECTION · {inspectingVariant.variantType.toUpperCase()}</div>
            <h2 id="variant-detail-title">Benchmark {inspectingVariant.benchmarkId}</h2>

            <div className="variant-detail-scores">
              <div>
                <span>Run 1:</span> <strong>{inspectingVariant.run1Score} pts</strong>
              </div>
              <div>
                <span>Run 2:</span> <strong>{inspectingVariant.run2Score} pts</strong>
              </div>
              <div>
                <span>Final Score:</span> <strong>{inspectingVariant.finalScore} pts</strong>
              </div>
              <div>
                <span>Delta from Baseline:</span> <strong>{inspectingVariant.scoreDeltaFromBaseline >= 0 ? `+${inspectingVariant.scoreDeltaFromBaseline}` : inspectingVariant.scoreDeltaFromBaseline}</strong>
              </div>
            </div>

            <div className="variant-snippet-box">
              <span className="snippet-kicker">EXACT SUBMITTED PHRASING ({inspectingVariant.languageCode}):</span>
              <p className="variant-snippet-text">{inspectingVariant.variantText}</p>
            </div>

            <div className="verification-status-row">
              <strong>Translation Status:</strong>
              <span className={`status-pill ${inspectingVariant.status}`}>
                {inspectingVariant.status === "verified" ? "Verified by fluent human assessor" : "Unverified translation, results indicative only"}
              </span>
            </div>

            <button className="secondary" onClick={() => setInspectingVariant(null)} style={{ marginTop: "16px" }}>
              Close
            </button>
          </section>
        </div>
      )}

      {/* Confirmation Modal Before Live Execution Run */}
      {confirmModalOpen && (
        <div className="overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmModalOpen(false); }}>
          <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-run-title">
            <button className="dialog-close" onClick={() => setConfirmModalOpen(false)} aria-label="Close">×</button>
            <div className="eyebrow">LIVE EVALUATION RUN CONFIRMATION</div>
            <h2 id="confirm-run-title">Confirm Benchmark Scoring Batch</h2>
            <p>
              Running this evaluation batch will execute production dual-run Gemini scoring across up to 4 benchmark cases (28 variant evaluations, 56 total model calls).
            </p>

            <div className="run-cap-warning">
              <Shield size={16} />
              <span>
                <strong>Rate Cap:</strong> Enforced at maximum 5 batch executions per hour. Caching is automatically applied for previously evaluated variant hashes.
              </span>
            </div>

            <div className="dialog-actions" style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button
                type="button"
                className="primary"
                disabled={executingRun}
                onClick={handleStartRun}
              >
                {executingRun ? "Executing Live Scoring…" : "Confirm & Run Batch"}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={executingRun}
                onClick={() => setConfirmModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
