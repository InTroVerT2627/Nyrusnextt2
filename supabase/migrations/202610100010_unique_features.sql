-- Migration 202610100010_unique_features.sql
-- Supports: Assessment Replay (grader_runs), Role Readiness Map (learner_targets, gap_resources), Fairness Lab (benchmarks, variants, runs)

-- 1. Grader Runs Table (Immutable raw AI evaluator runs)
create table if not exists public.grader_runs (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  run_no smallint not null check (run_no in (1, 2)),
  run_type text not null check (run_type in ('explanation', 'followup', 'final_test')),
  model_name text not null,
  prompt_version text not null,
  rubric_version integer,
  output_json jsonb not null default '{}'::jsonb,
  latency_ms integer default 0,
  created_at timestamptz not null default now()
);

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

-- 2. Learner Target Roles (Private learner planning)
create table if not exists public.learner_targets (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (learner_id, role_id)
);

alter table public.learner_targets enable row level security;

create policy "Learner manages own target roles" on public.learner_targets
  for all using (learner_id = auth.uid()) with check (learner_id = auth.uid());

-- 3. Gap Resources (Authoring catalog for closing skill gaps)
create table if not exists public.gap_resources (
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

-- 4. Fairness Lab Tables
create table if not exists public.fairness_benchmarks (
  id uuid primary key default gen_random_uuid(),
  path_slug text not null,
  criterion text not null,
  task_title text not null,
  human_ref_1 integer not null,
  human_ref_2 integer not null,
  base_answer_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fairness_variants (
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

create table if not exists public.fairness_runs (
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

create policy "Reviewers read fairness benchmarks" on public.fairness_benchmarks
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'reviewer'));

create policy "Reviewers read fairness variants" on public.fairness_variants
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'reviewer'));

create policy "Reviewers manage fairness runs" on public.fairness_runs
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'reviewer'));

-- 5. Seed Gap Resources Catalog
insert into public.gap_resources (skill, language, from_level, to_level, resource_type, resource_id, title, path_url, rationale)
values
  ('debugging', 'Java', 'insufficient', 'developing', 'mission', 'find-max', 'Mission 01: Find Max Boundary Bug', '/?section=Missions', 'Fix off-by-one boundary defect and explain root cause.'),
  ('debugging', 'Java', 'developing', 'proficient', 'mission', 'remove-duplicates', 'Mission 02: Order Preserving Dedup', '/?section=Missions', 'Solve list mutation edge case preserving order.'),
  ('debugging', 'Java', 'proficient', 'advanced', 'mission', 'customer-key', 'Mission 04: Hash Collision & Cache Hits', '/?section=Missions', 'Implement proper equals and hashCode contracts.'),
  ('reviewing-ai-written-code', 'JavaScript', 'insufficient', 'developing', 'boss_round', 'catch-the-ai-mistake', 'Boss Round: Catch the AI Mistake', '/?section=Skill+tree', 'Identify subtle whitespace loop bug and prove with failing test.'),
  ('data-analytics', 'SQL', 'insufficient', 'developing', 'learning_module', 'data-module-1', 'Module 01: Foundational SQL Aggregations', '/learning', 'Master cohort revenue metrics and safe NULL filtering.'),
  ('data-analytics', 'SQL', 'developing', 'proficient', 'learning_module', 'data-module-4', 'Module 04: Cohort Retention & Window Functions', '/learning', 'Analyze user behavior over time using window partitions.'),
  ('business-analytics', 'Any', 'insufficient', 'developing', 'learning_module', 'business-module-1', 'Module 01: Unit Economics & Gross Margins', '/learning', 'Deconstruct contribution margins and fixed vs variable costs.'),
  ('business-analytics', 'Any', 'developing', 'proficient', 'learning_module', 'business-module-5', 'Module 05: Churn & LTV Sensitivities', '/learning', 'Model payback periods and customer acquisition efficiency.'),
  ('communication', 'Any', 'insufficient', 'developing', 'learning_module', 'comm-module-1', 'Module 01: High-Stakes Incident Communication', '/learning', 'Formulate clear, blameless customer updates under operational outages.'),
  ('communication', 'Any', 'developing', 'proficient', 'learning_module', 'comm-module-4', 'Module 04: Translating Technical Impact to Executives', '/learning', 'Synthesize complex system architectures into business decisions.')
on conflict do nothing;

-- 6. Seed Synthetic Roles for all 4 NxtMove Templates
insert into public.roles (slug, title, requirements_json)
values
  ('junior-java-developer', 'Junior Java Developer', '{"skills":[{"skill":"debugging","language":"Java","minimum_level":"developing","max_age_days":90,"minimum_tasks":2,"importance":"must-have","confidence_needed":"medium"}],"human_decision_required":true}'),
  ('junior-data-analyst', 'Junior Data Analyst', '{"skills":[{"skill":"data-analytics","language":"SQL","minimum_level":"developing","max_age_days":90,"minimum_tasks":2,"importance":"must-have","confidence_needed":"medium"},{"skill":"business-analytics","language":"Any","minimum_level":"beginner","max_age_days":120,"minimum_tasks":1,"importance":"nice-to-have","confidence_needed":"medium"}],"human_decision_required":true}'),
  ('business-analyst', 'Business Analyst', '{"skills":[{"skill":"business-analytics","language":"Any","minimum_level":"proficient","max_age_days":120,"minimum_tasks":2,"importance":"must-have","confidence_needed":"medium"},{"skill":"communication","language":"Any","minimum_level":"developing","max_age_days":90,"minimum_tasks":1,"importance":"must-have","confidence_needed":"medium"}],"human_decision_required":true}'),
  ('customer-communications-associate', 'Customer Communications Associate', '{"skills":[{"skill":"communication","language":"Any","minimum_level":"developing","max_age_days":90,"minimum_tasks":1,"importance":"must-have","confidence_needed":"medium"}],"human_decision_required":true}')
on conflict (slug) do update set requirements_json = excluded.requirements_json;
