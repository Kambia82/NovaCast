import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Mic, MicOff, Volume2, VolumeX, Fish, FileText } from 'lucide-react';
import NovaCastLakeSnapshot from './NovaCastLakeSnapshot';
import type { LakeSnapshot } from './services/lakeSnapshot';
import type { FishingInsight, AnswerKey, CtxObservations } from './services/ai';
import { spokenAnswers, matchQuestion, ANSWER_PROMPTS } from './services/ai';
import { speak, stopSpeaking, createRecognizer, speechSupported, recognitionSupported } from './lib/voice';
import NovaCastLearnLink from './NovaCastLearnLink';
import type { LearnTarget } from './lib/learnLink';
import { useEntitlements } from './hooks/useEntitlements';

interface Props {
  waterName: string | null;
  snapshot: LakeSnapshot | null;
  insight: FishingInsight | null;
  insightLoading: boolean;
  observations: CtxObservations;
  onObservationsChange: (o: CtxObservations) => void;
  onOpenFullPlan: () => void;
  onLogCatch: () => void;
  /** Deeper explanation stays in the normal Learning experience, not voice. */
  onLearnTopic?: (target: LearnTarget) => void;
  onBack: () => void;
}

const OBS_GROUPS: { key: keyof CtxObservations; label: string; options: string[] }[] = [
  { key: 'clarity', label: 'Water', options: ['Clear', 'Stained', 'Muddy'] },
  { key: 'vegetation', label: 'Weeds', options: ['Little', 'Some', 'Heavy'] },
  { key: 'baitActivity', label: 'Bait', options: ['Seeing bait', 'None'] },
  { key: 'fishActivity', label: 'Fish', options: ['Surfacing', 'Nothing showing'] },
];

export default function NovaCastOnTheBank({
  waterName, snapshot, insight, insightLoading, observations,
  onObservationsChange, onOpenFullPlan, onLogCatch, onLearnTopic, onBack,
}: Props) {
  const answers = useMemo(() => spokenAnswers(insight), [insight]);
  // Voice is free today (blueprint §13) — this reads the same feature-flag
  // registry a future PREMIUM gate would use, so flipping `ai_voice_coach` to
  // premium later needs no UI change here.
  const { can } = useEntitlements();
  const voiceEntitled = can('ai_voice_coach');
  const [activeKey, setActiveKey] = useState<AnswerKey | null>(null);
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const recognizerRef = useRef<ReturnType<typeof createRecognizer> | null>(null);

  useEffect(() => () => { stopSpeaking(); recognizerRef.current?.stop(); }, []);

  const answer = (key: AnswerKey, opts: { fromVoice?: boolean } = {}) => {
    setActiveKey(key);
    if (voiceOn || opts.fromVoice) speak(answers[key], { rate: 1 });
  };

  const toggleVoice = () => {
    setVoiceOn(v => {
      if (v) stopSpeaking();
      return !v;
    });
  };

  const startListening = () => {
    if (!recognitionSupported) return;
    setHeard('');
    setListening(true);
    const rec = createRecognizer(
      (transcript) => {
        setHeard(transcript);
        const key = matchQuestion(transcript);
        answer(key, { fromVoice: true });
      },
      () => { setListening(false); },
    );
    recognizerRef.current = rec;
    rec.start();
  };
  const stopListening = () => { recognizerRef.current?.stop(); setListening(false); };

  const setObs = (key: keyof CtxObservations, value: string) => {
    const current = observations[key];
    onObservationsChange({ ...observations, [key]: current === value ? null : value });
  };

  return (
    <div className="animate-fade-up pt-6 pb-24 px-1">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-[#4A6878] hover:text-[#7CCBE8] text-xs bg-transparent border-none cursor-pointer">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button onClick={onOpenFullPlan} className="flex items-center gap-1.5 text-[11px] text-[#7CCBE8] hover:text-[#BAE8FF]">
          <FileText className="w-3.5 h-3.5" /> Full Game Plan
        </button>
      </div>

      <div className="font-display text-[30px] tracking-[3px] text-[#BAE8FF] leading-none nova-glow mb-1">On the Bank</div>
      <div className="text-xs text-[#4A6878] mb-4">{waterName || 'Your spot'} · quick answers while you fish</div>

      {snapshot && <div className="mb-4"><NovaCastLakeSnapshot snapshot={snapshot} variant="compact" /></div>}

      {/* Voice controls — free feature today; gated through the entitlements
          registry so a future PREMIUM flip needs no change here. */}
      {voiceEntitled ? (
      <div className="flex gap-2 mb-4">
        <button
          onClick={toggleVoice}
          disabled={!speechSupported}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all disabled:opacity-40 ${
            voiceOn ? 'bg-[rgba(124,203,232,0.15)] border-[rgba(124,203,232,0.4)] text-[#BAE8FF]' : 'bg-[#0c1822] border-[#1A3346] text-[#4A6878]'
          }`}
        >
          {voiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          {speechSupported ? (voiceOn ? 'Speaking answers' : 'Speak answers') : 'Speech not available'}
        </button>
        {recognitionSupported && (
          <button
            onClick={listening ? stopListening : startListening}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
              listening ? 'bg-[rgba(252,129,129,0.15)] border-[rgba(252,129,129,0.4)] text-[#FCA5A5]' : 'bg-[#0c1822] border-[#1A3346] text-[#4A6878]'
            }`}
          >
            {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {listening ? 'Listening…' : 'Ask by voice'}
          </button>
        )}
      </div>
      ) : null}
      {heard && <div className="text-[11px] text-[#4A6878] mb-3 -mt-1">Heard: “{heard}”</div>}

      {/* Question buttons — large touch targets */}
      <div className="grid grid-cols-1 gap-2 mb-4">
        {ANSWER_PROMPTS.map(p => (
          <div
            key={p.key}
            role="button"
            tabIndex={0}
            onClick={() => answer(p.key)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') answer(p.key); }}
            className={`w-full text-left px-4 py-4 rounded-2xl border cursor-pointer transition-all ${
              activeKey === p.key
                ? 'bg-[rgba(186,232,255,0.08)] border-[rgba(186,232,255,0.4)]'
                : 'bg-[#0c1822] border-[#1A3346] hover:border-[rgba(186,232,255,0.25)]'
            }`}
          >
            <div className="text-sm font-semibold text-[#C8E4F0]">{p.label}</div>
            {activeKey === p.key && (
              <div className="text-[13px] text-[#A8C8D8] leading-relaxed mt-2">
                {insightLoading ? 'Reading the water…' : answers[p.key]}
                {!insightLoading && onLearnTopic && insight?.techniques[0]?.lure && (
                  <div className="mt-1.5"><NovaCastLearnLink topic={insight.techniques[0].lure} onLearn={onLearnTopic} variant="text" /></div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Observations feed straight into the fishing-intelligence context */}
      <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4 mb-4">
        <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-3">What do you see?</div>
        <div className="space-y-2.5">
          {OBS_GROUPS.map(g => (
            <div key={g.key}>
              <div className="text-[10px] text-[#4A6878] mb-1">{g.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.options.map(opt => {
                  const active = observations[g.key] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setObs(g.key, opt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-[rgba(186,232,255,0.15)] border-[rgba(186,232,255,0.4)] text-[#BAE8FF]'
                          : 'bg-[#060b10] border-[#1A3346] text-[#4A6878]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-[#4A6878] mt-3">These update the answers above — NovaCast won't assume what it can't see.</div>
      </div>

      <button
        onClick={onLogCatch}
        className="w-full py-3.5 bg-[rgba(186,232,255,0.1)] border border-[rgba(186,232,255,0.3)] rounded-2xl text-[#BAE8FF] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[rgba(186,232,255,0.16)] transition-all"
      >
        <Fish className="w-4 h-4" /> Caught one? Log it
      </button>
    </div>
  );
}
