import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getUnviewedCompletedCount, getUnviewedCompleted } from '@/services/assessment.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    const client = getAdminClient();

    const [count, items] = await Promise.all([
      getUnviewedCompletedCount(client, auth.providerId, auth.orgId),
      getUnviewedCompleted(client, auth.providerId, auth.orgId),
    ]);

    return jsonResponse({ count, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
