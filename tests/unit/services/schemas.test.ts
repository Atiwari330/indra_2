import { describe, it, expect } from 'vitest';
import { CreateEncounterInput } from '@/lib/schemas/encounter';
import { CreateNoteDraftInput } from '@/lib/schemas/note';
import { CreateClaimInput } from '@/lib/schemas/billing';
import { IntentInput } from '@/lib/schemas/ai';

describe('Zod Schemas', () => {
  describe('CreateEncounterInput', () => {
    const validUuid1 = '550e8400-e29b-41d4-a716-446655440000';
    const validUuid2 = '6ba7b810-9dad-41d0-80b4-00c04fd430c8';

    it('validates a valid encounter', () => {
      const result = CreateEncounterInput.safeParse({
        patient_id: validUuid1,
        provider_id: validUuid2,
        encounter_date: '2026-02-06',
        encounter_type: 'individual_therapy',
        duration_minutes: 45,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid encounter type', () => {
      const result = CreateEncounterInput.safeParse({
        patient_id: validUuid1,
        provider_id: validUuid2,
        encounter_date: '2026-02-06',
        encounter_type: 'invalid_type',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = CreateEncounterInput.safeParse({
        patient_id: validUuid1,
        provider_id: validUuid2,
        encounter_date: 'not-a-date',
        encounter_type: 'individual_therapy',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateNoteDraftInput', () => {
    it('validates a DAP note', () => {
      const result = CreateNoteDraftInput.safeParse({
        note_type: 'DAP',
        generated_content: {
          data: 'Client reports...',
          assessment: 'Client shows...',
          plan: 'Continue...',
        },
      });
      expect(result.success).toBe(true);
    });

    it('validates a SOAP note', () => {
      const result = CreateNoteDraftInput.safeParse({
        note_type: 'SOAP',
        generated_content: {
          subjective: 'Patient states...',
          objective: 'Patient appears...',
          assessment: 'Diagnosis...',
          plan: 'Follow up...',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateClaimInput', () => {
    const validUuid1 = '550e8400-e29b-41d4-a716-446655440000';
    const validUuid2 = '6ba7b810-9dad-41d0-80b4-00c04fd430c8';
    const validUuid3 = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

    it('validates a complete claim', () => {
      const result = CreateClaimInput.safeParse({
        encounter_id: validUuid1,
        patient_id: validUuid2,
        provider_id: validUuid3,
        date_of_service: '2026-02-06',
        diagnoses: [
          { sequence_number: 1, icd10_code: 'F33.1' },
        ],
        line_items: [
          {
            line_number: 1,
            cpt_code: '90834',
            diagnosis_pointers: [1],
            units: 1,
            charge_amount: 150.00,
            service_date: '2026-02-06',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('rejects claim without diagnoses', () => {
      const result = CreateClaimInput.safeParse({
        encounter_id: validUuid1,
        patient_id: validUuid2,
        provider_id: validUuid3,
        date_of_service: '2026-02-06',
        diagnoses: [],
        line_items: [
          { line_number: 1, cpt_code: '90834', diagnosis_pointers: [1], units: 1, charge_amount: 150, service_date: '2026-02-06' },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('IntentInput', () => {
    it('validates a basic intent', () => {
      const result = IntentInput.safeParse({
        text: 'Create a progress note for John Doe',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty text', () => {
      const result = IntentInput.safeParse({ text: '' });
      expect(result.success).toBe(false);
    });
  });
});
