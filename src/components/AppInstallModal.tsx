import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, CheckCircle2, ShieldCheck, Zap, Info } from 'lucide-react';
import { vibrateLight, vibrateSuccess } from '../utils/haptics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
  appLogoUrl?: string;
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({
  isOpen,
  onClose,
  lang,
  appLogoUrl,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [manualGuideHint, setManualGuideHint] = useState<string | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setManualGuideHint(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;

  const handleInstallClick = async () => {
    vibrateLight();
    setManualGuideHint(null);
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          vibrateSuccess();
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
        setDeferredPrompt(null);
      }
    } else {
      setManualGuideHint(
        isIOS
          ? lang === 'bn'
            ? 'সাফারি ব্রাউজারের নিচের Share আইকন থেকে "Add to Home Screen" সিলেক্ট করুন।'
            : 'Tap Share in Safari and select "Add to Home Screen".'
          : lang === 'bn'
          ? 'ক্রোম ব্রাউজারের ওপরের ডানপাশের থ্রি-ডট মেনু (⋮) থেকে "Install app" অথবা "Add to Home screen" এ ক্লিক করুন।'
          : 'Tap the browser menu (⋮) and select "Install app" or "Add to Home screen".'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[32px] bg-gradient-to-b from-[#13231a] via-[#0d1a14] to-[#0a120e] border border-emerald-500/40 p-6 shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-3 pt-1">
          <div className="relative w-20 h-20 rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/60 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <img
              src={appLogoUrl || '/images/app_logo.jpg'}
              alt="ReelPay BD"
              className="w-full h-full object-cover"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-black text-emerald-400 rounded-full border border-emerald-500 flex items-center justify-center text-xs font-black">
              ✓
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">
              {lang === 'bn' ? 'ReelPay BD অ্যাপ ইনস্টল করুন' : 'Install ReelPay BD App'}
            </h3>
            <p className="text-xs text-neutral-300 mt-1 max-w-xs mx-auto leading-relaxed">
              {lang === 'bn'
                ? 'এটি একটি ওয়েব অ্যাপ (PWA)। ব্রাউজার থেকে সরাসরি আপনার হোম স্ক্রিনে ইনস্টল করে নিখুঁত অ্যাপের মতো ব্যবহার করুন।'
                : 'Install ReelPay BD as a native Web App directly to your device home screen.'}
            </p>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-emerald-300">
              {lang === 'bn' ? 'অ্যাপটি সফলভাবে ইনস্টল করা হয়েছে!' : 'App successfully installed!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#00c853] hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isInstalling
                  ? lang === 'bn'
                    ? 'ইনস্টল হচ্ছে...'
                    : 'Installing...'
                  : lang === 'bn'
                  ? '🚀 ১ ক্লিকে ইনস্টল করুন (Install App)'
                  : 'Install App'}
              </span>
            </button>

            {manualGuideHint && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 text-amber-200 text-xs font-semibold flex items-start gap-2 leading-relaxed">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{manualGuideHint}</span>
              </div>
            )}

            {/* Clear instructions */}
            <div className="p-4 rounded-2xl bg-[#0e1c15] border border-emerald-900/60 space-y-2 text-xs text-neutral-200">
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>
                  {isIOS
                    ? lang === 'bn'
                      ? 'আইফোন (iOS) ইনস্টল নিয়ম:'
                      : 'iOS Installation Guide:'
                    : lang === 'bn'
                    ? 'অ্যান্ড্রয়েড ইনস্টল নিয়ম (Android):'
                    : 'Android Installation Guide:'}
                </span>
              </p>
              {isIOS ? (
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-neutral-300">
                  <li>{lang === 'bn' ? 'সাফারি ব্রাউজারের নিচের শেয়ার (Share) আইকনে ট্যাপ করুন।' : 'Tap the Share icon in Safari.'}</li>
                  <li>{lang === 'bn' ? 'তালিকা থেকে "Add to Home Screen" সিলেক্ট করুন।' : 'Select "Add to Home Screen".'}</li>
                  <li>{lang === 'bn' ? '"Add" চাপুন এবং হোমস্ক্রিনে অ্যাপ পান!' : 'Tap "Add" and enjoy!'}</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-neutral-300">
                  <li>{lang === 'bn' ? 'ক্রোম ব্রাউজারের ওপরের ডানপাশের থ্রি-ডট মেনু (⋮) এ ক্লিক করুন।' : 'Tap the browser top-right menu (⋮).'}</li>
                  <li>{lang === 'bn' ? '"Install app" অথবা "Add to Home screen" অপশনে ট্যাপ করুন।' : 'Tap "Install app" or "Add to Home screen".'}</li>
                  <li>{lang === 'bn' ? '"Install" কনফার্ম করুন। অ্যাপটি আপনার ফোনে ইনস্টল হয়ে যাবে!' : 'Confirm "Install". App is ready!'}</li>
                </ol>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-neutral-300">
              {lang === 'bn' ? 'সুপার ফাস্ট' : 'Super Fast'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-neutral-300">
              {lang === 'bn' ? '১০০% নিরাপদ' : '100% Secure'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950">
            <Smartphone className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-cyan-300">
              {lang === 'bn' ? 'অ্যান্ড্রয়েড' : 'Android'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold text-xs cursor-pointer transition active:scale-95"
        >
          {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
        </button>
      </div>
    </div>
  );
};
