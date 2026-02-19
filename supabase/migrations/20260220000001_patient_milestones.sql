-- Migration: Patient Milestones
-- Lightweight table for manually-toggled clinical milestones (e.g., consent/intake forms)
-- Other workflow steps are derived from existing clinical data.

CREATE TABLE public.patient_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  milestone_type text NOT NULL CHECK (milestone_type IN ('consent_intake_forms')),
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_by uuid NOT NULL REFERENCES public.providers(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_patient_milestone UNIQUE (patient_id, org_id, milestone_type)
);

-- Indexes
CREATE INDEX idx_patient_milestones_patient ON public.patient_milestones(patient_id);
CREATE INDEX idx_patient_milestones_org ON public.patient_milestones(org_id);

-- RLS
ALTER TABLE public.patient_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_milestones_select" ON public.patient_milestones
  FOR SELECT TO authenticated
  USING (org_id = (SELECT public.get_org_id()));

CREATE POLICY "patient_milestones_insert" ON public.patient_milestones
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT public.get_org_id()));

CREATE POLICY "patient_milestones_delete" ON public.patient_milestones
  FOR DELETE TO authenticated
  USING (org_id = (SELECT public.get_org_id()));

-- Audit trigger
CREATE TRIGGER audit_patient_milestones
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_milestones
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
