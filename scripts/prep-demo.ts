/**
 * One-command demo preparation script.
 *
 * 1. Cleans up stale test data (AI runs, non-seed notes, encounters, etc.)
 * 2. Cleans up old appointments and transcription sessions for John Doe
 * 3. Seeds today's appointments including an intake appointment for John Doe
 * 4. Prints demo instructions
 *
 * Usage: npx tsx scripts/prep-demo.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createAdminClient } from '../src/lib/supabase/admin';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const PROVIDER_ID = 'c0000000-0000-0000-0000-000000000001'; // Sarah Chen, LCSW
const JOHN_DOE_ID = 'd0000000-0000-0000-0000-000000000001';

// Seed IDs to preserve
const SEED_ENCOUNTER_IDS = [
  'e0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000003',
];
const SEED_NOTE_IDS = [
  'f0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000003',
];
const SEED_SCORE_IDS = [
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000002',
  'e1000000-0000-0000-0000-000000000003',
];

async function main() {
  const client = createAdminClient();
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  console.log('========================================');
  console.log('  Indra Demo Prep');
  console.log(`  Date: ${dateStr}`);
  console.log('========================================\n');

  // ── Step 1: Clean up stale data ──────────────────────────────

  console.log('Step 1: Cleaning up stale data...\n');

  // claim_diagnoses & claim_line_items
  const { data: claims } = await client
    .from('billing_claims')
    .select('id')
    .eq('patient_id', JOHN_DOE_ID);
  const claimIds = claims?.map((c) => c.id) ?? [];

  if (claimIds.length > 0) {
    await client.from('claim_diagnoses').delete().in('claim_id', claimIds);
    await client.from('claim_line_items').delete().in('claim_id', claimIds);
  }
  await client.from('billing_claims').delete().eq('patient_id', JOHN_DOE_ID);

  // note_signatures for non-seed notes
  const { data: nonSeedNotes } = await client
    .from('clinical_notes')
    .select('id')
    .eq('patient_id', JOHN_DOE_ID)
    .not('id', 'in', `(${SEED_NOTE_IDS.join(',')})`);
  const nonSeedNoteIds = nonSeedNotes?.map((n) => n.id) ?? [];
  if (nonSeedNoteIds.length > 0) {
    await client.from('note_signatures').delete().in('clinical_note_id', nonSeedNoteIds);
  }

  // clinical_notes (non-seed)
  await client
    .from('clinical_notes')
    .delete()
    .eq('patient_id', JOHN_DOE_ID)
    .not('id', 'in', `(${SEED_NOTE_IDS.join(',')})`);

  // note_drafts
  await client.from('note_drafts').delete().eq('org_id', ORG_ID);

  // treatment_plans
  await client.from('treatment_plans').delete().eq('patient_id', JOHN_DOE_ID);

  // utilization_reviews
  await client.from('utilization_reviews').delete().eq('patient_id', JOHN_DOE_ID);

  // AI data
  await client.from('ai_proposed_actions').delete().eq('org_id', ORG_ID);
  const { data: runs } = await client.from('ai_runs').select('id').eq('org_id', ORG_ID);
  const runIds = runs?.map((r) => r.id) ?? [];
  if (runIds.length > 0) {
    await client.from('ai_steps').delete().in('run_id', runIds);
  }
  await client.from('ai_clarifications').delete().eq('org_id', ORG_ID);
  await client.from('ai_runs').delete().eq('org_id', ORG_ID);

  // assessment_scores (non-seed)
  await client
    .from('assessment_scores')
    .delete()
    .eq('patient_id', JOHN_DOE_ID)
    .not('id', 'in', `(${SEED_SCORE_IDS.join(',')})`);

  // encounters (non-seed)
  await client
    .from('encounters')
    .delete()
    .eq('patient_id', JOHN_DOE_ID)
    .not('id', 'in', `(${SEED_ENCOUNTER_IDS.join(',')})`);

  // Reset sessions_used
  await client
    .from('patient_insurance')
    .update({ sessions_used: 3 })
    .eq('patient_id', JOHN_DOE_ID)
    .eq('org_id', ORG_ID);

  // Transcription sessions
  await client
    .from('transcription_sessions')
    .delete()
    .eq('patient_id', JOHN_DOE_ID)
    .eq('org_id', ORG_ID);

  console.log('  Cleaned up notes, encounters, AI runs, drafts, treatment plans, URs, transcriptions\n');

  // ── Step 2: Clean up old appointments for today ──────────────

  console.log('Step 2: Seeding appointments...\n');

  // Delete existing appointments for today
  await client
    .from('appointments')
    .delete()
    .eq('provider_id', PROVIDER_ID)
    .eq('org_id', ORG_ID)
    .gte('start_time', `${dateStr}T00:00:00Z`)
    .lt('start_time', `${dateStr}T23:59:59Z`);

  // ── Step 3: Create appointments ──────────────────────────────

  const PATIENTS = [
    {
      id: JOHN_DOE_ID,
      name: 'John Doe',
      type: 'intake',
      hour: 14,
      notes: 'Initial intake assessment — new patient',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      name: 'Jane Smith',
      type: 'telehealth',
      hour: 15,
      notes: 'Follow-up session',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      name: 'Robert Johnson',
      type: 'telehealth',
      hour: 16,
      notes: 'Progress review',
    },
  ];

  for (const p of PATIENTS) {
    const startTime = new Date(`${dateStr}T${String(p.hour).padStart(2, '0')}:00:00Z`);
    const endTime = new Date(startTime.getTime() + 50 * 60 * 1000);

    const { error } = await client.from('appointments').insert({
      patient_id: p.id,
      provider_id: PROVIDER_ID,
      org_id: ORG_ID,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'scheduled',
      appointment_type: p.type,
      meeting_link: `https://meet.indra.health/session-${p.id.slice(-4)}`,
      notes: p.notes,
    });

    if (error) {
      console.error(`  Failed to create appointment for ${p.name}: ${error.message}`);
    } else {
      console.log(`  ${p.name} — ${p.type} at ${startTime.toISOString().slice(11, 16)} UTC`);
    }
  }

  // ── Step 4: Print demo instructions ──────────────────────────

  console.log('\n========================================');
  console.log('  Demo ready!');
  console.log('========================================\n');
  console.log('Steps:');
  console.log('  1. npm run dev');
  console.log('  2. Go to Schedule → click "Start Scribe" on John Doe\'s intake appointment');
  console.log('  3. Click "Load Demo Transcript" → intake transcript populates');
  console.log('  4. Click "Generate Intake" → AI creates intake assessment → Approve & Save');
  console.log('  5. Go to Clients → John Doe → click "Generate Treatment Plan" → Approve & Save');
  console.log('  6. Click "Generate Progress Note" → Approve & Save');
  console.log('  7. Open each note in the chart to view the full clinical content');
  console.log('');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
