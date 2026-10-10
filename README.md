# ProofLoop (Nextlearn)

**Proof-of-Skill Sandbox & Learner-Owned Evidence Engine**  
*Samartha Hackathon, Part A: Nyeras / NxtMove Proof-of-Skill Sandbox*

ProofLoop is an authentic skill-verification sandbox where learners prove competencies through real work samples, deterministic test execution, and adaptive follow-up defenses. Evidence is scored against visible, versioned rubrics and shared with recruiters exclusively through revocable, granular learner consent.

> **Important Disclaimer**: Evidence describes demonstrated performance on these specific sandbox tasks only. It is experimental and is **not** a validated predictor of job performance, candidate intelligence, or automated hiring recommendations.

---

## Architecture Diagram

```mermaid
flowchart TD
  subgraph Client ["Client Layer (Next.js 16 App Router)"]
    LP["Landing Page & Nyeras LMS Simulation"]
    SW["Demo Role Switcher (Learner / Recruiter / Reviewer)"]
    ME["Monaco Code Editor & Incident Report Form"]
    SQL["WASM SQLite Sandbox (sql.js In-Browser)"]
    GRID["Spreadsheet Formula Grid (SaaS Unit Economics)"]
    COMM["Communication Workbench (Revise-After-Feedback Loop)"]
  end

  subgraph Execution ["Isolated Sandboxes & Scoring Engines"]
    J0["Judge0 CE Sandbox Runner\n(CPU, RAM, Process & Network Limits)"]
    GEMINI["Gemini 3.8 Flash Dual-Run Grader\n(2 Independent Runs, Schema Validation, Quote Grounding)"]
    WASM_SRV["Node.js / WASM Deterministic Result Verifier"]
  end

  subgraph Database ["Supabase PostgreSQL (Row-Level Security)"]
    AUTH["Supabase Auth (Profiles & Roles)"]
    TASKS["Versioned Tasks, Rubrics & Follow-up Bank"]
    HIDDEN["Hidden Test Suites & Flaw Keys (Server-Side Only)"]
    ATTEMPTS["Append-Only Attempts & Criterion Scores"]
    EVID["Evidence Portfolio (Level, Confidence, Recency)"]
    CONSENT["Granular Per-Skill Consent (Off by Default)"]
    AUDIT["Immutable Audit Log (SHA-256 Input Hashes)"]
  end

  subgraph RecruiterReview ["NxtMove & Reviewer Surfaces"]
    REC["Recruiter Search & Evidence Viewer\n(Why Surfaced Rationale + Human Decision)"]
    REV["Human Review Queue & Calibration Benchmarks\n(Anonymized Code Diff + Written Override)"]
    OUTBOX["NxtMove Profile Outbox (Consent-Gated Delivery)"]
  end

  Client -->|Execute Code| J0
  Client -->|Score Reasoning| GEMINI
  Client -->|Verify SQL & Formulas| WASM_SRV
  Execution -->|Persist Attempt & Criteria| Database
  Database -->|Consented Evidence Query| REC
  Database -->|Low-Confidence / Disagreement / Appeals| REV
  Database -->|Outbox Delivery| OUTBOX
```

---

## Core Non-Negotiables & Design Principles

1. **No Points, XP, Badges, Streaks, or Leaderboards**: Skill progression and unlocks derive exclusively from demonstrated understanding.
2. **Tests Decide Correctness; AI Evaluates Reasoning Only**: Deterministic tests in Judge0 decide code correctness. Gemini evaluates written reasoning in two independent runs with structured schema validation and mandatory text quote citations.
3. **Zero Secret Leakage**: Hidden test suites, reference implementations, flaw lines, and follow-up answer keys never reach the client bundle or public API responses (enforced by `tests/leak-protection.test.ts`).
4. **Consent is Off by Default, Granular, and Revocable**: Sharing is per-skill, not all-or-nothing. Submissions (source code and incident reports) require explicit opt-in. Revocation immediately excludes candidate evidence from recruiter search.
5. **Follow-Up Questions Affect Confidence Only**: Adaptive follow-up questions from the fixed bank resolve ambiguity and adjust confidence (High/Medium/Low); the count of follow-ups never modifies the criterion score.
6. **Content-Only Evaluation**: Strict prompt guardrails forbid penalizing dialect, accent, phrasing style, or non-native English grammar.
7. **Append-Only Immutable Audit Trail**: Every assessment attempt, prompt hash, model output, consent modification, recruiter view, and reviewer override is permanently logged.
8. **Human Judgment Remains Authoritative**: The system never auto-rejects candidates; human decision-makers retain final authority.

---

## 7-Minute Demo Script (Minute-by-Minute Walkthrough)

This script is designed for hackathon judges to walk the entire end-to-end demo without friction.

| Minute | Time | Section & Role | Exact Actions & What to Show |
| :---: | :---: | :---: | :--- |
| **1** | 0:00 – 1:00 | **Elevator Pitch & LMS Handoff**<br>`(Learner)` | 1. Start on `/` (Overview). Highlight the 10-second elevator pitch, calm "Mission Control" palette, and visible disclaimers.<br>2. Click **"Nyeras LMS"** in the sidebar. Show the simulated course module *"Distributed Systems Debugging"*. Click **"Prove Your Skill in Sandbox →"** to demonstrate seamless LMS handoff. |
| **2** | 1:00 – 2:15 | **Debugging Mission & Monaco Editor**<br>`(Learner)` | 1. Open **"Missions"** → Incident 01 (*The wrong top seller*).<br>2. Toggle between **"Incident Story"** and **"Plain Task Specification"**.<br>3. Inspect visible acceptance tests and rubric.<br>4. Fix `for (let i = 0; i < values.length; i++)` in the **Monaco editor**.<br>5. Fill out the 4-part incident report headings.<br>6. Check *I used AI assistance*.<br>7. Click **"Submit incident report →"** to trigger live isolated tests in Judge0 and dual-run Gemini scoring. |
| **3** | 2:15 – 3:30 | **Skill Tree & Boss Round**<br>`(Learner)` | 1. Navigate to **"Skill tree"**. Show node states conveyed with icons and text (*"Evidenced"*, *"Available"*, *"Locked"*), never color alone.<br>2. Show **Boss Round** (*Catch the AI’s mistake*): explain how learner assertions run against 3 code versions (flawed, reference, and alternate) so trivial tests like `assert false` are rejected. |
| **4** | 3:30 – 4:45 | **New Paths & Authentic Work Samples**<br>`(Learner)` | 1. Click **"Learning paths"** in the sidebar.<br>2. Show all 3 paths (10 modules each with visible *"Draft curriculum content"* warnings).<br>3. Open **Data Analytics**: show the in-browser **WASM SQLite Sandbox** (`sql.js`). Click **"Run Query in WASM SQLite"** to execute against the live in-memory database and view the result table.<br>4. Open **Business Analytics**: demonstrate the interactive **Spreadsheet Formula Grid** (CAC, LTV, Payback period).<br>5. Open **Communication**: show the **Revise-After-Feedback Loop** on the P0 Incident memo. |
| **5** | 4:45 – 5:45 | **Evidence Portfolio & Granular Consent**<br>`(Learner)` | 1. Return to **"My evidence"**.<br>2. Show the multi-skill evidence cards: proficiency level, confidence, and recency without opaque single aggregate scores or XP.<br>3. Demonstrate granular consent: toggle sharing ON/OFF for `debugging` vs `data-analytics`.<br>4. Toggle the two-tier switch (*"Also share source code and written answers"*). Show immediate revocability. |
| **6** | 5:45 – 6:30 | **NxtMove Recruiter Search**<br>`(Recruiter)` | 1. Use the **Role Switcher** in the topbar to switch to **Priya Sharma (Recruiter)**.<br>2. Switch between **"Junior Java Developer"** and **"Junior Data Analyst"** roles.<br>3. Show surfaced candidates with explicit **"Why surfaced"** explanations.<br>4. Expand candidate evidence. Notice source code is visible only because the candidate opted into two-tier consent.<br>5. Enter a recruiter note and click **"Shortlist candidate"** to record an audited human hiring decision. |
| **7** | 6:30 – 7:00 | **Reviewer Queue, Calibration & Failure Scenarios**<br>`(Reviewer)` | 1. Switch role to **Dr. Sarah Chen (Reviewer)**.<br>2. Show **Review queue**: anonymized peer similarity diff and mandatory 10-character written override reason.<br>3. Inspect the **Calibration Panel**: AI vs Human raters across 6 benchmark submissions with agreement rates.<br>4. Visit **"Failure scenarios"**: trigger the interactive simulations for Prompt Injection and Trivial Boss Test to show the defense gates in action.<br>5. End on the immutable **Audit Log** showing cryptographic input hashes for every turn. |

---

## 4-Minute Unique Features Demo Script (Assessment Replay, Readiness Map & Fairness Lab)

Designed for evaluators to review the three flagship transparency and trust innovations.

| Minute | Feature | Role | Exact Actions & Key Talking Points |
| :---: | :--- | :--- | :--- |
| **1:00** | **1. Assessment Replay**<br>*(“How this result was produced”)* | **Learner** / **Recruiter** | 1. **Learner View**: Go to **"My evidence"** → Click on any evidenced attempt → Click **"How this result was produced (Assessment Replay)"** (or visit `/results/[attemptId]/replay`).<br>2. **8 Chronological Steps**: Walk through the step-by-step audit record: Submission metadata (v1 task, v1 rubric, input SHA-256 hash), deterministic visible tests (pass/fail), hidden verification checks (counts only; private test cases never reach client), optimality tier (complexity without leaking hidden thresholds), dual-run AI reasoning (Run 1 vs Run 2 side-by-side with agreement pill: *Agree / Differ by 1 / Differ by 2+* and quote grounding), follow-up question defense (stop-rule outcome; follow-up count never penalises score), and algorithmic confidence derivation.<br>3. **Cryptographic Integrity**: Scroll to Step 8 and click **"Verify Integrity"**. Watch the system live-recompute the SHA-256 hash against the immutable audit log and output a green verified badge.<br>4. **Recruiter Privacy Guard**: Use topbar role switcher to become **Priya Sharma (Recruiter)**. Open Replay for a candidate who hasn't consented to code inspection: instead of private code or raw model logs, the **Recruiter Method Card** appears (rubric version, confidence derivation, AI disclosure, and zero candidate text). |
| **1:00** | **2. Role Readiness Map**<br>*(“The learning-to-hiring bridge”)* | **Learner** | 1. Switch back to **Alex Morgan (Learner)**. Click **"Role readiness"** in the sidebar (or press `G D` or `Ctrl+K` → *"Go to Role readiness"*).<br>2. **Zero Shared Data**: Point out the top privacy banner: *“Private Learner Planning Tool — your target roles and gap analysis are NEVER shared with recruiters.”*<br>3. **Shared Matcher Parity**: Switch between the 4 NxtMove role templates (*Junior Data Analyst*, *Junior Java Developer*, *BI Analyst*, *Full-Stack Engineer*). Explain that readiness uses the **exact same evaluation engine** (`requirement-matcher.ts`) as recruiter search—guaranteeing 100% parity without divergence.<br>4. **Deterministic Checklist**: Show status pills: **Met** (with direct *"View Evidence"* link), **Partly met**, and **Not yet**.<br>5. **No Gamified Numbers**: No fake "87% match" or single skill score. Every requirement displays concrete criteria (skill, language, minimum level, recency, task count) and deterministic **"Close This Gap"** links to learning modules and work samples. |
| **2:00** | **3. Fairness Lab**<br>*(“Language & phrasing consistency”)* | **Reviewer** | 1. Switch to **Dr. Sarah Chen (Reviewer)**. Click **"Fairness lab"** in the sidebar (or visit `/fairness`).<br>2. **Methodological Honesty**: Point out the mandatory disclaimer: *Small synthetic sample (n=12 benchmarks, n=84 variants). Indicative only. Not a validated hiring predictor.* We measure empirical spread and state limits honestly.<br>3. **Consistency Matrix**: Inspect the 12 benchmark cases (4 Data Analytics, 4 Business Analytics, 4 Communication) across 7 phrasing styles: Baseline Plain English, Polished Formal, Short/Informal, Hinglish, Hindi Devanagari script (देवनागरी), Telugu script (తెలుగు), and Typo-Heavy English.<br>4. **Variant Inspection**: Click on any score pill (e.g., Telugu or Devanagari) to view the modal with original non-English text, human translation verification status, and evaluator marks.<br>5. **Spread Legend**: Point out the Max Spread column (Spread $\le 1$ pt green within-tolerance vs Spread $> 1$ pt alert).<br>6. **Variant Summaries & Human Calibration**: Switch to the **"Variant Group Summaries"** tab. Show average deltas, exact agreement vs dual human assessors (R1, R2), and language neutrality principles (code/SQL checks are language-independent; content-only scoring in original script).<br>7. **Changelog & Report Export**: Check the **"Change Log"** prompt version history (`nextlearn-grading-v0` vs `nextlearn-grading-v1`). Click **"Export Report"** to download the auditable Markdown summary. Click **"Run Benchmark Batch"** to show the live execution dialog with the 5 batches/hour safety cap. |

---

## Environment Variables Configuration

Copy `.env.example` to `.env.local` and configure your credentials:

```dotenv
# Backend Operational Mode ('supabase' for live demo, 'local' for offline preview)
NEXT_PUBLIC_BACKEND_MODE=supabase

# Supabase Credentials (from Supabase Dashboard -> Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Isolated Code Sandbox (Judge0 CE v1.14.0 or private instance)
JUDGE0_BASE_URL=https://ce.judge0.com
JUDGE0_AUTH_TOKEN=

# Reasoning Evaluation Engine (Gemini API)
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-3.8-flash

# Optional NxtMove Integration Endpoint
NXTMOVE_API_URL=
NXTMOVE_API_KEY=
```

> **Security Note**: `SUPABASE_SERVICE_ROLE_KEY`, `JUDGE0_AUTH_TOKEN`, and `GEMINI_API_KEY` are strictly server-side and are never prefixed with `NEXT_PUBLIC_`.

---

## Synthetic Demo Personas

Zero-friction testing is enabled via the topbar **Role Switcher** or credentials:

| Persona | Role | Synthetic ID | Email | Password |
| :--- | :---: | :---: | :--- | :--- |
| **Alex Morgan** | Learner | `cand_0142` | `alex.morgan.learner@nextlearn.synthetic` | `DemoPassword2026!` |
| **Rohan Mehta** | Learner | `cand_0981` | `rohan.mehta.learner@nextlearn.synthetic` | `DemoPassword2026!` |
| **Priya Sharma** | Recruiter | `rec_priya` | `priya.sharma.recruiter@nextlearn.synthetic` | `DemoPassword2026!` |
| **Dr. Sarah Chen** | Reviewer | `rev_sarah` | `sarah.chen.reviewer@nextlearn.synthetic` | `DemoPassword2026!` |

---

## Quality Gates & Verification Matrix

All quality gates pass in automated CI/CD and local environments:

| Gate | Command / Test Suite | Result | Status |
| :--- | :--- | :---: | :---: |
| **Linter** | `npm run lint` | 0 errors | **PASS** |
| **Type Check & Build** | `npm run build` | 39 routes compiled | **PASS** |
| **Leak Protection** | `tests/leak-protection.test.ts` | 5 tests passed | **PASS** |
| **Two-User RLS** | `tests/two-user-rls.test.ts` | 3 tests passed | **PASS** |
| **Consent & Profile** | `tests/consent-and-profile.test.ts` | 4 tests passed | **PASS** |
| **Recruiter Workflow** | `tests/recruiter-search.test.ts` | 4 tests passed | **PASS** |
| **Work Samples** | `tests/work-samples.test.ts` | 7 tests passed | **PASS** |
| **Stop Rule & Confidence** | `tests/stop-rule-and-confidence.test.ts` | 6 tests passed | **PASS** |
| **Follow-up Selector** | `tests/followup-selector.test.ts` | 4 tests passed | **PASS** |
| **Reviewer & Audit** | `tests/reviewer-and-audit.test.ts` | 3 tests passed | **PASS** |
| **Accessibility (WCAG AA)** | `tests/accessibility.test.ts` | 7 tests passed | **PASS** |
| **Learning Session Engine** | `tests/learning-session-engine.test.ts` | 7 tests passed | **PASS** |
| **Learning Reflections** | `tests/learning-reflection-and-unlock.test.ts` | 4 tests passed | **PASS** |
| **Final Test Engine** | `tests/final-test-engine.test.ts` | 14 tests passed | **PASS** |
| **Total Test Count** | `npm test` | **68 / 68 tests (12 suites)** | **100% PASS** |

---

## Immersive Learning Paths & Focus Engine

The three learning paths (**Data Analytics**, **Business Analytics**, and **Workplace Communication**; 10 modules each) feature a full-page, half-and-half software-like learning environment:
- **7-Beat Pedagogical Flow**: (1) Teaser $\rightarrow$ (2) Story Scene with SVG character dialogue $\rightarrow$ (3) Core Concept with glossary tooltips $\rightarrow$ (4) Worked Practical Example $\rightarrow$ (5) Try-It Activity $\rightarrow$ (6) Server-Graded Knowledge Check (2/3 pass) $\rightarrow$ (7) Takeaway Card.
- **Server-Enforced Reading Pacing**: `clamp(ceil(words / 3.8 * 0.6), 8, 90)` seconds enforced strictly on the server with a calm, non-urgent SVG fill-up ring (`ReadingRing`).
- **Focus Engine**: Tab visibility + window blur + `document.hasFocus()` tracking with 3s grace period for accidental tab switches, 5s heartbeat (30s timeout), single active session lock, and a Relaxed Focus Mode for accessibility.
- **Formative Milestone Reflections**: Reflection checkpoints after Modules 3, 6, 9, and Capstone Module 10 reviewed formatively by Gemini Flash with structured feedback (genuine attempt check, understanding tier, strengths, and growth areas).
- **Narrative Character Arcs**: Three ongoing story arcs—"The Missing Orders" (Meera), "The Tea Stall That Wanted to Grow" (Rohan), and "The Update Nobody Read" (Ananya).
- **Flight Path Journey Map & Private Notebook**: Interactive 10-station timeline with milestone reflection stops, plus a private searchable notebook with Markdown (.md) export.
- **Privacy & Override Guarantee**: All timing and focus data is private to the learner and used solely to gate instructional progression. It is never exposed to recruiters, factored into evidence cards, or used in hiring scores.

---

## Capstone Final Test & Proof-of-Skill Certification Engine

Each of the three Learning Paths concludes with an authentic **Capstone Final Test** that unlocks strictly after completing all 10 modules and all 3 reflection checkpoints:
- **Comprehensive Question Pools**: 72+ total questions ($\ge 24$ per path) spanning 6 authentic workplace archetypes:
  1. *Spot the AI's Mistake* (planted error identification + deterministic span check + AI rationale and fix grading)
  2. *Case Decision* (ambiguous operational triage + written justification)
  3. *Fix It* (broken SQL with SQLite execution, broken spreadsheet formulas, or unformatted drafts)
  4. *Interpret* (misleading dual-axis charts, truncated scales, Simpson's paradox)
  5. *Triage / Prioritise* (capacity and constraint trade-offs)
  6. *Rewrite* (executive BLUF, de-escalating scope creep, respectful candid feedback)
- **Authoritative Server Timer**: 45-minute default time limit (or 67.5 minutes with +50% accessibility accommodation) calculated and enforced 100% on the server, with calm 10m/2m visual warnings and automatic submission on expiration.
- **Tiered Hints with Deductions**: Nudge (-5%), Pointer (-10%), and Strong Hint (-20%) with a hard cumulative deduction cap of 35% per question and explicit confirmation prompts before reveal.
- **Absolute Privacy Pre-Test Device Check**:
  - `getUserMedia` verifies local camera preview and microphone volume meter before starting.
  - **HARD GUARANTEE**: 0 video/audio recording (`MediaRecorder`), 0 canvas snapshot extraction, 0 WebRTC streaming, 0 biometric/emotion AI, and 0 remote media storage. Video and audio stay 100% inside client memory. Only boolean flags (`camera_ok`, `mic_ok`) are stored on the attempt record.
  - **Unproctored Alternative**: A neutrally-labeled *"Take without camera & mic"* option is always available with full access to evidence generation.
  - **Automated CI Audit**: `tests/final-test-engine.test.ts` scans the codebase and fails the build if any media recording or capture APIs are introduced.
- **Scoring Breakdown & Optimality**: 100-point scale per question. Coding/SQL tasks award 60 points for correctness + 40 points for query optimality (execution plan, index usage, explicit joins). Non-coding tasks award 80 base points + 20 follow-up defense points.
- **Adaptive Follow-Up Defense & Early-Stop Rule**: Dual-run Gemini grading against fixed rubrics. Follow-up count affects confidence only (never lowering base marks). If base performance is proficient, questioning stops early with High Confidence.
- **Results, Evidence & Reviewer Appeals**: Question-by-question diagnostic score cards, evidence quotes, skill tier rating (Developing 50-69, Proficient 70-84, Advanced 85+), and one-click *"Challenge this result"* routing to the Human Reviewer Queue.

---

## Known Limitations & Honest Boundaries

1. **No Claims of Predictive Hiring Validity**: Performance in these sandboxes demonstrates skill on these simulated tasks only. We do not claim this score predicts general on-the-job performance.
2. **Benchmark Table is Preliminary**: The 15-case benchmark table on `/` (Validation) is a synthetic calibration set. Real statistical generalization requires a multi-institution empirical cohort study.
3. **Draft Curriculum Content**: Learning modules in the three practice paths are labeled *draft, needs human curriculum review*. Real skill verification occurs in the authentic work-sample sandboxes.
4. **Sandboxed Isolation**: Non-technical qualities such as teamwork, cross-functional diplomacy, and multi-month persistence cannot be measured within short individual sandboxes.
