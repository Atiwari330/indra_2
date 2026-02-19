import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id: runId, actionId } = await params;
    const client = getAdminClient();

    // Verify run belongs to user's org
    const { data: run, error: runError } = await client
      .from('ai_runs')
      .select('id, org_id, status')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      return errorResponse('Run not found', 404);
    }
    if (run.org_id !== auth.orgId) {
      return errorResponse('Not found', 404);
    }
    if (run.status !== 'ready_to_commit') {
      return errorResponse(`Run is not ready to commit: ${run.status}`, 400);
    }

    // Verify action belongs to this run
    const { data: action, error: actionError } = await client
      .from('ai_proposed_actions')
      .select('id, run_id')
      .eq('id', actionId)
      .eq('run_id', runId)
      .single();

    if (actionError || !action) {
      return errorResponse('Action not found', 404);
    }

    // Parse and validate body
    const body = await req.json();
    const { provider_modified_payload } = body;

    if (!provider_modified_payload || typeof provider_modified_payload !== 'object') {
      return errorResponse('Missing or invalid provider_modified_payload', 400);
    }

    // Update the action's provider_modified_payload
    const { error: updateError } = await client
      .from('ai_proposed_actions')
      .update({ provider_modified_payload })
      .eq('id', actionId);

    if (updateError) {
      console.error('[action PATCH] Update failed:', updateError.message);
      return errorResponse('Failed to update action', 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('[action PATCH] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
