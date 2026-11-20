import React from 'react';
import { Wallet, ShieldCheck, ArrowRight, CheckCircle2, Clock, Smartphone } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';

interface GuestWalletViewProps {
  pointRate: number;
  guestId?: string;
  guestPoints?: number;
  onLogin: () => void;
  onRegister: () => void;
  lang?: 'bn' | 'en';
}

export const GuestWalletView: React.FC<GuestWalletViewProps> = ({
  pointRate,
  guestId = 'GUEST',
  guestPoints = 0,
  onLogin,
  onRegister,
  lang = 'bn',
}) => {
  const previewBDT = (guestPoints / (pointRate || 10)).toFixed(2);
  return (
    <div className="space-y-4 pb-20 text-white animate-in fade-in duration-200">
      {/* Wallet Preview Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#132c1e] via-[#0e2016] to-[#09130e] border border-emerald-500/40 p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {lang === 'bn' ? `গেস্ট ওয়ালেট (${guestId})` : `Guest Wallet (${guestId})`}
          </span>
          <span className="text-xs text-neutral-400 font-medium">
            {toBengaliNumber(pointRate, lang)} {lang === 'bn' ? 'পয়েন্ট = ১ টাকা' : 'pts = 1 BDT'}
          </span>
        </div>

        <div className="mt-4 space-y-1.5">
          <p className="text-xs text-neutral-400">
            {lang === 'bn' ? 'গেস্ট প্রিভিউ ব্যালেন্স (অ-উত্তোলনযোগ্য)' : 'Guest Preview Balance (Non-Withdrawable)'}
          </p>
          <div className="flex flex-wrap items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-amber-300">
              {toBengaliNumber(guestPoints, lang)} {lang === 'bn' ? 'পয়েন্ট' : 'Pts'}
            </span>
            <span className="text-xs text-neutral-400 font-bold">
              (≈ ৳{toBengaliNumber(previewBDT, lang)})
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
            <span>🔒 {lang === 'bn' ? 'উত্তোলনযোগ্য নয় — আসল আয় ও উইথড্র করতে রিয়েল আইডিতে লগইন করুন' : 'Not withdrawable — login to a real account to earn & cashout'}</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-emerald-950">
          <button
            onClick={onLogin}
            className="py-3 rounded-2xl bg-[#00c853] hover:bg-[#00e676] text-black font-black text-xs transition active:scale-95 flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>{lang === 'bn' ? 'লগইন করুন' : 'Log In'}</span>
          </button>

          <button
            onClick={onRegister}
            className="py-3 rounded-2xl bg-[#1b2f24] hover:bg-[#253f31] text-emerald-300 font-bold text-xs border border-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{lang === 'bn' ? 'অ্যাকাউন্ট খুলুন' : 'Sign Up'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Payment Methods Supported */}
      <div className="rounded-2xl bg-[#141e18] border border-emerald-950 p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
          {lang === 'bn' ? 'সমর্থিত পেমেন্ট মেথড' : 'Supported Payment Methods'}
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#1c2921] border border-emerald-900/50 rounded-xl p-3 text-center">
            <b className="text-sm font-black text-[#e2136e] block">bKash</b>
            <span className="text-[10px] text-neutral-400">বিকাশ পার্সোনাল</span>
          </div>
          <div className="bg-[#1c2921] border border-emerald-900/50 rounded-xl p-3 text-center">
            <b className="text-sm font-black text-[#f7931e] block">Nagad</b>
            <span className="text-[10px] text-neutral-400">নগদ একাউন্ট</span>
          </div>
          <div className="bg-[#1c2921] border border-emerald-900/50 rounded-xl p-3 text-center">
            <b className="text-sm font-black text-[#8c3894] block">Rocket</b>
            <span className="text-[10px] text-neutral-400">রকেট ওয়ালেট</span>
          </div>
        </div>
      </div>

      {/* Rules & Transparency */}
      <div className="rounded-2xl bg-[#141e18] border border-emerald-950 p-4 space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
          {lang === 'bn' ? 'উত্তোলন সুবিধা ও নীতিমালা' : 'Withdrawal Highlights'}
        </h3>

        <div className="space-y-2 text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>সর্বনিম্ন উত্তোলন পরিমাণ মাত্র ১০০ টাকা (১,০০০ পয়েন্ট)।</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>আবেদনের ১০ মিনিট থেকে ২ ঘণ্টার মধ্যে পেমেন্ট সম্পন্ন।</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>১০০% নিরাপদ ও ট্রাস্টেড এডমিন ভেরিফাইড সিস্টেম।</span>
          </div>
        </div>
      </div>
    </div>
  );
};
