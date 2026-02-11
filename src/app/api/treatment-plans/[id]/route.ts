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

    const { data: plan, error } = await client
      .from('treatment_plans')
      .select('*')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !plan) {
      return errorResponse('Treatment plan not found', 404);
    }

    return jsonResponse(plan);
  } catch (error) {
    console.error('[TreatmentPlan GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
