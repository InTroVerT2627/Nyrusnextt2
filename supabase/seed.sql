insert into public.skill_nodes (id, slug, title, requires) values
  (1, 'loop-bounds', 'Loop bounds', '[]'),
  (2, 'mutation', 'Mutation during iteration', '["loop-bounds"]'),
  (3, 'async-flow', 'Async flow', '["loop-bounds"]'),
  (4, 'equality-hashing', 'Equality and hashing', '["mutation", "async-flow"]'),
  (5, 'boss-review', 'Reviewing AI-written code', '["any-three-debugging-nodes"]')
on conflict (id) do update set slug=excluded.slug, title=excluded.title, requires=excluded.requires;

insert into public.tasks(id, slug, competency, language, difficulty, skill_node_id, mission_json) values
  ('10000000-0000-4000-8000-000000000001', 'find-max', 'debugging', 'JavaScript', 'Easy', 1, '{"title":"Dashboard shows the wrong top seller","short_title":"The wrong top seller","severity":"S3 · Low","description":"A weekly sales report leaves out the product that should be leading.","symptom":"The final item in the weekly sales data is never considered.","plain_task":"Fix findMax so it considers every value and has defined empty-input behavior."}'),
  ('10000000-0000-4000-8000-000000000002', 'remove-duplicates', 'debugging', 'Java', 'Medium', 2, '{"title":"Mailing list skips some customers","short_title":"Customers go missing","severity":"S3 · Low","description":"Duplicate cleanup silently drops valid customer records.","symptom":"Removing from the list shifts elements while the index advances.","plain_task":"Remove duplicates while preserving the first-seen order."}'),
  ('10000000-0000-4000-8000-000000000003', 'async-results', 'debugging', 'JavaScript', 'Medium', 3, '{"title":"Order summary renders before data arrives","short_title":"The early report","severity":"S2 · Medium","description":"An order summary renders before all of its data has finished loading.","symptom":"The outer function returns before the asynchronous callbacks finish.","plain_task":"Wait for all requests and preserve input order."}'),
  ('10000000-0000-4000-8000-000000000004', 'customer-key', 'debugging', 'Java', 'Hard', 4, '{"title":"Customer cache never gets a hit","short_title":"The cache miss","severity":"S1 · High","description":"A customer lookup misses even when the requested key looks familiar.","symptom":"The key compares equal but hashes to the wrong bucket.","plain_task":"Make equal customer keys obey the hash-code contract."}')
on conflict (slug) do update set mission_json=excluded.mission_json;

insert into public.task_versions(id, task_id, version, prompt, starter_code, explanation_prompt) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 1,
   'The sales dashboard misses the highest product when it is the final entry. Find and fix the loop-bound defect. Define what should happen on empty input.',
   'function findMax(values) {\n  let best = values[0];\n  for (let i = 0; i < values.length - 1; i++) {\n    if (values[i] > best) best = values[i];\n  }\n  return best;\n}',
   '{"headings":["What broke","Why it broke","The fix","How to prevent it"]}'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 1,
   'Remove duplicates while preserving first-seen customer order. Explain why mutating the list during iteration skips records.',
   'class Solution {\n  static List<String> removeDuplicates(List<String> customers) {\n    for (int i = 0; i < customers.size(); i++) {\n      if (customers.indexOf(customers.get(i)) < i) customers.remove(i);\n    }\n    return customers;\n  }\n}',
   '{"headings":["What broke","Why it broke","The fix","How to prevent it"]}'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 1,
   'Wait for all order requests and return results in input order. Explain when parallel requests may be inappropriate.',
   'async function loadOrders(ids, fetchOrder) {\n  const orders = [];\n  ids.forEach(async (id) => { orders.push(await fetchOrder(id)); });\n  return orders;\n}',
   '{"headings":["What broke","Why it broke","The fix","How to prevent it"]}'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 1,
   'Implement a CustomerKey whose equality and hash code agree and whose key fields cannot change.',
   'class CustomerKey {\n  private final String email;\n  CustomerKey(String email) { this.email = email; }\n  @Override public boolean equals(Object other) {\n    return other instanceof CustomerKey && email.equals(((CustomerKey) other).email);\n  }\n}',
   '{"headings":["What broke","Why it broke","The fix","How to prevent it"]}')
on conflict (task_id, version) do update set prompt=excluded.prompt, starter_code=excluded.starter_code, explanation_prompt=excluded.explanation_prompt;

insert into public.rubrics(task_id, version, criteria_json)
select t.id, 1, '{"criteria":[{"id":"fix_correctness","title":"Fix correctness","weight":35,"max":100,"source":"tests"},{"id":"edge_cases","title":"Edge-case handling","weight":15,"max":100,"source":"tests"},{"id":"root_cause","title":"Root-cause identification","weight":20,"max":3,"source":"ai"},{"id":"explanation","title":"Explanation clarity","weight":10,"max":2,"source":"ai"},{"id":"followup_reasoning","title":"Follow-up reasoning","weight":20,"max":2,"source":"followups"}]'
from public.tasks t
on conflict (task_id, version) do update set criteria_json=excluded.criteria_json;

insert into public.visible_test_cases(task_version_id, ordinal, title, input_json, expected_json) values
  ('20000000-0000-4000-8000-000000000001', 1, 'Ordinary values', '[3,8,4]', '8'),
  ('20000000-0000-4000-8000-000000000001', 2, 'Maximum at final index', '[3,8,11]', '11'),
  ('20000000-0000-4000-8000-000000000002', 1, 'Adjacent duplicates keep first order', '["A","A","B","A"]', '["A","B"]'),
  ('20000000-0000-4000-8000-000000000003', 1, 'Wait for all requests in order', '["a","b"]', '["A","B"]'),
  ('20000000-0000-4000-8000-000000000004', 1, 'Equal keys retrieve the value', '["a@example.test","a@example.test"]', 'true')
on conflict (task_version_id, ordinal) do update set title=excluded.title, input_json=excluded.input_json, expected_json=excluded.expected_json;

insert into public.hidden_test_suites(task_version_id, test_spec) values
  ('20000000-0000-4000-8000-000000000001', '{"cases":[{"input":[],"expect_error_or_null":true},{"input":[-9,-3,-15],"expected":-3},{"input":[2],"expected":2},{"input":[-100,-1,-50],"expected":-1}]}'),
  ('20000000-0000-4000-8000-000000000002', '{"cases":[{"input":["A","B","B","C","A"],"expected":["A","B","C"]},{"input":[],"expected":[]},{"input":["only"],"expected":["only"]},{"input":["X","X","X"],"expected":["X"]}]}'),
  ('20000000-0000-4000-8000-000000000003', '{"cases":[{"input":["x","y","z"],"expected":["X","Y","Z"]},{"input":[],"expected":[]},{"input":["slow","fast"],"expected":["SLOW","FAST"]},{"input":["fail"],"expect_rejection":true}]}'),
  ('20000000-0000-4000-8000-000000000004', '{"cases":[{"email":"a@example.test","same_email":"a@example.test","different_email":"b@example.test","mutate_after_insert":false},{"email":"User@example.test","same_email":"User@example.test","different_email":"user@example.test","mutate_after_insert":false}]}')
on conflict (task_version_id) do update set test_spec=excluded.test_spec, updated_at=now();

insert into public.followup_bank(task_id, version, trigger_json, question_template, expected_key_points, ordinal) values
  ('10000000-0000-4000-8000-000000000001',1,'{"tags":["root_cause_low"]}','Which iteration of the loop never runs, and for which input does that change the result?','["The last index is skipped","The result changes when the maximum is at the final index"]',1),
  ('10000000-0000-4000-8000-000000000001',1,'{"tags":["empty_input"]}','What should findMax return for an empty array, and how does your code handle it?','["Defines empty input behavior","Handles it consistently"]',2),
  ('10000000-0000-4000-8000-000000000001',1,'{"tags":["stretch"]}','Would your fix still work if every number were negative? Why?','["Initializes from the first value","Does not assume zero is a valid maximum"]',3),
  ('10000000-0000-4000-8000-000000000002',1,'{"tags":["root_cause_low"]}','Why does removing an element inside the loop make it skip the next customer?','["Elements shift left after removal","The loop index still increments"]',1),
  ('10000000-0000-4000-8000-000000000002',1,'{"tags":["order_failed"]}','Does your solution preserve original order? How?','["Uses an order-preserving approach","Explains when order matters"]',2),
  ('10000000-0000-4000-8000-000000000002',1,'{"tags":["stretch"]}','Compare the complexity of your fix with repeated removal from an array list.','["Set-based approach is about O(n)","Repeated contains/remove can be O(n squared)"]',3),
  ('10000000-0000-4000-8000-000000000003',1,'{"tags":["root_cause_low"]}','Why does await inside forEach not make the function wait?','["forEach ignores returned promises","The outer function returns before callbacks finish"]',1),
  ('10000000-0000-4000-8000-000000000003',1,'{"tags":["fix_is_sequential"]}','How would you run the calls in parallel, and when might that be a bad idea?','["Promise.all with map","Dependencies or rate limits can make parallel work inappropriate"]',2),
  ('10000000-0000-4000-8000-000000000003',1,'{"tags":["stretch"]}','What happens when one request fails with Promise.all?','["Promise.all rejects on first failure","Can use try/catch or allSettled"]',3),
  ('10000000-0000-4000-8000-000000000004',1,'{"tags":["root_cause_low"]}','Why can map.get fail even when equals returns true?','["HashMap selects a bucket from hashCode","Unequal hashes can prevent equals from being checked"]',1),
  ('10000000-0000-4000-8000-000000000004',1,'{"tags":["explanation_vague"]}','What contract must equals and hashCode follow?','["Equal objects must have equal hash codes"]',2),
  ('10000000-0000-4000-8000-000000000004',1,'{"tags":["stretch"]}','What happens if a key’s fields change after insertion into a map?','["Its hash may change and lookup may fail","Keys should be immutable"]',3)
on conflict (task_id, version, ordinal) do update set trigger_json=excluded.trigger_json, question_template=excluded.question_template, expected_key_points=excluded.expected_key_points;

insert into public.boss_rounds(slug, skill_node_id, version, language, title, flawed_code, flaw_lines, reference_code, alt_reference_code, expected_flaw_key, followup_bank) values
  ('catch-the-ai-mistake',5,1,'JavaScript','Catch the AI’s mistake',
   'function countWords(text) { return text.split(" ").length; }', array[1]::smallint[],
   'function countWords(text) { return text.trim().split(/\\s+/).filter(Boolean).length; }',
   'function countWords(text) { const words = text.trim().match(/\\S+/g); return words ? words.length : 0; }',
   '["Splitting on a single space mishandles repeated, leading, and trailing whitespace","Use input containing multiple spaces or surrounding whitespace"]',
   '[{"trigger":"always","question":"Why does your test fail on the AI’s version but pass on a correct one?","key":["specific wrong behavior","triggering input","passes on correct code"]},{"trigger":"accepted_patch","question":"Which input would you try before trusting this patch?","key":["whitespace edge case"]},{"trigger":"test_is_narrow","question":"Name one more input that would expose this flaw.","key":["another whitespace case"]}]')
on conflict (slug) do update set flawed_code=excluded.flawed_code, flaw_lines=excluded.flaw_lines, reference_code=excluded.reference_code, alt_reference_code=excluded.alt_reference_code, expected_flaw_key=excluded.expected_flaw_key;

insert into public.roles(slug,title,requirements_json) values
  ('junior-java-developer','Junior Java Developer','{"skills":[{"skill":"debugging","language":"Java","minimum_level":"developing","max_age_days":90,"minimum_tasks":2}],"human_decision_required":true}')
on conflict (slug) do update set requirements_json=excluded.requirements_json;
