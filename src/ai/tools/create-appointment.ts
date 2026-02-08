import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { checkAvailability } from '@/services/appointment.service';

export function createAppointmentTool(
  client: SupabaseClient<Database>,
  orgId: string,
  providerId: string
) {
  return tool({
    description: 'Propose scheduling a new appointment for a patient. Checks provider availability first.',
    inputSchema: z.object({
      patient_id: z.string().describe('Patient UUID'),
      start_time: z.string().describe('Appointment start time in ISO 8601 format'),
      duration_minutes: z.number().default(45).describe('Duration in minutes'),
      appointment_type: z.string().default('individual_therapy').describe('Type of appointment'),
      notes: z.string().optional().describe('Appointment notes'),
    }),
    execute: async ({ patient_id, start_time, duration_minutes, appointment_type, notes }) => {
      const { available, conflicts } = await checkAvailability(
        client, orgId, providerId, start_time, duration_minutes
      );

      if (!available) {
        return {
          success: false,
          message: 'Time slot is not available — there are conflicting appointments.',
          conflicts: conflicts.map((c) => ({
            start: c.start_time,
            end: c.end_time,
          })),
        };
      }

      const endTime = new Date(new Date(start_time).getTime() + duration_minutes * 60000).toISOString();

      return {
        success: true,
        proposed_appointment: {
          patient_id,
          start_time: start_time,
          end_time: endTime,
          appointment_type,
          duration_minutes,
          notes,
        },
        message: 'Appointment slot is available. This will be proposed as an action for provider review.',
        _proposed_action: {
          action_type: 'create_appointment',
          target_table: 'appointments',
          payload: {
            patient_id,
            start_time,
            end_time: endTime,
            appointment_type,
            notes,
          },
        },
      };
    },
  });
}
