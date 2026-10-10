"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

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

function moduleState(index: number, modules: PublicModule[], progress: Record<string, ModuleProgress>, pathSlug: string) {
  if (progress[progressKey(pathSlug, modules[index].slug)]?.passed) return "Passed" as const;
  if (index === 0 || progress[progressKey(pathSlug, modules[index - 1].slug)]?.passed) return "Ready" as const;
  return "Locked" as const;
}

export default function LearningPathsClient() {
  const remote = process.env.NEXT_PUBLIC_BACKEND_MODE === "supabase";
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});
  const [activePathSlug, setActivePathSlug] = useState("");
  const [activeModuleSlug, setActiveModuleSlug] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      } catch (problem) {
        if (live) setError(problem instanceof Error ? problem.message : "Could not load the learning paths.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [remote]);

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
    setAnswers([]); setResult(null); setQuizOpen(false); setError("");
  };

  const selectModule = (module: PublicModule, index: number) => {
    if (!activePath || moduleState(index, activePath.modules, progress, activePath.slug) === "Locked") return;
    setActiveModuleSlug(module.slug); setAnswers([]); setResult(null); setQuizOpen(false); setError("");
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

  return <main className="learning-page">
    <header className="learning-topbar"><Link className="brand" href="/"><span className="brand-mark">N</span><span>nextlearn</span></Link><div className="learning-top-actions"><span className="learning-progress-chip">Progress is earned through understanding</span><Link href="/" className="secondary">← Debugging workspace</Link></div></header>
    <div className="learning-content">
      <section className="learning-hero"><div><div className="eyebrow">LEARN · PRACTICE · SHOW UNDERSTANDING</div><h1>Choose your next path.</h1><p>Short lessons, practical scenarios, and knowledge checks. Pass a module to open the next one; take your time and retry whenever you need.</p></div><div className="learning-hero-mark" aria-hidden="true"><span>03</span><small>learning paths</small></div></section>

      {error && <div className="notice error" role="status">{error}</div>}

      <section className="learning-path-grid" aria-label="Learning paths">
        {pathProgress.map(({ path, passed }) => <button key={path.slug} className={`learning-path-card ${path.accent} ${activePathSlug === path.slug ? "selected" : ""}`} onClick={() => selectPath(path)} aria-pressed={activePathSlug === path.slug}>
          <span className="learning-path-icon" aria-hidden="true">{path.icon}</span><span className="learning-path-subtitle">{path.subtitle}</span><strong>{path.title}</strong><span className="learning-path-description">{path.description}</span><span className="learning-path-card-footer"><span>{passed} / {path.modules.length} modules passed</span><span aria-hidden="true">→</span></span>
        </button>)}
      </section>

      {activePath && <>
        <section className="learning-path-heading"><div><div className="eyebrow">{activePath.subtitle.toUpperCase()}</div><h2>{activePath.title}</h2><p>{activePath.description}</p></div><div className="learning-path-count"><strong>{passedCount}<span> / {activePath.modules.length}</span></strong><small>modules passed</small></div></section>

        <div className="learning-workspace">
          <aside className="learning-map" aria-label={`${activePath.title} module map`}><div className="learning-map-heading"><span>PATH MAP</span><span>{passedCount} passed</span></div>{activePath.modules.map((module, index) => {
            const state = moduleState(index, activePath.modules, progress, activePath.slug);
            const moduleProgress = progress[progressKey(activePath.slug, module.slug)];
            const selected = activeModuleSlug === module.slug;
            return <button key={module.slug} className={`learning-node ${state.toLowerCase()} ${selected ? "current" : ""}`} onClick={() => selectModule(module, index)} disabled={state === "Locked"} aria-current={selected ? "step" : undefined}>
              <span className="learning-node-symbol" aria-hidden="true">{state === "Passed" ? "✓" : state === "Ready" ? String(index + 1).padStart(2, "0") : "·"}</span><span className="learning-node-copy"><strong>{module.title}</strong><small>{state}{moduleProgress?.attempts ? ` · ${moduleProgress.attempts} ${moduleProgress.attempts === 1 ? "attempt" : "attempts"}` : ""}</small></span><span className="learning-node-arrow" aria-hidden="true">{selected ? "●" : ""}</span>
            </button>;
          })}</aside>

          {activeModule && <section className="learning-module">
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
          </section>}
        </div>
        <p className="learning-integrity-note">Learning-path results are private practice progress. They are separate from assessment evidence and are not shared with recruiters.</p>
      </>}
    </div>
  </main>;
}
