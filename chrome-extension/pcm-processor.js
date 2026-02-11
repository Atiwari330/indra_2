/**
 * AudioWorklet Processor for Indra Scribe
 *
 * Takes 2-channel input (channel 0 = clinician mic, channel 1 = tab/patient audio)
 * and converts Float32 samples to interleaved 16-bit PCM at the current sample rate.
 *
 * Downsampling from 48kHz → 16kHz is handled here with a simple decimation approach.
 */

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 0;
    // Buffer ~200ms of 16kHz stereo 16-bit PCM = 200 * 16 * 2 * 2 = 12800 bytes
    this._buffer = new Int16Array(6400); // 6400 samples = 3200 per channel
    this._targetRate = 16000;
    this._ratio = sampleRate / this._targetRate;
    this._accumulator = 0;

    console.log(`[PCM Processor] Initialized. Source rate: ${sampleRate}, target: ${this._targetRate}, ratio: ${this._ratio}`);
  }

  process(inputs, outputs) {
    const input = inputs[0];
    if (!input || input.length < 2) return true;

    const ch0 = input[0]; // clinician mic
    const ch1 = input[1]; // tab/patient audio

    if (!ch0 || !ch1) return true;

    for (let i = 0; i < ch0.length; i++) {
      this._accumulator += 1;

      if (this._accumulator >= this._ratio) {
        this._accumulator -= this._ratio;

        // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
        const s0 = Math.max(-1, Math.min(1, ch0[i]));
        const s1 = Math.max(-1, Math.min(1, ch1[i]));

        // Interleaved: [ch0_sample, ch1_sample, ch0_sample, ch1_sample, ...]
        this._buffer[this._bufferSize++] = s0 < 0 ? s0 * 0x8000 : s0 * 0x7FFF;
        this._buffer[this._bufferSize++] = s1 < 0 ? s1 * 0x8000 : s1 * 0x7FFF;

        // When buffer is full, send it
        if (this._bufferSize >= this._buffer.length) {
          this.port.postMessage(
            this._buffer.buffer.slice(0),
            [/* no transferables since we slice */]
          );
          this._bufferSize = 0;
        }
      }
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
