import { ERA_BATTLES, ERA_HIRE_KINDS, ERA_STARTER_KINDS, UNITS, unitRole } from '../data/content';
import type { BattleEvent, BattleReport, BossPhase, ContractOption, DoctrineId, EraId, HireKind, Team, UnitKind, UnitState, UpgradeId } from './types';
import { Random } from './random';
import { emptyTalentProgress, talentMultiplier, type TalentLevels } from './talents';

const FORT = { ally: 65, enemy: 935 } as const;
const LIMIT = 12;
const STEP = 1 / 30;

export class BattleSimulation {
  readonly battleIndex: number;
  readonly eraId: EraId;
  readonly upgrades: UpgradeId[];
  readonly doctrine: DoctrineId;
  readonly roster: HireKind[];
  readonly contract: ContractOption;
  readonly random: Random;
  readonly talents: TalentLevels;
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
  private ambushUsed = new Set<number>();
  private reserveUsed = false;

  constructor(battleIndex: number, upgrades: UpgradeId[], seed: number, doctrine: DoctrineId = 'steel', roster?: HireKind[], contract?: ContractOption, eraId: EraId = 'legacy', talents: TalentLevels = emptyTalentProgress().levels) {
    this.eraId = eraId;
    this.battleIndex = battleIndex;
    this.upgrades = [...upgrades];
    this.talents = { ...talents };
    this.doctrine = doctrine;
    this.roster = [...(roster ?? ERA_STARTER_KINDS[eraId])];
    const battle = ERA_BATTLES[eraId][battleIndex];
    this.contract = contract ?? { id: `${battleIndex}-standard`, name: battle.name, threat: battle.threat,
      roster: battle.roster, condition: 'Обычный бой', reward: '1 знак контракта',
      enemyIncome: battle.enemyIncome, marks: 1, risk: 'standard' };
    this.random = new Random((seed ^ Math.imul(battleIndex + 1, 0x9e3779b1)) >>> 0);
    if (doctrine === 'bargain') { this.resource = 20; this.allyFortressHp = 85; }
    if (this.contract.risk === 'daring') this.enemyResource = 20;
  }

  get resourceMax(): number { return 100 + (this.upgrades.includes('supply') ? 20 : 0); }
  get income(): number { return (6 + this.incomeUpgrades + (this.upgrades.includes('wagon') ? 1 : 0)) * talentMultiplier(this.talents.supply); }
  get incomeUpgradeCost(): number { return this.incomeUpgrades === 0 && this.upgrades.includes('workshop') ? 28 : 40; }
  get enemyIncome(): number { return this.contract.enemyIncome + (this.elapsed >= 300 ? 2 : 0); }
  get allyCount(): number { return this.units.filter(u => u.team === 'ally').length; }
  get enemyCount(): number { return this.units.filter(u => u.team === 'enemy').length; }

  hire(kind: HireKind): boolean {
    if (this.report || !ERA_HIRE_KINDS[this.eraId].includes(kind) || !this.roster.includes(kind) || this.allyCount >= LIMIT) return false;
    const cost = this.hireCost(kind);
    if (this.resource + 1e-8 < cost) return false;
    this.resource -= cost;
    this.hires++;
    this.spawn(kind, 'ally');
    return true;
  }

  hireCost(kind: HireKind): number {
    const firstDiscount = this.hires === 0 && this.upgrades.includes('contract') ? 8 : 0;
    const steelDiscount = this.doctrine === 'steel' && unitRole(kind) === 'shield' && !this.units.some(u => u.team === 'ally' && unitRole(u.kind) === 'shield') && this.hires === 0 ? 6 : 0;
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
    if (ERA_BATTLES[this.eraId][this.battleIndex].ai === 'boss') this.bossTick();
    if (!this.reserveUsed && this.upgrades.includes('lastReserve') && this.allyFortressHp < 35 && this.allyCount < LIMIT) {
      this.reserveUsed = true;
      this.spawn(ERA_STARTER_KINDS[this.eraId][0], 'ally');
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
    const plan = ERA_BATTLES[this.eraId][this.battleIndex].ai;
    const allyArchers = this.units.filter(u => u.team === 'ally' && unitRole(u.kind) === 'archer').length;
    const allyNearFort = this.units.some(u => u.team === 'ally' && u.x > 690);
    let kind: UnitKind;
    if (this.eraId === 'legacy') {
      if (plan === 'rush') kind = this.aiSequence % 4 === 3 ? 'shield' : 'raider';
      else if (plan === 'wall') kind = this.aiSequence % 3 === 2 ? 'enemyArcher' : 'bulwark';
      else if (plan === 'ranged') kind = (allyNearFort || this.aiSequence % 3 === 0) ? 'bulwark' : 'enemyArcher';
      else kind = this.aiSequence % 4 === 0 ? 'bulwark' : this.aiSequence % 4 === 1 ? 'enemyArcher' : 'raider';
      if (allyArchers >= 3 && plan === 'rush' && this.aiSequence % 3 === 0) kind = 'raider';
    } else {
      const enemies = this.contract.roster;
      if (plan === 'ranged') kind = enemies[(allyNearFort || this.aiSequence % 3 === 0) ? 0 : Math.min(1, enemies.length - 1)];
      else kind = enemies[this.aiSequence % enemies.length];
      if (allyArchers >= 3 && plan === 'rush' && this.aiSequence % 3 === 0) kind = enemies.find(id => unitRole(id) === 'raider') ?? kind;
      if (kind === 'stoneChief' || kind === 'bronzeKing') kind = enemies.find(id => id !== kind) ?? kind;
    }
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
        for (const kind of this.eraId === 'legacy' ? ['bulwark', 'raider', 'enemyArcher'] as UnitKind[] : this.contract.roster) {
          if (this.enemyCount < LIMIT) this.spawn(kind, 'enemy');
        }
      }
    } else if (this.bossPhase === 'assault' && !this.units.some(u => u.team === 'enemy' && u.x > 700)) {
      this.bossPhase = 'spent';
    }
  }

  private spawn(kind: UnitKind, team: Team): void {
    const def = UNITS[kind];
    const bonusHp = team === 'ally' && this.upgrades.includes('banner') && (unitRole(kind) === 'shield' || unitRole(kind) === 'spear') ? 1.15 : 1;
    const hp = Math.round(def.hp * bonusHp * (team === 'ally' ? talentMultiplier(this.talents.health) : 1));
    const unit: UnitState = { id: this.nextUnitId++, kind, team, x: team === 'ally' ? 105 : 895,
      hp, maxHp: hp, cooldown: .35, action: 'idle', facing: team === 'ally' ? 1 : -1 };
    if (team === 'ally' && unitRole(kind) === 'archer') {
      if (this.doctrine === 'arrow' && this.archersHired < 2) this.rangeBonuses.set(unit.id, 20);
      this.archersHired++;
    }
    this.units.push(unit);
    this.event('spawn', unit.x, team, undefined, unit.id);
  }

  private armor(unit: UnitState): number {
    const base = UNITS[unit.kind].armor;
    if (!['bronzeGuard', 'bronzeSpear', 'bronzeGate', 'bronzeEnemySpear'].includes(unit.kind)) return base;
    const formed = this.units.some(other => other.id !== unit.id && other.team === unit.team && other.hp > 0
      && ['bronzeGuard', 'bronzeSpear', 'bronzeGate', 'bronzeEnemySpear'].includes(other.kind)
      && Math.abs(other.x - unit.x) <= 72);
    return Math.min(.75, base + (formed ? .12 : 0));
  }

  private act(unit: UnitState): void {
    const def = UNITS[unit.kind];
    const range = def.range + (this.rangeBonuses.get(unit.id) ?? 0);
    if (unitRole(unit.kind) === 'medic') {
      const wounded = this.units.filter(u => u.team === unit.team && u.hp > 0 && u.hp < u.maxHp && Math.abs(u.x - unit.x) <= range)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id)[0];
      if (wounded && unit.cooldown <= 0) {
        unit.action = 'attack';
        if (wounded.x !== unit.x) unit.facing = wounded.x > unit.x ? 1 : -1;
        const amount = Math.min(wounded.maxHp - wounded.hp, (def.heal ?? 0) * (this.upgrades.includes('bandages') ? 1.2 : 1));
        wounded.hp += amount;
        this.healed += amount;
        unit.cooldown = def.period / (unit.team === 'ally' ? talentMultiplier(this.talents.attackSpeed) : 1);
        this.event('heal', wounded.x, unit.team, amount, unit.id, wounded.id);
        return;
      }
    }
    const enemies = this.units.filter(u => u.team !== unit.team && u.hp > 0);
    enemies.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x) || a.id - b.id);
    // Raiders slip through the first line to pressure ranged troops. Both teams
    // use the same rule, giving players a visible answer to archer-heavy armies.
    const backline = unitRole(unit.kind) === 'raider'
      ? enemies.find(u => UNITS[u.kind].range >= 100 && Math.abs(u.x - unit.x) <= 280)
      : undefined;
    const target = backline ?? enemies[0];
    const fortressX = FORT[unit.team === 'ally' ? 'enemy' : 'ally'];
    const targetX = target ? target.x : fortressX;
    const distance = Math.abs(targetX - unit.x);
    if (distance > range + (target ? 10 : 30)) {
      const direction = targetX > unit.x ? 1 : -1;
      const speed = def.speed * (unit.team === 'ally' && unitRole(unit.kind) === 'raider' && this.upgrades.includes('boots') ? 1.2 : 1);
      const previousX = unit.x;
      unit.x = Math.max(75, Math.min(925, unit.x + direction * Math.min(speed * STEP, distance - range)));
      unit.action = unit.x === previousX ? 'idle' : 'move';
      unit.facing = direction;
      return;
    }
    unit.action = 'attack';
    if (targetX !== unit.x) unit.facing = targetX > unit.x ? 1 : -1;
    if (unit.cooldown > 0) return;
    const banners = this.units.filter(u => u.team === unit.team && unitRole(u.kind) === 'banner' && u.id !== unit.id && Math.abs(u.x - unit.x) <= 110).length;
    unit.cooldown = def.period / ((1 + Math.min(2, banners) * (unit.team === 'ally' && this.upgrades.includes('standard') ? .24 : .16))
      * (unit.team === 'ally' ? talentMultiplier(this.talents.attackSpeed) : 1));
    if (target) {
      let raw = def.damage;
      if (['stoneScout', 'stoneHunter'].includes(unit.kind) && !this.ambushUsed.has(unit.id)) {
        this.ambushUsed.add(unit.id);
        if (UNITS[target.kind].range >= 100) raw *= 1.4;
      }
      if (unitRole(unit.kind) === 'spear' && UNITS[target.kind].armor > 0) raw *= (def.antiArmor ?? 1) + (this.upgrades.includes('pikes') ? .35 : 0);
      if (unitRole(unit.kind) === 'archer' && this.upgrades.includes('arrows')) raw *= 1.15;
      if (unit.team === 'ally') raw *= talentMultiplier(this.talents.damage);
      const armor = this.armor(target) * (unitRole(unit.kind) === 'spear' ? .3 : 1);
      const blocked = raw * armor;
      const dealt = Math.max(1, raw - blocked);
      target.hp -= dealt;
      if (unit.team === 'ally') { this.damageDealt += dealt; this.blocked += target.team === 'ally' ? blocked : 0; }
      else { this.damageTaken += dealt; if (target.team === 'ally') this.blocked += blocked; }
      this.event('attack', target.x, unit.team, dealt, unit.id, target.id);
      if (blocked) this.event('block', target.x, target.team, blocked, unit.id, target.id);
      if (target.hp <= 0) this.event('death', target.x, target.team, undefined, unit.id, target.id);
      if (unitRole(unit.kind) === 'thrower') {
        for (const secondary of enemies.filter(u => u.id !== target.id && Math.abs(u.x - target.x) <= 45).slice(0, 3)) {
          const splash = Math.max(1, def.damage * .5 * (unit.team === 'ally' ? talentMultiplier(this.talents.damage) : 1) * (1 - this.armor(secondary)));
          secondary.hp -= splash;
          if (unit.team === 'ally') this.damageDealt += splash; else this.damageTaken += splash;
          this.event('attack', secondary.x, unit.team, splash, unit.id, secondary.id);
          if (secondary.hp <= 0) this.event('death', secondary.x, secondary.team, undefined, unit.id, secondary.id);
        }
      }
    } else {
      // Fortresses have structural resistance: a field army needs sustained control,
      // while siege troops retain a clear finishing role.
      const damage = (unitRole(unit.kind) === 'medic' ? 1 : def.damage)
        * (unitRole(unit.kind) === 'siege' ? 2.5 : 1) * .22
        * (unit.team === 'ally' && unitRole(unit.kind) === 'siege' && this.upgrades.includes('siegecraft') ? 1.2 : 1)
        * (unit.team === 'ally' ? talentMultiplier(this.talents.damage) : 1);
      if (unit.team === 'ally') { this.enemyFortressHp = Math.max(0, this.enemyFortressHp - damage); this.damageDealt += damage; }
      else { this.allyFortressHp = Math.max(0, this.allyFortressHp - damage); this.damageTaken += damage; }
      this.event('fortress', fortressX, unit.team, damage, unit.id);
    }
  }

  private finish(won: boolean): void {
    const ai = ERA_BATTLES[this.eraId][this.battleIndex].ai;
    const lossCause = this.eraId === 'legacy'
      ? this.hires < 2 ? 'Твоя крепость пала: на защиту вышло слишком мало наёмников.'
        : ai === 'rush' ? 'Налётчики прорвались к твоей крепости. Ранний щит сдерживает натиск.'
        : ai === 'wall' ? 'Латники продавили строй. Копейщики пробивают их броню.'
        : ai === 'ranged' ? 'Вражеские стрелки расстреляли строй из-за латников. Нужен прорыв или дальний ответ.'
        : 'Волна Коменданта сломала оборону. Сохрани припасы к её предупреждению.'
      : this.hires < 2 ? 'Твоя крепость пала: на защиту вышло слишком мало бойцов.'
        : ai === 'rush' ? 'Быстрые враги прорвались к крепости. Ранний защитник сдерживает натиск.'
        : ai === 'wall' ? 'Защитники врага продавили строй. Бойцы с копьями пробивают их броню.'
        : ai === 'ranged' ? 'Вражеские стрелки атаковали из-за строя. Нужен прорыв или дальний ответ.'
        : 'Волна босса сломала оборону. Сохрани припасы к её предупреждению.';
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
