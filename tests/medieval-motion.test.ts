import {describe,it,expect} from 'vitest';
import {medievalSignalFrame,medievalTreatmentFrame} from '../src/art/medieval-motion';

describe('medieval workshop role timing',()=>{
 it('keeps the horn at the lips for a long note instead of immediately lowering it',()=>{
  for(const age of [.35,.5,.8,1,1.3,1.7]) {
   const frame=medievalSignalFrame(age);
   expect(frame).toBeGreaterThanOrEqual(24);
   expect(frame).toBeLessThanOrEqual(39);
  }
  expect(medievalSignalFrame(1.9)).toBeGreaterThanOrEqual(40);
  expect(medievalSignalFrame(2.2)).toBe(0);
 });
 it('plays every raise/hold/lower frame and rests before repeating at either render rate',()=>{
  for(const hz of [60,144]) {
   const frames=new Set(Array.from({length:Math.ceil(2.8*hz)},(_,i)=>medievalSignalFrame(i/hz)));
   expect([...frames].sort((a,b)=>a-b)).toEqual([0,...Array.from({length:32},(_,i)=>16+i)]);
   expect(medievalSignalFrame(2.8+.8)).toBe(medievalSignalFrame(.8));
  }
 });
 it('holds the offered bandage, then retracts the hand and returns to rest',()=>{
  for(const age of [.65,.9,1.2,1.4])expect(medievalTreatmentFrame(age)).toBe(13);
  expect(medievalTreatmentFrame(1.6)).toBe(14);
  expect(medievalTreatmentFrame(1.9)).toBe(15);
  expect(medievalTreatmentFrame(2.2)).toBe(0);
 });
});

import {UnitMotion} from '../src/view/UnitMotion';
import type {UnitState} from '../src/core/types';
const unit=(kind:UnitState['kind']):UnitState=>({id:1,kind,team:'ally',x:400,hp:100,maxHp:100,cooldown:0,action:'idle',facing:1});
it('uses the approved horn hold in battle, freezes on pause and resets after walking',()=>{
 const u=unit('medievalHorn'),motion=new UnitMotion(u,0);let pose=motion.advance(0);
 for(let i=0;i<60;i++)pose=motion.advance(1/60);
 expect(pose.frame).toBeGreaterThanOrEqual(24);expect(pose.frame).toBeLessThanOrEqual(39);
 for(let i=0;i<120;i++)expect(motion.advance(1/60,true)).toEqual(pose);
 u.action='move';motion.sample(u,.1);expect(motion.advance(1/60).frame).toBeLessThan(10);
 u.action='idle';motion.sample(u,.2);expect(motion.advance(1/60).frame).toBe(16);
 motion.reset(u,0);expect(motion.advance(0).frame).toBe(16);
});
it('keeps treatment visible for two seconds and cancels it when the healer starts walking',()=>{
 const u=unit('medievalHealer'),motion=new UnitMotion(u,0);motion.triggerStrike();
 for(let i=0;i<60;i++)motion.advance(1/60);
 expect(motion.advance(0).frame).toBe(13);
 motion.triggerStrike();expect(motion.advance(0).frame).toBe(13);
 for(let i=0;i<50;i++)motion.advance(1/60);
 expect(motion.advance(0).frame).toBe(15);
 u.action='move';motion.sample(u,.1);expect(motion.advance(1/60).frame).toBeLessThan(10);
 motion.reset(u,0);motion.triggerStrike();for(let i=0;i<121;i++)motion.advance(1/60);expect(motion.advance(0).frame).toBeLessThan(10);
});
