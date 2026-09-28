/** Side-view walk: contact, down, passing, up; then the other leg leads. */
const feet = [
 { stride: 1, lift: 0, pitch: -10 },
 { stride: .5, lift: 0, pitch: 0 },
 { stride: 0, lift: 0, pitch: 0 },
 { stride: -.5, lift: 0, pitch: 12 },
 { stride: -1, lift: 0, pitch: 22 },
 { stride: -.65, lift: 8, pitch: 5 },
 { stride: .1, lift: 13, pitch: -8 },
 { stride: .75, lift: 7, pitch: -12 }
];
export function walkBodyOffset(phase, heavy=false) {
 return [0,1.5,-1,-2,0,1.5,-1,-2][phase%8]*(heavy?.65:1);
}
export function walkLeg(phase, back=false, heavy=false) {
 const key=feet[(phase+(back?4:0))%8];
 const foot={x:96+key.stride*(heavy?16:18),y:176-key.lift,pitch:key.pitch};
 // Roll around the grounded heel or toe. The ankle follows the rotated boot.
 const pivot=key.pitch<0?-7:14, radians=key.pitch*Math.PI/180;
 const ankle={x:foot.x+pivot-pivot*Math.cos(radians)+8*Math.sin(radians),y:foot.y-pivot*Math.sin(radians)-8*Math.cos(radians)};
 const hip={x:back?91:98,y:123+walkBodyOffset(phase,heavy)};
 const thigh=24,shin=25,dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.hypot(dx,dy);
 if(d>thigh+shin)throw Error(`Unreachable ankle in walk phase ${phase}`);
 const along=(thigh*thigh-shin*shin+d*d)/(2*d), bend=Math.sqrt(Math.max(0,thigh*thigh-along*along));
 // Choose the forward-bending solution, never a backwards knee.
 const knee={x:hip.x+along*dx/d+bend*dy/d,y:hip.y+along*dy/d-bend*dx/d};
 return {hip,knee,ankle,foot,pivot,grounded:key.lift===0};
}
