update public.tasks
set mission_json = mission_json || case slug
  when 'find-max' then '{"description":"A weekly sales report sometimes disagrees with the source totals.","symptom":"The reported leader differs from the source report for some input lists.","plain_task":"Given a list of weekly product values, return the largest value and define how an empty list is handled."}'::jsonb
  when 'remove-duplicates' then '{"description":"Some customer records are missing after a mailing-list cleanup.","symptom":"The saved roster does not match the expected customer records.","plain_task":"Remove duplicate customer names from a Java list while preserving the first-seen order."}'::jsonb
  when 'async-results' then '{"description":"Some order summaries appear incomplete after a successful refresh.","symptom":"The displayed order list can differ from the expected results.","plain_task":"Given order IDs and an asynchronous fetch function, return every order in input order after handling all requests."}'::jsonb
  when 'customer-key' then '{"description":"A cache lookup sometimes misses a customer key that should represent the same identity.","symptom":"A familiar customer lookup does not return the saved record.","plain_task":"Implement a Java customer key for HashMap so equal customer identities retrieve the same value and key fields remain stable."}'::jsonb
  else '{}'::jsonb
end
where slug in ('find-max', 'remove-duplicates', 'async-results', 'customer-key');

-- Publish a non-revealing story prompt as a new version so earlier attempts retain
-- their original prompt, rubric, visible tests, and private test suite.
insert into public.task_versions(task_id, version, prompt, starter_code, explanation_prompt)
select t.id, 2,
  case t.slug
    when 'find-max' then 'The weekly sales dashboard shows a top seller that sometimes disagrees with the source report. Review the supplied calculation against the acceptance checks and document your findings.'
    when 'remove-duplicates' then 'An operations team reports that the saved mailing list does not match the expected roster. Review the supplied behavior, use the acceptance checks, and document a safe correction.'
    when 'async-results' then 'Some order summaries appear incomplete after a successful refresh. Review the supplied implementation against the acceptance checks and document a reliable correction.'
    when 'customer-key' then 'A cache lookup misses a customer key expected to represent the same identity as a saved key. Review the supplied implementation against the acceptance checks and explain a stable correction.'
  end,
  v.starter_code,
  v.explanation_prompt
from public.tasks t
join public.task_versions v on v.task_id = t.id and v.version = 1
where t.slug in ('find-max', 'remove-duplicates', 'async-results', 'customer-key')
on conflict (task_id, version) do nothing;

insert into public.rubrics(task_id, version, criteria_json)
select task_id, 2, criteria_json
from public.rubrics
where version = 1
on conflict (task_id, version) do nothing;

insert into public.visible_test_cases(task_version_id, ordinal, title, input_json, expected_json)
select v2.id, cases.ordinal, cases.title, cases.input_json, cases.expected_json
from public.task_versions v2
join public.task_versions v1 on v1.task_id = v2.task_id and v1.version = 1
join public.visible_test_cases cases on cases.task_version_id = v1.id
where v2.version = 2
on conflict (task_version_id, ordinal) do nothing;

insert into public.hidden_test_suites(task_version_id, test_spec)
select v2.id, hidden.test_spec
from public.task_versions v2
join public.task_versions v1 on v1.task_id = v2.task_id and v1.version = 1
join public.hidden_test_suites hidden on hidden.task_version_id = v1.id
where v2.version = 2
on conflict (task_version_id) do nothing;
