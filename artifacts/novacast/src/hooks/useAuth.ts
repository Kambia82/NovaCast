import { useCallback, useEffect, useState } from 'react';
import {
  authAvailable, subscribeAuth, signInWithGoogle, signOutUser,
  type NovaCastUser,
} from '../services/auth';

export interface UseAuth {
  /** null = guest (the default, fully functional). */
  user: NovaCastUser | null;
  /** false when Firebase isn't configured — sign-in UI should say so, not break. */
  available: boolean;
  busy: boolean;
  error: string | null;
  signIn: () => void;
  signOut: () => void;
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<NovaCastUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeAuth(setUser), []);

  const signIn = useCallback(() => {
    setError(null);
    setBusy(true);
    signInWithGoogle()
      .catch((e) => setError(e instanceof Error ? e.message : 'Sign-in failed'))
      .finally(() => setBusy(false));
  }, []);

  const signOut = useCallback(() => {
    setBusy(true);
    signOutUser().finally(() => setBusy(false));
  }, []);

  return { user, available: authAvailable, busy, error, signIn, signOut };
}
