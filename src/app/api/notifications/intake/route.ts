import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getUnviewedCompletedIntakeCount, getUnviewedCompletedIntake } from '@/services/intake-packet.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    const client = getAdminClient();

    const [count, items] = await Promise.all([
      getUnviewedCompletedIntakeCount(client, auth.providerId, auth.orgId),
      getUnviewedCompletedIntake(client, auth.providerId, auth.orgId),
    ]);

    return jsonResponse({ count, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
