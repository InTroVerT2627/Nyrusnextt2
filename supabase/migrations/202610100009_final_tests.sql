-- Migration 202610100009_final_tests.sql
-- Final Test Schema: Configs, Questions, Server-Isolated Secrets, Attempts, Answers, Followups, and Hints.

-- 1. Final Test Configurations per Learning Path
CREATE TABLE IF NOT EXISTS public.final_test_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  time_limit_seconds INTEGER NOT NULL DEFAULT 2700, -- 45 minutes
  questions_per_attempt SMALLINT NOT NULL DEFAULT 8,
  pass_mark SMALLINT NOT NULL DEFAULT 70,
  draft_notice TEXT NOT NULL DEFAULT 'Draft: needs human review. Fictional scenarios only.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Publicly Deliverable Question Prompts (Zero answer keys or secrets)
CREATE TABLE IF NOT EXISTS public.final_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_slug TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('spot_mistake', 'case_decision', 'fix_it', 'interpret', 'triage', 'rewrite')),
  title TEXT NOT NULL,
  scenario TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB, -- For case decisions, triage cards, etc.
  starter_content TEXT, -- Flawed AI text, broken SQL query, unformatted draft, etc.
  difficulty TEXT NOT NULL CHECK (difficulty IN ('foundation', 'intermediate', 'advanced')),
  status TEXT NOT NULL DEFAULT 'draft_needs_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Server-Only Secrets Table (Never exposed via client queries / RLS)
CREATE TABLE IF NOT EXISTS public.final_test_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.final_test_questions(id) ON DELETE CASCADE UNIQUE,
  planted_errors JSONB, -- [{ start_char, end_char, faulty_text, error_type, explanation_key, correction_key }]
  expected_answer JSONB, -- Expected decision, reference SQL, reference calculation, or rubric
  optimality_rubric JSONB, -- { max_score: 40, criteria: string[], penalty_patterns: string[] }
  followup_bank JSONB, -- [{ id, prompt, expected_key_points: string[] }]
  hints JSONB -- { nudge: { deduction: 5, text: string }, pointer: { deduction: 10, text: string }, strong: { deduction: 20, text: string } }
);

-- 4. Learner Test Attempts
CREATE TABLE IF NOT EXISTS public.final_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'timed_out', 'interrupted')),
  camera_verified BOOLEAN NOT NULL DEFAULT FALSE,
  mic_verified BOOLEAN NOT NULL DEFAULT FALSE,
  proctor_mode TEXT NOT NULL DEFAULT 'device_checked' CHECK (proctor_mode IN ('device_checked', 'unproctored')),
  has_accommodation BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_token UUID NOT NULL DEFAULT gen_random_uuid(),
  total_score NUMERIC(5,2),
  overall_level TEXT CHECK (overall_level IN ('insufficient', 'developing', 'proficient', 'advanced')),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  interruption_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Learner Answers per Question
CREATE TABLE IF NOT EXISTS public.final_test_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.final_test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.final_test_questions(id) ON DELETE CASCADE,
  question_order SMALLINT NOT NULL,
  learner_response JSONB NOT NULL,
  base_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  optimality_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  hints_deduction NUMERIC(5,2) NOT NULL DEFAULT 0,
  followup_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  final_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL DEFAULT 'medium',
  ai_review JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- 6. Adaptive Follow-Up Answers
CREATE TABLE IF NOT EXISTS public.final_test_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES public.final_test_answers(id) ON DELETE CASCADE,
  followup_index SMALLINT NOT NULL,
  prompt TEXT NOT NULL,
  learner_response TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  evidence_quote TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Tiered Hint Deductions
CREATE TABLE IF NOT EXISTS public.final_test_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES public.final_test_answers(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('nudge', 'pointer', 'strong')),
  deduction_pct NUMERIC(4,2) NOT NULL,
  revealed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Configuration
ALTER TABLE public.final_test_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_test_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_test_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_test_hints ENABLE ROW LEVEL SECURITY;

-- Configs & Questions: Readable by everyone
CREATE POLICY "Public configs readable" ON public.final_test_configs FOR SELECT USING (true);
CREATE POLICY "Public questions readable" ON public.final_test_questions FOR SELECT USING (true);

-- Secrets: ZERO public/authenticated access policies (server-only via service role)

-- Attempts: Learner owns their rows
CREATE POLICY "Learner reads own attempts" ON public.final_test_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Learner updates own attempts" ON public.final_test_attempts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Learner inserts own attempts" ON public.final_test_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Answers: Learner owns their answers
CREATE POLICY "Learner reads own test answers" ON public.final_test_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.final_test_attempts a
      WHERE a.id = final_test_answers.attempt_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Learner inserts own test answers" ON public.final_test_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.final_test_attempts a
      WHERE a.id = final_test_answers.attempt_id AND a.user_id = auth.uid()
    )
  );

-- Followups & Hints: Learner owns their rows
CREATE POLICY "Learner reads own test followups" ON public.final_test_followups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.final_test_answers ans
      JOIN public.final_test_attempts a ON a.id = ans.attempt_id
      WHERE ans.id = final_test_followups.answer_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Learner reads own test hints" ON public.final_test_hints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.final_test_answers ans
      JOIN public.final_test_attempts a ON a.id = ans.attempt_id
      WHERE ans.id = final_test_hints.answer_id AND a.user_id = auth.uid()
    )
  );
