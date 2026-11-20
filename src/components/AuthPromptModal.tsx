import React from 'react';
import { X, Sparkles, Smartphone, ArrowRight, Wallet, Gift } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';

import { EarningSettings } from '../types';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  title?: string;
  message?: string;
  lang?: 'bn' | 'en';
  earningSettings?: EarningSettings;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenRegister,
  title,
  message,
  lang = 'bn',
  earningSettings,
}) => {
  if (!isOpen) return null;

  const hasLoginOffer = Boolean(
    earningSettings?.isMasterEarningEnabled !== false &&
    earningSettings?.isLoginOfferEnabled &&
    (earningSettings?.loginOfferPoints || 0) > 0
  );
  const offerPts = earningSettings?.loginOfferPoints || 0;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-[28px] bg-gradient-to-b from-[#13231a] to-[#0a120e] border border-emerald-500/40 p-6 shadow-2xl text-white text-center space-y-4 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00c853] to-[#00e676] flex items-center justify-center shadow-lg shadow-emerald-500/30 text-black">
          <Sparkles className="w-8 h-8 stroke-[2.5]" />
        </div>

        {/* Heading */}
        <div className="space-y-1.5 pt-1">
          <h3 className="text-xl font-black text-white tracking-tight">
            {title || (lang === 'bn' ? 'টাকা আর্ন করতে চান?' : 'Want to Earn Money?')}
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed px-2">
            {message ||
              (lang === 'bn'
                ? 'হোমপেজ সবার জন্য উন্মুক্ত! তবে রিল দেখে পয়েন্ট আয় করতে, দৈনিক বোনাস পেতে এবং বিকাশ/নগদে টাকা তুলতে লগইন বা রেজিস্ট্রেশন করুন।'
                : 'Homepage is open for everyone! To earn points from reels, claim daily bonus, and withdraw to bKash/Nagad, please login or register.')}
          </p>
        </div>

        {/* Benefits Pill */}
        <div className="bg-[#0e1913] border border-emerald-950 rounded-2xl p-3 text-left space-y-2 text-[11px] text-neutral-300">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</span>
            <span>{lang === 'bn' ? 'প্রতি রিলে সরাসরি পয়েন্ট ইনকাম' : 'Direct point earnings per reel'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</span>
            <span>{lang === 'bn' ? 'বিকাশ, নগদ ও রকেটে ইনস্ট্যান্ট ক্যাশআউট' : 'Instant withdrawal via bKash/Nagad/Rocket'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</span>
            <span>
              {hasLoginOffer
                ? (lang === 'bn'
                    ? `🎁 লগইন/রেজিস্ট্রেশন অফার: +${toBengaliNumber(offerPts, lang)} পয়েন্ট বোনাস`
                    : `🎁 Login/Signup Offer: +${offerPts} bonus points`)
                : (lang === 'bn'
                    ? 'ভিডিও দেখে ও টাস্ক করে পর্যায়ক্রমে পয়েন্ট আয় করুন'
                    : 'Earn points step by step watching videos & tasks')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00c853] to-[#00e676] hover:brightness-110 text-black font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>
              {hasLoginOffer
                ? (lang === 'bn' ? `নতুন অ্যাকাউন্ট খুলুন (+${toBengaliNumber(offerPts, lang)} পয়েন্ট)` : `Create Account (+${offerPts} Pts)`)
                : (lang === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Free Account')}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="w-full py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'Already have account? Login'}</span>
          </button>
        </div>

        {/* Continue Browsing Link */}
        <button
          onClick={onClose}
          className="text-[11px] text-neutral-400 hover:text-neutral-200 transition underline pt-1 cursor-pointer"
        >
          {lang === 'bn' ? 'না, আমি শুধু রিল/ভিডিও দেখব' : 'No, just let me browse reels'}
        </button>
      </div>
    </div>
  );
};
