create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('learner', 'recruiter', 'reviewer');
create type public.attempt_type as enum ('mission', 'boss');
create type public.appeal_status as enum ('open', 'in_review', 'confirmed', 'overturned');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  role public.app_role not null default 'learner',
  synthetic_candidate_id text unique,
  created_at timestamptz not null default now(),
  check (length(display_name) between 1 and 80)
);

create function public.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, synthetic_candidate_id)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), 'Learner'), 'cand_' || substr(replace(new.id::text, '-', ''), 1, 8));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_profile_for_auth_user();

create function public.prevent_profile_role_escalation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only a trusted server administrator can change application roles';
  end if;
  return new;
end;
$$;
create trigger profiles_role_guard before update on public.profiles
for each row execute procedure public.prevent_profile_role_escalation();

create table public.skill_nodes (
  id smallint primary key,
  slug text not null unique,
  title text not null,
  requires jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  competency text not null,
  language text not null check (language in ('Java', 'JavaScript')),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  skill_node_id smallint not null references public.skill_nodes(id),
  mission_json jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.task_versions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id),
  version integer not null check (version > 0),
  prompt text not null,
  starter_code text not null,
  explanation_prompt jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (task_id, version)
);

create table public.rubrics (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id),
  version integer not null check (version > 0),
  criteria_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (task_id, version)
);

create table public.visible_test_cases (
  id uuid primary key default gen_random_uuid(),
  task_version_id uuid not null references public.task_versions(id),
  ordinal smallint not null,
  title text not null,
  input_json jsonb not null,
  expected_json jsonb not null,
  unique (task_version_id, ordinal)
);

create table public.hidden_test_suites (
  task_version_id uuid primary key references public.task_versions(id),
  test_spec jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.followup_bank (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id),
  version integer not null check (version > 0),
  trigger_json jsonb not null,
  question_template text not null,
  expected_key_points jsonb not null,
  max_score smallint not null default 2 check (max_score between 1 and 5),
  ordinal smallint not null,
  created_at timestamptz not null default now(),
  unique (task_id, version, ordinal)
);

create table public.boss_rounds (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  skill_node_id smallint references public.skill_nodes(id),
  version integer not null default 1,
  language text not null check (language in ('Java', 'JavaScript')),
  title text not null,
  flawed_code text not null,
  flaw_lines smallint[] not null,
  reference_code text not null,
  alt_reference_code text not null,
  expected_flaw_key jsonb not null,
  followup_bank jsonb not null,
  created_at timestamptz not null default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  task_version_id uuid references public.task_versions(id),
  rubric_id uuid references public.rubrics(id),
  boss_round_id uuid references public.boss_rounds(id),
  attempt_type public.attempt_type not null default 'mission',
  code text not null,
  explanation_json jsonb not null default '{}'::jsonb,
  ai_disclosure boolean not null default false,
  submitted_at timestamptz not null default now(),
  check ((attempt_type = 'mission' and task_version_id is not null and rubric_id is not null) or (attempt_type = 'boss' and boss_round_id is not null))
);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id),
  bank_id uuid references public.followup_bank(id),
  bank_version integer not null,
  position smallint not null,
  gap_tags jsonb not null default '[]'::jsonb,
  question_shown text not null,
  answer_text text,
  score smallint check (score between 0 and 5),
  ai_reason text,
  evidence_quote text,
  run_scores smallint[],
  answered_at timestamptz,
  unique (attempt_id, position)
);

create table public.boss_submissions (
  attempt_id uuid primary key references public.attempts(id),
  decision text not null check (decision in ('accept', 'reject')),
  flagged_lines smallint[] not null default '{}',
  test_code text not null,
  fails_on_flawed boolean,
  passes_on_reference boolean,
  passes_on_alt boolean,
  check_results jsonb not null default '{}'::jsonb
);

create table public.criterion_scores (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id),
  criterion text not null,
  score numeric(5,2) not null,
  max_score numeric(5,2) not null,
  source text not null check (source in ('test', 'ai', 'human')),
  feedback text not null default '',
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  run_scores numeric(5,2)[],
  created_at timestamptz not null default now(),
  check (score >= 0 and score <= max_score),
  unique (attempt_id, criterion, source)
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id),
  user_id uuid not null references public.profiles(id),
  skill text not null,
  language text not null,
  level text not null check (level in ('insufficient', 'beginner', 'developing', 'proficient', 'advanced')),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  assessed_at timestamptz not null default now(),
  unique (attempt_id)
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  skill text not null,
  scope text not null default 'evidence_and_scores' check (scope in ('evidence_and_scores')),
  shared boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, skill)
);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id),
  user_id uuid not null references public.profiles(id),
  criterion text not null,
  reason text not null check (length(reason) between 10 and 2000),
  status public.appeal_status not null default 'open',
  reviewer_id uuid references public.profiles(id),
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  requirements_json jsonb not null,
  active boolean not null default true
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  actor uuid references public.profiles(id),
  action text not null,
  attempt_id uuid references public.attempts(id),
  task_version integer,
  rubric_version integer,
  bank_version integer,
  model_name text,
  prompt_version text,
  input_hash text,
  output_json jsonb not null default '{}'::jsonb,
  flags jsonb not null default '[]'::jsonb
);

create table public.api_rate_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null,
  window_started timestamptz not null,
  request_count integer not null check (request_count >= 0),
  primary key (user_id, bucket)
);
alter table public.api_rate_limits enable row level security;

create function public.consume_api_rate_limit(p_user_id uuid, p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_count integer;
begin
  insert into public.api_rate_limits(user_id, bucket, window_started, request_count)
  values (p_user_id, p_bucket, now(), 1)
  on conflict (user_id, bucket) do update set
    window_started = case when public.api_rate_limits.window_started <= now() - make_interval(secs => p_window_seconds) then now() else public.api_rate_limits.window_started end,
    request_count = case when public.api_rate_limits.window_started <= now() - make_interval(secs => p_window_seconds) then 1 else public.api_rate_limits.request_count + 1 end
  returning request_count into current_count;
  return current_count <= p_limit;
end;
$$;
revoke all on function public.consume_api_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(uuid, text, integer, integer) to service_role;

create index attempts_user_time on public.attempts(user_id, submitted_at desc);
create index evidence_user_skill_time on public.evidence(user_id, skill, assessed_at desc);
create index open_appeals on public.appeals(status, created_at) where status in ('open', 'in_review');
create index audit_attempt_time on public.audit_log(attempt_id, ts desc);

create function public.prevent_append_only_mutation()
returns trigger language plpgsql as $$ begin raise exception 'This record is append-only'; end; $$;
create trigger attempts_append_only before update or delete on public.attempts for each row execute function public.prevent_append_only_mutation();
create trigger followups_append_only before update or delete on public.followups for each row execute function public.prevent_append_only_mutation();
create trigger audit_append_only before update or delete on public.audit_log for each row execute function public.prevent_append_only_mutation();
create trigger criterion_scores_append_only before update or delete on public.criterion_scores for each row execute function public.prevent_append_only_mutation();

alter table public.profiles enable row level security;
alter table public.skill_nodes enable row level security;
alter table public.tasks enable row level security;
alter table public.task_versions enable row level security;
alter table public.rubrics enable row level security;
alter table public.visible_test_cases enable row level security;
alter table public.hidden_test_suites enable row level security;
alter table public.followup_bank enable row level security;
alter table public.boss_rounds enable row level security;
alter table public.attempts enable row level security;
alter table public.followups enable row level security;
alter table public.boss_submissions enable row level security;
alter table public.criterion_scores enable row level security;
alter table public.evidence enable row level security;
alter table public.consents enable row level security;
alter table public.appeals enable row level security;
alter table public.roles enable row level security;
alter table public.audit_log enable row level security;

create function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create policy "profile owner reads own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profile owner edits display name" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = public.current_app_role());
create policy "authenticated reads skill tree" on public.skill_nodes for select to authenticated using (true);
create policy "authenticated reads active tasks" on public.tasks for select to authenticated using (active);
create policy "authenticated reads task versions" on public.task_versions for select to authenticated using (exists (select 1 from public.tasks t where t.id = task_id and t.active));
create policy "authenticated reads rubrics" on public.rubrics for select to authenticated using (true);
create policy "authenticated reads visible tests" on public.visible_test_cases for select to authenticated using (true);

create policy "learner owns attempts" on public.attempts for select to authenticated using (user_id = (select auth.uid()));
create policy "learner submits attempts" on public.attempts for insert to authenticated with check (user_id = (select auth.uid()));
create policy "learner reads own followups" on public.followups for select to authenticated using (exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = (select auth.uid())));
create policy "learner reads own boss submission" on public.boss_submissions for select to authenticated using (exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = (select auth.uid())));
create policy "learner reads own scores" on public.criterion_scores for select to authenticated using (exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = (select auth.uid())));
create policy "learner reads own evidence" on public.evidence for select to authenticated using (user_id = (select auth.uid()));
create policy "consent owner reads own" on public.consents for select to authenticated using (user_id = (select auth.uid()));
create policy "consent owner sets own" on public.consents for insert to authenticated with check (user_id = (select auth.uid()));
create policy "consent owner updates own" on public.consents for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "learner reads own appeals" on public.appeals for select to authenticated using (user_id = (select auth.uid()));
create policy "learner opens own appeals" on public.appeals for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reviewers read appeals" on public.appeals for select to authenticated using (public.current_app_role() = 'reviewer');
create policy "reviewers resolve appeals" on public.appeals for update to authenticated using (public.current_app_role() = 'reviewer') with check (public.current_app_role() = 'reviewer' and reviewer_id = (select auth.uid()));
create policy "authenticated reads active roles" on public.roles for select to authenticated using (active);
create policy "owners and reviewers read audit" on public.audit_log for select to authenticated using (
  public.current_app_role() = 'reviewer' or exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = (select auth.uid()))
);

create policy "recruiter sees consented evidence" on public.evidence for select to authenticated using (
  public.current_app_role() = 'recruiter' and exists (
    select 1 from public.consents c where c.user_id = evidence.user_id and c.skill = evidence.skill and c.shared and c.revoked_at is null
  )
);
create policy "recruiter sees shared profile names" on public.profiles for select to authenticated using (
  public.current_app_role() = 'recruiter' and exists (
    select 1 from public.consents c where c.user_id = profiles.id and c.shared and c.revoked_at is null
  )
);

-- Hidden suites, follow-up answer keys, boss reference implementations and audit rows have no client-facing policies.
