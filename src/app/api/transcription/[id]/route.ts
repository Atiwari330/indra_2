import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSession } from '@/services/transcription.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();

    const session = await getSession(client, id);
    return jsonResponse(session);
  } catch (error) {
    console.error('[Transcription] Get session error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
