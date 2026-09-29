import {expect,it} from 'vitest';
import {UnitMotion} from '../src/view/UnitMotion';
import type {UnitState} from '../src/core/types';
it.each(['highCrossbow','highTrebuchet'] as const)('%s plays every reload frame, scales with cooldown and freezes on pause',kind=>{
 for(const duration of [4,2])for(const facing of [1,-1] as const){
  const unit:UnitState={id:1,kind,team:facing===1?'ally':'enemy',x:400,hp:80,maxHp:80,cooldown:duration,action:'attack',facing};
  const motion=new UnitMotion(unit,0);motion.sample(unit,1/30);motion.triggerStrike();
  const frames=new Set<number>();
  for(let i=0;i<duration*60-1;i++){
   const pose=motion.advance(1/60);frames.add(pose.frame);expect(pose.facing).toBe(facing);
   if(i===20){motion.triggerStrike();expect(motion.advance(0,true)).toEqual(pose);}
  }
  expect([...frames].sort((a,b)=>a-b)).toEqual(Array.from({length:32},(_,i)=>16+i));
  for(let i=0;i<4;i++)motion.advance(1/60);
  expect(motion.advance(0).frame).toBe(1);
 }
});
it('herald stops its signal to walk without attacking',()=>{
 const unit:UnitState={id:1,kind:'highHerald',team:'ally',x:400,hp:80,maxHp:80,cooldown:0,action:'idle',facing:1};
 const motion=new UnitMotion(unit,0);const frames=new Set<number>();
 for(let i=0;i<120;i++)frames.add(motion.advance(1/60).frame);
 expect([...frames].sort((a,b)=>a-b)).toEqual(Array.from({length:32},(_,i)=>16+i));
 motion.sample({...unit,action:'move'},1/30);motion.triggerStrike();
 expect(motion.advance(1/60).frame).toBeGreaterThanOrEqual(2);expect(motion.advance(0).frame).toBeLessThanOrEqual(9);
});
