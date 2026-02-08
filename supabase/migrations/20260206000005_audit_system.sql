-- Migration 5: Audit System
-- Append-only audit log with database triggers

-- Audit Log (append-only)
CREATE TABLE public.audit_log (
  id bigserial PRIMARY KEY,
  event_time timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  patient_id uuid,
  org_id uuid,
  ai_run_id uuid
);

CREATE INDEX idx_audit_log_table ON public.audit_log(table_name, event_time);
CREATE INDEX idx_audit_log_record ON public.audit_log(record_id);
CREATE INDEX idx_audit_log_patient ON public.audit_log(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_audit_log_org ON public.audit_log(org_id);

-- Make audit_log append-only: revoke UPDATE and DELETE
REVOKE UPDATE, DELETE ON public.audit_log FROM public;
REVOKE UPDATE, DELETE ON public.audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON public.audit_log FROM anon;

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data jsonb;
  v_new_data jsonb;
  v_changed_fields text[];
  v_record_id uuid;
  v_patient_id uuid;
  v_org_id uuid;
  v_user_id uuid;
  v_key text;
BEGIN
  -- Get the current user from JWT if available
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := OLD.id;
    -- Try to extract patient_id and org_id
    v_patient_id := CASE WHEN v_old_data ? 'patient_id' THEN (v_old_data->>'patient_id')::uuid ELSE NULL END;
    v_org_id := CASE WHEN v_old_data ? 'org_id' THEN (v_old_data->>'org_id')::uuid ELSE NULL END;

    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data, patient_id, org_id)
    VALUES (v_user_id, 'DELETE', TG_TABLE_NAME, v_record_id, v_old_data, v_patient_id, v_org_id);
    RETURN OLD;

  ELSIF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
    v_patient_id := CASE WHEN v_new_data ? 'patient_id' THEN (v_new_data->>'patient_id')::uuid ELSE NULL END;
    v_org_id := CASE WHEN v_new_data ? 'org_id' THEN (v_new_data->>'org_id')::uuid ELSE NULL END;

    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_data, patient_id, org_id)
    VALUES (v_user_id, 'INSERT', TG_TABLE_NAME, v_record_id, v_new_data, v_patient_id, v_org_id);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
    v_patient_id := CASE WHEN v_new_data ? 'patient_id' THEN (v_new_data->>'patient_id')::uuid ELSE NULL END;
    v_org_id := CASE WHEN v_new_data ? 'org_id' THEN (v_new_data->>'org_id')::uuid ELSE NULL END;

    -- Compute changed fields
    v_changed_fields := ARRAY[]::text[];
    FOR v_key IN SELECT jsonb_object_keys(v_new_data)
    LOOP
      IF v_old_data->v_key IS DISTINCT FROM v_new_data->v_key THEN
        v_changed_fields := array_append(v_changed_fields, v_key);
      END IF;
    END LOOP;

    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data, new_data, changed_fields, patient_id, org_id)
    VALUES (v_user_id, 'UPDATE', TG_TABLE_NAME, v_record_id, v_old_data, v_new_data, v_changed_fields, v_patient_id, v_org_id);
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers to all auditable tables
CREATE TRIGGER audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_encounters
  AFTER INSERT OR UPDATE OR DELETE ON public.encounters
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_clinical_notes
  AFTER INSERT OR UPDATE OR DELETE ON public.clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_treatment_plans
  AFTER INSERT OR UPDATE OR DELETE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_medications
  AFTER INSERT OR UPDATE OR DELETE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_billing_claims
  AFTER INSERT OR UPDATE OR DELETE ON public.billing_claims
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_patient_diagnoses
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_diagnoses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_ai_proposed_actions
  AFTER INSERT OR UPDATE OR DELETE ON public.ai_proposed_actions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
