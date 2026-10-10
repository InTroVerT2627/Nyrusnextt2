"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import CodeEditor from "@/components/CodeEditor";
import LandingPage from "@/components/LandingPage";
import NyerasSimulation from "@/components/NyerasSimulation";
import RoleSwitcher, { type DemoRole } from "@/components/RoleSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import FailureScenarios from "@/components/FailureScenarios";
import ValidationPage from "@/components/ValidationPage";
import CalibrationPanel from "@/components/CalibrationPanel";
import {
  MissionIcon,
  TreeIcon,
  EvidenceIcon,
  RecruiterIcon,
  ReviewIcon,
  AuditIcon,
  LabIcon,
  ValidationIcon,
  ShieldIcon,
  NyerasIcon,
  CheckIcon,
  LockIcon,
  RefreshIcon,
} from "@/components/Icons";

type Role = "learner" | "recruiter" | "reviewer";
type Section =
  | "Overview"
  | "Nyeras LMS"
  | "Missions"
  | "Skill tree"
  | "My evidence"
  | "Recruiter preview"
  | "Review queue"
  | "Audit log"
  | "Failure scenarios"
  | "Validation";

type Mission = {
  id: string;
  slug: string;
  language: string;
  difficulty: string;
  skill_node_id: number;
  mission_json: {
    title: string;
    short_title: string;
    severity: string;
    description: string;
    symptom: string;
    plain_task: string;
  };
  version: {
    id: string;
    version: number;
    prompt: string;
    starterCode: string;
    reportHeadings: string[];
  };
  visibleTests: { title: string; input: unknown; expected: unknown }[];
  rubric: {
    version: number;
    criteria: {
      criteria: { id: string; title: string; weight: number; max: number; source: string }[];
    };
  };
};

type Attempt = {
  id: string;
  task_version_id: string | null;
  rubric_id: string | null;
  boss_round_id: string | null;
  attempt_type: "mission" | "boss";
  code: string;
  explanation_json: {
    report?: Record<string, string>;
    selected_question_ids?: string[];
    gap_tags?: string[];
    test_summary?: Record<string, number | boolean>;
    decision?: string;
    flagged_lines?: number[];
  };
  ai_disclosure: boolean;
  submitted_at: string;
};

type Score = {
  id: string;
  attempt_id: string;
  criterion: string;
  score: number;
  max_score: number;
  source: string;
  feedback: string;
  confidence: string;
  run_scores: number[] | null;
  created_at: string;
};

type Followup = {
  id: string;
  attempt_id: string;
  bank_id: string | null;
  bank_version: number;
  position: number;
  gap_tags: string[];
  question_shown: string;
  answer_text: string | null;
  score: number | null;
  ai_reason: string | null;
  evidence_quote: string | null;
  run_scores: number[] | null;
  answered_at: string | null;
};

type Evidence = {
  id: string;
  attempt_id: string;
  skill: string;
  language: string;
  level: string;
  confidence: string;
  assessed_at: string;
};

type Consent = {
  skill: string;
  scope: string;
  include_submissions: boolean;
  shared: boolean;
  granted_at: string | null;
  revoked_at: string | null;
};

type Profile = {
  user: { id: string; displayName: string; role: Role; syntheticCandidateId: string };
  attempts: Attempt[];
  criterionScores: Score[];
  followups: Followup[];
  evidence: Evidence[];
  consents: Consent[];
  appeals: {
    id: string;
    attempt_id: string;
    criterion: string;
    reason: string;
    status: string;
    resolution: string | null;
  }[];
};

type SelectedQuestion = { id: string; position: number; question: string; bankVersion?: number };
type Assessment = {
  attemptId: string;
  confidence: string;
  status: string;
  feedback: string;
  scores: Record<string, number>;
  visibleTests: { title: string; passed: boolean; compileError?: string }[];
  hiddenSummary: { passed: boolean; count: number };
  questions: SelectedQuestion[];
};

type ApiError = { error: string };

const criterionNames: Record<string, string> = {
  fix_correctness: "Fix correctness",
  edge_cases: "Edge-case handling",
  root_cause: "Root-cause identification",
  explanation: "Explanation clarity",
  followup_reasoning: "Follow-up reasoning",
  failing_test: "Failing test validity",
  flaw_located: "Flaw located",
  flaw_explanation: "Flaw explanation",
};

const pathByRole: Record<Role, Section[]> = {
  learner: [
    "Overview",
    "Nyeras LMS",
    "Missions",
    "Skill tree",
    "My evidence",
    "Failure scenarios",
    "Validation",
    "Audit log",
  ],
  recruiter: ["Recruiter preview", "Overview", "Validation", "Audit log"],
  reviewer: ["Review queue", "Overview", "Failure scenarios", "Validation", "Audit log"],
};

function renderNavIcon(name: Section) {
  switch (name) {
    case "Overview":
      return <ShieldIcon size={16} />;
    case "Nyeras LMS":
      return <NyerasIcon size={16} />;
    case "Missions":
      return <MissionIcon size={16} />;
    case "Skill tree":
      return <TreeIcon size={16} />;
    case "My evidence":
      return <EvidenceIcon size={16} />;
    case "Recruiter preview":
      return <RecruiterIcon size={16} />;
    case "Review queue":
      return <ReviewIcon size={16} />;
    case "Audit log":
      return <AuditIcon size={16} />;
    case "Failure scenarios":
      return <LabIcon size={16} />;
    case "Validation":
      return <ValidationIcon size={16} />;
  }
}

async function api<T>(path: string, init: RequestInit = {}) {
  const demoRole = typeof window !== "undefined" ? localStorage.getItem("nextlearn.demo_role") : null;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(demoRole ? { "x-demo-role": demoRole } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const body = (await response.json().catch(() => ({ error: "The server returned an unreadable response." }))) as
    | T
    | ApiError;
  if (!response.ok) throw new Error((body as ApiError).error ?? `Request failed (${response.status}).`);
  return body as T;
}

export default function RemoteHome() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [section, setSection] = useState<Section>("Overview");
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [activeBoss, setActiveBoss] = useState<Record<string, unknown> | null>(null);
  const [attempt, setAttempt] = useState<Assessment | null>(null);
  const [question, setQuestion] = useState<SelectedQuestion | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [answerBusy, setAnswerBusy] = useState(false);
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<Profile | { user: { id: string; displayName: string; role: Role } }>("/api/profile");
      if (!("attempts" in data)) {
        setProfile({
          user: { ...data.user, syntheticCandidateId: "" },
          attempts: [],
          criterionScores: [],
          followups: [],
          evidence: [],
          consents: [],
          appeals: [],
        });
        setSection(
          data.user.role === "recruiter"
            ? "Recruiter preview"
            : data.user.role === "reviewer"
            ? "Review queue"
            : "Overview"
        );
      } else {
        setProfile(data);
        setSection((current) => (pathByRole[data.user.role].includes(current) ? current : "Overview"));
      }
      const currentRole = "attempts" in data ? data.user.role : data.user.role;
      if (currentRole === "learner") {
        const taskData = await api<{ missions: Mission[] }>("/api/missions");
        setMissions(taskData.missions);
      } else {
        setMissions([]);
      }
      setSignedOut(false);
    } catch (problem) {
      const text = problem instanceof Error ? problem.message : "Could not load Nextlearn.";
      if (text.includes("Sign in")) {
        setSignedOut(true);
      } else setError(text);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (section !== "Skill tree" || profile?.user.role !== "learner") return;
    let live = true;
    api<Record<string, unknown>>("/api/boss")
      .then((data) => {
        if (live) setActiveBoss(data);
      })
      .catch(() => {
        if (live) setActiveBoss(null);
      });
    return () => {
      live = false;
    };
  }, [section, profile?.user.role]);

  const nav = profile ? pathByRole[profile.user.role] : [];
  const evidenced = useMemo(() => {
    const openAppeals = new Set(
      (profile?.appeals ?? []).filter((item) => ["open", "in_review"].includes(item.status)).map((item) => item.attempt_id)
    );
    return new Set(
      (profile?.evidence ?? [])
        .filter((item) => item.level !== "insufficient" && ["high", "medium"].includes(item.confidence) && !openAppeals.has(item.attempt_id))
        .map((item) => item.attempt_id)
    );
  }, [profile]);

  const latestEvidenceByAttempt = useMemo(() => {
    const map = new Map<string, Evidence>();
    for (const item of [...(profile?.evidence ?? [])].sort((a, b) => b.assessed_at.localeCompare(a.assessed_at)))
      if (!map.has(item.attempt_id)) map.set(item.attempt_id, item);
    return map;
  }, [profile]);

  const selectSection = (value: Section) => {
    setSection(value);
    setActiveMission(null);
    setActiveAttempt(null);
    setAttempt(null);
    setQuestion(null);
    setError("");
    setMessage("");
  };

  const signOut = async () => {
    const client = createSupabaseBrowserClient();
    await client?.auth.signOut();
    localStorage.removeItem("nextlearn.demo_role");
    await fetch("/api/auth/demo-switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "reset" }),
    });
    router.replace("/login");
    router.refresh();
  };

  const beginMission = (mission: Mission) => {
    setActiveMission(mission);
    setActiveAttempt(null);
    setAttempt(null);
    setQuestion(null);
    setQuestionAnswer("");
    setError("");
    setMessage("");
  };

  const submitMission = async (form: FormData) => {
    if (!activeMission) return;
    setError("");
    setAnswerBusy(true);
    const report = {
      what_broke: String(form.get("what_broke") ?? ""),
      why_it_broke: String(form.get("why_it_broke") ?? ""),
      the_fix: String(form.get("the_fix") ?? ""),
      how_to_prevent: String(form.get("how_to_prevent") ?? ""),
    };
    try {
      const result = await api<Assessment>("/api/assessment/submit", {
        method: "POST",
        body: JSON.stringify({
          taskSlug: activeMission.slug,
          code: String(form.get("code") ?? ""),
          report,
          aiDisclosure: form.get("ai_disclosure") === "on",
        }),
      });
      setAttempt(result);
      setQuestion(result.questions[0] ?? null);
      setQuestionAnswer("");
      setMessage(
        result.status === "review_required"
          ? "Tests are recorded in Judge0. Reasoning needs human review because the grader detected uncertainty."
          : "Deterministic tests passed. Answer the follow-up question to complete your evidence card."
      );
      if (result.questions.length === 0) {
        setActiveMission(null);
        setSection("My evidence");
        await refresh();
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Submission failed.");
    } finally {
      setAnswerBusy(false);
    }
  };

  const submitFollowup = async () => {
    if (!attempt || !question || !questionAnswer.trim()) return;
    setAnswerBusy(true);
    setError("");
    try {
      const result = await api<{
        complete: boolean;
        nextQuestion?: SelectedQuestion;
        confidence?: string;
        followupScore?: number;
        earlyStop?: boolean;
      }>("/api/assessment/answer", {
        method: "POST",
        body: JSON.stringify({
          attemptId: attempt.attemptId,
          questionId: question.id,
          position: question.position,
          answer: questionAnswer,
        }),
      });
      if (result.complete) {
        setQuestion(null);
        setAttempt(null);
        setActiveMission(null);
        setSection("My evidence");
        setMessage(
          `Attempt recorded with ${result.confidence} confidence. ${
            result.earlyStop ? "Strong, consistent answers ended the question loop early." : "Your evidence card is ready."
          }`
        );
        await refresh();
      } else {
        setQuestion(result.nextQuestion ?? null);
        setQuestionAnswer("");
        setMessage("Answer saved. One targeted follow-up remains.");
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not save this follow-up.");
    } finally {
      setAnswerBusy(false);
    }
  };

  const saveConsent = async (skill: string, shared: boolean, includeSubmissions: boolean) => {
    setError("");
    try {
      const result = await api<{ handoff: { mode: string; delivered: boolean } }>("/api/consent", {
        method: "POST",
        body: JSON.stringify({ skill, shared, includeSubmissions }),
      });
      setMessage(
        shared
          ? `Sharing enabled. NxtMove handoff: ${result.handoff.delivered ? "delivered" : result.handoff.mode}.`
          : `Sharing revoked. Recruiter search hides this skill immediately.`
      );
      await refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Consent could not be saved.");
    }
  };

  const sendAppeal = async (attemptId: string, criterion: string, reason: string) => {
    await api(`/api/attempts/${attemptId}/appeal`, {
      method: "POST",
      body: JSON.stringify({ criterion, reason }),
    });
    setActiveAttempt(null);
    setMessage("Challenge sent to the human review queue.");
    await refresh();
  };

  if (loading && !profile && !signedOut) {
    return (
      <main className="remote-loading" style={{ display: "grid", placeContent: "center", minHeight: "100vh", textAlign: "center", gap: 14 }}>
        <div className="brand-mark" style={{ margin: "0 auto" }}>N</div>
        <p>Connecting to isolated sandbox workspace…</p>
      </main>
    );
  }

  if (signedOut) {
    return (
      <main className="login-shell">
        <Link className="brand" href="/"><span className="brand-mark">N</span><span>nextlearn</span></Link>
        <div className="login-card">
          <div className="eyebrow">NEXTLEARN SECURE WORKSPACE</div>
          <h1>Sign in to continue</h1>
          <p>Your assessment submissions, private tests, consent settings, and evidence live in the authenticated workspace.</p>
          {error && <div className="notice error">{error}</div>}
          <Link className="primary" href="/login">Sign in or create an account <span>→</span></Link>
          <p className="login-note">Evidence is experimental and is not a validated predictor of job performance.</p>
        </div>
      </main>
    );
  }

  const activeRole: DemoRole = (profile?.user.role as DemoRole) || "learner";

  return (
    <main className="shell">
      {/* Sidebar Rail */}
      <aside className="rail" aria-label="Main navigation">
        <button
          className="brand"
          style={{ background: "transparent", border: 0, padding: "0 10px 24px", cursor: "pointer", width: "100%", textAlign: "left" }}
          onClick={() => selectSection("Overview")}
        >
          <span className="brand-mark">N</span>
          <span>ProofLoop</span>
        </button>

        <div className="rail-label">{profile?.user.role.toUpperCase()} PORTAL</div>

        {profile?.user.role === "learner" && (
          <Link className="nav-link" href="/learning">
            <span className="nav-icon" aria-hidden="true"><MissionIcon size={16} /></span>
            Learning paths
          </Link>
        )}

        {nav.map((item) => (
          <button
            key={item}
            className={`nav-link ${section === item ? "active" : ""}`}
            onClick={() => selectSection(item)}
          >
            <span className="nav-icon" aria-hidden="true">{renderNavIcon(item)}</span>
            {item}
          </button>
        ))}

        <div className="rail-bottom">
          <div className="avatar">{profile?.user.displayName.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{profile?.user.displayName}</strong>
            <small>{profile?.user.syntheticCandidateId || profile?.user.role}</small>
          </div>
          <button className="more-button" onClick={signOut} aria-label="Sign out" title="Sign out">↪</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="main-area" id="top">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Nextlearn</span> <span>/</span>{" "}
            <strong>
              {activeMission?.mission_json.title ??
                (activeBoss && section === "Skill tree" ? "Boss round" : section)}
            </strong>
          </div>

          <div className="top-actions">
            <RoleSwitcher
              currentRole={activeRole}
              onRoleChange={async () => {
                await refresh();
              }}
            />
            <span className="sandbox-pill">
              <i /> Judge0 CE + Gemini 3.8 Flash
            </span>
            <ThemeToggle />
            <button className="icon-button" aria-label="Refresh workspace" onClick={() => void refresh()} title="Refresh data">
              <RefreshIcon size={15} />
            </button>
          </div>
        </header>

        {/* Mobile Navigation */}
        <nav className="remote-mobile-nav" aria-label="Mobile navigation">
          {nav.slice(0, 4).map((item) => (
            <button key={item} className={section === item ? "active" : ""} onClick={() => selectSection(item)}>
              {item}
            </button>
          ))}
        </nav>

        <div className="content">
          {error && (
            <div className="notice error" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss">×</button>
            </div>
          )}
          {message && (
            <div className="notice" role="status">
              <span>{message}</span>
              <button onClick={() => setMessage("")} aria-label="Dismiss">×</button>
            </div>
          )}

          {activeMission ? (
            <MissionEditor
              mission={activeMission}
              busy={answerBusy}
              attempt={attempt}
              question={question}
              answer={questionAnswer}
              setAnswer={setQuestionAnswer}
              onSubmit={submitMission}
              onAnswer={submitFollowup}
              onBack={() => {
                setActiveMission(null);
                void refresh();
              }}
            />
          ) : activeBoss && section === "Skill tree" ? (
            <BossEditor
              boss={activeBoss}
              onBack={() => {
                setActiveBoss(null);
                void refresh();
              }}
              onComplete={async () => {
                setActiveBoss(null);
                setSection("My evidence");
                await refresh();
                setMessage("Boss assessment and follow-up are recorded in the separate AI-code review evidence card.");
              }}
            />
          ) : section === "Overview" ? (
            <LandingPage
              onEnterLearner={() => selectSection("Missions")}
              onEnterNyeras={() => selectSection("Nyeras LMS")}
              onEnterRecruiter={() => selectSection("Recruiter preview")}
              onEnterScenarios={() => selectSection("Failure scenarios")}
              onEnterValidation={() => selectSection("Validation")}
            />
          ) : section === "Nyeras LMS" ? (
            <NyerasSimulation onProveSkill={() => selectSection("Missions")} />
          ) : section === "Missions" ? (
            <MissionsView
              missions={missions}
              attempts={profile?.attempts ?? []}
              evidence={evidenced}
              onStart={beginMission}
              onTree={() => selectSection("Skill tree")}
            />
          ) : section === "Skill tree" ? (
            <TreeView
              missions={missions}
              evidence={evidenced}
              attempts={profile?.attempts ?? []}
              evidenceByAttempt={latestEvidenceByAttempt}
              boss={activeBoss}
              onStart={beginMission}
              onBoss={() =>
                void api<Record<string, unknown>>("/api/boss")
                  .then(setActiveBoss)
                  .catch((problem) =>
                    setError(problem instanceof Error ? problem.message : "Boss round could not be opened.")
                  )
              }
            />
          ) : section === "My evidence" ? (
            <ProfileView profile={profile!} onConsent={saveConsent} onOpen={setActiveAttempt} />
          ) : section === "Recruiter preview" ? (
            <RecruiterView />
          ) : section === "Review queue" ? (
            <ReviewView
              onDone={async () => {
                await refresh();
                setMessage("Reviewer decision was recorded with its written rationale.");
              }}
            />
          ) : section === "Failure scenarios" ? (
            <FailureScenarios />
          ) : section === "Validation" ? (
            <ValidationPage />
          ) : (
            <AuditView />
          )}
        </div>
      </section>

      {activeAttempt && (
        <AttemptDialog
          profile={profile!}
          attempt={activeAttempt}
          onClose={() => setActiveAttempt(null)}
          onAppeal={sendAppeal}
        />
      )}
    </main>
  );
}

/* =========================================================================
   SUB-VIEWS & EDITORS
   ========================================================================= */

function MissionsView({
  missions,
  attempts,
  evidence,
  onStart,
  onTree,
}: {
  missions: Mission[];
  attempts: Attempt[];
  evidence: Set<string>;
  onStart: (m: Mission) => void;
  onTree: () => void;
}) {
  const nodes = [1, 2, 3, 4].map((id) => missions.find((item) => item.skill_node_id === id));
  const completedSlugs = new Set(
    missions
      .filter((mission) => attempts.some((attempt) => attempt.task_version_id === mission.version.id && evidence.has(attempt.id)))
      .map((mission) => mission.slug)
  );

  const unlocked = (mission: Mission) =>
    mission.slug === "find-max" ||
    ((mission.slug === "remove-duplicates" || mission.slug === "async-results") && completedSlugs.has("find-max")) ||
    (mission.slug === "customer-key" && completedSlugs.has("remove-duplicates") && completedSlugs.has("async-results"));

  return (
    <>
      <section className="welcome">
        <div>
          <div className="eyebrow">AUTHENTICATED LEARNER WORKSPACE</div>
          <h1>Show what you can do.</h1>
          <p>
            Submit executable work to an isolated Judge0 code runner. Hidden edge cases remain server-side; your evidence stays under your control.
          </p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-card">
            <span>evidence</span>
            <b>✓</b>
          </div>
        </div>
      </section>

      <section className="progress-row">
        <div className="progress-copy">
          <span className="progress-icon"><MissionIcon size={18} /></span>
          <div>
            <strong>Your debugging path</strong>
            <small>Progress follows demonstrated understanding</small>
          </div>
        </div>
        <div className="path-nodes">
          {nodes.map((node, index) => (
            <span className={`node ${node && completedSlugs.has(node.slug) ? "done" : ""}`} key={index}>
              {node && completedSlugs.has(node.slug) ? <CheckIcon size={12} /> : index + 1}
            </span>
          ))}
        </div>
        <div className="progress-count">
          <strong>{completedSlugs.size} <span>/ 4</span></strong>
          <small>{attempts.length} attempts · no time penalty</small>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <div className="eyebrow">PRODUCTION INCIDENT TICKETS</div>
          <h2>Choose an incident to investigate</h2>
        </div>
        <button className="text-button" onClick={onTree}>
          View skill tree <span>↗</span>
        </button>
      </div>

      <section className="mission-grid">
        {missions.map((mission, index) => (
          <article className="mission-card" key={mission.id}>
            <div className="card-top">
              <span className="mission-number">INCIDENT {String(index + 1).padStart(2, "0")}</span>
              <span className="severity">{mission.mission_json.severity}</span>
            </div>
            <div className="mission-illustration">
              <div className="code-window">
                <div className="window-dots"><i /><i /><i /></div>
                <div className="code-line short" />
                <div className="code-line" />
                <div className="code-line medium" />
              </div>
              <div className="mission-symbol">{renderNavIcon("Missions")}</div>
            </div>
            <div className="mission-body">
              <div className="mission-tags">
                <span>{mission.language}</span>
                <span>{mission.difficulty}</span>
              </div>
              <h3>{mission.mission_json.title}</h3>
              <p>{mission.mission_json.description}</p>
              <div className="card-footer">
                <span className={completedSlugs.has(mission.slug) ? "ready" : "locked"}>
                  {completedSlugs.has(mission.slug) ? "✓ Evidenced" : unlocked(mission) ? "◌ Available" : "◌ Locked"}
                </span>
                <button
                  disabled={!unlocked(mission)}
                  title={unlocked(mission) ? "Open mission" : "Complete the prerequisite mission first"}
                  onClick={() => onStart(mission)}
                >
                  {unlocked(mission) ? "Open mission" : "Locked"} <span>→</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rubric-panel">
        <div className="rubric-intro">
          <div className="rubric-icon"><ValidationIcon size={20} /></div>
          <div>
            <div className="eyebrow">CLEAR BEFORE YOU BEGIN</div>
            <h2>Visible assessment rubric</h2>
            <p>Tests determine correctness in Judge0. Gemini scores reasoning against fixed descriptors; human review resolves uncertainty.</p>
          </div>
        </div>
        <div className="rubric-table">
          {missions[0]?.rubric.criteria.criteria.map((item) => (
            <div className="table-row" key={item.id}>
              <span>{item.title}</span>
              <strong>{item.weight}%</strong>
              <span>
                {item.source === "tests" ? "Visible + hidden tests" : item.source === "ai" ? "Gemini · two runs" : "Fixed question bank"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="disclaimer">
        <span>ⓘ</span>
        <p>Evidence reflects these tasks only. It is not a validated predictor of job performance or a hiring recommendation.</p>
      </div>
    </>
  );
}

function MissionEditor({
  mission,
  busy,
  attempt,
  question,
  answer,
  setAnswer,
  onSubmit,
  onAnswer,
  onBack,
}: {
  mission: Mission;
  busy: boolean;
  attempt: Assessment | null;
  question: SelectedQuestion | null;
  answer: string;
  setAnswer: (value: string) => void;
  onSubmit: (data: FormData) => void;
  onAnswer: () => void;
  onBack: () => void;
}) {
  const [plainTaskView, setPlainTaskView] = useState(false);
  const [codeValue, setCodeValue] = useState(mission.version.starterCode);
  const headings = mission.version.reportHeadings.length
    ? mission.version.reportHeadings
    : ["What broke", "Why it broke", "The fix", "How to prevent it"];
  const keys = ["what_broke", "why_it_broke", "the_fix", "how_to_prevent"];

  return (
    <>
      <button className="back-link" onClick={onBack}>
        ← Back to incident missions
      </button>

      <section className="workspace-heading">
        <div>
          <div className="eyebrow">
            {plainTaskView ? "PLAIN TASK VIEW" : `INCIDENT MISSION · ${mission.mission_json.severity}`}
          </div>
          <h1>{plainTaskView ? `${mission.language} task` : mission.mission_json.title}</h1>
          <p>
            {plainTaskView
              ? "The incident story is hidden. The visible tests and rubric stay identical."
              : mission.mission_json.description}
          </p>
        </div>
        <span className="severity">
          {mission.language} · {mission.difficulty}
        </span>
      </section>

      <div className="workspace-grid">
        <div className="workspace-primary">
          {/* Incident Ticket Panel */}
          <section className="panel ticket-panel">
            <div className="panel-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="panel-kicker">{plainTaskView ? "PLAIN TASK SPECIFICATION" : "INCIDENT TICKET"}</div>
              <button className="secondary" type="button" onClick={() => setPlainTaskView((c) => !c)}>
                {plainTaskView ? "Show incident story" : "Show plain task"}
              </button>
            </div>
            <p>{plainTaskView ? mission.mission_json.plain_task : mission.version.prompt}</p>
            {!plainTaskView && (
              <>
                <div className="panel-kicker">WHAT WE KNOW</div>
                <p>{mission.mission_json.description}</p>
                <div className="panel-kicker">REPORTED SYMPTOM</div>
                <p>{mission.mission_json.symptom}</p>
              </>
            )}
            <div className="panel-kicker">VISIBLE ACCEPTANCE TESTS</div>
            <ul className="visible-test-list">
              {mission.visibleTests.map((item, index) => (
                <li key={index}>
                  <strong>{item.title}</strong>
                  <code>
                    Input: {JSON.stringify(item.input)} · Expected: {JSON.stringify(item.expected)}
                  </code>
                </li>
              ))}
            </ul>
          </section>

          {/* Monaco Editor & Incident Report Form */}
          <form className="panel editor-panel" action={onSubmit}>
            <div className="panel-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="panel-kicker">MONACO CODE EDITOR</div>
                <h2>Fix defect and explain root cause</h2>
              </div>
              <span className="language-tag">{mission.language}</span>
            </div>

            {/* Monaco Editor */}
            <CodeEditor
              language={mission.language}
              value={codeValue}
              onChange={setCodeValue}
              minHeight="260px"
            />
            <input type="hidden" name="code" value={codeValue} />

            <div className="report-grid">
              {headings.slice(0, 4).map((heading, index) => (
                <label key={keys[index]}>
                  <span>{heading}</span>
                  <textarea
                    name={keys[index]}
                    required={index < 3}
                    placeholder={`Document: ${heading.toLowerCase()}`}
                    maxLength={2000}
                  />
                </label>
              ))}
            </div>

            <label className="check-row">
              <input type="checkbox" name="ai_disclosure" />
              <span>I used AI assistance while working (optional and never penalized).</span>
            </label>

            <div className="ai-disclosure">
              Deterministic tests run in Judge0 CE sandbox with CPU and memory limits. Gemini scores explanation reasoning in two runs.
            </div>

            <button className="primary" disabled={busy}>
              {busy ? "Running isolated tests in Judge0…" : "Submit incident report →"}
            </button>
          </form>

          {/* Assessment Feedback & Follow-Ups */}
          {attempt && (
            <section className="panel result-panel">
              <div className="panel-kicker">SERVER ASSESSMENT · ATTEMPT {attempt.attemptId.slice(0, 8)}</div>
              <h2>Criterion-level results</h2>
              <div className="score-grid">
                {Object.entries(attempt.scores).map(([id, value]) => (
                  <div className="score-cell" key={id}>
                    <span>{criterionNames[id] ?? id}</span>
                    <strong>{value}{id.includes("correctness") || id.includes("cases") ? "%" : ""}</strong>
                  </div>
                ))}
              </div>

              <div className="panel-kicker">VISIBLE TEST RESULTS</div>
              {attempt.visibleTests.map((item, index) => (
                <div className="test-result" key={index}>
                  <span className={item.passed ? "ready" : "locked"}>{item.passed ? "✓" : "×"}</span>
                  <span>{item.title}</span>
                  <strong>{item.passed ? "Pass" : "Needs work"}</strong>
                  {item.compileError && <small>{item.compileError}</small>}
                </div>
              ))}

              <div className={`result-banner ${attempt.hiddenSummary.passed ? "success" : "needs-work"}`}>
                <span>{attempt.hiddenSummary.passed ? "✓" : "!"}</span>
                <p>
                  Private edge-case suite: {attempt.hiddenSummary.passed ? "all cases passed" : "one or more edge cases failed"}. Individual hidden inputs and expected answers remain strictly private.
                </p>
              </div>

              <p className="feedback-copy">{attempt.feedback}</p>

              {attempt.status === "review_required" && (
                <div className="notice error">
                  <span>ⓘ Reasoning needs human review. Test scores are preserved, and an evaluator will review your explanation.</span>
                </div>
              )}

              {question && (
                <div className="question-card">
                  <span>ADAPTIVE FOLLOW-UP {question.position} · FIXED BANK V{question.bankVersion ?? 1}</span>
                  <strong>{question.question}</strong>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    maxLength={4000}
                    placeholder="Defend your reasoning in your own words"
                  />
                  <p className="fine-print">
                    Grammar and dialect are not penalized. Follow-up count affects confidence only; it never alters your criterion score.
                  </p>
                  <button className="primary" disabled={busy || !answer.trim()} onClick={onAnswer}>
                    {busy ? "Scoring twice in Gemini…" : "Submit follow-up answer"}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar Info */}
        <aside className="workspace-side">
          <section className="panel">
            <div className="panel-kicker">TASK CONFIGURATION</div>
            <h2>Versioned assessment</h2>
            <div className="rubric-mini"><span>Task version</span><b>v{mission.version.version}</b></div>
            <div className="rubric-mini"><span>Rubric version</span><b>v{mission.rubric.version}</b></div>
            <div className="rubric-mini"><span>Visible tests</span><b>{mission.visibleTests.length}</b></div>
            <div className="rubric-mini"><span>Private tests</span><b>Server only</b></div>
          </section>

          <section className="panel">
            <div className="panel-kicker">ASSESSMENT RULES</div>
            <p className="side-copy" style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: 1.6 }}>
              There is no timer or speed score. Unlocks follow demonstrated understanding only. Severity is descriptive and never a ranking.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}

function TreeView({
  missions,
  evidence,
  attempts,
  evidenceByAttempt,
  boss,
  onStart,
  onBoss,
}: {
  missions: Mission[];
  evidence: Set<string>;
  attempts: Attempt[];
  evidenceByAttempt: Map<string, Evidence>;
  boss: Record<string, unknown> | null;
  onStart: (mission: Mission) => void;
  onBoss: () => void;
}) {
  const completedSlugs = new Set(
    missions
      .filter((mission) => attempts.some((attempt) => attempt.task_version_id === mission.version.id && evidence.has(attempt.id)))
      .map((mission) => mission.slug)
  );

  const unlocked = (mission: Mission) =>
    mission.slug === "find-max" ||
    ((mission.slug === "remove-duplicates" || mission.slug === "async-results") && completedSlugs.has("find-max")) ||
    (mission.slug === "customer-key" && completedSlugs.has("remove-duplicates") && completedSlugs.has("async-results"));

  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">PROGRESSION FROM EVIDENCE</div>
        <h1>Your Bug-Type Skill Tree</h1>
        <p>
          Nodes light up from passing tests, demonstrated reasoning, sufficient confidence, and no open appeal.
          Every state is signaled with icons and text labels—never color alone.
        </p>
      </div>

      <section className="panel tree-panel">
        {missions.map((mission, index) => {
          const prior = attempts.find((item) => item.task_version_id === mission.version.id);
          const nodeEvidenced = attempts.some((item) => item.task_version_id === mission.version.id && evidence.has(item.id));
          const state = nodeEvidenced ? "Evidenced" : prior ? "Attempted" : unlocked(mission) ? "Available" : "Locked";

          return (
            <article className={`tree-node ${state.toLowerCase()}`} key={mission.id}>
              <span className="tree-number">
                {state === "Evidenced" ? <CheckIcon size={14} /> : state === "Locked" ? <LockIcon size={14} /> : index + 1}
              </span>
              <div className="tree-node-copy">
                <div className="panel-kicker">NODE {index + 1} · {mission.language} DEBUGGING</div>
                <h2>{mission.mission_json.short_title}</h2>
                <p>
                  {mission.skill_node_id === 1
                    ? "Starting node (Loop bounds)"
                    : mission.skill_node_id === 4
                    ? "Requires evidence for mutation and async flow"
                    : "Requires loop-bounds evidence"}
                </p>
                <span className="state-label">
                  {state}
                  {prior && evidenceByAttempt.has(prior.id) ? ` · ${evidenceByAttempt.get(prior.id)?.confidence} confidence` : ""}
                </span>
              </div>
              <button className="secondary" disabled={!unlocked(mission)} onClick={() => onStart(mission)}>
                {unlocked(mission) ? "Open mission" : "Locked"}
              </button>
            </article>
          );
        })}

        {/* Boss Round Node */}
        <article className={`tree-node boss-node ${boss?.unlocked ? "available" : "locked"}`}>
          <span className="tree-number">✦</span>
          <div className="tree-node-copy">
            <div className="panel-kicker">BOSS ROUND · REVIEWING AI-WRITTEN CODE</div>
            <h2>Catch the AI’s mistake</h2>
            <p>
              Reject the patch, flag the faulty line, and prove the failure with test assertions that pass on two independent correct reference implementations.
            </p>
            <span className="state-label">
              {boss?.unlocked
                ? `Available · ${boss.evidenced}/4 nodes evidenced`
                : `Locked · requires 3 evidenced nodes (${boss?.evidenced ?? 0}/3)`}
            </span>
          </div>
          <button className="secondary" disabled={!boss?.unlocked} onClick={onBoss}>
            {boss?.unlocked ? "Start boss round" : "Locked"}
          </button>
        </article>
      </section>

      <div className="disclaimer">
        <span>ⓘ</span>
        <p>A successful task lights its skill node. The boss round produces a separate AI-code review evidence card.</p>
      </div>
    </>
  );
}

function BossEditor({
  boss,
  onBack,
  onComplete,
}: {
  boss: Record<string, unknown>;
  onBack: () => void;
  onComplete: () => Promise<void>;
}) {
  const [decision, setDecision] = useState("reject");
  const [lines, setLines] = useState<number[]>([]);
  const [testCode, setTestCode] = useState('assertWords("  red   blue ", 2);');
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [question, setQuestion] = useState<SelectedQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [attemptId, setAttemptId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const flawed = String(boss.flawedCode ?? "");
  const codeLines = flawed.split("\n");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await api<Record<string, unknown>>("/api/boss/submit", {
        method: "POST",
        body: JSON.stringify({ decision, flaggedLines: lines, testCode, explanation }),
      });
      setResult(data);
      setAttemptId(String(data.attemptId));
      setQuestion((data.questions as SelectedQuestion[])?.[0] ?? null);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Boss submission failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async () => {
    if (!question || !attemptId) return;
    setBusy(true);
    setError("");
    try {
      const data = await api<{ complete: boolean; nextQuestion?: SelectedQuestion }>("/api/assessment/answer", {
        method: "POST",
        body: JSON.stringify({ attemptId, questionId: question.id, position: question.position, answer }),
      });
      if (data.complete) {
        await onComplete();
      } else {
        setQuestion(data.nextQuestion ?? null);
        setAnswer("");
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Boss follow-up failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="back-link" onClick={onBack}>
        ← Back to skill tree
      </button>

      <div className="page-intro">
        <div className="eyebrow">BOSS ROUND · FIXED AI-STYLE PATCH</div>
        <h1>{String(boss.title ?? "Catch the AI’s mistake")}</h1>
        <p>
          Review the suggested AI patch. Reject or accept it. To reject it, flag the faulty line and write assertions that fail on the patch and pass on two independent reference versions.
        </p>
      </div>

      <div className="workspace-grid">
        <div className="workspace-primary">
          <section className="panel">
            <div className="panel-kicker">AI-GENERATED SUGGESTION · PRE-WRITTEN</div>
            <div className="boss-code">
              {codeLines.map((line, index) => (
                <button
                  className={lines.includes(index + 1) ? "flagged-line" : ""}
                  key={index}
                  onClick={() =>
                    setLines((old) =>
                      old.includes(index + 1) ? old.filter((item) => item !== index + 1) : [...old, index + 1]
                    )
                  }
                >
                  <span>{index + 1}</span>
                  <code>{line}</code>
                  <em>{lines.includes(index + 1) ? "Flagged" : "Click to flag"}</em>
                </button>
              ))}
            </div>

            <div className="decision-row">
              <button
                className={`decision ${decision === "accept" ? "selected" : ""}`}
                onClick={() => setDecision("accept")}
              >
                Accept suggestion
              </button>
              <button
                className={`decision ${decision === "reject" ? "selected" : ""}`}
                onClick={() => setDecision("reject")}
              >
                Reject suggestion
              </button>
            </div>

            {decision === "reject" && (
              <div style={{ margin: "14px 0" }}>
                <label className="field-label" style={{ fontWeight: 700, fontSize: "11px", marginBottom: "6px", display: "block" }}>
                  Write test assertions (one per line):
                </label>
                <CodeEditor
                  language="javascript"
                  value={testCode}
                  onChange={setTestCode}
                  minHeight="120px"
                />
                <small style={{ color: "var(--text-dim)", fontSize: "10px", display: "block", marginTop: "4px" }}>
                  Form: assertWords(&quot;  red   blue &quot;, 2); Trivial assertions like assert false are rejected.
                </small>
              </div>
            )}

            <label className="field-label" style={{ fontWeight: 700, fontSize: "11px", marginBottom: "6px", display: "block" }}>
              Explain which input exposes the flaw
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                maxLength={3000}
                placeholder="Name the incorrect behavior and a specific input that triggers it"
                style={{ width: "100%", minHeight: "60px", marginTop: "6px" }}
              />
            </label>

            {error && <div className="notice error">{error}</div>}

            {!result && (
              <button className="primary" disabled={busy || !explanation.trim()} onClick={() => void submit()}>
                {busy ? "Running three isolated variants in Judge0…" : "Submit boss review"}
              </button>
            )}

            {result && (
              <>
                <div className="score-grid">
                  {Object.entries(result.scores as Record<string, number>).map(([key, value]) => (
                    <div className="score-cell" key={key}>
                      <span>{criterionNames[key] ?? key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="result-banner success">
                  <span>✓</span>
                  <p>
                    Three isolated test runs completed. Flawed patch:{" "}
                    {String((result.checks as Record<string, boolean>)?.failsOnFlawed)} · reference:{" "}
                    {String((result.checks as Record<string, boolean>)?.passesOnReference)} · alternate:{" "}
                    {String((result.checks as Record<string, boolean>)?.passesOnAlternate)}
                  </p>
                </div>

                {question && (
                  <div className="question-card">
                    <span>BOSS FOLLOW-UP {question.position}</span>
                    <strong>{question.question}</strong>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      maxLength={4000}
                      placeholder="Explain your reasoning"
                    />
                    <button className="primary" disabled={busy || !answer.trim()} onClick={() => void submitAnswer()}>
                      {busy ? "Scoring answer…" : "Submit answer"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="workspace-side">
          <section className="panel">
            <div className="panel-kicker">BOSS RUBRIC</div>
            <h2>Independent checks</h2>
            {[
              ["Test fails on patch; passes on both references", "40%"],
              ["Flaw line located", "15%"],
              ["Flaw explanation", "25%"],
              ["Follow-up reasoning", "20%"],
            ].map(([label, weight]) => (
              <div className="rubric-mini" key={label}>
                <span>{label}</span>
                <b>{weight}</b>
              </div>
            ))}
          </section>

          <section className="panel safety-panel">
            <span>ⓘ</span>
            <p>
              The flawed patch is visible. Reference solutions remain server-side. Trivial assertions are rejected.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}

function ProfileView({
  profile,
  onConsent,
  onOpen,
}: {
  profile: Profile;
  onConsent: (skill: string, shared: boolean, include: boolean) => void;
  onOpen: (attempt: Attempt) => void;
}) {
  const deb = profile.consents.find((item) => item.skill === "debugging");
  const boss = profile.consents.find((item) => item.skill === "reviewing-ai-written-code");
  const da = profile.consents.find((item) => item.skill === "data-analytics");
  const ba = profile.consents.find((item) => item.skill === "business-analytics");
  const comm = profile.consents.find((item) => item.skill === "workplace-communication");
  const cards = [
    { skill: "debugging", label: "Debugging evidence", consent: deb },
    { skill: "reviewing-ai-written-code", label: "AI-code review evidence", consent: boss },
    { skill: "data-analytics", label: "Data Analytics evidence", consent: da },
    { skill: "business-analytics", label: "Business Analytics evidence", consent: ba },
    { skill: "workplace-communication", label: "Workplace Communication evidence", consent: comm },
  ];

  const newest = new Map<string, Evidence>();
  for (const item of [...profile.evidence].sort((a, b) => b.assessed_at.localeCompare(a.assessed_at)))
    if (!newest.has(item.attempt_id)) newest.set(item.attempt_id, item);

  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">LEARNER-CONTROLLED PROFILE</div>
        <h1>My Evidence Portfolio</h1>
        <p>
          Every result links to an immutable attempt, rubric version, selected questions, answer history, confidence, and date.
          There is no opaque single score or XP.
        </p>
      </div>

      <div className="sharing-stack">
        {cards.map((card) => (
          <ConsentCard key={card.skill} {...card} onChange={onConsent} />
        ))}
      </div>

      <div className="section-heading">
        <div>
          <div className="eyebrow">EVIDENCE HISTORY</div>
          <h2>{profile.attempts.length} attempts · {profile.evidence.length} evidence snapshots</h2>
        </div>
      </div>

      {profile.attempts.length === 0 ? (
        <div className="empty-state">
          <span><EvidenceIcon size={32} /></span>
          <h2>Your evidence cards will appear here</h2>
          <p>Complete a mission to produce an assessment history linked to its tests, rubric, and follow-up answers.</p>
        </div>
      ) : (
        <div className="evidence-list">
          {profile.attempts.map((attempt) => {
            const evidence = newest.get(attempt.id);
            const scores = profile.criterionScores.filter((item) => item.attempt_id === attempt.id);
            const followups = profile.followups.filter((item) => item.attempt_id === attempt.id);

            return (
              <button className="evidence-card" key={attempt.id} onClick={() => onOpen(attempt)}>
                <span className="evidence-icon"><EvidenceIcon size={18} /></span>
                <span className="evidence-main">
                  <small>
                    {attempt.attempt_type === "boss"
                      ? "Reviewing AI-written code"
                      : `Debugging · ${new Date(attempt.submitted_at).toLocaleDateString()}`}
                  </small>
                  <strong>{attempt.attempt_type === "boss" ? "Catch the AI’s mistake" : `Attempt ${attempt.id.slice(0, 8)}`}</strong>
                  <em>
                    {scores.find((item) => item.criterion === "fix_correctness")?.score ?? "Pending"}% test score ·{" "}
                    {followups.length} follow-up answers · {evidence?.confidence ?? "Pending"} confidence
                  </em>
                </span>
                <span className={`confidence ${(evidence?.confidence ?? "low").toLowerCase()}`}>
                  {evidence?.level ?? "Awaiting evidence"}
                </span>
                <span className="evidence-arrow">→</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="disclaimer">
        <span>ⓘ</span>
        <p>Sharing is off by default, separate by skill, revocable, and audit logged. Raw code and written explanations require an additional opt-in.</p>
      </div>
    </>
  );
}

function ConsentCard({
  skill,
  label,
  consent,
  onChange,
}: {
  skill: string;
  label: string;
  consent?: Consent;
  onChange: (skill: string, shared: boolean, include: boolean) => void;
}) {
  return (
    <section className="sharing-card">
      <div>
        <div className="panel-kicker">PER-SKILL SHARING</div>
        <h2>{label}</h2>
        <p>Recruiters can see the evidence summary only after you opt in. Sharing source code and written answers requires a separate opt-in.</p>
      </div>
      <div className="consent-controls">
        <label className="switch-row">
          <input
            type="checkbox"
            checked={Boolean(consent?.shared && !consent?.revoked_at)}
            onChange={(e) => onChange(skill, e.target.checked, Boolean(consent?.include_submissions))}
          />
          <span>{consent?.shared && !consent?.revoked_at ? "Sharing on" : "Sharing off"}</span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={Boolean(consent?.include_submissions)}
            disabled={!consent?.shared}
            onChange={(e) => onChange(skill, Boolean(consent?.shared), e.target.checked)}
          />
          <span>Also share source code and written answers.</span>
        </label>
      </div>
    </section>
  );
}

function AttemptDialog({
  profile,
  attempt,
  onClose,
  onAppeal,
}: {
  profile: Profile;
  attempt: Attempt;
  onClose: () => void;
  onAppeal: (attemptId: string, criterion: string, reason: string) => Promise<void>;
}) {
  const [criterion, setCriterion] = useState(attempt.attempt_type === "boss" ? "failing_test" : "root_cause");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const scores = profile.criterionScores.filter((item) => item.attempt_id === attempt.id);
  const followups = profile.followups.filter((item) => item.attempt_id === attempt.id);
  const appeals = profile.appeals.filter((item) => item.attempt_id === attempt.id);

  const submit = async () => {
    setBusy(true);
    try {
      await onAppeal(attempt.id, criterion, reason);
    } catch (problem) {
      window.alert(problem instanceof Error ? problem.message : "Could not open the challenge.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="attempt-title">
        <button className="dialog-close" onClick={onClose} aria-label="Close">×</button>
        <div className="eyebrow">IMMUTABLE ATTEMPT · {attempt.id.slice(0, 8)}</div>
        <h2 id="attempt-title">{attempt.attempt_type === "boss" ? "Boss evidence" : "Assessment evidence"}</h2>
        <p>{new Date(attempt.submitted_at).toLocaleString()} · AI assistance disclosed: {attempt.ai_disclosure ? "Yes" : "No"}</p>

        <div className="criterion-list">
          {scores.map((item) => (
            <div className="criterion-row" key={item.id} style={{ marginBottom: "12px" }}>
              <span>
                <strong>{criterionNames[item.criterion] ?? item.criterion}</strong>: {item.score} / {item.max_score}
                <small style={{ display: "block", color: "var(--text-dim)" }}>{item.source} · {item.confidence} confidence</small>
              </span>
              <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "11px" }}>{item.feedback}</p>
            </div>
          ))}
        </div>

        <details className="submission-detail">
          <summary>View submitted code and incident report</summary>
          <pre>{attempt.code}</pre>
          {Object.entries(attempt.explanation_json.report ?? {}).map(([key, value]) => (
            <p key={key}>
              <strong>{key.replaceAll("_", " ")}:</strong> {value}
            </p>
          ))}
        </details>

        <section className="followup-history" style={{ margin: "14px 0" }}>
          <div className="panel-kicker">FOLLOW-UP QUESTION DEFENSE TRANSCRIPT</div>
          {followups.length ? (
            followups.map((item) => (
              <article key={item.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <strong>{item.position}. {item.question_shown}</strong>
                <p style={{ margin: "4px 0", color: "var(--text-main)" }}>{item.answer_text || "No answer recorded"}</p>
                <small style={{ color: "var(--text-dim)" }}>
                  Score: {item.score ?? "pending"} · {item.ai_reason ?? "Awaiting review"}
                </small>
              </article>
            ))
          ) : (
            <p style={{ color: "var(--text-dim)" }}>No answers recorded yet.</p>
          )}
        </section>

        {appeals.map((appeal) => (
          <div className="notice" key={appeal.id} style={{ margin: "12px 0" }}>
            <span>Challenge Status: {appeal.criterion} · {appeal.status}</span>
            {appeal.resolution && <p>{appeal.resolution}</p>}
          </div>
        ))}

        <div className="appeal-form" style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
          <label className="field-label" style={{ fontWeight: 700, fontSize: "11px" }}>Challenge a criterion</label>
          <select
            value={criterion}
            onChange={(e) => setCriterion(e.target.value)}
            style={{ width: "100%", padding: "8px", margin: "6px 0 10px", borderRadius: "6px", background: "var(--bg-surface-elevated)", color: "var(--text-main)", border: "1px solid var(--border)" }}
          >
            {Object.entries(criterionNames).map(([id, title]) => (
              <option value={id} key={id}>{title}</option>
            ))}
          </select>

          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={10}
            maxLength={2000}
            placeholder="Explain why you would like a human reviewer to look again (minimum 10 characters)"
          />

          <button className="primary" disabled={busy || reason.trim().length < 10} onClick={submit} style={{ marginTop: "10px" }}>
            {busy ? "Submitting appeal…" : "Open human review appeal"}
          </button>
        </div>
      </section>
    </div>
  );
}

function RecruiterView() {
  const [data, setData] = useState<{
    role: { slug: string; title: string; requirements: unknown; humanDecisionRequired: boolean };
    candidates: {
      candidateId: string;
      displayName: string;
      whySurfaced: string;
      evidence: {
        evidenceId: string;
        attemptId: string;
        taskId: string;
        level: string;
        confidence: string;
        assessedAt: string;
        criteria: Record<string, number>;
        followupsAsked: number;
        submission?: string;
        incidentReport?: Record<string, string>;
        followups?: { question: string; answer: string; score: number }[];
      }[];
    }[];
  } | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await api("/api/recruiter/candidates?role=junior-java-developer"));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Recruiter search failed.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const choose = async (candidateId: string, decision: "reviewed" | "shortlisted") => {
    setBusy(candidateId);
    try {
      await api("/api/recruiter/candidates", {
        method: "POST",
        body: JSON.stringify({
          roleSlug: data?.role.slug,
          candidateId,
          decision,
          note: notes[candidateId] ?? "",
        }),
      });
      setMessage(
        `${decision === "shortlisted" ? "Shortlist decision" : "Review decision"} saved. Every action is audited.`
      );
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Decision was not saved.");
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">NXTMOVE · CONSENT-GATED SEARCH</div>
        <h1>Candidate Evidence for Role</h1>
        <p>
          Filters use explicit skill, language, proficiency, recency, and task-count requirements.
          ProofLoop never auto-rejects candidates; human judgment remains with the recruiter.
        </p>
      </div>

      <section className="role-card">
        <div>
          <div className="panel-kicker">ACTIVE HIRING REQUIREMENT</div>
          <h2>{data?.role.title ?? "Junior Java Developer"}</h2>
          <p>Debugging · Java · Developing or above · Evidence within 90 days · Minimum 2 Java tasks</p>
        </div>
        <button className="secondary" onClick={() => void load()}>
          Refresh candidate search
        </button>
      </section>

      {error && <div className="notice error">{error}</div>}
      {message && <div className="notice">{message}</div>}

      {data?.candidates.length === 0 && (
        <div className="empty-state">
          <span><RecruiterIcon size={32} /></span>
          <h2>No consented matches surfaced</h2>
          <p>
            Candidates who have not explicitly enabled sharing for this skill do not appear in recruiter search.
          </p>
        </div>
      )}

      <div className="candidate-list">
        {data?.candidates.map((candidate) => (
          <article className="candidate-card" key={candidate.candidateId}>
            <div className="avatar">N</div>
            <div className="candidate-content">
              <div className="panel-kicker">SYNTHETIC CANDIDATE · {candidate.candidateId}</div>
              <h2>{candidate.displayName}</h2>
              <div className="match-row" style={{ color: "var(--primary-text)", margin: "6px 0 12px" }}>
                <strong>Why surfaced:</strong> {candidate.whySurfaced}
              </div>

              {candidate.evidence.map((item) => (
                <details className="candidate-evidence" key={item.evidenceId}>
                  <summary>
                    {item.taskId} · {item.level} · {item.confidence} confidence · {new Date(item.assessedAt).toLocaleDateString()}
                  </summary>
                  <div className="candidate-criteria">
                    {Object.entries(item.criteria).map(([criterion, score]) => (
                      <span key={criterion}>
                        {criterionNames[criterion] ?? criterion}: {score}
                      </span>
                    ))}
                  </div>
                  <p>Follow-up answers reviewed: {item.followupsAsked}</p>
                  {item.submission && (
                    <>
                      <pre>{item.submission}</pre>
                      <p>
                        {Object.entries(item.incidentReport ?? {}).map(([k, v]) => (
                          <span key={k}><b>{k.replaceAll("_", " ")}:</b> {v} · </span>
                        ))}
                      </p>
                      {item.followups?.map((f, i) => (
                        <p key={i}>
                          <b>{f.question}</b><br />
                          {f.answer} · score {f.score}
                        </p>
                      ))}
                    </>
                  )}
                </details>
              ))}

              <textarea
                value={notes[candidate.candidateId] ?? ""}
                onChange={(e) => setNotes((s) => ({ ...s, [candidate.candidateId]: e.target.value }))}
                placeholder="Optional recruiter review note (recorded in audit log)"
                maxLength={1000}
                style={{ width: "100%", margin: "10px 0" }}
              />

              <div className="disclaimer">
                <span>ⓘ</span>
                <p>Evidence is experimental, not a validated hiring predictor. Human judgment is required; this tool never auto-rejects.</p>
              </div>

              <div className="decision-buttons">
                <button
                  className="secondary"
                  disabled={busy === candidate.candidateId}
                  onClick={() => void choose(candidate.candidateId, "reviewed")}
                >
                  Mark reviewed
                </button>
                <button
                  className="primary"
                  disabled={busy === candidate.candidateId}
                  onClick={() => void choose(candidate.candidateId, "shortlisted")}
                >
                  {busy === candidate.candidateId ? "Saving…" : "Shortlist candidate"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ReviewView({ onDone }: { onDone: () => Promise<void> }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [draft, setDraft] = useState<
    Record<string, { criterion: string; score: string; reason: string; decision: "confirmed" | "overturned"; similarityCleared: boolean }>
  >({});

  const load = useCallback(async () => {
    try {
      setError("");
      const result = await api<{ items: Record<string, unknown>[] }>("/api/review/queue");
      setItems(result.items);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Review queue is unavailable.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const save = async (item: Record<string, unknown>) => {
    const id = String(item.attemptId);
    const form = draft[id];
    if (!form?.reason || form.reason.trim().length < 10) {
      setError("A written review reason of at least 10 characters is required.");
      return;
    }
    setBusy(id);
    try {
      await api("/api/review/resolve", {
        method: "POST",
        body: JSON.stringify({
          attemptId: id,
          appealId: (item.appeal as { id?: string } | null)?.id,
          criterion: form.criterion,
          decision: form.decision,
          ...(form.decision === "overturned" ? { score: Number(form.score) } : {}),
          similarityCleared: form.similarityCleared,
          reason: form.reason,
        }),
      });
      await load();
      await onDone();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Reviewer decision failed.");
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">HUMAN-IN-THE-LOOP REVIEW</div>
        <h1>Human Review Queue</h1>
        <p>
          Prompt manipulation, possible duplicate submissions, ambiguous scoring, runner failures, low confidence, and candidate challenges require a written human decision.
        </p>
      </div>

      {error && <div className="notice error">{error}</div>}

      {items.length === 0 ? (
        <div className="empty-state">
          <span><ReviewIcon size={32} /></span>
          <h2>The review queue is currently clear</h2>
          <p>Uncertain and challenged attempts route here automatically.</p>
        </div>
      ) : (
        <div className="review-list">
          {items.map((item) => {
            const id = String(item.attemptId);
            const scores = item.criteria as Score[];
            const selected = draft[id] ?? {
              criterion: (item.appeal as { criterion?: string } | null)?.criterion ?? scores[0]?.criterion ?? "root_cause",
              score: String(scores[0]?.score ?? 0),
              reason: "",
              decision: "confirmed" as const,
              similarityCleared: false,
            };
            const comparison = item.similarityComparison as { code?: string; similarity?: number } | null;

            return (
              <article className="panel review-item" key={id}>
                <div className="panel-kicker">
                  {item.appeal ? "LEARNER CHALLENGE" : "LOW-CONFIDENCE REVIEW"} · {id.slice(0, 8)} ·{" "}
                  {String(item.attemptType).toUpperCase()}
                </div>
                <h2>
                  {(item.task as { mission?: { title?: string }; slug?: string } | null)?.mission?.title ??
                    (item.task as { slug?: string } | null)?.slug ??
                    "Boss assessment"}
                </h2>
                <p>
                  Synthetic learner {String((item.candidate as { id?: string } | undefined)?.id ?? "")} · submitted{" "}
                  {new Date(String(item.submittedAt)).toLocaleString()}
                </p>

                {Boolean(item.similarityFlag) && (
                  <div className="notice error">
                    Possible near-identical code was found in another learner’s submission. This is a review flag, not a failure. Compare the code before deciding whether to clear it.
                  </div>
                )}

                {(item.followups as { question_shown: string; answer_text: string; score: number }[]).map(
                  (f, i) => (
                    <p key={i}>
                      <b>{f.question_shown}</b><br />
                      {f.answer_text} · current score {f.score}
                    </p>
                  )
                )}

                <details className="submission-detail">
                  <summary>View submitted code</summary>
                  <pre>{String(item.code)}</pre>
                </details>

                {comparison && (
                  <details className="submission-detail">
                    <summary>Compare with anonymized peer submission ({Math.round((comparison.similarity ?? 0) * 100)}% similar)</summary>
                    <pre>{comparison.code}</pre>
                  </details>
                )}

                <div className="review-form">
                  <label>
                    Criterion
                    <select
                      value={selected.criterion}
                      onChange={(e) => setDraft((s) => ({ ...s, [id]: { ...selected, criterion: e.target.value } }))}
                    >
                      {scores.map((score) => (
                        <option key={score.criterion} value={score.criterion}>
                          {criterionNames[score.criterion] ?? score.criterion} · {score.score}/{score.max_score}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Decision
                    <select
                      value={selected.decision}
                      onChange={(e) =>
                        setDraft((s) => ({
                          ...s,
                          [id]: { ...selected, decision: e.target.value as "confirmed" | "overturned" },
                        }))
                      }
                    >
                      <option value="confirmed">Confirm current score</option>
                      <option value="overturned">Override score</option>
                    </select>
                  </label>

                  {selected.decision === "overturned" && (
                    <label>
                      New score
                      <input
                        type="number"
                        min={0}
                        max={Number(scores.find((score) => score.criterion === selected.criterion)?.max_score ?? 100)}
                        value={selected.score}
                        onChange={(e) => setDraft((s) => ({ ...s, [id]: { ...selected, score: e.target.value } }))}
                      />
                    </label>
                  )}

                  {Boolean(item.similarityFlag) && (
                    <label className="check-row review-similarity-check">
                      <input
                        type="checkbox"
                        checked={selected.similarityCleared}
                        onChange={(e) =>
                          setDraft((s) => ({ ...s, [id]: { ...selected, similarityCleared: e.target.checked } }))
                        }
                      />
                      I compared the submissions and confirmed this flag can be cleared.
                    </label>
                  )}

                  <label className="reason-field">
                    Written reason (mandatory for audit log)
                    <textarea
                      rows={3}
                      minLength={10}
                      maxLength={2000}
                      value={selected.reason}
                      onChange={(e) => setDraft((s) => ({ ...s, [id]: { ...selected, reason: e.target.value } }))}
                      placeholder="Record why the score is confirmed or overridden"
                    />
                  </label>

                  <button className="primary" disabled={busy === id} onClick={() => void save(item)}>
                    {busy === id ? "Saving review decision…" : "Save human review decision"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Calibration Panel */}
      <div style={{ marginTop: "40px" }}>
        <CalibrationPanel />
      </div>
    </>
  );
}

function AuditView() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ events: Record<string, unknown>[] }>("/api/audit")
      .then((data) => setEvents(data.events))
      .catch((problem) => setError(problem instanceof Error ? problem.message : "Audit log unavailable."));
  }, []);

  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">APPEND-ONLY ACCOUNT HISTORY</div>
        <h1>Immutable Audit Log</h1>
        <p>
          Every assessment version, question selection trigger, raw model output, review override, consent toggle, and recruiter view is permanently logged.
        </p>
      </div>

      {error && <div className="notice error">{error}</div>}

      <section className="panel audit-panel">
        {events.length === 0 ? (
          <div className="empty-state">
            <span><AuditIcon size={32} /></span>
            <h2>No audit events recorded yet</h2>
            <p>Assessment and consent actions will appear here in chronological order.</p>
          </div>
        ) : (
          events.map((event, index) => (
            <article className="audit-entry" key={String(event.id ?? index)}>
              <span className="audit-dot" />
              <div>
                <strong>{String(event.action).replaceAll("_", " ")}</strong>
                <p>
                  Attempt {String(event.attempt_id ?? "—")} · task v{String(event.task_version ?? "—")} · rubric v{String(event.rubric_version ?? "—")} · bank v{String(event.bank_version ?? "—")}
                </p>
                <small>
                  {new Date(String(event.ts)).toLocaleString()} · {String(event.model_name ?? "deterministic")}
                </small>
                <details className="audit-detail" style={{ marginTop: "6px" }}>
                  <summary style={{ cursor: "pointer", color: "var(--primary-text)", fontSize: "10px" }}>View recorded payload</summary>
                  <pre style={{ maxHeight: "160px", overflow: "auto", fontSize: "10px", padding: "8px", background: "var(--bg-app)", borderRadius: "6px" }}>
                    {JSON.stringify({ flags: event.flags, input_hash: event.input_hash, output: event.output_json }, null, 2)}
                  </pre>
                </details>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
