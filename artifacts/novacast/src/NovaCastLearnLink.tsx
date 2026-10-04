import { GraduationCap } from 'lucide-react';
import { findLearnTarget } from './lib/learnLink';
import type { LearnTarget } from './lib/learnLink';

interface Props {
  /** Lure/technique/condition name to resolve against the learning content. */
  topic: string;
  onLearn: (target: LearnTarget) => void;
  /** Visual weight — 'pill' for dense lists, 'text' for a plain inline link. */
  variant?: 'pill' | 'text';
  className?: string;
}

/**
 * Renders nothing when there's no matching lesson — never a dead-end "Learn"
 * button. This is the one place a recommendation reaches into the Learning
 * system, so every contextual link behaves the same way.
 */
export default function NovaCastLearnLink({ topic, onLearn, variant = 'pill', className = '' }: Props) {
  const target = findLearnTarget(topic);
  if (!target) return null;

  if (variant === 'text') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onLearn(target); }}
        className={`text-[11px] text-[#7CCBE8] hover:text-[#BAE8FF] underline underline-offset-2 bg-transparent border-none cursor-pointer p-0 ${className}`}
      >
        Learn this
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onLearn(target); }}
      className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(124,203,232,0.12)] text-[#7CCBE8] font-semibold hover:bg-[rgba(124,203,232,0.2)] transition-colors border-none cursor-pointer ${className}`}
    >
      <GraduationCap className="w-2.5 h-2.5" /> Learn
    </button>
  );
}
