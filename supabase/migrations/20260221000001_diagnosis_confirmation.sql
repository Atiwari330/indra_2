-- Add pending_review status and confirmation tracking to patient_diagnoses

-- 1. Add 'pending_review' to the diagnosis_status enum
ALTER TYPE diagnosis_status ADD VALUE IF NOT EXISTS 'pending_review';

-- 2. Add confirmation and AI provenance columns
ALTER TABLE patient_diagnoses
  ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES providers(id),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_run_id uuid REFERENCES ai_runs(id);

-- 3. Index for querying pending + active diagnoses per patient
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_patient_status
  ON patient_diagnoses (patient_id, status);
