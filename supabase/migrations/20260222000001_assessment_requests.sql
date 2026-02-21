-- Migration: Assessment Requests
-- Portal-based standardized assessment workflow (PHQ-9, GAD-7)

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE public.assessment_request_status AS ENUM ('pending', 'in_progress', 'completed', 'expired');

-- ============================================================
-- Assessment Requests Table
-- ============================================================
CREATE TABLE public.assessment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  measure_type public.assessment_measure_type NOT NULL,
  status public.assessment_request_status NOT NULL DEFAULT 'pending',
  responses jsonb,
  total_score numeric(5,2),
  severity text,
  provider_viewed_at timestamptz,
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_assessment_requests_patient_status ON public.assessment_requests(patient_id, status);
CREATE INDEX idx_assessment_requests_provider_viewed ON public.assessment_requests(provider_id, completed_at) WHERE provider_viewed_at IS NULL;
CREATE INDEX idx_assessment_requests_org ON public.assessment_requests(org_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.assessment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessment_requests_select" ON public.assessment_requests FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "assessment_requests_insert" ON public.assessment_requests FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "assessment_requests_update" ON public.assessment_requests FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Service role has full access by default (bypasses RLS)
GRANT ALL ON public.assessment_requests TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.assessment_requests TO authenticated;

-- ============================================================
-- Audit trigger
-- ============================================================
CREATE TRIGGER audit_assessment_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.assessment_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
