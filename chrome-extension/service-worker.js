/**
 * Indra Scribe — Chrome Extension Service Worker
 *
 * Handles:
 * 1. Messages from the Indra web app (via externally_connectable)
 * 2. Messages from the popup
 * 3. Creating/managing the offscreen document for audio capture
 * 4. Getting tabCapture stream IDs
 */

const OFFSCREEN_URL = 'offscreen.html';
let currentState = { recording: false, sessionId: null, tabId: null };

// ── External Messages (from Indra web app) ──────────────────────

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[Indra Scribe] External message:', message.type, 'from:', sender.url);

  switch (message.type) {
    case 'ping':
      sendResponse({ status: 'ok', version: chrome.runtime.getManifest().version });
      break;

    case 'start-recording':
      handleStartRecording(message, sender.tab?.id)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ error: err.message }));
      return true; // async response

    case 'stop-recording':
      handleStopRecording()
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'get-status':
      sendResponse(currentState);
      break;

    default:
      sendResponse({ error: `Unknown message type: ${message.type}` });
  }
});

// ── Internal Messages (from popup / offscreen) ──────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Indra Scribe] Internal message:', message.type);

  switch (message.type) {
    case 'start-recording':
      handleStartRecording(message)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'stop-recording':
      handleStopRecording()
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'get-status':
      sendResponse(currentState);
      break;

    case 'offscreen-ready':
      console.log('[Indra Scribe] Offscreen document ready');
      sendResponse({ ok: true });
      break;

    case 'offscreen-error':
      console.error('[Indra Scribe] Offscreen error:', message.error);
      currentState = { recording: false, sessionId: null, tabId: null };
      sendResponse({ ok: true });
      break;

    default:
      sendResponse({ error: `Unknown message type: ${message.type}` });
  }
});

// ── Recording Logic ─────────────────────────────────────────────

async function handleStartRecording(message, externalTabId) {
  if (currentState.recording) {
    return { error: 'Already recording', sessionId: currentState.sessionId };
  }

  const { wsUrl, sessionId } = message;
  if (!wsUrl || !sessionId) {
    throw new Error('Missing wsUrl or sessionId');
  }

  // Determine which tab to capture
  // If called from external (Indra web app), capture the telehealth tab (active tab)
  let targetTabId = externalTabId;
  if (!targetTabId && message.tabId) {
    targetTabId = message.tabId;
  }
  if (!targetTabId) {
    // Fall back to currently active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTabId = activeTab?.id;
  }

  if (!targetTabId) {
    throw new Error('No target tab found for capture');
  }

  console.log(`[Indra Scribe] Starting capture for tab ${targetTabId}, session ${sessionId}`);

  // Get a stream ID for the tab's audio
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId });
  console.log(`[Indra Scribe] Got stream ID: ${streamId.slice(0, 20)}...`);

  // Create offscreen document
  await ensureOffscreenDocument();

  // Tell the offscreen document to start capturing
  const response = await chrome.runtime.sendMessage({
    type: 'start-capture',
    streamId,
    wsUrl,
    sessionId,
    targetTabId,
  });

  if (response?.error) {
    throw new Error(response.error);
  }

  currentState = { recording: true, sessionId, tabId: targetTabId };
  console.log(`[Indra Scribe] Recording started for session ${sessionId}`);

  return { status: 'recording', sessionId };
}

async function handleStopRecording() {
  if (!currentState.recording) {
    return { status: 'not_recording' };
  }

  console.log(`[Indra Scribe] Stopping recording for session ${currentState.sessionId}`);

  // Tell offscreen document to stop
  try {
    await chrome.runtime.sendMessage({ type: 'stop-capture' });
  } catch (err) {
    console.warn('[Indra Scribe] Could not send stop-capture to offscreen:', err.message);
  }

  const sessionId = currentState.sessionId;
  currentState = { recording: false, sessionId: null, tabId: null };

  // Close offscreen document
  try {
    await chrome.offscreen.closeDocument();
  } catch {
    // May already be closed
  }

  console.log(`[Indra Scribe] Recording stopped for session ${sessionId}`);
  return { status: 'stopped', sessionId };
}

// ── Offscreen Document Management ───────────────────────────────

async function ensureOffscreenDocument() {
  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });

  if (existingContexts.length > 0) {
    console.log('[Indra Scribe] Offscreen document already exists');
    return;
  }

  console.log('[Indra Scribe] Creating offscreen document');
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['USER_MEDIA', 'AUDIO_PLAYBACK'],
    justification: 'Capture tab audio and microphone for telehealth transcription',
  });
}
