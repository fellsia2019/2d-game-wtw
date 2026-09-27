// Static geometry smoke check; not a substitute for browser layout/device QA.
// Inputs are conservative HUD/deck bounds, including wrapped scout text and safe areas.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = readFileSync(new URL('../view/BattleLayout.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { battlefieldLayout } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const cases = [
  ['desktop screenshot', 1911, 940, { top: 254, bottom: 240, left: 32, right: 32 }],
  ['tablet portrait', 768, 1024, { top: 234, bottom: 352, left: 14, right: 14 }],
  // Small portrait bottom: 2×60 cards + 6 card gap + 6 dock gap + 44 wagon
  // + 8 bottom + 4 status gap + 24 status + 20 feet buffer = 232px.
  // Top reserves two lines of 16px scout/boss text after the 74+66px HUD.
  ['compact portrait', 320, 568, { top: 212, bottom: 232, left: 8, right: 8 }],
  // <=520px: HUD starts at48 (26px reclaimed); 56px cards reclaim another8px.
  // Both values conservatively budget two scout/boss lines, not a lucky short string.
  ['short portrait', 320, 480, { top: 186, bottom: 224, left: 8, right: 8 }],
  ['portrait safe areas', 390, 844, { top: 288, bottom: 378, left: 10, right: 10 }],
  // Low landscape top:44 toolbar +44 HUD +2 gap +~28 scout +10 buffer =128.
  // Reserve134px including rounding. Bottom:56 cards +8 bottom +5 gap +24 status
  // +20 feet buffer=113; reserve114px. Scout is the short one-line variant.
  ['compact landscape', 568, 320, { top: 134, bottom: 114, left: 8, right: 8 }],
  ['landscape safe areas', 844, 390, { top: 134, bottom: 136, left: 47, right: 47 }],
];
for (const [name, width, height, insets] of cases) {
  const m = battlefieldLayout(width, height, insets);
  const statusTop = height - insets.bottom + 20;
  assert(m.baseline - 174 * m.unitScale - 8 >= insets.top, `${name}: unit health bar overlaps HUD`);
  assert(m.baseline + 12 - m.towerSize >= insets.top, `${name}: tower overlaps HUD`);
  assert(m.baseline + 18 < statusTop, `${name}: feet overlap status`);
  assert(m.baseline + 12 < statusTop, `${name}: tower overlaps status`);
  assert(m.left - m.towerSize / 2 >= 0 && m.right + m.towerSize / 2 <= width, `${name}: tower outside viewport`);
  assert(m.right > m.left, `${name}: battlefield has no width`);
  if (name === 'compact portrait') assert(m.baseline - insets.top >= 90, '320×568 must reserve at least 90px for combat');
  if (name === 'short portrait') assert(m.baseline - insets.top >= 65, '320×480 must keep combat visible');
  if (name === 'compact landscape') assert(m.baseline - insets.top >= 70, '568×320 must reserve at least 70px for combat');
  console.log(`${name}: ${width}×${height}, clear field ${Math.round(m.baseline - insets.top)}px, unit scale ${m.unitScale.toFixed(3)}`);
}
console.log('7 viewport geometry checks passed. DOM/CSS rendering still requires browser QA.');
