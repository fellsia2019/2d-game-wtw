import { GameDirector } from './core/GameDirector';
import { SaveService } from './core/save';
import { YandexAdapter } from './platform/yandex';
import { mountGame } from './view/mountGame';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app');

let storage: Storage | null = null;
try { storage = window.localStorage; } catch { /* private mode */ }
const app = new GameDirector(new SaveService(storage));
const platform = new YandexAdapter((paused, source) => app.setExternalPause(paused, source));
app.subscribe(state => platform.setGameplay(state.phase === 'battle' && !state.paused));
mountGame(root, app, () => platform.markGameReady());
void platform.initialize().then(available => app.setPlatformStatus({ sdk: available ? 'available' : 'unavailable' }));
const network = () => app.setPlatformStatus({ online: navigator.onLine });
window.addEventListener('online', network);
window.addEventListener('offline', network);
network();

const visibility = () => app.setExternalPause(document.hidden, 'visibility');
document.addEventListener('visibilitychange', visibility);
visibility();

let last = performance.now();
let accumulator = 0;
function loop(now: number): void {
  const delta = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  if (app.getState().phase === 'battle' && !app.getState().paused) {
    accumulator += delta * app.getState().battleSpeed;
    while (accumulator >= app.fixedStep()) { app.tick(); accumulator -= app.fixedStep(); }
  } else accumulator = 0;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Keep the app mounted for back-forward cache restores. Its clock resumes from
// the next animation frame, without advancing by the time spent off-page.
window.addEventListener('pagehide', () => app.setExternalPause(true, 'pagehide'));
window.addEventListener('pageshow', () => {
  last = performance.now();
  accumulator = 0;
  app.setExternalPause(false, 'pagehide');
  visibility();
});
