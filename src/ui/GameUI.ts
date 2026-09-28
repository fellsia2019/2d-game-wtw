import { uiIcon } from './icons';
import type { GameApp, GameState, HireKind, UnitKind } from '../core/types';
import { descriptions, portrait, roleOf, eraName } from '../art/catalog';
import { ERA_HIRE_KINDS, UNITS, UPGRADES, UNLOCKS, ERA_BATTLES } from '../data/content';
import type { SoundStatus } from '../view/Sound';
import type { BattleInsets } from '../view/BattleLayout';
import { TALENTS, talentCost, globalTalentCost, baseHealth, baseHealthCost, type TalentId } from '../core/talents';

const esc = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const tacticalTraits: Record<string, string> = { shield: 'Держит фронт', spear: 'Против брони', archer: 'Дальний урон', medic: 'Лечение', raider: 'Быстрый прорыв', thrower: 'Урон по группе', banner: 'Ускоряет союзников', siege: 'Бьёт крепость' };
const describe = (kind: string) => kind.startsWith('stone') || kind.startsWith('bronze') ? UNITS[kind as HireKind].role : (descriptions as Record<string,string>)[roleOf(kind)] ?? 'Особый боец своей эпохи.';
const cardName = (kind: HireKind, name: string) => `<span class="unit-name-full">${esc(name)}</span><span class="unit-name-compact" aria-hidden="true">${esc(({ shield: 'Щит', spear: 'Копьё', banner: 'Знамя' } as Partial<Record<string, string>>)[kind] ?? name)}</span>`;
const clock = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
const countWord = (count: number, one: string, few: string, many: string) => count % 100 >= 11 && count % 100 <= 14 ? many : count % 10 === 1 ? one : count % 10 >= 2 && count % 10 <= 4 ? few : many;
const soundIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="sound-wave" d="M16 8c2 2 2 6 0 8m2-11c4 4 4 10 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="mute-slash" d="M16 9l5 6m0-6l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const soundButton = (extraClass = '') => `<button data-action="mute" class="sound-toggle ${extraClass}" type="button" aria-label="Включить звук" aria-pressed="false" title="Включить звук">${soundIcon}</button>`;

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
  setAudioStatus(status: SoundStatus) { this.audioStatus = status; if (this.state) this.updateSoundControls(); }
  private updateSoundControls() {
    const enabled = !this.state.muted && this.audioStatus === 'ready';
    const label = enabled ? 'Выключить звук' : !this.state.muted && this.audioStatus === 'unavailable' ? 'Повторить включение звука' : 'Включить звук';
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-action="mute"]')) {
      button.classList.toggle('is-on', enabled); button.setAttribute('aria-label', label); button.setAttribute('aria-pressed', String(enabled));
      button.title = label;
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
    const lowerEdges = ['.hud', '.boss-warning'].map(selector => {
      const element = this.root.querySelector<HTMLElement>(selector)!;
      return element.hidden || !element.getClientRects().length ? 0 : element.getBoundingClientRect().bottom - arena.top;
    });
    return { top: Math.max(...lowerEdges) + 10, bottom: Math.max(0, arena.bottom - dockBounds.top) + 20, left: hud.left - arena.left, right: arena.right - hud.right };
  }
  private eraKinds(state: GameState): HireKind[] {
    return ERA_HIRE_KINDS[state.eraId];
  }
  private eraMap(state: GameState) {
    const oldCampaign = state.eraId === 'legacy' || state.eraProgress.legacy > 0;
    return `<div class="era-map" aria-label="Карта эпох">${(['stone','bronze'] as const).map((era,i) => `<button data-action="era" data-era="${era}" class="era-choice ${state.eraId === era ? 'selected' : ''}" aria-pressed="${state.eraId === era}" ${!state.unlockedEras[era] ? 'disabled' : ''}><span class="era-number">0${i+1}</span><b>${eraName(era)}</b><small>${state.eraId === era ? `Выбрана · ${Math.min(4,state.eraProgress[era])} / 4 этапов` : state.unlockedEras[era] ? 'Доступна · выбрать →' : 'Победи вождя каменного века'}</small></button>`).join('')}${oldCampaign ? `<button data-action="era" data-era="legacy" class="era-choice ${state.eraId === 'legacy' ? 'selected' : ''}" aria-pressed="${state.eraId === 'legacy'}"><span class="era-number">★</span><b>Поход наёмников</b><small>Прежняя кампания · доступна для повтора</small></button>` : ''}<p>Следующие эпохи появятся в будущих обновлениях.</p></div>`;
  }
  private menuIntro(state: GameState) {
    if (state.eraId === 'stone') return 'Пройди четыре сражения и одолей вождя эпохи.<br/>Открой бронзовый век с новым войском и тактикой.';
    if (state.eraId === 'bronze') return 'Останови царя Медных ворот в четырёх боях.<br/>Собери новый отряд и освой строй бронзовых воинов.';
    return 'Вернись к прежнему четырёхбойному походу.<br/>Старые рекорды и сохранения остаются доступны.';
  }
  private menuFeaturesHTML(state: GameState) {
    return `<div class="menu-features" aria-label="Разделы игры">
      <button class="menu-feature talent-feature" data-action="talents"><span class="feature-icon" aria-hidden="true">${uiIcon('point')}</span><span class="feature-copy"><b>Дерево талантов</b><small>Золото — эта эпоха, очки — все эпохи</small><em>${state.gold} золота · ${state.globalTalentPoints} очк. эпох</em></span><span class="feature-arrow" aria-hidden="true">→</span></button>
      <button class="menu-feature book-feature" data-action="book"><span class="feature-icon" aria-hidden="true">${uiIcon('book')}</span><span class="feature-copy"><b>Книга наёмников</b><small>Бойцы, роли и условия открытия</small><em>Открыто карт: ${state.unlockedUnits.length} / ${this.eraKinds(state).length}</em></span><span class="feature-arrow" aria-hidden="true">→</span></button>
      <button class="menu-feature records-feature" data-action="records"><span class="feature-icon" aria-hidden="true">${uiIcon('trophy')}</span><span class="feature-copy"><b>Рекорды</b><small>История твоих походов и побед</small><em>${state.records.wins} ${countWord(state.records.wins, 'победа', 'победы', 'побед')} · ${state.records.runs} ${countWord(state.records.runs, 'поход', 'похода', 'походов')}</em></span><span class="feature-arrow" aria-hidden="true">→</span></button>
    </div>`;
  }
  private menuHTML(state: GameState) {
    const kinds = this.eraKinds(state);
    const headline = state.canContinue ? 'Продолжи<br/><em>свой поход</em>' : `Начни поход<br/><em>${eraName(state.eraId)}</em>`;
    const play = state.canContinue
      ? '<button class="hero-play" data-action="continue"><span>▶</span> Продолжить игру →</button>'
      : '<button class="hero-play" data-action="start"><span>▶</span> Играть →</button>';
    return `<div class="menu-hero"><div class="menu-art"><span class="hero-era-tag">${eraName(state.eraId)}</span><img src="${portrait(kinds[1])}" alt=""/><img src="${portrait(kinds[0])}" alt=""/><img src="${portrait(kinds[2])}" alt=""/></div><div class="menu-hero-copy"><div class="eyebrow">АРЕНА НАЁМНИКОВ</div><h2 id="dialog-title">${headline}</h2><p class="modal-intro">${this.menuIntro(state)}</p><div class="menu-hero-actions">${play}${state.canContinue ? '<button class="hero-play hero-new-run" data-action="start">Начать эпоху заново →</button>' : ''}</div></div></div><div class="menu-section-title"><h3>Развитие и история</h3></div>${this.menuFeaturesHTML(state)}<div class="menu-section-title"><h3>Карта эпох</h3></div>${this.eraMap(state)}`;
  }
  private unlockLabel(kind: HireKind, state: GameState) {
    if (state.eraId !== 'legacy') {
      const index = this.eraKinds(state).indexOf(kind);
      return state.unlockedUnits.includes(kind) ? 'Доступен в подготовке' : index === 7 ? 'Одолей босса эпохи' : `Победы эпохи: ${state.eraProgress[state.eraId]} / ${index - 3}`;
    }
    return state.unlockedUnits.includes(kind) ? 'Доступен в подготовке' : `Нужно знаков: ${state.records.marks} / ${UNLOCKS.find(u => u.kind === kind)?.marks ?? 0}`;
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
    return `<div class="eyebrow">${eraName(state.eraId)} · Бой ${state.battleIndex + 1} / 4</div><h2 id="dialog-title">${esc(state.battleName)}</h2><div class="ready-progress" aria-label="Прогресс эпохи">${[0,1,2,3].map(index => `<span class="${index < state.battleIndex ? 'done' : index === state.battleIndex ? 'current' : ''}">${index < state.battleIndex ? '✓' : index + 1}</span>`).join('')}</div><div class="ready-enemies">${this.enemyFormationHTML(battle.roster)}</div><p class="ready-threat">${esc(battle.threat)}</p><div class="ready-contract"><b>${uiIcon('gold')} +${state.eraId === 'bronze' ? 50 : 25} за победу</b></div><div class="ready-actions"><button class="primary" data-action="contract" data-contract="${battle.id}" data-result-primary="true">Начать бой →</button><button class="secondary" data-action="talents">Улучшить отряд · ${uiIcon('gold')} ${state.gold}</button><button class="secondary restart-epoch" data-action="start">Начать эпоху заново</button></div>`;
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
      const condition = state.eraId === 'legacy' ? this.unlockLabel(kind, state) : index === 7 ? 'Победи босса эпохи' : `${index - 3} ${countWord(index - 3, 'победа', 'победы', 'побед')} · ${state.eraProgress[state.eraId]}/${index - 3}`;
      return `<button class="fighter-choice ${selected ? 'is-picked' : ''} ${locked ? 'locked' : ''}" data-action="roster" data-kind="${kind}" aria-pressed="${selected}" ${locked || capacityBlocked ? 'disabled' : ''} aria-label="${esc(UNITS[kind].name)}: ${locked ? esc(condition) : selected ? 'убрать из отряда' : capacityBlocked ? 'сначала убери бойца из отряда' : 'добавить в отряд'}"><span class="fighter-mark">${locked ? uiIcon('lock') : selected ? uiIcon('check') : uiIcon('plus')}</span><img src="${portrait(kind)}" alt=""/><b>${esc(UNITS[kind].name)}</b><span class="fighter-role">${tacticalTraits[roleOf(kind)]}</span><span class="fighter-price">${uiIcon('supplies')} ${UNITS[kind].cost}</span><span class="fighter-state">${locked ? condition : selected ? 'В отряде · убрать' : capacityBlocked ? 'Отряд заполнен' : 'Добавить в отряд'}</span></button>`;
    }).join('');
    return `<div class="prep-stage-label">${eraName(state.eraId)}</div><h2 id="dialog-title">Выбери 4 бойцов</h2><div class="picked-bar"><div><b>Твой отряд · ${this.draft.length}/4</b><span>${full ? 'Чтобы заменить бойца, убери одного' : `Добавь ещё ${4 - this.draft.length}`}</span></div><div class="picked-units">${picked}</div></div><p class="pick-hint">Нажми карточку, чтобы добавить или убрать бойца</p><div class="fighter-grid">${cards}</div><div class="pick-footer"><span>${full ? '' : `Выбрано ${this.draft.length} из 4`}</span><button class="primary" data-action="begin" ${!state.selectedDoctrine || !full ? 'disabled' : ''}>Дальше →</button></div>`;
  }
  private battleResultHTML(state: GameState): string {
    const report = state.report, final = state.phase === 'victory', lost = state.phase === 'defeat';
    const total = ERA_BATTLES[state.eraId].length;
    const status = lost ? 'Поражение' : final ? 'Эпоха пройдена!' : 'Победа!';
    const rewardIcons = { supply: 'supplies', wagon: 'supply', banner: 'attackSpeed', arrows: 'damage', bandages: 'health', contract: 'gold', pikes: 'damage', workshop: 'supply', boots: 'attackSpeed', siegecraft: 'damage', lastReserve: 'health', standard: 'attackSpeed' } as const;
    let content = `<header class="result-header"><span class="result-emblem ${lost ? 'lost' : ''}">${uiIcon(lost ? 'damage' : 'trophy')}</span><div class="eyebrow">${eraName(state.eraId)} · ${final ? `${total} / ${total} боёв` : `Бой ${state.battleIndex + 1} / ${total}`}</div><h2 id="dialog-title">${status}</h2></header><div class="result-summary"><div class="result-gold">${uiIcon('gold')}<b>+${report?.goldEarned ?? 0}</b><span>Золото сохранено</span></div><div><b>${clock(report?.duration ?? 0)}</b><span>Время боя</span></div><div><b>${report?.hires ?? 0}</b><span>Нанято бойцов</span></div></div>`;
    if (lost) {
      content += `<p class="result-hint">Усиль отряд и попробуй снова.</p><div class="result-actions"><button class="primary" data-action="talents" data-result-primary="true">Улучшить отряд ${uiIcon('gold')} ${state.gold}</button><button class="secondary" data-action="retry">Повторить бой →</button></div>`;
    } else if (!final) {
      content += `<h3 class="result-choice-title">Выбери усиление и продолжи →</h3><div class="rewards result-rewards">${state.rewards.map(reward => `<button class="reward-card" data-action="reward" data-reward="${reward.id}"><span class="reward-icon">${uiIcon(rewardIcons[reward.id])}</span><h3>${esc(reward.name)}</h3><p>${esc(reward.description)}</p><span class="take-reward">Взять → бой ${state.battleIndex + 2}</span></button>`).join('')}</div><button class="result-link" data-action="talents">Улучшить отряд · ${uiIcon('gold')} ${state.gold}</button>`;
    } else {
      const next = state.eraId === 'stone' ? 'bronze' : state.eraId === 'legacy' ? 'stone' : null;
      if (next) content += `<div class="result-next-era"><span class="result-next-label">ДАЛЬШЕ</span><h3>${eraName(next)}</h3><div class="result-next-portraits">${ERA_HIRE_KINDS[next].slice(0, 4).map(kind => `<img src="${portrait(kind)}" alt="${esc(UNITS[kind].name)}"/>`).join('')}</div><p>Новая эпоха — новые бойцы</p>${next === 'bronze' ? `<small>${uiIcon('point')} +1 очко за первый переход</small>` : ''}</div><div class="result-actions"><button class="primary" data-action="start-era" data-era="${next}" data-result-primary="true">Перейти в ${next === 'bronze' ? 'бронзовый' : 'каменный'} век →</button></div>`;
      else content += `<div class="result-finished">${uiIcon('trophy')}<h3>Все доступные эпохи пройдены</h3><p>Собери другой отряд и повтори поход.</p></div><div class="result-actions"><button class="primary" data-action="start" data-result-primary="true">Начать эпоху заново →</button></div>`;
    }
    return `${content}<div class="result-bottom"><button class="result-link" data-action="back">В меню</button><button class="secondary restart-epoch" data-action="start">Начать эпоху заново</button>${soundButton()}</div>`;
  }
  private talentsHTML(state: GameState, global = false) {
    const levels = global ? state.globalTalents : state.talents;
    const currency = global ? state.globalTalentPoints : state.gold;
    let cards = (Object.keys(TALENTS) as TalentId[]).map(id => {
      const talent = TALENTS[id], level = levels[id];
      const cost = global ? globalTalentCost(level) : talentCost(level);
      return `<article class="talent-card talent-${id}"><span class="talent-icon">${uiIcon(id)}</span><h3>${talent.name}</h3><span class="talent-level" aria-label="Уровень ${level}">Ур. ${level}</span><div class="talent-stat" aria-label="Текущий бонус +${level * 5}%, следующий +${(level + 1) * 5}%"><strong>+${level * 5}%</strong><span class="talent-arrow" aria-hidden="true">→</span><span class="talent-next">+${(level + 1) * 5}%</span></div><button class="talent-buy" data-action="${global ? 'buy-global-talent' : 'buy-talent'}" data-talent="${id}" ${currency < cost ? 'disabled' : ''} aria-label="Купить ${talent.name}, уровень ${level + 1}, цена ${cost} ${global ? 'очков' : 'золота'}">${uiIcon(global ? 'point' : 'gold')} ${cost}</button></article>`;
    }).join('');
    if (!global) {
      const hp = baseHealth(state.baseLevel), cost = baseHealthCost(state.baseLevel);
      cards += `<article class="talent-card talent-health"><span class="talent-icon">${uiIcon('health')}</span><h3>Здоровье базы</h3><span class="talent-level" aria-label="Уровень ${state.baseLevel}">Ур. ${state.baseLevel}</span><div class="talent-stat" aria-label="Текущее здоровье ${hp} HP, следующее ${hp + 10} HP"><strong>${hp} HP</strong><span class="talent-arrow" aria-hidden="true">→</span><span class="talent-next">${hp + 10} HP</span></div><button class="talent-buy" data-action="buy-base-health" ${state.gold < cost ? 'disabled' : ''} aria-label="Купить здоровье базы, уровень ${state.baseLevel + 1}, цена ${cost} золота">${uiIcon('gold')} ${cost}</button></article>`;
    }
    return `<div class="eyebrow">ДЕРЕВО ТАЛАНТОВ</div><h2 id="dialog-title">${global ? 'Глобальные таланты' : `Таланты · ${eraName(state.eraId)}`}</h2><div class="talent-tabs" role="group" aria-label="Выбор дерева талантов"><button type="button" data-action="talents" class="talent-tab ${!global ? 'is-selected' : ''}" aria-pressed="${!global}">${uiIcon('gold')}<span><b>Таланты эпохи</b><small>За золото · текущая эпоха</small></span></button><button type="button" data-action="global-talents" class="talent-tab ${global ? 'is-selected' : ''}" aria-pressed="${global}">${uiIcon('point')}<span><b>Глобальные таланты</b><small>За очки · все эпохи</small></span></button></div><p class="talent-points">${global ? 'Очки перехода' : 'Золото эпохи'}: ${uiIcon(global ? 'point' : 'gold')} <b>${currency}</b></p><div class="talent-grid">${cards}</div>`;
  }
  private cardsHTML(state: GameState) {
    return state.cards.map((card, i) => `<button class="unit-card ${card.kind}" data-action="hire" data-kind="${card.kind}" aria-label="Нанять: ${esc(card.name)}"><span class="card-key">${i + 1}</span><div class="portrait"><img src="${portrait(card.kind)}" alt=""/></div><div class="card-copy"><span class="role">${tacticalTraits[roleOf(card.kind)]}</span><h3>${cardName(card.kind, card.name)}</h3><p>${describe(card.kind)}</p><div class="card-bottom"><strong class="price">${uiIcon('supplies')} <span data-field="cost-${card.kind}">${card.cost}</span></strong><span data-field="available-${card.kind}" class="availability"></span></div></div></button>`).join('');
  }
  constructor(private root: HTMLElement, app: GameApp) {
    root.innerHTML = `<main class="game-shell">
      <header class="masthead"><div class="brand"><span class="brand-seal">⚔</span><div><b>Арена наёмников</b><span data-field="era">КАМЕННЫЙ ВЕК</span></div></div><div class="campaign"><span class="chapter" data-field="chapter">БОЙ 01 / 04</span><div class="route" aria-label="Маршрут из четырёх боёв"><i></i><span></span><i></i><span></span><i></i><span></span><i></i></div></div><div class="tools"><span class="battle-wallet" title="Золото эпохи · заработано в этом бою">${uiIcon('gold')}<b data-field="gold">0</b></span>${soundButton('icon-button')}<button data-action="pause" class="icon-button" title="Пауза · Escape" data-field="pause">Ⅱ Пауза</button></div></header>
      <section class="battle-panel" aria-label="Бой">
        <div class="battle-heading"><div><span class="eyebrow">БОЙ <span data-field="contract">01</span></span><h1 data-field="battleName">Пепельный тракт</h1></div><div class="timer"><span class="live-dot"></span><span data-field="time">00:00</span></div></div>
        <div class="hud"><div class="fortress-stat ally"><span>Наши</span><strong data-field="allyHp">100 <small>/ 100</small></strong><div class="meter"><i data-field="allyBar"></i></div></div><div class="supply-stat"><span><span class="supply-label">Припасы</span> <b data-field="income">+6 / сек</b></span><strong>${uiIcon('supplies')} <span data-field="resource">0</span></strong></div><div class="fortress-stat enemy"><span>Враг <span class="glyph-status" data-field="glyphStatus" hidden></span></span><strong data-field="enemyHp">100 <small>/ 100</small></strong><div class="meter"><i data-field="enemyBar"></i></div></div></div>
        <div class="arena-wrap"><div id="battle-arena" class="arena"></div><div class="arena-vignette"></div><div class="boss-warning" data-field="bossWarning" role="status" hidden></div><div class="arena-label"><span class="wind-mark">≋</span> <b data-field="arenaName">Пепельный тракт</b> <span>•</span> граница гильдии</div></div>

      </section>
      <section class="recruitment" aria-label="Найм бойцов"><div class="section-title"><h2>Твой отряд</h2><span>Нажми карту, чтобы нанять <span class="keyboard-hint">· клавиши 1–4</span></span></div><div class="recruit-row"><div class="cards">${app.getState().cards.map((card, i) => `<button class="unit-card ${card.kind}" data-action="hire" data-kind="${card.kind}" aria-label="Нанять: ${esc(card.name)}"><span class="card-key">${i + 1}</span><div class="portrait"><img src="${portrait(card.kind)}" alt=""/></div><div class="card-copy"><span class="role">${tacticalTraits[roleOf(card.kind)]}</span><h3>${cardName(card.kind, card.name)}</h3><p>${describe(card.kind)}</p><div class="card-bottom"><strong class="price">${uiIcon('supplies')} <span data-field="cost-${card.kind}">${card.cost}</span></strong><span data-field="available-${card.kind}" class="availability"></span></div></div></button>`).join('')}</div><button class="wagon" data-action="income"><span class="wagon-icon" aria-hidden="true">${uiIcon('supply')}</span><b>Доход<span class="wagon-arrow"> ↑</span></b><span>+1 / сек</span><strong>${uiIcon('supplies')} <span data-field="wagonCost">40</span></strong><small data-field="wagonLevel">Ур. 0</small></button></div></section>
      <footer class="game-footer"><span data-field="platform">Локальная игра · сохранение в браузере</span><span data-field="boons">Четыре боя — одна эпоха</span></footer>
      <div class="overlay-host"></div>
    </main><details class="debug-menu"><summary>Debug · <span data-field="speedLabel">×1</span></summary><div class="debug-controls"><p>Скорость боя</p><div class="debug-speeds" role="group" aria-label="Скорость боя">${[1,2,3,4,5].map(speed => `<button data-action="battle-speed" data-speed="${speed}" aria-pressed="${speed === 1}">×${speed}</button>`).join('')}</div><p class="debug-battle-label">Запустить бой заново</p><div class="debug-speeds debug-battles" role="group" aria-label="Выбор боя">${[1,2,3,4].map(battle => `<button data-action="debug-battle" data-battle="${battle - 1}" aria-pressed="false">${battle}</button>`).join('')}</div><div class="debug-balance"></div><p class="debug-note">Сохраняется в браузере · действует со следующего боя</p><button class="debug-reset" data-action="reset-enemy-balance">Сбросить баланс эпохи</button></div></details>`;
    this.arena = root.querySelector('.arena')!; this.overlay = root.querySelector('.overlay-host')!;
    for (const element of root.querySelectorAll<HTMLElement>('[data-field]')) this.fields.set(element.dataset.field!, element);
  }
  private text(key: string, value: string) { const el = this.fields.get(key); if (el && el.textContent !== value) el.textContent = value; }
  private bar(key: string, value: number) { this.fields.get(key)!.style.width = `${Math.max(0, Math.min(100, value * 100))}%`; }
  update(state: GameState) {
    this.state = state;
    const debug = this.root.querySelector<HTMLElement>('.debug-balance')!;
    const columns = [{ key: 'income', label: 'Доход/с', max: 1000 }, { key: 'startSupplies', label: 'Старт', max: 10000 }, { key: 'hpBonus', label: 'HP +%', max: 1000 }, { key: 'damageBonus', label: 'Урон +%', max: 1000 }] as const;
    if (this.debugEra !== state.eraId) {
      this.debugEra = state.eraId;
      debug.innerHTML = `<table><caption>Враг · ${eraName(state.eraId)}</caption><thead><tr><th>Бой</th>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead><tbody>${state.debugEnemyBalance.map((_, index) => `<tr data-debug-row="${index}"><th title="${esc(ERA_BATTLES[state.eraId][index].name)}">${index + 1}</th>${columns.map(c => `<td><input type="number" min="0" max="${c.max}" step="1" data-debug-param="${c.key}" aria-label="Бой ${index + 1}: ${c.label}"/></td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    for (const input of debug.querySelectorAll<HTMLInputElement>('[data-debug-param]')) {
      if (document.activeElement === input) continue;
      const index = Number(input.closest<HTMLElement>('[data-debug-row]')!.dataset.debugRow);
      input.value = String(state.debugEnemyBalance[index][input.dataset.debugParam as typeof columns[number]['key']]);
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-action="debug-battle"]')) {
      const index = Number(button.dataset.battle);
      button.setAttribute('aria-pressed', String(index === state.battleIndex));
      button.title = ERA_BATTLES[state.eraId][index].name;
    }
    this.text('speedLabel', `×${state.battleSpeed}`);
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-action="battle-speed"]')) button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === state.battleSpeed));
    if (state.phase === 'preparation' && this.previousPhase !== 'preparation') { this.draft = [...state.roster]; this.preparationStep = state.selectedDoctrine ? 'roster' : 'tactics'; this.visitedTactics = false; }
    this.previousPhase = state.phase;
    const cardsKey = state.eraId + state.cards.map(card => card.kind).join();
    if (cardsKey !== this.cardKey) {
      this.cardKey = cardsKey; this.root.querySelector('.cards')!.innerHTML = this.cardsHTML(state);
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
    this.text('pause', state.paused ? '▶ Продолжить' : 'Ⅱ Пауза');
    this.text('wagonCost', String(state.incomeUpgradeCost)); this.text('wagonLevel', `Ур. ${state.incomeUpgrades}`);
    this.text('boons', state.chosenUpgrades.length ? state.chosenUpgrades.map(id => UPGRADES[id].name).join(' · ') : 'Четыре боя — одна эпоха');
    this.text('arenaName', state.eraId !== 'legacy' ? `${eraName(state.eraId)} · ${state.battleName}` : ({ ash: 'Пепельный тракт', iron: 'Железная переправа', arrows: 'Северный перевал', citadel: 'Цитадель Коменданта' } as Record<string, string>)[state.arenaId] ?? 'Пепельный тракт');
    this.text('platform', !state.platform.online ? 'Нет сети · локальный прогресс' : state.platform.sdk === 'available' ? 'Яндекс Игры · подключено' : state.platform.sdk === 'loading' ? 'Подключение платформы…' : 'Локальная игра · сохранение в браузере');
    const glyph = this.fields.get('glyphStatus')!;
    glyph.hidden = state.enemyGlyphRemaining <= 0;
    glyph.textContent = `Глиф · ${Math.ceil(state.enemyGlyphRemaining)} с`;
    this.root.querySelector('.fortress-stat.enemy')!.classList.toggle('has-glyph', state.enemyGlyphRemaining > 0);
    const warning = this.fields.get('bossWarning')!;
    warning.hidden = state.bossPhase !== 'warning' && state.bossPhase !== 'assault';
    const boss = state.units.find(unit => unit.team === 'enemy' && (unit.kind === 'stoneChief' || unit.kind === 'bronzeKing') && unit.hp > 0);
    warning.classList.toggle('boss-health', Boolean(boss));
    if (boss) warning.innerHTML = `<div class="boss-health-title"><b>${esc(UNITS[boss.kind].name)}</b><span>${Math.ceil(boss.hp)} / ${boss.maxHp}</span></div><div class="boss-health-meter"><i style="width:${Math.max(0, Math.min(100, boss.hp / boss.maxHp * 100))}%"></i></div><small>Крепость защищена, пока босс жив</small>`;
    else warning.textContent = state.bossPhase === 'warning' ? `⚑ Подкрепление через ${Math.ceil(state.bossCountdown)} с` : '⚔ Подкрепление на поле';
    for (const [i, dot] of Array.from(this.root.querySelectorAll('.route i')).entries()) dot.className = i < state.battleIndex ? 'done' : i === state.battleIndex ? 'current' : '';
    const active = state.phase === 'battle' && !state.paused;
    for (const card of state.cards) {
      const button = this.root.querySelector<HTMLButtonElement>(`button[data-kind="${card.kind}"]`)!;
      button.disabled = !active || !card.canHire;
      button.setAttribute('aria-label', `${card.name}. ${describe(card.kind)} Цена: ${card.cost} припасов.`);
      button.title = `${card.name} — ${describe(card.kind)}${!card.canHire ? ' Недостаточно припасов.' : ''}`;
      this.text(`cost-${card.kind}`, String(card.cost));
      this.text(`available-${card.kind}`, card.canHire ? 'Найм' : 'Припасы');
    }
    this.root.querySelector<HTMLButtonElement>('[data-action="income"]')!.setAttribute('aria-label', `Улучшить доход: доход +1 в секунду, цена ${state.incomeUpgradeCost}. Уровень ${state.incomeUpgrades}.`);
    this.root.querySelector<HTMLButtonElement>('[data-action="income"]')!.disabled = !active || state.resource < state.incomeUpgradeCost;
    this.root.classList.toggle('is-paused', state.paused);
    const key = `${state.eraId}:${JSON.stringify(state.unlockedEras)}:${state.phase}:${state.paused}:${state.canContinue}:${state.battleIndex}:${state.rewards.map(r => r.id).join()}:${state.selectedDoctrine}:${state.contractRisk}:${state.contracts.map(c => c.id).join()}:${state.muted}:${state.platform.online}:${state.platform.sdk}:${state.gold}:${JSON.stringify(state.talents)}:${state.globalTalentPoints}:${JSON.stringify(state.globalTalents)}:${state.baseLevel}`;
    if (key !== this.modalKey) { this.modalKey = key; this.renderOverlay(state); }
  }
  private renderOverlay(state: GameState) {
    const context = `${this.panel ?? state.phase}:${state.phase === 'preparation' ? this.preparationStep : ''}:${state.paused}`;
    const sameScreen = this.overlayContext === context;
    const scrollTop = sameScreen ? this.overlay.querySelector('.modal')?.scrollTop ?? 0 : 0;
    const previousButton = sameScreen && document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    const previousAction = previousButton?.dataset.action;
    const previousKind = previousButton?.dataset.kind;
    const previousDoctrine = previousButton?.dataset.doctrine;
    const previousTalent = previousButton?.dataset.talent;
    const previousSlot = previousButton?.dataset.slot;
    this.overlayContext = context;
    let content = '';
    if (this.panel === 'talents' || this.panel === 'globalTalents') content = this.talentsHTML(state, this.panel === 'globalTalents');
    else if (this.panel === 'book') content = `<div class="eyebrow">АРХИВ ГИЛЬДИИ</div><h2 id="dialog-title">Книга наёмников</h2><p class="modal-intro">Справочник бойцов, их ролей, характеристик и условий открытия.</p><div class="book-grid">${this.eraKinds(state).map(kind => `<article class="book-unit"><img src="${portrait(kind)}" alt=""/><div><h3>${UNITS[kind].name}</h3><p>${describe(kind)}</p><small>${uiIcon('supplies')} ${UNITS[kind].cost} · ${UNITS[kind].hp} здоровья · ${UNITS[kind].damage} урона</small><span class="book-unlock">${this.unlockLabel(kind, state)}</span></div></article>`).join('')}</div><div class="book-upgrades"><h3>Усиления похода</h3>${Object.values(UPGRADES).map(u => `<p><b>${esc(u.name)}</b> — ${esc(u.description)}</p>`).join('')}</div>`;
    else if (this.panel === 'records') content = `<div class="result-seal">⚑</div><div class="eyebrow">ЛЕТОПИСЬ ГИЛЬДИИ</div><h2 id="dialog-title">Твои походы</h2><div class="report-stats"><div><b>${state.records.runs}</b><span>начато походов</span></div><div><b>${state.records.wins}</b><span>побед</span></div><div><b>${state.records.bestBattle} / 4</b><span>лучший этап</span></div><div><b>${state.records.bestTime ? clock(state.records.bestTime) : '—'}</b><span>лучшее время</span></div></div><p class="marks-total">${uiIcon('point')} Знаков контракта: ${state.records.marks}</p><p class="modal-intro">Рекорды хранятся в этом браузере. Убийства дают золото эпохи, первый переход в новую эпоху — очко глобальной прокачки.</p>`;
    else if (state.phase === 'preparation') {
      if (this.preparationStep === 'tactics') {
        content = `${state.globalTalentPoints ? '<p class="talent-earned">Доступно очков глобальной прокачки: ' + state.globalTalentPoints + '</p>' : ''}<div class="prep-stage-label">ПОДГОТОВКА · ШАГ 1 ИЗ 2</div><h2 id="dialog-title">Выбери тактику</h2><p class="modal-intro">Тактика действует весь поход. Нажми одну из трёх карточек, чтобы перейти к отряду.</p><div class="doctrines">${state.doctrines.map(d => `<button class="doctrine ${state.selectedDoctrine === d.id ? 'selected' : ''}" data-action="doctrine" data-doctrine="${d.id}" aria-label="Выбрать тактику ${esc(d.name)}: ${esc(d.description)}"><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p><span class="doctrine-choice">Выбрать →</span></button>`).join('')}</div>`;
      } else {
        content = this.rosterHTML(state);
      }
    }
    else if (state.phase === 'contract') content = this.contractHTML(state);
    else if (state.phase === 'menu') content = this.menuHTML(state);
    else if (state.paused && state.phase === 'battle') content = `<div class="result-seal">Ⅱ</div><div class="eyebrow">ПРИКАЗ: ПРИВАЛ</div><h2 id="dialog-title">Бой на паузе</h2><p class="modal-intro">Фронт, припасы и время остановлены.<br/>Твой отряд ждёт возвращения.</p><div class="modal-actions"><button class="primary" data-action="pause">Вернуться в бой →</button><button class="secondary" data-action="start">Начать эпоху заново</button></div>`;
    else if (['reward', 'victory', 'defeat'].includes(state.phase)) content = this.battleResultHTML(state);

    const isResult = ['reward', 'victory', 'defeat'].includes(state.phase) && this.panel === null;
    const isBattleReady = state.phase === 'contract' && state.contractRisk !== null && this.panel === null;
    const isMainMenu = state.phase === 'menu' && this.panel === null;
    const isPreparation = state.phase === 'preparation' && this.panel === null;
    const wideModal = isMainMenu || ['reward', 'preparation', 'contract', 'victory', 'defeat'].includes(state.phase)
      || this.panel === 'book' || this.panel === 'talents' || this.panel === 'globalTalents';
    const modalClasses = [wideModal ? 'reward-modal' : '', isMainMenu ? 'menu-modal' : 'has-back',
      isPreparation ? `preparation-modal ${this.preparationStep}-screen` : '',
      state.phase === 'defeat' && !this.panel ? 'defeat-modal' : '',
      isResult ? `result-modal ${state.phase}-result` : '', isBattleReady ? 'battle-ready-modal' : ''].filter(Boolean).join(' ');
    const backLabel = this.panel ? 'Назад' : isPreparation && this.canReturnToTactics() ? 'Назад к тактике' : state.phase === 'battle' ? 'Назад в бой' : 'Назад в главное меню';
    const backButton = isMainMenu ? '' : `<button class="modal-back" data-action="back">← ${backLabel}</button>`;
    const talentLink = ['contract', 'reward'].includes(state.phase) && this.panel === null
      ? `<button class="talent-link" data-action="talents">Золото: ${state.gold} · Очки эпох: ${state.globalTalentPoints}</button>` : '';
    const platformLabel = !state.platform.online ? 'Нет сети · игра продолжается локально'
      : state.platform.sdk === 'available' ? 'SDK Яндекс Игр подключён · сохранение пока локально' : 'Локальный режим · прогресс в этом браузере';
    const topbar = isMainMenu || isResult ? '' : `<div class="modal-topbar ${isPreparation ? 'prep-topbar' : ''}">${backButton}${isPreparation ? soundButton() : ''}</div>`;
    const footer = isPreparation || isResult || isBattleReady ? '' : `<div class="modal-platform">${talentLink}${platformLabel}${soundButton()}</div>`;
    this.overlay.innerHTML = content ? `<div class="scrim"><section class="modal ${modalClasses}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${topbar}${content}${footer}</section></div>` : '';
    this.updateSoundControls();
    const shell = this.root.querySelector('.game-shell')!;
    for (const child of Array.from(shell.children)) if (child !== this.overlay) (child as HTMLElement).inert = Boolean(content);
    if (content) {
      const buttons = Array.from(this.overlay.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const focus = buttons.find(b => previousAction && b.dataset.action === previousAction && b.dataset.kind === previousKind && b.dataset.doctrine === previousDoctrine && b.dataset.talent === previousTalent && b.dataset.slot === previousSlot) ?? buttons.find(b => b.dataset.resultPrimary) ?? buttons[0];
      focus?.focus({ preventScroll: true });
      const modal = this.overlay.querySelector<HTMLElement>('.modal'); if (modal) modal.scrollTop = scrollTop;
    }
  }
}
