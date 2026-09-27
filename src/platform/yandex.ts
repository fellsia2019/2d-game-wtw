// The browser game works without this SDK. The host may inject YaGames before startup.
interface Advertising {
  showFullscreenAdv(options: { callbacks: { onOpen?: () => void; onClose?: () => void; onError?: () => void } }): void;
}
interface YandexSdk { adv: Advertising; }
interface YandexGlobal { init(): Promise<YandexSdk>; }

export class YandexAdapter {
  private sdk: YandexSdk | null = null;
  constructor(private onExternalPause: (paused: boolean) => void) {}

  async initialize(): Promise<boolean> {
    const global = (window as Window & { YaGames?: YandexGlobal }).YaGames;
    if (!global) return false;
    try { this.sdk = await global.init(); return true; }
    catch { this.sdk = null; return false; }
  }

  async showIntermissionAd(phase: 'reward' | 'victory' | 'defeat'): Promise<boolean> {
    if (!this.sdk || !['reward', 'victory', 'defeat'].includes(phase)) return false;
    this.onExternalPause(true);
    return await new Promise(resolve => {
      let finished = false;
      const watchdog = window.setTimeout(() => finish(false), 120_000);
      const finish = (shown: boolean) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(watchdog);
        this.onExternalPause(false);
        resolve(shown);
      };
      try {
        this.sdk!.adv.showFullscreenAdv({ callbacks: {
          onOpen: () => this.onExternalPause(true),
          onClose: () => finish(true),
          onError: () => finish(false)
        } });
      } catch { finish(false); }
    });
  }
}
