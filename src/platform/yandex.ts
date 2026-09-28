// Local development can run without the SDK; release builds load the host SDK.
interface Advertising {
  showFullscreenAdv(options: { callbacks: { onOpen?: () => void; onClose?: (wasShown: boolean) => void; onError?: () => void } }): void;
}
interface YandexSdk {
  adv: Advertising;
  environment: { i18n: { lang: string } };
  features: { LoadingAPI?: { ready(): void }; GameplayAPI?: { start(): void; stop(): void } };
  on(event: 'game_api_pause' | 'game_api_resume', callback: () => void): void;
}
interface YandexGlobal { init(): Promise<YandexSdk>; }

export class YandexAdapter {
  private sdk: YandexSdk | null = null;
  private gameReady = false;
  private readySent = false;
  private gameplay = false;
  private gameplaySent = false;
  constructor(private onExternalPause: (paused: boolean, source: 'platform' | 'advertisement') => void) {}

  async initialize(): Promise<boolean> {
    try {
      let global = (window as Window & { YaGames?: YandexGlobal }).YaGames;
      if (!global && import.meta.env.PROD) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = '/sdk.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Yandex SDK unavailable'));
          document.head.append(script);
        });
        global = (window as Window & { YaGames?: YandexGlobal }).YaGames;
      }
      if (!global) return false;
      this.sdk = await global.init();
      // This release supports RU only; unsupported portal languages use RU.
      const language = this.sdk.environment.i18n.lang;
      document.documentElement.lang = language === 'ru' ? language : 'ru';
      this.sdk.on('game_api_pause', () => this.onExternalPause(true, 'platform'));
      this.sdk.on('game_api_resume', () => this.onExternalPause(false, 'platform'));
      this.notifyReady();
      this.syncGameplay();
      return true;
    }
    catch { this.sdk = null; return false; }
  }

  markGameReady(): void { this.gameReady = true; this.notifyReady(); }
  setGameplay(active: boolean): void { this.gameplay = active; this.syncGameplay(); }

  private notifyReady(): void {
    if (!this.sdk || !this.gameReady || this.readySent) return;
    this.sdk.features.LoadingAPI?.ready();
    this.readySent = true;
  }

  private syncGameplay(): void {
    if (!this.sdk || this.gameplay === this.gameplaySent) return;
    if (this.gameplay) this.sdk.features.GameplayAPI?.start();
    else this.sdk.features.GameplayAPI?.stop();
    this.gameplaySent = this.gameplay;
  }

  async showIntermissionAd(phase: 'reward' | 'victory' | 'defeat'): Promise<boolean> {
    if (!this.sdk || !['reward', 'victory', 'defeat'].includes(phase)) return false;
    this.onExternalPause(true, 'advertisement');
    return await new Promise(resolve => {
      let finished = false;
      const watchdog = window.setTimeout(() => finish(false), 120_000);
      const finish = (shown: boolean) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(watchdog);
        this.onExternalPause(false, 'advertisement');
        resolve(shown);
      };
      try {
        this.sdk!.adv.showFullscreenAdv({ callbacks: {
          onOpen: () => this.onExternalPause(true, 'advertisement'),
          onClose: wasShown => finish(wasShown),
          onError: () => finish(false)
        } });
      } catch { finish(false); }
    });
  }
}
