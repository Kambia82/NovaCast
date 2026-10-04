// Thin, feature-detected wrappers around the Web Speech APIs for On the Bank.
//
// Both halves are optional. Speech synthesis is widely supported; speech
// recognition is Chrome/Edge-ish only. Every consumer must work with neither —
// the buttons on the On the Bank screen do the same thing as the spoken
// questions.

export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';

type SpeechRecognitionCtor = new () => any;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export const recognitionSupported = getRecognitionCtor() !== null;

export function speak(text: string, opts: { rate?: number; onEnd?: () => void } = {}): void {
  if (!speechSupported || !text) { opts.onEnd?.(); return; }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate ?? 1;
    u.pitch = 1;
    if (opts.onEnd) u.onend = () => opts.onEnd!();
    window.speechSynthesis.speak(u);
  } catch {
    opts.onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (speechSupported) {
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  }
}

export interface Recognizer {
  supported: boolean;
  start(): void;
  stop(): void;
}

/**
 * One-shot recognizer: fires `onResult` with the lowercased transcript, then
 * `onEnd`. Not continuous — the On the Bank screen re-arms it per question so a
 * mis-hear doesn't spiral.
 */
export function createRecognizer(
  onResult: (transcript: string) => void,
  onEnd?: (err?: string) => void,
): Recognizer {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    return { supported: false, start: () => onEnd?.('unsupported'), stop: () => {} };
  }
  let rec: any = null;
  let stopped = false;

  return {
    supported: true,
    start() {
      stopped = false;
      try {
        rec = new Ctor();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.continuous = false;
        rec.onresult = (e: any) => {
          const t = e.results?.[0]?.[0]?.transcript ?? '';
          onResult(String(t).toLowerCase().trim());
        };
        rec.onerror = (e: any) => onEnd?.(e?.error || 'error');
        rec.onend = () => { if (!stopped) onEnd?.(); };
        rec.start();
      } catch (err: any) {
        onEnd?.(err?.message || 'error');
      }
    },
    stop() {
      stopped = true;
      try { rec?.stop(); } catch { /* noop */ }
    },
  };
}
