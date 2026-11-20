import React, { useState, useEffect } from 'react';
import { MailCheck, ShieldAlert, RefreshCw, Send, LogOut, CheckCircle2, Loader2 } from 'lucide-react';
import { formatFirebaseAuthError } from '../hooks/useFirebase';

interface EmailVerificationGateProps {
  email: string;
  portal?: 'user' | 'admin';
  lang?: 'bn' | 'en';
  onRefreshStatus: () => Promise<boolean>;
  onResendEmail: () => Promise<{ ok: boolean; error: unknown }>;
  onLogout: () => Promise<void> | void;
}

export const EmailVerificationGate: React.FC<EmailVerificationGateProps> = ({
  email,
  portal = 'user',
  lang = 'bn',
  onRefreshStatus,
  onResendEmail,
  onLogout,
}) => {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [statusMsg, setStatusMsg] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleCheck = async () => {
    setChecking(true);
    setStatusMsg(null);
    const verified = await onRefreshStatus();
    if (!verified) {
      setStatusMsg({
        type: 'error',
        text:
          lang === 'bn'
            ? 'ইমেইল এখনো ভেরিফাই হয়নি! অনুগ্রহ করে আপনার ইমেইল ইনবক্স/Spam-এ পাঠানো ভেরিফিকেশন লিংকে ক্লিক করে আবার চেক করুন।'
            : 'Email is not verified yet! Click the verification link in your Inbox/Spam folder, then check again.',
      });
    } else {
      setStatusMsg({
        type: 'success',
        text: lang === 'bn' ? 'ইমেইল ভেরিফিকেশন সফল! প্রবেশ করা হচ্ছে...' : 'Email verified! Entering...',
      });
    }
    setChecking(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setStatusMsg(null);
    const res = await onResendEmail();
    if (res.ok) {
      setCooldown(30);
      setStatusMsg({
        type: 'success',
        text:
          lang === 'bn'
            ? `নতুন ভেরিফিকেশন লিংক ${email} ঠিকানায় পাঠানো হয়েছে!`
            : `A new verification link was sent to ${email}!`,
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: formatFirebaseAuthError(res.error, lang),
      });
    }
    setResending(false);
  };

  const isAdmin = portal === 'admin';

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white p-4 flex flex-col justify-center items-center relative overflow-hidden">
      <div
        className={`absolute top-1/4 -left-20 w-64 h-64 rounded-full blur-[110px] ${
          isAdmin ? 'bg-blue-500/15' : 'bg-emerald-500/15'
        }`}
      />
      <div
        className={`absolute bottom-1/4 -right-20 w-64 h-64 rounded-full blur-[110px] ${
          isAdmin ? 'bg-indigo-500/15' : 'bg-emerald-500/10'
        }`}
      />

      <div className="max-w-sm w-full mx-auto z-10 space-y-5">
        <div className="text-center space-y-2">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-2xl border ${
              isAdmin
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
            }`}
          >
            <MailCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {isAdmin
              ? lang === 'bn'
                ? 'এডমিন ইমেইল ভেরিফিকেশন'
                : 'Admin Email Verification'
              : lang === 'bn'
              ? 'ইমেইল ভেরিফিকেশন বাধ্যতামূলক'
              : 'Email Verification Required'}
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed px-2">
            {lang === 'bn'
              ? 'সিকিউরিটি-ফাস্ট নীতিমালা অনুযায়ী ইমেইল ভেরিফিকেশন ছাড়া অ্যাপ বা এডমিন প্যানেলে প্রবেশ করা যাবে না।'
              : 'For security, access is blocked until your email address is verified.'}
          </p>
        </div>

        <div className="bg-[#132019]/90 backdrop-blur-xl border border-emerald-900/50 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#0b130f] border border-emerald-950 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-neutral-400">
                {lang === 'bn' ? 'ভেরিফিকেশন অপেক্ষমান ইমেইল:' : 'Pending verification email:'}
              </p>
              <p className="text-xs font-bold text-white truncate">{email || 'N/A'}</p>
            </div>
          </div>

          <div className="text-xs text-neutral-300 space-y-1.5 leading-relaxed bg-black/25 p-3 rounded-2xl border border-white/5">
            <p className="font-bold text-emerald-400">
              {lang === 'bn' ? 'কিভাবে ভেরিফাই করবেন:' : 'How to verify:'}
            </p>
            <p>1. {lang === 'bn' ? 'আপনার ইমেইলের Inbox বা Spam ফোল্ডার খুলুন।' : 'Open your email Inbox or Spam folder.'}</p>
            <p>2. {lang === 'bn' ? 'পাঠানো ভেরিফিকেশন লিংকে ক্লিক করুন।' : 'Click the verification link sent by Firebase.'}</p>
            <p>3. {lang === 'bn' ? 'এরপর নিচের "ভেরিফিকেশন চেক করুন" বাটনে চাপ দিন।' : 'Return here and tap "Check Verification".'}</p>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-blue-500/15 border-blue-500/40 text-blue-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking}
              className={`w-full min-h-[46px] rounded-2xl font-black text-xs transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                isAdmin
                  ? 'bg-[#2962ff] hover:bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-[#00c853] hover:bg-[#00e676] text-black shadow-emerald-500/20'
              }`}
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {lang === 'bn'
                  ? 'ভেরিফিকেশন সম্পন্ন করেছি (চেক করুন)'
                  : "I've Verified — Check Now"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full min-h-[42px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>
                {cooldown > 0
                  ? lang === 'bn'
                    ? `আবার পাঠান (${cooldown}s)`
                    : `Resend in ${cooldown}s`
                  : lang === 'bn'
                  ? 'ভেরিফিকেশন লিংক আবার পাঠান'
                  : 'Resend Verification Email'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onLogout()}
              className="w-full min-h-[40px] rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn' ? 'সাইনআউট / অন্য অ্যাকাউন্ট ব্যবহার করুন' : 'Sign Out / Switch Account'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
