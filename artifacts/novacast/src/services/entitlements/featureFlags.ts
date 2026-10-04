import type { FeatureFlag, FeatureKey } from './types';

// The centralized config every gated feature checks against. Nothing in the
// UI should hard-code "is this user premium" — it asks hasAccess(entitlements,
// featureKey) and this file is the only place that answer can change.
//
// Every flag ships 'free' + enabled today per blueprint §13 — NovaCast is
// fully accessible right now. Moving a feature behind PREMIUM later is a
// one-word edit to `tier` here, not a UI rewrite.
export const FEATURE_REGISTRY: Record<FeatureKey, FeatureFlag> = {
  lunar_advanced: {
    key: 'lunar_advanced',
    label: 'Advanced lunar intelligence',
    description: 'Moonrise/moonset timing and deeper lunar feeding-window analysis beyond phase + illumination.',
    tier: 'free',
    enabled: true,
  },
  barometric_advanced: {
    key: 'barometric_advanced',
    label: 'Advanced barometric intelligence',
    description: 'True pressure trend from repeated sampling over time, not just a single reading.',
    tier: 'free',
    enabled: true,
  },
  ai_voice_coach: {
    key: 'ai_voice_coach',
    label: 'AI voice coach (On the Bank)',
    description: 'Spoken answers and ask-by-voice while actively fishing.',
    tier: 'free',
    enabled: true,
  },
  environmental_advanced: {
    key: 'environmental_advanced',
    label: 'Advanced environmental intelligence',
    description: 'Deeper water-column, forage, and structure modeling beyond today\'s snapshot.',
    tier: 'free',
    enabled: true,
  },
  catch_analytics: {
    key: 'catch_analytics',
    label: 'Catch history analytics',
    description: 'Trends and patterns across a user\'s logged catches over time.',
    tier: 'free',
    enabled: true,
  },
  expanded_intelligence: {
    key: 'expanded_intelligence',
    label: 'Expanded fishing intelligence',
    description: 'The full NovaCast Read reasoning layer (services/ai).',
    tier: 'free',
    enabled: true,
  },
};
