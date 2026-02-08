import { z } from 'zod';

export const PatientSearchInput = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(10),
});
export type PatientSearchInput = z.infer<typeof PatientSearchInput>;

export const CreatePatientInput = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  gender: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
  emergency_contact: z.record(z.string(), z.unknown()).optional(),
});
export type CreatePatientInput = z.infer<typeof CreatePatientInput>;
