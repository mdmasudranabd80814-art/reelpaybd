import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'withdrawal' | 'verification' | 'earning' | 'general';
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn: string;
  icon: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq_1',
    category: 'withdrawal',
    questionBn: 'টাকা উত্তোলনের নিয়ম ও সর্বনিম্ন কত পয়েন্ট লাগবে?',
    questionEn: 'What are the withdrawal rules and minimum points required?',
    answerBn: 'আপনার ওয়ালেটে সর্বনিম্ন ১০০ টাকা সমপরিমাণ পয়েন্ট (যেমন: ১০০০ পয়েন্ট) জমা হলে বিকাশ, নগদ বা রকেটের মাধ্যমে উইথড্র রিকোয়েস্ট পাঠাতে পারবেন। সাধারণত ২৪ ঘণ্টার মধ্যে পেমেন্ট সফলভাবে পাঠানো হয়।',
    answerEn: 'Once you accumulate points equivalent to minimum 100 BDT (e.g., 1000 points), you can request a withdrawal via bKash, Nagad, or Rocket. Payouts are typically processed within 24 hours.',
    icon: '💳',
  },
  {
    id: 'faq_2',
    category: 'withdrawal',
    questionBn: 'উইথড্র করার পর টাকা পেতে কত সময় লাগে?',
    questionEn: 'How long does it take to receive payment after withdrawal?',
    answerBn: 'সাধারণত পেমেন্ট রিকোয়েস্ট করার ২৪ ঘণ্টার মধ্যে আমাদের ফাইন্যান্স টিম ম্যানুয়ালি বা অটোমেটিক গেটওয়ের মাধ্যমে আপনার বিকাশ, নগদ বা রকেট অ্যাকাউন্টে টাকা পাঠিয়ে দেয়।',
    answerEn: 'Normally, within 24 hours of submitting your withdrawal request, our finance team transfers the funds directly to your mobile banking account.',
    icon: '⏱️',
  },
  {
    id: 'faq_3',
    category: 'verification',
    questionBn: 'অ্যাকাউন্ট ভেরিফিকেশন (Verified Badge) কীভাবে পাব?',
    questionEn: 'How can I get my account verified with a badge?',
    answerBn: 'অ্যাকাউন্ট ভেরিফিকেশন পেতে আপনার প্রোফাইলে সঠিক নাম, সচল মোবাইল নম্বর এবং প্রোফাইল ছবি যুক্ত করুন। নিয়মিত রিলস আপলোড করলে এবং কমিউনিটি গাইডলাইন মেনে চললে এডমিন প্যানেল থেকে আপনার অ্যাকাউন্ট ভেরিফাই করা হবে।',
    answerEn: 'To get verified, ensure your profile has your real name, active phone number, and avatar. Consistently uploading reels and following community guidelines will make your account eligible for admin verification.',
    icon: '🛡️',
  },
  {
    id: 'faq_4',
    category: 'earning',
    questionBn: 'রিলস দেখে বা আপলোড করে কীভাবে পয়েন্ট আয় করব?',
    questionEn: 'How do I earn points by watching or uploading reels?',
    answerBn: 'হোম ফিড থেকে যেকোনো রিল সম্পূর্ণ সময় (যেমন: ৩০ সেকেন্ড) দেখলে ওয়ালেটে ইনস্ট্যান্ট পয়েন্ট জমা হয়। এছাড়া নিজে ক্রিয়েটর হিসেবে মানসম্মত রিল আপলোড করেও প্রতিদিন পয়েন্ট ও বোনাস অর্জন করতে পারেন।',
    answerEn: 'Watch reels completely from the home feed to instantly earn points. You can also upload quality original reels as a creator to earn daily points and rewards.',
    icon: '✨',
  },
  {
    id: 'faq_5',
    category: 'earning',
    questionBn: 'বন্ধুদের ইনভাইট (Referral) করে কি আয় করা যায়?',
    questionEn: 'Can I earn by inviting friends (Referral)?',
    answerBn: 'হ্যাঁ! আপনার রেফারেল কোড ব্যবহার করে কোনো বন্ধু সাইন-আপ করলে আপনি আকর্ষণীয় ক্যাশ বোনাস এবং রেফারেল পয়েন্ট পাবেন যা পরবর্তীতে টাকায় রূপান্তর করা যায়।',
    answerEn: 'Yes! When friends sign up using your referral code, you receive referral bonus points which can be converted and withdrawn.',
    icon: '🎁',
  },
  {
    id: 'faq_6',
    category: 'general',
    questionBn: 'এক ডিভাইসে কি একাধিক অ্যাকাউন্ট চালানো যাবে?',
    questionEn: 'Can I use multiple accounts on a single device?',
    answerBn: 'নিরাপত্তা ও ফেয়ার ইউজ পলিসির স্বার্থে একটি ডিভাইসে একাধিক ফেক অ্যাকাউন্ট বা সেলফ-রেফার করা নিষেধ। একাধিক অ্যাকাউন্ট পেলে সিস্টেম থেকে অ্যাকাউন্ট ব্যান হতে পারে।',
    answerEn: 'For security and fair usage policies, operating multiple fake accounts or self-referrals on a single device is prohibited and may result in account suspension.',
    icon: '🔒',
  },
];

interface FAQComponentProps {
  lang: 'bn' | 'en';
}

export const FAQComponent: React.FC<FAQComponentProps> = ({ lang }) => {
  const [openId, setOpenId] = useState<string | null>('faq_1');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredFaqs = activeCategory === 'all'
    ? FAQ_LIST
    : FAQ_LIST.filter(f => f.category === activeCategory);

  return (
    <div className="w-full bg-[#111c15] border border-emerald-900/50 rounded-3xl p-4 sm:p-5 text-white space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              {lang === 'bn' ? 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)' : 'Frequently Asked Questions'}
            </h3>
            <p className="text-[10px] text-neutral-400 font-medium">
              {lang === 'bn' ? 'উইথড্র, ভেরিফিকেশন ও আয়ের নিয়মাবলী সম্পর্কে জানুন' : 'Learn about withdrawals, verification & earnings'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', labelBn: 'সকল', labelEn: 'All' },
          { id: 'withdrawal', labelBn: 'উইথড্র', labelEn: 'Withdrawal' },
          { id: 'verification', labelBn: 'ভেরিফিকেশন', labelEn: 'Verification' },
          { id: 'earning', labelBn: 'আয় ও রিলস', labelEn: 'Earning' },
          { id: 'general', labelBn: 'সাধারণ নিয়ম', labelEn: 'General' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
              activeCategory === cat.id
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25'
                : 'bg-[#182a20] hover:bg-[#1f382a] text-neutral-300 border border-emerald-900/60'
            }`}
          >
            {lang === 'bn' ? cat.labelBn : cat.labelEn}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-2.5 pt-1">
        {filteredFaqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-[#16271e] border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#131f18] hover:bg-[#16251c] border-emerald-950/80'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">{faq.icon}</span>
                  <span className="text-xs sm:text-sm font-extrabold text-neutral-100 tracking-wide">
                    {lang === 'bn' ? faq.questionBn : faq.questionEn}
                  </span>
                </div>
                <div className={`w-6 h-6 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-emerald-500/20' : ''}`}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-emerald-950/80 text-xs text-neutral-300 leading-relaxed font-normal animate-in fade-in duration-200">
                  <p>{lang === 'bn' ? faq.answerBn : faq.answerEn}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
