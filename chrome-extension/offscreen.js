/**
 * Indra Scribe — Offscreen Document
 *
 * Runs in an offscreen document context with access to Web Audio APIs.
 * Captures both tab audio (patient) and microphone (clinician),
 * merges them into a 2-channel stereo stream, converts to 16-bit PCM
 * via AudioWorklet, and sends over WebSocket to the Indra backend.
 */

let audioContext = null;
let websocket = null;
let micStream = null;
let tabStream = null;
let workletNode = null;
let keepAliveInterval = null;

// Notify service worker we're ready
chrome.runtime.sendMessage({ type: 'offscreen-ready' });

// ── Message Handler ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'start-capture':
      startCapture(message)
        .then(() => sendResponse({ status: 'capturing' }))
        .catch(err => {
          console.error('[Indra Scribe] Capture failed:', err);
          sendResponse({ error: err.message });
          chrome.runtime.sendMessage({ type: 'offscreen-error', error: err.message });
        });
      return true;

    case 'stop-capture':
      stopCapture();
      sendResponse({ status: 'stopped' });
      break;

    default:
      break;
  }
});

// ── Capture Logic ───────────────────────────────────────────────

async function startCapture({ streamId, wsUrl, sessionId }) {
  console.log(`[Indra Scribe] Starting capture for session ${sessionId}`);

  // 1. Get tab audio stream using the stream ID from tabCapture
  console.log('[Indra Scribe] Redeeming tab capture stream ID...');
  tabStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    },
  });
  console.log('[Indra Scribe] Tab audio stream acquired');

  // Route tab audio to speakers so clinician can still hear
  const tabAudioEl = document.getElementById('tab-audio');
  if (tabAudioEl) {
    tabAudioEl.srcObject = tabStream;
    console.log('[Indra Scribe] Tab audio routed to speakers');
  }

  // 2. Get microphone stream
  console.log('[Indra Scribe] Requesting microphone access...');
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    console.log('[Indra Scribe] Microphone stream acquired');
  } catch (err) {
    console.error('[Indra Scribe] ERROR: Microphone access denied:', err.message);
    throw new Error('Microphone permission required for transcription');
  }

  // 3. Set up AudioContext and merge streams
  audioContext = new AudioContext({ sampleRate: 48000 });
  console.log(`[Indra Scribe] AudioContext created, sample rate: ${audioContext.sampleRate}`);

  const micSource = audioContext.createMediaStreamSource(micStream);
  const tabSource = audioContext.createMediaStreamSource(tabStream);

  // Create a ChannelMergerNode: 2 inputs → 1 stereo output
  // Channel 0 = clinician mic, Channel 1 = tab/patient audio
  const merger = audioContext.createChannelMerger(2);
  micSource.connect(merger, 0, 0);  // mic → channel 0
  tabSource.connect(merger, 0, 1);  // tab → channel 1

  // 4. Load AudioWorklet for PCM conversion
  await audioContext.audioWorklet.addModule('pcm-processor.js');
  workletNode = new AudioWorkletNode(audioContext, 'pcm-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 0,
    channelCount: 2,
  });

  merger.connect(workletNode);

  // 5. Connect WebSocket to backend
  console.log(`[Indra Scribe] Connecting WebSocket to ${wsUrl}`);
  websocket = new WebSocket(wsUrl);

  websocket.onopen = () => {
    console.log('[Indra Scribe] WebSocket connected to backend');
  };

  websocket.onclose = (event) => {
    console.log(`[Indra Scribe] WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
  };

  websocket.onerror = (event) => {
    console.error('[Indra Scribe] WebSocket error:', event);
  };

  websocket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log('[Indra Scribe] WS message from backend:', msg);
    } catch {
      // Binary or unparseable
    }
  };

  // 6. Forward PCM chunks from AudioWorklet to WebSocket
  workletNode.port.onmessage = (event) => {
    if (websocket?.readyState === WebSocket.OPEN) {
      websocket.send(event.data);
    }
  };

  // 7. KeepAlive pings every 5 seconds
  keepAliveInterval = setInterval(() => {
    if (websocket?.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ type: 'KeepAlive' }));
    }
  }, 5000);

  console.log(`[Indra Scribe] Capture pipeline active for session ${sessionId}`);
}

function stopCapture() {
  console.log('[Indra Scribe] Stopping capture');

  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }

  if (workletNode) {
    workletNode.disconnect();
    workletNode = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }

  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }

  if (tabStream) {
    tabStream.getTracks().forEach(t => t.stop());
    tabStream = null;
  }

  if (websocket) {
    websocket.close(1000, 'Session ended');
    websocket = null;
  }

  const tabAudioEl = document.getElementById('tab-audio');
  if (tabAudioEl) {
    tabAudioEl.srcObject = null;
  }

  console.log('[Indra Scribe] Capture stopped, all resources released');
}
