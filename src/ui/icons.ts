export type IconName = 'close' | 'check' | 'plus' | 'lock' | 'gold' | 'supplies' | 'point' | 'damage' | 'health' | 'attackSpeed' | 'supply' | 'book' | 'trophy';

const drawings: Record<IconName, string> = {
  close: '<path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  check: '<path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 14v3" stroke="#172f35" stroke-width="2"/>',
  gold: '<ellipse cx="16" cy="17" rx="8" ry="9" fill="#b47a28"/><circle cx="12" cy="12" r="9" fill="#f2c866" stroke="#80501e"/><circle cx="12" cy="12" r="6.5" fill="#dda43d" stroke="#ffe4a0"/><path d="m12 7 3 5-3 5-3-5z" fill="#fff0b6"/><path d="M6 8a7 7 0 0 1 5-3" stroke="#fff5cb"/>',
  supplies: '<path d="m8 4 2 4h4l2-4z" fill="#d9c79c"/><path d="M9 8C6 11 3 15 5 20c2 3 12 3 14 0 2-5-1-9-4-12z" fill="#bd9c65" stroke="#6e5736"/><path d="M8 8h8M8 18h8" stroke="#f6dfab"/><path d="M12 11v9m-3-6 3-2 3 2" stroke="#725735"/>',
  point: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#a9ddd6" stroke="#467f82"/><path d="m12 7 2 5-2 5-2-5z" fill="#eafffa"/>',
  damage: '<path d="m15 3 6 0 0 6-11 11-6-6z" fill="#e4dccc"/><path d="m4 13 7 7M4 20l3-3M14 10l5-5" stroke="currentColor" stroke-width="2"/>',
  health: '<path d="M12 21S2 15 2 8c0-6 7-7 10-2 3-5 10-4 10 2 0 7-10 13-10 13z" fill="#a1d3ae"/><path d="M12 8v8m-4-4h8" stroke="#efffec" stroke-width="2"/>',
  attackSpeed: '<path d="m14 2-9 12h6l-1 8 9-12h-6z" fill="#edca86" stroke="#a47e44"/>',
  supply: '<path d="M3 6h16v11H3z" fill="#bc9f70"/><path d="M3 10h16M8 6v11m6-11v11M19 13h3v5" stroke="#f4dbaa"/><circle cx="7" cy="19" r="3" fill="#493e32" stroke="#d4bc88"/><circle cx="18" cy="19" r="3" fill="#493e32" stroke="#d4bc88"/>',
  book: '<path d="M12 6C9 3 4 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2z" fill="#a7cdbf" stroke="#578576"/><path d="M12 6v15M5 8h4M5 12h4m6-4h4m-4 4h4" stroke="#eef4db"/>',
  trophy: '<path d="M6 3h12v5c0 6-3 8-6 8s-6-2-6-8z" fill="#e8bf63"/><path d="M6 5H2v3c0 4 3 5 6 5m10-8h4v3c0 4-3 5-6 5M12 16v5m-5 1h10" fill="none" stroke="#c99949" stroke-width="2"/>'
};

export const uiIcon = (name: IconName): string => `<svg class="ui-icon icon-${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" stroke-linecap="round" stroke-linejoin="round">${drawings[name]}</svg>`;
