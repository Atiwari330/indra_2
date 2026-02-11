/**
 * Indra Scribe — Popup Script
 *
 * Shows recording status, timer, and stop button.
 * Recording is initiated from the Indra web app, not from the popup.
 */

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const timerEl = document.getElementById('timer');
const controlsEl = document.getElementById('controls');
const errorMsg = document.getElementById('error-msg');

let timerInterval = null;
let startTime = null;

// Check current status on popup open
chrome.runtime.sendMessage({ type: 'get-status' }, (state) => {
  if (chrome.runtime.lastError) {
    showError('Cannot connect to extension background');
    return;
  }
  updateUI(state);
});

function updateUI(state) {
  if (state.recording) {
    statusDot.className = 'status-indicator recording';
    statusText.textContent = `Recording session ${state.sessionId?.slice(0, 8)}...`;
    timerEl.style.display = 'block';

    controlsEl.innerHTML = `
      <button class="btn-danger" id="btn-stop">Stop Recording</button>
    `;
    document.getElementById('btn-stop').addEventListener('click', handleStop);

    // Start timer from storage or now
    chrome.storage.local.get('recordingStartTime', (data) => {
      startTime = data.recordingStartTime || Date.now();
      startTimer();
    });
  } else {
    statusDot.className = 'status-indicator';
    statusText.textContent = 'Not recording';
    timerEl.style.display = 'none';
    controlsEl.innerHTML = `
      <button class="btn-secondary" id="btn-start" disabled>
        Waiting for Indra...
      </button>
    `;
    stopTimer();
  }
}

function handleStop() {
  const btn = document.getElementById('btn-stop');
  btn.disabled = true;
  btn.textContent = 'Stopping...';

  chrome.runtime.sendMessage({ type: 'stop-recording' }, (response) => {
    if (chrome.runtime.lastError || response?.error) {
      showError(response?.error || chrome.runtime.lastError.message);
      btn.disabled = false;
      btn.textContent = 'Stop Recording';
      return;
    }

    chrome.storage.local.remove('recordingStartTime');
    updateUI({ recording: false });
  });
}

function startTimer() {
  stopTimer();
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  timerEl.textContent = `${mins}:${secs}`;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  setTimeout(() => { errorMsg.style.display = 'none'; }, 5000);
}
