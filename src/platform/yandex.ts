import type { RewardedPlacement, RewardedProvider } from '../core/advertising';
import type { CloudPlayer } from './cloud';
import { portalLocale, setLocale } from '../i18n';
// Local development can run without the SDK; release builds load the host SDK.
interface Advertising {
  showFullscreenAdv(options: { callbacks: { onOpen?: () => void; onClose?: (wasShown: boolean) => void; onError?: () => void } }): void;
  showRewardedVideo(options: { callbacks: { onOpen: () => void; onRewarded: () => void; onClose: () => void; onError: () => void } }): void;
}
interface YandexSdk {
  getPlayer?(): Promise<CloudPlayer>;
  adv: Advertising;
  environment: { i18n: { lang: string } };
  features: { LoadingAPI?: { ready(): void }; GameplayAPI?: { start(): void; stop(): void } };
  on(event: 'game_api_pause' | 'game_api_resume', callback: () => void): void;
}
interface YandexGlobal { init(): Promise<YandexSdk>; }

export class YandexAdapter implements RewardedProvider {
  private sdk: YandexSdk | null = null;
  private gameReady = false;
  private readySent = false;
  private gameplay = false;
  private gameplaySent = false;
  private adBusy = false;
  private language: string | null = null;
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
      this.language = this.sdk.environment.i18n.lang;
      setLocale(portalLocale(this.language));
      this.sdk.on('game_api_pause', () => this.onExternalPause(true, 'platform'));
      this.sdk.on('game_api_resume', () => this.onExternalPause(false, 'platform'));
      this.notifyReady();
      this.syncGameplay();
      return true;
    }
    catch { this.sdk = null; return false; }
  }

  markGameReady(): void { this.gameReady = true; this.notifyReady(); }
  getLanguage(): string | null { return this.language; }
  setGameplay(active: boolean): void { this.gameplay = active; this.syncGameplay(); }
  async getCloudPlayer(): Promise<CloudPlayer | null> {
    try { return await this.sdk?.getPlayer?.() ?? null; } catch { return null; }
  }

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
    if (!this.sdk || this.adBusy || !['reward', 'victory', 'defeat'].includes(phase)) return false;
    this.adBusy = true;
    this.onExternalPause(true, 'advertisement');
    return await new Promise(resolve => {
      let finished = false;
      const finish = (shown: boolean) => {
        if (finished) return;
        finished = true;
        this.adBusy = false;
        this.onExternalPause(false, 'advertisement');
        resolve(shown);
      };
      try {
        this.sdk!.adv.showFullscreenAdv({ callbacks: {
          onOpen: () => { if (!finished) this.onExternalPause(true, 'advertisement'); },
          onClose: wasShown => finish(wasShown),
          onError: () => finish(false)
        } });
      } catch { finish(false); }
    });
  }

  async showRewardedAd(placement: RewardedPlacement, onRewarded: () => void): Promise<boolean> {
    if (!this.sdk?.adv.showRewardedVideo || this.adBusy
      || !['battle-gold-double', 'battle-speed-double'].includes(placement)) return false;
    this.adBusy = true;
    this.onExternalPause(true, 'advertisement');
    return new Promise(resolve => {
      let finished = false, rewarded = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        this.adBusy = false;
        this.onExternalPause(false, 'advertisement');
        resolve(rewarded);
      };
      try {
        this.sdk!.adv.showRewardedVideo({ callbacks: {
          onOpen: () => { if (!finished) this.onExternalPause(true, 'advertisement'); },
          onRewarded: () => {
            if (finished || rewarded) return;
            rewarded = true;
            onRewarded();
          },
          onClose: finish,
          onError: finish
        } });
      } catch { finish(); }
    });
  }
}
