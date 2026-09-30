import type { EnemyBalance } from '../core/enemyBalance';
import Phaser from 'phaser';
import type { GameApp, GameState, HireKind, UpgradeId, DoctrineId, EraId } from '../core/types';
import type { TalentId } from '../core/talents';
import { BattleScene } from './BattleScene';
import { BattleSound } from './Sound';
import { GameUI } from '../ui/GameUI';
import { recruitSlot } from '../ui/shortcuts';
import { mountOrientationGuard } from '../ui/orientation';
import '../ui/game.css';
import '../ui/fullscreen.css';
import '../ui/results.css';
import '../ui/mobile-spacing.css';

export function mountGame(root: HTMLElement, app: GameApp, onReady: () => void = () => {}): () => void {
  const ui = new GameUI(root, app);
  const gameSurface = root.querySelector<HTMLElement>('main.game-shell')!;
  gameSurface.inert = true;
  let loading = true;
  const overlay = document.createElement('div');
  overlay.className = 'boot-overlay';
  overlay.setAttribute('role', 'status');
  overlay.textContent = 'Загрузка игры…';
  root.append(overlay);
  const sound = new BattleSound({ onStatus: status => ui.setAudioStatus(status) });
  let state: GameState = app.getState();
  const scene = new BattleScene(() => state, event => sound.play(event), loaded => {
    if (!loaded) { overlay.textContent = 'Не удалось загрузить ресурсы игры. Обновите страницу.'; return; }
    loading = false;
    gameSurface.inert = false;
    overlay.remove();
    onReady();
  });
  scene.setInsets(ui.battleInsets());
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: ui.arena, backgroundColor: '#263e48', transparent: false, scene, scale: { mode: Phaser.Scale.RESIZE, width: ui.arena.clientWidth, height: ui.arena.clientHeight }, render: { antialias: true, roundPixels: false }, audio: { noAudio: true }, banner: false });
  const unsubscribe = app.subscribe(next => { state = next; ui.update(next); sound.sync(next); });
  ui.update(state); sound.sync(state);
  const orientation = mountOrientationGuard(root, app);
  const goBack = () => {
    if (ui.closePanel()) return;
    if (state.phase === 'battle') { if (state.paused) app.togglePause(); return; }
    if (ui.returnToTactics()) return;
    if (state.phase === 'preparation') app.setLoadout(ui.getDraftRoster());
    app.returnToMenu();
  };
  const click = (event: MouseEvent) => {
    if (loading) return;
    if (state.advertising.busy) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    if (!['mute', 'music'].includes(button.dataset.action ?? '')) void sound.unlock();
    switch (button.dataset.action) {
      case 'start': app.startNewRun(); break;
      case 'start-era':
        if (app.selectEra(button.dataset.era as EraId)) app.startNewRun();
        break;
      case 'era': app.selectEra(button.dataset.era as EraId); break;
      case 'continue': app.continueRun(); break;
      case 'hire': app.hire(button.dataset.kind as HireKind); break;
      case 'income': app.upgradeIncome(); break;
      case 'debug-battle':
        if (state.phase === 'preparation' && !app.setLoadout(ui.getDraftRoster())) break;
        ui.openPanel(null);
        app.startDebugBattle(Number(button.dataset.battle));
        break;
      case 'reset-enemy-balance': app.resetEnemyBalance(); break;
      case 'debug-gold': app.addDebugGold(Number(button.dataset.gold)); break;
      case 'battle-speed': app.setBattleSpeed(Number(button.dataset.speed)); break;
      case 'reward': app.chooseReward(button.dataset.reward as UpgradeId); break;
      case 'pause': app.togglePause(); break;
      case 'resume-battle':
        if (state.phase === 'battle' && state.paused) {
          ui.openPanel(null);
          app.togglePause();
        }
        break;
      case 'main-menu': ui.openPanel(null); app.returnToMenu(); break;
      case 'mute':
        if (state.muted) { app.toggleMute(); void sound.unlock(true); }
        else app.toggleMute();
        break;
      case 'music':
        if (state.musicMuted) { app.toggleMusic(); void sound.unlock(); }
        else app.toggleMusic();
        break;
      case 'doctrine': if (app.selectDoctrine(button.dataset.doctrine as DoctrineId)) ui.showRosterStep(); break;
      case 'roster': ui.toggleRoster(button.dataset.kind as HireKind); break;
      case 'begin': if (app.setLoadout(ui.getDraftRoster())) app.beginRun(); break;
      case 'contract': app.chooseContract(button.dataset.contract!); break;
      case 'retry': ui.openPanel(null); app.retryBattle(true); break;
      case 'restore-result': app.restoreBattleResult(); break;
      case 'ad-gold': void app.requestRewardedAd('battle-gold-double'); break;
      case 'ad-speed': void app.requestRewardedAd('battle-speed-double'); break;
      case 'rewarded-speed': app.setRewardedSpeed(state.advertising.speed === 2 ? 1 : 2); break;
      case 'book': ui.openPanel('book'); break;
      case 'records': ui.openPanel('records'); break;
      case 'talents': ui.openPanel('talents'); break;
      case 'global-talents': ui.openPanel('globalTalents'); break;
      case 'buy-talent': app.buyTalent(button.dataset.talent as TalentId); break;
      case 'buy-base-health': app.buyBaseHealth(); break;
      case 'buy-global-talent': app.buyGlobalTalent(button.dataset.talent as TalentId); break;
      case 'close-panel': ui.openPanel(null); break;
      case 'back': goBack(); break;
    }
  };
  const change = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.debugParam) return;
    const row = input.closest<HTMLElement>('[data-debug-row]')!;
    const index = Number(row.dataset.debugRow);
    const balance = { ...state.debugEnemyBalance[index] };
    balance[input.dataset.debugParam as keyof EnemyBalance] = input.value.trim() ? input.valueAsNumber : NaN;
    if (!app.setEnemyBalance(index, balance)) {
      input.value = String(state.debugEnemyBalance[index][input.dataset.debugParam as keyof EnemyBalance]);
    }
  };
  const key = (event: KeyboardEvent) => {
    if (loading || state.advertising.busy || orientation.blocked()) return;
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing
      || (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (state.phase === 'battle' && !state.paused) { void sound.unlock(); app.togglePause(); }
      else goBack();
      return;
    }
    const slot = recruitSlot(event);
    if (slot !== null && state.phase === 'battle' && !state.paused) {
      event.preventDefault();
      const card = state.cards[slot];
      if (card) { void sound.unlock(); app.hire(card.kind); }
      return;
    }
    if (event.key === 'Tab') {
      const modal = root.querySelector<HTMLElement>('[role="dialog"]');
      if (!modal) return;
      const buttons = Array.from(modal.closest('.scrim')!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };
  root.addEventListener('change', change); root.addEventListener('click', click); window.addEventListener('keydown', key);
  const blur = () => { sound.setFocused(false); app.setExternalPause(true, 'focus'); };
  const focus = () => { sound.setFocused(true); app.setExternalPause(false, 'focus'); };
  const contextmenu = (event: Event) => event.preventDefault();
  root.addEventListener('contextmenu', contextmenu);
  const visibility = () => sound.sync(state);
  window.addEventListener('blur', blur); window.addEventListener('focus', focus);
  document.addEventListener('visibilitychange', visibility);
  const resize = () => {
    ui.updateEraSliderControls();
    const width = Math.max(1, ui.arena.clientWidth), height = Math.max(1, ui.arena.clientHeight);
    if (game.scale.width !== width || game.scale.height !== height) game.scale.resize(width, height);
    scene.setInsets(ui.battleInsets());
  };
  const observer = new ResizeObserver(resize); ui.layoutElements.forEach(element => observer.observe(element));
  window.visualViewport?.addEventListener('resize', resize);
  return () => { orientation.destroy(); root.removeEventListener('contextmenu', contextmenu); window.removeEventListener('blur', blur); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visibility); unsubscribe(); observer.disconnect(); window.visualViewport?.removeEventListener('resize', resize); root.removeEventListener('change', change); root.removeEventListener('click', click); window.removeEventListener('keydown', key); ui.destroy(); sound.destroy(); game.destroy(true); root.replaceChildren(); };
}
