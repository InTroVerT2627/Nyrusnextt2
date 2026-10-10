# Nextlearn (ProofLoop) — Engineering & Product Plan

**Source of Truth:** `docs/Part_A_Full_Document_v3.pdf`  
**Context:** Samartha Hackathon — Innovation in Education, Part A: Nyeras / NxtMove Proof-of-Skill Sandbox.  
**Core Mission:** Build a fair, auditable, evidence-linked sandbox where learners demonstrate genuine competence through realistic work samples, defend their reasoning via adaptive follow-up questioning, and retain complete consent over recruiter sharing.

---

## 1. Executive Gap Analysis & Repository Audit

An exhaustive audit of the existing codebase against the 18 sections of `Part_A_Full_Document_v3.pdf` reveals the following findings:

| Category | Document Requirement | Current Repo State | Gap / Action Required |
| :--- | :--- | :--- | :--- |
| **Landing & Experience** | 10-second elevator pitch, clear CTAs, unified shell, calm "mission control" identity | Direct login screen or raw prototype; no public landing page explaining the problem & solution | Build a polished landing page with "Try Demo" CTAs, simulated Nyeras LMS entry, and unified app shell. |
| **Role Switcher** | Instant switching between Learner, Recruiter, and Reviewer for demo without auth barrier | Auth requires active Supabase email/password session; hard to demo multi-persona flow smoothly | Implement zero-friction Demo Role Switcher in header/navigation with pre-seeded synthetic personas. |
| **Editor Experience** | Monaco code editor, visible tests and rubric displayed before starting | Plain `<textarea>` with basic styling; Monaco not integrated | Integrate Monaco Editor (`@monaco-editor/react` or embedded web Monaco) with syntax highlighting and theme integration. |
| **Additional Paths** | Data Analytics, Business Analytics, and Communication paths with work samples | MCQ-only quizzes with 3 multiple-choice questions per module; no evidence generated | Implement real work samples: (1) Data Analytics in-browser WASM SQLite sandbox, (2) Business Analytics spreadsheet model, (3) Communication workplace memo & revision loop. |
| **Boss Round** | 'Catch the AI's mistake' with triple execution (flawed, reference, alternate), line flagging, test authoring | Single JS boss task in database; UI is rudimentary textarea; trivial test protection needs strict client/server guard | Enhance Boss Round UI with interactive line flagging, deterministic test runner, and explicit rejection of trivial `assert false` tests. |
| **Recruiter View** | NxtMove dashboard with role criteria, "Why Surfaced" breakdown, explicit evidence cards | Basic candidate list view; lacks explicit role criteria breakdown, recruiter notes, and audit logging | Build complete mock NxtMove experience matching Section 12 of the spec with full audit logging. |
| **Human Reviewer** | Review queue with low-confidence, appeals, and similarity comparison; calibration panel | Basic review queue exists; lacks anonymized similarity side-by-side diff view and AI vs Human calibration benchmark panel | Build Anonymized Similarity Comparison and Calibration Panel (AI vs Human benchmarks) in reviewer portal. |
| **Demo Scenarios** | 5 scripted failure cases (Prompt Injection, AI Disagreement, Hard-coded Output, No Understanding, Trivial Boss Test) | Mentioned in docs but no dedicated interactive showcase panel | Build a dedicated "Demo Scenarios" interactive laboratory with live execution and audit trail. |
| **Validation Framework** | Validation plan with benchmark table, consistency, fairness checks, and honest limitations | Briefly referenced in copy; no dedicated validation page | Build dedicated Validation page with synthetic benchmarks, disparity checks, and responsible design disclosure. |
| **Verification & Tests** | Unit tests for selector/stop rule/confidence, leak test, RLS test, Playwright E2E | No automated test suite present in repo | Create Vitest/Jest unit tests and Playwright E2E test suite covering security, privacy, and full demo flow. |

---

## 2. Non-Negotiable Guardrails (Compliance Matrix)

1. **No Proxy Gamification**: Absolutely no points, XP, streaks, countdowns, timers, or leaderboards. Unlocks originate strictly from demonstrated understanding.
2. **Deterministic Correctness**: Tests decide code and calculation correctness. Gemini scores reasoning only in two independent runs with Zod schema validation.
3. **Data Privacy & Leak Prevention**: Hidden tests, reference code, flaw lines, and follow-up answer keys must NEVER reach the client. Verified via automated leak test.
4. **Consent-First Architecture**: Consent is OFF by default, managed per-skill, and instantly revocable. Submissions require separate explicit consent. Recruiters only see consented evidence.
5. **Marking Integrity**: The count of follow-up questions never alters a score; it influences confidence level only.
6. **No Style Bias**: Content-only scoring; zero penalties for grammar, accent, dialect, or non-native phrasing.
7. **Append-Only Audit**: Every evaluation, model output, human override, and consent toggle is permanently recorded in `audit_log`.
8. **Disclaimers & Disclosures**: Every profile and recruiter view clearly displays: *"Experimental evidence, not a validated predictor of job performance."*

---

## 3. Implementation Phases & Milestones

### Phase 1: Design System, Landing Page & App Shell
- Calm "mission control" design system: restrained palette (slate/navy/emerald/amber), custom typography stack, zero emojis in UI icons, full light/dark mode support.
- 10-second landing page explaining the bridge between Nyeras learning and NxtMove hiring with "Try the Sandbox Demo" CTA.
- Top bar with instant Role Switcher (Learner: Alex Morgan, Recruiter: Priya Sharma, Reviewer: Dr. Sarah Chen).
- Mock Nyeras course integration page showing the "Prove your skill" handoff.

### Phase 2: Debugging Path, Skill Tree & Boss Round Polish
- Monaco code editor integration with syntax highlighting, indentation, and keyboard navigation.
- Incident Mission view: Severity badge (S1-S3), symptom, acceptance checks, rubric preview, and 4-heading Incident Report template.
- Hero Skill Tree: 5 bug-type nodes with state representation via distinct geometric iconography and text labels (Locked, Available, Attempted, Evidenced).
- Boss Round ('Catch the AI's mistake'): Pre-written AI patch review, line-level fault flagging, test assertion authoring with deterministic triple-run validation (flawed fails, reference passes, alternate passes). Strict rejection of trivial tests.

### Phase 3: Upgrade The Three Learning Paths
- **Data Analytics**: In-browser SQL sandbox using WASM SQLite (`sql.js`), seeded e-commerce database, deterministic result-set validation, insight write-up rubric, and targeted follow-up bank.
- **Business Analytics**: Interactive spreadsheet grid with live financial formula calculations (CAC, LTV, Payback, Churn), deterministic numeric validations, and recommendation memo scoring.
- **Communication**: Workplace scenario sandbox (incident postmortem, client escalation, non-technical translation), rubric scoring, iterative feedback loop, and defence questions.
- Mark all lesson modules as *"draft, needs human review"*.

### Phase 4: Evidence, Profile, Consent & Recruiter Workflow
- Evidence cards displaying proficiency level, confidence, recency, and retry improvement timeline without aggregate scores.
- Granular consent controls: per-skill toggle, revocable, and separate opt-in for raw submission artifacts.
- NxtMove Recruiter view with explicit role criteria matching, "Why Surfaced" evidence rationale, audit-logged views, and human shortlist decisions.
- Formally validated handoff payload contract (`POST /api/nxtmove/profiles`).

### Phase 5: Human Reviewer, Audit Log & Calibration Panel
- Reviewer dashboard with open appeals, low-confidence attempts, and prompt injection flags.
- Anonymized similarity comparison tool showing side-by-side code diffs for flagged submissions.
- Overrides with required written rationale recorded in append-only audit log.
- Calibration Panel: AI vs Human scoring agreement metrics across benchmark submissions.

### Phase 6: Demo Scenarios Panel & Validation Page
- Interactive Demo Scenarios laboratory featuring all 5 scripted failure cases:
  1. Prompt Injection Attempt
  2. AI Disagreement / Ambiguity
  3. Hard-coded Output Shortcut
  4. Working Fix with No Understanding
  5. Boss Round Trivial Test Rejection
- Validation Page detailing the 8 quality measures, benchmark agreement table (labeled synthetic), and honest system limitations.

### Phase 7: Verification, QA & Documentation
- Comprehensive automated test suite:
  - Unit tests: follow-up selector, stop rule, confidence scoring, consent engine.
  - Security & Privacy: leak test for hidden keys/tests, two-user RLS isolation test.
  - Playwright E2E: complete 7-minute demo script path.
- Documentation: Complete `README.md` with environment variables, 7-minute demo script, Mermaid architecture diagrams, and known limitations.

---

## 4. Risk Mitigation Matrix

| Identified Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Judge0 Rate Limit / Network Flake** | Assessment fails to execute code | Local client-side execution fallback with deterministic runner and clear sandbox state labeling. |
| **Gemini JSON Parsing / Model Timeout** | Reasoning grading stalled | Strict Zod validation, automatic single retry, graceful degradation to "Pending Human Review" queue. |
| **Client-Side Secret Leaks** | Security breach & compromised grading integrity | Automated test ensuring server-side isolation of private test suites and follow-up answer keys. |
| **Browser Compatibility (WASM SQLite)** | Data analytics sandbox failure | Dynamic import of sql.js with pre-bundled wasm asset and resilient error boundary. |
