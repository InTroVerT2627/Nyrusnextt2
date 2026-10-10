"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Search,
  Terminal,
  GitBranch,
  FileCheck2,
  Lock,
  Users,
  CheckSquare,
  History,
  BookOpen,
  AlertOctagon,
  FileText,
  Keyboard,
  X,
  ArrowRight,
  Briefcase,
  Scale,
} from "lucide-react";

export interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Help";
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  onNavigate: (section: string) => void;
}

export default function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "missions",
        title: "Incident Missions",
        category: "Navigation",
        icon: <Terminal size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("Missions");
          setIsOpen(false);
        },
        shortcut: "G M",
      },
      {
        id: "skill-tree",
        title: "Interactive Skill Tree",
        category: "Navigation",
        icon: <GitBranch size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("Skill tree");
          setIsOpen(false);
        },
        shortcut: "G T",
      },
      {
        id: "evidence",
        title: "Evidence & Records",
        category: "Navigation",
        icon: <FileCheck2 size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("My evidence");
          setIsOpen(false);
        },
        shortcut: "G E",
      },
      {
        id: "role-readiness",
        title: "Role Readiness Map (Private Planning)",
        category: "Navigation",
        icon: <Briefcase size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("Role readiness");
          setIsOpen(false);
        },
        shortcut: "G D",
      },
      {
        id: "fairness-lab",
        title: "Fairness Lab (Language & Phrasing)",
        category: "Navigation",
        icon: <Scale size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("Fairness lab");
          setIsOpen(false);
        },
        shortcut: "G F",
      },
      {
        id: "learning-paths",
        title: "Learning Paths (SQL, Business, Comms)",
        category: "Navigation",
        icon: <BookOpen size={16} strokeWidth={1.8} />,
        action: () => {
          window.location.href = "/learning";
          setIsOpen(false);
        },
      },
      {
        id: "recruiter",
        title: "Recruiter Search (NxtMove)",
        category: "Navigation",
        icon: <Users size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("Recruiter preview");
          setIsOpen(false);
        },
        shortcut: "G R",
      },
      {
        id: "reviewer",
        title: "Human Review Queue",
        category: "Navigation",
        icon: <CheckSquare size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("Review queue");
          setIsOpen(false);
        },
        shortcut: "G Q",
      },
      {
        id: "audit-log",
        title: "Audit Log & System History",
        category: "Navigation",
        icon: <History size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("Audit log");
          setIsOpen(false);
        },
        shortcut: "G A",
      },
      {
        id: "failure-scenarios",
        title: "Demo Failure Scenarios (5 Safeguards)",
        category: "Actions",
        icon: <AlertOctagon size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("Failure scenarios");
          setIsOpen(false);
        },
      },
      {
        id: "validation",
        title: "Validation & Benchmark Evidence",
        category: "Actions",
        icon: <FileText size={16} strokeWidth={1.8} />,
        action: () => {
          onNavigate("Validation");
          setIsOpen(false);
        },
      },
      {
        id: "help",
        title: "Keyboard Shortcuts Help Sheet",
        category: "Help",
        icon: <Keyboard size={16} strokeWidth={1.8} />,
        action: () => {
          setIsOpen(false);
          setIsHelpOpen(true);
        },
        shortcut: "?",
      },
    ],
    [onNavigate]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  // Global keydown listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts inside text inputs or textareas
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setIsHelpOpen(false);
        return;
      }

      if (e.key === "?" && !isInput && !isOpen) {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      if (isOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          setIsOpen(false);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? (filtered.length || 1) - 1 : prev - 1
          );
        } else if (e.key === "Enter" && filtered[selectedIndex]) {
          e.preventDefault();
          filtered[selectedIndex].action();
        }
      } else if (isHelpOpen && e.key === "Escape") {
        e.preventDefault();
        setIsHelpOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isHelpOpen, filtered, selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      {/* Command Palette Modal */}
      {isOpen && (
        <div
          className="cmd-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="cmd-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="cmd-header">
              <Search className="cmd-search-icon" size={18} strokeWidth={2} />
              <input
                ref={inputRef}
                className="cmd-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command, destination, or section..."
                aria-autocomplete="list"
              />
              <span className="cmd-badge">ESC to close</span>
            </div>

            <div className="cmd-list" role="listbox">
              {filtered.length === 0 ? (
                <div className="cmd-empty">No matching commands found.</div>
              ) : (
                filtered.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      className={`cmd-item ${isSelected ? "selected" : ""}`}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="cmd-item-icon">{item.icon}</span>
                      <span className="cmd-item-title">{item.title}</span>
                      <span className="cmd-item-category">{item.category}</span>
                      {item.shortcut && (
                        <span className="cmd-item-shortcut">{item.shortcut}</span>
                      )}
                      <ArrowRight className="cmd-item-arrow" size={14} />
                    </button>
                  );
                })
              )}
            </div>

            <div className="cmd-footer">
              <span>
                <kbd>↑</kbd> <kbd>↓</kbd> navigate
              </span>
              <span>
                <kbd>↵</kbd> select
              </span>
              <span>
                <kbd>?</kbd> shortcut sheet
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Help Sheet Modal */}
      {isHelpOpen && (
        <div
          className="cmd-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHelpOpen(false);
          }}
        >
          <div
            className="cmd-dialog help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <div className="help-header">
              <div className="help-title-wrap">
                <Keyboard size={20} strokeWidth={2} />
                <h2 id="help-title">Keyboard Shortcuts</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setIsHelpOpen(false)}
                aria-label="Close shortcut help"
              >
                <X size={16} />
              </button>
            </div>

            <div className="help-content">
              <section className="help-section">
                <h3>Global Navigation</h3>
                <div className="help-row">
                  <span>Open command palette</span>
                  <div>
                    <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd>
                  </div>
                </div>
                <div className="help-row">
                  <span>Toggle keyboard shortcut help</span>
                  <div>
                    <kbd>?</kbd>
                  </div>
                </div>
                <div className="help-row">
                  <span>Close open dialog / modal</span>
                  <div>
                    <kbd>Esc</kbd>
                  </div>
                </div>
              </section>

              <section className="help-section">
                <h3>Coding Workspace & Panes</h3>
                <div className="help-row">
                  <span>Run tests / verify code</span>
                  <div>
                    <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                  </div>
                </div>
                <div className="help-row">
                  <span>Toggle Plain task / Incident story</span>
                  <div>
                    <kbd>Alt</kbd> + <kbd>P</kbd>
                  </div>
                </div>
                <div className="help-row">
                  <span>Cycle right inspection tabs</span>
                  <div>
                    <kbd>Alt</kbd> + <kbd>1, 2, 3</kbd>
                  </div>
                </div>
              </section>

              <section className="help-section">
                <h3>Accessibility & Focus</h3>
                <div className="help-row">
                  <span>Focus next interactive control</span>
                  <div>
                    <kbd>Tab</kbd>
                  </div>
                </div>
                <div className="help-row">
                  <span>Focus previous interactive control</span>
                  <div>
                    <kbd>Shift</kbd> + <kbd>Tab</kbd>
                  </div>
                </div>
              </section>
            </div>

            <div className="help-footer">
              <button
                className="secondary"
                onClick={() => setIsHelpOpen(false)}
              >
                Close help sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
