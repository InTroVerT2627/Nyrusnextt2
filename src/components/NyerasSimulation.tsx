"use client";

import React from "react";
import { CheckIcon, ArrowRightIcon, ShieldIcon, NyerasIcon } from "@/components/Icons";

type NyerasSimulationProps = {
  onProveSkill: () => void;
};

export default function NyerasSimulation({ onProveSkill }: NyerasSimulationProps) {
  const modules = [
    { title: "Module 1: Loop Boundaries & Off-by-One Failures", status: "Completed", score: "100%" },
    { title: "Module 2: Memory & Collection Mutation during Traversal", status: "Completed", score: "100%" },
    { title: "Module 3: Asynchronous Event Loops and Promises", status: "Completed", score: "100%" },
    { title: "Module 4: Hash Contracts & Object Identity Invariants", status: "Completed", score: "100%" },
    { title: "Module 5: Code Reviewing in the Age of Generative AI", status: "Completed", score: "100%" },
  ];

  return (
    <div className="nyeras-sim-container">
      {/* Simulation Banner */}
      <div className="sim-notice-banner" role="status">
        <span className="sim-badge">SIMULATED ENVIRONMENT</span>
        <p>
          This is a simulated <strong>Nyeras LMS</strong> course page. In a full production rollout, Nyeras courses embed the Proof-of-Skill Sandbox through a clean API handoff.
        </p>
      </div>

      <div className="nyeras-header">
        <div className="nyeras-brand">
          <NyerasIcon size={28} />
          <div>
            <h2>Nyeras Learning Platform</h2>
            <small>Enterprise & University Learning Management System</small>
          </div>
        </div>
        <div className="nyeras-user">
          <div className="avatar">A</div>
          <div>
            <strong>Alex Morgan</strong>
            <small>Student ID: NYR-2026-9041</small>
          </div>
        </div>
      </div>

      <div className="nyeras-course-card">
        <div className="course-main">
          <span className="course-code">CSE-402 · ADVANCED SYSTEMS ENGINEERING</span>
          <h1>Production Debugging & Reliability Engineering</h1>
          <p className="course-desc">
            Master the diagnostic patterns needed to troubleshoot mission-critical Java and JavaScript systems in production. Covers loop bounds, concurrent list mutation, async execution flows, and hash collisions.
          </p>

          <div className="course-stats-bar">
            <div className="stat-pill">
              <span className="label">Course Status</span>
              <strong className="value success">Completed (100%)</strong>
            </div>
            <div className="stat-pill">
              <span className="label">LMS Certificate</span>
              <strong className="value">Issued Oct 8, 2026</strong>
            </div>
            <div className="stat-pill">
              <span className="label">Certificate ID</span>
              <code className="value">NYR-CERT-8849-OK</code>
            </div>
          </div>
        </div>

        {/* The Employability Bridge Callout */}
        <div className="skill-bridge-callout">
          <div className="callout-badge">
            <ShieldIcon size={14} />
            <span>NXTMOVE EMPLOYABILITY BRIDGE</span>
          </div>
          <h3>Certificates show completion. Sandboxes prove competence.</h3>
          <p>
            Top recruiters on NxtMove look for verified, work-sample evidence rather than static certificates. Take the <strong>Proof-of-Skill Sandbox</strong> to solve 4 production incident tickets and defend your reasoning to build an evidence-linked portfolio.
          </p>
          <button className="prove-skill-cta" onClick={onProveSkill}>
            <span>Prove Your Skill in Sandbox</span>
            <ArrowRightIcon size={18} />
          </button>
          <small className="callout-fineprint">
            Assessment results remain private to you. Recruiters cannot see your evidence without your explicit consent.
          </small>
        </div>
      </div>

      {/* Course Curriculum list */}
      <div className="curriculum-section">
        <h3>Completed Curriculum</h3>
        <div className="modules-list">
          {modules.map((m, idx) => (
            <div className="module-item" key={idx}>
              <div className="module-status-icon done">
                <CheckIcon size={14} />
              </div>
              <div className="module-info">
                <strong>{m.title}</strong>
                <small>Theory, reading assignments, and multi-choice checks completed</small>
              </div>
              <span className="module-score">{m.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
