import React from 'react';
import { Wallet, ArrowUpRight, Plus } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';

interface BalanceCardProps {
  points: number;
  pointRate: number; // e.g. 10 points = 1 BDT
  onWithdrawClick: () => void;
  onDepositClick: () => void;
  lang: 'bn' | 'en';
  multiplier?: number;
  isDepositsEnabled?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  points,
  pointRate,
  onWithdrawClick,
  onDepositClick,
  lang,
  multiplier = 1.0,
  isDepositsEnabled = true,
}) => {
  const safeRate = pointRate > 0 ? pointRate : 10;
  const taka = Math.floor(points / safeRate);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e3420] via-[#0b2618] to-[#081a11] p-5 text-white shadow-xl border border-emerald-500/30">
      <div className="absolute -top-14 -right-14 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold tracking-wide">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                <Wallet className="w-3.5 h-3.5" />
              </span>
              <span>{lang === 'bn' ? 'আপনার ওয়ালেট ব্যালেন্স' : 'Your Wallet Balance'}</span>
            </div>
            {multiplier > 1.0 && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold tabular-nums">
                {toBengaliNumber(multiplier, lang)}x {lang === 'bn' ? 'বোনাস' : 'BOOST'}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-baseline gap-2 flex-wrap tabular-nums">
            <span className="text-3xl font-black tracking-tight text-white">
              {toBengaliNumber(points, lang)}
            </span>
            <span className="text-sm font-bold text-emerald-300">
              {lang === 'bn' ? 'পয়েন্ট' : 'Points'}
            </span>
            <span className="text-lg font-extrabold text-amber-300 ml-auto">
              ≈ ৳{toBengaliNumber(taka, lang)}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-neutral-300 tabular-nums">
            {lang === 'bn'
              ? `বর্তমান রেট: ${toBengaliNumber(safeRate, lang)} পয়েন্ট = ৳১ · উত্তোলনযোগ্য ৳${toBengaliNumber(taka, lang)}`
              : `Rate: ${safeRate} pts = ৳1 · Available: ৳${taka}`}
          </p>
        </div>

        <div className={`grid ${isDepositsEnabled ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 pt-3 border-t border-emerald-800/40`}>
          <button
            type="button"
            onClick={onWithdrawClick}
            className="min-h-[44px] px-3 rounded-xl font-extrabold text-xs bg-[#00c853] hover:bg-[#00e676] text-black shadow-md shadow-emerald-950/40 transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'টাকা উত্তোলন' : 'Withdraw'}</span>
          </button>

          {isDepositsEnabled && (
            <button
              type="button"
              onClick={onDepositClick}
              className="min-h-[44px] px-3 rounded-xl font-extrabold text-xs bg-[#172f22] hover:bg-[#1e3d2c] border border-emerald-500/35 text-emerald-200 transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'bn' ? 'পয়েন্ট ডিপোজিট' : 'Deposit Points'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
