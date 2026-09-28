/** Approved eight-model roster shared by the game and Antiquity workshop. */
import {UNITS, ERA_HIRE_KINDS} from '../data/content';
import {unitArt, roleOf} from './catalog';
export const antiqueDraft = ERA_HIRE_KINDS.antique.map(id => ({id, unit: UNITS[id], era: 'antique' as const, art: unitArt[id], artRole: roleOf(id)}));
