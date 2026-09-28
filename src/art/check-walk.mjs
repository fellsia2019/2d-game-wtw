import assert from 'node:assert/strict';
import { walkLeg } from './walk-cycle.mjs';
for(const heavy of [false,true])for(let phase=0;phase<8;phase++) {
 const legs=[walkLeg(phase,false,heavy),walkLeg(phase,true,heavy)];
 assert(legs.some(leg=>leg.grounded),'A foot must support the body at every phase');
 for(const {hip,knee,ankle,foot,pivot,grounded} of legs) {
  assert(Math.abs(Math.hypot(knee.x-hip.x,knee.y-hip.y)-24)<1e-8,'Thigh length changed');
  assert(Math.abs(Math.hypot(ankle.x-knee.x,ankle.y-knee.y)-25)<1e-8,'Shin length changed');
  assert((knee.x-hip.x)*(ankle.y-hip.y)-(knee.y-hip.y)*(ankle.x-hip.x)>=0,'Backwards knee');
  for(const x of [-7,14]) {
   const soleY=foot.y+(x-pivot)*Math.sin(foot.pitch*Math.PI/180);
   assert(soleY<=176+1e-8,'Foot penetrates the ground');
  }
  if(grounded)assert.equal(foot.y,176);
 }
}
assert(walkLeg(0).foot.x>walkLeg(0,true).foot.x);
assert(walkLeg(4).foot.x<walkLeg(4,true).foot.x,'Legs must exchange the leading position');
console.log('Walk geometry: fixed leg lengths, forward knees, support and ground clearance verified.');
