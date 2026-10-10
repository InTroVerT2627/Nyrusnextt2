import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { calculateMinSeconds, PageType } from "@/lib/learning-experience-types";

export type SessionRecord = {
  id: string;
  userId: string;
  pathSlug: string;
  moduleSlug: string;
  state: "active" | "paused" | "interrupted" | "completed";
  currentPageType: PageType;
  currentPageIndex: number;
  pausesUsed: number;
  relaxedMode: boolean;
  interruptReason?: string | null;
  sessionToken: string;
  lastHeartbeatAt: number;
  startedAt: number;
  endedAt?: number | null;
};

export type PageVisitRecord = {
  id: string;
  sessionId: string;
  userId: string;
  pageIndex: number;
  pageType: PageType;
  minSeconds: number;
  serverEnterAt: number;
  serverAdvanceAt?: number | null;
  interactionCompleted: boolean;
};

// In-memory fallback stores for local/test environments
const memorySessions = new Map<string, SessionRecord>();
const memoryVisits = new Map<string, PageVisitRecord>();

export async function startModuleSession(
  userId: string,
  pathSlug: string,
  moduleSlug: string,
  relaxedMode = false
): Promise<{ session: SessionRecord; token: string }> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();
  const sessionToken = crypto.randomUUID();
  const sessionId = crypto.randomUUID();

  // Enforce single-session lock: terminate any existing active session for this user
  if (admin) {
    await admin
      .from("learning_module_sessions")
      .update({
        state: "interrupted",
        interrupt_reason: "second_session",
        ended_at: new Date(now).toISOString(),
      })
      .eq("user_id", userId)
      .eq("state", "active");

    const { data, error } = await admin
      .from("learning_module_sessions")
      .insert({
        id: sessionId,
        user_id: userId,
        path_slug: pathSlug,
        module_slug: moduleSlug,
        state: "active",
        current_page_type: "teaser",
        current_page_index: 0,
        pauses_used: 0,
        relaxed_mode: relaxedMode,
        session_token: sessionToken,
        last_heartbeat_at: new Date(now).toISOString(),
        started_at: new Date(now).toISOString(),
      })
      .select()
      .single();

    if (error || !data) throw new Error("Could not initialize learning session.");

    const session: SessionRecord = {
      id: data.id,
      userId: data.user_id,
      pathSlug: data.path_slug,
      moduleSlug: data.module_slug,
      state: data.state as "active",
      currentPageType: data.current_page_type as PageType,
      currentPageIndex: data.current_page_index,
      pausesUsed: data.pauses_used,
      relaxedMode: data.relaxed_mode,
      sessionToken: data.session_token,
      lastHeartbeatAt: new Date(data.last_heartbeat_at).getTime(),
      startedAt: new Date(data.started_at).getTime(),
    };
    return { session, token: sessionToken };
  } else {
    // Memory fallback
    for (const [sId, sess] of memorySessions.entries()) {
      if (sess.userId === userId && sess.state === "active") {
        sess.state = "interrupted";
        sess.interruptReason = "second_session";
        sess.endedAt = now;
      }
    }
    const session: SessionRecord = {
      id: sessionId,
      userId,
      pathSlug,
      moduleSlug,
      state: "active",
      currentPageType: "teaser",
      currentPageIndex: 0,
      pausesUsed: 0,
      relaxedMode,
      sessionToken,
      lastHeartbeatAt: now,
      startedAt: now,
    };
    memorySessions.set(sessionId, session);
    return { session, token: sessionToken };
  }
}

export async function recordPageEnter(
  sessionId: string,
  userId: string,
  pageIndex: number,
  pageType: PageType,
  pageWordCount: number,
  overrideMinSeconds?: number
): Promise<{ minSeconds: number; visitId: string }> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();

  // Find session to verify relaxed mode
  let isRelaxed = false;
  if (admin) {
    const { data } = await admin
      .from("learning_module_sessions")
      .select("relaxed_mode, state")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();
    if (!data || data.state !== "active") {
      throw new Error("Active session required.");
    }
    isRelaxed = data.relaxed_mode;
  } else {
    const sess = memorySessions.get(sessionId);
    if (!sess || sess.state !== "active") throw new Error("Active session required.");
    isRelaxed = sess.relaxedMode;
  }

  // Calculate server-side minimum seconds
  const minSeconds = calculateMinSeconds(
    "word ".repeat(pageWordCount),
    overrideMinSeconds,
    isRelaxed
  );

  const visitId = crypto.randomUUID();

  if (admin) {
    await admin.from("learning_page_visits").insert({
      id: visitId,
      session_id: sessionId,
      user_id: userId,
      page_index: pageIndex,
      page_type: pageType,
      min_seconds: minSeconds,
      server_enter_at: new Date(now).toISOString(),
      interaction_completed: false,
    });
  } else {
    memoryVisits.set(visitId, {
      id: visitId,
      sessionId,
      userId,
      pageIndex,
      pageType,
      minSeconds,
      serverEnterAt: now,
      interactionCompleted: false,
    });
  }

  return { minSeconds, visitId };
}

export async function verifyAndAdvancePage(
  sessionId: string,
  userId: string,
  visitId: string,
  nextPageIndex: number,
  nextPageType: PageType,
  interactionDone = true
): Promise<{ success: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();

  let enterTimestamp = 0;
  let minSecondsRequired = 0;

  if (admin) {
    const { data: visit, error } = await admin
      .from("learning_page_visits")
      .select("server_enter_at, min_seconds, session_id")
      .eq("id", visitId)
      .eq("user_id", userId)
      .single();

    if (error || !visit) {
      return { success: false, error: "Invalid visit tracking token." };
    }

    enterTimestamp = new Date(visit.server_enter_at).getTime();
    minSecondsRequired = visit.min_seconds;
  } else {
    const visit = memoryVisits.get(visitId);
    if (!visit || visit.userId !== userId) {
      return { success: false, error: "Invalid visit tracking token." };
    }
    enterTimestamp = visit.serverEnterAt;
    minSecondsRequired = visit.minSeconds;
  }

  // Strict Server-Side Verification: Compare server now() with server enter_at
  const elapsedSeconds = (now - enterTimestamp) / 1000;
  if (elapsedSeconds < minSecondsRequired - 0.25) {
    // Grace allowance of 250ms for network latency
    return {
      success: false,
      error: `Pacing gate active: ${Math.ceil(minSecondsRequired - elapsedSeconds)}s remaining.`,
    };
  }

  if (!interactionDone) {
    return {
      success: false,
      error: "Complete the required interaction on this page before continuing.",
    };
  }

  // Record advance in DB
  if (admin) {
    await admin
      .from("learning_page_visits")
      .update({
        server_advance_at: new Date(now).toISOString(),
        interaction_completed: true,
      })
      .eq("id", visitId);

    await admin
      .from("learning_module_sessions")
      .update({
        current_page_index: nextPageIndex,
        current_page_type: nextPageType,
        last_heartbeat_at: new Date(now).toISOString(),
      })
      .eq("id", sessionId);
  } else {
    const v = memoryVisits.get(visitId);
    if (v) {
      v.serverAdvanceAt = now;
      v.interactionCompleted = true;
    }
    const s = memorySessions.get(sessionId);
    if (s) {
      s.currentPageIndex = nextPageIndex;
      s.currentPageType = nextPageType;
      s.lastHeartbeatAt = now;
    }
  }

  return { success: true };
}

export async function heartbeatSession(
  sessionId: string,
  userId: string,
  token: string
): Promise<{ active: boolean; reason?: string }> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();

  if (admin) {
    const { data: session } = await admin
      .from("learning_module_sessions")
      .select("state, session_token, last_heartbeat_at")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (!session) return { active: false, reason: "Session not found" };
    if (session.session_token !== token) return { active: false, reason: "Token mismatch" };
    if (session.state !== "active") return { active: false, reason: `Session ${session.state}` };

    // Check heartbeat timeout (> 30s)
    const lastHb = new Date(session.last_heartbeat_at).getTime();
    if (now - lastHb > 30000) {
      await admin
        .from("learning_module_sessions")
        .update({
          state: "interrupted",
          interrupt_reason: "heartbeat_lost",
          ended_at: new Date(now).toISOString(),
        })
        .eq("id", sessionId);
      return { active: false, reason: "Heartbeat lost (30s exceeded)" };
    }

    // Refresh heartbeat
    await admin
      .from("learning_module_sessions")
      .update({ last_heartbeat_at: new Date(now).toISOString() })
      .eq("id", sessionId);

    return { active: true };
  } else {
    const s = memorySessions.get(sessionId);
    if (!s) return { active: false, reason: "Session not found" };
    if (s.sessionToken !== token) return { active: false, reason: "Token mismatch" };
    if (s.state !== "active") return { active: false, reason: `Session ${s.state}` };

    if (now - s.lastHeartbeatAt > 30000) {
      s.state = "interrupted";
      s.interruptReason = "heartbeat_lost";
      s.endedAt = now;
      return { active: false, reason: "Heartbeat lost (30s exceeded)" };
    }

    s.lastHeartbeatAt = now;
    return { active: true };
  }
}

export async function interruptSession(
  sessionId: string,
  userId: string,
  reason: "tab_hidden" | "window_blur" | "pagehide" | "heartbeat_lost",
  durationMs: number
): Promise<{ interrupted: boolean }> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();
  const graceExceeded = durationMs > 3000;

  if (admin) {
    // Log interruption event
    await admin.from("learning_interruptions").insert({
      session_id: sessionId,
      user_id: userId,
      interruption_type: reason,
      duration_ms: durationMs,
      grace_period_exceeded: graceExceeded,
      occurred_at: new Date(now).toISOString(),
    });

    if (graceExceeded) {
      await admin
        .from("learning_module_sessions")
        .update({
          state: "interrupted",
          interrupt_reason: reason,
          ended_at: new Date(now).toISOString(),
        })
        .eq("id", sessionId);
    }
  } else {
    const s = memorySessions.get(sessionId);
    if (s && graceExceeded) {
      s.state = "interrupted";
      s.interruptReason = reason;
      s.endedAt = now;
    }
  }

  return { interrupted: graceExceeded };
}

export async function pauseSession(
  sessionId: string,
  userId: string
): Promise<{ paused: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();

  if (admin) {
    const { data: session } = await admin
      .from("learning_module_sessions")
      .select("state, pauses_used, current_page_type")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (!session || session.state !== "active") {
      return { paused: false, error: "Active session required to pause." };
    }
    if (session.current_page_type === "check") {
      return { paused: false, error: "Cannot pause during knowledge checks." };
    }
    if (session.pauses_used >= 1) {
      return { paused: false, error: "Maximum one pause allowed per module attempt." };
    }

    await admin
      .from("learning_module_sessions")
      .update({
        state: "paused",
        pauses_used: session.pauses_used + 1,
      })
      .eq("id", sessionId);

    return { paused: true };
  } else {
    const s = memorySessions.get(sessionId);
    if (!s || s.state !== "active") return { paused: false, error: "Active session required." };
    if (s.currentPageType === "check") return { paused: false, error: "Cannot pause during check." };
    if (s.pausesUsed >= 1) return { paused: false, error: "Maximum one pause allowed per module attempt." };

    s.state = "paused";
    s.pausesUsed += 1;
    return { paused: true };
  }
}

export async function resumeSession(
  sessionId: string,
  userId: string
): Promise<{ resumed: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();

  if (admin) {
    const { data: session } = await admin
      .from("learning_module_sessions")
      .select("state")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (!session || session.state !== "paused") {
      return { resumed: false, error: "Paused session required to resume." };
    }

    await admin
      .from("learning_module_sessions")
      .update({
        state: "active",
        last_heartbeat_at: new Date(now).toISOString(),
      })
      .eq("id", sessionId);

    return { resumed: true };
  } else {
    const s = memorySessions.get(sessionId);
    if (!s || s.state !== "paused") return { resumed: false, error: "Paused session required." };
    s.state = "active";
    s.lastHeartbeatAt = now;
    return { resumed: true };
  }
}

export type StoredReflection = {
  id: string;
  userId: string;
  pathSlug: string;
  checkpointNumber: number;
  modulesCovered: string[];
  promptSynthesise: string;
  responseSynthesise: string;
  promptApply: string;
  responseApply: string;
  formativeFeedback: {
    is_genuine_attempt: boolean;
    depth_level: "Needs another look" | "Getting there" | "Solid";
    strength: string;
    growth_opportunity: string;
    revisit_module_slug: string | null;
  };
  isGenuineAttempt: boolean;
  wordCount: number;
  submittedAt: string;
  updatedAt: string;
};

const memoryReflections = new Map<string, StoredReflection>();

export async function saveReflectionRecord(input: {
  userId: string;
  pathSlug: string;
  checkpointNumber: number;
  modulesCovered: string[];
  promptSynthesise: string;
  responseSynthesise: string;
  promptApply: string;
  responseApply: string;
  feedback: {
    is_genuine_attempt: boolean;
    depth_level: "Needs another look" | "Getting there" | "Solid";
    strength: string;
    growth_opportunity: string;
    revisit_module_slug: string | null;
  };
}): Promise<StoredReflection> {
  const admin = createSupabaseAdminClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const totalWords = (input.responseSynthesise + " " + input.responseApply)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const record: StoredReflection = {
    id,
    userId: input.userId,
    pathSlug: input.pathSlug,
    checkpointNumber: input.checkpointNumber,
    modulesCovered: input.modulesCovered,
    promptSynthesise: input.promptSynthesise,
    responseSynthesise: input.responseSynthesise,
    promptApply: input.promptApply,
    responseApply: input.responseApply,
    formativeFeedback: input.feedback,
    isGenuineAttempt: input.feedback.is_genuine_attempt,
    wordCount: totalWords,
    submittedAt: now,
    updatedAt: now,
  };

  if (admin) {
    const { data, error } = await admin
      .from("learning_reflections")
      .upsert(
        {
          user_id: input.userId,
          path_slug: input.pathSlug,
          checkpoint_number: input.checkpointNumber,
          modules_covered: input.modulesCovered,
          prompt_synthesise: input.promptSynthesise,
          response_synthesise: input.responseSynthesise,
          prompt_apply: input.promptApply,
          response_apply: input.responseApply,
          formative_feedback: input.feedback,
          is_genuine_attempt: input.feedback.is_genuine_attempt,
          word_count: totalWords,
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: "user_id, path_slug, checkpoint_number" }
      )
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        userId: data.user_id,
        pathSlug: data.path_slug,
        checkpointNumber: data.checkpoint_number,
        modulesCovered: data.modules_covered,
        promptSynthesise: data.prompt_synthesise,
        responseSynthesise: data.response_synthesise,
        promptApply: data.prompt_apply,
        responseApply: data.response_apply,
        formativeFeedback: data.formative_feedback,
        isGenuineAttempt: data.is_genuine_attempt,
        wordCount: data.word_count,
        submittedAt: data.submitted_at,
        updatedAt: data.updated_at,
      };
    }
  }

  // In-memory fallback
  const key = `${input.userId}:${input.pathSlug}:${input.checkpointNumber}`;
  memoryReflections.set(key, record);
  return record;
}

export async function getReflectionRecords(
  userId: string,
  pathSlug?: string
): Promise<StoredReflection[]> {
  const admin = createSupabaseAdminClient();

  if (admin) {
    let query = admin
      .from("learning_reflections")
      .select("*")
      .eq("user_id", userId)
      .order("checkpoint_number", { ascending: true });

    if (pathSlug) {
      query = query.eq("path_slug", pathSlug);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      return data.map((d) => ({
        id: d.id,
        userId: d.user_id,
        pathSlug: d.path_slug,
        checkpointNumber: d.checkpoint_number,
        modulesCovered: d.modules_covered,
        promptSynthesise: d.prompt_synthesise,
        responseSynthesise: d.response_synthesise,
        promptApply: d.prompt_apply,
        responseApply: d.response_apply,
        formativeFeedback: d.formative_feedback,
        isGenuineAttempt: d.is_genuine_attempt,
        wordCount: d.word_count,
        submittedAt: d.submitted_at,
        updatedAt: d.updated_at,
      }));
    }
  }

  const results: StoredReflection[] = [];
  for (const [, val] of memoryReflections.entries()) {
    if (val.userId === userId && (!pathSlug || val.pathSlug === pathSlug)) {
      results.push(val);
    }
  }
  return results.sort((a, b) => a.checkpointNumber - b.checkpointNumber);
}

