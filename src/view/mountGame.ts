import Phaser from 'phaser';
import type { GameApp, GameState, HireKind, UpgradeId, DoctrineId, EraId } from '../core/types';
import type { TalentId } from '../core/talents';
import { BattleScene } from './BattleScene';
import { BattleSound } from './Sound';
import { GameUI } from '../ui/GameUI';
import '../ui/game.css';
import '../ui/fullscreen.css';

export function mountGame(root: HTMLElement, app: GameApp): () => void {
  const ui = new GameUI(root, app);
  const sound = new BattleSound({ onStatus: status => ui.setAudioStatus(status) });
  let state: GameState = app.getState();
  const scene = new BattleScene(() => state, event => sound.play(event));
  scene.setInsets(ui.battleInsets());
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: ui.arena, backgroundColor: '#263e48', transparent: false, scene, scale: { mode: Phaser.Scale.RESIZE, width: ui.arena.clientWidth, height: ui.arena.clientHeight }, render: { antialias: true, roundPixels: false }, audio: { noAudio: true }, banner: false });
  const unsubscribe = app.subscribe(next => { state = next; ui.update(next); sound.sync(next); });
  ui.update(state); sound.sync(state);
  const goBack = () => {
    if (ui.closePanel()) return;
    if (state.phase === 'battle') { if (state.paused) app.togglePause(); return; }
    if (ui.returnToTactics()) return;
    if (state.phase === 'preparation') app.setLoadout(ui.getDraftRoster());
    app.returnToMenu();
  };
  const click = (event: MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    if (button.dataset.action !== 'mute') void sound.unlock();
    switch (button.dataset.action) {
      case 'start': app.startNewRun(); break;
      case 'era': app.selectEra(button.dataset.era as EraId); break;
      case 'continue': app.continueRun(); break;
      case 'hire': app.hire(button.dataset.kind as HireKind); break;
      case 'income': app.upgradeIncome(); break;
      case 'reward': app.chooseReward(button.dataset.reward as UpgradeId); break;
      case 'pause': app.togglePause(); break;
      case 'mute':
        if (state.muted) { app.toggleMute(); void sound.unlock(true); }
        else if (sound.status !== 'ready') void sound.unlock(true);
        else app.toggleMute();
        break;
      case 'doctrine': if (app.selectDoctrine(button.dataset.doctrine as DoctrineId)) ui.showRosterStep(); break;
      case 'roster': ui.toggleRoster(button.dataset.kind as HireKind); break;
      case 'begin': if (app.setLoadout(ui.getDraftRoster())) app.beginRun(); break;
      case 'contract': app.chooseContract(button.dataset.contract!); break;
      case 'retry': app.retryBattle(); break;
      case 'book': ui.openPanel('book'); break;
      case 'records': ui.openPanel('records'); break;
      case 'talents': ui.openPanel('talents'); break;
      case 'buy-talent': app.buyTalent(button.dataset.talent as TalentId); break;
      case 'close-panel': ui.openPanel(null); break;
      case 'back': goBack(); break;
    }
  };
  const key = (event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (state.phase === 'battle' && !state.paused) { void sound.unlock(); app.togglePause(); }
      else goBack();
      return;
    }
    if (/^[1-4]$/.test(event.key) && state.phase === 'battle' && !state.paused) { void sound.unlock(); const card = state.cards[Number(event.key) - 1]; if (card) app.hire(card.kind); }
    if (event.key === 'Tab') {
      const modal = root.querySelector<HTMLElement>('[role="dialog"]');
      if (!modal) return;
      const buttons = Array.from(modal.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };
  root.addEventListener('click', click); window.addEventListener('keydown', key);
  const blur = () => sound.setFocused(false);
  const focus = () => sound.setFocused(true);
  const visibility = () => sound.sync(state);
  window.addEventListener('blur', blur); window.addEventListener('focus', focus);
  document.addEventListener('visibilitychange', visibility);
  const resize = () => {
    const width = Math.max(1, ui.arena.clientWidth), height = Math.max(1, ui.arena.clientHeight);
    if (game.scale.width !== width || game.scale.height !== height) game.scale.resize(width, height);
    scene.setInsets(ui.battleInsets());
  };
  const observer = new ResizeObserver(resize); ui.layoutElements.forEach(element => observer.observe(element));
  window.visualViewport?.addEventListener('resize', resize);
  return () => { window.removeEventListener('blur', blur); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visibility); unsubscribe(); observer.disconnect(); window.visualViewport?.removeEventListener('resize', resize); root.removeEventListener('click', click); window.removeEventListener('keydown', key); sound.destroy(); game.destroy(true); root.replaceChildren(); };
}
