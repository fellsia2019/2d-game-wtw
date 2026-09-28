/** Scout arm construction, with role-specific hands for the slingshot. */
const rest={x:124,y:107,pull:0,loaded:true,rearX:88,rearY:108,holding:false};
const shots=[
 {x:139,y:121,pull:31,loaded:true,holding:true},
 {x:144,y:121,pull:44,loaded:true,holding:true},
 {x:144,y:121,pull:0,loaded:false,rearX:99,rearY:98,holding:false,shot:{x:29,y:-25}},
 {x:144,y:121,pull:2,loaded:false,rearX:95,rearY:103,holding:false,shot:{x:55,y:-26}},
 {x:132,y:114,pull:0,loaded:false,rearX:91,rearY:111,holding:false},
 rest
];
export function slingerPose(frame) {
 const pose=frame>=10?shots[frame-10]:frame===1?shots[0]:rest;
 const rearX=pose.rearX??pose.x-pose.pull,rearY=pose.rearY??pose.y-25;
 return {...pose,angle:0,rearX,rearY,
  drawArm:{shoulder:{x:78,y:86},elbow:{x:65,y:101},hand:{x:rearX,y:rearY}},
  gripArm:{shoulder:{x:109,y:86},elbow:{x:(pose.x+108)/2,y:pose.y-5},hand:{x:pose.x,y:pose.y}}
 };
}
