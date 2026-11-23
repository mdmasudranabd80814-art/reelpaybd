import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  CreditCard,
  Landmark,
  Smartphone,
  Ban,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';
import { playSuccessChime } from '../utils/audio';
import { vibrateLight, vibrateError } from '../utils/haptics';
import {
  DepositRequest,
  PaymentMethodConfig,
  PaymentMethodCategory,
  DEFAULT_PAYMENT_METHODS,
} from '../types';

interface DepositSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (req: Omit<DepositRequest, 'id' | 'createdAt' | 'status' | 'userId' | 'userName' | 'userPhone'>) => void;
  pointRate: number;
  lang: 'bn' | 'en';
  isMuted: boolean;
  adminPaymentNumbers?: { bKash: string; Nagad: string; Rocket: string };
  paymentMethods?: PaymentMethodConfig[];
  minDeposit?: number;
  isDepositsEnabled?: boolean;
}

export const DepositSheet: React.FC<DepositSheetProps> = ({
  isOpen,
  onClose,
  onSubmitRequest,
  pointRate,
  lang,
  isMuted,
  adminPaymentNumbers,
  paymentMethods,
  minDeposit = 20,
  isDepositsEnabled = true,
}) => {
  const activeDepositMethods = useMemo(() => {
    const base =
      paymentMethods && paymentMethods.length > 0
        ? paymentMethods
        : DEFAULT_PAYMENT_METHODS.map((pm) => {
            if (adminPaymentNumbers && pm.name === 'bKash') return { ...pm, accountNumber: adminPaymentNumbers.bKash };
            if (adminPaymentNumbers && pm.name === 'Nagad') return { ...pm, accountNumber: adminPaymentNumbers.Nagad };
            if (adminPaymentNumbers && pm.name === 'Rocket') return { ...pm, accountNumber: adminPaymentNumbers.Rocket };
            return pm;
          });
    return base.filter((m) => m.isEnabled && m.supportsDeposit);
  }, [paymentMethods, adminPaymentNumbers]);

  const [categoryFilter, setCategoryFilter] = useState<'all' | PaymentMethodCategory>('all');
  const filteredMethods = useMemo(() => {
    if (categoryFilter === 'all') return activeDepositMethods;
    return activeDepositMethods.filter((m) => m.category === categoryFilter);
  }, [activeDepositMethods, categoryFilter]);

  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activeDepositMethods[0]?.id || 'pm_bkash'
  );
  const [amountBDT, setAmountBDT] = useState<number>(Math.max(minDeposit, 100));
  const [senderNumber, setSenderNumber] = useState('');
  const [senderDetails, setSenderDetails] = useState('');
  const [trxId, setTrxId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (filteredMethods.length > 0 && !filteredMethods.some((m) => m.id === selectedMethodId)) {
      setSelectedMethodId(filteredMethods[0].id);
    }
  }, [filteredMethods, selectedMethodId]);

  if (!isOpen) return null;

  const selectedMethod =
    activeDepositMethods.find((m) => m.id === selectedMethodId) || activeDepositMethods[0];
  const pointsToAdd = (amountBDT || 0) * (pointRate || 10);

  const handleCopy = () => {
    if (!selectedMethod?.accountNumber) return;
    navigator.clipboard.writeText(selectedMethod.accountNumber);
    vibrateLight();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isDepositsEnabled) {
      vibrateError();
      setErrorMsg(lang === 'bn' ? 'ডিপোজিট সাময়িকভাবে বন্ধ আছে।' : 'Deposits are currently paused.');
      return;
    }

    if (!selectedMethod) {
      vibrateError();
      setErrorMsg(lang === 'bn' ? 'পেমেন্ট মাধ্যম নির্বাচন করুন।' : 'Select a payment method.');
      return;
    }

    if (!amountBDT || amountBDT < minDeposit) {
      vibrateError();
      setErrorMsg(
        lang === 'bn'
          ? `সর্বনিম্ন ডিপোজিট ৳${toBengaliNumber(minDeposit)} টাকা`
          : `Minimum deposit is ৳${minDeposit}`
      );
      return;
    }

    if (!senderNumber.trim() || !trxId.trim()) {
      vibrateError();
      setErrorMsg(
        lang === 'bn' ? 'সবগুলো তথ্য সঠিকভাবে পূরণ করুন' : 'Please fill all fields correctly'
      );
      return;
    }

    if (!isMuted) playSuccessChime();

    onSubmitRequest({
      method: selectedMethod.name,
      methodCategory: selectedMethod.category,
      receiverAccountNumber: selectedMethod.accountNumber,
      amountBDT,
      pointsToAdd,
      senderNumber: senderNumber.trim(),
      senderDetails: senderDetails.trim() || undefined,
      transactionId: trxId.trim(),
    });

    const msg =
      lang === 'bn'
        ? `✅ ডিপোজিট রিকোয়েস্ট জমা হয়েছে। এডমিন যাচাই করে পয়েন্ট যোগ করে দেবে।`
        : `✅ Deposit request submitted. Points will be added after verification.`;

    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
      setSenderNumber('');
      setSenderDetails('');
      setTrxId('');
      onClose();
    }, 2000);
  };

  const hasMultipleCategories =
    new Set(activeDepositMethods.map((m) => m.category)).size > 1;

  const getCategoryIcon = (cat: PaymentMethodCategory) => {
    if (cat === 'bank') return <Landmark className="w-3.5 h-3.5 shrink-0" />;
    if (cat === 'card') return <CreditCard className="w-3.5 h-3.5 shrink-0" />;
    return <Smartphone className="w-3.5 h-3.5 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-end p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#16231c] border-t sm:border border-emerald-900/80 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl animate-in slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💎</span>
            <h3 className="font-bold text-base">
              {lang === 'bn' ? 'পয়েন্ট কিনুন / Buy Points' : 'Buy Points / পয়েন্ট কিনুন'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isDepositsEnabled ? (
          <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-2 my-3">
            <Ban className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-xs font-bold text-rose-200">
              ডিপোজিট সিস্টেম এডমিন কর্তৃক সাময়িকভাবে বন্ধ রাখা হয়েছে। অনুগ্রহ করে পরে চেষ্টা করুন।
            </p>
          </div>
        ) : activeDepositMethods.length === 0 ? (
          <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center text-xs text-amber-200 my-3">
            বর্তমানে কোনো ডিপোজিট মেথড সক্রিয় নেই।
          </div>
        ) : (
          <>
            {successMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              {hasMultipleCategories && (
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
                          : 'bg-[#0e1712] text-neutral-300 hover:bg-neutral-800 border border-emerald-950'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Method Selection */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-2">
                  {lang === 'bn' ? '১. পেমেন্ট মাধ্যম সিলেক্ট করুন:' : '1. Select Payment Method:'}
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
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'text-white shadow-md'
                            : 'bg-[#1e2e25] text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {getCategoryIcon(m.category)}
                        <span className="truncate">{m.nameBn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Account / Number Details */}
              {selectedMethod && (
                <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>
                      {selectedMethod.category === 'bank'
                        ? `নিচের ${selectedMethod.nameBn} অ্যাকাউন্টে ট্রান্সফার করুন:`
                        : selectedMethod.category === 'card'
                        ? `নিচের ${selectedMethod.nameBn} / মার্চেন্ট অ্যাকাউন্টে পেমেন্ট করুন:`
                        : `নিচের ${selectedMethod.nameBn} নাম্বারে "Send Money" করুন:`}
                    </span>
                    {selectedMethod.accountTypeLabel && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                        {selectedMethod.accountTypeLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base sm:text-lg font-black text-emerald-400 tracking-wide font-mono break-all">
                      {selectedMethod.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 active:scale-95 transition shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
                    </button>
                  </div>

                  {(selectedMethod.accountTitle ||
                    selectedMethod.bankName ||
                    selectedMethod.branchName ||
                    selectedMethod.routingNumber) && (
                    <div className="text-[11px] text-neutral-300 space-y-0.5 pt-1 border-t border-emerald-950/60">
                      {selectedMethod.accountTitle && (
                        <p>প্রাপক: <span className="font-bold text-white">{selectedMethod.accountTitle}</span></p>
                      )}
                      {selectedMethod.bankName && (
                        <p>ব্যাংক: <span className="font-semibold text-white">{selectedMethod.bankName}</span></p>
                      )}
                      {(selectedMethod.branchName || selectedMethod.routingNumber) && (
                        <p className="text-neutral-400">
                          {[selectedMethod.branchName ? `শাখা: ${selectedMethod.branchName}` : '', selectedMethod.routingNumber ? `রাউটিং: ${selectedMethod.routingNumber}` : '']
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-1 flex items-start gap-1.5 text-[10px] text-amber-400/90 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      {selectedMethod.instructions ||
                        (lang === 'bn'
                          ? 'টাকা পাঠানোর পর নিচের ফর্মে আপনার প্রেরক তথ্য ও TrxID দিন'
                          : 'Provide sender info & TrxID after payment')}
                    </span>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                    {lang === 'bn' ? `টাকার পরিমাণ (সর্বনিম্ন ৳${toBengaliNumber(minDeposit)}):` : 'Amount (BDT):'}
                  </label>
                  <input
                    type="number"
                    min={minDeposit}
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
                    {selectedMethod?.category === 'bank'
                      ? 'আপনার ব্যাংক অ্যাকাউন্ট নম্বর:'
                      : selectedMethod?.category === 'card'
                      ? 'আপনার কার্ডের শেষ ৪-১৬ ডিজিট:'
                      : lang === 'bn'
                      ? 'আপনার নাম্বার (যেখান থেকে টাকা পাঠিয়েছেন):'
                      : 'Your Number (Sender):'}
                  </label>
                  <input
                    type="text"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder={
                      selectedMethod?.category === 'bank'
                        ? 'Bank A/C No'
                        : selectedMethod?.category === 'card'
                        ? 'Card Last 4 Digits / Number'
                        : '017XXXXXXXX'
                    }
                    className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                {(selectedMethod?.category === 'bank' || selectedMethod?.category === 'card') && (
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                      প্রেরকের নাম / ব্যাংক নাম (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      value={senderDetails}
                      onChange={(e) => setSenderDetails(e.target.value)}
                      placeholder="Account Holder / Issuing Bank"
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                    {lang === 'bn' ? 'ট্রানজেকশন আইডি / রেফারেন্স (TrxID):' : 'Transaction ID (TrxID):'}
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="TRX12345678 / Reference No"
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
          </>
        )}

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

