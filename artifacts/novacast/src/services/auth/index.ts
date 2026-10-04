// Optional Firebase Authentication (blueprint §14, §16).
//
// Login is never required. When Firebase isn't configured (placeholder env),
// `authAvailable` is false and every method is a safe no-op — the app runs
// exactly as it does today, fully device-local. When it IS configured, this is
// the single place the rest of the app learns "who is signed in", so storage
// (services/userData, services/catchLog) and access control
// (services/entitlements) can follow the user across devices.

import { firebaseConfigured } from '../../lib/firebase';

export interface NovaCastUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export interface AuthClaims {
  /** Set server-side only, via the Firebase Admin SDK on a trusted custom
   *  claim — never client-writable. Absent => 'user'. See services/entitlements. */
  role: 'user' | 'admin' | 'owner';
  /** Same — a future payments system would set this server-side. Absent => 'free'. */
  plan: 'free' | 'premium';
}

type Listener = (user: NovaCastUser | null) => void;

let currentUser: NovaCastUser | null = null;
let rawUser: any = null; // the underlying firebase/auth User, kept for claims lookups only
const listeners = new Set<Listener>();
let initialized = false;
let firebaseAuth: any = null;

function emit() {
  for (const l of listeners) l(currentUser);
}

function project(u: any): NovaCastUser {
  return { uid: u.uid, displayName: u.displayName ?? null, email: u.email ?? null };
}

async function ensureInit(): Promise<void> {
  if (initialized || !firebaseConfigured) { initialized = true; return; }
  initialized = true;
  try {
    const [{ getAuth, onAuthStateChanged }, { initializeApp, getApps }] = await Promise.all([
      import('firebase/auth'),
      import('firebase/app'),
    ]);
    // Reuse the app the data layer already created.
    const app = getApps()[0] ?? initializeApp({});
    firebaseAuth = getAuth(app);
    onAuthStateChanged(firebaseAuth, (u: any) => {
      rawUser = u;
      currentUser = u ? project(u) : null;
      emit();
    });
  } catch (err) {
    console.warn('[novacast/auth] init failed; staying in guest mode:', err);
  }
}

export const authAvailable = firebaseConfigured;

export function getCurrentUser(): NovaCastUser | null {
  return currentUser;
}

/** Subscribe to auth changes. Returns an unsubscribe fn. Kicks off init lazily. */
export function subscribeAuth(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentUser);
  void ensureInit();
  return () => { listeners.delete(listener); };
}

export async function signInWithGoogle(): Promise<NovaCastUser | null> {
  if (!firebaseConfigured) throw new Error('Account sync is not set up for this build yet.');
  await ensureInit();
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const res = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  rawUser = res.user;
  currentUser = project(res.user);
  emit();
  return currentUser;
}

export async function signOutUser(): Promise<void> {
  if (!firebaseAuth) return;
  const { signOut } = await import('firebase/auth');
  await signOut(firebaseAuth);
  rawUser = null;
  currentUser = null;
  emit();
}

/**
 * Sends a real password-reset email via Firebase's own mechanism (blueprint
 * §16 — "use the auth provider's proper administrative mechanisms", "do not
 * create custom password storage"). Only meaningful for email/password
 * accounts; harmless no-op-ish for Google-only accounts (Firebase itself
 * returns auth/user-not-found in that case, which is not treated as a leak of
 * whether an account exists — the caller should show a neutral message).
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!firebaseConfigured) throw new Error('Account sync is not set up for this build yet.');
  await ensureInit();
  const { sendPasswordResetEmail } = await import('firebase/auth');
  await sendPasswordResetEmail(firebaseAuth, email);
}

/**
 * Reads the signed-in user's role/plan custom claims from their ID token.
 * These are only ever SET server-side (Firebase Admin SDK — a Cloud Function
 * or trusted script, never this client), so there is no client-side admin
 * bypass here — just a read of whatever a trusted backend already decided.
 * Defaults to the least-privileged values when absent (no claim set yet, or
 * guest/signed-out).
 */
export async function getAuthClaims(): Promise<AuthClaims> {
  const fallback: AuthClaims = { role: 'user', plan: 'free' };
  if (!rawUser) return fallback;
  try {
    const { getIdTokenResult } = await import('firebase/auth');
    const result = await getIdTokenResult(rawUser, false);
    const claims: any = result.claims || {};
    const role = claims.role === 'owner' || claims.role === 'admin' ? claims.role : 'user';
    const plan = claims.plan === 'premium' ? 'premium' : 'free';
    return { role, plan };
  } catch {
    return fallback;
  }
}
