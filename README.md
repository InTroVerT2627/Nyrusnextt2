# Nextlearn

Nextlearn is a debugging and AI-code-review learning product. Learners fix four Java and JavaScript incident missions, explain their reasoning, answer adaptive questions, and build dated evidence cards. A separate boss round asks learners to check an AI-style patch with tests that fail on the flawed implementation and pass on two independent references.

Evidence describes performance on these tasks. It is experimental and is not a validated predictor of job performance or a hiring decision.

## Product flows

- Four versioned missions cover loop bounds, mutation during iteration, asynchronous control flow, and Java equality/hash contracts.
- Visible tests and rubric are shown before submission. Private edge cases and fixed follow-up answer keys stay server-side.
- Java and JavaScript submissions run in Judge0 with per-run CPU, wall-time, memory, process, file-size, and network limits.
- Gemini grades explanations and follow-up answers twice against a fixed JSON rubric. Scores require exact learner-text evidence quotes. Disagreement, injection flags, and provider failures route work to human review.
- Fixed follow-up questions are chosen from task gap tags. Strong, consistent answers can end the question loop early; the number of questions never changes the criterion score.
- Attempts, task/rubric/bank versions, results, AI runs, appeals, reviewer decisions, consent changes, and recruiter views are stored in Supabase and audit logged.
- Each skill has separate sharing consent, off by default. Sharing code and written answers is a separate opt-in. Revoking consent immediately removes the evidence from Nextlearn recruiter search.
- Recruiter search uses an explicit role’s skill, language, level, evidence age, and distinct-task minimum. It surfaces synthetic candidate IDs and requires an explicit human review or shortlist decision.
- Learners can appeal a scored criterion. Reviewers record a reason and either confirm or override the score; revised evidence is appended as a new snapshot.
- An optional NxtMove receiver gets consented evidence through a durable handoff outbox. Full submissions are omitted unless the learner explicitly shares them.

## Local preview

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without `NEXT_PUBLIC_BACKEND_MODE=supabase`, the app uses the browser-only preview and saves synthetic data in local storage. Preview grading uses marker checks and keyword matching; it does not execute code or call AI. Do not use preview results as real skill evidence.

## Authenticated backend setup

1. Create a Supabase project. For local development, install Docker and run:

   ```bash
   npx supabase start
   npx supabase db reset
   ```

   This starts the local Supabase services, applies all migrations, and loads `supabase/seed.sql`. For a hosted project, link it with `npx supabase link --project-ref <project-ref>`, apply migrations with `npx supabase db push`, then run `supabase/seed.sql` once from the Supabase SQL editor.

2. Copy `.env.example` to `.env.local`. Set the Supabase URL, anon key, and server-only service-role key from the project settings. Change:

   ```dotenv
   NEXT_PUBLIC_BACKEND_MODE=supabase
   ```

   Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` or expose it to browser code.

3. Configure providers in `.env.local`:

   ```dotenv
   JUDGE0_BASE_URL=https://ce.judge0.com
   JUDGE0_AUTH_TOKEN=
   GEMINI_API_KEY=
   GEMINI_MODEL=gemini-3.8-flash
   NXTMOVE_API_URL=
   NXTMOVE_API_KEY=
   ```

   Judge0 CE is suitable for development and may be rate limited. Use a private authenticated Judge0 deployment for production. Keep provider keys server-side. Gemini scoring is unavailable until its API key is set; submissions then remain visible for reviewer resolution instead of receiving invented AI scores. NxtMove is optional; when no receiver URL is set, handoffs are recorded as simulated in the outbox.

4. Create a learner through `/login`. New accounts receive the learner role and cannot upgrade their own role. To provision trusted reviewer/recruiter accounts, use the Supabase SQL editor as an administrator:

   ```sql
   update public.profiles
   set role = 'reviewer'
   where id = (select id from auth.users where email = 'reviewer@example.test');

   update public.profiles
   set role = 'recruiter'
   where id = (select id from auth.users where email = 'recruiter@example.test');
   ```

   Replace the sample addresses with the accounts you created. Provision roles only for trusted staff.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BACKEND_MODE` | `local` for the preview; `supabase` for authenticated APIs |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database access for guarded API routes |
| `JUDGE0_BASE_URL` | Judge0 API base URL |
| `JUDGE0_AUTH_TOKEN` | Optional/required token for the chosen Judge0 deployment |
| `GEMINI_API_KEY` | Server-only Gemini grading key |
| `GEMINI_MODEL` | Gemini model ID; defaults to `gemini-3.8-flash` |
| `NXTMOVE_API_URL` | Optional HTTPS receiver for consented profile handoffs |
| `NXTMOVE_API_KEY` | Optional bearer token for the receiver |

## Database and privacy

Migrations are under `supabase/migrations`. They create role-protected profiles, immutable task/rubric/test/question versions, private test suites and grading keys, append-only assessment/evidence/audit records, appeals, reviewer decisions, consent rows, recruiter decisions, rate limits, and the NxtMove outbox. RLS is enabled; API access checks the authenticated user and application role before using the server-side database client.

`supabase/seed.sql` creates the four missions, visible and private test cases, 12 fixed debugging follow-ups, the boss round and its two reference implementations, plus a sample junior Java developer role. New task content should be added as a new version instead of editing a version already used by assessments.

## Commands

```bash
npm run dev
npm run lint
npm run build
```

No external services are bundled. Supabase, Judge0, Gemini, and the optional NxtMove receiver must be configured before the authenticated assessment flow can run end to end.
