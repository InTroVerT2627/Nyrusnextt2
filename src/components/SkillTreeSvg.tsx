"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Lock,
  Play,
  CheckCircle2,
  AlertTriangle,
  History,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ArrowRight,
  Shield,
  FileCheck2,
} from "lucide-react";

export type NodeState =
  | "Locked"
  | "Available"
  | "Attempted"
  | "Fix works · reasoning needed"
  | "Evidenced"
  | "Evidenced (>90d)";

interface Mission {
  id: string;
  slug: string;
  language: string;
  difficulty: string;
  skill_node_id: number;
  mission_json: {
    title: string;
    short_title: string;
    severity: string;
    description: string;
    symptom: string;
    plain_task: string;
  };
  version: {
    id: string;
    version: number;
    prompt: string;
    starterCode: string;
    reportHeadings: string[];
  };
  visibleTests: { title: string; input: unknown; expected: unknown }[];
  rubric: {
    version: number;
    criteria: {
      criteria: { id: string; title: string; weight: number; max: number; source: string }[];
    };
  };
}

interface Attempt {
  id: string;
  task_version_id: string | null;
  rubric_id: string | null;
  boss_round_id: string | null;
  attempt_type: "mission" | "boss";
  code: string;
  explanation_json: {
    report?: Record<string, string>;
    selected_question_ids?: string[];
    gap_tags?: string[];
    test_summary?: Record<string, number | boolean>;
    decision?: string;
    flagged_lines?: number[];
  };
  ai_disclosure: boolean;
  submitted_at: string;
}

interface Evidence {
  id: string;
  attempt_id: string;
  skill: string;
  language: string;
  level: string;
  confidence: string;
  assessed_at: string;
}

interface SkillTreeSvgProps {
  missions: Mission[];
  evidence: Set<string>;
  attempts: Attempt[];
  evidenceByAttempt: Map<string, Evidence>;
  boss: Record<string, unknown> | null;
  onStart: (mission: Mission) => void;
  onBoss: () => void;
}

interface NodePosition {
  id: string;
  mission?: Mission;
  isBoss?: boolean;
  x: number;
  y: number;
  number: string;
  title: string;
  subtitle: string;
  prereq: string;
}

export default function SkillTreeSvg({
  missions,
  evidence,
  attempts,
  evidenceByAttempt,
  boss,
  onStart,
  onBoss,
}: SkillTreeSvgProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node-1");
  const svgRef = useRef<SVGSVGElement>(null);

  const completedSlugs = useMemo(() => {
    return new Set(
      missions
        .filter((mission) =>
          attempts.some(
            (attempt) =>
              attempt.task_version_id === mission.version.id &&
              evidence.has(attempt.id)
          )
        )
        .map((m) => m.slug)
    );
  }, [missions, attempts, evidence]);

  const getNodeState = (mission: Mission): NodeState => {
    const priorAttempts = attempts.filter(
      (item) => item.task_version_id === mission.version.id
    );
    const evidencedAttempt = priorAttempts.find((item) => evidence.has(item.id));

    if (evidencedAttempt) {
      const assessedDate = new Date(
        evidenceByAttempt.get(evidencedAttempt.id)?.assessed_at ||
          evidencedAttempt.submitted_at
      );
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      if (assessedDate < ninetyDaysAgo) {
        return "Evidenced (>90d)";
      }
      return "Evidenced";
    }

    if (priorAttempts.length > 0) {
      const latest = priorAttempts[0];
      const testsPassed = latest.explanation_json?.test_summary?.valid === true;
      if (testsPassed) {
        return "Fix works · reasoning needed";
      }
      return "Attempted";
    }

    // Progression rules
    const isUnlocked =
      mission.slug === "find-max" ||
      ((mission.slug === "remove-duplicates" ||
        mission.slug === "async-results") &&
        completedSlugs.has("find-max")) ||
      (mission.slug === "customer-key" &&
        completedSlugs.has("remove-duplicates") &&
        completedSlugs.has("async-results"));

    return isUnlocked ? "Available" : "Locked";
  };

  // Node graph layout positions
  const nodePositions: NodePosition[] = useMemo(() => {
    const m1 = missions.find((m) => m.skill_node_id === 1);
    const m2 = missions.find((m) => m.skill_node_id === 2);
    const m3 = missions.find((m) => m.skill_node_id === 3);
    const m4 = missions.find((m) => m.skill_node_id === 4);

    return [
      {
        id: "node-1",
        mission: m1,
        x: 140,
        y: 220,
        number: "01",
        title: m1?.mission_json.short_title || "Off-By-One Bounds",
        subtitle: "Loop limits & index offsets",
        prereq: "None · Gateway entry node",
      },
      {
        id: "node-2",
        mission: m2,
        x: 360,
        y: 120,
        number: "02",
        title: m2?.mission_json.short_title || "State Mutation",
        subtitle: "Shared memory & mutation side-effects",
        prereq: "Requires Node 01 (Bounds) evidence",
      },
      {
        id: "node-3",
        mission: m3,
        x: 360,
        y: 320,
        number: "03",
        title: m3?.mission_json.short_title || "Async Race Flow",
        subtitle: "Promises & concurrency interleaving",
        prereq: "Requires Node 01 (Bounds) evidence",
      },
      {
        id: "node-4",
        mission: m4,
        x: 580,
        y: 220,
        number: "04",
        title: m4?.mission_json.short_title || "Hashing Collision",
        subtitle: "Lookup key distribution & contracts",
        prereq: "Requires Node 02 & Node 03 evidence",
      },
      {
        id: "boss-node",
        isBoss: true,
        x: 800,
        y: 220,
        number: "✦",
        title: "Catch the AI's Mistake",
        subtitle: "Adversarial patch evaluation & test harness",
        prereq: "Requires evidence on 3 of 4 core nodes",
      },
    ];
  }, [missions]);

  // Selected node details
  const selectedNode = nodePositions.find((n) => n.id === selectedNodeId) || nodePositions[0];
  const selectedState: NodeState = selectedNode.isBoss
    ? boss?.unlocked
      ? "Available"
      : "Locked"
    : selectedNode.mission
    ? getNodeState(selectedNode.mission)
    : "Locked";

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.6));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.75));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const renderStateIcon = (state: NodeState) => {
    switch (state) {
      case "Locked":
        return <Lock size={14} strokeWidth={2} />;
      case "Available":
        return <Play size={14} strokeWidth={2} />;
      case "Attempted":
        return <RotateCw size={14} strokeWidth={2} />;
      case "Fix works · reasoning needed":
        return <AlertTriangle size={14} strokeWidth={2} />;
      case "Evidenced":
        return <CheckCircle2 size={14} strokeWidth={2} />;
      case "Evidenced (>90d)":
        return <History size={14} strokeWidth={2} />;
    }
  };

  return (
    <div className="skill-tree-wrapper">
      <div className="page-intro">
        <div className="eyebrow">GRAPH PROGRESSION FROM DEMONSTRATED UNDERSTANDING</div>
        <h1>Your Bug-Type Skill Tree</h1>
        <p>
          Nodes change state strictly from deterministic tests, reasoning defense, sufficient confidence, and no open appeals.
          Every state is signaled with an icon plus a text label—never color alone.
        </p>
      </div>

      <div className="tree-interactive-container">
        {/* SVG Canvas Container */}
        <div
          className="tree-canvas-panel"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? "grabbing" : "grab" }}
        >
          {/* Zoom & Canvas Controls */}
          <div className="tree-canvas-controls">
            <button className="icon-btn-tree" onClick={zoomIn} aria-label="Zoom in" title="Zoom in">
              <ZoomIn size={16} />
            </button>
            <button className="icon-btn-tree" onClick={zoomOut} aria-label="Zoom out" title="Zoom out">
              <ZoomOut size={16} />
            </button>
            <button className="icon-btn-tree" onClick={resetZoom} aria-label="Reset pan and zoom" title="Reset view">
              <Maximize2 size={16} />
            </button>
            <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
          </div>

          <svg
            ref={svgRef}
            className="tree-svg-canvas"
            viewBox="0 0 960 440"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            {/* Defs for gradients & markers */}
            <defs>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D9E8F3" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06C6E6" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Connecting Edges */}
            {/* Node 1 -> Node 2 */}
            <path
              d="M 190 200 C 260 160, 290 140, 310 135"
              fill="none"
              stroke={completedSlugs.has("find-max") ? "#06C6E6" : "#D9E8F3"}
              strokeWidth="2.5"
              strokeDasharray={completedSlugs.has("find-max") ? "none" : "5,5"}
            />
            {/* Node 1 -> Node 3 */}
            <path
              d="M 190 240 C 260 280, 290 300, 310 305"
              fill="none"
              stroke={completedSlugs.has("find-max") ? "#06C6E6" : "#D9E8F3"}
              strokeWidth="2.5"
              strokeDasharray={completedSlugs.has("find-max") ? "none" : "5,5"}
            />
            {/* Node 2 -> Node 4 */}
            <path
              d="M 410 135 C 470 150, 500 180, 530 200"
              fill="none"
              stroke={completedSlugs.has("remove-duplicates") ? "#06C6E6" : "#D9E8F3"}
              strokeWidth="2.5"
              strokeDasharray={completedSlugs.has("remove-duplicates") ? "none" : "5,5"}
            />
            {/* Node 3 -> Node 4 */}
            <path
              d="M 410 305 C 470 290, 500 260, 530 240"
              fill="none"
              stroke={completedSlugs.has("async-results") ? "#06C6E6" : "#D9E8F3"}
              strokeWidth="2.5"
              strokeDasharray={completedSlugs.has("async-results") ? "none" : "5,5"}
            />
            {/* Node 4 -> Boss */}
            <path
              d="M 630 220 L 740 220"
              fill="none"
              stroke={boss?.unlocked ? "#06C6E6" : "#D9E8F3"}
              strokeWidth="2.5"
              strokeDasharray={boss?.unlocked ? "none" : "5,5"}
            />

            {/* Render Nodes */}
            {nodePositions.map((pos) => {
              const state: NodeState = pos.isBoss
                ? boss?.unlocked
                  ? "Available"
                  : "Locked"
                : pos.mission
                ? getNodeState(pos.mission)
                : "Locked";

              const isSelected = selectedNodeId === pos.id;
              const isEvidenced = state === "Evidenced" || state === "Evidenced (>90d)";

              return (
                <g
                  key={pos.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className={`tree-node-group ${state.toLowerCase().replace(/[^a-z0-9]/g, "-")} ${
                    isSelected ? "selected-node" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(pos.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedNodeId(pos.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${pos.title}, State: ${state}`}
                >
                  {/* Outer pulse ring for evidenced nodes (disabled under reduced motion) */}
                  {isEvidenced && (
                    <circle
                      r="42"
                      className="node-pulse-ring"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r="34"
                    className="node-bg-circle"
                    fill={pos.isBoss ? "#142D4E" : isEvidenced ? "#EAF6FC" : "#FFFFFF"}
                    stroke={
                      isSelected
                        ? "#06C6E6"
                        : isEvidenced
                        ? "#059669"
                        : pos.isBoss
                        ? "#D9E8F3"
                        : "#D9E8F3"
                    }
                    strokeWidth={isSelected ? "3.5" : "2"}
                  />

                  {/* Inner Identifier Text / Icon */}
                  <text
                    textAnchor="middle"
                    dy=".35em"
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="var(--font-mono)"
                    fill={pos.isBoss ? "#06C6E6" : isEvidenced ? "#059669" : "#142D4E"}
                  >
                    {pos.number}
                  </text>

                  {/* Node Label Card underneath */}
                  <g transform="translate(0, 48)">
                    {/* Badge Pill for State with icon + text label */}
                    <rect
                      x="-70"
                      y="0"
                      width="140"
                      height="20"
                      rx="10"
                      fill={
                        isEvidenced
                          ? "rgba(5, 150, 105, 0.1)"
                          : state === "Available"
                          ? "rgba(6, 198, 230, 0.12)"
                          : state === "Fix works · reasoning needed"
                          ? "rgba(217, 119, 6, 0.12)"
                          : "rgba(20, 45, 78, 0.06)"
                      }
                      stroke={
                        isEvidenced
                          ? "#059669"
                          : state === "Available"
                          ? "#06C6E6"
                          : state === "Fix works · reasoning needed"
                          ? "#D97706"
                          : "#D9E8F3"
                      }
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dy="14"
                      fontSize="9.5"
                      fontWeight="700"
                      fontFamily="var(--font-sans)"
                      fill={
                        isEvidenced
                          ? "#059669"
                          : state === "Available"
                          ? "#142D4E"
                          : state === "Fix works · reasoning needed"
                          ? "#D97706"
                          : "#64748B"
                      }
                    >
                      {state}
                    </text>

                    {/* Short Title */}
                    <text
                      textAnchor="middle"
                      dy="34"
                      fontSize="11"
                      fontWeight="700"
                      fill="#142D4E"
                    >
                      {pos.title}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side Node Inspection Card */}
        <aside className="tree-inspection-card" aria-label="Selected skill details">
          <div className="inspection-header">
            <span className="inspection-tag">
              {selectedNode.isBoss ? "BOSS ROUND" : `NODE ${selectedNode.number}`}
            </span>
            <div className={`inspection-state-pill state-${selectedState.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
              {renderStateIcon(selectedState)}
              <span>{selectedState}</span>
            </div>
          </div>

          <h2 className="inspection-title">{selectedNode.title}</h2>
          <p className="inspection-subtitle">{selectedNode.subtitle}</p>

          <div className="inspection-section">
            <h4>Prerequisites</h4>
            <p className="prereq-text">{selectedNode.prereq}</p>
          </div>

          {!selectedNode.isBoss && selectedNode.mission && (
            <>
              <div className="inspection-section">
                <h4>Visible Acceptance Checks</h4>
                <ul className="inspection-test-list">
                  {selectedNode.mission.visibleTests.map((t, idx) => (
                    <li key={idx}>
                      <code>{t.title}</code>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="inspection-section">
                <h4>Rubric Criteria Summary</h4>
                <div className="inspection-rubric-mini">
                  {selectedNode.mission.rubric.criteria.criteria.map((c) => (
                    <div key={c.id} className="rubric-mini-row">
                      <span>{c.title}</span>
                      <strong>{c.weight}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selectedNode.isBoss && (
            <div className="inspection-section">
              <h4>Boss Round Rules</h4>
              <p className="prereq-text">
                Review a pre-written AI patch. Locate the faulty line and author test assertions.
                Assertions must fail on the flawed patch and pass on two independent reference implementations.
              </p>
              <div className="inspection-rubric-mini">
                <div className="rubric-mini-row">
                  <span>Failing test validity (3 variants)</span>
                  <strong>40%</strong>
                </div>
                <div className="rubric-mini-row">
                  <span>Flaw located in source</span>
                  <strong>15%</strong>
                </div>
                <div className="rubric-mini-row">
                  <span>Reasoning explanation</span>
                  <strong>25%</strong>
                </div>
                <div className="rubric-mini-row">
                  <span>Follow-up reasoning</span>
                  <strong>20%</strong>
                </div>
              </div>
            </div>
          )}

          <div className="inspection-actions">
            {selectedNode.isBoss ? (
              <button
                className="primary btn-cyan full-width"
                disabled={!boss?.unlocked}
                onClick={onBoss}
              >
                <span>{boss?.unlocked ? "Start boss round" : "Locked · requires 3 nodes"}</span>
                <ArrowRight size={15} />
              </button>
            ) : selectedNode.mission ? (
              <button
                className="primary btn-cyan full-width"
                disabled={selectedState === "Locked"}
                onClick={() => onStart(selectedNode.mission!)}
              >
                <span>{selectedState === "Locked" ? "Locked by prerequisites" : "Start mission"}</span>
                <ArrowRight size={15} />
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="disclaimer">
        <Shield size={16} strokeWidth={2} />
        <p>
          Nodes light up upon demonstrating understanding. The boss round produces an independent AI-code review evidence card.
          No timer, no countdown, and no XP are awarded.
        </p>
      </div>
    </div>
  );
}
