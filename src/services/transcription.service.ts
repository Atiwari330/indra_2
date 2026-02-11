import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import WebSocket from 'ws';

type Client = SupabaseClient<Database>;

export interface TranscriptSegment {
  speaker: 'clinician' | 'patient';
  text: string;
  start: number;
  end: number;
  is_final: boolean;
  channel: number;
  timestamp: string;
}

export interface TranscriptionSession {
  id: string;
  orgId: string;
  patientId: string;
  providerId: string;
  appointmentId?: string;
  encounterId?: string;
}

interface ActiveSession {
  deepgramSocket: WebSocket | null;
  segments: TranscriptSegment[];
  sseClients: Set<(segment: TranscriptSegment) => void>;
  startedAt: number;
}

// In-memory store for active transcription sessions
const activeSessions = new Map<string, ActiveSession>();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY ?? '';

const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
  model: 'nova-3-medical',
  multichannel: 'true',
  channels: '2',
  encoding: 'linear16',
  sample_rate: '16000',
  smart_format: 'true',
  interim_results: 'true',
  endpointing: '300',
  utterance_end_ms: '1000',
}).toString();

// ── Session CRUD ────────────────────────────────────────────────

export async function createSession(
  client: Client,
  orgId: string,
  session: {
    patientId: string;
    providerId: string;
    appointmentId?: string;
    encounterId?: string;
  }
): Promise<{ id: string; wsUrl: string }> {
  const { data, error } = await client
    .from('transcription_sessions')
    .insert({
      org_id: orgId,
      patient_id: session.patientId,
      provider_id: session.providerId,
      appointment_id: session.appointmentId,
      encounter_id: session.encounterId,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) throw new Error(`[Transcription] Failed to create session: ${error.message}`);

  console.log(`[Transcription] Session ${data.id} created for patient ${session.patientId}`);

  // Initialize in-memory state
  activeSessions.set(data.id, {
    deepgramSocket: null,
    segments: [],
    sseClients: new Set(),
    startedAt: Date.now(),
  });

  // Return the session ID and the WebSocket URL the extension should connect to
  const wsProtocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';
  const host = process.env.NEXT_PUBLIC_APP_URL ?? 'localhost:3001';
  const wsUrl = `${wsProtocol}://${host}/api/transcription/ws?sessionId=${data.id}`;

  return { id: data.id, wsUrl };
}

export async function stopSession(
  client: Client,
  sessionId: string
): Promise<{ fullTranscript: string }> {
  const session = activeSessions.get(sessionId);

  // Close Deepgram connection
  if (session?.deepgramSocket?.readyState === WebSocket.OPEN) {
    console.log(`[Deepgram] Sending CloseStream for session ${sessionId}`);
    session.deepgramSocket.send(JSON.stringify({ type: 'CloseStream' }));
    session.deepgramSocket.close();
  }

  // Build full transcript from final segments
  const finalSegments = (session?.segments ?? []).filter(s => s.is_final);
  const fullTranscript = finalSegments
    .map(s => `[${s.speaker}] ${s.text}`)
    .join('\n');

  // Persist to DB
  const { error } = await client
    .from('transcription_sessions')
    .update({
      status: 'completed',
      transcript_segments: finalSegments as unknown as Database['public']['Tables']['transcription_sessions']['Update']['transcript_segments'],
      full_transcript: fullTranscript,
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error(`[Transcription] Failed to update session ${sessionId}:`, error.message);
  }

  // Notify SSE clients that session ended
  if (session) {
    for (const notify of session.sseClients) {
      notify({ speaker: 'clinician', text: '', start: 0, end: 0, is_final: true, channel: -1, timestamp: new Date().toISOString() });
    }
    session.sseClients.clear();
  }

  // Clean up
  activeSessions.delete(sessionId);
  console.log(`[Transcription] Session ${sessionId} stopped. ${finalSegments.length} segments, ${fullTranscript.length} chars`);

  return { fullTranscript };
}

export async function getSession(client: Client, sessionId: string) {
  const { data, error } = await client
    .from('transcription_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw new Error(`[Transcription] Session not found: ${error.message}`);
  return data;
}

export async function getSessionTranscript(client: Client, sessionId: string): Promise<string> {
  const session = await getSession(client, sessionId);
  if (session.full_transcript) return session.full_transcript;

  // Build from segments if not yet finalized
  const segments = (session.transcript_segments ?? []) as unknown as TranscriptSegment[];
  return segments
    .filter(s => s.is_final)
    .map(s => `[${s.speaker}] ${s.text}`)
    .join('\n');
}

// ── Deepgram Connection ─────────────────────────────────────────

export function connectDeepgram(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (!session) {
    console.error(`[Deepgram] No active session ${sessionId}`);
    return;
  }

  if (!DEEPGRAM_API_KEY) {
    console.error('[Deepgram] ERROR: DEEPGRAM_API_KEY not set');
    return;
  }

  console.log(`[Deepgram] Connecting to nova-3-medical for session ${sessionId}`);

  const dgSocket = new WebSocket(DEEPGRAM_WS_URL, {
    headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` },
  });

  dgSocket.on('open', () => {
    console.log(`[Deepgram] Connected for session ${sessionId}`);
  });

  dgSocket.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === 'Results') {
        const channelIndex = data.channel_index?.[0] ?? 0;
        const alt = data.channel?.alternatives?.[0];
        if (!alt?.transcript) return;

        const speaker = channelIndex === 0 ? 'clinician' : 'patient';
        const segment: TranscriptSegment = {
          speaker,
          text: alt.transcript,
          start: data.start ?? 0,
          end: data.start + (data.duration ?? 0),
          is_final: data.is_final ?? false,
          channel: channelIndex,
          timestamp: new Date().toISOString(),
        };

        if (data.is_final) {
          session.segments.push(segment);
          const latency = Date.now() - session.startedAt;
          console.log(`[Deepgram] Segment (${speaker}, final): "${alt.transcript.slice(0, 80)}${alt.transcript.length > 80 ? '...' : ''}" | latency: ${latency}ms`);
        }

        // Push to SSE clients (both interim and final)
        for (const notify of session.sseClients) {
          notify(segment);
        }
      }

      if (data.type === 'Metadata') {
        console.log(`[Deepgram] Metadata: model=${data.model_info?.name}, channels=${data.channels}`);
      }

      if (data.type === 'UtteranceEnd') {
        console.log(`[Deepgram] Utterance end at ${data.last_word_end}s`);
      }
    } catch (err) {
      console.error(`[Deepgram] Failed to parse message:`, err);
    }
  });

  dgSocket.on('close', (code, reason) => {
    console.log(`[Deepgram] Connection closed for session ${sessionId} (code: ${code}, reason: ${reason?.toString()})`);
    session.deepgramSocket = null;
  });

  dgSocket.on('error', (err) => {
    console.error(`[Deepgram] ERROR for session ${sessionId}:`, err.message);
  });

  session.deepgramSocket = dgSocket;
}

// ── Audio Forwarding ────────────────────────────────────────────

export function forwardAudioToDeepgram(sessionId: string, pcmData: Buffer): void {
  const session = activeSessions.get(sessionId);
  if (!session?.deepgramSocket) {
    console.error(`[Deepgram] No active connection for session ${sessionId}`);
    return;
  }

  if (session.deepgramSocket.readyState === WebSocket.OPEN) {
    session.deepgramSocket.send(pcmData);
  }
}

// ── SSE Subscribers ─────────────────────────────────────────────

export function subscribeToTranscript(
  sessionId: string,
  callback: (segment: TranscriptSegment) => void
): () => void {
  const session = activeSessions.get(sessionId);
  if (!session) {
    console.error(`[Transcription] Cannot subscribe: session ${sessionId} not found`);
    return () => {};
  }

  session.sseClients.add(callback);
  console.log(`[Transcription] SSE client subscribed to session ${sessionId} (total: ${session.sseClients.size})`);

  // Send existing segments to new subscriber
  for (const seg of session.segments) {
    callback(seg);
  }

  return () => {
    session.sseClients.delete(callback);
    console.log(`[Transcription] SSE client unsubscribed from session ${sessionId} (total: ${session.sseClients.size})`);
  };
}

// ── Helpers ──────────────────────────────────────────────────────

export function isSessionActive(sessionId: string): boolean {
  return activeSessions.has(sessionId);
}

export function getActiveSessionCount(): number {
  return activeSessions.size;
}
