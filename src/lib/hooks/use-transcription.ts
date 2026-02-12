'use client';

import { useState, useCallback, useRef } from 'react';

// Chrome extension ID — update with your published extension ID
const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID ?? '';

interface TranscriptionState {
  isActive: boolean;
  awaitingCapture: boolean;
  sessionId: string | null;
  patientId: string | null;
  patientName: string | null;
  error: string | null;
}

export function useTranscription() {
  const [state, setState] = useState<TranscriptionState>({
    isActive: false,
    awaitingCapture: false,
    sessionId: null,
    patientId: null,
    patientName: null,
    error: null,
  });
  const extensionAvailableRef = useRef<boolean | null>(null);

  const checkExtension = useCallback(async (): Promise<boolean> => {
    if (extensionAvailableRef.current !== null) {
      return extensionAvailableRef.current;
    }

    if (!EXTENSION_ID) {
      console.log('[TranscriptionHook] No EXTENSION_ID configured');
      extensionAvailableRef.current = false;
      return false;
    }

    try {
      const response = await sendToExtension({ type: 'ping' });
      extensionAvailableRef.current = response?.status === 'ok';
      console.log(`[TranscriptionHook] Extension check: ${extensionAvailableRef.current ? 'available' : 'not found'}`);
      return extensionAvailableRef.current;
    } catch {
      extensionAvailableRef.current = false;
      return false;
    }
  }, []);

  const pollForCaptureStart = useCallback(() => {
    const interval = setInterval(async () => {
      const status = await sendToExtension({ type: 'get-status' });
      if (status?.recording) {
        clearInterval(interval);
        setState(prev => ({ ...prev, awaitingCapture: false }));
        console.log('[TranscriptionHook] Capture started, awaitingCapture cleared');
      }
    }, 500);

    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(interval), 120_000);
  }, []);

  const startSession = useCallback(async (
    patientId: string,
    patientName: string,
    appointmentId?: string
  ) => {
    setState(prev => ({ ...prev, error: null }));

    try {
      // 1. Call backend to create transcription session
      console.log(`[TranscriptionHook] Starting session for patient ${patientId}`);
      const res = await fetch('/api/transcription/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          appointment_id: appointmentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start transcription session');
      }

      const { id: sessionId, wsUrl } = await res.json();
      console.log(`[TranscriptionHook] Session created: ${sessionId}, wsUrl: ${wsUrl}`);

      // 2. Signal Chrome extension to prepare capture (two-step flow)
      if (EXTENSION_ID) {
        const extResponse = await sendToExtension({
          type: 'prepare-recording',
          sessionId,
          wsUrl,
        });

        if (extResponse?.error) {
          throw new Error(`Extension error: ${extResponse.error}`);
        }
        console.log(`[TranscriptionHook] Extension response: ${extResponse?.status}`);
      } else {
        console.warn('[TranscriptionHook] No extension ID — session created but no audio capture');
      }

      setState({
        isActive: true,
        awaitingCapture: true,
        sessionId,
        patientId,
        patientName,
        error: null,
      });

      // Poll extension status until capture actually starts
      if (EXTENSION_ID) {
        pollForCaptureStart();
      }

      return sessionId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TranscriptionHook] Start failed:', message);
      setState(prev => ({ ...prev, error: message }));
      return null;
    }
  }, [pollForCaptureStart]);

  const stopSession = useCallback(async () => {
    if (!state.sessionId) return;

    try {
      console.log(`[TranscriptionHook] Stopping session ${state.sessionId}`);

      // 1. Signal extension to stop
      if (EXTENSION_ID) {
        await sendToExtension({ type: 'stop-recording' });
      }

      // 2. Call backend to finalize
      await fetch(`/api/transcription/${state.sessionId}/stop`, {
        method: 'POST',
      });

      console.log(`[TranscriptionHook] Session ${state.sessionId} stopped`);

      setState({
        isActive: false,
        awaitingCapture: false,
        sessionId: null,
        patientId: null,
        patientName: null,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TranscriptionHook] Stop failed:', message);
      setState(prev => ({ ...prev, error: message }));
    }
  }, [state.sessionId]);

  const closePanel = useCallback(() => {
    setState({
      isActive: false,
      awaitingCapture: false,
      sessionId: null,
      patientId: null,
      patientName: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    checkExtension,
    startSession,
    stopSession,
    closePanel,
  };
}

// ── Extension Communication ─────────────────────────────────────

function sendToExtension(message: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    if (!EXTENSION_ID || typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve(null);
      return;
    }

    try {
      chrome.runtime!.sendMessage(EXTENSION_ID, message, (response: Record<string, unknown>) => {
        if (chrome?.runtime?.lastError) {
          console.warn('[TranscriptionHook] Extension message failed:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(response ?? null);
      });
    } catch {
      resolve(null);
    }
  });
}
