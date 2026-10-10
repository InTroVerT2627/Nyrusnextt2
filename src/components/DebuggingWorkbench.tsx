"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Play, Shield, MessageSquare, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { VerificationCheck, AdaptiveFollowupQuestion, FollowupEvaluationResult } from "@/lib/work-samples-shared";

type ScenarioConfig = {
  id: string;
  title: string;
  severity: "S1 · High" | "S2 · Medium" | "S3 · Low";
  character: string;
  symptom: string;
  clues: string[];
  starterCode: string;
  suggestedFix: string;
  defaultFollowup: AdaptiveFollowupQuestion;
};

const SCENARIOS: ScenarioConfig[] = [
  {
    id: "off-by-one-settlement",
    title: "The Missing Settlement Slice",
    severity: "S3 · Low",
    character: "Kavya Nair (SRE & Backend Engineer)",
    symptom: "Hourly merchant payout reconciliation shows a $4,200 deficit; the final transaction at 23:59:59 is omitted.",
    clues: [
      "Settlement batch window covers hourly timestamps [23:00:00, 23:59:59]",
      "Array.prototype.slice(start, end) already treats the second argument as an exclusive upper bound",
      "Subtracting 1 from endIdx artificially truncates the window by 1 element",
    ],
    starterCode: `function getSettlementSlice(transactions, startIdx, endIdx) {
  // Bug: endIdx - 1 causes slice to omit the boundary transaction
  return transactions.slice(startIdx, endIdx - 1);
}`,
    suggestedFix: `function getSettlementSlice(transactions, startIdx, endIdx) {
  if (!Array.isArray(transactions) || startIdx < 0 || startIdx > endIdx) {
    return [];
  }
  return transactions.slice(startIdx, endIdx);
}`,
    defaultFollowup: {
      id: "off-f1",
      prompt: "Why does Array.prototype.slice(start, end) exclude the element at index end, and what invariant must your window calculation enforce?",
      concept: "Array slice half-open interval semantics [start, end)",
      expectedKeyTerms: ["exclusive", "boundary", "length", "half-open", "end", "omitted"],
      level: "foundation",
    },
  },
  {
    id: "concurrent-state-race",
    title: "The Phantom Reversal",
    severity: "S2 · Medium",
    character: "Kavya Nair (SRE & Backend Engineer)",
    symptom: "A merchant reported a double balance debit on order #9421 after network latency caused their client to fire two retries 12ms apart.",
    clues: [
      "The client sends an Idempotency-Key header with every payout request",
      "The service updates the ledger balance BEFORE checking if the idempotency key was previously processed",
      "Acquiring an idempotency lock before state mutation guarantees exactly-once ledger transitions",
    ],
    starterCode: `function processPayout(ledger, orderId, amount, idempotencyKey) {
  // Bug: balance is deducted immediately before verifying idempotencyKey
  ledger.balance -= amount;
  ledger.history.push({ orderId, amount });
  return { success: true, balance: ledger.balance };
}`,
    suggestedFix: `function processPayout(ledger, orderId, amount, idempotencyKey) {
  if (ledger.processedKeys && ledger.processedKeys.has(idempotencyKey)) {
    return { success: true, balance: ledger.balance, duplicate: true };
  }
  if (!ledger.processedKeys) ledger.processedKeys = new Set();
  ledger.processedKeys.add(idempotencyKey);
  ledger.balance -= amount;
  ledger.history.push({ orderId, amount, idempotencyKey });
  return { success: true, balance: ledger.balance };
}`,
    defaultFollowup: {
      id: "race-f1",
      prompt: "Why must the idempotency check and key reservation occur before any ledger state mutation occurs?",
      concept: "Atomic state reservation before side effects",
      expectedKeyTerms: ["atomic", "before", "mutation", "duplicate", "race", "lock"],
      level: "foundation",
    },
  },
  {
    id: "unhandled-null-payload",
    title: "The Webhook Ingestion Crash",
    severity: "S1 · High",
    character: "Kavya Nair (SRE & Backend Engineer)",
    symptom: "Partner billing update omitted the customer billing_address object, crashing FinFlow's ingestion queue with TypeError: Cannot read properties of undefined.",
    clues: [
      "Third-party webhook payloads may omit optional nested metadata for digital transactions",
      "Direct chaining (payload.customer.billing.address.zip) throws unhandled runtime TypeErrors",
      "Optional chaining (?.) combined with nullish coalescing (??) provides safe defaults",
    ],
    starterCode: `function parseWebhookEvent(payload) {
  // Bug: unsafe deep chaining assumes billing address is always present
  const zip = payload.customer.billing.address.zip;
  const tier = payload.customer.tier;
  return { zip, tier, id: payload.id };
}`,
    suggestedFix: `function parseWebhookEvent(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const zip = payload.customer?.billing?.address?.zip ?? 'UNKNOWN';
  const tier = payload.customer?.tier ?? 'STANDARD';
  return { zip, tier, id: payload.id ?? 'UNKNOWN_ID' };
}`,
    defaultFollowup: {
      id: "null-f1",
      prompt: "How does optional chaining (?.) and nullish coalescing (??) differ from logical OR (||) when parsing optional API fields?",
      concept: "Nullish coalescing vs truthiness coercion (0 and false preservation)",
      expectedKeyTerms: ["nullish", "undefined", "false", "falsy", "coalescing", "zero"],
      level: "foundation",
    },
  },
  {
    id: "async-event-ordering",
    title: "The Out-of-Order Webhook Delivery",
    severity: "S2 · Medium",
    character: "Kavya Nair (SRE & Backend Engineer)",
    symptom: "Customer receipt emails were dispatched showing 'Status: Pending' because the notification loop returned before database commits resolved.",
    clues: [
      "Array.prototype.forEach does not wait for promises returned by its callback",
      "Downstream tasks run concurrently with unawaited iterations",
      "Use Promise.all(recipients.map(...)) or a for...of loop to ensure all operations resolve before returning",
    ],
    starterCode: `function dispatchNotifications(recipients, sendFn) {
  // Bug: forEach returns immediately without awaiting async callbacks
  const results = [];
  recipients.forEach((r) => {
    results.push(sendFn(r));
  });
  return results;
}`,
    suggestedFix: `function dispatchNotifications(recipients, sendFn) {
  return recipients.map((r) => sendFn(r));
}`,
    defaultFollowup: {
      id: "async-f1",
      prompt: "Why does Array.prototype.forEach ignore promises returned by its callback, and what does the event loop do in that case?",
      concept: "Microtask queue and unawaited callback resolution in forEach",
      expectedKeyTerms: ["forEach", "unawaited", "microtask", "event loop", "return", "callback"],
      level: "foundation",
    },
  },
];

export default function DebuggingWorkbench() {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const scenario = SCENARIOS[activeScenarioIdx];

  const [code, setCode] = useState(scenario.starterCode);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    passed: boolean;
    checks: VerificationCheck[];
    executionTimeMs: number;
    syntaxValid: boolean;
  } | null>(null);

  // 4-Part Incident Report
  const [rootCause, setRootCause] = useState("");
  const [fixExplanation, setFixExplanation] = useState("");

  // Adaptive Follow-up State
  const [activeFollowup, setActiveFollowup] = useState<AdaptiveFollowupQuestion>(scenario.defaultFollowup);
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [evaluatingFollowup, setEvaluatingFollowup] = useState(false);
  const [followupResult, setFollowupResult] = useState<FollowupEvaluationResult | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  const selectScenario = (idx: number) => {
    setActiveScenarioIdx(idx);
    const target = SCENARIOS[idx];
    setCode(target.starterCode);
    setTestResult(null);
    setRootCause("");
    setFixExplanation("");
    setActiveFollowup(target.defaultFollowup);
    setFollowupAnswer("");
    setFollowupResult(null);
    setAnsweredCount(0);
  };

  const handleRunTests = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/learning/evaluate-challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathSlug: "debugging",
          scenarioId: scenario.id,
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
        checks: [{ title: "Execution verification", passed: false, message: "Network connection error while running tests." }],
        executionTimeMs: 0,
        syntaxValid: false,
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
          pathSlug: "debugging",
          scenarioId: scenario.id,
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
      alert("Failed to submit defense explanation.");
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
          borderBottom: "1px solid #D9E8F3",
          paddingBottom: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#142D4E",
                backgroundColor: "#EAF6FC",
                padding: "2px 8px",
                borderRadius: "4px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              AUTHENTIC WORK-SAMPLE · INCIDENT INVESTIGATION
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>FinFlow Production War Room</span>
          </div>
          <h2 style={{ margin: 0, fontSize: "22px", color: "#142D4E", fontWeight: 700 }}>
            Incident Debugging Workbench
          </h2>
        </div>

        {/* Anti-gamification reminder */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #D9E8F3",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "12px",
            color: "#64748B",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Shield size={14} style={{ color: "#06C6E6" }} />
          <span>Follow-ups calibrate confidence only; base score is never reduced</span>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {SCENARIOS.map((sc, idx) => {
          const isSelected = activeScenarioIdx === idx;
          return (
            <button
              key={sc.id}
              onClick={() => selectScenario(idx)}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: "8px",
                border: isSelected ? "2px solid #06C6E6" : "1px solid #D9E8F3",
                backgroundColor: isSelected ? "#EAF6FC" : "#FFFFFF",
                cursor: "pointer",
                transition: "all 150ms ease-out",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: sc.severity.includes("S1") ? "#DC2626" : "#D97706" }}>
                  {sc.severity}
                </span>
                <span style={{ fontSize: "11px", color: "#64748B" }}>Incident #{idx + 1}</span>
              </div>
              <strong style={{ display: "block", fontSize: "13px", color: "#142D4E", lineHeight: 1.3 }}>
                {sc.title}
              </strong>
            </button>
          );
        })}
      </div>

      {/* Incident Narrative & Clues Box */}
      <div
        style={{
          backgroundColor: "#142D4E",
          color: "#FFFFFF",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(20, 45, 78, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#06C6E6", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            LIVE PRODUCTION TELEMETRY · {scenario.character}
          </span>
          <span style={{ fontSize: "11px", color: "#EAF6FC", backgroundColor: "rgba(6, 198, 230, 0.15)", padding: "2px 8px", borderRadius: "4px" }}>
            Status: Active Investigation
          </span>
        </div>
        <h3 style={{ margin: "4px 0 10px", fontSize: "17px", color: "#FFFFFF" }}>{scenario.title}</h3>
        <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#EAF6FC", lineHeight: 1.5 }}>
          <strong>Reported Symptom:</strong> {scenario.symptom}
        </p>

        {/* Unfolding Clues */}
        <div style={{ backgroundColor: "#0c1d33", borderRadius: "6px", padding: "12px 16px", border: "1px solid rgba(6, 198, 230, 0.25)" }}>
          <strong style={{ fontSize: "12px", color: "#06C6E6", display: "block", marginBottom: "6px" }}>
            🔍 INVESTIGATION CLUES:
          </strong>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#D9E8F3", lineHeight: 1.6 }}>
            {scenario.clues.map((clue, idx) => (
              <li key={idx}>{clue}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Two-Column Workspace */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        {/* Left Column: Code Editor & Test Runner */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #D9E8F3",
            borderRadius: "10px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#142D4E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              CODE INSPECTION & REMEDIATION
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setCode(scenario.starterCode)}
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  border: "1px solid #D9E8F3",
                  borderRadius: "4px",
                  background: "#FFFFFF",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <RotateCcw size={12} />
                <span>Reset Buggy Code</span>
              </button>
              <button
                type="button"
                onClick={() => setCode(scenario.suggestedFix)}
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  border: "1px solid #06C6E6",
                  borderRadius: "4px",
                  background: "#EAF6FC",
                  color: "#142D4E",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Insert Verified Patch
              </button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={10}
            spellCheck={false}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: "13px",
              lineHeight: 1.5,
              backgroundColor: "#0d1b2a",
              color: "#EAF6FC",
              border: "1px solid #142D4E",
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
              onClick={handleRunTests}
              style={{
                backgroundColor: "#142D4E",
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
              <Play size={14} style={{ color: "#06C6E6" }} />
              <span>{testing ? "Executing in Isolated Sandbox…" : "Run Deterministic Tests"}</span>
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
                    ? `All checks passed (${testResult.executionTimeMs}ms)`
                    : `Checks failed (${testResult.checks.filter((c) => c.passed).length}/${testResult.checks.length})`}
                </span>
              </span>
            )}
          </div>

          {/* Verification Checks List */}
          {testResult && (
            <div style={{ marginTop: "16px", borderTop: "1px solid #D9E8F3", paddingTop: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                DETERMINISTIC VERIFICATION SUITE:
              </span>
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
                      {c.message && <p style={{ margin: "2px 0 0", color: "#334155" }}>{c.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 4-Part Incident Report */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #D9E8F3",
            borderRadius: "10px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            <Sparkles size={16} style={{ color: "#06C6E6" }} />
            <strong style={{ fontSize: "13px", color: "#142D4E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              INCIDENT ROOT-CAUSE ANALYSIS
            </strong>
          </div>

          <label style={{ fontSize: "12px", fontWeight: 700, color: "#142D4E", marginBottom: "4px" }}>
            1. Root Cause Explanation (What mechanism caused the failure?):
          </label>
          <textarea
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            rows={3}
            placeholder="Explain the specific technical mechanism (e.g. boundary exclusion, unhandled null access, or race condition)..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #D9E8F3",
              fontSize: "13px",
              marginBottom: "12px",
              lineHeight: 1.4,
            }}
          />

          <label style={{ fontSize: "12px", fontWeight: 700, color: "#142D4E", marginBottom: "4px" }}>
            2. Fix Rationale & Preventative Invariants (Why is this patch safe?):
          </label>
          <textarea
            value={fixExplanation}
            onChange={(e) => setFixExplanation(e.target.value)}
            rows={3}
            placeholder="Explain how the patch guarantees invariants and prevents recurrence across concurrent or edge inputs..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #D9E8F3",
              fontSize: "13px",
              marginBottom: "14px",
              lineHeight: 1.4,
            }}
          />

          <div
            style={{
              backgroundColor: "#EAF6FC",
              border: "1px solid #D9E8F3",
              borderRadius: "6px",
              padding: "10px 12px",
              fontSize: "12px",
              color: "#334155",
            }}
          >
            <strong>Note on Evaluation:</strong> Code correctness is evaluated deterministically by the unit test runner.
            Written reasoning is evaluated against the rubric to ground assessment confidence in evidence.
          </div>
        </div>
      </div>

      {/* Adaptive Follow-up Reasoning Defense Section */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #D9E8F3",
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
                color: "#06C6E6",
                backgroundColor: "#142D4E",
                padding: "3px 8px",
                borderRadius: "4px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              ADAPTIVE REASONING PROBE #{answeredCount + 1}
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Focus: {activeFollowup.concept}
            </span>
          </div>

          <span style={{ fontSize: "12px", color: "#64748B" }}>
            No point penalty for follow-ups
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#EAF6FC",
            borderLeft: "3px solid #06C6E6",
            padding: "12px 16px",
            borderRadius: "0 6px 6px 0",
            marginBottom: "14px",
            fontSize: "14px",
            color: "#142D4E",
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {activeFollowup.prompt}
        </div>

        {!followupResult?.stopQuestioning ? (
          <form onSubmit={handleSubmitFollowup}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#142D4E", marginBottom: "6px" }}>
              Your Reasoning Defense:
            </label>
            <textarea
              value={followupAnswer}
              onChange={(e) => setFollowupAnswer(e.target.value)}
              rows={3}
              placeholder="State your reasoning clearly in your own words. Focus on the core system invariants..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #D9E8F3",
                fontSize: "13px",
                marginBottom: "12px",
                lineHeight: 1.4,
              }}
            />
            <button
              type="submit"
              disabled={!followupAnswer.trim() || evaluatingFollowup}
              style={{
                backgroundColor: "#142D4E",
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
              <span>{evaluatingFollowup ? "Evaluating Defense…" : "Submit Defense"}</span>
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
              <strong style={{ fontSize: "14px" }}>Understanding Demonstrated · Stop Rule Triggered</strong>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#334155" }}>
              You have demonstrated sufficient understanding of the core invariants. Per adaptive testing principles, no further questions are necessary.
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
              backgroundColor: followupResult.confidence === "High" ? "rgba(5, 150, 105, 0.08)" : "#EAF6FC",
              border: `1px solid ${followupResult.confidence === "High" ? "#059669" : "#D9E8F3"}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <strong style={{ fontSize: "13px", color: "#142D4E" }}>
                Defense Evaluation: {followupResult.confidence} Confidence
              </strong>
              <span style={{ fontSize: "11px", color: "#64748B" }}>
                Demonstrated: {followupResult.demonstratedConcepts.join(", ") || "Formative concepts"}
              </span>
            </div>
            <p style={{ margin: "4px 0", fontSize: "13px", color: "#334155" }}>{followupResult.reason}</p>
            {followupResult.evidenceQuote && (
              <small style={{ color: "#64748B", display: "block", fontStyle: "italic" }}>
                Supporting evidence: &quot;{followupResult.evidenceQuote}&quot;
              </small>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
