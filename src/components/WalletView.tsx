import React, { useState } from 'react';
import { Wallet, ShieldCheck, Clock, CheckCircle2, XCircle, ArrowUpRight, AlertCircle, Coins } from 'lucide-react';
import { User, WithdrawalRequest } from '../types';
import { toBengaliNumber, formatTaka } from '../utils/bengali';
import { playSuccessChime } from '../utils/audio';
import { BalanceCard } from './BalanceCard';
import { getUserLevel } from '../utils/levels';

interface WalletViewProps {
  user: User;
  pointRate: number;
  withdrawals: WithdrawalRequest[];
  onRequestWithdrawal: (req: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'status'>) => void;
  onDepositClick: () => void;
  isMuted: boolean;
  minWithdrawal?: number;
}

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  pointRate,
  withdrawals,
  onRequestWithdrawal,
  onDepositClick,
  isMuted,
  minWithdrawal = 100,
}) => {
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [accountType, setAccountType] = useState<'Personal' | 'Agent'>('Personal');
  const [accountNumber, setAccountNumber] = useState(user.phone || '');
  const [amountBDT, setAmountBDT] = useState<number>(minWithdrawal);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const availableBDT = Math.floor(user.points / (pointRate || 10));
  const pointsRequired = amountBDT * (pointRate || 10);

  const handleQuickAmount = (amt: number) => {
    setAmountBDT(amt);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!accountNumber || accountNumber.trim().length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল ব্যাংকিং নম্বর দিন (যেমন: 01XXXXXXXXX)');
      return;
    }

    if (amountBDT < minWithdrawal) {
      setErrorMsg(`সর্বনিম্ন উত্তোলন পরিমাণ ৳${toBengaliNumber(minWithdrawal)} টাকা`);
      return;
    }

    if (amountBDT > availableBDT) {
      setErrorMsg(`আপনার ব্যালেন্সে পর্যাপ্ত পয়েন্ট নেই! আপনার আছে ৳${toBengaliNumber(availableBDT)}`);
      return;
    }

    if (!isMuted) playSuccessChime();

    onRequestWithdrawal({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      accountNumber: accountNumber.trim(),
      accountType,
      method,
      pointsDeducted: pointsRequired,
      amountBDT,
    });

    setSuccessMsg(`🎉 ৳${toBengaliNumber(amountBDT)} উত্তোলনের আবেদন সফলভাবে গৃহীত হয়েছে! এডমিন যাচাই করে দ্রুত পেমেন্ট পাঠাবে।`);
  };

  const userWithdrawals = withdrawals.filter((w) => w.userId === user.id || w.userPhone === user.phone);

  const currentLevel = getUserLevel(user.reelsWatchedCount);

  return (
    <div className="space-y-4 pb-20">
      {/* Wallet Balance Summary Card */}
      <BalanceCard
        points={user.points}
        pointRate={pointRate}
        onWithdrawClick={() => {}} // Already in withdrawal form below
        onDepositClick={onDepositClick}
        lang="bn"
        multiplier={currentLevel.multiplier}
      />

      <div className="rounded-2xl bg-gradient-to-br from-[#122419] to-[#0c1811] p-4 border border-emerald-900/60 shadow-xl">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-neutral-400">মোট উত্তোলন:</span>
            <p className="font-bold text-white mt-0.5">{formatTaka(user.totalWithdrawn)}</p>
          </div>
          <div>
            <span className="text-neutral-400">উত্তোলনযোগ্য ব্যালেন্স:</span>
            <p className="font-bold text-emerald-400 mt-0.5">{formatTaka(availableBDT)}</p>
          </div>
        </div>
      </div>

      {/* Cashout / Withdrawal Form Card */}
      <div className="rounded-2xl bg-[#141f19] border border-emerald-950/80 p-4 shadow-lg text-white">
        <h3 className="text-base font-bold flex items-center gap-2 mb-3">
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          <span>টাকা উত্তোলন (Withdraw)</span>
        </h3>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Method Selection */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              পেমেন্ট মাধ্যম নির্বাচন করুন:
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
                      : 'bg-[#1b2b23] text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Type */}
          <div className="flex gap-4 items-center text-xs">
            <span className="text-neutral-400">হিসাবের ধরন:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="accType"
                checked={accountType === 'Personal'}
                onChange={() => setAccountType('Personal')}
                className="accent-emerald-500"
              />
              <span>পার্সোনাল (Personal)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="accType"
                checked={accountType === 'Agent'}
                onChange={() => setAccountType('Agent')}
                className="accent-emerald-500"
              />
              <span>এজেন্ট (Agent)</span>
            </label>
          </div>

          {/* Account Number Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {method} নম্বর (১১ ডিজিট):
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-neutral-300">
                টাকার পরিমাণ (সর্বনিম্ন ১০০ টাকা):
              </label>
              <span className="text-[11px] text-emerald-400">
                পয়েন্ট খরচ: {toBengaliNumber(pointsRequired)}
              </span>
            </div>
            <input
              type="number"
              min="100"
              step="10"
              value={amountBDT}
              onChange={(e) => setAmountBDT(Number(e.target.value))}
              placeholder="১০০"
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-bold"
              required
            />

            {/* Quick chips */}
            <div className="flex gap-2 mt-2">
              {[100, 200, 500, 1000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold border transition ${
                    amountBDT === amt
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-[#1b2b23] text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  ৳{toBengaliNumber(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Withdrawal (Left) & Deposit (Right) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="submit"
              disabled={amountBDT > availableBDT || amountBDT < 100}
              className={`py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                amountBDT > availableBDT || amountBDT < 100
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#00c853] hover:bg-[#00e676] active:scale-98 text-black shadow-emerald-500/25'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" />
              <span>উত্তোলন রিকোয়েস্ট</span>
            </button>

            <button
              type="button"
              onClick={onDepositClick}
              className="py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black active:scale-98"
            >
              <Coins className="w-4 h-4 shrink-0" />
              <span>ডিপোজিট করুন</span>
            </button>
          </div>
        </form>

        <div className="mt-3 p-2.5 rounded-xl bg-black/30 border border-emerald-950/60 text-[11px] text-neutral-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>পেমেন্ট রিকোয়েস্ট পাঠানোর ২ থেকে ২৪ ঘণ্টার মধ্যে সরাসরি ট্রান্সফার করা হয়।</span>
        </div>
      </div>

      {/* Withdrawal History Card */}
      <div className="rounded-2xl bg-[#141f19] border border-emerald-950/80 p-4 shadow-lg text-white">
        <h3 className="text-base font-bold flex items-center justify-between mb-3">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>উত্তোলন হিস্ট্রি ({toBengaliNumber(userWithdrawals.length)})</span>
          </span>
        </h3>

        {userWithdrawals.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs">
            এখনো কোনো উত্তোলনের আবেদন করা হয়নি।
          </div>
        ) : (
          <div className="space-y-2.5">
            {userWithdrawals.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-xl bg-[#0e1712] border border-emerald-950/80 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{w.method}</span>
                    <span className="text-[11px] text-neutral-400">({w.accountNumber})</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {w.createdAt}
                    {w.transactionId && (
                      <span className="ml-1 text-emerald-400 font-mono">Trx: {w.transactionId}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-sm text-white block">
                    {formatTaka(w.amountBDT)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                      w.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : w.status === 'rejected'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {w.status === 'approved' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>অনুমোদিত</span>
                      </>
                    ) : w.status === 'rejected' ? (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>বাতিল</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>পেন্ডিং</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
