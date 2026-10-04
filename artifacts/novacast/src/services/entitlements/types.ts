// Entitlement/feature-access model (blueprint §13-14) — architecture only.
// No payments, no paywall today: every feature below ships FREE and enabled.
// Flipping a feature to PREMIUM later is a one-line change to featureFlags.ts,
// not a rebuild — that is the entire point of this layer existing now.

export type PlanTier = 'free' | 'premium';

/** Independent of plan — an owner/admin gets full access without paying. */
export type UserRole = 'user' | 'admin' | 'owner';

export type FeatureKey =
  | 'lunar_advanced'
  | 'barometric_advanced'
  | 'ai_voice_coach'
  | 'environmental_advanced'
  | 'catch_analytics'
  | 'expanded_intelligence';

export interface FeatureFlag {
  key: FeatureKey;
  label: string;
  description: string;
  /** Which plan is required. Today every flag is 'free'. */
  tier: PlanTier;
  /** Independent kill switch — a flag can be turned off entirely regardless of tier. */
  enabled: boolean;
}

export interface Entitlements {
  role: UserRole;
  plan: PlanTier;
}
