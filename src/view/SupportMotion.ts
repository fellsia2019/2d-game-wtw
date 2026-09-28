/** A deliberate standard lift, followed by a pause. Presentation only; the aura is passive. */
export const STANDARD_CYCLE = 2.4;
export const STANDARD_LIFT = .8;
export function standardFrame(age: number): number {
 const phase = age % STANDARD_CYCLE;
 return phase < STANDARD_LIFT ? 16 + Math.min(31,Math.floor(phase * 32 / STANDARD_LIFT)) : 0;
}
