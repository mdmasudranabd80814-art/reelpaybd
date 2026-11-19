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
    if (!isEnabled) {
      alert('দৈনিক বোনাস বর্তমানে বন্ধ রয়েছে।');
      return;
    }

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
    <div className="rounded-2xl bg-[#141e18] border border-emerald-950/80 p-3.5 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-500/20 flex items-center justify-center shrink-0 text-[#00e676]">
          {isEnabled ? (
            <Gift className={`w-5 h-5 ${isClaimedToday ? 'text-emerald-500/50' : 'animate-bounce'}`} />
          ) : (
            <Lock className="w-5 h-5 text-neutral-500" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
            <span>দৈনিক বোনাস</span>
            {!isEnabled && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-amber-400 font-bold">বন্ধ</span>
            )}
          </h2>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {!isEnabled
              ? 'এডমিন কর্তৃক দৈনিক বোনাস সাময়িকভাবে স্থগিত'
              : isClaimedToday
              ? `আজকের ${toBengaliNumber(bonusPoints)} পয়েন্ট সংগ্রহ সম্পন্ন!`
              : `আজ লগইন করে ${toBengaliNumber(bonusPoints)} পয়েন্ট সংগ্রহ করুন`}
          </p>
        </div>
      </div>

      <button
        onClick={handleClaim}
        disabled={isClaimedToday || !isEnabled}
        className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
          !isEnabled
            ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 cursor-not-allowed opacity-70'
            : isClaimedToday
            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 cursor-default opacity-80'
            : 'bg-[#00c853] hover:bg-[#00e676] active:scale-95 text-black shadow-md shadow-emerald-500/20'
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
          <span>সংগ্রহ করুন +{toBengaliNumber(bonusPoints)}</span>
        )}
      </button>
    </div>
  );
};
