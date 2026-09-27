export interface BattleInsets { top: number; bottom: number; left: number; right: number }

/** Coordinates come from the visible HUD/deck bounds, not device names. */
export function battlefieldLayout(width: number, height: number, insets: BattleInsets) {
  const baseline = Math.max(40, height - insets.bottom);
  const room = Math.max(40, baseline - insets.top);
  // Reserve the unscaled health-bar offset above the 176px anchored sprite.
  const unitScale = Math.min(width < 650 ? .36 : .62, (room - 9) / 176);
  const towerSize = Math.max(36, Math.min(width < 650 ? 116 : 210, width * .3, room * .9));
  const margin = towerSize * .5 + 10;
  return { baseline, unitScale, towerSize, left: Math.max(insets.left + 6, margin), right: width - Math.max(insets.right + 6, margin) };
}
