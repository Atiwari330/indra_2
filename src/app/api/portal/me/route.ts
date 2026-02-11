import { NextRequest } from 'next/server';
import { getPortalAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/portal-api-helpers';
import { getPortalPatient, getPatientProvider } from '@/services/portal.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getPortalAuthContext(req);
    const client = getAdminClient();

    const [patient, provider] = await Promise.all([
      getPortalPatient(client, auth.orgId, auth.patientId),
      getPatientProvider(client, auth.orgId, auth.patientId),
    ]);

    return jsonResponse({
      patient,
      provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
