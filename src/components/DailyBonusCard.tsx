import React from 'react';
import { Gift, CheckCircle2, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../utils/audio';
import { toBengaliNumber } from '../utils/bengali';

interface DailyBonusCardProps {
  onClaim: (bonusPoints: number) => void;
  isClaimedToday: boolean;
  isMuted: boolean;
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
  bonusPoints?: number;
  isEnabled?: boolean;
}

export const DailyBonusCard: React.FC<DailyBonusCardProps> = ({
  onClaim,
  isClaimedToday,
  isMuted,
  isAuthenticated = true,
  onRequireAuth,
  bonusPoints = 50,
  isEnabled = true,
}) => {
  const [animating, setAnimating] = React.useState(false);

  const handleClaim = () => {
    if (!isEnabled) return;

    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    if (isClaimedToday || animating) return;
    setAnimating(true);

    if (!isMuted) {
      playSuccessChime();
    }

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00c853', '#00e676', '#ffab00', '#ffffff'],
      });
    } catch {
      // Ignore
    }

    onClaim(bonusPoints);
    setTimeout(() => setAnimating(false), 800);
  };

  return (
    <div className="rounded-2xl bg-[#121e17] border border-emerald-900/50 p-3.5 flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-emerald-950/90 border border-emerald-500/25 flex items-center justify-center shrink-0 text-[#00e676]">
          {isEnabled ? (
            <Gift className={`w-5 h-5 ${isClaimedToday ? 'text-emerald-500/60' : 'text-[#00e676]'}`} />
          ) : (
            <Lock className="w-5 h-5 text-neutral-500" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
            <span>দৈনিক বোনাস</span>
            {!isEnabled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold">বন্ধ</span>
            )}
          </h2>
          <p className="text-xs text-slate-400 truncate mt-0.5 tabular-nums">
            {!isEnabled
              ? 'এডমিন কর্তৃক দৈনিক বোনাস সাময়িকভাবে স্থগিত'
              : isClaimedToday
              ? `আজকের ${toBengaliNumber(bonusPoints)} পয়েন্ট সংগ্রহ সম্পন্ন`
              : `আজ লগইন করে +${toBengaliNumber(bonusPoints)} পয়েন্ট সংগ্রহ করুন`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClaim}
        disabled={isClaimedToday || !isEnabled || animating}
        className={`shrink-0 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 flex items-center gap-1.5 tabular-nums ${
          !isEnabled
            ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 cursor-not-allowed'
            : isClaimedToday
            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 cursor-default'
            : 'bg-[#00c853] hover:bg-[#00e676] active:scale-95 text-black shadow-md shadow-emerald-500/20 cursor-pointer'
        }`}
      >
        {!isEnabled ? (
          <span>স্থগিত</span>
        ) : isClaimedToday ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>সংগৃহীত</span>
          </>
        ) : (
          <span>সংগ্রহ +{toBengaliNumber(bonusPoints)}</span>
        )}
      </button>
    </div>
  );
};
