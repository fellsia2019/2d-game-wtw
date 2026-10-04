import { GameDirector } from '../../src/core/GameDirector';
import { SaveService } from '../../src/core/save';
import { ERA_ORDER, ERA_HIRE_KINDS } from '../../src/data/content';
import { mountGame } from '../../src/view/mountGame';
import { setLocale } from '../../src/i18n';
import type { EraId } from '../../src/core/types';

// Visual fixture only: unlocked eras and talents are synthetic. No localStorage
// access, platform calls or changes to the real profile. Not packaged for release.
const parameters = new URLSearchParams(location.search);
const era = parameters.get('era') as EraId;
if (!ERA_ORDER.includes(era)) throw new Error('Select an era with ?era=stone');
setLocale(parameters.get('lang') === 'en' ? 'en' : 'ru');
const data = new Map<string, string>();
const save = new SaveService({ getItem: key => data.get(key) ?? null,
  setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } });
save.writeEraProgress({ unlocked: Object.fromEntries(ERA_ORDER.map(id => [id, true])),
  wins: Object.fromEntries(ERA_ORDER.map(id => [id, 4])), challenges: {} });
save.writeTalents({ gold: 400, levels: { damage: 4, attackSpeed: 4, health: 4, supply: 4 }, baseLevel: 30 }, era);
const director = new GameDirector(save);
director.selectEra(era);
director.startNewRun(23);
director.selectDoctrine('steel');
director.setLoadout(ERA_HIRE_KINDS[era].slice(0,4));
director.beginRun();
director.chooseContract(director.getState().contracts[0].id);
const root = document.getElementById('app')!;
mountGame(root, director, () => {
  document.title = `Release visual fixture: ${era}`;
});
// Populate both sides through ordinary simulation, then freeze for inspection.
for(let tick = 0; tick < 18 * 30 && director.getState().phase === 'battle'; tick++) {
  director.tick();
  const kind = director.getState().cards[Math.floor(tick / 100) % 4].kind;
  director.hire(kind);
}
