alter table public.review_decisions
  add column similarity_cleared boolean not null default false;

comment on column public.review_decisions.similarity_cleared is 'Reviewer attestation that a possible near-identical code submission was compared and cleared.';
