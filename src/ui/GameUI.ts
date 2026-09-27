import type { GameApp, GameState, HireKind } from '../core/types';
import { asset, descriptions, rewardIcons } from '../art/catalog';
import { HIRE_KINDS, UNITS, UPGRADES, UNLOCKS } from '../data/content';
import type { SoundStatus } from '../view/Sound';
import type { BattleInsets } from '../view/BattleLayout';

const esc = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const tacticalTraits: Record<HireKind, string> = { shield: 'Держит фронт', spear: 'Против брони', archer: 'Дальний урон', medic: 'Лечение', raider: 'Быстрый прорыв', thrower: 'Урон по группе', banner: 'Ускоряет союзников', siege: 'Бьёт крепость' };
const cardName = (kind: HireKind, name: string) => `<span class="unit-name-full">${esc(name)}</span><span class="unit-name-compact" aria-hidden="true">${esc(({ shield: 'Щит', spear: 'Копьё', banner: 'Знамя' } as Partial<Record<HireKind, string>>)[kind] ?? name)}</span>`;
const clock = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

export class GameUI {
  readonly arena: HTMLElement;
  private overlay: HTMLElement;
  private modalKey = '';
  private fields = new Map<string, HTMLElement>();
  private state!: GameState;
  private draft: HireKind[] = [];
  private panel: 'book' | 'records' | null = null;
  private cardKey = '';
  private previousPhase = '';
  private overlayContext = '';
  private audioStatus: SoundStatus = 'locked';
  setAudioStatus(status: SoundStatus) { this.audioStatus = status; if (this.state) this.updateSoundControls(); }
  private updateSoundControls() {
    const enabled = !this.state.muted && this.audioStatus === 'ready';
    const label = this.audioStatus === 'unavailable' ? 'Нет звука' : enabled ? 'Выключить звук' : 'Включить звук';
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-action="mute"]')) {
      button.textContent = label; button.setAttribute('aria-label', label); button.setAttribute('aria-pressed', String(enabled));
      button.title = this.audioStatus === 'unavailable' ? 'Браузер не предоставил аудио. Нажми, чтобы повторить.' : enabled ? 'Звук включён. Нажми, чтобы выключить.' : 'Включить звук и прослушать проверочный сигнал';
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
  private unlockLabel(kind: HireKind, state: GameState) {
    return state.unlockedUnits.includes(kind) ? 'Доступен в подготовке' : `Нужно знаков: ${state.records.marks} / ${UNLOCKS.find(u => u.kind === kind)?.marks ?? 0}`;
  }
  getDraftRoster() { return [...this.draft]; }
  toggleRoster(kind: HireKind) {
    if (!this.state.unlockedUnits.includes(kind)) return;
    if (this.draft.includes(kind)) this.draft = this.draft.filter(k => k !== kind);
    else if (this.draft.length < 4) this.draft.push(kind);
    this.renderOverlay(this.state);
  }
  openPanel(panel: 'book' | 'records' | null) { this.panel = panel; this.renderOverlay(this.state); }
  private cardsHTML(state: GameState) {
    return state.cards.map((card, i) => `<button class="unit-card ${card.kind}" data-action="hire" data-kind="${card.kind}" aria-label="Нанять: ${esc(card.name)}"><span class="card-key">${i + 1}</span><div class="portrait"><img src="${asset(`u-${card.kind}`)}" alt=""/></div><div class="card-copy"><span class="role">${tacticalTraits[card.kind]}</span><h3>${cardName(card.kind, card.name)}</h3><p>${descriptions[card.kind]}</p><div class="card-bottom"><strong class="price">◆ <span data-field="cost-${card.kind}">${card.cost}</span></strong><span data-field="available-${card.kind}" class="availability"></span></div></div></button>`).join('');
  }
  constructor(private root: HTMLElement, app: GameApp) {
    root.innerHTML = `<main class="game-shell">
      <header class="masthead"><div class="brand"><span class="brand-seal">⚔</span><div><b>Арена наёмников</b><span>ПЕПЕЛЬНЫЙ ТРАКТ</span></div></div><div class="campaign"><span class="chapter" data-field="chapter">БОЙ 01 / 04</span><div class="route" aria-label="Маршрут из четырёх боёв"><i></i><span></span><i></i><span></span><i></i><span></span><i></i></div></div><div class="tools"><button data-action="mute" class="icon-button" aria-label="Выключить звук" title="Звук" data-field="mute">Звук вкл.</button><button data-action="pause" class="icon-button" title="Пауза · Escape" data-field="pause">Ⅱ Пауза</button></div></header>
      <section class="battle-panel" aria-label="Бой">
        <div class="battle-heading"><div><span class="eyebrow">КОНТРАКТ <span data-field="contract">01</span></span><h1 data-field="battleName">Пепельный тракт</h1></div><div class="timer"><span class="live-dot"></span><span data-field="time">00:00</span></div></div>
        <div class="hud"><div class="fortress-stat ally"><span>Наши</span><strong data-field="allyHp">100 <small>/ 100</small></strong><div class="meter"><i data-field="allyBar"></i></div></div><div class="supply-stat"><span><span class="supply-label">Припасы</span> <b data-field="income">+6 / сек</b></span><strong><span class="resource-icon">◆</span> <span data-field="resource">0</span><small data-field="resourceMax">/ 100</small></strong><div class="meter"><i data-field="resourceBar"></i></div></div><div class="fortress-stat enemy"><span>Враг</span><strong data-field="enemyHp">100 <small>/ 100</small></strong><div class="meter"><i data-field="enemyBar"></i></div></div></div>
        <div class="arena-wrap"><div id="battle-arena" class="arena"></div><div class="arena-vignette"></div><div class="boss-warning" data-field="bossWarning" role="status" hidden></div><div class="arena-label"><span class="wind-mark">≋</span> <b data-field="arenaName">Пепельный тракт</b> <span>•</span> граница гильдии</div><div class="threat"><span>РАЗВЕДКА</span><b class="threat-full" data-field="threat"></b><b class="threat-compact" data-field="threatCompact"></b></div></div>
        <div class="battle-status"><span data-field="hint">Найми щитоносца, чтобы удержать переднюю линию.</span><span class="army"><span class="ally-dot">◆</span> Отряд <b data-field="army">0 / 12</b></span></div>
      </section>
      <section class="recruitment" aria-label="Найм бойцов"><div class="section-title"><h2>Твой отряд</h2><span>Нажми карту, чтобы нанять <span class="keyboard-hint">· клавиши 1–4</span></span></div><div class="recruit-row"><div class="cards">${app.getState().cards.map((card, i) => `<button class="unit-card ${card.kind}" data-action="hire" data-kind="${card.kind}" aria-label="Нанять: ${esc(card.name)}"><span class="card-key">${i + 1}</span><div class="portrait"><img src="${asset(`u-${card.kind}`)}" alt=""/></div><div class="card-copy"><span class="role">${tacticalTraits[card.kind]}</span><h3>${cardName(card.kind, card.name)}</h3><p>${descriptions[card.kind]}</p><div class="card-bottom"><strong class="price">◆ <span data-field="cost-${card.kind}">${card.cost}</span></strong><span data-field="available-${card.kind}" class="availability"></span></div></div></button>`).join('')}</div><button class="wagon" data-action="income"><span class="wagon-icon" aria-hidden="true">♜</span><b>Обоз<span class="wagon-arrow"> ↑</span></b><span>+1 / сек</span><strong data-field="wagonCost">◆ 40</strong><small data-field="wagonLevel">0 / 2 улучшений</small></button></div></section>
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
    if (state.phase === 'preparation' && this.previousPhase !== 'preparation') this.draft = [...state.roster];
    this.previousPhase = state.phase;
    const cardsKey = state.cards.map(card => card.kind).join();
    if (cardsKey !== this.cardKey) {
      this.cardKey = cardsKey; this.root.querySelector('.cards')!.innerHTML = this.cardsHTML(state);
      for (const element of this.root.querySelectorAll<HTMLElement>('.cards [data-field]')) this.fields.set(element.dataset.field!, element);
    }
    this.text('chapter', `БОЙ ${String(state.battleIndex + 1).padStart(2, '0')} / 04`); this.text('contract', String(state.battleIndex + 1).padStart(2, '0'));
    this.text('battleName', state.battleName); this.text('threat', `${state.threat} · доход врага +${state.enemyIncome}/с`); this.text('time', clock(state.elapsed));
    this.text('allyHp', `${Math.ceil(state.allyFortressHp)} / ${state.fortressMaxHp}`); this.text('enemyHp', `${Math.ceil(state.enemyFortressHp)} / ${state.fortressMaxHp}`);
    this.text('threatCompact', `${({ ash: 'Налётчики', iron: 'Латники · броня', arrows: 'Стрелки + латники', citadel: 'Волна при 50% HP' } as Record<string, string>)[state.arenaId] ?? 'Враг'} · враг +${state.enemyIncome}/с`);
    this.text('resource', String(Math.floor(state.resource))); this.text('resourceMax', `/ ${state.resourceMax}`); this.text('income', `+${state.income} / сек`); this.text('army', `${state.allyCount} / ${state.allyLimit}`);
    this.bar('allyBar', state.allyFortressHp / state.fortressMaxHp); this.bar('enemyBar', state.enemyFortressHp / state.fortressMaxHp); this.bar('resourceBar', state.resource / state.resourceMax);
    this.updateSoundControls();
    (this.fields.get('pause') as HTMLButtonElement).disabled = state.phase !== 'battle';
    this.text('pause', state.paused ? '▶ Продолжить' : 'Ⅱ Пауза');
    this.root.querySelector('[data-action="income"]')!.classList.toggle('is-maxed', state.incomeUpgrades >= 2);
    this.text('wagonCost', state.incomeUpgrades >= 2 ? 'Готово' : `◆ ${state.incomeUpgradeCost}`); this.text('wagonLevel', `${state.incomeUpgrades} / 2`);
    this.text('boons', state.chosenUpgrades.length ? state.chosenUpgrades.map(id => UPGRADES[id].name).join(' · ') : 'Четыре боя — один контракт');
    this.text('arenaName', ({ ash: 'Пепельный тракт', iron: 'Железная переправа', arrows: 'Северный перевал', citadel: 'Цитадель Коменданта' } as Record<string, string>)[state.arenaId] ?? 'Пепельный тракт');
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
      button.setAttribute('aria-label', `${card.name}. ${descriptions[card.kind]} Цена: ${card.cost} припасов.`);
      button.title = `${card.name} — ${descriptions[card.kind]}${state.allyCount >= state.allyLimit ? ' Отряд полон.' : !card.canHire ? ' Недостаточно припасов.' : ''}`;
      const wait = Math.max(0, Math.ceil((card.cost - state.resource) / state.income));
      this.text(`cost-${card.kind}`, String(card.cost));
      this.text(`available-${card.kind}`, state.allyCount >= state.allyLimit ? 'Лимит' : card.canHire ? 'Найм' : wait > 0 ? `${wait} с` : '');
      button.style.setProperty('--charge', `${Math.min(100, state.resource / card.cost * 100)}%`);
    }
    this.root.querySelector<HTMLButtonElement>('[data-action="income"]')!.setAttribute('aria-label', `Улучшить обоз: доход +1 в секунду, цена ${state.incomeUpgradeCost}. Куплено ${state.incomeUpgrades} из 2.`);
    this.root.querySelector<HTMLButtonElement>('[data-action="income"]')!.disabled = !active || state.incomeUpgrades >= 2 || state.resource < state.incomeUpgradeCost;
    const armor = state.units.some(u => u.team === 'enemy' && u.kind === 'bulwark');
    const hint = !state.platform.online ? 'Нет сети · локально' : state.allyCount >= state.allyLimit ? 'Отряд полон' : state.allyFortressHp < state.fortressMaxHp * .3 ? 'Ворота под угрозой!' : armor ? 'У врага броня' : state.allyCount === 0 ? 'Отряд пуст' : state.roster.includes('medic') && state.units.some(u => u.team === 'ally' && u.hp < u.maxHp * .65) ? 'Есть раненые' : '';
    this.text('hint', hint);
    this.root.classList.toggle('is-paused', state.paused);
    const key = `${state.phase}:${state.paused}:${state.canContinue}:${state.battleIndex}:${state.rewards.map(r => r.id).join()}:${state.selectedDoctrine}:${state.contracts.map(c => c.id).join()}:${state.muted}:${state.platform.online}:${state.platform.sdk}`;
    if (key !== this.modalKey) { this.modalKey = key; this.renderOverlay(state); }
  }
  private renderOverlay(state: GameState) {
    const context = `${this.panel ?? state.phase}:${state.paused}`;
    const sameScreen = this.overlayContext === context;
    const scrollTop = sameScreen ? this.overlay.querySelector('.modal')?.scrollTop ?? 0 : 0;
    const previousButton = sameScreen && document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    const previousAction = previousButton?.dataset.action;
    const previousKind = previousButton?.dataset.kind;
    const previousDoctrine = previousButton?.dataset.doctrine;
    this.overlayContext = context;
    let content = '';
    if (this.panel === 'book') content = `<div class="eyebrow">АРХИВ ГИЛЬДИИ</div><h2 id="dialog-title">Книга наёмников</h2><p class="modal-intro">Справочник бойцов, их ролей, характеристик и условий открытия.</p><div class="book-grid">${HIRE_KINDS.map(kind => `<article class="book-unit"><img src="${asset(`u-${kind}`)}" alt=""/><div><h3>${UNITS[kind].name}</h3><p>${descriptions[kind]}</p><small>◆ ${UNITS[kind].cost} · ${UNITS[kind].hp} здоровья · ${UNITS[kind].damage} урона</small><span class="book-unlock">${this.unlockLabel(kind, state)}</span></div></article>`).join('')}</div><div class="book-upgrades"><h3>Усиления похода</h3>${Object.values(UPGRADES).map(u => `<p><b>${esc(u.name)}</b> — ${esc(u.description)}</p>`).join('')}</div><button class="secondary" data-action="close-panel">Вернуться</button>`;
    else if (this.panel === 'records') content = `<div class="result-seal">⚑</div><div class="eyebrow">ЛЕТОПИСЬ ГИЛЬДИИ</div><h2 id="dialog-title">Твои походы</h2><div class="report-stats"><div><b>${state.records.runs}</b><span>начато походов</span></div><div><b>${state.records.wins}</b><span>побед</span></div><div><b>${state.records.bestBattle} / 4</b><span>лучший этап</span></div><div><b>${state.records.bestTime ? clock(state.records.bestTime) : '—'}</b><span>лучшее время</span></div></div><p class="marks-total">◆ Знаков контракта: ${state.records.marks}</p><p class="modal-intro">Рекорды хранятся в этом браузере. Победа открывает новые сочетания, а не постоянный бонус к силе.</p><div class="modal-actions"><button class="secondary" data-action="close-panel">Вернуться</button></div>`;
    else if (state.phase === 'preparation') content = `<div class="eyebrow">СНАЧАЛА ПЛАН — ПОТОМ ПРИКАЗ</div><h2 id="dialog-title">Собери свой отряд</h2><p class="modal-intro">Одна доктрина и четыре карты на весь поход.</p><div class="doctrines">${state.doctrines.map((d, i) => `<button class="doctrine ${state.selectedDoctrine === d.id ? 'selected' : ''}" data-action="doctrine" data-doctrine="${d.id}" aria-pressed="${state.selectedDoctrine === d.id}"><span>${['◈','➶','◇'][i] ?? '⚑'}</span><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p></button>`).join('')}</div><p class="roster-unlock-note">◆ ${state.records.marks} знаков · побеждай в контрактах, чтобы открывать новые роли</p><div class="reward-heading">Карты отряда <b>${this.draft.length} / 4</b> · сними выбранную карту, затем добавь новую</div><div class="roster-grid">${HIRE_KINDS.map(kind => `<button class="roster-card ${this.draft.includes(kind) ? 'selected' : ''}" data-action="roster" data-kind="${kind}" aria-pressed="${this.draft.includes(kind)}" ${!state.unlockedUnits.includes(kind) || (!this.draft.includes(kind) && this.draft.length >= 4) ? 'disabled' : ''}><img src="${asset(`u-${kind}`)}" alt=""/><b>${UNITS[kind].name}</b><span>${descriptions[kind]}</span><small>${state.unlockedUnits.includes(kind) ? `◆ ${UNITS[kind].cost} · ${this.draft.includes(kind) ? 'В отряде ✓' : 'Выбрать +'}` : this.unlockLabel(kind, state)}</small></button>`).join('')}</div><div class="modal-actions"><button class="primary" data-action="begin" ${!state.selectedDoctrine || this.draft.length !== 4 ? 'disabled' : ''}>Выбрать путь →</button></div>`;
    else if (state.phase === 'contract') content = `<div class="eyebrow">МАРШРУТ ПОХОДА</div><h2 id="dialog-title">${state.battleIndex === 3 ? 'У ворот Коменданта' : 'Куда поведёшь отряд?'}</h2><div class="route-map">${['Пепельный тракт','Железная стена','Северный перевал','Комендант'].map((name,i) => `<div class="${i < state.battleIndex ? 'completed' : i === state.battleIndex ? 'current' : ''}"><b>${i < state.battleIndex ? '✓' : `0${i+1}`}</b><span>${name}</span></div>`).join('')}</div><p class="modal-intro">Условия известны заранее. Выбери контракт для боя ${state.battleIndex + 1} из 4.</p><div class="contracts">${state.contracts.map(c => `<button class="contract-card ${c.risk}" data-action="contract" data-contract="${c.id}"><span class="contract-risk">${c.risk === 'daring' ? 'РИСКОВАННЫЙ КОНТРАКТ' : 'ОБЫЧНЫЙ КОНТРАКТ'}</span><h3>${esc(c.name)}</h3><div class="enemy-preview">${c.roster.map(kind => `<img src="${asset(`enemy-${kind === 'bulwark' ? 'u-bulwark' : kind === 'enemyArcher' ? 'u-archer' : `u-${kind}`}`)}" alt="${UNITS[kind].name}" title="${UNITS[kind].name}"/>`).join('')}</div><p>${esc(c.threat)}</p><div class="contract-rule">${esc(c.condition)}</div><small>Доход врага: +${c.enemyIncome}/сек</small><div class="contract-reward">${esc(c.reward)}</div><strong>Принять контракт →</strong></button>`).join('')}</div><p class="save-note">◆ Маршрут и усиления сохраняются между боями.</p>`;
    else if (state.phase === 'menu') content = `<div class="menu-art"><img src="${asset('u-spear')}" alt=""/><img src="${asset('u-shield')}" alt=""/><img src="${asset('u-archer')}" alt=""/></div><div class="eyebrow">ГИЛЬДИЯ ЖДЁТ ТВОЕГО ПРИКАЗА</div><h2 id="dialog-title">Небольшие герои.<br/><em>Большие решения.</em></h2><p class="modal-intro">Собери отряд и пройди четыре сражения.<br/>Выбирай контракты, усиливай армию и одолей Коменданта.</p><div class="modal-actions">${state.canContinue ? '<button class="primary" data-action="continue">Продолжить контракт →</button>' : ''}<button class="${state.canContinue ? 'secondary' : 'primary'}" data-action="start">${state.canContinue ? 'Новый контракт' : 'Начать поход →'}</button></div><div class="menu-links"><button data-action="book">Книга наёмников</button><button data-action="records">Рекорды</button></div><p class="fine-print">Нанимай одним нажатием · бойцы сражаются сами</p>`;
    else if (state.paused && state.phase === 'battle') content = `<div class="result-seal">Ⅱ</div><div class="eyebrow">ПРИКАЗ: ПРИВАЛ</div><h2 id="dialog-title">Бой на паузе</h2><p class="modal-intro">Фронт, припасы и время остановлены.<br/>Твой отряд ждёт возвращения.</p><div class="modal-actions"><button class="primary" data-action="pause">Вернуться в бой →</button><button class="secondary" data-action="start">Новый контракт</button></div>`;
    else if (['reward', 'victory', 'defeat'].includes(state.phase)) {
      const won = state.phase !== 'defeat', report = state.report;
      content = `<div class="result-seal ${won ? '' : 'lost'}">${won ? '⚑' : '⚔'}</div><div class="eyebrow">${state.phase === 'reward' ? `БОЙ ${state.battleIndex + 1} ЗАВЕРШЁН` : 'КОНТРАКТ ЗАВЕРШЁН'}</div><h2 id="dialog-title">${state.phase === 'reward' ? 'Редут пал. Отряд крепнет.' : won ? 'Тракт под твоей защитой' : 'Ворота не устояли'}</h2><p class="modal-intro">${esc(report?.reason ?? (won ? 'Твоя армия прорвала оборону.' : 'Попробуй другой состав отряда.'))}</p>${report ? `<div class="report-stats"><div><b>${clock(report.duration)}</b><span>время боя</span></div><div><b>${Math.ceil(report.allyFortressHp)}</b><span>здоровье ворот</span></div><div><b>${Math.round(report.blocked)}</b><span>урона отражено</span></div><div><b>${Math.round(report.healed)}</b><span>здоровья исцелено</span></div></div>` : ''}`;
      if (state.phase === 'reward') content += `<div class="reward-heading">Выбери одно усиление на весь контракт</div><div class="rewards">${state.rewards.map(reward => `<button class="reward-card" data-action="reward" data-reward="${reward.id}"><span class="reward-icon">${rewardIcons[reward.id] ?? '✦'}</span><h3>${esc(reward.name)}</h3><p>${esc(reward.description)}</p><span class="take-reward">Взять усиление →</span></button>`).join('')}</div><p class="save-note">◆ Прогресс сохранён. Можно вернуться к выбору позже.</p>`;
      else content += `<p class="marks-total">◆ Знаков контракта: ${state.records.marks}</p><div class="modal-actions"><button class="primary" data-action="start">${won ? 'Собрать новый отряд →' : 'Попробовать снова →'}</button></div><div class="menu-links"><button data-action="book">Книга наёмников</button><button data-action="records">Рекорды</button></div><p class="fine-print">${won ? 'Новые сочетания усилений — новый путь к победе.' : 'Попробуй другой состав и сохрани припасы для ответа врагу.'}</p>`;
    }
    this.overlay.innerHTML = content ? `<div class="scrim"><section class="modal ${['reward','preparation','contract'].includes(state.phase) || this.panel === 'book' ? 'reward-modal' : ''}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${content}<div class="modal-platform">${!state.platform.online ? 'Нет сети · игра продолжается локально' : state.platform.sdk === 'available' ? 'Яндекс Игры · подключено' : 'Локальный режим · прогресс в этом браузере'}<button data-action="mute" aria-label="${state.muted ? 'Включить звук' : 'Выключить звук'}">${state.muted ? 'Звук выкл.' : 'Звук вкл.'}</button></div></section></div>` : '';
    this.updateSoundControls();
    const shell = this.root.querySelector('.game-shell')!;
    for (const child of Array.from(shell.children)) if (child !== this.overlay) (child as HTMLElement).inert = Boolean(content);
    if (content) {
      const buttons = Array.from(this.overlay.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const focus = buttons.find(b => previousAction && b.dataset.action === previousAction && b.dataset.kind === previousKind && b.dataset.doctrine === previousDoctrine) ?? buttons[0];
      focus?.focus({ preventScroll: true });
      const modal = this.overlay.querySelector<HTMLElement>('.modal'); if (modal) modal.scrollTop = scrollTop;
    }
  }
}
