import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  AlertCircle,
  Coins,
  CreditCard,
  Landmark,
  Smartphone,
  Ban,
} from 'lucide-react';
import {
  User,
  WithdrawalRequest,
  PaymentMethodConfig,
  PaymentMethodCategory,
  DEFAULT_PAYMENT_METHODS,
} from '../types';
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
  maxWithdrawal?: number;
  isWithdrawalsEnabled?: boolean;
  isDepositsEnabled?: boolean;
  paymentMethods?: PaymentMethodConfig[];
}

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  pointRate,
  withdrawals,
  onRequestWithdrawal,
  onDepositClick,
  isMuted,
  minWithdrawal = 100,
  maxWithdrawal = 0,
  isWithdrawalsEnabled = true,
  isDepositsEnabled = true,
  paymentMethods,
}) => {
  const activeWithdrawMethods = useMemo(() => {
    const base = paymentMethods && paymentMethods.length > 0 ? paymentMethods : DEFAULT_PAYMENT_METHODS;
    return base.filter((m) => m.isEnabled && m.supportsWithdrawal);
  }, [paymentMethods]);

  const [categoryFilter, setCategoryFilter] = useState<'all' | PaymentMethodCategory>('all');
  const filteredMethods = useMemo(() => {
    if (categoryFilter === 'all') return activeWithdrawMethods;
    return activeWithdrawMethods.filter((m) => m.category === categoryFilter);
  }, [activeWithdrawMethods, categoryFilter]);

  const [selectedMethodId, setSelectedMethodId] = useState<string>(() => {
    const preferred =
      activeWithdrawMethods.find((m) => m.name === user.paymentMethod) || activeWithdrawMethods[0];
    return preferred?.id || 'pm_bkash';
  });

  useEffect(() => {
    if (filteredMethods.length > 0 && !filteredMethods.some((m) => m.id === selectedMethodId)) {
      setSelectedMethodId(filteredMethods[0].id);
    }
  }, [filteredMethods, selectedMethodId]);

  const selectedMethod: PaymentMethodConfig | undefined =
    activeWithdrawMethods.find((m) => m.id === selectedMethodId) || activeWithdrawMethods[0];

  const [accountType, setAccountType] = useState<string>('Personal');
  const [accountNumber, setAccountNumber] = useState(user.paymentAccountNumber || user.phone || '');
  const [accountHolderName, setAccountHolderName] = useState(user.paymentAccountHolder || user.name || '');
  const [bankName, setBankName] = useState(user.paymentBankName || '');
  const [branchName, setBranchName] = useState(user.paymentBranchName || '');
  const [routingNumber, setRoutingNumber] = useState('');
  const [amountBDT, setAmountBDT] = useState<number>(minWithdrawal);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setAmountBDT((prev) => (prev < minWithdrawal ? minWithdrawal : prev));
  }, [minWithdrawal]);

  useEffect(() => {
    if (selectedMethod?.category === 'bank') {
      setAccountType(selectedMethod.accountTypeLabel || 'Savings');
      if (selectedMethod.bankName && !bankName) setBankName(selectedMethod.bankName);
    } else if (selectedMethod?.category === 'card') {
      setAccountType(selectedMethod.accountTypeLabel || 'Visa / Card');
    } else {
      setAccountType('Personal');
    }
  }, [selectedMethod?.id]);

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

    if (!isWithdrawalsEnabled) {
      setErrorMsg('উইথড্রয়াল সিস্টেম সাময়িকভাবে বন্ধ রয়েছে।');
      return;
    }

    if (!selectedMethod) {
      setErrorMsg('অনুগ্রহ করে একটি পেমেন্ট মাধ্যম নির্বাচন করুন।');
      return;
    }

    const cleanAcc = accountNumber.trim();
    if (selectedMethod.category === 'mobile_banking') {
      if (!cleanAcc || cleanAcc.length < 11) {
        setErrorMsg(`সঠিক ১১ ডিজিটের ${selectedMethod.nameBn} নম্বর দিন (যেমন: 01XXXXXXXXX)`);
        return;
      }
    } else if (selectedMethod.category === 'bank') {
      if (!cleanAcc || cleanAcc.length < 6 || !accountHolderName.trim()) {
        setErrorMsg('ব্যাংক অ্যাকাউন্ট নম্বর এবং অ্যাকাউন্ট হোল্ডারের নাম সঠিকভাবে দিন।');
        return;
      }
    } else if (selectedMethod.category === 'card') {
      if (!cleanAcc || cleanAcc.length < 8 || !accountHolderName.trim()) {
        setErrorMsg('সঠিক কার্ড নম্বর এবং কার্ড হোল্ডারের নাম দিন।');
        return;
      }
    } else if (!cleanAcc || cleanAcc.length < 4) {
      setErrorMsg('সঠিক অ্যাকাউন্ট বা পেমেন্ট তথ্য দিন।');
      return;
    }

    if (amountBDT < minWithdrawal) {
      setErrorMsg(`সর্বনিম্ন উত্তোলন পরিমাণ ৳${toBengaliNumber(minWithdrawal)} টাকা`);
      return;
    }

    if (maxWithdrawal > 0 && amountBDT > maxWithdrawal) {
      setErrorMsg(`সর্বোচ্চ উত্তোলন সীমা ৳${toBengaliNumber(maxWithdrawal)} টাকা`);
      return;
    }

    if (amountBDT > availableBDT) {
      setErrorMsg(`আপনার ব্যালেন্সে পর্যাপ্ত পয়েন্ট নেই! আপনার আছে ৳${toBengaliNumber(availableBDT)}`);
      return;
    }

    if (!isMuted) playSuccessChime();

    const detailsParts = [
      accountHolderName.trim() ? `Holder: ${accountHolderName.trim()}` : '',
      selectedMethod.category === 'bank' && (bankName.trim() || selectedMethod.bankName)
        ? `Bank: ${bankName.trim() || selectedMethod.bankName}`
        : '',
      selectedMethod.category === 'bank' && branchName.trim() ? `Branch: ${branchName.trim()}` : '',
      selectedMethod.category === 'bank' && routingNumber.trim() ? `Routing: ${routingNumber.trim()}` : '',
    ].filter(Boolean);

    onRequestWithdrawal({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      accountNumber: cleanAcc,
      accountType,
      method: selectedMethod.name,
      methodCategory: selectedMethod.category,
      accountHolderName: accountHolderName.trim() || undefined,
      bankName: (bankName.trim() || selectedMethod.bankName || '').trim() || undefined,
      branchName: branchName.trim() || undefined,
      routingNumber: routingNumber.trim() || undefined,
      accountDetails: detailsParts.length > 0 ? detailsParts.join(' | ') : undefined,
      pointsDeducted: pointsRequired,
      amountBDT,
    });

    setSuccessMsg(
      `🎉 ${selectedMethod.nameBn}-এ ৳${toBengaliNumber(amountBDT)} উত্তোলনের আবেদন সফলভাবে গৃহীত হয়েছে!`
    );
  };

  const userWithdrawals = withdrawals.filter((w) => w.userId === user.id || w.userPhone === user.phone);
  const currentLevel = getUserLevel(user.reelsWatchedCount);

  const hasCategories =
    new Set(activeWithdrawMethods.map((m) => m.category)).size > 1;

  const getCategoryIcon = (cat: PaymentMethodCategory) => {
    if (cat === 'bank') return <Landmark className="w-3.5 h-3.5 shrink-0" />;
    if (cat === 'card') return <CreditCard className="w-3.5 h-3.5 shrink-0" />;
    return <Smartphone className="w-3.5 h-3.5 shrink-0" />;
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Wallet Balance Summary Card */}
      <BalanceCard
        points={user.points}
        pointRate={pointRate}
        onWithdrawClick={() => {}}
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

        {!isWithdrawalsEnabled ? (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-2">
            <Ban className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-xs font-bold text-rose-200">
              উইথড্রয়াল সিস্টেম এডমিন কর্তৃক সাময়িকভাবে বন্ধ রাখা হয়েছে। অনুগ্রহ করে পরে চেষ্টা করুন।
            </p>
          </div>
        ) : activeWithdrawMethods.length === 0 ? (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center text-xs text-amber-200">
            বর্তমানে কোনো উইথড্রয়াল মেথড সক্রিয় নেই।
          </div>
        ) : (
          <>
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Category Filter Chips when Bank/Card/MFS are present */}
              {hasCategories && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'সকল' },
                    { id: 'mobile_banking', label: '📱 মোবাইল' },
                    { id: 'bank', label: '🏦 ব্যাংক' },
                    { id: 'card', label: '💳 কার্ড' },
                  ].map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                        categoryFilter === cat.id
                          ? 'bg-emerald-500 text-black'
                          : 'bg-[#0b140f] text-neutral-300 hover:bg-neutral-800 border border-emerald-950'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Method Selection Grid */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  পেমেন্ট মাধ্যম নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredMethods.map((m) => {
                    const isSelected = selectedMethod?.id === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setSelectedMethodId(m.id)}
                        style={
                          isSelected
                            ? {
                                backgroundColor: m.colorHex || '#00c853',
                                borderColor: 'rgba(255,255,255,0.45)',
                              }
                            : undefined
                        }
                        className={`py-2.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'text-white shadow-md'
                            : 'bg-[#1b2b23] text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {getCategoryIcon(m.category)}
                        <span className="truncate">{m.nameBn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Adaptive Account Details Inputs */}
              {selectedMethod?.category === 'mobile_banking' && (
                <>
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

                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      {selectedMethod.nameBn} নম্বর (১১ ডিজিট):
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                      required
                    />
                  </div>
                </>
              )}

              {selectedMethod?.category === 'bank' && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-[#0e1712] border border-emerald-950">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                        অ্যাকাউন্ট হোল্ডারের নাম *:
                      </label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="Full Name as on Bank"
                        className="w-full bg-[#09100c] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                        ব্যাংকের নাম *:
                      </label>
                      <input
                        type="text"
                        value={bankName || selectedMethod.bankName || selectedMethod.name}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="যেমন: Islami Bank PLC"
                        className="w-full bg-[#09100c] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                        অ্যাকাউন্ট নম্বর *:
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Bank A/C Number"
                        className="w-full bg-[#09100c] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                        ব্রাঞ্চ ও রাউটিং (ঐচ্ছিক):
                      </label>
                      <input
                        type="text"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="Branch Name / Routing"
                        className="w-full bg-[#09100c] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      রাউটিং নম্বর (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      placeholder="Routing Number (if any)"
                      className="w-full bg-[#09100c] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {selectedMethod?.category === 'card' && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-[#0e1712] border border-emerald-950">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      কার্ড হোল্ডারের নাম *:
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Name on Card"
                      className="w-full bg-[#09100c] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      {selectedMethod.nameBn} নম্বর *:
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="w-full bg-[#09100c] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              {selectedMethod?.category === 'other' && (
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {selectedMethod.nameBn} অ্যাকাউন্ট / আইডি:
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="আপনার পেমেন্ট অ্যাকাউন্ট তথ্য দিন"
                    className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>
              )}

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    টাকার পরিমাণ (সর্বনিম্ন ৳{toBengaliNumber(minWithdrawal)}
                    {maxWithdrawal > 0 ? ` — সর্বোচ্চ ৳${toBengaliNumber(maxWithdrawal)}` : ''}):
                  </label>
                  <span className="text-[11px] text-emerald-400">
                    পয়েন্ট খরচ: {toBengaliNumber(pointsRequired)}
                  </span>
                </div>
                <input
                  type="number"
                  min={minWithdrawal}
                  max={maxWithdrawal > 0 ? maxWithdrawal : undefined}
                  step="10"
                  value={amountBDT}
                  onChange={(e) => setAmountBDT(Number(e.target.value))}
                  placeholder={String(minWithdrawal)}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-bold"
                  required
                />

                {/* Quick chips */}
                <div className="flex gap-2 mt-2">
                  {[minWithdrawal, 200, 500, 1000]
                    .filter((v, idx, arr) => arr.indexOf(v) === idx)
                    .map((amt) => (
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
                  disabled={amountBDT > availableBDT || amountBDT < minWithdrawal}
                  className={`py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                    amountBDT > availableBDT || amountBDT < minWithdrawal
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
                  disabled={!isDepositsEnabled}
                  className={`py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                    isDepositsEnabled
                      ? 'bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black active:scale-98'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4 shrink-0" />
                  <span>{isDepositsEnabled ? 'ডিপোজিট করুন' : 'ডিপোজিট বন্ধ'}</span>
                </button>
              </div>
            </form>
          </>
        )}

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
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-white">{w.method}</span>
                    <span className="text-[11px] text-neutral-400 font-mono">({w.accountNumber})</span>
                  </div>
                  {w.accountDetails && (
                    <div className="text-[10px] text-neutral-400 truncate max-w-[210px] mt-0.5">
                      {w.accountDetails}
                    </div>
                  )}
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {new Date(w.createdAt).toLocaleDateString('bn-BD')}
                    {w.transactionId && (
                      <span className="ml-1.5 text-emerald-400 font-mono">Trx: {w.transactionId}</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
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

