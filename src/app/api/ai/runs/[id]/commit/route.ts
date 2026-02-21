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
    console.log(`[commit] Run ${id} | status: ${details.run.status} | actions: ${details.actions.length}`);

    if (details.run.org_id !== auth.orgId) {
      return errorResponse('Not found', 404);
    }
    if (details.run.status !== 'ready_to_commit') {
      console.log(`[commit] BLOCKED — run status is '${details.run.status}', not 'ready_to_commit'`);
      return errorResponse(`Run is not ready to commit: ${details.run.status}`, 400);
    }

    // Find the action group
    const pendingActions = details.actions.filter((a) => a.status === 'pending');
    console.log(`[commit] Pending actions: ${pendingActions.length} | all action statuses: ${details.actions.map(a => `${a.action_type}:${a.status}`).join(', ')}`);

    if (pendingActions.length === 0) {
      return errorResponse('No pending actions to commit', 400);
    }

    const groupId = pendingActions[0].action_group;
    console.log(`[commit] Committing group ${groupId} with ${pendingActions.length} action(s): ${pendingActions.map(a => a.action_type).join(', ')}`);

    const result = await commitActionGroup(client, groupId, auth.providerId, auth.userId, auth.orgId, details.run.patient_id);
    console.log(`[commit] Result: committed=${result.committed} | ${result.results.map(r => `${r.actionType}:${r.success ? 'OK' : 'FAIL'}${r.error ? '(' + r.error + ')' : ''}`).join(', ')}`);

    return jsonResponse(result);
  } catch (error) {
    console.error('[AI Commit] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
