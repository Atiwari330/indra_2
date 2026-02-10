import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();

    const { data: ur, error } = await client
      .from('utilization_reviews')
      .select('id, review_type, status, sessions_authorized, sessions_used, sessions_requested, created_at, approved_at, approved_by, generated_content')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !ur) {
      return errorResponse('Utilization review not found', 404);
    }

    return jsonResponse(ur);
  } catch (error) {
    console.error('[UR GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();
    const body = await req.json();

    if (body.status !== 'approved') {
      return errorResponse('Only status "approved" is supported', 400);
    }

    const { data: ur, error } = await client
      .from('utilization_reviews')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: auth.userId,
      })
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .select('id, status, approved_at, approved_by')
      .single();

    if (error || !ur) {
      return errorResponse('Failed to approve utilization review', 500);
    }

    return jsonResponse(ur);
  } catch (error) {
    console.error('[UR PUT] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
