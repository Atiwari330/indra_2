/**
 * Seed canary data for John Doe.
 * Adds one encounter + clinical note (2026-02-02) with distinctive markers
 * to verify AI context loading.
 *
 * Usage: npx tsx scripts/seed-canary-data.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createAdminClient } from '../src/lib/supabase/admin';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const PATIENT_ID = 'd0000000-0000-0000-0000-000000000001'; // John Doe
const PROVIDER_ID = 'c0000000-0000-0000-0000-000000000001'; // Sarah Chen, LCSW

const ENCOUNTER_DATE = '2026-02-02';
const ENCOUNTER_ID = 'e0000000-0000-0000-0000-000000000014'; // canary encounter

async function main() {
  const client = createAdminClient();

  // Idempotency check: skip if encounter for this date already exists
  const { data: existing } = await client
    .from('encounters')
    .select('id')
    .eq('patient_id', PATIENT_ID)
    .eq('encounter_date', ENCOUNTER_DATE)
    .maybeSingle();

  if (existing) {
    console.log(`Encounter for ${ENCOUNTER_DATE} already exists (${existing.id}). Skipping.`);
    return;
  }

  // Create encounter
  const { data: encounter, error: encErr } = await client
    .from('encounters')
    .insert({
      id: ENCOUNTER_ID,
      org_id: ORG_ID,
      patient_id: PATIENT_ID,
      provider_id: PROVIDER_ID,
      encounter_date: ENCOUNTER_DATE,
      encounter_type: 'individual_therapy',
      status: 'completed',
      duration_minutes: 50,
    })
    .select()
    .single();

  if (encErr) throw new Error(`Failed to create encounter: ${encErr.message}`);
  console.log(`Created encounter: ${encounter.id} (${ENCOUNTER_DATE})`);

  // Create clinical note with canary markers
  const noteContent = {
    data: `Client presented with improved mood and affect. Reports PHQ-9 score of 8, down from 11 at last session. Patient reports he recently started competitive origami as a stress-relief hobby and finds it deeply calming — he completed three models this week during evening hours previously spent ruminating. Patient adopted a three-legged rescue cat named Biscuit two weeks ago; reports the pet has significantly improved his evening mood and motivation to maintain daily routines including consistent bedtime. Sleep improved to 7-8 hours most nights. Patient mentioned a specific trigger: anxiety spikes every Tuesday before his weekly team standup meeting at work. Denies SI/HI.`,
    assessment: `Major depressive disorder showing significant improvement — PHQ-9 now below treatment goal of 10 for first time. GAD symptoms remain but are more situationally specific (work standup trigger identified). Behavioral activation interventions highly effective. New coping strategies (origami, pet care) providing structure and mood regulation.`,
    plan: `Continue biweekly CBT sessions. Introduce exposure hierarchy targeting work-related anxiety, starting with standup meeting preparation techniques. Maintain current Escitalopram 10mg. Reinforce origami and pet care as adaptive coping behaviors. Consider medication review with Dr. Rivera if PHQ-9 remains below 10 for two consecutive sessions. Next session: 2026-02-09.`,
  };

  const { data: note, error: noteErr } = await client
    .from('clinical_notes')
    .insert({
      encounter_id: ENCOUNTER_ID,
      patient_id: PATIENT_ID,
      provider_id: PROVIDER_ID,
      org_id: ORG_ID,
      note_type: 'DAP',
      content: noteContent,
      status: 'signed',
      version: 1,
      is_current: true,
      signed_at: `${ENCOUNTER_DATE}T17:00:00Z`,
      signed_by: PROVIDER_ID,
    })
    .select()
    .single();

  if (noteErr) throw new Error(`Failed to create clinical note: ${noteErr.message}`);
  console.log(`Created clinical note: ${note.id} (DAP, signed)`);

  console.log('\nCanary markers embedded:');
  console.log('  1. Competitive origami hobby');
  console.log('  2. Three-legged rescue cat named Biscuit');
  console.log('  3. PHQ-9 score of 8 (below goal of 10)');
  console.log('  4. Tuesday standup meeting anxiety trigger');
  console.log('\n✓ Canary seed data complete');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
