import { FullModule, PublicLearningQuestion } from "@/lib/learning-experience-types";

const daModule1Questions: PublicLearningQuestion[] = [
  {
    id: "da1q1",
    prompt: "Which question is most ready for analysis?",
    choices: [
      "Did we do a good job?",
      "For new learners in September, did 7-day lesson completion change after the new flow?",
      "Can you make a chart about onboarding?",
    ],
  },
  {
    id: "da1q2",
    prompt: "Why define the unit of analysis?",
    choices: [
      "So each row represents a known kind of observation",
      "So the dataset has more rows",
      "So missing values disappear",
    ],
  },
  {
    id: "da1q3",
    prompt: "What should you clarify before comparing completion rates?",
    choices: [
      "Which chart color is preferred",
      "Whether completion means the same thing in both groups",
      "Whether the table has the newest file name",
    ],
  },
];

const baModule1Questions: PublicLearningQuestion[] = [
  {
    id: "ba1q1",
    prompt: "What should you clarify before calculating margin?",
    choices: [
      "Who is asking and what choice they need to make",
      "Which font the slide deck uses",
      "Whether the chart can be 3D",
    ],
  },
  {
    id: "ba1q2",
    prompt: "Why state what would change a decision?",
    choices: [
      "To avoid endless re-analysis after the result arrives",
      "To make the calculation take longer",
      "To hide negative results",
    ],
  },
  {
    id: "ba1q3",
    prompt: "Which problem statement is ready for work?",
    choices: [
      "The team feels busy",
      "In Q3, delivery cost per order rose 18%; should we renegotiate route fees or adjust minimums?",
      "We should look into operations",
    ],
  },
];

const commModule1Questions: PublicLearningQuestion[] = [
  {
    id: "comm1q1",
    prompt: "What should you determine first when drafting an update?",
    choices: [
      "Who the audience is and what they need to decide",
      "Which font looks most modern",
      "How many acronyms you can include",
    ],
  },
  {
    id: "comm1q2",
    prompt: "An executive asks for a launch status. Which opening is strongest?",
    choices: [
      "The launch succeeded on Friday with 99.8% uptime; two minor bugs are in triage.",
      "First we configured the DNS, then we ran into cache invalidation, then we re-deployed.",
      "Everyone worked very hard this weekend.",
    ],
  },
  {
    id: "comm1q3",
    prompt: "Why avoid unshared acronyms?",
    choices: [
      "They force readers to stop and guess instead of understanding the point",
      "They make documents look shorter",
      "They are forbidden by style guides",
    ],
  },
];

export const dataAnalyticsModule1: FullModule = {
  slug: "frame-the-question",
  title: "Frame the Question",
  pathSlug: "data-analytics",
  order: 1,
  storyArcId: "the-missing-orders",
  storyArcTitle: "The Missing Orders",
  estimatedMinutes: 8,
  status: "draft_needs_review",
  pages: [
    // Beat 1: TEASER
    {
      id: "da-m1-p1-teaser",
      pageType: "teaser",
      order: 1,
      minSecondsOverride: 10,
      content: {
        format: "choice",
        prompt: "What do you think 'Frame the question' is really about in real-world data analytics?",
        options: [
          "Formatting chart colors and polishing spreadsheet formulas.",
          "Defining the exact decision, population, metric, and time window before touching any data.",
          "Finding which backend engineer pushed the latest database migration.",
        ],
        revealReaction:
          "Exactly right. In production environments, more than 80% of flawed analyses result from answering an ambiguous or wrong question—not from syntax mistakes.",
        realTopic:
          "Analytical Framing: Transforming vague operational panics into focused, falsifiable, decision-ready investigations.",
      },
    },
    // Beat 2: STORY SCENE
    {
      id: "da-m1-p2-scene",
      pageType: "scene",
      order: 2,
      minSecondsOverride: 18,
      content: {
        sceneNumber: 1,
        character: "Meera",
        characterRole: "Junior Data Analyst",
        setting: "QuickBite Operations Center · 09:14 AM",
        visualMood: "urgent",
        sceneObjects: ["laptop", "coffee_mug", "dashboard_monitor", "sticky_notes"],
        narrative:
          "Meera barely unzips her backpack when Maya, VP of Operations, strides across the open floor with her phone buzzing continuously.\n\n'Meera, evening delivery orders vanished between 7 PM and 9 PM yesterday! Revenue is down, the Slack channel is on fire, and leadership wants to know why customers suddenly hate us. Pull all order rows from the database right now and find out what broke!'",
        dialogue: [
          { speaker: "Maya (VP Ops)", text: "Pull all orders right now! Tell me why customers hate our new update!" },
          { speaker: "Meera", text: "Give me two minutes to define the exact baseline before I query 20 million rows." },
        ],
        decisionBranch: {
          prompt: "How should Meera respond to Maya's initial panic?",
          choices: [
            {
              id: "choice-immediate-dump",
              label: "Immediately run 'SELECT * FROM orders' across the entire table to show fast action.",
              consequence:
                "The unindexed query saturates the read replica, locks staging dashboards, and dumps 400,000 raw rows that Maya cannot interpret.",
            },
            {
              id: "choice-frame-first",
              label: "Pause and ask: 'Which city, which app version, and are we comparing yesterday to last Tuesday or the 30-day average?'",
              consequence:
                "Maya stops pacing. 'Good catch. The complaint was specific to Bengaluru riders after the 2.4 Android release.' The investigation scope immediately narrows by 95%.",
            },
          ],
        },
      },
    },
    // Beat 3: CONCEPT
    {
      id: "da-m1-p3-concept",
      pageType: "concept",
      order: 3,
      minSecondsOverride: 24,
      content: {
        title: "The Four Anchors of an Analytical Question",
        chunks: [
          "Start with the decision, not the SQL query. An operational crisis almost always arrives as an emotional symptom: 'orders vanished' or 'retention plummeted'. An analyst's primary value is translation. Before writing code, you must determine who will act on the result and what specific operational choice hinges upon your finding.",
          "Every rigorous analytical question requires four concrete anchors: (1) Population: which exact users or entities are included? (2) Grain: what real-world observation does a single record represent? (3) Measure: what formula quantifies 'drop-off' or 'success'? (4) Time Window: what baseline comparison period prevents false alarms from daily seasonality?",
        ],
        glossaryTooltips: [
          {
            term: "Population",
            definition: "The exact boundary of users, transactions, or devices eligible for the analysis.",
          },
          {
            term: "Grain",
            definition: "The atomic real-world item represented by a single row in your dataset.",
          },
          {
            term: "Unit of Analysis",
            definition: "The level (e.g., rider, order, or customer-day) at which metrics are aggregated and compared.",
          },
        ],
      },
    },
    // Beat 4: WORKED EXAMPLE
    {
      id: "da-m1-p4-example",
      pageType: "example",
      order: 4,
      minSecondsOverride: 28,
      content: {
        title: "Deconstructing an Ambiguous Request",
        problem: "Executive Request: 'Did our new onboarding flow improve lesson completion?'",
        context: "A product manager wants to roll out the new flow company-wide based on a positive feeling.",
        steps: [
          {
            stepNumber: 1,
            title: "Isolate the Population",
            explanation: "Do not compare existing expert learners with newly registered signups.",
            calculationOrCode: "Population: First-time signups registered between Sep 1 and Sep 15.",
          },
          {
            stepNumber: 2,
            title: "Standardize the Time Window",
            explanation: "Allow each learner the exact same duration to attempt their first lesson.",
            calculationOrCode: "Window: 7 full days from account creation timestamp.",
          },
          {
            stepNumber: 3,
            title: "Define the Denominator and Numerator",
            explanation: "Raw completion counts mislead if signup volume changed.",
            calculationOrCode: "Metric: (Learners completing Lesson 1 within 7d) / (Total eligible signups in cohort)",
          },
        ],
        comparisonTable: {
          headers: ["Dimension", "Vague Question", "Framed Analytical Question"],
          rows: [
            ["Scope", "Did onboarding improve?", "Did 7-day lesson completion rate increase for Sep cohort?"],
            ["Population", "All users on app", "New signups who completed registration"],
            ["Metric", "Total completions (raw count)", "Completion percentage (% of registered cohort)"],
            ["Baseline", "Feels higher than last month", "Compared against August control cohort with identical 7-day window"],
          ],
        },
      },
    },
    // Beat 5: TRY IT
    {
      id: "da-m1-p5-tryit",
      pageType: "tryit",
      order: 5,
      content: {
        taskType: "choose_justify",
        prompt: "QuickBite's logistics director asks: 'Why are riders rejecting delivery orders this week?' Which of the following is the most decision-ready analytical question?",
        starterContext: "Available data: rider_events table (5M rows), dispatch_orders table, geo_tracking table.",
        choices: [
          {
            id: "opt-1",
            label: "Can we generate a pie chart showing order cancellations by day?",
            isCorrect: false,
            feedback: "Focuses on visual format rather than business decisions or causality.",
          },
          {
            id: "opt-2",
            label: "For active Bengaluru delivery riders between 7 PM–9 PM, did the proportion of rejected dispatches increase when estimated transit distance exceeded 5 km?",
            isCorrect: true,
            feedback: "Outstanding. It specifies the cohort (active Bengaluru riders), time window (7–9 PM), metric (rejection rate), and tests a specific operational hypothesis (trip distance).",
          },
          {
            id: "opt-3",
            label: "Are our delivery riders unhappy with customer tipping habits?",
            isCorrect: false,
            feedback: "An emotional sentiment hypothesis without observable behavioral metrics or measurable boundaries.",
          },
        ],
        expectedGuidance: "Select the option that defines population, metric rate, and comparison parameters.",
        reasoningExplanation: "Decision-ready questions specify the denominator, observation window, and testable condition.",
        explainItBackPrompt: "In one sentence: Why does reporting raw rejection counts fail to prove that rider behavior actually worsened?",
      },
    },
    // Beat 6: KNOWLEDGE CHECK
    {
      id: "da-m1-p6-check",
      pageType: "check",
      order: 6,
      content: {
        questions: daModule1Questions,
      },
    },
    // Beat 7: TAKEAWAY
    {
      id: "da-m1-p7-takeaway",
      pageType: "takeaway",
      order: 7,
      minSecondsOverride: 12,
      content: {
        summaryLines: [
          "An analysis can never be more precise than the question that framed it.",
          "Always anchor your query to a clear decision, population, grain, metric formula, and time window.",
          "Defend your analytical boundaries before querying databases to avoid chasing false correlations.",
        ],
        reflectionPrompt: "What is one time an ambiguous request led you down a rabbit hole of useless data?",
      },
    },
  ],
};

export const businessAnalyticsModule1: FullModule = {
  slug: "frame-the-business-problem",
  title: "Business Questions & Goals",
  pathSlug: "business-analytics",
  order: 1,
  storyArcId: "the-tea-stall-that-wanted-to-grow",
  storyArcTitle: "The Tea Stall That Wanted to Grow",
  estimatedMinutes: 8,
  status: "draft_needs_review",
  pages: [
    // Beat 1: TEASER
    {
      id: "ba-m1-p1-teaser",
      pageType: "teaser",
      order: 1,
      minSecondsOverride: 10,
      content: {
        format: "what_would_you_do",
        prompt: "A neighborhood bakery owner tells you: 'We are packed with customers every evening, so we must be making great profits!' What would you check first?",
        options: [
          "Congratulate them and recommend signing a lease for a second location tomorrow.",
          "Check whether the revenue from evening rushes actually covers rent, staff wages, and ingredient costs.",
          "Recommend spending more money on social media ads to make lines even longer.",
        ],
        revealReaction:
          "High foot traffic often hides negative unit economics. Being busy is not the same as being profitable.",
        realTopic:
          "Business Questions & Goals: Connecting commercial goals with operational realities and cost structures.",
      },
    },
    // Beat 2: STORY SCENE
    {
      id: "ba-m1-p2-scene",
      pageType: "scene",
      order: 2,
      minSecondsOverride: 18,
      content: {
        sceneNumber: 1,
        character: "Ravi",
        characterRole: "Operations Advisor",
        setting: "ChaiPoint Corner Tea Stall · 04:30 PM",
        visualMood: "focused",
        sceneObjects: ["kettle", "tea_glasses", "cash_box", "notebook"],
        narrative:
          "The aroma of crushed ginger and cardamom fills the street corner. Customers stand three deep around Aunt Meenakshi's tea stall, handing over rupee coins while two assistants boil fresh milk.\n\nMeenakshi beams at Ravi while wiping down the stainless steel counter. 'Look at this crowd, Ravi! We sold 800 cups today alone. A broker offered me a commercial lease for a second outlet near the tech park. Should we sign it before someone else grabs it?'",
        dialogue: [
          { speaker: "Aunt Meenakshi", text: "We sold 800 cups today! We are always busy. Let us sign the lease for store two!" },
          { speaker: "Ravi", text: "Before we sign a five-year lease, let us figure out how much cash actually stays in the tin at the end of the month." },
        ],
        decisionBranch: {
          prompt: "What should Ravi examine before answering Meenakshi's expansion question?",
          choices: [
            {
              id: "choice-rush-lease",
              label: "Trust the crowds and encourage her to sign the lease before rent prices climb.",
              consequence:
                "If fixed overhead and ingredient inflation exceed gross margins, doubling locations doubles monthly cash burn.",
            },
            {
              id: "choice-audit-economics",
              label: "Ask to see the ingredient receipts, milk vendor invoices, and electricity bills for the last 90 days.",
              consequence:
                "Meenakshi pulls out a tin box of crumpled receipts. A clear, disciplined look at unit economics begins.",
            },
          ],
        },
      },
    },
    // Beat 3: CONCEPT
    {
      id: "ba-m1-p3-concept",
      pageType: "concept",
      order: 3,
      minSecondsOverride: 24,
      content: {
        title: "The Architecture of Commercial Decisions",
        chunks: [
          "A business goal is not just an ambition ('we want to grow'); it is a targeted trade-off between growth, profitability, and operational risk. In business analytics, your role is to translate broad commercial intent into an accountable financial and operational framework.",
          "Every commercial expansion decision must answer three primary questions: (1) Unit Viability: does each individual transaction generate positive contribution margin after direct costs? (2) Fixed Cost Absorption: does total monthly volume reliably cover rent, equipment depreciation, and base salaries? (3) Cash Runway: does the business possess sufficient liquidity to survive the months required for a new branch to reach break-even?",
        ],
        glossaryTooltips: [
          {
            term: "Contribution Margin",
            definition: "Selling price minus variable direct costs per unit sold.",
          },
          {
            term: "Break-Even Point",
            definition: "The sales volume where total revenues exactly equal total costs.",
          },
          {
            term: "Fixed Costs",
            definition: "Expenses that do not change with sales volume, such as store rent and insurance.",
          },
        ],
      },
    },
    // Beat 4: WORKED EXAMPLE
    {
      id: "ba-m1-p4-example",
      pageType: "example",
      order: 4,
      minSecondsOverride: 28,
      content: {
        title: "Evaluating a Retail Expansion Decision",
        problem: "ChaiPoint Corner sells 800 cups of masala chai per day at ₹15 per cup. Should they open Branch 2 with ₹30,000 monthly rent?",
        context: "Ravi tabulates daily ingredient usage and monthly fixed obligations.",
        steps: [
          {
            stepNumber: 1,
            title: "Calculate Gross Daily Revenue",
            explanation: "800 cups × ₹15/cup",
            calculationOrCode: "Daily Revenue = ₹12,000 (Monthly @ 26 days = ₹312,000)",
          },
          {
            stepNumber: 2,
            title: "Calculate Direct Variable Unit Cost",
            explanation: "Milk (₹5.50) + Tea leaves & spices (₹2.00) + Sugar & gas (₹1.50) + Paper cups (₹1.00)",
            calculationOrCode: "Variable Cost per Cup = ₹10.00 → Contribution Margin = ₹5.00/cup (33.3%)",
          },
          {
            stepNumber: 3,
            title: "Determine New Store Break-Even Volume",
            explanation: "Rent (₹30,000) + 2 Staff (₹35,000) + Power (₹5,000) = ₹70,000 Fixed Costs",
            calculationOrCode: "Break-Even = ₹70,000 / ₹5.00 margin = 14,000 cups/month (538 cups/day required just to break even)",
          },
        ],
        comparisonTable: {
          headers: ["Financial Metric", "Current Stall (Stall 1)", "Projected Branch 2 (Tech Park)"],
          rows: [
            ["Monthly Fixed Overhead", "₹22,000 (Kiosk fee)", "₹70,000 (Commercial store lease + staff)"],
            ["Break-Even Daily Cups", "169 cups/day", "538 cups/day"],
            ["Safety Margin", "79% cushion (sells 800)", "High risk until steady customer base forms"],
          ],
        },
      },
    },
    // Beat 5: TRY IT
    {
      id: "ba-m1-p5-tryit",
      pageType: "tryit",
      order: 5,
      content: {
        taskType: "choose_justify",
        prompt: "A SaaS startup reports 50% month-over-month revenue growth, but their bank balance dropped from ₹20 Lakhs to ₹4 Lakhs in 60 days. What is the fundamental business issue?",
        starterContext: "Monthly Revenue: ₹10L → ₹15L. Monthly Marketing Spend: ₹18L. Customer Churn: 25%/month.",
        choices: [
          {
            id: "ba-opt-1",
            label: "They need to redesign their product logo to improve brand awareness.",
            isCorrect: false,
            feedback: "Cosmetic branding does not resolve rapid cash burn or negative unit economics.",
          },
          {
            id: "ba-opt-2",
            label: "Customer Acquisition Cost (CAC) and high churn mean they are buying unprofitable growth that will deplete cash before break-even.",
            isCorrect: true,
            feedback: "Correct. High top-line growth fueled by unsustainable customer acquisition spend drains working capital.",
          },
          {
            id: "ba-opt-3",
            label: "Revenue growth is too slow; they should double their marketing budget.",
            isCorrect: false,
            feedback: "Increasing marketing spend when each customer produces negative lifetime value accelerates insolvency.",
          },
        ],
        expectedGuidance: "Evaluate the relationship between revenue velocity, unit costs, and cash runway.",
        reasoningExplanation: "Growth without positive unit economics burns cash faster as scale increases.",
        explainItBackPrompt: "In one sentence: Why can a company go bankrupt while reporting record revenue numbers?",
      },
    },
    // Beat 6: KNOWLEDGE CHECK
    {
      id: "ba-m1-p6-check",
      pageType: "check",
      order: 6,
      content: {
        questions: baModule1Questions,
      },
    },
    // Beat 7: TAKEAWAY
    {
      id: "ba-m1-p7-takeaway",
      pageType: "takeaway",
      order: 7,
      minSecondsOverride: 12,
      content: {
        summaryLines: [
          "High transaction activity is not evidence of commercial health.",
          "Every expansion or product decision must prove positive contribution margin before scaling.",
          "Calculate fixed cost break-even hurdles before committing to long-term liabilities.",
        ],
        reflectionPrompt: "How can you distinguish between vanity metrics and financial health in your own work?",
      },
    },
  ],
};

export const communicationModule1: FullModule = {
  slug: "know-your-audience",
  title: "Know Your Audience",
  pathSlug: "communication",
  order: 1,
  storyArcId: "the-update-nobody-read",
  storyArcTitle: "The Update Nobody Read",
  estimatedMinutes: 8,
  status: "draft_needs_review",
  pages: [
    // Beat 1: TEASER
    {
      id: "comm-m1-p1-teaser",
      pageType: "teaser",
      order: 1,
      minSecondsOverride: 10,
      content: {
        format: "think_first",
        prompt: "When you send a critical technical status update to busy senior leadership, what do they care about most in the first 10 seconds?",
        options: [
          "The chronological story of how hard the engineering team worked all night.",
          "The immediate bottom-line impact, current system status, and what action is required from them.",
          "A comprehensive stack trace showing all 45 error codes.",
        ],
        revealReaction:
          "Senior decision-makers read upside down: outcome first, action required second, deep technical history only on request.",
        realTopic:
          "Executive Communication: Calibrating message structure, density, and terminology to your audience's context.",
      },
    },
    // Beat 2: STORY SCENE
    {
      id: "comm-m1-p2-scene",
      pageType: "scene",
      order: 2,
      minSecondsOverride: 18,
      content: {
        sceneNumber: 1,
        character: "Kiran",
        characterRole: "Junior Infrastructure Engineer",
        setting: "PulseCare Health Systems · 10:45 AM",
        visualMood: "pensive",
        sceneObjects: ["desk_monitor", "hospital_badge", "terminal_screen", "email_draft"],
        narrative:
          "Kiran worked from 6 AM to resolve a database replication bottleneck on the hospital telemetry cluster. Exhausted but proud, Kiran writes a detailed six-page email containing socket connection metrics, Linux kernel TCP buffer settings, and a step-by-step log of every terminal command executed.\n\nFive minutes later, the Chief Medical Officer and the VP of Operations reply in panic on the thread: 'Wait! Are hospital patient monitors offline right now or not? Can doctors discharge patients?!'",
        dialogue: [
          { speaker: "Dr. Aris (CMO)", text: "I cannot read through 80 paragraphs of Linux logs. Are the ICU monitors safe right now or not?!" },
          { speaker: "Kiran", text: "They were always safe—the issue was only a secondary reporting replica! But my email didn't state that until page 5." },
        ],
        decisionBranch: {
          prompt: "How should Kiran adjust communication strategy for clinical and executive leadership?",
          choices: [
            {
              id: "choice-defend-detail",
              label: "Reply explaining that medical officers should read technical documentation fully before panicking.",
              consequence:
                "Trust erodes further. Hospital leadership escalates to the VP of Engineering about poor operational communication.",
            },
            {
              id: "choice-bottom-line-first",
              label: "Adopt the BLUF framework (Bottom Line Up Front): State system safety in sentence 1, impact in sentence 2, and link logs as an appendix.",
              consequence:
                "CMO responds: 'Thank you for the quick confirmation. Telemetry is clear. Great work team.'",
            },
          ],
        },
      },
    },
    // Beat 3: CONCEPT
    {
      id: "comm-m1-p3-concept",
      pageType: "concept",
      order: 3,
      minSecondsOverride: 24,
      content: {
        title: "Audience-Centric Communication Architecture",
        chunks: [
          "Technical professionals are trained to communicate chronologically: 'First I investigated problem X, then I ran script Y, and finally at 10 AM we reached conclusion Z.' Executives and cross-functional partners read in reverse: they require the conclusion and the required decision in the opening two sentences.",
          "Calibrating your communication requires identifying your audience's core concern: (1) Executives care about customer impact, financial risk, and deadlines. (2) Peer engineers care about technical root causes, reproducible diffs, and architectural trade-offs. (3) Operations partners care about what they should tell affected customers right now.",
        ],
        glossaryTooltips: [
          {
            term: "BLUF",
            definition: "Bottom Line Up Front: structuring messages with the conclusion and required action in the first paragraph.",
          },
          {
            term: "Cognitive Load",
            definition: "The amount of mental effort required for a reader to extract actionable meaning from your message.",
          },
          {
            term: "Executive Summary",
            definition: "A concise 2-3 sentence overview that enables busy leaders to make informed decisions without reading appendices.",
          },
        ],
      },
    },
    // Beat 4: WORKED EXAMPLE
    {
      id: "comm-m1-p4-example",
      pageType: "example",
      order: 4,
      minSecondsOverride: 28,
      content: {
        title: "Transforming an Incident Report for Cross-Functional Leaders",
        problem: "An engineer needs to notify non-technical managers that a payment gateway outage was resolved.",
        context: "Weak communication creates unnecessary escalation; improved communication builds confidence.",
        steps: [
          {
            stepNumber: 1,
            title: "Lead with Operational Status",
            explanation: "State immediately whether service is restored and safe.",
            calculationOrCode: "Status: RESOLVED. All payment transactions operating normally as of 10:15 AM.",
          },
          {
            stepNumber: 2,
            title: "Quantify the Customer Impact",
            explanation: "State scope cleanly so customer support can handle tickets.",
            calculationOrCode: "Impact: 142 checkout attempts failed between 09:45–10:15 AM (approx ₹85,000). Automated retries succeeded for 118 users.",
          },
          {
            stepNumber: 3,
            title: "Outline Immediate Next Steps",
            explanation: "Identify who is doing what next without burying readers in technical minutiae.",
            calculationOrCode: "Next Step: Support team is emailing the remaining 24 affected customers with direct retry links.",
          },
        ],
        communicationDiff: {
          weak: "Hey all,\nAt 09:45 we noticed TCP keepalive timeouts on gateway node 4. I checked the Nginx reverse proxy logs and saw 502 bad gateway headers coming from port 8080. We tried restarting systemd service payment-worker-3 but thread pools were deadlocked due to Redis connection exhaustion. After increasing maxclients from 10000 to 20000 and running a rolling reload across cluster eu-west-1, the healthchecks passed.\nLet me know if questions.",
          improved: "Team — Payment processing has been fully restored as of 10:15 AM.\n\n• Status: Normal operations resumed (All systems green).\n• Customer Impact: 142 transactions stalled during a 30-min window (09:45–10:15 AM). 118 recovered automatically.\n• Action Required: Support team is contacting the remaining 24 customers with payment links.\n• Root Cause: Connection bottleneck between worker processes and internal cache. Permanent fix is scheduled for Friday release.",
          annotations: [
            "Clear status headline removes panic in first 2 seconds.",
            "Bullet points reduce cognitive reading load.",
            "Customer support knows exactly what to do next.",
            "Complex technical architecture summarized in 1 sentence for general audience.",
          ],
        },
      },
    },
    // Beat 5: TRY IT
    {
      id: "comm-m1-p5-tryit",
      pageType: "tryit",
      order: 5,
      content: {
        taskType: "rewrite_sentence",
        prompt: "Rewrite this confusing technical update into an effective 2-sentence executive summary for the VP of Customer Success:",
        starterContext: "Draft: 'The cron job sync_users_table.py encountered an unhandled NullPointerException at line 144 because someone passed an empty string in the phone_number JSON key so the webhook stopped firing for 40 minutes.'",
        choices: [
          {
            id: "comm-opt-1",
            label: "User profile syncing was interrupted for 40 minutes due to missing phone data. System is restored, and all pending profile updates have been safely re-synced.",
            isCorrect: true,
            feedback: "Spot on. Clear business impact, current recovery state, and zero jargon.",
          },
          {
            id: "comm-opt-2",
            label: "Python threw a NullPointerException because of phone_number bugs in the webhook parser on line 144.",
            isCorrect: false,
            feedback: "Still relies on code-level implementation details that the VP of Customer Success cannot action.",
          },
        ],
        expectedGuidance: "Focus on user impact and operational resolution rather than code line numbers.",
        reasoningExplanation: "Executives require the business consequence and current status, not debugging traces.",
        explainItBackPrompt: "In one sentence: Why does leading with technical excuses make an engineering team sound less reliable?",
      },
    },
    // Beat 6: KNOWLEDGE CHECK
    {
      id: "comm-m1-p6-check",
      pageType: "check",
      order: 6,
      content: {
        questions: commModule1Questions,
      },
    },
    // Beat 7: TAKEAWAY
    {
      id: "comm-m1-p7-takeaway",
      pageType: "takeaway",
      order: 7,
      minSecondsOverride: 12,
      content: {
        summaryLines: [
          "High technical competence is invisible if your communication creates confusion.",
          "Lead with the bottom line: status first, customer impact second, action items third.",
          "Calibrate detail to your audience: save terminal logs for engineers and provide clear decisions for leaders.",
        ],
        reflectionPrompt: "Think of an email you received this week. Did you know what was expected of you in the first 10 seconds?",
      },
    },
  ],
};

export const seededModulesMap: Record<string, FullModule> = {
  "data-analytics/frame-the-question": dataAnalyticsModule1,
  "business-analytics/frame-a-decision": businessAnalyticsModule1,
  "business-analytics/frame-the-business-problem": businessAnalyticsModule1,
  "communication/read-the-room": communicationModule1,
  "communication/know-your-audience": communicationModule1,
};

const DATA_ARC_SCENES = [
  { setting: "QuickBite Operations Center · 09:14 AM", mood: "urgent" as const, objects: ["laptop", "coffee_mug", "dashboard_monitor", "sticky_notes"] },
  { setting: "Database Console & Schema Inspector · 10:30 AM", mood: "focused" as const, objects: ["sql_terminal", "schema_diagram", "coffee_mug"] },
  { setting: "Staging Data Warehouse · 11:45 AM", mood: "focused" as const, objects: ["data_grid", "server_stack", "sticky_notes"] },
  { setting: "Analytics Desk & Distribution Plots · 01:15 PM", mood: "pensive" as const, objects: ["box_plot", "laptop", "calculator"] },
  { setting: "Production SQL Sandbox · 02:40 PM", mood: "focused" as const, objects: ["sql_terminal", "dashboard_monitor", "notebook"] },
  { setting: "Join Validation Lab · 03:50 PM", mood: "urgent" as const, objects: ["schema_diagram", "server_stack", "laptop"] },
  { setting: "Cohort Workbench · 04:30 PM", mood: "focused" as const, objects: ["cohort_table", "dashboard_monitor", "sticky_notes"] },
  { setting: "Data Visualization Studio · 05:15 PM", mood: "pensive" as const, objects: ["chart_wireframe", "laptop", "color_palette"] },
  { setting: "Impact Assessment Room · 06:00 PM", mood: "focused" as const, objects: ["experiment_log", "laptop", "coffee_mug"] },
  { setting: "Executive Boardroom · 07:15 PM", mood: "triumphant" as const, objects: ["projector_screen", "executive_table", "final_brief"] },
];

const BUSINESS_ARC_SCENES = [
  { setting: "Flagship Chai Stall, Koramangala · 08:30 AM", mood: "urgent" as const, objects: ["tea_kettle", "cash_register", "counter"] },
  { setting: "Kitchen Operations & Recipe Station · 10:00 AM", mood: "focused" as const, objects: ["milk_crates", "recipe_board", "inventory_sheet"] },
  { setting: "Morning Rush Counter · 11:30 AM", mood: "urgent" as const, objects: ["strainer_pot", "order_queue", "timer"] },
  { setting: "Customer Survey Table · 01:00 PM", mood: "pensive" as const, objects: ["clipboard", "tea_cup", "notes"] },
  { setting: "Unit Economics Spreadsheet Desk · 02:30 PM", mood: "focused" as const, objects: ["calculator", "spreadsheet_grid", "laptop"] },
  { setting: "Scenario Modeling Whiteboard · 03:45 PM", mood: "focused" as const, objects: ["whiteboard", "markers", "scenario_matrix"] },
  { setting: "Variance Breakdown Counter · 04:45 PM", mood: "pensive" as const, objects: ["daily_ledger", "receipt_tape", "laptop"] },
  { setting: "Experiment Matrix Station · 05:30 PM", mood: "focused" as const, objects: ["pilot_log", "test_batch", "sticky_notes"] },
  { setting: "Stall Strategy Review · 06:15 PM", mood: "focused" as const, objects: ["recommendation_memo", "tea_kettle", "laptop"] },
  { setting: "Investor & Growth Briefing · 07:00 PM", mood: "triumphant" as const, objects: ["pitch_deck", "business_case_binder", "banner"] },
];

const COMM_ARC_SCENES = [
  { setting: "Incident War Room · 09:00 AM", mood: "urgent" as const, objects: ["incident_board", "laptop", "red_phone"] },
  { setting: "Slack Broadcast Command · 10:15 AM", mood: "focused" as const, objects: ["slack_window", "laptop", "sticky_notes"] },
  { setting: "Documentation Forge · 11:30 AM", mood: "focused" as const, objects: ["markdown_editor", "diff_viewer", "coffee_mug"] },
  { setting: "Cross-Functional Sync Space · 01:30 PM", mood: "pensive" as const, objects: ["meeting_table", "whiteboard", "notebook"] },
  { setting: "Evidence Verification Desk · 02:45 PM", mood: "focused" as const, objects: ["telemetry_graphs", "laptop", "audit_log"] },
  { setting: "Private Coaching Room · 04:00 PM", mood: "pensive" as const, objects: ["sofa", "notepad", "feedback_guide"] },
  { setting: "Postmortem Conference Hall · 04:45 PM", mood: "focused" as const, objects: ["timeline_chart", "action_item_board", "microphone"] },
  { setting: "Asynchronous Handoff Terminal · 05:30 PM", mood: "focused" as const, objects: ["time_zone_clocks", "laptop", "handover_doc"] },
  { setting: "VP Q&A Amphitheater · 06:15 PM", mood: "urgent" as const, objects: ["podium", "slide_clicker", "qna_screen"] },
  { setting: "Leadership Alignment Summit · 07:00 PM", mood: "triumphant" as const, objects: ["signed_roadmap", "conference_table", "laptop"] },
];

export type PublicModuleInput = {
  slug: string;
  title: string;
  summary: string;
  objectives: string[];
  lesson: { heading: string; body: string }[];
  scenario: string;
  questions: PublicLearningQuestion[];
};

export function getFullModule(
  pathSlug: "data-analytics" | "business-analytics" | "communication" | string,
  pathTitle: string,
  module: PublicModuleInput,
  index: number
): FullModule {
  const key = `${pathSlug}/${module.slug}`;
  if (seededModulesMap[key]) {
    return seededModulesMap[key];
  }

  // Synthesize a structured 7-beat module for paths/modules pending bespoke arcs
  const character = pathSlug === "data-analytics" ? "Meera" : pathSlug === "business-analytics" ? "Rohan" : "Ananya";
  const characterRole = pathSlug === "data-analytics" ? "Junior Data Analyst" : pathSlug === "business-analytics" ? "Business Strategist" : "Engineering Lead";
  const storyArcTitle = pathSlug === "data-analytics" ? "The Missing Orders" : pathSlug === "business-analytics" ? "The Tea Stall That Wanted to Grow" : "The Update Nobody Read";

  const sceneMetaList = pathSlug === "data-analytics" ? DATA_ARC_SCENES : pathSlug === "business-analytics" ? BUSINESS_ARC_SCENES : COMM_ARC_SCENES;
  const currentSceneMeta = sceneMetaList[Math.min(index, sceneMetaList.length - 1)];

  return {
    slug: module.slug,
    title: module.title,
    pathSlug: (pathSlug === "data-analytics" || pathSlug === "business-analytics" || pathSlug === "communication") ? pathSlug : "data-analytics",
    order: index + 1,
    storyArcId: storyArcTitle.toLowerCase().replace(/\s+/g, "-"),
    storyArcTitle,
    estimatedMinutes: 8,
    status: "draft_needs_review",
    pages: [
      {
        id: `${module.slug}-p1-teaser`,
        pageType: "teaser",
        order: 1,
        minSecondsOverride: 10,
        content: {
          prompt: `What is the central focus of '${module.title}'?`,
          format: "choice",
          options: [
            "Superficial guesswork without methodology",
            module.summary,
            "Relying on assumptions without validation",
          ],
          revealReaction: `Understanding begins with clear framing. In this module, we focus on: ${module.summary}`,
          realTopic: module.title,
        },
      },
      {
        id: `${module.slug}-p2-scene`,
        pageType: "scene",
        order: 2,
        minSecondsOverride: 15,
        content: {
          sceneNumber: index + 1,
          character,
          characterRole,
          setting: currentSceneMeta.setting,
          visualMood: currentSceneMeta.mood,
          sceneObjects: currentSceneMeta.objects,
          narrative: module.scenario || `The team gathers to resolve an operational challenge around ${module.title}. Every stakeholder is waiting for a concrete, defensible direction.`,
          dialogue: [
            { speaker: "Stakeholder", text: `We need clear answers regarding ${module.title}. What should we focus on?` },
            { speaker: character, text: module.objectives[0] || "We must examine the evidence step by step." },
          ],
          decisionBranch: {
            prompt: `How should ${character} proceed?`,
            choices: [
              {
                id: "c1",
                label: "Jump immediately to conclusions without verifying assumptions.",
                consequence: "You miss key context and risk presenting invalid findings.",
              },
              {
                id: "c2",
                label: `Focus on fundamentals: ${module.objectives[0] || module.title}.`,
                consequence: "Clear direction established. The team avoids wasted effort and focuses on defensible facts.",
              },
            ],
          },
        },
      },
      {
        id: `${module.slug}-p3-concept`,
        pageType: "concept",
        order: 3,
        minSecondsOverride: 15,
        content: {
          title: module.lesson[0]?.heading || "Core Principle",
          chunks: [
            module.lesson[0]?.body || module.summary,
            module.lesson[1]?.body || "Apply this systematic approach to ensure defensible, evidence-grounded outcomes.",
          ],
          glossaryTooltips: [
            { term: module.title.split(" ")[0], definition: `Key concept in ${pathTitle}` },
          ],
        },
      },
      {
        id: `${module.slug}-p4-example`,
        pageType: "example",
        order: 4,
        minSecondsOverride: 15,
        content: {
          title: "Realistic Practical Application",
          problem: module.scenario || `Addressing ${module.title} in real-world scenarios.`,
          context: `Demonstrated in ${pathTitle}`,
          steps: [
            {
              stepNumber: 1,
              title: module.objectives[0] || "Foundational Step",
              explanation: module.lesson[0]?.body?.slice(0, 180) || "Analyze the problem systematically.",
            },
            {
              stepNumber: 2,
              title: module.objectives[1] || "Execution & Verification",
              explanation: module.lesson[1]?.body?.slice(0, 180) || "Verify outcomes against clear standards.",
            },
          ],
        },
      },
      {
        id: `${module.slug}-p5-tryit`,
        pageType: "tryit",
        order: 5,
        content: {
          taskType: "choose_justify",
          prompt: `Based on what you learned in '${module.title}', evaluate the following scenario:`,
          starterContext: module.scenario,
          choices: [
            {
              id: "opt-1",
              label: module.objectives[0] || "Apply systematic verification.",
              isCorrect: true,
              feedback: "Correct. This follows the disciplined principle required for reliable outcomes.",
            },
            {
              id: "opt-2",
              label: "Rely on intuition without checking data.",
              isCorrect: false,
              feedback: "This bypasses the analytical foundation required for proof of skill.",
            },
          ],
          expectedGuidance: "Prioritize disciplined methodology over hasty assumptions.",
          reasoningExplanation: "Defensible evidence requires adherence to rigorous, repeatable processes.",
          explainItBackPrompt: `In your own words: why is ${module.title} critical for reliable decision-making?`,
        },
      },
      {
        id: `${module.slug}-p6-check`,
        pageType: "check",
        order: 6,
        content: {
          questions: module.questions,
        },
      },
      {
        id: `${module.slug}-p7-takeaway`,
        pageType: "takeaway",
        order: 7,
        minSecondsOverride: 10,
        content: {
          summaryLines: [
            module.summary,
            ...(module.objectives.length > 0 ? module.objectives : ["Focus on evidence over intuition."]),
          ],
          reflectionPrompt: `How would you explain the core lesson of ${module.title} to a colleague?`,
        },
      },
    ],
  };
}

