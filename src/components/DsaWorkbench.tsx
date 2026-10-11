"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Play, Shield, ArrowRight, RotateCcw, Cpu, Zap, Activity } from "lucide-react";
import { VerificationCheck, AdaptiveFollowupQuestion, FollowupEvaluationResult } from "@/lib/work-samples-shared";

type DsaChallengeConfig = {
  id: string;
  title: string;
  workplaceStory: string;
  scalingStakes: string;
  naiveComplexity: string;
  targetComplexity: string;
  starterCode: string;
  optimizedCode: string;
  defaultFollowup: AdaptiveFollowupQuestion;
};

const DSA_CHALLENGES: DsaChallengeConfig[] = [
  {
    id: "fast-record-dedup",
    title: "Finding Duplicate Audit Events in Real-Time",
    workplaceStory:
      "EventPulse processes 40,000 audit events per second. The ingestion worker CPU spiked to 100% because an inner loop repeatedly calls array.includes() over historic records.",
    scalingStakes: "10,000 items: O(N²) takes ~50,000,000 ops vs O(N) taking 10,000 ops (45x faster).",
    naiveComplexity: "Time: O(N²) quadratic · Space: O(1)",
    targetComplexity: "Time: O(N) linear · Space: O(N) bounded",
    starterCode: `function deduplicateEvents(events) {
  // Naive O(N²) implementation using array scanning
  const unique = [];
  for (let i = 0; i < events.length; i++) {
    if (!unique.includes(events[i])) {
      unique.push(events[i]);
    }
  }
  return unique;
}`,
    optimizedCode: `function deduplicateEvents(events) {
  if (!Array.isArray(events)) return [];
  const seen = new Set();
  const unique = [];
  for (let i = 0; i < events.length; i++) {
    const item = events[i];
    if (!seen.has(item)) {
      seen.add(item);
      unique.push(item);
    }
  }
  return unique;
}`,
    defaultFollowup: {
      id: "dsa-dedup-f1",
      prompt: "Explain why using a Set reduces deduplication from O(N²) to O(N) time, and describe the space complexity trade-off.",
      concept: "Hash table O(1) amortized lookup vs O(N) linear array scan, with O(N) space memory trade-off",
      expectedKeyTerms: ["O(N)", "O(1)", "linear", "hash", "set", "space", "amortized"],
      level: "complexity",
    },
  },
  {
    id: "priority-task-dispatch",
    title: "Triage Under Pressure: Incident Priority Queue",
    workplaceStory:
      "During a major cloud provider disruption, 8,000 alert signals flooded EventPulse. The dispatcher stalled because it repeatedly re-sorted an in-memory array after every incoming alert.",
    scalingStakes: "Re-sorting after each insert takes O(N log N) per alert vs binary heap insert in O(log N).",
    naiveComplexity: "Time: O(N log N) per alert · Space: O(N)",
    targetComplexity: "Time: O(log N) insert/extract · Space: O(N)",
    starterCode: `function dispatchPriorityTasks(tasks) {
  // Dispatches tasks: sorts highest priority first; tie-breaks with earliest timestamp
  const sorted = [...tasks].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.timestamp - b.timestamp;
  });
  return sorted;
}`,
    optimizedCode: `function dispatchPriorityTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  // Sort with stable tie-break (highest priority first, earliest timestamp first)
  return [...tasks].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.timestamp - b.timestamp;
  });
}`,
    defaultFollowup: {
      id: "dsa-prio-f1",
      prompt: "Compare the time complexity of binary heap insertion and extraction (O(log N)) with maintaining a sorted array (O(N) insertion).",
      concept: "Heap tree height logarithmic complexity vs array shift linear penalty",
      expectedKeyTerms: ["heap", "log N", "binary", "tree", "array", "insert", "extract"],
      level: "complexity",
    },
  },
  {
    id: "sliding-rate-limiter",
    title: "Taming the Spike: Sliding Window Rate Limiting",
    workplaceStory:
      "A partner webhook client bypassed hourly rate limits by firing 200 requests across a 5-second boundary window, doubling their allowed capacity under a fixed-window counter.",
    scalingStakes: "Sliding window logs prune expired timestamps from the queue, maintaining strictly bounded O(K) memory.",
    naiveComplexity: "Fixed window counter (vulnerable to 2x burst)",
    targetComplexity: "Time: O(1) amortized check · Space: O(K) bounded",
    starterCode: `function isRateLimited(state, timestamp, windowMs, maxRequests) {
  // Prunes old timestamps and verifies quota
  if (!state.queue) state.queue = [];
  const threshold = timestamp - windowMs;
  // Prune expired
  while (state.queue.length > 0 && state.queue[0] <= threshold) {
    state.queue.shift();
  }
  if (state.queue.length < maxRequests) {
    state.queue.push(timestamp);
    return true; // allowed
  }
  return false; // rejected
}`,
    optimizedCode: `function isRateLimited(state, timestamp, windowMs, maxRequests) {
  if (!state.queue) state.queue = [];
  const threshold = timestamp - windowMs;
  while (state.queue.length > 0 && state.queue[0] <= threshold) {
    state.queue.shift();
  }
  if (state.queue.length < maxRequests) {
    state.queue.push(timestamp);
    return true;
  }
  return false;
}`,
    defaultFollowup: {
      id: "dsa-rate-f1",
      prompt: "Explain the boundary burst vulnerability in fixed-window rate limiters, and why a sliding window log prevents it.",
      concept: "Boundary window doubling attack (burst at end of window 1 + start of window 2)",
      expectedKeyTerms: ["fixed", "boundary", "burst", "sliding", "window", "rolling", "double"],
      level: "foundation",
    },
  },
  {
    id: "indexed-log-search",
    title: "Sub-Millisecond Telemetry Lookup: Binary Search",
    workplaceStory:
      "Incident investigators waited 12 seconds per query filtering incident logs because the query engine executed linear table scans over 500,000 sorted records.",
    scalingStakes: "Linear scan: 500,000 comparisons vs Binary search: ~19 comparisons (25,000x faster).",
    naiveComplexity: "Time: O(N) linear · Space: O(1)",
    targetComplexity: "Time: O(log N) logarithmic · Space: O(1)",
    starterCode: `function findTimeRange(timestamps, startTime, endTime) {
  // Binary search for lower and upper bounds in sorted timestamps
  if (!timestamps || timestamps.length === 0) return [-1, -1];
  
  // Lower bound: first idx where timestamp >= startTime
  let low = 0, high = timestamps.length - 1;
  let firstIdx = -1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (timestamps[mid] >= startTime) {
      firstIdx = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // Upper bound: last idx where timestamp <= endTime
  low = 0; high = timestamps.length - 1;
  let lastIdx = -1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (timestamps[mid] <= endTime) {
      lastIdx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (firstIdx !== -1 && lastIdx !== -1 && firstIdx <= lastIdx) {
    return [firstIdx, lastIdx];
  }
  return [-1, -1];
}`,
    optimizedCode: `function findTimeRange(timestamps, startTime, endTime) {
  if (!timestamps || timestamps.length === 0) return [-1, -1];
  let low = 0, high = timestamps.length - 1;
  let firstIdx = -1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (timestamps[mid] >= startTime) {
      firstIdx = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  low = 0; high = timestamps.length - 1;
  let lastIdx = -1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (timestamps[mid] <= endTime) {
      lastIdx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (firstIdx !== -1 && lastIdx !== -1 && firstIdx <= lastIdx) {
    return [firstIdx, lastIdx];
  }
  return [-1, -1];
}`,
    defaultFollowup: {
      id: "dsa-search-f1",
      prompt: "Why does calculating the midpoint as `low + Math.floor((high - low) / 2)` prevent bugs compared to `Math.floor((low + high) / 2)`?",
      concept: "Integer overflow avoidance in large index boundary computations",
      expectedKeyTerms: ["overflow", "integer", "midpoint", "boundary", "large", "index"],
      level: "edge_case",
    },
  },
];

export default function DsaWorkbench() {
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const challenge = DSA_CHALLENGES[activeChallengeIdx];

  const [code, setCode] = useState(challenge.starterCode);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    passed: boolean;
    checks: VerificationCheck[];
    complexityVerified: boolean;
    timeComplexityObserved: string;
    spaceComplexityObserved: string;
    executionTimeMs: number;
  } | null>(null);

  // Complexity & Reasoning Defense
  const [timeComplexityAnalysis, setTimeComplexityAnalysis] = useState("");
  const [spaceComplexityAnalysis, setSpaceComplexityAnalysis] = useState("");

  // Adaptive Follow-up State
  const [activeFollowup, setActiveFollowup] = useState<AdaptiveFollowupQuestion>(challenge.defaultFollowup);
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [evaluatingFollowup, setEvaluatingFollowup] = useState(false);
  const [followupResult, setFollowupResult] = useState<FollowupEvaluationResult | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  const selectChallenge = (idx: number) => {
    setActiveChallengeIdx(idx);
    const target = DSA_CHALLENGES[idx];
    setCode(target.starterCode);
    setTestResult(null);
    setTimeComplexityAnalysis("");
    setSpaceComplexityAnalysis("");
    setActiveFollowup(target.defaultFollowup);
    setFollowupAnswer("");
    setFollowupResult(null);
    setAnsweredCount(0);
  };

  const handleRunVerification = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/learning/evaluate-challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathSlug: "dsa",
          scenarioId: challenge.id,
          action: "test",
          candidateCode: code,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.suggestedFollowup) {
        setActiveFollowup(data.suggestedFollowup);
      }
    } catch {
      setTestResult({
        passed: false,
        checks: [{ title: "Algorithmic verification", passed: false, message: "Network connection error while running checks." }],
        complexityVerified: false,
        timeComplexityObserved: "Unknown",
        spaceComplexityObserved: "Unknown",
        executionTimeMs: 0,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmitFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupAnswer.trim() || evaluatingFollowup) return;
    setEvaluatingFollowup(true);

    try {
      const res = await fetch("/api/learning/evaluate-challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathSlug: "dsa",
          scenarioId: challenge.id,
          action: "followup",
          questionId: activeFollowup.id,
          answerText: followupAnswer.trim(),
          answeredCountSoFar: answeredCount,
        }),
      });
      const data = await res.json();
      setFollowupResult(data);
      setAnsweredCount((prev) => prev + 1);
      if (data.nextQuestion && !data.stopQuestioning) {
        setActiveFollowup(data.nextQuestion);
        setFollowupAnswer("");
      }
    } catch {
      alert("Failed to submit complexity defense.");
    } finally {
      setEvaluatingFollowup(false);
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px 0" }}>
      {/* Workbench Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
          borderBottom: "1px solid var(--mint-deep)",
          paddingBottom: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--forest)",
                backgroundColor: "var(--lime-light)",
                padding: "2px 8px",
                borderRadius: "4px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              AUTHENTIC WORK-SAMPLE · PRODUCTION DATA STRUCTURES
            </span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>EventPulse Systems Architecture</span>
          </div>
          <h2 style={{ margin: 0, fontSize: "22px", color: "var(--forest)", fontWeight: 700 }}>
            DSA Algorithms & Complexity Workbench
          </h2>
        </div>

        {/* Anti-gamification reminder */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--mint-deep)",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "12px",
            color: "var(--muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Shield size={14} style={{ color: "var(--accent-debug)" }} />
          <span>Follow-up questions calibrate confidence only; base score is never reduced</span>
        </div>
      </div>

      {/* Challenge Selector */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {DSA_CHALLENGES.map((ch, idx) => {
          const isSelected = activeChallengeIdx === idx;
          return (
            <button
              key={ch.id}
              onClick={() => selectChallenge(idx)}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: "8px",
                border: isSelected ? "2px solid var(--accent-debug)" : "1px solid var(--mint-deep)",
                backgroundColor: isSelected ? "var(--lime-light)" : "#FFFFFF",
                cursor: "pointer",
                transition: "all 150ms ease-out",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-debug)" }}>Challenge #{idx + 1}</span>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>Scale Focus</span>
              </div>
              <strong style={{ display: "block", fontSize: "13px", color: "var(--forest)", lineHeight: 1.3 }}>
                {ch.title}
              </strong>
            </button>
          );
        })}
      </div>

      {/* Problem Story & Scaling Stakes Card */}
      <div
        style={{
          backgroundColor: "var(--forest)",
          color: "#FFFFFF",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(20, 45, 78, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-debug)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            HIGH-THROUGHPUT PIPELINE PROFILING · TARIQ PATEL
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#D97706", backgroundColor: "rgba(217, 119, 6, 0.2)", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
              Naive: {challenge.naiveComplexity}
            </span>
            <span style={{ fontSize: "11px", color: "#059669", backgroundColor: "rgba(5, 150, 105, 0.2)", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
              Target: {challenge.targetComplexity}
            </span>
          </div>
        </div>
        <h3 style={{ margin: "4px 0 10px", fontSize: "17px", color: "#FFFFFF" }}>{challenge.title}</h3>
        <p style={{ margin: "0 0 14px", fontSize: "14px", color: "var(--lime-light)", lineHeight: 1.5 }}>
          {challenge.workplaceStory}
        </p>

        {/* Scaling stakes */}
        <div style={{ backgroundColor: "var(--forest)", borderRadius: "6px", padding: "12px 16px", border: "1px solid rgba(6, 198, 230, 0.25)", display: "flex", alignItems: "center", gap: "10px" }}>
          <Activity size={18} style={{ color: "var(--accent-debug)", flexShrink: 0 }} />
          <div style={{ fontSize: "13px", color: "var(--mint-deep)" }}>
            <strong style={{ color: "var(--accent-debug)" }}>Scaling Benchmark:</strong> {challenge.scalingStakes}
          </div>
        </div>
      </div>

      {/* Main Two-Column Workspace */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        {/* Left Column: Code Editor */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--mint-deep)",
            borderRadius: "10px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ALGORITHMIC SOLUTION IMPLEMENTATION
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setCode(challenge.starterCode)}
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  border: "1px solid var(--mint-deep)",
                  borderRadius: "4px",
                  background: "#FFFFFF",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <RotateCcw size={12} />
                <span>Reset to Naive</span>
              </button>
              <button
                type="button"
                onClick={() => setCode(challenge.optimizedCode)}
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  border: "1px solid var(--accent-debug)",
                  borderRadius: "4px",
                  background: "var(--lime-light)",
                  color: "var(--forest)",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Insert Optimized Solution
              </button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            spellCheck={false}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: "13px",
              lineHeight: 1.5,
              backgroundColor: "var(--forest)",
              color: "var(--lime-light)",
              border: "1px solid var(--forest)",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "14px",
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              disabled={testing}
              onClick={handleRunVerification}
              style={{
                backgroundColor: "var(--forest)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                padding: "10px 18px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: testing ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Play size={14} style={{ color: "var(--accent-debug)" }} />
              <span>{testing ? "Running Verification & Complexity Tests…" : "Verify Algorithmic Correctness"}</span>
            </button>

            {testResult && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: testResult.passed ? "#059669" : "#DC2626",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {testResult.passed ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>
                  {testResult.passed
                    ? `Optimal complexity verified (${testResult.executionTimeMs}ms)`
                    : `Checks failed (${testResult.checks.filter((c) => c.passed).length}/${testResult.checks.length})`}
                </span>
              </span>
            )}
          </div>

          {/* Test Checks Results */}
          {testResult && (
            <div style={{ marginTop: "16px", borderTop: "1px solid var(--mint-deep)", paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  COMPLEXITY & CORRECTNESS SUITE:
                </span>
                <span style={{ fontSize: "11px", color: testResult.complexityVerified ? "#059669" : "#D97706", fontWeight: 600 }}>
                  Observed: {testResult.timeComplexityObserved}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {testResult.checks.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      fontSize: "12px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      backgroundColor: c.passed ? "rgba(5, 150, 105, 0.08)" : "rgba(220, 38, 38, 0.08)",
                      color: c.passed ? "#059669" : "#DC2626",
                    }}
                  >
                    {c.passed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <div>
                      <strong>{c.title}</strong>
                      {c.message && <p style={{ margin: "2px 0 0", color: "var(--ink-soft)" }}>{c.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Algorithmic Trade-off Analysis */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--mint-deep)",
            borderRadius: "10px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            <Cpu size={16} style={{ color: "var(--accent-debug)" }} />
            <strong style={{ fontSize: "13px", color: "var(--forest)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              TIME & SPACE COMPLEXITY ANALYSIS
            </strong>
          </div>

          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest)", marginBottom: "4px" }}>
            1. Time Complexity Justification (Big-O analysis & loop invariants):
          </label>
          <textarea
            value={timeComplexityAnalysis}
            onChange={(e) => setTimeComplexityAnalysis(e.target.value)}
            rows={3}
            placeholder="Explain the mathematical operations count and why this data structure eliminates the bottleneck..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid var(--mint-deep)",
              fontSize: "13px",
              marginBottom: "12px",
              lineHeight: 1.4,
            }}
          />

          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest)", marginBottom: "4px" }}>
            2. Space Overhead & Memory Bounding Strategy:
          </label>
          <textarea
            value={spaceComplexityAnalysis}
            onChange={(e) => setSpaceComplexityAnalysis(e.target.value)}
            rows={3}
            placeholder="Explain auxiliary heap memory requirements and how you prevent unbounded RAM growth..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid var(--mint-deep)",
              fontSize: "13px",
              marginBottom: "14px",
              lineHeight: 1.4,
            }}
          />

          <div
            style={{
              backgroundColor: "var(--lime-light)",
              border: "1px solid var(--mint-deep)",
              borderRadius: "6px",
              padding: "10px 12px",
              fontSize: "12px",
              color: "var(--ink-soft)",
            }}
          >
            <strong>Engineering Standard:</strong> Code correctness and execution benchmarks are evaluated deterministically.
            Written explanations ensure candidate solutions understand scaling trade-offs rather than memorizing syntax.
          </div>
        </div>
      </div>

      {/* Adaptive Follow-up Reasoning Defense Section */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--mint-deep)",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(20, 45, 78, 0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--accent-debug)",
                backgroundColor: "var(--forest)",
                padding: "3px 8px",
                borderRadius: "4px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              ADAPTIVE COMPLEXITY PROBE #{answeredCount + 1}
            </span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Focus: {activeFollowup.concept}
            </span>
          </div>

          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Follow-up count does not reduce score
          </span>
        </div>

        <div
          style={{
            backgroundColor: "var(--lime-light)",
            borderLeft: "3px solid var(--accent-debug)",
            padding: "12px 16px",
            borderRadius: "0 6px 6px 0",
            marginBottom: "14px",
            fontSize: "14px",
            color: "var(--forest)",
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {activeFollowup.prompt}
        </div>

        {!followupResult?.stopQuestioning ? (
          <form onSubmit={handleSubmitFollowup}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--forest)", marginBottom: "6px" }}>
              Your Complexity & Architecture Defense:
            </label>
            <textarea
              value={followupAnswer}
              onChange={(e) => setFollowupAnswer(e.target.value)}
              rows={3}
              placeholder="Explain your approach, Big-O boundaries, and operational trade-offs..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--mint-deep)",
                fontSize: "13px",
                marginBottom: "12px",
                lineHeight: 1.4,
              }}
            />
            <button
              type="submit"
              disabled={!followupAnswer.trim() || evaluatingFollowup}
              style={{
                backgroundColor: "var(--forest)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: !followupAnswer.trim() || evaluatingFollowup ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{evaluatingFollowup ? "Evaluating Defense…" : "Submit Complexity Defense"}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <div
            style={{
              backgroundColor: "rgba(5, 150, 105, 0.08)",
              border: "1px solid #059669",
              borderRadius: "6px",
              padding: "14px 16px",
              color: "#059669",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <CheckCircle2 size={18} />
              <strong style={{ fontSize: "14px" }}>Algorithmic Mastery Demonstrated · Stop Rule Triggered</strong>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-soft)" }}>
              You have thoroughly demonstrated understanding of time and space complexity trade-offs. The adaptive stop rule has concluded questioning with High Confidence.
            </p>
          </div>
        )}

        {/* Followup Feedback Summary */}
        {followupResult && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              borderRadius: "6px",
              backgroundColor: followupResult.confidence === "High" ? "rgba(5, 150, 105, 0.08)" : "var(--lime-light)",
              border: `1px solid ${followupResult.confidence === "High" ? "#059669" : "var(--mint-deep)"}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <strong style={{ fontSize: "13px", color: "var(--forest)" }}>
                Defense Evaluation: {followupResult.confidence} Confidence
              </strong>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                Key concepts: {followupResult.demonstratedConcepts.join(", ") || "Foundational concepts"}
              </span>
            </div>
            <p style={{ margin: "4px 0", fontSize: "13px", color: "var(--ink-soft)" }}>{followupResult.reason}</p>
            {followupResult.evidenceQuote && (
              <small style={{ color: "var(--muted)", display: "block", fontStyle: "italic" }}>
                Supporting citation: &quot;{followupResult.evidenceQuote}&quot;
              </small>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
