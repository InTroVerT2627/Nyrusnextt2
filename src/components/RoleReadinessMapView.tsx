"use client";

import React, { useEffect, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Shield,
  Clock,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Pin,
  Lock,
  Plus,
  HelpCircle,
  Layers,
  Sparkles,
} from "lucide-react";

interface GapResource {
  title: string;
  pathUrl: string;
  resourceType: string;
  rationale: string;
}

interface RequirementItem {
  skill: string;
  language: string;
  minimum_level: string;
  max_age_days: number;
  minimum_tasks: number;
  importance: "must-have" | "nice-to-have";
  confidence_needed: "high" | "medium";
  status: "met" | "partly-met" | "not-yet";
  reasons: string[];
  actual_level: string | null;
  actual_confidence: string | null;
  actual_age_days: number | null;
  actual_tasks: number;
  matched_evidence_id: string | null;
  matched_attempt_id: string | null;
  strengthening_advice: string[];
  gapResource: GapResource | null;
}

interface EvaluatedRole {
  id: string;
  slug: string;
  title: string;
  isPinned: boolean;
  summarySentence: string;
  allMet: boolean;
  hasConsent: boolean;
  requirements: RequirementItem[];
}

interface AvailableRole {
  id: string;
  slug: string;
  title: string;
  isPinned: boolean;
}

interface RoleReadinessMapViewProps {
  onOpenEvidence?: (attemptId: string) => void;
  onNavigateToConsent?: () => void;
}

export default function RoleReadinessMapView({
  onOpenEvidence,
  onNavigateToConsent,
}: RoleReadinessMapViewProps) {
  const [roles, setRoles] = useState<EvaluatedRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [selectedRoleSlug, setSelectedRoleSlug] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState<boolean>(false);

  const fetchReadiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/learner/readiness", {
        headers: {
          "x-demo-role": localStorage.getItem("nextlearn.demo_role") || "learner",
        },
      });
      if (!res.ok) throw new Error(`Could not load readiness map (${res.status})`);
      const data = await res.json();
      setRoles(data.roles || []);
      setAvailableRoles(data.availableRoles || []);
      if (data.roles?.length > 0 && !selectedRoleSlug) {
        setSelectedRoleSlug(data.roles[0].slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load readiness map.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReadiness();
  }, []);

  const handleTogglePin = async (roleId: string, isCurrentlyPinned: boolean) => {
    try {
      await fetch("/api/learner/readiness", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-demo-role": localStorage.getItem("nextlearn.demo_role") || "learner",
        },
        body: JSON.stringify({
          roleId,
          action: isCurrentlyPinned ? "unpin" : "pin",
        }),
      });
      await fetchReadiness();
    } catch {
      window.alert("Could not update target role.");
    }
  };

  if (loading) {
    return (
      <div className="readiness-container loading-state">
        <div className="skeleton-bar" style={{ width: "35%", height: "24px" }} />
        <div className="skeleton-bar" style={{ width: "65%", height: "16px", marginTop: "8px" }} />
        <div className="skeleton-box" style={{ height: "280px", marginTop: "24px" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="readiness-container error-state">
        <div className="notice error">
          <span>{error}</span>
          <button onClick={() => void fetchReadiness()}>Retry</button>
        </div>
      </div>
    );
  }

  const activeRole = roles.find((r) => r.slug === selectedRoleSlug) || roles[0];

  return (
    <div className="readiness-container">
      {/* Intro Header */}
      <div className="readiness-header">
        <div className="eyebrow">THE LEARNING-TO-HIRING BRIDGE · PRIVATE TO YOU</div>
        <h1>Role Readiness Map</h1>
        <p className="readiness-subtitle">
          Select target roles to evaluate your current demonstrated evidence against explicit employer requirements.
        </p>
      </div>

      {/* Privacy Callout Banner */}
      <aside className="readiness-privacy-banner" aria-label="Privacy notice">
        <div className="banner-left">
          <Shield size={18} />
          <div>
            <strong>Private Learner Planning Tool</strong>
            <p>
              Your target roles and gap analysis are <strong>never</strong> shared with recruiters or reviewers.
            </p>
          </div>
        </div>
        {onNavigateToConsent && (
          <button type="button" className="text-button" onClick={onNavigateToConsent}>
            Review what you share <span>→</span>
          </button>
        )}
      </aside>

      {/* Target Roles Selector Tabs */}
      <div className="role-tabs-bar" role="tablist" aria-label="Target roles selection">
        <div className="role-tabs-list">
          {roles.map((role) => (
            <button
              key={role.id}
              role="tab"
              aria-selected={activeRole?.slug === role.slug}
              className={`role-tab-btn ${activeRole?.slug === role.slug ? "active" : ""}`}
              onClick={() => setSelectedRoleSlug(role.slug)}
            >
              <Briefcase size={15} />
              <span>{role.title}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="secondary add-target-btn"
          onClick={() => setShowRoleSelector(!showRoleSelector)}
          aria-expanded={showRoleSelector}
        >
          <Plus size={14} />
          <span>Manage Targets ({roles.length})</span>
        </button>
      </div>

      {/* Manage Target Roles Dropdown Panel */}
      {showRoleSelector && (
        <section className="manage-targets-panel" aria-label="Available role templates">
          <div className="panel-kicker">AVAILABLE NXMOVE ROLE TEMPLATES</div>
          <p className="manage-desc">Pin or unpin sample roles to track against your evidence:</p>
          <div className="targets-grid">
            {availableRoles.map((ar) => {
              const isPinned = roles.some((r) => r.id === ar.id);
              return (
                <div key={ar.id} className="target-toggle-card">
                  <div className="card-info">
                    <strong>{ar.title}</strong>
                    <small>Sample role profile</small>
                  </div>
                  <button
                    type="button"
                    className={isPinned ? "secondary" : "primary"}
                    onClick={() => handleTogglePin(ar.id, isPinned)}
                  >
                    <Pin size={13} />
                    <span>{isPinned ? "Pinned (Active)" : "Pin Target"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Role Content */}
      {activeRole ? (
        <div className="active-role-view">
          {/* Role Header Banner */}
          <div className="role-summary-banner">
            <div className="role-title-row">
              <div>
                <h2>{activeRole.title}</h2>
                <div className="sample-role-pill">
                  Sample role. Real employers set their own requirements.
                </div>
              </div>
              <div className="summary-sentence-box">
                <span className="summary-sentence">{activeRole.summarySentence}</span>
              </div>
            </div>
          </div>

          {/* Requirements Checklist Table */}
          <div className="requirements-checklist" role="region" aria-label="Role requirements">
            <div className="checklist-header">
              <span className="col-req">EXPLICIT REQUIREMENT</span>
              <span className="col-status">STATUS</span>
              <span className="col-reasons">EVALUATION & GAPS</span>
              <span className="col-action">ACTION / EVIDENCE</span>
            </div>

            <div className="checklist-body">
              {activeRole.requirements.map((req, idx) => (
                <article key={idx} className={`requirement-row ${req.status}`}>
                  {/* Column 1: Requirement Specification */}
                  <div className="col-req">
                    <div className="req-top">
                      <span className={`importance-badge ${req.importance}`}>
                        {req.importance.toUpperCase()}
                      </span>
                      <strong className="req-skill">{req.skill}</strong>
                    </div>
                    <div className="req-params">
                      <span>Language: <b>{req.language}</b></span>
                      <span>Level: <b>≥ {req.minimum_level}</b></span>
                      <span>Recency: <b>≤ {req.max_age_days}d</b></span>
                      <span>Tasks: <b>≥ {req.minimum_tasks}</b></span>
                    </div>
                  </div>

                  {/* Column 2: Status */}
                  <div className="col-status">
                    <div className={`status-badge ${req.status}`}>
                      {req.status === "met" ? (
                        <>
                          <CheckCircle2 size={16} />
                          <strong>Met</strong>
                        </>
                      ) : req.status === "partly-met" ? (
                        <>
                          <AlertTriangle size={16} />
                          <strong>Partly met</strong>
                        </>
                      ) : (
                        <>
                          <Circle size={16} />
                          <strong>Not yet</strong>
                        </>
                      )}
                    </div>
                    {req.actual_level && (
                      <div className="actual-stat">
                        Current: <span>{req.actual_level}</span> ({req.actual_tasks} task{req.actual_tasks !== 1 ? "s" : ""})
                      </div>
                    )}
                  </div>

                  {/* Column 3: Specific Reasons & Strengthening */}
                  <div className="col-reasons">
                    <ul className="reasons-list">
                      {req.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>

                    {req.strengthening_advice.length > 0 && (
                      <div className="advice-block">
                        <span className="advice-label">Strengthen this evidence:</span>
                        <ul>
                          {req.strengthening_advice.map((adv, i) => (
                            <li key={i}>{adv}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Column 4: Actions (Evidence Card / Close This Gap) */}
                  <div className="col-action">
                    {req.status === "met" && req.matched_attempt_id ? (
                      <button
                        type="button"
                        className="secondary small linked-evidence-btn"
                        onClick={() => onOpenEvidence?.(req.matched_attempt_id!)}
                      >
                        <span>View Evidence</span>
                        <ExternalLink size={13} />
                      </button>
                    ) : (
                      <div className="gap-action-box">
                        {req.gapResource ? (
                          <a
                            href={req.gapResource.pathUrl}
                            className="primary small close-gap-link"
                          >
                            <BookOpen size={13} />
                            <span>Close This Gap</span>
                          </a>
                        ) : (
                          <span className="no-direct-gap">Complete prerequisite task</span>
                        )}

                        {req.gapResource && (
                          <small className="gap-resource-title">
                            {req.gapResource.title}
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Briefcase size={28} />
          <h2>No Target Roles Pinned</h2>
          <p>Pin at least one sample role from above to see your evidence checklist.</p>
        </div>
      )}

      {/* Standard Required Disclaimer */}
      <footer className="readiness-disclaimer">
        <HelpCircle size={14} />
        <p>
          Meeting a list does not guarantee a job or predict performance. All role templates are synthetic reference examples.
        </p>
      </footer>
    </div>
  );
}
