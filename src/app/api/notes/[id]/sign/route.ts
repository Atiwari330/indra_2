import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import * as noteService from '@/services/note.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();

    const signed = await noteService.signNote(client, auth.orgId, id, auth.providerId);

    return jsonResponse(signed);
  } catch (error) {
    console.error('[Notes Sign] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
