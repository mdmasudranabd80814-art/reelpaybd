import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Smartphone, 
  Wallet,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { User } from '../types';
import { INITIAL_USER } from '../data/initialData';

interface AuthPageProps {
  onLogin: (phone: string, pass: string) => boolean;
  onRegister: (userData: Partial<User>) => void;
  onAdminLogin: (pass: string) => boolean;
  mode: 'user' | 'admin';
  onClose?: () => void;
  initialView?: 'login' | 'register';
  reasonMessage?: string;
  lang?: 'bn' | 'en';
}

type AuthView = 'login' | 'register' | 'verify';

export const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onRegister,
  onAdminLogin,
  mode,
  onClose,
  initialView = 'login',
  reasonMessage,
  lang = 'bn',
}) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [otp, setOtp] = useState('');

  // Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const resetForm = () => {
    setView('login');
    setStep(1);
    setErrorMsg(null);
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setPaymentAccount('');
  };

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const success = onLogin(loginPhone, loginPass);
    if (!success) {
      setErrorMsg('ভুল ফোন নাম্বার বা পাসওয়ার্ড!');
    }
    setLoading(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const success = onAdminLogin(adminPass);
    if (!success) {
      setErrorMsg('ভুল এডমিন পাসওয়ার্ড!');
    }
    setLoading(false);
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!name.trim() || !phone.trim()) {
        setErrorMsg('অনুগ্রহ করে আপনার নাম ও মোবাইল নাম্বার দিন');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!paymentAccount.trim()) {
        setErrorMsg('পেমেন্ট নাম্বার দিন');
        return;
      }
      setLoading(true);
      onRegister({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        paymentMethod,
        paymentAccountNumber: paymentAccount.trim(),
        isVerified: true,
      });
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = () => {
    setErrorMsg(null);
    if (otp.length < 4) {
      setErrorMsg('সঠিক ৪ ডিজিটের কোড দিন');
      return;
    }
    setLoading(true);
    onRegister({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      paymentMethod,
      paymentAccountNumber: paymentAccount.trim(),
      isVerified: true
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white p-4 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />

      {/* Top Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer shadow-lg"
          title="হোমপেজে ফিরে যান"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="max-w-sm mx-auto w-full space-y-6 z-10">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00e676] to-[#00c853] rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/20 animate-pulse">
            <span className="text-4xl font-black text-white drop-shadow-lg">৳</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            ReelPay <span className="text-emerald-400">BD</span>
          </h1>
          <p className="text-neutral-400 text-sm font-medium">
            {mode === 'admin' ? 'এডমিন কন্ট্রোল সেন্টার' : 'রিল দেখুন টাকা জিতুন - স্মার্ট ইনকাম অ্যাপ'}
          </p>

          {/* Reason Notification if triggered from earning action */}
          {reasonMessage && (
            <div className="mx-auto max-w-xs bg-emerald-500/15 border border-emerald-500/40 rounded-2xl px-3.5 py-2 text-xs font-semibold text-emerald-300 leading-snug animate-in fade-in slide-in-from-top-2">
              💰 {reasonMessage}
            </div>
          )}
        </div>

        <div className="bg-[#15231c]/80 backdrop-blur-xl border border-emerald-900/40 rounded-[32px] p-6 shadow-2xl space-y-5 relative overflow-hidden">
          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold px-3.5 py-2.5 rounded-2xl">
              ⚠️ {errorMsg}
            </div>
          )}
          {/* Progress Bar for Registration */}
          {view === 'register' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-900/30">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_#10b981]" 
                style={{ width: `${(step / 2) * 100}%` }} 
              />
            </div>
          )}

          {mode === 'admin' ? (
            /* ADMIN LOGIN */
            <form onSubmit={handleAdminLogin} className="space-y-4 pt-2">
               <div className="text-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                  <ShieldCheck className="w-3 h-3" /> Secure Admin Access
                </span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-blue-400 transition">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type="password"
                  placeholder="এডমিন পাসওয়ার্ড"
                  className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition font-mono"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2962ff] hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>🔐 এডমিন হিসেবে ঢুকুন</span>}
              </button>
              <p className="text-[10px] text-center text-neutral-500 font-medium italic">Hint: admin123</p>
            </form>
          ) : view === 'login' ? (
            /* USER LOGIN */
            <form onSubmit={handleUserLogin} className="space-y-5">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-emerald-400 transition">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="tel"
                    placeholder="মোবাইল নাম্বার"
                    className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-emerald-400 transition">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="password"
                    placeholder="পাসওয়ার্ড"
                    className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00c853] hover:bg-[#00e676] text-black font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>👤 লগইন করুন</span>}
              </button>
              
              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-emerald-900/40" />
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">অথবা</span>
                <div className="h-px flex-1 bg-emerald-900/40" />
              </div>

              <button
                type="button"
                onClick={() => setView('register')}
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold py-3.5 rounded-2xl border border-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                <span>নতুন অ্যাকাউন্ট তৈরি করুন</span>
              </button>
            </form>
          ) : view === 'register' ? (
            /* REGISTRATION STEPS */
            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-between mb-2">
                <button onClick={resetForm} className="text-neutral-500 hover:text-white transition">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold text-emerald-400">ধাপ {toBengaliNumber(step)} / ২</span>
              </div>

              {step === 1 ? (
                <div className="space-y-4 animate-in slide-in-from-right-5">
                  <h3 className="text-lg font-bold text-white">আপনার তথ্য দিন</h3>
                  <div className="space-y-3">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-emerald-400 transition">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        placeholder="আপনার পূর্ণ নাম"
                        className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-emerald-400 transition">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <input
                        placeholder="মোবাইল নাম্বার"
                        className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-emerald-400 transition">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        placeholder="ইমেইল এড্রেস"
                        className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-emerald-400 transition">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        placeholder="পাসওয়ার্ড সেট করুন"
                        className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right-5">
                  <h3 className="text-lg font-bold text-white">পেমেন্ট মেথড সেটআপ</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bKash', 'Nagad', 'Rocket'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition ${
                          paymentMethod === m 
                            ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20' 
                            : 'bg-emerald-900/10 border-emerald-900/40 text-neutral-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-emerald-400 transition">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <input
                      placeholder={`${paymentMethod} নাম্বার দিন`}
                      className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                      value={paymentAccount}
                      onChange={(e) => setPaymentAccount(e.target.value)}
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-300 leading-relaxed">
                    সঠিক তথ্য দিন। ভুল নাম্বারে টাকা উত্তোলন করলে কর্তৃপক্ষ দায়ী থাকবে না।
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className="w-full bg-[#00c853] hover:bg-[#00e676] text-black font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>{step === 2 ? 'Google দিয়ে অ্যাকাউন্ট খুলুন' : 'পরবর্তী ধাপ'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {step === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setLoading(true);
                    onRegister({
                      name: name.trim() || undefined,
                      phone: phone.trim() || '',
                      paymentMethod,
                      isVerified: true,
                    });
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold py-3 rounded-2xl border border-emerald-500/30 transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সরাসরি Google দিয়ে রেজিস্ট্রেশন করুন</span>
                </button>
              )}
            </div>
          ) : (
            /* VERIFICATION VIEW */
            <div className="space-y-5 pt-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">ভেরিফিকেশন</h3>
                <p className="text-xs text-neutral-400 leading-relaxed px-4">
                  আমরা আপনার নাম্বার <span className="text-emerald-400 font-bold">{phone}</span> এ একটি কোড পাঠিয়েছি (সিমুলেশন)।
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="0000"
                  className="w-32 bg-[#0d1611] border-2 border-emerald-900/40 rounded-2xl py-4 text-center text-2xl font-black tracking-[10px] text-emerald-400 focus:outline-none focus:border-emerald-500 transition shadow-inner"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button
                onClick={handleVerifyAndRegister}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ভেরিফাই ও অ্যাকাউন্ট খুলুন</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setView('register')}
                className="w-full text-[11px] font-bold text-neutral-500 hover:text-neutral-300 transition"
              >
                ভুল নাম্বার দিয়েছেন? পরিবর্তন করুন
              </button>
            </div>
          )}
        </div>

        <div className="text-center space-y-4">
          <p className="text-[11px] text-neutral-500 font-medium leading-relaxed px-4">
            লগইন বা রেজিস্ট্রেশন করার মাধ্যমে আপনি আমাদের <span className="text-emerald-500">শর্তাবলী</span> এবং <span className="text-emerald-500">গোপনীয়তা নীতি</span> মেনে নিচ্ছেন।
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-neutral-400">Trusted by {toBengaliNumber('10,000')}+ Users in BD</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition flex items-center justify-center gap-1.5 cursor-pointer pt-2"
            >
              <span>✕ হোমপেজে ফিরে যান (ফ্রি রিল দেখুন)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const toBengaliNumber = (num: string | number) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, d => bn[parseInt(d)]);
};
