"use client";

import React from "react";
import {
  MissionIcon,
  TreeIcon,
  EvidenceIcon,
  RecruiterIcon,
  ReviewIcon,
  LabIcon,
  ValidationIcon,
  ArrowRightIcon,
  ShieldIcon,
  CheckIcon,
} from "@/components/Icons";

type LandingPageProps = {
  onEnterLearner: () => void;
  onEnterNyeras: () => void;
  onEnterRecruiter: () => void;
  onEnterScenarios: () => void;
  onEnterValidation: () => void;
};

export default function LandingPage({
  onEnterLearner,
  onEnterNyeras,
  onEnterRecruiter,
  onEnterScenarios,
  onEnterValidation,
}: LandingPageProps) {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-badge">
          <ShieldIcon size={14} />
          <span>SAMARTHA HACKATHON · INNOVATION IN EDUCATION · PART A</span>
        </div>
        <h1 id="hero-title" className="landing-title">
          Proof of skill, not proof of course completion.
        </h1>
        <p className="landing-subtitle">
          Online courses distribute certificates at scale, but completion does not prove a learner can debug production code or analyze data.
          <strong> ProofLoop</strong> bridges Nyeras learning to NxtMove employability through realistic incident sandboxes, adaptive reasoning defense, and candidate-consented evidence profiles.
        </p>

        {/* 10-Second Elevator Pitch Card */}
        <div className="elevator-pitch-card">
          <div className="pitch-header">
            <span className="pitch-tag">THE 10-SECOND SUMMARY</span>
            <span className="pitch-engine">Judge0 CE + Gemini 3.8 Flash + Supabase</span>
          </div>
          <div className="pitch-grid">
            <div className="pitch-col">
              <strong>1. Realistic Work Samples</strong>
              <p>Debug production incidents, write SQL in WASM SQLite, build unit economics, or draft crisis memos. Graded by deterministic tests.</p>
            </div>
            <div className="pitch-col">
              <strong>2. Defend Your Reasoning</strong>
              <p>Adaptive follow-up questions target your specific gaps. Gemini scores technical reasoning twice with zero grammar bias.</p>
            </div>
            <div className="pitch-col">
              <strong>3. Evidence, Not Opaque Scores</strong>
              <p>No aggregate points, XP, or streaks. Granular evidence cards shared with recruiters only when you explicitly opt in.</p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="landing-cta-group">
          <button className="cta-primary" onClick={onEnterLearner}>
            <span>Launch Sandbox Demo (Learner)</span>
            <ArrowRightIcon size={16} />
          </button>
          <button className="cta-secondary" onClick={onEnterNyeras}>
            <MissionIcon size={16} />
            <span>Simulate Nyeras LMS Handoff</span>
          </button>
          <button className="cta-secondary" onClick={onEnterRecruiter}>
            <RecruiterIcon size={16} />
            <span>Recruiter View (NxtMove)</span>
          </button>
          <button className="cta-secondary" onClick={onEnterScenarios}>
            <LabIcon size={16} />
            <span>Failure Scenarios Lab</span>
          </button>
        </div>

        <p className="landing-disclaimer">
          Experimental evidence sandbox. We never claim automated scores are validated hiring predictors.
        </p>
      </section>

      {/* Feature Architecture Matrix */}
      <section className="landing-features" aria-labelledby="features-title">
        <div className="section-title-wrap">
          <span className="section-kicker">ENGINEERING PRINCIPLES</span>
          <h2 id="features-title">How ProofLoop Guarantees Fair & Auditable Evidence</h2>
          <p>Built strictly to the hackathon specification with zero proxy gamification and full append-only auditability.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon mint">
              <MissionIcon size={20} />
            </div>
            <h3>Deterministic Test Execution</h3>
            <p>
              Tests decide code correctness in isolated Judge0 containers with CPU and memory limits. AI has no authority over test results.
            </p>
            <ul className="feature-bullets">
              <li><CheckIcon size={14} /> Visible acceptance checks shown upfront</li>
              <li><CheckIcon size={14} /> Private edge-case suite runs server-side</li>
              <li><CheckIcon size={14} /> Never leaks hidden tests or test keys</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon sky">
              <TreeIcon size={20} />
            </div>
            <h3>Adaptive Follow-Up Defense</h3>
            <p>
              Interviewer-style targeted follow-up questions from a pre-written bank probe root causes and trade-offs based on the learner’s gaps.
            </p>
            <ul className="feature-bullets">
              <li><CheckIcon size={14} /> Rule-based gap tag matching (1–3 questions)</li>
              <li><CheckIcon size={14} /> Dual-run Gemini scoring against fixed keys</li>
              <li><CheckIcon size={14} /> Question count changes confidence, never score</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon amber">
              <EvidenceIcon size={20} />
            </div>
            <h3>Learner-Owned Consent Engine</h3>
            <p>
              Recruiter sharing is off by default, per skill, and instantly revocable. Submissions require explicit secondary consent.
            </p>
            <ul className="feature-bullets">
              <li><CheckIcon size={14} /> Off by default; revocable anytime</li>
              <li><CheckIcon size={14} /> Submissions need separate explicit opt-in</li>
              <li><CheckIcon size={14} /> Recruiter searches filter only consented records</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon rose">
              <ReviewIcon size={20} />
            </div>
            <h3>Human-in-the-Loop Governance</h3>
            <p>
              Disagreements between AI runs, prompt injection patterns, learner challenges, and low-confidence attempts route to human review.
            </p>
            <ul className="feature-bullets">
              <li><CheckIcon size={14} /> Anonymized peer submission similarity diff</li>
              <li><CheckIcon size={14} /> Mandatory written override rationale</li>
              <li><CheckIcon size={14} /> Append-only audit log of all decisions</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Hero Visual: The 4 Core Competency Pathways */}
      <section className="pathways-showcase" aria-labelledby="paths-title">
        <div className="section-title-wrap">
          <span className="section-kicker">FOUR SPECIALIZED PATHWAYS</span>
          <h2 id="paths-title">Authentic Work Samples Across Roles</h2>
          <p>Every competency pathway includes structured lessons and real work-sample tasks producing verifiable evidence cards.</p>
        </div>

        <div className="pathway-cards-grid">
          <div className="pathway-summary-card">
            <div className="pathway-tag debug">FLAGSHIP</div>
            <h3>Production Debugging</h3>
            <p>Monaco editor with Java and JavaScript incident missions, 5-node bug type skill tree, and the &quot;Catch the AI&apos;s mistake&quot; boss round.</p>
            <span className="pathway-meta">4 Incidents · 1 Boss Round · Judge0 Runner</span>
          </div>

          <div className="pathway-summary-card">
            <div className="pathway-tag data">NEW · WASM SQLITE</div>
            <h3>Data Analytics</h3>
            <p>In-browser SQLite sandbox on seeded tables. Runs deterministic result checks and rubric-scored insight write-ups with follow-ups.</p>
            <span className="pathway-meta">10 Modules · In-Browser SQL · Synthesis Memo</span>
          </div>

          <div className="pathway-summary-card">
            <div className="pathway-tag biz">NEW · SPREADSHEET</div>
            <h3>Business Analytics</h3>
            <p>Live spreadsheet grid with real financial formulas (CAC, LTV, Payback). Deterministic numeric verification and executive memo.</p>
            <span className="pathway-meta">10 Modules · Live Modeling · Strategy Memo</span>
          </div>

          <div className="pathway-summary-card">
            <div className="pathway-tag comm">NEW · WORKPLACE</div>
            <h3>Technical Communication</h3>
            <p>Postmortem escalation, stakeholder status updates, and non-technical translations with rubric scoring and revision loops.</p>
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
              <button className="cta-primary small" onClick={onEnterRecruiter}>
                Inspect Recruiter Search
              </button>
              <button className="cta-secondary small" onClick={onEnterValidation}>
                <ValidationIcon size={14} />
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
    </div>
  );
}
