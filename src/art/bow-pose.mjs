/** Bow grip is local (0,0); the arrow rests above the gripping fingers. */
const shots=[
 {x:136,y:107,pull:27,loaded:true},
 {x:142,y:101,pull:42,loaded:true},
 {x:142,y:101,pull:15,loaded:false,rearX:98,rearY:94},
 {x:142,y:101,pull:15,loaded:false,rearX:96,rearY:99},
 {x:133,y:108,pull:22,loaded:true},
 {x:124,y:107,pull:22,loaded:true}
];
export function bowPose(frame) {
 const pose=frame>=10?shots[frame-10]:frame===1?{x:132,y:104,pull:27,loaded:true}:shots[5];
 return {...pose,angle:0,rearX:pose.rearX??pose.x-pose.pull,rearY:pose.rearY??pose.y-6};
}
