import type { UnitState } from '../core/types';
import { unitRole } from '../data/content';
import { medievalSignalFrame, medievalTreatmentFrame } from '../art/medieval-motion';
import { standardFrame } from './SupportMotion';

export interface UnitPose { x: number; frame: number; facing: 1 | -1 }

/** Presentation only: one-tick position interpolation and independent pose clocks. */
export class UnitMotion {
  private previousX: number;
  private targetX: number;
  private tickTime: number;
  private previousTime: number;
  private visualTime: number;
  private walkAge = 0;
  private strikeAge = -1;
  private supportAge = 0;
  private standard = false;
  private strikeDuration = .4;
  private cooldown = 0;
  private kind: UnitState['kind'];
  private action: UnitState['action'];
  private facing: 1 | -1;
  private strikeFacing: 1 | -1;
  private pose: UnitPose;
  constructor(unit: UnitState, time: number) {
    this.kind = unit.kind;
    this.standard = unitRole(unit.kind) === 'banner';
    this.previousX = this.targetX = unit.x; this.tickTime = time;
    this.previousTime = time; this.visualTime = time - 1 / 30;
    this.action = unit.action; this.facing = this.strikeFacing = unit.facing;
    this.pose = { x: unit.x, frame: 0, facing: unit.facing };
  }
  sample(unit: UnitState, time: number): void {
    if (time < this.tickTime || Math.abs(unit.x - this.targetX) > 100) { this.reset(unit, time); return; }
    if (time > this.tickTime) {
      this.previousX = this.targetX;
      this.targetX = unit.x;
      this.previousTime = this.tickTime;
      this.tickTime = time;
    }
    if (this.action !== unit.action && unit.action !== 'move') this.walkAge = 0;
    if (unit.action === 'move' && this.kind === 'medievalHealer') this.strikeAge = -1;
    this.cooldown = unit.cooldown;
    this.action = unit.action;
    this.facing = unit.facing;
  }
  triggerStrike(): void {
    if (this.standard) return;
    // A splash can emit several events from one source. Never rewind an active strike.
    if (this.strikeAge >= 0) return;
    this.strikeDuration = ['highCrossbow', 'highTrebuchet'].includes(this.kind) ? Math.max(.1, this.cooldown || 4) : this.kind === 'medievalHealer' ? 2 : .4;
    this.strikeAge = 0; this.strikeFacing = this.facing;
  }
  advance(delta: number, paused = false): UnitPose {
    if (paused) return { ...this.pose };
    const dt = Math.max(0, Math.min(.05, delta));
    this.visualTime = Math.min(this.tickTime, this.visualTime + dt);
    if (this.action === 'move') this.walkAge += dt;
    if (this.standard) this.supportAge = this.action === 'move' ? 0 : this.supportAge + dt;
    if (this.strikeAge >= 0) {
      this.strikeAge += dt;
      if (this.strikeAge >= this.strikeDuration) this.strikeAge = -1;
    }
    const interval = this.tickTime - this.previousTime;
    const alpha = interval > 0 ? Math.max(0, Math.min(1, (this.visualTime - this.previousTime) / interval)) : 1;
    const walkFps = this.kind === 'medievalHealer' ? 8 : this.kind === 'medievalBerserker' ? 10 : 12;
    let frame = this.action === 'attack' ? 1 : 0;
    if (this.strikeAge >= 0) frame = ['highCrossbow', 'highTrebuchet'].includes(this.kind)
      ? 16 + Math.min(31, Math.floor(this.strikeAge / this.strikeDuration * 32)) : this.kind === 'medievalHealer'
      ? medievalTreatmentFrame(this.strikeAge) : 10 + Math.min(5, Math.floor(this.strikeAge * 15));
    else if (this.action === 'move') frame = 2 + Math.floor(this.walkAge * walkFps) % 8;
    else if (this.standard) frame = this.kind === 'highHerald' ? 16 + Math.floor(this.supportAge * 16) % 32 : this.kind === 'medievalHorn'
      ? medievalSignalFrame(this.supportAge) : standardFrame(this.supportAge);
    this.pose = {
      x: this.previousX + (this.targetX - this.previousX) * alpha,
      frame,
      facing: this.strikeAge >= 0 ? this.strikeFacing : this.facing
    };
    return { ...this.pose };
  }
  reset(unit: UnitState, time: number): void {
    this.previousX = this.targetX = unit.x; this.tickTime = this.previousTime = time; this.visualTime = time - 1 / 30;
    this.walkAge = 0; this.strikeAge = -1; this.action = unit.action;
    this.kind = unit.kind;
    this.supportAge = 0; this.standard = unitRole(unit.kind) === 'banner';
    this.facing = this.strikeFacing = unit.facing;
    this.pose = { x: unit.x, frame: 0, facing: unit.facing };
  }
}
