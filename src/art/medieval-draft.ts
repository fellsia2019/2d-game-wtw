/** Approved eight-model roster shared by the game and medieval workshop. */
import {UNITS, ERA_HIRE_KINDS} from '../data/content';
import {unitArt, roleOf} from './catalog';
export const medievalDraft = ERA_HIRE_KINDS.medieval.map(id => ({id, unit: UNITS[id], era: 'medieval' as const, art: unitArt[id], artRole: roleOf(id)}));
