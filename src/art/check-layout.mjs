// Static geometry smoke check; not a substitute for browser layout/device QA.
// Inputs reserve HUD/boss warning bounds and the recruitment dock, including safe areas.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = readFileSync(new URL('../view/BattleLayout.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { battlefieldLayout } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const cases = [
  ['desktop screenshot', 1911, 940, { top: 254, bottom: 212, left: 32, right: 32 }],
  ['tablet portrait', 768, 1024, { top: 234, bottom: 324, left: 14, right: 14 }],
  ['compact portrait', 320, 568, { top: 212, bottom: 204, left: 8, right: 8 }],
  ['short portrait', 320, 480, { top: 186, bottom: 196, left: 8, right: 8 }],
  ['portrait safe areas', 390, 844, { top: 288, bottom: 350, left: 10, right: 10 }],
  ['compact landscape', 568, 320, { top: 134, bottom: 86, left: 8, right: 8 }],
  ['landscape safe areas', 844, 390, { top: 134, bottom: 108, left: 47, right: 47 }],
];
for (const [name, width, height, insets] of cases) {
  const m = battlefieldLayout(width, height, insets);
  const dockTop = height - insets.bottom + 20;
  assert(m.baseline - 174 * m.unitScale - 8 >= insets.top, `${name}: unit health bar overlaps HUD`);
  assert(m.baseline + 12 - m.towerSize >= insets.top, `${name}: tower overlaps HUD`);
  assert(dockTop - (m.baseline + 18) >= 20, `${name}: units need a visible gap above recruitment`);
  assert(m.baseline + 12 < dockTop, `${name}: tower overlaps recruitment dock`);
  assert(m.left - m.towerSize / 2 >= 0 && m.right + m.towerSize / 2 <= width, `${name}: tower outside viewport`);
  assert(m.right > m.left, `${name}: battlefield has no width`);
  if (name === 'compact portrait') assert(m.baseline - insets.top >= 90, '320×568 must reserve at least 90px for combat');
  if (name === 'short portrait') assert(m.baseline - insets.top >= 65, '320×480 must keep combat visible');
  if (name === 'compact landscape') assert(m.baseline - insets.top >= 70, '568×320 must reserve at least 70px for combat');
  console.log(`${name}: ${width}×${height}, clear field ${Math.round(m.baseline - insets.top)}px, unit scale ${m.unitScale.toFixed(3)}`);
}
console.log('7 viewport geometry checks passed. DOM/CSS rendering still requires browser QA.');
