import { BATTLES, HIRE_KINDS, STARTER_KINDS, UNITS } from '../data/content';
import type { BattleEvent, BattleReport, BossPhase, ContractOption, DoctrineId, HireKind, Team, UnitKind, UnitState, UpgradeId } from './types';
import { Random } from './random';

const FORT = { ally: 65, enemy: 935 } as const;
const LIMIT = 12;
const STEP = 1 / 30;

export class BattleSimulation {
  readonly battleIndex: number;
  readonly upgrades: UpgradeId[];
  readonly doctrine: DoctrineId;
  readonly roster: HireKind[];
  readonly contract: ContractOption;
  readonly random: Random;
  readonly units: UnitState[] = [];
  readonly events: BattleEvent[] = [];
  elapsed = 0;
  resource = 0;
  enemyResource = 0;
  incomeUpgrades = 0;
  allyFortressHp = 100;
  enemyFortressHp = 100;
  hires = 0;
  damageDealt = 0;
  damageTaken = 0;
  blocked = 0;
  healed = 0;
  bossPhase: BossPhase = 'none';
  bossCountdown = 0;
  report: BattleReport | null = null;
  private nextUnitId = 1;
  private nextEventId = 1;
  private aiCooldown = 2.5;
  private aiSequence = 0;
  private archersHired = 0;
  private rangeBonuses = new Map<number, number>();
  private reserveUsed = false;

  constructor(battleIndex: number, upgrades: UpgradeId[], seed: number, doctrine: DoctrineId = 'steel', roster: HireKind[] = STARTER_KINDS, contract?: ContractOption) {
    this.battleIndex = battleIndex;
    this.upgrades = [...upgrades];
    this.doctrine = doctrine;
    this.roster = [...roster];
    const battle = BATTLES[battleIndex];
    this.contract = contract ?? { id: `${battleIndex}-standard`, name: battle.name, threat: battle.threat,
      roster: battle.roster, condition: 'Обычный бой', reward: '1 знак контракта',
      enemyIncome: battle.enemyIncome, marks: 1, risk: 'standard' };
    this.random = new Random((seed ^ Math.imul(battleIndex + 1, 0x9e3779b1)) >>> 0);
    if (doctrine === 'bargain') { this.resource = 20; this.allyFortressHp = 85; }
    if (this.contract.risk === 'daring') this.enemyResource = 20;
  }

  get resourceMax(): number { return 100 + (this.upgrades.includes('supply') ? 20 : 0); }
  get income(): number { return 6 + this.incomeUpgrades + (this.upgrades.includes('wagon') ? 1 : 0); }
  get incomeUpgradeCost(): number { return this.incomeUpgrades === 0 && this.upgrades.includes('workshop') ? 28 : 40; }
  get enemyIncome(): number { return this.contract.enemyIncome + (this.elapsed >= 300 ? 2 : 0); }
  get allyCount(): number { return this.units.filter(u => u.team === 'ally').length; }
  get enemyCount(): number { return this.units.filter(u => u.team === 'enemy').length; }

  hire(kind: HireKind): boolean {
    if (this.report || !HIRE_KINDS.includes(kind) || !this.roster.includes(kind) || this.allyCount >= LIMIT) return false;
    const cost = this.hireCost(kind);
    if (this.resource + 1e-8 < cost) return false;
    this.resource -= cost;
    this.hires++;
    this.spawn(kind, 'ally');
    return true;
  }

  hireCost(kind: HireKind): number {
    const firstDiscount = this.hires === 0 && this.upgrades.includes('contract') ? 8 : 0;
    const steelDiscount = this.doctrine === 'steel' && kind === 'shield' && !this.units.some(u => u.team === 'ally' && u.kind === 'shield') && this.hires === 0 ? 6 : 0;
    return Math.max(0, UNITS[kind].cost - firstDiscount - steelDiscount);
  }

  upgradeIncome(): boolean {
    if (this.report || this.incomeUpgrades >= 2 || this.resource + 1e-8 < this.incomeUpgradeCost) return false;
    this.resource -= this.incomeUpgradeCost;
    this.incomeUpgrades++;
    this.event('income', 65, 'ally', 1);
    return true;
  }

  step(): void {
    if (this.report) return;
    this.elapsed += STEP;
    const overtime = this.elapsed >= 300 ? 2 : 0;
    this.resource = Math.min(this.resourceMax, this.resource + (this.income + overtime) * STEP);
    this.enemyResource = Math.min(100, this.enemyResource + this.enemyIncome * STEP);
    if (BATTLES[this.battleIndex].ai === 'boss') this.bossTick();
    if (!this.reserveUsed && this.upgrades.includes('lastReserve') && this.allyFortressHp < 35 && this.allyCount < LIMIT) {
      this.reserveUsed = true;
      this.spawn('shield', 'ally');
    }
    this.aiCooldown -= STEP;
    if (this.aiCooldown <= 0) this.aiTurn();
    // Sort by stable spawn id, so simultaneous attacks resolve reproducibly.
    for (const unit of [...this.units]) {
      if (unit.hp <= 0 || this.report) continue;
      unit.cooldown = Math.max(0, unit.cooldown - STEP);
      this.act(unit);
    }
    for (let i = this.units.length - 1; i >= 0; i--) {
      if (this.units[i].hp <= 0) this.units.splice(i, 1);
    }
    if (this.allyFortressHp <= 0 || this.enemyFortressHp <= 0) {
      this.finish(this.enemyFortressHp <= 0);
    } else if (this.elapsed >= 420) {
      this.finish(this.enemyFortressHp < this.allyFortressHp);
    }
  }

  private aiTurn(): void {
    const plan = BATTLES[this.battleIndex].ai;
    const allyArchers = this.units.filter(u => u.team === 'ally' && u.kind === 'archer').length;
    const allyNearFort = this.units.some(u => u.team === 'ally' && u.x > 690);
    let kind: UnitKind;
    if (plan === 'rush') kind = this.aiSequence % 4 === 3 ? 'shield' : 'raider';
    else if (plan === 'wall') kind = this.aiSequence % 3 === 2 ? 'enemyArcher' : 'bulwark';
    else if (plan === 'ranged') kind = (allyNearFort || this.aiSequence % 3 === 0) ? 'bulwark' : 'enemyArcher';
    else kind = this.aiSequence % 4 === 0 ? 'bulwark' : this.aiSequence % 4 === 1 ? 'enemyArcher' : 'raider';
    if (allyArchers >= 3 && plan === 'rush' && this.aiSequence % 3 === 0) kind = 'raider';
    if (this.enemyResource >= UNITS[kind].cost && this.enemyCount < LIMIT) {
      this.enemyResource -= UNITS[kind].cost;
      this.spawn(kind, 'enemy');
      this.aiSequence++;
    }
    this.aiCooldown = 1.8 + this.random.next() * 1.1;
  }

  private bossTick(): void {
    if (this.bossPhase === 'none' && this.enemyFortressHp <= 50) {
      this.bossPhase = 'warning';
      this.bossCountdown = 4.5;
      this.event('boss-warning', 850, 'enemy');
    } else if (this.bossPhase === 'warning') {
      this.bossCountdown = Math.max(0, this.bossCountdown - STEP);
      if (this.bossCountdown <= 0) {
        this.bossPhase = 'assault';
        this.event('boss-assault', 850, 'enemy');
        for (const kind of ['bulwark', 'raider', 'enemyArcher'] as UnitKind[]) {
          if (this.enemyCount < LIMIT) this.spawn(kind, 'enemy');
        }
      }
    } else if (this.bossPhase === 'assault' && !this.units.some(u => u.team === 'enemy' && u.x > 700)) {
      this.bossPhase = 'spent';
    }
  }

  private spawn(kind: UnitKind, team: Team): void {
    const def = UNITS[kind];
    const bonusHp = team === 'ally' && this.upgrades.includes('banner') && (kind === 'shield' || kind === 'spear') ? 1.15 : 1;
    const hp = Math.round(def.hp * bonusHp);
    const unit: UnitState = { id: this.nextUnitId++, kind, team, x: team === 'ally' ? 105 : 895,
      hp, maxHp: hp, cooldown: .35, action: 'idle', facing: team === 'ally' ? 1 : -1 };
    if (team === 'ally' && kind === 'archer') {
      if (this.doctrine === 'arrow' && this.archersHired < 2) this.rangeBonuses.set(unit.id, 20);
      this.archersHired++;
    }
    this.units.push(unit);
    this.event('spawn', unit.x, team, undefined, unit.id);
  }

  private act(unit: UnitState): void {
    const def = UNITS[unit.kind];
    const range = def.range + (this.rangeBonuses.get(unit.id) ?? 0);
    if (unit.kind === 'medic') {
      const wounded = this.units.filter(u => u.team === unit.team && u.hp > 0 && u.hp < u.maxHp && Math.abs(u.x - unit.x) <= range)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id)[0];
      if (wounded && unit.cooldown <= 0) {
        unit.action = 'attack';
        if (wounded.x !== unit.x) unit.facing = wounded.x > unit.x ? 1 : -1;
        const amount = Math.min(wounded.maxHp - wounded.hp, (def.heal ?? 0) * (this.upgrades.includes('bandages') ? 1.2 : 1));
        wounded.hp += amount;
        this.healed += amount;
        unit.cooldown = def.period;
        this.event('heal', wounded.x, unit.team, amount, unit.id, wounded.id);
        return;
      }
    }
    const enemies = this.units.filter(u => u.team !== unit.team && u.hp > 0);
    enemies.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x) || a.id - b.id);
    // Raiders slip through the first line to pressure ranged troops. Both teams
    // use the same rule, giving players a visible answer to archer-heavy armies.
    const backline = unit.kind === 'raider'
      ? enemies.find(u => UNITS[u.kind].range >= 100 && Math.abs(u.x - unit.x) <= 280)
      : undefined;
    const target = backline ?? enemies[0];
    const fortressX = FORT[unit.team === 'ally' ? 'enemy' : 'ally'];
    const targetX = target ? target.x : fortressX;
    const distance = Math.abs(targetX - unit.x);
    if (distance > range + (target ? 10 : 30)) {
      const direction = targetX > unit.x ? 1 : -1;
      const speed = def.speed * (unit.team === 'ally' && unit.kind === 'raider' && this.upgrades.includes('boots') ? 1.2 : 1);
      const previousX = unit.x;
      unit.x = Math.max(75, Math.min(925, unit.x + direction * Math.min(speed * STEP, distance - range)));
      unit.action = unit.x === previousX ? 'idle' : 'move';
      unit.facing = direction;
      return;
    }
    unit.action = 'attack';
    if (targetX !== unit.x) unit.facing = targetX > unit.x ? 1 : -1;
    if (unit.cooldown > 0) return;
    const banners = this.units.filter(u => u.team === unit.team && u.kind === 'banner' && u.id !== unit.id && Math.abs(u.x - unit.x) <= 110).length;
    unit.cooldown = def.period / (1 + Math.min(2, banners) * (unit.team === 'ally' && this.upgrades.includes('standard') ? .24 : .16));
    if (target) {
      let raw = def.damage;
      if (unit.kind === 'spear' && UNITS[target.kind].armor > 0) raw *= (def.antiArmor ?? 1) + (this.upgrades.includes('pikes') ? .35 : 0);
      if (unit.kind === 'archer' && this.upgrades.includes('arrows')) raw *= 1.15;
      const armor = UNITS[target.kind].armor * (unit.kind === 'spear' ? .3 : 1);
      const blocked = raw * armor;
      const dealt = Math.max(1, raw - blocked);
      target.hp -= dealt;
      if (unit.team === 'ally') { this.damageDealt += dealt; this.blocked += target.team === 'ally' ? blocked : 0; }
      else { this.damageTaken += dealt; if (target.team === 'ally') this.blocked += blocked; }
      this.event('attack', target.x, unit.team, dealt, unit.id, target.id);
      if (blocked) this.event('block', target.x, target.team, blocked, unit.id, target.id);
      if (target.hp <= 0) this.event('death', target.x, target.team, undefined, unit.id, target.id);
      if (unit.kind === 'thrower') {
        for (const secondary of enemies.filter(u => u.id !== target.id && Math.abs(u.x - target.x) <= 45).slice(0, 3)) {
          const splash = Math.max(1, def.damage * .5 * (1 - UNITS[secondary.kind].armor));
          secondary.hp -= splash;
          if (unit.team === 'ally') this.damageDealt += splash; else this.damageTaken += splash;
          this.event('attack', secondary.x, unit.team, splash, unit.id, secondary.id);
          if (secondary.hp <= 0) this.event('death', secondary.x, secondary.team, undefined, unit.id, secondary.id);
        }
      }
    } else {
      // Fortresses have structural resistance: a field army needs sustained control,
      // while siege troops retain a clear finishing role.
      const damage = (unit.kind === 'medic' ? 1 : def.damage)
        * (unit.kind === 'siege' ? 2.5 : 1) * .22
        * (unit.team === 'ally' && unit.kind === 'siege' && this.upgrades.includes('siegecraft') ? 1.2 : 1);
      if (unit.team === 'ally') { this.enemyFortressHp = Math.max(0, this.enemyFortressHp - damage); this.damageDealt += damage; }
      else { this.allyFortressHp = Math.max(0, this.allyFortressHp - damage); this.damageTaken += damage; }
      this.event('fortress', fortressX, unit.team, damage, unit.id);
    }
  }

  private finish(won: boolean): void {
    const ai = BATTLES[this.battleIndex].ai;
    const lossCause = this.hires < 2 ? 'Твоя крепость пала: на защиту вышло слишком мало наёмников.'
      : ai === 'rush' ? 'Налётчики прорвались к твоей крепости. Ранний щит сдерживает натиск.'
      : ai === 'wall' ? 'Латники продавили строй. Копейщики пробивают их броню.'
      : ai === 'ranged' ? 'Вражеские стрелки расстреляли строй из-за латников. Нужен прорыв или дальний ответ.'
      : 'Волна Коменданта сломала оборону. Сохрани припасы к её предупреждению.';
    const reason = won
      ? this.elapsed >= 420 ? 'Время истекло: у крепости врага осталось меньше здоровья.' : 'Крепость врага разрушена.'
      : this.elapsed >= 420 ? 'Время истекло: крепость врага сохранила больше здоровья.' : lossCause;
    this.report = { won, reason, duration: this.elapsed, allyFortressHp: this.allyFortressHp,
      enemyFortressHp: this.enemyFortressHp, hires: this.hires, damageDealt: this.damageDealt,
      damageTaken: this.damageTaken, blocked: this.blocked, healed: this.healed,
      survivors: this.units.filter(u => u.team === 'ally' && u.hp > 0).length };
    for (const unit of this.units) unit.action = 'idle';
    this.event('result', 500, won ? 'ally' : 'enemy');
  }

  private event(type: BattleEvent['type'], x: number, team: Team, amount?: number, sourceId?: number, targetId?: number): void {
    this.events.push({ id: this.nextEventId++, type, x, team, amount, sourceId, targetId });
    if (this.events.length > 24) this.events.shift();
  }
}
