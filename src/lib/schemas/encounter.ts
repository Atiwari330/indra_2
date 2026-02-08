import { z } from 'zod';

export const EncounterType = z.enum([
  'individual_therapy', 'group_therapy', 'family_therapy',
  'intake', 'crisis', 'telehealth', 'medication_management',
]);

export const EncounterStatus = z.enum([
  'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show',
]);

export const CreateEncounterInput = z.object({
  patient_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  encounter_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  encounter_type: EncounterType,
  status: EncounterStatus.default('in_progress'),
  duration_minutes: z.number().int().min(1).max(480).optional(),
  place_of_service: z.string().max(2).default('11'),
  appointment_id: z.string().uuid().optional(),
});
export type CreateEncounterInput = z.infer<typeof CreateEncounterInput>;
