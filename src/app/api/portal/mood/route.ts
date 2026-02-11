import { NextRequest } from 'next/server';
import { getPortalAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/portal-api-helpers';
import { getMoodHistory, getTodayMood, createMoodCheckin } from '@/services/portal.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getPortalAuthContext(req);
    const client = getAdminClient();

    const includeToday = req.nextUrl.searchParams.get('today') === 'true';

    if (includeToday) {
      const today = await getTodayMood(client, auth.orgId, auth.patientId);
      return jsonResponse({ today });
    }

    const history = await getMoodHistory(client, auth.orgId, auth.patientId);
    return jsonResponse({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getPortalAuthContext(req);
    const client = getAdminClient();
    const body = await req.json();

    const { mood, note } = body;

    if (!mood || !['great', 'good', 'okay', 'low', 'rough'].includes(mood)) {
      return errorResponse('Invalid mood. Must be one of: great, good, okay, low, rough');
    }

    const checkin = await createMoodCheckin(client, auth.orgId, auth.patientId, mood, note);
    return jsonResponse(checkin, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
