import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getEntitlements, hasAccess, GUEST_ENTITLEMENTS, type Entitlements, type FeatureKey } from '../services/entitlements';

export interface UseEntitlements {
  entitlements: Entitlements;
  can: (feature: FeatureKey) => boolean;
}

/** Re-resolves whenever the signed-in user changes; guests always resolve instantly. */
export function useEntitlements(): UseEntitlements {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements>(GUEST_ENTITLEMENTS);

  useEffect(() => {
    let cancelled = false;
    getEntitlements(user).then((e) => { if (!cancelled) setEntitlements(e); });
    return () => { cancelled = true; };
  }, [user?.uid]);

  return { entitlements, can: (feature) => hasAccess(entitlements, feature) };
}
