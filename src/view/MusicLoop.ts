export type MusicLoader = (context: AudioContext, signal: AbortSignal) => Promise<AudioBuffer>;
const LOOP_SECONDS = 64; // 32 bars at120 BPM; source: assets/audio/arena-theme.json.
/** Lossy codecs can alter edge samples. A 4ms edge taper prevents a click on wrap. */
export function softenLoopBoundary(buffer: AudioBuffer) {
  const edge = Math.min(Math.floor(buffer.sampleRate * .004), Math.floor(buffer.length / 4));
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < edge; i++) {
      const gain = Math.sin(i / edge * Math.PI / 2);
      samples[i] *= gain; samples[samples.length - 1 - i] *= gain;
    }
  }
  return buffer;
}
export const loadArenaTheme: MusicLoader = async (context, signal) => {
  for (const format of ['ogg', 'mp3']) {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}assets/audio/arena-theme.${format}`, { signal, cache: 'force-cache', credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Music HTTP ${response.status}`);
      return softenLoopBoundary(await context.decodeAudioData(await response.arrayBuffer()));
    } catch (error) { if (signal.aborted) throw error; }
  }
  throw new Error('Music unavailable: both local formats failed');
};

/** One decoded, bounded loop. Pauses preserve position and never launch a pending ad-paused load. */
export class MusicLoop {
  private buffer?: AudioBuffer;
  private source?: AudioBufferSourceNode;
  private gain: GainNode;
  private loading = false;
  private failed = false;
  private disposed = false;
  private position = 0;
  private startedAt = 0;
  private abort?: AbortController;
  constructor(private context: AudioContext, destination: AudioNode, private allowed: () => boolean, private loader: MusicLoader = loadArenaTheme) {
    this.gain = context.createGain(); this.gain.connect(destination);
  }
  play(retry = false) {
    if (retry) this.failed = false;
    if (this.disposed || !this.allowed() || this.source || this.failed || this.loading) return;
    if (!this.buffer) {
      this.loading = true; this.abort = new AbortController();
      const timeout = setTimeout(() => this.abort?.abort(), 10000);
      void this.loader(this.context, this.abort.signal).then(buffer => {
        if (!this.disposed && !this.abort?.signal.aborted) this.buffer = buffer;
      }).catch(() => { this.failed = true; }).finally(() => {
        clearTimeout(timeout); this.loading = false;
        if (!this.disposed && this.buffer && this.allowed()) this.play();
      });
      return;
    }
    const source = this.context.createBufferSource(); source.buffer = this.buffer; source.loop = true; source.loopStart = 0; source.loopEnd = Math.min(LOOP_SECONDS, this.buffer.duration);
    const time = this.context.currentTime;
    this.gain.gain.cancelScheduledValues(time); this.gain.gain.setValueAtTime(0, time); this.gain.gain.linearRampToValueAtTime(.32, time + .75);
    source.connect(this.gain); this.source = source; this.startedAt = time; source.start(time, this.position % source.loopEnd);
  }
  pause() {
    if (!this.source) return;
    this.position = (this.position + Math.max(0, this.context.currentTime - this.startedAt)) % this.source.loopEnd;
    this.source.stop(); this.source.disconnect(); this.source = undefined;
  }
  destroy() { this.disposed = true; this.abort?.abort(); this.pause(); this.gain.disconnect(); }
}
