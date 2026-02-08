-- Migration 2: Clinical Tables
-- Patients, diagnoses, encounters, clinical notes, treatment plans, appointments, medications

-- Enums
CREATE TYPE public.patient_status AS ENUM ('active', 'inactive', 'discharged');
CREATE TYPE public.diagnosis_status AS ENUM ('active', 'resolved', 'ruled_out');
CREATE TYPE public.encounter_type AS ENUM (
  'individual_therapy', 'group_therapy', 'family_therapy',
  'intake', 'crisis', 'telehealth', 'medication_management'
);
CREATE TYPE public.encounter_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.note_type AS ENUM ('SOAP', 'DAP', 'BIRP', 'intake', 'discharge');
CREATE TYPE public.note_status AS ENUM ('draft', 'signed', 'amended', 'addended');
CREATE TYPE public.signature_type AS ENUM ('author', 'cosigner', 'supervisor');
CREATE TYPE public.treatment_plan_status AS ENUM ('draft', 'active', 'completed', 'discontinued');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.medication_status AS ENUM ('active', 'discontinued', 'changed');

-- Patients
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date NOT NULL,
  gender text,
  email text,
  phone text,
  address jsonb,
  emergency_contact jsonb,
  status public.patient_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_org_id ON public.patients(org_id);
CREATE INDEX idx_patients_name ON public.patients(org_id, last_name, first_name);

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Patient Diagnoses
CREATE TABLE public.patient_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  icd10_code varchar(10) NOT NULL,
  description text NOT NULL,
  status public.diagnosis_status NOT NULL DEFAULT 'active',
  is_primary boolean NOT NULL DEFAULT false,
  onset_date date,
  resolved_date date,
  diagnosed_by uuid REFERENCES public.providers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_diagnoses_patient ON public.patient_diagnoses(patient_id);
CREATE INDEX idx_patient_diagnoses_org ON public.patient_diagnoses(org_id);

-- Appointments (defined before encounters since encounters can reference them)
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  appointment_type text,
  recurring_rule jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_org ON public.appointments(org_id);
CREATE INDEX idx_appointments_provider ON public.appointments(provider_id, start_time);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);

-- Encounters
CREATE TABLE public.encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  encounter_date date NOT NULL,
  encounter_type public.encounter_type NOT NULL,
  status public.encounter_status NOT NULL DEFAULT 'scheduled',
  duration_minutes int,
  place_of_service varchar(2) DEFAULT '11', -- 11 = Office
  appointment_id uuid REFERENCES public.appointments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_encounters_org ON public.encounters(org_id);
CREATE INDEX idx_encounters_patient ON public.encounters(patient_id);
CREATE INDEX idx_encounters_provider_date ON public.encounters(provider_id, encounter_date);

-- Clinical Notes (versioned, append-only pattern)
CREATE TABLE public.clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  note_type public.note_type NOT NULL,
  version int NOT NULL DEFAULT 1,
  is_current boolean NOT NULL DEFAULT true,
  status public.note_status NOT NULL DEFAULT 'draft',
  content jsonb NOT NULL, -- format-specific: {subjective,objective,assessment,plan} for SOAP, etc.
  risk_assessment jsonb, -- {suicidal_ideation, homicidal_ideation, self_harm}
  signed_at timestamptz,
  signed_by uuid REFERENCES public.providers(id),
  amendment_reason text,
  previous_version_id uuid REFERENCES public.clinical_notes(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinical_notes_org ON public.clinical_notes(org_id);
CREATE INDEX idx_clinical_notes_encounter ON public.clinical_notes(encounter_id);
CREATE INDEX idx_clinical_notes_patient ON public.clinical_notes(patient_id);

-- Note Signatures
CREATE TABLE public.note_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_note_id uuid NOT NULL REFERENCES public.clinical_notes(id),
  signer_id uuid NOT NULL REFERENCES public.providers(id),
  signature_type public.signature_type NOT NULL DEFAULT 'author',
  content_hash text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_note_signatures_note ON public.note_signatures(clinical_note_id);

-- Treatment Plans (versioned)
CREATE TABLE public.treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  version int NOT NULL DEFAULT 1,
  is_current boolean NOT NULL DEFAULT true,
  status public.treatment_plan_status NOT NULL DEFAULT 'draft',
  diagnosis_codes jsonb,
  goals jsonb,
  objectives jsonb,
  interventions jsonb,
  review_date date,
  previous_version_id uuid REFERENCES public.treatment_plans(id),
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_treatment_plans_org ON public.treatment_plans(org_id);
CREATE INDEX idx_treatment_plans_patient ON public.treatment_plans(patient_id);

-- Medications
CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  route text DEFAULT 'oral',
  status public.medication_status NOT NULL DEFAULT 'active',
  start_date date NOT NULL,
  end_date date,
  change_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medications_org ON public.medications(org_id);
CREATE INDEX idx_medications_patient ON public.medications(patient_id);
