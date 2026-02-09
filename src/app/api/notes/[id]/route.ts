import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();

    const { data: note, error } = await client
      .from('clinical_notes')
      .select('id, note_type, content, status, created_at, signed_at, signed_by, encounter_id')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !note) {
      return errorResponse('Note not found', 404);
    }

    return jsonResponse(note);
  } catch (error) {
    console.error('[Notes GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
