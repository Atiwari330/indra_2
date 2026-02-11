import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { stopSession } from '@/services/transcription.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();

    const result = await stopSession(client, id);
    console.log(`[Transcription] Session ${id} stopped successfully`);

    return jsonResponse({
      sessionId: id,
      status: 'completed',
      transcriptLength: result.fullTranscript.length,
    });
  } catch (error) {
    console.error('[Transcription] Stop error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
