import { uiIcon } from './icons';
import type { EraId, GameApp, GameState, HireKind, UnitKind } from '../core/types';
import { descriptions, portrait, roleOf, eraName } from '../art/catalog';
import { ERA_HIRE_KINDS, UNITS, UPGRADES, ERA_BATTLES, ERA_ORDER, nextEra, victoryGold, isBoss } from '../data/content';
import type { SoundStatus } from '../view/Sound';
import type { BattleInsets } from '../view/BattleLayout';
import { TALENTS, talentCost, globalTalentCost, baseHealth, baseHealthCost, type TalentId } from '../core/talents';
import { enemyBalanceDefaults } from '../core/enemyBalance';
import Swiper from 'swiper';
import { A11y, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/a11y';
import { eraThemeStyle } from './eraThemes';
import { locale, translate, translateTree } from '../i18n';

const esc = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const tacticalTraits: Record<string, string> = { shield: 'Держит фронт', spear: 'Против брони', archer: 'Дальний урон', medic: 'Лечение', raider: 'Быстрый прорыв', thrower: 'Урон по группе', banner: 'Ускоряет союзников', siege: 'Бьёт крепость' };
const trait = (kind: string) => kind === 'modernDroneOperator' ? 'Удар дроном' : tacticalTraits[roleOf(kind)];
const eraVictoryText: Record<EraId,string> = { stone:'каменный век', bronze:'бронзовый век', iron:'железный век', antique:'античность', medieval:'раннее Средневековье', 'high-medieval':'высокое Средневековье', renaissance:'Ренессанс и порох', industrial:'индустриальную эпоху', 'world-wars':'эпоху бронемашин', modern:'Современность' };
const describe = (kind: string) => Object.hasOwn(UNITS,kind) ? UNITS[kind as HireKind].role : (descriptions as Record<string,string>)[roleOf(kind)] ?? 'Особый боец своей эпохи.';
const cardName = (kind: HireKind, name: string) => `<span class="unit-name-full">${esc(name)}</span><span class="unit-name-compact" aria-hidden="true">${esc(({ shield: 'Щит', spear: 'Копьё', banner: 'Знамя' } as Partial<Record<string, string>>)[kind] ?? name)}</span>`;
const clock = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
const countWord = (count: number, one: string, few: string, many: string) => count % 100 >= 11 && count % 100 <= 14 ? many : count % 10 === 1 ? one : count % 10 >= 2 && count % 10 <= 4 ? few : many;
const soundIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="sound-wave" d="M16 8c2 2 2 6 0 8m2-11c4 4 4 10 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="mute-slash" d="M16 9l5 6m0-6l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const soundButton = (extraClass = '') => `<button data-action="mute" class="sound-toggle ${extraClass}" type="button" aria-label="Включить звук" aria-pressed="false" title="Включить звук">${soundIcon}</button>`;

const musicButton = () => `<button data-action="music" class="sound-toggle music-toggle" type="button" aria-label="Включить музыку" aria-pressed="false" title="Включить музыку"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17V5l11-2v12M9 8l11-2" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="6" cy="18" rx="3" ry="2" fill="currentColor"/><ellipse cx="17" cy="16" rx="3" ry="2" fill="currentColor"/><path class="mute-slash" d="M3 3l18 18" stroke="currentColor" stroke-width="2"/></svg></button>`;
const audioControls = () => `<div class="audio-controls" aria-label="Музыка и звуки">${musicButton()}${soundButton()}</div>`;
const cloudLabels: Record<GameState['platform']['cloud'], string> = {
  local: 'Прогресс в этом браузере', synced: 'Прогресс сохранён в облаке', pending: 'Прогресс сохранён · отправляем в облако…',
  offline: 'Прогресс в браузере · облако недоступно', conflict: 'В облаке другой прогресс · обнови страницу для выбора'
};

export class GameUI {
  readonly arena: HTMLElement;
  private overlay: HTMLElement;
  private modalKey = '';
  private fields = new Map<string, HTMLElement>();
  private state!: GameState;
  private draft: HireKind[] = [];
  private preparationStep: 'tactics' | 'roster' = 'tactics';
  private visitedTactics = false;
  private panel: 'book' | 'records' | 'talents' | 'globalTalents' | null = null;
  private cardKey = '';
  private debugEra = '';
  private previousPhase = '';
  private overlayContext = '';
  private audioStatus: SoundStatus = 'locked';
  private eraSwiper: Swiper | null = null;
  destroy() {
    // A11y can have a pending focus callback; retain the destroyed instance's
    // fields until that callback finishes instead of deleting them underneath it.
    this.eraSwiper?.destroy(false, true);
    this.eraSwiper = null;
  }
  setAudioStatus(status: SoundStatus) { this.audioStatus = status; if (this.state) this.updateSoundControls(); }
  private updateSoundControls() {
    for (const action of ['mute', 'music'] as const) {
      const muted = action === 'music' ? this.state.musicMuted : this.state.muted;
      const enabled = !muted;
      const label = translate(`${enabled ? 'Выключить' : 'Включить'} ${action === 'music' ? 'музыку' : 'звуки игры'}`);
      for (const button of this.root.querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`)) {
        button.classList.toggle('is-on', enabled); button.setAttribute('aria-label', label);
        button.setAttribute('aria-pressed', String(enabled)); button.title = translate(label + (this.audioStatus === 'unavailable' ? ' · аудио недоступно' : ''));
      }
    }
  }

  get layoutElements(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll<HTMLElement>('.arena,.hud,.recruitment,.boss-warning'));
  }
  battleInsets(): BattleInsets {
    const shell = this.root.querySelector<HTMLElement>('.game-shell')!;
    const dock = this.root.querySelector<HTMLElement>('.recruitment')!;
    shell.style.setProperty('--dock-height', `${dock.getBoundingClientRect().height}px`);
    const arena = this.arena.getBoundingClientRect();
    const hud = this.root.querySelector<HTMLElement>('.hud')!.getBoundingClientRect();
    const dockBounds = dock.getBoundingClientRect();
    const lowerEdges = ['.hud', '.boss-warning', '.battle-heading'].map(selector => {
      const element = this.root.querySelector<HTMLElement>(selector)!;
      return element.hidden || !element.getClientRects().length ? 0 : element.getBoundingClientRect().bottom - arena.top;
    });
    return { top: Math.max(...lowerEdges) + 10, bottom: Math.max(0, arena.bottom - dockBounds.top) + 20, left: hud.left - arena.left, right: arena.right - hud.right };
  }
  private eraKinds(state: GameState): HireKind[] {
    return ERA_HIRE_KINDS[state.eraId];
  }
  private eraMap(state: GameState) {
    return `<div class="era-map" role="region" aria-label="Карта эпох"><div class="era-slider"><button type="button" class="era-slide-arrow era-prev" aria-label="Предыдущие эпохи" aria-controls="era-track">←</button><div class="era-track swiper" id="era-track" tabindex="0" aria-label="Эпохи · перетаскивай влево и вправо"><div class="swiper-wrapper">${ERA_ORDER.map((era,i) => `<div class="swiper-slide"><button data-action="era" data-era="${era}" style="${eraThemeStyle(era)}" class="era-choice ${state.eraId === era ? 'selected' : ''} ${state.eraProgress[era] >= 4 ? 'is-complete' : ''}" aria-pressed="${state.eraId === era}" ${!state.unlockedEras[era] ? 'disabled' : ''}><img class="era-backdrop" src="${import.meta.env.BASE_URL}assets/era-cards/${import.meta.env.MODE === 'yandex' && era === 'world-wars' ? 'armored-arena' : era}.${['industrial','world-wars','modern'].includes(era) ? 'png' : 'webp'}" alt="" draggable="false" loading="lazy" width="768" height="512"/><span class="era-card-status ${state.eraProgress[era] >= 4 ? 'is-complete' : !state.unlockedEras[era] ? 'is-locked' : ''}">${state.eraProgress[era] >= 4 ? '✓ Пройдена' : state.unlockedEras[era] ? 'Не пройдена' : 'Закрыта'}</span><span class="era-card-copy"><span class="era-number">${String(i+1).padStart(2,'0')}</span><b>${eraName(era)}</b><small>${state.eraId === era ? `Выбрана · ${Math.min(4,state.eraProgress[era])} / 4 этапов` : state.unlockedEras[era] ? 'Доступна · выбрать →' : `Пройди ${eraVictoryText[ERA_ORDER[i - 1]]}`}</small></span></button></div>`).join('')}</div></div><button type="button" class="era-slide-arrow era-next" aria-label="Следующие эпохи" aria-controls="era-track">→</button></div><div class="era-pagination" aria-label="Навигация по эпохам"></div></div>`;
  }
  updateEraSliderControls() {
    this.eraSwiper?.update();
  }
  private menuIntro(state: GameState) {
    if (state.eraId === 'stone') return 'Пройди четыре сражения и одолей вождя эпохи.<br/>Открой бронзовый век с новым войском и тактикой.';
    if (state.eraId === 'bronze') return 'Останови царя Медных ворот в четырёх боях.<br/>Открой Железный век и войско тяжёлых доспехов.';
    if (state.eraId === 'renaissance') return 'Прикрой мушкетёров кирасирами и пикинёрами.<br/>Подведи артиллерию к бастиону и одолей генерала Дымного фронта.';
    if (state.eraId === 'industrial') return 'Проведи штурм через железную дорогу и заводской рубеж.<br/>Прикрой гаубицу, сдержи перегрев и одолей барона Стального завода.';
    if (state.eraId === 'world-wars') return 'Пройди траншеи под огнём снайперов и бронемашин.<br/>Разведджип открывает слабые места, плотный огонь замедляет врага; одолей лёгкий танк командующего.';
    if (state.eraId === 'modern') return 'Штурмуй укреплённый сектор щитовиками, марксманами и артиллерией.<br/>Ударные дроны летят к цели и взрываются; одолей командира Автономной базы.';
    if (state.eraId === 'high-medieval') return 'Веди рыцарей, алебардистов и арбалетчиков к каменному замку.<br/>Прикрой требушеты и одолей кастеляна с его гарнизоном.';
    if (state.eraId === 'medieval') return 'Пройди засаду, щитовой рубеж и осаду посада.<br/>Веди дружину, берсерков и стенобитчика против ярла Северного форта.';
    if (state.eraId === 'antique') return 'Пройди лагерь, переправу и стены провинции.<br/>Используй строй, конницу и осаду против Девятого легиона.';
    return 'Прорви заслон и осадную дорогу к Железной цитадели.<br/>Пробивай броню и одолей коменданта в четвёртом бою.';
  }
  private menuFeaturesHTML(state: GameState) {
    return `<div class="menu-features" aria-label="Разделы игры">
      <button class="menu-feature talent-feature" data-action="talents"><span class="feature-icon" aria-hidden="true">${uiIcon('point')}</span><span class="feature-copy"><b>Дерево талантов</b><small>Золото — эта эпоха, очки — все эпохи</small><em>${state.gold} золота · ${state.globalTalentPoints} очк. эпох</em></span><span class="feature-arrow" aria-hidden="true">→</span></button>
      <button class="menu-feature book-feature" data-action="book"><span class="feature-icon" aria-hidden="true">${uiIcon('book')}</span><span class="feature-copy"><b>Книга войск</b><small>Бойцы, роли и условия открытия</small><em>Открыто карт: ${state.unlockedUnits.length} / ${this.eraKinds(state).length}</em></span><span class="feature-arrow" aria-hidden="true">→</span></button>
      <button class="menu-feature records-feature" data-action="records"><span class="feature-icon" aria-hidden="true">${uiIcon('trophy')}</span><span class="feature-copy"><b>Рекорды</b><small>История твоих походов и побед</small><em>${state.records.wins} ${countWord(state.records.wins, 'победа', 'победы', 'побед')} · ${state.records.runs} ${countWord(state.records.runs, 'поход', 'похода', 'походов')}</em></span><span class="feature-arrow" aria-hidden="true">→</span></button>
    </div>`;
  }
  private menuHTML(state: GameState) {
    const kinds = this.eraKinds(state);
    const headline = state.canContinue ? 'Продолжи<br/><em>свой поход</em>' : `Начни поход<br/><em>${eraName(state.eraId)}</em>`;
    const play = state.canContinue
      ? '<button class="hero-play" data-action="continue"><span>▶</span> Продолжить игру →</button>'
      : '<button class="hero-play" data-action="start"><span>▶</span> Играть →</button>';
    return `<div class="menu-hero" style="${eraThemeStyle(state.eraId)}"><div class="menu-art"><span class="hero-era-tag">${eraName(state.eraId)}</span><img src="${portrait(kinds[1])}" alt=""/><img src="${portrait(kinds[0])}" alt=""/><img src="${portrait(kinds[2])}" alt=""/></div><div class="menu-hero-copy"><div class="eyebrow">ЗНАМЁНА ЭПОХ</div><h2 id="dialog-title">${headline}</h2><p class="modal-intro">${this.menuIntro(state)}</p><div class="menu-hero-actions">${play}${state.advertising.canRestoreResult ? '<button class="hero-play hero-new-run" data-action="restore-result">Итог последнего боя →</button>' : ''}${state.canContinue ? '<button class="hero-play hero-new-run" data-action="start">Начать эпоху заново →</button>' : ''}</div></div></div><div class="menu-section-title"><h3>Развитие и история</h3></div>${this.menuFeaturesHTML(state)}<div class="menu-section-title"><h3>Карта эпох</h3></div>${this.eraMap(state)}`;
  }
  private unlockLabel(kind: HireKind, state: GameState) {
    const index = this.eraKinds(state).indexOf(kind);
    return state.unlockedUnits.includes(kind) ? 'Доступен в подготовке' : index === 7 ? 'Одолей босса эпохи' : `Победы эпохи: ${state.eraProgress[state.eraId]} / ${index - 3}`;
  }
  getDraftRoster() { return [...this.draft]; }
  showRosterStep() { this.visitedTactics = true; this.preparationStep = 'roster'; this.renderOverlay(this.state); }
  canReturnToTactics() { return this.state.phase === 'preparation' && this.preparationStep === 'roster' && this.visitedTactics; }
  returnToTactics(): boolean {
    if (!this.canReturnToTactics()) return false;
    this.preparationStep = 'tactics'; this.renderOverlay(this.state); return true;
  }
  toggleRoster(kind: HireKind) {
    if (!this.state.unlockedUnits.includes(kind)) return;
    if (this.draft.includes(kind)) this.draft = this.draft.filter(selected => selected !== kind);
    else if (this.draft.length < 4) this.draft.push(kind);
    this.renderOverlay(this.state);
  }

  openPanel(panel: 'book' | 'records' | 'talents' | 'globalTalents' | null) { this.panel = panel; this.renderOverlay(this.state); }
  closePanel(): boolean {
    if (!this.panel) return false;
    this.openPanel(null);
    return true;
  }
  private enemyFormationHTML(roster: UnitKind[]): string {
    // Portraits face right: ranged units stand behind the melee front.
    return [...roster].sort((a, b) => UNITS[b].range - UNITS[a].range)
      .map(kind => `<img src="${portrait(kind, true)}" alt="${esc(UNITS[kind].name)}"/>`).join('');
  }
  private contractHTML(state: GameState): string {
    const battle = state.contracts[0];
    return `<div class="eyebrow">${eraName(state.eraId)} · Бой ${state.battleIndex + 1} / 4</div><h2 id="dialog-title">${esc(state.battleName)}</h2><div class="ready-progress" aria-label="Прогресс эпохи">${[0,1,2,3].map(index => `<span class="${index < state.battleIndex ? 'done' : index === state.battleIndex ? 'current' : ''}">${index < state.battleIndex ? '✓' : index + 1}</span>`).join('')}</div><div class="ready-enemies">${this.enemyFormationHTML(battle.roster)}</div><p class="ready-threat">${esc(battle.threat)}</p><div class="ready-contract"><b>${uiIcon('gold')} +${victoryGold(state.eraId)} за победу</b></div><div class="ready-actions"><button class="primary" data-action="contract" data-contract="${battle.id}" data-result-primary="true">Начать бой ${state.advertising.speedUnlocked ? "×2 " : ""}→</button>${this.advertisingHTML(state, true)}<button class="secondary" data-action="talents">Улучшить отряд · ${uiIcon('gold')} ${state.gold}</button><button class="secondary restart-epoch" data-action="start">Начать эпоху заново</button></div>`;
  }
  private rosterHTML(state: GameState): string {
    const full = this.draft.length === 4;
    const picked = [0,1,2,3].map(index => {
      const kind = this.draft[index];
      return kind ? `<button class="picked-unit" data-action="roster" data-kind="${kind}" aria-label="Убрать ${esc(UNITS[kind].name)} из отряда" title="Убрать ${esc(UNITS[kind].name)}"><img src="${portrait(kind)}" alt=""/><span class="picked-remove" aria-hidden="true">${uiIcon('close')}</span></button>` : '<span class="picked-empty" aria-label="Свободное место">＋</span>';
    }).join('');
    const cards = this.eraKinds(state).map(kind => {
      const selected = this.draft.includes(kind), locked = !state.unlockedUnits.includes(kind);
      const capacityBlocked = full && !selected && !locked;
      const index = this.eraKinds(state).indexOf(kind);
      const condition = index === 7 ? 'Победи босса эпохи' : `${index - 3} ${countWord(index - 3, 'победа', 'победы', 'побед')} · ${state.eraProgress[state.eraId]}/${index - 3}`;
      return `<button class="fighter-choice ${selected ? 'is-picked' : ''} ${locked ? 'locked' : ''}" data-action="roster" data-kind="${kind}" aria-pressed="${selected}" ${locked || capacityBlocked ? 'disabled' : ''} aria-label="${esc(UNITS[kind].name)}: ${locked ? esc(condition) : selected ? 'убрать из отряда' : capacityBlocked ? 'сначала убери бойца из отряда' : 'добавить в отряд'}"><span class="fighter-mark">${locked ? uiIcon('lock') : selected ? uiIcon('check') : uiIcon('plus')}</span><img src="${portrait(kind)}" alt=""/><b>${esc(UNITS[kind].name)}</b><span class="fighter-role">${trait(kind)}</span><span class="fighter-price">${uiIcon('supplies')} ${UNITS[kind].cost}</span><span class="fighter-state">${locked ? condition : selected ? 'В отряде · убрать' : capacityBlocked ? 'Отряд заполнен' : 'Добавить в отряд'}</span></button>`;
    }).join('');
    return `<div class="prep-stage-label">${eraName(state.eraId)}</div><h2 id="dialog-title">Выбери 4 бойцов</h2><div class="picked-bar"><div><b>Твой отряд · ${this.draft.length}/4</b><span>${full ? 'Чтобы заменить бойца, убери одного' : `Добавь ещё ${4 - this.draft.length}`}</span></div><div class="picked-units">${picked}</div></div><p class="pick-hint">Нажми карточку, чтобы добавить или убрать бойца</p><div class="fighter-grid">${cards}</div><div class="pick-footer"><span>${full ? '' : `Выбрано ${this.draft.length} из 4`}</span><button class="primary" data-action="begin" ${!state.selectedDoctrine || !full ? 'disabled' : ''}>Дальше →</button></div>`;
  }
  private battleResultHTML(state: GameState): string {
    const report = state.report, final = state.phase === 'victory', lost = state.phase === 'defeat';
    const total = ERA_BATTLES[state.eraId].length;
    const status = lost ? 'Поражение' : final ? 'Эпоха пройдена!' : 'Победа!';
    const stats = `<div class="result-summary" aria-label="Итоги боя"><div class="result-stat result-gold"><b class="result-stat-value">${uiIcon('gold')} +${(report?.goldEarned ?? 0) * (state.advertising.goldClaimed ? 2 : 1)}</b><span>Золото</span></div><div class="result-stat"><b class="result-stat-value">${clock(report?.duration ?? 0)}</b><span>Игровое время</span></div><div class="result-stat"><b class="result-stat-value">${report?.hires ?? 0}</b><span>Призвано</span></div></div>`;
    let content = `<header class="result-header"><h2 id="dialog-title">${status}</h2><span class="result-context">${eraName(state.eraId)}<br/>Бой ${final ? total : state.battleIndex + 1} / ${total}</span></header>${stats}${this.advertisingHTML(state, false)}`;
    if (lost) {
      content += `<p class="result-hint">Усиль отряд и попробуй снова.</p><div class="result-actions"><button class="primary" data-action="talents" data-result-primary="true">Улучшить отряд ${uiIcon('gold')} ${state.gold}</button><button class="secondary" data-action="retry">Повторить бой →</button></div>`;
    } else if (!final) {
      content += `<h3 class="result-choice-title">Выбери усиление</h3><div class="rewards result-rewards">${state.rewards.map(reward => `<button class="reward-card" data-action="reward" data-reward="${reward.id}"><p class="reward-effect">${esc(reward.description)}</p><span class="take-reward"><span class="continue-label">Продолжить</span> →</span></button>`).join('')}</div>`;
    } else {
      const next = nextEra(state.eraId);
      if (next) content += `<div class="result-actions"><button class="primary" data-action="start-era" data-era="${next}" data-result-primary="true">Перейти в ${eraName(next).toLocaleLowerCase('ru')} →</button></div><div class="result-next-era"><span class="result-next-label">ДАЛЬШЕ</span><h3>${eraName(next)}</h3><div class="result-next-portraits">${ERA_HIRE_KINDS[next].slice(0, 4).map(kind => `<img src="${portrait(kind)}" alt="${esc(UNITS[kind].name)}"/>`).join('')}</div><p>Новая эпоха — новые бойцы</p><small>${uiIcon('point')} +1 очко за первый переход</small></div>`;
      else content += `<div class="result-finished">${uiIcon('trophy')}<h3>Все доступные эпохи пройдены</h3><p>Собери другой отряд и повтори поход.</p></div><div class="result-actions"><button class="primary" data-action="start" data-result-primary="true">Начать эпоху заново →</button></div>`;
    }
    return `${content}<div class="result-bottom">${state.phase === 'reward' ? `<button class="result-button result-upgrade" data-action="talents"><span>Улучшить отряд</span><span class="result-button-wallet">${uiIcon('gold')} ${state.gold}</span></button>` : ''}<button class="result-button" data-action="back">В меню</button></div>`;
  }
  private advertisingHTML(state: GameState, speed: boolean): string {
    const ad = state.advertising;
    const done = speed ? ad.speedUnlocked : ad.goldClaimed;
    const gold = state.report?.goldEarned ?? 0;
    if (!speed && gold <= 0) return '';
    const disabled = ad.busy || (!(ad.pendingGold && !speed) && (state.platform.sdk !== 'available' || !state.platform.online));
    if (!speed && !done) {
      const heading = ad.busy ? 'Ожидание рекламы…' : ad.pendingGold ? 'Получить подтверждённый бонус' : disabled ? 'Реклама недоступна' : 'Получить ещё золото';
      const detail = ad.pendingGold ? 'Награда подтверждена' : disabled && !ad.busy ? 'Бонус за просмотр · золото за бой ×2' : 'Посмотри рекламу · золото за бой ×2';
      return `<div class="advertising-offer"><button class="ad-gold-button" data-action="ad-gold" ${disabled ? 'disabled' : ''}><span class="ad-video-icon" aria-hidden="true">${ad.pendingGold ? uiIcon('check') : '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="m10 8 6 4-6 4z" fill="currentColor"/></svg>'}</span><span class="ad-gold-copy"><b>${heading}</b><span>${detail}</span></span><span class="ad-gold-amount">${uiIcon('gold')} +${gold}</span><span class="ad-gold-arrow" aria-hidden="true">→</span></button>${ad.message ? `<p role="status">${esc(ad.message)}</p>` : ''}</div>`;
    }
    const label = !speed && ad.pendingGold ? 'Получить подтверждённый бонус' : speed ? 'Реклама: темп этого боя ×2' : `Реклама: золото за бой ×2 · ещё +${gold}`;
    return `<div class="advertising-offer">${done ? `<p>${speed ? 'Темп ×2 доступен' : 'Бонус золота получен'}</p>` : `<button class="secondary" data-action="${speed ? 'ad-speed' : 'ad-gold'}" ${disabled ? 'disabled' : ''}>${ad.busy ? 'Ожидание рекламы…' : label}</button>`}${speed ? '<small>Обе армии, припасы и таймеры движутся вдвое быстрее.</small>' : ''}${ad.message ? `<p role="status">${esc(ad.message)}</p>` : !done && disabled ? '<small>Реклама сейчас недоступна. Можно продолжить без неё.</small>' : ''}</div>`;
  }
  private talentsHTML(state: GameState, global = false) {
    const levels = global ? state.globalTalents : state.talents;
    const currency = global ? state.globalTalentPoints : state.gold;
    let cards = (Object.keys(TALENTS) as TalentId[]).map(id => {
      const talent = TALENTS[id], level = levels[id];
      const cost = global ? globalTalentCost() : talentCost(level);
      return `<button type="button" class="talent-card talent-${id}" data-action="${global ? 'buy-global-talent' : 'buy-talent'}" data-talent="${id}" ${currency < cost ? 'disabled' : ''} aria-label="Купить ${talent.name}, уровень ${level + 1}, цена ${cost} ${global ? 'очков' : 'золота'}"><span class="talent-icon">${uiIcon(id)}</span><span class="talent-name">${talent.name}</span><span class="talent-level" aria-label="Уровень ${level}">Ур. ${level}</span><span class="talent-stat" aria-label="Текущий бонус +${level * 5}%, следующий +${(level + 1) * 5}%"><strong>+${level * 5}%</strong><span class="talent-arrow" aria-hidden="true">→</span><span class="talent-next">+${(level + 1) * 5}%</span></span><span class="talent-buy" aria-hidden="true">${uiIcon(global ? 'point' : 'gold')} ${cost}</span></button>`;
    }).join('');
    if (!global) {
      const hp = baseHealth(state.baseLevel), cost = baseHealthCost(state.baseLevel);
      cards += `<button type="button" class="talent-card talent-health" data-action="buy-base-health" ${state.gold < cost ? 'disabled' : ''} aria-label="Купить здоровье базы, уровень ${state.baseLevel + 1}, цена ${cost} золота"><span class="talent-icon">${uiIcon('health')}</span><span class="talent-name">Здоровье базы</span><span class="talent-level" aria-label="Уровень ${state.baseLevel}">Ур. ${state.baseLevel}</span><span class="talent-stat" aria-label="Текущее здоровье ${hp} HP, следующее ${hp + 10} HP"><strong>${hp} HP</strong><span class="talent-arrow" aria-hidden="true">→</span><span class="talent-next">${hp + 10} HP</span></span><span class="talent-buy" aria-hidden="true">${uiIcon('gold')} ${cost}</span></button>`;
    }
    return `<div class="eyebrow">ДЕРЕВО ТАЛАНТОВ</div><h2 id="dialog-title">${global ? 'Глобальные таланты' : `Таланты · ${eraName(state.eraId)}`}</h2><div class="talent-tabs" role="group" aria-label="Выбор дерева талантов"><button type="button" data-action="talents" class="talent-tab ${!global ? 'is-selected' : ''}" aria-pressed="${!global}">${uiIcon('gold')}<span><b>Таланты эпохи</b><small>За золото · текущая эпоха</small></span></button><button type="button" data-action="global-talents" class="talent-tab ${global ? 'is-selected' : ''}" aria-pressed="${global}">${uiIcon('point')}<span><b>Глобальные таланты</b><small>За очки · все эпохи</small></span></button></div><p class="talent-points">${global ? 'Очки перехода' : 'Золото эпохи'}: ${uiIcon(global ? 'point' : 'gold')} <b>${currency}</b></p><div class="talent-grid">${cards}</div>`;
  }
  private cardsHTML(state: GameState) {
    return state.cards.map((card, i) => `<button class="unit-card ${card.kind}" data-action="hire" data-kind="${card.kind}" aria-keyshortcuts="${i + 1}" aria-label="Призвать: ${esc(card.name)}"><span class="card-key">${i + 1}</span><div class="portrait"><img src="${portrait(card.kind)}" alt=""/></div><div class="card-copy"><span class="role">${trait(card.kind)}</span><h3>${cardName(card.kind, card.name)}</h3><p>${describe(card.kind)}</p><div class="card-bottom"><strong class="price">${uiIcon('supplies')} <span data-field="cost-${card.kind}">${card.cost}</span></strong><span data-field="available-${card.kind}" class="availability"></span></div></div></button>`).join('');
  }
  constructor(private root: HTMLElement, app: GameApp) {
    root.innerHTML = `<main class="game-shell">
      <header class="masthead"><div class="brand"><span class="brand-seal">⚔</span><div><b>Знамёна эпох</b><span data-field="era">КАМЕННЫЙ ВЕК</span></div></div><div class="campaign"><span class="chapter" data-field="chapter">БОЙ 01 / 04</span><div class="route" aria-label="Маршрут из четырёх боёв"><i></i><span></span><i></i><span></span><i></i><span></span><i></i></div></div><div class="tools"><span class="battle-wallet" title="Золото эпохи · заработано в этом бою">${uiIcon('gold')}<b data-field="gold">0</b></span>${audioControls()}<button data-action="pause" class="icon-button" title="Пауза · Escape" data-field="pause">Ⅱ Пауза</button></div></header>
      <section class="battle-panel" aria-label="Бой">
        <div class="battle-heading"><div><span class="eyebrow">БОЙ <span data-field="contract">01</span></span><h1 data-field="battleName">Пепельный тракт</h1></div><div class="timer"><button data-action="rewarded-speed" class="icon-button" hidden>×1</button><span class="live-dot"></span><span data-field="time">00:00</span></div></div>
        <div class="hud"><div class="fortress-stat ally"><span>Наши</span><strong data-field="allyHp">100 <small>/ 100</small></strong><div class="meter"><i data-field="allyBar"></i></div></div><div class="supply-stat"><span><span class="supply-label">Припасы</span> <b data-field="income">+6 / сек</b></span><strong>${uiIcon('supplies')} <span data-field="resource">0</span></strong></div><div class="fortress-stat enemy"><span>Враг <span class="glyph-status" data-field="glyphStatus" hidden></span></span><strong data-field="enemyHp">100 <small>/ 100</small></strong><div class="meter"><i data-field="enemyBar"></i></div></div></div>
        <div class="arena-wrap"><div id="battle-arena" class="arena"></div><div class="arena-vignette"></div><div class="boss-warning" data-field="bossWarning" role="status" hidden></div><div class="arena-label"><span class="wind-mark">≋</span> <b data-field="arenaName">Пепельный тракт</b> <span>•</span> линия фронта</div></div>

      </section>
      <section class="recruitment" aria-label="Призыв бойцов"><div class="section-title"><h2>Твой отряд</h2><span>Нажми карту, чтобы призвать <span class="keyboard-hint">· клавиши 1–4</span></span></div><div class="recruit-row"><div class="cards">${app.getState().cards.map((card, i) => `<button class="unit-card ${card.kind}" data-action="hire" data-kind="${card.kind}" aria-keyshortcuts="${i + 1}" aria-label="Призвать: ${esc(card.name)}"><span class="card-key">${i + 1}</span><div class="portrait"><img src="${portrait(card.kind)}" alt=""/></div><div class="card-copy"><span class="role">${trait(card.kind)}</span><h3>${cardName(card.kind, card.name)}</h3><p>${describe(card.kind)}</p><div class="card-bottom"><strong class="price">${uiIcon('supplies')} <span data-field="cost-${card.kind}">${card.cost}</span></strong><span data-field="available-${card.kind}" class="availability"></span></div></div></button>`).join('')}</div><button class="wagon" data-action="income"><span class="wagon-icon" aria-hidden="true">${uiIcon('supply')}</span><b>Доход<span class="wagon-arrow"> ↑</span></b><span>+1 / сек</span><strong>${uiIcon('supplies')} <span data-field="wagonCost">40</span></strong><small data-field="wagonLevel">Ур. 0</small></button></div></section>
      <footer class="game-footer"><span data-field="platform">Локальная игра · сохранение в браузере</span><span data-field="boons">Четыре боя — одна эпоха</span></footer>
      <div class="overlay-host"></div>
    </main>${import.meta.env.MODE !== "yandex" ? `<details class="debug-menu"><summary>Debug · <span data-field="speedLabel">×1</span></summary><div class="debug-controls"><a href="${import.meta.env.BASE_URL}sprite-lab.html${locale() === 'en' ? '?lang=en' : ''}" target="_blank" rel="noopener">Лаборатория спрайтов ↗</a><p>Скорость боя</p><div class="debug-speeds" role="group" aria-label="Скорость боя">${[1,2,3,4,5].map(speed => `<button data-action="battle-speed" data-speed="${speed}" aria-pressed="${speed === 1}">×${speed}</button>`).join('')}</div><p class="debug-battle-label">Запустить бой заново</p><div class="debug-speeds debug-battles" role="group" aria-label="Выбор боя">${[1,2,3,4].map(battle => `<button data-action="debug-battle" data-battle="${battle - 1}" aria-pressed="false">${battle}</button>`).join('')}</div><p class="debug-battle-label">Золото для прокачки</p><div class="debug-speeds debug-gold" role="group" aria-label="Добавить золото для прокачки">${[50,100,200,500,2000].map(amount => `<button data-action="debug-gold" data-gold="${amount}" aria-label="Добавить ${amount} золота для прокачки" title="Золото текущей эпохи · доступно на любом экране">+${amount}</button>`).join('')}</div><div class="debug-balance"></div><p class="debug-note">Сохраняется в браузере · действует со следующего боя</p><button class="debug-reset" data-action="reset-enemy-balance">Сбросить баланс эпохи</button></div></details>` : ""}`;
    this.arena = root.querySelector('.arena')!; this.overlay = root.querySelector('.overlay-host')!;
    for (const element of root.querySelectorAll<HTMLElement>('[data-field]')) this.fields.set(element.dataset.field!, element);
    translateTree(root);
  }
  private text(key: string, value: string) { const el = this.fields.get(key); const localized = translate(value); if (el && el.textContent !== localized) el.textContent = localized; }
  private bar(key: string, value: number) { this.fields.get(key)!.style.width = `${Math.max(0, Math.min(100, value * 100))}%`; }
  update(state: GameState) {
    this.state = state;
    const debug = this.root.querySelector<HTMLElement>('.debug-balance')!;
    const columns = [{ key: 'income', label: 'Доход/с', max: 1000 }, { key: 'startSupplies', label: 'Старт', max: 10000 }, { key: 'hpBonus', label: 'HP +%', max: 1000 }, { key: 'damageBonus', label: 'Урон +%', max: 1000 }] as const;
    if (debug && this.debugEra !== state.eraId) {
      this.debugEra = state.eraId;
      const defaults = enemyBalanceDefaults(state.eraId);
      debug.innerHTML = `<table><caption>Враг · ${eraName(state.eraId)}</caption><thead><tr><th>Бой</th>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead><tbody>${state.debugEnemyBalance.map((_, index) => `<tr data-debug-row="${index}"><th title="${esc(ERA_BATTLES[state.eraId][index].name)}">${index + 1}</th>${columns.map(c => `<td><input type="number" min="0" max="${c.max}" step="1" data-debug-param="${c.key}" aria-label="Бой ${index + 1}: ${c.label}"/><span class="debug-default">В коде: ${defaults[index][c.key]}</span></td>`).join('')}</tr>`).join('')}</tbody></table>`;
      translateTree(debug);
    }
    for (const input of debug?.querySelectorAll<HTMLInputElement>('[data-debug-param]') ?? []) {
      if (document.activeElement === input) continue;
      const index = Number(input.closest<HTMLElement>('[data-debug-row]')!.dataset.debugRow);
      input.value = String(state.debugEnemyBalance[index][input.dataset.debugParam as typeof columns[number]['key']]);
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-action="debug-battle"]')) {
      const index = Number(button.dataset.battle);
      button.setAttribute('aria-pressed', String(index === state.battleIndex));
      button.title = translate(ERA_BATTLES[state.eraId][index].name);
    }
    this.text('speedLabel', `×${state.battleSpeed}`);
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-action="battle-speed"]')) button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === state.battleSpeed));
    if (state.phase === 'preparation' && this.previousPhase !== 'preparation') { this.draft = [...state.roster]; this.preparationStep = state.selectedDoctrine ? 'roster' : 'tactics'; this.visitedTactics = false; }
    this.previousPhase = state.phase;
    const cardsKey = state.eraId + state.cards.map(card => card.kind).join();
    if (cardsKey !== this.cardKey) {
      this.cardKey = cardsKey; this.root.querySelector('.cards')!.innerHTML = this.cardsHTML(state);
      translateTree(this.root.querySelector('.cards')!);
      for (const element of this.root.querySelectorAll<HTMLElement>('.cards [data-field]')) this.fields.set(element.dataset.field!, element);
    }
    this.text('era', eraName(state.eraId));
    this.text('chapter', `БОЙ ${String(state.battleIndex + 1).padStart(2, '0')} / 04`); this.text('contract', String(state.battleIndex + 1).padStart(2, '0'));
    this.text('battleName', state.battleName); this.text('time', clock(state.elapsed));
    this.text('allyHp', `${Math.ceil(state.allyFortressHp)} / ${state.allyFortressMaxHp}`); this.text('enemyHp', `${Math.ceil(state.enemyFortressHp)} / ${state.fortressMaxHp}`);

    this.text('resource', String(Math.floor(state.resource))); this.text('income', `+${Math.round(state.income)} / сек`);
    this.text('gold', `${state.gold} (+${state.battleGold})`);
    this.bar('allyBar', state.allyFortressHp / state.allyFortressMaxHp); this.bar('enemyBar', state.enemyFortressHp / state.fortressMaxHp);
    this.updateSoundControls();
    (this.fields.get('pause') as HTMLButtonElement).disabled = state.phase !== 'battle';
    const speedButton = this.root.querySelector<HTMLButtonElement>('[data-action="rewarded-speed"]')!;
    speedButton.hidden = state.phase !== 'battle' || !state.advertising.speedUnlocked;
    speedButton.textContent = translate(`Темп ×${state.advertising.speed}`);
    speedButton.setAttribute('aria-label', translate(`Темп ×${state.advertising.speed}. Переключить на ×${state.advertising.speed === 2 ? 1 : 2}`));
    this.text('pause', state.paused ? '▶ Продолжить' : 'Ⅱ Пауза');
    this.text('wagonCost', String(state.incomeUpgradeCost)); this.text('wagonLevel', `Ур. ${state.incomeUpgrades}`);
    this.text('boons', state.chosenUpgrades.length ? state.chosenUpgrades.map(id => UPGRADES[id].name).join(' · ') : 'Четыре боя — одна эпоха');
    this.text('arenaName', `${eraName(state.eraId)} · ${state.battleName}`);
    this.text('platform', cloudLabels[state.platform.cloud]);
    const glyph = this.fields.get('glyphStatus')!;
    glyph.hidden = state.enemyGlyphRemaining <= 0;
    glyph.textContent = translate(`Глиф · ${Math.ceil(state.enemyGlyphRemaining)} с`);
    this.root.querySelector('.fortress-stat.enemy')!.classList.toggle('has-glyph', state.enemyGlyphRemaining > 0);
    const warning = this.fields.get('bossWarning')!;
    warning.hidden = state.bossPhase !== 'warning' && state.bossPhase !== 'assault';
    const boss = state.units.find(unit => unit.team === 'enemy' && isBoss(unit.kind) && unit.hp > 0);
    warning.classList.toggle('boss-health', Boolean(boss));
    if (boss) warning.innerHTML = `<div class="boss-health-title"><b>${esc(UNITS[boss.kind].name)}</b><span>${Math.ceil(boss.hp)} / ${boss.maxHp}</span></div><div class="boss-health-meter"><i style="width:${Math.max(0, Math.min(100, boss.hp / boss.maxHp * 100))}%"></i></div><small>Крепость защищена, пока босс жив</small>`;
    else warning.textContent = state.bossPhase === 'warning' ? `⚑ Подкрепление через ${Math.ceil(state.bossCountdown)} с` : '⚔ Подкрепление на поле';
    translateTree(warning);
    for (const [i, dot] of Array.from(this.root.querySelectorAll('.route i')).entries()) dot.className = i < state.battleIndex ? 'done' : i === state.battleIndex ? 'current' : '';
    const active = state.phase === 'battle' && !state.paused;
    for (const [index, card] of state.cards.entries()) {
      const button = this.root.querySelector<HTMLButtonElement>(`button[data-kind="${card.kind}"]`)!;
      button.disabled = !active || !card.canHire;
      button.setAttribute('aria-label', translate(`${card.name}. ${describe(card.kind)} Цена: ${card.cost} припасов. Клавиша ${index + 1}.`));
      button.title = translate(`${card.name} — клавиша ${index + 1}. ${describe(card.kind)}${!card.canHire ? ' Недостаточно припасов.' : ''}`);
      this.text(`cost-${card.kind}`, String(card.cost));
      this.text(`available-${card.kind}`, card.canHire ? 'Найм' : 'Припасы');
    }
    this.root.querySelector<HTMLButtonElement>('[data-action="income"]')!.setAttribute('aria-label', translate(`Улучшить доход: доход +1 в секунду, цена ${state.incomeUpgradeCost}. Уровень ${state.incomeUpgrades}.`));
    this.root.querySelector<HTMLButtonElement>('[data-action="income"]')!.disabled = !active || state.resource < state.incomeUpgradeCost;
    this.root.classList.toggle('is-paused', state.paused);
    const key = `${state.eraId}:${JSON.stringify(state.unlockedEras)}:${state.phase}:${state.paused}:${state.canContinue}:${state.battleIndex}:${state.rewards.map(r => r.id).join()}:${state.selectedDoctrine}:${state.contractRisk}:${state.contracts.map(c => c.id).join()}:${state.muted}:${state.musicMuted}:${state.platform.online}:${state.platform.sdk}:${state.platform.cloud}:${state.gold}:${JSON.stringify(state.talents)}:${state.globalTalentPoints}:${JSON.stringify(state.globalTalents)}:${state.baseLevel}:${JSON.stringify(state.advertising)}`;
    if (key !== this.modalKey) { this.modalKey = key; this.renderOverlay(state); }
  }
  private renderOverlay(state: GameState) {
    const context = `${this.panel ?? state.phase}:${state.phase === 'preparation' ? this.preparationStep : ''}:${state.paused}`;
    const sameScreen = this.overlayContext === context;
    const scrollTop = sameScreen ? this.overlay.querySelector('.modal')?.scrollTop ?? 0 : 0;
    const oldEraMap = sameScreen && state.phase === 'menu' && this.panel === null
      ? this.overlay.querySelector<HTMLElement>('.era-map') : null;
    const previousButton = sameScreen && document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    const previousAction = previousButton?.dataset.action;
    const previousKind = previousButton?.dataset.kind;
    const previousDoctrine = previousButton?.dataset.doctrine;
    const previousTalent = previousButton?.dataset.talent;
    const previousSlot = previousButton?.dataset.slot;
    const previousEra = previousButton?.dataset.era;
    this.overlayContext = context;
    let content = '';
    if (this.panel === 'talents' || this.panel === 'globalTalents') content = this.talentsHTML(state, this.panel === 'globalTalents');
    else if (this.panel === 'book') content = `<div class="eyebrow">ВОЕННЫЙ АРХИВ</div><h2 id="dialog-title">Книга войск</h2><p class="modal-intro">Справочник бойцов, их ролей, характеристик и условий открытия.</p><div class="book-grid">${this.eraKinds(state).map(kind => `<article class="book-unit"><img src="${portrait(kind)}" alt=""/><div><h3>${UNITS[kind].name}</h3><p>${describe(kind)}</p><small>${uiIcon('supplies')} ${UNITS[kind].cost} · ${UNITS[kind].hp} здоровья · ${UNITS[kind].damage} урона</small><span class="book-unlock">${this.unlockLabel(kind, state)}</span></div></article>`).join('')}</div><div class="book-upgrades"><h3>Усиления похода</h3>${Object.values(UPGRADES).map(u => `<p><b>${esc(u.name)}</b> — ${esc(u.description)}</p>`).join('')}</div>`;
    else if (this.panel === 'records') content = `<div class="result-seal">⚑</div><div class="eyebrow">ЛЕТОПИСЬ ПОХОДОВ</div><h2 id="dialog-title">Твои походы</h2><div class="report-stats"><div><b>${state.records.runs}</b><span>начато походов</span></div><div><b>${state.records.wins}</b><span>побед</span></div><div><b>${state.records.bestBattle} / 4</b><span>лучший этап</span></div><div><b>${state.records.bestTime ? clock(state.records.bestTime) : '—'}</b><span>лучшее время</span></div></div><p class="marks-total">${uiIcon('point')} Знаков победы: ${state.records.marks}</p><p class="modal-intro">Рекорды хранятся в этом браузере. Убийства дают золото эпохи, первый переход в новую эпоху — очко глобальной прокачки.</p>`;
    else if (state.phase === 'preparation') {
      if (this.preparationStep === 'tactics') {
        content = `${state.globalTalentPoints ? '<p class="talent-earned">Доступно очков глобальной прокачки: ' + state.globalTalentPoints + '</p>' : ''}<div class="prep-stage-label">ПОДГОТОВКА · ШАГ 1 ИЗ 2</div><h2 id="dialog-title">Выбери тактику</h2><p class="modal-intro">Тактика действует весь поход. Нажми одну из трёх карточек, чтобы перейти к отряду.</p><div class="doctrines">${state.doctrines.map(d => `<button class="doctrine ${state.selectedDoctrine === d.id ? 'selected' : ''}" data-action="doctrine" data-doctrine="${d.id}" aria-label="Выбрать тактику ${esc(d.name)}: ${esc(d.description)}"><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p><span class="doctrine-choice">Выбрать →</span></button>`).join('')}</div>`;
      } else {
        content = this.rosterHTML(state);
      }
    }
    else if (state.phase === 'contract') content = this.contractHTML(state);
    else if (state.phase === 'menu') content = this.menuHTML(state);
    else if (state.paused && state.phase === 'battle') content = `<div class="result-seal">Ⅱ</div><div class="eyebrow">ПРИКАЗ: ПРИВАЛ</div><h2 id="dialog-title">Бой на паузе</h2><p class="modal-intro">Фронт, припасы и время остановлены.<br/>Твой отряд ждёт возвращения.</p><div class="modal-actions"><button class="primary" data-action="pause">Вернуться в бой →</button><button class="secondary" data-action="talents">Улучшить отряд · ${uiIcon('gold')} ${state.gold}</button><button class="secondary" data-action="main-menu">В главное меню</button><button class="secondary" data-action="start">Начать эпоху заново</button></div><p class="save-note">Поход и заработанное золото сохранятся.<br/>При продолжении текущий бой начнётся заново.</p>`;
    else if (['reward', 'victory', 'defeat'].includes(state.phase)) content = this.battleResultHTML(state);

    const isResult = ['reward', 'victory', 'defeat'].includes(state.phase) && this.panel === null;
    const isBattleReady = state.phase === 'contract' && state.contractRisk !== null && this.panel === null;
    const isMainMenu = state.phase === 'menu' && this.panel === null;
    const isPreparation = state.phase === 'preparation' && this.panel === null;
    const isTalentPanel = this.panel === 'talents' || this.panel === 'globalTalents';
    const talentContinue = isTalentPanel && state.phase === 'defeat'
      ? '<button class="primary" data-action="retry" data-result-primary="true">Повторить бой →</button>'
      : isTalentPanel && state.phase === 'battle' && state.paused
        ? '<button class="primary" data-action="resume-battle" data-result-primary="true">Вернуться в бой →</button>'
        : '';
    const wideModal = isMainMenu || ['reward', 'preparation', 'contract', 'victory', 'defeat'].includes(state.phase)
      || this.panel === 'book' || this.panel === 'talents' || this.panel === 'globalTalents';
    const modalClasses = [wideModal ? 'reward-modal' : '', isMainMenu ? 'menu-modal' : 'has-back',
      isTalentPanel ? 'talents-modal' : '',
      isPreparation ? `preparation-modal ${this.preparationStep}-screen` : '',
      state.phase === 'defeat' && !this.panel ? 'defeat-modal' : '',
      isResult ? `result-modal ${state.phase}-result` : '',
      state.phase === 'battle' && state.paused && !this.panel ? 'pause-modal' : '', isBattleReady ? 'battle-ready-modal' : ''].filter(Boolean).join(' ');
    const backLabel = this.panel ? 'Назад' : isPreparation && this.canReturnToTactics() ? 'Назад к тактике' : state.phase === 'battle' ? 'Назад в бой' : 'Назад в главное меню';
    const backButton = isMainMenu ? '' : `<button class="modal-back" data-action="back">← ${backLabel}</button>`;
    const talentLink = ['contract', 'reward'].includes(state.phase) && this.panel === null
      ? `<button class="talent-link" data-action="talents">Золото: ${state.gold} · Очки эпох: ${state.globalTalentPoints}</button>` : '';
    const platformLabel = cloudLabels[state.platform.cloud];
    const topbar = isMainMenu || isResult ? '' : `<div class="modal-topbar ${isPreparation ? 'prep-topbar' : ''}">${backButton}</div>`;
    const footer = isPreparation || isResult || isBattleReady ? '' : `<div class="modal-platform">${talentLink}${platformLabel}</div>`;
    if (!oldEraMap) this.destroy();
    this.overlay.innerHTML = content ? `<div class="scrim ${isTalentPanel ? 'talents-scrim' : ''} ${isPreparation && this.preparationStep === 'roster' ? 'roster-scrim' : ''} ${talentContinue ? 'talent-continue-scrim' : ''}">${audioControls()}<section class="modal ${modalClasses}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${topbar}${content}${footer}</section>${talentContinue ? `<div class="talent-continue-footer">${talentContinue}</div>` : ''}</div>` : '';
    if (content) {
      const audio = this.overlay.querySelector('.scrim>.audio-controls');
      const audioHost = this.overlay.querySelector('.modal-topbar, .menu-hero-copy, .result-header');
      if (audio && audioHost) audioHost.append(audio);
    }
    if (oldEraMap) {
      // Keep the live slider, including its exact translate and active index.
      // Update only card state while the banner and other menu content change.
      const newEraMap = this.overlay.querySelector<HTMLElement>('.era-map')!;
      for (const card of oldEraMap.querySelectorAll<HTMLButtonElement>('.era-choice')) {
        const updated = newEraMap.querySelector<HTMLButtonElement>(`[data-era="${card.dataset.era}"]`)!;
        card.className = updated.className;
        card.disabled = updated.disabled;
        card.setAttribute('aria-pressed', updated.getAttribute('aria-pressed')!);
        for (const selector of ['.era-card-status', '.era-card-copy']) card.querySelector(selector)!.replaceWith(updated.querySelector(selector)!);
      }
      newEraMap.replaceWith(oldEraMap);
    }
    const eraTrack = this.overlay.querySelector<HTMLElement>('.era-track');
    if (eraTrack && !this.eraSwiper) {
      this.eraSwiper = new Swiper(eraTrack, {
        modules: [Navigation, Pagination, A11y], cssMode: false,
        slidesPerView: 1, spaceBetween: 12, grabCursor: true,
        breakpointsBase: 'container',
        breakpoints: {
          520: { slidesPerView: 2 },
          800: { slidesPerView: 3 },
        },
        initialSlide: ERA_ORDER.indexOf(state.eraId),
        speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
        watchOverflow: true, touchStartPreventDefault: false,
        focusableElements: 'input, select, textarea, video, label',
        navigation: { prevEl: this.overlay.querySelector<HTMLElement>('.era-prev'), nextEl: this.overlay.querySelector<HTMLElement>('.era-next') },
        pagination: { el: this.overlay.querySelector<HTMLElement>('.era-pagination'), clickable: true, bulletElement: 'button' },
        a11y: { scrollOnFocus: false, prevSlideMessage: translate('Предыдущие эпохи'), nextSlideMessage: translate('Следующие эпохи'), firstSlideMessage: translate('Начало карты эпох'), lastSlideMessage: translate('Конец карты эпох'), paginationBulletMessage: translate('Показать группу эпох {{index}}'), slideLabelMessage: translate('Эпоха {{index}} из {{slidesLength}}') }
      });
      eraTrack.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          if (event.key === 'ArrowLeft') this.eraSwiper?.slidePrev(); else this.eraSwiper?.slideNext();
        }
      });
    }
    const pickFooter = this.overlay.querySelector('.roster-screen .pick-footer');
    if (pickFooter) this.overlay.querySelector('.scrim')!.append(pickFooter);
    this.updateSoundControls();
    translateTree(this.overlay);
    const shell = this.root.querySelector('.game-shell')!;
    for (const child of Array.from(shell.children)) if (child !== this.overlay) (child as HTMLElement).inert = Boolean(content);
    if (content) {
      const buttons = Array.from(this.overlay.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const focus = buttons.find(b => previousAction && b.dataset.action === previousAction && b.dataset.kind === previousKind && b.dataset.doctrine === previousDoctrine && b.dataset.talent === previousTalent && b.dataset.slot === previousSlot && b.dataset.era === previousEra) ?? buttons.find(b => b.dataset.resultPrimary)
        ?? buttons.find(b => ['reward', 'continue', 'start', 'begin', 'pause'].includes(b.dataset.action ?? '')) ?? buttons[0];
      focus?.focus({ preventScroll: true });
      const modal = this.overlay.querySelector<HTMLElement>('.modal'); if (modal) modal.scrollTop = scrollTop;
    }
  }
}
