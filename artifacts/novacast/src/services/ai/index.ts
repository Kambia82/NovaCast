// Fishing-intelligence entry point. UI imports only from here.
//
// Resolution order: a configured hosted provider first, the local rules engine
// as the guaranteed fallback. A hosted failure is swallowed and logged; the
// angler always gets an answer.

import type { FishingContext, FishingInsight } from './types';
import { localProvider } from './localProvider';
import { remoteProvider } from './remoteProvider';

export type {
  FishingContext, FishingInsight, InsightTechnique,
  CtxWater, CtxEnvironment, CtxConditions, CtxObservations, CtxHistory, CtxCatch,
} from './types';
export { buildFishingContext } from './buildContext';
export type { BuildContextInput } from './buildContext';
export { spokenAnswers, matchQuestion, ANSWER_PROMPTS } from './answers';
export type { AnswerKey } from './answers';

const REGISTRY = [remoteProvider, localProvider];

/** Human-readable name of the provider that would answer right now. */
export function describeActiveProvider(): string {
  const active = REGISTRY.find(p => p.isConfigured());
  return active ? active.id : localProvider.id;
}

export async function getFishingIntelligence(ctx: FishingContext): Promise<FishingInsight> {
  for (const provider of REGISTRY) {
    if (!provider.isConfigured()) continue;
    try {
      return await provider.getInsight(ctx);
    } catch (err) {
      if (provider.id !== localProvider.id) {
        console.warn(`[novacast/ai] provider "${provider.id}" failed, falling back:`, err);
        continue;
      }
      throw err;
    }
  }
  // REGISTRY always ends with the always-configured local provider.
  return localProvider.getInsight(ctx);
}
