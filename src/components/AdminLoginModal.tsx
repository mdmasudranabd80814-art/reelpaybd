import React, { useState } from 'react';
import { X, Lock, ShieldAlert, CheckCircle2, LogIn } from 'lucide-react';

interface AdminLoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
  isFirebaseSignedIn?: boolean;
  signedInEmail?: string;
  onGoogleLogin?: () => Promise<void> | void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onSuccess,
  onClose,
  isFirebaseSignedIn = false,
  signedInEmail = '',
  onGoogleLogin,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const isAdminGoogleAccount =
    isFirebaseSignedIn && signedInEmail.toLowerCase() === 'mdmasudranabd80814@gmail.com';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="w-full max-w-sm bg-[#121c16] border border-emerald-900/80 rounded-3xl p-5 text-white shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-950 text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm">এডমিন লগইন (Admin Login)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Admin Auth Status */}
        <div
          className={`mb-3.5 p-3 rounded-2xl border text-xs space-y-2 ${
            isAdminGoogleAccount
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {isAdminGoogleAccount ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>এডমিন Google অ্যাকাউন্ট যুক্ত আছে</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>ডাটাবেজ ফুল-কন্ট্রোলের জন্য Google সাইন-ইন প্রয়োজন</span>
              </>
            )}
          </div>
          <p className="text-[11px] opacity-85">
            {isAdminGoogleAccount
              ? `সাইন-ইন: ${signedInEmail}`
              : 'লাইভ ক্যানসেল, ডিলিট ও ডাটাবেজ কন্ট্রোলের জন্য mdmasudranabd80814@gmail.com দিয়ে সাইন-ইন করুন।'}
          </p>
          {!isAdminGoogleAccount && onGoogleLogin && (
            <button
              type="button"
              onClick={() => onGoogleLogin()}
              className="w-full min-h-[38px] rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google দিয়ে এডমিন সাইন-ইন করুন</span>
            </button>
          )}
        </div>

        <p className="text-xs text-neutral-300 mb-3">
          এডমিন প্যানেলে প্রবেশ করতে এডমিন পাসওয়ার্ড দিন।
        </p>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড লিখুন (admin123)</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-neutral-400 block">এডমিন পাসওয়ার্ড:</label>
              <button
                type="button"
                onClick={() => {
                  setPassword('admin123');
                  setError(false);
                }}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
              >
                পাসওয়ার্ড দিন (admin123)
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="গোপন পাসওয়ার্ড লিখুন..."
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#2962ff] hover:bg-blue-600 font-bold text-xs transition text-white shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            এডমিন হিসেবে ঢুকুন 🔐
          </button>
        </form>
      </div>
    </div>
  );
};
