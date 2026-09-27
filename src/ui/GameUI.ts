import type { GameApp, GameState, HireKind } from '../core/types';
import { descriptions, rewardIcons, portrait, roleOf, eraName } from '../art/catalog';
import { ERA_HIRE_KINDS, UNITS, UPGRADES, UNLOCKS, ERA_BATTLES } from '../data/content';
import type { SoundStatus } from '../view/Sound';
import type { BattleInsets } from '../view/BattleLayout';
import { MAX_TALENT_LEVEL, TALENTS, talentCost, type TalentId } from '../core/talents';

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
  private panel: 'book' | 'records' | 'talents' | null = null;
  private cardKey = '';
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
    return Array.from(this.root.querySelectorAll<HTMLElement>('.arena,.hud,.recruitment,.battle-status,.threat,.boss-warning'));
  }
  battleInsets(): BattleInsets {
    const shell = this.root.querySelector<HTMLElement>('.game-shell')!;
    const dock = this.root.querySelector<HTMLElement>('.recruitment')!;
    shell.style.setProperty('--dock-height', `${dock.getBoundingClientRect().height}px`);
    const arena = this.arena.getBoundingClientRect();
    const hud = this.root.querySelector<HTMLElement>('.hud')!.getBoundingClientRect();
    const status = this.root.querySelector<HTMLElement>('.battle-status')!.getBoundingClientRect();
    const lowerEdges = ['.hud', '.threat', '.boss-warning'].map(selector => {
      const element = this.root.querySelector<HTMLElement>(selector)!;
      return element.hidden || !element.getClientRects().length ? 0 : element.getBoundingClientRect().bottom - arena.top;
    });
    return { top: Math.max(...lowerEdges) + 10, bottom: Math.max(0, arena.bottom - status.top) + 20, left: hud.left - arena.left, right: arena.right - hud.right };
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
      <button class="menu-feature talent-feature" data-action="talents"><span class="feature-icon" aria-hidden="true">✦</span><span class="feature-copy"><b>Дерево талантов</b><small>Усиливай всех бойцов во всех эпохах</small><em>${state.talentPoints ? `${state.talentPoints} очк. для прокачки` : 'Открывай навыки за победы'}</em></span><span class="feature-arrow" aria-hidden="true">→</span></button>
      <button class="menu-feature book-feature" data-action="book"><span class="feature-icon" aria-hidden="true">▦</span><span class="feature-copy"><b>Книга наёмников</b><small>Бойцы, роли и условия открытия</small><em>Открыто карт: ${state.unlockedUnits.length} / ${this.eraKinds(state).length}</em></span><span class="feature-arrow" aria-hidden="true">→</span></button>
      <button class="menu-feature records-feature" data-action="records"><span class="feature-icon" aria-hidden="true">★</span><span class="feature-copy"><b>Рекорды</b><small>История твоих походов и побед</small><em>${state.records.wins} ${countWord(state.records.wins, 'победа', 'победы', 'побед')} · ${state.records.runs} ${countWord(state.records.runs, 'поход', 'похода', 'походов')}</em></span><span class="feature-arrow" aria-hidden="true">→</span></button>
    </div>`;
  }
  private menuHTML(state: GameState) {
    const kinds = this.eraKinds(state);
    const headline = state.canContinue ? 'Продолжи<br/><em>свой поход</em>' : `Начни поход<br/><em>${eraName(state.eraId)}</em>`;
    const play = state.canContinue
      ? '<button class="hero-play" data-action="continue"><span>▶</span> Продолжить игру →</button>'
      : '<button class="hero-play" data-action="start"><span>▶</span> Играть →</button>';
    return `<div class="menu-hero"><div class="menu-art"><span class="hero-era-tag">${eraName(state.eraId)}</span><img src="${portrait(kinds[1])}" alt=""/><img src="${portrait(kinds[0])}" alt=""/><img src="${portrait(kinds[2])}" alt=""/></div><div class="menu-hero-copy"><div class="eyebrow">АРЕНА НАЁМНИКОВ</div><h2 id="dialog-title">${headline}</h2><p class="modal-intro">${this.menuIntro(state)}</p><div class="menu-hero-actions">${play}${state.canContinue ? '<button class="hero-play hero-new-run" data-action="start">Начать новый поход →</button>' : ''}</div></div></div><div class="menu-section-title"><h3>Развитие и история</h3></div>${this.menuFeaturesHTML(state)}<div class="menu-section-title"><h3>Карта эпох</h3></div>${this.eraMap(state)}`;
  }
  private unlockLabel(kind: HireKind, state: GameState) {
    if (state.eraId !== 'legacy') {
      const index = this.eraKinds(state).indexOf(kind);
      return state.unlockedUnits.includes(kind) ? 'Доступен в подготовке' : index === 6 ? 'Победи в рискованном контракте этой эпохи' : index === 7 ? 'Одолей босса эпохи' : `Победы эпохи: ${state.eraProgress[state.eraId]} / ${index - 3}`;
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
    if (this.draft.includes(kind)) this.draft = this.draft.filter(k => k !== kind);
    else if (this.draft.length < 4) this.draft.push(kind);
    this.renderOverlay(this.state);
  }
  openPanel(panel: 'book' | 'records' | 'talents' | null) { this.panel = panel; this.renderOverlay(this.state); }
  closePanel(): boolean {
    if (!this.panel) return false;
    this.openPanel(null);
    return true;
  }
  private talentsHTML(state: GameState) {
    const cards = (Object.keys(TALENTS) as TalentId[]).map(id => {
      const talent = TALENTS[id], level = state.talents[id], cost = talentCost(level);
      const maxed = level >= MAX_TALENT_LEVEL;
      const ranks = Array.from({ length: MAX_TALENT_LEVEL }, (_, i) => `<i class="${i < level ? 'filled' : ''}"></i>`).join('');
      return `<article class="talent-card"><span class="talent-icon">${talent.icon}</span><h3>${talent.name}</h3><p>${talent.effect}</p><div class="talent-level" aria-label="Уровень ${level} из ${MAX_TALENT_LEVEL}">${ranks}</div><strong>+${level * 5}% · ${level} / ${MAX_TALENT_LEVEL}</strong><button data-action="buy-talent" data-talent="${id}" ${maxed || state.talentPoints < cost ? 'disabled' : ''}>${maxed ? 'Изучено полностью' : `Улучшить до +${(level + 1) * 5}% · ${cost} очк.`}</button></article>`;
    }).join('');
    return `<div class="eyebrow">ПОСТОЯННАЯ ПРОКАЧКА</div><h2 id="dialog-title">Дерево талантов</h2><p class="modal-intro">За победу в бою ты получаешь 1 очко, за босса — 2. Повторные походы тоже приносят очки. Бонусы действуют во всех эпохах.</p><p class="talent-points">Доступно очков: <b>${state.talentPoints}</b></p><div class="talent-grid">${cards}</div><p class="save-note">Каждый следующий ранг стоит на одно очко больше. Максимум +25% в каждой ветке.</p>`;
  }
  private cardsHTML(state: GameState) {
    return state.cards.map((card, i) => `<button class="unit-card ${card.kind}" data-action="hire" data-kind="${card.kind}" aria-label="Нанять: ${esc(card.name)}"><span class="card-key">${i + 1}</span><div class="portrait"><img src="${portrait(card.kind)}" alt=""/></div><div class="card-copy"><span class="role">${tacticalTraits[roleOf(card.kind)]}</span><h3>${cardName(card.kind, card.name)}</h3><p>${describe(card.kind)}</p><div class="card-bottom"><strong class="price">◆ <span data-field="cost-${card.kind}">${card.cost}</span></strong><span data-field="available-${card.kind}" class="availability"></span></div></div></button>`).join('');
  }
  constructor(private root: HTMLElement, app: GameApp) {
    root.innerHTML = `<main class="game-shell">
      <header class="masthead"><div class="brand"><span class="brand-seal">⚔</span><div><b>Арена наёмников</b><span data-field="era">КАМЕННЫЙ ВЕК</span></div></div><div class="campaign"><span class="chapter" data-field="chapter">БОЙ 01 / 04</span><div class="route" aria-label="Маршрут из четырёх боёв"><i></i><span></span><i></i><span></span><i></i><span></span><i></i></div></div><div class="tools">${soundButton('icon-button')}<button data-action="pause" class="icon-button" title="Пауза · Escape" data-field="pause">Ⅱ Пауза</button></div></header>
      <section class="battle-panel" aria-label="Бой">
        <div class="battle-heading"><div><span class="eyebrow">КОНТРАКТ <span data-field="contract">01</span></span><h1 data-field="battleName">Пепельный тракт</h1></div><div class="timer"><span class="live-dot"></span><span data-field="time">00:00</span></div></div>
        <div class="hud"><div class="fortress-stat ally"><span>Наши</span><strong data-field="allyHp">100 <small>/ 100</small></strong><div class="meter"><i data-field="allyBar"></i></div></div><div class="supply-stat"><span><span class="supply-label">Припасы</span> <b data-field="income">+6 / сек</b></span><strong><span class="resource-icon">◆</span> <span data-field="resource">0</span><small data-field="resourceMax">/ 100</small></strong><div class="meter"><i data-field="resourceBar"></i></div></div><div class="fortress-stat enemy"><span>Враг</span><strong data-field="enemyHp">100 <small>/ 100</small></strong><div class="meter"><i data-field="enemyBar"></i></div></div></div>
        <div class="arena-wrap"><div id="battle-arena" class="arena"></div><div class="arena-vignette"></div><div class="boss-warning" data-field="bossWarning" role="status" hidden></div><div class="arena-label"><span class="wind-mark">≋</span> <b data-field="arenaName">Пепельный тракт</b> <span>•</span> граница гильдии</div><div class="threat"><span>РАЗВЕДКА</span><b class="threat-full" data-field="threat"></b><b class="threat-compact" data-field="threatCompact"></b></div></div>
        <div class="battle-status"><span data-field="hint">Найми щитоносца, чтобы удержать переднюю линию.</span><span class="army"><span class="ally-dot">◆</span> Отряд <b data-field="army">0 / 12</b></span></div>
      </section>
      <section class="recruitment" aria-label="Найм бойцов"><div class="section-title"><h2>Твой отряд</h2><span>Нажми карту, чтобы нанять <span class="keyboard-hint">· клавиши 1–4</span></span></div><div class="recruit-row"><div class="cards">${app.getState().cards.map((card, i) => `<button class="unit-card ${card.kind}" data-action="hire" data-kind="${card.kind}" aria-label="Нанять: ${esc(card.name)}"><span class="card-key">${i + 1}</span><div class="portrait"><img src="${portrait(card.kind)}" alt=""/></div><div class="card-copy"><span class="role">${tacticalTraits[roleOf(card.kind)]}</span><h3>${cardName(card.kind, card.name)}</h3><p>${describe(card.kind)}</p><div class="card-bottom"><strong class="price">◆ <span data-field="cost-${card.kind}">${card.cost}</span></strong><span data-field="available-${card.kind}" class="availability"></span></div></div></button>`).join('')}</div><button class="wagon" data-action="income"><span class="wagon-icon" aria-hidden="true">♜</span><b>Обоз<span class="wagon-arrow"> ↑</span></b><span>+1 / сек</span><strong data-field="wagonCost">◆ 40</strong><small data-field="wagonLevel">0 / 2 улучшений</small></button></div></section>
      <footer class="game-footer"><span data-field="platform">Локальная игра · сохранение в браузере</span><span data-field="boons">Четыре боя — один контракт</span></footer>
      <div class="overlay-host"></div>
    </main>`;
    this.arena = root.querySelector('.arena')!; this.overlay = root.querySelector('.overlay-host')!;
    for (const element of root.querySelectorAll<HTMLElement>('[data-field]')) this.fields.set(element.dataset.field!, element);
  }
  private text(key: string, value: string) { const el = this.fields.get(key); if (el && el.textContent !== value) el.textContent = value; }
  private bar(key: string, value: number) { this.fields.get(key)!.style.width = `${Math.max(0, Math.min(100, value * 100))}%`; }
  update(state: GameState) {
    this.state = state;
    if (state.phase === 'preparation' && this.previousPhase !== 'preparation') { this.draft = [...state.roster]; this.preparationStep = state.selectedDoctrine ? 'roster' : 'tactics'; this.visitedTactics = false; }
    this.previousPhase = state.phase;
    const cardsKey = state.eraId + state.cards.map(card => card.kind).join();
    if (cardsKey !== this.cardKey) {
      this.cardKey = cardsKey; this.root.querySelector('.cards')!.innerHTML = this.cardsHTML(state);
      for (const element of this.root.querySelectorAll<HTMLElement>('.cards [data-field]')) this.fields.set(element.dataset.field!, element);
    }
    this.text('era', eraName(state.eraId));
    this.text('chapter', `БОЙ ${String(state.battleIndex + 1).padStart(2, '0')} / 04`); this.text('contract', String(state.battleIndex + 1).padStart(2, '0'));
    this.text('battleName', state.battleName); this.text('threat', `${state.threat} · доход врага +${state.enemyIncome}/с`); this.text('time', clock(state.elapsed));
    this.text('allyHp', `${Math.ceil(state.allyFortressHp)} / ${state.fortressMaxHp}`); this.text('enemyHp', `${Math.ceil(state.enemyFortressHp)} / ${state.fortressMaxHp}`);
    this.text('threatCompact', `${state.eraId !== 'legacy' ? state.threat : ({ ash: 'Налётчики', iron: 'Латники · броня', arrows: 'Стрелки + латники', citadel: 'Волна при 50% HP' } as Record<string, string>)[state.arenaId] ?? 'Враг'} · враг +${state.enemyIncome}/с`);
    this.text('resource', String(Math.floor(state.resource))); this.text('resourceMax', `/ ${state.resourceMax}`); this.text('income', `+${state.income.toFixed(1)} / сек`); this.text('army', `${state.allyCount} / ${state.allyLimit}`);
    this.bar('allyBar', state.allyFortressHp / state.fortressMaxHp); this.bar('enemyBar', state.enemyFortressHp / state.fortressMaxHp); this.bar('resourceBar', state.resource / state.resourceMax);
    this.updateSoundControls();
    (this.fields.get('pause') as HTMLButtonElement).disabled = state.phase !== 'battle';
    this.text('pause', state.paused ? '▶ Продолжить' : 'Ⅱ Пауза');
    this.root.querySelector('[data-action="income"]')!.classList.toggle('is-maxed', state.incomeUpgrades >= 2);
    this.text('wagonCost', state.incomeUpgrades >= 2 ? 'Готово' : `◆ ${state.incomeUpgradeCost}`); this.text('wagonLevel', `${state.incomeUpgrades} / 2`);
    this.text('boons', state.chosenUpgrades.length ? state.chosenUpgrades.map(id => UPGRADES[id].name).join(' · ') : 'Четыре боя — один контракт');
    this.text('arenaName', state.eraId !== 'legacy' ? `${eraName(state.eraId)} · ${state.battleName}` : ({ ash: 'Пепельный тракт', iron: 'Железная переправа', arrows: 'Северный перевал', citadel: 'Цитадель Коменданта' } as Record<string, string>)[state.arenaId] ?? 'Пепельный тракт');
    this.text('platform', !state.platform.online ? 'Нет сети · локальный прогресс' : state.platform.sdk === 'available' ? 'Яндекс Игры · подключено' : state.platform.sdk === 'loading' ? 'Подключение платформы…' : 'Локальная игра · сохранение в браузере');
    const warning = this.fields.get('bossWarning')!;
    warning.hidden = state.bossPhase !== 'warning' && state.bossPhase !== 'assault';
    this.root.querySelector<HTMLElement>('.threat')!.hidden = !warning.hidden;
    warning.textContent = state.bossPhase === 'warning' ? `⚑ Подкрепление через ${Math.ceil(state.bossCountdown)} с` : '⚔ Подкрепление на поле';
    for (const [i, dot] of Array.from(this.root.querySelectorAll('.route i')).entries()) dot.className = i < state.battleIndex ? 'done' : i === state.battleIndex ? 'current' : '';
    const active = state.phase === 'battle' && !state.paused;
    for (const card of state.cards) {
      const button = this.root.querySelector<HTMLButtonElement>(`button[data-kind="${card.kind}"]`)!;
      button.disabled = !active || !card.canHire;
      button.setAttribute('aria-label', `${card.name}. ${describe(card.kind)} Цена: ${card.cost} припасов.`);
      button.title = `${card.name} — ${describe(card.kind)}${state.allyCount >= state.allyLimit ? ' Отряд полон.' : !card.canHire ? ' Недостаточно припасов.' : ''}`;
      const wait = Math.max(0, Math.ceil((card.cost - state.resource) / state.income));
      this.text(`cost-${card.kind}`, String(card.cost));
      this.text(`available-${card.kind}`, state.allyCount >= state.allyLimit ? 'Лимит' : card.canHire ? 'Найм' : wait > 0 ? `${wait} с` : '');
      button.style.setProperty('--charge', `${Math.min(100, state.resource / card.cost * 100)}%`);
    }
    this.root.querySelector<HTMLButtonElement>('[data-action="income"]')!.setAttribute('aria-label', `Улучшить обоз: доход +1 в секунду, цена ${state.incomeUpgradeCost}. Куплено ${state.incomeUpgrades} из 2.`);
    this.root.querySelector<HTMLButtonElement>('[data-action="income"]')!.disabled = !active || state.incomeUpgrades >= 2 || state.resource < state.incomeUpgradeCost;
    const armor = state.units.some(u => u.team === 'enemy' && roleOf(u.kind) === 'bulwark');
    const hint = !state.platform.online ? 'Нет сети · локально' : state.allyCount >= state.allyLimit ? 'Отряд полон' : state.allyFortressHp < state.fortressMaxHp * .3 ? 'Ворота под угрозой!' : armor ? 'У врага броня' : state.allyCount === 0 ? 'Отряд пуст' : state.roster.some(kind => roleOf(kind) === 'medic') && state.units.some(u => u.team === 'ally' && u.hp < u.maxHp * .65) ? 'Есть раненые' : '';
    this.text('hint', hint);
    this.root.classList.toggle('is-paused', state.paused);
    const key = `${state.eraId}:${JSON.stringify(state.unlockedEras)}:${state.phase}:${state.paused}:${state.canContinue}:${state.battleIndex}:${state.rewards.map(r => r.id).join()}:${state.selectedDoctrine}:${state.contracts.map(c => c.id).join()}:${state.muted}:${state.platform.online}:${state.platform.sdk}:${state.talentPoints}:${JSON.stringify(state.talents)}`;
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
    this.overlayContext = context;
    let content = '';
    if (this.panel === 'talents') content = this.talentsHTML(state);
    else if (this.panel === 'book') content = `<div class="eyebrow">АРХИВ ГИЛЬДИИ</div><h2 id="dialog-title">Книга наёмников</h2><p class="modal-intro">Справочник бойцов, их ролей, характеристик и условий открытия.</p><div class="book-grid">${this.eraKinds(state).map(kind => `<article class="book-unit"><img src="${portrait(kind)}" alt=""/><div><h3>${UNITS[kind].name}</h3><p>${describe(kind)}</p><small>◆ ${UNITS[kind].cost} · ${UNITS[kind].hp} здоровья · ${UNITS[kind].damage} урона</small><span class="book-unlock">${this.unlockLabel(kind, state)}</span></div></article>`).join('')}</div><div class="book-upgrades"><h3>Усиления похода</h3>${Object.values(UPGRADES).map(u => `<p><b>${esc(u.name)}</b> — ${esc(u.description)}</p>`).join('')}</div>`;
    else if (this.panel === 'records') content = `<div class="result-seal">⚑</div><div class="eyebrow">ЛЕТОПИСЬ ГИЛЬДИИ</div><h2 id="dialog-title">Твои походы</h2><div class="report-stats"><div><b>${state.records.runs}</b><span>начато походов</span></div><div><b>${state.records.wins}</b><span>побед</span></div><div><b>${state.records.bestBattle} / 4</b><span>лучший этап</span></div><div><b>${state.records.bestTime ? clock(state.records.bestTime) : '—'}</b><span>лучшее время</span></div></div><p class="marks-total">◆ Знаков контракта: ${state.records.marks}</p><p class="modal-intro">Рекорды хранятся в этом браузере. Победы дают очки постоянной прокачки для всех эпох.</p>`;
    else if (state.phase === 'preparation') {
      const selectedDoctrine = state.doctrines.find(d => d.id === state.selectedDoctrine);
      if (this.preparationStep === 'tactics') {
        content = `<div class="prep-stage-label">ПОДГОТОВКА · ШАГ 1 ИЗ 2</div><h2 id="dialog-title">Выбери тактику</h2><p class="modal-intro">Тактика действует весь поход. Нажми одну из трёх карточек, чтобы перейти к отряду.</p><div class="doctrines">${state.doctrines.map(d => `<button class="doctrine ${state.selectedDoctrine === d.id ? 'selected' : ''}" data-action="doctrine" data-doctrine="${d.id}" aria-label="Выбрать тактику ${esc(d.name)}: ${esc(d.description)}"><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p><span class="doctrine-choice">Выбрать →</span></button>`).join('')}</div>`;
      } else {
        const available = this.eraKinds(state).filter(kind => state.unlockedUnits.includes(kind));
        content = `<div class="prep-stage-label">ПОДГОТОВКА · ШАГ 2 ИЗ 2</div><h2 id="dialog-title">Твой отряд</h2><p class="modal-intro">${eraName(state.eraId)} · тактика «${esc(selectedDoctrine?.name ?? '')}» · четыре бойца для похода.</p><div class="roster-picked"><b>В отряде: ${this.draft.length} / 4</b></div><p class="roster-instruction">Нажми бойца, чтобы убрать его из отряда или добавить обратно.</p><div class="roster-grid">${available.map(kind => `<button class="roster-card ${this.draft.includes(kind) ? 'selected' : ''}" data-action="roster" data-kind="${kind}" aria-pressed="${this.draft.includes(kind)}" ${!this.draft.includes(kind) && this.draft.length >= 4 ? 'disabled' : ''}><img src="${portrait(kind)}" alt=""/><b>${UNITS[kind].name}</b><span>${tacticalTraits[roleOf(kind)]}</span><small>◆ ${UNITS[kind].cost} · ${this.draft.includes(kind) ? 'В отряде' : 'Добавить +'}</small></button>`).join('')}</div><div class="preparation-actions"><button class="primary" data-action="begin" ${!state.selectedDoctrine || this.draft.length !== 4 ? 'disabled' : ''}>Начать поход →</button>${this.draft.length === 4 ? '' : '<span>Сначала выбери четырёх бойцов</span>'}</div>`;
      }
    }
    else if (state.phase === 'contract') content = `<div class="eyebrow">МАРШРУТ ПОХОДА</div><h2 id="dialog-title">${state.battleIndex === 3 ? 'Последняя битва эпохи' : 'Куда поведёшь отряд?'}</h2><div class="route-map">${ERA_BATTLES[state.eraId].map(b => b.name).map((name,i) => `<div class="${i < state.battleIndex ? 'completed' : i === state.battleIndex ? 'current' : ''}"><b>${i < state.battleIndex ? '✓' : `0${i+1}`}</b><span>${name}</span></div>`).join('')}</div><p class="modal-intro">Условия известны заранее. Выбери контракт для боя ${state.battleIndex + 1} из 4.</p><div class="contracts">${state.contracts.map(c => `<button class="contract-card ${c.risk}" data-action="contract" data-contract="${c.id}"><span class="contract-risk">${c.risk === 'daring' ? 'РИСКОВАННЫЙ КОНТРАКТ' : 'ОБЫЧНЫЙ КОНТРАКТ'}</span><h3>${esc(c.name)}</h3><div class="enemy-preview">${c.roster.map(kind => `<img src="${portrait(kind,true)}" alt="${UNITS[kind].name}" title="${UNITS[kind].name}"/>`).join('')}</div><p>${esc(c.threat)}</p><div class="contract-rule">${esc(c.condition)}</div><small>Доход врага: +${c.enemyIncome}/сек</small><div class="contract-reward">${esc(c.reward)}</div><strong>Принять контракт →</strong></button>`).join('')}</div><p class="save-note">◆ Маршрут и усиления сохраняются между боями.</p>`;
    else if (state.phase === 'menu') content = this.menuHTML(state);
    else if (state.paused && state.phase === 'battle') content = `<div class="result-seal">Ⅱ</div><div class="eyebrow">ПРИКАЗ: ПРИВАЛ</div><h2 id="dialog-title">Бой на паузе</h2><p class="modal-intro">Фронт, припасы и время остановлены.<br/>Твой отряд ждёт возвращения.</p><div class="modal-actions"><button class="primary" data-action="pause">Вернуться в бой →</button><button class="secondary" data-action="start">Новый контракт</button></div>`;
    else if (['reward', 'victory', 'defeat'].includes(state.phase)) {
      const won = state.phase !== 'defeat', report = state.report;
      const defeatAction = state.phase === 'defeat' ? `<div class="defeat-quick-action"><button data-action="talents"><span aria-hidden="true">✦</span><b>Усилить отряд</b><small>${state.talentPoints ? `Доступно ${state.talentPoints} очк. талантов` : 'Посмотреть дерево талантов'}</small><span aria-hidden="true">→</span></button></div>` : '';
      content = `${defeatAction}<div class="result-seal ${won ? '' : 'lost'}">${won ? '⚑' : '⚔'}</div><div class="eyebrow">${state.phase === 'reward' ? `БОЙ ${state.battleIndex + 1} ЗАВЕРШЁН` : 'КОНТРАКТ ЗАВЕРШЁН'}</div><h2 id="dialog-title">${state.phase === 'reward' ? 'Редут пал. Отряд крепнет.' : won ? `${eraName(state.eraId)} покорён` : 'Ворота не устояли'}</h2><p class="modal-intro">${esc(report?.reason ?? (won ? 'Твоя армия прорвала оборону.' : 'Усиль отряд и попробуй ещё раз.'))}</p>${report ? `<div class="report-stats"><div><b>${clock(report.duration)}</b><span>время боя</span></div><div><b>${Math.ceil(report.allyFortressHp)}</b><span>здоровье ворот</span></div><div><b>${Math.round(report.blocked)}</b><span>урона отражено</span></div><div><b>${Math.round(report.healed)}</b><span>здоровья исцелено</span></div></div>` : ''}`;
      if (state.phase === 'reward') content += `<p class="talent-earned">+1 очко талантов за победу</p><div class="reward-heading">Выбери одно усиление на весь контракт</div><div class="rewards">${state.rewards.map(reward => `<button class="reward-card" data-action="reward" data-reward="${reward.id}"><span class="reward-icon">${rewardIcons[reward.id] ?? '✦'}</span><h3>${esc(reward.name)}</h3><p>${esc(reward.description)}</p><span class="take-reward">Взять усиление →</span></button>`).join('')}</div><p class="save-note">◆ Прогресс сохранён. Можно вернуться к выбору позже.</p>`;
      else if (state.phase === 'defeat') content += `<p class="save-note">Поход сохранён. После прокачки ты повторишь бой ${state.battleIndex + 1} из 4 с тем же отрядом и усилениями.</p><div class="modal-actions"><button class="primary" data-action="retry">Повторить бой ${state.battleIndex + 1} →</button></div>`;
      else content += `<p class="marks-total">+2 очка талантов за босса · ◆ Знаков контракта: ${state.records.marks}</p><div class="modal-actions"><button class="primary" data-action="start">Собрать новый отряд →</button></div><div class="menu-section-title"><h3>Карта эпох</h3><span>Выбери время для нового похода</span></div>${this.eraMap(state)}<div class="menu-section-title"><h3>Развитие и история</h3></div>${this.menuFeaturesHTML(state)}<p class="fine-print">${state.eraId === 'stone' ? 'Бронзовый век открыт. Выбери новую эпоху и собери её первый отряд.' : state.eraId === 'bronze' ? 'Две эпохи пройдены. Повтори поход с другим составом или рискованными контрактами.' : 'Прежний поход завершён. Каменный и бронзовый века ждут на карте эпох.'}</p>`;
    }
    const isMainMenu = state.phase === 'menu' && this.panel === null;
    const isPreparation = state.phase === 'preparation' && this.panel === null;
    const wideModal = isMainMenu || ['reward', 'preparation', 'contract', 'victory', 'defeat'].includes(state.phase)
      || this.panel === 'book' || this.panel === 'talents';
    const modalClasses = [wideModal ? 'reward-modal' : '', isMainMenu ? 'menu-modal' : 'has-back',
      isPreparation ? `preparation-modal ${this.preparationStep}-screen` : '',
      state.phase === 'defeat' && !this.panel ? 'defeat-modal' : '',
      ['victory', 'defeat'].includes(state.phase) && !this.panel ? 'result-modal' : ''].filter(Boolean).join(' ');
    const backLabel = this.panel ? 'Назад' : isPreparation && this.canReturnToTactics() ? 'Назад к тактике' : state.phase === 'battle' ? 'Назад в бой' : 'Назад в главное меню';
    const backButton = isMainMenu ? '' : `<button class="modal-back" data-action="back">← ${backLabel}</button>`;
    const talentLink = ['contract', 'reward'].includes(state.phase) && this.panel === null
      ? `<button class="talent-link" data-action="talents">Очки талантов: ${state.talentPoints}</button>` : '';
    const platformLabel = !state.platform.online ? 'Нет сети · игра продолжается локально'
      : state.platform.sdk === 'available' ? 'SDK Яндекс Игр подключён · сохранение пока локально' : 'Локальный режим · прогресс в этом браузере';
    const topbar = isPreparation ? `<div class="prep-topbar">${backButton}${soundButton()}</div>` : backButton;
    const footer = isPreparation ? '' : `<div class="modal-platform">${talentLink}${platformLabel}${soundButton()}</div>`;
    this.overlay.innerHTML = content ? `<div class="scrim"><section class="modal ${modalClasses}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${topbar}${content}${footer}</section></div>` : '';
    this.updateSoundControls();
    const shell = this.root.querySelector('.game-shell')!;
    for (const child of Array.from(shell.children)) if (child !== this.overlay) (child as HTMLElement).inert = Boolean(content);
    if (content) {
      const buttons = Array.from(this.overlay.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const focus = buttons.find(b => previousAction && b.dataset.action === previousAction && b.dataset.kind === previousKind && b.dataset.doctrine === previousDoctrine && b.dataset.talent === previousTalent) ?? buttons[0];
      focus?.focus({ preventScroll: true });
      const modal = this.overlay.querySelector<HTMLElement>('.modal'); if (modal) modal.scrollTop = scrollTop;
    }
  }
}
