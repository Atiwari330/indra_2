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
    text: "Hi John, welcome back. It's good to see you again. How has your week been since our intake session?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Hey, Sarah. Honestly, I've been thinking a lot about what we talked about last time. Just putting words to everything made it feel more real, you know? It was a lot, but I think it helped.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "I'm glad to hear that. Sometimes just naming what's going on can bring some relief. So tell me — how has the anxiety been this past week? Anything come up at work?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Yeah, actually. We had a team standup on Wednesday and my manager asked me to present the project timeline in front of everyone. I could feel my heart start racing, the sweaty palms — the whole thing. I kept thinking everyone could see how nervous I was and that they were judging me.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That sounds like a really activating situation. You mentioned last time that the imposter feelings get worse in meetings. What happened after the presentation?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Here's the thing — it actually went fine. My manager said good job afterward. But in the moment I was convinced I was going to freeze up and look incompetent. And then for the rest of the day I kept replaying it in my head, picking apart everything I said.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "So the reality didn't match the catastrophic prediction. That's actually a really important observation. Last session I asked you to start noticing when those anxious thoughts come up. It sounds like you did exactly that — you caught the thought that you'd freeze up and look incompetent. Were you aware of it in the moment?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Kind of. Like, while it was happening I was just anxious. But afterward I realized — oh, that's the catastrophizing thing Sarah was talking about. I predicted disaster and it didn't happen. So I guess I'm noticing it, just not in real time yet.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That's a great start. Noticing it after the fact is the first step — real-time awareness comes with practice. Let's check in on sleep. How has that been?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Still not great. I'm getting maybe five or six hours most nights. I tried putting my phone in the other room like you suggested, and it worked the first two nights — I fell asleep faster. But then Thursday I was stressed about that presentation and I grabbed it back to check emails. Once I start scrolling, it's over.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "So the phone boundary worked when stress was lower, but broke down under pressure. That's useful information. How about your mood and energy overall this week?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Mostly low. I had one good day — Saturday I actually went outside and walked around the park for a while. It was nice. But Sunday I was back on the couch, didn't do much of anything. I thought about texting my buddy Marcus to shoot hoops but I just... didn't.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "The park walk on Saturday is worth noting though. Even on a small scale, getting outside and moving can shift things. What made Saturday different?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Keisha suggested it. She said let's just get out of the apartment. I didn't want to go but she kind of dragged me, and once I was out there I felt better. She's been really supportive since I told her about coming here. She said she's proud of me, which was nice. But I've still been snapping at her over little things — like she'll ask me a question while I'm working and I just get irritated. I feel bad about it.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "It sounds like Keisha is a real source of support. The irritability you're describing is really common with anxiety and depression — it doesn't mean you're a bad partner, it means your system is overloaded. We can work on that. Now, let me ask about the drinking. Last time you mentioned having a drink most evenings after work to take the edge off.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Yeah, so I actually cut back a little this week. I think talking about it last session made me more aware of it. I had maybe two or three beers the whole week instead of one every night. And I noticed something — the nights I didn't drink, I actually slept a little better. Not great, but better.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "That's a really insightful connection. Alcohol does disrupt sleep architecture even in small amounts. The fact that you noticed that on your own is great. And speaking of — did you follow up on the psychiatry referral we discussed? I know we talked about a medication evaluation.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "I haven't called yet. I keep meaning to but then I talk myself out of it. Part of me is worried about side effects. And honestly, part of me feels like I should be able to handle this without medication. I know that's probably not rational.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Those are really common feelings. Medication is a tool, not a crutch — and given your family history, there may be a biological component that therapy alone can't fully address. But there's no pressure. How about this — would you be willing to just schedule the consultation? You can decide after talking to the psychiatrist whether to start anything.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "Yeah, that's fair. I can at least make the appointment. No commitment to actually taking anything.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Exactly. Now, I want to do a quick safety check — same thing I'll ask every session. Have you had any thoughts of hurting yourself or not wanting to be alive?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "No, nothing like that. I still have the 'what's the point' feeling sometimes, like when I'm lying awake at night. But it's more frustration than anything. I'm not thinking about hurting myself.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Good, thank you for being open about that. That distinction between frustration and hopelessness is important, and it sounds like you're clear on it. Okay, so for today I want to introduce a concrete tool — a thought record. It's a structured way to catch those anxious thoughts, examine the evidence, and come up with a more balanced perspective. Like with the presentation — your thought was 'I'm going to freeze up and look incompetent,' but the evidence showed your manager said good job. The thought record helps you do that process on paper.",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "That makes sense. So I'd write down the anxious thought and then kind of argue against it?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'clinician',
    text: "Exactly — not to dismiss the feeling, but to test whether the thought is accurate. For homework this week, I'd like you to try filling out a thought record at least twice when you notice anxiety spiking. Keep the phone boundary going for sleep — and try to make that psychiatry appointment. We'll review everything next session. How does that sound?",
    is_final: true,
    timestamp: new Date().toISOString(),
  },
  {
    speaker: 'patient',
    text: "I can do that. Two thought records, phone out of the room, call the psychiatrist. I'll write it down so I don't forget. Thanks, Sarah — this is actually helping more than I expected.",
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
