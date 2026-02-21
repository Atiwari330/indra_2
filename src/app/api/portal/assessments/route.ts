import { NextRequest } from 'next/server';
import { getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getPendingPortalAssessments } from '@/services/assessment.service';

const DEV_PATIENT_ID = 'd0000000-0000-0000-0000-000000000001';
const DEV_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET(_req: NextRequest) {
  try {
    const client = getAdminClient();
    const assessments = await getPendingPortalAssessments(client, DEV_PATIENT_ID, DEV_ORG_ID);
    return jsonResponse(assessments);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
