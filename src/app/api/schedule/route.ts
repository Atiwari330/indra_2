import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSchedule } from '@/services/appointment.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    const providerId = req.nextUrl.searchParams.get('providerId');
    const start = req.nextUrl.searchParams.get('start');
    const end = req.nextUrl.searchParams.get('end');

    if (!providerId || !start || !end) {
      return errorResponse('Missing required query parameters: providerId, start, end', 400);
    }

    const client = getAdminClient();
    const schedule = await getSchedule(client, auth.orgId, providerId, start, end);

    return jsonResponse(schedule);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
