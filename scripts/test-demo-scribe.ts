/**
 * CLI test script for the demo scribe backend pipeline.
 * Validates: session creation → Deepgram connection → transcription → stop → DB persistence.
 *
 * Usage: npx tsx scripts/test-demo-scribe.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import WebSocket from 'ws';
import { createAdminClient } from '../src/lib/supabase/admin';
import { createSession, stopSession } from '../src/services/transcription.service';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const PROVIDER_ID = 'c0000000-0000-0000-0000-000000000001';
const PATIENT_ID = 'd0000000-0000-0000-0000-000000000001';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY ?? '';

let sessionId: string | null = null;
let client: ReturnType<typeof createAdminClient>;

function log(step: number, total: number, label: string, detail: string) {
  console.log(`[${step}/${total}] ${label} ✓ (${detail})`);
}

function fail(step: number, total: number, label: string, err: string): never {
  console.error(`[${step}/${total}] ${label} ✗ ${err}`);
  process.exit(1);
}

async function cleanup() {
  if (!sessionId) return;
  try {
    const { error } = await client
      .from('transcription_sessions')
      .delete()
      .eq('id', sessionId);
    if (error) {
      console.error(`Cleanup warning: ${error.message}`);
    } else {
      console.log('Cleaning up test session... ✓');
    }
  } catch (err) {
    console.error('Cleanup warning:', err);
  }
}

async function main() {
  const TOTAL = 6;

  console.log('\n[Test] Demo Scribe Backend Validation');
  console.log('──────────────────────────────────────');

  // Pre-flight checks
  if (!DEEPGRAM_API_KEY) {
    console.error('ERROR: DEEPGRAM_API_KEY not set in .env.local');
    process.exit(1);
  }

  client = createAdminClient();

  // ── Step 1: Create transcription session ──────────────────────
  try {
    const result = await createSession(client, ORG_ID, {
      patientId: PATIENT_ID,
      providerId: PROVIDER_ID,
    });
    sessionId = result.id;
    log(1, TOTAL, 'Creating transcription session...', `session: ${sessionId.slice(0, 8)}`);
  } catch (err) {
    fail(1, TOTAL, 'Creating transcription session...', (err as Error).message);
  }

  // ── Step 2: Build Deepgram URL ────────────────────────────────
  const dgParams = new URLSearchParams({
    model: 'nova-3-medical',
    encoding: 'linear16',
    sample_rate: '16000',
    smart_format: 'true',
    interim_results: 'true',
    endpointing: '300',
    utterance_end_ms: '1000',
  });
  const dgUrl = `wss://api.deepgram.com/v1/listen?${dgParams.toString()}`;
  log(2, TOTAL, 'Building Deepgram URL...', 'nova-3-medical, mono, 16kHz');

  // ── Steps 3+4: Connect to Deepgram, send audio, wait for Metadata ──
  // Deepgram sends Metadata immediately on connection, so we must
  // attach the message listener *before* the 'open' event resolves.
  const connectStart = Date.now();
  let dgSocket: WebSocket;

  try {
    const { socket, metadataReceived } = await new Promise<{
      socket: WebSocket;
      metadataReceived: Promise<boolean>;
    }>((resolve, reject) => {
      const ws = new WebSocket(dgUrl, {
        headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` },
      });

      const connectTimeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timed out after 10s'));
      }, 10_000);

      // Set up metadata listener immediately (before 'open' fires)
      const metadataReceived = new Promise<boolean>((metaResolve, metaReject) => {
        const metaTimeout = setTimeout(() => {
          metaReject(new Error('No Metadata response within 15s'));
        }, 15_000);

        ws.on('message', (raw) => {
          try {
            const data = JSON.parse(raw.toString());
            if (data.type === 'Metadata') {
              clearTimeout(metaTimeout);
              metaResolve(true);
            }
          } catch {
            // ignore parse errors
          }
        });
      });

      ws.on('open', () => {
        clearTimeout(connectTimeout);
        resolve({ socket: ws, metadataReceived });
      });

      ws.on('error', (err) => {
        clearTimeout(connectTimeout);
        reject(err);
      });
    });

    dgSocket = socket;
    const connectMs = Date.now() - connectStart;
    log(3, TOTAL, 'Connecting to Deepgram...', `connected in ${connectMs}ms`);

    // Send 1s of 16kHz mono silence (16000 samples × 2 bytes = 32000 bytes)
    const silence = Buffer.alloc(32_000, 0);
    dgSocket.send(silence);

    // Wait for Metadata response
    await metadataReceived;
    log(4, TOTAL, 'Sending test audio...', 'received Metadata response');
  } catch (err) {
    // Determine which step failed based on whether we got past connect
    const msg = (err as Error).message;
    if (msg.includes('Metadata')) {
      fail(4, TOTAL, 'Sending test audio...', msg);
    } else {
      fail(3, TOTAL, 'Connecting to Deepgram...', msg);
    }
  }

  // Close Deepgram connection
  dgSocket.close();

  // ── Step 5: Stop session with mock segments ───────────────────
  const mockSegments = [
    { speaker: 'clinician', text: 'How are you feeling today?', is_final: true, timestamp: new Date().toISOString() },
    { speaker: 'patient', text: 'Much better than last week.', is_final: true, timestamp: new Date().toISOString() },
    { speaker: 'clinician', text: 'Good to hear. Let us review your progress.', is_final: true, timestamp: new Date().toISOString() },
  ];

  try {
    const result = await stopSession(client, sessionId!, mockSegments);
    log(5, TOTAL, 'Stopping session with mock segments...', `${mockSegments.length} segments persisted`);
  } catch (err) {
    fail(5, TOTAL, 'Stopping session with mock segments...', (err as Error).message);
  }

  // ── Step 6: Verify DB persistence ─────────────────────────────
  try {
    const { data, error } = await client
      .from('transcription_sessions')
      .select('status, transcript_segments, full_transcript')
      .eq('id', sessionId!)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Session row not found');

    if (data.status !== 'completed') {
      throw new Error(`Expected status=completed, got status=${data.status}`);
    }

    const segmentCount = Array.isArray(data.transcript_segments)
      ? data.transcript_segments.length
      : 0;
    const transcriptLen = data.full_transcript?.length ?? 0;

    if (segmentCount === 0) {
      throw new Error('transcript_segments is empty');
    }
    if (transcriptLen === 0) {
      throw new Error('full_transcript is empty');
    }

    log(6, TOTAL, 'Verifying DB persistence...',
      `status=completed, transcript_segments=${segmentCount}, full_transcript=${transcriptLen} chars`);
  } catch (err) {
    fail(6, TOTAL, 'Verifying DB persistence...', (err as Error).message);
  }

  // ── Cleanup ───────────────────────────────────────────────────
  await cleanup();

  console.log(`\n✓ All ${TOTAL} checks passed — backend pipeline is working\n`);
}

main().catch(async (err) => {
  console.error('\nFatal error:', err);
  await cleanup();
  process.exit(1);
});
