export interface BattleInsets { top: number; bottom: number; left: number; right: number }

/** Coordinates come from the visible HUD/deck bounds, not device names. */
export function battlefieldLayout(width: number, height: number, insets: BattleInsets) {
  const dockBaseline = Math.max(40, height - insets.bottom);
  // Lift the road away from the cards, while leaving room under the HUD on
  // short screens. All terrain, towers and unit effects share this baseline.
  const combatLift = Math.min(96, Math.max(32, height * .08), Math.max(0, dockBaseline - insets.top) * .22);
  const baseline = dockBaseline - combatLift;
  const room = Math.max(40, baseline - insets.top);
  // Reserve the unscaled health-bar offset above the 176px anchored sprite.
  const unitScale = Math.min(width < 650 ? .36 : .62, (room - 9) / 176);
  const towerSize = Math.max(36, Math.min(width < 650 ? 116 : 210, width * .3, room * .9));
  const margin = towerSize * .5 + 10;
  return { baseline, combatLift, unitScale, towerSize, left: Math.max(insets.left + 6, margin), right: width - Math.max(insets.right + 6, margin) };
}
