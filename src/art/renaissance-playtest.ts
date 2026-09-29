/** Isolated playable review: real game UI and simulation, disposable in-memory profile. */
import { GameDirector } from '../core/GameDirector';
import { SaveService, type StorageLike } from '../core/save';
import { ERA_ORDER } from '../data/content';
import { mountGame } from '../view/mountGame';
class ReviewStorage implements StorageLike {
 private values = new Map<string,string>();
 getItem(key:string) { return this.values.get(key) ?? null; }
 setItem(key:string,value:string) { this.values.set(key,value); }
 removeItem(key:string) { this.values.delete(key); }
}
const save = new SaveService(new ReviewStorage());
save.writeEraProgress({unlocked:Object.fromEntries(ERA_ORDER.map(id=>[id,true])),wins:Object.fromEntries(ERA_ORDER.map(id=>[id,4])),challenges:{}});
save.writeTalents({gold:0,levels:{damage:8,health:8,supply:8,attackSpeed:8},baseLevel:12},'renaissance');
const app = new GameDirector(save);
app.selectEra('renaissance');
app.startNewRun(23);
app.selectDoctrine('steel');
app.setLoadout(['renaissanceCuirassier','renaissanceMusket','renaissanceGrenadier','renaissanceCannon']);
mountGame(document.getElementById('app')!,app);
let last=performance.now(),accumulator=0;
function loop(now:number) {
 const delta=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
 const state=app.getState();
 if(state.phase==='battle'&&!state.paused) {
  accumulator+=delta*state.battleSpeed;
  while(accumulator>=app.fixedStep()){app.tick();accumulator-=app.fixedStep();}
 } else accumulator=0;
 requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange',()=>app.setExternalPause(document.hidden,'visibility'));
requestAnimationFrame(loop);
