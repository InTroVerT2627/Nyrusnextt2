# NextLearn "Mission Control for Skills" Redesign Plan

## 1. Project Audit

### Framework & Architecture
- **Framework**: Next.js 16.4.0 (App Router), React 19.1.0, TypeScript 5.8.0.
- **Styling Architecture**: Pure CSS custom properties (`src/app/globals.css`) structured with semantic tokens. No Tailwind installed. We maintain and standardize on CSS variables for zero-runtime styling overhead and strict token discipline.
- **Icon Library**: `lucide-react` (installed in Phase 0). Replaces inconsistent SVGs and removes all emoji icons, guaranteeing uniform stroke width (1.75px) and sizing (16px, 18px, 20px, 24px).
- **Core Components & Code Execution**:
  - `@monaco-editor/react` (v4.7.0) for the mission code editor.
  - `sql.js` (v1.14.2) for in-browser WASM SQLite sandboxing in Data Analytics.
  - Supabase SSR & client for authentication and RLS persistence.
  - Server endpoints for Judge0 code execution and Gemini dual-run reasoning evaluation.

### Key Routes
- `/`: Primary application gateway. Serves `RemoteHome` (when `NEXT_PUBLIC_BACKEND_MODE=supabase`) or `LocalHome` (simulation fallback). Contains the multi-persona experience: Learner, Recruiter, Reviewer, Nyeras Simulation, Failure Scenarios, Validation.
- `/learning`: Learning Paths client (`LearningPathsClient.tsx`) for Data Analytics, Business Analytics, and Workplace Communication with embedded interactive work samples.
- `/login`: Clean authentication screen for synthetic personas (`cand_0142`, `cand_0981`, `rec_priya`, `rev_sarah`).
- `/auth/callback`: OAuth / Supabase session hydration callback.

---

## 2. Design System & Palette Tokens

### Exact Colour Tokens
Strict adherence to the 10 defined tokens. Zero external hues, zero purple gradients, zero rainbow charts.
```css
:root {
  --white: #FFFFFF;
  --midnight: #142D4E;
  --cyan: #06C6E6;
  --ice: #EAF6FC;
  --text: #334155;
  --muted: #64748B;
  --border: #D9E8F3;
  --success: #059669;
  --warning: #D97706;
  --error: #DC2626;

  /* Opacity tints & semantic aliases */
  --cyan-subtle: rgba(6, 198, 230, 0.08);
  --cyan-border: rgba(6, 198, 230, 0.25);
  --midnight-subtle: rgba(20, 45, 78, 0.04);
  --midnight-elevated: #1C3D68;
  --ice-alt: #F4FAFD;
  --success-subtle: rgba(5, 150, 105, 0.08);
  --warning-subtle: rgba(217, 119, 6, 0.08);
  --error-subtle: rgba(220, 38, 38, 0.08);
}
```

### Contrast & Accessibility (WCAG 2.1 AA)
- **Small Text**: Midnight text (`--midnight` #142D4E) or slate text (`--text` #334155) on white canvas (`--white`) provides > 10:1 contrast ratio (exceeds 4.5:1 requirement).
- **Cyan Rules**: Never use cyan text on white or ice backgrounds (fails AA). Cyan is strictly reserved for:
  - Fills with `--midnight` text (e.g. primary action buttons, active pills).
  - Borders, focus rings (`0 0 0 2px var(--white), 0 0 0 4px var(--cyan)`), node status accents, and icons on dark midnight headers.
- **Touch Targets**: Minimum 44px x 44px on all interactive controls.
- **Motion Reduction**: `@media (prefers-reduced-motion: reduce)` disables transforms, transitions, and SVG unlock animations, ensuring immediate state transitions.

### Typography
- **Display & UI Font**: `Plus Jakarta Sans` via Google Fonts / `next/font/google` for clean modern geometry.
- **Code Font**: `JetBrains Mono` for Monaco editor, diffs, SQL queries, and code tokens.
- **Scale**: Defined scale from 11px (micro tags) to 36px (landing headlines), with line-heights calibrated for readability.

---

## 3. Interaction & Motion System

1. **Micro-interactions**: Hover lifts limited to max 2px (`transform: translateY(-1.5px)`), active press depressions (`translateY(0)`), standard 180ms ease-out transitions.
2. **Focus Management**: Distinct cyan focus ring (`:focus-visible`) across all buttons, inputs, links, and SVG node elements.
3. **Command Palette (`Ctrl+K` / `Cmd+K`)**:
   - Zero-dependency modal accessible from anywhere.
   - Quick jumps to: Incident Missions, Interactive Skill Tree, Evidence Profile, Consent Centre, Learning Paths, Recruiter Search, Reviewer Queue, Audit Log, Failure Scenarios, Validation Page.
   - Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
   - Shortcut help sheet toggled via `?` key.
4. **Toast Notification System**:
   - Non-intrusive bottom-right toasts for draft autosaves, incident submissions, consent updates, and review approvals.
5. **No Gamification Guarantee**:
   - Strictly no XP, no points, no streaks, no countdown timers, no leaderboards, no fireworks/confetti.

---

## 4. Implementation Plan by Phase

### Phase 1: Tokens, Typography, Base Components, and App Shell
- Standardize CSS custom properties in `src/app/globals.css`.
- Configure Google Fonts in `src/app/layout.tsx`.
- Create base reusable components:
  - `src/components/CommandPalette.tsx` (accessible Ctrl+K modal + `?` shortcut sheet).
  - `src/components/Toast.tsx` & `ToastContext.tsx`.
  - `src/components/Skeleton.tsx` for calm content loading states.
- Re-architect App Shell:
  - Midnight navigation sidebar with crisp Lucide icons, role indicators, and collapse/expand controls.
  - Sticky topbar with clean breadcrumbs, role switcher pill, and keyboard shortcut indicators.

### Phase 2: Landing Page and Auth Redesign
- Redesign `src/components/LandingPage.tsx`:
  - 10-second value proposition hero ("Mission control for skills").
  - "Try the demo" CTA that immediately logs in or navigates to the learner dashboard.
  - Interactive 6-step "How it works" strip (Incident Task -> Visible Rubric -> Fixed Follow-ups -> Evidence Card -> Revocable Consent -> Recruiter Search) with illustrative previews.
  - Clear mandatory disclaimer: *"Experimental task evidence only. Not a validated hiring predictor. No automated shortlisting."*
- Redesign `src/app/login/page.tsx`:
  - Instant one-click persona switcher (Alex Morgan: Learner, Sarah Chen: Reviewer, Priya Patel: Recruiter, Jordan Lee: New Learner).

### Phase 3: Learner Dashboard, Skill Tree, Coding Workspace, and Boss Round
- **Skill Tree (`SkillTreeSvg.tsx`)**:
  - Interactive SVG canvas with zoom (+ / - / reset) and pan controls.
  - Fully accessible node items (keyboard navigable with Tab and Enter).
  - States represented with **icon + text**: Locked, Available, Attempted, Fix works but reasoning not shown, Evidenced, Evidenced (>90d).
  - Node side inspection card on hover/focus displaying prerequisites, rubric summary, latest evidence status, and "Start mission" CTA.
  - Calm unlock pulse animation (respecting prefers-reduced-motion).
- **3-Pane Resizable Coding Workspace**:
  - Left pane: Incident ticket with Story / Plain Task toggle, rubric criteria list.
  - Center pane: Monaco editor with midnight-adapted theme (`#142D4E` background with syntax colors derived from the palette).
  - Right pane: Tabbed inspection for Visible Tests ("Verified by tests"), AI Feedback ("AI-assisted, experimental"), and Conversational Follow-up questions.
  - AI-use disclosure checkbox before submission.
  - Horizontal drag dividers to resize panes with state remembered in localStorage.
- **Follow-up Questions Thread**:
  - Conversational 1-by-1 card layout explaining the exact reason why the question was asked (e.g., *"Because your explanation didn't mention the loop bound"*).
  - Zero question counters (no "Question 1 of 3" pressure).
- **Boss Round ("Catch the AI's Mistake")**:
  - Side-by-side diff of AI patch vs expected logic.
  - Interactive line flagging (click lines to flag flaws).
  - Test harness runner with 3-step deterministic execution pipeline (Flawed patch -> Reference variant -> Alternate variant).

### Phase 4: Evidence Profile, Consent Centre, and Learning Paths
- **Evidence Profile**:
  - Individual evidence cards (no aggregate composite scores).
  - 3-step confidence meter (High / Medium / Low) with informative tooltip explaining derivation.
  - Recency chips and expandable audit trails (task, rubric version, criterion scores, date).
  - Improvement timeline chart displaying progression across retries.
- **Consent Centre**:
  - Granular per-skill toggles (Debugging, Data Analytics, Business Analytics, Workplace Communication).
  - Separate toggle for "Include raw code/memo submissions".
  - Live "What a recruiter will see" preview pane updating instantly upon toggle.
- **Learning Paths Polish**:
  - Consistent mission-control cards for the 10 modules across Data Analytics, Business Analytics, Workplace Communication.
  - Embedded work samples (WASM SQLite query editor, SaaS spreadsheet grid, P0 outage communication editor).

### Phase 5: Recruiter Dashboard, Reviewer Queue, and Audit Log
- **Recruiter View (`rec_priya`)**:
  - Explicit role requirements filter chips.
  - "Why surfaced" explainability cards showing exact criteria matched.
  - Consented evidence only (respects learner's revocable toggle in real-time).
  - Human shortlist decision buttons (Shortlist / Pass) with required rationale.
- **Reviewer Queue (`rev_sarah`)**:
  - Filter by flags, low confidence, and learner appeals.
  - Split diff view comparing candidate submission with closest neighbor.
  - Override dialog requiring written justification.
  - Calibration panel comparing AI reasoning scores with human expert baseline.
- **Audit Log**:
  - Filterable append-only timeline by actor, action type, and date.
  - Expandable metadata inspector for every event.

### Phase 6: Polish Pass, Accessibility Audit & Verification
- WCAG 2.1 AA automated and manual verification.
- Screen reader ARIA announcements (`aria-live`, `aria-expanded`, `role="status"`).
- Test suite execution (`npm test` — all suites passing).
- Production build validation (`npm run build`).

---

## 5. Verification Checklist
- [ ] Exact 10 colour tokens defined in `:root` and used consistently.
- [ ] No emoji icons anywhere; Lucide icons used exclusively.
- [ ] No gamification mechanisms present.
- [ ] Command palette (`Ctrl+K`) and Help sheet (`?`) functional.
- [ ] 3-pane coding workspace resizable and layout persisted.
- [ ] Skill tree SVG graph supports pan, zoom, and keyboard navigation with icon+text states.
- [ ] Tests and AI feedback visually distinguished.
- [ ] 39 unit/integration tests continue to pass.
