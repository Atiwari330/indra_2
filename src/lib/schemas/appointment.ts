import { z } from 'zod';
import { uuidFormat } from './shared';

export const CreateAppointmentInput = z.object({
  patient_id: z.string().regex(uuidFormat, 'Invalid UUID format'),
  provider_id: z.string().regex(uuidFormat, 'Invalid UUID format'),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  appointment_type: z.string().optional(),
  notes: z.string().optional(),
  recurring_rule: z.record(z.string(), z.unknown()).optional(),
});
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentInput>;

export const GetScheduleInput = z.object({
  provider_id: z.string().regex(uuidFormat, 'Invalid UUID format'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type GetScheduleInput = z.infer<typeof GetScheduleInput>;

export const CheckAvailabilityInput = z.object({
  provider_id: z.string().regex(uuidFormat, 'Invalid UUID format'),
  start_time: z.string().datetime(),
  duration_minutes: z.number().int().min(15).max(480),
});
export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilityInput>;
