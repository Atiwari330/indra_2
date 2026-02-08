import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getEncounter } from '@/services/encounter.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();
    const encounter = await getEncounter(client, auth.orgId, id);

    return jsonResponse(encounter);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
