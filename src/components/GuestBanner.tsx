import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Flame } from 'lucide-react';

interface GuestBannerProps {
  onLogin: () => void;
  onRegister: () => void;
  guestId?: string;
  guestPoints?: number;
  lang?: 'bn' | 'en';
}

export const GuestBanner: React.FC<GuestBannerProps> = ({
  onLogin,
  onRegister,
  guestId = 'GUEST',
  guestPoints = 0,
  lang = 'bn',
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#10261a] via-[#0d1c14] to-[#0a140e] border border-emerald-500/35 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1 text-[#00e676]">
              <Flame className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
              <span>{lang === 'bn' ? `অতিথি মোড (${guestId})` : `Guest Mode (${guestId})`}</span>
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-amber-300 tabular-nums">
              {lang === 'bn' ? `গেস্ট পয়েন্ট: ${guestPoints} (প্রিভিউ)` : `Preview: ${guestPoints} pts`}
            </span>
          </div>

          <h3 className="text-sm font-extrabold text-white leading-snug">
            {lang === 'bn'
              ? 'লগইন ছাড়াই রিল দেখুন! আসল টাকা আয় করতে লগইন করুন'
              : 'Browse Reels Free! Login to Earn & Withdraw Real Cash'}
          </h3>

          <p className="text-[11px] text-neutral-300 leading-relaxed">
            {lang === 'bn'
              ? 'গেস্ট আইডির পয়েন্ট শুধুমাত্র প্রিভিউ — উত্তোলনযোগ্য নয়। আসল অ্যাকাউন্টে লগইন করে বিকাশ/নগদে উইথড্র করুন।'
              : 'Guest preview points cannot be withdrawn. Sign in to a verified account to earn & cash out.'}
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-[#00c853]/15 border border-emerald-400/35 flex items-center justify-center shrink-0 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-3.5 pt-3 border-t border-emerald-900/50 relative z-10">
        <button
          type="button"
          onClick={onRegister}
          className="min-h-[44px] py-2 px-3 rounded-xl bg-[#00c853] hover:bg-[#00e676] active:scale-[0.98] text-black font-black text-xs shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <span>{lang === 'bn' ? 'রেজিস্ট্রেশন' : 'Free Sign Up'}</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={onLogin}
          className="min-h-[44px] py-2 px-3 rounded-xl bg-[#16291e] hover:bg-[#1e3729] active:scale-[0.98] text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1 transition cursor-pointer"
        >
          <span>{lang === 'bn' ? 'লগইন করুন' : 'Login'}</span>
        </button>
      </div>
    </div>
  );
};
