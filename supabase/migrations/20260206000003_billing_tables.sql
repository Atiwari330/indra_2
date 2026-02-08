-- Migration 3: Billing Tables
-- CPT/ICD-10 reference tables, insurance, claims, line items, claim diagnoses

-- Enums
CREATE TYPE public.insurance_priority AS ENUM ('primary', 'secondary', 'tertiary');
CREATE TYPE public.claim_status AS ENUM (
  'draft', 'ready', 'submitted', 'accepted', 'rejected', 'denied', 'paid', 'appealed'
);

-- CPT Codes (reference table)
CREATE TABLE public.cpt_codes (
  code varchar(5) PRIMARY KEY,
  description text NOT NULL,
  category text,
  time_range_minutes int4range,
  is_addon boolean NOT NULL DEFAULT false,
  effective_date date,
  termination_date date
);

-- ICD-10 Codes (reference table)
CREATE TABLE public.icd10_codes (
  code varchar(10) PRIMARY KEY,
  description text NOT NULL,
  category text,
  is_billable boolean NOT NULL DEFAULT true,
  chapter text,
  effective_date date
);

-- Insurance Payers
CREATE TABLE public.insurance_payers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  payer_id_number text,
  address jsonb,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_insurance_payers_org ON public.insurance_payers(org_id);

-- Patient Insurance
CREATE TABLE public.patient_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  payer_id uuid NOT NULL REFERENCES public.insurance_payers(id),
  priority public.insurance_priority NOT NULL DEFAULT 'primary',
  member_id text,
  group_number text,
  subscriber_name text,
  copay_amount numeric(10,2),
  coinsurance_pct numeric(5,2),
  deductible_amount numeric(10,2),
  authorization_number text,
  authorized_sessions int,
  sessions_used int DEFAULT 0,
  effective_date date,
  termination_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_insurance_org ON public.patient_insurance(org_id);
CREATE INDEX idx_patient_insurance_patient ON public.patient_insurance(patient_id);

-- Billing Claims
CREATE TABLE public.billing_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  patient_insurance_id uuid REFERENCES public.patient_insurance(id),
  claim_number text UNIQUE,
  status public.claim_status NOT NULL DEFAULT 'draft',
  date_of_service date NOT NULL,
  place_of_service varchar(2) DEFAULT '11',
  total_charge numeric(10,2),
  amount_paid numeric(10,2) DEFAULT 0,
  patient_responsibility numeric(10,2) DEFAULT 0,
  submitted_at timestamptz,
  paid_at timestamptz,
  denial_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_claims_org ON public.billing_claims(org_id);
CREATE INDEX idx_billing_claims_encounter ON public.billing_claims(encounter_id);
CREATE INDEX idx_billing_claims_patient ON public.billing_claims(patient_id);

CREATE TRIGGER trg_billing_claims_updated_at
  BEFORE UPDATE ON public.billing_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Claim Line Items
CREATE TABLE public.claim_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.billing_claims(id) ON DELETE CASCADE,
  line_number int NOT NULL,
  cpt_code varchar(5) NOT NULL REFERENCES public.cpt_codes(code),
  modifier_1 varchar(2),
  modifier_2 varchar(2),
  diagnosis_pointers int[] NOT NULL DEFAULT '{1}', -- references claim_diagnoses by sequence_number
  units int NOT NULL DEFAULT 1,
  charge_amount numeric(10,2) NOT NULL,
  rendering_provider_npi varchar(10),
  service_date date NOT NULL,
  UNIQUE(claim_id, line_number)
);

CREATE INDEX idx_claim_line_items_claim ON public.claim_line_items(claim_id);

-- Claim Diagnoses
CREATE TABLE public.claim_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.billing_claims(id) ON DELETE CASCADE,
  sequence_number int NOT NULL CHECK (sequence_number BETWEEN 1 AND 12),
  icd10_code varchar(10) NOT NULL REFERENCES public.icd10_codes(code),
  UNIQUE(claim_id, sequence_number)
);

CREATE INDEX idx_claim_diagnoses_claim ON public.claim_diagnoses(claim_id);
