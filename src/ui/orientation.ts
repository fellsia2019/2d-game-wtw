import type { GameApp } from '../core/types';

export function mountOrientationGuard(root: HTMLElement, app: GameApp) {
  // Narrow portrait windows include browser device previews without touch emulation.
  // Wider touch devices (tablets) also require landscape.
  const portrait = window.matchMedia('(orientation: portrait) and (max-width: 600px), (orientation: portrait) and (hover: none) and (pointer: coarse)');
  const shell = root.querySelector<HTMLElement>('.game-shell')!;
  const guard = document.createElement('section');
  guard.className = 'orientation-guard';
  guard.setAttribute('role', 'dialog');
  guard.setAttribute('aria-modal', 'true');
  guard.setAttribute('aria-labelledby', 'orientation-title');
  guard.setAttribute('aria-describedby', 'orientation-description');
  guard.tabIndex = -1;
  guard.innerHTML = `<svg class="orientation-art" viewBox="0 0 240 200" aria-hidden="true" focusable="false"><rect x="118" y="12" width="76" height="132" rx="16" fill="none" stroke="currentColor" opacity=".25" stroke-width="6"/><path d="M141 20h30" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".25"/><rect x="27" y="110" width="142" height="76" rx="16" fill="#243b40" stroke="currentColor" stroke-width="6"/><path d="M37 135v26" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M98 65H81a27 27 0 0 0-27 27v7m-12-12 12 12 12-12" fill="none" stroke="#e7bb72" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg><h2 id="orientation-title">Поверните устройство</h2><p id="orientation-description">Игра работает в горизонтальной ориентации</p>`;
  root.append(guard);
  let previousFocus: HTMLElement | null = null;
  let blocked = false;
  const sync = () => {
    if (portrait.matches && !blocked) previousFocus = document.activeElement as HTMLElement | null;
    blocked = portrait.matches;
    guard.hidden = !blocked;
    shell.inert = blocked;
    app.setExternalPause(blocked, 'orientation');
    if (blocked) guard.focus({ preventScroll: true });
    else if (previousFocus) {
      const target = previousFocus.isConnected ? previousFocus
        : root.querySelector<HTMLElement>('[data-result-primary], .modal-back');
      target?.focus({ preventScroll: true });
      previousFocus = null;
    }
  };
  portrait.addEventListener('change', sync);
  sync();
  return {
    blocked: () => blocked,
    destroy: () => {
      portrait.removeEventListener('change', sync);
      shell.inert = false;
      guard.remove();
      app.setExternalPause(false, 'orientation');
    },
  };
}
