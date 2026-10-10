import "server-only";
import initSqlJs from "sql.js";
import { FinalTestQuestionServer } from "@/lib/final-test-types";

export const SQL_TEST_SEED = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT,
  segment TEXT,
  created_at TEXT
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  amount REAL,
  status TEXT,
  created_at TEXT,
  FOREIGN KEY(customer_id) REFERENCES customers(id)
);

INSERT INTO customers VALUES
  (1, 'Acme Corp', 'Enterprise', '2026-01-10'),
  (2, 'Beta LLC', 'Mid-Market', '2026-02-15'),
  (3, 'Gamma Inc', 'Enterprise', '2026-02-20'),
  (4, 'Delta Co', 'SMB', '2026-03-01'),
  (5, 'Epsilon Ltd', 'Mid-Market', '2026-03-12');

INSERT INTO orders VALUES
  (101, 1, 12000.0, 'completed', '2026-02-01'),
  (102, 1, 8500.0, 'completed', '2026-03-05'),
  (103, 2, 4500.0, 'completed', '2026-03-10'),
  (104, 3, 15000.0, 'completed', '2026-03-15'),
  (105, 4, 1200.0, 'refunded', '2026-03-18'),
  (106, 5, 3200.0, 'completed', '2026-03-22'),
  (107, 2, 2800.0, 'cancelled', '2026-03-25');
`;

export const dataAnalyticsQuestions: FinalTestQuestionServer[] = [
  // 1. Spot Mistake: Churn Cohort Hallucination
  {
    client: {
      id: "da-q1-churn",
      pathSlug: "data-analytics",
      slug: "da-spot-churn-cohort",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Churn Cohort Calculation",
      scenario: "An AI assistant generated a quarterly cohort retention memo for a subscription SaaS product.",
      prompt: "Identify the erroneous sentence where the AI makes an invalid churn assertion, explain the flaw, and provide the correct calculation.",
      starterContent: "In Q1 2026, our Enterprise customer cohort started with 100 accounts in January. We lost 8 accounts in February and 4 accounts in March. The automated system calculates that total churn for the quarter was therefore 4%, because the final month only lost 4 accounts. This represents an unprecedented retention milestone for our product.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "da-err-1",
        startChar: 177,
        endChar: 304,
        faultyText: "The automated system calculates that total churn for the quarter was therefore 4%, because the final month only lost 4 accounts.",
        explanationKey: "Cumulative churn across the cohort requires summing churned accounts (8 + 4 = 12 accounts lost out of 100 = 12% quarterly churn), not taking the final month in isolation.",
        correctionKey: "Quarterly churn was 12% (12 out of 100 accounts lost).",
      },
    ],
    referenceCriteria: [
      "Mentions cumulative cohort loss over the period.",
      "Identifies 12 accounts lost out of 100 equals 12%.",
      "Rejects taking the final month's loss as the quarterly churn rate.",
    ],
    followupBank: [
      {
        id: "da-q1-f1",
        prompt: "If 10 new Enterprise customers joined in February, how should they be treated when reporting the January cohort's retention?",
        expectedKeyPoints: ["Track separately as February cohort", "Do not dilute January denominator", "Preserve cohort boundary"],
      },
      {
        id: "da-q1-f2",
        prompt: "What operational harm occurs if executives rely on the 4% figure instead of the true 12%?",
        expectedKeyPoints: ["Underestimating customer attrition", "Misallocating account management resources", "Inaccurate ARR forecasting"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Check how the quarterly total churn was computed from monthly losses." },
      pointer: { deduction: 10, text: "Look closely at sentence 3: 8 in Feb and 4 in March equals 12 accounts lost." },
      strong: { deduction: 20, text: "Total quarterly churn is 12% (8+4)/100, not 4%." },
    },
  },

  // 2. Fix It: Broken SQL Enterprise Revenue
  {
    client: {
      id: "da-q2-sql-aov",
      pathSlug: "data-analytics",
      slug: "da-fix-sql-enterprise-aov",
      type: "fix_it",
      title: "Fix It: Broken Enterprise Revenue SQL Query",
      scenario: "The finance team needs completed revenue and order counts for Enterprise clients. The current query creates duplicate rows due to a missing join condition.",
      prompt: "Fix the SQL query so it explicitly joins customers and orders, filters for completed orders, and computes total revenue, order count, and AOV.",
      starterContent: `SELECT c.segment, SUM(o.amount) AS total_revenue, COUNT(o.id) AS order_count, AVG(o.amount) AS avg_order_value\nFROM customers c, orders o\nWHERE c.segment = 'Enterprise';`,
      difficulty: "intermediate",
    },
    expectedExecutionTest: async (query: string) => {
      try {
        const SQL = await initSqlJs();
        const db = new SQL.Database();
        db.run(SQL_TEST_SEED);
        const res = db.exec(query);
        if (!res || !res.length || !res[0].values.length) {
          return { passed: false, message: "Query returned 0 rows." };
        }
        const row = res[0].values[0];
        const cols = res[0].columns.map((c) => c.toLowerCase());
        const segIdx = cols.findIndex((c) => c.includes("segment"));
        const revIdx = cols.findIndex((c) => c.includes("rev") || c.includes("sum"));
        const countIdx = cols.findIndex((c) => c.includes("count") || c.includes("order"));

        if (segIdx === -1 || revIdx === -1 || countIdx === -1) {
          return { passed: false, message: "Missing required aggregated columns." };
        }

        const seg = String(row[segIdx]);
        const rev = Number(row[revIdx]);
        const count = Number(row[countIdx]);

        if (seg.toLowerCase() !== "enterprise") return { passed: false, message: `Expected segment 'Enterprise', got '${seg}'.` };
        if (Math.abs(rev - 35500) > 1) return { passed: false, message: `Expected $35,500 total revenue, got $${rev}.` };
        if (count !== 3) return { passed: false, message: `Expected 3 completed orders, got ${count}.` };

        return { passed: true };
      } catch (e: any) {
        return { passed: false, message: e?.message || "SQL execution error" };
      }
    },
    optimalityRubric: {
      maxScore: 40,
      criteria: [
        {
          id: "opt-explicit-join",
          name: "Explicit ANSI JOIN with key equality",
          points: 15,
          test: (input: string) => {
            const hasJoin = /join\s+orders/i.test(input) || /c\.id\s*=\s*o\.customer_id/i.test(input);
            return {
              passed: hasJoin,
              message: hasJoin ? "Uses explicit join syntax." : "Specify join on c.id = o.customer_id.",
            };
          },
        },
        {
          id: "opt-filter-early",
          name: "Explicit filter for completed status",
          points: 15,
          test: (input: string) => {
            const hasStatus = /o\.status\s*=\s*['"]completed['"]/i.test(input) || /status\s*=\s*['"]completed['"]/i.test(input);
            return {
              passed: hasStatus,
              message: hasStatus ? "Correctly filters o.status = 'completed'." : "Filter where status = 'completed'.",
            };
          },
        },
        {
          id: "opt-group-by",
          name: "Clean GROUP BY on c.segment",
          points: 10,
          test: (input: string) => {
            const hasGroup = /group\s+by\s+c\.segment/i.test(input) || /group\s+by\s+segment/i.test(input);
            return {
              passed: hasGroup,
              message: hasGroup ? "Clean aggregation grouping." : "Aggregate with GROUP BY c.segment.",
            };
          },
        },
      ],
    },
    referenceCriteria: ["Explicit JOIN on c.id = o.customer_id", "Filter o.status = 'completed'", "Group by c.segment"],
    followupBank: [
      {
        id: "da-q2-f1",
        prompt: "How would you modify this query if you needed to retain enterprise customers with zero orders showing $0 revenue?",
        expectedKeyPoints: ["Use LEFT JOIN", "COALESCE on sum to return 0", "COUNT(o.id) instead of COUNT(*)"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "There is no join condition connecting customers to orders." },
      pointer: { deduction: 10, text: "Add JOIN orders o ON c.id = o.customer_id and filter status = 'completed'." },
      strong: { deduction: 20, text: "Use: SELECT c.segment, SUM(o.amount), COUNT(o.id), AVG(o.amount) FROM customers c JOIN orders o ON c.id = o.customer_id WHERE c.segment = 'Enterprise' AND o.status = 'completed' GROUP BY c.segment;" },
    },
  },

  // 3. Case Decision: Weekend Conversion Dip
  {
    client: {
      id: "da-q3-conversion-drop",
      pathSlug: "data-analytics",
      slug: "da-case-conversion-dip",
      type: "case_decision",
      title: "Case Decision: Root-Cause Investigation of Weekend Conversion Dip",
      scenario: "On Sunday morning, checkout conversion fell from 3.2% to 1.1%. Stakeholders suspect marketing changes or database locks. You have 20 minutes before an executive briefing.",
      prompt: "Select the most effective immediate diagnostic triage action and write a 2-3 sentence justification explaining what you will isolate first.",
      options: [
        { id: "opt-a", label: "Pause all active marketing campaigns across paid channels immediately." },
        { id: "opt-b", label: "Segment conversion by platform (iOS, Android, Web) and payment gateway to isolate where drop-offs concentrate." },
        { id: "opt-c", label: "Reboot production database instances to clear possible connection pool locks." },
        { id: "opt-d", label: "Wait until Monday morning to evaluate if the drop is an ordinary weekend fluctuation." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Dimensional segmentation by gateway/platform", "Avoid disruptive premature interventions", "Identify isolated vs systemic drop"],
    followupBank: [
      {
        id: "da-q3-f1",
        prompt: "If the failure isolates exclusively to iOS Apple Pay checkouts, what is your immediate cross-functional alert?",
        expectedKeyPoints: ["Alert iOS and payment engineering leads", "Provide customer service with workaround guidance", "Define isolated business impact boundary"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Isolate dimensions before applying disruptive operational changes." },
      pointer: { deduction: 10, text: "Option B pinpoints the affected subsystem without hurting revenue or hiding error logs." },
      strong: { deduction: 20, text: "Choose Option B: dimensional segmentation identifies the exact failing platform or gateway." },
    },
  },

  // 4. Interpret: Misleading Dual-Axis Chart
  {
    client: {
      id: "da-q4-dual-axis",
      pathSlug: "data-analytics",
      slug: "da-interpret-dual-axis",
      type: "interpret",
      title: "Interpret: Misleading Dual-Axis Marketing Chart",
      scenario: "A marketing deck shows a line chart with two Y-axes: Left axis (Ad Impressions in Millions, scale 0 to 10M) and Right axis (New Subscriptions, scale 1,000 to 1,050). The two lines track each other in parallel.",
      prompt: "Explain why this dual-axis chart is deceptive, what correlation it falsely implies, and how it should be presented honestly.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Different axis scales and narrow right axis range (1000-1050)", "Artificial visual alignment exaggerating tiny changes", "Recommendation: indexed baseline or normalized percentages"],
    followupBank: [
      {
        id: "da-q4-f1",
        prompt: "How would you re-plot this data to show stakeholders whether ad impressions genuinely drove incremental subscriptions?",
        expectedKeyPoints: ["Scatter plot of impressions vs subscriptions", "Zero-based axes", "Calculate Pearson/Spearman correlation coefficient"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Examine the scale range of the right axis compared to the left." },
      pointer: { deduction: 10, text: "The right axis only spans 50 units (1000 to 1050), making a 1% change look enormous." },
      strong: { deduction: 20, text: "The chart truncates the right axis to exaggerate a negligible fluctuation and fabricate visual correlation." },
    },
  },

  // 5. Triage: Data Team Backlog Under Capacity
  {
    client: {
      id: "da-q5-backlog-triage",
      pathSlug: "data-analytics",
      slug: "da-triage-backlog",
      type: "triage",
      title: "Triage / Prioritise: Sprint Backlog with 1 Engineer Available",
      scenario: "Due to illness, only 1 data engineer is available for the 3-day sprint. You have 4 urgent stakeholder requests.",
      prompt: "Rank these 4 tasks in order of operational priority (1 = highest) and justify your trade-offs.",
      options: [
        { id: "task-1", label: "Tax compliance financial audit report due to regulators in 48 hours." },
        { id: "task-2", label: "Executive dashboard aesthetic redesign requested by VP of Brand." },
        { id: "task-3", label: "Daily order ingestion pipeline failure preventing fulfillment status updates." },
        { id: "task-4", label: "Ad-hoc cohort export for an exploratory marketing brainstorm next week." },
      ],
      difficulty: "intermediate",
    },
    referenceCriteria: ["Order: Pipeline failure (3) or Regulatory audit (1) first, followed by audit/pipeline, exploratory ad-hoc next, brand redesign last", "Protects core revenue operations and legal compliance", "Deprioritizes cosmetic changes"],
    followupBank: [
      {
        id: "da-q5-f1",
        prompt: "How do you explain the postponement of the dashboard redesign to the VP of Brand without damaging trust?",
        expectedKeyPoints: ["Acknowledge value of redesign", "Explain regulatory and operational outage constraints", "Commit to specific follow-up window"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Prioritize operational continuity and legal regulatory requirements above cosmetic requests." },
      pointer: { deduction: 10, text: "Tasks 1 and 3 have existential consequences if delayed; Task 2 is purely aesthetic." },
      strong: { deduction: 20, text: "Rank Task 3 or Task 1 as top priority; Task 2 belongs last." },
    },
  },

  // 6. Fix It: SQL NULL Handling in Average Order
  {
    client: {
      id: "da-q6-sql-nulls",
      pathSlug: "data-analytics",
      slug: "da-fix-sql-null-averages",
      type: "fix_it",
      title: "Fix It: NULL Discount Impact in Revenue Metrics",
      scenario: "The billing system stores `NULL` in the `discount_amount` column when no promotional coupon was used. The current query calculates net revenue as `amount - discount_amount`, producing empty totals for full-price orders.",
      prompt: "Repair the query using `COALESCE` or `IFNULL` so that orders without discounts are computed properly.",
      starterContent: `SELECT order_id, amount, discount_amount, (amount - discount_amount) AS net_revenue\nFROM orders\nWHERE status = 'completed';`,
      difficulty: "foundation",
    },
    referenceCriteria: ["Uses COALESCE(discount_amount, 0) or IFNULL", "Explains that NULL in arithmetic evaluates to NULL", "Verifies net revenue outputs for full-price orders"],
    followupBank: [
      {
        id: "da-q6-f1",
        prompt: "Why does SQL evaluate `50 - NULL` as `NULL` rather than `50`?",
        expectedKeyPoints: ["Three-valued logic in SQL", "NULL represents unknown, not zero", "Arithmetic with unknown yields unknown"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "In SQL, any arithmetic with NULL returns NULL." },
      pointer: { deduction: 10, text: "Wrap `discount_amount` in `COALESCE(discount_amount, 0)`." },
      strong: { deduction: 20, text: "Change the expression to: `(amount - COALESCE(discount_amount, 0)) AS net_revenue`." },
    },
  },

  // 7. Spot Mistake: Indian Retail Festive Seasonality
  {
    client: {
      id: "da-q7-seasonality",
      pathSlug: "data-analytics",
      slug: "da-spot-seasonality-blindness",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Seasonality in Festive E-Commerce",
      scenario: "An automated forecasting agent analyzed sales for an e-commerce platform operating in Mumbai and Delhi.",
      prompt: "Find the erroneous assertion in the AI forecast where it misattributes festive seasonality to permanent growth, explain the flaw, and correct it.",
      starterContent: "October and November revenue grew by 140% compared to August. The model projects this 140% monthly momentum will compound steadily through January and February. Therefore, warehouse leasing must immediately triple to accommodate permanently elevated baseline demand.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "da-err-7",
        startChar: 80,
        endChar: 215,
        faultyText: "The model projects this 140% monthly momentum will compound steadily through January and February.",
        explanationKey: "October-November surge is festive Diwali/wedding seasonality, which drops sharply in post-festive January.",
        correctionKey: "Post-festive sales typically normalize; compound growth projections without seasonal adjustment will lead to costly excess warehouse leases.",
      },
    ],
    referenceCriteria: ["Identifies Diwali/festive seasonal spike", "Rejects compounding holiday momentum into Q1", "Warns against permanent warehouse overcapacity"],
    followupBank: [
      {
        id: "da-q7-f1",
        prompt: "What analytical technique should the team use instead of extrapolating recent monthly growth?",
        expectedKeyPoints: ["Year-over-year (YoY) comparison", "Seasonal decomposition (STL)", "Historical post-festive drop analysis"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "What holiday event happens in India in October/November?" },
      pointer: { deduction: 10, text: "Compounding Diwali festive demand into January ignores seasonal demand collapse." },
      strong: { deduction: 20, text: "Sentence 2 is wrong: October-November is festive seasonality and cannot compound into January." },
    },
  },

  // 8. Case Decision: Batch vs Stream for Fraud Detection
  {
    client: {
      id: "da-q8-batch-stream",
      pathSlug: "data-analytics",
      slug: "da-case-batch-vs-stream",
      type: "case_decision",
      title: "Case Decision: Architecture Trade-Off for High-Risk Card Fraud",
      scenario: "Account takeover incidents are causing financial losses within 90 seconds of compromised logins. The current data warehouse runs nightly batch ETL.",
      prompt: "Select the architectural solution and defend the infrastructure and latency trade-offs.",
      options: [
        { id: "opt-a", label: "Accelerate nightly batch ETL to run every 15 minutes." },
        { id: "opt-b", label: "Implement real-time event streaming (e.g. Kafka/Flink) with in-memory fraud rule evaluation." },
        { id: "opt-c", label: "Rely on end-of-month manual reconciliation and insurance claims." },
        { id: "opt-d", label: "Require mandatory 24-hour waiting periods on every single transaction." },
      ],
      difficulty: "intermediate",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Sub-second latency requirement vs 90-second fraud window", "Event-driven stream processing architecture", "Rejection of 15-minute batch as too slow for 90s window"],
    followupBank: [
      {
        id: "da-q8-f1",
        prompt: "What new operational risk does real-time stream processing introduce compared to batch warehousing?",
        expectedKeyPoints: ["Out-of-order events", "Backpressure management", "State management in distributed nodes"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can a 15-minute batch prevent a fraud action that happens in 90 seconds?" },
      pointer: { deduction: 10, text: "Event streaming allows millisecond detection before funds leave the account." },
      strong: { deduction: 20, text: "Select Option B: real-time streaming is necessary to intercept fraud within 90 seconds." },
    },
  },

  // 9. Interpret: Truncated Y-Axis Mobile Growth
  {
    client: {
      id: "da-q9-truncated-axis",
      pathSlug: "data-analytics",
      slug: "da-interpret-truncated-axis",
      type: "interpret",
      title: "Interpret: Truncated Bar Chart in Growth Pitch",
      scenario: "A startup pitch deck displays a bar chart comparing app market share: Competitor A: 48.2%, NextLearn: 49.1%. The Y-axis begins at 48.0% and ends at 49.5%, making NextLearn's bar look four times taller than Competitor A.",
      prompt: "Explain how this visualization misleads the viewer, what the actual difference is, and how to fix it.",
      difficulty: "foundation",
    },
    referenceCriteria: ["Truncated Y-axis baseline starting at 48.0%", "Exaggerates a 0.9% difference into a 4x visual advantage", "Best practice: baseline at 0 for bar charts"],
    followupBank: [
      {
        id: "da-q9-f1",
        prompt: "Are there ever valid scenarios where a non-zero axis is statistically appropriate?",
        expectedKeyPoints: ["Line charts showing high-frequency variations (e.g. stock prices)", "Scientific instruments measuring tiny variances", "Must never be done on bar charts where bar length represents value"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Where does the Y-axis start?" },
      pointer: { deduction: 10, text: "Bar charts encode value through height; starting at 48% distorts relative proportions." },
      strong: { deduction: 20, text: "The chart begins at 48.0%, making a 0.9% lead look 4x larger. Bar charts must start at zero." },
    },
  },

  // 10. Rewrite: Standardizing Metric Definition
  {
    client: {
      id: "da-q10-metric-def",
      pathSlug: "data-analytics",
      slug: "da-rewrite-active-user-def",
      type: "rewrite",
      title: "Rewrite: Defining 'Monthly Active User' (MAU) in Data Dictionary",
      scenario: "The current analytics documentation defines MAU as: 'Anyone who opens the app or gets a push notification during the month.' Marketing and engineering have conflicting interpretations.",
      prompt: "Rewrite the definition so it is unambiguous, measurable, distinguishes passive delivery from active intent, and specifies time boundaries.",
      starterContent: "MAU: Anyone who opens the app or gets a push notification during the month.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Requires authenticated user interaction / session start", "Explicitly excludes passive push notification receipt", "Defines exact calendar window (UTC timestamp 00:00 to 23:59)"],
    followupBank: [
      {
        id: "da-q10-f1",
        prompt: "Why is counting un-opened push notifications fatal to product engagement analytics?",
        expectedKeyPoints: ["Measures push server activity, not user attention", "Inflates MAU artificially", "Obscures real retention collapse"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Does a user receiving a background notification mean they actually engaged?" },
      pointer: { deduction: 10, text: "Specify that the user must perform an active foreground action or login event." },
      strong: { deduction: 20, text: "Exclude push receipts; define MAU as unique verified users who initiate a foreground session within the calendar month." },
    },
  },

  // 11. Triage: Data Pipeline SLA Breach Alerts
  {
    client: {
      id: "da-q11-sla-triage",
      pathSlug: "data-analytics",
      slug: "da-triage-sla-breach",
      type: "triage",
      title: "Triage / Prioritise: Multiple Data Pipeline Delay Alerts",
      scenario: "At 08:00 AM, four Airflow DAGs failed due to an upstream database lock.",
      prompt: "Rank these pipeline restorations in priority order and justify your decision.",
      options: [
        { id: "dag-1", label: "Hospital ER bed availability dashboard updated every 15 minutes." },
        { id: "dag-2", label: "Weekly customer marketing newsletter click-through archive." },
        { id: "dag-3", label: "Daily executive revenue KPI email scheduled for 09:00 AM." },
        { id: "dag-4", label: "Regulatory clinical incident compliance feed for health inspectors." },
      ],
      difficulty: "intermediate",
    },
    referenceCriteria: ["Rank: ER bed availability (1) first (patient safety), Compliance feed (4) second, Exec KPI (3) third, Marketing archive (2) last", "Life-critical operations take precedence over regulatory, and regulatory over internal reporting"],
    followupBank: [
      {
        id: "da-q11-f1",
        prompt: "What automated failover policy should be implemented for the ER bed availability DAG?",
        expectedKeyPoints: ["Dedicated connection pool", "High-priority queue", "Secondary replica failover"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Safety and patient outcomes always outrank financial and marketing reporting." },
      pointer: { deduction: 10, text: "ER beds (1) is life-critical; Newsletter archive (2) can wait days." },
      strong: { deduction: 20, text: "Order: 1 (ER beds) -> 4 (Compliance) -> 3 (Exec revenue) -> 2 (Newsletter archive)." },
    },
  },

  // 12. Fix It: SQL Window Running Total Error
  {
    client: {
      id: "da-q12-running-total",
      pathSlug: "data-analytics",
      slug: "da-fix-sql-running-total",
      type: "fix_it",
      title: "Fix It: Broken Cumulative Monthly Revenue Window Function",
      scenario: "The analyst wrote a window function to compute running cumulative revenue, but forgot the ordering clause, causing the query to output the grand total on every row.",
      prompt: "Fix the `SUM()` window function by adding `ORDER BY month` within the `OVER ()` clause so it accumulates progressively.",
      starterContent: `SELECT month, monthly_revenue, SUM(monthly_revenue) OVER () AS running_total\nFROM monthly_sales;`,
      difficulty: "intermediate",
    },
    referenceCriteria: ["Adds ORDER BY month inside OVER()", "Explains that OVER() without ORDER BY defaults to the whole partition", "Produces running progressive sum"],
    followupBank: [
      {
        id: "da-q12-f1",
        prompt: "What is the difference between `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` and `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` when duplicate months exist?",
        expectedKeyPoints: ["RANGE treats duplicates as identical peer rows", "ROWS evaluates row-by-row strictly", "RANGE can cause jump steps on duplicate values"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Without ORDER BY inside OVER(), the window spans all rows." },
      pointer: { deduction: 10, text: "Add `ORDER BY month` inside the parentheses." },
      strong: { deduction: 20, text: "Replace `OVER ()` with `OVER (ORDER BY month)`." },
    },
  },

  // 13. Spot Mistake: Correlation vs Causation in Marketing
  {
    client: {
      id: "da-q13-causation-error",
      pathSlug: "data-analytics",
      slug: "da-spot-correlation-causation",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Conflating Correlation with Causation",
      scenario: "An AI report claims that sending promotional SMS alerts caused a 40% increase in app orders.",
      prompt: "Find the sentence where the AI makes an unfounded causal claim, explain why the inference is flawed, and suggest a valid test.",
      starterContent: "Users who received our promotional SMS placed 40% more orders than users who did not. This proves conclusively that our SMS messages caused higher purchase behavior. Therefore, sending daily SMS notifications to all users will reliably boost revenue by 40%.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "da-err-13",
        startChar: 88,
        endChar: 180,
        faultyText: "This proves conclusively that our SMS messages caused higher purchase behavior.",
        explanationKey: "Selection bias: users who opt in to SMS alerts may already be high-intent buyers. Correlation does not prove causation without a randomized controlled trial.",
        correctionKey: "Users who opted in are likely more engaged to begin with; a randomized A/B test is required to establish incremental causality.",
      },
    ],
    referenceCriteria: ["Identifies self-selection bias in SMS opt-ins", "Rejects jumping from correlation to causation", "Recommends randomized control trial (A/B testing)"],
    followupBank: [
      {
        id: "da-q13-f1",
        prompt: "How would you design a rigorous test to measure the true incremental lift of SMS alerts?",
        expectedKeyPoints: ["Randomized holdout group", "Control group receiving no SMS", "Measure difference in incremental spend between groups"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Why might people who get SMS messages already be more likely to buy?" },
      pointer: { deduction: 10, text: "Sentence 2 claims 'proves conclusively' without accounting for selection bias." },
      strong: { deduction: 20, text: "The claim of causation in sentence 2 ignores that engaged users opted in; need an A/B test." },
    },
  },

  // 14. Case Decision: Handling Missing Demographic Data
  {
    client: {
      id: "da-q14-missing-data",
      pathSlug: "data-analytics",
      slug: "da-case-missing-demographics",
      type: "case_decision",
      title: "Case Decision: Managing 35% Missing Income in Credit Risk Model",
      scenario: "In a consumer loan application dataset, 35% of applicant records have `NULL` in the annual income field because the question was marked optional.",
      prompt: "Select the most defensible data strategy and explain your methodology.",
      options: [
        { id: "opt-a", label: "Drop all 35% of rows with missing income from the dataset entirely." },
        { id: "opt-b", label: "Impute missing values with the overall mean income ($65,000) for all missing records." },
        { id: "opt-c", label: "Analyze missingness mechanisms (MCAR/MAR/MNAR), create a missingness indicator column, and evaluate multiple imputation or sub-model routing." },
        { id: "opt-d", label: "Replace missing income with 0 so the model considers them high risk automatically." },
      ],
      difficulty: "advanced",
    },
    expectedChoiceId: "opt-c",
    referenceCriteria: ["Examines Missing Not At Random (MNAR) patterns", "Rejects dropping 35% of data as introduction of severe bias", "Recommends missingness flag indicator and multiple imputation"],
    followupBank: [
      {
        id: "da-q14-f1",
        prompt: "Why is mean imputation particularly dangerous for credit risk underwriting?",
        expectedKeyPoints: ["Artificially reduces variance", "Treats non-reporting applicants as average risk", "Can cause severe under-pricing of loan default risk"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Dropping 35% of data causes survival bias, while mean imputation distorts variance." },
      pointer: { deduction: 10, text: "Option C addresses the statistical nature of why the data is missing." },
      strong: { deduction: 20, text: "Select Option C: analyze missingness patterns and use indicator flags with principled imputation." },
    },
  },

  // 15. Interpret: Simpson's Paradox in Treatment Recovery
  {
    client: {
      id: "da-q15-simpsons-paradox",
      pathSlug: "data-analytics",
      slug: "da-interpret-simpsons-paradox",
      type: "interpret",
      title: "Interpret: Simpson's Paradox in Treatment Recovery Rates",
      scenario: "Overall dataset shows Treatment A has a 75% recovery rate and Treatment B has a 65% recovery rate. However, when split by illness severity:\n- Mild cases: Treatment A (90%), Treatment B (95%)\n- Severe cases: Treatment A (40%), Treatment B (50%)",
      prompt: "Explain how Treatment B is superior in both sub-groups yet appears inferior in aggregate. What is the confounding variable?",
      difficulty: "advanced",
    },
    referenceCriteria: ["Identifies Simpson's Paradox", "Points out confounding variable: Treatment B was given to far more severe cases", "Concludes Treatment B is actually more effective when controlling for severity"],
    followupBank: [
      {
        id: "da-q15-f1",
        prompt: "How can analysts prevent aggregate summaries from misleading clinical or operational decisions?",
        expectedKeyPoints: ["Stratified analysis", "Regression controlling for confounders", "Always inspect subgroup distributions"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Notice which treatment was given to more severe cases." },
      pointer: { deduction: 10, text: "This is Simpson's Paradox. The proportion of severe patients in each group skews the overall average." },
      strong: { deduction: 20, text: "Treatment B treated mostly severe patients; controlling for severity proves B is better in every category." },
    },
  },

  // 16. Fix It: Broken Date Truncation in SQL Cohort
  {
    client: {
      id: "da-q16-sql-date-trunc",
      pathSlug: "data-analytics",
      slug: "da-fix-sql-date-trunc",
      type: "fix_it",
      title: "Fix It: Month-Level Aggregation with Mixed Date Formats",
      scenario: "The query attempts to group orders by month using `SUBSTR(created_at, 1, 7)` but fails because some dates are stored as ISO timestamps and others as `DD/MM/YYYY`.",
      prompt: "Fix the query or explain the normalization approach using standard date parsing functions.",
      starterContent: `SELECT SUBSTR(created_at, 1, 7) AS order_month, COUNT(*) AS total_orders\nFROM orders\nGROUP BY order_month;`,
      difficulty: "intermediate",
    },
    referenceCriteria: ["Identifies fragility of substring on mixed formats", "Uses date parsing functions (STRFTIME or TO_DATE)", "Recommends schema level data cleaning"],
    followupBank: [
      {
        id: "da-q16-f1",
        prompt: "Why should date parsing be handled in the ingestion layer rather than ad-hoc queries?",
        expectedKeyPoints: ["Index performance", "Consistent time zone handling", "Prevents silent query bugs across teams"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Substring assumes exact character alignment which breaks on DD/MM/YYYY." },
      pointer: { deduction: 10, text: "Use proper date parsing functions or standardize at ingestion." },
      strong: { deduction: 20, text: "Use STRFTIME('%Y-%m', created_at) or standardize dates into ISO-8601 YYYY-MM-DD at ingestion." },
    },
  },

  // 17. Triage: Data Governance & Privacy vs Delivery
  {
    client: {
      id: "da-q17-privacy-triage",
      pathSlug: "data-analytics",
      slug: "da-triage-privacy-gdpr",
      type: "triage",
      title: "Triage / Prioritise: Privacy Incident vs Campaign Launch",
      scenario: "A user submits a legal 'Right to be Forgotten' deletion request under data protection laws while a marketing team asks for customer data for a major Black Friday push.",
      prompt: "Rank these 3 privacy and data actions and justify why compliance outranks commercial deadlines.",
      options: [
        { id: "act-1", label: "Execute verified GDPR/DPDP personal data erasure across customer databases." },
        { id: "act-2", label: "Extract customer email list for Black Friday email campaign launch." },
        { id: "act-3", label: "Audit whether erased customer identifiers are scrubbed from the marketing campaign list." },
      ],
      difficulty: "foundation",
    },
    referenceCriteria: ["Rank: 1 -> 3 -> 2", "Compliance and legal right-to-be-forgotten outranks marketing extraction", "Scrubbing must happen before campaign launch to avoid fines"],
    followupBank: [
      {
        id: "da-q17-f1",
        prompt: "What legal exposure does a company face if an erased customer receives a commercial marketing email?",
        expectedKeyPoints: ["Statutory privacy penalties", "Regulatory investigation", "Loss of consumer trust"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Privacy compliance is a legal requirement; marketing can wait for clean data." },
      pointer: { deduction: 10, text: "Erasing the data and ensuring it does not appear in the marketing list must precede campaign send." },
      strong: { deduction: 20, text: "Order: Act 1 (Erase) -> Act 3 (Scrub from list) -> Act 2 (Launch campaign)." },
    },
  },

  // 18. Spot Mistake: Underpowered A/B Test Conclusion
  {
    client: {
      id: "da-q18-ab-sample-size",
      pathSlug: "data-analytics",
      slug: "da-spot-ab-power-mistake",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Declaring A/B Winner After 4 Hours",
      scenario: "An optimization tool analyzed an A/B test on the homepage CTA button after running for 4 hours with 85 total visitors.",
      prompt: "Find the erroneous assertion where the AI declares a winner prematurely, explain why it is invalid, and state the minimum requirement.",
      starterContent: "Variant B achieved a 12% conversion rate while Variant A had 7% after 4 hours with 85 visitors. The system declares Variant B the definitive winner with 99% confidence. We should immediately push Variant B to 100% of traffic.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "da-err-18",
        startChar: 95,
        endChar: 180,
        faultyText: "The system declares Variant B the definitive winner with 99% confidence.",
        explanationKey: "Sample size of 85 visitors is severely underpowered; early stopping suffers from the 'peeking problem' and high false positive rates.",
        correctionKey: "The test must run until predetermined sample size and full weekly business cycles are reached.",
      },
    ],
    referenceCriteria: ["Identifies sample size (85 visitors) as statistically underpowered", "Highlights peeking problem / early stopping bias", "Requires full day-of-week cyclical coverage"],
    followupBank: [
      {
        id: "da-q18-f1",
        prompt: "What is statistical power and why does a small sample size fail to detect true effect sizes reliably?",
        expectedKeyPoints: ["Probability of avoiding Type II errors", "High variance in small samples", "Extreme fluctuations look significant purely by random chance"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can 85 visitors provide statistically sound conclusions?" },
      pointer: { deduction: 10, text: "Declaring 99% confidence after only 85 visitors is a classic early-stopping error." },
      strong: { deduction: 20, text: "Sentence 2 is wrong: 85 visitors cannot provide statistical significance; need larger sample and full weekly cycle." },
    },
  },

  // 19. Case Decision: Outlier Treatment in B2B Deals
  {
    client: {
      id: "da-q19-outlier-treatment",
      pathSlug: "data-analytics",
      slug: "da-case-b2b-outliers",
      type: "case_decision",
      title: "Case Decision: Managing an Outlier $500k Deal in Sales Forecasting",
      scenario: "A mid-market sales team usually closes deals between $15,000 and $40,000. Last week, a sovereign wealth enterprise contract for $500,000 closed unexpectedly.",
      prompt: "Select the most appropriate analytical handling of this $500k deal for next quarter's revenue forecast.",
      options: [
        { id: "opt-a", label: "Include the $500k deal in ordinary average deal size calculations and extrapolate for the next 4 quarters." },
        { id: "opt-b", label: "Delete the $500k record from the database so it never distorts historical data." },
        { id: "opt-c", label: "Segment the $500k deal into a bespoke Enterprise Tier while calculating mid-market baseline forecast with median or trimmed metrics." },
        { id: "opt-d", label: "Cap all future sales at $40,000 to keep the data clean." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-c",
    referenceCriteria: ["Segments bespoke outsized deals separately", "Uses robust metrics (median) for baseline forecasting", "Never deletes real transactional revenue"],
    followupBank: [
      {
        id: "da-q19-f1",
        prompt: "Why is the median superior to the mean when reporting typical deal values with extreme skew?",
        expectedKeyPoints: ["Median is robust to outliers", "Mean gets pulled by extreme large numbers", "Represents the realistic 50th percentile experience"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Don't delete real data, but don't let a one-off deal inflate the everyday forecast." },
      pointer: { deduction: 10, text: "Segmenting outsized enterprise deals protects the mid-market forecast." },
      strong: { deduction: 20, text: "Select Option C: segment large deals into a bespoke tier and use median for normal mid-market." },
    },
  },

  // 20. Rewrite: Database Downtime Executive Summary
  {
    client: {
      id: "da-q20-downtime-summary",
      pathSlug: "data-analytics",
      slug: "da-rewrite-downtime-summary",
      type: "rewrite",
      title: "Rewrite: Post-Mortem Executive Incident Summary",
      scenario: "An engineering intern wrote this status update after a database outage: 'Postgres died because WAL logs blew up the disk space since auto-vacuum was stuck. We killed the pids and flushed it.'",
      prompt: "Rewrite this message into a calm, professional executive update suitable for the Chief Operating Officer and Board.",
      starterContent: "Postgres died because WAL logs blew up the disk space since auto-vacuum was stuck. We killed the pids and flushed it.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Clear business impact and duration", "Non-defensive, structured root cause explanation in plain language", "Actionable preventative safeguard implemented"],
    followupBank: [
      {
        id: "da-q20-f1",
        prompt: "What key metric should always accompany an operational incident summary to executives?",
        expectedKeyPoints: ["Total downtime duration (MTTR)", "Business impact / lost orders", "Customer exposure percentage"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Replace technical jargon with clear business impact and preventative actions." },
      pointer: { deduction: 10, text: "State what happened, business impact, duration, resolution, and future safeguards." },
      strong: { deduction: 20, text: "Structure as: Incident Summary, Duration, Root Cause (disk maintenance process), Resolution, and Preventative Monitoring." },
    },
  },

  // 21. Fix It: Missing DISTINCT in Multi-Tag Order Join
  {
    client: {
      id: "da-q21-sql-distinct",
      pathSlug: "data-analytics",
      slug: "da-fix-sql-distinct-tags",
      type: "fix_it",
      title: "Fix It: Accidental Row Multiplication in Tagged Orders",
      scenario: "Joining orders to an `order_tags` table where orders have multiple tags causes `COUNT(o.id)` to count orders 3 to 4 times.",
      prompt: "Fix the query so it computes the true count of distinct orders.",
      starterContent: `SELECT o.status, COUNT(o.id) AS total_orders\nFROM orders o\nJOIN order_tags t ON o.id = t.order_id\nGROUP BY o.status;`,
      difficulty: "foundation",
    },
    referenceCriteria: ["Uses COUNT(DISTINCT o.id)", "Explains join fan-out when joining 1-to-many relationship", "Ensures correct order deduplication"],
    followupBank: [
      {
        id: "da-q21-f1",
        prompt: "What happens if you run `SUM(o.amount)` on this query without deduplication?",
        expectedKeyPoints: ["Revenue is multiplied by number of tags", "Severe financial overstatement", "Must aggregate orders before joining tags or use subqueries"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Each order has multiple tags, creating duplicate rows." },
      pointer: { deduction: 10, text: "Use `COUNT(DISTINCT o.id)` instead of `COUNT(o.id)`." },
      strong: { deduction: 20, text: "Change `COUNT(o.id)` to `COUNT(DISTINCT o.id)`." },
    },
  },

  // 22. Interpret: Heatmap Color Scale Distortion
  {
    client: {
      id: "da-q22-heatmap-scale",
      pathSlug: "data-analytics",
      slug: "da-interpret-heatmap-scale",
      type: "interpret",
      title: "Interpret: Distorted Color Gradient in Delivery Delay Heatmap",
      scenario: "A logistics dashboard displays delivery delay severity across 10 regions. The color scale uses a sharp threshold: 0 to 14 mins is deep green, while 15 to 16 mins is bright warning red.",
      prompt: "Explain why this binary cliff-edge threshold creates misleading operational panic.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Artificial cliff-edge visual cliff at 15 minutes", "14 mins vs 15 mins is visually depicted as safe vs crisis", "Recommends continuous linear gradient or percentile bins"],
    followupBank: [
      {
        id: "da-q22-f1",
        prompt: "How can visual thresholding lead delivery drivers to take dangerous driving shortcuts?",
        expectedKeyPoints: ["Panic to stay under arbitrary 14-min cutoff", "Drivers prioritize avoiding red flag over road safety", "Arbitrary cliff creates gaming behavior"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Look at the 1-minute difference between 14 mins and 15 mins." },
      pointer: { deduction: 10, text: "A 1-minute variance triggers an extreme color shift from green to red." },
      strong: { deduction: 20, text: "The abrupt cliff-edge color threshold exaggerates a 60-second difference into a visual emergency." },
    },
  },

  // 23. Spot Mistake: Hallucinated Standard Deviation
  {
    client: {
      id: "da-q23-standard-dev",
      pathSlug: "data-analytics",
      slug: "da-spot-std-dev-error",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Negative Standard Deviation in Latency Report",
      scenario: "An automated SLA analytics agent generated an API response latency report.",
      prompt: "Find the mathematically impossible assertion in the AI report, explain why it cannot exist, and state the correction.",
      starterContent: "Our average API response time was 120ms across all endpoints. The variance was calculated as 400ms squared, resulting in a standard deviation of -20ms. This negative standard deviation indicates our servers respond faster than the baseline average.",
      difficulty: "foundation",
    },
    plantedErrors: [
      {
        id: "da-err-23",
        startChar: 88,
        endChar: 172,
        faultyText: "resulting in a standard deviation of -20ms.",
        explanationKey: "Standard deviation is the non-negative square root of variance; it can never be negative.",
        correctionKey: "Standard deviation must be non-negative (+20ms, the principal square root of 400).",
      },
    ],
    referenceCriteria: ["Standard deviation cannot be negative", "Standard deviation is the positive square root of variance", "Rejects the claim that negative std dev means faster speed"],
    followupBank: [
      {
        id: "da-q23-f1",
        prompt: "What does a high standard deviation indicate about user experience compared to an average latency figure?",
        expectedKeyPoints: ["Inconsistency / jitter in response times", "P95 and P99 tail latency issues", "Unpredictable user experience"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can standard deviation ever be less than zero?" },
      pointer: { deduction: 10, text: "The square root of 400 variance is +20, not -20." },
      strong: { deduction: 20, text: "Standard deviation is mathematically non-negative; it is +20ms, not -20ms." },
    },
  },

  // 24. Case Decision: Gross Revenue vs Net Bookings
  {
    client: {
      id: "da-q24-gross-vs-net",
      pathSlug: "data-analytics",
      slug: "da-case-gross-vs-net",
      type: "case_decision",
      title: "Case Decision: Reporting Revenue with High Return Rates",
      scenario: "An e-commerce marketplace sells $1,000,000 worth of clothing in Q3, but historical return and refund rates are 30%. Sales leadership wants to report $1,000,000 as Q3 revenue to investors.",
      prompt: "Select the ethically and financially accurate metric and defend GAAP revenue recognition principles.",
      options: [
        { id: "opt-a", label: "Report $1,000,000 Gross Merchandise Value (GMV) and conceal refund rates in footnotes." },
        { id: "opt-b", label: "Clearly report GMV ($1,000,000) alongside Net Revenue ($700,000 after refund allowances) conforming to revenue recognition standards." },
        { id: "opt-c", label: "Report only $700,000 and do not mention gross transaction volume." },
        { id: "opt-d", label: "Wait 6 months until all returns are processed before releasing any financial reports." },
      ],
      difficulty: "intermediate",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Distinguishes GMV from recognized Net Revenue", "Recognizes refund reserve under accounting standards", "Transparency for investors and leadership"],
    followupBank: [
      {
        id: "da-q24-f1",
        prompt: "Why does conflating GMV with Net Revenue lead to catastrophic cash burn?",
        expectedKeyPoints: ["Overestimating working capital", "Committing to expenses based on illusory revenue", "Cash outflow on inventory and logistics refunds"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Both GMV and Net Revenue are valuable metrics when clearly distinguished." },
      pointer: { deduction: 10, text: "Option B provides complete transparency on volume and true net revenue." },
      strong: { deduction: 20, text: "Select Option B: report GMV alongside Net Revenue with clear refund allowances." },
    },
  },
];
