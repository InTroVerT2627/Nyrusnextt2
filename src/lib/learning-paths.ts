import "server-only";

export type LearningQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

export type LearningModule = {
  slug: string;
  title: string;
  summary: string;
  objectives: string[];
  lesson: { heading: string; body: string }[];
  scenario: string;
  questions: LearningQuestion[];
};

export type LearningPath = {
  slug: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  modules: LearningModule[];
};

function q(id: string, prompt: string, choices: [string, string, string], correctIndex: number, explanation: string): LearningQuestion {
  return { id, prompt, choices, correctIndex, explanation };
}

function m(
  slug: string,
  title: string,
  summary: string,
  objectives: string[],
  lesson: [string, string],
  scenario: string,
  questions: [LearningQuestion, LearningQuestion, LearningQuestion],
): LearningModule {
  return {
    slug, title, summary, objectives, scenario,
    lesson: [{ heading: "Learn the idea", body: lesson[0] }, { heading: "Use it in practice", body: lesson[1] }],
    questions,
  };
}

export const learningPaths: LearningPath[] = [
  {
    slug: "data-analytics",
    title: "Data Analytics",
    shortTitle: "Data",
    subtitle: "The Signal Studio",
    description: "Turn raw tables into careful, decision-ready findings. Follow the evidence from a clear question through clean analysis and an honest recommendation.",
    icon: "⌁",
    accent: "mint",
    modules: [
      m("frame-the-question", "Frame the question", "Turn a broad request into an answerable analysis question.", ["Name the decision the analysis should support", "Define the population, measure, and time window"], [
        "Start with the decision, not the chart. Ask who will use the answer and what choice they need to make. Then define the population, unit of analysis, measure, comparison, and time period. A question such as ‘Did onboarding improve?’ is too broad until ‘improve’ and the relevant learners are defined.",
        "Write the question before opening a spreadsheet. Record assumptions and what evidence would change the decision. A tight question keeps exploratory analysis focused while still leaving room to discover an unexpected pattern.",
      ], "A product lead asks whether a new onboarding flow helped learners finish their first lesson.", [
        q("da1q1", "Which question is most ready for analysis?", ["Did we do a good job?", "For new learners in September, did 7-day lesson completion change after the new flow?", "Can you make a chart about onboarding?"], 1, "It defines the population, outcome, window, and comparison."),
        q("da1q2", "Why define the unit of analysis?", ["So each row represents a known kind of observation", "So the dataset has more rows", "So missing values disappear"], 0, "Knowing whether a row is a learner, event, or day prevents accidental double counting."),
        q("da1q3", "What should you clarify before comparing completion rates?", ["Which chart color is preferred", "Whether completion means the same thing in both groups", "Whether the table has the newest file name"], 1, "A consistent outcome definition makes the comparison meaningful."),
      ]),
      m("read-the-dataset", "Read the dataset", "Understand what one row means before calculating anything.", ["Identify the grain and keys", "Separate measures, dimensions, and data types"], [
        "The grain is the real-world thing represented by one row: a person, transaction, event, or person-day. A primary key identifies a row; dimensions describe groups such as region, while measures can be counted or summarized. A field named ‘customer’ can appear on many transaction rows.",
        "Inspect column definitions, date ranges, distinct values, and sample records. Confirm units and whether timestamps use a consistent timezone. These checks reveal when a seemingly simple count would count events instead of people.",
      ], "An exported table has 18,000 rows, but the business team believes it contains 4,000 customers.", [
        q("da2q1", "What does the table grain tell you?", ["How many charts to create", "What one row represents", "Which rows are wrong"], 1, "Grain describes the observation represented by each record."),
        q("da2q2", "A customer appears on five purchase rows. What does COUNT(*) count?", ["Five rows or purchases", "One unique customer", "The customer's lifetime value"], 0, "COUNT(*) counts rows; unique people require a distinct customer key."),
        q("da2q3", "Which field is most useful for checking uniqueness?", ["A free-text comment", "A stable transaction ID", "A formatted currency label"], 1, "A stable identifier lets you test whether each row is unique at the claimed grain."),
      ]),
      m("clean-the-inputs", "Clean the inputs", "Handle missing values, duplicates, and unusual records with context.", ["Check types, missingness, and duplicate keys", "Avoid removing unusual values without a reason"], [
        "Profile the data before editing it: count missing values, inspect duplicate keys, validate types and ranges, and compare totals with a trusted source. A blank can mean unknown, not applicable, or not recorded; those meanings need different treatment.",
        "Investigate outliers before excluding them. A very large order may be a data error or an important enterprise customer. Keep a record of transformations so another analyst can reproduce the result and understand what changed.",
      ], "A revenue column contains blanks, repeated order IDs, and one order much larger than the rest.", [
        q("da3q1", "What is the safest first response to a large outlier?", ["Delete it automatically", "Check its source and business context", "Replace it with the average"], 1, "An outlier may be real; investigate before deciding how to handle it."),
        q("da3q2", "Why check duplicate IDs before summing revenue?", ["Duplicates can count the same transaction more than once", "IDs determine the chart type", "Duplicates always mean fraud"], 0, "Duplicate records can inflate totals, but the cause should be checked rather than assumed."),
        q("da3q3", "A blank delivery date most likely means which thing?", ["The order is definitely late", "The value is unknown or not recorded until investigated", "The date is zero"], 1, "Missingness has to be understood; it does not automatically encode a real value."),
      ]),
      m("summarize-responsibly", "Summarize responsibly", "Use descriptive statistics that fit the shape of the data.", ["Compare mean, median, and spread", "Describe patterns without claiming causes"], [
        "The mean uses every value but can be pulled by extremes. The median is the middle observation and is often more representative for skewed amounts such as income or order size. Spread matters too: two groups can share a mean but have very different variability.",
        "Describe what the data show before explaining why it happened. A difference between groups is an association, not proof that one factor caused the other. State sample size, period, and important caveats alongside the summary.",
      ], "Two regions have the same average order value, but one region has a few very large orders.", [
        q("da4q1", "Which summary is usually less affected by a few very large orders?", ["Median", "Maximum", "Sum"], 0, "The median is resistant to extreme values compared with the mean and sum."),
        q("da4q2", "What does standard deviation help describe?", ["The source system", "How spread out observations are", "Whether a relationship is causal"], 1, "Standard deviation summarizes spread around the mean."),
        q("da4q3", "A higher conversion rate followed a redesign. What can you conclude from that alone?", ["The redesign caused the increase", "The observed rate was higher; causality needs stronger evidence", "Every user preferred the redesign"], 1, "A before/after association can have other explanations such as seasonality or audience changes."),
      ]),
      m("sql-filter-and-group", "Filter and group with SQL", "Build reliable summaries with SELECT, WHERE, GROUP BY, and HAVING.", ["Filter rows before aggregation", "Filter grouped results with HAVING"], [
        "SELECT names the output fields. WHERE filters individual rows before groups are formed; GROUP BY defines the groups; aggregate functions such as COUNT and SUM summarize each group. Use explicit column names so the query is easy to review.",
        "HAVING filters groups after aggregation, for example keeping regions with at least 100 orders. Be careful with NULL: comparisons such as `value = NULL` do not work as expected; use `IS NULL` or `IS NOT NULL`.",
      ], "You need monthly order counts by region, but only for completed orders and regions with at least 100 orders.", [
        q("da5q1", "Which clause removes non-completed rows before counting?", ["WHERE", "HAVING", "ORDER BY"], 0, "WHERE filters source rows before aggregation."),
        q("da5q2", "Which clause can keep only groups with COUNT(*) >= 100?", ["LIMIT", "HAVING", "DISTINCT"], 1, "HAVING filters aggregate results after groups have been calculated."),
        q("da5q3", "How do you find rows with a missing region?", ["region = NULL", "region IS NULL", "region == blank"], 1, "SQL uses IS NULL to test for a missing value."),
      ]),
      m("join-without-inflating", "Join without inflating results", "Use keys and cardinality checks to keep totals trustworthy.", ["Choose a join that matches the question", "Compare row counts and totals before and after joins"], [
        "An inner join keeps matching rows from both tables; a left join keeps every row from the left table and adds matching values from the right. The right choice depends on which records the analysis must preserve, not on which query is shorter.",
        "Before joining, check whether each key is unique on the side you expect. A one-to-many join repeats the one-side row. Compare row counts, distinct entities, and key totals before and after the join to catch accidental multiplication.",
      ], "A customer table is joined to a table that stores one row per customer purchase.", [
        q("da6q1", "What happens to a customer row with four purchases in a one-to-many join?", ["It can appear four times", "It disappears by default", "It becomes one averaged row"], 0, "Each matching purchase creates a joined row unless the purchase data is aggregated first."),
        q("da6q2", "Which join keeps all customers even when they have no purchase?", ["Inner join", "Left join with customers on the left", "Cross join"], 1, "A left join retains all left-side customer rows."),
        q("da6q3", "What is a useful post-join check?", ["Check row counts and distinct keys", "Rename every column", "Sort alphabetically only"], 0, "Comparing counts and keys helps identify dropped or duplicated records."),
      ]),
      m("compare-cohorts", "Compare segments and cohorts", "Make group comparisons with consistent definitions and denominators.", ["Use comparable cohorts and periods", "Show both the numerator and denominator"], [
        "A segment groups records by a meaningful attribute; a cohort groups entities that share a starting event or period. Keep definitions stable across comparisons. For retention, for example, compare learners who started in the same way and follow them for the same number of days.",
        "Rates need denominators. ‘120 completed’ means something different out of 150 than out of 1,200. Check whether the audience mix changed: an overall rate can move simply because the proportion of high- and low-performing segments changed.",
      ], "A weekly report says completions rose from 80 to 100 while new learner signups also rose sharply.", [
        q("da7q1", "What denominator helps compare completion fairly?", ["Number of new learners in each comparable cohort", "The number of dashboard views", "The largest weekly completion count"], 0, "A rate compares completions with the eligible learner population."),
        q("da7q2", "What makes a cohort comparison more useful?", ["Different follow-up windows", "The same cohort definition and observation window", "Removing the smaller cohort"], 1, "Comparable definitions and windows prevent misleading comparisons."),
        q("da7q3", "Why show a rate alongside a count?", ["Rates remove all uncertainty", "Counts alone do not account for different group sizes", "Rates prove causation"], 1, "Denominators make the scale of groups visible."),
      ]),
      m("choose-a-visual", "Choose a useful visual", "Pick a chart that makes comparisons and uncertainty easy to see.", ["Match chart form to the question", "Label units, time, and comparison groups"], [
        "Use a line chart for change over ordered time, a bar chart for category comparisons, and a scatter plot for the relationship between two numeric measures. A chart should answer one main question and use a scale that does not exaggerate small changes.",
        "Give the chart a descriptive title and label axes, units, dates, and data source. Avoid color as the only encoding; use direct labels or patterns when useful. Show uncertainty or sample size when it changes how confidently a viewer should interpret the pattern.",
      ], "A team wants to compare weekly support wait time across four teams for the last three months.", [
        q("da8q1", "Which chart best shows weekly movement over three months?", ["Line chart", "Pie chart", "Single-number KPI card"], 0, "A line chart supports comparison across ordered time points."),
        q("da8q2", "What should an axis label include when relevant?", ["The analyst's initials", "The measure and its units", "A marketing slogan"], 1, "Units make values interpretable and prevent ambiguity."),
        q("da8q3", "Why can a truncated bar-chart axis mislead?", ["It can make modest differences look much larger", "It changes the underlying data", "It hides missing values automatically"], 0, "Bars encode magnitude by length, so a shortened baseline can exaggerate differences."),
      ]),
      m("measure-change", "Measure change carefully", "Distinguish an observed movement from evidence that an intervention caused it.", ["Choose a baseline and comparison", "Name alternative explanations and uncertainty"], [
        "A baseline gives a reference period, but a before/after comparison alone can be affected by seasonality, marketing, policy changes, or a different user mix. When possible, use a control group or a randomized experiment and define the outcome before looking at results.",
        "Report the size of the effect, the population, and uncertainty. Statistical significance is not the same as business importance. Even a credible experiment may have limited reach or an outcome window too short to capture long-term effects.",
      ], "An email campaign is followed by more purchases, but a holiday promotion started on the same day.", [
        q("da9q1", "What is the main issue with this before-and-after comparison?", ["The holiday promotion is a competing explanation", "Purchases cannot be counted", "Email campaigns never affect behavior"], 0, "Concurrent changes make it difficult to isolate the campaign's effect."),
        q("da9q2", "What does random assignment help with?", ["Balancing other factors between groups on average", "Guaranteeing every person buys", "Removing the need to define an outcome"], 0, "Random assignment supports a fair comparison by reducing systematic differences."),
        q("da9q3", "Which is the strongest conclusion from a small, short experiment?", ["The result is certain for all customers", "The measured short-term effect in this sample, with limits stated", "The campaign should always be used"], 1, "Conclusions should match the tested sample, period, and uncertainty."),
      ]),
      m("tell-the-data-story", "Tell the data story", "Connect the finding, its evidence, and the next decision without overclaiming.", ["Separate observation, interpretation, and recommendation", "State caveats and a concrete next step"], [
        "A clear finding has three parts: what changed, the evidence supporting it, and why it matters to the decision. Keep observed facts distinct from an interpretation about why they happened. Link every number back to its population and time window.",
        "End with a proportionate recommendation and a way to learn more. If evidence is weak, propose a targeted follow-up instead of presenting uncertainty as certainty. A useful analysis helps someone act while making its limits visible.",
      ], "Your analysis suggests new learners who attend an optional welcome session finish more lessons, but they opted in themselves.", [
        q("da10q1", "Which statement avoids an unsupported causal claim?", ["The session caused more lessons to be completed", "Attendees completed more lessons; self-selection may explain part of the difference", "Every new learner should attend"], 1, "It states the observed association and a plausible limitation."),
        q("da10q2", "What is a decision-ready next step?", ["Run a controlled pilot or investigate who opts in", "Hide the sample size", "Publish only the biggest percentage"], 0, "A targeted next step can test the interpretation before scaling."),
        q("da10q3", "Which order makes a concise analytical summary easiest to follow?", ["Recommendation, unrelated detail, raw data", "Finding, supporting evidence, caveat, next action", "Chart colors, query text, conclusion"], 1, "This order gives readers the conclusion and enough evidence and context to judge it."),
      ]),
    ],
  },
  {
    slug: "business-analytics",
    title: "Business Analytics",
    shortTitle: "Business",
    subtitle: "The Decision Lab",
    description: "Practice turning operational and commercial signals into practical choices. Work through metrics, processes, customers, costs, scenarios, and recommendations.",
    icon: "◫",
    accent: "blue",
    modules: [
      m("frame-a-decision", "Frame a business decision", "Start with the decision owner, options, constraints, and evidence needed.", ["Separate the decision from the symptom", "Define success, timeframe, and constraints"], [
        "A business question should make clear who decides, what options are available, and by when. A symptom such as ‘sales are down’ is not yet a decision. The decision could be whether to adjust pricing, change a channel, or investigate a specific customer segment.",
        "Agree on success measures and constraints before analyzing. Include operational capacity, customer impact, compliance, and the cost of waiting. A useful analysis may show that more information is needed before a high-cost or difficult-to-reverse choice.",
      ], "A regional manager sees fewer renewals and asks whether to increase the retention budget.", [
        q("ba1q1", "What is the best first clarification?", ["Which decision and renewal outcome should the analysis support?", "Which slide template should be used?", "Can we assume the budget is unlimited?"], 0, "The decision and measurable outcome define what evidence is relevant."),
        q("ba1q2", "Why identify constraints early?", ["They help rule out impractical options", "They make the result look better", "They replace customer evidence"], 0, "Capacity, cost, and timing shape which alternatives can actually be chosen."),
        q("ba1q3", "A symptom differs from a decision because a symptom is…", ["an observed condition that may have several causes", "always the root cause", "the selected solution"], 0, "Symptoms describe what is happening; analysis investigates causes and choices."),
      ]),
      m("build-a-kpi-tree", "Build a KPI tree", "Connect a headline outcome to measurable drivers teams can influence.", ["Define a KPI formula and population", "Break outcomes into leading drivers"], [
        "A key performance indicator needs a clear formula, population, source, owner, and reporting period. A KPI tree decomposes an outcome into drivers. Revenue, for example, may depend on customers, purchase frequency, and average order value.",
        "Choose measures that help diagnose or act, not just numbers that are easy to collect. Pair a target measure with guardrails such as quality, cost, or customer harm so a team does not improve one metric by damaging another.",
      ], "A subscription team tracks signups but wants to understand recurring revenue growth.", [
        q("ba2q1", "Which is the clearest KPI definition?", ["Growth is good", "Monthly recurring revenue from active paid subscriptions, in dollars", "More users"], 1, "A useful KPI states the population and unit, and its calculation should be documented."),
        q("ba2q2", "Which driver decomposition best explains recurring revenue?", ["Active paid customers × average recurring revenue per customer", "Support tickets + office size", "Number of dashboard viewers"], 0, "The product of customer count and average recurring amount explains the headline total."),
        q("ba2q3", "Why add a service-quality guardrail to a growth target?", ["To discourage growth", "To spot growth that harms customer experience", "To make the KPI harder to calculate"], 1, "Guardrails reveal unwanted tradeoffs behind a headline improvement."),
      ]),
      m("map-the-process", "Map the process", "Find bottlenecks by following work through the full system.", ["Distinguish wait time from work time", "Use throughput, work in progress, and cycle time together"], [
        "Map the real process from request to outcome, including handoffs, queues, rework, and exceptions. Cycle time is how long an item takes; throughput is completed work per period; work in progress is unfinished work currently in the system.",
        "A bottleneck is a constrained step that limits overall flow. Adding work before it can lengthen queues rather than increase output. Check timestamps and definitions with people doing the work before recommending a process change.",
      ], "Customer requests wait two days for review, then take only ten minutes to process.", [
        q("ba3q1", "What is the likely source of most elapsed time?", ["The queue before review", "The ten minutes of work", "The report format"], 0, "The large waiting period is a likely source of long cycle time."),
        q("ba3q2", "Which measure counts completed requests per week?", ["Throughput", "Work in progress", "Cycle time"], 0, "Throughput is output completed over a period."),
        q("ba3q3", "What is a risky first response to a bottleneck?", ["Add more requests to its queue", "Understand capacity and remove avoidable rework", "Measure its wait time"], 0, "More incoming work can grow the queue without increasing bottleneck capacity."),
      ]),
      m("understand-customers", "Understand customer segments", "Use segments to find different needs without treating group averages as individuals.", ["Choose behavior-linked segments", "Compare value, needs, and experience"], [
        "Useful segments differ in a way that can inform an action, such as onboarding needs, purchase behavior, or service usage. Define segments using data available at the time a decision is made, and check whether each group is large and stable enough to act on.",
        "Group averages hide variation. Segment evidence should guide questions and service design, not become a fixed label for an individual. Compare outcomes and costs, and consider whether an apparent segment difference reflects selection or unequal access.",
      ], "A retailer wants to tailor help for customers who have trouble with first-time setup.", [
        q("ba4q1", "Which segment definition is most actionable?", ["Customers who had two setup errors in their first week", "Customers whose names start with A", "Customers who live closest to headquarters"], 0, "A behavior tied to the service need can guide a relevant intervention."),
        q("ba4q2", "What should you check before launching a segment-specific service?", ["Whether the segment is large and stable enough to support the action", "Whether every customer has the same needs", "Whether the segment name sounds exciting"], 0, "Size and stability help determine whether the proposed action is practical."),
        q("ba4q3", "What is a fair use of a group-level pattern?", ["Treat every group member as identical", "Use it to form a service hypothesis, then respect individual context", "Use it to remove customer choices"], 1, "Segment patterns can inform design but should not erase individual differences."),
      ]),
      m("understand-unit-economics", "Understand unit economics", "Check whether the value created per customer or transaction covers its costs.", ["Distinguish revenue, gross margin, and contribution", "Include costs that change with the decision"], [
        "Revenue is money earned before costs. Gross profit subtracts direct cost of goods or service; contribution margin also considers variable costs tied to selling and serving a unit. State the time horizon and which costs are included.",
        "A customer can produce high revenue and still have low contribution if discounts, returns, support, or delivery costs are high. Compare like with like and avoid treating fixed costs as variable unless the decision actually changes them.",
      ], "A discounted subscription brings in more signups, but support costs also rise.", [
        q("ba5q1", "Which measure is more useful for checking value after variable service cost?", ["Contribution margin", "Gross signups", "Page views"], 0, "Contribution margin considers relevant variable costs beyond revenue."),
        q("ba5q2", "Why calculate economics per customer or transaction?", ["To expose differences hidden by total revenue", "To make every customer profitable", "To remove fixed costs from accounting"], 0, "Unit-level analysis makes the economics of each unit visible."),
        q("ba5q3", "Which cost should be included in a decision about serving one more customer?", ["A variable support cost that increases with each customer", "A sunk cost that cannot change", "An unrelated historical expense"], 0, "Incremental decisions should include costs that change as a result of the choice."),
      ]),
      m("plan-scenarios", "Plan with scenarios", "Make forecasts useful by stating assumptions and showing a range of outcomes.", ["Create base, upside, and downside cases", "Test sensitive assumptions and leading indicators"], [
        "A forecast is a structured estimate, not a promise. Build a base case from explicit assumptions, then create plausible upside and downside cases. Identify which inputs drive most of the difference, such as demand, conversion, price, or capacity.",
        "Sensitivity analysis changes one or more assumptions to show how the outcome responds. Use leading indicators to update the forecast as new information arrives. Avoid false precision when the underlying inputs are uncertain.",
      ], "A team must plan staffing for a launch with uncertain demand and a fixed hiring lead time.", [
        q("ba6q1", "Why build a downside case?", ["To plan for plausible risks and required capacity", "To predict the worst possible event with certainty", "To avoid documenting assumptions"], 0, "A downside case reveals what happens if key assumptions are less favorable."),
        q("ba6q2", "What does sensitivity analysis show?", ["How outputs change when assumptions change", "Which analyst wrote the spreadsheet", "That the forecast is guaranteed"], 0, "It helps identify the assumptions with the greatest effect on the result."),
        q("ba6q3", "How should a forecast be presented when demand is uncertain?", ["As a precise commitment", "As a range with assumptions and update signals", "Without explaining its inputs"], 1, "Ranges and explicit assumptions communicate uncertainty honestly."),
      ]),
      m("find-the-root-cause", "Find the root cause", "Separate a performance gap from the factors that may explain it.", ["Decompose the variance into drivers", "Validate causal hypotheses with evidence"], [
        "A variance is the difference between an actual result and a reference such as plan or prior period. Decompose it into drivers that can be checked: volume, price, mix, conversion, availability, or timing. Keep the calculation and period consistent.",
        "A root-cause hypothesis should make a testable prediction. ‘The campaign caused churn’ is not established by timing alone. Compare affected and unaffected groups where possible, inspect process changes, and seek evidence that could disconfirm the hypothesis.",
      ], "Sales missed plan even though total website visits stayed flat.", [
        q("ba7q1", "Which decomposition could help explain flat visits but lower sales?", ["Conversion rate and average order value", "Office attendance and slide count", "Logo colors"], 0, "The number of purchases per visit and the value per purchase can change while visits stay flat."),
        q("ba7q2", "What makes a root-cause hypothesis useful?", ["It can be checked against evidence", "It sounds confident", "It blames a team"], 0, "A testable hypothesis can be supported or rejected with observations."),
        q("ba7q3", "Why compare against a consistent reference period?", ["To reduce changes caused by inconsistent definitions or seasonality", "To guarantee the same outcome", "To hide the actual result"], 0, "Comparable periods help separate real movement from changes in definitions or calendar effects."),
      ]),
      m("prioritize-actions", "Prioritize actions and experiments", "Compare expected value, effort, risk, and how quickly you can learn.", ["Estimate impact and implementation effort", "Prefer reversible tests when uncertainty is high"], [
        "Prioritization is a choice under constraints. Compare potential impact, effort, dependencies, time to value, and downside risk. A small reversible experiment can be more valuable than a large rollout when the key assumption is still uncertain.",
        "Define an experiment's target population, comparison, success measure, guardrail, and stop condition before launch. Afterward, use the result to update the decision rather than selecting only the metric that looks favorable.",
      ], "Three projects promise growth, but one has little evidence and would take six months to reverse.", [
        q("ba8q1", "Which option is attractive when uncertainty is high?", ["A reversible pilot that tests the key assumption", "A full irreversible rollout", "A project with no success measure"], 0, "A pilot limits downside while producing information."),
        q("ba8q2", "What should an experiment define before it starts?", ["Success metric and guardrail", "Only the desired headline result", "The final conclusion"], 0, "Predefining measures reduces the temptation to reinterpret results afterward."),
        q("ba8q3", "Why include implementation effort in prioritization?", ["Expected value must be considered alongside resources and opportunity cost", "Effort predicts customer satisfaction", "Effort makes impact irrelevant"], 0, "Teams have limited capacity, so costs and tradeoffs affect the choice."),
      ]),
      m("make-a-recommendation", "Make a recommendation", "Present a choice with evidence, tradeoffs, risks, and a fallback.", ["Compare options against explicit criteria", "State a proportionate recommendation and conditions"], [
        "A recommendation should explain the choice, the alternatives considered, and the criteria used. Make tradeoffs explicit: cost, speed, customer experience, risk, and reversibility can point in different directions.",
        "State what would make you change course and how the choice will be monitored. A recommendation is stronger when it recognizes uncertainty and includes an owner and a next checkpoint.",
      ], "Leadership can improve service by adding staff, automating triage, or narrowing the support promise.", [
        q("ba9q1", "What makes a recommendation transparent?", ["Showing options and the criteria used to compare them", "Showing only the preferred option", "Using the most optimistic estimate"], 0, "Alternatives and criteria let decision-makers examine the tradeoffs."),
        q("ba9q2", "What is a useful contingency?", ["A signal that would trigger a change in approach", "A promise that risks cannot happen", "An unrelated metric"], 0, "A trigger connects monitoring to a concrete response."),
        q("ba9q3", "Which statement best handles uncertainty?", ["This will definitely work", "Recommend a pilot, with a review after the defined service and cost measures", "No decision is possible"], 1, "A measured pilot makes a proportionate decision and specifies how to learn."),
      ]),
      m("build-a-business-case", "Build a business case", "Connect the proposed investment to measurable outcomes and learning.", ["Quantify benefits, costs, and assumptions", "Plan ownership, tracking, and review"], [
        "A business case summarizes the problem, options, expected benefits, cost, risks, assumptions, and timing. Separate one-time investment from ongoing cost, and distinguish cash savings from capacity released or service quality improved.",
        "Assign an owner for each key assumption and define how results will be measured after launch. Compare actual performance with the original case and document what changed. The point is a decision record that can be revisited, not a sales pitch.",
      ], "A proposal asks for budget to automate a repetitive support task.", [
        q("ba10q1", "Which benefit statement is most decision-ready?", ["Automation is modern", "It may free 20 staff hours per week; validate quality and ongoing maintenance cost in a pilot", "It will solve all support problems"], 1, "It gives a measurable benefit and names important assumptions and guardrails."),
        q("ba10q2", "Why distinguish cash savings from capacity released?", ["Released capacity may not reduce cash spending unless staffing or spend changes", "They are always identical", "Capacity cannot be measured"], 0, "Operational time has value, but it is not automatically a cash saving."),
        q("ba10q3", "What should happen after implementation?", ["Compare actual outcomes with the case and review assumptions", "Stop measuring once the project launches", "Change the original estimate to match actuals"], 0, "A post-launch review checks value and improves future decisions."),
      ]),
    ],
  },
  {
    slug: "communication",
    title: "Communication",
    shortTitle: "Communication",
    subtitle: "The Message Forge",
    description: "Build clear, respectful communication for real work: writing, listening, feedback, meetings, presentations, and stakeholder decisions.",
    icon: "↗",
    accent: "amber",
    modules: [
      m("read-the-room", "Read the audience and purpose", "Shape a message around what the audience needs to know or do.", ["Name the audience and intended outcome", "Choose the right amount of detail and channel"], [
        "Before writing or speaking, identify who needs the message, what they already know, and what action or understanding should follow. A teammate who must debug an issue needs different detail from an executive deciding whether to fund a response.",
        "Choose a channel that fits urgency, sensitivity, and the need for discussion. Accessible communication explains acronyms, provides context, and does not assume that everyone has the same background or access to a live meeting.",
      ], "You need engineers to fix an incident and leaders to decide whether to pause a release.", [
        q("c1q1", "What should you clarify first?", ["Audience and the decision or action each message should support", "The longest possible subject line", "Whether everyone prefers the same details"], 0, "Purpose and audience shape relevant content and format."),
        q("c1q2", "Which message most helps an on-call engineer?", ["A concise symptom, impact, reproduction, and current status", "A high-level strategy only", "A list of unrelated historical issues"], 0, "Operational details help the recipient diagnose and respond."),
        q("c1q3", "What improves accessibility for a mixed audience?", ["Define necessary acronyms and provide context", "Use more unexplained jargon", "Assume every reader attended the meeting"], 0, "Plain context lets people with different backgrounds follow the message."),
      ]),
      m("lead-with-the-point", "Lead with the point", "Put the main conclusion or request where busy readers can find it.", ["Use a bottom-line-first structure", "Separate the ask from supporting context"], [
        "A useful workplace update often starts with the conclusion or request, then gives the essential context and evidence. This bottom-line-first structure helps a reader decide whether they need to continue, respond, or act immediately.",
        "State the requested owner and deadline when there is an action. Put background and detail after the point, using headings or bullets where they improve scanning. For exploratory or sensitive discussions, explain uncertainty and invite a response rather than presenting a forced conclusion.",
      ], "A launch is at risk because a critical accessibility review is not complete.", [
        q("c2q1", "Which opening is clearest?", ["The release should move by two days because the keyboard review found a blocking issue", "There are many things to discuss about accessibility", "I have attached a long history of this project"], 0, "It leads with the recommendation and gives the central reason."),
        q("c2q2", "What should an action request include?", ["A clear owner and due date", "Only a vague hope", "Several hidden requests"], 0, "Ownership and timing make the next step actionable."),
        q("c2q3", "When is a bottom-line-first message still incomplete?", ["When it omits the evidence or caveat needed to judge the point", "When it has a short subject", "When it is readable on a phone"], 0, "A concise conclusion still needs enough support and context to be trustworthy."),
      ]),
      m("write-concisely", "Write clearly and concisely", "Make every sentence easy to understand without removing necessary context.", ["Use concrete verbs and specific nouns", "Remove repetition while preserving useful detail"], [
        "Prefer direct wording: name the person or system, the action, and the result. Replace vague phrases like ‘things were done’ with a concrete description. Short sentences can help, but clarity matters more than a fixed word count.",
        "Edit for purpose: remove repeated points, unexplained acronyms, and detail the reader does not need. Keep definitions, assumptions, and exceptions that prevent misunderstanding. A short message that leaves out the decision context is not necessarily clear.",
      ], "A status note says: ‘There were some things that happened and now it may possibly be delayed.’", [
        q("c3q1", "Which revision is clearest?", ["The data import failed at 10:15; the analytics release is delayed while we restore the source file", "Things happened, and a delay may possibly occur", "A delay-like condition exists"], 0, "It names the event, time, impact, and current response."),
        q("c3q2", "What is a good editing goal?", ["Remove repetition while keeping necessary context", "Delete every detail", "Use longer words"], 0, "Concise writing preserves the information the reader needs."),
        q("c3q3", "Why replace vague pronouns such as ‘it’ when context is unclear?", ["A named subject makes responsibility and meaning easier to follow", "Pronouns are always incorrect", "It makes the message longer"], 0, "Specific nouns reduce ambiguity about what changed or who acts."),
      ]),
      m("listen-and-clarify", "Listen and clarify", "Understand what someone means before responding to the first interpretation.", ["Use open questions and reflective summaries", "Check assumptions respectfully"], [
        "Active listening means giving attention, asking open questions, and reflecting the speaker's meaning. A short summary such as ‘I hear that the handoff timing is the main concern; is that right?’ gives the other person a chance to correct your understanding.",
        "Clarifying is not cross-examination. Ask for examples, constraints, or a desired outcome without assuming intent. In written communication, summarize what is agreed and invite corrections when important details remain uncertain.",
      ], "A partner says, ‘The handoff is not working,’ without explaining what failed.", [
        q("c4q1", "Which question best opens clarification?", ["Can you walk me through the last handoff that failed?", "Why are you always unclear?", "So you think the whole project is bad?"], 0, "It invites a concrete example without assigning blame."),
        q("c4q2", "What does a reflective summary do?", ["Checks whether you understood the speaker", "Ends the conversation", "Proves the speaker is wrong"], 0, "Reflection gives the speaker an opportunity to confirm or correct your interpretation."),
        q("c4q3", "What should you do if your summary is corrected?", ["Update your understanding and ask what matters next", "Repeat the same interpretation louder", "Ignore the correction"], 0, "Listening includes adjusting when new information changes your understanding."),
      ]),
      m("support-a-claim", "Support a claim with evidence", "Make it easy to distinguish facts, interpretations, and recommendations.", ["Connect claims to relevant evidence", "State limits and avoid false certainty"], [
        "A persuasive work message separates observation from interpretation. Give the relevant evidence, its source or time period, and how it supports the claim. Do not present a personal impression as a measured fact.",
        "Acknowledge uncertainty where it matters and explain what would strengthen the conclusion. If the evidence is incomplete, use proportionate language and propose a next step. This builds trust and lets colleagues challenge the reasoning rather than guess at it.",
      ], "You want to explain why customer wait times increased this week.", [
        q("c5q1", "Which claim is best supported?", ["Wait time rose from 8 to 13 minutes after ticket volume increased 25%; the queue data supports this pattern", "The support team does not care", "Wait time is bad"], 0, "It provides a measurable comparison and relevant evidence without guessing at intent."),
        q("c5q2", "How should you describe a possible but unverified cause?", ["As a hypothesis that needs checking", "As a confirmed fact", "As a personal criticism"], 0, "Labeling a hypothesis preserves the difference between evidence and interpretation."),
        q("c5q3", "What is a useful next step when data is incomplete?", ["Identify the missing evidence and how to collect it", "Hide the uncertainty", "Stop communicating"], 0, "A focused evidence gap turns uncertainty into an actionable question."),
      ]),
      m("give-useful-feedback", "Give useful feedback", "Describe observable behavior, its impact, and a constructive next step.", ["Use specific examples instead of labels", "Invite the other person's perspective"], [
        "Useful feedback focuses on an observable action and its impact. ‘The handoff note omitted the rollback owner, so the evening team could not safely proceed’ is more actionable than ‘You are careless.’ Address the issue close to when it occurred and in an appropriate setting.",
        "Make a clear request and listen to the response. Feedback should support shared work, not score a person. Ask about constraints that contributed to the behavior and agree on a practical next step together.",
      ], "A teammate repeatedly receives late changes without enough context to review them.", [
        q("c6q1", "Which feedback statement is most actionable?", ["Yesterday's change arrived after review began without a test note; please include the impact and tests next time", "You are impossible to work with", "Things should be better"], 0, "It describes a specific event, its impact, and a request."),
        q("c6q2", "What is the value of asking for the teammate's perspective?", ["It can reveal constraints and improve the agreed solution", "It removes the need to make a request", "It guarantees agreement"], 0, "Understanding context helps both people choose a workable next step."),
        q("c6q3", "Where should sensitive feedback usually happen?", ["In a private, respectful setting", "In a public leaderboard", "In an unrelated group announcement"], 0, "Privacy helps preserve dignity and supports a focused conversation."),
      ]),
      m("facilitate-a-meeting", "Facilitate a useful meeting", "Give a meeting a purpose, balanced participation, and a clear close.", ["Set an outcome and agenda", "Capture decisions, owners, and follow-up"], [
        "Before a meeting, state the outcome, participants, and preparation needed. Choose the smallest group that can contribute or decide. Share context in advance when possible so meeting time is used for discussion and decisions.",
        "During the meeting, make room for different voices and bring the group back to the question. Close by reading back decisions, open issues, owners, and dates. Send notes in a place participants can access, including people who could not attend.",
      ], "A cross-functional group keeps leaving a 30-minute meeting without knowing who owns the next step.", [
        q("c7q1", "What should the organizer add before the meeting?", ["A clear outcome and agenda", "More optional invitees", "A longer meeting by default"], 0, "Purpose and an agenda help participants prepare and focus."),
        q("c7q2", "What should be recorded at the end?", ["Decisions, unresolved questions, owners, and dates", "Only who spoke the most", "A transcript with no summary"], 0, "The close translates discussion into accountable next steps."),
        q("c7q3", "How can a facilitator support balanced participation?", ["Invite input from people who have not spoken", "Let the fastest speaker decide", "Skip questions"], 0, "Intentional invitations can make room for relevant perspectives."),
      ]),
      m("collaborate-asynchronously", "Collaborate asynchronously", "Write updates that let teammates respond across schedules and locations.", ["Provide context, status, and a specific ask", "Choose urgency and channel intentionally"], [
        "An asynchronous update should stand on its own: give context, the current status, what changed, the decision or help needed, and a requested response time. Link to the source of truth rather than copying a fragment that may become stale.",
        "Use urgent channels only for genuinely time-sensitive issues. For sensitive topics or unresolved disagreement, move to a conversation and document the outcome. Respect time zones and make ownership clear without implying that everyone must be online at once.",
      ], "A teammate in another time zone needs to review a changed data definition before tomorrow.", [
        q("c8q1", "Which async note is easiest to act on?", ["The metric definition changed; please review the linked draft by 10:00 UTC and comment on the denominator", "Can you look at that sometime?", "Important!!!"], 0, "It provides context, a source, a deadline, and the requested focus."),
        q("c8q2", "When is an urgent channel appropriate?", ["When a response is genuinely time-critical", "For every ordinary update", "When no clear owner exists"], 0, "Urgency should match the impact and response window."),
        q("c8q3", "Why link the source of truth?", ["It reduces conflicting copies and stale context", "It guarantees agreement", "It avoids explaining the ask"], 0, "A shared authoritative location keeps updates tied to current information."),
      ]),
      m("present-and-respond", "Present and respond to questions", "Guide an audience through a message and handle questions with care.", ["Organize around one takeaway", "Clarify questions and acknowledge limits"], [
        "A short presentation should have one central takeaway supported by a few well-chosen points. Orient the audience, explain what the evidence means, and end with the decision or action required. Slides should support the speaker rather than repeat a script in tiny text.",
        "When a question is unclear, restate or clarify it. Answer directly, distinguish known facts from unknowns, and offer a follow-up when you need to verify information. A respectful answer can acknowledge a valid concern without becoming defensive.",
      ], "A stakeholder asks whether a pilot result will hold for every region.", [
        q("c9q1", "What is the best response if the pilot included only two regions?", ["State the tested scope and explain that broader results need more evidence", "Promise the same effect everywhere", "Ignore the question"], 0, "The answer should match the evidence and identify the generalization limit."),
        q("c9q2", "What makes a slide easier to follow?", ["One takeaway with readable evidence", "Several unrelated messages in tiny text", "Unlabeled axes"], 0, "A focused slide helps the audience understand its purpose and evidence."),
        q("c9q3", "What should you do when you do not know an answer?", ["Say what you know and commit to checking the rest", "Invent a confident number", "Change the topic"], 0, "Transparent follow-up protects trust and accuracy."),
      ]),
      m("align-stakeholders", "Align stakeholders", "Resolve different priorities by making the shared decision and tradeoffs explicit.", ["Surface stakeholder needs and constraints", "Confirm decisions, dissent, and ownership"], [
        "Stakeholders may agree on a goal but disagree about risk, timing, or resources. Ask what each party needs, what constraint they face, and what evidence would change their view. Make the decision owner and decision deadline explicit.",
        "Summarize the agreed choice, open concerns, and next steps in neutral language. Alignment does not require pretending everyone agrees. Record material dissent and the reason for the decision so teams can revisit it when conditions change.",
      ], "Operations wants a fast rollout while support asks for more time to prepare.", [
        q("c10q1", "What is a constructive first move?", ["Clarify the shared goal, constraints, and risks for each team", "Assume one team is blocking progress", "Avoid naming a decision owner"], 0, "Understanding the needs and constraints reveals options both teams can evaluate."),
        q("c10q2", "What should a decision summary include?", ["The choice, owner, next steps, and unresolved concerns", "Only the majority opinion", "A claim that everyone agreed"], 0, "A complete record supports action and preserves honest disagreement."),
        q("c10q3", "Why record material dissent?", ["It preserves useful risk information and decision context", "It assigns blame", "It prevents future review"], 0, "Dissent can help the team monitor risks and revisit assumptions."),
      ]),
    ],
  },
];

export const learningPassMark = 2;

export function rotateQuestionChoices(question: LearningQuestion) {
  const offset = [...question.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % question.choices.length;
  const choices = question.choices.map((_, index) => question.choices[(index + offset) % question.choices.length]);
  return { choices, correctIndex: (question.correctIndex - offset + question.choices.length) % question.choices.length };
}

export function findLearningModule(pathSlug: string, moduleSlug: string) {
  const path = learningPaths.find((item) => item.slug === pathSlug);
  const foundModule = path?.modules.find((item) => item.slug === moduleSlug);
  return path && foundModule ? { path, module: foundModule } : null;
}

export function publicLearningPaths() {
  return learningPaths.map(({ modules, ...path }) => ({
    ...path,
    modules: modules.map(({ questions, ...module }) => ({
      ...module,
      questions: questions.map((question) => ({ id: question.id, prompt: question.prompt, choices: rotateQuestionChoices(question).choices })),
    })),
  }));
}
