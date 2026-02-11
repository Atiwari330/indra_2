-- Migration: Patient Portal tables
-- Adds portal-specific tables for mood check-ins, session prep, and messaging

-- ============================================================
-- Modify patients table: add auth_id for portal login
-- ============================================================
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_patients_auth_id ON public.patients(auth_id);

-- ============================================================
-- Helper function: get current patient ID from JWT
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_portal_patient_id()
RETURNS uuid AS $$
  SELECT id FROM public.patients WHERE auth_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- ============================================================
-- Mood level enum
-- ============================================================
CREATE TYPE public.mood_level AS ENUM ('great', 'good', 'okay', 'low', 'rough');

-- ============================================================
-- Mood Check-ins
-- ============================================================
CREATE TABLE public.mood_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  mood public.mood_level NOT NULL,
  note text,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mood_checkins_patient_date ON public.mood_checkins(patient_id, checked_in_at DESC);

-- ============================================================
-- Session Prep Notes
-- ============================================================
CREATE TABLE public.session_prep_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_prep_patient ON public.session_prep_notes(patient_id);
CREATE INDEX idx_session_prep_appointment ON public.session_prep_notes(appointment_id);

-- ============================================================
-- Message sender type enum
-- ============================================================
CREATE TYPE public.portal_sender_type AS ENUM ('patient', 'provider');

-- ============================================================
-- Portal Message Threads
-- ============================================================
CREATE TABLE public.portal_message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  subject text NOT NULL,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portal_threads_patient ON public.portal_message_threads(patient_id, last_message_at DESC);

-- ============================================================
-- Portal Messages
-- ============================================================
CREATE TABLE public.portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.portal_message_threads(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  sender_type public.portal_sender_type NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portal_messages_thread ON public.portal_messages(thread_id, created_at);

-- ============================================================
-- Enable RLS on new tables
-- ============================================================
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_prep_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Audit triggers for new tables
-- ============================================================
CREATE TRIGGER audit_mood_checkins
  AFTER INSERT OR UPDATE OR DELETE ON public.mood_checkins
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_session_prep_notes
  AFTER INSERT OR UPDATE OR DELETE ON public.session_prep_notes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_portal_message_threads
  AFTER INSERT OR UPDATE OR DELETE ON public.portal_message_threads
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_portal_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.portal_messages
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
