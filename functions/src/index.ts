import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

initializeApp();

// Set via: firebase functions:secrets:set ADMIN_PASSWORD
const ADMIN_PASSWORD = defineSecret("ADMIN_PASSWORD");

/**
 * Grants the calling (already signed-in, e.g. anonymous) Firebase Auth user
 * the `admin` custom claim after checking a password kept server-side in
 * Secret Manager — never shipped to the client bundle. firestore.rules
 * gates writes to `adminWaters` on `request.auth.token.admin == true`.
 *
 * Replaces the previous client-side-only password check (a literal string
 * compared in App.tsx), which had no real enforcement behind it: nothing
 * stopped a client from writing to admin_lakes/adminWaters directly,
 * bypassing the UI's password gate entirely.
 */
export const claimAdmin = onCall(
  { secrets: [ADMIN_PASSWORD] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in before requesting admin access.",
      );
    }

    const password = request.data?.password;
    if (typeof password !== "string" || password.length === 0) {
      throw new HttpsError("invalid-argument", "Password is required.");
    }
    if (password !== ADMIN_PASSWORD.value()) {
      throw new HttpsError("permission-denied", "Incorrect admin password.");
    }

    await getAuth().setCustomUserClaims(request.auth.uid, { admin: true });
    return { ok: true as const };
  },
);
