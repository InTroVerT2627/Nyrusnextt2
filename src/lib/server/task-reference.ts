import "server-only";

export const taskReferences: Record<string, string> = {
  "find-max": "A loop bound excludes the last array index. A maximum at the final position is omitted. Initialize from the first element so all-negative inputs work. Empty input must have a defined result.",
  "remove-duplicates": "Removing from an ArrayList shifts later elements left while the loop increments its index. Consecutive duplicates can be skipped. Use an order-preserving set or another stable algorithm.",
  "async-results": "forEach does not await the promises returned by its async callback. The outer function returns before the callbacks complete. Use map with Promise.all for independent requests and handle rejection.",
  "customer-key": "HashMap selects a bucket from hashCode before it calls equals. Equal keys must have equal hash codes. Key fields should remain immutable while the key is stored.",
};

export const criterionDescriptors = {
  root_cause: ["0: no cause identified", "1: vague symptom only", "2: relevant defect partly described", "3: specific defect and consequence identified"],
  explanation: ["0: no explanation or unrelated", "1: understandable explanation of the debugging reasoning", "2: clear causal explanation and prevention reasoning"],
} as const;
