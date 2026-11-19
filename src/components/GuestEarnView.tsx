import React from 'react';
import { Sparkles, PlayCircle, RotateCw, Gift, Users, Wallet, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';

import { EarningSettings } from '../types';

interface GuestEarnViewProps {
  onLogin: () => void;
  onRegister: () => void;
  lang?: 'bn' | 'en';
  earningSettings?: EarningSettings;
}

export const GuestEarnView: React.FC<GuestEarnViewProps> = ({
  onLogin,
  onRegister,
  lang = 'bn',
  earningSettings,
}) => {
  const hasLoginOffer = Boolean(
    earningSettings?.isMasterEarningEnabled !== false &&
    earningSettings?.isLoginOfferEnabled &&
    (earningSettings?.loginOfferPoints || 0) > 0
  );
  const offerPts = earningSettings?.loginOfferPoints || 0;
  return (
    <div className="space-y-4 pb-20 text-white animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#122e20] via-[#0e1f16] to-[#0a120e] border border-emerald-500/40 p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00c853] to-[#00e676] flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-emerald-500/30">
            ৳
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {lang === 'bn' ? 'আর্ন হাব' : 'Earn Hub'}
            </span>
            <h2 className="text-lg font-black text-white mt-1">
              {lang === 'bn' ? 'টাকা আর্ন করতে চাইলে লগইন করুন' : 'Login to Start Earning Money'}
            </h2>
          </div>
        </div>

        <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
          {lang === 'bn'
            ? 'হোমপেজে রিল দেখতে কোনো অ্যাকাউন্ট লাগে না। তবে রিল দেখে পয়েন্ট আয়, দৈনিক স্পিন ও বিকাশ/নগদে টাকা তুলতে লগইন বা রেজিস্ট্রেশন প্রয়োজন।'
            : 'Homepage is free to browse. Login or register to earn points, spin the wheel, and withdraw cash to bKash/Nagad.'}
        </p>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-emerald-950/80">
          <button
            onClick={onRegister}
            className="py-3 rounded-2xl bg-gradient-to-r from-[#00c853] to-[#00e676] hover:brightness-110 active:scale-95 text-black font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>{lang === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Sign Up Free'}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          <button
            onClick={onLogin}
            className="py-3 rounded-2xl bg-[#18291f] hover:bg-[#203629] active:scale-95 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1 transition cursor-pointer"
          >
            <span>{lang === 'bn' ? 'লগইন করুন' : 'Log In'}</span>
          </button>
        </div>
      </div>

      {/* Ways to Earn Cards */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 px-1">
          {lang === 'bn' ? 'ইনকামের ৫টি সহজ মাধ্যম' : '5 Easy Ways to Earn'}
        </h3>

        {/* Feature 1 */}
        <div className="rounded-2xl bg-[#141e18] border border-emerald-950/80 p-3.5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <b className="text-sm text-white">{lang === 'bn' ? '১. রিল দেখে ইনকাম' : '1. Watch Reels'}</b>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                +১০-৫০ পয়েন্ট
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">প্রতিটি ভিডিও দেখুন এবং ইনস্ট্যান্ট পয়েন্ট যোগ করুন</p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="rounded-2xl bg-[#141e18] border border-emerald-950/80 p-3.5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
            <RotateCw className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <b className="text-sm text-white">{lang === 'bn' ? '২. লাকি স্পিন হুইল' : '2. Lucky Spin Wheel'}</b>
              <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                ১০০ পয়েন্ট পর্যন্ত
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">প্রতিদিন চাকা ঘুরিয়ে নিশ্চিত ফ্রি প্রাইজ জিতুন</p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="rounded-2xl bg-[#141e18] border border-emerald-950/80 p-3.5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400">
            <Gift className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <b className="text-sm text-white">{lang === 'bn' ? '৩. দৈনিক স্ক্র্যাচ কার্ড' : '3. Daily Scratch Card'}</b>
              <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                সারপ্রাইজ গিফট
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">কার্ড ঘষে তাৎক্ষণিক রিওয়ার্ড সংগ্রহ করুন</p>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="rounded-2xl bg-[#141e18] border border-emerald-950/80 p-3.5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <b className="text-sm text-white">{lang === 'bn' ? '৪. বন্ধুদের রেফারেল' : '4. Invite Friends'}</b>
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                ৳৫০ বোনাস
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">বন্ধুদের লিংক শেয়ার করে আনলিমিটেড বোনাস পান</p>
          </div>
        </div>

        {/* Feature 5 */}
        <div className="rounded-2xl bg-[#141e18] border border-emerald-950/80 p-3.5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <b className="text-sm text-white">{lang === 'bn' ? '৫. সহজ ক্যাশআউট' : '5. Instant Cashout'}</b>
              <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                বিকাশ/নগদ
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">মাত্র ১০০ টাকা হলেই বিকাশ, নগদ বা রকেটে পেমেন্ট</p>
          </div>
        </div>
      </div>

      {/* Welcome Offer Banner */}
      <div className="rounded-2xl bg-[#111f17] border border-emerald-500/20 p-4 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {hasLoginOffer
              ? (lang === 'bn'
                  ? `🎁 স্পেশাল লগইন অফার: +${toBengaliNumber(offerPts, lang)} পয়েন্ট ফ্রি!`
                  : `🎁 Special Login Offer: +${offerPts} Free Points!`)
              : (lang === 'bn'
                  ? '০ পয়েন্ট থেকে শুরু করুন, আর্ন করে দ্রুত পয়েন্ট বাড়ান!'
                  : 'Start from 0 points and earn fast step by step!')}
          </span>
        </div>
        <p className="text-[11px] text-neutral-400">
          {hasLoginOffer
            ? (lang === 'bn' ? 'অ্যাকাউন্ট খুললে বা লগইন করলে সাথে সাথে অফার পয়েন্ট যোগ হবে।' : 'Offer points will be added immediately on login/signup.')
            : (lang === 'bn' ? 'দেরি না করে এখনই অ্যাকাউন্ট তৈরি করে রিলস দেখা ও পয়েন্ট আয় শুরু করুন।' : 'Create an account now and start earning points.')}
        </p>
        <button
          onClick={onRegister}
          className="w-full py-3 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-black text-xs transition active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20"
        >
          {lang === 'bn' ? 'এখনই রেজিস্ট্রেশন করুন' : 'Register Now'}
        </button>
      </div>
    </div>
  );
};
