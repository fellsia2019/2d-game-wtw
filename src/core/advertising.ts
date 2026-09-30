export type RewardedPlacement = 'battle-gold-double' | 'battle-speed-double';
export interface AdAttempt { id: string; speedUnlocked: boolean; speed: 1 | 2; }
export interface RewardedProvider {
  showRewardedAd(placement: RewardedPlacement, onRewarded: () => void): Promise<boolean>;
}
export function newAdAttempt(): AdAttempt {
  return { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, speedUnlocked: false, speed: 1 };
}
