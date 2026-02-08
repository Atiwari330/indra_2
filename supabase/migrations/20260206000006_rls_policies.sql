-- Migration 6: Row Level Security Policies
-- Multi-tenant isolation via org_id from JWT claims

-- Helper function to get org_id from JWT
CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS uuid AS $$
  SELECT (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid;
$$ LANGUAGE sql STABLE;

-- Helper function to get user_id from JWT
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS uuid AS $$
  SELECT (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- Enable RLS on ALL tables
-- ============================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpt_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icd10_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_proposed_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_clarifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Reference tables: read-only for all authenticated users
-- ============================================================
CREATE POLICY "cpt_codes_select" ON public.cpt_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "icd10_codes_select" ON public.icd10_codes FOR SELECT TO authenticated USING (true);

-- ============================================================
-- Organization-scoped policies (using subselect pattern for performance)
-- ============================================================

-- Organizations: users can only see their own org
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated
  USING (id = (select public.get_org_id()));

-- Users: org isolation
CREATE POLICY "users_select" ON public.users FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Providers: org isolation
CREATE POLICY "providers_select" ON public.providers FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "providers_insert" ON public.providers FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));

-- Patients: org isolation, all roles can read
CREATE POLICY "patients_select" ON public.patients FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "patients_insert" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "patients_update" ON public.patients FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Patient Diagnoses
CREATE POLICY "patient_diagnoses_select" ON public.patient_diagnoses FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "patient_diagnoses_insert" ON public.patient_diagnoses FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "patient_diagnoses_update" ON public.patient_diagnoses FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Encounters
CREATE POLICY "encounters_select" ON public.encounters FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "encounters_insert" ON public.encounters FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "encounters_update" ON public.encounters FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Clinical Notes: org isolation + signed notes cannot be updated
CREATE POLICY "clinical_notes_select" ON public.clinical_notes FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "clinical_notes_insert" ON public.clinical_notes FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "clinical_notes_update" ON public.clinical_notes FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()) AND status != 'signed');

-- Note Signatures
CREATE POLICY "note_signatures_select" ON public.note_signatures FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clinical_notes cn
    WHERE cn.id = clinical_note_id AND cn.org_id = (select public.get_org_id())
  ));
CREATE POLICY "note_signatures_insert" ON public.note_signatures FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clinical_notes cn
    WHERE cn.id = clinical_note_id AND cn.org_id = (select public.get_org_id())
  ));

-- Treatment Plans
CREATE POLICY "treatment_plans_select" ON public.treatment_plans FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "treatment_plans_insert" ON public.treatment_plans FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "treatment_plans_update" ON public.treatment_plans FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Appointments
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Medications
CREATE POLICY "medications_select" ON public.medications FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "medications_insert" ON public.medications FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "medications_update" ON public.medications FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Insurance Payers
CREATE POLICY "insurance_payers_select" ON public.insurance_payers FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "insurance_payers_insert" ON public.insurance_payers FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));

-- Patient Insurance
CREATE POLICY "patient_insurance_select" ON public.patient_insurance FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "patient_insurance_insert" ON public.patient_insurance FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "patient_insurance_update" ON public.patient_insurance FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Billing Claims
CREATE POLICY "billing_claims_select" ON public.billing_claims FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "billing_claims_insert" ON public.billing_claims FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "billing_claims_update" ON public.billing_claims FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Claim Line Items (through claim)
CREATE POLICY "claim_line_items_select" ON public.claim_line_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.billing_claims bc
    WHERE bc.id = claim_id AND bc.org_id = (select public.get_org_id())
  ));
CREATE POLICY "claim_line_items_insert" ON public.claim_line_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.billing_claims bc
    WHERE bc.id = claim_id AND bc.org_id = (select public.get_org_id())
  ));

-- Claim Diagnoses (through claim)
CREATE POLICY "claim_diagnoses_select" ON public.claim_diagnoses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.billing_claims bc
    WHERE bc.id = claim_id AND bc.org_id = (select public.get_org_id())
  ));
CREATE POLICY "claim_diagnoses_insert" ON public.claim_diagnoses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.billing_claims bc
    WHERE bc.id = claim_id AND bc.org_id = (select public.get_org_id())
  ));

-- AI Runs
CREATE POLICY "ai_runs_select" ON public.ai_runs FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "ai_runs_insert" ON public.ai_runs FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "ai_runs_update" ON public.ai_runs FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- AI Steps (through run)
CREATE POLICY "ai_steps_select" ON public.ai_steps FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_runs r WHERE r.id = run_id AND r.org_id = (select public.get_org_id())
  ));
CREATE POLICY "ai_steps_insert" ON public.ai_steps FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_runs r WHERE r.id = run_id AND r.org_id = (select public.get_org_id())
  ));

-- AI Proposed Actions
CREATE POLICY "ai_proposed_actions_select" ON public.ai_proposed_actions FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "ai_proposed_actions_insert" ON public.ai_proposed_actions FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "ai_proposed_actions_update" ON public.ai_proposed_actions FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- AI Clarifications
CREATE POLICY "ai_clarifications_select" ON public.ai_clarifications FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "ai_clarifications_insert" ON public.ai_clarifications FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "ai_clarifications_update" ON public.ai_clarifications FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Note Drafts
CREATE POLICY "note_drafts_select" ON public.note_drafts FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "note_drafts_insert" ON public.note_drafts FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "note_drafts_update" ON public.note_drafts FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Audit Log: SELECT and INSERT only (append-only)
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));

-- ============================================================
-- Service role bypass (for server-side operations)
-- The service_role key bypasses RLS by default in Supabase
-- ============================================================
