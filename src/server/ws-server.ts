/**
 * Standalone WebSocket server for the audio transcription pipeline.
 *
 * Runs on port 3001 (alongside Next.js on 3000).
 * Chrome extension connects here to stream raw PCM audio.
 * This server proxies the audio to Deepgram and stores transcripts.
 *
 * Usage: npx tsx src/server/ws-server.ts
 */

import { WebSocketServer } from 'ws';
import { connectDeepgram, forwardAudioToDeepgram, isSessionActive } from '../services/transcription.service';

// Load env from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PORT = parseInt(process.env.WS_PORT ?? '3001', 10);

const wss = new WebSocketServer({ port: PORT });

console.log(`[WebSocket] Server listening on port ${PORT}`);

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '', `http://localhost:${PORT}`);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    console.error('[WebSocket] Connection rejected: no sessionId');
    ws.close(4000, 'Missing sessionId');
    return;
  }

  if (!isSessionActive(sessionId)) {
    console.error(`[WebSocket] Connection rejected: session ${sessionId} not active`);
    ws.close(4001, 'Session not active');
    return;
  }

  console.log(`[WebSocket] Extension connected for session ${sessionId}`);

  // Connect to Deepgram for this session
  connectDeepgram(sessionId);

  let bytesReceived = 0;
  let chunksReceived = 0;

  ws.on('message', (data) => {
    if (data instanceof Buffer) {
      bytesReceived += data.length;
      chunksReceived++;

      if (chunksReceived % 100 === 0) {
        console.log(`[WebSocket] Session ${sessionId}: ${chunksReceived} chunks, ${(bytesReceived / 1024).toFixed(1)} KB total`);
      }

      forwardAudioToDeepgram(sessionId, data);
    } else {
      // Handle text messages (e.g., KeepAlive)
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'KeepAlive') {
          // Silently acknowledged
        } else {
          console.log(`[WebSocket] Text message from session ${sessionId}:`, msg);
        }
      } catch {
        console.warn(`[WebSocket] Unparseable text message from session ${sessionId}`);
      }
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[WebSocket] Extension disconnected from session ${sessionId} (code: ${code}, reason: ${reason?.toString()})`);
    console.log(`[WebSocket] Session ${sessionId} stats: ${chunksReceived} chunks, ${(bytesReceived / 1024).toFixed(1)} KB`);
  });

  ws.on('error', (err) => {
    console.error(`[WebSocket] Error for session ${sessionId}:`, err.message);
  });

  // Send acknowledgment
  ws.send(JSON.stringify({ type: 'connected', sessionId }));
});

wss.on('error', (err) => {
  console.error('[WebSocket] Server error:', err.message);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[WebSocket] SIGTERM received, shutting down...');
  wss.close(() => {
    console.log('[WebSocket] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[WebSocket] SIGINT received, shutting down...');
  wss.close(() => {
    console.log('[WebSocket] Server closed');
    process.exit(0);
  });
});
