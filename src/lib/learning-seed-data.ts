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

const dbgModule1Questions: PublicLearningQuestion[] = [
  {
    id: "dbg1q1",
    prompt: "Why do slice-based sliding windows frequently omit the final transaction?",
    choices: [
      "slice(start, end) excludes the element at the end index",
      "JavaScript arrays cannot store timestamps",
      "Floating point math always rounds down to zero",
    ],
  },
  {
    id: "dbg1q2",
    prompt: "What is the most effective deterministic test for off-by-one window bugs?",
    choices: [
      "A test with a transaction timestamp exactly equal to the upper window boundary",
      "A test with a billion random transactions",
      "Checking whether the variable names are camelCase",
    ],
  },
  {
    id: "dbg1q3",
    prompt: "How do adaptive follow-up questions impact your debugging assessment score?",
    choices: [
      "They calibrate understanding and confidence; they never decrease base score",
      "Each follow-up question subtracts 10% from the score",
      "Follow-ups are only given when an attempt fails completely",
    ],
  },
];

const dsaModule1Questions: PublicLearningQuestion[] = [
  {
    id: "dsa1q1",
    prompt: "What is the time complexity of checking duplicates using array.indexOf() inside a loop of N items?",
    choices: [
      "O(N²) quadratic time",
      "O(N) linear time",
      "O(log N) logarithmic time",
    ],
  },
  {
    id: "dsa1q2",
    prompt: "What is the primary benefit of using a Set for duplicate detection?",
    choices: [
      "O(1) average lookup and insertion time",
      "It uses zero memory on the heap",
      "It guarantees sorted order of all elements",
    ],
  },
  {
    id: "dsa1q3",
    prompt: "When using a hash set for unbounded real-time event streams, what memory risk arises?",
    choices: [
      "Unbounded memory growth unless items outside the dedup window are purged",
      "Hash collisions cause silent data corruption",
      "JavaScript sets can only hold 256 items",
    ],
  },
];

export const debuggingModule1: FullModule = {
  slug: "off-by-one-settlement",
  title: "The Missing Settlement Slice",
  pathSlug: "debugging",
  order: 1,
  storyArcId: "the-late-night-deploy-at-finflow",
  storyArcTitle: "The Late-Night Deploy at FinFlow",
  estimatedMinutes: 8,
  status: "draft_needs_review",
  pages: [
    {
      id: "dbg-m1-p1-teaser",
      pageType: "teaser",
      order: 1,
      minSecondsOverride: 10,
      content: {
        format: "choice",
        prompt: "What causes the vast majority of silent reconciliation deficits in sliding time-window pipelines?",
        options: [
          "Hardware clock drift in data center cooling units",
          "Off-by-one boundary index exclusion (confusing inclusive vs half-open intervals)",
          "Network cables routing packets in alphabetical order",
        ],
        revealReaction:
          "Exactly right. Boundary index off-by-one defects are the leading cause of silent item drops in financial batching systems.",
        realTopic:
          "Interval Invariants: Proving and verifying half-open [start, end) boundary conditions in critical settlement systems.",
      },
    },
    {
      id: "dbg-m1-p2-scene",
      pageType: "scene",
      order: 2,
      minSecondsOverride: 18,
      content: {
        sceneNumber: 1,
        character: "Kavya",
        characterRole: "SRE & Backend Engineer",
        setting: "FinFlow Incident Command War Room · 11:42 PM",
        visualMood: "urgent",
        sceneObjects: ["laptop", "telemetry_graphs", "red_phone"],
        narrative:
          "Kavya monitors the midnight settlement batch when Sentry flashes an S3 deficit alert. Vikram, Incident Commander, strides in holding an urgent printout: 'Merchant payouts are short by $4,200! Exactly one transaction from the 23:00 hour was omitted. The finance team is holding the batch. Did the batch drop an order?'",
        dialogue: [
          { speaker: "Vikram (Incident Commander)", text: "The settlement batch total is short. Did the worker drop a transaction at 23:59:59?" },
          { speaker: "Kavya", text: "Let me inspect the window slice bounds. Array slicing might be dropping the boundary index." },
        ],
        decisionBranch: {
          prompt: "How should Kavya investigate the missing transaction?",
          choices: [
            {
              id: "dbg-choice-manual-edit",
              label: "Manually insert a $4,200 database balance adjustment to unblock the payout quickly.",
              consequence: "Bypasses the audit log, masks the underlying code defect, and corrupts ledger history.",
            },
            {
              id: "dbg-choice-inspect-slice",
              label: "Isolate the slicing function and verify boundary index tests against edge timestamps.",
              consequence: "Uncovers that `slice(start, end - 1)` was truncating the final element. Fix can be verified deterministically.",
            },
          ],
        },
      },
    },
    {
      id: "dbg-m1-p3-concept",
      pageType: "concept",
      order: 3,
      minSecondsOverride: 20,
      content: {
        title: "Interval Semantics & Boundary Invariants",
        chunks: [
          "In financial batch processing, time ranges are almost universally defined as half-open intervals: [startTime, endTime). This means startTime is inclusive while endTime is exclusive. Array methods such as Array.prototype.slice(start, end) already model this half-open interval. If developer code applies an extra `- 1` adjustment like `slice(start, end - 1)`, the final transaction occurring right before endTime is silently dropped.",
          "Defensive boundary engineering requires three verification checks: (1) An empty batch must safely return an empty slice, (2) A single-element batch must be fully captured, and (3) The upper boundary element at index `length - 1` must be included. When testing financial pipelines, property tests must test timestamp equality on the boundary.",
        ],
        glossaryTooltips: [
          { term: "Half-Open Interval", definition: "A mathematical range [a, b) where lower bound a is inclusive and upper bound b is exclusive." },
          { term: "Sliding Window", definition: "A sub-array or sub-sequence determined by moving boundary indices over time." },
          { term: "Off-by-One", definition: "A logic error where an iteration or slice runs one time too many or one time too few." },
        ],
      },
    },
    {
      id: "dbg-m1-p4-example",
      pageType: "example",
      order: 4,
      minSecondsOverride: 20,
      content: {
        title: "Tracing Slice Boundary Exclusion",
        problem: "The hourly batch has 10 transactions. Why did `transactions.slice(0, 9)` return only 9 items?",
        context: "The developer intended to fetch all 10 items but applied `endIdx - 1` because array length is 10.",
        steps: [
          { stepNumber: 1, title: "Trace slice parameters", explanation: "slice(0, 9) extracts elements from index 0 through index 8." },
          { stepNumber: 2, title: "Identify omitted element", explanation: "Index 9 (the 10th item) is excluded by slice, omitting the $4,200 payout." },
          { stepNumber: 3, title: "Apply correct invariant", explanation: "Use `transactions.slice(startIdx, endIdx)` directly. The slice method already treats endIdx as exclusive." },
        ],
      },
    },
    {
      id: "dbg-m1-p5-tryit",
      pageType: "tryit",
      order: 5,
      content: {
        taskType: "fix_error",
        prompt: "Inspect the buggy sliding window calculation and identify why the final transaction is omitted:",
        starterContext: "FinFlow settlement window function: getSettlementSlice(transactions, startIdx, endIdx) received start=0, end=10, but returned only 9 transactions.",
        codeSnippet: "function getSettlementSlice(transactions, startIdx, endIdx) {\n  // Bug: endIdx - 1 excludes the requested end element\n  return transactions.slice(startIdx, endIdx - 1);\n}",
        clues: [
          "Hourly batch covers timestamps 23:00:00 through 23:59:59",
          "End index passed to slice is array.length",
          "slice(start, end) already treats the second argument as an exclusive upper bound",
        ],
        symptom: "S3 Deficit: 1 missing transaction in the 23:00 hourly batch",
        choices: [
          {
            id: "dbg-opt-1",
            label: "Change slice(startIdx, endIdx - 1) to slice(startIdx, endIdx) because slice's second parameter is already exclusive.",
            isCorrect: true,
            feedback: "Correct! Array.prototype.slice already excludes the upper bound. Subtracting 1 drops the last valid element.",
          },
          {
            id: "dbg-opt-2",
            label: "Add a while loop that appends null to transactions before slicing.",
            isCorrect: false,
            feedback: "Appending null introduces corrupt data into the settlement ledger.",
          },
        ],
        expectedGuidance: "Preserve the invariant that slice(start, end) captures all elements from start up to end - 1.",
        reasoningExplanation: "Subtracting 1 from endIdx artificially truncates the window, omitting the final record.",
        explainItBackPrompt: "In one sentence: Why does subtracting 1 from the slice end argument drop the boundary transaction?",
      },
    },
    {
      id: "dbg-m1-p6-check",
      pageType: "check",
      order: 6,
      content: {
        questions: dbgModule1Questions,
      },
    },
    {
      id: "dbg-m1-p7-takeaway",
      pageType: "takeaway",
      order: 7,
      minSecondsOverride: 12,
      content: {
        summaryLines: [
          "Off-by-one errors in sliding windows are preventable through consistent half-open interval conventions [start, end).",
          "Always test boundary edge cases: empty batches, single-item slices, and transactions landing exactly on the timestamp limit.",
          "Adaptive follow-up defenses calibrate understanding and confidence without lowering your base score.",
        ],
        reflectionPrompt: "How will you verify boundary conditions the next time you write or review a slicing loop?",
      },
    },
  ],
};

export const dsaModule1: FullModule = {
  slug: "fast-record-dedup",
  title: "Finding Duplicate Audit Events in Real-Time",
  pathSlug: "dsa",
  order: 1,
  storyArcId: "scaling-eventpulse",
  storyArcTitle: "Scaling EventPulse",
  estimatedMinutes: 8,
  status: "draft_needs_review",
  pages: [
    {
      id: "dsa-m1-p1-teaser",
      pageType: "teaser",
      order: 1,
      minSecondsOverride: 10,
      content: {
        format: "choice",
        prompt: "Why do real-time event streaming pipelines degrade catastrophically under quadratic O(N²) deduplication?",
        options: [
          "Because doubling traffic quadruples processing time, quickly causing queue backpressure and memory exhaustion.",
          "Because quadratic equations require GPUs that servers don't have.",
          "Because browsers cannot render more than 100 HTML elements.",
        ],
        revealReaction:
          "Spot on. When an ingestion stream scales from 1,000 to 50,000 events/sec, O(N²) comparisons jump from 1 million to 2.5 billion operations, crashing worker nodes.",
        realTopic:
          "Algorithmic Complexity & Scaling: Transforming quadratic bottlenecks into linear O(N) operations using hash indexing.",
      },
    },
    {
      id: "dsa-m1-p2-scene",
      pageType: "scene",
      order: 2,
      minSecondsOverride: 18,
      content: {
        sceneNumber: 1,
        character: "Tariq",
        characterRole: "Systems & Infrastructure Engineer",
        setting: "EventPulse Pipeline Profiler Desk · 09:15 AM",
        visualMood: "urgent",
        sceneObjects: ["cpu_flamegraph", "laptop", "event_stream"],
        narrative:
          "Tariq opens the CPU profiler to find worker pod CPU pegged at 100%. Lead Architect Maya pulls up the flame graph: 'The deduplication filter is blocking the entire message bus. We are processing 40,000 audit events per second, and each event scans the entire historical array with array.includes(). What data structure will eliminate this bottleneck?'",
        dialogue: [
          { speaker: "Maya (Lead Architect)", text: "Our ingestion pods are dying under quadratic array scans. How do we fix this before the 10 AM traffic surge?" },
          { speaker: "Tariq", text: "We need to replace the linear array lookup with a hash set. That drops each lookup from O(N) to O(1) amortized." },
        ],
        decisionBranch: {
          prompt: "How should Tariq optimize the deduplication pipeline?",
          choices: [
            {
              id: "dsa-choice-cluster",
              label: "Scale the Kubernetes cluster from 10 to 100 pods without changing the code.",
              consequence: "Multiplies cloud infrastructure costs by 10x without fixing the O(N²) quadratic scaling limit.",
            },
            {
              id: "dsa-choice-hash-set",
              label: "Refactor the dedup buffer to use a Set with O(1) lookups and prune keys outside the time window.",
              consequence: "CPU drops from 100% to 4%. Ingestion throughput increases by 45x while memory remains strictly bounded.",
            },
          ],
        },
      },
    },
    {
      id: "dsa-m1-p3-concept",
      pageType: "concept",
      order: 3,
      minSecondsOverride: 20,
      content: {
        title: "Hash Sets vs Array Scans in Event Ingestion",
        chunks: [
          "Repeatedly scanning an array using `array.includes()` or `array.indexOf()` inside a loop of N incoming items results in $O(N^2)$ time complexity. For 50,000 items, this requires up to 2.5 billion comparison operations, easily exhausting CPU time slices and stalling worker threads.",
          "A hash table (JavaScript `Set` or `Map`) computes a hash of the key to index directly into a bucket, providing $O(1)$ amortized lookup and insertion time. The overall algorithm drops to $O(N)$ linear time. The trade-off is $O(N)$ memory overhead for hash table nodes. In production streams, memory must be capped by pruning entries older than the deduplication time window.",
        ],
        glossaryTooltips: [
          { term: "Amortized O(1)", definition: "Constant time on average over a sequence of operations, accounting for occasional hash table resizing." },
          { term: "Quadratic O(N²)", definition: "An algorithm whose execution time scales with the square of the input size." },
          { term: "Hash Collision", definition: "When two distinct keys produce the same bucket index; resolved via chaining or open addressing." },
        ],
      },
    },
    {
      id: "dsa-m1-p4-example",
      pageType: "example",
      order: 4,
      minSecondsOverride: 20,
      content: {
        title: "Comparing Execution Steps",
        problem: "De-duplicate 10,000 transaction events while preserving first-seen order.",
        context: "EventPulse needs sub-50ms latency per batch of 10,000 events.",
        steps: [
          { stepNumber: 1, title: "Naive Array Scan", explanation: "For each item, scan the result array. Total comparisons: 10,000 * 5,000 = 50,000,000 operations (~450ms)." },
          { stepNumber: 2, title: "Hash Set Accumulator", explanation: "Maintain a `seen = new Set()`. Check `seen.has(id)` in O(1). If not seen, add to Set and result list. Total operations: 10,000 (~1.2ms)." },
          { stepNumber: 3, title: "Bounded Memory Pruning", explanation: "Evict keys older than 5 minutes to prevent heap memory exhaustion over 24 hours." },
        ],
      },
    },
    {
      id: "dsa-m1-p5-tryit",
      pageType: "tryit",
      order: 5,
      content: {
        taskType: "choose_justify",
        prompt: "Evaluate the optimal deduplication strategy for high-throughput event processing:",
        starterContext: "EventPulse receives 20,000 audit records per batch. An engineer proposes sorting the array first (O(N log N)), then removing adjacent duplicates.",
        choices: [
          {
            id: "dsa-opt-1",
            label: "Use a Set for O(N) time and first-seen order preservation; sorting changes the original order and takes O(N log N).",
            isCorrect: true,
            feedback: "Correct! Set gives true linear O(N) performance and automatically preserves original audit event chronology.",
          },
          {
            id: "dsa-opt-2",
            label: "Keep the O(N²) array.includes() approach and add setTimeout(0) between every loop iteration.",
            isCorrect: false,
            feedback: "Adding setTimeout yields the thread but does not reduce the 200 million operations needed, drastically increasing latency.",
          },
        ],
        expectedGuidance: "Prioritize O(N) linear hash sets over O(N²) nested scans or unnecessary O(N log N) sorting.",
        reasoningExplanation: "Hash sets provide constant-time average lookups while preserving arrival order.",
        explainItBackPrompt: "In one sentence: Why does a Set maintain first-seen event order better than sorting the input array?",
      },
    },
    {
      id: "dsa-m1-p6-check",
      pageType: "check",
      order: 6,
      content: {
        questions: dsaModule1Questions,
      },
    },
    {
      id: "dsa-m1-p7-takeaway",
      pageType: "takeaway",
      order: 7,
      minSecondsOverride: 12,
      content: {
        summaryLines: [
          "Eliminate quadratic O(N²) loops by replacing linear searches with O(1) hash sets.",
          "Balance time and space complexity: O(N) runtime requires O(N) memory, which must be bounded in streaming pipelines.",
          "Adaptive follow-up defenses calibrate understanding and confidence without lowering your base score.",
        ],
        reflectionPrompt: "Where in your current codebase might an inner array scan be creating a hidden quadratic bottleneck?",
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
  "debugging/off-by-one-settlement": debuggingModule1,
  "dsa/fast-record-dedup": dsaModule1,
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

const DEBUGGING_ARC_SCENES = [
  { setting: "FinFlow Incident Command War Room · 11:42 PM", mood: "urgent" as const, objects: ["laptop", "telemetry_graphs", "red_phone"] },
  { setting: "Payment Ledger Database Console · 01:15 AM", mood: "focused" as const, objects: ["sql_terminal", "laptop", "coffee_mug"] },
  { setting: "Webhook Ingestion Gateway · 02:30 AM", mood: "pensive" as const, objects: ["payload_inspector", "error_log", "sticky_notes"] },
  { setting: "Message Broker & Read Replica Cluster · 04:00 AM", mood: "triumphant" as const, objects: ["cluster_metrics", "postmortem_draft", "laptop"] },
];

const DSA_ARC_SCENES = [
  { setting: "EventPulse Pipeline Profiler Desk · 09:15 AM", mood: "urgent" as const, objects: ["cpu_flamegraph", "laptop", "event_stream"] },
  { setting: "Triage Dispatch Engine Whiteboard · 11:30 AM", mood: "focused" as const, objects: ["priority_queue_diagram", "markers", "laptop"] },
  { setting: "API Gateway Rate Limiter Console · 02:45 PM", mood: "focused" as const, objects: ["sliding_window_chart", "memory_usage", "coffee_mug"] },
  { setting: "Distributed Telemetry Search Terminal · 04:30 PM", mood: "triumphant" as const, objects: ["latency_distribution", "search_tree", "laptop"] },
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
  pathSlug: "data-analytics" | "business-analytics" | "communication" | "debugging" | "dsa" | string,
  pathTitle: string,
  module: PublicModuleInput,
  index: number
): FullModule {
  const key = `${pathSlug}/${module.slug}`;
  if (seededModulesMap[key]) {
    return seededModulesMap[key];
  }

  // Synthesize a structured 7-beat module for paths/modules pending bespoke arcs
  const character =
    pathSlug === "data-analytics"
      ? "Meera"
      : pathSlug === "business-analytics"
      ? "Rohan"
      : pathSlug === "debugging"
      ? "Kavya"
      : pathSlug === "dsa"
      ? "Tariq"
      : "Ananya";
  const characterRole =
    pathSlug === "data-analytics"
      ? "Junior Data Analyst"
      : pathSlug === "business-analytics"
      ? "Business Strategist"
      : pathSlug === "debugging"
      ? "SRE & Backend Engineer"
      : pathSlug === "dsa"
      ? "Systems & Infrastructure Engineer"
      : "Engineering Lead";
  const storyArcTitle =
    pathSlug === "data-analytics"
      ? "The Missing Orders"
      : pathSlug === "business-analytics"
      ? "The Tea Stall That Wanted to Grow"
      : pathSlug === "debugging"
      ? "The Late-Night Deploy at FinFlow"
      : pathSlug === "dsa"
      ? "Scaling EventPulse"
      : "The Update Nobody Read";

  const sceneMetaList =
    pathSlug === "data-analytics"
      ? DATA_ARC_SCENES
      : pathSlug === "business-analytics"
      ? BUSINESS_ARC_SCENES
      : pathSlug === "debugging"
      ? DEBUGGING_ARC_SCENES
      : pathSlug === "dsa"
      ? DSA_ARC_SCENES
      : COMM_ARC_SCENES;
  const currentSceneMeta = sceneMetaList[Math.min(index, sceneMetaList.length - 1)];

  return {
    slug: module.slug,
    title: module.title,
    pathSlug: pathSlug as any,
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

