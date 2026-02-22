import { NextRequest } from 'next/server';
import { getAdminClient, jsonResponse, errorResponse } from '@/lib/api-helpers';
import {
  startIntakePacketItem,
  saveIntakeItemProgress,
  completeConsentItem,
  completeQuestionnaireItem,
  checkAndCompletePacket,
} from '@/services/intake-packet.service';

// PATCH — save progress on an item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await req.json();
    const { responses, packetId } = body as {
      responses: Record<string, unknown>;
      packetId: string;
    };

    const client = getAdminClient();

    // Auto-start if this is the first interaction
    if (packetId) {
      await startIntakePacketItem(client, itemId, packetId);
    }

    if (responses) {
      await saveIntakeItemProgress(client, itemId, responses);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}

// POST — complete an item (consent sign or questionnaire submit)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await req.json();
    const { type, signatureName, responses, packetId } = body as {
      type: 'consent' | 'questionnaire';
      signatureName?: string;
      responses?: Record<string, unknown>;
      packetId: string;
    };

    const client = getAdminClient();

    if (type === 'consent') {
      if (!signatureName) {
        return errorResponse('signatureName is required for consent items', 400);
      }
      await completeConsentItem(client, itemId, signatureName);
    } else if (type === 'questionnaire') {
      if (!responses) {
        return errorResponse('responses is required for questionnaire items', 400);
      }
      await completeQuestionnaireItem(client, itemId, responses);
    } else {
      return errorResponse('type must be "consent" or "questionnaire"', 400);
    }

    // Check if entire packet is now complete
    const packetComplete = await checkAndCompletePacket(client, packetId);

    return jsonResponse({ success: true, packetComplete });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
