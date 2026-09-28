import { GameDirector } from '../../src/core/GameDirector';
import { ERA_STARTER_KINDS } from '../../src/data/content';
import { baseHealthCost, talentCost, type TalentId } from '../../src/core/talents';
import type { EraId } from '../../src/core/types';

// Reference strategies for the approved balance, not a guarantee of winning
// every stage with a fresh profile. Campaign checks earn all upgrades in play.
export const CAMPAIGN_PLANS = {
  stone: [{ tier: 0, order: '012' }, { tier: 2, order: '0102' }, { tier: 5, order: '012' }, { tier: 8, order: '002' }],
  bronze: [{ tier: 2, order: '012' }, { tier: 3, order: '0112' }, { tier: 7, order: '012' }, { tier: 10, order: '002' }],
  iron: [{ tier: 2, order: '0102' }, { tier: 4, order: '0112' }, { tier: 8, order: '012' }, { tier: 11, order: '002' }],
  medieval: [{ tier: 3, order: '0102' }, { tier: 5, order: '0112' }, { tier: 9, order: '012' }, { tier: 12, order: '002' }],
  antique: [{ tier: 3, order: '012' }, { tier: 4, order: '0112' }, { tier: 8, order: '012' }, { tier: 11, order: '002' }]
} satisfies Record<EraId, { tier: number; order: string }[]>;

export function completeCampaignBattle(game: GameDirector, battle: number): number {
  const era = game.getState().eraId;
  const { tier, order } = CAMPAIGN_PLANS[era][battle];
  const roster = ERA_STARTER_KINDS[era];
  for (let attempt = 1; attempt <= 40; attempt++) {
    // Buy affordable improvements through the public API; no injected gold,
    // edited enemies, artificial fortress health or skipped combat results.
    for (;;) {
      const state = game.getState();
      const offers: { talent: TalentId | 'base'; cost: number }[] =
        (Object.keys(state.talents) as TalentId[]).filter(id => state.talents[id] < tier)
          .map(talent => ({ talent, cost: talentCost(state.talents[talent]) }));
      if (state.baseLevel < tier) offers.push({ talent: 'base', cost: baseHealthCost(state.baseLevel) });
      offers.sort((a, b) => a.cost - b.cost);
      const next = offers[0];
      if (!next || next.cost > state.gold) break;
      const bought = next.talent === 'base' ? game.buyBaseHealth() : game.buyTalent(next.talent);
      if (!bought) throw new Error(`Cannot buy ${next.talent} in ${state.phase}`);
    }
    const state = game.getState();
    const started = state.phase === 'defeat' ? game.retryBattle() : game.chooseContract(state.contracts[0].id);
    if (!started) throw new Error(`Cannot start ${era} battle ${battle + 1}`);
    let purchase = 0;
    for (let step = 0; step <= 420 * 30 && game.getState().phase === 'battle'; step++) {
      game.tick();
      if (game.hire(roster[Number(order[purchase % order.length])])) purchase++;
    }
    const result = game.getState();
    if (!result.report) throw new Error(`No result for ${era} battle ${battle + 1}`);
    if (result.report.won) return attempt;
    if (result.phase !== 'defeat') throw new Error(`Unexpected phase ${result.phase}`);
  }
  throw new Error(`${era} battle ${battle + 1} did not finish after 40 earned-progression attempts`);
}
