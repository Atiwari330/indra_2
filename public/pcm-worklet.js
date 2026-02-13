/**
 * AudioWorklet Processor for Indra Demo Scribe (Browser-native)
 *
 * Takes single-channel mic input from getUserMedia and converts
 * Float32 samples to mono 16-bit PCM at 16kHz.
 *
 * Downsampling from browser sample rate (typically 48kHz) → 16kHz
 * uses accumulator-based decimation (same pattern as chrome-extension/pcm-processor.js).
 */

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 0;
    // Buffer ~200ms of 16kHz mono 16-bit PCM = 200ms * 16 samples/ms = 3200 samples
    this._buffer = new Int16Array(3200);
    this._targetRate = 16000;
    this._ratio = sampleRate / this._targetRate;
    this._accumulator = 0;

    console.log(
      `[PCM Worklet] Initialized. Source rate: ${sampleRate}, target: ${this._targetRate}, ratio: ${this._ratio}`
    );
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const ch0 = input[0]; // mono mic channel
    if (!ch0) return true;

    for (let i = 0; i < ch0.length; i++) {
      this._accumulator += 1;

      if (this._accumulator >= this._ratio) {
        this._accumulator -= this._ratio;

        // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
        const s = Math.max(-1, Math.min(1, ch0[i]));
        this._buffer[this._bufferSize++] = s < 0 ? s * 0x8000 : s * 0x7fff;

        // When buffer is full (~200ms), send it
        if (this._bufferSize >= this._buffer.length) {
          this.port.postMessage(this._buffer.buffer.slice(0));
          this._bufferSize = 0;
        }
      }
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
