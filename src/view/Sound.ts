import type { BattleEvent, GameState } from '../core/types';
import { MusicLoop, type MusicLoader } from './MusicLoop';

export type SoundStatus = 'locked' | 'ready' | 'unavailable';
type SoundState = Pick<GameState, 'muted' | 'paused' | 'phase'> & Partial<Pick<GameState, 'musicMuted'>>;
interface SoundOptions {
  createContext?: () => AudioContext;
  isHidden?: () => boolean;
  loadMusic?: MusicLoader;
  onStatus?: (status: SoundStatus) => void;
}

/** Original synthesised effects and a local music loop. Audio starts in a user gesture. */
export class BattleSound {
  private context?: AudioContext;
  private master?: GainNode;
  private voices = new Set<OscillatorNode>();
  private state: SoundState = { muted: false, paused: false, phase: 'menu' };
  private focused = true;
  private disposed = false;
  private generation = 0;
  private lastEffect = -Infinity;
  private musicLoop?: MusicLoop;
  private pendingResume?: Promise<boolean>;
  status: SoundStatus = 'locked';
  constructor(private options: SoundOptions = {}) {}
  private allowed() { return !this.disposed && this.focused && (!this.state.muted || !this.musicMuted) && !this.state.paused && !(this.options.isHidden?.() ?? (typeof document !== 'undefined' && document.hidden)); }
  private get musicMuted() { return this.state.musicMuted ?? this.state.muted; }
  private musicAllowed() { return this.allowed() && !this.musicMuted; }
  private report(status: SoundStatus) { if (this.status !== status) { this.status = status; this.options.onStatus?.(status); } }
  async unlock(confirm = false): Promise<boolean> {
    if (!this.allowed()) return false;
    if (!this.context) {
      try {
        const host = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext };
        const Constructor = host.AudioContext ?? host.webkitAudioContext;
        this.context = this.options.createContext ? this.options.createContext() : new Constructor();
        this.master = this.context.createGain(); this.master.gain.value = .65; this.master.connect(this.context.destination);
        this.musicLoop = new MusicLoop(this.context, this.master, () => this.musicAllowed() && this.context?.state === 'running', this.options.loadMusic);
      } catch { this.report('unavailable'); return false; }
    }
    const generation = this.generation;
    // resume() is called synchronously before the first await, preserving gesture activation.
    const started = await this.resume();
    if (!started || generation !== this.generation || !this.allowed()) return false;
    this.report('ready');
    if (confirm) this.confirmation();
    if (this.musicAllowed()) this.musicLoop?.play(true);
    return true;
  }
  private resume(): Promise<boolean> {
    const ctx = this.context;
    if (!ctx) return Promise.resolve(false);
    if (ctx.state === 'running') return Promise.resolve(true);
    if (this.pendingResume) return this.pendingResume;
    try {
      this.pendingResume = ctx.resume().then(() => {
        if (!this.allowed()) { this.stop(); return false; }
        if (ctx.state !== 'running') { this.report('locked'); return false; }
        this.report('ready'); return true;
      }).catch(() => { this.report('locked'); return false; }).finally(() => { this.pendingResume = undefined; });
      return this.pendingResume;
    } catch { this.report('locked'); return Promise.resolve(false); }
  }
  sync(state: SoundState) {
    this.state = state;
    if (!this.allowed()) { this.stop(); return; }
    if (this.state.muted) this.stopVoices();
    if (this.musicMuted) this.musicLoop?.pause();
    if (this.context && this.status === 'ready') void this.resume().then(ok => { if (ok && this.musicAllowed()) this.musicLoop?.play(); });
  }
  setFocused(focused: boolean) { this.focused = focused; this.sync(this.state); }
  private stop() {
    this.generation++;
    this.musicLoop?.pause();
    this.stopVoices();
    if (this.context?.state === 'running') void this.context.suspend().catch(() => {});
  }
  private stopVoices() {
    for (const voice of this.voices) { try { voice.stop(); voice.disconnect(); } catch { /* Already ended. */ } }
    this.voices.clear();
  }
  private tone(frequency: number, end: number, duration: number, amplitude: number, type: OscillatorType = 'triangle', delay = 0) {
    const ctx = this.context;
    if (!ctx || this.state.muted || !this.allowed() || ctx.state !== 'running' || this.voices.size >= 8) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(), time = ctx.currentTime + delay;
    osc.type = type; osc.frequency.setValueAtTime(frequency, time); osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), time + duration);
    gain.gain.setValueAtTime(.0001, time); gain.gain.exponentialRampToValueAtTime(amplitude, time + .012); gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    osc.connect(gain); gain.connect(this.master!); this.voices.add(osc);
    osc.onended = () => { this.voices.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start(time); osc.stop(time + duration + .02);
  }
  private confirmation() {
    this.tone(523.25, 523.25, .18, .18, 'sine');
    this.tone(783.99, 783.99, .25, .16, 'sine', .12);
  }
  play(event: BattleEvent) {
    const ctx = this.context;
    if (!ctx || this.state.muted || !this.allowed() || ctx.state !== 'running') return;
    if (ctx.currentTime - this.lastEffect < .065 && !['result', 'boss-warning', 'boss-assault'].includes(event.type)) return;
    this.lastEffect = ctx.currentTime;
    switch (event.type) {
      case 'attack': this.tone(210, 65, .12, .18, 'triangle'); this.tone(950, 280, .055, .06, 'square'); break;
      case 'block': this.tone(840, 480, .16, .12, 'triangle'); this.tone(1280, 670, .11, .065, 'sine'); break;
      case 'heal': this.tone(659, 880, .25, .13, 'sine'); this.tone(988, 1175, .3, .09, 'sine', .1); break;
      case 'spawn': this.tone(294, 440, .16, .12); break;
      case 'fortress': this.tone(95, 35, .34, .18); this.tone(380, 80, .13, .1, 'sawtooth'); break;
      case 'death': this.tone(140, 45, .2, .065); break;
      case 'income': this.tone(660, 880, .12, .1, 'sine'); break;
      case 'result': [392, 494, 587].forEach((n, i) => this.tone(n, n, .6, .13, 'triangle', i * .14)); break;
      case 'boss-warning': [0, .23, .46].forEach(delay => this.tone(294, 220, .2, .15, 'triangle', delay)); break;
      case 'boss-assault': this.tone(147, 55, .65, .18, 'sawtooth'); this.tone(220, 110, .5, .1); break;
    }
  }
  destroy() { this.disposed = true; this.stop(); this.musicLoop?.destroy(); if (this.context) void this.context.close().catch(() => {}); }
}
