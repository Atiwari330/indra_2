import { NextRequest } from 'next/server';
import { getAuthContext, jsonResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    await getAuthContext(req);

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return errorResponse('DEEPGRAM_API_KEY not configured', 503);
    }

    const params = new URLSearchParams({
      model: 'nova-3-medical',
      encoding: 'linear16',
      sample_rate: '16000',
      smart_format: 'true',
      interim_results: 'true',
      endpointing: '300',
      utterance_end_ms: '1000',
    });

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    return jsonResponse({ url, token: apiKey });
  } catch (error) {
    console.error('[DemoToken] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}
