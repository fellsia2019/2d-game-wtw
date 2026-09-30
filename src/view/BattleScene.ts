import Phaser from 'phaser';
import type { BattleEvent, GameState, UnitState } from '../core/types';
import { asset, unitArt, roleOf } from '../art/catalog';
import { UnitMotion } from './UnitMotion';
import { battlefieldLayout, type BattleInsets } from './BattleLayout';
import { UNITS, ERA_ORDER, isBoss as bossKind } from '../data/content';

type Figure = { image: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse; bar: Phaser.GameObjects.Graphics; motion: UnitMotion; hurt: number; texture: string };

export class BattleScene extends Phaser.Scene {
  private snapshot!: GameState;
  private figures = new Map<number, Figure>();
  private figurePool: Figure[] = [];
  private background!: Phaser.GameObjects.Image;
  private towers!: [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  private damage!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private effects: { event: BattleEvent; age: number; sourceX?: number }[] = [];
  private seen = 0;
  private runSeed = -1;
  private phaseIndex = -1;
  private ready = false;
  private loadFailed = false;
  private currentArena = '';
  private lastSimulationTime = 0;
  private insets: BattleInsets = { top: 190, bottom: 210, left: 12, right: 12 };
  setInsets(insets: BattleInsets) { this.insets = insets; this.layout(); }
  constructor(private read: () => GameState, private onEffect: (event: BattleEvent) => void,
    private onReady: () => void = () => {}) { super('battle'); }
  preload() {
    this.load.on('loaderror', () => { this.loadFailed = true; });
    for (const era of ERA_ORDER) {
      this.load.svg(`arena-${era}`, asset(`arena-${era}`), { width: 1600, height: 600 });
      for (const team of ['ally','enemy']) this.load.svg(`${era}-tower-${team}`, asset(`${era}-tower-${team}`), { width: 240, height: 240 });
    }
    for (const key of new Set(Object.values(unitArt))) {
      if (key !== 'world-wars-boss') this.load.spritesheet(key, asset(key).replace('.svg', '-sheet.png'), { frameWidth: 320, frameHeight: 192 });
      this.load.spritesheet(`enemy-${key}`, asset(`enemy-${key}`).replace('.svg', '-sheet.png'), { frameWidth: 320, frameHeight: 192 });
    }
  }
  create() {
    this.background = this.add.image(0, 0, 'arena-stone').setOrigin(0);
    this.towers = [this.add.image(0, 0, 'stone-tower-ally').setOrigin(.5, 1), this.add.image(0, 0, 'stone-tower-enemy').setOrigin(.5, 1)];
    this.damage = this.add.graphics().setDepth(2);
    this.fx = this.add.graphics().setDepth(100);
    this.ready = true;
    this.scale.on('resize', this.layout, this);
    this.layout();
    this.game.canvas.setAttribute('aria-label', 'Поле боя: союзники слева, враги справа. Бой идёт автоматически.');
    this.game.canvas.setAttribute('role', 'img');
    if (!this.loadFailed) requestAnimationFrame(() => this.onReady());
  }
  private metrics() { return battlefieldLayout(this.scale.width, this.scale.height, this.insets); }
  private point(x: number) { const { left, right } = this.metrics(); return left + x / 1000 * (right - left); }
  private baseline() { return this.metrics().baseline; }
  private size() { return this.metrics().unitScale; }
  private layout() {
    if (!this.ready) return;
    const { width: w, height: h } = this.scale;
    const sceneHeight = Math.max(h, this.baseline() / .82);
    const sceneWidth = Math.max(w, sceneHeight * 1200 / 450);
    this.background.setDisplaySize(sceneWidth, sceneHeight).setPosition((w - sceneWidth) / 2, this.baseline() - sceneHeight * .82);
    const arenaId = this.currentArena.split(':')[1];
    this.cameras.main.setBackgroundColor(arenaId === 'citadel' ? '#443b39' : arenaId === 'iron' || arenaId === 'arrows' ? '#394f5b' : '#383f3d');
    const size = this.metrics().towerSize;
    this.towers[0].setPosition(this.point(0), this.baseline() + 12).setDisplaySize(size, size);
    this.towers[1].setPosition(this.point(1000), this.baseline() + 12).setDisplaySize(size, size);
  }
  update(_time: number, delta: number) {
    if (!this.ready) return;
    const state = this.read(); this.snapshot = state;
    if (this.currentArena !== `${state.eraId}:${state.arenaId}`) {
      this.currentArena = `${state.eraId}:${state.arenaId}`;
      this.towers[0].setTexture(`${state.eraId}-tower-ally`);
      this.towers[1].setTexture(`${state.eraId}-tower-enemy`);
      this.background.setTexture(`arena-${state.eraId}`);
      this.layout();
    }
    const reset = state.seed !== this.runSeed || state.battleIndex !== this.phaseIndex || state.elapsed < this.lastSimulationTime || (state.events.length > 0 && state.events[state.events.length - 1].id < this.seen);
    if (reset) {
      this.seen = 0; this.effects = []; this.runSeed = state.seed; this.phaseIndex = state.battleIndex;
      for (const figure of this.figures.values()) this.recycle(figure);
      this.figures.clear();
    }
    this.lastSimulationTime = state.elapsed;
    const dt = state.paused ? 0 : Math.min(delta, 50) / 1000;
    const alive = new Set(state.units.map(u => u.id));
    for (const [id, figure] of this.figures) if (!alive.has(id)) { this.recycle(figure); this.figures.delete(id); }
    for (const unit of state.units) this.ensureFigure(unit).motion.sample(unit, state.elapsed);
    const struck = new Set<number>();
    for (const event of state.events) if (event.id > this.seen) {
      this.seen = event.id;
      const source = state.units.find(u => u.id === event.sourceId);
      this.effects.push({ event, age: 0, sourceX: source?.x });
      const figure = event.sourceId == null ? undefined : this.figures.get(event.sourceId);
      if (figure && event.sourceId != null && ['attack', 'heal', 'fortress', 'drone-launch'].includes(event.type) && !struck.has(event.sourceId)) {
        figure.motion.triggerStrike(); struck.add(event.sourceId);
      }
      const target = event.targetId == null ? undefined : this.figures.get(event.targetId);
      if (target && (event.type === 'attack' || event.type === 'block' || event.type === 'drone-explode')) target.hurt = .15;
      this.onEffect(event);
    }
    for (const unit of state.units) this.drawUnit(unit, dt, state.paused);
    this.drawDamage();
    this.drawEffects(dt);
  }
  private recycle(figure: Figure) {
    figure.image.setVisible(false); figure.shadow.setVisible(false); figure.bar.clear().setVisible(false);
    this.figurePool.push(figure);
  }
  private ensureFigure(unit: UnitState): Figure {
    let figure = this.figures.get(unit.id);
    const texture = `${unit.team === 'enemy' ? 'enemy-' : ''}${unitArt[unit.kind]}`;
    if (!figure) {
      figure = this.figurePool.pop();
      if (figure) {
        figure.image.setTexture(texture, 0).setVisible(true).clearTint(); figure.shadow.setVisible(true); figure.bar.setVisible(true);
        figure.motion.reset(unit, this.snapshot.elapsed); figure.hurt = 0; figure.texture = texture;
      } else {
        const image = this.add.image(0, 0, texture, 0).setOrigin(.5, 176 / 192);
        const shadow = this.add.ellipse(0, 0, 52, 11, 0x0b1c23, .35);
        figure = { image, shadow, bar: this.add.graphics(), motion: new UnitMotion(unit, this.snapshot.elapsed), hurt: 0, texture };
      }
      this.figures.set(unit.id, figure);
    }
    if (figure.texture !== texture) { figure.image.setTexture(texture, 0); figure.motion.reset(unit, this.snapshot.elapsed); figure.texture = texture; }
    return figure;
  }
  private drawUnit(unit: UnitState, dt: number, paused: boolean) {
    const figure = this.figures.get(unit.id)!;
    const pose = figure.motion.advance(dt, paused);
    const isBoss = bossKind(unit.kind);
    const room = this.baseline() - this.insets.top;
    const eraScale = this.snapshot.eraId === 'modern' ? Math.min(this.size() * 1.15, (room - 9) / 176) : this.size();
    const x = this.point(pose.x), scale = eraScale * (isBoss ? 1.5 : 1);
    const y = this.baseline() + (unit.id % 4) * (this.scale.width < 650 ? 4 : 6);
    figure.hurt = Math.max(0, figure.hurt - dt);
    figure.image.setPosition(x, y).setScale(scale).setDepth(y).setAngle(0).setFrame(pose.frame).setFlipX(pose.facing < 0);
    if (figure.hurt > 0) figure.image.setTint(0xffdbbf); else figure.image.clearTint();
    figure.shadow.setPosition(x, y - 2).setDisplaySize(104 * scale, 22 * scale).setDepth(y - 1);
    figure.bar.clear().setDepth(y + 1);
    const barY = y - 174 * scale - 7;
    const barWidth = isBoss ? 56 : 32;
    const barLeft = x - barWidth / 2;
    const hpWidth = barWidth * Math.max(0, Math.min(1, unit.hp / unit.maxHp));
    const armor = UNITS[unit.kind].armor;
    figure.bar.fillStyle(0x11242a, .85).fillRoundedRect(barLeft, barY, barWidth, 5, 2);
    figure.bar.fillStyle(isBoss ? 0xffd16f : unit.team === 'ally' ? 0x91dbc0 : 0xf0a188).fillRoundedRect(barLeft, barY, hpWidth, 5, 2);
    if (armor > 0) {
      // Armor is a texture within remaining HP, not an ambiguous extra glyph.
      // Heavier armor has denser hatching; keep every stroke inside the fill.
      figure.bar.lineStyle(1, 0xffffff, .8);
      const spacing = armor >= .35 ? 5 : 8;
      for (let offset = 3; offset + 3 <= hpWidth - 1; offset += spacing) {
        figure.bar.lineBetween(barLeft + offset, barY + 4, barLeft + 3 + offset, barY + 1);
      }
    }
    if (isBoss) figure.bar.lineStyle(2, 0xffd16f, .8).strokeEllipse(x, y - 2, 88 * scale, 18 * scale);
    if (roleOf(unit.kind) === 'banner' && unit.kind !== 'modernDroneOperator') figure.bar.lineStyle(1, unit.team === 'ally' ? 0xd1dd96 : 0xf1a18b, .22).strokeEllipse(x, y - 2, this.scale.width < 650 ? 65 : 140, 13);
    if ((unit.suppressedUntil ?? 0) > this.snapshot.elapsed) figure.bar.lineStyle(2, 0x8cc9d7, .85).strokeEllipse(x, y - 3, 65 * scale, 15 * scale);
    if ((unit.exposedUntil ?? 0) > this.snapshot.elapsed) figure.bar.lineStyle(2, 0xf6c46d, .9).strokeCircle(x, barY - 4, 6);
  }
  private drawDamage() {
    this.damage.clear();
    const scale = this.metrics().towerSize / 190;
    this.damage.setScale(scale);
    const state = this.snapshot;
    [state.allyFortressHp, state.enemyFortressHp].forEach((hp, i) => {
      const maxHp = i === 0 ? state.allyFortressMaxHp : state.fortressMaxHp;
      const x = this.point(i * 1000) / scale, y = this.baseline() / scale;
      if (hp / maxHp < .65) this.damage.lineStyle(3, 0x24272b, .9).beginPath().moveTo(x - 15, y - 75).lineTo(x - 4, y - 61).lineTo(x - 10, y - 48).lineTo(x + 5, y - 28).strokePath();
      if (hp / maxHp < .3) this.damage.fillStyle(0xff9a63, .12 + Math.sin(state.elapsed * 5) * .06).fillCircle(x, y - 30, 24);
    });
    if (state.enemyGlyphRemaining > 0) {
      const x = this.point(1000) / scale, y = this.baseline() / scale - 60;
      const pulse = (Math.sin(state.elapsed * 5) + 1) / 2;
      this.damage.fillStyle(0x79dfff, .13 + pulse * .08).fillEllipse(x, y, 180, 180);
      this.damage.lineStyle(4, 0xb3f1ff, .65 + pulse * .25).strokeEllipse(x, y, 180, 180);
      // Shield emblem on the visible side of the enemy fortress.
      this.damage.lineStyle(3, 0xd3faff, 1).beginPath().moveTo(x - 70, y - 20).lineTo(x - 40, y - 20).lineTo(x - 40, y + 3).lineTo(x - 55, y + 18).lineTo(x - 70, y + 3).closePath().strokePath();
    }
    if (state.bossPhase === 'warning' || state.bossPhase === 'assault') {
      const x = this.point(1000) / scale, y = this.baseline() / scale - 115;
      const pulse = (Math.sin(state.elapsed * 7) + 1) / 2;
      this.damage.lineStyle(3, 0xffbd83, .3 + pulse * .6).strokeCircle(x, y, 22 + pulse * 13);
      this.damage.fillStyle(0xffa975, .12 + pulse * .12).fillCircle(x, y, 20 + pulse * 10);
      this.damage.lineStyle(3, 0xffd899, .9).lineBetween(x, y - 13, x, y + 3);
      this.damage.fillStyle(0xffd899).fillCircle(x, y + 10, 2);
    }
  }
  private drawEffects(dt: number) {
    this.fx.clear();
    const scale = Math.min(1, this.size() / .52);
    this.fx.setScale(scale);
    this.effects = this.effects.filter(effect => effect.age < .6).slice(-40);
    for (const effect of this.effects) {
      effect.age += dt;
      const { event, age } = effect, p = Math.min(1, age / .6), alpha = 1 - p;
      const x = this.point(event.x) / scale, y = this.baseline() / scale - 42;
      if (event.type === 'heal') {
        this.fx.lineStyle(2, 0xe3bdec, alpha).strokeCircle(x, y, 12 + p * 25);
        this.fx.lineStyle(3, 0xf3d7f3, alpha).lineBetween(x - 6, y - p * 24, x + 6, y - p * 24).lineBetween(x, y - 6 - p * 24, x, y + 6 - p * 24);
      } else if (event.type === 'attack' || event.type === 'fortress') {
        if (effect.sourceX != null && Math.abs(effect.sourceX - event.x) > 70 && p < .45) {
          const start = this.point(effect.sourceX) / scale, target = Phaser.Math.Linear(start, x, p / .45);
          this.fx.lineStyle(2, 0xf6ddb0, alpha).lineBetween(target - Math.sign(x - start) * 15, y - Math.sin(p / .45 * Math.PI) * 28, target, y - Math.sin(p / .45 * Math.PI) * 28);
        }
        this.fx.lineStyle(2, 0xffdc9c, alpha);
        for (let n = 0; n < 5; n++) { const a = n * 1.256; this.fx.lineBetween(x + Math.cos(a) * (4 + p * 10), y + Math.sin(a) * (4 + p * 10), x + Math.cos(a) * (9 + p * 23), y + Math.sin(a) * (9 + p * 23)); }
        if (event.type === 'fortress') this.fx.lineStyle(3, 0xf1aa79, alpha).strokeCircle(x, y, 10 + p * 32);
      } else if (event.type === 'drone-explode') {
        this.fx.fillStyle(0xffbb73, alpha * .35).fillCircle(x, y - 18, 9 + p * 40);
        this.fx.lineStyle(3, 0xffe4a5, alpha).strokeCircle(x, y - 18, 8 + p * 32);
        for (let n = 0; n < 7; n++) { const a = n * Math.PI * 2 / 7; this.fx.lineBetween(x + Math.cos(a) * (8 + p * 18), y - 18 + Math.sin(a) * (8 + p * 18), x + Math.cos(a) * (17 + p * 45), y - 18 + Math.sin(a) * (17 + p * 45)); }
      } else if (event.type === 'boss-warning' || event.type === 'boss-assault') {
        this.fx.lineStyle(3, 0xffc68b, alpha).strokeEllipse(this.point(1000) / scale, y - 25, 25 + p * 100, 35 + p * 70);
      } else if (event.type === 'suppress') {
        this.fx.lineStyle(2, 0x8cc9d7, alpha).strokeEllipse(x, y + 25, 26 + p * 32, 10 + p * 15);
      } else if (event.type === 'expose') {
        this.fx.lineStyle(2, 0xf6c46d, alpha).strokeCircle(x, y - 28, 8 + p * 18);
      } else if (event.type === 'block') this.fx.lineStyle(3, 0xc4ebed, alpha).strokeRoundedRect(x - 13 - p * 5, y - 18, 26 + p * 10, 36, 8);
      else if (event.type === 'spawn') this.fx.lineStyle(2, event.team === 'ally' ? 0x8ce1c4 : 0xeb9d85, alpha).strokeEllipse(x, this.baseline() / scale, 30 + p * 35, 8 + p * 10);
      else if (event.type === 'death') {
        this.fx.fillStyle(event.team === 'ally' ? 0x8dbcae : 0xb88d7d, alpha * .5);
        for (let n = 0; n < 5; n++) this.fx.fillCircle(x + Math.sin(n * 12) * p * 20, y + 10 + p * 20 + n * 2, 2 + p * 2);
      }
    }
    for (const drone of this.snapshot.droneStrikes) {
      const x = this.point(Phaser.Math.Linear(drone.startX, drone.targetX, drone.progress)) / scale;
      const y = this.baseline() / scale - 72 - Math.sin(drone.progress * Math.PI) * 32;
      this.fx.lineStyle(2, 0xa9c6ca, 1).lineBetween(x - 15, y - 7, x + 15, y + 7).lineBetween(x - 15, y + 7, x + 15, y - 7);
      this.fx.fillStyle(drone.team === 'ally' ? 0x345d68 : 0x70424b, 1).fillEllipse(x, y, 24, 10);
      this.fx.fillStyle(0xe9a78f, 1).fillCircle(x + Math.sign(drone.targetX - drone.startX) * 9, y, 3);
      this.fx.fillStyle(0x1d3038, 1);
      for (const dx of [-17,17]) for (const dy of [-8,8]) this.fx.fillEllipse(x + dx, y + dy, 12, 4);
    }
  }
}
