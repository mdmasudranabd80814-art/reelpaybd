import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Flame } from 'lucide-react';

interface GuestBannerProps {
  onLogin: () => void;
  onRegister: () => void;
  lang?: 'bn' | 'en';
}

export const GuestBanner: React.FC<GuestBannerProps> = ({
  onLogin,
  onRegister,
  lang = 'bn',
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12281c] via-[#101e17] to-[#0c1611] border border-emerald-500/40 p-3.5 shadow-xl">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#00e676] text-[10px] font-black border border-emerald-500/30">
            <Flame className="w-3 h-3 fill-emerald-400 text-emerald-400" />
            <span>{lang === 'bn' ? 'হোমপেজ সবার জন্য উন্মুক্ত' : 'Public Homepage'}</span>
          </div>

          <h3 className="text-sm font-extrabold text-white leading-snug">
            {lang === 'bn'
              ? 'টাকা আর্ন করতে চান? লগইন বা রেজিস্ট্রেশন করুন!'
              : 'Want to earn money? Login or register now!'}
          </h3>

          <p className="text-[11px] text-neutral-300 leading-normal">
            {lang === 'bn'
              ? 'ভিডিও দেখা সবার জন্য ফ্রি। রিল দেখে পয়েন্ট আয় ও বিকাশ/নগদে ক্যাশআউট পেতে অ্যাকাউন্ট খুলুন।'
              : 'Watching is 100% free. Create an account to earn points and withdraw to bKash/Nagad.'}
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#00c853]/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
          <Sparkles className="w-6 h-6 animate-pulse" />
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
