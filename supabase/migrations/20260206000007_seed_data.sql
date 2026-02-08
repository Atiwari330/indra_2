-- Migration 7: Seed Data
-- CPT codes, ICD-10 codes, test organization, providers, patients

-- ============================================================
-- Common Behavioral Health CPT Codes
-- ============================================================
INSERT INTO public.cpt_codes (code, description, category, time_range_minutes, is_addon, effective_date) VALUES
  ('90791', 'Psychiatric Diagnostic Evaluation', 'evaluation', NULL, false, '2024-01-01'),
  ('90792', 'Psychiatric Diagnostic Evaluation with Medical Services', 'evaluation', NULL, false, '2024-01-01'),
  ('90832', 'Psychotherapy, 30 minutes', 'psychotherapy', '[16,37)', false, '2024-01-01'),
  ('90834', 'Psychotherapy, 45 minutes', 'psychotherapy', '[38,52)', false, '2024-01-01'),
  ('90837', 'Psychotherapy, 60 minutes', 'psychotherapy', '[53,999)', false, '2024-01-01'),
  ('90846', 'Family Psychotherapy without Patient', 'family_therapy', NULL, false, '2024-01-01'),
  ('90847', 'Family Psychotherapy with Patient', 'family_therapy', NULL, false, '2024-01-01'),
  ('90853', 'Group Psychotherapy', 'group_therapy', NULL, false, '2024-01-01'),
  ('90839', 'Psychotherapy for Crisis, first 60 minutes', 'crisis', NULL, false, '2024-01-01'),
  ('90840', 'Psychotherapy for Crisis, each additional 30 minutes', 'crisis', NULL, true, '2024-01-01'),
  ('99213', 'Office Visit, Established Patient, Low Complexity', 'e_and_m', NULL, false, '2024-01-01'),
  ('99214', 'Office Visit, Established Patient, Moderate Complexity', 'e_and_m', NULL, false, '2024-01-01');

-- ============================================================
-- Common Behavioral Health ICD-10 Codes
-- ============================================================
INSERT INTO public.icd10_codes (code, description, category, is_billable, chapter) VALUES
  -- Depression
  ('F32.0', 'Major depressive disorder, single episode, mild', 'depression', true, 'F30-F39'),
  ('F32.1', 'Major depressive disorder, single episode, moderate', 'depression', true, 'F30-F39'),
  ('F32.2', 'Major depressive disorder, single episode, severe without psychotic features', 'depression', true, 'F30-F39'),
  ('F32.9', 'Major depressive disorder, single episode, unspecified', 'depression', true, 'F30-F39'),
  ('F33.0', 'Major depressive disorder, recurrent, mild', 'depression', true, 'F30-F39'),
  ('F33.1', 'Major depressive disorder, recurrent, moderate', 'depression', true, 'F30-F39'),
  ('F33.2', 'Major depressive disorder, recurrent, severe without psychotic features', 'depression', true, 'F30-F39'),
  -- Anxiety
  ('F41.0', 'Panic disorder [episodic paroxysmal anxiety]', 'anxiety', true, 'F40-F48'),
  ('F41.1', 'Generalized anxiety disorder', 'anxiety', true, 'F40-F48'),
  ('F41.9', 'Anxiety disorder, unspecified', 'anxiety', true, 'F40-F48'),
  -- Trauma / PTSD
  ('F43.10', 'Post-traumatic stress disorder, unspecified', 'trauma', true, 'F40-F48'),
  ('F43.11', 'Post-traumatic stress disorder, acute', 'trauma', true, 'F40-F48'),
  ('F43.12', 'Post-traumatic stress disorder, chronic', 'trauma', true, 'F40-F48'),
  ('F43.20', 'Adjustment disorder, unspecified', 'trauma', true, 'F40-F48'),
  ('F43.21', 'Adjustment disorder with depressed mood', 'trauma', true, 'F40-F48'),
  ('F43.22', 'Adjustment disorder with anxiety', 'trauma', true, 'F40-F48'),
  ('F43.23', 'Adjustment disorder with mixed anxiety and depressed mood', 'trauma', true, 'F40-F48'),
  -- Personality Disorders
  ('F60.3', 'Borderline personality disorder', 'personality', true, 'F60-F69'),
  ('F60.5', 'Obsessive-compulsive personality disorder', 'personality', true, 'F60-F69'),
  ('F60.9', 'Personality disorder, unspecified', 'personality', true, 'F60-F69'),
  -- Substance Use
  ('F10.10', 'Alcohol abuse, uncomplicated', 'substance_use', true, 'F10-F19'),
  ('F10.20', 'Alcohol dependence, uncomplicated', 'substance_use', true, 'F10-F19'),
  ('F12.10', 'Cannabis abuse, uncomplicated', 'substance_use', true, 'F10-F19'),
  ('F19.10', 'Other psychoactive substance abuse, uncomplicated', 'substance_use', true, 'F10-F19'),
  -- Bipolar
  ('F31.31', 'Bipolar disorder, current episode depressed, mild', 'bipolar', true, 'F30-F39'),
  ('F31.32', 'Bipolar disorder, current episode depressed, moderate', 'bipolar', true, 'F30-F39'),
  -- ADHD
  ('F90.0', 'Attention-deficit hyperactivity disorder, predominantly inattentive type', 'adhd', true, 'F90-F98'),
  ('F90.1', 'Attention-deficit hyperactivity disorder, predominantly hyperactive type', 'adhd', true, 'F90-F98'),
  ('F90.2', 'Attention-deficit hyperactivity disorder, combined type', 'adhd', true, 'F90-F98');

-- ============================================================
-- Test Organization
-- ============================================================
INSERT INTO public.organizations (id, name, slug, settings) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Serenity Behavioral Health', 'serenity-bh', '{"timezone": "America/New_York"}');

-- ============================================================
-- Test Users + Providers
-- ============================================================
INSERT INTO public.users (id, org_id, role, first_name, last_name, email) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'provider', 'Sarah', 'Chen', 'sarah.chen@serenitybh.example'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'provider', 'Michael', 'Rivera', 'michael.rivera@serenitybh.example');

INSERT INTO public.providers (id, user_id, org_id, npi, credentials, license_number, license_state, specialty, preferred_note_format) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '1234567890', 'LCSW', 'LC-12345', 'NY', 'individual_therapy', 'DAP'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '0987654321', 'MD', 'MD-67890', 'NY', 'psychiatry', 'SOAP');

-- ============================================================
-- Test Patients
-- ============================================================
INSERT INTO public.patients (id, org_id, first_name, last_name, dob, gender, email, phone, status) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'John', 'Doe', '1988-03-15', 'male', 'john.doe@email.example', '555-0101', 'active'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Jane', 'Smith', '1995-07-22', 'female', 'jane.smith@email.example', '555-0102', 'active'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Robert', 'Johnson', '1972-11-08', 'male', 'robert.johnson@email.example', '555-0103', 'active'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Maria', 'Garcia', '1990-01-30', 'female', 'maria.garcia@email.example', '555-0104', 'active'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'David', 'Williams', '1985-09-12', 'male', 'david.williams@email.example', '555-0105', 'active');

-- ============================================================
-- Patient Diagnoses
-- ============================================================
INSERT INTO public.patient_diagnoses (patient_id, org_id, icd10_code, description, status, is_primary, onset_date, diagnosed_by) VALUES
  -- John Doe: MDD recurrent moderate + GAD
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'F33.1', 'Major depressive disorder, recurrent, moderate', 'active', true, '2024-06-15', 'c0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'F41.1', 'Generalized anxiety disorder', 'active', false, '2024-06-15', 'c0000000-0000-0000-0000-000000000001'),
  -- Jane Smith: PTSD chronic + Adjustment disorder
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'F43.12', 'Post-traumatic stress disorder, chronic', 'active', true, '2024-03-10', 'c0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'F43.23', 'Adjustment disorder with mixed anxiety and depressed mood', 'active', false, '2024-03-10', 'c0000000-0000-0000-0000-000000000001'),
  -- Robert Johnson: Alcohol dependence + Depression
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'F10.20', 'Alcohol dependence, uncomplicated', 'active', true, '2024-01-20', 'c0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'F32.1', 'Major depressive disorder, single episode, moderate', 'active', false, '2024-02-15', 'c0000000-0000-0000-0000-000000000002'),
  -- Maria Garcia: BPD + GAD
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'F60.3', 'Borderline personality disorder', 'active', true, '2024-04-01', 'c0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'F41.1', 'Generalized anxiety disorder', 'active', false, '2024-04-01', 'c0000000-0000-0000-0000-000000000001'),
  -- David Williams: ADHD + Anxiety
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'F90.2', 'Attention-deficit hyperactivity disorder, combined type', 'active', true, '2024-05-20', 'c0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'F41.0', 'Panic disorder', 'active', false, '2024-05-20', 'c0000000-0000-0000-0000-000000000002');

-- ============================================================
-- Medications
-- ============================================================
INSERT INTO public.medications (patient_id, provider_id, org_id, name, dosage, frequency, route, status, start_date) VALUES
  -- John Doe
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Escitalopram (Lexapro)', '10mg', 'once daily', 'oral', 'active', '2024-07-01'),
  -- Robert Johnson
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Naltrexone', '50mg', 'once daily', 'oral', 'active', '2024-02-01'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Sertraline (Zoloft)', '100mg', 'once daily', 'oral', 'active', '2024-02-15'),
  -- David Williams
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Adderall XR', '20mg', 'once daily (morning)', 'oral', 'active', '2024-06-01'),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Buspirone', '10mg', 'twice daily', 'oral', 'active', '2024-06-01');

-- ============================================================
-- Past Encounters + Signed Notes (for patient context)
-- ============================================================

-- John Doe: 3 past encounters with Sarah Chen
INSERT INTO public.encounters (id, patient_id, provider_id, org_id, encounter_date, encounter_type, status, duration_minutes, place_of_service) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2025-12-15', 'individual_therapy', 'completed', 45, '11'),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-01-05', 'individual_therapy', 'completed', 45, '11'),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-01-19', 'individual_therapy', 'completed', 45, '11');

INSERT INTO public.clinical_notes (id, encounter_id, patient_id, provider_id, org_id, note_type, version, is_current, status, content, signed_at, signed_by) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
    'DAP', 1, true, 'signed',
    '{"data": "Client presented with flat affect. Reports difficulty sleeping 4-5 nights/week. PHQ-9 score: 16 (moderately severe). Continues to attend work but reports decreased motivation. Reports using CBT breathing exercises learned in previous session.", "assessment": "Client continues to meet criteria for MDD recurrent moderate. Sleep disturbance remains primary concern. Some progress with anxiety management techniques.", "plan": "Continue CBT framework focusing on sleep hygiene. Introduce behavioral activation scheduling. Continue current medication. Follow up in 2 weeks."}',
    '2025-12-15 17:30:00+00', 'c0000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
    'DAP', 1, true, 'signed',
    '{"data": "Client reports mild improvement in sleep after implementing sleep hygiene strategies. Now sleeping 5-6 hours most nights (up from 3-4). PHQ-9 score: 14. Reports completing 3 of 5 behavioral activation tasks. Engaged in discussion about cognitive distortions around work performance.", "assessment": "Mild improvement in depressive symptoms. Sleep hygiene interventions showing early benefit. Client engaged and motivated for treatment.", "plan": "Continue behavioral activation. Begin cognitive restructuring work targeting work-related distortions. Maintain sleep hygiene routine. Follow up in 2 weeks."}',
    '2026-01-05 17:45:00+00', 'c0000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
    'DAP', 1, true, 'signed',
    '{"data": "Client reports continued improvement. Sleeping 6-7 hours consistently. PHQ-9 score: 11 (moderate). Completed all behavioral activation tasks this week. Reports enjoying a hobby (painting) for the first time in months. Discussed relationship between negative automatic thoughts and mood.", "assessment": "Steady improvement in depressive symptoms. Client demonstrating good engagement with CBT interventions. Behavioral activation appears effective. May benefit from continued focus on cognitive restructuring.", "plan": "Continue cognitive restructuring. Increase behavioral activation goals. Discuss with prescriber about medication adjustment given improvement trajectory. Follow up in 2 weeks."}',
    '2026-01-19 17:30:00+00', 'c0000000-0000-0000-0000-000000000001');

-- Jane Smith: 2 past encounters
INSERT INTO public.encounters (id, patient_id, provider_id, org_id, encounter_date, encounter_type, status, duration_minutes, place_of_service) VALUES
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-01-10', 'individual_therapy', 'completed', 60, '11'),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-01-24', 'individual_therapy', 'completed', 60, '11');

INSERT INTO public.clinical_notes (id, encounter_id, patient_id, provider_id, org_id, note_type, version, is_current, status, content, signed_at, signed_by) VALUES
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
    'DAP', 1, true, 'signed',
    '{"data": "Client reports increase in PTSD symptoms following anniversary of traumatic event. Experienced 3 flashbacks this week and nightmares on 4 nights. Reports using grounding techniques with partial success. Avoidance of triggering locations has increased.", "assessment": "PTSD symptoms exacerbated by trauma anniversary. Client demonstrating appropriate use of coping skills but overwhelmed by symptom intensity. Hyperarousal and re-experiencing symptoms prominent.", "plan": "Increase session to weekly. Review and strengthen grounding techniques. Begin trauma narrative processing when client is stabilized. Consider EMDR referral. Safety plan reviewed and updated."}',
    '2026-01-10 18:15:00+00', 'c0000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
    'DAP', 1, true, 'signed',
    '{"data": "Client reports some reduction in flashback frequency (1 this week vs 3 last week). Nightmares continue but less intense. Successfully used grounding technique during a flashback at work. Reports feeling more hopeful about treatment.", "assessment": "Improvement in re-experiencing symptoms. Client building mastery with grounding techniques. Avoidance behaviors still present but client showing willingness to gradually address them.", "plan": "Continue weekly sessions. Introduce graduated exposure hierarchy. Continue strengthening coping skills. Maintain safety plan. Follow up next week."}',
    '2026-01-24 18:00:00+00', 'c0000000-0000-0000-0000-000000000001');

-- Note signatures for all signed notes
INSERT INTO public.note_signatures (clinical_note_id, signer_id, signature_type, content_hash) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'author', md5('f0000000-0000-0000-0000-000000000001')),
  ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'author', md5('f0000000-0000-0000-0000-000000000002')),
  ('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'author', md5('f0000000-0000-0000-0000-000000000003')),
  ('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'author', md5('f0000000-0000-0000-0000-000000000004')),
  ('f0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'author', md5('f0000000-0000-0000-0000-000000000005'));

-- ============================================================
-- Insurance / Payers
-- ============================================================
INSERT INTO public.insurance_payers (id, org_id, name, payer_id_number) VALUES
  ('aa000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Blue Cross Blue Shield', 'BCBS001'),
  ('aa000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Aetna', 'AETNA001'),
  ('aa000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'UnitedHealthcare', 'UHC001');

INSERT INTO public.patient_insurance (patient_id, org_id, payer_id, priority, member_id, group_number, copay_amount, authorized_sessions, sessions_used, effective_date) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'primary', 'BCBS-JD-12345', 'GRP-100', 25.00, 24, 3, '2025-01-01'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000002', 'primary', 'AET-JS-67890', 'GRP-200', 30.00, 20, 2, '2025-01-01'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000003', 'primary', 'UHC-RJ-11111', 'GRP-300', 20.00, 30, 5, '2025-01-01'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'primary', 'BCBS-MG-22222', 'GRP-100', 25.00, 24, 8, '2025-01-01'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000002', 'primary', 'AET-DW-33333', 'GRP-200', 30.00, 24, 4, '2025-01-01');

-- ============================================================
-- Treatment Plans
-- ============================================================
INSERT INTO public.treatment_plans (patient_id, provider_id, org_id, version, is_current, status, diagnosis_codes, goals, objectives, interventions, review_date, signed_at) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
    1, true, 'active',
    '["F33.1", "F41.1"]',
    '[{"goal": "Reduce depressive symptoms as measured by PHQ-9 to below 10", "target_date": "2026-06-15"}, {"goal": "Improve sleep quality to 7+ hours per night on 5+ nights per week", "target_date": "2026-04-15"}]',
    '[{"objective": "Complete behavioral activation tasks 5x/week", "frequency": "weekly"}, {"objective": "Practice sleep hygiene routine nightly", "frequency": "daily"}, {"objective": "Identify and challenge 3 cognitive distortions per week", "frequency": "weekly"}]',
    '[{"intervention": "Cognitive Behavioral Therapy (CBT)", "frequency": "Biweekly 45-minute sessions"}, {"intervention": "Behavioral Activation", "frequency": "Ongoing homework"}, {"intervention": "Sleep Hygiene Psychoeducation", "frequency": "As needed"}]',
    '2026-06-15', '2024-07-01 10:00:00+00'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
    1, true, 'active',
    '["F43.12", "F43.23"]',
    '[{"goal": "Reduce PTSD symptom severity by 50% as measured by PCL-5", "target_date": "2026-07-10"}, {"goal": "Decrease avoidance behaviors to allow normal daily functioning", "target_date": "2026-05-10"}]',
    '[{"objective": "Practice grounding techniques daily", "frequency": "daily"}, {"objective": "Complete graduated exposure hierarchy steps", "frequency": "weekly"}, {"objective": "Maintain safety plan", "frequency": "ongoing"}]',
    '[{"intervention": "Trauma-Focused CBT", "frequency": "Weekly 60-minute sessions"}, {"intervention": "Grounding and Stabilization Techniques", "frequency": "Daily practice"}, {"intervention": "Graduated Exposure Therapy", "frequency": "In-session and homework"}]',
    '2026-03-10', '2024-03-10 10:00:00+00');

-- ============================================================
-- Upcoming Appointments
-- ============================================================
INSERT INTO public.appointments (patient_id, provider_id, org_id, start_time, end_time, status, appointment_type) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-02-09 14:00:00+00', '2026-02-09 14:45:00+00', 'scheduled', 'individual_therapy'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-02-07 10:00:00+00', '2026-02-07 11:00:00+00', 'scheduled', 'individual_therapy'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '2026-02-10 09:00:00+00', '2026-02-10 09:30:00+00', 'scheduled', 'medication_management');
