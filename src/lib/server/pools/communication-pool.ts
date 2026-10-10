import "server-only";
import { FinalTestQuestionServer } from "@/lib/final-test-types";

export const communicationQuestions: FinalTestQuestionServer[] = [
  // 1. Rewrite: Transforming Defensive Technical Jargon into Executive BLUF
  {
    client: {
      id: "comm-q1-exec-bluf",
      pathSlug: "communication",
      slug: "comm-rewrite-defensive-jargon",
      type: "rewrite",
      title: "Rewrite: Defensive Engineering Update to CEO into BLUF Format",
      scenario: "After an e-commerce checkout outage, a lead engineer sent this message to the CEO: 'The outage wasn't our fault. AWS us-east-1 had a DNS blip, then the redis sentinel cluster flapped because the TTL was misconfigured by DevOps. Don't blame backend.'",
      prompt: "Rewrite this message using Bottom-Line Up Front (BLUF) principles: start with status and duration, explain impact calmly, and specify preventative safeguards.",
      starterContent: "The outage wasn't our fault. AWS us-east-1 had a DNS blip, then the redis sentinel cluster flapped because the TTL was misconfigured by DevOps. Don't blame backend.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["BLUF structure: operational status, duration, customer impact", "Removes defensive finger-pointing and takes shared ownership", "Provides concrete preventative action and post-mortem schedule"],
    followupBank: [
      {
        id: "comm-q1-f1",
        prompt: "Why does public finger-pointing between backend and devops destroy cross-functional trust during an incident?",
        expectedKeyPoints: ["Eats cognitive bandwidth", "Creates blame culture", "Erodes executive confidence in technical leadership"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Focus on what the CEO cares about: What was the impact? Is it resolved? What prevents recurrence?" },
      pointer: { deduction: 10, text: "Adopt shared accountability: start with resolution status and duration, omit blame, and provide next steps." },
      strong: { deduction: 20, text: "Structure as: Status (Resolved), Impact (35 min checkout disruption), Root Cause (Cache configuration during cloud network blip), Action (Hardened TTLs and redundancy)." },
    },
  },

  // 2. Spot Mistake: Insensitive AI Layoff / Reorg Email
  {
    client: {
      id: "comm-q2-ai-reorg",
      pathSlug: "communication",
      slug: "comm-spot-ai-callous-memo",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Tone-Deaf Corporate Reorganization Memo",
      scenario: "An AI communications bot drafted an all-hands message announcing team restructuring and severance.",
      prompt: "Identify the callous and contradictory sentence in the AI draft, explain why it damages company culture, and provide an empathetic alternative.",
      starterContent: "Today we announce a restructuring that affects 15% of our workforce. While this is a difficult day for impacted colleagues, leadership is thrilled to announce our best-ever profit margins and record executive bonus allocations. We wish departing team members the best in their future endeavors.",
      difficulty: "foundation",
    },
    plantedErrors: [
      {
        id: "comm-err-2",
        startChar: 80,
        endChar: 219,
        faultyText: "While this is a difficult day for impacted colleagues, leadership is thrilled to announce our best-ever profit margins and record executive bonus allocations.",
        explanationKey: "Juxtaposing layoffs with celebrations of record profit margins and executive bonuses is callous, hypocritical, and destroys workforce morale and trust.",
        correctionKey: "Focus exclusively on supporting departing employees with severance, healthcare continuation, and career transition; never celebrate executive bonuses in a layoff announcement.",
      },
    ],
    referenceCriteria: ["Identifies juxtaposition of job losses with executive bonus celebrations", "Highlights profound lack of empathy and morale damage", "Recommends dignified, supportive tone focused on severance and transition"],
    followupBank: [
      {
        id: "comm-q2-f1",
        prompt: "How should executive leadership address remaining employees the day following a layoff?",
        expectedKeyPoints: ["Direct all-hands Q&A", "Acknowledge survivor guilt and anxiety", "Clarify revised company priorities and runway"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Should an announcement of staff cuts celebrate executive bonuses?" },
      pointer: { deduction: 10, text: "Sentence 2 celebrates record profits and bonuses while letting colleagues go." },
      strong: { deduction: 20, text: "Sentence 2 is profoundly tone-deaf: celebrating bonuses alongside layoffs destroys trust." },
    },
  },

  // 3. Case Decision: Handling Unrealistic Client Deadline
  {
    client: {
      id: "comm-q3-unrealistic-deadline",
      pathSlug: "communication",
      slug: "comm-case-client-scope-deadline",
      type: "case_decision",
      title: "Case Decision: Pushing Back on a 3-Day Enterprise Feature Request",
      scenario: "A major enterprise client demands an unannounced custom single-sign-on (SSO) integration within 3 business days, threatening to cancel their contract if not met. Engineering estimates 3 weeks minimum for secure implementation.",
      prompt: "Select the most effective client communication strategy and defend your de-escalation rationale.",
      options: [
        { id: "opt-a", label: "Promise the feature in 3 days, have engineers skip security testing, and hope no vulnerabilities occur." },
        { id: "opt-b", label: "De-escalate with an immediate executive call: explain that rushed security compromises their corporate data, offer an interim assisted-login workaround, and present an accelerated 10-day dedicated delivery roadmap." },
        { id: "opt-c", label: "Ignore the client's email until the 3-day deadline has passed." },
        { id: "opt-d", label: "Reply angrily stating that clients do not understand software architecture." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Aligns security with client's self-interest (protecting their enterprise data)", "Provides immediate interim operational workaround", "Presents firm, realistic accelerated roadmap rather than impossible promises"],
    followupBank: [
      {
        id: "comm-q3-f1",
        prompt: "Why is saying 'Yes' to impossible technical deadlines more destructive to client relationships than an honest 'No, but here is how we solve it'?",
        expectedKeyPoints: ["Breaks trust when the deadline is missed anyway", "Ships buggy/insecure software", "Destroys team sustainability"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "How can you frame engineering diligence as protecting the client's data security?" },
      pointer: { deduction: 10, text: "Option B provides a temporary workaround while defending enterprise security standards." },
      strong: { deduction: 20, text: "Select Option B: offer an immediate assisted workaround and explain that rushed security puts their data at risk." },
    },
  },

  // 4. Interpret: Analyzing Asynchronous Miscommunication on Slack
  {
    client: {
      id: "comm-q4-slack-tone",
      pathSlug: "communication",
      slug: "comm-interpret-slack-friction",
      type: "interpret",
      title: "Interpret: Asynchronous Passive Aggression and Communication Breakdown",
      scenario: "Thread in public channel:\nDesigner: 'Here are the new mobile mockups for feedback!'\nTech Lead: 'Fine.'\nDesigner: 'Just fine? Does that mean approved?'\nTech Lead: 'Whatever you think.'\nProject Manager: 'Can you two stop fighting in public?'",
      prompt: "Diagnose the communication breakdown in this thread. What asynchronous norms were violated, and how should asynchronous critique be delivered?",
      difficulty: "foundation",
    },
    referenceCriteria: ["One-word passive-aggressive dismissals ('Fine', 'Whatever')", "Lack of specific, actionable feedback", "Violates professional norms by turning technical reviews into emotional standoffs; critique should be specific and constructive"],
    followupBank: [
      {
        id: "comm-q4-f1",
        prompt: "What norm should a team institute for design-engineering reviews on Slack?",
        expectedKeyPoints: ["Structured feedback format (Praise, Questions, Suggestions)", "Move to quick 5-min sync if tone escalates", "Public channel decorum"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "How do one-word answers like 'Fine' read in text without tone of voice?" },
      pointer: { deduction: 10, text: "Text communication lacks vocal nuance; dismissive short replies create passive-aggressive ambiguity." },
      strong: { deduction: 20, text: "The tech lead's dismissive one-word replies violate collaborative norms. Feedback must be specific and constructive." },
    },
  },

  // 5. Triage: Stakeholder Crisis Communication Channels
  {
    client: {
      id: "comm-q5-crisis-channels",
      pathSlug: "communication",
      slug: "comm-triage-crisis-comms",
      type: "triage",
      title: "Triage / Prioritise: Communication Sequencing During Major Data Incident",
      scenario: "A database exposure incident is confirmed. You must coordinate communications across 4 stakeholder groups under time pressure.",
      prompt: "Rank the order of communication delivery (1 = first) and defend the sequence.",
      options: [
        { id: "grp-1", label: "Internal Incident Response Engineering War Room (containment and isolation)." },
        { id: "grp-2", label: "Public Twitter/X announcement to general public." },
        { id: "grp-3", label: "Affected customer direct notifications with remediation guidance and password resets." },
        { id: "grp-4", label: "Legal and data protection regulatory authorities (within statutory timeline)." },
      ],
      difficulty: "intermediate",
    },
    referenceCriteria: ["Sequence: 1 (Containment) -> 4 (Legal/Regulators) -> 3 (Affected customers) -> 2 (Public announcement)", "Must contain the vulnerability before broadcasting it publicly", "Direct victim guidance precedes generic social media posts"],
    followupBank: [
      {
        id: "comm-q5-f1",
        prompt: "Why is tweeting about a security vulnerability before patching it dangerous?",
        expectedKeyPoints: ["Invites bad actors to exploit the open vulnerability", "Spreads panic before solutions exist", "Exposes company to severe legal liability"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can you communicate solutions before engineers contain the breach?" },
      pointer: { deduction: 10, text: "First isolate and contain the vulnerability, notify authorities and affected users, then public PR." },
      strong: { deduction: 20, text: "Order: 1 (Engineering containment) -> 4 (Regulatory/Legal) -> 3 (Affected users) -> 2 (Public social media)." },
    },
  },

  // 6. Rewrite: Constructive Critical Feedback to Junior Engineer
  {
    client: {
      id: "comm-q6-code-review-feedback",
      pathSlug: "communication",
      slug: "comm-rewrite-code-review-criticism",
      type: "rewrite",
      title: "Rewrite: Harsh Code Review Comment into Mentorship Guidance",
      scenario: "A senior developer left this comment on a pull request: 'Did you even test this garbage? This query is terrible and will crash prod. Rewrite the whole thing.'",
      prompt: "Rewrite this review comment into constructive, specific, psychological-safety preserving feedback that teaches the junior engineer the optimization principle.",
      starterContent: "Did you even test this garbage? This query is terrible and will crash prod. Rewrite the whole thing.",
      difficulty: "foundation",
    },
    referenceCriteria: ["Removes derogatory personal insults ('garbage', 'terrible')", "Specifically points out the performance issue (unindexed table scan / missing filter)", "Provides guidance or documentation link and encourages re-submission"],
    followupBank: [
      {
        id: "comm-q6-f1",
        prompt: "How does toxic code review culture harm engineering retention and team velocity?",
        expectedKeyPoints: ["Creates fear of committing code", "Discourages asking questions", "High turnover among junior and mid-level engineers"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Focus on the code behavior, not the person's intelligence." },
      pointer: { deduction: 10, text: "Explain the performance concern specifically and suggest the indexing or query fix." },
      strong: { deduction: 20, text: "Frame constructively: 'This query performs a full table scan which will cause latency in production. Let's add an index on user_id or filter by date. Happy to pair on this!'" },
    },
  },

  // 7. Spot Mistake: Hallucinated AI Customer Apology
  {
    client: {
      id: "comm-q7-ai-apology",
      pathSlug: "communication",
      slug: "comm-spot-ai-apology-promise",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Legally Binding Over-Commitment in Customer Email",
      scenario: "An AI support bot drafted an apology email to an angry customer whose flight booking was delayed.",
      prompt: "Find the erroneous sentence where the AI makes an unauthorized, legally binding financial guarantee, explain the risk, and correct it.",
      starterContent: "We sincerely apologize for the delay in processing your reservation. To make this right, NextLearn guarantees that all future flights you book with our partner airlines will be 100% free for life. We appreciate your patience and look forward to serving your travel needs.",
      difficulty: "foundation",
    },
    plantedErrors: [
      {
        id: "comm-err-7",
        startChar: 78,
        endChar: 208,
        faultyText: "NextLearn guarantees that all future flights you book with our partner airlines will be 100% free for life.",
        explanationKey: "The AI hallucinates an impossible financial liability ('free flights for life') that the company cannot fulfill and creates catastrophic legal breach-of-contract exposure.",
        correctionKey: "Offer standard policy compensation (e.g. flight voucher, full refund, or travel credits) aligned with airline terms.",
      },
    ],
    referenceCriteria: ["Identifies hallucinated financial promise of 'free flights for life'", "Highlights legal liability and impossibility of fulfillment", "Replaces with standard policy refund or credit voucher"],
    followupBank: [
      {
        id: "comm-q7-f1",
        prompt: "What programmatic guardrails should be placed on customer support AI agents to prevent unauthorized promises?",
        expectedKeyPoints: ["Strict response schema with predefined refund ceilings", "Human-in-the-loop review for compensation offers", "RAG grounding against company policy documents"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can a customer support agent promise free flights for life?" },
      pointer: { deduction: 10, text: "Sentence 2 guarantees free lifetime partner airline flights." },
      strong: { deduction: 20, text: "Sentence 2 creates an impossible legal liability by promising free flights for life." },
    },
  },

  // 8. Case Decision: Escalating Production Security Bug
  {
    client: {
      id: "comm-q8-security-escalation",
      pathSlug: "communication",
      slug: "comm-case-security-escalation-path",
      type: "case_decision",
      title: "Case Decision: Reporting Vulnerability Found by Junior Developer",
      scenario: "A junior QA engineer finds an insecure direct object reference (IDOR) bug allowing any logged-in user to view other users' payroll records. The direct manager says: 'Don't log this in Jira, it will make our team look bad before our performance reviews.'",
      prompt: "Select the ethical, compliant communication action and defend your reasoning.",
      options: [
        { id: "opt-a", label: "Comply with the manager and ignore the vulnerability to protect the team's review scores." },
        { id: "opt-b", label: "Immediately report the issue via the confidential Security Incident Channel / Security Officer according to company whistleblowing and security policy." },
        { id: "opt-c", label: "Post the vulnerability on a public hacker forum to force the company to act." },
        { id: "opt-d", label: "Resign immediately without telling anyone." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Directly escalates high-severity data breach to security officers", "Protects user data and company from catastrophic breach", "Recognizes that hiding security bugs to protect performance reviews is an ethical breach"],
    followupBank: [
      {
        id: "comm-q8-f1",
        prompt: "How does a mature engineering organization incentivize reporting bugs rather than hiding them?",
        expectedKeyPoints: ["Blameless culture", "Security bounty / recognition", "Protection from managerial retaliation"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Hiding a data breach puts all customer data at risk." },
      pointer: { deduction: 10, text: "Escalate via formal internal security incident channels." },
      strong: { deduction: 20, text: "Select Option B: report via designated security channels to protect customer privacy and regulatory compliance." },
    },
  },

  // 9. Interpret: Cross-Functional Translation Gap (Sales vs Engineering)
  {
    client: {
      id: "comm-q9-sales-eng-gap",
      pathSlug: "communication",
      slug: "comm-interpret-sales-eng-mismatch",
      type: "interpret",
      title: "Interpret: 'It's Just a Button' Feature Request Misalignment",
      scenario: "Sales VP writes: 'A customer wants a button to export all historical analytics to Excel. It’s just one button on the UI, can you whip it up in 2 hours?' Engineering Lead responds: 'No, that requires an asynchronous background worker, distributed file streaming, S3 presigned URLs, and rate limiting.'",
      prompt: "Diagnose why this conversation created tension and explain how both sides failed to communicate effectively.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Sales oversimplified backend complexity by focusing only on UI affordance ('just a button')", "Engineering responded with defensive architectural jargon without explaining the actual user constraint (server timeout on huge datasets)", "Both failed to align on the user need: exporting large data safely without crashing the app"],
    followupBank: [
      {
        id: "comm-q9-f1",
        prompt: "How could the engineering lead have explained the constraint in business-friendly language?",
        expectedKeyPoints: ["Explain data volume: exporting 5 million rows freezes the screen for 10 minutes", "Offer incremental compromise (CSV export of top 1,000 rows today)", "Schedule full background export for next sprint"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Why did sales think it was easy, and why did engineering sound unhelpful?" },
      pointer: { deduction: 10, text: "Sales sees the UI; engineering sees server load. Neither translated their perspective." },
      strong: { deduction: 20, text: "Sales trivialized backend complexity as 'just a button'; engineering dumped unhelpful jargon instead of explaining the data volume risk." },
    },
  },

  // 10. Rewrite: Declining Scope Creep from Internal Stakeholder
  {
    client: {
      id: "comm-q10-scope-creep",
      pathSlug: "communication",
      slug: "comm-rewrite-scope-creep-refusal",
      type: "rewrite",
      title: "Rewrite: Refusing Last-Minute Scope Creep Without Damaging Partnership",
      scenario: "Two days before launch, a product marketer asks to add a multi-currency switcher. The engineer drafted: 'Are you out of your mind? The sprint is locked. Stop adding random features at the 11th hour.'",
      prompt: "Rewrite this response to preserve a collaborative partnership while firmly protecting the launch timeline and offering a post-launch phase.",
      starterContent: "Are you out of your mind? The sprint is locked. Stop adding random features at the 11th hour.",
      difficulty: "foundation",
    },
    referenceCriteria: ["Acknowledges strategic value of multi-currency feature", "Explains risk to on-time quality for the current locked launch", "Schedules feature for immediate post-launch Phase 2 evaluation"],
    followupBank: [
      {
        id: "comm-q10-f1",
        prompt: "Why is offering a concrete Phase 2 timeline more effective than simply saying 'No'?",
        expectedKeyPoints: ["Validates stakeholder's business objective", "Prevents adversarial dynamic", "Keeps launch date protected while planning future roadmap"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Validate the idea, explain why it cannot fit in this 48-hour launch window, and offer Phase 2." },
      pointer: { deduction: 10, text: "Be polite, protect the date, and schedule it for post-launch." },
      strong: { deduction: 20, text: "Frame as: 'Multi-currency is a great feature for our roadmap, but adding it 48 hours before launch risks breaking checkout. Let's launch on time and prioritize currency in sprint 1 post-launch.'" },
    },
  },

  // 11. Triage: Communication Overload During Live Outage
  {
    client: {
      id: "comm-q11-outage-comms",
      pathSlug: "communication",
      slug: "comm-triage-live-outage-updates",
      type: "triage",
      title: "Triage / Prioritise: Incident Commander Communication Duties",
      scenario: "During a major database outage, the designated Incident Commander receives 30 messages across 5 channels while engineers are actively debugging.",
      prompt: "Rank these 3 communication actions in order of incident management priority.",
      options: [
        { id: "act-1", label: "Appoint a dedicated Comms Lead to handle stakeholder updates, freeing engineers to focus solely on remediation." },
        { id: "act-2", label: "Answer every direct message individually on Slack as they arrive." },
        { id: "act-3", label: "Publish a single centralized status update on the incident channel with a 30-minute next-update timestamp." },
      ],
      difficulty: "intermediate",
    },
    referenceCriteria: ["Rank: Act 1 & Act 3 first, Act 2 last", "Shields technical responders from distraction", "Provides predictable Cadence (30-min heartbeat) to prevent incoming message spam"],
    followupBank: [
      {
        id: "comm-q11-f1",
        prompt: "Why is specifying the *time of next update* (e.g. 'Next update at 14:30 UTC') the most effective way to stop incoming executive pings?",
        expectedKeyPoints: ["Sets clear expectation", "Assures leadership that situation is monitored", "Prevents anxious stakeholders from repeatedly interrupting engineers"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can engineers fix servers if they have to answer 30 separate DMs?" },
      pointer: { deduction: 10, text: "Designate a single comms owner and publish centralized status updates at scheduled intervals." },
      strong: { deduction: 20, text: "Prioritize appointing a comms lead and posting centralized heartbeat updates (1 & 3); avoid answering 30 separate DMs (2)." },
    },
  },

  // 12. Fix It: Ambiguous Remote Asynchronous Action Item
  {
    client: {
      id: "comm-q12-action-item",
      pathSlug: "communication",
      slug: "comm-fix-ambiguous-action-item",
      type: "fix_it",
      title: "Fix It: Vague Team Action Item into DRI, Deadline, and Deliverable",
      scenario: "A project manager posted this in Slack: 'Someone should look into the analytics drop sometime this week.' By Friday, nobody had done anything.",
      prompt: "Fix this task assignment by applying the Directly Responsible Individual (DRI) framework: specify WHO, WHAT, WHEN, and HOW it is tracked.",
      starterContent: "Someone should look into the analytics drop sometime this week.",
      difficulty: "foundation",
    },
    referenceCriteria: ["Names a single Directly Responsible Individual (DRI)", "Specifies concrete deliverable (e.g. root-cause memo)", "Sets explicit day and time deadline (e.g. Thursday 17:00 UTC) with tracking link"],
    followupBank: [
      {
        id: "comm-q12-f1",
        prompt: "Why does assigning a task to 'Everyone' or 'Someone' result in zero accountability in remote teams?",
        expectedKeyPoints: ["Bystander effect in asynchronous channels", "Diffusion of responsibility", "Ambiguity over ownership leads to inaction"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "When everyone is responsible, nobody is responsible." },
      pointer: { deduction: 10, text: "Assign a specific named person, an exact deadline, and a tangible deliverable." },
      strong: { deduction: 20, text: "Format: '@Priya (DRI): Investigate Tuesday checkout conversion drop and post 3-bullet diagnosis in this channel by Thursday 15:00 UTC.'" },
    },
  },

  // 13. Spot Mistake: Passive Voice Obscuring Accountability
  {
    client: {
      id: "comm-q13-passive-voice",
      pathSlug: "communication",
      slug: "comm-spot-passive-voice-evasion",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Passive Voice Obscuring Incident Accountability",
      scenario: "An AI compliance memo described a catastrophic production data loss.",
      prompt: "Find the evasive passive-voice sentence that hides accountability, explain why it destroys transparency, and rewrite it in active voice with clear agency.",
      starterContent: "On Tuesday evening, maintenance was initiated on the primary storage cluster. Unfortunate mistakes were made during data migration, resulting in the unrecoverable deletion of customer records. It has been decided that backups will be inspected soon.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "comm-err-13",
        startChar: 80,
        endChar: 205,
        faultyText: "Unfortunate mistakes were made during data migration, resulting in the unrecoverable deletion of customer records.",
        explanationKey: "'Mistakes were made' uses classic passive evasive voice to avoid identifying who performed the action, which procedures failed, and what controls broke down.",
        correctionKey: "State clearly what process failed: 'Our engineering migration script executed without secondary confirmation checks, deleting records.'",
      },
    ],
    referenceCriteria: ["Identifies classic evasive phrase 'mistakes were made'", "Highlights lack of agency, process accountability, and transparency", "Rewrites in active voice identifying the failure mode and team ownership"],
    followupBank: [
      {
        id: "comm-q13-f1",
        prompt: "How does active voice improve root-cause analysis during blameless postmortems?",
        expectedKeyPoints: ["Focuses on systems and automated guards rather than vague ambiguity", "Identifies the exact automated script or human step that lacked guardrails", "Enables real procedural fixes"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Notice the phrase 'mistakes were made'. Who made them?" },
      pointer: { deduction: 10, text: "Passive voice conceals agency and prevents learning from procedural failures." },
      strong: { deduction: 20, text: "Sentence 2 uses evasive passive voice ('mistakes were made') to hide procedural failure." },
    },
  },

  // 14. Case Decision: Delivering Bad News to Strategic Partner
  {
    client: {
      id: "comm-q14-partner-bad-news",
      pathSlug: "communication",
      slug: "comm-case-partner-bad-news",
      type: "case_decision",
      title: "Case Decision: Announcing 6-Week API Migration Delay to Integrated Partners",
      scenario: "A planned API upgrade scheduled for next Monday has failed stress testing and must be delayed by 6 weeks. 50 external enterprise software partners have built integrations against the promised date.",
      prompt: "Select the most professional partner communication approach and defend your trust-preservation strategy.",
      options: [
        { id: "opt-a", label: "Release the buggy API on Monday anyway to avoid breaking the date promise." },
        { id: "opt-b", label: "Send an immediate, proactive notification to all partner technical leads today: explain the stress-test finding, provide an updated sandbox environment for testing, and schedule open office hours to support their engineering teams." },
        { id: "opt-c", label: "Wait until Monday morning at 09:00 AM to announce the delay." },
        { id: "opt-d", label: "Turn off partner support forums to avoid negative feedback." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Proactive, early notification gives partners time to adjust sprint plans", "Transparent explanation of test results demonstrates commitment to data integrity", "Offers concrete support (sandbox environment, technical office hours)"],
    followupBank: [
      {
        id: "comm-q14-f1",
        prompt: "Why is notifying partners days in advance vastly better than waiting until release day?",
        expectedKeyPoints: ["Partners have their own marketing and release dependencies", "Last-minute notice wastes hundreds of developer hours on partner teams", "Severely damages B2B reputation"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Do partners appreciate last-minute surprises on release day?" },
      pointer: { deduction: 10, text: "Early notice allows partners to reschedule their teams without wasted effort." },
      strong: { deduction: 20, text: "Select Option B: proactive communication, sandbox support, and office hours protect partner trust." },
    },
  },

  // 15. Interpret: Executive Meeting Minutes Action Log
  {
    client: {
      id: "comm-q15-meeting-minutes",
      pathSlug: "communication",
      slug: "comm-interpret-meeting-minutes-gap",
      type: "interpret",
      title: "Interpret: Dissecting Flawed Meeting Minutes That Led to Stalled Project",
      scenario: "Minutes from a 1-hour strategic alignment meeting:\n'Discussion held regarding international expansion. Many good points raised. Everyone agreed we should move quickly. Meeting adjourned at 15:00.'",
      prompt: "Explain why these minutes are functionally useless for operational execution and specify what was missing.",
      difficulty: "foundation",
    },
    referenceCriteria: ["Zero documented decisions", "Zero assigned DRIs or task owners", "Zero deadlines, timeline milestones, or recorded dissent/constraints"],
    followupBank: [
      {
        id: "comm-q15-f1",
        prompt: "What format should high-velocity leadership meetings use for minute logs?",
        expectedKeyPoints: ["Decisions Made, Action Items (Owner + Date), Open Questions / Parking Lot"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Who is doing what by when in those minutes?" },
      pointer: { deduction: 10, text: "The notes contain zero decisions, zero owners, and zero deadlines." },
      strong: { deduction: 20, text: "The minutes record no decisions, assign no owners (DRIs), and specify no deadlines, making them useless." },
    },
  },

  // 16. Rewrite: Apology Email for Invoicing Billing Glitch
  {
    client: {
      id: "comm-q16-billing-apology",
      pathSlug: "communication",
      slug: "comm-rewrite-billing-glitch-apology",
      type: "rewrite",
      title: "Rewrite: Customer Notification for Accidental Double Charge",
      scenario: "An automated billing loop accidentally charged 500 customers twice. The draft email reads: 'Our payment processor glitched and charged you twice. Don't worry, we are fixing it. Check your bank in 10 days.'",
      prompt: "Rewrite this message into a sincere, reassuring, and immediate notification that explains the automatic refund, covers bank overdrafts, and provides an immediate support contact.",
      starterContent: "Our payment processor glitched and charged you twice. Don't worry, we are fixing it. Check your bank in 10 days.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Immediate, sincere apology taking direct responsibility", "Clear explanation that refund has been automatically triggered", "Reimbursement commitment for any bank overdraft fees caused by the error", "Dedicated direct priority support channel"],
    followupBank: [
      {
        id: "comm-q16-f1",
        prompt: "Why is offering to cover incidental bank overdraft fees essential for customer trust in financial errors?",
        expectedKeyPoints: ["Customer did not cause the error", "Prevents financial distress for users living paycheck to paycheck", "Demonstrates genuine corporate accountability"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Take ownership instead of blaming the payment processor, and reassure them about bank fees." },
      pointer: { deduction: 10, text: "State that the refund is already initiated, offer to cover overdraft fees, and provide direct support." },
      strong: { deduction: 20, text: "Apologize sincerely, confirm automatic refunds are already processing, commit to covering any overdraft fees, and provide priority contact info." },
    },
  },

  // 17. Triage: Multimodal Escalation for Sev-1 Outage
  {
    client: {
      id: "comm-q17-multimodal-outage",
      pathSlug: "communication",
      slug: "comm-triage-oncall-paging",
      type: "triage",
      title: "Triage / Prioritise: Paging On-Call Engineers at 03:00 AM",
      scenario: "A Sev-1 production outage brings down all transactions at 03:00 AM. You need to alert the on-call engineer who hasn't answered their initial phone page.",
      prompt: "Rank the escalation channels in order of operational urgency.",
      options: [
        { id: "esc-1", label: "Trigger automated PagerDuty escalation policy to secondary on-call and engineering manager phone lines." },
        { id: "esc-2", label: "Send a message in the general Slack channel and wait until morning." },
        { id: "esc-3", label: "Send an email to the team mailing list." },
      ],
      difficulty: "foundation",
    },
    referenceCriteria: ["Rank: Esc 1 (Automated secondary phone escalation) first, never rely on passive email or Slack (2 & 3) at 03:00 AM", "Sev-1 production failure requires immediate active phone paging", "Secondary on-call backup prevents single-point-of-failure"],
    followupBank: [
      {
        id: "comm-q17-f1",
        prompt: "Why should critical on-call rotations always have an automated secondary escalation tier?",
        expectedKeyPoints: ["Primary engineer might have dead phone battery, medical emergency, or deep sleep", "Ensures MTTA (Mean Time to Acknowledge) stays under 5 minutes", "Operational resilience"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Does anyone check team emails at 3 AM during a live outage?" },
      pointer: { deduction: 10, text: "Only active phone alerts through secondary on-call policies wake up engineers at 3 AM." },
      strong: { deduction: 20, text: "Rank Option 1 first: trigger secondary automated phone escalation immediately; email and general Slack are useless at 3 AM." },
    },
  },

  // 18. Spot Mistake: Misrepresenting Experimental AI as Validated Truth
  {
    client: {
      id: "comm-q18-ai-accuracy-claim",
      pathSlug: "communication",
      slug: "comm-spot-ai-marketing-overclaim",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Overclaiming AI Diagnostic Perfection in Marketing Copy",
      scenario: "An AI copywriter generated promotional copy for NextLearn's automated skill assessment.",
      prompt: "Find the erroneous sentence where the copy violates NextLearn's ethical non-negotiable ('experimental evidence, not a validated predictor'), explain the violation, and correct it.",
      starterContent: "NextLearn transforms skill verification with bleeding-edge AI models. Our algorithmic grading provides 100% scientifically validated hiring predictors that guarantee employee job performance without need for human oversight. Candidates receive undeniable proof of skill.",
      difficulty: "foundation",
    },
    plantedErrors: [
      {
        id: "comm-err-18",
        startChar: 68,
        endChar: 219,
        faultyText: "Our algorithmic grading provides 100% scientifically validated hiring predictors that guarantee employee job performance without need for human oversight.",
        explanationKey: "Direct violation of NextLearn non-negotiables: NextLearn explicitly states its sandbox provides 'experimental evidence, not a validated hiring predictor' and always maintains human appeal and review pathways.",
        correctionKey: "NextLearn provides proof-of-skill sandbox evidence graded against transparent rubrics, not validated hiring predictors; human appeal routes are always available.",
      },
    ],
    referenceCriteria: ["Violates the core disclaimer: 'experimental evidence, not a validated predictor'", "Identifies false claim of 100% validated predictor", "Reiterates necessity of human oversight, appeals, and consent-gated evidence"],
    followupBank: [
      {
        id: "comm-q18-f1",
        prompt: "Why does claiming an AI assessment is a 'guaranteed predictor of job performance' violate both ethics and employment law?",
        expectedKeyPoints: ["Lack of longitudinal validation studies", "Disparate impact legal risks", "Overconfidence in stochastic language model scoring"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Check NextLearn's required disclaimer on all candidate evidence." },
      pointer: { deduction: 10, text: "NextLearn never claims to be a validated predictor of job performance." },
      strong: { deduction: 20, text: "Sentence 2 violates core policy: NextLearn is experimental evidence, not a validated hiring predictor." },
    },
  },

  // 19. Case Decision: Handling Accidental Reply-All Incident
  {
    client: {
      id: "comm-q19-reply-all",
      pathSlug: "communication",
      slug: "comm-case-reply-all-containment",
      type: "case_decision",
      title: "Case Decision: Managing an All-Company Reply-All Email Storm",
      scenario: "An intern accidentally replied-all to 5,000 employees with: 'Please unsubscribe me.' Within 10 minutes, 40 other employees reply-all with: 'Stop replying all!' clogging servers and executive inboxes.",
      prompt: "Select the most effective communication leadership response.",
      options: [
        { id: "opt-a", label: "Reply-all to all 5,000 employees with a stern reprimand to stop replying." },
        { id: "opt-b", label: "Have IT exchange admins immediately restrict email permissions on the distribution list, delete the thread from inboxes server-side, and post a calm, humorous Slack reminder about distribution lists." },
        { id: "opt-c", label: "Fire the intern publicly to set an example." },
        { id: "opt-d", label: "Shut down corporate email for 48 hours." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Technical administrative containment over emotional responses", "Restricts distribution list send permissions to admins", "Avoids adding fuel to the fire by not sending another reply-all"],
    followupBank: [
      {
        id: "comm-q19-f1",
        prompt: "Why does sending another reply-all to tell people to stop replying-all always fail?",
        expectedKeyPoints: ["Adds another 5,000 notifications to the queue", "Exacerbates the storm", "Technical administrative controls are the only effective mitigation"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Does sending another email stop the email storm?" },
      pointer: { deduction: 10, text: "Use IT admin controls to lock the list and purge the thread." },
      strong: { deduction: 20, text: "Select Option B: restrict distribution list permissions via IT admin and purge the thread." },
    },
  },

  // 20. Rewrite: Delivering Rejection with Constructive Growth Feedback
  {
    client: {
      id: "comm-q20-job-rejection",
      pathSlug: "communication",
      slug: "comm-rewrite-empathetic-rejection",
      type: "rewrite",
      title: "Rewrite: Cold Candidate Rejection Email into Feedback-Rich Communication",
      scenario: "A recruiter drafted this rejection for a candidate who completed a 4-hour technical sandbox: 'You failed the assessment. We will not be moving forward. Thanks.'",
      prompt: "Rewrite this message into a respectful, constructive update that thanks them for their effort, shares specific rubric strengths, and invites them to re-apply after the 24-hour sandbox cooldown.",
      starterContent: "You failed the assessment. We will not be moving forward. Thanks.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Dignified, respectful tone expressing gratitude for candidate's time", "Clear feedback identifying demonstrated strengths and growth areas", "Encouragement to re-attempt after the cooldown window"],
    followupBank: [
      {
        id: "comm-q20-f1",
        prompt: "How does transparent, respectful rejection feedback impact an employer's talent brand?",
        expectedKeyPoints: ["Candidates share positive experiences on Glassdoor/LinkedIn", "Higher re-application rates from improving candidates", "Distinguishes company from ghosting employers"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Acknowledge the candidate's effort and provide constructive areas for development." },
      pointer: { deduction: 10, text: "Thank them, highlight what they did well, note growth opportunities, and invite them back." },
      strong: { deduction: 20, text: "Structure with gratitude, constructive rubric feedback, and encouragement to retry after the cooldown period." },
    },
  },

  // 21. Fix It: Broken Asynchronous Handoff Documentation
  {
    client: {
      id: "comm-q21-handoff-docs",
      pathSlug: "communication",
      slug: "comm-fix-async-handoff",
      type: "fix_it",
      title: "Fix It: Incomplete Shift Handoff for Global On-Call Rotation",
      scenario: "A European engineer logging off handed over to the US team with: 'Cluster had some alerts today. Dealt with it. Talk tomorrow.' The US engineer is left guessing what was touched.",
      prompt: "Structure a proper operational shift handoff containing: Current State, Active Alerts, Changes Made, and What to Monitor.",
      starterContent: "Cluster had some alerts today. Dealt with it. Talk tomorrow.",
      difficulty: "foundation",
    },
    referenceCriteria: ["Clear structure: Current Health, Incidents Resolved, Changes Deployed, Watchlist Items", "Includes links to dashboard, PRs, or logs", "Names current on-call contact if follow-up is needed"],
    followupBank: [
      {
        id: "comm-q21-f1",
        prompt: "Why are shift handoffs the most vulnerable point in 24/7 reliability operations?",
        expectedKeyPoints: ["Loss of context across timezone boundaries", "Undetected silent changes", "Assumptions that the other team knows the state"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "What specific details does the incoming engineer need to keep the cluster safe?" },
      pointer: { deduction: 10, text: "Provide Current Status, Resolved Incidents, Specific Configurations Changed, and Active Watch Items." },
      strong: { deduction: 20, text: "Use structured template: Status, What Happened, Changes Deployed, and Watchlist for the next shift." },
    },
  },

  // 22. Interpret: Visual Bias in Executive Slide Deck
  {
    client: {
      id: "comm-q22-slide-visual-bias",
      pathSlug: "communication",
      slug: "comm-interpret-slide-visual-bias",
      type: "interpret",
      title: "Interpret: Manipulative Typography and Iconography in Slide Pitch",
      scenario: "A proposal slide shows two options:\n- Option A (Our Preferred Architecture): Bold green font, 24pt, checkmarks, smiling team icon, titled 'Modern High-Velocity Cloud'\n- Option B (Existing Architecture): Dim gray font, 12pt, red 'X' icons, titled 'Legacy Dinosaurs'",
      prompt: "Explain how this presentation design violates objective professional communication standards and why it alienates senior decision-makers.",
      difficulty: "foundation",
    },
    referenceCriteria: ["Emotional manipulation through color, font size, and pejorative labeling ('Legacy Dinosaurs')", "Fails to present objective trade-offs (cost, migration risk, team expertise)", "Senior decision-makers distrust biased framing; professional communication requires objective facts"],
    followupBank: [
      {
        id: "comm-q22-f1",
        prompt: "How should an engineer present architecture trade-offs to executives credibly?",
        expectedKeyPoints: ["Balanced matrix with Pros, Cons, Costs, and Risks for each option", "Objective criteria", "Acknowledge value of existing system"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Is calling an existing system 'Legacy Dinosaurs' objective technical communication?" },
      pointer: { deduction: 10, text: "Manipulative fonts and biased labels destroy credibility with executives." },
      strong: { deduction: 20, text: "The slide uses pejorative labels and visual manipulation instead of objective trade-off analysis, alienating executives." },
    },
  },

  // 23. Spot Mistake: Hallucinated Security Certification
  {
    client: {
      id: "comm-q23-soc2-claim",
      pathSlug: "communication",
      slug: "comm-spot-unverified-soc2-claim",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Claiming Unverified SOC-2 Type II Compliance",
      scenario: "An automated sales RFP responder generated answers for an enterprise procurement questionnaire.",
      prompt: "Find the erroneous sentence where the AI claims unverified regulatory certification, explain the legal hazard, and correct it.",
      starterContent: "NextLearn adheres to industry-leading data security protocols. We are proud to confirm that our platform is fully SOC-2 Type II certified and HIPAA compliant across all customer environments. We encrypt all data in transit using TLS 1.3.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "comm-err-23",
        startChar: 69,
        endChar: 213,
        faultyText: "We are proud to confirm that our platform is fully SOC-2 Type II certified and HIPAA compliant across all customer environments.",
        explanationKey: "Claiming formal SOC-2 Type II certification and HIPAA compliance when audits are pending constitutes fraud in procurement RFPs, voiding enterprise contracts and creating severe legal liability.",
        correctionKey: "Accurately state that the company adheres to SOC-2 aligned security controls and is currently preparing for formal third-party audit.",
      },
    ],
    referenceCriteria: ["Identifies false claim of SOC-2 Type II and HIPAA certification", "Highlights legal fraud risk in enterprise RFP questionnaires", "Substitutes accurate status: adhering to controls and preparing for audit"],
    followupBank: [
      {
        id: "comm-q23-f1",
        prompt: "What happens during enterprise security procurement when a vendor is caught making false compliance claims?",
        expectedKeyPoints: ["Immediate disqualification", "Contract termination for fraud", "Blacklisting across corporate vendor networks"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can you claim formal certification before the external audit is complete?" },
      pointer: { deduction: 10, text: "Sentence 2 claims full SOC-2 Type II and HIPAA compliance." },
      strong: { deduction: 20, text: "Sentence 2 falsely claims SOC-2 Type II and HIPAA certification, which is fraud if not completed." },
    },
  },

  // 24. Case Decision: Managing Public Outcry Over Product Change
  {
    client: {
      id: "comm-q24-product-backlash",
      pathSlug: "communication",
      slug: "comm-case-product-redesign-backlash",
      type: "case_decision",
      title: "Case Decision: Addressing Community Backlash Over UI Navigation Redesign",
      scenario: "A major UI navigation redesign launched on Monday. Long-time power users are furiously posting in community forums demanding the old layout back, claiming workflows are broken.",
      prompt: "Select the most effective community communications strategy.",
      options: [
        { id: "opt-a", label: "Delete all critical forum posts and ban vocal power users from the community." },
        { id: "opt-b", label: "Acknowledge the friction publicly: post a sincere note from the Head of Product explaining why the change was made, share quick keyboard shortcuts for power workflows, and invite 10 vocal users to a live feedback session." },
        { id: "opt-c", label: "Immediately roll back the entire codebase to the 5-year-old legacy interface." },
        { id: "opt-d", label: "Publish an article arguing that users are wrong and resist progress." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Validates user frustration without being defensive", "Provides practical workflow bridges (shortcuts, tips)", "Engages vocal advocates through direct feedback sessions"],
    followupBank: [
      {
        id: "comm-q24-f1",
        prompt: "Why are the most vocal critical users often a product's most valuable long-term assets?",
        expectedKeyPoints: ["They care deeply about the product", "Willing to spend time providing granular workflow feedback", "Can become the strongest advocates when listened to"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Listen to power users without being defensive, and help them with shortcuts." },
      pointer: { deduction: 10, text: "Option B acknowledges user friction, shares shortcut guides, and invites them to collaborate." },
      strong: { deduction: 20, text: "Select Option B: acknowledge the change calmly, provide workflow bridges, and invite user feedback." },
    },
  },
];
