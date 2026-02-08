import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import type { CreateClaimInput } from '@/lib/schemas/billing';

type Client = SupabaseClient<Database>;

export async function createClaim(client: Client, orgId: string, input: CreateClaimInput) {
  // Generate claim number
  const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const totalCharge = input.line_items.reduce((sum, li) => sum + li.charge_amount * li.units, 0);

  // Insert claim
  const { data: claim, error: claimError } = await client
    .from('billing_claims')
    .insert({
      encounter_id: input.encounter_id,
      patient_id: input.patient_id,
      provider_id: input.provider_id,
      org_id: orgId,
      patient_insurance_id: input.patient_insurance_id,
      claim_number: claimNumber,
      status: 'draft',
      date_of_service: input.date_of_service,
      place_of_service: input.place_of_service,
      total_charge: totalCharge,
    })
    .select()
    .single();

  if (claimError) throw new Error(`Failed to create claim: ${claimError.message}`);

  // Insert diagnoses
  const diagInserts = input.diagnoses.map((d) => ({
    claim_id: claim.id,
    sequence_number: d.sequence_number,
    icd10_code: d.icd10_code,
  }));

  const { error: diagError } = await client.from('claim_diagnoses').insert(diagInserts);
  if (diagError) throw new Error(`Failed to create claim diagnoses: ${diagError.message}`);

  // Insert line items
  const lineInserts = input.line_items.map((li) => ({
    claim_id: claim.id,
    line_number: li.line_number,
    cpt_code: li.cpt_code,
    modifier_1: li.modifier_1,
    modifier_2: li.modifier_2,
    diagnosis_pointers: li.diagnosis_pointers,
    units: li.units,
    charge_amount: li.charge_amount,
    rendering_provider_npi: li.rendering_provider_npi,
    service_date: li.service_date,
  }));

  const { error: lineError } = await client.from('claim_line_items').insert(lineInserts);
  if (lineError) throw new Error(`Failed to create line items: ${lineError.message}`);

  return claim;
}

/**
 * Deterministic CPT code suggestion based on encounter type and duration.
 * No LLM needed for this.
 */
export function suggestCptCode(
  encounterType: string,
  durationMinutes?: number
): { code: string; description: string } {
  switch (encounterType) {
    case 'intake':
      return { code: '90791', description: 'Psychiatric Diagnostic Evaluation' };
    case 'group_therapy':
      return { code: '90853', description: 'Group Psychotherapy' };
    case 'family_therapy':
      return { code: '90847', description: 'Family Psychotherapy with Patient' };
    case 'crisis':
      return { code: '90839', description: 'Psychotherapy for Crisis, first 60 minutes' };
    case 'medication_management':
      return { code: '99214', description: 'Office Visit, Established Patient, Moderate Complexity' };
    case 'individual_therapy':
    case 'telehealth':
    default:
      if (durationMinutes && durationMinutes < 38) {
        return { code: '90832', description: 'Psychotherapy, 30 minutes' };
      } else if (durationMinutes && durationMinutes < 53) {
        return { code: '90834', description: 'Psychotherapy, 45 minutes' };
      } else {
        return { code: '90837', description: 'Psychotherapy, 60 minutes' };
      }
  }
}

export async function validateClaim(client: Client, orgId: string, claimId: string) {
  const errors: string[] = [];

  const { data: claim } = await client
    .from('billing_claims')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', claimId)
    .single();

  if (!claim) {
    return { valid: false, errors: ['Claim not found'] };
  }

  // Check diagnoses
  const { data: diagnoses } = await client
    .from('claim_diagnoses')
    .select('*')
    .eq('claim_id', claimId);

  if (!diagnoses || diagnoses.length === 0) {
    errors.push('Claim must have at least one diagnosis');
  }

  // Check line items
  const { data: lineItems } = await client
    .from('claim_line_items')
    .select('*')
    .eq('claim_id', claimId);

  if (!lineItems || lineItems.length === 0) {
    errors.push('Claim must have at least one line item');
  }

  // Validate diagnosis pointers reference existing sequences
  const diagSequences = new Set(diagnoses?.map((d) => d.sequence_number) ?? []);
  for (const li of lineItems ?? []) {
    for (const ptr of li.diagnosis_pointers) {
      if (!diagSequences.has(ptr)) {
        errors.push(`Line item ${li.line_number}: diagnosis pointer ${ptr} does not match any claim diagnosis`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function getCptCodes(client: Client, category?: string) {
  let query = client.from('cpt_codes').select('*');
  if (category) query = query.eq('category', category);
  const { data, error } = await query.order('code');
  if (error) throw new Error(`Failed to get CPT codes: ${error.message}`);
  return data;
}

export async function searchIcd10Codes(client: Client, searchQuery: string) {
  const { data, error } = await client
    .from('icd10_codes')
    .select('*')
    .or(`code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    .limit(20);

  if (error) throw new Error(`Failed to search ICD-10 codes: ${error.message}`);
  return data;
}
