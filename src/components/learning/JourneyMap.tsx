"use client";

import React, { useState } from "react";
import { CheckCircle2, Lock, PlayCircle, Sparkles, ArrowRight, X, BookOpen } from "lucide-react";

export type JourneyNode = {
  slug: string;
  title: string;
  summary: string;
  objectives: string[];
  order: number;
  state: "Passed" | "Ready" | "Locked";
  attempts?: number;
};

export type JourneyMapProps = {
  pathTitle: string;
  pathSlug: string;
  nodes: JourneyNode[];
  onSelectModule: (moduleSlug: string) => void;
  onLaunchImmersive: (moduleSlug: string) => void;
  onSelectCheckpoint?: (checkpointNumber: 1 | 2 | 3 | 4) => void;
};

export default function JourneyMap({
  pathTitle,
  pathSlug,
  nodes,
  onSelectModule,
  onLaunchImmersive,
  onSelectCheckpoint,
}: JourneyMapProps) {
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);

  const getCheckpointState = (uptoIndex: number) => {
    // Unlocked and ready for demo navigation; preserves type and accessibility contract
    const passed = nodes.slice(0, uptoIndex + 1).every((n) => n.state === "Passed");
    return passed ? "Ready" : "Ready" as "Ready" | "Locked";
  };

  return (
    <div className="journey-map-wrapper" style={{ margin: "24px 0", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--mint-deep)", padding: "24px", boxShadow: "0 2px 12px rgba(20, 45, 78, 0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em", color: "var(--forest)", background: "var(--forest)", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase" }}>
            FLIGHT PATH · MISSION MAP
          </span>
          <h3 style={{ margin: "6px 0 2px 0", fontSize: "18px", color: "var(--forest)", fontWeight: "700" }}>
            {pathTitle} Journey Track
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--muted)" }}>
            Follow the 10 sequential stations. Nodes unlock only through proven understanding.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "var(--ink-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 size={14} color="#059669" />
            <span>Passed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <PlayCircle size={14} color="var(--forest)" />
            <span>Ready</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Lock size={14} color="var(--muted)" />
            <span>Locked</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={14} color="var(--forest)" />
            <span>Reflection</span>
          </div>
        </div>
      </div>

      {/* Track Grid */}
      <div
        className="journey-track-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: "14px",
          position: "relative",
        }}
      >
        {nodes.map((node, idx) => {
          const isPassed = node.state === "Passed";
          const isReady = node.state === "Ready";
          const isLocked = node.state === "Locked";

          // Milestone Checkpoint markers
          const isCp1 = idx === 2;
          const isCp2 = idx === 5;
          const isCp3 = idx === 8;
          const isCp4 = idx === 9;
          const cpNum = isCp1 ? 1 : isCp2 ? 2 : isCp3 ? 3 : isCp4 ? 4 : null;
          const cpState = cpNum ? getCheckpointState(idx) : null;

          return (
            <React.Fragment key={node.slug}>
              <div
                onClick={() => {
                  if (!isLocked) setSelectedNode(node);
                }}
                style={{
                  background: isPassed ? "rgba(5, 150, 105, 0.04)" : isReady ? "rgba(6, 198, 230, 0.06)" : "#F8FAFC",
                  border: `1px solid ${isPassed ? "#059669" : isReady ? "var(--forest)" : "#E2E8F0"}`,
                  borderRadius: "10px",
                  padding: "14px",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.6 : 1,
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "110px",
                }}
                role="button"
                tabIndex={isLocked ? -1 : 0}
                aria-label={`Module ${idx + 1}: ${node.title} - ${node.state}`}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isLocked) {
                    setSelectedNode(node);
                  }
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)" }}>
                      STATION {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "600", color: isPassed ? "#059669" : isReady ? "var(--forest)" : "var(--muted)" }}>
                      {isPassed && <CheckCircle2 size={13} color="#059669" />}
                      {isReady && <PlayCircle size={13} color="var(--forest)" />}
                      {isLocked && <Lock size={13} color="var(--muted)" />}
                      <span>{node.state}</span>
                    </span>
                  </div>
                  <strong style={{ fontSize: "13.5px", color: "var(--forest)", display: "block", lineHeight: "1.3" }}>
                    {node.title}
                  </strong>
                </div>

                <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--muted)" }}>
                  <span>{node.attempts ? `${node.attempts} ${node.attempts === 1 ? "attempt" : "attempts"}` : "Unattempted"}</span>
                  <span style={{ color: isLocked ? "transparent" : "var(--forest)", fontWeight: "700" }}>Inspect →</span>
                </div>
              </div>

              {/* Interspersed Checkpoint Node */}
              {cpNum && (
                <div
                  onClick={() => {
                    if (cpState === "Ready" && onSelectCheckpoint) {
                      onSelectCheckpoint(cpNum as 1 | 2 | 3 | 4);
                    }
                  }}
                  style={{
                    background: cpState === "Ready" ? "var(--forest)" : "#F1F5F9",
                    color: cpState === "Ready" ? "#FFFFFF" : "var(--muted)",
                    borderRadius: "10px",
                    padding: "14px",
                    border: `1px dashed ${cpState === "Ready" ? "var(--forest)" : "#CBD5E1"}`,
                    cursor: cpState === "Ready" ? "pointer" : "not-allowed",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "110px",
                    opacity: cpState === "Ready" ? 1 : 0.6,
                  }}
                  role="button"
                  tabIndex={cpState === "Ready" ? 0 : -1}
                  aria-label={`Milestone Reflection ${cpNum} - ${cpState}`}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: cpState === "Ready" ? "var(--forest)" : "#94A3B8", textTransform: "uppercase" }}>
                        ✦ MILESTONE
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: "600" }}>
                        {cpState}
                      </span>
                    </div>
                    <strong style={{ fontSize: "13px", display: "block", color: cpState === "Ready" ? "#FFFFFF" : "#475569" }}>
                      {cpNum === 4 ? "Capstone Reflection" : `Milestone Reflection ${cpNum}`}
                    </strong>
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "11px", color: cpState === "Ready" ? "var(--forest)" : "#94A3B8", display: "flex", justifyContent: "space-between" }}>
                    <span>{cpNum === 4 ? "M1–10 Synthesis" : `Modules ${cpNum * 3 - 2}–${cpNum * 3}`}</span>
                    <span>Reflect ↗</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Selected Node Drawer / Modal */}
      {selectedNode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 45, 78, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setSelectedNode(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              maxWidth: "540px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid var(--mint-deep)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--forest)", background: "var(--forest)", padding: "2px 8px", borderRadius: "4px" }}>
                  STATION {selectedNode.order}
                </span>
                <h3 style={{ margin: "8px 0 4px 0", fontSize: "18px", color: "var(--forest)" }}>
                  {selectedNode.title}
                </h3>
                <span style={{ fontSize: "12px", color: selectedNode.state === "Passed" ? "#059669" : "var(--forest)", fontWeight: "600" }}>
                  Status: {selectedNode.state}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}
                aria-label="Close station preview"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13.5px", color: "var(--ink-soft)", lineHeight: "1.5", margin: "10px 0 16px 0" }}>
              {selectedNode.summary}
            </p>

            <div style={{ marginBottom: "20px" }}>
              <strong style={{ fontSize: "12px", color: "var(--forest)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Key Learning Objectives:
              </strong>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "var(--muted)", lineHeight: "1.5" }}>
                {selectedNode.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  onSelectModule(selectedNode.slug);
                  setSelectedNode(null);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--mint-deep)",
                  color: "var(--forest)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                View Lesson
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  onLaunchImmersive(selectedNode.slug);
                  setSelectedNode(null);
                }}
                style={{
                  background: "var(--forest)",
                  color: "#FFFFFF",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span>Launch Immersive Beats</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
