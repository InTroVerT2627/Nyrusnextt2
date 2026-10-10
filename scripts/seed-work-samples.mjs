import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envContent.split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .map(line => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function seedWorkSamples() {
  console.log("Seeding authentic work-sample tasks for all 3 learning paths...");

  // 1. Skill Nodes
  const nodes = [
    { id: 6, slug: "data-analytics-work-sample", title: "Data Analytics Work Sample", requires: [] },
    { id: 7, slug: "business-analytics-work-sample", title: "Business Analytics Work Sample", requires: [] },
    { id: 8, slug: "communication-work-sample", title: "Communication Work Sample", requires: [] },
  ];
  for (const node of nodes) {
    const { error } = await supabase.from("skill_nodes").upsert(node);
    if (error) console.error("Error inserting node:", node.slug, error);
  }

  // 2. Tasks
  const tasks = [
    {
      id: "10000000-0000-4000-8000-000000000011",
      slug: "sql-cohort-revenue",
      competency: "data-analytics",
      language: "JavaScript",
      difficulty: "Medium",
      skill_node_id: 6,
      mission_json: {
        title: "Q3 Customer Cohort Revenue & Retention Query",
        short_title: "SQL Cohort Analysis",
        severity: "Work Sample",
        description: "Write an SQL query on synthetic e-commerce data to aggregate completed revenue, order counts, and AOV by customer segment, accompanied by an insight memo.",
        symptom: "Leadership needs accurate segmentation to allocate sales engineering capacity.",
        plain_task: "Write a SQL query aggregating completed Q3 2026 revenue and order counts by customer segment, ordered by completed_revenue DESC."
      }
    },
    {
      id: "10000000-0000-4000-8000-000000000012",
      slug: "saas-unit-economics",
      competency: "business-analytics",
      language: "JavaScript",
      difficulty: "Medium",
      skill_node_id: 7,
      mission_json: {
        title: "SaaS Unit Economics & CAC Payback Model",
        short_title: "Unit Economics Model",
        severity: "Work Sample",
        description: "Model CAC, LTV, LTV:CAC, and Payback Period in a structured spreadsheet grid, followed by an executive capital allocation recommendation memo.",
        symptom: "Finance needs deterministic verification of unit economics before approving next quarter's acquisition budget.",
        plain_task: "Compute CAC, LTV, LTV:CAC, and Payback period from provided SaaS metrics and write a strategic risk recommendation memo."
      }
    },
    {
      id: "10000000-0000-4000-8000-000000000013",
      slug: "executive-incident-briefing",
      competency: "workplace-communication",
      language: "JavaScript",
      difficulty: "Medium",
      skill_node_id: 8,
      mission_json: {
        title: "P0 Billing Outage Executive & Client Escalation",
        short_title: "Incident Escalation",
        severity: "Work Sample",
        description: "Draft an executive incident postmortem and client communication memo for a P0 billing deadlock with a revise-after-feedback loop.",
        symptom: "Cross-functional stakeholders and external customers need accurate, calibrated communication with SLA commitments.",
        plain_task: "Draft executive internal and external client incident communications, calibrate tone and technical depth, and revise after automated feedback."
      }
    }
  ];

  for (const task of tasks) {
    const { error } = await supabase.from("tasks").upsert(task, { onConflict: "id" });
    if (error) console.error("Error inserting task:", task.slug, error);
  }

  // 3. Task Versions
  const versions = [
    {
      id: "20000000-0000-4000-8000-000000000011",
      task_id: "10000000-0000-4000-8000-000000000011",
      version: 1,
      prompt: "Aggregate Q3 2026 completed revenue, order counts, and average order value by customer segment from SQLite WASM database tables.",
      starter_code: `-- Write your SQL query below:
SELECT
  c.segment,
  ROUND(SUM(o.amount), 2) AS completed_revenue,
  COUNT(o.id) AS completed_orders,
  ROUND(AVG(o.amount), 2) AS avg_order_value
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN '2026-07-01' AND '2026-09-30'
GROUP BY c.segment
ORDER BY completed_revenue DESC;`,
      explanation_prompt: {
        headings: ["Query findings summary", "Operational implications", "Data caveats & limitations", "Next steps recommendation"]
      }
    },
    {
      id: "20000000-0000-4000-8000-000000000012",
      task_id: "10000000-0000-4000-8000-000000000012",
      version: 1,
      prompt: "Model CAC, LTV, LTV:CAC, and Payback period from the provided SaaS metrics and write an investment memo.",
      starter_code: `// Unit Economics Formula Definitions
const model = {
  cac: spend / customers,
  ltv: (mrr * grossMargin) / churnRate,
  ltvCacRatio: ltv / cac,
  paybackMonths: cac / (mrr * grossMargin)
};`,
      explanation_prompt: {
        headings: ["Unit economics summary", "Churn sensitivity analysis", "Capital allocation recommendation", "Downside risk mitigation"]
      }
    },
    {
      id: "20000000-0000-4000-8000-000000000013",
      task_id: "10000000-0000-4000-8000-000000000013",
      version: 1,
      prompt: "Draft an executive postmortem briefing and external customer advisory for the billing outage.",
      starter_code: `// Executive Incident Briefing & Customer Advisory
const memo = {
  executiveBriefing: "Internal postmortem for VP Engineering and Customer Ops...",
  customerAdvisory: "External transparency note for affected enterprise clients..."
};`,
      explanation_prompt: {
        headings: ["Executive summary & blast radius", "Technical root cause calibrated for stakeholders", "Customer advisory & SLA stance", "Preventative roadmap"]
      }
    }
  ];

  for (const v of versions) {
    const { error } = await supabase.from("task_versions").upsert(v, { onConflict: "task_id,version" });
    if (error) console.error("Error inserting version:", v.id, error);
  }

  // 4. Rubrics
  const rubrics = [
    {
      id: "30000000-0000-4000-8000-000000000011",
      task_id: "10000000-0000-4000-8000-000000000011",
      version: 1,
      criteria_json: {
        criteria: [
          { id: "query_correctness", title: "SQL Result Set Accuracy", weight: 40, max: 100, source: "tests" },
          { id: "metric_interpretation", title: "Metric Interpretation & Trade-offs", weight: 30, max: 3, source: "ai" },
          { id: "business_caveats", title: "Business Insight & Caveats", weight: 30, max: 2, source: "ai" }
        ]
      }
    },
    {
      id: "30000000-0000-4000-8000-000000000012",
      task_id: "10000000-0000-4000-8000-000000000012",
      version: 1,
      criteria_json: {
        criteria: [
          { id: "numeric_accuracy", title: "Unit Economics Formula Accuracy", weight: 40, max: 100, source: "tests" },
          { id: "sensitivity_analysis", title: "Churn Sensitivity & Risk Modeling", weight: 30, max: 3, source: "ai" },
          { id: "strategic_recommendation", title: "Strategic Capital Allocation", weight: 30, max: 2, source: "ai" }
        ]
      }
    },
    {
      id: "30000000-0000-4000-8000-000000000013",
      task_id: "10000000-0000-4000-8000-000000000013",
      version: 1,
      criteria_json: {
        criteria: [
          { id: "audience_awareness", title: "Audience Awareness & Tone Calibration", weight: 35, max: 3, source: "ai" },
          { id: "technical_clarity", title: "Technical Root Cause & Non-Jargon Clarity", weight: 35, max: 3, source: "ai" },
          { id: "actionability", title: "Actionability, Accountability & Preventative Controls", weight: 30, max: 2, source: "ai" }
        ]
      }
    }
  ];

  for (const r of rubrics) {
    const { error } = await supabase.from("rubrics").upsert(r, { onConflict: "task_id,version" });
    if (error) console.error("Error inserting rubric:", r.id, error);
  }

  // 5. Visible Test Cases
  const visibleCases = [
    {
      task_version_id: "20000000-0000-4000-8000-000000000011",
      ordinal: 1,
      title: "Segments present and ordered by revenue DESC",
      input_json: { query: "cohort_revenue" },
      expected_json: { segments: ["Enterprise", "Mid-Market", "SMB"], topSegment: "Enterprise" }
    },
    {
      task_version_id: "20000000-0000-4000-8000-000000000012",
      ordinal: 1,
      title: "Core unit economics calculations match standard SaaS equations",
      input_json: { spend: 50000, customers: 250, mrr: 120, grossMargin: 0.8, churn: 0.05 },
      expected_json: { cac: 200, ltv: 1920, ltvCacRatio: 9.6, paybackMonths: 2.08 }
    },
    {
      task_version_id: "20000000-0000-4000-8000-000000000013",
      ordinal: 1,
      title: "Postmortem structure and stakeholder coverage",
      input_json: { requiredSections: ["executiveBriefing", "customerAdvisory"] },
      expected_json: { complete: true, sectionsCovered: 2 }
    }
  ];

  for (const vc of visibleCases) {
    const { error } = await supabase.from("visible_test_cases").upsert(vc, { onConflict: "task_version_id,ordinal" });
    if (error) console.error("Error inserting visible case:", vc.title, error);
  }

  // 6. Hidden Test Suites
  const hiddenSuites = [
    {
      task_version_id: "20000000-0000-4000-8000-000000000011",
      test_spec: {
        cases: [
          { title: "Filters out refunded and pending orders", expected_enterprise_revenue: 32500, expected_orders: 3 },
          { title: "Filters exclusively for Q3 2026 timestamps", date_range: ["2026-07-01", "2026-09-30"] },
          { title: "Properly groups without duplicate row counting", distinct_segments: 3 }
        ]
      }
    },
    {
      task_version_id: "20000000-0000-4000-8000-000000000012",
      test_spec: {
        cases: [
          { title: "CAC formula checks division by acquired customers", formula: "spend / customers" },
          { title: "LTV formula incorporates gross margin discount", formula: "(mrr * grossMargin) / churn" },
          { title: "Payback tolerance check within 0.05 months", expected_payback: 2.08 }
        ]
      }
    },
    {
      task_version_id: "20000000-0000-4000-8000-000000000013",
      test_spec: {
        cases: [
          { title: "Contains no leaked internal PII or blaming individual engineers", safe: true },
          { title: "Specifies exact blast radius and financial recovery figures", metric_referenced: "$42,000" },
          { title: "Explicit commitment to database lock prevention in migration runner", prevent_clause: true }
        ]
      }
    }
  ];

  for (const hs of hiddenSuites) {
    const { error } = await supabase.from("hidden_test_suites").upsert(hs, { onConflict: "task_version_id" });
    if (error) console.error("Error inserting hidden suite:", hs.task_version_id, error);
  }

  // 7. Follow-up Bank
  const followups = [
    {
      task_id: "10000000-0000-4000-8000-000000000011",
      version: 1,
      trigger_json: { tags: ["always"] },
      question_template: "Why is it critical to filter by status = 'completed' before computing aggregate revenue, and how would pending orders bias AOV?",
      expected_key_points: ["Pending orders may not convert", "Including uncompleted orders overstates revenue and distorts AOV"],
      ordinal: 1
    },
    {
      task_id: "10000000-0000-4000-8000-000000000011",
      version: 1,
      trigger_json: { tags: ["always"] },
      question_template: "If an SMB customer signed up in Q3 but made zero orders, how does your query treat them, and when would a LEFT JOIN be required?",
      expected_key_points: ["INNER JOIN excludes zero-order customers", "LEFT JOIN preserves zero-order customers to show true cohort activation"],
      ordinal: 2
    },
    {
      task_id: "10000000-0000-4000-8000-000000000012",
      version: 1,
      trigger_json: { tags: ["always"] },
      question_template: "Why might a 9.6x LTV:CAC ratio suggest that the business is under-investing in acquisition rather than just being hyper-efficient?",
      expected_key_points: ["Very high LTV:CAC implies leaving market share on the table", "The company could increase CAC while remaining profitable to grow faster"],
      ordinal: 1
    },
    {
      task_id: "10000000-0000-4000-8000-000000000012",
      version: 1,
      trigger_json: { tags: ["always"] },
      question_template: "If monthly churn increases from 5% to 8%, by what percentage does Customer Lifetime Value decrease?",
      expected_key_points: ["LTV drops proportionally to churn increase", "Calculates drop from $1920 to $1200, a ~37.5% drop"],
      ordinal: 2
    },
    {
      task_id: "10000000-0000-4000-8000-000000000013",
      version: 1,
      trigger_json: { tags: ["always"] },
      question_template: "How does the phrasing in your executive postmortem differ from your external customer advisory, and why?",
      expected_key_points: ["Internal briefing focuses on root-cause mechanics and architectural fixes", "Customer advisory focuses on reassurance, timeline, and SLA commitment without confusing jargon"],
      ordinal: 1
    },
    {
      task_id: "10000000-0000-4000-8000-000000000013",
      version: 1,
      trigger_json: { tags: ["always"] },
      question_template: "Why should incident retrospectives strictly avoid naming individual engineers who ran the migration?",
      expected_key_points: ["Blameless postmortems foster psychological safety and honest reporting", "Systemic safeguards and test gates should prevent individual mistakes from reaching production"],
      ordinal: 2
    }
  ];

  for (const fu of followups) {
    const { error } = await supabase.from("followup_bank").upsert(fu);
    if (error) console.error("Error inserting followup:", fu.question_template, error);
  }

  console.log("Successfully seeded all 3 authentic work-sample tasks in Supabase!");
}

seedWorkSamples().catch(console.error);
