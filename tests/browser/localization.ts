import type { UpgradeId } from '../../src/core/types';
import {GameUI} from '../../src/ui/GameUI';
import {GameDirector} from '../../src/core/GameDirector';
import {SaveService} from '../../src/core/save';
import {ERA_ORDER,ERA_HIRE_KINDS,ERA_BATTLES,UPGRADES} from '../../src/data/content';
import {LoadingScreen} from '../../src/ui/LoadingScreen';
import {chooseCloudProfile} from '../../src/platform/cloud';
import {mountOrientationGuard} from '../../src/ui/orientation';
import {setLocale} from '../../src/i18n';
import '../../src/ui/game.css';
import '../../src/ui/fullscreen.css';
// Run at /tests/browser/localization.html?lang=en (or lang=ru).
// Uses in-memory profiles so the user's game progress is untouched.
const language = new URLSearchParams(location.search).get('lang') === 'ru' ? 'ru' : 'en';
const root=document.getElementById('app')!;
const misses=new Map<string,string[]>();let screens=0;
const check=(label:string)=>{
  screens++;
  const values:string[]=[];
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while(n=walk.nextNode()) if(!n.parentElement?.closest('script,style')) values.push(n.nodeValue??'');
  for(const el of root.querySelectorAll('*')){
    for(const a of ['aria-label','title','alt','placeholder']) values.push(el.getAttribute(a)??'');
    for(const pseudo of ['::before','::after']){const c=getComputedStyle(el,pseudo).content;if(c && !['none','normal','""'].includes(c))values.push(c);}
  }
  for(const text of values)if((language === 'en' && /[А-Яа-яЁё]/.test(text)) || /undefined|NaN|\[object Object\]|\{\{|\$\{/.test(text)){
    const v=text.trim(); misses.set(v,[...(misses.get(v)??[]).slice(0,2),label]);
  }
};
setLocale(language);
for(const era of ERA_ORDER){
  const director=new GameDirector(new SaveService(null));director.startNewRun(123,era);
  const ui=new GameUI(root,director);
  const state=director.getState();
  state.selectedDoctrine=state.doctrines[0].id;
  state.gold=200;state.globalTalentPoints=5;
  state.rewards=Object.entries(UPGRADES).map(([id,u])=>({id:id as UpgradeId,...u}));
  state.contracts=[{id:'audit',name:ERA_BATTLES[era][0].name,threat:ERA_BATTLES[era][0].threat,roster:ERA_HIRE_KINDS[era],risk:'standard',condition:'Обычный бой',reward:'1 знак победы',enemyIncome:6,marks:1}];
  state.report={goldEarned:25,duration:80,hires:12,won:true,reason:'Крепость врага разрушена.',allyFortressHp:80,enemyFortressHp:0,damageDealt:100,damageTaken:20,blocked:10,healed:5,survivors:4};
  state.enemyGlyphRemaining=10;state.bossPhase='warning';state.bossCountdown=4;
  ui.update(state);
  for(const phase of ['menu','preparation','contract','battle','reward','defeat','victory'] as const){
    state.phase=phase;state.paused=phase==='battle';
    ui.openPanel(null);
    ui.update(state);check(`${era}:${phase}`);
    if(phase==='menu'){state.canContinue=true;ui.update(state);check(`${era}:continue`);state.canContinue=false;}
    if(phase==='preparation'){ui.showRosterStep();check(`${era}:roster`);ui.toggleRoster(state.roster[0]);check(`${era}:roster-incomplete`);}
    for(const panel of ['book','records','talents','globalTalents'] as const){ui.openPanel(panel);check(`${era}:${phase}:${panel}`);}
  }
  ui.openPanel(null);
  state.phase='battle';state.paused=false;
  for(const cloud of ['local','synced','pending','offline','conflict'] as const){state.platform.cloud=cloud;ui.update(state);check(`${era}:cloud:${cloud}`);}
  for(let i=0;i<4;i++){state.battleIndex=i;state.battleName=ERA_BATTLES[era][i].name;ui.update(state);check(`${era}:battle:${i}`);}
  for(const flag of ['busy','speedUnlocked','goldClaimed','pendingGold'] as const){
    state.advertising[flag]=true;state.phase='reward';ui.update(state);check(`${era}:ad:${flag}`);state.advertising[flag]=false;
  }
  for(const msg of ['Бонус получен: +25 золота.','Темп ×2 доступен для этого боя.','Просмотр не засчитан. Можно продолжить без рекламы.','Не удалось сохранить бонус. Проверь доступность сохранения.']){state.advertising.message=msg;ui.update(state);check(`${era}:ad-message`);}
  state.phase='menu';for(const id of ERA_ORDER){state.eraProgress[id]=4;state.unlockedEras[id]=true;}ui.update(state);check(`${era}:all-completed`);
  ui.destroy();
}
const loader=new LoadingScreen();root.replaceChildren(loader.element);check('loading');loader.fail();check('loading-error');loader.destroy();
void chooseCloudProfile(root,{data:{},version:1,account:'audit',stamp:'1'},{data:{},version:1,account:'audit',stamp:'2'});check('cloud-choice');
root.innerHTML = '<main class="game-shell"></main>';
const orientation=mountOrientationGuard(root,new GameDirector(new SaveService(null)));check('orientation');orientation.destroy();
const result={language,screens,misses:[...misses].map(([text,screens])=>({text,screens}))};
root.innerHTML='';document.getElementById('audit-results')!.textContent=JSON.stringify(result,null,2);
document.title = misses.size ? 'Localization audit: FAIL' : 'Localization audit: PASS';
if (misses.size) throw new Error(`Found ${misses.size} untranslated or invalid strings`);
