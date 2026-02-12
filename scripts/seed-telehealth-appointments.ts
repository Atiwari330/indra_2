/**
 * Seed today's telehealth appointments with meeting links.
 * Creates appointments for Sarah Chen (LCSW) with 3 patients.
 *
 * Usage: npx tsx scripts/seed-telehealth-appointments.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createAdminClient } from '../src/lib/supabase/admin';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const PROVIDER_ID = 'c0000000-0000-0000-0000-000000000001'; // Sarah Chen, LCSW

const PATIENTS = [
  { id: 'd0000000-0000-0000-0000-000000000001', name: 'John Doe' },
  { id: 'd0000000-0000-0000-0000-000000000002', name: 'Jane Smith' },
  { id: 'd0000000-0000-0000-0000-000000000003', name: 'Robert Johnson' },
];

async function main() {
  const client = createAdminClient();

  // Use today's date for the appointments
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  console.log(`Seeding telehealth appointments for ${dateStr}...\n`);

  // Schedule: 9am, 10am, 11am (local time, using UTC for simplicity)
  const times = [
    { hour: 14, min: 0 },  // 9am EST = 14:00 UTC
    { hour: 15, min: 0 },  // 10am EST = 15:00 UTC
    { hour: 16, min: 0 },  // 11am EST = 16:00 UTC
  ];

  for (let i = 0; i < PATIENTS.length; i++) {
    const patient = PATIENTS[i];
    const time = times[i];

    const startTime = new Date(`${dateStr}T${String(time.hour).padStart(2, '0')}:${String(time.min).padStart(2, '0')}:00Z`);
    const endTime = new Date(startTime.getTime() + 50 * 60 * 1000); // 50-min sessions

    // Check if appointment already exists for this patient/provider/date
    const { data: existing } = await client
      .from('appointments')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('provider_id', PROVIDER_ID)
      .gte('start_time', `${dateStr}T00:00:00Z`)
      .lt('start_time', `${dateStr}T23:59:59Z`)
      .maybeSingle();

    if (existing) {
      // Update with meeting_link if missing
      const { error: updateErr } = await client
        .from('appointments')
        .update({
          meeting_link: `https://meet.indra.health/session-${patient.id.slice(-4)}`,
          appointment_type: 'telehealth',
        })
        .eq('id', existing.id);

      if (updateErr) throw new Error(`Failed to update appointment: ${updateErr.message}`);
      console.log(`Updated existing appointment for ${patient.name} with meeting_link`);
      continue;
    }

    const { data: appt, error: apptErr } = await client
      .from('appointments')
      .insert({
        patient_id: patient.id,
        provider_id: PROVIDER_ID,
        org_id: ORG_ID,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        appointment_type: 'telehealth',
        meeting_link: `https://meet.indra.health/session-${patient.id.slice(-4)}`,
        notes: 'Telehealth session',
      })
      .select()
      .single();

    if (apptErr) throw new Error(`Failed to create appointment for ${patient.name}: ${apptErr.message}`);
    console.log(`Created appointment: ${patient.name} at ${startTime.toISOString()} (${appt.id})`);
    console.log(`  Meeting link: https://meet.indra.health/session-${patient.id.slice(-4)}`);
  }

  console.log('\n✓ Telehealth appointments seeded');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
