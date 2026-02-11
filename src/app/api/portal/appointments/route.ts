import { NextRequest } from 'next/server';
import { getPortalAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/portal-api-helpers';
import { getUpcomingAppointments } from '@/services/portal.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getPortalAuthContext(req);
    const client = getAdminClient();

    const limitParam = req.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    const appointments = await getUpcomingAppointments(client, auth.orgId, auth.patientId, limit);
    return jsonResponse({ appointments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
