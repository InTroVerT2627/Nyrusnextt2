"use client";

import React, { useState, useEffect } from "react";
import { Edit3, X, Check, Lock } from "lucide-react";

type PrivateNotesDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  pathSlug: string;
  moduleSlug: string;
  moduleTitle: string;
};

export default function PrivateNotesDrawer({
  isOpen,
  onClose,
  pathSlug,
  moduleSlug,
  moduleTitle,
}: PrivateNotesDrawerProps) {
  const [noteText, setNoteText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const storageKey = `nextlearn.note.${pathSlug}.${moduleSlug}`;

  // Load existing note
  useEffect(() => {
    if (!isOpen) return;
    const local = localStorage.getItem(storageKey);
    if (local) {
      setNoteText(local);
    } else {
      setNoteText("");
    }
  }, [isOpen, storageKey]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteText(val);
    localStorage.setItem(storageKey, val);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="notes-drawer-overlay" role="presentation" onClick={onClose}>
      <aside
        className="notes-drawer-panel"
        role="dialog"
        aria-label="Private Learner Notebook"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notes-drawer-header">
          <div className="notes-header-title">
            <Edit3 size={16} className="notes-icon" />
            <div>
              <h3>Private Notebook</h3>
              <small>{moduleTitle}</small>
            </div>
          </div>
          <button className="notes-close-btn" onClick={onClose} aria-label="Close notes drawer">
            <X size={16} />
          </button>
        </div>

        <div className="notes-privacy-banner">
          <Lock size={12} />
          <span>Private to you only. These notes are never shown to recruiters or reviewers.</span>
        </div>

        <div className="notes-body">
          <textarea
            className="notes-textarea"
            value={noteText}
            onChange={handleChange}
            placeholder="Jot down personal insights, key observations, or questions to revisit later..."
            aria-label="Module notes"
            rows={12}
            autoFocus
          />
        </div>

        <div className="notes-drawer-footer">
          <span className="save-indicator">
            {isSaved ? (
              <>
                <Check size={12} /> Saved to private notebook
              </>
            ) : (
              "Auto-saved locally"
            )}
          </span>
          <button className="primary-btn done-notes-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </aside>
    </div>
  );
}
