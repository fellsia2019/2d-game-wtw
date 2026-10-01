import { translate } from '../i18n';
import './loading.css';

/** Decorative progress stays below completion until the scene is ready. */
export class LoadingScreen {
  readonly element = document.createElement('div');
  private started = performance.now();
  private frame = 0;
  private timer = 0;
  private stopped = false;
  private progress = 0;
  private fill: HTMLElement;
  private percent: HTMLElement;
  private caption: HTMLElement;
  private title: HTMLElement;

  constructor() {
    this.element.className = 'loading-screen';
    this.element.innerHTML = `<section class="loading-card"><div class="loading-emblem" aria-hidden="true"><span>⚑</span></div><p class="loading-kicker">I — X</p><h1></h1><div class="loading-divider" aria-hidden="true"><i></i><span>◆</span><i></i></div><p class="loading-caption" role="status" aria-live="polite"></p><div class="loading-track" aria-hidden="true"><div class="loading-fill"></div></div><div class="loading-meta" aria-hidden="true"><span class="loading-dots">◆ ◆ ◆</span><span class="loading-percent">0%</span></div></section>`;
    this.fill = this.element.querySelector('.loading-fill')!;
    this.percent = this.element.querySelector('.loading-percent')!;
    this.caption = this.element.querySelector('.loading-caption')!;
    this.title = this.element.querySelector('h1')!;
    this.refreshLanguage();
    const tick = () => {
      if (this.stopped) return;
      this.progress = 94 * (1 - Math.exp(-(performance.now() - this.started) / 2400));
      this.paint(this.progress);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  refreshLanguage() {
    this.title.textContent = translate('Знамёна эпох');
    this.caption.textContent = translate('Загрузка игры и сохранения…');
  }

  private paint(value: number) {
    this.fill.style.width = `${value}%`;
    this.percent.textContent = `${Math.floor(value)}%`;
  }

  finish(onReady: () => void) {
    if (this.stopped) return;
    this.stopped = true;
    cancelAnimationFrame(this.frame);
    this.element.classList.add('is-finishing');
    this.paint(100);
    this.timer = window.setTimeout(() => {
      this.element.classList.add('is-complete');
      this.timer = window.setTimeout(() => { this.element.remove(); onReady(); }, 220);
    }, 250);
  }

  fail() {
    this.destroyAnimation();
    this.element.classList.add('has-error');
    this.caption.textContent = translate('Не удалось загрузить ресурсы игры. Обновите страницу.');
    this.percent.textContent = '—';
  }

  private destroyAnimation() {
    this.stopped = true;
    cancelAnimationFrame(this.frame);
    clearTimeout(this.timer);
  }

  destroy() { this.destroyAnimation(); this.element.remove(); }
}
