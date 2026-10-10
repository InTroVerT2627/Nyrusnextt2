import "server-only";
import initSqlJs from "sql.js";
import {
  FinalTestQuestionClient,
  FinalTestQuestionServer,
  PlantedError,
  TieredHints,
  FollowupQuestion,
  OptimalityRubric,
} from "@/lib/final-test-types";

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

// In-memory registry of question banks per path
const questionPools: Record<string, FinalTestQuestionServer[]> = {
  "data-analytics": [
    {
      client: {
        id: "da-q1-spot-churn",
        pathSlug: "data-analytics",
        slug: "spot-mistake-churn-cohort",
        type: "spot_mistake",
        title: "Spot the AI's Mistake: Churn Cohort Hallucination",
        scenario: "The internal analytics bot generated a monthly churn analysis summary for the executive team. However, it conflated gross cohort retention with surviving active counts.",
        prompt: "Review the AI summary below. Identify the erroneous sentence where the AI makes a mathematically impossible churn assertion, explain why it is false, and provide the correct calculation.",
        starterContent: "In Q1 2026, our Enterprise customer cohort showed remarkable stability. Starting with 100 enterprise accounts in January, we recorded 8 churned accounts in February and 4 in March. The automated system calculates that total churn for the quarter was therefore 4%, because the final month only lost 4 accounts. This represents an unprecedented 66% improvement in our customer retention rate.",
        difficulty: "intermediate",
      },
      plantedErrors: [
        {
          id: "err-churn-denominator",
          startChar: 177,
          endChar: 304,
          faultyText: "The automated system calculates that total churn for the quarter was therefore 4%, because the final month only lost 4 accounts.",
          explanationKey: "Quarterly churn is cumulative across the starting cohort (12 total churned out of 100 = 12% quarterly churn), not simply the isolated final month's percentage.",
          correctionKey: "Total quarterly churn rate was 12% (8 + 4 = 12 lost from the initial 100).",
        },
      ],
      referenceCriteria: [
        "Identifies that quarterly churn requires summing churned accounts over the starting cohort.",
        "Points out that 12 churned out of 100 equals 12% quarterly churn, not 4%.",
        "Notes that isolated month-end churn cannot replace cumulative quarterly churn.",
      ],
      followupBank: [
        {
          id: "da-q1-f1",
          prompt: "If 10 new Enterprise accounts were added during February, how should they be treated when reporting the January cohort's quarterly retention?",
          expectedKeyPoints: [
            "Separate cohort tracking",
            "Do not mix new February adds into the January denominator",
            "Preserve closed cohort integrity",
          ],
        },
        {
          id: "da-q1-f2",
          prompt: "Why would an executive be dangerously misled if this 4% figure had gone uncorrected into the board deck?",
          expectedKeyPoints: [
            "False sense of retention health",
            "Underestimating revenue churn",
            "Misallocating customer success resources",
          ],
        },
      ],
      hints: {
        nudge: { deduction: 5, text: "Focus on how the total quarterly churn rate was calculated from the monthly numbers." },
        pointer: { deduction: 10, text: "Check whether monthly churn counts were summed or if only the March number was used." },
        strong: { deduction: 20, text: "Look at sentence 3: 8 accounts churned in Feb and 4 in March means 12 total accounts churned from 100 (12%), not 4%." },
      },
    },
    {
      client: {
        id: "da-q2-fix-sql",
        pathSlug: "data-analytics",
        slug: "fix-sql-enterprise-aov",
        type: "fix_it",
        title: "Fix It: Broken Enterprise Revenue Query",
        scenario: "The finance team needs a summary of total completed revenue, completed order count, and average order value (AOV) for 'Enterprise' customers. The current query produces duplicate counts and includes cancelled orders.",
        prompt: "Fix the SQL query so it returns exactly 1 row with columns: `segment`, `total_revenue`, `order_count`, and `avg_order_value`. Exclude non-completed orders and optimize the query execution.",
        starterContent: `SELECT c.segment, SUM(o.amount) AS total_revenue, COUNT(*) AS order_count, AVG(o.amount) AS avg_order_value
FROM customers c, orders o
WHERE c.segment = 'Enterprise';`,
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

          // Acme (12000 + 8500 = 20500) + Gamma (15000) = 35500 over 3 completed orders
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
                message: hasJoin ? "Uses explicit join syntax." : "Avoid Cartesian cross products; specify join on c.id = o.customer_id.",
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
                message: hasStatus ? "Correctly filters o.status = 'completed'." : "Must filter orders where status = 'completed'.",
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
      followupBank: [
        {
          id: "da-q2-f1",
          prompt: "What happens to the result if a customer in the Enterprise segment has zero orders? How would you modify the query if you still needed that customer counted with $0 revenue?",
          expectedKeyPoints: [
            "INNER JOIN drops customers with zero orders",
            "Use LEFT JOIN to retain all customers",
            "COALESCE(SUM(o.amount), 0)",
          ],
        },
      ],
      hints: {
        nudge: { deduction: 5, text: "Notice the missing JOIN condition between customers and orders table." },
        pointer: { deduction: 10, text: "Add `JOIN orders o ON c.id = o.customer_id` and filter `o.status = 'completed'`." },
        strong: { deduction: 20, text: "Use `SELECT c.segment, SUM(o.amount), COUNT(o.id), AVG(o.amount) FROM customers c JOIN orders o ON c.id = o.customer_id WHERE c.segment = 'Enterprise' AND o.status = 'completed' GROUP BY c.segment;`" },
      },
    },
    {
      client: {
        id: "da-q3-case-drop",
        pathSlug: "data-analytics",
        slug: "case-conversion-drop",
        type: "case_decision",
        title: "Case Decision: Root-Cause Investigation of Weekend Conversion Dip",
        scenario: "On Sunday morning, checkout conversion fell from 3.2% to 1.1%. The VP of Growth suspects a broken marketing campaign. The infrastructure lead suspects a database bottleneck. You have 20 minutes before the executive call.",
        prompt: "Select the most effective immediate diagnostic triage action and write a 2-3 sentence justification explaining what you will isolate first.",
        options: [
          { id: "opt-a", label: "A. Pause the active marketing campaigns across all channels immediately." },
          { id: "opt-b", label: "B. Segment the conversion rate by platform (iOS, Android, Web) and payment gateway to isolate where drop-offs concentrate." },
          { id: "opt-c", label: "C. Restart the web servers and database instances to resolve potential resource locks." },
          { id: "opt-d", label: "D. Wait until Monday morning to gather a larger sample size before drawing conclusions." },
        ],
        difficulty: "foundation",
      },
      expectedChoiceId: "opt-b",
      referenceCriteria: [
        "Recommends dimensional segmentation (device, OS, payment gateway) before taking invasive actions.",
        "Recognizes that pausing marketing prematurely harms revenue without diagnosing the root cause.",
        "Recognizes that restarting production instances blindly risks masking live error logs.",
      ],
      followupBank: [
        {
          id: "da-q3-f1",
          prompt: "Suppose you find that the drop is isolated exclusively to iOS users trying to pay with Apple Pay. What is your next operational communication step?",
          expectedKeyPoints: [
            "Notify payment integration engineer / iOS team immediately",
            "Update customer support with work-around (use card instead of Apple Pay)",
            "Draft clear incident update with isolated impact boundary",
          ],
        },
      ],
      hints: {
        nudge: { deduction: 5, text: "Think about diagnostic isolation before taking disruptive actions." },
        pointer: { deduction: 10, text: "Option B allows you to pinpoint whether the issue is technical, payment-related, or traffic-specific without disrupting marketing or infrastructure." },
        strong: { deduction: 20, text: "Select Option B: segmenting by device and gateway immediately distinguishes frontend bugs from gateway timeouts." },
      },
    },
  ],
};

/**
 * Get full server-side questions for a path attempt
 */
export function getQuestionsForPath(pathSlug: string): FinalTestQuestionServer[] {
  return questionPools[pathSlug] || [];
}

/**
 * Safe client view for a question
 */
export function sanitizeQuestionForClient(
  question: FinalTestQuestionServer,
  order: number,
  revealedHints: { tier: "nudge" | "pointer" | "strong"; text: string; deduction: number }[] = []
): FinalTestQuestionClient {
  return {
    ...question.client,
    order,
    revealedHints,
    draftNotice: "Draft: needs human review. Fictional scenarios only.",
  };
}

/**
 * Register question bank additions dynamically (used in Phase 5)
 */
export function registerQuestions(pathSlug: string, questions: FinalTestQuestionServer[]) {
  if (!questionPools[pathSlug]) {
    questionPools[pathSlug] = [];
  }
  questionPools[pathSlug].push(...questions);
}
