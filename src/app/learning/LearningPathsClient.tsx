"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import SqlSandbox from "@/components/SqlSandbox";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import CommunicationWorkbench from "@/components/CommunicationWorkbench";
import DebuggingWorkbench from "@/components/DebuggingWorkbench";
import DsaWorkbench from "@/components/DsaWorkbench";
import ModuleExperienceContainer from "@/components/learning/ModuleExperienceContainer";
import ReflectionCheckpointView from "@/components/learning/ReflectionCheckpointView";
import MyReflectionsDrawer from "@/components/learning/MyReflectionsDrawer";
import JourneyMap from "@/components/learning/JourneyMap";
import GlobalNotebookModal from "@/components/learning/GlobalNotebookModal";
import { getFullModule } from "@/lib/learning-seed-data";
import { FullModule } from "@/lib/learning-experience-types";
import DeviceCheckModal from "@/components/learning/DeviceCheckModal";
import FinalTestShell from "@/components/learning/FinalTestShell";
import { FinalTestAttemptSummary, FinalTestQuestionClient } from "@/lib/final-test-types";

type PublicQuestion = { id: string; prompt: string; choices: string[] };
type PublicModule = {
  slug: string;
  title: string;
  summary: string;
  objectives: string[];
  lesson: { heading: string; body: string }[];
  scenario: string;
  questions: PublicQuestion[];
};
type LearningPath = {
  slug: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  modules: PublicModule[];
};
type ModuleProgress = { passed: boolean; attempts: number; bestScore: number; lastScore: number; lastAttemptAt: string };
type Feedback = { selectedIndex: number; correctIndex: number; correct: boolean; explanation: string };
type QuizResult = { score: number; questionCount: number; passMark: number; passed: boolean; feedback: Feedback[]; progress: ModuleProgress };
type ErrorPayload = { error?: string };

const localProgressKey = "nextlearn.learning-paths.v1";

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({})) as T & ErrorPayload;
  if (!response.ok) throw new Error(data.error || "The learning service could not complete that request.");
  return data;
}

function progressKey(path: string, module: string) { return `${path}/${module}`; }

function moduleState(index: number, modules: PublicModule[], progress: Record<string, ModuleProgress>, pathSlug: string): "Passed" | "Ready" | "Locked" {
  if (progress[progressKey(pathSlug, modules[index].slug)]?.passed) return "Passed";
  // All modules are unlocked and ready for hackathon demonstration
  return "Ready";
}

export default function LearningPathsClient() {
  const remote = process.env.NEXT_PUBLIC_BACKEND_MODE === "supabase";
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});
  const [activePathSlug, setActivePathSlug] = useState("");
  const [activeModuleSlug, setActiveModuleSlug] = useState("");
  const [activeView, setActiveView] = useState<"module" | "work-sample">("module");
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeImmersiveModule, setActiveImmersiveModule] = useState<FullModule | null>(null);
  const [activeCheckpoint, setActiveCheckpoint] = useState<(1 | 2 | 3 | 4) | null>(null);
  const [showReflectionsDrawer, setShowReflectionsDrawer] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [deviceCheckOpen, setDeviceCheckOpen] = useState(false);
  const [activeFinalTest, setActiveFinalTest] = useState<{
    attempt: FinalTestAttemptSummary;
    firstQuestion: FinalTestQuestionClient;
    token: string;
  } | null>(null);
  const [finalTestUnlockStatus, setFinalTestUnlockStatus] = useState<{
    unlocked: boolean;
    passedModules: number;
    completedReflections: number;
    reason?: string;
  } | null>({
    unlocked: true,
    passedModules: 10,
    completedReflections: 3,
  });

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const response = await fetch("/api/learning-paths", { cache: "no-store" });
        const data = await readJson<{ paths: LearningPath[]; progress: Record<string, ModuleProgress> }>(response);
        const stored = !remote ? localStorage.getItem(localProgressKey) : null;
        let local: Record<string, ModuleProgress> = {};
        if (stored) {
          try { local = JSON.parse(stored) as Record<string, ModuleProgress>; }
          catch { local = {}; }
        }
        if (!live) return;
        setPaths(data.paths);
        setProgress(remote ? data.progress : local);
        setActivePathSlug(data.paths[0]?.slug ?? "");
        setActiveModuleSlug(data.paths[0]?.modules[0]?.slug ?? "");
        if (typeof window !== "undefined") {
          const sp = new URLSearchParams(window.location.search);
          if (sp.get("immersive") === "1" && data.paths[0]?.modules[0]) {
            const fullMod = getFullModule(data.paths[0].slug, data.paths[0].title, data.paths[0].modules[0], 0);
            setActiveImmersiveModule(fullMod);
          }
        }
      } catch (problem) {
        if (live) setError(problem instanceof Error ? problem.message : "Could not load the learning paths.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [remote]);

  useEffect(() => {
    if (!activePathSlug) return;
    void (async () => {
      try {
        const res = await fetch("/api/test/unlock-status", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pathSlug: activePathSlug }),
        });
        if (res.ok) {
          const data = await res.json();
          setFinalTestUnlockStatus(data);
        }
      } catch {
        // non-blocking
      }
    })();
  }, [activePathSlug, progress]);

  const activePath = paths.find((path) => path.slug === activePathSlug) ?? null;
  const activeModule = activePath?.modules.find((module) => module.slug === activeModuleSlug) ?? null;
  const activeModuleIndex = activePath?.modules.findIndex((module) => module.slug === activeModuleSlug) ?? -1;
  const passedCount = activePath?.modules.filter((module) => progress[progressKey(activePath.slug, module.slug)]?.passed).length ?? 0;
  const nextModule = activePath && activeModuleIndex >= 0 ? activePath.modules[activeModuleIndex + 1] : undefined;
  const nextIsAvailable = Boolean(activePath && nextModule && moduleState(activeModuleIndex + 1, activePath.modules, progress, activePath.slug) !== "Locked");
  const answeredAll = Boolean(activeModule && answers.length === activeModule.questions.length && answers.every((answer) => answer >= 0));

  const pathProgress = useMemo(() => paths.map((path) => ({
    path,
    passed: path.modules.filter((module) => progress[progressKey(path.slug, module.slug)]?.passed).length,
  })), [paths, progress]);

  const selectPath = (path: LearningPath) => {
    const firstOpen = path.modules.findIndex((module, index) => !progress[progressKey(path.slug, module.slug)]?.passed && moduleState(index, path.modules, progress, path.slug) !== "Locked");
    setActivePathSlug(path.slug);
    setActiveModuleSlug(path.modules[firstOpen >= 0 ? firstOpen : path.modules.length - 1]?.slug ?? "");
    setActiveView("module");
    setAnswers([]); setResult(null); setQuizOpen(false); setError("");
  };

  const selectModule = (module: PublicModule, index: number) => {
    if (!activePath || moduleState(index, activePath.modules, progress, activePath.slug) === "Locked") return;
    setActiveModuleSlug(module.slug);
    setActiveView("module");
    setAnswers([]); setResult(null); setQuizOpen(false); setError("");
  };

  const startQuiz = () => {
    if (!activeModule) return;
    setAnswers(Array(activeModule.questions.length).fill(-1));
    setResult(null); setQuizOpen(true); setError("");
  };

  const submitQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activePath || !activeModule || !answeredAll || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/learning-paths", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pathSlug: activePath.slug, moduleSlug: activeModule.slug, responses: answers }),
      });
      const data = await readJson<QuizResult>(response);
      setResult(data);
      const key = progressKey(activePath.slug, activeModule.slug);
      const previous = progress[key];
      const currentProgress = remote ? data.progress : {
        passed: Boolean(previous?.passed || data.passed),
        attempts: (previous?.attempts ?? 0) + 1,
        bestScore: Math.max(previous?.bestScore ?? 0, data.score),
        lastScore: data.score,
        lastAttemptAt: new Date().toISOString(),
      };
      const updated = { ...progress, [key]: currentProgress };
      setProgress(updated);
      if (!remote) localStorage.setItem(localProgressKey, JSON.stringify(updated));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Your knowledge check could not be submitted.");
    } finally { setBusy(false); }
  };

  const continuePath = () => {
    if (!activePath || !nextModule || !nextIsAvailable) return;
    setActiveModuleSlug(nextModule.slug); setAnswers([]); setResult(null); setQuizOpen(false); setError("");
  };

  if (loading) return <main className="learning-loading"><span className="brand-mark">N</span><p>Opening your learning paths…</p></main>;
  if (error && paths.length === 0) return <main className="learning-loading"><span className="brand-mark">N</span><h1>Learning paths need a connection</h1><p>{error}</p>{remote && <Link className="primary" href="/login">Sign in to continue <span>→</span></Link>}<Link className="secondary" href="/">Return to Nextlearn</Link></main>;

  if (activeImmersiveModule && activePath) {
    return (
      <ModuleExperienceContainer
        pathTitle={activePath.title}
        module={activeImmersiveModule}
        onExit={() => setActiveImmersiveModule(null)}
        onModuleCompleted={() => {
          const key = progressKey(activePath.slug, activeImmersiveModule.slug);
          const previous = progress[key];
          const updatedProgress = {
            passed: true,
            attempts: (previous?.attempts ?? 0) + 1,
            bestScore: 3,
            lastScore: 3,
            lastAttemptAt: new Date().toISOString(),
          };
          const updated = { ...progress, [key]: updatedProgress };
          setProgress(updated);
          if (!remote) localStorage.setItem(localProgressKey, JSON.stringify(updated));
          setActiveImmersiveModule(null);
        }}
      />
    );
  }

  if (activeCheckpoint && activePath) {
    return (
      <ReflectionCheckpointView
        pathSlug={activePath.slug as any}
        pathTitle={activePath.title}
        checkpointNumber={activeCheckpoint}
        onCompleted={() => setActiveCheckpoint(null)}
        onExit={() => setActiveCheckpoint(null)}
      />
    );
  }

  if (activeFinalTest && activePath) {
    return (
      <FinalTestShell
        initialAttempt={activeFinalTest.attempt}
        initialQuestion={activeFinalTest.firstQuestion}
        token={activeFinalTest.token}
        pathTitle={activePath.title}
        pathSlug={activePath.slug}
        onExit={() => setActiveFinalTest(null)}
      />
    );
  }

  return <main className="learning-page">
    <MyReflectionsDrawer
      isOpen={showReflectionsDrawer}
      onClose={() => setShowReflectionsDrawer(false)}
      pathSlug={activePath?.slug}
      pathTitle={activePath?.title}
    />
    <GlobalNotebookModal
      isOpen={showNotebookModal}
      onClose={() => setShowNotebookModal(false)}
      currentPathSlug={activePath?.slug}
    />
    <DeviceCheckModal
      isOpen={deviceCheckOpen}
      pathTitle={activePath?.title || "Final Test"}
      onCancel={() => setDeviceCheckOpen(false)}
      onProceed={async (config) => {
        setDeviceCheckOpen(false);
        if (!activePath) return;
        try {
          const res = await fetch("/api/test/start", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              pathSlug: activePath.slug,
              proctorMode: config.proctorMode,
              cameraVerified: config.cameraVerified,
              micVerified: config.micVerified,
              hasAccommodation: config.hasAccommodation,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || "Failed to start final test.");
            return;
          }
          const data = await res.json();
          setActiveFinalTest(data);
        } catch {
          alert("Failed to start final test.");
        }
      }}
    />
    <header className="learning-topbar">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>nextlearn</span></Link>
      <div className="learning-top-actions">
        <button
          type="button"
          className="secondary"
          onClick={() => setShowNotebookModal(true)}
          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <span>📓 Private Notebook</span>
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setShowReflectionsDrawer(true)}
          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <span>✦ My Reflections</span>
        </button>
        <span className="learning-progress-chip">Progress is earned through understanding</span>
        <Link href="/" className="secondary">← Debugging workspace</Link>
      </div>
    </header>
    <div className="learning-content">
      <section className="learning-hero"><div><div className="eyebrow">LEARN · PRACTICE · SHOW UNDERSTANDING</div><h1>Choose your next path.</h1><p>Short lessons, practical scenarios, and knowledge checks. Pass a module to open the next one; take your time and retry whenever you need.</p></div><div className="learning-hero-mark" aria-hidden="true"><span>{String(paths.length || 5).padStart(2, "0")}</span><small>learning paths</small></div></section>

      {error && <div className="notice error" role="status">{error}</div>}

      <section className="learning-path-grid" aria-label="Learning paths">
        {pathProgress.map(({ path, passed }) => <button key={path.slug} className={`learning-path-card ${path.accent} ${activePathSlug === path.slug ? "selected" : ""}`} onClick={() => selectPath(path)} aria-pressed={activePathSlug === path.slug}>
          <span className="learning-path-icon" aria-hidden="true">{path.icon}</span><span className="learning-path-subtitle">{path.subtitle}</span><strong>{path.title}</strong><span className="learning-path-description">{path.description}</span><span className="learning-path-card-footer"><span>{passed} / {path.modules.length} modules passed</span><span aria-hidden="true">→</span></span>
        </button>)}
      </section>

      {activePath && <>
        <section className="learning-path-heading"><div><div className="eyebrow">{activePath.subtitle.toUpperCase()}</div><h2>{activePath.title}</h2><p>{activePath.description}</p></div><div className="learning-path-count"><strong>{passedCount}<span> / {activePath.modules.length}</span></strong><small>modules passed</small></div></section>

        {/* Flight Path Journey Map */}
        <JourneyMap
          pathTitle={activePath.title}
          pathSlug={activePath.slug}
          nodes={activePath.modules.map((m, idx) => ({
            slug: m.slug,
            title: m.title,
            summary: m.summary,
            objectives: m.objectives,
            order: idx + 1,
            state: moduleState(idx, activePath.modules, progress, activePath.slug),
            attempts: progress[progressKey(activePath.slug, m.slug)]?.attempts,
          }))}
          onSelectModule={(slug) => {
            setActiveModuleSlug(slug);
            setActiveView("module");
          }}
          onLaunchImmersive={(slug) => {
            const modIndex = activePath.modules.findIndex((m) => m.slug === slug);
            const targetMod = activePath.modules[modIndex];
            if (targetMod) {
              const fullMod = getFullModule(activePath.slug, activePath.title, targetMod, modIndex);
              setActiveImmersiveModule(fullMod);
            }
          }}
          onSelectCheckpoint={(cp) => setActiveCheckpoint(cp)}
        />

        <div className="learning-workspace">
          <aside className="learning-map" aria-label={`${activePath.title} module map`}>
            {/* Authentic Work-Sample Button */}
            <div style={{ padding: "10px", marginBottom: "12px", borderRadius: "6px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.05em", color: "var(--color-primary, #38bdf8)" }}>PROOF OF SKILL</span>
                <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "3px", background: "rgba(63, 185, 80, 0.2)", color: "#3fb950", fontWeight: "600" }}>EVIDENCE</span>
              </div>
              <button
                type="button"
                className={`learning-node ${activeView === "work-sample" ? "current" : ""}`}
                onClick={() => setActiveView("work-sample")}
                style={{ width: "100%", textAlign: "left", padding: "8px", border: "none", background: "transparent", cursor: "pointer" }}
              >
                <span className="learning-node-symbol" aria-hidden="true">✦</span>
                <span className="learning-node-copy">
                  <strong>Work-Sample Task</strong>
                  <small>
                    {activePath.slug === "data-analytics" ? "WASM SQLite Sandbox" : activePath.slug === "business-analytics" ? "Spreadsheet Formula Model" : activePath.slug === "debugging" ? "Incident Debugging Sandbox" : activePath.slug === "dsa" ? "Complexity & Scale Sandbox" : "P0 Escalation Workbench"}
                  </small>
                </span>
              </button>
            </div>

            <div className="learning-map-heading"><span>PATH MAP</span><span>{passedCount} passed</span></div>
            {activePath.modules.map((module, index) => {
              const state = moduleState(index, activePath.modules, progress, activePath.slug);
              const moduleProgress = progress[progressKey(activePath.slug, module.slug)];
              const selected = activeView === "module" && activeModuleSlug === module.slug;

              const isCheckpoint1 = index === 2;
              const isCheckpoint2 = index === 5;
              const isCheckpoint3 = index === 8;
              const isCheckpoint4 = index === 9;

              const checkpointNum = isCheckpoint1 ? 1 : isCheckpoint2 ? 2 : isCheckpoint3 ? 3 : isCheckpoint4 ? 4 : null;
              const checkpointAvailable = true;

              return (
                <div key={module.slug}>
                  <button className={`learning-node ${state.toLowerCase()} ${selected ? "current" : ""}`} onClick={() => selectModule(module, index)} disabled={state === "Locked"} aria-current={selected ? "step" : undefined}>
                    <span className="learning-node-symbol" aria-hidden="true">{state === "Passed" ? "✓" : state === "Ready" ? String(index + 1).padStart(2, "0") : "·"}</span><span className="learning-node-copy"><strong>{module.title}</strong><small>{state}{moduleProgress?.attempts ? ` · ${moduleProgress.attempts} ${moduleProgress.attempts === 1 ? "attempt" : "attempts"}` : ""}</small></span><span className="learning-node-arrow" aria-hidden="true">{selected ? "●" : ""}</span>
                  </button>

                  {checkpointNum && (
                    <button
                      type="button"
                      className="learning-node"
                      style={{
                        margin: "4px 0 8px 12px",
                        borderLeft: "2px solid var(--forest)",
                        background: checkpointAvailable ? "rgba(15, 61, 42, 0.08)" : "transparent",
                        opacity: checkpointAvailable ? 1 : 0.5,
                        cursor: checkpointAvailable ? "pointer" : "not-allowed",
                        textAlign: "left",
                        width: "calc(100% - 12px)",
                      }}
                      disabled={!checkpointAvailable}
                      onClick={() => setActiveCheckpoint(checkpointNum as 1 | 2 | 3 | 4)}
                    >
                      <span className="learning-node-symbol" style={{ color: "var(--forest)" }}>✦</span>
                      <span className="learning-node-copy">
                        <strong style={{ fontSize: "12px" }}>{checkpointNum === 4 ? "Capstone Reflection" : `Milestone Reflection ${checkpointNum}`}</strong>
                        <small>{checkpointAvailable ? "Ready to reflect" : "Pass module first"}</small>
                      </span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Capstone Final Test Node */}
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "12px",
                background: finalTestUnlockStatus?.unlocked ? "var(--lime)" : "var(--paper)",
                border: finalTestUnlockStatus?.unlocked ? "2px solid var(--forest)" : "1.5px solid var(--mint-deep)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--ink)", textTransform: "uppercase" }}>
                  PATH CAPSTONE
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    backgroundColor: finalTestUnlockStatus?.unlocked ? "var(--success)" : "var(--muted)",
                    color: "var(--white)",
                    fontWeight: 700,
                  }}
                >
                  {finalTestUnlockStatus?.unlocked ? "UNLOCKED" : "LOCKED"}
                </span>
              </div>
              <button
                type="button"
                className="learning-node"
                disabled={!finalTestUnlockStatus?.unlocked}
                onClick={() => setDeviceCheckOpen(true)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 0",
                  background: "transparent",
                  border: "none",
                  cursor: finalTestUnlockStatus?.unlocked ? "pointer" : "not-allowed",
                  opacity: finalTestUnlockStatus?.unlocked ? 1 : 0.6,
                }}
              >
                <span className="learning-node-symbol" style={{ color: "var(--forest)" }}>🏆</span>
                <span className="learning-node-copy">
                  <strong style={{ fontSize: "13px", color: "var(--ink)" }}>Final Proof-of-Skill Test</strong>
                  <small style={{ color: "var(--muted)" }}>
                    {finalTestUnlockStatus?.unlocked
                      ? "Ready · 45 mins · 8 questions"
                      : finalTestUnlockStatus?.reason || "Complete 10 modules & 3 reflections"}
                  </small>
                </span>
              </button>
            </div>
          </aside>

          {activeView === "work-sample" ? (
            <section className="learning-module reading-surface" style={{ padding: "24px" }}>
              {activePath.slug === "data-analytics" && <SqlSandbox />}
              {activePath.slug === "business-analytics" && <SpreadsheetGrid />}
              {activePath.slug === "communication" && <CommunicationWorkbench />}
              {activePath.slug === "debugging" && <DebuggingWorkbench />}
              {activePath.slug === "dsa" && <DsaWorkbench />}
            </section>
          ) : activeModule && (
            <section className="learning-module reading-surface">
              {/* Draft Notice Banner */}
              <div className="notice" style={{ marginBottom: "16px", borderLeft: "3px solid var(--warning)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>⚠</span>
                <p style={{ margin: 0, fontSize: "13px" }}>
                  <strong>Draft curriculum content — for demonstration purposes; requires human curriculum review.</strong> Do not invent statistics. Real skills are proven in the Authentic Work-Sample Sandbox.
                </p>
              </div>

              <div
                style={{
                  background: "var(--lime-light)",
                  border: "1.5px solid var(--mint-deep)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em", color: "var(--ink)", textTransform: "uppercase" }}>
                      IMMERSIVE STORY EXPERIENCE
                    </span>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "9999px", background: "var(--lime)", color: "var(--forest)", fontWeight: "700" }}>
                      7 Beats · Focus Engine
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
                    Half-and-half layout with narrative scene, SVG character dialogue, calm pacing ring, try-it, and knowledge check.
                  </p>
                </div>
                <button
                  type="button"
                  className="primary"
                  style={{
                    background: "var(--forest)",
                    color: "var(--on-forest)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 22px",
                    borderRadius: "9999px",
                    fontWeight: "700",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    const fullMod = getFullModule(activePath.slug, activePath.title, activeModule, activeModuleIndex);
                    setActiveImmersiveModule(fullMod);
                  }}
                >
                  <span>Launch Immersive Module</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="learning-module-kicker"><span>MODULE {String(activeModuleIndex + 1).padStart(2, "0")}</span><span>{activePath.shortTitle.toUpperCase()} PATH</span></div>
              <h2>{activeModule.title}</h2><p className="learning-module-summary">{activeModule.summary}</p>
              <div className="learning-objectives"><strong>By the end, you can</strong><ul>{activeModule.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div>
              <div className="learning-lesson-list">{activeModule.lesson.map((section) => <article className="learning-lesson" key={section.heading}><h3>{section.heading}</h3><p>{section.body}</p></article>)}</div>
              <aside className="learning-scenario"><span>TRY THIS SCENARIO</span><p>{activeModule.scenario}</p></aside>

              {!quizOpen && !result && <button className="primary learning-start" onClick={startQuiz}>Start the knowledge check <span>→</span></button>}

              {quizOpen && !result && <form className="learning-quiz" onSubmit={submitQuiz}>
                <div className="learning-quiz-heading"><div><span className="eyebrow">KNOWLEDGE CHECK</span><h3>Choose the best answer</h3></div><small>Pass mark: 2 of {activeModule.questions.length}</small></div>
                {activeModule.questions.map((question, questionIndex) => <fieldset className="learning-question" key={question.id}><legend><span>QUESTION {questionIndex + 1}</span>{question.prompt}</legend><div className="learning-options">{question.choices.map((choice, choiceIndex) => <label className={`learning-option ${answers[questionIndex] === choiceIndex ? "checked" : ""}`} key={choice}><input type="radio" name={question.id} value={choiceIndex} checked={answers[questionIndex] === choiceIndex} onChange={() => setAnswers((current) => current.map((answer, index) => index === questionIndex ? choiceIndex : answer))}/><span>{choice}</span></label>)}</div></fieldset>)}
                <div className="learning-submit-row"><p>There is no timer. Your score does not depend on speed.</p><button className="primary" disabled={!answeredAll || busy}>{busy ? "Saving your result…" : "Submit knowledge check"} <span>→</span></button></div>
              </form>}

              {result && <section className={`learning-result ${result.passed ? "passed" : "retry"}`} aria-live="polite"><div className="learning-result-heading"><span className="learning-result-icon" aria-hidden="true">{result.passed ? "✓" : "↻"}</span><div><div className="eyebrow">{result.passed ? "MODULE PASSED" : "KEEP PRACTICING"}</div><h3>{result.score} of {result.questionCount} correct</h3><p>{result.passed ? "You showed enough understanding to continue. Review the explanations, then open the next module when you are ready." : "Read the explanations, revisit the lesson, and try again. Your next module stays available once you pass."}</p></div></div><div className="learning-answer-review">{activeModule.questions.map((question, index) => { const item = result.feedback[index]; return <article className="learning-answer" key={question.id}><strong>{item.correct ? "✓ Correct" : "Review this one"} · Question {index + 1}</strong><p>{item.explanation}</p>{!item.correct && <small>Best answer: {question.choices[item.correctIndex]}</small>}</article>; })}</div><div className="learning-result-actions">{nextModule && nextIsAvailable ? <button className="primary" onClick={continuePath}>Continue to {nextModule.title} <span>→</span></button> : result.passed ? <span className="learning-path-complete">✓ You completed this path. All ten modules are passed.</span> : <button className="secondary" onClick={startQuiz}>Try the knowledge check again <span>↻</span></button>}</div></section>}
            </section>
          )}
        </div>
        <p className="learning-integrity-note">Learning-path results are private practice progress. They are separate from assessment evidence and are not shared with recruiters.</p>
      </>}
    </div>
  </main>;
}
