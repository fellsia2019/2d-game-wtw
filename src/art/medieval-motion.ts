/** Shared workshop and battle timing: keep the horn at the lips; treatment is slower than a weapon strike. */
export function medievalSignalFrame(age: number): number {
 const phase = age % 2.8;
 if (phase < .35) return 16 + Math.min(7, Math.floor(phase / .35 * 8));
 if (phase < 1.75) return 24 + Math.min(15, Math.floor((phase - .35) / 1.4 * 16));
 if (phase < 2.1) return 40 + Math.min(7, Math.floor((phase - 1.75) / .35 * 8));
 return 0;
}
export function medievalTreatmentFrame(age: number): number {
 const phase = age % 2.8;
 if (phase < .2) return 10;
 if (phase < .4) return 11;
 if (phase < .6) return 12;
 if (phase < 1.45) return 13;
 if (phase < 1.7) return 14;
 if (phase < 2) return 15;
 return 0;
}
