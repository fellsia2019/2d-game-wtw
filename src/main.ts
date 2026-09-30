import { GameDirector } from './core/GameDirector';
import { SaveService } from './core/save';
import { YandexAdapter } from './platform/yandex';
import { mountGame } from './view/mountGame';
import { bounded, CloudProfileStorage, chooseCloudProfile } from './platform/cloud';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app');

async function boot(root: HTMLElement): Promise<void> {
root.innerHTML = '<div class="scrim"><section class="modal" role="status">Загрузка игры и сохранения…</section></div>';
let storage: Storage | null = null;
try { storage = window.localStorage; } catch { /* private mode */ }
let app: GameDirector | null = null;
const pendingPauses = new Map<string, boolean>();
const platform = new YandexAdapter((paused, source) => {
  if (app) app.setExternalPause(paused, source); else pendingPauses.set(source, paused);
});
let available = false;
try { available = await bounded(platform.initialize()); } catch { /* SDK unavailable */ }
let player = null;
if (available) { try { player = await bounded(platform.getCloudPlayer()); } catch { /* local fallback */ } }
const profile = await CloudProfileStorage.open(storage, player, (local, remote) => {
  // The save-choice dialog is the first interactive game UI in this path.
  platform.markGameReady();
  return chooseCloudProfile(root, local, remote);
});
const director = new GameDirector(new SaveService(profile));
app = director;
for (const [source, paused] of pendingPauses) director.setExternalPause(paused, source);
director.setRewardedProvider(platform);
director.setPlatformStatus({ sdk: available ? 'available' : 'unavailable' });
profile.onStatus(cloud => director.setPlatformStatus({ cloud }));
director.subscribe(state => platform.setGameplay(state.phase === 'battle' && !state.paused));
mountGame(root, director, () => platform.markGameReady());
const network = () => { director.setPlatformStatus({ online: navigator.onLine }); if (navigator.onLine) void profile.flush(); };
window.addEventListener('online', network);
window.addEventListener('offline', network);
network();

const visibility = () => director.setExternalPause(document.hidden, 'visibility');
document.addEventListener('visibilitychange', visibility);
visibility();

let last = performance.now();
let accumulator = 0;
function loop(now: number): void {
  const delta = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  const state = director.getState();
  if (state.phase === 'battle' && !state.paused) {
    accumulator += delta * state.battleSpeed;
    while (accumulator >= director.fixedStep()) { director.tick(); accumulator -= director.fixedStep(); }
  } else accumulator = 0;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('pagehide', () => { director.setExternalPause(true, 'pagehide'); void profile.flush(); });
window.addEventListener('pageshow', () => {
  last = performance.now(); accumulator = 0;
  director.setExternalPause(false, 'pagehide'); visibility();
});
}
void boot(root);
