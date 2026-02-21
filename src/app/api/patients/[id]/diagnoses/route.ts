import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';

const diagnosisSchema = z.object({
  icd10_code: z.string().min(1),
  description: z.string().min(1),
  is_primary: z.boolean(),
});

const requestSchema = z.object({
  diagnoses: z.array(diagnosisSchema).min(1),
  status: z.enum(['active', 'pending_review']),
  aiRunId: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  const auth = await getAuthContext(req);
  const supabase = getAdminClient();

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.message, 400);
  }

  const { diagnoses, status, aiRunId } = parsed.data;

  // Delete any existing pending_review diagnoses for this patient (clean slate)
  // pending_review is added by migration but not yet in generated types
  await supabase
    .from('patient_diagnoses')
    .delete()
    .eq('patient_id', patientId)
    .eq('org_id', auth.orgId)
    .eq('status', 'pending_review' as 'active');

  // Insert each diagnosis
  // Cast status since pending_review is added by migration but not yet in generated types
  const rows = diagnoses.map((d) => ({
    patient_id: patientId,
    org_id: auth.orgId,
    icd10_code: d.icd10_code,
    description: d.description,
    is_primary: d.is_primary,
    status: status as 'active',
    diagnosed_by: auth.providerId,
    confirmed_by: status === 'active' ? auth.providerId : null,
    confirmed_at: status === 'active' ? new Date().toISOString() : null,
    ai_run_id: aiRunId as string | undefined,
  }));

  const { data, error } = await supabase
    .from('patient_diagnoses')
    .insert(rows as typeof rows)
    .select('id, icd10_code, description, status, is_primary');

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse(data, 201);
}
