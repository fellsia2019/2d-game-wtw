import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const meta=JSON.parse(fs.readFileSync('public/assets/audio/arena-theme.json','utf8'));
for(const format of ['ogg','mp3']){
 const filename=`public/assets/audio/arena-theme.${format}`;
 const bytes=execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',filename,'-ar','32000','-ac','2','-f','f32le','pipe:1'],{maxBuffer:32*1024*1024});
 const x=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4),samples=x.length/2;
 let peak=0,sum=0;for(const v of x){peak=Math.max(peak,Math.abs(v));sum+=v*v;}
 const jump=Math.max(Math.abs(x[0]-x[x.length-2]),Math.abs(x[1]-x[x.length-1]));
 assert(Math.abs(samples/32000-meta.loopSeconds)<.01,'Decoded loop duration mismatch');
 assert(peak<1,'Clipping');assert(Math.sqrt(sum/x.length)>.025,'Music unexpectedly silent');assert(jump<.03,'Excessive loop boundary jump');
 console.log(`${format}: ${samples/32000}s, ${(fs.statSync(filename).size/1024).toFixed(0)}KiB, peak ${(20*Math.log10(peak)).toFixed(2)}dBFS, boundary delta ${jump.toFixed(5)}`);
}
console.log('Numeric audio checks passed; perceptual listening is still required.');
