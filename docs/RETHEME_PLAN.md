# ProofLoop (NextLearn) — "Mint & Lime" Design System Re-Theme Plan
**Version:** 2.0.0  
**Date:** October 11, 2026  
**Role:** Senior Product Designer & Lead Front-End Systems Engineer  
**Status:** Approved for Phased Execution

---

## 1. Executive Summary

This plan outlines the complete replacement of the former palette (`#FFFFFF` canvas, `#142D4E` midnight, `#06C6E6` cyan, `#EAF6FC` ice, `#334155` slate) with a fresh, friendly, high-energy **Mint and Lime** visual identity. 

The aesthetic is inspired by modern, consumer-grade educational tools:
- **Bright Spring-Mint Canvas** (`#3EC17B`) for app layout background and hero bands.
- **Pale Lime Cards** (`#DFF9A2` / `#EFFCCF`) with soft $20\text{--}28\text{px}$ corner radii and flat color block depth.
- **Deep Forest Dark Accents** (`#0F3D2A`) for sidebars, primary actions, and code surfaces.
- **Dark Ink Typography** (`#13261C` on mint; `#35423C` on lime/paper) with guaranteed WCAG 2.1 AA contrast ratios ($\ge 5.0:1$).
- **Pill Tabs with Count Badges** embedded in `--mint-deep` containers.
- **Chunky List Rows** featuring area-tinted illustrated icon tiles, bold headings, and calm metadata chips.
- **Long-Reading Sanctuaries**: Learning modules, tables, diffs, and audit logs use `--paper` (`#F7FDE8`) or `--white` (`#FFFFFF`) surfaces under a mint header band to prevent visual fatigue.

> [!IMPORTANT]
> **Strict Non-Gamification Contract**: This project **strictly forbids** weekly streaks, XP, points, leaderboards, rank numbers, percent match scores, or artificial urgency countdowns. Progress is strictly evidence-driven through deterministic test verification, rubric-evaluated reasoning, and 3-step confidence calibration (High / Medium / Low).

---

## 2. Token Architecture: Old to New Mapping

All hardcoded hex codes across CSS and components are retired and replaced with centralized CSS custom properties in `:root` and `globals.css`.

### A. Surface Tokens
| Old Token | Old Hex | New Token | New Hex | Role & Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `--white` (canvas) | `#FFFFFF` | `--mint` | `#3EC17B` | Main application viewport canvas & hero bands |
| `--ice` | `#EAF6FC` | `--lime` | `#DFF9A2` | Primary card surfaces (large $20\text{--}28\text{px}$ radius) |
| `--ice-subtle` | `rgba(234,246,252,0.6)` | `--lime-light` | `#EFFCCF` | Raised/hover card surfaces, popovers, form controls |
| `--cyan-12` | `rgba(6,198,230,0.12)` | `--lime-mid` | `#BBE698` | Pressed states, active pill indicator, subtle highlights |
| *(new)* | — | `--paper` | `#F7FDE8` | Long-reading background (modules, diffs, tables) |
| `--white` (modal) | `#FFFFFF` | `--white` | `#FFFFFF` | Modals, text inputs, code-adjacent panels |
| `--midnight` | `#142D4E` | `--forest` | `#0F3D2A` | Sidebar rail, primary buttons, editor canvas |
| `--border` | `#D9E8F3` | `--mint-deep` | `#31945E` | Inactive tab containers, tracks, input borders ($3.4:1$) |

### B. Typography & Text Tokens
| Old Token | Old Hex | New Token | New Hex | Verified Contrast Ratio | Rules of Use |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--text-highlight` | `#142D4E` | `--ink` | `#13261C` | **6.90 : 1** on Mint | Headings and text rendered on `--mint` |
| `--text` | `#334155` | `--ink-soft` | `#35423C` | **9.12 : 1** on Lime<br>**10.11 : 1** on Paper<br>**10.52 : 1** on White | Body copy on Lime, Lime-Light, Paper, White |
| `--muted` | `#64748B` | `--muted` | `#4B6355` | **5.66 : 1** on Lime<br>**6.27 : 1** on Paper<br>**6.53 : 1** on White | Secondary metadata. **Never used on Mint.** |
| `--text-inverse` | `#FFFFFF` | `--on-forest` | `#DFF9A2` | **10.58 : 1** on Forest | Sidebar text, active pill label, badges on Forest |

### C. Status Tokens (Must Pair with Text + Icon)
| Status | Token | Hex | Text Contrast on White | Symbol Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `--success` | `#0B7A43` | **6.54 : 1** (Pass AA) | Check icon (`CheckCircle2` / `CheckIcon`) + explicit label |
| **Warning** | `--warning` | `#9A5B00` | **5.60 : 1** (Pass AA) | Alert triangle (`AlertTriangle`) + explicit label |
| **Error** | `--error` | `#B42318` | **6.75 : 1** (Pass AA) | Alert circle (`AlertCircle`) + explicit label |
| **Info** | `--info` | `#0B6E8A` | **5.90 : 1** (Pass AA) | Info shield (`Shield` / `Info`) + explicit label |

### D. Area Competency Accents
| Area | Deep Token (Text, Icons, Fills) | Tint Token (Card Backgrounds) | Text on White | Text on Lime | White on Deep Fill |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Debugging** | `--accent-debug` (`#6D28D9`) | `--tint-debug` (`#EBE2FF`) | **7.10 : 1** | **6.16 : 1** | **7.10 : 1** |
| **Data Analytics** | `--accent-data` (`#1D4ED8`) | `--tint-data` (`#DBE7FF`) | **6.70 : 1** | **5.81 : 1** | **6.70 : 1** |
| **Business Analytics** | `--accent-biz` (`#A3470A`) | `--tint-biz` (`#FFE6C7`) | **6.06 : 1** | **5.26 : 1** | **6.06 : 1** |
| **Communication** | `--accent-comm` (`#BE185D`) | `--tint-comm` (`#FFDCEB`) | **6.04 : 1** | **5.24 : 1** | **6.04 : 1** |

---

## 3. Strict WCAG 2.1 AA Contrast Rules

1. **The Mint Canvas Invariant**:
   - `White (#FFFFFF)` on `Mint (#3EC17B)` has a contrast ratio of only **2.30 : 1** (Fails WCAG AA).
   - **Mandatory Rule**: **NEVER put white or lime text directly on `--mint`.** All text on mint surfaces must use `--ink` (`#13261C`, **6.90:1**) or `--forest` (`#0F3D2A`, **8.02:1**).
2. **Text Hierarchy on Lime & Paper**:
   - Primary headings & body: `--ink-soft` (`#35423C`, $>9.1:1$).
   - Captions & secondary tags: `--muted` (`#4B6355`, $>5.6:1$).
3. **Control Outlines & Non-Text Boundaries**:
   - Form inputs, segmented track containers, and progress bars must use `--mint-deep` (`#31945E`, $3.4:1$ on Lime/Paper) meeting the WCAG non-text contrast requirement of $\ge 3.0:1$.
4. **Universal Focus Ring**:
   - `3px solid var(--forest)` with a `2px offset in var(--lime-light)` ensures high visibility whether a control sits on mint, lime, or paper.

---

## 4. Component Inventory & Look-and-Feel Transformation

### 1. App Shell (`RemoteHome.tsx`)
- **Canvas**: Full-viewport spring mint (`--mint`) background.
- **Sidebar (`.rail`)**: Solid `--forest` (`#0F3D2A`) with `--on-forest` (`#DFF9A2`) icons and labels.
- **Active Navigation Pill**: Distinctive `--lime` pill with dark `--forest` text and an area-colored dot.
- **Topbar**: Clean breadcrumbs with quick jump Command Palette trigger styled in `--forest` with a `--lime` badge.

### 2. Evidence Shelves (`EvidenceProfileView.tsx`)
- **Pill Tabs Container**: `--mint-deep` pill track containing pills for `All (8)`, `Debugging (4)`, `Data Analytics (2)`, `Business Analytics (1)`, `Communication (1)`.
- **Selected Pill**: Floating `--lime-light` pill with `--ink` text.
- **Evidence Cards**:
  - Big $24\text{px}$ rounded cards on `--lime`.
  - Left tile: Square rounded tile tinted in the area's tint (`--tint-debug`, etc.) with deep area icon.
  - Middle: Bold title in `--ink`, task date and metadata in `--muted`.
  - Right: Level chip (`Proficient`), confidence chip (`High` with 3-dot meter), and quiet recency badge.
  - Zero aggregate scores or XP rollups.

### 3. Skill Tree (`SkillTreeSvg.tsx`)
- Connectors rendered in `--mint-deep`.
- Nodes styled as chunky rounded badges with area accent outlines.
- States signaled by **Icon + Text + Shape** (never color alone):
  - Evidenced: Check icon + solid lime fill + double border.
  - Available: Play icon + white fill + solid mint-deep border.
  - Locked: Lock icon + subtle muted fill + dashed border.

### 4. Incident Missions & Workspaces (`CodingWorkspace.tsx`, `BossRoundWorkbench.tsx`)
- **Ticket / Specification Panel**: Rendered on `--lime-light` with `--ink-soft` typography.
- **Editor Canvas**: Deep `--forest` base with syntax highlighting mapped to lime-light, mint, and white tokens.
- **Deterministic Test Results**: Clearly segregated in distinct green check tiles (`--success`).
- **AI-Assisted Labels**: Displayed in `--forest` text on a `--lime-mid` chip: `[Sparkles] AI-assisted, experimental`.

### 5. Learning Modules (`LearningPathsClient.tsx`, `ImmersiveLearningShell.tsx`, `beats/*`)
- Split-screen layout:
  - **Left Story Panel**: Deep `--forest` background with `--on-forest` typography and SVG scene illustrations.
  - **Right Learning Panel**: Clean `--paper` (`#F7FDE8`) background to ensure comfortable long-form reading without eye fatigue.
  - **Reading Ring**: Track in `--mint-deep`, active fill in `--forest`.

### 6. Recruiter Search & Reviewer Queue (`RecruiterDashboardView.tsx`, `ReviewerQueueView.tsx`)
- Role criteria cards on `--lime`.
- Consented candidate rows with "Why Surfaced" criteria on `--lime-light`.
- Reviewer diffs: Side-by-side inspection on `--paper` with crisp forest text and clear override rationale presets.

---

## 5. Phased Implementation Roadmap

- [x] **Phase 0: Inspection & Retheme Plan**:
  - Formulate token mapping, verify contrast mathematics, audit components and tests.
- [x] **Phase 1: Token Engine & Accessibility Test Update**:
  - Update `:root` and `globals.css` with the 16 Mint & Lime custom properties.
  - Write automated contrast verification script (`scripts/verify-contrast.js`).
  - Update `tests/accessibility.test.ts` to assert the new token palette.
- [x] **Phase 2: Base Components & Application Shell**:
  - Update buttons, pills, cards, inputs, selects, dialogs, toasts, and tooltips.
  - Apply the mint canvas, forest sidebar, lime active pills, and topbar styling.
- [x] **Phase 3: Learner Experience & Core Workspaces**:
  - Retheme Evidence shelves, Skill tree SVG, Coding workspace, and Learning path beats.
- [x] **Phase 4: Recruiter, Reviewer & Trust Hub**:
  - Retheme candidate search, reviewer queue, Fairness Lab matrix, and immutable Audit Log.
- [x] **Phase 5: Landing Page, Auth & Empty States**:
  - Transform landing hero into bright mint canvas with chunky lime walkthrough cards.
  - Modernize `/login` persona selector.
- [x] **Phase 6: Quality Gates, Responsive Sweeps & Verification**:
  - Run lint, typecheck, build, 105 Vitest tests, dead-link smoke test.
  - Capture multi-viewport screenshots ($360\text{px}$, $768\text{px}$, $1024\text{px}$, $1440\text{px}$) and verify color-blind accessibility.

---

## 6. Risk Analysis & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **White-on-Mint Contrast Drop** | Low readability / WCAG AA failure | Strictly enforce `--ink` or `--forest` on all mint canvas elements. |
| **Visual Fatigue from Green Saturation** | Eye strain during long sessions | Use `--paper` (`#F7FDE8`) and `--white` for dense reading surfaces, code editors, and tables. |
| **Test Regressions on Color Names** | Broken CI quality gates | Update `accessibility.test.ts` to assert the new 16 tokens and verify luminance ratios. |
| **Gamification Leakage** | Project rule violation | Zero points, streaks, or countdowns; preserve evidence-only unlock gating. |
