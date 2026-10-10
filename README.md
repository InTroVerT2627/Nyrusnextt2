# Nextlearn

Nextlearn is a proof-of-skill sandbox prototype for debugging in Java and JavaScript. Learners work through incident missions, explain their reasoning, answer fixed follow-up questions, and build evidence cards they choose whether to share.

Evidence in this prototype describes performance on these tasks; it is not a validated predictor of job performance or a hiring decision.

## Included in this prototype

- Four incident missions for loop bounds, mutation during iteration, async flow, and equality/hashing.
- A visible criterion rubric and four-part incident report.
- A fixed, versioned follow-up bank with deterministic question selection.
- Local attempt history, learner-controlled sharing, a synthetic recruiter preview, a review queue, and an audit log.
- Evidence-linked skill tree and a boss-round simulation for reviewing a flawed AI-style patch.
- A prompt-manipulation flag, retry path, and human challenge flow.

## Run locally

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Prototype boundaries

This repository runs as a browser-side demo and stores synthetic learner state in local storage. It does not connect to Supabase, Gemini, Judge0, Nyeras, or NxtMove. Mission checks look for expected code markers; they do not compile or execute Java/JavaScript and must not be presented as real assessment results. Follow-up scoring is a local keyword simulation, not AI grading. The recruiter and reviewer screens are synthetic previews, not live services.

The demo has no authentication or server-side protection, so it must not be used to store real learner data or hidden answer keys. Sharing defaults to off. Clear this browser's `nextlearn.demo.v1` local-storage entry to reset the demo.

## Build sequence

1. Product shell and visible mission/rubric foundation.
2. Four task definitions and the fixed adaptive follow-up bank.
3. Interactive learner workspace, local checks, questions, and attempt history.
4. Evidence profile, consent, recruiter/reviewer previews, appeals, and audit view.
5. Evidence-linked skill tree and AI-patch boss-round simulation.

Production integrations, secure server-side grading, authenticated roles, real code execution, and deployment are follow-on work.
