// Original score and procedural instruments. No samples or borrowed melody.
// Run: node src/art/generate-music.mjs (requires ffmpeg on PATH).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const SR=32000,BPM=120,BEAT=60/BPM,BARS=32,DURATION=BARS*4*BEAT,N=Math.round(SR*DURATION),TAU=Math.PI*2;
const L=new Float64Array(N),R=new Float64Array(N);
let seed=271828;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;}
const hz=m=>440*2**((m-69)/12);
function add(at,duration,pan,gain,synth){
 const start=Math.round(at*SR),length=Math.ceil(duration*SR),gl=Math.sqrt((1-pan)/2)*gain,gr=Math.sqrt((1+pan)/2)*gain;
 for(let i=0;i<length;i++){const v=synth(i/SR,i),j=((start+i)%N+N)%N;L[j]+=v*gl;R[j]+=v*gr;}
}
function wind(m,at,beats,vel=1,pan=-.14){
 const f=hz(m),d=beats*BEAT;let noise=0;
 add(at,d+.19,pan,.12*vel,(t)=>{
  const env=Math.min(1,t/.045)*Math.min(1,Math.max(0,(d+.18-t)/.22));noise=.83*noise+.17*rand();
  const p=TAU*f*t+.022*Math.sin(TAU*5.1*t)*Math.min(1,t/.25);
  return env*(Math.sin(p)+.2*Math.sin(2*p)+.1*Math.sin(3*p)+.025*noise)*(1+.035*Math.sin(TAU*3.3*t));
 });
}
function pluck(m,at,vel=.8,pan=.4){
 const f=hz(m),d=1.45;
 add(at,d,pan,.055*vel,t=>{
  const p=TAU*f*t;return Math.min(1,t/.003)*(Math.sin(p)*Math.exp(-t*3.8)+.45*Math.sin(p*2.002)*Math.exp(-t*6)+.19*Math.sin(p*3)*Math.exp(-t*9)+.07*Math.sin(p*5)*Math.exp(-t*13));
 });
}
function strings(chord,at,beats,volume=.03){
 const d=beats*BEAT;
 for(const [i,m]of chord.entries())add(at,d+.5,(i-1)*.45,volume,t=>{
  const env=Math.min(1,t/.38)*Math.min(1,Math.max(0,(d+.5-t)/.55)),f=hz(m),p=TAU*f*t;
  return env*(Math.sin(p)+.28*Math.sin(p*1.003)+.18*Math.sin(2*p)+.09*Math.sin(3*p))*(.9+.1*Math.sin(TAU*.7*t));
 });
}
function bass(m,at,beats){const f=hz(m),d=beats*BEAT;add(at,d+.1,0,.125,t=>Math.min(1,t/.018)*Math.min(1,Math.max(0,(d+.1-t)/.12))*Math.exp(-t*.5)*(Math.sin(TAU*f*t)+.19*Math.sin(TAU*2*f*t)));}
function drum(at,accent=1){add(at,.38,-.06,.15*accent,t=>Math.min(1,t/.001)*(Math.sin(TAU*(59*t+1.6*(1-Math.exp(-t*38))))*Math.exp(-t*14)+rand()*.16*Math.exp(-t*60)));}
function rim(at,accent=1){let low=0;add(at,.16,.2,.055*accent,t=>{const n=rand();low=.7*low+.3*n;return Math.min(1,t/.001)*(n-low+.4*Math.sin(TAU*1740*t))*Math.exp(-t*35);});}
function shaker(at,accent=1){let low=0;add(at,.085,.5,.016*accent,t=>{const n=rand();low=.6*low+.4*n;return(n-low)*Math.sin(Math.PI*Math.min(1,t/.085))*Math.exp(-t*27);});}
function bell(m,at){const f=hz(m);add(at,2.3,-.4,.023,t=>Math.min(1,t/.005)*Math.exp(-t*2.8)*(Math.sin(TAU*f*t)+.3*Math.sin(TAU*f*2.76*t)));}
const chords=[[50,57,62,65],[46,53,58,62],[53,60,65,69],[48,55,60,64],[50,57,62,65],[46,53,58,62],[43,50,55,58],[45,52,57,61]];
// Each phrase is four beats. Rhythm leaves gaps so the theme can repeat under play.
const A=[[[74,1],[77,.5],[76,.5],[74,1],[69,.5],[0,.5]],[[70,.75],[74,.75],[77,1],[74,.5],[0,1]],[[72,.5],[77,.5],[81,1],[79,.5],[77,.5],[76,1]],[[76,1.5],[72,.5],[67,1],[0,1]],[[74,.75],[77,.75],[81,.5],[79,1],[77,.5],[0,.5]],[[77,1],[74,.5],[70,.5],[74,1],[72,1]],[[70,1],[67,1],[69,.5],[70,.5],[74,.5],[0,.5]],[[73,.5],[76,.5],[69,1],[73,1],[0,1]]];
const B=[[[81,1.5],[79,.5],[77,1],[74,1]],[[77,1],[82,.5],[81,.5],[77,1],[74,1]],[[81,.5],[84,.5],[81,.5],[79,.5],[77,1.5],[0,.5]],[[79,1],[76,1],[72,1],[0,1]],[[77,.5],[76,.5],[74,1],[69,1],[74,1]],[[70,.5],[74,.5],[77,1],[74,1],[0,1]],[[79,1],[77,.5],[74,.5],[70,1],[67,1]],[[69,1],[73,1],[76,.5],[73,.5],[0,1]]];
for(let bar=0;bar<BARS;bar++){
 const at=bar*4*BEAT,c=chords[bar%8],section=Math.floor(bar/8);
 strings(c.slice(1),at,4,section===2?.036:.028);
 bass(c[0]-12,at,1.7);bass(c[0]-12,at+2*BEAT,1.65);
 const order=[1,2,3,2,1,3,2,3];
 for(let step=0;step<8;step++){pluck(c[order[step]],at+(step*.5+(step%2?.022:0))*BEAT,step%2?.62:.9,step%2?.42:-.3);shaker(at+step*.5*BEAT,step%2?.65:1);}
 drum(at,.95);drum(at+BEAT,.28);drum(at+2*BEAT,.75);drum(at+3*BEAT,.32);rim(at+BEAT,.85);rim(at+3*BEAT,.7);
 if(bar%4===3){rim(at+3.5*BEAT,.45);drum(at+3.75*BEAT,.32);}
 let beat=0;const phrase=(section===1||section===2?B:A)[bar%8];
 for(const [m,length]of phrase){if(m)wind(m-12,at+beat*BEAT,length*.88,section===3?.88:1);beat+=length;}
 if(section===2||bar%8===0)bell(c[2]+12,at+.02);
 if(section===3){pluck(c[2]+12,at+1.5*BEAT,.65);pluck(c[3]+12,at+3.5*BEAT,.55);}
}
// Circular early reflections retain the preceding bar's tails at the exact loop boundary.
const dryL=L.slice(),dryR=R.slice();
for(const [seconds,level]of [[.043,.17],[.079,.13],[.137,.105],[.223,.085],[.347,.065],[.509,.04],[.731,.025]]){
 const offset=Math.round(seconds*SR);for(let i=0;i<N;i++){const j=(i+offset)%N;L[j]+=dryR[i]*level;R[j]+=dryL[i]*level;}
}
let dcL=0,dcR=0;for(let i=0;i<N;i++){dcL+=L[i];dcR+=R[i];}dcL/=N;dcR/=N;
let peak=0,sum=0;for(let i=0;i<N;i++){L[i]=Math.tanh((L[i]-dcL)*1.65);R[i]=Math.tanh((R[i]-dcR)*1.65);peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));}
const gain=.86/peak,buffer=Buffer.alloc(44+N*4);buffer.write('RIFF');buffer.writeUInt32LE(36+N*4,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(2,22);buffer.writeUInt32LE(SR,24);buffer.writeUInt32LE(SR*4,28);buffer.writeUInt16LE(4,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(N*4,40);
for(let i=0;i<N;i++){sum+=(L[i]**2+R[i]**2)*gain**2;buffer.writeInt16LE(Math.round(L[i]*gain*32767),44+i*4);buffer.writeInt16LE(Math.round(R[i]*gain*32767),46+i*4);}
fs.mkdirSync('public/assets/audio',{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'arena-theme-'));
const wav=path.join(temporary,'master.wav');fs.writeFileSync(wav,buffer);
for(const [ext,codec,args]of [['mp3','libmp3lame',['-b:a','112k']],['ogg','libvorbis',['-q:a','3']]])execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',wav,'-c:a',codec,...args,'-metadata','title=March of the Ash Road','-metadata','artist=Arena Mercenaries Original Score',`public/assets/audio/arena-theme.${ext}`]);
fs.unlinkSync(wav);fs.rmdirSync(temporary);
const metadata={title:'Марш Пепельного тракта',original:true,bpm:BPM,meter:'4/4',key:'D minor',bars:BARS,sampleRate:SR,samples:N,loopSeconds:N/SR,peakDb:20*Math.log10(.86),rmsDb:20*Math.log10(Math.sqrt(sum/(2*N))),boundaryDelta:Math.max(Math.abs(L[0]-L[N-1]),Math.abs(R[0]-R[N-1]))*gain,files:['arena-theme.mp3','arena-theme.ogg']};
fs.writeFileSync('public/assets/audio/arena-theme.json',JSON.stringify(metadata,null,2));console.log(JSON.stringify(metadata,null,2));
