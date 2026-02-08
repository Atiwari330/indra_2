/**
 * Seed test data script.
 * The seed data is already loaded via migration 20260206000007_seed_data.sql.
 * This script verifies the seed data is present and prints a summary.
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createAdminClient } from '../src/lib/supabase/admin';

async function main() {
  const client = createAdminClient();

  console.log('Verifying seed data...\n');

  // Check organization
  const { data: orgs } = await client.from('organizations').select('id, name');
  console.log(`Organizations: ${orgs?.length ?? 0}`);
  orgs?.forEach((o) => console.log(`  - ${o.name} (${o.id})`));

  // Check users/providers
  const { data: users } = await client.from('users').select('id, first_name, last_name, role');
  console.log(`\nUsers: ${users?.length ?? 0}`);
  users?.forEach((u) => console.log(`  - ${u.first_name} ${u.last_name} (${u.role})`));

  const { data: providers } = await client.from('providers').select('id, credentials, specialty, preferred_note_format');
  console.log(`\nProviders: ${providers?.length ?? 0}`);
  providers?.forEach((p) => console.log(`  - ${p.credentials} | ${p.specialty} | format: ${p.preferred_note_format}`));

  // Check patients
  const { data: patients } = await client.from('patients').select('id, first_name, last_name, status');
  console.log(`\nPatients: ${patients?.length ?? 0}`);
  patients?.forEach((p) => console.log(`  - ${p.first_name} ${p.last_name} (${p.status})`));

  // Check diagnoses
  const { data: diagnoses } = await client.from('patient_diagnoses').select('icd10_code, description, patient_id');
  console.log(`\nDiagnoses: ${diagnoses?.length ?? 0}`);

  // Check encounters
  const { data: encounters } = await client.from('encounters').select('id, encounter_date, encounter_type, status');
  console.log(`\nEncounters: ${encounters?.length ?? 0}`);

  // Check clinical notes
  const { data: notes } = await client.from('clinical_notes').select('id, note_type, status');
  console.log(`\nClinical Notes: ${notes?.length ?? 0}`);

  // Check medications
  const { data: meds } = await client.from('medications').select('name, dosage, status');
  console.log(`\nMedications: ${meds?.length ?? 0}`);
  meds?.forEach((m) => console.log(`  - ${m.name} ${m.dosage} (${m.status})`));

  // Check CPT codes
  const { data: cpts } = await client.from('cpt_codes').select('code');
  console.log(`\nCPT Codes: ${cpts?.length ?? 0}`);

  // Check ICD-10 codes
  const { data: icds } = await client.from('icd10_codes').select('code');
  console.log(`ICD-10 Codes: ${icds?.length ?? 0}`);

  // Check appointments
  const { data: appts } = await client.from('appointments').select('id, start_time, status');
  console.log(`\nAppointments: ${appts?.length ?? 0}`);

  // Check insurance
  const { data: insurance } = await client.from('patient_insurance').select('id, member_id');
  console.log(`Patient Insurance Records: ${insurance?.length ?? 0}`);

  // Check audit log
  const { data: audit } = await client.from('audit_log').select('id').limit(5);
  console.log(`\nAudit Log Entries (sample): ${audit?.length ?? 0}`);

  console.log('\n✓ Seed data verification complete');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
