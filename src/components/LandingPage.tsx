"use client";

import React, { useState } from "react";
import {
  Terminal,
  FileCheck2,
  HelpCircle,
  Award,
  Lock,
  Search,
  ArrowRight,
  Shield,
  Layers,
  GraduationCap,
  FlaskConical,
  ClipboardCheck,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";

type LandingPageProps = {
  onEnterLearner: () => void;
  onEnterNyeras: () => void;
  onEnterRecruiter: () => void;
  onEnterScenarios: () => void;
  onEnterValidation: () => void;
};

type StepKey = "mission" | "rubric" | "followups" | "evidence" | "consent" | "recruiter";

interface StepInfo {
  key: StepKey;
  number: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
  sampleBadge: string;
  sampleTitle: string;
  sampleDetails: { label: string; value: string }[];
  sampleVisual: string;
}

const STEPS: StepInfo[] = [
  {
    key: "mission",
    number: "01",
    title: "Incident Mission",
    summary: "Debug realistic production code in Monaco with visible acceptance checks.",
    icon: <Terminal size={18} strokeWidth={1.8} />,
    sampleBadge: "Illustrative sample",
    sampleTitle: "Mission #01 · Pagination Off-By-One Bug",
    sampleDetails: [
      { label: "Environment", value: "Judge0 isolated container (Node.js 18)" },
      { label: "Visible checks", value: "3 deterministic tests displayed before coding" },
      { label: "Hidden suite", value: "Edge cases evaluated strictly server-side" },
    ],
    sampleVisual: "function paginate(items, page, size) {\n  // Visible check: page 1, size 10 -> [0..9]\n  const start = (page - 1) * size;\n  return items.slice(start, start + size);\n}",
  },
  {
    key: "rubric",
    number: "02",
    title: "Visible Rubric",
    summary: "Clear scoring criteria and weights visible before a single line is written.",
    icon: <FileCheck2 size={18} strokeWidth={1.8} />,
    sampleBadge: "Illustrative sample",
    sampleTitle: "Evaluation Rubric v1.2",
    sampleDetails: [
      { label: "Fix correctness (35%)", value: "Deterministic visible unit tests" },
      { label: "Edge-case handling (15%)", value: "Private server-side test suite" },
      { label: "Root cause & clarity (30%)", value: "Incident report heading breakdown" },
      { label: "Follow-up defense (20%)", value: "Targeted adaptive reasoning questions" },
    ],
    sampleVisual: "RUBRIC WEIGHTING\n[███████   ] 35% Code tests\n[███       ] 15% Edge cases\n[██████    ] 30% Incident report\n[████      ] 20% Follow-up defense",
  },
  {
    key: "followups",
    number: "03",
    title: "Fixed Follow-ups",
    summary: "Conversational thread probing gaps; count never changes score, only confidence.",
    icon: <HelpCircle size={18} strokeWidth={1.8} />,
    sampleBadge: "Illustrative sample",
    sampleTitle: "Targeted Reasoning Defense",
    sampleDetails: [
      { label: "Triggered because", value: "Report did not explain empty array behavior" },
      { label: "Dual-run Gemini", value: "Scored twice with schema validation" },
      { label: "Language fairness", value: "Content-only scoring; zero grammar/dialect bias" },
    ],
    sampleVisual: "QUESTION: What occurs when `items.length === 0`?\nLEARNER: `slice(0, 0)` safely returns `[]` without throwing.\nRESULT: Pass (+1.0) · High confidence justification",
  },
  {
    key: "evidence",
    number: "04",
    title: "Evidence Card",
    summary: "Granular skills with a 3-step confidence meter. Zero aggregate point rollups.",
    icon: <Award size={18} strokeWidth={1.8} />,
    sampleBadge: "Illustrative sample",
    sampleTitle: "Proof-of-Skill Record · Debugging",
    sampleDetails: [
      { label: "Proficiency", value: "Proficient (Task v1, Rubric v1)" },
      { label: "Confidence meter", value: "High (Judge0 tests passed + dual-run AI aligned)" },
      { label: "Audit trail", value: "Linked to timestamped submission & rubric version" },
    ],
    sampleVisual: "PROFICIENCY: PROFICIENT\nCONFIDENCE: [ HIGH ●●● ]\nEVIDENCE TRAIL: Mission #01 · Oct 10 · 0 Appeals\nSTATUS: Stored privately in learner vault",
  },
  {
    key: "consent",
    number: "05",
    title: "Learner Consent",
    summary: "Off by default, granular per skill, and instantly revocable at any moment.",
    icon: <Lock size={18} strokeWidth={1.8} />,
    sampleBadge: "Illustrative sample",
    sampleTitle: "Consent & Privacy Gateway",
    sampleDetails: [
      { label: "Default status", value: "Strictly Off for all 4 competency tracks" },
      { label: "Per-skill control", value: "Toggle Debugging on while keeping SQL private" },
      { label: "Raw code toggle", value: "Separate consent to share code vs high-level cards" },
    ],
    sampleVisual: "DEBUGGING EVIDENCE   [ TOGGLED ON  ]\nDATA ANALYTICS       [ TOGGLED OFF ]\nINCLUDE RAW CODE     [ TOGGLED OFF ]\nLive Recruiter View: 1 of 4 skills visible",
  },
  {
    key: "recruiter",
    number: "06",
    title: "Recruiter Search",
    summary: "NxtMove talent discovery with transparent 'why surfaced' criteria matching.",
    icon: <Search size={18} strokeWidth={1.8} />,
    sampleBadge: "Illustrative sample",
    sampleTitle: "NxtMove Talent Discovery",
    sampleDetails: [
      { label: "Role matching", value: "Junior Developer · Requires Debugging (Proficient)" },
      { label: "Why surfaced", value: "Candidate consented + meets explicit criteria" },
      { label: "Human decision", value: "Recruiter must submit written reason for shortlist" },
    ],
    sampleVisual: "MATCH: Alex Morgan (cand_0142)\nWHY SURFACED: Consented · Proficient · High Confidence\nACTION: [ Shortlist with reason ] [ Pass ]\nAUDIT: View logged in append-only table",
  },
];

export default function LandingPage({
  onEnterLearner,
  onEnterNyeras,
  onEnterRecruiter,
  onEnterScenarios,
  onEnterValidation,
}: LandingPageProps) {
  const [activeStep, setActiveStep] = useState<StepKey>("mission");

  const currentStep = STEPS.find((s) => s.key === activeStep) || STEPS[0];

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-badge">
          <Shield size={14} strokeWidth={2} />
          <span>MISSION CONTROL FOR SKILLS · NYERAS TO NXTMOVE</span>
        </div>

        <h1 id="hero-title" className="landing-title">
          Mission control for skills.
        </h1>

        <p className="landing-subtitle">
          Prove what you can do through realistic incidents, transparent rubrics, and learner-controlled evidence.
          No gamified streaks or XP — Unlocks follow demonstrated understanding only.
        </p>

        {/* Primary CTA Buttons */}
        <div className="landing-cta-group">
          <button className="cta-primary btn-cyan" onClick={onEnterLearner}>
            <span>Try the demo</span>
            <ArrowRight size={16} strokeWidth={2} />
          </button>
          <button className="cta-secondary" onClick={onEnterRecruiter}>
            <Search size={16} strokeWidth={1.8} />
            <span>Recruiter search preview</span>
          </button>
          <button className="cta-secondary" onClick={onEnterNyeras}>
            <GraduationCap size={16} strokeWidth={1.8} />
            <span>Nyeras handoff simulation</span>
          </button>
          <button className="cta-secondary" onClick={onEnterScenarios}>
            <FlaskConical size={16} strokeWidth={1.8} />
            <span>Failure scenarios lab</span>
          </button>
        </div>
      </section>

      {/* Interactive 6-Step "How It Works" Strip */}
      <section className="landing-strip-section" aria-labelledby="strip-title">
        <div className="section-title-wrap">
          <span className="section-kicker">INTERACTIVE WALKTHROUGH</span>
          <h2 id="strip-title">How Proof-of-Skill Works</h2>
          <p>Tap or hover any step to see an illustrative preview of the sandbox workflow.</p>
        </div>

        {/* 6 Tabs */}
        <div className="strip-tabs" role="tablist" aria-label="Workflow steps">
          {STEPS.map((step) => {
            const isActive = step.key === activeStep;
            return (
              <button
                key={step.key}
                role="tab"
                aria-selected={isActive}
                className={`strip-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveStep(step.key)}
                onMouseEnter={() => setActiveStep(step.key)}
              >
                <div className="strip-tab-top">
                  <span className="strip-tab-number">{step.number}</span>
                  <span className="strip-tab-icon">{step.icon}</span>
                </div>
                <strong className="strip-tab-title">{step.title}</strong>
                <p className="strip-tab-summary">{step.summary}</p>
              </button>
            );
          })}
        </div>

        {/* Interactive Step Preview Card */}
        <div className="strip-preview-card" role="region" aria-live="polite">
          <div className="preview-card-header">
            <div className="preview-card-tags">
              <span className="sample-badge">{currentStep.sampleBadge}</span>
              <span className="step-tag">STEP {currentStep.number} · {currentStep.title.toUpperCase()}</span>
            </div>
            <strong className="preview-card-title">{currentStep.sampleTitle}</strong>
          </div>

          <div className="preview-card-grid">
            <div className="preview-card-details">
              <h4>System Guarantees</h4>
              <dl className="preview-dl">
                {currentStep.sampleDetails.map((detail, idx) => (
                  <div key={idx} className="preview-dl-row">
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="preview-card-code">
              <div className="preview-code-header">
                <span>SIMULATED SYSTEM ARTIFACT</span>
                <span className="preview-code-pill">Deterministic</span>
              </div>
              <pre className="preview-code-block">{currentStep.sampleVisual}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Competency Pathways Matrix */}
      <section className="pathways-showcase" aria-labelledby="paths-title">
        <div className="section-title-wrap">
          <span className="section-kicker">FOUR SPECIALIZED PATHWAYS</span>
          <h2 id="paths-title">Authentic Work Samples Across Roles</h2>
          <p>Every competency pathway includes structured modules and real work-sample tasks producing verifiable evidence cards.</p>
        </div>

        <div className="pathway-cards-grid">
          <div className="pathway-summary-card">
            <div className="pathway-tag debug">FLAGSHIP PATHWAY</div>
            <h3>Production Debugging</h3>
            <p>Monaco editor with Java and JavaScript incidents, 5-node bug type skill tree, and the &quot;Catch the AI&apos;s mistake&quot; boss round.</p>
            <span className="pathway-meta">4 Incidents · 1 Boss Round · Judge0 Execution</span>
          </div>

          <div className="pathway-summary-card">
            <div className="pathway-tag data">WASM SQLITE</div>
            <h3>Data Analytics</h3>
            <p>In-browser SQLite sandbox on seeded tables. Runs deterministic result checks and rubric-scored insight write-ups with follow-ups.</p>
            <span className="pathway-meta">10 Modules · In-Browser SQL · Synthesis Memo</span>
          </div>

          <div className="pathway-summary-card">
            <div className="pathway-tag biz">SPREADSHEET GRID</div>
            <h3>Business Analytics</h3>
            <p>Live spreadsheet grid with real SaaS financial formulas (CAC, LTV, Payback). Deterministic numeric verification and executive memo.</p>
            <span className="pathway-meta">10 Modules · Live Modeling · Strategy Memo</span>
          </div>

          <div className="pathway-summary-card">
            <div className="pathway-tag comm">WORKPLACE WRITING</div>
            <h3>Technical Communication</h3>
            <p>P0 outage escalation, stakeholder status updates, and non-technical translations with rubric scoring and revision loops.</p>
            <span className="pathway-meta">10 Modules · Revise Loop · Follow-Up Bank</span>
          </div>
        </div>
      </section>

      {/* Recruiter Handoff Contract Preview */}
      <section className="handoff-preview" aria-labelledby="handoff-title">
        <div className="handoff-card">
          <div className="handoff-copy">
            <span className="section-kicker">API BOUNDARY</span>
            <h2 id="handoff-title">Nyeras to NxtMove Handoff API Contract</h2>
            <p>
              Strict API boundaries separate the learning LMS (Nyeras) from the recruiter search (NxtMove). Data crosses the boundary only when the learner explicitly toggles consent.
            </p>
            <div className="handoff-ctas">
              <button className="cta-primary small btn-cyan" onClick={onEnterRecruiter}>
                Inspect Recruiter Search
              </button>
              <button className="cta-secondary small" onClick={onEnterValidation}>
                <ClipboardCheck size={14} />
                Validation & Limits
              </button>
            </div>
          </div>
          <div className="handoff-code">
            <div className="code-header">
              <span>POST /api/nxtmove/profiles</span>
              <span className="code-status">CONSENT = TRUE ONLY</span>
            </div>
            <pre>
{`{
  "candidate_id": "cand_0142",
  "skill": "debugging",
  "language": "Java",
  "level": "proficient",
  "confidence": "high",
  "evidence": [
    {
      "evidence_id": "ev_9921",
      "task_id": "customer-key",
      "criteria": { "fix_correctness": 35, "edge_cases": 15, "root_cause": 20, "followup_reasoning": 20 },
      "followups_asked": 2,
      "assessed_at": "2026-10-10T09:30:00Z"
    }
  ],
  "consent": { "shared": true, "scope": "evidence_and_scores" },
  "disclaimer": "Experimental evidence, not a validated hiring predictor."
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Mandatory Disclaimer Footer */}
      <footer className="landing-footer">
        <div className="disclaimer">
          <Shield size={18} strokeWidth={2} />
          <p>
            <strong>Mandatory Disclaimer:</strong> ProofLoop produces experimental task evidence from practical sandboxes. It is not a validated predictor of job performance, does not rank or automatically reject applicants, and never tracks speed or typing telemetry. Sharing with recruiters is off by default and revocable at any time.
          </p>
        </div>
      </footer>
    </div>
  );
}
