alter table public.consents add column include_submissions boolean not null default false;
alter table public.consents drop constraint if exists consents_scope_check;
alter table public.consents add constraint consents_scope_check check (scope in ('evidence_and_scores', 'full_evidence'));
alter table public.evidence drop constraint if exists evidence_attempt_id_key;

create table public.review_decisions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id),
  reviewer_id uuid not null references public.profiles(id),
  criterion text not null,
  decision text not null check (decision in ('confirmed', 'overturned')),
  score numeric(5,2) not null,
  reason text not null check (length(reason) between 10 and 2000),
  created_at timestamptz not null default now()
);
alter table public.review_decisions enable row level security;
create policy "reviewers read review decisions" on public.review_decisions for select to authenticated using (public.current_app_role() = 'reviewer');
create trigger review_decisions_append_only before update or delete on public.review_decisions for each row execute function public.prevent_append_only_mutation();
