import "server-only";
import { FinalTestQuestionServer } from "@/lib/final-test-types";

export const businessAnalyticsQuestions: FinalTestQuestionServer[] = [
  // 1. Spot Mistake: Blended vs Paid CAC
  {
    client: {
      id: "ba-q1-cac-blended",
      pathSlug: "business-analytics",
      slug: "ba-spot-blended-cac-illusion",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Blended vs Paid CAC Masking Inefficiency",
      scenario: "An automated investor report claims that marketing ad spend is wildly profitable because 'Blended CAC' is only $20, while omitting that 80% of acquisitions were organic word-of-mouth.",
      prompt: "Identify the erroneous sentence where the AI misrepresents marketing channel efficiency, explain the flaw, and state the true Paid CAC.",
      starterContent: "In Q2, we spent $100,000 on paid performance ads and acquired 5,000 total customers across all channels (1,000 paid and 4,000 organic). The AI concludes that our ad campaigns achieved an outstanding Customer Acquisition Cost of $20 per customer. Therefore, we should instantly double paid ad spend to drive massive profitable scale.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "ba-err-1",
        startChar: 147,
        endChar: 275,
        faultyText: "The AI concludes that our ad campaigns achieved an outstanding Customer Acquisition Cost of $20 per customer.",
        explanationKey: "Dividing total ad spend ($100,000) by total customers (5,000) yields Blended CAC of $20, but the actual Paid CAC is $100,000 / 1,000 = $100 per paid customer. Paid efficiency is 5x worse than claimed.",
        correctionKey: "Paid CAC was $100 ($100,000 ad spend / 1,000 paid acquisitions), not $20.",
      },
    ],
    referenceCriteria: ["Identifies conflation of Blended CAC with Paid CAC", "Calculates Paid CAC as $100,000 / 1,000 = $100", "Warns that doubling ad budget will not deliver $20 acquisitions"],
    followupBank: [
      {
        id: "ba-q1-f1",
        prompt: "Why is relying on Blended CAC dangerous when scaling ad campaigns in new markets?",
        expectedKeyPoints: ["Organic traffic does not scale linearly with ad spend", "New markets have zero organic word-of-mouth", "Marginal CAC escalates dramatically"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "How many customers did paid ads actually acquire vs organic?" },
      pointer: { deduction: 10, text: "Ad spend of $100,000 only acquired 1,000 paid customers." },
      strong: { deduction: 20, text: "Sentence 2 is wrong: Paid CAC is $100 ($100,000 / 1,000), not $20." },
    },
  },

  // 2. Fix It: Broken Spreadsheet Formula for LTV
  {
    client: {
      id: "ba-q2-ltv-formula",
      pathSlug: "business-analytics",
      slug: "ba-fix-ltv-formula",
      type: "fix_it",
      title: "Fix It: Lifetime Value (LTV) Formula Omitting Gross Margin",
      scenario: "A junior analyst wrote an LTV spreadsheet formula as `=ARPU / ChurnRate`, calculating LTV as $50 / 0.05 = $1,000. However, the company's gross profit margin is only 40%.",
      prompt: "Fix the formula so it incorporates gross margin and explain the difference between Revenue LTV and Gross Profit LTV.",
      starterContent: "=ARPU / ChurnRate",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Formulates =(ARPU * GrossMargin) / ChurnRate", "Notes that $1,000 is top-line revenue, not cash contribution", "Computes actual Gross Profit LTV as $400 ($1,000 * 40%)"],
    followupBank: [
      {
        id: "ba-q2-f1",
        prompt: "If CAC is $500, what happens to the business if leadership uses Revenue LTV ($1,000) instead of Gross Profit LTV ($400)?",
        expectedKeyPoints: ["Business appears to have positive 2x LTV:CAC", "Actually loses $100 in gross margin on every acquisition", "Insolvency / cash burn acceleration"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Does revenue equal gross profit?" },
      pointer: { deduction: 10, text: "LTV must be multiplied by Gross Profit Margin." },
      strong: { deduction: 20, text: "Formula: `=(ARPU * GrossMargin) / ChurnRate`." },
    },
  },

  // 3. Case Decision: Price Hike vs Churn Trade-off
  {
    client: {
      id: "ba-q3-pricing-tradeoff",
      pathSlug: "business-analytics",
      slug: "ba-case-pricing-elasticity",
      type: "case_decision",
      title: "Case Decision: Evaluating a 20% Price Increase with Projected Churn",
      scenario: "A SaaS tool with 10,000 subscribers at $100/mo ($1M MRR) considers raising prices by 20% to $120/mo. Pricing research forecasts that 8% of subscribers will churn immediately as a result.",
      prompt: "Select whether the business should execute this price hike and defend the net MRR impact.",
      options: [
        { id: "opt-a", label: "Reject the price hike because losing 800 customers permanently damages brand perception." },
        { id: "opt-b", label: "Accept the price hike: 9,200 remaining customers at $120/mo yields $1.104M MRR (a net gain of $104k/mo with lower server support overhead)." },
        { id: "opt-c", label: "Cut prices by 20% to $80/mo to acquire more users." },
        { id: "opt-d", label: "Double prices to $200/mo without testing elasticity." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Calculates 9,200 * $120 = $1,104,000 MRR", "Recognizes net revenue expansion (+10.4% MRR) despite customer volume loss", "Identifies operating margin improvements from serving fewer customers for higher revenue"],
    followupBank: [
      {
        id: "ba-q3-f1",
        prompt: "What operational safeguard should the company put in place for high-tier enterprise accounts during this transition?",
        expectedKeyPoints: ["Grandfathering existing annual contracts", "Value-add feature bundling", "Account executive proactive outreach"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Calculate 9,200 * $120 vs 10,000 * $100." },
      pointer: { deduction: 10, text: "9,200 * $120 = $1,104,000 MRR, which is +$104,000 MRR higher." },
      strong: { deduction: 20, text: "Select Option B: the business gains $104k in net monthly revenue with fewer accounts to support." },
    },
  },

  // 4. Interpret: Unit Economics Payback Period Curve
  {
    client: {
      id: "ba-q4-payback-curve",
      pathSlug: "business-analytics",
      slug: "ba-interpret-payback-curve",
      type: "interpret",
      title: "Interpret: CAC Payback Period Across Marketing Channels",
      scenario: "A financial chart shows cumulative gross profit contribution curves over 24 months for 3 channels:\n- Channel A (Search): Breakeven at month 5, flattens at month 12.\n- Channel B (Events): Breakeven at month 18, steep slope continuing through month 24.\n- Channel C (Paid Social): Never reaches breakeven (tops out at 70% of CAC at month 24).",
      prompt: "Interpret which channel provides the fastest cash cycle vs highest enterprise value, and diagnose Channel C.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Channel A provides fast cash payback (month 5), ideal for short runway", "Channel B has high compounding retention value for long-term LTV", "Channel C is value-destructive (LTV < CAC) and should be halted"],
    followupBank: [
      {
        id: "ba-q4-f1",
        prompt: "Under what specific runway condition should a CEO prioritize Channel A over Channel B?",
        expectedKeyPoints: ["Tight cash runway (< 12 months)", "Need to reinvest payback cash into next cohort immediately", "High cost of capital"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Look at when each channel crosses the 100% CAC breakeven horizontal line." },
      pointer: { deduction: 10, text: "Channel A recovers cash in 5 months; Channel C loses money permanently." },
      strong: { deduction: 20, text: "Channel A has the fastest payback (month 5); Channel B has long-term upside; Channel C burns cash and must be cut." },
    },
  },

  // 5. Triage: Budget Allocation with $500k Cap
  {
    client: {
      id: "ba-q5-budget-triage",
      pathSlug: "business-analytics",
      slug: "ba-triage-budget-allocation",
      type: "triage",
      title: "Triage / Prioritise: Capital Allocation Across 4 Growth Initiatives",
      scenario: "You have a $500,000 discretionary capital budget. Leadership needs you to prioritize 4 competing initiatives based on expected payback and strategic risk.",
      prompt: "Rank these initiatives from highest to lowest priority and justify the trade-offs.",
      options: [
        { id: "init-1", label: "Automated onboarding tool ($100k, cuts month-1 churn from 14% to 8%, 3-month payback)." },
        { id: "init-2", label: "Celebrity influencer campaign ($250k, unmeasured organic reach, no trackable conversion data)." },
        { id: "init-3", label: "Self-serve billing portal ($150k, reduces payment failure involuntary churn, 4-month payback)." },
        { id: "init-4", label: "Experimental VR shopping showroom ($300k, research concept, 36-month estimated payback)." },
      ],
      difficulty: "intermediate",
    },
    referenceCriteria: ["Rank: 1 -> 3 -> 4 -> 2 (or 1 & 3 first)", "Prioritizes high-conviction churn reduction with sub-4-month payback", "Rejects unmeasurable celebrity campaign and long-dated VR R&D with limited cash"],
    followupBank: [
      {
        id: "ba-q5-f1",
        prompt: "Why is reducing existing customer churn financially superior to pouring more capital into top-of-funnel acquisition?",
        expectedKeyPoints: ["Plugs leaky bucket", "Compounding retention elevates lifetime value of all future cohorts", "Near-zero acquisition cost for retained revenue"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Look at payback period and measurable impact on churn." },
      pointer: { deduction: 10, text: "Initiatives 1 and 3 pay back within 3-4 months and fit easily within $500k." },
      strong: { deduction: 20, text: "Rank Initiative 1 (Onboarding) and Initiative 3 (Billing) as top priorities; deprioritize unmeasured Influencer (2) and VR (4)." },
    },
  },

  // 6. Fix It: Broken Spreadsheet CAGR Formula
  {
    client: {
      id: "ba-q6-cagr-formula",
      pathSlug: "business-analytics",
      slug: "ba-fix-cagr-formula",
      type: "fix_it",
      title: "Fix It: Broken Compound Annual Growth Rate (CAGR) Formula",
      scenario: "An analyst calculated 3-year revenue growth (from $10M in Year 0 to $20M in Year 3) using simple average: `=(20 - 10) / 10 / 3` = 33.3%, which ignores compound interest.",
      prompt: "Provide the correct geometric CAGR formula `(Ending / Beginning)^(1/N) - 1` and compute the true compound rate.",
      starterContent: "=(EndValue - StartValue) / StartValue / Years",
      difficulty: "foundation",
    },
    referenceCriteria: ["Correct formula: =(EndValue / StartValue)^(1 / Years) - 1", "Calculates true CAGR: (20/10)^(1/3) - 1 = 2^(0.3333) - 1 = 25.99%", "Explains that simple arithmetic average overstates compound performance"],
    followupBank: [
      {
        id: "ba-q6-f1",
        prompt: "Why does simple arithmetic averaging mislead long-term investment returns?",
        expectedKeyPoints: ["Ignores compounding effect", "Volatile annual swings distort arithmetic means", "Geometric mean represents true constant growth trajectory"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "CAGR uses exponents: (End / Start)^(1/Years) - 1." },
      pointer: { deduction: 10, text: "The compound rate for doubling in 3 years is 26%, not 33.3%." },
      strong: { deduction: 20, text: "Use formula: `=(EndValue / StartValue)^(1 / Years) - 1` resulting in ~26.0%." },
    },
  },

  // 7. Spot Mistake: Confusing Runway with Gross Burn
  {
    client: {
      id: "ba-q7-burn-runway",
      pathSlug: "business-analytics",
      slug: "ba-spot-burn-runway-conflation",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Cash Runway Derived from Gross Instead of Net Burn",
      scenario: "An AI cash management report computed runway using Gross Expenses rather than Net Burn for a company with healthy operating revenues.",
      prompt: "Identify the erroneous sentence, explain why Gross Burn distorts true runway, and calculate the actual Net Runway.",
      starterContent: "The company holds $2,000,000 in cash. Monthly operating expenses are $200,000, while monthly customer revenue collections are $150,000. The automated report concludes the company has only 10 months of runway remaining ($2M / $200k) and must immediately freeze hiring. This ignores operating cash inflows.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "ba-err-7",
        startChar: 135,
        endChar: 278,
        faultyText: "The automated report concludes the company has only 10 months of runway remaining ($2M / $200k) and must immediately freeze hiring.",
        explanationKey: "Net Burn is Expenses minus Revenue ($200k - $150k = $50k/mo). The true runway is $2,000,000 / $50,000 = 40 months, four times longer than the 10 months reported.",
        correctionKey: "Net monthly burn is $50,000; the true runway is 40 months ($2M / $50k), not 10 months.",
      },
    ],
    referenceCriteria: ["Identifies calculation based on gross expenses instead of net burn", "Calculates net burn as $200k - $150k = $50k per month", "Calculates true runway as $2,000,000 / $50,000 = 40 months"],
    followupBank: [
      {
        id: "ba-q7-f1",
        prompt: "When might an investor prudently calculate Gross Runway alongside Net Runway?",
        expectedKeyPoints: ["Zero-revenue downside stress test", "Risk of sudden customer revenue collapse", "Worst-case liquidation planning"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Subtract monthly revenue from monthly expenses to find Net Burn." },
      pointer: { deduction: 10, text: "$200,000 expenses - $150,000 revenue = $50,000 net burn per month." },
      strong: { deduction: 20, text: "Sentence 3 is wrong: Net burn is $50k/mo, so runway is 40 months ($2M / $50k), not 10 months." },
    },
  },

  // 8. Case Decision: Annual vs Monthly Subscription Discounting
  {
    client: {
      id: "ba-q8-annual-vs-monthly",
      pathSlug: "business-analytics",
      slug: "ba-case-annual-subscription-discount",
      type: "case_decision",
      title: "Case Decision: Evaluating a '2 Months Free' Annual Plan Discount",
      scenario: "Product is priced at $50/month ($600/year). Management wants to offer an annual prepayment plan at $500/year (16.7% discount). Monthly churn is 6% per month.",
      prompt: "Select whether the annual discount expands cash flow and lifetime value, and justify your analysis.",
      options: [
        { id: "opt-a", label: "Reject the annual plan because discounting $100 per user leaves money on the table." },
        { id: "opt-b", label: "Approve the annual plan: 6% monthly churn means average monthly customer lifespan is ~16.6 months; upfront annual cash eliminates month-to-month churn and provides zero-cost working capital." },
        { id: "opt-c", label: "Require all customers to prepay 5 years in advance." },
        { id: "opt-d", label: "Eliminate monthly plans completely to force annual adoption." },
      ],
      difficulty: "intermediate",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Recognizes upfront working capital benefits", "Locks in customer for 12 months, avoiding early churn cliff", "Notes negative working capital financing advantages"],
    followupBank: [
      {
        id: "ba-q8-f1",
        prompt: "How does deferred revenue from annual subscriptions appear on the balance sheet under GAAP accounting?",
        expectedKeyPoints: ["Recorded as current liability (unearned revenue)", "Recognized ratably each month as service is delivered", "Protects matching principle"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "What is the cash flow value of getting $500 immediately on day 1?" },
      pointer: { deduction: 10, text: "Annual plans lock in 12 months of revenue from users who might otherwise churn in month 2 or 3." },
      strong: { deduction: 20, text: "Select Option B: eliminates monthly churn risk, guarantees 12 months revenue, and provides upfront working capital." },
    },
  },

  // 9. Interpret: Cohort Retention Heatmap
  {
    client: {
      id: "ba-q9-retention-heatmap",
      pathSlug: "business-analytics",
      slug: "ba-interpret-retention-heatmap",
      type: "interpret",
      title: "Interpret: SaaS Retention Curve Flattening vs Leaking Bucket",
      scenario: "A cohort matrix displays customer retention by month:\n- Cohort Jan 2026: Month 1 (80%), Month 3 (65%), Month 6 (60%), Month 12 (60%)\n- Cohort Jul 2025: Month 1 (80%), Month 3 (50%), Month 6 (30%), Month 12 (10%)",
      prompt: "Compare the two cohorts. Has the business achieved product-market fit? What is the defining characteristic of the Jan 2026 curve?",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Jan 2026 curve flattens asymptotically at 60%, showing product-market fit", "Jul 2025 cohort continues trending toward zero (leaky bucket)", "Flattening retention curve is the quintessential signal of sustainable unit economics"],
    followupBank: [
      {
        id: "ba-q9-f1",
        prompt: "Why can a business with a flattening retention curve safely spend more on CAC than one with an unflattened curve?",
        expectedKeyPoints: ["Predictable lifetime value", "Terminal customer value does not decay to zero", "Net negative churn potential through expansion"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Does the Jan 2026 retention curve ever stop declining?" },
      pointer: { deduction: 10, text: "Jan 2026 stabilizes at 60% from Month 6 through Month 12." },
      strong: { deduction: 20, text: "Jan 2026 flattens at 60% indicating true product-market fit; Jul 2025 decays toward zero." },
    },
  },

  // 10. Rewrite: Communicating Unit Economics to Non-Finance Team
  {
    client: {
      id: "ba-q10-unit-econ-memo",
      pathSlug: "business-analytics",
      slug: "ba-rewrite-unit-econ-memo",
      type: "rewrite",
      title: "Rewrite: Translating LTV/CAC Metrics for Product Designers and Engineers",
      scenario: "A CFO drafted this note to engineering: 'Our Magic Number is sub-0.7 and Quick Ratio is 1.1 due to poor gross margin LTV realization. All non-revenue sprint tickets are frozen.'",
      prompt: "Rewrite this message into an empathetic, clear, actionable update for product engineers explaining what the business reality is and what engineering can do to help.",
      starterContent: "Our Magic Number is sub-0.7 and Quick Ratio is 1.1 due to poor gross margin LTV realization. All non-revenue sprint tickets are frozen.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Translates financial jargon into operational product terms", "Explains that new customer revenue is not outpacing customer losses", "Focuses team on customer retention, onboarding, and self-serve improvements"],
    followupBank: [
      {
        id: "ba-q10-f1",
        prompt: "How can engineering improvements directly improve Gross Margin LTV?",
        expectedKeyPoints: ["Cloud infrastructure optimization (lower COGS)", "Automating customer support workflows", "Reducing third-party API transaction costs"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Translate financial metrics (Magic Number, Quick Ratio) into customer churn and revenue realities." },
      pointer: { deduction: 10, text: "Explain that we are spending more to acquire users than they contribute in profit, so we must prioritize retention." },
      strong: { deduction: 20, text: "Frame clearly: our customer revenue is growing slower than our costs, so current sprints will focus on retaining users and reducing infrastructure costs." },
    },
  },

  // 11. Triage: Enterprise Sales Pipeline Under End-of-Quarter Crunch
  {
    client: {
      id: "ba-q11-pipeline-triage",
      pathSlug: "business-analytics",
      slug: "ba-triage-sales-pipeline",
      type: "triage",
      title: "Triage / Prioritise: Closing 3 Deals with 48 Hours Remaining in Quarter",
      scenario: "The sales VP has 48 hours to secure $200k in bookings to hit the company target. Only 1 solutions architect is available to finalize contracts.",
      prompt: "Rank these 3 deals in priority order and justify your risk-weighted trade-off.",
      options: [
        { id: "deal-1", label: "Deal Alpha: $250k ARR, procurement legal review complete, waiting on CEO signature." },
        { id: "deal-2", label: "Deal Beta: $500k ARR, in technical proof-of-concept trial, 12 unresolved security objections." },
        { id: "deal-3", label: "Deal Gamma: $80k ARR, standard click-through terms, verbal commit from department head." },
      ],
      difficulty: "foundation",
    },
    referenceCriteria: ["Rank: Deal 1 -> Deal 3 -> Deal 2", "Deal 1 exceeds the entire $200k target with near-zero friction remaining", "Deal 2 has 12 technical blockers that cannot be resolved in 48 hours"],
    followupBank: [
      {
        id: "ba-q11-f1",
        prompt: "What is the danger of chasing Deal Beta in the final 48 hours?",
        expectedKeyPoints: ["High probability of slippage", "Distracts executive attention from closing Deal Alpha", "Misses quarterly target completely"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Which deal meets the target and has already passed procurement?" },
      pointer: { deduction: 10, text: "Deal 1 ($250k) solves the quarterly goal alone and only needs a signature." },
      strong: { deduction: 20, text: "Order: Deal 1 (Alpha) first, Deal 3 (Gamma) second, Deal 2 (Beta) last due to 12 unresolved security blockers." },
    },
  },

  // 12. Fix It: Broken Spreadsheet VLOOKUP vs XLOOKUP Range
  {
    client: {
      id: "ba-q12-vlookup-fix",
      pathSlug: "business-analytics",
      slug: "ba-fix-vlookup-fragility",
      type: "fix_it",
      title: "Fix It: Fragile VLOOKUP Column Index Shifting Bug",
      scenario: "A financial model used `=VLOOKUP(A2, PricingTable, 4, FALSE)`. When another analyst inserted a new column into the pricing table, the formula silently began pulling the wrong tax rate.",
      prompt: "Upgrade the formula to `XLOOKUP` or `INDEX/MATCH` to make it resilient to inserted columns.",
      starterContent: "=VLOOKUP(A2, PricingTable!A:D, 4, FALSE)",
      difficulty: "foundation",
    },
    referenceCriteria: ["Uses XLOOKUP(A2, PricingTable!A:A, PricingTable!D:D) or INDEX/MATCH", "Explains that hardcoded column index 4 breaks when columns are inserted", "Provides exact column header binding"],
    followupBank: [
      {
        id: "ba-q12-f1",
        prompt: "Why has XLOOKUP largely superseded VLOOKUP in enterprise financial modeling?",
        expectedKeyPoints: ["Direct column references that adapt to column insertion", "Exact match by default", "Ability to look up to the left of key column"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "XLOOKUP specifies the return column explicitly instead of a hardcoded number." },
      pointer: { deduction: 10, text: "Change to `=XLOOKUP(A2, PricingTable!A:A, PricingTable!D:D)`." },
      strong: { deduction: 20, text: "Use: `=XLOOKUP(A2, PricingTable!A:A, PricingTable!D:D)`." },
    },
  },

  // 13. Spot Mistake: Phantom Margin in Wholesale Inventory
  {
    client: {
      id: "ba-q13-phantom-margin",
      pathSlug: "business-analytics",
      slug: "ba-spot-phantom-margin",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Omitting Freight and Customs in Gross Margin",
      scenario: "An AI merchandising analysis claimed an 80% gross profit margin on imported electronics by comparing retail price directly to factory invoice price.",
      prompt: "Find the erroneous sentence, explain the missing cost components, and state the true margin impact.",
      starterContent: "Our retail headphones sell for $100 and the overseas factory invoice is $20 per unit. The AI calculated an extraordinary 80% gross margin. This high margin allows us to spend up to $60 on Facebook ads per unit while remaining profitable. Shipping, import tariffs, and fulfillment fees were excluded.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "ba-err-13",
        startChar: 93,
        endChar: 198,
        faultyText: "This high margin allows us to spend up to $60 on Facebook ads per unit while remaining profitable.",
        explanationKey: "Landed cost includes freight, tariffs, payment processing, and fulfillment. If landed cost is $50, true gross margin is 50%, not 80%. Spending $60 on ads creates a net operating loss on every sale.",
        correctionKey: "Landed COGS is significantly higher once freight, tariffs, and fulfillment are included, meaning a $60 ad spend causes net losses.",
      },
    ],
    referenceCriteria: ["Identifies landed cost of goods sold (COGS)", "Points out exclusion of shipping, import duties, and warehouse packaging", "Warns that $60 ad spend will plunge the product into operating losses"],
    followupBank: [
      {
        id: "ba-q13-f1",
        prompt: "What is the formal definition of 'Fully Landed Cost' in physical e-commerce?",
        expectedKeyPoints: ["Factory unit cost + overseas freight + port customs/duties + local transport + warehouse intake fees"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can you ignore shipping and customs tariffs when calculating margin?" },
      pointer: { deduction: 10, text: "Sentence 3 claims spending $60 on ads is profitable based on a flawed 80% margin." },
      strong: { deduction: 20, text: "Sentence 3 is wrong: landed costs will consume margin; spending $60 on ads leads to net losses per unit." },
    },
  },

  // 14. Case Decision: Build vs Buy for Core Customer Billing
  {
    client: {
      id: "ba-q14-build-vs-buy",
      pathSlug: "business-analytics",
      slug: "ba-case-build-buy-billing",
      type: "case_decision",
      title: "Case Decision: In-House Billing Engine vs Commercial Platform (Stripe)",
      scenario: "A 25-person startup is debating whether to spend 6 months of senior engineering time building a proprietary billing and subscription engine or pay a commercial platform 2.9% + 30¢ per transaction.",
      prompt: "Select the strategic decision and defend the opportunity cost and compliance trade-offs.",
      options: [
        { id: "opt-a", label: "Build in-house to save the 2.9% payment processing fee and retain full control." },
        { id: "opt-b", label: "Buy / integrate Stripe: opportunity cost of 6 months of engineering diverted from core differentiating product features exceeds the processing fee; commercial platforms handle global tax compliance and PCI-DSS." },
        { id: "opt-c", label: "Accept only physical paper checks by mail to avoid all payment fees." },
        { id: "opt-d", label: "Delay monetization until the company reaches 100 employees." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Opportunity cost of core product development vs billing infrastructure", "PCI-DSS compliance and global sales tax / VAT liability", "Speed to market and operational focus"],
    followupBank: [
      {
        id: "ba-q14-f1",
        prompt: "At what future transaction volume might the calculus shift toward renegotiating rates or hybrid routing?",
        expectedKeyPoints: ["Tens of millions in GMV", "Dedicated treasury engineering team justified", "Interchange-plus pricing negotiation"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Is building a billing engine the core competitive advantage of this startup?" },
      pointer: { deduction: 10, text: "Diverting 6 months of engineering away from core features to save 2.9% is high opportunity cost." },
      strong: { deduction: 20, text: "Select Option B: use commercial platform to save 6 months of engineering and avoid PCI compliance overhead." },
    },
  },

  // 15. Interpret: Market Sizing TAM, SAM, SOM Pyramids
  {
    client: {
      id: "ba-q15-tam-sam-som",
      pathSlug: "business-analytics",
      slug: "ba-interpret-market-sizing",
      type: "interpret",
      title: "Interpret: Market Sizing Hierarchy in Pitch Deck",
      scenario: "A founder deck defines:\n- TAM: $100 Billion (All global corporate software spending)\n- SAM: $500 Million (Indian B2B SaaS for SMB retail)\n- SOM: $250 Million in Year 1 (50% market share of all Indian SMB retail in Year 1).",
      prompt: "Critique the relationship between TAM, SAM, and SOM. What is the fatal flaw in the SOM assumption?",
      difficulty: "intermediate",
    },
    referenceCriteria: ["TAM is unrealistically broad and unserviceable", "SOM claiming 50% market penetration in Year 1 ($250M) is completely non-credible", "Realistic SOM should represent defensible capture given initial sales headcount and marketing budget"],
    followupBank: [
      {
        id: "ba-q15-f1",
        prompt: "How should a credible bottom-up SOM be calculated for a B2B SaaS startup in Year 1?",
        expectedKeyPoints: ["Number of quota-carrying reps * annual quota", "Realistic inbound lead generation capacity", "Proven historical win rates"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can any startup capture 50% of an entire national market in Year 1?" },
      pointer: { deduction: 10, text: "SOM ($250M) assumes 50% market share in 12 months, which is absurd." },
      strong: { deduction: 20, text: "The SOM is non-credible: assuming 50% market share in year 1 without sales capacity is impossible." },
    },
  },

  // 16. Fix It: Broken Contribution Margin Spreadsheet Calculation
  {
    client: {
      id: "ba-q16-contrib-margin",
      pathSlug: "business-analytics",
      slug: "ba-fix-contribution-margin",
      type: "fix_it",
      title: "Fix It: Conflating Fixed Costs with Variable Costs in Unit Economics",
      scenario: "An analyst calculated product Contribution Margin as `Revenue - (RawMaterials + FactoryRent + ExecutiveSalaries) / Units`, incorrectly deducting fixed overhead from variable margin.",
      prompt: "Correct the formula so Contribution Margin only subtracts Variable Costs, explaining why Fixed Costs belong below the line.",
      starterContent: "=Revenue - (VariableCosts + FixedRent + ExecSalaries)",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Contribution Margin = Revenue - Variable Costs", "Fixed costs do not scale per unit and belong below the contribution line", "Enables accurate calculation of breakeven units"],
    followupBank: [
      {
        id: "ba-q16-f1",
        prompt: "How is Breakeven Quantity calculated once true Contribution Margin per unit is known?",
        expectedKeyPoints: ["Breakeven Units = Total Fixed Costs / Contribution Margin per Unit", "Every unit sold contributes toward covering fixed rent"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Does factory rent increase when you produce 1 additional unit?" },
      pointer: { deduction: 10, text: "Contribution margin only deducts direct variable costs." },
      strong: { deduction: 20, text: "Formula: `=Revenue - VariableCosts`. Fixed rent and executive salaries are covered by the aggregate contribution." },
    },
  },

  // 17. Triage: Resolving Conflicting Departmental KPIs
  {
    client: {
      id: "ba-q17-kpi-conflict",
      pathSlug: "business-analytics",
      slug: "ba-triage-kpi-conflicts",
      type: "triage",
      title: "Triage / Prioritise: Aligning Growth, Finance, and Risk Objectives",
      scenario: "A fintech startup faces a conflict: Growth team wants 0-friction onboarding; Risk team wants 3-day manual document verification; Finance wants to cut fraud chargebacks.",
      prompt: "Rank these 3 operational policy proposals to align incentives and defend your synthesis.",
      options: [
        { id: "pol-1", label: "Automated instant API KYC verification with tiered transaction limits (low limits for instant, high limits after doc verification)." },
        { id: "pol-2", label: "Mandatory 3-day document hold on all new users regardless of transaction size." },
        { id: "pol-3", label: "Zero verification for everyone to maximize top-of-funnel signup growth." },
      ],
      difficulty: "intermediate",
    },
    referenceCriteria: ["Rank: Policy 1 first, Policy 2 second, Policy 3 last", "Tiered limits reconcile growth speed with financial risk mitigation", "Rejects Policy 3 as existential regulatory and fraud hazard"],
    followupBank: [
      {
        id: "ba-q17-f1",
        prompt: "What regulatory penalties can a fintech face under anti-money laundering (AML) laws for adopting zero verification?",
        expectedKeyPoints: ["Loss of banking license", "Criminal penalties for officers", "Freezing of master clearing accounts"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Can you offer instant onboarding with low limits, unlocking higher limits later?" },
      pointer: { deduction: 10, text: "Policy 1 balances growth and fraud prevention through tiered limits." },
      strong: { deduction: 20, text: "Rank Policy 1 first (Tiered API verification), Policy 2 second, and Policy 3 last." },
    },
  },

  // 18. Spot Mistake: Phantom ARR from One-Time Setup Fees
  {
    client: {
      id: "ba-q18-phantom-arr",
      pathSlug: "business-analytics",
      slug: "ba-spot-arr-setup-fees",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Including One-Time Professional Fees in ARR",
      scenario: "An AI revenue accounting agent generated a quarterly SaaS metrics dashboard.",
      prompt: "Identify the erroneous sentence where non-recurring revenue is capitalized into ARR, explain the violation, and provide the correct ARR.",
      starterContent: "In Q1, we closed 10 enterprise deals. Each customer pays $12,000 in annual software subscriptions and a one-time onboarding setup fee of $8,000. The automated dashboard calculated our total new Annual Recurring Revenue as $200,000 ($20,000 * 10). This puts our forward ARR run-rate at record heights.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "ba-err-18",
        startChar: 167,
        endChar: 279,
        faultyText: "The automated dashboard calculated our total new Annual Recurring Revenue as $200,000 ($20,000 * 10).",
        explanationKey: "ARR stands for Annual RECURRING Revenue. One-time onboarding fees of $8,000 do not renew in Year 2. True new ARR is 10 * $12,000 = $120,000. One-time fees are non-recurring professional services.",
        correctionKey: "New ARR is $120,000 (10 deals * $12,000 recurring). The $80,000 in one-time setup fees is non-recurring revenue.",
      },
    ],
    referenceCriteria: ["Identifies inclusion of one-time setup fees in ARR", "Calculates true ARR as 10 * $12,000 = $120,000", "Explains that one-time fees will not repeat in year 2"],
    followupBank: [
      {
        id: "ba-q18-f1",
        prompt: "Why do venture investors penalize software companies whose revenue is heavily weighted toward professional services rather than pure SaaS?",
        expectedKeyPoints: ["Professional services have lower gross margins (30-40% vs 80%)", "Requires human headcount to scale", "Commands lower valuation multiples"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Do one-time setup fees recur next year?" },
      pointer: { deduction: 10, text: "Only the $12,000 software fee recurs; the $8,000 setup fee is paid once." },
      strong: { deduction: 20, text: "Sentence 3 is wrong: ARR is $120k ($12k * 10), not $200k. Setup fees are non-recurring." },
    },
  },

  // 19. Case Decision: Factoring Receivables vs Bank Credit Line
  {
    client: {
      id: "ba-q19-invoice-factoring",
      pathSlug: "business-analytics",
      slug: "ba-case-factoring-vs-credit",
      type: "case_decision",
      title: "Case Decision: Short-Term Working Capital for B2B Enterprise Net-90 Terms",
      scenario: "A B2B supplier has $500,000 in completed invoices owed by Fortune 500 clients payable in 90 days, but needs $100,000 payroll cash in 5 days.",
      prompt: "Select the most cost-effective financing instrument and defend your cost of capital comparison.",
      options: [
        { id: "opt-a", label: "Liquidate the company assets immediately." },
        { id: "opt-b", label: "Draw $100,000 from an existing revolving bank line of credit at 8% annual interest (costing ~$2,000 over 90 days), rather than predatory invoice factoring that charges 5% upfront fee ($25,000)." },
        { id: "opt-c", label: "Cancel payroll and request employees to work without pay for 3 months." },
        { id: "opt-d", label: "Sell 20% equity of the company to an angel investor for $100k." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Compares effective annualized cost of revolving debt (~8% p.a.) vs factoring discount fee (5% flat for 90 days = ~20% annualized)", "Rejects equity dilution for short-term working capital timing needs"],
    followupBank: [
      {
        id: "ba-q19-f1",
        prompt: "Why is issuing equity for predictable working capital cash-cycle lags considered destructive financial management?",
        expectedKeyPoints: ["Permanent dilution of ownership", "High cost of equity vs cheap debt", "Mismatches long-term capital with 90-day liquidity timing"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Compare the interest cost of a bank line vs a 5% factoring fee on $500k." },
      pointer: { deduction: 10, text: "An 8% annual credit line costs ~$2k for 90 days on $100k; factoring costs $25k." },
      strong: { deduction: 20, text: "Select Option B: revolving credit line at 8% annualized is vastly cheaper than invoice factoring." },
    },
  },

  // 20. Rewrite: Quarterly Financial Board Deck Executive Summary
  {
    client: {
      id: "ba-q20-board-summary",
      pathSlug: "business-analytics",
      slug: "ba-rewrite-board-summary",
      type: "rewrite",
      title: "Rewrite: CFO Update on Missing Growth Target While Extending Runway",
      scenario: "A panicked draft reads: 'We bombed the Q3 revenue target by 22% because enterprise sales stalled. But the good news is we cut marketing so we won't run out of cash until next winter.'",
      prompt: "Rewrite this into a poised, transparent, and strategic executive summary for the Board of Directors.",
      starterContent: "We bombed the Q3 revenue target by 22% because enterprise sales stalled. But the good news is we cut marketing so we won't run out of cash until next winter.",
      difficulty: "intermediate",
    },
    referenceCriteria: ["Structured, honest disclosure of Q3 revenue variance (-22%) and primary drivers", "Constructive presentation of cash management and extended runway (e.g. 15 months)", "Clear strategic corrective plan for enterprise sales cycle"],
    followupBank: [
      {
        id: "ba-q20-f1",
        prompt: "What three components must every board variance explanation contain?",
        expectedKeyPoints: ["Magnitude of variance vs budget", "Underlying root causes (external vs execution)", "Corrective countermeasures and revised forecast"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Replace emotional slang ('bombed') with objective variance analysis and strategic measures." },
      pointer: { deduction: 10, text: "State the variance, root cause, cash runway impact, and strategic corrective actions." },
      strong: { deduction: 20, text: "Structure professionally: Q3 Performance Overview, Root Cause Analysis, Cash Runway Extension, and Strategic Corrective Actions." },
    },
  },

  // 21. Fix It: Broken Spreadsheet Dynamic Array Formula
  {
    client: {
      id: "ba-q21-dynamic-array",
      pathSlug: "business-analytics",
      slug: "ba-fix-spill-error",
      type: "fix_it",
      title: "Fix It: Resolving a #SPILL! Error in Financial Projections",
      scenario: "An analyst used `=FILTER(SalesTable, SalesTable[Region]=\"North\")` but the spreadsheet displays `#SPILL!` across the dashboard.",
      prompt: "Explain why `#SPILL!` errors occur and what corrective action clears the range.",
      starterContent: "=FILTER(SalesTable, SalesTable[Region]=\"North\")",
      difficulty: "foundation",
    },
    referenceCriteria: ["Identifies existing data, formulas, or formatting blocking the output spill range", "Action: clear downstream cells to allow dynamic array expansion", "Explains Excel dynamic array mechanics"],
    followupBank: [
      {
        id: "ba-q21-f1",
        prompt: "How can you prevent dynamic arrays from breaking shared executive template sheets?",
        expectedKeyPoints: ["Dedicated output sheets with clean space", "Wrap in aggregations if single values are needed", "Protect downstream cells"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "A #SPILL! error means something is in the way of the formula expanding." },
      pointer: { deduction: 10, text: "Clear any existing text or values in the cells directly below and to the right." },
      strong: { deduction: 20, text: "#SPILL! occurs when cells in the expansion range are blocked. Clear the downstream cells." },
    },
  },

  // 22. Interpret: Sensitivity Matrix of WACC vs Terminal Growth
  {
    client: {
      id: "ba-q22-dcf-sensitivity",
      pathSlug: "business-analytics",
      slug: "ba-interpret-dcf-sensitivity",
      type: "interpret",
      title: "Interpret: DCF Valuation Sensitivity Table (WACC vs Terminal Growth)",
      scenario: "A discounted cash flow (DCF) table shows company enterprise valuation under varying WACC (8% to 12%) and Terminal Growth (2% to 4%):\n- Base case (WACC 10%, Growth 3%): $50M\n- Bull case (WACC 8%, Growth 4%): $95M\n- Bear case (WACC 12%, Growth 2%): $28M",
      prompt: "Interpret why valuation swings by over 3x ($28M to $95M) and what this implies about DCF reliance in early-stage businesses.",
      difficulty: "advanced",
    },
    referenceCriteria: ["High sensitivity of DCF to small changes in cost of capital and terminal assumptions", "Terminal value accounts for 70-80% of total valuation", "DCF is highly fragile for early-stage unpredictable cash flows; requires multiple triangulations"],
    followupBank: [
      {
        id: "ba-q22-f1",
        prompt: "What alternative valuation methodologies should be used alongside DCF for venture-backed companies?",
        expectedKeyPoints: ["Comparable company revenue multiples (EV/ARR)", "Precedent M&A transaction multiples", "Scorecard / Berkus method for early stage"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Notice how a 2% change in discount rate cuts the valuation almost in half." },
      pointer: { deduction: 10, text: "DCF valuations are hypersensitive to terminal growth and discount rate assumptions." },
      strong: { deduction: 20, text: "Terminal value dominates the DCF; small assumption changes create a 3x valuation spread, proving DCF fragility." },
    },
  },

  // 23. Spot Mistake: Miscalculating Price Elasticity of Demand
  {
    client: {
      id: "ba-q23-elasticity-calc",
      pathSlug: "business-analytics",
      slug: "ba-spot-elasticity-mistake",
      type: "spot_mistake",
      title: "Spot the AI's Mistake: Inverting the Price Elasticity Formula",
      scenario: "An automated pricing advisor calculated price elasticity of demand after a 10% price increase resulted in a 20% drop in unit volume.",
      prompt: "Identify the erroneous sentence where the AI inverts the elasticity formula, explain the flaw, and state the true elasticity.",
      starterContent: "A 10% price increase caused a 20% drop in units sold. The AI calculates price elasticity of demand as 0.5 (% change in price / % change in quantity), concluding demand is inelastic. Therefore, we should continue raising prices aggressively.",
      difficulty: "intermediate",
    },
    plantedErrors: [
      {
        id: "ba-err-23",
        startChar: 65,
        endChar: 185,
        faultyText: "The AI calculates price elasticity of demand as 0.5 (% change in price / % change in quantity), concluding demand is inelastic.",
        explanationKey: "Price Elasticity of Demand is (% Change in Quantity) / (% Change in Price) = -20% / +10% = -2.0. The demand is highly ELASTIC (|E| > 1), meaning raising prices destroys total revenue.",
        correctionKey: "Elasticity is -2.0 (% change in quantity / % change in price). Demand is highly elastic; raising prices causes revenue to fall.",
      },
    ],
    referenceCriteria: ["Identifies formula inversion: Elasticity is % delta Quantity / % delta Price", "Computes true elasticity as -2.0 (|2.0| > 1)", "Concludes demand is highly elastic, so raising prices destroys revenue"],
    followupBank: [
      {
        id: "ba-q23-f1",
        prompt: "What happens to total revenue when price is increased on a good with price elasticity of -2.0?",
        expectedKeyPoints: ["Total revenue drops significantly", "Volume decline (-20%) exceeds price gain (+10%)", "Negative revenue elasticity impact"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "Elasticity is % Change in Quantity over % Change in Price." },
      pointer: { deduction: 10, text: "-20% / 10% = -2.0, which is elastic (greater than 1)." },
      strong: { deduction: 20, text: "Sentence 2 is wrong: Elasticity is -2.0 (% Quantity / % Price), meaning demand is elastic, not inelastic." },
    },
  },

  // 24. Case Decision: Capital Expenditure (CapEx) vs Operational Lease (OpEx)
  {
    client: {
      id: "ba-q24-capex-vs-opex",
      pathSlug: "business-analytics",
      slug: "ba-case-capex-vs-opex",
      type: "case_decision",
      title: "Case Decision: Server Hardware Purchase vs Cloud Infrastructure Lease",
      scenario: "A fast-growing AI startup has $1M in cash. Purchasing on-premise GPU servers costs $600,000 upfront (CapEx). Leasing on cloud costs $25,000/month (OpEx).",
      prompt: "Select whether CapEx or OpEx is the prudent capital strategy and defend your cash flexibility analysis.",
      options: [
        { id: "opt-a", label: "Spend $600k upfront to buy servers and deplete 60% of total company cash." },
        { id: "opt-b", label: "Lease on cloud ($25k/mo OpEx): preserves $975k of liquidity for customer acquisition, avoids rapid hardware obsolescence, and allows scaling down if demand shifts." },
        { id: "opt-c", label: "Do not use servers and refuse AI compute workloads." },
        { id: "opt-d", label: "Borrow $10M to build an enterprise datacenter." },
      ],
      difficulty: "foundation",
    },
    expectedChoiceId: "opt-b",
    referenceCriteria: ["Preserves 97% of cash liquidity", "Avoids GPU hardware depreciation and obsolescence risk", "Flexibility to scale up or down based on market demand"],
    followupBank: [
      {
        id: "ba-q24-f1",
        prompt: "Under what future scale condition might migrating from cloud OpEx to on-premise CapEx become economically rational?",
        expectedKeyPoints: ["Predictable steady-state compute baseline", "Scale where cloud margins exceed hardware depreciation costs", "Long-term predictable utilization (> 85%)"],
      },
    ],
    hints: {
      nudge: { deduction: 5, text: "What happens to a startup with only $1M cash if it spends $600k on hardware on day 1?" },
      pointer: { deduction: 10, text: "Cloud leasing preserves liquidity and protects against rapidly obsolete GPU hardware." },
      strong: { deduction: 20, text: "Select Option B: preserves liquidity and avoids hardware obsolescence risk." },
    },
  },
];
