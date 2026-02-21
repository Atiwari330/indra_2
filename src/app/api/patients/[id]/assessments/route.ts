import { NextRequest } from 'next/server';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { createAssessmentRequest, getAssessmentRequests } from '@/services/assessment.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id } = await params;
    const client = getAdminClient();
    const requests = await getAssessmentRequests(client, id, auth.orgId);
    return jsonResponse(requests);
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
    const { measureTypes } = body as { measureTypes: string[] };

    if (!Array.isArray(measureTypes) || measureTypes.length === 0) {
      return errorResponse('measureTypes must be a non-empty array', 400);
    }

    const validTypes = ['PHQ-9', 'GAD-7'];
    for (const mt of measureTypes) {
      if (!validTypes.includes(mt)) {
        return errorResponse(`Invalid measure type: ${mt}`, 400);
      }
    }

    const client = getAdminClient();
    const results = await Promise.all(
      measureTypes.map((mt) =>
        createAssessmentRequest(client, id, auth.providerId, auth.orgId, mt)
      )
    );

    return jsonResponse(results, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
