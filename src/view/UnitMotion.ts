import type { UnitState } from '../core/types';
import { unitRole } from '../data/content';
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
  private action: UnitState['action'];
  private facing: 1 | -1;
  private strikeFacing: 1 | -1;
  private pose: UnitPose;
  constructor(unit: UnitState, time: number) {
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
    this.action = unit.action;
    this.facing = unit.facing;
  }
  triggerStrike(): void {
    if (this.standard) return;
    // A splash can emit several events from one source. Never rewind an active strike.
    if (this.strikeAge >= 0) return;
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
      if (this.strikeAge >= .4) this.strikeAge = -1;
    }
    const interval = this.tickTime - this.previousTime;
    const alpha = interval > 0 ? Math.max(0, Math.min(1, (this.visualTime - this.previousTime) / interval)) : 1;
    this.pose = {
      x: this.previousX + (this.targetX - this.previousX) * alpha,
      frame: this.strikeAge >= 0 ? 10 + Math.min(5, Math.floor(this.strikeAge * 15)) : this.action === 'move' ? 2 + Math.floor(this.walkAge * 12) % 8 : this.standard ? standardFrame(this.supportAge) : this.action === 'attack' ? 1 : 0,
      facing: this.strikeAge >= 0 ? this.strikeFacing : this.facing
    };
    return { ...this.pose };
  }
  reset(unit: UnitState, time: number): void {
    this.previousX = this.targetX = unit.x; this.tickTime = this.previousTime = time; this.visualTime = time - 1 / 30;
    this.walkAge = 0; this.strikeAge = -1; this.action = unit.action;
    this.supportAge = 0; this.standard = unitRole(unit.kind) === 'banner';
    this.facing = this.strikeFacing = unit.facing;
    this.pose = { x: unit.x, frame: 0, facing: unit.facing };
  }
}
