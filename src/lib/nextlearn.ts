export type FollowUp = { id: string; trigger: string; question: string; keys: string[] };
export type Mission = {
  id: string; title: string; shortTitle: string; severity: string; language: string;
  skill: string; description: string; symptom: string; ticket: string;
  starter: string; expected: string; visible: string[]; hidden: string[];
  questions: FollowUp[]; node: number;
};

export const missions: Mission[] = [
  {
    id: "loop-bounds", title: "Dashboard shows the wrong top seller", shortTitle: "The wrong top seller", severity: "S3 · Low", language: "JavaScript", skill: "Loop bounds", node: 1,
    description: "A weekly sales report leaves out the product that should be leading.", symptom: "The final item in the weekly sales data is never considered.", ticket: "The sales dashboard's top seller changes when the highest value lands at the end of the reporting period. Please investigate the calculation and explain your incident response.",
    starter: "function findMax(values) {\n  let best = values[0];\n  for (let i = 0; i < values.length - 1; i++) {\n    if (values[i] > best) best = values[i];\n  }\n  return best;\n}", expected: "i < values.length", visible: ["ordinary values", "maximum at the last index"], hidden: ["one item", "all negative values", "empty input"],
    questions: [
      { id: "loop-root", trigger: "root_cause_low", question: "Which iteration of the loop never runs, and for which input does that change the result?", keys: ["last", "index", "maximum"] },
      { id: "loop-empty", trigger: "empty_input", question: "What should findMax return for an empty array, and how does your solution handle it?", keys: ["empty", "defined", "handle"] },
      { id: "loop-stretch", trigger: "stretch", question: "Would your fix still work if every number were negative? Why?", keys: ["first", "initial", "zero"] },
    ],
  },
  {
    id: "mutation", title: "Mailing list skips some customers", shortTitle: "Customers go missing", severity: "S3 · Low", language: "Java", skill: "Mutation during iteration", node: 2,
    description: "Duplicate cleanup silently drops valid customer records.", symptom: "Removing from the list shifts elements while the index advances.", ticket: "An operations team reports missing customers after a duplicate cleanup. Please preserve the original order, investigate the incident, and describe a safe fix.",
    starter: "for (int i = 0; i < customers.size(); i++) {\n  if (customers.indexOf(customers.get(i)) < i) {\n    customers.remove(i);\n  }\n}", expected: "LinkedHashSet", visible: ["duplicate records removed", "first-seen order preserved"], hidden: ["adjacent duplicates", "no duplicates", "large input"],
    questions: [
      { id: "mutation-root", trigger: "root_cause_low", question: "Why can removing an element inside this loop make it skip the next customer?", keys: ["shift", "index", "increment"] },
      { id: "mutation-order", trigger: "order_failed", question: "Does your solution preserve the original order? How?", keys: ["order", "preserve", "linkedhashset"] },
      { id: "mutation-stretch", trigger: "stretch", question: "Compare the time complexity of your fix with repeated removal from an array list.", keys: ["n", "linear", "quadratic"] },
    ],
  },
  {
    id: "async-flow", title: "Order summary renders before data arrives", shortTitle: "The early report", severity: "S2 · Medium", language: "JavaScript", skill: "Async flow", node: 3,
    description: "An order summary renders before all of its data has finished loading.", symptom: "The outer function returns before the asynchronous callbacks finish.", ticket: "The order summary occasionally appears incomplete even though all requests eventually succeed. Trace the async flow, fix the aggregation, and note when parallel requests are safe.",
    starter: "async function loadOrders(ids) {\n  const orders = [];\n  ids.forEach(async (id) => {\n    orders.push(await fetchOrder(id));\n  });\n  return orders;\n}", expected: "Promise.all", visible: ["wait for every request", "return every order"], hidden: ["request rejection", "empty input", "stable result"],
    questions: [
      { id: "async-root", trigger: "root_cause_low", question: "Why does await inside forEach fail to make loadOrders wait?", keys: ["forEach", "promise", "return"] },
      { id: "async-parallel", trigger: "fix_is_sequential", question: "How would you run the requests in parallel, and when might that be a bad idea?", keys: ["Promise.all", "map", "limit"] },
      { id: "async-stretch", trigger: "stretch", question: "What happens when one request fails with Promise.all?", keys: ["reject", "catch", "allSettled"] },
    ],
  },
  {
    id: "hashing", title: "Customer cache never gets a hit", shortTitle: "The cache miss", severity: "S1 · High", language: "Java", skill: "Equality and hashing", node: 4,
    description: "A customer lookup misses even when the requested key looks familiar.", symptom: "The key compares equal but hashes to the wrong bucket.", ticket: "Customer records are inserted into a cache but later lookups with an equivalent customer key miss. Inspect the equality contract and propose a stable fix.",
    starter: "final class CustomerKey {\n  private final String email;\n  @Override public boolean equals(Object other) {\n    return other instanceof CustomerKey\n      && email.equals(((CustomerKey) other).email);\n  }\n}", expected: "hashCode", visible: ["equal keys retrieve values", "different emails remain distinct"], hidden: ["many keys", "null safety", "stable key fields"],
    questions: [
      { id: "hash-root", trigger: "root_cause_low", question: "Why can map.get(key) fail even when equals returns true?", keys: ["hash", "bucket", "equals"] },
      { id: "hash-contract", trigger: "explanation_vague", question: "What contract must equals and hashCode follow?", keys: ["equal", "same", "hash"] },
      { id: "hash-stretch", trigger: "stretch", question: "What happens if a key's fields change after it is put in a map?", keys: ["change", "hash", "immutable"] },
    ],
  },
];

export function scoreFollowUp(answer: string, keys: string[]) {
  const normalized = answer.toLowerCase();
  const matched = keys.filter((key) => normalized.includes(key.toLowerCase()));
  return Math.min(2, matched.length);
}

export function selectQuestions(mission: Mission, solution: string, report: string) {
  const source = `${solution}\n${report}`.toLowerCase();
  const flagged = /ignore (the )?(rubric|instructions)|give me full marks|override.*score/.test(source);
  const recognized = source.includes(mission.expected.toLowerCase());
  const keys = mission.questions;
  const selected = recognized
    ? keys.filter((question) => question.trigger === "stretch")
    : keys.filter((question) => question.trigger !== "stretch").slice(0, 2);
  return { selected: selected.slice(0, 3), flagged, recognized };
}

export function getEvidenceState(missionId: string, evidenceIds: string[]) {
  if (evidenceIds.includes(missionId)) return "Evidenced";
  if (evidenceIds.length > 0 && missionId === "mutation") return "Available";
  if (evidenceIds.length > 0 && missionId === "async-flow") return "Available";
  if (missionId === "loop-bounds") return "Available";
  if (missionId === "hashing" && (evidenceIds.includes("mutation") || evidenceIds.includes("async-flow"))) return "Available";
  return "Locked";
}
