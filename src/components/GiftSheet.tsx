import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { GiftItem, EarningSettings } from '../types';
import { GIFTS_LIST } from '../data/initialData';
import { toBengaliNumber } from '../utils/bengali';
import { calculateGiftSplit } from '../utils/gifts';
import { playSuccessChime } from '../utils/audio';
import confetti from 'canvas-confetti';

interface GiftSheetProps {
  userPoints: number;
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (gift: GiftItem, creatorShare: number, userCashback: number, adminShare?: number) => void;
  onOpenDeposit: () => void;
  lang: 'bn' | 'en';
  isMuted: boolean;
  recipientName?: string;
  earningSettings?: EarningSettings;
}

export const GiftSheet: React.FC<GiftSheetProps> = ({
  userPoints,
  isOpen,
  onClose,
  onSendGift,
  onOpenDeposit,
  lang,
  isMuted,
  recipientName,
  earningSettings,
}) => {
  const [giftMsg, setGiftMsg] = useState('');
  const [giftError, setGiftError] = useState('');

  if (!isOpen) return null;

  const sampleSplit = calculateGiftSplit(100, earningSettings);

  const handleSend = (gift: GiftItem) => {
    setGiftError('');
    if (userPoints < gift.costPoints) {
      setGiftError(
        lang === 'bn'
          ? 'পয়েন্ট পর্যাপ্ত নয়! আগে পয়েন্ট জমা করুন।'
          : 'Insufficient points! Please deposit points first.'
      );
      return;
    }

    const { hostPct, adminPct, cashbackPct, creatorShare, adminShare, userCashback } =
      calculateGiftSplit(gift.costPoints, earningSettings);

    if (!isMuted) playSuccessChime();

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ff2d55', '#ffcc00', '#00e676', '#ffffff'],
      });
    } catch {
      // Ignore
    }

    onSendGift(gift, creatorShare, userCashback, adminShare);

    const msg =
      lang === 'bn'
        ? `🎉 আপনি পাঠালেন ${gift.icon} ${gift.nameBn}! ${recipientName || 'হোস্ট'} পেলেন ${toBengaliNumber(creatorShare)} পয়েন্ট (${toBengaliNumber(hostPct)}%), এডমিন ফি ${toBengaliNumber(adminShare)} পয়েন্ট (${toBengaliNumber(adminPct)}%), আপনার ক্যাশব্যাক ${toBengaliNumber(userCashback)} পয়েন্ট (${toBengaliNumber(cashbackPct)}%)`
        : `🎉 Sent ${gift.icon} ${gift.nameEn}! ${recipientName || 'Host'} got ${creatorShare} pts (${hostPct}%), Admin fee ${adminShare} pts (${adminPct}%), Your cashback ${userCashback} pts (${cashbackPct}%)`;

    setGiftMsg(msg);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-end p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#16231c] border-t sm:border border-emerald-900/80 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl animate-in slide-in-from-bottom-5 max-h-[85vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">🎁</span>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">
                {recipientName
                  ? lang === 'bn'
                    ? `${recipientName}-কে গিফট পাঠান`
                    : `Send Gift to ${recipientName}`
                  : lang === 'bn'
                  ? 'গিফট পাঠান / Send Gift'
                  : 'Send Gift'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {lang === 'bn'
                  ? `হোস্ট ${toBengaliNumber(sampleSplit.hostPct)}% · এডমিন ${toBengaliNumber(sampleSplit.adminPct)}% · ক্যাশব্যাক ${toBengaliNumber(sampleSplit.cashbackPct)}%`
                  : `Host ${sampleSplit.hostPct}% · Admin ${sampleSplit.adminPct}% · Cashback ${sampleSplit.cashbackPct}%`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {giftError && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2">
            <span>{giftError}</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-[#ff2d55] text-white font-bold cursor-pointer"
            >
              {lang === 'bn' ? 'পয়েন্ট জমা' : 'Deposit'}
            </button>
          </div>
        )}

        {/* User points balance bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0e1712] border border-emerald-950 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-amber-400">💎</span>
            <span className="text-neutral-300">
              {lang === 'bn' ? 'আপনার পয়েন্ট:' : 'Your Points:'}
            </span>
            <span className="text-emerald-400 font-extrabold text-sm ml-1">
              {toBengaliNumber(userPoints, lang)}
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenDeposit();
            }}
            className="px-2.5 py-1 rounded-lg bg-[#ff2d55] hover:bg-[#e0264b] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? '+ পয়েন্ট জমা করুন' : '+ Deposit Points'}</span>
          </button>
        </div>

        {/* Gift Grid */}
        <div className="grid grid-cols-5 gap-2 mb-4 text-center">
          {GIFTS_LIST.map((gift) => (
            <button
              key={gift.id}
              onClick={() => handleSend(gift)}
              className="p-2.5 rounded-2xl bg-[#1d2d24] hover:bg-[#25392e] border border-emerald-900/60 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer group shadow-md"
            >
              <span className="text-2xl group-hover:scale-125 transition-transform duration-200">
                {gift.icon}
              </span>
              <span className="text-[11px] font-bold text-white truncate w-full">
                {lang === 'bn' ? gift.nameBn : gift.nameEn}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {toBengaliNumber(gift.costPoints, lang)} {lang === 'bn' ? 'পয়েন্ট' : 'pts'}
              </span>
            </button>
          ))}
        </div>

        {/* Feedback message */}
        {giftMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold leading-relaxed mb-3 animate-in fade-in">
            {giftMsg}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition cursor-pointer"
        >
          {lang === 'bn' ? 'বন্ধ করুন / Close' : 'Close / বন্ধ করুন'}
        </button>
      </div>
    </div>
  );
};
