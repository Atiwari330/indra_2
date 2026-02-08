import { tool } from 'ai';
import { z } from 'zod';

export function createUpdateMedicationTool() {
  return tool({
    description: 'Propose a medication change for a patient. This creates a proposed action — the actual change requires provider approval.',
    inputSchema: z.object({
      patient_id: z.string().describe('Patient UUID'),
      action: z.enum(['start', 'change', 'discontinue']).describe('Type of medication change'),
      medication_name: z.string().describe('Medication name'),
      dosage: z.string().describe('Dosage (e.g., "20mg")'),
      frequency: z.string().describe('Frequency (e.g., "once daily")'),
      route: z.string().default('oral').describe('Route of administration'),
      current_medication_id: z.string().optional().describe('ID of existing medication being changed/discontinued'),
      change_reason: z.string().describe('Clinical reason for the change'),
    }),
    execute: async ({ patient_id, action, medication_name, dosage, frequency, route, current_medication_id, change_reason }) => {
      return {
        proposed_medication_change: {
          patient_id,
          action,
          name: medication_name,
          dosage,
          frequency,
          route,
          discontinue_medication_id: action === 'change' || action === 'discontinue' ? current_medication_id : undefined,
          change_reason,
        },
        message: `Proposed to ${action} ${medication_name} ${dosage} ${frequency}. Requires provider approval.`,
        _proposed_action: {
          action_type: 'update_medication',
          target_table: 'medications',
          payload: {
            patient_id,
            name: medication_name,
            dosage,
            frequency,
            route,
            discontinue_medication_id: action === 'change' || action === 'discontinue' ? current_medication_id : undefined,
            change_reason,
          },
        },
      };
    },
  });
}
