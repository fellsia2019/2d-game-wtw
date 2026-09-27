import { describe, expect, it, vi } from 'vitest';
import { MusicLoop, loadArenaTheme, softenLoopBoundary } from '../src/view/MusicLoop';
const flush = async () => { for (let i=0;i<5;i++) await Promise.resolve(); };
function setup() {
 const sources: { buffer: AudioBuffer|null; loop:boolean; loopStart:number; loopEnd:number;connect:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>;start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn> }[]=[];
 const context={currentTime:0,createGain:()=>({connect:vi.fn(),disconnect:vi.fn(),gain:{cancelScheduledValues:vi.fn(),setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn()}}),createBufferSource:()=>{const s={buffer:null,loop:false,loopStart:0,loopEnd:0,connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn()};sources.push(s);return s;}};
 let allowed=true,resolve!:(buffer:AudioBuffer)=>void;
 const loader=vi.fn(()=>new Promise<AudioBuffer>(r=>{resolve=r;}));
 const music=new MusicLoop(context as unknown as AudioContext,{} as AudioNode,()=>allowed,loader);
 return {music,context,sources,loader,disable:()=>{allowed=false;},enable:()=>{allowed=true;},resolve:()=>resolve({duration:64} as AudioBuffer)};
}
describe('local music loop',()=>{
 it('loads once and loops one source, retaining its position across pause',async()=>{
  const t=setup();t.music.play();t.music.play();expect(t.loader).toHaveBeenCalledOnce();t.resolve();await flush();
  expect(t.sources).toHaveLength(1);expect(t.sources[0].loop).toBe(true);expect(t.sources[0].loopEnd).toBe(64);
  t.context.currentTime=9.25;t.disable();t.music.pause();expect(t.sources[0].stop).toHaveBeenCalledOnce();
  t.context.currentTime=100;t.enable();t.music.play();expect(t.sources[1].start).toHaveBeenCalledWith(100,9.25);t.music.destroy();
 });
 it('does not start an asynchronously decoded file over advertising or hidden-page pause',async()=>{
  const t=setup();t.music.play();t.disable();t.music.pause();t.resolve();await flush();expect(t.sources).toHaveLength(0);
  t.enable();t.music.play();expect(t.sources).toHaveLength(1);t.music.destroy();
 });
 it('does not start a pending file after disposal',async()=>{
  const t=setup();t.music.play();t.music.destroy();t.resolve();await flush();expect(t.sources).toHaveLength(0);
 });
 it('falls back from unsupported OGG to MP3 without external requests',async()=>{
  const fetchMock=vi.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});vi.stubGlobal('fetch',fetchMock);
  const buffer={duration:64,numberOfChannels:0,length:2048000,sampleRate:32000} as AudioBuffer,decodeAudioData=vi.fn().mockRejectedValueOnce(new Error('Unsupported codec')).mockResolvedValueOnce(buffer);
  try{expect(await loadArenaTheme({decodeAudioData} as unknown as AudioContext,new AbortController().signal)).toBe(buffer);expect(fetchMock.mock.calls[0][0]).toMatch(/assets\/audio\/arena-theme\.ogg$/);expect(fetchMock.mock.calls[1][0]).toMatch(/assets\/audio\/arena-theme\.mp3$/);}finally{vi.unstubAllGlobals();}
 });
});

it('tapers only the4ms edges after lossy decoding to remove a loop step',()=>{
 const samples=new Float32Array(32000).fill(.2);
 const buffer={sampleRate:32000,length:samples.length,numberOfChannels:1,getChannelData:()=>samples} as unknown as AudioBuffer;
 softenLoopBoundary(buffer);expect(samples[0]).toBe(0);expect(samples[samples.length-1]).toBe(0);expect(samples[1000]).toBeCloseTo(.2);
});
it('does not repeatedly fetch a missing music file until an explicit retry',async()=>{
 const t=setup(),loader=vi.fn(async()=>{throw new Error('offline');});
 const music=new MusicLoop(t.context as unknown as AudioContext,{} as AudioNode,()=>true,loader);music.play();await flush();music.play();await flush();expect(loader).toHaveBeenCalledOnce();expect(t.sources).toHaveLength(0);music.play(true);await flush();expect(loader).toHaveBeenCalledTimes(2);music.destroy();t.music.destroy();
});
