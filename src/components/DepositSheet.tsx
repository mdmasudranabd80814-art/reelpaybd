import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Sparkles, ShieldCheck, Copy, Check } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';
import { playSuccessChime } from '../utils/audio';
import { DepositRequest } from '../types';
import confetti from 'canvas-confetti';

interface DepositSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (req: Omit<DepositRequest, 'id' | 'createdAt' | 'status' | 'userId' | 'userName' | 'userPhone'>) => void;
  pointRate: number;
  lang: 'bn' | 'en';
  isMuted: boolean;
  adminPaymentNumbers?: { bKash: string; Nagad: string; Rocket: string };
}

export const DepositSheet: React.FC<DepositSheetProps> = ({
  isOpen,
  onClose,
  onSubmitRequest,
  pointRate,
  lang,
  isMuted,
  adminPaymentNumbers,
}) => {
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [amountBDT, setAmountBDT] = useState<number>(100);
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pointsToAdd = (amountBDT || 0) * (pointRate || 10);

  // Dynamic Admin Payment Numbers from settings
  const adminNumbers = adminPaymentNumbers || {
    bKash: '01700000000',
    Nagad: '01800000000',
    Rocket: '01900000000',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(adminNumbers[method]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountBDT || amountBDT <= 0 || !senderNumber || !trxId) {
      alert(lang === 'bn' ? 'সবগুলো তথ্য সঠিকভাবে পূরণ করুন' : 'Please fill all fields correctly');
      return;
    }

    onSubmitRequest({
      method,
      amountBDT,
      pointsToAdd,
      senderNumber,
      transactionId: trxId,
    });

    const msg =
      lang === 'bn'
        ? `✅ ডিপোজিট রিকোয়েস্ট জমা হয়েছে। এডমিন যাচাই করে পয়েন্ট যোগ করে দেবে।`
        : `✅ Deposit request submitted. Points will be added after verification.`;

    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-end p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#16231c] border-t sm:border border-emerald-900/80 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl animate-in slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">💎</span>
            <h3 className="font-bold text-base">
              {lang === 'bn' ? 'পয়েন্ট কিনুন / Buy Points' : 'Buy Points / পয়েন্ট কিনুন'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleDepositSubmit} className="space-y-4">
          {/* Method Selection */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-2">
              {lang === 'bn' ? '১. পেমেন্ট মাধ্যম সিলেক্ট করুন:' : '1. Select Payment Method:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bKash', name: 'বিকাশ', color: 'from-[#e2136e] to-[#c20d5c]' },
                { id: 'Nagad', name: 'নগদ', color: 'from-[#f7941d] to-[#d4780f]' },
                { id: 'Rocket', name: 'রকেট', color: 'from-[#8c2d8c] to-[#6d1f6d]' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id as 'bKash' | 'Nagad' | 'Rocket')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                    method === m.id
                      ? `bg-gradient-to-r ${m.color} text-white border-white/40 shadow-md`
                      : 'bg-[#1e2e25] text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Number Info */}
          <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/30 space-y-2">
            <p className="text-[11px] text-neutral-400">
              {lang === 'bn' ? `নিচের নাম্বারে "Send Money" করুন:` : `Send Money to this number:`}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-emerald-400 tracking-wider">
                {adminNumbers[method]}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 active:scale-95 transition"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] text-amber-400/80 font-medium">
              <ShieldCheck className="w-3 h-3" />
              <span>{lang === 'bn' ? 'সেন্ড মানি করার পর নিচের তথ্য দিন' : 'Provide details after sending money'}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                {lang === 'bn' ? 'টাকার পরিমাণ:' : 'Amount (BDT):'}
              </label>
              <input
                type="number"
                min="10"
                value={amountBDT}
                onChange={(e) => setAmountBDT(Number(e.target.value))}
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                {lang === 'bn' ? 'পয়েন্ট পাবেন:' : 'You get points:'}
              </label>
              <div className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2 text-sm text-emerald-400 font-black">
                {toBengaliNumber(pointsToAdd, lang)}
              </div>
            </div>
          </div>

          {/* Sender & TrxID */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                {lang === 'bn' ? 'আপনার নাম্বার (যেখান থেকে টাকা পাঠিয়েছেন):' : 'Your Number (Sender):'}
              </label>
              <input
                type="tel"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                {lang === 'bn' ? 'ট্রানজেকশন আইডি (TrxID):' : 'Transaction ID (TrxID):'}
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="TRX12345678"
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] active:scale-98 text-black font-black text-sm transition shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ডিপোজিট রিকোয়েস্ট পাঠান' : 'Submit Deposit Request'}</span>
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-3 w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition cursor-pointer"
        >
          {lang === 'bn' ? 'বন্ধ / Close' : 'Close / বন্ধ'}
        </button>
      </div>
    </div>
  );
};
