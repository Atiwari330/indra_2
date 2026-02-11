-- Migration: Patient Portal RLS Policies
-- Patient-scoped access using get_portal_patient_id()

-- ============================================================
-- Provider policies for portal tables (org-scoped, standard pattern)
-- ============================================================

-- Providers can see mood check-ins for their org
CREATE POLICY "mood_checkins_provider_select" ON public.mood_checkins
  FOR SELECT TO authenticated
  USING (org_id = (SELECT public.get_org_id()));

CREATE POLICY "mood_checkins_provider_insert" ON public.mood_checkins
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT public.get_org_id()));

-- Providers can see session prep notes for their org
CREATE POLICY "session_prep_provider_select" ON public.session_prep_notes
  FOR SELECT TO authenticated
  USING (org_id = (SELECT public.get_org_id()));

CREATE POLICY "session_prep_provider_insert" ON public.session_prep_notes
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT public.get_org_id()));

CREATE POLICY "session_prep_provider_update" ON public.session_prep_notes
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT public.get_org_id()));

-- Providers can see message threads for their org
CREATE POLICY "portal_threads_provider_select" ON public.portal_message_threads
  FOR SELECT TO authenticated
  USING (org_id = (SELECT public.get_org_id()));

CREATE POLICY "portal_threads_provider_insert" ON public.portal_message_threads
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT public.get_org_id()));

-- Providers can see messages for their org
CREATE POLICY "portal_messages_provider_select" ON public.portal_messages
  FOR SELECT TO authenticated
  USING (org_id = (SELECT public.get_org_id()));

CREATE POLICY "portal_messages_provider_insert" ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT public.get_org_id()));

-- ============================================================
-- Patient portal policies (patient-scoped via get_portal_patient_id)
-- These use a separate role check pattern for future portal auth
-- ============================================================

-- Patients: own row only
CREATE POLICY "patients_portal_select" ON public.patients
  FOR SELECT TO authenticated
  USING (id = (SELECT public.get_portal_patient_id()));

-- Appointments: own appointments
CREATE POLICY "appointments_portal_select" ON public.appointments
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.get_portal_patient_id()));

-- Diagnoses: own diagnoses
CREATE POLICY "diagnoses_portal_select" ON public.patient_diagnoses
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.get_portal_patient_id()));

-- Medications: own medications
CREATE POLICY "medications_portal_select" ON public.medications
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.get_portal_patient_id()));

-- Treatment plans: own plans
CREATE POLICY "treatment_plans_portal_select" ON public.treatment_plans
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.get_portal_patient_id()));

-- Assessment scores: own scores
CREATE POLICY "assessment_scores_portal_select" ON public.assessment_scores
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.get_portal_patient_id()));

-- Mood check-ins: own check-ins (read + write)
CREATE POLICY "mood_checkins_portal_select" ON public.mood_checkins
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.get_portal_patient_id()));

CREATE POLICY "mood_checkins_portal_insert" ON public.mood_checkins
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = (SELECT public.get_portal_patient_id()));

-- Session prep notes: own notes (read + write + update)
CREATE POLICY "session_prep_portal_select" ON public.session_prep_notes
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.get_portal_patient_id()));

CREATE POLICY "session_prep_portal_insert" ON public.session_prep_notes
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = (SELECT public.get_portal_patient_id()));

CREATE POLICY "session_prep_portal_update" ON public.session_prep_notes
  FOR UPDATE TO authenticated
  USING (patient_id = (SELECT public.get_portal_patient_id()));

-- Message threads: own threads (read + create)
CREATE POLICY "portal_threads_portal_select" ON public.portal_message_threads
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.get_portal_patient_id()));

CREATE POLICY "portal_threads_portal_insert" ON public.portal_message_threads
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = (SELECT public.get_portal_patient_id()));

-- Messages: own thread messages (read + create)
CREATE POLICY "portal_messages_portal_select" ON public.portal_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.portal_message_threads t
    WHERE t.id = thread_id AND t.patient_id = (SELECT public.get_portal_patient_id())
  ));

CREATE POLICY "portal_messages_portal_insert" ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.portal_message_threads t
    WHERE t.id = thread_id AND t.patient_id = (SELECT public.get_portal_patient_id())
  ));
