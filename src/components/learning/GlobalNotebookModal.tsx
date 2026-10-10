"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Download, BookOpen, Lock, Trash2 } from "lucide-react";

type NoteItem = {
  key: string;
  pathSlug: string;
  moduleSlug: string;
  content: string;
};

type GlobalNotebookModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentPathSlug?: string;
};

export default function GlobalNotebookModal({
  isOpen,
  onClose,
  currentPathSlug,
}: GlobalNotebookModalProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    if (!isOpen) return;
    const loadedNotes: NoteItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("nextlearn.note.")) {
        const parts = key.replace("nextlearn.note.", "").split(".");
        const pathSlug = parts[0] || "general";
        const moduleSlug = parts[1] || "general";
        const content = localStorage.getItem(key) || "";
        if (content.trim()) {
          loadedNotes.push({ key, pathSlug, moduleSlug, content });
        }
      }
    }
    setNotes(loadedNotes);
    if (currentPathSlug) {
      setSelectedFilter(currentPathSlug);
    }
  }, [isOpen, currentPathSlug]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesPath = selectedFilter === "all" || n.pathSlug === selectedFilter;
      const matchesSearch =
        searchQuery === "" ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.moduleSlug.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPath && matchesSearch;
    });
  }, [notes, selectedFilter, searchQuery]);

  const handleExportMarkdown = () => {
    let md = "# NextLearn · Private Learner Notebook\n\n";
    md += `*Exported on ${new Date().toLocaleString()}*\n\n`;
    md += "> **Privacy Guarantee:** These notes are private to you only. They are never shared with recruiters, factored into evidence cards, or used in hiring decisions.\n\n---\n\n";

    notes.forEach((note) => {
      const pathLabel = note.pathSlug
        .split("-")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");
      const modLabel = note.moduleSlug
        .split("-")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");

      md += `## [${pathLabel}] ${modLabel}\n\n`;
      md += `${note.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NextLearn_Private_Notebook_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 45, 78, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Learner Notebook"
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          maxWidth: "720px",
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
          border: "1px solid #D9E8F3",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #D9E8F3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BookOpen size={20} color="#06C6E6" />
            <div>
              <h2 style={{ fontSize: "18px", margin: 0, color: "#142D4E", fontWeight: "700" }}>
                My Learning Notebook
              </h2>
              <small style={{ color: "#64748B" }}>
                {notes.length} {notes.length === 1 ? "entry" : "entries"} across all learning paths
              </small>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {notes.length > 0 && (
              <button
                type="button"
                onClick={handleExportMarkdown}
                style={{
                  background: "#142D4E",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <Download size={13} />
                <span>Export .md</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer" }}
              aria-label="Close notebook"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div style={{ padding: "10px 24px", background: "#EAF6FC", borderBottom: "1px solid #D9E8F3", display: "flex", alignItems: "center", gap: "8px" }}>
          <Lock size={14} color="#142D4E" />
          <span style={{ fontSize: "12px", color: "#142D4E" }}>
            Private to you only · Never shared with recruiters, scored, or displayed on evidence profiles.
          </span>
        </div>

        {/* Controls: Search and Path Filters */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={14} color="#64748B" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search notes or concepts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px 8px 30px",
                borderRadius: "6px",
                border: "1px solid #D9E8F3",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "6px", fontSize: "12px" }}>
            {["all", "data-analytics", "business-analytics", "communication"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFilter(f)}
                style={{
                  background: selectedFilter === f ? "#142D4E" : "transparent",
                  color: selectedFilter === f ? "#FFFFFF" : "#64748B",
                  border: "1px solid #D9E8F3",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: selectedFilter === f ? "600" : "400",
                }}
              >
                {f === "all" ? "All Paths" : f === "data-analytics" ? "Data" : f === "business-analytics" ? "Business" : "Communication"}
              </button>
            ))}
          </div>
        </div>

        {/* Notes List */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
              <p style={{ margin: 0, fontSize: "14px" }}>
                {notes.length === 0
                  ? "No notes taken yet. Open any learning module and click the Notes button to jot down personal insights."
                  : "No notes matched your search query."}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.key}
                style={{
                  border: "1px solid #D9E8F3",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "14px",
                  background: "#FFFFFF",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", background: "#EAF6FC", color: "#142D4E", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                      {note.pathSlug}
                    </span>
                    <strong style={{ fontSize: "13px", color: "#142D4E" }}>
                      {note.moduleSlug.replace(/-/g, " ")}
                    </strong>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                  {note.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
