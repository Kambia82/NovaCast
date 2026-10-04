// Unit conversions — pure math on values NovaCast already has, never a new
// measurement. Kept separate from the fetch/derive logic so display code and
// the AI context use the exact same conversion.

/** hPa -> inHg, US-friendly for a barometric pressure reading. */
export function hpaToInHg(hpa: number): number {
  return Math.round(hpa * 0.02953 * 100) / 100;
}
