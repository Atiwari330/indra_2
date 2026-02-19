import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getPatientMilestones, toggleConsentMilestone } from '@/services/milestone.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();
    const milestones = await getPatientMilestones(client, auth.orgId, id);
    return jsonResponse(milestones);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const body = await req.json();
    const { milestone_type, completed } = body;

    if (milestone_type !== 'consent_intake_forms') {
      return errorResponse('Invalid milestone_type', 400);
    }

    const client = getAdminClient();
    await toggleConsentMilestone(client, auth.orgId, id, auth.providerId, completed !== false);
    const milestones = await getPatientMilestones(client, auth.orgId, id);
    return jsonResponse(milestones);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();
    await toggleConsentMilestone(client, auth.orgId, id, auth.providerId, false);
    const milestones = await getPatientMilestones(client, auth.orgId, id);
    return jsonResponse(milestones);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
