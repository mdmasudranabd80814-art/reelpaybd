import React from 'react';
import { Wallet, ArrowRight } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';

interface BalanceCardProps {
  points: number;
  pointRate: number; // e.g. 10 points = 1 BDT
  onWithdrawClick: () => void;
  onDepositClick: () => void;
  lang: 'bn' | 'en';
  multiplier?: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  points,
  pointRate,
  onWithdrawClick,
  onDepositClick,
  lang,
  multiplier = 1.0,
}) => {
  const taka = Math.floor(points / (pointRate || 10));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00b050] via-[#00c853] to-[#009624] p-4 text-white shadow-xl shadow-emerald-950/40 border border-emerald-400/20">
      {/* Decorative ambient blurred glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-300/25 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-900/30 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Top: Wallet info */}
        <div>
          <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-semibold tracking-wide">
            <span className="p-1 rounded-lg bg-emerald-900/40 text-emerald-200">
              <Wallet className="w-3.5 h-3.5" />
            </span>
            <span>{lang === 'bn' ? 'আপনার ব্যালেন্স' : 'Your Balance'}</span>
            {multiplier > 1.0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-black animate-pulse">
                {toBengaliNumber(multiplier, lang)}x BONUS
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
              {toBengaliNumber(points, lang)} {lang === 'bn' ? 'পয়েন্ট' : 'Points'}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-100">
              = ৳{toBengaliNumber(taka, lang)}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-emerald-100/90 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping" />
            <span>
              {lang === 'bn'
                ? `আজ নগদে উত্তোলন যোগ্য ৳${toBengaliNumber(taka, lang)}`
                : `Ready to withdraw: ৳${toBengaliNumber(taka, lang)}`}
            </span>
          </p>
        </div>

        {/* Action Buttons matching prompt: Yellow Withdraw and Pink Deposit Points */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-400/30">
          <button
            onClick={onWithdrawClick}
            className="py-2.5 px-3 rounded-xl font-extrabold text-xs bg-[#ffcc00] hover:bg-[#e6b800] text-black shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>💸 {lang === 'bn' ? 'টাকা উত্তোলন / Withdraw' : 'Withdraw / উত্তোলন'}</span>
          </button>

          <button
            onClick={onDepositClick}
            className="py-2.5 px-3 rounded-xl font-extrabold text-xs bg-[#ff2d55] hover:bg-[#e0264b] text-white shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>💎 {lang === 'bn' ? '+ পয়েন্ট জমা / Deposit' : '+ Deposit Points'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
