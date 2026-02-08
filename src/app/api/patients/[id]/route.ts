import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getPatientContext } from '@/services/patient.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();
    const context = await getPatientContext(client, auth.orgId, id);

    return jsonResponse(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
