-- Migration: 202610100008_learning_experience.sql
-- Description: Schema and Row-Level Security for immersive, focused learning module sessions, time-tracking, interruptions, and reflections.
-- Overrides "no timers" and "no time-based unlocks" STRICTLY for learning modules and reflections only.

-- 1. Learner Module Sessions (Active / Paused / Interrupted / Completed)
CREATE TABLE IF NOT EXISTS public.learning_module_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_slug TEXT NOT NULL CHECK (path_slug IN ('data-analytics', 'business-analytics', 'communication')),
  module_slug TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('active', 'paused', 'interrupted', 'completed')),
  current_page_type TEXT NOT NULL,
  current_page_index SMALLINT NOT NULL DEFAULT 0,
  pauses_used SMALLINT NOT NULL DEFAULT 0,
  relaxed_mode BOOLEAN NOT NULL DEFAULT FALSE,
  interrupt_reason TEXT,
  session_token UUID NOT NULL DEFAULT gen_random_uuid(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

COMMENT ON TABLE public.learning_module_sessions IS 'Tracks single-session learner focus, heartbeat, pause state, and interruption reasons. Private to learner; excluded from recruiter search and proficiency ranking.';

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_module
  ON public.learning_module_sessions(user_id, path_slug, module_slug, state);

-- 2. Page Visits (Server-Enforced Minimum Reading Time)
CREATE TABLE IF NOT EXISTS public.learning_page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_module_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_index SMALLINT NOT NULL,
  page_type TEXT NOT NULL,
  min_seconds SMALLINT NOT NULL,
  server_enter_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  server_advance_at TIMESTAMPTZ,
  interaction_completed BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE public.learning_page_visits IS 'Append-only server timestamps for page entry and advance. Enforces reading time independently of client device clock.';

CREATE INDEX IF NOT EXISTS idx_learning_page_visits_session
  ON public.learning_page_visits(session_id, page_index);

-- 3. Interruption Logs (Auditing Focus Breaks & Tab Switches)
CREATE TABLE IF NOT EXISTS public.learning_interruptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_module_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interruption_type TEXT NOT NULL CHECK (interruption_type IN ('tab_hidden', 'window_blur', 'pagehide', 'heartbeat_lost', 'second_session')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER NOT NULL DEFAULT 0,
  grace_period_exceeded BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE public.learning_interruptions IS 'Logs focus breaks. Exceeded grace period aborts the session. Private to learner; never shared with recruiters.';

CREATE INDEX IF NOT EXISTS idx_learning_interruptions_session
  ON public.learning_interruptions(session_id);

-- 4. Teaser Commitments (Private, Unscored)
CREATE TABLE IF NOT EXISTS public.learning_teaser_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_slug TEXT NOT NULL,
  module_slug TEXT NOT NULL,
  format TEXT NOT NULL,
  selected_option TEXT,
  free_text TEXT,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.learning_teaser_responses IS 'Curiosity-first commitments before lesson reveal. Unscored and private.';

CREATE INDEX IF NOT EXISTS idx_learning_teasers_user
  ON public.learning_teaser_responses(user_id, path_slug, module_slug);

-- 5. Formative Reflection Checkpoints (AI-Only Feedback after Modules 3, 6, 9, 10)
CREATE TABLE IF NOT EXISTS public.learning_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_slug TEXT NOT NULL,
  after_module SMALLINT NOT NULL CHECK (after_module IN (3, 6, 9, 10)),
  reflection_text TEXT NOT NULL,
  ai_feedback JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.learning_reflections IS 'Formative reflections reviewed by AI only. Never shared with recruiters unless learner explicitly opts in.';

CREATE INDEX IF NOT EXISTS idx_learning_reflections_user
  ON public.learning_reflections(user_id, path_slug, after_module);

-- 6. Private Notebook Notes
CREATE TABLE IF NOT EXISTS public.learning_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_slug TEXT NOT NULL,
  module_slug TEXT NOT NULL,
  note_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, path_slug, module_slug)
);

COMMENT ON TABLE public.learning_notes IS 'Private learner notes per module. Read/write only by the authoring learner.';

-- =========================================================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================================================

ALTER TABLE public.learning_module_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_interruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_teaser_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_notes ENABLE ROW LEVEL SECURITY;

-- Revoke all public/anon access
REVOKE ALL ON public.learning_module_sessions FROM anon;
REVOKE ALL ON public.learning_page_visits FROM anon;
REVOKE ALL ON public.learning_interruptions FROM anon;
REVOKE ALL ON public.learning_teaser_responses FROM anon;
REVOKE ALL ON public.learning_reflections FROM anon;
REVOKE ALL ON public.learning_notes FROM anon;

-- Grant access to service_role
GRANT ALL ON public.learning_module_sessions TO service_role;
GRANT ALL ON public.learning_page_visits TO service_role;
GRANT ALL ON public.learning_interruptions TO service_role;
GRANT ALL ON public.learning_teaser_responses TO service_role;
GRANT ALL ON public.learning_reflections TO service_role;
GRANT ALL ON public.learning_notes TO service_role;

-- Authenticated Learners can only read and write their OWN rows
CREATE POLICY learner_own_sessions ON public.learning_module_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY learner_own_visits ON public.learning_page_visits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY learner_own_interruptions ON public.learning_interruptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY learner_own_teasers ON public.learning_teaser_responses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY learner_own_reflections ON public.learning_reflections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY learner_own_notes ON public.learning_notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
