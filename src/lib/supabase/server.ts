import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(values) {
          try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* Server components cannot set cookies; middleware refreshes sessions. */ }
        },
      },
    },
  );
}

export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getAuthenticatedUser(overrideRole?: string | null) {
  const client = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!client || !admin) return { client: null, user: null, profile: null };

  const cookieStore = await cookies();
  const demoRole = overrideRole || cookieStore.get("nextlearn_demo_role")?.value;

  const candidateIdMap: Record<string, string> = {
    learner: "cand_0142",
    recruiter: "rec_priya",
    reviewer: "rev_sarah",
  };

  // 1. If explicit demo role cookie is present
  if (demoRole && candidateIdMap[demoRole]) {
    const targetCandidateId = candidateIdMap[demoRole];
    const { data: profile } = await admin
      .from("profiles")
      .select("id, display_name, role, synthetic_candidate_id")
      .eq("synthetic_candidate_id", targetCandidateId)
      .maybeSingle();

    if (profile) {
      const demoUser = {
        id: profile.id,
        email: `${demoRole}@nextlearn.synthetic`,
        app_metadata: {},
        user_metadata: { display_name: profile.display_name },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      };
      return { client, user: demoUser as unknown as NonNullable<Awaited<ReturnType<typeof client.auth.getUser>>["data"]["user"]>, profile };
    }
  }

  // 2. Check real Supabase Auth session if active
  try {
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id, display_name, role, synthetic_candidate_id")
        .eq("id", user.id)
        .maybeSingle();
      return { client, user, profile };
    }
  } catch {
    // Session check failed or expired, fall back to default demo persona
  }

  // 3. Default demo fallback to learner (Alex Morgan cand_0142)
  const { data: defaultProfile } = await admin
    .from("profiles")
    .select("id, display_name, role, synthetic_candidate_id")
    .eq("synthetic_candidate_id", "cand_0142")
    .maybeSingle();

  if (defaultProfile) {
    const demoUser = {
      id: defaultProfile.id,
      email: "alex.morgan.learner@nextlearn.synthetic",
      app_metadata: {},
      user_metadata: { display_name: defaultProfile.display_name },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };
    return { client, user: demoUser as unknown as NonNullable<Awaited<ReturnType<typeof client.auth.getUser>>["data"]["user"]>, profile: defaultProfile };
  }

  return { client, user: null, profile: null };
}
