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
    text: "Good afternoon, John. Come on in, have a seat. How have you been since our last session two weeks ago?",
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
    text: "That's actually real progress, John. Using the thought record even once when you're under pressure is significant. Let's talk about what happened Thursday. How were you sleeping that week?",
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

const DEMO_INTAKE_SEGMENTS: TranscriptSegment[] = [
  {
    speaker: 'clinician',
    text: "Hi John, I'm Sarah Chen. Welcome. I know filling out all that paperwork isn't the most fun, so I appreciate your patience. Before we dive in, how are you feeling about being here today?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Honestly, a little nervous. I've never done therapy before. But things have gotten to a point where I know I need to talk to someone.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That takes courage, and I'm glad you're here. Can you tell me what's been going on that brought you in?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "It's mainly anxiety and feeling down. The anxiety has been there for a while — maybe a year or so — but the last three months it's gotten really bad. I'm constantly worried about work, about money, about whether people think I'm doing a good job. And then the depression kind of crept in on top of that.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That sounds really overwhelming. When you say the anxiety got worse three months ago, did something change around that time?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Yeah, I got promoted at work. Which sounds like it should be a good thing, right? But now I'm managing a team and I have no idea what I'm doing. I keep thinking they're going to figure out I'm not qualified and fire me.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "So the increased responsibility triggered a lot of self-doubt. How is the anxiety showing up day to day? Are there physical symptoms?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Definitely. My heart races, especially before meetings. I get tension headaches almost every day. My stomach is a mess — I've lost about ten pounds in the last two months because I can't eat when I'm stressed. And I'm not sleeping well. I lie awake running through everything that could go wrong the next day.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "And the low mood — can you describe what that's like for you?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "It's like... I used to enjoy things. I used to play basketball on weekends, hang out with friends, play video games. Now I just come home and sit on the couch. I don't have the energy for anything. Some days I feel like what's the point of even trying.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "When you say 'what's the point,' I want to ask directly — have you had any thoughts of hurting yourself or not wanting to be alive?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "No, not like that. I've never thought about hurting myself. It's more like... I just feel stuck and hopeless sometimes. But I want to get better — that's why I'm here.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Thank you for being honest about that. I'm glad you're not having those thoughts, and I'm glad you're taking this step. Have you ever seen a therapist or psychiatrist before?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "No, this is my first time. I thought about it in college when I was stressed about exams, but I never went through with it. No medications either.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Got it. And have you ever been hospitalized for any psychiatric reasons?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "No, nothing like that.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Let me ask about your family. Any history of mental health conditions — depression, anxiety, bipolar, substance use?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "My mom has been on antidepressants for as long as I can remember. She was diagnosed with major depression in her thirties. My dad — I don't think he was ever diagnosed with anything, but he definitely self-medicates with alcohol. My older sister has anxiety too, she takes something for it.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That's helpful to know — there's a clear family pattern there. Tell me about your living situation. Are you married, do you have roommates?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "I live with my girlfriend, Keisha. We've been together three years. She's actually the one who pushed me to come here. She says I've changed — that I'm irritable and distant. I know she's right.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "It sounds like she's a good support. What about substance use — alcohol, marijuana, anything else?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "I drink socially, maybe two or three beers on a weekend. Lately I've been having a drink after work to take the edge off, so maybe four or five nights a week. No marijuana or anything else.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That increase in drinking is something we should keep an eye on. It's common to reach for alcohol when anxiety is high, but it can actually make both the anxiety and depression worse over time. Are you taking any medications at all currently?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Just ibuprofen for the headaches. Nothing prescribed.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Okay. Based on everything you've shared, it sounds like you're dealing with generalized anxiety that's gotten significantly worse with the work transition, along with a depressive episode. I'd like to start meeting weekly. I think cognitive behavioral therapy would be a really good fit — it's evidence-based for both anxiety and depression, and it focuses on the kinds of thought patterns you described, like the imposter feelings and catastrophizing.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "That sounds good. Weekly works for me. I just want to feel like myself again.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That's a great goal, and I think we can get you there. I'm also going to recommend a psychiatry referral for a medication evaluation — given the severity of your symptoms and the family history, a combination of therapy and medication tends to have the best outcomes. How do you feel about that?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "I'm open to it. If my mom's medication helps her, maybe it'll help me too. I just want to make sure it won't make me feel like a zombie or anything.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That's a valid concern, and a good thing to discuss with the psychiatrist. The newer medications are generally well-tolerated. I'll put in that referral and we'll get you scheduled. For now, before our next session, I'd like you to start noticing when those anxious thoughts come up — don't try to change them yet, just notice them. We'll work on the tools next time.",
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

  const loadDemoSegments = useCallback(async (type?: 'progress' | 'intake') => {
    const segments = type === 'intake' ? DEMO_INTAKE_SEGMENTS : DEMO_SEGMENTS;
    segmentsRef.current = segments;
    setState(prev => ({ ...prev, segments }));
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
