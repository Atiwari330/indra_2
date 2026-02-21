/**
 * Complete demo reset for John Doe — wipes ALL clinical data to a blank slate.
 *
 * After running this script, John Doe will have:
 * - Zero diagnoses, medications, treatment plans, notes, encounters, assessments
 * - Zero AI runs, drafts, transcription sessions
 * - sessions_used reset to 0
 * - One intake appointment for today at 14:00 UTC
 * - Jane Smith and Robert Johnson appointments for schedule padding
 *
 * Re-runnable: safe to run repeatedly before each demo.
 *
 * Usage: npm run demo:reset
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createAdminClient } from '../src/lib/supabase/admin';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const PROVIDER_ID = 'c0000000-0000-0000-0000-000000000001'; // Sarah Chen, LCSW
const JOHN_DOE_ID = 'd0000000-0000-0000-0000-000000000001';

async function main() {
  const client = createAdminClient();
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  console.log('========================================');
  console.log('  Indra Demo Reset — Full Wipe');
  console.log(`  Date: ${dateStr}`);
  console.log('========================================\n');

  // ── Step 1: Delete ALL clinical data for John Doe ──────────────

  console.log('Step 1: Wiping all data for John Doe...\n');

  // 1-3. Billing chain: claim_diagnoses → claim_line_items → billing_claims
  const { data: claims } = await client
    .from('billing_claims')
    .select('id')
    .eq('patient_id', JOHN_DOE_ID);
  const claimIds = claims?.map((c) => c.id) ?? [];

  if (claimIds.length > 0) {
    await client.from('claim_diagnoses').delete().in('claim_id', claimIds);
    console.log('  Deleted claim_diagnoses');
    await client.from('claim_line_items').delete().in('claim_id', claimIds);
    console.log('  Deleted claim_line_items');
  }
  await client.from('billing_claims').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted billing_claims');

  // 4-5. Note signatures → clinical_notes (null out self-ref first)
  const { data: allNotes } = await client
    .from('clinical_notes')
    .select('id')
    .eq('patient_id', JOHN_DOE_ID);
  const allNoteIds = allNotes?.map((n) => n.id) ?? [];

  if (allNoteIds.length > 0) {
    await client
      .from('note_signatures')
      .delete()
      .in('clinical_note_id', allNoteIds);
    console.log('  Deleted note_signatures');

    // Null out self-referencing FK before deleting
    await client
      .from('clinical_notes')
      .update({ previous_version_id: null })
      .eq('patient_id', JOHN_DOE_ID)
      .not('previous_version_id', 'is', null);
    console.log('  Nulled clinical_notes.previous_version_id');
  }
  await client.from('clinical_notes').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted clinical_notes');

  // 6. Note drafts (no patient_id — delete by org, but scope via encounter)
  // First get John Doe's encounter IDs to delete related drafts
  const { data: encounters } = await client
    .from('encounters')
    .select('id')
    .eq('patient_id', JOHN_DOE_ID);
  const encounterIds = encounters?.map((e) => e.id) ?? [];

  if (encounterIds.length > 0) {
    await client.from('note_drafts').delete().in('encounter_id', encounterIds);
    console.log('  Deleted note_drafts (by encounter)');
  }
  // Also delete any org-level orphaned drafts linked to John Doe's AI runs
  const { data: johnRuns } = await client
    .from('ai_runs')
    .select('id')
    .eq('patient_id', JOHN_DOE_ID);
  const johnRunIds = johnRuns?.map((r) => r.id) ?? [];
  if (johnRunIds.length > 0) {
    await client.from('note_drafts').delete().in('ai_run_id', johnRunIds);
    console.log('  Deleted note_drafts (by ai_run)');
  }

  // 7-8. Treatment plans (null out self-ref first) + utilization_reviews
  await client
    .from('treatment_plans')
    .update({ previous_version_id: null })
    .eq('patient_id', JOHN_DOE_ID)
    .not('previous_version_id', 'is', null);
  console.log('  Nulled treatment_plans.previous_version_id');

  await client.from('treatment_plans').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted treatment_plans');

  await client.from('utilization_reviews').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted utilization_reviews');

  // 9-12. AI chain: proposed_actions → steps → clarifications → runs
  if (johnRunIds.length > 0) {
    await client.from('ai_proposed_actions').delete().in('run_id', johnRunIds);
    console.log('  Deleted ai_proposed_actions');
    await client.from('ai_steps').delete().in('run_id', johnRunIds);
    console.log('  Deleted ai_steps');
  }
  await client.from('ai_clarifications').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted ai_clarifications');
  await client.from('ai_runs').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted ai_runs');

  // 13-14. Assessment scores → encounters
  await client.from('assessment_scores').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted assessment_scores');

  await client.from('encounters').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted encounters');

  // 15-19. Transcription, session prep, mood, portal messages
  await client.from('transcription_sessions').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted transcription_sessions');

  await client.from('session_prep_notes').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted session_prep_notes');

  await client.from('mood_checkins').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted mood_checkins');

  // Portal messages → threads (messages reference threads)
  const { data: threads } = await client
    .from('portal_message_threads')
    .select('id')
    .eq('patient_id', JOHN_DOE_ID);
  const threadIds = threads?.map((t) => t.id) ?? [];
  if (threadIds.length > 0) {
    await client.from('portal_messages').delete().in('thread_id', threadIds);
    console.log('  Deleted portal_messages');
  }
  await client.from('portal_message_threads').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted portal_message_threads');

  // 20. ALL appointments for John Doe (not just today's)
  await client.from('appointments').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted ALL appointments');

  // 21-23. Diagnoses, medications, milestones
  await client.from('patient_diagnoses').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted patient_diagnoses');

  await client.from('medications').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted medications');

  await client.from('patient_milestones').delete().eq('patient_id', JOHN_DOE_ID);
  console.log('  Deleted patient_milestones');

  // 24. Reset sessions_used to 0
  await client
    .from('patient_insurance')
    .update({ sessions_used: 0 })
    .eq('patient_id', JOHN_DOE_ID)
    .eq('org_id', ORG_ID);
  console.log('  Reset patient_insurance.sessions_used → 0');

  console.log('\n  ✓ John Doe is now a blank slate\n');

  // ── Step 2: Seed today's appointments ──────────────────────────

  console.log('Step 2: Seeding appointments...\n');

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

    // Delete any existing appointment for this patient today first
    await client
      .from('appointments')
      .delete()
      .eq('patient_id', p.id)
      .eq('provider_id', PROVIDER_ID)
      .gte('start_time', `${dateStr}T00:00:00Z`)
      .lt('start_time', `${dateStr}T23:59:59Z`);

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
      console.error(`  ✗ ${p.name}: ${error.message}`);
    } else {
      console.log(`  ✓ ${p.name} — ${p.type} at ${startTime.toISOString().slice(11, 16)} UTC`);
    }
  }

  // ── Step 3: Verify blank slate ─────────────────────────────────

  console.log('\nStep 3: Verifying blank slate...\n');

  const checks: { table: string; count: number }[] = [];

  const tables = [
    'clinical_notes',
    'encounters',
    'assessment_scores',
    'treatment_plans',
    'patient_diagnoses',
    'medications',
    'patient_milestones',
    'mood_checkins',
    'transcription_sessions',
    'ai_runs',
  ] as const;

  for (const table of tables) {
    const { count } = await client
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', JOHN_DOE_ID);
    checks.push({ table, count: count ?? 0 });
  }

  // Check appointments separately (should be exactly 1 — today's intake)
  const { count: apptCount } = await client
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', JOHN_DOE_ID);
  checks.push({ table: 'appointments', count: apptCount ?? 0 });

  const allClear = checks
    .filter((c) => c.table !== 'appointments')
    .every((c) => c.count === 0);
  const apptOk = (apptCount ?? 0) === 1;

  console.log('  Table                    Count  Status');
  console.log('  ─────────────────────────────────────────');
  for (const c of checks) {
    const expected = c.table === 'appointments' ? 1 : 0;
    const status = c.count === expected ? '✓' : '✗ UNEXPECTED';
    console.log(`  ${c.table.padEnd(25)} ${String(c.count).padStart(3)}  ${status}`);
  }

  if (allClear && apptOk) {
    console.log('\n  ✓ All checks passed — John Doe is a blank slate\n');
  } else {
    console.log('\n  ✗ Some checks failed — review output above\n');
  }

  // ── Step 4: Demo instructions ──────────────────────────────────

  console.log('========================================');
  console.log('  Demo ready!');
  console.log('========================================\n');
  console.log('Steps:');
  console.log('  1. npm run dev');
  console.log('  2. Go to Schedule → click "Start Scribe" on John Doe\'s intake appointment');
  console.log('  3. Click "Load Demo Transcript" → intake transcript populates');
  console.log('  4. Click "Generate Intake" → AI creates intake assessment → Approve & Save');
  console.log('  5. Go to Clients → John Doe → click "Generate Treatment Plan" → Approve & Save');
  console.log('  6. Show the populated chart: diagnoses, medications, treatment plan, notes');
  console.log('');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
