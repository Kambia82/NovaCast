// Entitlements entry point. UI/logic asks hasAccess(entitlements, feature) —
// never checks role/plan/tier directly, so the rule (owner/admin bypass,
// free-tier default, kill switch) lives in exactly one place.

import { getAuthClaims, type NovaCastUser } from '../auth';
import { FEATURE_REGISTRY } from './featureFlags';
import type { Entitlements, FeatureKey } from './types';

export type { PlanTier, UserRole, FeatureKey, FeatureFlag, Entitlements } from './types';
export { FEATURE_REGISTRY } from './featureFlags';

export const GUEST_ENTITLEMENTS: Entitlements = { role: 'user', plan: 'free' };

/**
 * Resolves a signed-in user's entitlements from their auth claims (role/plan
 * are only ever set server-side — see services/auth.getAuthClaims). Guests
 * (no user) always get the least-privileged, fully-functional default.
 */
export async function getEntitlements(user: NovaCastUser | null): Promise<Entitlements> {
  if (!user) return GUEST_ENTITLEMENTS;
  const claims = await getAuthClaims();
  return { role: claims.role, plan: claims.plan };
}

/** True when `entitlements` may use `feature` right now. */
export function hasAccess(entitlements: Entitlements, feature: FeatureKey): boolean {
  const flag = FEATURE_REGISTRY[feature];
  if (!flag || !flag.enabled) return false;
  if (entitlements.role === 'owner' || entitlements.role === 'admin') return true;
  if (flag.tier === 'free') return true;
  return entitlements.plan === 'premium';
}

export function listFeatures() {
  return Object.values(FEATURE_REGISTRY);
}
