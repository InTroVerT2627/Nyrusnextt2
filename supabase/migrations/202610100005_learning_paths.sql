create table public.learning_module_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_slug text not null check (path_slug in ('data-analytics', 'business-analytics', 'communication')),
  module_slug text not null,
  module_version smallint not null default 1 check (module_version > 0),
  score smallint not null check (score between 0 and 3),
  question_count smallint not null check (question_count = 3),
  responses smallint[] not null check (cardinality(responses) = question_count),
  passed boolean not null,
  submitted_at timestamptz not null default now()
);

comment on table public.learning_module_attempts is 'Append-only knowledge-check attempts for the three learner practice paths; not recruiter evidence.';
create index learning_module_attempts_user_module_time
  on public.learning_module_attempts(user_id, path_slug, module_slug, submitted_at desc);

alter table public.learning_module_attempts enable row level security;
revoke all on public.learning_module_attempts from anon, authenticated;
grant all on public.learning_module_attempts to service_role;

create trigger learning_module_attempts_append_only
  before update or delete on public.learning_module_attempts
  for each row execute function public.prevent_append_only_mutation();
