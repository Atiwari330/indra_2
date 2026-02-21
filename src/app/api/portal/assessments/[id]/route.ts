import { NextRequest } from 'next/server';
import { getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import {
  getAssessmentById,
  startAssessment,
  saveAssessmentProgress,
  submitAssessment,
} from '@/services/assessment.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getAdminClient();
    const assessment = await getAssessmentById(client, id);
    return jsonResponse(assessment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { responses } = body as {
      responses: Array<{ question_index: number; answer_value: number }>;
    };

    if (!Array.isArray(responses)) {
      return errorResponse('responses must be an array', 400);
    }

    const client = getAdminClient();

    // Auto-start if still pending
    const assessment = await getAssessmentById(client, id);
    if (assessment.status === 'pending') {
      await startAssessment(client, id);
    }

    await saveAssessmentProgress(client, id, responses);
    return jsonResponse({ success: true });
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
    const { id } = await params;
    const body = await req.json();
    const { responses } = body as {
      responses: Array<{ question_index: number; answer_value: number }>;
    };

    if (!Array.isArray(responses)) {
      return errorResponse('responses must be an array', 400);
    }

    const client = getAdminClient();
    const result = await submitAssessment(client, id, responses);
    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
