import assert from 'node:assert/strict';
import { slingerPose } from './slinger-pose.mjs';
const poses=Array.from({length:6},(_,i)=>slingerPose(i+10));
for(let frame=0;frame<16;frame++) {
 const pose=slingerPose(frame);
 for(const arm of [pose.drawArm,pose.gripArm]) {
  const ax=arm.shoulder.x-arm.elbow.x,ay=arm.shoulder.y-arm.elbow.y;
  const bx=arm.hand.x-arm.elbow.x,by=arm.hand.y-arm.elbow.y;
  const upper=Math.hypot(ax,ay),fore=Math.hypot(bx,by);
  const elbowAngle=Math.acos((ax*bx+ay*by)/(upper*fore))*180/Math.PI;
  assert(upper>=16&&upper<=40&&fore>=8&&fore<=44,'Projected arm proportions');
  assert(elbowAngle>=28,'Do not fold the forearm against the upper arm');
  assert(arm.elbow.y>arm.shoulder.y,'Elbow stays below the shoulder in these poses');
 }
 if(pose.holding) {
  assert.equal(pose.rearX,pose.x-pose.pull,'Pulling hand must hold the pouch');
  assert.equal(pose.rearY,pose.y-25);
 }
}
assert(poses[1].pull>poses[0].pull,'Draw the projectile backwards before release');
for(const pose of poses)assert.equal(pose.angle,0,'The fork must never swing');
for(const pose of poses.slice(1,4)) {
 assert.equal(pose.x,poses[1].x,'The forward gripping hand must remain fixed during release');
 assert.equal(pose.y,poses[1].y);
}
const grip=poses[1].gripArm;
assert(Math.hypot(grip.hand.x-grip.shoulder.x,grip.hand.y-grip.shoulder.y)>45,'Extend the forward arm toward the target');
assert(poses[1].loaded&&!poses[2].loaded&&!poses[3].loaded);
assert(poses[2].shot.x>0&&poses[3].shot.x>poses[2].shot.x,'Projectile must travel away from the fork');
assert(poses[5].loaded,'Reload before returning to readiness');
console.log('Ranged action: fixed fork, draw, release, outgoing projectile and reload verified.');
