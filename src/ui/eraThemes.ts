import type { EraId } from '../core/types';

// Shared presentation palette. Gameplay values stay in data/content.ts.
export const ERA_THEMES = {
  stone: { main: '#72543a', accent: '#e9c38b' },
  bronze: { main: '#864f32', accent: '#f0bb7a' },
  iron: { main: '#3d5d70', accent: '#bdced8' },
  antique: { main: '#63734c', accent: '#e7d8a2' },
  'high-medieval': { main: '#405e82', accent: '#dbcaa2' },
  medieval: { main: '#3e654f', accent: '#c6d7a0' }
} as const satisfies Record<EraId, { main: string; accent: string }>;

export const eraThemeStyle = (era: EraId): string =>
  `--era-main:${ERA_THEMES[era].main};--era-accent:${ERA_THEMES[era].accent}`;
