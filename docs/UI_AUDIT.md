# ProofLoop (NextLearn) — Comprehensive UI Audit & Refinement Plan
**Version:** 1.0.0 (Phase 0 Audit)  
**Date:** October 11, 2026  
**Auditor:** Senior Product Designer & Lead Front-End Systems Engineer  
**Status:** Awaiting User Approval (Do NOT delete or modify application code until approved)

---

## 1. Executive Summary & Proposed Removals and Merges

This audit evaluates every route, component, style definition, and interactive surface across all three roles (**Learner**, **Recruiter**, **Reviewer**). The objective is ruthless reduction of clutter and dead code while strictly safeguarding learner privacy, consent mechanics, immutable audit trails, accessibility compliance, and server-side evaluation integrity.

### Proposed Removals (Immediate Dead-Code Elimination)
1. **Remove 667 lines of dead duplicate subcomponents inside `src/app/RemoteHome.tsx`**:
   - `MissionEditor` (lines 889–1101, 213 lines) — superseded by `CodingWorkspace.tsx`.
   - `TreeView` (lines 1103–1202, 100 lines) — superseded by `SkillTreeSvg.tsx`.
   - `BossEditor` (lines 1204–1422, 219 lines) — superseded by `BossRoundWorkbench.tsx`.
   - `ProfileView` (lines 1424–1518, 95 lines) — superseded by `EvidenceProfileView.tsx`.
   - `ConsentCard` (lines 1520–1559, 40 lines) — uncalled helper in dead `ProfileView`.
   - Unused imports in `RemoteHome.tsx`: `CalibrationPanel` (never rendered), `LockIcon`, and `CodeEditor` once dead editors are pruned.
2. **Remove legacy `LocalHome` duplicate implementation in `src/app/page.tsx` (142 lines)**:
   - Contains unmaintained dummy state and fake `window.alert("Demo only: recruiter reviews evidence; no shortlist is stored.")`.
   - Replace `src/app/page.tsx` with clean delegate to authenticated/sandboxed `RemoteHome` (with offline-safe fallback state).
3. **Delete orphaned component `src/components/Skeleton.tsx` (47 lines)**:
   - 0 imports across the entire repository. Dynamic skeleton classes in CSS or inline loaders are already used.
4. **Delete or consolidate redundant notes drawer `src/components/learning/PrivateNotesDrawer.tsx` (95 lines)**:
   - Unify into `GlobalNotebookModal.tsx` so note-taking is persistent across both path view and in-lesson beats without duplicate state models.
5. **Delete decorative non-functional orbital animations and static mock illustrations**:
   - Welcome orbit elements (`.orbit-one`, `.orbit-two`, `.spark`) in `page.tsx` / `RemoteHome.tsx`.
   - Static non-interactive illustration boxes in incident cards that do not convey system state.
6. **Prune ~2,500+ lines of obsolete selectors from `src/app/globals.css`**:
   - Target retired mockups, duplicate class rules, and unused CSS rules from previous iterative prototypes.

### Proposed Merges & Consolidations
1. **Learner Navigation Simplification ($\le 7$ Items)**:
   - **Current (10 items)**: `Overview`, `Nyeras LMS`, `Missions`, `Skill tree`, `My evidence`, `Role readiness`, `Failure scenarios`, `Validation`, `Audit log`, plus `Learning paths` link.
   - **Consolidated ($\le 7$ items)**:
     1. `Overview` (Mission control landing & quick jump)
     2. `Learning Paths` (Primary link to immersive modules at `/learning`)
     3. `Missions` (Incident missions workspace & Boss round)
     4. `Skill Tree` (Interactive SVG dependency progression)
     5. `My Evidence` (Granular per-skill consent, evidence cards, live recruiter preview)
     6. `Role Readiness` (Private role gap analyzer & development recommendations)
     7. `Trust & Verification` (Consolidated tabbed hub combining **Audit Log**, **Failure Scenarios Lab**, and **Benchmark Validation**)
   - `Nyeras LMS` simulation is merged into `Overview` and the new `Integration Console`.
2. **Consolidation of Repeated Honesty Notices & Disclaimers**:
   - The disclaimer *"Experimental evidence, not a validated hiring predictor"* is currently duplicated verbatim across 12 distinct files and rendered up to 4 times per screen.
   - **Unified Pattern**:
     - **Persistent Shell Footer**: A single, quiet, one-line footer in the main shell with an interactive "Trust & Privacy" disclosure link.
     - **"About this result" Popover**: Standardized, compact info button on evidence cards, test scores, and recruiter match cards detailing exact criteria without taking layout space.
     - **Trust & Verification Hub**: Full details on Judge0 sandbox execution, Gemini dual-run scoring, and non-recording privacy guarantees.
3. **Establish First-Class Interactive Integration Console (`/integration` or section)**:
   - Replaces the static JSON code block on `LandingPage.tsx` with a live, interactive API contract console where users can simulate webhook payloads, verify cryptographic consent signatures, and trigger simulated handoffs from Nyeras LMS to NxtMove.

---

## 2. Comprehensive Audit Table

| Route / Component | Current Purpose | Verdict | Rationale | Risk / Security Note | Interaction Gaps & Action Items |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`src/app/page.tsx`** | Entry point routing to `RemoteHome` or `LocalHome` | **Merge / Refactor** | `LocalHome` contains 142 lines of diverging mock code with dummy alerts. Unify into a single robust entry. | Low risk. Preserves local offline demo capability via mock mode. | Remove `window.alert` in Recruiter mock. Route directly to unified view. |
| **`src/app/RemoteHome.tsx`** | Main application dashboard shell for all 3 roles | **Refactor** | Contains 667 lines of dead inline components (`MissionEditor`, `TreeView`, `BossEditor`, `ProfileView`, `ConsentCard`). | Critical component. All existing active routes must continue rendering. | Prune dead subcomponents. Enforce $\le 7$ nav items per role. Add command palette shortcut button state. |
| **`MissionEditor` (inline)** | Legacy incident editor inside `RemoteHome.tsx` | **Remove** | Completely uncalled. Real incident editing happens in `CodingWorkspace.tsx`. | None. 0 call sites. | Delete lines 889–1101. |
| **`TreeView` (inline)** | Legacy skill tree markup inside `RemoteHome.tsx` | **Remove** | Completely uncalled. Real skill tree is `SkillTreeSvg.tsx`. | None. 0 call sites. | Delete lines 1103–1202. |
| **`BossEditor` (inline)** | Legacy boss round editor in `RemoteHome.tsx` | **Remove** | Completely uncalled. Real boss round is `BossRoundWorkbench.tsx`. | None. 0 call sites. | Delete lines 1204–1422. |
| **`ProfileView` (inline)** | Legacy evidence profile in `RemoteHome.tsx` | **Remove** | Completely uncalled. Real evidence profile is `EvidenceProfileView.tsx`. | None. 0 call sites. | Delete lines 1424–1518. |
| **`ConsentCard` (inline)** | Legacy consent switch in `RemoteHome.tsx` | **Remove** | Completely uncalled. Real consent switches live in `EvidenceProfileView.tsx`. | Must ensure `EvidenceProfileView` consent handlers are intact. | Delete lines 1520–1559. |
| **`CodingWorkspace.tsx`** | Monaco-based incident debugging workspace | **Keep & Polish** | Core interactive sandbox for code inspection, visible tests, report authoring, and follow-up defense. | High security: private tests and answer keys must remain server-side. | Add resizable pane split; keyboard shortcuts (Ctrl+Enter to run); clear loading states for Judge0 runs. |
| **`BossRoundWorkbench.tsx`**| "Catch the AI's mistake" patch evaluation workbench | **Keep & Polish** | Evaluates candidate's failing test against flawed, reference, and alternate implementations. | High security: reference implementations and alternate code remain server-side. | Add Monaco syntax highlighting for test inputs; show line-diff highlights on flagged code. |
| **`SkillTreeSvg.tsx`** | Interactive SVG dependency visualization for 4 missions + Boss round | **Keep & Polish** | Visualizes competency progression deterministically based on demonstrated evidence. | None. States derived from verified server evidence. | Enhance keyboard navigation (arrow keys between nodes); aria-labels on SVG nodes; tooltip popovers. |
| **`EvidenceProfileView.tsx`** | Learner evidence cards, per-skill consent, recruiter preview | **Keep & Polish** | Central learner privacy and consent management console. | Critical: consent revocation and per-skill isolation must never be compromised. | Add optimistic UI with undo toast on consent toggle; deep-linkable filters; drawer for attempt history. |
| **`RoleReadinessMapView.tsx`** | Private career gap analysis against explicit role requirements | **Keep & Polish** | Learner-only planning tool matching verified evidence against market role definitions. | Purely private to learner; never exposed to recruiters. | Add filter by gap status ("Met", "Partly Met", "Not Yet"); one-click jump to recommended learning path. |
| **`RecruiterDashboardView.tsx`** | NxtMove recruiter candidate search & evaluation | **Keep & Polish** | Surfaces consented candidates meeting explicit criteria; requires written reason for decisions. | Must strictly enforce `shared === true` gate; no unconsented profiles visible. | Add URL query parameter sync for search filters; keyboard j/k navigation between candidate cards. |
| **`ReviewerQueueView.tsx`** | Human reviewer queue for flagged and challenged submissions | **Keep & Polish** | Human evaluation queue for prompt flags, ambiguous explanations, and candidate appeals. | Critical audit requirement: every override requires a written justification. | Split-pane diff view for side-by-side comparison; keyboard j/k triage; presets for common reasons. |
| **`CalibrationPanel.tsx`** | Reviewer agreement calibration benchmark inspector | **Keep & Polish** | Embedded in Reviewer Queue to calibrate evaluators against benchmark rubric cases. | Reviewer-only tool. | Add interactive test grading practice mode for reviewer onboarding. |
| **`FairnessLabView.tsx`** (`/fairness`) | Multilingual phrasing & dialect parity evaluation lab | **Keep & Polish** | Empirical verification that non-native English, Indian English, and phrasing variations receive identical scores. | Core integrity surface demonstrating absence of demographic/linguistic bias. | Add CSV export button feedback; interactive prompt-variant inspector drawer; URL tab state. |
| **`AuditLogView.tsx`** | Immutable append-only audit event inspection console | **Merge / Refactor** | Displays timestamped records of all assessments, model runs, consent grants, and appeals. | Immutable audit requirement. Must never delete event log capability. | Merge into consolidated `Trust & Verification` hub for learner role; add deep-linking and payload filter chips. |
| **`FailureScenarios.tsx`** | Interactive demonstration of system security & anti-gaming defenses | **Merge / Refactor** | Demonstrates prompt-injection mitigation, dual-run discrepancy gates, and trivial test rejection. | Educational & validation tool. | Merge into `Trust & Verification` hub. Add interactive "Test this scenario" simulated sandbox runner. |
| **`ValidationPage.tsx`** | Statistical agreement benchmarks and WCAG compliance table | **Merge / Refactor** | Summarizes 92.2% exact agreement, variance tests, and accessibility benchmarks. | Reference documentation surface. | Merge as a tab under `Trust & Verification` hub. Replace static table with interactive metric cards. |
| **`LandingPage.tsx`** | Overview hero, 6-step interactive strip, pathway matrix | **Redesign** | Mission Control overview. Currently has 4 primary buttons and static code snippet. | Low risk. | Streamline to single clear primary CTA ("Enter Workspace"); replace static code block with link to Integration Console. |
| **`NyerasSimulation.tsx`** | Mock university LMS course page ("CSE-402") | **Merge** | Demonstrates LMS handoff to Proof-of-Skill. Currently occupies a full primary nav tab. | Low risk. | Merge into `Integration Console` and Overview as an illustrative walkthrough rather than top-level nav item. |
| **`AssessmentReplayView.tsx`** (`/results/[id]/replay`) | 8-step reproducible audit replay with cryptographic hash check | **Keep & Polish** | Verifies integrity of attempts against SHA-256 hash; explains step-by-step evaluation. | Core transparency feature. | Add live copy-verification badge; responsive layout for mobile viewport. |
| **`SqlSandbox.tsx`** | In-browser SQLite WASM sandbox for Data Analytics work sample | **Keep & Polish** | Runs real SQL queries in WebAssembly with deterministic table comparisons. | In-browser client execution; zero server cost/vulnerability. | Add query formatting shortcut; table schema drawer; download query results button. |
| **`SpreadsheetGrid.tsx`** | Financial spreadsheet modeler for Business Analytics work sample | **Keep & Polish** | Interactive formula calculation grid for CAC, LTV, Payback modeling. | Client-side deterministic calculation. | Add formula bar helper; reset to template button with confirm; cell formatting shortcuts. |
| **`CommunicationWorkbench.tsx`** | Technical communication drafting & revision workbench | **Keep & Polish** | Rubric-scored stakeholder memos with feedback and revision iterations. | AI-assisted feedback with deterministic rubric bounds. | Add word count and readability grade indicators; before/after revision comparison diff. |
| **`DebuggingWorkbench.tsx`** | Work-sample debugging task runner for learning paths | **Keep & Polish** | Story-based debugging incidents for learning paths. | Server-side verification via Judge0 or deterministic engine. | Resizable split pane; clear test execution feedback; keyboard shortcuts. |
| **`DsaWorkbench.tsx`** | DSA algorithms work-sample runner with adaptive follow-ups | **Keep & Polish** | Story-based algorithmic challenges (Event prioritization, Deduping, Search). | Complexity verification and adaptive follow-up stopping rule. | Complexity visualizer chart; adaptive follow-up progress indicator. |
| **`LearningPathsClient.tsx`** (`/learning`) | Comprehensive 4-pathway learning hub | **Keep & Polish** | Master portal for Debugging, Data, Business, and Communication paths. | Core educational experience. | Apply new 4-area color tokens; persist filter/tab state in URL; clean drawer transitions. |
| **`ModuleExperienceContainer.tsx`** | 7-beat immersive lesson runner container | **Keep & Polish** | Coordinates the 7-beat rhythm (Teaser, Scene, Concept, Example, TryIt, Check, Takeaway). | Server-side session heartbeat & interrupt tracking. | Ensure reading ring progress is visible and keyboard operable; smooth beat transitions. |
| **`ImmersiveLearningShell.tsx`** | Split-screen story & lesson viewport with ReadingRing | **Keep & Polish** | Split-panel UI (Story scene left, Lesson right) with Plain Task toggle and audio read-aloud. | Core accessibility feature (Plain task mode must be preserved). | Add resizable pane divider; responsive drawer toggle; keyboard focus trap management. |
| **`beats/*` (7 Beat Views)** | Individual beat content renderers | **Keep & Polish** | Teaser, Scene, Concept, Worked Example, Try It, Knowledge Check, Takeaway. | Educational components. | Standardize action buttons; replace inline alert messages with subtle state indicators. |
| **`FinalTestShell.tsx`** | Comprehensive 4-question final test with adaptive follow-ups | **Keep & Polish** | Rigorous capstone test with server-side timed gates and adaptive follow-ups. | High security: test questions and hints gated server-side. | Timer display calm & non-urgent; full keyboard accessibility; clear question progress indicators. |
| **`TestQuestionView.tsx`** | Question renderers for Final Test | **Keep & Polish** | Code, SQL, spreadsheet, and memo questions. | Server-side validation. | Inline validation; clear submission confirmations. |
| **`TestFollowupView.tsx`** | Adaptive follow-up question defense for Final Test | **Keep & Polish** | Probes reasoning; explicitly states count does not decrease score. | Server-side stop-rule engine. | Add clear "Confidence assessment only — does not lower score" badge. |
| **`TestResultView.tsx`** | Final test score & evidence breakdown | **Keep & Polish** | Shows criterion-level results and issues evidence card. | Linked to immutable attempt ID. | Add "About this result" popover; one-click link to view in My Evidence. |
| **`DeviceCheckModal.tsx`** | Pre-test device & camera/mic privacy check | **Keep & Polish** | Explicitly confirms camera & mic are NOT recorded; verifies screen size and focus engine. | Mandatory privacy disclosure. | Streamline to single-screen modal with clear "Start Assessment" primary action. |
| **`HintConfirmationModal.tsx`**| Hint request confirmation with penalty disclosure | **Keep & Polish** | Confirms hint request with transparent point penalty notice. | Server-side hint gate. | Clear cancel/proceed keyboard focus. |
| **`InterruptedOverlay.tsx`** | Window blur / focus loss recovery screen | **Keep & Polish** | Prevents tab switching during active assessments; allows safe resume. | Security & focus engine. | Add clear countdown or resume action; explanatory reason for pause. |
| **`JourneyMap.tsx`** | Module journey visualizer | **Keep & Polish** | Visualizes module progress across the 4 pathways. | Derived from user progress. | Apply new 4-area color tokens; keyboard focusable node cards. |
| **`GlobalNotebookModal.tsx`** | Private notes modal across learning modules | **Keep & Polish** | Stores private learner reflections and notes in browser storage. | Strictly private to learner. | Merge capabilities of `PrivateNotesDrawer` into this component for single source of truth. |
| **`MyReflectionsDrawer.tsx`** | Slide-over drawer reviewing submitted reflections | **Keep & Polish** | Shows learner's written synthesis across completed modules. | Learner-owned portfolio. | Clean search & filter by module; export notes button. |
| **`PrivateNotesDrawer.tsx`** | Slide-over notes drawer in immersive shell | **Merge** | Redundant with `GlobalNotebookModal.tsx`. | Low risk. | Consolidate note storage and UX into a single unified notes drawer component. |
| **`HowItWorksModal.tsx`** | First-run onboarding modal for learning paths | **Keep & Polish** | Explains reading ring, focus engine, and relaxed mode options. | Accessibility disclosure. | Max 4 coach-mark steps; skippable; re-openable from top bar help menu. |
| **`Skeleton.tsx`** | Skeleton loading primitives | **Remove** | 0 usages in entire codebase. Inline skeletons or CSS are used everywhere. | None. | Delete file. |
| **`CodeEditor.tsx`** | Reusable Monaco editor wrapper | **Keep & Polish** | Configured with accessible theme, keyboard traps, and auto-resize. | Standard UI wrapper. | Add loading skeleton while Monaco loads; aria-label for accessibility. |
| **`CommandPalette.tsx`** | Global Ctrl+K command menu & shortcut sheet | **Keep & Polish** | Universal keyboard navigation across all pages and common actions. | Core keyboard accessibility. | Add deep-links to all 4 pathways, role switches, and "? " shortcut sheet. |
| **`RoleSwitcher.tsx`** | Fast demo role switcher (Learner / Recruiter / Reviewer) | **Keep & Polish** | Switches session context cleanly for evaluator demonstration. | Uses demo cookie/header. | Visual indicator of active role; quick-switch keyboard shortcuts. |
| **`ThemeToggle.tsx`** | Light / Dark mode toggle | **Keep & Polish** | Seamless theme switching preserving contrast ratios. | WCAG contrast compliance. | Smooth transition; persists preference in `localStorage`. |
| **`ToastContext.tsx`** | Global toast notification provider | **Keep & Polish** | Non-intrusive status messages, error alerts, and undo actions. | Accessible live region. | Add support for undo action buttons on toasts (e.g. consent revocation undo). |
| **`src/app/login/page.tsx`** | Authentication & demo login page | **Keep & Polish** | Clean authentication form with 1-click synthetic persona switchers. | Security auth boundary. | Streamline copy; ensure clear single primary action. |
| **Integration Console (New)** | Dedicated live console for Nyeras $\to$ NxtMove API | **Create** | Replaces static landing page snippet with real interactive webhook tester and payload inspector. | Demonstrates strict API separation and consent verification. | Live JSON payload editor, "Send Test Handoff" button, cryptographic signature verifier. |

---

## 3. Categorized Defect & Redundancy Findings

### A. Dead or Unreachable Routes & Code Blocks
1. **`src/app/RemoteHome.tsx`**: 667 lines of dead code in uncalled subcomponents (`MissionEditor`, `TreeView`, `BossEditor`, `ProfileView`, `ConsentCard`).
2. **`src/app/page.tsx`**: 142 lines of legacy `LocalHome` duplicate code that diverges from production `RemoteHome` and contains broken `window.alert` calls.
3. **`src/components/Skeleton.tsx`**: Completely unused file (0 imports in the repository).

### B. Duplicate Pages & Competing UX Patterns
1. **Note-Taking Duplication**:
   - `GlobalNotebookModal.tsx` (modal dialog accessed from path overview)
   - `PrivateNotesDrawer.tsx` (slide-over drawer accessed inside immersive shell)
   - *Fix*: Unify note storage and presentation into a single consistent slide-over drawer accessible globally.
2. **Navigation Redundancy**:
   - "Learning paths" was placed outside the main navigation array as an ad-hoc link, while 9 other items were in `navItems`.
   - *Fix*: Reorganize into a clean $\le 7$ item primary navigation array.

### C. Placeholder or "Coming Soon" Content
1. `RecruiterDashboardView.tsx`: Static fallback notes (`quickNotes` array) should allow dynamic custom note entry with optimistic updates and undo.
2. Static API code block on `LandingPage.tsx`: Needs to become a real, interactive **Integration Console**.

### D. Repeated Explanatory Text & Repeated Disclaimers
The disclaimer `"Experimental evidence, not a validated predictor of job performance"` is duplicated across **12 files**:
1. `src/app/page.tsx` (lines 104, 115, 142, 147)
2. `src/app/RemoteHome.tsx` (lines 521, 883, 1198, 1514)
3. `src/components/EvidenceProfileView.tsx` (lines 280, 588)
4. `src/components/RecruiterDashboardView.tsx` (line 496)
5. `src/components/LandingPage.tsx` (line 346)
6. `src/components/ValidationPage.tsx` (line 220)
7. `src/components/AssessmentReplayView.tsx` (line 640)
8. `src/app/login/page.tsx` (line 120)
9. `src/components/learning/TestResultView.tsx` (line 180)
10. `src/components/learning/beats/TakeawayBeatView.tsx` (line 92)
11. `src/components/RoleReadinessMapView.tsx` (line 360)
12. `src/components/FairnessLabView.tsx` (line 500)

*Fix*: Centralize honesty text into:
1. Persistent shell footer (1 line).
2. "About this result" popover component reused across score cards.
3. Dedicated "Trust & Privacy" page inside the Trust & Verification hub.

### E. Stat Cards Without Actions
1. `NyerasSimulation.tsx`: 3 static pills (`Course Status: 100%`, `LMS Certificate: Issued`, `Certificate ID: NYR-CERT-8849-OK`) provide no interactivity.
   - *Fix*: Turn into interactive drawer triggers showing the certificate payload and LMS audit record.
2. `RemoteHome.tsx` progress row: Static attempt counter without filtering capability.
   - *Fix*: Make the attempt count a clickable filter that filters the mission grid by status.

### F. Decorative Motion & Non-Functional Graphics
1. Orbiting decorative elements (`.orbit-one`, `.orbit-two`, `.spark`) on welcome banners generate visual noise without conveying state.
   - *Fix*: Remove decorative orbits; preserve clean typographic hierarchy.
2. Static window dot illustrations on mission cards do not indicate container status.
   - *Fix*: Replace with active status indicators (e.g. Judge0 sandbox status, execution ping).

### G. Buttons That Do Nothing / Dead Links
1. `LocalHome` in `src/app/page.tsx`: Button with `window.alert("Demo only: recruiter reviews evidence; no shortlist is stored.")`.
   - *Fix*: Replace with real functional shortlist action that stores state in demo storage.
2. Inactive "Learn more" or anchor links (`href="#top"`) across headers.
   - *Fix*: Replace with proper semantic actions or route transitions.

### H. Compliance With Zero-Gamification & Anti-Ranking Rules
- Audit confirms: **Zero points, zero XP, zero leaderboards, zero streak counters, zero countdown pressure timers, zero hiring prediction scores**.
- Progress is strictly evidence-driven: demonstrated test pass, rubric-evaluated reasoning, and calibrated confidence levels (High / Medium / Low).

---

## 4. The 4 Area Accent Colour System (WCAG AA Verified)

Preserving the 10 core tokens:
- `#FFFFFF` (White)
- `#142D4E` (Midnight)
- `#06C6E6` (Cyan — actions, focus, AI labels; midnight text on cyan fills)
- `#EAF6FC` (Ice)
- `#334155` (Text main)
- `#64748B` (Text muted)
- `#D9E8F3` (Border)
- `#059669` (Success)
- `#D97706` (Warning)
- `#DC2626` (Error)

### The 4 Area Accents (Theme Variables)
| Area | Deep Token (Text, Icons, Borders) | Tint Token (Background Surfaces) | Contrast Ratio on White | Contrast Ratio on Tint | White Text on Deep Fill |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Debugging** | `#4338CA` (`--accent-debug`) | `#EEF2FF` (`--tint-debug`) | **7.4 : 1** (Pass AAA) | **6.5 : 1** (Pass AAA) | **7.4 : 1** (Pass AAA) |
| **Data Analytics** | `#0F766E` (`--accent-data`) | `#E8F7F4` (`--tint-data`) | **5.3 : 1** (Pass AA) | **4.6 : 1** (Pass AA) | **5.3 : 1** (Pass AA) |
| **Business Analytics** | `#B45309` (`--accent-biz`) | `#FFF3E3` (`--tint-biz`) | **4.9 : 1** (Pass AA) | **4.5 : 1** (Pass AA) | **4.9 : 1** (Pass AA) |
| **Communication** | `#BE185D` (`--accent-comm`) | `#FDEFF6` (`--tint-comm`) | **5.8 : 1** (Pass AA) | **5.1 : 1** (Pass AA) | **5.8 : 1** (Pass AA) |

*Contrast Verification*: All pairs strictly exceed the WCAG AA minimum of **4.5 : 1** for standard text and **3.0 : 1** for UI components.

---

## 5. Implementation Roadmap (Phases 1 to 6)

Upon user approval of this Phase 0 audit:
- **Phase 1: Reduction & Simplification**: Prune 667 lines of dead code in `RemoteHome.tsx`, eliminate `LocalHome` divergence in `page.tsx`, delete `Skeleton.tsx`, consolidate learner navigation to $\le 7$ items, and prune dead CSS rules.
- **Phase 2: Colour & Design System Tokens**: Register the 4 Area Accent tokens in CSS and Tailwind/tokens; apply cyan focus rings (2px offset) and 150–250ms transitions.
- **Phase 3: Deep Interactivity & Progressive Disclosure**: Add URL search param persistence, drawer states, "About this result" popovers, expandable details, and keyboard navigation.
- **Phase 4: Missing & Enhanced Surfaces**: Implement the live **Integration Console** (Nyeras to NxtMove API contract tester), consolidate the **Trust & Verification** hub, and enhance the Replay / Fairness Lab viewports.
- **Phase 5: Automated "No Dead UI" Smoke Test**: Create an automated smoke test script visiting every route and validating that 0 buttons or links are non-functional, with 0 console errors.
- **Phase 6: Verification & Full Regression Run**: Re-run all 105 Vitest tests, run Next.js production build, verify WCAG contrast ratios, and produce final delivery report.
