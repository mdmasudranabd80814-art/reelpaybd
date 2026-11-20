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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12281c] via-[#101e17] to-[#0c1611] border border-emerald-500/40 p-3.5 shadow-xl">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00e676] text-[10px] font-black border border-emerald-500/30">
              <Flame className="w-3 h-3 fill-emerald-400 text-emerald-400" />
              <span>{lang === 'bn' ? `অতিথি মোড (${guestId})` : `Guest Mode (${guestId})`}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              🔒 {lang === 'bn' ? `গেস্ট পয়েন্ট: ${guestPoints} (উত্তোলনযোগ্য নয়)` : `Preview: ${guestPoints} pts (Non-withdrawable)`}
            </span>
          </div>

          <h3 className="text-sm font-extrabold text-white leading-snug">
            {lang === 'bn'
              ? 'লগইন ছাড়াই রিল দেখুন! আসল টাকা আয় করতে লগইন করুন'
              : 'Browse Reels Free! Login with a Real Account to Earn & Withdraw'}
          </h3>

          <p className="text-[11px] text-neutral-300 leading-normal">
            {lang === 'bn'
              ? 'গেস্ট আইডির পয়েন্ট শুধুমাত্র প্রিভিউ — উত্তোলনযোগ্য নয়। আসল অ্যাকাউন্টে লগইন করে আর্ন করলে বিকাশ/নগদে উইথড্র করা যাবে।'
              : 'Guest preview points cannot be withdrawn. Sign in to a verified real account to earn & cash out.'}
          </p>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-[#00c853]/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-emerald-950/80 relative z-10">
        <button
          onClick={onRegister}
          className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#00c853] to-[#00e676] hover:brightness-110 active:scale-95 text-black font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <span>{lang === 'bn' ? 'রেজিস্ট্রেশন (ফ্রি বোনাস)' : 'Free Register'}</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <button
          onClick={onLogin}
          className="py-2 px-3 rounded-xl bg-[#1b2e24] hover:bg-[#233c2e] active:scale-95 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1 transition cursor-pointer"
        >
          <span>{lang === 'bn' ? 'লগইন করুন' : 'Login'}</span>
        </button>
      </div>
    </div>
  );
};
