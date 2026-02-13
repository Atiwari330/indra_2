'use client';

import { useState, useCallback, useRef } from 'react';

export interface TranscriptSegment {
  speaker: 'clinician' | 'patient';
  text: string;
  is_final: boolean;
  timestamp: string;
}

const DEMO_SEGMENTS: TranscriptSegment[] = [
  {
    speaker: 'clinician',
    text: "Good afternoon, Marcus. Come on in, have a seat. How have you been since our last session two weeks ago?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Hey, Dr. Chen. I've been... okay, I guess. Some days better than others. The first week was actually pretty good, but this past week has been rough.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "I'm glad to hear the first week went well. Can you tell me more about what made this past week more difficult?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Work got really stressful. My manager put me on a new project with a tight deadline and I started having those anxious thoughts again — like I'm going to mess everything up and everyone will see I'm not good enough.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "It sounds like the work pressure triggered some of those cognitive distortions we've been working on — the catastrophizing and the imposter feelings. Were you able to use any of the thought challenging techniques we practiced?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "I tried the thought record a couple times. One time it actually helped — I caught myself thinking 'I always fail at new things' and I was able to come up with evidence against that. But by Thursday I just felt too overwhelmed to do it.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That's actually real progress, Marcus. Using the thought record even once when you're under pressure is significant. Let's talk about what happened Thursday. How were you sleeping that week?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Not great. I was staying up late working, getting maybe five hours a night. By Thursday I was exhausted and everything felt way worse. I know sleep is important but I felt like I couldn't stop working.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Sleep deprivation makes everything harder — anxiety, mood, concentration, all of it. Let's come back to that. How about your medication — have you been taking the sertraline consistently?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Yeah, I've been taking it every morning. I think it's been helping overall. I don't feel that heavy, can't-get-out-of-bed feeling anymore. The anxiety is still there though.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Good to hear you've been consistent with it and noticing the benefit for the depressive symptoms. The anxiety can take a bit longer to respond, and the CBT work we're doing is really the frontline treatment for that. Any side effects you're noticing?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Not really. The nausea went away after the first couple weeks like you said it would. Maybe a little bit of dry mouth but nothing bad.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Great, that's a normal side effect profile. Now, I want to check in on something important — have you had any thoughts of hurting yourself or not wanting to be here?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "No, nothing like that. Even on the bad days last week, I didn't go there. I was frustrated and anxious but not hopeless, if that makes sense.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That makes perfect sense, and I'm glad to hear that. Being able to distinguish between frustration and hopelessness shows real self-awareness. Let's talk about building some structure around sleep. What time have you been going to bed?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Usually around midnight or one AM when I'm stressed. On good nights maybe eleven. I wake up at six-thirty for work.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Let's set a realistic goal. What if we aimed for a lights-out time of eleven PM on work nights? That would give you seven and a half hours. We could also add a wind-down period — no screens thirty minutes before bed, maybe some of the deep breathing exercises.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "I can try eleven PM. The no screens part is going to be hard because that's when I check work email, but I see why you're suggesting it. Maybe I can set an alarm to remind myself to stop.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "An alarm is a great idea — that's using behavioral activation to support the goal. For the next two weeks, let's focus on three things: continuing the thought records when you notice anxious thinking, the eleven PM sleep boundary, and keep taking the sertraline. Does that feel manageable?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Yeah, that sounds doable. Three things I can keep track of. I'll try to do the thought record at least a few times this week, even on the rough days.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Perfect. And remember — even a partial thought record is valuable. You don't have to do it perfectly. I'll see you in two weeks and we'll check in on how the sleep boundary is working and review those thought records together.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
];

interface DemoTranscriptionState {
  isActive: boolean;
  sessionId: string | null;
  patientId: string | null;
  patientName: string | null;
  segments: TranscriptSegment[];
  interimSegment: TranscriptSegment | null;
  connected: boolean;
  stopped: boolean;
  error: string | null;
}

export function useDemoTranscription() {
  const [state, setState] = useState<DemoTranscriptionState>({
    isActive: false,
    sessionId: null,
    patientId: null,
    patientName: null,
    segments: [],
    interimSegment: null,
    connected: false,
    stopped: false,
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const deepgramWsRef = useRef<WebSocket | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Use ref for segments to avoid stale closures in WebSocket callbacks
  const segmentsRef = useRef<TranscriptSegment[]>([]);

  const startSession = useCallback(async (
    patientId: string,
    patientName: string,
    appointmentId?: string
  ) => {
    setState(prev => ({ ...prev, error: null }));
    segmentsRef.current = [];

    try {
      // 1. Create DB session
      console.log(`[DemoScribe] Starting session for patient ${patientId}`);
      const startRes = await fetch('/api/transcription/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          appointment_id: appointmentId,
        }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.error || 'Failed to create transcription session');
      }

      const { id: sessionId } = await startRes.json();
      console.log(`[DemoScribe] Session created: ${sessionId}`);

      // 2. Get Deepgram WS URL with token
      const tokenRes = await fetch('/api/transcription/demo-token');
      if (!tokenRes.ok) {
        const err = await tokenRes.json();
        throw new Error(err.error || 'Failed to get Deepgram token');
      }

      const { url: deepgramUrl, token: deepgramToken } = await tokenRes.json();
      console.log('[DemoScribe] Got Deepgram URL');

      // 3. Get mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;
      console.log('[DemoScribe] Mic access granted');

      // 4. Set up AudioContext + Worklet
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      await audioCtx.audioWorklet.addModule('/pcm-worklet.js');
      const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor');
      workletNodeRef.current = workletNode;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(workletNode);
      // Worklet doesn't produce audible output, but connect to destination
      // to keep audio graph alive on some browsers
      workletNode.connect(audioCtx.destination);

      // 5. Open Deepgram WebSocket
      const dgWs = new WebSocket(deepgramUrl, ['token', deepgramToken]);
      deepgramWsRef.current = dgWs;

      dgWs.onopen = () => {
        console.log('[DemoScribe] Deepgram WebSocket connected');
        setState(prev => ({ ...prev, connected: true }));
      };

      dgWs.onclose = (e) => {
        console.log(`[DemoScribe] Deepgram WebSocket closed (code: ${e.code})`);
        setState(prev => ({ ...prev, connected: false }));
      };

      dgWs.onerror = (e) => {
        console.error('[DemoScribe] Deepgram WebSocket error:', e);
        setState(prev => ({ ...prev, error: 'Deepgram connection error' }));
      };

      dgWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'Results') {
            const alt = data.channel?.alternatives?.[0];
            if (!alt?.transcript) return;

            const segment: TranscriptSegment = {
              speaker: 'clinician',
              text: alt.transcript,
              is_final: data.is_final ?? false,
              timestamp: new Date().toISOString(),
            };

            if (data.is_final) {
              segmentsRef.current = [...segmentsRef.current, segment];
              setState(prev => ({
                ...prev,
                segments: segmentsRef.current,
                interimSegment: null,
              }));
            } else {
              setState(prev => ({ ...prev, interimSegment: segment }));
            }
          }
        } catch (err) {
          console.error('[DemoScribe] Failed to parse Deepgram message:', err);
        }
      };

      // 6. Forward PCM from worklet to Deepgram
      workletNode.port.onmessage = (event) => {
        if (dgWs.readyState === WebSocket.OPEN) {
          dgWs.send(event.data);
        }
      };

      // 7. KeepAlive ping every 5s
      keepAliveRef.current = setInterval(() => {
        if (dgWs.readyState === WebSocket.OPEN) {
          dgWs.send(JSON.stringify({ type: 'KeepAlive' }));
        }
      }, 5000);

      setState({
        isActive: true,
        sessionId,
        patientId,
        patientName,
        segments: [],
        interimSegment: null,
        connected: false, // will be set true by dgWs.onopen
        stopped: false,
        error: null,
      });

      return sessionId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[DemoScribe] Start failed:', message);
      setState(prev => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  const stopSession = useCallback(async () => {
    // Clean up keepalive
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    // Stop worklet and disconnect audio
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    // Stop mic tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close Deepgram WebSocket
    if (deepgramWsRef.current) {
      if (deepgramWsRef.current.readyState === WebSocket.OPEN) {
        deepgramWsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
        deepgramWsRef.current.close();
      }
      deepgramWsRef.current = null;
    }

    // Post segments to backend
    const currentSessionId = state.sessionId;
    const finalSegments = segmentsRef.current;

    if (currentSessionId) {
      try {
        const fullTranscript = finalSegments
          .map(s => `[${s.speaker}] ${s.text}`)
          .join('\n');

        await fetch(`/api/transcription/${currentSessionId}/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segments: finalSegments,
            full_transcript: fullTranscript,
          }),
        });
        console.log(`[DemoScribe] Session ${currentSessionId} stopped, ${finalSegments.length} segments saved`);
      } catch (err) {
        console.error('[DemoScribe] Failed to save transcript:', err);
      }
    }

    setState(prev => ({
      ...prev,
      isActive: true, // keep panel open for "Generate Note"
      connected: false,
      stopped: true,
      interimSegment: null,
    }));
  }, [state.sessionId]);

  const closePanel = useCallback(() => {
    segmentsRef.current = [];
    setState({
      isActive: false,
      sessionId: null,
      patientId: null,
      patientName: null,
      segments: [],
      interimSegment: null,
      connected: false,
      stopped: false,
      error: null,
    });
  }, []);

  const loadDemoSegments = useCallback(async () => {
    segmentsRef.current = DEMO_SEGMENTS;
    setState(prev => ({ ...prev, segments: DEMO_SEGMENTS }));
    await stopSession();
  }, [stopSession]);

  return {
    ...state,
    startSession,
    stopSession,
    closePanel,
    loadDemoSegments,
  };
}
