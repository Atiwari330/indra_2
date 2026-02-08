import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { searchPatients } from '@/services/patient.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    const query = req.nextUrl.searchParams.get('q');

    if (!query) {
      return errorResponse('Missing search query parameter "q"', 400);
    }

    const client = getAdminClient();
    const results = await searchPatients(client, auth.orgId, query);

    return jsonResponse(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
