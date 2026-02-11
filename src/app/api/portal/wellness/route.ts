import { NextRequest } from 'next/server';
import { getPortalAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/portal-api-helpers';
import { getWellnessSnapshot } from '@/services/portal.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getPortalAuthContext(req);
    const client = getAdminClient();

    const scores = await getWellnessSnapshot(client, auth.orgId, auth.patientId);
    return jsonResponse({ scores });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
