import { NextRequest } from 'next/server';
import { IntentInput } from '@/lib/schemas/ai';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { executeIntent } from '@/ai/run-manager';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    const body = await req.json();
    const parsed = IntentInput.safeParse(body);

    if (!parsed.success) {
      console.error('[AI Intent] Validation error:', parsed.error.message, '| Body:', JSON.stringify(body));
      return errorResponse(`Validation error: ${parsed.error.message}`, 400);
    }

    const { text, patient_id, encounter_id, idempotency_key } = parsed.data;
    const client = getAdminClient();

    const result = await executeIntent(client, {
      orgId: auth.orgId,
      userId: auth.userId,
      providerId: auth.providerId,
      inputText: text,
      patientId: patient_id,
      encounterId: encounter_id,
      idempotencyKey: idempotency_key,
    });

    return jsonResponse(result);
  } catch (error) {
    console.error('[AI Intent] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
