import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({ isOpen, onClose, lang }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-[28px] bg-gradient-to-b from-[#13231a] to-[#0a120e] border border-emerald-500/40 p-6 shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 pt-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-[#00c853] text-black flex items-center justify-center mx-auto text-3xl font-black shadow-lg shadow-emerald-500/30">
            ৳
          </div>
          <h3 className="text-lg font-black tracking-tight">
            {lang === 'bn' ? 'ReelPay BD অ্যাপ ইনস্টল করুন' : 'Install ReelPay BD App'}
          </h3>
          <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
            {lang === 'bn'
              ? 'এটি একটি ওয়েব অ্যাপ হওয়ায় সরাসরি APK ফাইল ইনস্টল হয় না ("There was a problem parsing the package" দেখায়)। নিচের নিয়মে খুব সহজে ব্রাউজার থেকে ইনস্টল করুন!'
              : 'Web apps install via browser menu instead of APK files. Follow simple steps below!'}
          </p>
        </div>

        {deferredPrompt && !isInstalled && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00c853] to-[#00e676] hover:brightness-110 text-black font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? '1-ক্লিকে ইনস্টল করুন (Install)' : 'Install App Now'}</span>
          </button>
        )}

        <div className="p-4 rounded-2xl bg-[#0e1913] border border-emerald-900/60 space-y-3 text-xs text-neutral-300">
          <h4 className="font-extrabold text-emerald-300 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'bn' ? 'সঠিক নিয়ম (Android Chrome):' : 'Correct Installation Steps:'}</span>
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-[11px] text-neutral-200 leading-relaxed font-medium">
            <li>
              {lang === 'bn'
                ? 'মোবাইলের **Google Chrome** ব্রাউজারের ওপরের ডানকোণের তিন বিন্দু (**⋮**) মেনুতে ট্যাপ করুন।'
                : 'Tap the three dots (⋮) menu at the top right of Chrome.'}
            </li>
            <li>
              {lang === 'bn'
                ? 'মেনু থেকে **"Add to Home screen"** অথবা **"Install app"** অপশনে ট্যাপ করুন।'
                : 'Tap **"Add to Home screen"** or **"Install app"** from the menu.'}
            </li>
            <li>
              {lang === 'bn'
                ? '**"Install"** বা **"Add"** দিন। ব্যস! ফোনের হোমস্ক্রিনে আসল অ্যাপের মতো আইকন চলে আসবে এবং আর কোনো এরর হবে না!'
                : 'Tap **"Install"** or **"Add"**. The app icon will appear on your home screen instantly!'}
            </li>
          </ol>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-center space-y-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto" />
            <div className="text-[10px] font-bold text-emerald-300">
              {lang === 'bn' ? '১০০% নিরাপদ' : '100% Secure'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-center space-y-1">
            <Zap className="w-5 h-5 text-amber-400 mx-auto" />
            <div className="text-[10px] font-bold text-amber-300">
              {lang === 'bn' ? 'দ্রুত ও স্মুথ' : 'Fast & Smooth'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold text-xs cursor-pointer transition active:scale-95"
        >
          {lang === 'bn' ? 'বুঝেছি / বন্ধ করুন' : 'Got it / Close'}
        </button>
      </div>
    </div>
  );
};
