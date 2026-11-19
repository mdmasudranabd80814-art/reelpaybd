import React, { useState } from 'react';
import { User as UserIcon, ShieldCheck, ArrowRight, Smartphone, HelpCircle, FileText } from 'lucide-react';
import { ProfileInfoModal, ProfileInfoModalMode } from './ProfileInfoModal';

interface GuestProfileViewProps {
  onLogin: () => void;
  onRegister: () => void;
  lang?: 'bn' | 'en';
}

export const GuestProfileView: React.FC<GuestProfileViewProps> = ({
  onLogin,
  onRegister,
  lang = 'bn',
}) => {
  const [infoMode, setInfoMode] = useState<ProfileInfoModalMode | null>(null);

  return (
    <div className="space-y-4 pb-20 text-white animate-in fade-in duration-200">
      {/* Profile Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12281c] to-[#0a140f] border border-emerald-500/30 p-5 shadow-2xl text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-emerald-950/80 border-2 border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
          <UserIcon className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-lg font-black text-white">
            {lang === 'bn' ? 'স্বাগতম অতিথি / ভিজিটর!' : 'Welcome Guest!'}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {lang === 'bn'
              ? 'আপনি অতিথি হিসেবে হোমপেজের রিল উপভোগ করছেন।'
              : 'You are browsing public reels as a guest.'}
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onLogin}
            className="min-h-[44px] py-3 rounded-2xl bg-[#00c853] hover:bg-[#00e676] text-black font-black text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>{lang === 'bn' ? 'লগইন করুন' : 'Log In'}</span>
          </button>

          <button
            type="button"
            onClick={onRegister}
            className="min-h-[44px] py-3 rounded-2xl bg-[#1a2f23] hover:bg-[#233f2f] text-emerald-300 font-bold text-xs border border-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{lang === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'Create Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Helpful Links & Info */}
      <div className="rounded-2xl bg-[#141e18] border border-emerald-950 p-2 space-y-1">
        <button
          type="button"
          onClick={() => setInfoMode('terms')}
          className="w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <b className="text-xs text-white block">{lang === 'bn' ? 'নিরাপত্তা ও প্রাইভেসি' : 'Security & Privacy'}</b>
              <span className="text-[10px] text-neutral-400">
                {lang === 'bn' ? 'আপনার তথ্য ও অ্যাকাউন্ট নিরাপত্তা নীতিমালা' : 'Account protection & privacy policy'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-500" />
        </button>

        <button
          type="button"
          onClick={() => setInfoMode('faq')}
          className="w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <b className="text-xs text-white block">{lang === 'bn' ? 'সাহায্য ও সচরাচর জিজ্ঞাসা' : 'Help & FAQ'}</b>
              <span className="text-[10px] text-neutral-400">
                {lang === 'bn' ? 'আর্নিং, লাইভ ও ক্যাশআউট সম্পর্কে জানুন' : 'Learn about earning, live & payouts'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-500" />
        </button>

        <button
          type="button"
          onClick={() => setInfoMode('levels')}
          className="w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <b className="text-xs text-white block">{lang === 'bn' ? 'লেভেল ও বোনাস গাইড' : 'Levels & Bonus Guide'}</b>
              <span className="text-[10px] text-neutral-400">
                {lang === 'bn' ? 'ReelPay BD মেম্বারশিপ লেভেল ও সুবিধা' : 'Membership tiers & multipliers'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-500" />
        </button>
      </div>

      <ProfileInfoModal
        mode={infoMode}
        onClose={() => setInfoMode(null)}
        lang={lang}
      />
    </div>
  );
};
