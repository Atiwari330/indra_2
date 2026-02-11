import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { createSession } from '@/services/transcription.service';
import { uuidFormat } from '@/lib/schemas/shared';

const StartTranscriptionInput = z.object({
  patient_id: z.string().regex(uuidFormat, 'Invalid UUID'),
  appointment_id: z.string().regex(uuidFormat, 'Invalid UUID').optional(),
  encounter_id: z.string().regex(uuidFormat, 'Invalid UUID').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    const body = await req.json();
    const parsed = StartTranscriptionInput.safeParse(body);

    if (!parsed.success) {
      console.error('[Transcription] Validation error:', parsed.error.message);
      return errorResponse(`Validation error: ${parsed.error.message}`, 400);
    }

    const client = getAdminClient();
    const result = await createSession(client, auth.orgId, {
      patientId: parsed.data.patient_id,
      providerId: auth.providerId,
      appointmentId: parsed.data.appointment_id,
      encounterId: parsed.data.encounter_id,
    });

    console.log(`[Transcription] Session started: ${result.id}, wsUrl: ${result.wsUrl}`);
    return jsonResponse(result);
  } catch (error) {
    console.error('[Transcription] Start error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
