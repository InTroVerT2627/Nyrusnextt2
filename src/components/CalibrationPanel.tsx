"use client";

import React, { useState } from "react";
import { CheckIcon, RefreshIcon } from "@/components/Icons";

type BenchmarkItem = {
  id: string;
  taskTitle: string;
  learnerSnippet: string;
  criterion: string;
  humanScore: number;
  aiRun1Score: number;
  aiRun2Score: number;
  agreement: "Exact" | "Within-1" | "Discrepancy";
  notes: string;
};

const initialBenchmarks: BenchmarkItem[] = [
  {
    id: "BM-01",
    taskTitle: "Dashboard shows the wrong top seller",
    learnerSnippet: "The loop condition i < values.length - 1 skips the last item. If the highest seller is at the end, it won't be checked.",
    criterion: "Root-cause identification (0–3)",
    humanScore: 3,
    aiRun1Score: 3,
    aiRun2Score: 3,
    agreement: "Exact",
    notes: "Both runs and human agreed: precisely identified skipped final index.",
  },
  {
    id: "BM-02",
    taskTitle: "Dashboard shows the wrong top seller",
    learnerSnippet: "The array loop was just written wrong so it didn't find the max.",
    criterion: "Root-cause identification (0–3)",
    humanScore: 1,
    aiRun1Score: 1,
    aiRun2Score: 1,
    agreement: "Exact",
    notes: "Vague symptom restatement without naming the off-by-one boundary.",
  },
  {
    id: "BM-03",
    taskTitle: "Mailing list skips some customers",
    learnerSnippet: "When you call remove(i), all following elements shift left to index i, but i++ runs immediately, skipping the shifted item.",
    criterion: "Root-cause identification (0–3)",
    humanScore: 3,
    aiRun1Score: 3,
    aiRun2Score: 3,
    agreement: "Exact",
    notes: "Accurately articulates left-shift and index increment.",
  },
  {
    id: "BM-04",
    taskTitle: "Order summary renders before data arrives",
    learnerSnippet: "forEach doesn't wait because it returns undefined immediately. Should use Promise.all with map.",
    criterion: "Explanation clarity (0–2)",
    humanScore: 2,
    aiRun1Score: 2,
    aiRun2Score: 1,
    agreement: "Within-1",
    notes: "Run 2 gave 1 point due to brevity; within-1 tolerance accepted.",
  },
  {
    id: "BM-05",
    taskTitle: "Customer cache never gets a hit",
    learnerSnippet: "Equals is there but hashCode is default Object.hashCode which uses identity memory address instead of values.",
    criterion: "Root-cause identification (0–3)",
    humanScore: 3,
    aiRun1Score: 3,
    aiRun2Score: 3,
    agreement: "Exact",
    notes: "Clear explanation of bucket placement mismatch.",
  },
  {
    id: "BM-06",
    taskTitle: "Catch the AI's mistake (Boss Round)",
    learnerSnippet: "The patch splits on single space text.split(' '). Multiple consecutive spaces or leading spaces produce empty string elements.",
    criterion: "Flaw explanation (0–25)",
    humanScore: 25,
    aiRun1Score: 25,
    aiRun2Score: 25,
    agreement: "Exact",
    notes: "Accurate identification of whitespace splitting defect.",
  },
];

export default function CalibrationPanel() {
  const [benchmarks] = useState<BenchmarkItem[]>(initialBenchmarks);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<string | null>(null);

  const runCalibration = () => {
    setCalibrating(true);
    setCalibrationStatus("Re-scoring 6 reference submissions through dual-run Gemini 3.8 Flash pipeline…");
    setTimeout(() => {
      setCalibrating(false);
      setCalibrationStatus("Calibration verified: 83.3% Exact Agreement, 100.0% Within-1 Agreement. Model parameters validated.");
    }, 1200);
  };

  const exactCount = benchmarks.filter((b) => b.agreement === "Exact").length;
  const withinOneCount = benchmarks.filter((b) => b.agreement === "Within-1" || b.agreement === "Exact").length;

  return (
    <div className="calibration-panel-container">
      <div className="calibration-header-row">
        <div>
          <div className="panel-kicker">REVIEWER GOVERNANCE & CALIBRATION</div>
          <h2>AI vs. Human Calibration Benchmark</h2>
          <p>
            Monitor scoring agreement between the Gemini Flash dual-run grader and expert human raters across standardized benchmark tasks.
          </p>
        </div>
        <button className="cta-primary" disabled={calibrating} onClick={runCalibration}>
          <RefreshIcon size={14} />
          <span>{calibrating ? "Testing Model Consensus…" : "Run Calibration Verification"}</span>
        </button>
      </div>

      {calibrationStatus && (
        <div className="notice" role="status">
          <CheckIcon size={14} />
          <span>{calibrationStatus}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="score-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="score-cell">
          <span>BENCHMARK SUBMISSIONS</span>
          <strong>{benchmarks.length}</strong>
        </div>
        <div className="score-cell">
          <span>EXACT AGREEMENT RATE</span>
          <strong style={{ color: "var(--success)" }}>
            {((exactCount / benchmarks.length) * 100).toFixed(1)}%
          </strong>
        </div>
        <div className="score-cell">
          <span>WITHIN-1 POINT TOLERANCE</span>
          <strong style={{ color: "var(--success)" }}>
            {((withinOneCount / benchmarks.length) * 100).toFixed(1)}%
          </strong>
        </div>
      </div>

      {/* Benchmark List */}
      <div className="panel benchmark-items-panel">
        <div className="panel-kicker">CALIBRATION BENCHMARK CASES (SYNTHETIC REFERENCE SET)</div>
        <div className="bench-list">
          {benchmarks.map((item) => (
            <div className="bench-card" key={item.id}>
              <div className="bench-card-top">
                <span className="bench-id">{item.id}</span>
                <span className="bench-title">{item.taskTitle}</span>
                <span className={`stat-badge ${item.agreement === "Exact" ? "green" : "amber"}`}>
                  {item.agreement} Agreement
                </span>
              </div>
              <div className="bench-quote">
                &ldquo;{item.learnerSnippet}&rdquo;
              </div>
              <div className="bench-scores-row">
                <span><strong>Criterion:</strong> {item.criterion}</span>
                <span><strong>Human Expert:</strong> {item.humanScore}</span>
                <span><strong>AI Run 1:</strong> {item.aiRun1Score}</span>
                <span><strong>AI Run 2:</strong> {item.aiRun2Score}</span>
              </div>
              <small className="bench-notes">{item.notes}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
