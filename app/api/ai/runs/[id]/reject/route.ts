import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { rejectRun } from '@/services/commit.service';
import { getRunWithDetails } from '@/services/ai-run.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason as string | undefined;

    const client = getAdminClient();
    const details = await getRunWithDetails(client, id);

    if (details.run.org_id !== auth.orgId) {
      return errorResponse('Not found', 404);
    }

    const result = await rejectRun(client, id, auth.userId, reason);
    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
