import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getRunWithDetails } from '@/services/ai-run.service';
import { commitActionGroup } from '@/services/commit.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();

    // Get run details
    const details = await getRunWithDetails(client, id);
    if (details.run.org_id !== auth.orgId) {
      return errorResponse('Not found', 404);
    }
    if (details.run.status !== 'ready_to_commit') {
      return errorResponse(`Run is not ready to commit: ${details.run.status}`, 400);
    }

    // Find the action group
    const pendingActions = details.actions.filter((a) => a.status === 'pending');
    if (pendingActions.length === 0) {
      return errorResponse('No pending actions to commit', 400);
    }

    const groupId = pendingActions[0].action_group;
    const result = await commitActionGroup(client, groupId, auth.providerId, auth.orgId);

    return jsonResponse(result);
  } catch (error) {
    console.error('[AI Commit] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
