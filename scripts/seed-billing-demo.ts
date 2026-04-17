/**
 * Seed signed progress notes for the Stedi Claims demo.
 * Inserts a fresh encounter + signed clinical note for John Doe, Jane Smith,
 * and Maria Garcia so you can exercise the Bill Claim flow end-to-end without
 * having to draft and sign anything manually.
 *
 * Usage: npx tsx scripts/seed-billing-demo.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createAdminClient } from '../src/lib/supabase/admin';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const PROVIDER_ID = 'c0000000-0000-0000-0000-000000000001'; // Sarah Chen, LCSW

const TODAY = new Date().toISOString().slice(0, 10);

interface DemoSeed {
  patientId: string;
  patientName: string;
  encounterId: string;
  noteId: string;
  content: Record<string, string>;
  noteType: 'intake' | 'SOAP' | 'DAP' | 'BIRP' | 'discharge';
}

const SEEDS: DemoSeed[] = [
  {
    patientId: 'd0000000-0000-0000-0000-000000000001',
    patientName: 'John Doe',
    encounterId: 'e0000000-0000-0000-0000-00000000aa01',
    noteId: 'f0000000-0000-0000-0000-00000000aa01',
    noteType: 'DAP',
    content: {
      data: 'Client presented on time, engaged throughout 50-minute session. Reports continued improvement in sleep (6-7 hrs/night). PHQ-9 score: 9 (mild). Completed behavioral activation homework. Discussed upcoming work stressor and rehearsed cognitive restructuring.',
      assessment:
        'Client continues to meet criteria for ongoing psychotherapy due to active major depressive symptoms impacting work functioning. Patient demonstrates continued need for weekly CBT; discontinuation at this time is not clinically indicated.',
      plan: 'Continue weekly CBT focused on cognitive restructuring. Add values-based behavioral activation. Follow up in 1 week. Reassess PHQ-9 monthly.',
    },
  },
  {
    patientId: 'd0000000-0000-0000-0000-000000000002',
    patientName: 'Jane Smith',
    encounterId: 'e0000000-0000-0000-0000-00000000aa02',
    noteId: 'f0000000-0000-0000-0000-00000000aa02',
    noteType: 'DAP',
    content: {
      data: 'Client engaged in trauma-focused CBT. Reports one flashback in past week (down from three). Nightmares less frequent. Used grounding successfully at work on Tuesday.',
      assessment:
        'Patient demonstrates continued functional impairment from chronic PTSD requiring weekly trauma-focused therapy. Symptoms remain clinically significant; medical necessity for continued treatment is clearly established.',
      plan: 'Continue weekly TF-CBT. Introduce graduated exposure hierarchy next session. Safety plan reviewed.',
    },
  },
  {
    patientId: 'd0000000-0000-0000-0000-000000000004',
    patientName: 'Maria Garcia',
    encounterId: 'e0000000-0000-0000-0000-00000000aa04',
    noteId: 'f0000000-0000-0000-0000-00000000aa04',
    noteType: 'DAP',
    // Intentionally missing medical-necessity language — demonstrates the integrity
    // check blocking a claim Indra would otherwise let slip through to denial.
    content: {
      data: 'Client attended session. Talked about her week. Relationships with coworkers came up. We reviewed coping skills.',
      assessment: 'Client had a session. Progress continues.',
      plan: 'See client next week.',
    },
  },
];

async function main() {
  const client = createAdminClient();
  const signedAt = new Date().toISOString();

  for (const seed of SEEDS) {
    // Upsert encounter
    const { error: encErr } = await client.from('encounters').upsert(
      {
        id: seed.encounterId,
        patient_id: seed.patientId,
        provider_id: PROVIDER_ID,
        org_id: ORG_ID,
        encounter_date: TODAY,
        encounter_type: 'individual_therapy',
        status: 'completed',
        duration_minutes: 53,
        place_of_service: '11',
      },
      { onConflict: 'id' },
    );
    if (encErr) {
      console.error(`[${seed.patientName}] encounter error:`, encErr.message);
      continue;
    }

    // Delete any existing note with our fixed id, then insert fresh (signed notes
    // are immutable — cleanest to recreate)
    await client.from('note_signatures').delete().eq('clinical_note_id', seed.noteId);
    await client.from('clinical_notes').delete().eq('id', seed.noteId);

    const { error: noteErr } = await client.from('clinical_notes').insert({
      id: seed.noteId,
      encounter_id: seed.encounterId,
      patient_id: seed.patientId,
      provider_id: PROVIDER_ID,
      org_id: ORG_ID,
      note_type: seed.noteType,
      version: 1,
      is_current: true,
      status: 'signed',
      content: seed.content,
      signed_at: signedAt,
      signed_by: PROVIDER_ID,
    });
    if (noteErr) {
      console.error(`[${seed.patientName}] note error:`, noteErr.message);
      continue;
    }

    // Signature
    const { error: sigErr } = await client.from('note_signatures').insert({
      clinical_note_id: seed.noteId,
      signer_id: PROVIDER_ID,
      signature_type: 'author',
      content_hash: `demo_${seed.noteId}`,
    });
    if (sigErr) {
      console.error(`[${seed.patientName}] signature error:`, sigErr.message);
      continue;
    }

    console.log(`✓ Seeded signed note for ${seed.patientName} (${seed.noteId})`);
  }

  console.log('\nDone. Open any of these patients in the UI:');
  for (const seed of SEEDS) {
    console.log(`  ${seed.patientName}: /clients/${seed.patientId}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
