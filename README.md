# ProofLoop

ProofLoop is a proof-of-skill sandbox for debugging in Java and JavaScript. Learners solve realistic incident missions, explain their reasoning, and build evidence cards they choose whether to share.

The product is experimental. Evidence describes performance on these tasks; it is not a validated predictor of job performance or a hiring decision.

## Current scope

This first project foundation establishes the learner mission hub and the visual language for the prototype. The initial screen includes four incident missions, a visible assessment rubric, a skill-path preview, and learner-controlled sharing language.

The prototype follows the supplied Part A brief:

- Four debugging missions: loop bounds, mutation during iteration, asynchronous flow, and equality/hashing.
- Deterministic tests decide code correctness. Rubric-guided AI feedback is reserved for reasoning and follow-up answers.
- Follow-up questions come from a fixed, versioned bank and are selected from explicit result gaps.
- Evidence is shown by criterion, with confidence, recency, and task history rather than one overall score.
- Recruiter access is consent-gated. Appeals, human review, and an audit trail are part of the planned flow.
- No points, streaks, timers, leaderboards, or ranking by speed.

## Run locally

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Planned build sequence

1. Project shell, mission hub, rubric, and accessible learner navigation.
2. Task definitions, deterministic visible/hidden test runner, and submissions.
3. Fixed follow-up bank, gap-based selector, reasoning feedback, and confidence rules.
4. Evidence history, retry, challenge, reviewer queue, and audit log.
5. Per-skill sharing consent and simulated Nyeras-to-NxtMove recruiter flow.
6. Skill tree, one boss review mission, and scripted failure demonstrations.

The first release uses synthetic learner and role data. Real platform integration and real hiring prediction are out of scope.
