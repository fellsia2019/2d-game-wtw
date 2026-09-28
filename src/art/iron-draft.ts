import { UNITS } from '../data/content';
import { unitArt, roleOf } from './catalog';
export const ironDraft = Object.entries(UNITS).filter(([id]) => id.startsWith('iron')).map(([id, unit]) => ({ id, unit, era: 'iron' as const, art: unitArt[id], artRole: roleOf(id) }));
