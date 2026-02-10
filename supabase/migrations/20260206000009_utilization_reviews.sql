-- Migration 9: Utilization Reviews
-- AI-generated payer-ready utilization review documents

-- Add new action type to ai_action_type enum
ALTER TYPE public.ai_action_type ADD VALUE IF NOT EXISTS 'generate_utilization_review';

-- UR Status enum
CREATE TYPE public.ur_status AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'submitted',
  'denied',
  'appealed'
);

-- UR Review Type enum
CREATE TYPE public.ur_review_type AS ENUM (
  'initial',
  'concurrent',
  'retrospective'
);

-- Utilization Reviews table
CREATE TABLE public.utilization_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  ai_run_id uuid REFERENCES public.ai_runs(id),
  patient_insurance_id uuid REFERENCES public.patient_insurance(id),
  review_type public.ur_review_type NOT NULL DEFAULT 'concurrent',
  status public.ur_status NOT NULL DEFAULT 'draft',
  authorization_period_start date,
  authorization_period_end date,
  sessions_authorized int,
  sessions_used int,
  sessions_requested int,
  generated_content jsonb NOT NULL,
  provider_edits jsonb,
  approved_at timestamptz,
  approved_by uuid REFERENCES public.providers(id),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_utilization_reviews_org ON public.utilization_reviews(org_id);
CREATE INDEX idx_utilization_reviews_patient ON public.utilization_reviews(patient_id);
CREATE INDEX idx_utilization_reviews_status ON public.utilization_reviews(status);

-- updated_at trigger
CREATE TRIGGER trg_utilization_reviews_updated_at
  BEFORE UPDATE ON public.utilization_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Audit trigger
CREATE TRIGGER audit_utilization_reviews
  AFTER INSERT OR UPDATE OR DELETE ON public.utilization_reviews
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- RLS
ALTER TABLE public.utilization_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "utilization_reviews_select" ON public.utilization_reviews FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "utilization_reviews_insert" ON public.utilization_reviews FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "utilization_reviews_update" ON public.utilization_reviews FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- ============================================================
-- Seed: Maria Garcia low-authorization insurance for demo
-- Update her existing record to show only 2 sessions remaining
-- ============================================================
UPDATE public.patient_insurance
SET authorized_sessions = 10,
    sessions_used = 8,
    authorization_number = 'AUTH-BCBS-MG-2025'
WHERE patient_id = 'd0000000-0000-0000-0000-000000000004'
  AND org_id = 'a0000000-0000-0000-0000-000000000001';
