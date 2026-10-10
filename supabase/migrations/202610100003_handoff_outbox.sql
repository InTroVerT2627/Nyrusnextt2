create table public.handoff_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  skill text not null,
  event text not null check (event in ('consent_granted', 'consent_revoked')),
  payload_json jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'failed', 'simulated')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);
alter table public.handoff_outbox enable row level security;
alter table public.criterion_scores drop constraint if exists criterion_scores_attempt_id_criterion_source_key;
create trigger tasks_versions_append_only before update or delete on public.task_versions for each row execute function public.prevent_append_only_mutation();
create trigger rubrics_append_only before update or delete on public.rubrics for each row execute function public.prevent_append_only_mutation();
create trigger visible_tests_append_only before update or delete on public.visible_test_cases for each row execute function public.prevent_append_only_mutation();
create trigger followup_bank_append_only before update or delete on public.followup_bank for each row execute function public.prevent_append_only_mutation();
create trigger hidden_suites_append_only before update or delete on public.hidden_test_suites for each row execute function public.prevent_append_only_mutation();
create trigger boss_rounds_append_only before update or delete on public.boss_rounds for each row execute function public.prevent_append_only_mutation();
create trigger evidence_append_only before update or delete on public.evidence for each row execute function public.prevent_append_only_mutation();
