"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setBusy(false); setMessage("Add Supabase URL and anon key to .env.local to enable accounts."); return; }
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName || "Learner" }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "signup" && !result.data.session) { setMessage("Check your email to confirm your account, then sign in."); return; }
    router.replace("/"); router.refresh();
  };

  return <main className="login-shell"><Link className="brand" href="/"><span className="brand-mark">N</span><span>nextlearn</span></Link><form className="login-card" onSubmit={submit}><div className="eyebrow">{mode === "signin" ? "WELCOME BACK" : "CREATE LEARNER ACCOUNT"}</div><h1>{mode === "signin" ? "Sign in to Nextlearn" : "Start your skill profile"}</h1><p>Use an email account configured in your Supabase project. Your profile stores a display name and synthetic candidate ID only.</p>{mode === "signup" && <label>Display name<input value={displayName} onChange={(event)=>setDisplayName(event.target.value)} autoComplete="name" maxLength={80}/></label>}<label>Email<input type="email" value={email} onChange={(event)=>setEmail(event.target.value)} autoComplete="email" required/></label><label>Password<input type="password" value={password} onChange={(event)=>setPassword(event.target.value)} autoComplete={mode === "signin"?"current-password":"new-password"} minLength={8} required/></label>{message&&<p className="login-message" role="status">{message}</p>}<button className="primary" disabled={busy}>{busy?"Please wait…":mode === "signin"?"Sign in":"Create account"}</button><button className="link-button login-switch" type="button" onClick={()=>{setMode(mode === "signin"?"signup":"signin");setMessage("");}}>{mode === "signin"?"Need an account? Create one":"Already registered? Sign in"}</button></form><p className="login-note">Practice evidence is experimental, learner-controlled, and not a hiring prediction.</p></main>;
}
