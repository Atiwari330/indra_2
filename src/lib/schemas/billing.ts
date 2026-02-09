import { z } from 'zod';
import { uuidFormat } from './shared';

export const ClaimLineItemInput = z.object({
  line_number: z.number().int().min(1),
  cpt_code: z.string().max(5),
  modifier_1: z.string().max(2).optional(),
  modifier_2: z.string().max(2).optional(),
  diagnosis_pointers: z.array(z.number().int().min(1).max(12)).min(1),
  units: z.number().int().min(1).default(1),
  charge_amount: z.number().min(0),
  rendering_provider_npi: z.string().max(10).optional(),
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const ClaimDiagnosisInput = z.object({
  sequence_number: z.number().int().min(1).max(12),
  icd10_code: z.string().max(10),
});

export const CreateClaimInput = z.object({
  encounter_id: z.string().regex(uuidFormat, 'Invalid UUID format'),
  patient_id: z.string().regex(uuidFormat, 'Invalid UUID format'),
  provider_id: z.string().regex(uuidFormat, 'Invalid UUID format'),
  patient_insurance_id: z.string().regex(uuidFormat, 'Invalid UUID format').optional(),
  date_of_service: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  place_of_service: z.string().max(2).default('11'),
  diagnoses: z.array(ClaimDiagnosisInput).min(1).max(12),
  line_items: z.array(ClaimLineItemInput).min(1),
});
export type CreateClaimInput = z.infer<typeof CreateClaimInput>;
