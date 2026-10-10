create table public.recruiter_decisions (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.profiles(id),
  candidate_id uuid not null references public.profiles(id),
  role_id uuid not null references public.roles(id),
  decision text not null check (decision in ('reviewed', 'shortlisted')),
  note text check (note is null or length(note) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.recruiter_decisions enable row level security;
create policy "recruiter reads own decisions" on public.recruiter_decisions for select to authenticated using (recruiter_id = (select auth.uid()));
create trigger recruiter_decisions_append_only before update or delete on public.recruiter_decisions for each row execute function public.prevent_append_only_mutation();
