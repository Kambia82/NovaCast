// Shared geolocation helpers.
//
// Why this exists: every getCurrentPosition() error callback in the app used to
// assume the failure was a permission denial and show "Location permission
// denied" — even when the real GeolocationPositionError.code was 2
// (POSITION_UNAVAILABLE, common on mobile / weak GPS) or 3 (TIMEOUT), or when
// the page simply wasn't a secure context (opening the LAN dev URL over http on
// a phone). Users saw "denied" with permission actually granted. These helpers
// give an accurate, code-specific message and a real timeout so a slow fix
// doesn't hang forever.

export const GEO_OPTS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 60000,
};

/**
 * Reason a location request can't even be attempted. Returns null when it's
 * worth calling getCurrentPosition(). Call this before showing the GPS spinner.
 */
export function geoPreflightError(): string | null {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return 'This device or browser has no location support. Search for a place instead.';
  }
  // Geolocation is only available in a secure context. localhost counts;
  // http://<lan-ip> (e.g. from the dev QR code) does not.
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return 'Location needs a secure (https) connection. Open the deployed https link rather than a local http address, then try again.';
  }
  return null;
}

/** Map a GeolocationPositionError to an honest, specific message. */
export function geoErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? (err as { code?: number }).code
    : undefined;
  switch (code) {
    case 1: // PERMISSION_DENIED
      return 'Location access is blocked for this site. Enable it in your browser/site settings, then try again — or search for a place instead.';
    case 2: // POSITION_UNAVAILABLE
      return "Your device couldn't get a location fix right now (no GPS/network signal). Move to open sky or search for a place instead.";
    case 3: // TIMEOUT
      return 'Locating timed out. Try again, or search for a place instead.';
    default:
      return "Couldn't get your location. Try again, or search for a place instead.";
  }
}

/**
 * Promisified getCurrentPosition with the shared options and preflight checks.
 * Rejects with an Error whose message is already user-facing.
 */
export function getPosition(opts: PositionOptions = GEO_OPTS): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    const pre = geoPreflightError();
    if (pre) { reject(new Error(pre)); return; }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => reject(new Error(geoErrorMessage(err))),
      opts,
    );
  });
}
