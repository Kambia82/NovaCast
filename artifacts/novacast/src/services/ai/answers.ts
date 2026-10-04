// Turns a FishingInsight into the short, spoken-length answers On the Bank uses.
// Kept here (not in the component) so it is testable and stays consistent with
// the insight shape.

import type { FishingInsight } from './types';

export type AnswerKey = 'throw' | 'retrieve' | 'where' | 'change' | 'next';

export const ANSWER_PROMPTS: { key: AnswerKey; label: string; match: RegExp }[] = [
  { key: 'throw', label: 'What do I throw?', match: /throw|start|lure|bait|tie on/ },
  { key: 'retrieve', label: 'How do I fish it?', match: /retriev|reel|work it|fish it|how/ },
  { key: 'where', label: 'Where do I cast?', match: /where|cast|depth|deep|shallow|spot/ },
  { key: 'change', label: "Not biting — what now?", match: /not bit|nothing|change|slow|dead|quiet/ },
  { key: 'next', label: 'What should I try next?', match: /next|else|another|switch|try/ },
];

/** Trim to roughly one spoken sentence. */
function oneSentence(s: string, max = 180): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  const stop = clean.search(/(?<=[.!?])\s/);
  const first = stop > 40 ? clean.slice(0, stop + 1) : clean;
  return first.length > max ? first.slice(0, max - 1).trimEnd() + '…' : first;
}

export function spokenAnswers(insight: FishingInsight | null): Record<AnswerKey, string> {
  if (!insight) {
    const fallback = 'I need a bit more to go on — open the full Game Plan and set your target and conditions.';
    return { throw: fallback, retrieve: fallback, where: fallback, change: fallback, next: fallback };
  }
  const t0 = insight.techniques[0];
  const t1 = insight.techniques[1];

  return {
    throw: t0
      ? `Start with the ${t0.lure}. ${oneSentence(t0.presentation, 120)}`
      : oneSentence(insight.summary),
    retrieve: t0 ? oneSentence(t0.presentation) : oneSentence(insight.summary),
    where: oneSentence(insight.depthStrategy),
    change: insight.adjustments[0] ? oneSentence(insight.adjustments[0]) : 'Change your retrieve speed first, then your lure, then move.',
    next: t1
      ? `Try the ${t1.lure}. ${oneSentence(t1.presentation, 120)}`
      : insight.adjustments[1]
      ? oneSentence(insight.adjustments[1])
      : 'Move to fresh water — a wind-blown bank, a point, or an inflow — and start over.',
  };
}

/** Route a free-text/heard question to the best answer key. */
export function matchQuestion(text: string): AnswerKey {
  const lc = text.toLowerCase();
  for (const p of ANSWER_PROMPTS) if (p.match.test(lc)) return p.key;
  return 'throw';
}
