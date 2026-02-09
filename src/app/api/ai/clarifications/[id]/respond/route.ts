import { NextRequest } from 'next/server';
import { ClarificationResponse } from '@/lib/schemas/ai';
import { getAuthContext, getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import { answerClarification, getRunWithDetails } from '@/services/ai-run.service';
import { resumeAfterClarification } from '@/ai/run-manager';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    const { id: clarificationId } = await params;
    const body = await req.json();
    const parsed = ClarificationResponse.safeParse(body);

    if (!parsed.success) {
      console.error('[AI Clarification] Validation error:', parsed.error.message, '| Body:', JSON.stringify(body));
      return errorResponse(`Validation error: ${parsed.error.message}`, 400);
    }

    const client = getAdminClient();

    // Answer the clarification
    const clarification = await answerClarification(
      client, clarificationId, parsed.data.answer, auth.userId
    );

    // Check if all clarifications for this run are answered
    const details = await getRunWithDetails(client, clarification.run_id);
    const unanswered = details.clarifications.filter((c) => !c.answer);

    if (unanswered.length > 0) {
      return jsonResponse({
        status: 'needs_more_answers',
        unanswered: unanswered.map((c) => ({
          id: c.id,
          question: c.question,
        })),
      });
    }

    // All answered — resume the run
    const result = await resumeAfterClarification(
      client,
      clarification.run_id,
      auth.orgId,
      auth.userId,
      auth.providerId
    );

    return jsonResponse(result);
  } catch (error) {
    console.error('[AI Clarification] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
