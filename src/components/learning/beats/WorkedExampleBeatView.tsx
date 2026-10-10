"use client";

import React from "react";
import { WorkedExampleContent } from "@/lib/learning-experience-types";
import { Calculator, CheckCircle2, AlertTriangle, ArrowRight, Table } from "lucide-react";

type WorkedExampleBeatViewProps = {
  content: WorkedExampleContent;
};

export default function WorkedExampleBeatView({ content }: WorkedExampleBeatViewProps) {
  return (
    <div className="example-beat-layout">
      <div className="example-hero-badge">
        <Calculator size={16} />
        <span>WORKED EXAMPLE · STEP-BY-STEP REASONING</span>
      </div>

      <div className="example-header">
        <h2 className="example-title">{content.title}</h2>
        <div className="example-problem-card">
          <span className="problem-label">REALISTIC SCENARIO:</span>
          <strong>{content.problem}</strong>
          <p>{content.context}</p>
        </div>
      </div>

      {/* Step-by-Step Reasoning Flow */}
      <div className="example-steps-stack">
        <span className="section-label">HOW AN EXPERT ANALYZES THIS:</span>
        {content.steps.map((step) => (
          <div className="example-step-card" key={step.stepNumber}>
            <div className="step-num-pill">Step {step.stepNumber}</div>
            <div className="step-content-body">
              <h3>{step.title}</h3>
              <p>{step.explanation}</p>
              {step.calculationOrCode && (
                <div className="calculation-box">
                  <code>{step.calculationOrCode}</code>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Data / Business Comparison Table (If Available) */}
      {content.comparisonTable && (
        <div className="example-table-panel">
          <div className="table-header-kicker">
            <Table size={14} />
            <span>Structured Analytical Comparison:</span>
          </div>
          <div className="responsive-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  {content.comparisonTable.headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.comparisonTable.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Communication Weak vs. Improved Side-by-Side Diff (If Available) */}
      {content.communicationDiff && (
        <div className="communication-diff-panel">
          <div className="diff-header-kicker">
            <span>Side-by-Side Message Calibration:</span>
          </div>
          <div className="diff-columns-grid">
            {/* Weak / Chronological Version */}
            <div className="diff-column weak-column">
              <div className="column-title-bar">
                <AlertTriangle size={14} />
                <span>Weak: Chronological / Cognitive Load</span>
              </div>
              <div className="message-box">{content.communicationDiff.weak}</div>
            </div>

            {/* Improved / Executive Summary Version */}
            <div className="diff-column improved-column">
              <div className="column-title-bar">
                <CheckCircle2 size={14} />
                <span>Improved: Bottom Line Up Front (BLUF)</span>
              </div>
              <div className="message-box">{content.communicationDiff.improved}</div>
            </div>
          </div>

          {/* Annotations List */}
          <div className="diff-annotations-tray">
            <strong>Key Revisions Made:</strong>
            <ul>
              {content.communicationDiff.annotations.map((ann, aIdx) => (
                <li key={aIdx}>
                  <ArrowRight size={12} />
                  <span>{ann}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
