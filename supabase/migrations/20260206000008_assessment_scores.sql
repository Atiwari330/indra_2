-- Migration 8: Assessment Scores
-- Structured outcome measure tracking for session continuity

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE public.assessment_measure_type AS ENUM ('PHQ-9', 'GAD-7', 'PCL-5', 'AUDIT-C', 'CSSRS');
CREATE TYPE public.assessment_score_source AS ENUM ('ai_tool', 'manual_entry', 'client_portal');

-- ============================================================
-- Assessment Scores Table
-- ============================================================
CREATE TABLE public.assessment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid REFERENCES public.encounters(id),  -- nullable for future portal-submitted scores
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  measure_type public.assessment_measure_type NOT NULL,
  score numeric(5,2) NOT NULL,
  source public.assessment_score_source NOT NULL DEFAULT 'ai_tool',
  administered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_assessment_scores_patient_measure ON public.assessment_scores(patient_id, measure_type, administered_at DESC);
CREATE INDEX idx_assessment_scores_encounter ON public.assessment_scores(encounter_id);
CREATE INDEX idx_assessment_scores_org ON public.assessment_scores(org_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessment_scores_select" ON public.assessment_scores FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "assessment_scores_insert" ON public.assessment_scores FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));

-- Service role has full access by default (bypasses RLS)
GRANT ALL ON public.assessment_scores TO service_role;
GRANT SELECT, INSERT ON public.assessment_scores TO authenticated;

-- ============================================================
-- Audit trigger
-- ============================================================
CREATE TRIGGER audit_assessment_scores
  AFTER INSERT OR UPDATE OR DELETE ON public.assessment_scores
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================
-- Seed Data: Assessment Scores
-- ============================================================

-- John Doe PHQ-9 scores (historical, entered by clinician)
INSERT INTO public.assessment_scores (id, encounter_id, patient_id, org_id, measure_type, score, source, administered_at) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PHQ-9', 16, 'manual_entry', '2025-12-15 17:00:00+00'),
  ('e1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PHQ-9', 14, 'manual_entry', '2026-01-05 17:00:00+00'),
  ('e1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PHQ-9', 11, 'manual_entry', '2026-01-19 17:00:00+00');

-- Jane Smith PCL-5 scores (historical, entered by clinician)
INSERT INTO public.assessment_scores (id, encounter_id, patient_id, org_id, measure_type, score, source, administered_at) VALUES
  ('e1000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'PCL-5', 65, 'manual_entry', '2026-01-10 18:00:00+00'),
  ('e1000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'PCL-5', 58, 'manual_entry', '2026-01-24 18:00:00+00');

-- ============================================================
-- Fix existing seed notes: add risk_assessment (currently NULL)
-- ============================================================

-- John Doe's 3 notes
UPDATE public.clinical_notes
SET risk_assessment = '{"suicidal_ideation": false, "homicidal_ideation": false, "self_harm": false, "details": "Patient denied SI/HI/SH."}'::jsonb
WHERE id IN (
  'f0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000003'
);

-- Jane Smith's 2 notes (PTSD-relevant details)
UPDATE public.clinical_notes
SET risk_assessment = '{"suicidal_ideation": false, "homicidal_ideation": false, "self_harm": false, "details": "Patient denied SI/HI/SH. Safety plan reviewed and current."}'::jsonb
WHERE id IN (
  'f0000000-0000-0000-0000-000000000004',
  'f0000000-0000-0000-0000-000000000005'
);
