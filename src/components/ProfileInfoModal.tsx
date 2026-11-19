import React, { useState } from 'react';
import {
  X,
  Award,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { LEVELS, getUserLevel } from '../utils/levels';
import { toBengaliNumber } from '../utils/bengali';

export type ProfileInfoModalMode = 'levels' | 'faq' | 'terms';

interface ProfileInfoModalProps {
  mode: ProfileInfoModalMode | null;
  onClose: () => void;
  reelsWatchedCount?: number;
  pointRate?: number;
  minWithdrawal?: number;
  lang: 'bn' | 'en';
}

const FAQ_ITEMS_BN = [
  {
    q: 'কীভাবে পয়েন্ট আর্ন ও টাকা উত্তোলন করবো?',
    a: 'রিলস দেখে, ডেইলি বোনাস ক্লেইম করে, স্পিন হুইল, স্ক্র্যাচ কার্ড ও টাস্ক সম্পন্ন করে পয়েন্ট অর্জন করুন। ওয়ালেট ট্যাব থেকে নির্ধারিত সর্বনিম্ন পয়েন্ট হলেই বিকাশ, নগদ বা রকেটে ক্যাশআউট করতে পারবেন।',
  },
  {
    q: 'এক দিনে কতটি রিল দেখে পয়েন্ট পাওয়া যাবে?',
    a: 'প্রতিদিন নির্দিষ্ট সংখ্যক রিল এবং পয়েন্টের দৈনিক লিমিট থাকে। লিমিট পূর্ণ হয়ে গেলেও আপনি বিনোদনের জন্য রিলস দেখা ও লাইভ উপভোগ করা চালিয়ে যেতে পারবেন।',
  },
  {
    q: 'পার্সোনাল লাইভ (অডিও আড্ডা ও ভিডিও) কীভাবে কাজ করে?',
    a: 'প্রোফাইল বা "+" বাটন থেকে "লাইভ" অপশনে গিয়ে অডিও আড্ডা অথবা সরাসরি ভিডিও লাইভ শুরু করতে পারবেন। দর্শকরা আপনাকে লাইক, কমেন্ট ও গিফট পাঠাতে পারবে।',
  },
  {
    q: 'গিফট পাঠালে কত পয়েন্ট পাওয়া যায়?',
    a: 'গিফট পাঠালে প্রাপক হোস্ট নির্ধারিত শেয়ার পান এবং সেন্ডারও তাৎক্ষণিক ক্যাশব্যাক পয়েন্ট ফিরে পান।',
  },
  {
    q: 'উত্তোলনের আবেদন কত সময়ে পরিশোধ করা হয়?',
    a: 'উইথড্রয়াল রিকোয়েস্ট দেওয়ার পর যাচাই সাপেক্ষে সাধারণত দ্রুত সময়ের মধ্যেই আপনার বিকাশ/নগদ/রকেট নম্বরে টাকা পাঠিয়ে দেওয়া হয় এবং নোটিফিকেশন পান।',
  },
];

const FAQ_ITEMS_EN = [
  {
    q: 'How do I earn points and withdraw cash?',
    a: 'Watch reels, claim daily bonuses, spin the wheel, scratch cards, and complete social tasks to collect points. Once you reach the minimum threshold, withdraw via bKash, Nagad, or Rocket from the Wallet tab.',
  },
  {
    q: 'Is there a daily reel earning limit?',
    a: 'Yes, daily reel reward claims and points follow daily limits. Once reached, you can still freely watch reels and join live sessions.',
  },
  {
    q: 'How does Personal Live (Audio Adda & Video) work?',
    a: 'Launch an Audio Adda room or Video Live directly from your Profile or the + Create menu. Viewers can chat, send likes, join speaker seats, and send gifts.',
  },
  {
    q: 'How long do withdrawals take?',
    a: 'Withdrawal requests are verified and processed promptly to your selected mobile financial account, with an in-app notification once completed.',
  },
];

export const ProfileInfoModal: React.FC<ProfileInfoModalProps> = ({
  mode,
  onClose,
  reelsWatchedCount = 0,
  pointRate = 10,
  minWithdrawal = 100,
  lang,
}) => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  if (!mode) return null;

  const currentLevel = getUserLevel(reelsWatchedCount);
  const faqList = lang === 'bn' ? FAQ_ITEMS_BN : FAQ_ITEMS_EN;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0f1913] border-t sm:border border-emerald-900/70 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'levels' && <Award className="w-5 h-5 text-amber-400" />}
            {mode === 'faq' && <HelpCircle className="w-5 h-5 text-emerald-400" />}
            {mode === 'terms' && <FileText className="w-5 h-5 text-emerald-400" />}
            <h3 className="text-sm font-black text-white">
              {mode === 'levels'
                ? lang === 'bn'
                  ? 'লেভেল ও বোনাস গুণক (Levels)'
                  : 'Member Levels & Multipliers'
                : mode === 'faq'
                ? lang === 'bn'
                  ? 'সচরাচর জিজ্ঞাসা (FAQ)'
                  : 'Frequently Asked Questions'
                : lang === 'bn'
                ? 'শর্তাবলী ও গোপনীয়তা নীতিমালা'
                : 'Terms & Privacy Policy'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {mode === 'levels' && (
            <>
              <div className="p-3 rounded-2xl bg-[#0a120e] border border-emerald-950 text-xs text-neutral-300">
                {lang === 'bn'
                  ? `আপনি বর্তমানে ${currentLevel.badge} ${currentLevel.nameBn} লেভেলে আছেন (${toBengaliNumber(reelsWatchedCount, lang)}টি রিল দেখেছেন · ${toBengaliNumber(currentLevel.multiplier, lang)}x বোনাস)।`
                  : `You are currently ${currentLevel.badge} ${currentLevel.nameEn} (${reelsWatchedCount} reels watched · ${currentLevel.multiplier}x bonus).`}
              </div>

              <div className="space-y-2">
                {LEVELS.map((lvl) => {
                  const unlocked = reelsWatchedCount >= lvl.minWatched;
                  const isCurrent = currentLevel.level === lvl.level;
                  return (
                    <div
                      key={lvl.level}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-950/60 border-emerald-500/60'
                          : unlocked
                          ? 'bg-[#0b140f] border-emerald-900/50'
                          : 'bg-[#090f0c] border-neutral-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lvl.badge}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-white">
                              {lang === 'bn' ? lvl.nameBn : lvl.nameEn}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-400">
                                ({lang === 'bn' ? 'বর্তমান' : 'Current'})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            {lang === 'bn'
                              ? `ন্যূনতম ${toBengaliNumber(lvl.minWatched, lang)}টি রিল দেখা`
                              : `Min ${lvl.minWatched} reels watched`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-300 block">
                          {toBengaliNumber(lvl.multiplier, lang)}x {lang === 'bn' ? 'বোনাস' : 'Boost'}
                        </span>
                        {unlocked && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto mt-0.5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {mode === 'faq' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-900/50 text-[11px] text-emerald-300 flex items-center justify-between">
                <span>
                  {lang === 'bn'
                    ? `বর্তমান রেট: ${toBengaliNumber(pointRate, lang)} পয়েন্ট = ৳১`
                    : `Rate: ${pointRate} pts = ৳1`}
                </span>
                <span>
                  {lang === 'bn'
                    ? `ন্যূনতম উত্তোলন: ৳${toBengaliNumber(minWithdrawal, lang)}`
                    : `Min cashout: ৳${minWithdrawal}`}
                </span>
              </div>

              {faqList.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#0a120e] border border-emerald-950 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full min-h-[46px] p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white">{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-xs text-neutral-300 leading-relaxed border-t border-emerald-950/60 pt-2.5">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {mode === 'terms' && (
            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-[#0a120e] border border-emerald-950 space-y-1.5">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{lang === 'bn' ? '১. অ্যাকাউন্ট ও নিরাপত্তা' : '1. Account & Security'}</span>
                </h4>
                <p>
                  {lang === 'bn'
                    ? 'প্রতিটি ব্যবহারকারী কেবল একটি সক্রিয় অ্যাকাউন্ট ব্যবহার করবেন। ভুয়া ক্লিক, বট বা একাধিক অ্যাকাউন্ট ব্যবহার করলে পয়েন্ট বাতিল হতে পারে।'
                    : 'Each user must maintain one authentic account. Automated clicks or duplicate abuse may forfeit rewards.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0a120e] border border-emerald-950 space-y-1.5">
                <h4 className="font-bold text-emerald-400">
                  {lang === 'bn' ? '২. কনটেন্ট ও লাইভ নীতিমালা' : '2. Content & Live Policy'}
                </h4>
                <p>
                  {lang === 'bn'
                    ? 'রিলস আপলোড ও লাইভ (অডিও আড্ডা বা ভিডিও) চলাকালীন শালীনতা বজায় রাখা বাধ্যতামূলক। কমিউনিটি গাইডলাইন ভঙ্গ হলে লাইভ বাতিল বা কনটেন্ট অপসারণ করা হতে পারে।'
                    : 'Keep uploaded reels and live sessions respectful and safe. Violations may result in immediate live cancellation or content removal.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0a120e] border border-emerald-950 space-y-1.5">
                <h4 className="font-bold text-emerald-400">
                  {lang === 'bn' ? '৩. পেমেন্ট ও গোপনীয়তা' : '3. Payouts & Privacy'}
                </h4>
                <p>
                  {lang === 'bn'
                    ? 'আপনার ব্যক্তিগত প্রোফাইল ও পেমেন্ট তথ্য সুরক্ষিত রাখা হয়। সঠিক বিকাশ/নগদ/রকেট নম্বর প্রদান করা ব্যবহারকারীর দায়িত্ব।'
                    : 'Your profile and payout information are securely handled. Ensure your mobile wallet number is accurate before requesting withdrawals.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
