"use client";

import React, { useState } from "react";
import { RecruiterIcon, ReviewIcon } from "@/components/Icons";

export type DemoRole = "learner" | "recruiter" | "reviewer";

type RoleSwitcherProps = {
  currentRole: DemoRole;
  onRoleChange: (newRole: DemoRole) => void;
};

export default function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const personas: Record<DemoRole, { name: string; title: string; id: string; icon: React.ReactNode }> = {
    learner: {
      name: "Alex Morgan",
      title: "Synthetic Learner",
      id: "cand_0142",
      icon: <span className="avatar-chip">A</span>,
    },
    recruiter: {
      name: "Priya Sharma",
      title: "NxtMove Recruiter",
      id: "rec_priya",
      icon: <RecruiterIcon size={14} />,
    },
    reviewer: {
      name: "Dr. Sarah Chen",
      title: "Lead Evaluator",
      id: "rev_sarah",
      icon: <ReviewIcon size={14} />,
    },
  };

  const handleSelect = async (role: DemoRole) => {
    if (role === currentRole) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem("nextlearn.demo_role", role);
      await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      onRoleChange(role);
      setOpen(false);
    } catch (e) {
      console.error("Failed to switch demo role:", e);
    } finally {
      setBusy(false);
    }
  };

  const active = personas[currentRole] || personas.learner;

  return (
    <div className="role-switcher-dropdown">
      <button
        className="role-switcher-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Switch demo persona (no login needed for demo)"
      >
        <span className="role-label">DEMO PERSONA:</span>
        <span className="role-active-name">{active.name}</span>
        <span className="role-active-badge">({active.title})</span>
        <span className="dropdown-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="role-dropdown-menu" role="listbox">
          <div className="dropdown-title">SELECT DEMO PERSONA</div>
          {(["learner", "recruiter", "reviewer"] as DemoRole[]).map((role) => {
            const p = personas[role];
            const isSelected = role === currentRole;
            return (
              <button
                key={role}
                className={`dropdown-item ${isSelected ? "selected" : ""}`}
                role="option"
                aria-selected={isSelected}
                disabled={busy}
                onClick={() => void handleSelect(role)}
              >
                <div className="item-icon">{p.icon}</div>
                <div className="item-details">
                  <strong>{p.name}</strong>
                  <small>{p.title} · {p.id}</small>
                </div>
                {isSelected && <span className="item-check">✓</span>}
              </button>
            );
          })}
          <div className="dropdown-footer">
            <small>Instant persona switching with live Judge0 + Gemini endpoints</small>
          </div>
        </div>
      )}
    </div>
  );
}
