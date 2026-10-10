# Unique Features Implementation Plan: Assessment Replay, Role Readiness Map, and Fairness Lab

**Project:** NextLearn / ProofLoop  
**Status:** Approved Architecture Plan (Phase 0)  
**Author:** Lead Full-Stack & Assessment-Quality Engineer  
**Date:** October 10, 2026  

---

## 1. Executive Summary & Design Non-Negotiables

This document specifies the technical design, data architecture, security sanitisation, and testing verification for three high-impact, transparent features added to the NextLearn / ProofLoop platform:
1. **Assessment Replay ("How this result was produced")**: An auditable 8-step chronological reconstruction of how any assessment result was derived, with side-by-side Gemini dual-run reasoning, deterministic test verification, stop-rule explanations, and SHA-256 integrity verification.
2. **Role Readiness Map ("The learning-to-hiring bridge")**: A learner-private target planning workspace linking existing evidence to 4 synthetic NxtMove role profiles, showing status (Met / Partly met / Not yet) using the unified recruiter requirement matcher, with deterministic gap resources and strengthening actions—strictly without percent matches or gamified ranking.
3. **Fairness Lab ("Language and phrasing consistency")**: An empirical reviewer tool executing production Gemini scoring across 12 base answers and 7 linguistic variants (Plain English, Polished English, Short & informal, Hinglish, Hindi Devanagari, Telugu script, and Typo-heavy), measuring consistency and reporting limits transparently without claiming "bias-free" status.

### Uncompromising Non-Negotiables
- **10 Palette Tokens Only**: `--white` (#FFFFFF), `--midnight` (#142D4E), `--cyan` (#06C6E6), `--ice` (#EAF6FC), `--text` (#334155), `--muted` (#64748B), `--border` (#D9E8F3), `--success` (#059669), `--warning` (#D97706), `--error` (#DC2626). No new hues or gradients.
- **Zero Gamification**: No points, XP, streaks, leaderboards, percentile matches, "match %", or aggregate single skill scores.
- **Strict Leak Protection**: Hidden tests, reference implementations, planted-error keys, optimality thresholds, expected follow-up key points, and internal prompt templates never reach the client or external API responses.
- **Honest Wording**: All scores and levels are explicitly labelled *"Experimental evidence, not a validated predictor of job performance."* The system never claims to be "unbiased" or "fair"; it reports empirical variance across defined synthetic samples.
- **Accessibility & Contrast**: WCAG 2.1 AA compliant, 44px minimum touch targets, visible cyan focus rings, prefers-reduced-motion respected, icon + text for every status indicator.

---

## 2. Infrastructure Reuse & Missing Data Audit

### Existing Infrastructure Reused
| Component | Location | Role in New Features |
| :--- | :--- | :--- |
| **Dual-Run Gemini Engine** | `src/lib/server/gemini.ts` | Powers reasoning evaluation for both Assessment Replay and Fairness Lab with Zod validation. |
| **Audit Log & Hashes** | `src/lib/server/api.ts` (`appendAudit`) | Replayed in Step 1 & 8 of Replay; verifies submission SHA-256 integrity. |
| **Recruiter Matcher** | `src/lib/server/recruiter.ts` | Extracted into shared `src/lib/server/requirement-matcher.ts` for 100% parity between Recruiter Search and Role Readiness. |
| **Stop Rule & Confidence** | `src/app/api/assessment/answer/route.ts` | Visualized in Step 6 & 7 of Assessment Replay. |
| **Reviewer Calibration** | `src/components/CalibrationPanel.tsx` | Linked with Fairness Lab empirical human-agreement matrix. |
| **Role Personas** | `src/components/RoleSwitcher.tsx` | Alex Morgan (Learner), Priya Sharma (Recruiter), Dr. Sarah Chen (Reviewer). |
| **Command Palette** | `src/components/CommandPalette.tsx` | Instant keyboard navigation to all three features (`Ctrl+K`). |

### Missing Data & Schema Additions Needed
1. **Dual Grader Runs**: While `explanation_json.model_runs` previously held summary run objects, raw individual grader runs with run metadata (run number, model name from config, prompt version, rubric version, latency ms, validated output JSON) were not stored in an isolated, queryable table.  
   *Solution*: Create `grader_runs` table with dedicated RLS.
2. **Learner Target Roles**: No table currently tracks which synthetic target roles a learner has pinned.  
   *Solution*: Create `learner_targets (learner_id, role_id, created_at)`.
3. **Curated Gap Resources**: No table maps a missing requirement (e.g., `debugging:insufficient` -> `developing`) to specific NextLearn missions or learning path modules.  
   *Solution*: Create `gap_resources` table seeded for all 4 NxtMove roles.
4. **Fairness Lab Benchmarks & Runs**: No tables store human-verified language variants, benchmark sets, or cached immutable execution runs.  
   *Solution*: Create `fairness_benchmarks`, `fairness_variants`, and `fairness_runs` tables.

---

## 3. Database Schema Changes & RLS Architecture

### Migration `202610100010_unique_features.sql`

```sql
-- 1. Grader Runs Table (Stores raw runs for auditable replay)
create table public.grader_runs (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  run_no smallint not null check (run_no in (1, 2)),
  run_type text not null check (run_type in ('explanation', 'followup', 'final_test')),
  model_name text not null,
  prompt_version text not null,
  rubric_version integer,
  output_json jsonb not null default '{}'::jsonb,
  latency_ms integer,
  created_at timestamptz not null default now()
);

-- RLS: Learner sees own attempt runs; Reviewer sees runs when attempt is flagged/challenged; Recruiters NEVER see raw grader runs.
alter table public.grader_runs enable row level security;
create policy "Learner reads own grader runs" on public.grader_runs
  for select using (
    exists (select 1 from public.attempts a where a.id = grader_runs.attempt_id and a.user_id = auth.uid())
  );
create policy "Reviewer reads flagged or challenged grader runs" on public.grader_runs
  for select using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'reviewer'
    ) and exists (
      select 1 from public.attempts a
      left join public.appeals ap on ap.attempt_id = a.id
      where a.id = grader_runs.attempt_id and (
        ap.id is not null or
        (a.explanation_json->>'similarity_review')::boolean = true or
        exists (select 1 from public.criterion_scores cs where cs.attempt_id = a.id and cs.confidence = 'low')
      )
    )
  );

-- 2. Learner Target Roles (Private to learner)
create table public.learner_targets (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (learner_id, role_id)
);
alter table public.learner_targets enable row level security;
create policy "Learner manages own target roles" on public.learner_targets
  for all using (learner_id = auth.uid()) with check (learner_id = auth.uid());
-- Recruiters and reviewers cannot read learner_targets (Strict privacy gate)

-- 3. Gap Resources (Authoring catalog for closing skill gaps)
create table public.gap_resources (
  id uuid primary key default gen_random_uuid(),
  skill text not null,
  language text not null default 'Any',
  from_level text not null,
  to_level text not null,
  resource_type text not null check (resource_type in ('mission', 'learning_module', 'practice_task', 'boss_round')),
  resource_id text not null,
  title text not null,
  path_url text not null,
  rationale text not null,
  created_at timestamptz not null default now()
);
alter table public.gap_resources enable row level security;
create policy "Anyone authenticated can read gap resources" on public.gap_resources
  for select using (true);

-- 4. Fairness Lab Benchmarks & Runs
create table public.fairness_benchmarks (
  id uuid primary key default gen_random_uuid(),
  path_slug text not null,
  criterion text not null,
  task_title text not null,
  human_ref_1 integer not null,
  human_ref_2 integer not null,
  base_answer_text text not null,
  created_at timestamptz not null default now()
);

create table public.fairness_variants (
  id uuid primary key default gen_random_uuid(),
  benchmark_id uuid not null references public.fairness_benchmarks(id) on delete cascade,
  variant_type text not null check (variant_type in (
    'baseline_plain', 'polished', 'short_informal', 'hinglish', 'hindi_devanagari', 'telugu_script', 'typo_heavy'
  )),
  variant_text text not null,
  language_code text not null,
  status text not null check (status in ('verified', 'unverified')),
  verified_by text,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.fairness_runs (
  id uuid primary key default gen_random_uuid(),
  run_batch_id text not null,
  variant_hash text not null,
  prompt_version text not null,
  model_name text not null,
  rubric_version integer not null,
  variant_id uuid not null references public.fairness_variants(id) on delete cascade,
  run1_score integer not null,
  run2_score integer not null,
  final_score integer not null,
  confidence text not null,
  flags text[] not null default '{}',
  latency_ms integer not null,
  created_at timestamptz not null default now(),
  unique (variant_hash, prompt_version, model_name, rubric_version)
);
alter table public.fairness_benchmarks enable row level security;
alter table public.fairness_variants enable row level security;
alter table public.fairness_runs enable row level security;
create policy "Reviewers read and run fairness lab" on public.fairness_benchmarks
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'reviewer'));
create policy "Reviewers read fairness variants" on public.fairness_variants
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'reviewer'));
create policy "Reviewers manage fairness runs" on public.fairness_runs
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'reviewer'));
```

---

## 4. Feature 1: Assessment Replay Specification

### Server-Side Allowlist Sanitiser & Leak Prevention
To eliminate prompt/key leakage via AI explanation paraphrasing:
1. **Allowlist Projection**: Replay data only selects:
   `{ attempt_id, submitted_at, input_hash, task_version, rubric_version, visible_tests: [{ title, passed }], hidden_counts: { total, passed, category }, optimality_tier, ai_runs: [{ run_no, criteria: [{ criterion, score, quote, reason }] }], followups: [{ position, gap_tags, question, answer, score, stop_reason }], confidence: { level, conditions_applied }, final_scores, audit_hash }`
2. **N-Gram Overlap Checker**: Any AI reason having a 4-gram overlap > 0.35 with reference solutions, planted-error keys, or follow-up answer keys is rejected or redacted to `[Reason text summarized for security]`.
3. **Truncation**: Reason text is truncated to a strict maximum of 250 characters.

### Replay 8-Step Timeline
- **Step 1: Submission Received**: Task version v1, Rubric version v1, Input SHA-256 hash (`3f8a...`), Timestamp.
- **Step 2: Visible Acceptance Tests**: Individual visible cases with Pass/Fail status (e.g. `2 of 2 tests passed`).
- **Step 3: Hidden Verification Checks**: Aggregated category counts only (e.g., `3 of 4 hidden boundary & edge-case checks passed`). No inputs, outputs, or test names.
- **Step 4: Optimality Tier**: Tier reached (e.g. `Optimal Time & Space`) with generic reason; zero thresholds or reference code.
- **Step 5: Gemini Reasoning (Dual Runs Side-by-Side)**: Run 1 vs Run 2 per criterion. Agreement status indicator:
  - `Agree` (0 delta) — checkmark
  - `Differ by 1` (1 delta) — warning icon
  - `Differ by 2+` (2+ delta) — error alert icon (triggers Low confidence)
  - Shows quote in learner's exact words.
- **Step 6: Follow-Up Questions Defense**: Triggering gap tags, questions asked, learner's response, stop-rule outcome ("Stopped after 1 question because answers were consistent and strong"), with explicit note: *"The number of follow-ups never influences the score."*
- **Step 7: Confidence Derivation**: Rule checklist highlighting which conditions applied (e.g., *Runs agreed on every criterion*, *Tests passed cleanly*) -> resulting `High` / `Medium` / `Low`.
- **Step 8: Final Scores & Integrity Verification**: Criterion breakdown + **"Verify Integrity"** action button. Recomputes SHA-256 of stored code + report against `audit_log.input_hash` and displays `✓ SHA-256 Hash Matched: Authenticity Verified`.

### Role-Based Visibility
- **Learner**: Full replay of own attempts.
- **Reviewer**: Full replay + appeal history, reviewer override panel, similarity flags.
- **Recruiter**: **Method Card Only** (Task/rubric versions, confidence explanation, AI disclosure, flags). Zero raw model outputs; zero learner text unless separate `include_submissions` consent is active.

---

## 5. Feature 2: Role Readiness Map Specification

### Shared Requirement Matcher
Extract recruiter matching logic from `src/lib/server/recruiter.ts` into a unified function:
```typescript
export type RequirementEvaluation = {
  skill: string;
  language: string;
  requiredLevel: string;
  actualLevel: string | null;
  maxAgeDays: number;
  actualAgeDays: number | null;
  minTasks: number;
  actualTasks: number;
  confidenceNeeded: "high" | "medium";
  actualConfidence: "high" | "medium" | "low" | null;
  importance: "must-have" | "nice-to-have";
  status: "met" | "partly-met" | "not-yet";
  reasons: string[];
  evidenceId: string | null;
  attemptId: string | null;
};
```
Both `recruiter/candidates/route.ts` and `learner/readiness/route.ts` consume this identical pure evaluation function, ensuring 100% parity.

### Target Roles Seeded (NxtMove Templates)
1. **Junior Java Developer** (Debugging / Java / Developing / 90 days / 2 tasks)
2. **Junior Data Analyst** (Data Analytics / SQL & Spreadsheets / Developing / 90 days / 2 tasks)
3. **Business Analyst** (Business Analytics / Proficient / 120 days / 2 tasks)
4. **Customer Communications Associate** (Communication / Developing / 90 days / 1 task)

### Non-Gamified UI
- Plain summary banner: *"3 of 4 must-have requirements met for Junior Data Analyst."*
- Notice: *"Sample role. Real employers set their own requirements. Meeting a list does not guarantee a job or predict performance."*
- Specific reason badges for `Partly met` and `Not yet`:
  - `Level below requirement: Beginner (needs Developing)`
  - `Evidence age: 104 days (exceeds 90-day window)`
  - `Low confidence: needs human review or clean retry`
  - `No evidence yet: complete prerequisite task`
- **Close This Gap**: Deep links to exact catalog modules in `gap_resources`.
- **Strengthen This Evidence**: Deterministic guidance (e.g. *"Evidence is older than 90 days: a refresh task would update it"*).

---

## 6. Feature 3: Fairness Lab Specification

### Benchmark Set
- **12 Base Answers**:
  - 4 Data Analytics (Cohort revenue SQL reasoning, spreadsheet formula logic, aggregation error, join null-handling)
  - 4 Business Analytics (Unit economics margin breakdown, churn driver synthesis, bottleneck prioritization, executive summary)
  - 4 Communication (De-escalation response, technical-to-non-technical translation, change notice, boundary setting)
- **7 Phrasing Variants Per Base Answer** (84 total cases):
  1. `baseline_plain`: Clear, standard English.
  2. `polished`: Highly formal, academic English.
  3. `short_informal`: Direct, terse conversational phrasing.
  4. `hinglish`: Romanized Hindi-English mix (*"Maine check kiya aur loop last element skip kar raha tha"*).
  5. `hindi_devanagari`: Devanagari script (*"लूप स्थिति i < values.length - 1 अंतिम तत्व को छोड़ देती है।"*).
  6. `telugu_script`: Telugu script (*"లూప్ పరిస్థితి చివరి మూలకాన్ని దాటవేస్తుంది."*).
  7. `typo_heavy`: Frequent misspellings, phonetic typing, dropped punctuation.

### Verification Metadata
- Every variant has `status: 'verified'` or `'unverified'`, `verified_by`, `verified_at`.
- Unverified items display: *"Unverified translation, results indicative only."*

### Execution Engine with Caching & Rate-Limiting
- Runs call the production `scoreExplanation` or `scoreFollowup` function.
- Rate-limiting: Max 20 calls per minute; batch cap of 28 calls per run with explicit confirmation modal.
- Cache key: `SHA256(variant_text + prompt_version + model_name + rubric_version)`.
- If no API key configured: serves stored immutable run results with date, or clean empty state. Never fabricates numbers.

### Multilingual Support (Learner Experience)
- Unicode UTF-8 safe storage across all endpoints.
- Web fonts: System fallbacks including `Noto Sans Devanagari` and `Noto Sans Telugu`.
- Word counter and sentence splitter respect Devanagari danda (`।`) and Telugu punctuation.
- Grader prompt explicit instruction: *"Score technical content only. Evaluate in the language given. Quote evidence in the original script. Do not penalise grammar, dialect, transliteration, or script."*
- Feedback toggle: *"AI-assisted feedback: Original language / Show in English"*.

---

## 7. Phased Implementation Roadmap

- **Phase 0 (Current)**: Audit codebase, write `docs/UNIQUE_FEATURES_PLAN.md`.
- **Phase 1**: Migration `202610100010_unique_features.sql`, shared requirement matcher, replay allowlist sanitiser & leak test extensions.
- **Phase 2**: Feature 1: Assessment Replay UI (`/results/[attemptId]/replay` and dialog integration), integrity verification SHA-256 endpoint, and recruiter Method Card.
- **Phase 3**: Feature 2: Role Readiness Map (`learner_targets`, gap recommendations, `gap_resources` seed data).
- **Phase 4**: Multilingual input & Unicode danda/Telugu parser updates in prompt pipeline.
- **Phase 5**: Feature 3: Fairness Lab (`/fairness` route, reviewer benchmark matrix, summary delta table, immutable execution cache, Markdown/PDF report export).
- **Phase 6**: Seed demo scenarios (Alex partial Data Analyst evidence, 3 distinct replay states, real Fairness Lab benchmark run), update README demo script, and final QA verification.

---

## 8. Quality Gates & Verification Checklist

1. **TypeScript & Build**: Zero type errors across Next.js Turbopack build.
2. **Vitest Unit & Integration Suites**:
   - `replay-sanitiser.test.ts`: Proves allowlist projection, answer-key n-gram rejection, and truncation.
   - `recruiter-matcher-parity.test.ts`: Proves 100% logic parity between recruiter search and readiness map.
   - `unique-features-rls.test.ts`: Proves recruiters/reviewers cannot read `learner_targets`, and learners cannot view other learners' replays.
   - `fairness-lab.test.ts`: Spy test proving production scoring pipeline is invoked, rate-caps enforced, and results cached.
   - `unicode-multilingual.test.ts`: Hindi, Telugu, and Hinglish submissions successfully parsed, stored, and scored.
   - `integrity-verification.test.ts`: Validates SHA-256 match and detects tampered records.
3. **Design Verification**: Checked at 360px, 768px, 1024px, and 1440px with strict 10-token palette adherence.
