import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api-helpers';
import { subscribeToTranscript, isSessionActive } from '@/services/transcription.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await getAuthContext(req);
  const { id: sessionId } = await params;

  if (!isSessionActive(sessionId)) {
    return new Response(JSON.stringify({ error: 'Session not active' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`[Transcription] SSE stream opened for session ${sessionId}`);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`));

      const unsubscribe = subscribeToTranscript(sessionId, (segment) => {
        try {
          // channel === -1 is the session-ended signal
          if (segment.channel === -1) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'session_ended' })}\n\n`));
            controller.close();
            return;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'segment', ...segment })}\n\n`));
        } catch {
          // Client disconnected
          unsubscribe();
        }
      });

      // Clean up on abort
      req.signal.addEventListener('abort', () => {
        console.log(`[Transcription] SSE client disconnected from session ${sessionId}`);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
