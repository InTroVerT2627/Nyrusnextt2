"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Sparkles,
  Terminal,
  Eye,
  Scale,
  Lock,
} from "lucide-react";

type AuditEvent = {
  id: string;
  ts: string;
  actor: string;
  action: string;
  attempt_id?: string | null;
  task_version?: string | null;
  rubric_version?: string | null;
  bank_version?: string | null;
  model_name?: string | null;
  prompt_version?: string | null;
  input_hash?: string | null;
  output_json?: Record<string, unknown> | null;
  flags?: string[] | null;
};

const actionDisplayNames: Record<string, string> = {
  assessment_submitted: "Assessment Submitted",
  gemini_grader_run: "Gemini Dual-Run Grader Evaluated",
  judge0_executed: "Judge0 CE Deterministic Test Run",
  consent_updated: "Learner Consent Granted",
  consent_revoked: "Learner Consent Revoked",
  recruiter_evidence_viewed: "Recruiter Viewed Evidence Profile",
  recruiter_decision_recorded: "Recruiter Shortlist Decision Recorded",
  review_decision_recorded: "Human Reviewer Decision Recorded",
  appeal_opened: "Learner Challenge / Appeal Opened",
  boss_round_submitted: "Boss Round ('Catch AI Mistake') Evaluated",
};

export default function AuditLogView() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadAuditLog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const demoRole = typeof window !== "undefined" ? localStorage.getItem("nextlearn.demo_role") : null;
      const headers: Record<string, string> = {
        "content-type": "application/json",
        ...(demoRole ? { "x-demo-role": demoRole } : {}),
      };
      const res = await fetch("/api/audit", { headers, cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load immutable audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditLog();
  }, [loadAuditLog]);

  const togglePayload = (id: string) => {
    setExpandedPayloads((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPayload = async (id: string, payload: unknown) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        // Category filter
        if (selectedCategory === "assessment") {
          if (!ev.action.includes("assessment") && !ev.action.includes("grader") && !ev.action.includes("judge0") && !ev.action.includes("boss"))
            return false;
        } else if (selectedCategory === "consent") {
          if (!ev.action.includes("consent")) return false;
        } else if (selectedCategory === "recruiter") {
          if (!ev.action.includes("recruiter")) return false;
        } else if (selectedCategory === "review") {
          if (!ev.action.includes("review") && !ev.action.includes("appeal")) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchAction = ev.action.toLowerCase().includes(q);
          const matchAttempt = ev.attempt_id?.toLowerCase().includes(q);
          const matchActor = ev.actor.toLowerCase().includes(q);
          const matchModel = ev.model_name?.toLowerCase().includes(q);
          if (!matchAction && !matchAttempt && !matchActor && !matchModel) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const diff = new Date(b.ts).getTime() - new Date(a.ts).getTime();
        return sortOrder === "desc" ? diff : -diff;
      });
  }, [events, selectedCategory, searchQuery, sortOrder]);

  const getActionBadgeClass = (action: string) => {
    if (action.includes("gemini") || action.includes("ai")) return "badge-ai";
    if (action.includes("judge0") || action.includes("submitted")) return "badge-test";
    if (action.includes("recruiter")) return "badge-recruiter";
    if (action.includes("review") || action.includes("appeal")) return "badge-review";
    if (action.includes("consent")) return "badge-consent";
    return "badge-default";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("gemini")) return <Sparkles size={13} />;
    if (action.includes("judge0")) return <Terminal size={13} />;
    if (action.includes("recruiter")) return <Eye size={13} />;
    if (action.includes("review") || action.includes("appeal")) return <Scale size={13} />;
    if (action.includes("consent")) return <Lock size={13} />;
    return <FileText size={13} />;
  };

  return (
    <div className="audit-workbench">
      {/* Intro Header */}
      <div className="page-intro">
        <div className="eyebrow">APPEND-ONLY ACCOUNT HISTORY</div>
        <h1>Immutable Audit Log</h1>
        <p>
          Every assessment version, question selection trigger, raw model output, review override, consent toggle, and recruiter view is permanently logged.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="audit-metrics-row">
        <div className="metric-cell">
          <span className="metric-label">TOTAL LOGGED EVENTS</span>
          <strong className="metric-val">{events.length}</strong>
        </div>
        <div className="metric-cell">
          <span className="metric-label">AI DUAL-RUN EVALS</span>
          <strong className="metric-val">
            {events.filter((e) => e.action.includes("gemini") || e.model_name?.includes("gemini")).length}
          </strong>
        </div>
        <div className="metric-cell">
          <span className="metric-label">RECRUITER VIEWS</span>
          <strong className="metric-val">
            {events.filter((e) => e.action.includes("recruiter")).length}
          </strong>
        </div>
        <div className="metric-cell">
          <span className="metric-label">HUMAN OVERRIDES & APPEALS</span>
          <strong className="metric-val">
            {events.filter((e) => e.action.includes("review") || e.action.includes("appeal")).length}
          </strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <section className="audit-toolbar-panel">
        <div className="search-input-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="search"
            placeholder="Search by attempt ID, action type, model name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search audit log"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")} aria-label="Clear search">
              ×
            </button>
          )}
        </div>

        <div className="filter-categories-wrap">
          <div className="category-pills">
            <button
              className={`cat-pill ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All Events ({events.length})
            </button>
            <button
              className={`cat-pill ${selectedCategory === "assessment" ? "active" : ""}`}
              onClick={() => setSelectedCategory("assessment")}
            >
              Assessments & Grader
            </button>
            <button
              className={`cat-pill ${selectedCategory === "consent" ? "active" : ""}`}
              onClick={() => setSelectedCategory("consent")}
            >
              Consent & Privacy
            </button>
            <button
              className={`cat-pill ${selectedCategory === "recruiter" ? "active" : ""}`}
              onClick={() => setSelectedCategory("recruiter")}
            >
              Recruiter Views
            </button>
            <button
              className={`cat-pill ${selectedCategory === "review" ? "active" : ""}`}
              onClick={() => setSelectedCategory("review")}
            >
              Human Reviews
            </button>
          </div>

          <div className="audit-actions-right">
            <button
              className="sort-toggle-btn"
              onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
              title="Toggle sort order"
            >
              <Clock size={13} />
              <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
            </button>
            <button
              className="refresh-audit-btn"
              onClick={() => void loadAuditLog()}
              disabled={loading}
              title="Refresh log"
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>
      </section>

      {/* Error Notice */}
      {error && (
        <div className="notice error" role="alert">
          <Shield size={14} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* Timeline List */}
      {loading ? (
        <div className="audit-loading">
          <div className="loading-card skeleton-pulse" />
          <div className="loading-card skeleton-pulse" />
          <div className="loading-card skeleton-pulse" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <FileText size={36} />
          </div>
          <h2>No matching audit events found</h2>
          <p>
            {searchQuery
              ? `No events matching "${searchQuery}". Try clearing search filters.`
              : "No audit events recorded under this category yet."}
          </p>
        </div>
      ) : (
        <div className="audit-timeline">
          {filteredEvents.map((event, idx) => {
            const eventId = String(event.id ?? idx);
            const isPayloadOpen = Boolean(expandedPayloads[eventId]);
            const isCopied = copiedId === eventId;

            return (
              <article className="audit-entry-card" key={eventId}>
                <div className="entry-timeline-indicator">
                  <span className={`entry-dot ${getActionBadgeClass(event.action)}`} />
                  {idx < filteredEvents.length - 1 && <span className="entry-line" />}
                </div>

                <div className="entry-main-content">
                  <div className="entry-header-row">
                    <div className="action-title-group">
                      <span className={`action-badge ${getActionBadgeClass(event.action)}`}>
                        {getActionIcon(event.action)}
                        <span>{actionDisplayNames[event.action] ?? event.action.replaceAll("_", " ")}</span>
                      </span>
                      {event.attempt_id && (
                        <span className="attempt-id-tag">
                          ATTEMPT: <code>{event.attempt_id.slice(0, 8)}</code>
                        </span>
                      )}
                    </div>
                    <div className="timestamp-group">
                      <Clock size={12} />
                      <time dateTime={event.ts}>{new Date(event.ts).toLocaleString()}</time>
                    </div>
                  </div>

                  {/* Version & Model Tags */}
                  <div className="entry-meta-tags">
                    <span className="meta-tag">
                      Actor: <strong>{event.actor.slice(0, 8)}</strong>
                    </span>
                    {event.model_name && (
                      <span className="meta-tag model-tag">
                        Model: <strong>{event.model_name}</strong>
                      </span>
                    )}
                    {event.task_version && (
                      <span className="meta-tag">
                        Task: <strong>v{event.task_version}</strong>
                      </span>
                    )}
                    {event.rubric_version && (
                      <span className="meta-tag">
                        Rubric: <strong>v{event.rubric_version}</strong>
                      </span>
                    )}
                    {event.bank_version && (
                      <span className="meta-tag">
                        Question Bank: <strong>v{event.bank_version}</strong>
                      </span>
                    )}
                    {event.flags && event.flags.length > 0 && (
                      <span className="meta-tag flags-tag">
                        Flags: <strong>{event.flags.join(", ")}</strong>
                      </span>
                    )}
                  </div>

                  {/* Expandable Payload Inspector */}
                  <div className="payload-inspector-box">
                    <div className="payload-toggle-bar">
                      <button
                        className="toggle-payload-btn"
                        onClick={() => togglePayload(eventId)}
                        aria-expanded={isPayloadOpen}
                      >
                        {isPayloadOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        <span>{isPayloadOpen ? "Hide audit payload" : "Inspect recorded cryptographic payload"}</span>
                      </button>

                      {isPayloadOpen && (
                        <button
                          className="copy-payload-btn"
                          onClick={() =>
                            void copyPayload(eventId, {
                              flags: event.flags,
                              input_hash: event.input_hash,
                              output: event.output_json,
                            })
                          }
                          title="Copy payload JSON"
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{isCopied ? "Copied" : "Copy JSON"}</span>
                        </button>
                      )}
                    </div>

                    {isPayloadOpen && (
                      <pre className="payload-code-view">
                        {JSON.stringify(
                          {
                            event_id: event.id,
                            timestamp: event.ts,
                            actor: event.actor,
                            action: event.action,
                            attempt_id: event.attempt_id,
                            input_hash: event.input_hash,
                            flags: event.flags,
                            output: event.output_json,
                          },
                          null,
                          2
                        )}
                      </pre>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
