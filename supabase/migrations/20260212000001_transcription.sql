-- Add meeting_link to appointments for telehealth sessions
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS meeting_link text;

-- Transcription session status
DO $$ BEGIN
  CREATE TYPE public.transcription_status AS ENUM ('active', 'paused', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Transcription sessions table
CREATE TABLE IF NOT EXISTS public.transcription_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  appointment_id uuid REFERENCES public.appointments(id),
  encounter_id uuid REFERENCES public.encounters(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  status public.transcription_status NOT NULL DEFAULT 'active',
  transcript_segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  full_transcript text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.transcription_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON public.transcription_sessions
  USING (org_id = (current_setting('app.current_org_id', true))::uuid);

-- Audit trigger (same pattern as other clinical tables)
CREATE TRIGGER audit_transcription_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.transcription_sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Index for lookups
CREATE INDEX idx_transcription_sessions_patient ON public.transcription_sessions(patient_id);
CREATE INDEX idx_transcription_sessions_appointment ON public.transcription_sessions(appointment_id);
CREATE INDEX idx_transcription_sessions_status ON public.transcription_sessions(status);
