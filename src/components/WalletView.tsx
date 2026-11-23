import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  AlertCircle,
  CreditCard,
  Landmark,
  Smartphone,
  Ban,
} from 'lucide-react';
import {
  User,
  WithdrawalRequest,
  DepositRequest,
  PaymentMethodConfig,
  PaymentMethodCategory,
  DEFAULT_PAYMENT_METHODS,
} from '../types';
import { toBengaliNumber, formatTaka } from '../utils/bengali';
import { playSuccessChime } from '../utils/audio';
import { vibrateLight, vibrateError } from '../utils/haptics';
import { BalanceCard } from './BalanceCard';
import { getUserLevel } from '../utils/levels';

interface WalletViewProps {
  user: User;
  pointRate: number;
  withdrawals: WithdrawalRequest[];
  depositRequests?: DepositRequest[];
  onRequestWithdrawal: (req: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'status'>) => void;
  onDepositClick: () => void;
  isMuted: boolean;
  minWithdrawal?: number;
  maxWithdrawal?: number;
  isWithdrawalsEnabled?: boolean;
  isDepositsEnabled?: boolean;
  paymentMethods?: PaymentMethodConfig[];
  lang?: 'bn' | 'en';
}

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  pointRate,
  withdrawals,
  depositRequests = [],
  onRequestWithdrawal,
  onDepositClick,
  isMuted,
  minWithdrawal = 100,
  maxWithdrawal = 0,
  isWithdrawalsEnabled = true,
  isDepositsEnabled = true,
  paymentMethods,
  lang = 'bn',
}) => {
  const withdrawFormRef = useRef<HTMLDivElement>(null);
  const [historyTab, setHistoryTab] = useState<'withdrawals' | 'deposits'>('withdrawals');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    vibrateLight();
    setAmountBDT(amt);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isWithdrawalsEnabled) {
      vibrateError();
      setErrorMsg('উইথড্রয়াল সিস্টেম সাময়িকভাবে বন্ধ রয়েছে।');
      return;
    }

    if (!selectedMethod) {
      vibrateError();
      setErrorMsg('অনুগ্রহ করে একটি পেমেন্ট মাধ্যম নির্বাচন করুন।');
      return;
    }

    const cleanAcc = accountNumber.trim();
    if (selectedMethod.category === 'mobile_banking') {
      if (!cleanAcc || cleanAcc.length < 11) {
        vibrateError();
        setErrorMsg(`সঠিক ১১ ডিজিটের ${selectedMethod.nameBn} নম্বর দিন (যেমন: 01XXXXXXXXX)`);
        return;
      }
    } else if (selectedMethod.category === 'bank') {
      if (!cleanAcc || cleanAcc.length < 6 || !accountHolderName.trim()) {
        vibrateError();
        setErrorMsg('ব্যাংক অ্যাকাউন্ট নম্বর এবং অ্যাকাউন্ট হোল্ডারের নাম সঠিকভাবে দিন।');
        return;
      }
    } else if (selectedMethod.category === 'card') {
      if (!cleanAcc || cleanAcc.length < 8 || !accountHolderName.trim()) {
        vibrateError();
        setErrorMsg('সঠিক কার্ড নম্বর এবং কার্ড হোল্ডারের নাম দিন।');
        return;
      }
    } else if (!cleanAcc || cleanAcc.length < 4) {
      vibrateError();
      setErrorMsg('সঠিক অ্যাকাউন্ট বা পেমেন্ট তথ্য দিন।');
      return;
    }

    if (!Number.isFinite(amountBDT) || !Number.isInteger(amountBDT) || amountBDT <= 0) {
      vibrateError();
      setErrorMsg('অনুগ্রহ করে সঠিক পূর্ণ সংখ্যার টাকার পরিমাণ লিখুন।');
      return;
    }

    if (amountBDT < minWithdrawal) {
      vibrateError();
      setErrorMsg(`সর্বনিম্ন উত্তোলন পরিমাণ ৳${toBengaliNumber(minWithdrawal, lang)} টাকা`);
      return;
    }

    if (maxWithdrawal > 0 && amountBDT > maxWithdrawal) {
      vibrateError();
      setErrorMsg(`সর্বোচ্চ উত্তোলন সীমা ৳${toBengaliNumber(maxWithdrawal, lang)} টাকা`);
      return;
    }

    if (amountBDT > availableBDT) {
      vibrateError();
      setErrorMsg(`আপনার ব্যালেন্সে পর্যাপ্ত পয়েন্ট নেই! আপনার আছে ৳${toBengaliNumber(availableBDT, lang)}`);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 1200);

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
      `🎉 ${selectedMethod.nameBn}-এ ৳${toBengaliNumber(amountBDT, lang)} উত্তোলনের আবেদন সফলভাবে গৃহীত হয়েছে!`
    );
  };

  const userWithdrawals = withdrawals.filter(
    (w) => w.userId === user.id || (Boolean(user.phone) && w.userPhone === user.phone)
  );
  const userDeposits = depositRequests.filter(
    (d) => d.userId === user.id || (Boolean(user.phone) && d.userPhone === user.phone)
  );
  const currentLevel = getUserLevel(user.reelsWatchedCount);
  const effectiveMaxSelectable =
    maxWithdrawal > 0 ? Math.min(availableBDT, maxWithdrawal) : availableBDT;
  const isAmountValid =
    Number.isFinite(amountBDT) &&
    Number.isInteger(amountBDT) &&
    amountBDT >= minWithdrawal &&
    (maxWithdrawal <= 0 || amountBDT <= maxWithdrawal) &&
    amountBDT <= availableBDT;

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
        onWithdrawClick={() => withdrawFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        onDepositClick={onDepositClick}
        lang={lang}
        multiplier={currentLevel.multiplier}
        isDepositsEnabled={isDepositsEnabled}
      />

      <div className="rounded-2xl bg-gradient-to-br from-[#122419] to-[#0c1811] p-4 border border-emerald-900/60 shadow-xl">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-neutral-400">{lang === 'bn' ? 'মোট উত্তোলন:' : 'Total Withdrawn:'}</span>
            <p className="font-bold text-white mt-0.5 tabular-nums">{formatTaka(user.totalWithdrawn, lang)}</p>
          </div>
          <div>
            <span className="text-neutral-400">{lang === 'bn' ? 'উত্তোলনযোগ্য ব্যালেন্স:' : 'Available Balance:'}</span>
            <p className="font-bold text-emerald-400 mt-0.5 tabular-nums">{formatTaka(availableBDT, lang)}</p>
          </div>
        </div>
      </div>

      {/* Cashout / Withdrawal Form Card removed */}

      {/* Withdrawal & Deposit History Card */}
      <div className="rounded-2xl bg-[#141f19] border border-emerald-950/80 p-4 shadow-lg text-white">
        <div className="grid grid-cols-2 gap-2 mb-3 bg-[#0d1611] p-1 rounded-xl border border-emerald-950/70">
          <button
            type="button"
            onClick={() => setHistoryTab('withdrawals')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              historyTab === 'withdrawals'
                ? 'bg-[#00c853] text-black shadow'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>উত্তোলন ({toBengaliNumber(userWithdrawals.length)})</span>
          </button>
          <button
            type="button"
            onClick={() => setHistoryTab('deposits')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              historyTab === 'deposits'
                ? 'bg-[#ff2d55] text-white shadow'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <span>💎</span>
            <span>ডিপোজিট ({toBengaliNumber(userDeposits.length)})</span>
          </button>
        </div>

        {historyTab === 'withdrawals' ? (
          userWithdrawals.length === 0 ? (
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
          )
        ) : userDeposits.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs space-y-2">
            <p>এখনো কোনো ডিপোজিট রিকোয়েস্ট পাঠানো হয়নি।</p>
            {isDepositsEnabled && (
              <button
                type="button"
                onClick={onDepositClick}
                className="px-4 py-2 rounded-xl bg-[#ff2d55] hover:bg-[#e0264b] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <span>💎 পয়েন্ট ডিপোজিট করুন</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {userDeposits.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-xl bg-[#0e1712] border border-emerald-950/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-white">{d.method}</span>
                    {d.senderNumber && (
                      <span className="text-[11px] text-neutral-400 font-mono">({d.senderNumber})</span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    +{toBengaliNumber(d.pointsToAdd)} পয়েন্ট
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {new Date(d.createdAt).toLocaleDateString('bn-BD')}
                    {d.transactionId && (
                      <span className="ml-1.5 text-amber-300 font-mono">Trx: {d.transactionId}</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-sm text-white block">
                    {formatTaka(d.amountBDT)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                      d.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : d.status === 'rejected'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {d.status === 'approved' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>অনুমোদিত</span>
                      </>
                    ) : d.status === 'rejected' ? (
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

