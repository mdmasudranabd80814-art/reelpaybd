import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { vibrateLight, vibrateSuccess } from '../utils/haptics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({ isOpen, onClose, lang }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const handleInstallClick = async () => {
    vibrateLight();
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          vibrateSuccess();
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-[32px] bg-gradient-to-b from-[#13231a] via-[#0d1a14] to-[#0a120e] border border-emerald-500/40 p-6 shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-200"
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
          <div className="relative w-18 h-18 rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-[#00c853] text-black flex items-center justify-center mx-auto text-4xl font-black shadow-lg shadow-emerald-500/30">
            🎬
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-black text-emerald-400 rounded-full border border-emerald-500 flex items-center justify-center text-xs">
              ✓
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">
              {lang === 'bn' ? 'ReelPay BD অ্যাপ ইনস্টল করুন' : 'Install ReelPay BD App'}
            </h3>
            <p className="text-xs text-neutral-300 mt-1 max-w-xs mx-auto leading-relaxed">
              {lang === 'bn'
                ? 'হোম স্ক্রিনে ইনস্টল করে সরাসরি অ্যাপের মতো ব্যবহার করুন। রিল দেখুন, লাইভ করুন ও পয়েন্ট জিতুন এক ক্লিকে!'
                : 'Install to your home screen for lightning-fast access, instant reel earnings, and live adda.'}
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
        ) : deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#00c853] hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isInstalling
                ? (lang === 'bn' ? 'ইনস্টল হচ্ছে...' : 'Installing...')
                : (lang === 'bn' ? 'এখনই ইনস্টল করুন' : 'Install Now')}
            </span>
          </button>
        ) : isIOS ? (
          <div className="p-4 rounded-2xl bg-[#0e1c15] border border-emerald-900/60 space-y-2.5 text-xs text-neutral-200">
            <p className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'bn' ? 'আইফোন / আইপ্যাডে ইনস্টল নির্দেশিকা:' : 'iOS Safari Installation Guide:'}</span>
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-neutral-300">
              <li>{lang === 'bn' ? 'সাফারি ব্রাউজারের নিচের শেয়ার (Share) আইকনে ট্যাপ করুন।' : 'Tap the Share button in Safari toolbar.'}</li>
              <li>{lang === 'bn' ? 'মেনু থেকে "Add to Home Screen" সিলেক্ট করুন।' : 'Select "Add to Home Screen" from the menu.'}</li>
              <li>{lang === 'bn' ? '"Add" চাপুন এবং হোমস্ক্রিনে অ্যাপ পান!' : 'Tap "Add" and enjoy ReelPay BD on your home screen!'}</li>
            </ol>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#0e1c15] border border-emerald-900/60 space-y-2 text-xs text-neutral-200 text-center">
            <p className="font-bold text-emerald-300">
              {lang === 'bn' ? 'ব্রাউজার মেনু থেকে ইনস্টল করুন' : 'Install via Browser Menu'}
            </p>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              {lang === 'bn'
                ? 'ব্রাউজারের ওপরের ডানপাশের মেনু (⋮) থেকে "Install App" বা "Add to Home Screen" এ ক্লিক করুন।'
                : 'Tap the browser menu (⋮) at the top right and select "Install app" or "Add to Home Screen".'}
            </p>
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
            <Sparkles className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-neutral-300">
              {lang === 'bn' ? 'ফ্রি বোনাস' : 'Free Bonus'}
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
