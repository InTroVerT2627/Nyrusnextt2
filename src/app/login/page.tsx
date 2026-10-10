"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  User,
  Search,
  CheckSquare,
  ArrowRight,
  Shield,
  Lock,
  Mail,
  KeyRound,
  GraduationCap,
} from "lucide-react";

interface DemoPersona {
  role: "learner" | "recruiter" | "reviewer";
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
}

const PERSONAS: DemoPersona[] = [
  {
    role: "learner",
    name: "Alex Morgan",
    title: "Synthetic Learner",
    description: "4 incident missions attempted, 3 evidence cards earned, skill tree unlocked, revocable consent controls.",
    icon: <User size={20} strokeWidth={2} />,
    badge: "ID: cand_0142",
  },
  {
    role: "recruiter",
    name: "Priya Patel",
    title: "Simulated Recruiter (NxtMove)",
    description: "Explicit role requirements filter, transparent 'Why surfaced' matches, human shortlist decisions with written reasons.",
    icon: <Search size={20} strokeWidth={2} />,
    badge: "ID: rec_priya",
  },
  {
    role: "reviewer",
    name: "Sarah Chen",
    title: "Human Evaluation Reviewer",
    description: "Review queue for low-confidence & appealed submissions, anonymized peer similarity diff, AI calibration benchmark.",
    icon: <CheckSquare size={20} strokeWidth={2} />,
    badge: "ID: rev_sarah",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showCustomAuth, setShowCustomAuth] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleDemoSwitch = async (role: "learner" | "recruiter" | "reviewer") => {
    setSwitchingRole(role);
    setMessage("");
    try {
      localStorage.setItem("nextlearn.demo_role", role);
      await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Could not switch demo persona. Please try again.");
      setSwitchingRole(null);
    }
  };

  const handleCustomSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setBusy(false);
      setMessage("Supabase is not configured in environment variables.");
      return;
    }

    localStorage.removeItem("nextlearn.demo_role");
    await fetch("/api/auth/demo-switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "reset" }),
    });

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: displayName || "Learner" },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <main className="login-shell">
      <Link className="brand" href="/">
        <span className="brand-mark">N</span>
        <span>ProofLoop</span>
      </Link>

      <div className="login-card-wide">
        <div className="login-header">
          <div className="eyebrow">MISSION CONTROL · INSTANT DEMO ACCESS</div>
          <h1>Choose your demo persona</h1>
          <p>
            Experience ProofLoop from each stakeholder&apos;s perspective. Select a role below to jump into the authenticated sandbox immediately.
          </p>
        </div>

        {/* Demo Persona Grid */}
        <div className="persona-grid">
          {PERSONAS.map((persona) => {
            const isSwitching = switchingRole === persona.role;
            return (
              <button
                key={persona.role}
                type="button"
                className={`persona-card ${isSwitching ? "loading" : ""}`}
                onClick={() => handleDemoSwitch(persona.role)}
                disabled={Boolean(switchingRole)}
              >
                <div className="persona-card-top">
                  <div className="persona-icon-wrap">{persona.icon}</div>
                  <span className="persona-badge">{persona.badge}</span>
                </div>
                <strong className="persona-name">{persona.name}</strong>
                <span className="persona-title">{persona.title}</span>
                <p className="persona-desc">{persona.description}</p>
                <div className="persona-cta">
                  <span>{isSwitching ? "Entering workspace…" : `Enter as ${persona.name}`}</span>
                  <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Supabase Toggle */}
        <div className="custom-auth-divider">
          <span>OR USE SUPABASE DIRECT CREDENTIALS</span>
        </div>

        {!showCustomAuth ? (
          <button
            type="button"
            className="secondary show-auth-btn"
            onClick={() => setShowCustomAuth(true)}
          >
            <Lock size={15} />
            <span>Sign in with custom email & password</span>
          </button>
        ) : (
          <form className="custom-auth-form" onSubmit={handleCustomSubmit}>
            <div className="custom-auth-header">
              <strong>{mode === "signin" ? "Supabase Account Sign-in" : "Register New Account"}</strong>
              <button
                type="button"
                className="text-link"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Need an account? Register" : "Already registered? Sign in"}
              </button>
            </div>

            {mode === "signup" && (
              <label className="field-group">
                <span>Display Name</span>
                <div className="input-wrap">
                  <User size={15} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    maxLength={80}
                  />
                </div>
              </label>
            )}

            <label className="field-group">
              <span>Email Address</span>
              <div className="input-wrap">
                <Mail size={15} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </label>

            <label className="field-group">
              <span>Password</span>
              <div className="input-wrap">
                <KeyRound size={15} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
            </label>

            {message && (
              <div className="login-message" role="status">
                {message}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="primary" disabled={busy}>
                {busy ? "Authenticating…" : mode === "signin" ? "Sign in" : "Create Account"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowCustomAuth(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="login-disclaimer">
          <Shield size={14} />
          <span>
            Practice evidence is experimental and candidate-controlled. It is never a validated predictor of job performance.
          </span>
        </div>
      </div>
    </main>
  );
}
