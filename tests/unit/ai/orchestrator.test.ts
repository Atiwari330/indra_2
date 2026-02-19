import { describe, it, expect } from 'vitest';
import { tool } from 'ai';
import { z } from 'zod';
import { IntentClassification } from '@/lib/schemas/ai';
import { suggestCptCode } from '@/services/billing.service';

describe('AI Orchestration', () => {
  describe('Tool definitions', () => {
    it('creates find_patient tool with correct schema', () => {
      const findPatient = tool({
        description: 'Search for a patient',
        inputSchema: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => ({
          found: true,
          patient_id: 'test-id',
          patient_name: query,
        }),
      });

      expect(findPatient).toBeDefined();
      expect(findPatient.description).toBe('Search for a patient');
    });

    it('creates terminal tool without execute', () => {
      const submitResults = tool({
        description: 'Submit results',
        inputSchema: z.object({
          summary: z.string(),
        }),
      });

      expect(submitResults).toBeDefined();
      expect(submitResults.execute).toBeUndefined();
    });
  });

  describe('Intent classification schema', () => {
    it('validates intent classification output', () => {
      const result = IntentClassification.safeParse({
        intent_type: 'create_progress_note',
        patient_name: 'John Doe',
        confidence: 0.95,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid intent type', () => {
      const result = IntentClassification.safeParse({
        intent_type: 'invalid_type',
        confidence: 0.5,
      });
      expect(result.success).toBe(false);
    });

    it('validates all intent types', () => {
      const types = [
        'create_progress_note',
        'create_intake_assessment',
        'schedule_appointment',
        'query_patient_info',
        'update_medication',
        'generate_utilization_review',
        'create_treatment_plan',
        'general_query',
      ];
      for (const t of types) {
        const result = IntentClassification.safeParse({
          intent_type: t,
          confidence: 0.8,
        });
        expect(result.success).toBe(true);
      }
    });

    it('accepts create_intake_assessment with patient name', () => {
      const result = IntentClassification.safeParse({
        intent_type: 'create_intake_assessment',
        patient_name: 'John Doe',
        confidence: 0.9,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.intent_type).toBe('create_intake_assessment');
        expect(result.data.patient_name).toBe('John Doe');
      }
    });
  });

  describe('CPT code suggestion', () => {
    it('maps encounter types to CPT codes correctly', () => {
      expect(suggestCptCode('individual_therapy', 45).code).toBe('90834');
      expect(suggestCptCode('individual_therapy', 60).code).toBe('90837');
      expect(suggestCptCode('individual_therapy', 30).code).toBe('90832');
      expect(suggestCptCode('group_therapy').code).toBe('90853');
      expect(suggestCptCode('intake').code).toBe('90791');
      expect(suggestCptCode('crisis').code).toBe('90839');
      expect(suggestCptCode('family_therapy').code).toBe('90847');
      expect(suggestCptCode('medication_management').code).toBe('99214');
    });
  });

  describe('System prompt builder', () => {
    it('builds prompt with provider context', async () => {
      const { buildSystemPrompt } = await import('@/ai/system-prompt');

      const prompt = buildSystemPrompt({
        providerName: 'Sarah Chen',
        providerCredentials: 'LCSW',
        preferredNoteFormat: 'DAP',
        organizationName: 'Serenity BH',
        todayDate: '2026-02-06',
      });

      expect(prompt).toContain('Sarah Chen');
      expect(prompt).toContain('LCSW');
      expect(prompt).toContain('SOAP');
      expect(prompt).toContain('Serenity BH');
      expect(prompt).toContain('2026-02-06');
      expect(prompt).toContain('ALWAYS call find_patient');
    });

    it('includes patient context when provided', async () => {
      const { buildSystemPrompt } = await import('@/ai/system-prompt');

      const prompt = buildSystemPrompt({
        providerName: 'Test Provider',
        providerCredentials: 'MD',
        preferredNoteFormat: 'SOAP',
        organizationName: 'Test Org',
        todayDate: '2026-02-06',
        patientContext: 'Patient: John Doe\nDiagnoses: F33.1',
      });

      expect(prompt).toContain('CURRENT PATIENT CONTEXT');
      expect(prompt).toContain('John Doe');
    });
  });
});
