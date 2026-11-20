import React, { useState } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Wallet,
  Loader2,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { User } from '../types';
import { formatFirebaseAuthError } from '../hooks/useFirebase';

interface AuthPageProps {
  onEmailLogin: (email: string, password: string) => Promise<{ user: unknown; error: unknown }>;
  onEmailRegister: (
    email: string,
    password: string,
    userData: Partial<User>
  ) => Promise<{ user: unknown; verificationSent: boolean; error: unknown }>;
  onGoogleLogin: (pendingProfile?: Partial<User>) => Promise<{ user: unknown; error: unknown }>;
  onResetPassword?: (email: string) => Promise<{ ok: boolean; error: unknown }>;
  initialView?: 'login' | 'register';
  reasonMessage?: string;
  lang?: 'bn' | 'en';
}

type AuthView = 'login' | 'register';

export const AuthPage: React.FC<AuthPageProps> = ({
  onEmailLogin,
  onEmailRegister,
  onGoogleLogin,
  onResetPassword,
  initialView = 'login',
  reasonMessage,
  lang = 'bn',
}) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Registration State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [paymentAccount, setPaymentAccount] = useState('');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const resetToLogin = () => {
    setView('login');
    setStep(1);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    if (!loginEmail.trim() || !loginPass) {
      setErrorMsg(lang === 'bn' ? 'ইমেইল এবং পাসওয়ার্ড দিন।' : 'Please enter email and password.');
      return;
    }
    setLoading(true);
    const res = await onEmailLogin(loginEmail.trim(), loginPass);
    if (res.error) {
      setErrorMsg(formatFirebaseAuthError(res.error, lang));
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!onResetPassword) return;
    setErrorMsg(null);
    setInfoMsg(null);
    if (!loginEmail.trim()) {
      setErrorMsg(
        lang === 'bn'
          ? 'পাসওয়ার্ড রিসেট করতে প্রথমে আপনার ইমেইল লিখুন।'
          : 'Enter your email address first to reset your password.'
      );
      return;
    }
    setLoading(true);
    const res = await onResetPassword(loginEmail.trim());
    if (res.ok) {
      setInfoMsg(
        lang === 'bn'
          ? 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!'
          : 'Password reset link sent to your email!'
      );
    } else {
      setErrorMsg(formatFirebaseAuthError(res.error, lang));
    }
    setLoading(false);
  };

  const handleGoogleAuth = async (withPendingProfile = false) => {
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    const pending = withPendingProfile
      ? {
          name: name.trim() || undefined,
          phone: phone.trim(),
          paymentMethod,
          paymentAccountNumber: paymentAccount.trim(),
        }
      : undefined;
    const res = await onGoogleLogin(pending);
    if (res.error) {
      setErrorMsg(formatFirebaseAuthError(res.error, lang));
    }
    setLoading(false);
  };

  const handleNextStep = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    if (step === 1) {
      if (!name.trim() || !phone.trim() || !email.trim() || password.length < 6) {
        setErrorMsg(
          lang === 'bn'
            ? 'সঠিক নাম, মোবাইল নাম্বার, ইমেইল এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।'
            : 'Please enter your name, phone, valid email, and a password (min 6 chars).'
        );
        return;
      }
      setStep(2);
      return;
    }

    if (!paymentAccount.trim()) {
      setErrorMsg(lang === 'bn' ? 'পেমেন্ট নাম্বার দিন।' : 'Please enter payment account number.');
      return;
    }

    setLoading(true);
    const res = await onEmailRegister(email.trim(), password, {
      name: name.trim(),
      phone: phone.trim(),
      paymentMethod,
      paymentAccountNumber: paymentAccount.trim(),
    });
    if (res.error) {
      setErrorMsg(formatFirebaseAuthError(res.error, lang));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white p-4 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />

      <div className="max-w-sm mx-auto w-full space-y-5 z-10">
        <div className="text-center space-y-2.5">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00e676] to-[#00c853] rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/20">
            <span className="text-4xl font-black text-white drop-shadow-lg">৳</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            ReelPay <span className="text-emerald-400">BD</span>
          </h1>
          <p className="text-neutral-400 text-xs font-medium">
            {lang === 'bn'
              ? 'সুরক্ষিত ইউজার পোর্টাল — ইমেইল ভেরিফিকেশন বাধ্যতামূলক'
              : 'Secure User Portal — Email Verification Required'}
          </p>

          {reasonMessage && (
            <div className="mx-auto max-w-xs bg-emerald-500/15 border border-emerald-500/40 rounded-2xl px-3.5 py-2 text-xs font-semibold text-emerald-300 leading-snug">
              🔐 {reasonMessage}
            </div>
          )}
        </div>

        <div className="bg-[#15231c]/85 backdrop-blur-xl border border-emerald-900/40 rounded-[32px] p-6 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold w-fit mx-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn'
                ? 'সিকিউরিটি-ফাস্ট • ইমেইল ভেরিফাইড লগইন'
                : 'Security-First • Verified Email Required'}
            </span>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold px-3.5 py-2.5 rounded-2xl leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-2xl leading-relaxed">
              ✅ {infoMsg}
            </div>
          )}

          {view === 'register' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-900/30">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_#10b981]"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          )}

          {view === 'login' ? (
            <div className="space-y-4">
              <form onSubmit={handleUserLogin} className="space-y-3.5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-emerald-400 transition">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder={lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email address'}
                    className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-emerald-400 transition">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder={lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                    className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00c853] hover:bg-[#00e676] text-black font-black py-3.5 rounded-2xl transition active:scale-95 shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'ইমেইল দিয়ে লগইন করুন' : 'Sign In with Email'}</span>
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-emerald-900/40" />
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                  {lang === 'bn' ? 'অথবা' : 'OR'}
                </span>
                <div className="h-px flex-1 bg-emerald-900/40" />
              </div>

              <button
                type="button"
                onClick={() => handleGoogleAuth(false)}
                disabled={loading}
                className="w-full bg-white hover:bg-neutral-100 text-black font-black py-3.5 rounded-2xl transition active:scale-95 shadow-lg flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {lang === 'bn'
                    ? 'Google দিয়ে ভেরিফাইড লগইন করুন'
                    : 'Continue with Verified Google'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setInfoMsg(null);
                  setStep(1);
                  setView('register');
                }}
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold py-3 rounded-2xl border border-emerald-500/20 transition flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>{lang === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create New Account'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetToLogin}
                  className="text-neutral-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'লগইন' : 'Login'}</span>
                </button>
                <span className="text-xs font-bold text-emerald-400">
                  {lang === 'bn' ? `ধাপ ${toBengaliNumber(step)} / ২` : `Step ${step} / 2`}
                </span>
              </div>

              {step === 1 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white">
                    {lang === 'bn' ? 'নতুন অ্যাকাউন্ট তথ্য' : 'Account Details'}
                  </h3>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      placeholder={lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
                      className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <input
                      placeholder={lang === 'bn' ? 'মোবাইল নাম্বার (১১ ডিজিট)' : 'Mobile Number'}
                      className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      placeholder={lang === 'bn' ? 'সচল ইমেইল (ভেরিফিকেশনের জন্য)' : 'Valid Email (for verification)'}
                      className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      placeholder={lang === 'bn' ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'Password (min 6 chars)'}
                      className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <h3 className="text-base font-bold text-white">
                    {lang === 'bn' ? 'পেমেন্ট মেথড সেটআপ' : 'Payment Setup'}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bKash', 'Nagad', 'Rocket'] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
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
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <input
                      placeholder={`${paymentMethod} ${lang === 'bn' ? 'নাম্বার দিন' : 'Account Number'}`}
                      className="w-full bg-[#0d1611] border border-emerald-900/40 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition"
                      value={paymentAccount}
                      onChange={(e) => setPaymentAccount(e.target.value)}
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 leading-relaxed">
                    {lang === 'bn'
                      ? 'সাবমিট করার পর আপনার ইমেইলে একটি ভেরিফিকেশন লিংক পাঠানো হবে। ইমেইল ভেরিফাই না করলে প্রবেশ করা যাবে না।'
                      : 'A verification link will be sent to your email. Email verification is mandatory before entering.'}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className="w-full bg-[#00c853] hover:bg-[#00e676] text-black font-black py-3.5 rounded-2xl transition active:scale-95 shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>
                      {step === 2
                        ? lang === 'bn'
                          ? 'অ্যাকাউন্ট খুলুন ও ইমেইল ভেরিফাই করুন'
                          : 'Register & Verify Email'
                        : lang === 'bn'
                        ? 'পরবর্তী ধাপ'
                        : 'Next Step'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {step === 1 && (
                <button
                  type="button"
                  onClick={() => handleGoogleAuth(true)}
                  disabled={loading}
                  className="w-full bg-white hover:bg-neutral-100 text-black font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {lang === 'bn'
                      ? 'সরাসরি Google দিয়ে ভেরিফাইড রেজিস্ট্রেশন'
                      : 'Register with Verified Google'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-neutral-400">
              End-to-End Verified Auth • ReelPay BD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const toBengaliNumber = (num: string | number) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bn[parseInt(d)]);
};
