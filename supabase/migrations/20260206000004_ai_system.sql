-- Migration 4: AI System Tables
-- Runs, steps, proposed actions, clarifications, note drafts

-- Enums
CREATE TYPE public.ai_run_status AS ENUM (
  'pending', 'running', 'needs_clarification', 'ready_to_commit', 'committed', 'failed'
);
CREATE TYPE public.ai_step_type AS ENUM ('llm_call', 'tool_call', 'tool_result', 'error');
CREATE TYPE public.ai_action_type AS ENUM (
  'create_note_draft', 'create_encounter', 'suggest_billing',
  'update_medication', 'create_appointment'
);
CREATE TYPE public.ai_action_status AS ENUM ('pending', 'committed', 'rejected', 'expired');
CREATE TYPE public.note_draft_status AS ENUM ('pending_review', 'accepted', 'rejected');

-- AI Runs
CREATE TABLE public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL REFERENCES public.users(id),
  patient_id uuid REFERENCES public.patients(id),
  encounter_id uuid REFERENCES public.encounters(id),
  idempotency_key text UNIQUE,
  status public.ai_run_status NOT NULL DEFAULT 'pending',
  input_text text NOT NULL,
  intent_type text,
  result_summary text,
  total_tokens int DEFAULT 0,
  total_cost_cents numeric(10,4) DEFAULT 0,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_runs_org ON public.ai_runs(org_id);
CREATE INDEX idx_ai_runs_user ON public.ai_runs(user_id);
CREATE INDEX idx_ai_runs_idempotency ON public.ai_runs(idempotency_key);

-- AI Steps (full message content for resumability)
CREATE TABLE public.ai_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.ai_runs(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  step_type public.ai_step_type NOT NULL,
  tool_name text,
  input jsonb,
  output jsonb,
  messages jsonb, -- full message content for resumability
  tokens_input int DEFAULT 0,
  tokens_output int DEFAULT 0,
  duration_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_steps_run ON public.ai_steps(run_id, step_number);

-- AI Proposed Actions
CREATE TABLE public.ai_proposed_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.ai_runs(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  action_group uuid NOT NULL DEFAULT gen_random_uuid(),
  action_group_label text,
  action_type public.ai_action_type NOT NULL,
  action_order smallint NOT NULL DEFAULT 0,
  target_table text NOT NULL,
  payload jsonb NOT NULL,
  status public.ai_action_status NOT NULL DEFAULT 'pending',
  provider_modified_payload jsonb,
  confidence_score real,
  assumptions jsonb,
  requires_review boolean NOT NULL DEFAULT true,
  committed_at timestamptz,
  committed_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_proposed_actions_run ON public.ai_proposed_actions(run_id);
CREATE INDEX idx_ai_proposed_actions_org ON public.ai_proposed_actions(org_id);
CREATE INDEX idx_ai_proposed_actions_group ON public.ai_proposed_actions(action_group);

-- AI Clarifications
CREATE TABLE public.ai_clarifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.ai_runs(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  question text NOT NULL,
  context jsonb,
  options jsonb,
  answer text,
  answered_at timestamptz,
  answered_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_clarifications_run ON public.ai_clarifications(run_id);

-- Note Drafts (AI-generated, separate from clinical_notes)
CREATE TABLE public.note_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid REFERENCES public.encounters(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  ai_run_id uuid REFERENCES public.ai_runs(id),
  source_transcript text,
  note_type public.note_type NOT NULL,
  generated_content jsonb NOT NULL,
  provider_edits jsonb,
  status public.note_draft_status NOT NULL DEFAULT 'pending_review',
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_note_drafts_org ON public.note_drafts(org_id);
CREATE INDEX idx_note_drafts_encounter ON public.note_drafts(encounter_id);
CREATE INDEX idx_note_drafts_run ON public.note_drafts(ai_run_id);
