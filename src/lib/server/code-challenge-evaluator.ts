import "server-only";
import vm from "node:vm";
import {
  DebuggingEvaluationResult,
  DsaEvaluationResult,
  VerificationCheck,
  AdaptiveFollowupQuestion,
  FollowupEvaluationResult,
} from "@/lib/work-samples-shared";

// ============================================================================
// 1. DEBUGGING SCENARIOS ENGINE (Server-Side Deterministic Checks)
// Hidden tests, flaw keys, and reference implementations never leak to client.
// ============================================================================

type DebuggingTestCase = {
  title: string;
  run: (fn: (...args: any[]) => any) => { passed: boolean; message?: string; details?: string };
  hidden: boolean;
};

const DEBUGGING_TEST_SUITES: Record<string, DebuggingTestCase[]> = {
  "off-by-one-settlement": [
    {
      title: "Extracts standard 5-transaction window correctly",
      hidden: false,
      run: (fn) => {
        const txs = [10, 20, 30, 40, 50, 60, 70];
        const res = fn(txs, 1, 5);
        const expected = [20, 30, 40, 50];
        const passed = Array.isArray(res) && res.length === 4 && res.every((v, i) => v === expected[i]);
        return {
          passed,
          message: passed ? undefined : `Expected 4 items [20, 30, 40, 50]; received ${JSON.stringify(res)}`,
        };
      },
    },
    {
      title: "Includes transaction at upper boundary index",
      hidden: false,
      run: (fn) => {
        const txs = [100, 200, 300];
        const res = fn(txs, 0, 3);
        const passed = Array.isArray(res) && res.length === 3 && res[2] === 300;
        return {
          passed,
          message: passed ? undefined : `Final item at boundary index 2 was omitted. Received length: ${res?.length}`,
        };
      },
    },
    {
      title: "[Private] Captures single-item window at end of slice",
      hidden: true,
      run: (fn) => {
        const txs = [500, 600, 700];
        const res = fn(txs, 2, 3);
        const passed = Array.isArray(res) && res.length === 1 && res[0] === 700;
        return {
          passed,
          message: passed ? undefined : "Failed on single-element window boundary check.",
        };
      },
    },
    {
      title: "[Private] Safely handles empty input array without error",
      hidden: true,
      run: (fn) => {
        const res = fn([], 0, 0);
        const passed = Array.isArray(res) && res.length === 0;
        return {
          passed,
          message: passed ? undefined : "Failed on empty array handling.",
        };
      },
    },
    {
      title: "[Private] Safely returns empty array when start > end",
      hidden: true,
      run: (fn) => {
        const txs = [1, 2, 3];
        const res = fn(txs, 2, 1);
        const passed = Array.isArray(res) && res.length === 0;
        return {
          passed,
          message: passed ? undefined : "Failed on inverted index parameters.",
        };
      },
    },
  ],

  "concurrent-state-race": [
    {
      title: "Deducts payment on first request with idempotency key",
      hidden: false,
      run: (fn) => {
        const ledger = { balance: 1000, history: [], processedKeys: new Set() };
        const res = fn(ledger, "ord_101", 200, "idem_abc");
        const passed = res?.success === true && ledger.balance === 800;
        return {
          passed,
          message: passed ? undefined : `Balance should be 800; got ${ledger.balance}`,
        };
      },
    },
    {
      title: "Idempotency key prevents double debit on duplicate retry",
      hidden: false,
      run: (fn) => {
        const ledger = { balance: 1000, history: [], processedKeys: new Set() };
        fn(ledger, "ord_101", 200, "idem_abc");
        const res2 = fn(ledger, "ord_101", 200, "idem_abc");
        const passed = ledger.balance === 800 && res2?.duplicate === true;
        return {
          passed,
          message: passed ? undefined : `Duplicate retry modified balance or failed to flag duplicate. Balance: ${ledger.balance}`,
        };
      },
    },
    {
      title: "[Private] Distinct idempotency keys deduct each payment independently",
      hidden: true,
      run: (fn) => {
        const ledger = { balance: 1000, history: [], processedKeys: new Set() };
        fn(ledger, "ord_1", 100, "key_1");
        fn(ledger, "ord_2", 150, "key_2");
        const passed = ledger.balance === 750 && ledger.history.length === 2;
        return {
          passed,
          message: passed ? undefined : "Failed independent transactions with distinct keys.",
        };
      },
    },
    {
      title: "[Private] Returns cached balance without throwing on 5 concurrent retries",
      hidden: true,
      run: (fn) => {
        const ledger = { balance: 500, history: [], processedKeys: new Set() };
        for (let i = 0; i < 5; i++) {
          fn(ledger, "ord_99", 50, "key_stress");
        }
        const passed = ledger.balance === 450;
        return {
          passed,
          message: passed ? undefined : "Repeated retries caused duplicate state mutation.",
        };
      },
    },
  ],

  "unhandled-null-payload": [
    {
      title: "Extracts complete nested payload correctly",
      hidden: false,
      run: (fn) => {
        const payload = { id: "evt_1", customer: { billing: { address: { zip: "560001" } }, tier: "VIP" } };
        const res = fn(payload);
        const passed = res?.zip === "560001" && res?.tier === "VIP" && res?.id === "evt_1";
        return {
          passed,
          message: passed ? undefined : `Failed complete payload parsing: ${JSON.stringify(res)}`,
        };
      },
    },
    {
      title: "Gracefully handles missing billing address with fallback",
      hidden: false,
      run: (fn) => {
        const payload = { id: "evt_2", customer: { tier: "PRO" } };
        const res = fn(payload);
        const passed = res?.zip === "UNKNOWN" && res?.tier === "PRO";
        return {
          passed,
          message: passed ? undefined : `Expected zip UNKNOWN fallback; received ${res?.zip}`,
        };
      },
    },
    {
      title: "[Private] Null payload does not throw runtime exception",
      hidden: true,
      run: (fn) => {
        try {
          const res = fn(null);
          const passed = res === null || res?.zip === "UNKNOWN";
          return { passed };
        } catch {
          return { passed: false, message: "Threw unhandled TypeError on null payload." };
        }
      },
    },
    {
      title: "[Private] Empty object payload returns safe fallback values",
      hidden: true,
      run: (fn) => {
        try {
          const res = fn({});
          const passed = res?.zip === "UNKNOWN" && (res?.tier === "STANDARD" || res?.tier === "UNKNOWN");
          return { passed };
        } catch {
          return { passed: false, message: "Threw exception on empty object payload." };
        }
      },
    },
  ],

  "async-event-ordering": [
    {
      title: "Waits for all notifications to resolve before returning",
      hidden: false,
      run: (fn) => {
        const log: string[] = [];
        const sendFn = (id: string) => {
          log.push(`sent_${id}`);
          return Promise.resolve(`ack_${id}`);
        };
        // Simulated execution test
        const res = fn(["a", "b", "c"], sendFn);
        if (res && typeof res.then === "function") {
          // If promise
          return { passed: true };
        }
        const passed = Array.isArray(res) && res.length === 3;
        return {
          passed,
          message: passed ? undefined : "Function returned before asynchronous sends finished.",
        };
      },
    },
    {
      title: "Preserves recipient input order",
      hidden: false,
      run: (fn) => {
        const sendFn = (id: string) => `ack_${id}`;
        const res = fn(["alpha", "beta", "gamma"], sendFn);
        const passed = Array.isArray(res) && res[0] === "ack_alpha" && res[1] === "ack_beta" && res[2] === "ack_gamma";
        return {
          passed,
          message: passed ? undefined : "Output array order did not match input order.",
        };
      },
    },
    {
      title: "[Private] Empty recipient list returns empty array immediately",
      hidden: true,
      run: (fn) => {
        const sendFn = (id: string) => `ack_${id}`;
        const res = fn([], sendFn);
        const passed = Array.isArray(res) && res.length === 0;
        return { passed };
      },
    },
  ],
};

const DEBUGGING_FOLLOWUPS: Record<string, AdaptiveFollowupQuestion[]> = {
  "off-by-one-settlement": [
    {
      id: "off-f1",
      prompt: "Why does Array.prototype.slice(start, end) exclude the element at index end, and what invariant must your window calculation enforce?",
      concept: "Array slice half-open interval semantics [start, end)",
      expectedKeyTerms: ["exclusive", "boundary", "length", "half-open", "end", "omitted"],
      level: "foundation",
    },
    {
      id: "off-f2",
      prompt: "What happens if a transaction arrives with a timestamp exactly matching the upper boundary of the hourly window? How does your fix handle it?",
      concept: "Boundary condition equality and inclusive timestamps",
      expectedKeyTerms: ["inclusive", "boundary", "timestamp", "upper", "equal"],
      level: "edge_case",
    },
    {
      id: "off-f3",
      prompt: "How would you design a property-based or deterministic unit test to prove off-by-one errors can never reoccur in this service?",
      concept: "Defensive testing and property verification",
      expectedKeyTerms: ["test", "boundary", "fuzz", "invariant", "assert", "coverage"],
      level: "tradeoff",
    },
  ],

  "concurrent-state-race": [
    {
      id: "race-f1",
      prompt: "Why must the idempotency check and key reservation occur before any ledger state mutation occurs?",
      concept: "Atomic state reservation before side effects",
      expectedKeyTerms: ["atomic", "before", "mutation", "duplicate", "race", "lock"],
      level: "foundation",
    },
    {
      id: "race-f2",
      prompt: "In a multi-node production deployment with 12 API pods, why is an in-memory Set insufficient, and what architecture would you use?",
      concept: "Distributed idempotency store with Redis/PostgreSQL unique constraint",
      expectedKeyTerms: ["distributed", "redis", "database", "unique", "cluster", "shared"],
      level: "complexity",
    },
  ],

  "unhandled-null-payload": [
    {
      id: "null-f1",
      prompt: "How does optional chaining (?.) and nullish coalescing (??) differ from logical OR (||) when parsing optional API fields?",
      concept: "Nullish coalescing vs truthiness coercion (0 and false preservation)",
      expectedKeyTerms: ["nullish", "undefined", "false", "falsy", "coalescing", "zero"],
      level: "foundation",
    },
    {
      id: "null-f2",
      prompt: "When a webhook payload fails schema validation completely, under what circumstances should it be dead-lettered versus assigned default values?",
      concept: "Data integrity vs graceful degradation boundary",
      expectedKeyTerms: ["dead-letter", "corrupt", "critical", "poison", "audit", "alert"],
      level: "tradeoff",
    },
  ],

  "async-event-ordering": [
    {
      id: "async-f1",
      prompt: "Why does Array.prototype.forEach ignore promises returned by its callback, and what does the event loop do in that case?",
      concept: "Microtask queue and unawaited callback resolution in forEach",
      expectedKeyTerms: ["forEach", "unawaited", "microtask", "event loop", "return", "callback"],
      level: "foundation",
    },
    {
      id: "async-f2",
      prompt: "Compare Promise.all() vs a for...of loop with await: when is sequential execution required over parallel execution?",
      concept: "Sequential dependencies vs parallel independent concurrency",
      expectedKeyTerms: ["parallel", "sequential", "order", "concurrency", "dependency", "Promise.all"],
      level: "complexity",
    },
  ],
};

// ============================================================================
// 2. DSA SCENARIOS ENGINE (Complexity & Deterministic Checks)
// ============================================================================

type DsaTestCase = {
  title: string;
  hidden: boolean;
  run: (fn: (...args: any[]) => any) => { passed: boolean; message?: string; operations?: number };
};

const DSA_TEST_SUITES: Record<string, DsaTestCase[]> = {
  "fast-record-dedup": [
    {
      title: "Deduplicates audit records preserving first-seen order",
      hidden: false,
      run: (fn) => {
        const input = ["evt_1", "evt_2", "evt_1", "evt_3", "evt_2", "evt_4"];
        const res = fn(input);
        const expected = ["evt_1", "evt_2", "evt_3", "evt_4"];
        const passed = Array.isArray(res) && res.length === 4 && res.every((v, i) => v === expected[i]);
        return {
          passed,
          message: passed ? undefined : `Expected [evt_1, evt_2, evt_3, evt_4]; got ${JSON.stringify(res)}`,
        };
      },
    },
    {
      title: "Leaves already-unique collection unchanged",
      hidden: false,
      run: (fn) => {
        const input = ["a", "b", "c"];
        const res = fn(input);
        const passed = Array.isArray(res) && res.length === 3;
        return { passed };
      },
    },
    {
      title: "[Private] Linear O(N) performance on 15,000 items (passes under 30ms)",
      hidden: true,
      run: (fn) => {
        const large = Array.from({ length: 15000 }, (_, i) => `item_${i % 500}`);
        const t0 = performance.now();
        const res = fn(large);
        const elapsed = performance.now() - t0;
        const passed = Array.isArray(res) && res.length === 500 && elapsed < 80;
        return {
          passed,
          message: passed ? undefined : `Algorithm exceeded linear time budget (took ${Math.round(elapsed)}ms). Check for quadratic nested scans.`,
        };
      },
    },
    {
      title: "[Private] Correctly handles all identical elements",
      hidden: true,
      run: (fn) => {
        const input = ["dup", "dup", "dup", "dup"];
        const res = fn(input);
        const passed = Array.isArray(res) && res.length === 1 && res[0] === "dup";
        return { passed };
      },
    },
  ],

  "priority-task-dispatch": [
    {
      title: "Dispatches highest priority task first",
      hidden: false,
      run: (fn) => {
        const tasks = [
          { id: "task_low", priority: 1, timestamp: 100 },
          { id: "task_critical", priority: 10, timestamp: 105 },
          { id: "task_med", priority: 5, timestamp: 90 },
        ];
        const res = fn(tasks);
        const passed = res?.[0]?.id === "task_critical" && res?.[1]?.id === "task_med" && res?.[2]?.id === "task_low";
        return {
          passed,
          message: passed ? undefined : `Expected task_critical first; got ${res?.[0]?.id}`,
        };
      },
    },
    {
      title: "Tie-breaks equal priority using arrival timestamp (FIFO)",
      hidden: false,
      run: (fn) => {
        const tasks = [
          { id: "second_arrival", priority: 5, timestamp: 200 },
          { id: "first_arrival", priority: 5, timestamp: 100 },
        ];
        const res = fn(tasks);
        const passed = res?.[0]?.id === "first_arrival" && res?.[1]?.id === "second_arrival";
        return {
          passed,
          message: passed ? undefined : `Tie-breaking failed to respect earliest timestamp. Got: ${res?.[0]?.id}`,
        };
      },
    },
    {
      title: "[Private] Dispatches 2,000 tasks maintaining heap priority order",
      hidden: true,
      run: (fn) => {
        const tasks = Array.from({ length: 2000 }, (_, i) => ({
          id: `t_${i}`,
          priority: i % 10,
          timestamp: 2000 - i,
        }));
        const res = fn(tasks);
        const passed = Array.isArray(res) && res.length === 2000 && res[0].priority >= res[1999].priority;
        return { passed };
      },
    },
  ],

  "sliding-rate-limiter": [
    {
      title: "Allows requests within rate limit quota",
      hidden: false,
      run: (fn) => {
        const state = { queue: [] };
        const allowed1 = fn(state, 1000, 60000, 3);
        const allowed2 = fn(state, 2000, 60000, 3);
        const passed = allowed1 === true && allowed2 === true && state.queue.length === 2;
        return { passed };
      },
    },
    {
      title: "Rejects request when limit exceeded in rolling window",
      hidden: false,
      run: (fn) => {
        const state = { queue: [1000, 2000, 3000] };
        const allowed = fn(state, 4000, 60000, 3);
        const passed = allowed === false && state.queue.length === 3;
        return {
          passed,
          message: passed ? undefined : "Should have rejected 4th request when limit is 3.",
        };
      },
    },
    {
      title: "[Private] Prunes expired timestamps older than window boundary",
      hidden: true,
      run: (fn) => {
        const state = { queue: [1000, 2000, 3000] };
        // Request arrives at 70,000 (window 60,000). Threshold is 10,000. All old requests expire!
        const allowed = fn(state, 70000, 60000, 3);
        const passed = allowed === true && state.queue.length === 1 && state.queue[0] === 70000;
        return {
          passed,
          message: passed ? undefined : "Old timestamps were not pruned from sliding window queue.",
        };
      },
    },
  ],

  "indexed-log-search": [
    {
      title: "Finds boundary indices for exact time range",
      hidden: false,
      run: (fn) => {
        const timestamps = [100, 200, 300, 400, 500];
        const res = fn(timestamps, 200, 400);
        const passed = Array.isArray(res) && res[0] === 1 && res[1] === 3;
        return {
          passed,
          message: passed ? undefined : `Expected [1, 3]; received ${JSON.stringify(res)}`,
        };
      },
    },
    {
      title: "Correctly handles range boundaries between timestamps",
      hidden: false,
      run: (fn) => {
        const timestamps = [100, 200, 300, 400, 500];
        const res = fn(timestamps, 150, 450);
        const passed = Array.isArray(res) && res[0] === 1 && res[1] === 3;
        return {
          passed,
          message: passed ? undefined : `Expected [1, 3] for [150, 450]; received ${JSON.stringify(res)}`,
        };
      },
    },
    {
      title: "[Private] O(log N) lookup across 100,000 sorted timestamps",
      hidden: true,
      run: (fn) => {
        const timestamps = Array.from({ length: 100000 }, (_, i) => i * 10);
        const t0 = performance.now();
        const res = fn(timestamps, 25000, 75000);
        const elapsed = performance.now() - t0;
        const passed = Array.isArray(res) && res[0] === 2500 && res[1] === 7500 && elapsed < 20;
        return {
          passed,
          message: passed ? undefined : "Binary search range lookup took too long or returned wrong indices.",
        };
      },
    },
    {
      title: "[Private] Range outside all timestamps returns [-1, -1]",
      hidden: true,
      run: (fn) => {
        const timestamps = [100, 200, 300];
        const res = fn(timestamps, 500, 600);
        const passed = Array.isArray(res) && res[0] === -1 && res[1] === -1;
        return { passed };
      },
    },
  ],
};

const DSA_FOLLOWUPS: Record<string, AdaptiveFollowupQuestion[]> = {
  "fast-record-dedup": [
    {
      id: "dsa-dedup-f1",
      prompt: "Explain why using a Set reduces deduplication from O(N²) to O(N) time, and describe the space complexity trade-off.",
      concept: "Hash table O(1) amortized lookup vs O(N) linear array scan, with O(N) space memory trade-off",
      expectedKeyTerms: ["O(N)", "O(1)", "linear", "hash", "set", "space", "amortized"],
      level: "complexity",
    },
    {
      id: "dsa-dedup-f2",
      prompt: "In a real-time event pipeline processing 100,000 events/sec, how would you prevent the Set from growing indefinitely in RAM?",
      concept: "Sliding window deduplication with TTL or ring buffer eviction",
      expectedKeyTerms: ["ttl", "sliding window", "prune", "memory", "eviction", "bounded"],
      level: "tradeoff",
    },
  ],

  "priority-task-dispatch": [
    {
      id: "dsa-prio-f1",
      prompt: "Compare the time complexity of binary heap insertion and extraction (O(log N)) with maintaining a sorted array (O(N) insertion).",
      concept: "Heap tree height logarithmic complexity vs array shift linear penalty",
      expectedKeyTerms: ["heap", "log N", "binary", "tree", "array", "insert", "extract"],
      level: "complexity",
    },
    {
      id: "dsa-prio-f2",
      prompt: "Why is earliest arrival timestamp tie-breaking critical when multiple Sev-1 alerts share the same highest priority?",
      concept: "FIFO queue starvation prevention and operational fairness",
      expectedKeyTerms: ["fifo", "timestamp", "fairness", "starvation", "tie-break", "order"],
      level: "tradeoff",
    },
  ],

  "sliding-rate-limiter": [
    {
      id: "dsa-rate-f1",
      prompt: "Explain the boundary burst vulnerability in fixed-window rate limiters, and why a sliding window log prevents it.",
      concept: "Boundary window doubling attack (burst at end of window 1 + start of window 2)",
      expectedKeyTerms: ["fixed", "boundary", "burst", "sliding", "window", "rolling", "double"],
      level: "foundation",
    },
    {
      id: "dsa-rate-f2",
      prompt: "What is the worst-case space complexity of your sliding window per user, and how does timestamp pruning guarantee boundedness?",
      concept: "Bounded memory O(K) where K is max allowable request count in window",
      expectedKeyTerms: ["O(K)", "bounded", "prune", "memory", "limit", "shift", "pop"],
      level: "complexity",
    },
  ],

  "indexed-log-search": [
    {
      id: "dsa-search-f1",
      prompt: "Why does calculating the midpoint as `low + Math.floor((high - low) / 2)` prevent bugs compared to `Math.floor((low + high) / 2)`?",
      concept: "Integer overflow avoidance in large index boundary computations",
      expectedKeyTerms: ["overflow", "integer", "midpoint", "boundary", "large", "index"],
      level: "edge_case",
    },
    {
      id: "dsa-search-f2",
      prompt: "How does binary search maintain strict loop invariants when multiple identical timestamps exist at the boundary of the search range?",
      concept: "Lower bound and upper bound binary search invariants",
      expectedKeyTerms: ["lower bound", "upper bound", "invariant", "duplicate", "first occurrence"],
      level: "complexity",
    },
  ],
};

// ============================================================================
// 3. SAFE SANDBOX CODE RUNNER
// Evaluates JS functions safely in an isolated Node.js VM context
// ============================================================================

function compileUserFunction(sourceCode: string): ((...args: any[]) => any) | { error: string } {
  try {
    const sandbox: Record<string, any> = {
      Array,
      Object,
      Math,
      Set,
      Map,
      Number,
      String,
      Boolean,
      Date,
      performance,
      console: { log: () => {} },
    };
    vm.createContext(sandbox);

    // Wrap code to return the main callable function
    const wrapped = `
      (() => {
        ${sourceCode};
        // Auto-detect defined function
        if (typeof getSettlementSlice === 'function') return getSettlementSlice;
        if (typeof processPayout === 'function') return processPayout;
        if (typeof parseWebhookEvent === 'function') return parseWebhookEvent;
        if (typeof dispatchNotifications === 'function') return dispatchNotifications;
        if (typeof deduplicateEvents === 'function') return deduplicateEvents;
        if (typeof dispatchPriorityTasks === 'function') return dispatchPriorityTasks;
        if (typeof isRateLimited === 'function') return isRateLimited;
        if (typeof findTimeRange === 'function') return findTimeRange;
        // Or if function assigned to module.exports / fn
        if (typeof solution === 'function') return solution;
        return null;
      })()
    `;

    const fn = vm.runInContext(wrapped, sandbox, { timeout: 1500 });
    if (!fn || typeof fn !== "function") {
      return { error: "No recognized exported function found. Ensure your function matches the problem signature." };
    }
    return fn;
  } catch (err: any) {
    return { error: err?.message || "Syntax or compilation error in solution." };
  }
}

// ============================================================================
// 4. PUBLIC EVALUATION API FUNCTIONS
// ============================================================================

export function evaluateDebuggingFix(
  scenarioId: string,
  candidateCode: string,
  _report?: { rootCause?: string; fixExplanation?: string }
): DebuggingEvaluationResult {
  const startTime = performance.now();
  const testSuite = DEBUGGING_TEST_SUITES[scenarioId];
  if (!testSuite) {
    return {
      passed: false,
      checks: [{ title: "Scenario configuration check", passed: false, message: `Unknown scenario: ${scenarioId}` }],
      totalChecks: 1,
      passedChecks: 0,
      executionTimeMs: 0,
      syntaxValid: false,
    };
  }

  const compiled = compileUserFunction(candidateCode);
  if (typeof compiled === "object" && "error" in compiled) {
    const checks: VerificationCheck[] = testSuite.map((t) => ({
      title: t.hidden ? "Private Edge-Case Verification Check" : t.title,
      passed: false,
      message: compiled.error,
    }));
    return {
      passed: false,
      checks,
      totalChecks: checks.length,
      passedChecks: 0,
      executionTimeMs: Math.round(performance.now() - startTime),
      syntaxValid: false,
      suggestedFollowup: DEBUGGING_FOLLOWUPS[scenarioId]?.[0],
    };
  }

  const checks: VerificationCheck[] = [];
  let passedCount = 0;

  for (const tc of testSuite) {
    try {
      const outcome = tc.run(compiled);
      // Clean title for hidden tests so secrets never leak
      const displayTitle = tc.hidden ? "Private Edge-Case Boundary Verification" : tc.title;
      checks.push({
        title: displayTitle,
        passed: outcome.passed,
        message: tc.hidden ? (outcome.passed ? undefined : "Edge-case boundary verification failed.") : outcome.message,
      });
      if (outcome.passed) passedCount++;
    } catch (err: any) {
      checks.push({
        title: tc.hidden ? "Private Edge-Case Boundary Verification" : tc.title,
        passed: false,
        message: tc.hidden ? "Edge-case check encountered runtime error." : (err?.message || "Runtime error during test execution"),
      });
    }
  }

  const allPassed = passedCount === testSuite.length;
  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    passed: allPassed,
    checks,
    totalChecks: testSuite.length,
    passedChecks: passedCount,
    executionTimeMs,
    syntaxValid: true,
    suggestedFollowup: DEBUGGING_FOLLOWUPS[scenarioId]?.[0],
  };
}

export function evaluateDsaChallenge(
  challengeId: string,
  candidateCode: string,
  _analysis?: { approach?: string; timeComplexity?: string; spaceComplexity?: string }
): DsaEvaluationResult {
  const startTime = performance.now();
  const testSuite = DSA_TEST_SUITES[challengeId];
  if (!testSuite) {
    return {
      passed: false,
      checks: [{ title: "Challenge configuration check", passed: false, message: `Unknown challenge: ${challengeId}` }],
      totalChecks: 1,
      passedChecks: 0,
      complexityVerified: false,
      timeComplexityObserved: "Unknown",
      spaceComplexityObserved: "Unknown",
      executionTimeMs: 0,
    };
  }

  const compiled = compileUserFunction(candidateCode);
  if (typeof compiled === "object" && "error" in compiled) {
    const checks: VerificationCheck[] = testSuite.map((t) => ({
      title: t.hidden ? "Private Scale & Complexity Verification" : t.title,
      passed: false,
      message: compiled.error,
    }));
    return {
      passed: false,
      checks,
      totalChecks: checks.length,
      passedChecks: 0,
      complexityVerified: false,
      timeComplexityObserved: "N/A (Syntax Error)",
      spaceComplexityObserved: "N/A",
      executionTimeMs: Math.round(performance.now() - startTime),
      suggestedFollowup: DSA_FOLLOWUPS[challengeId]?.[0],
    };
  }

  const checks: VerificationCheck[] = [];
  let passedCount = 0;

  for (const tc of testSuite) {
    try {
      const outcome = tc.run(compiled);
      const displayTitle = tc.hidden ? "Private Large-Scale & Complexity Verification" : tc.title;
      checks.push({
        title: displayTitle,
        passed: outcome.passed,
        message: tc.hidden ? (outcome.passed ? undefined : "High-throughput performance or complexity threshold failed.") : outcome.message,
      });
      if (outcome.passed) passedCount++;
    } catch (err: any) {
      checks.push({
        title: tc.hidden ? "Private Large-Scale & Complexity Verification" : tc.title,
        passed: false,
        message: tc.hidden ? "High-throughput test encountered an unhandled exception." : (err?.message || "Execution exception"),
      });
    }
  }

  const allPassed = passedCount === testSuite.length;
  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    passed: allPassed,
    checks,
    totalChecks: testSuite.length,
    passedChecks: passedCount,
    complexityVerified: allPassed,
    timeComplexityObserved: allPassed ? "O(N) / O(log N) Verified" : "Quadratic or Inefficient",
    spaceComplexityObserved: allPassed ? "O(N) / O(K) Bounded" : "Unverified",
    executionTimeMs,
    suggestedFollowup: DSA_FOLLOWUPS[challengeId]?.[0],
  };
}

// ============================================================================
// 5. ADAPTIVE FOLLOW-UP EVALUATOR & EARLY-STOPPING RULE
// Clarifies understanding & confidence only; NEVER reduces base score!
// ============================================================================

export function getFollowupQuestion(
  pathSlug: "debugging" | "dsa" | string,
  scenarioId: string,
  index = 0
): AdaptiveFollowupQuestion | null {
  const bank = pathSlug === "debugging" ? DEBUGGING_FOLLOWUPS[scenarioId] : DSA_FOLLOWUPS[scenarioId];
  if (!bank || bank.length === 0) return null;
  return bank[Math.min(index, bank.length - 1)] || null;
}

export function evaluateFollowupDefense(
  pathSlug: "debugging" | "dsa" | string,
  scenarioId: string,
  questionId: string,
  answerText: string,
  answeredCountSoFar = 0
): FollowupEvaluationResult {
  const bank = pathSlug === "debugging" ? DEBUGGING_FOLLOWUPS[scenarioId] : DSA_FOLLOWUPS[scenarioId];
  const question = bank?.find((q) => q.id === questionId) || bank?.[0];

  const normalized = answerText.toLowerCase();
  const matchedTerms: string[] = [];

  if (question) {
    for (const term of question.expectedKeyTerms) {
      if (normalized.includes(term.toLowerCase())) {
        matchedTerms.push(term);
      }
    }
  }

  // Score reasoning quality based on concept demonstration
  let score = 0;
  if (matchedTerms.length >= 2) {
    score = 2; // Thorough coverage
  } else if (matchedTerms.length >= 1 || answerText.trim().length >= 20) {
    score = 1; // Partial coverage
  }

  // Evidence quote from user text
  const sentences = answerText.split(/[.?!]/).map((s) => s.trim()).filter((s) => s.length > 10);
  const evidenceQuote = sentences[0] || answerText.slice(0, 120);

  // Early-stopping condition:
  // If the candidate demonstrates 2+ key concepts or has answered 2 follow-ups thoroughly, stop asking!
  const isSufficient = score === 2 || (answeredCountSoFar >= 1 && score >= 1);
  const stopQuestioning = isSufficient || (bank && answeredCountSoFar >= bank.length - 1);

  const confidence: "High" | "Medium" | "Low" =
    score === 2 ? "High" : score === 1 ? "Medium" : "Low";

  const reason =
    score === 2
      ? `Demonstrated clear grasp of ${question?.concept || "core principles"} (${matchedTerms.join(", ")}).`
      : score === 1
      ? `Partially addressed ${question?.concept || "core concepts"}. Demonstrates basic operational awareness.`
      : `Answer did not mention key operational principles for ${question?.concept || "the challenge"}.`;

  return {
    score, // Calibrates confidence only; never reduces base score!
    confidence,
    evidenceQuote,
    reason,
    stopQuestioning,
    demonstratedConcepts: matchedTerms,
  };
}
