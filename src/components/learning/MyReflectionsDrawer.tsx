"use client";

import React, { useEffect, useState } from "react";
import { X, Sparkles, BookOpen, Clock, ShieldCheck } from "lucide-react";
import { StoredReflection } from "@/lib/server/learning-session";

type MyReflectionsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  pathSlug?: string;
  pathTitle?: string;
};

export default function MyReflectionsDrawer({
  isOpen,
  onClose,
  pathSlug,
  pathTitle,
}: MyReflectionsDrawerProps) {
  const [reflections, setReflections] = useState<StoredReflection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");

    const url = pathSlug ? `/api/learn/reflections?pathSlug=${encodeURIComponent(pathSlug)}` : `/api/learn/reflections`;

    void (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not load reflections.");
        const data = await res.json();
        setReflections(data.reflections || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reflections.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, pathSlug]);

  if (!isOpen) return null;

  return (
    <div
      className="notes-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="My Milestone Reflections"
      onClick={onClose}
    >
      <div
        className="notes-drawer-panel"
        style={{ maxWidth: "600px", width: "90%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notes-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={18} color="#06C6E6" />
            <div>
              <h2 style={{ fontSize: "16px", margin: 0, fontWeight: "700", color: "#142D4E" }}>
                My Milestone Reflections
              </h2>
              {pathTitle && (
                <span style={{ fontSize: "12px", color: "#64748B" }}>{pathTitle}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="notes-close-btn"
            onClick={onClose}
            aria-label="Close reflections"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "14px 20px", background: "#EAF6FC", borderBottom: "1px solid #D9E8F3", display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={16} color="#142D4E" />
          <span style={{ fontSize: "12px", color: "#142D4E" }}>
            Private learning notes · Never shared with recruiters or visible on evidence cards.
          </span>
        </div>

        <div className="notes-drawer-body" style={{ padding: "20px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
              <p>Loading your milestone reflections…</p>
            </div>
          )}

          {error && (
            <div style={{ padding: "12px", background: "rgba(220, 38, 38, 0.08)", color: "#DC2626", borderRadius: "8px", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {!loading && reflections.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748B" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#142D4E" }}>
                No milestone reflections yet.
              </p>
              <p style={{ fontSize: "13px", margin: "6px 0 0 0" }}>
                Reflections unlock after completing Modules 3, 6, 9, and the Capstone Module 10.
              </p>
            </div>
          )}

          {!loading && reflections.map((ref) => (
            <div
              key={ref.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #D9E8F3",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "16px",
                boxShadow: "0 2px 6px rgba(20, 45, 78, 0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    background: "#142D4E",
                    color: "#FFFFFF",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  Checkpoint {ref.checkpointNumber}
                </span>
                <span style={{ fontSize: "11px", color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={12} />
                  {new Date(ref.submittedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Formative Feedback badge */}
              {ref.formativeFeedback && (
                <div
                  style={{
                    background: ref.formativeFeedback.depth_level === "Solid" ? "rgba(5, 150, 105, 0.08)" : "#EAF6FC",
                    border: `1px solid ${ref.formativeFeedback.depth_level === "Solid" ? "#059669" : "#06C6E6"}`,
                    borderRadius: "6px",
                    padding: "10px 12px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Sparkles size={13} color="#06C6E6" />
                    <strong style={{ fontSize: "12px", color: "#142D4E" }}>
                      Coaching: {ref.formativeFeedback.depth_level}
                    </strong>
                  </div>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#334155" }}>
                    {ref.formativeFeedback.strength}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: "8px" }}>
                <strong style={{ fontSize: "12px", color: "#64748B", display: "block" }}>
                  Part 1 · Synthesise:
                </strong>
                <p style={{ margin: "3px 0 0 0", fontSize: "13px", color: "#142D4E", whiteSpace: "pre-wrap" }}>
                  {ref.responseSynthesise}
                </p>
              </div>

              <div>
                <strong style={{ fontSize: "12px", color: "#64748B", display: "block" }}>
                  Part 2 · Apply to Context:
                </strong>
                <p style={{ margin: "3px 0 0 0", fontSize: "13px", color: "#142D4E", whiteSpace: "pre-wrap" }}>
                  {ref.responseApply}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
