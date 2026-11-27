import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface ApkDownloadBannerProps {
  lang: 'bn' | 'en';
  onOpenInstallModal: () => void;
  appLogoUrl?: string;
}

export const ApkDownloadBanner: React.FC<ApkDownloadBannerProps> = ({
  lang,
  onOpenInstallModal,
  appLogoUrl,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
  }, []);

  if (!isVisible || isStandalone) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-[#12241a] to-emerald-950 border-b border-emerald-500/40 px-3.5 py-2 text-white flex items-center justify-between gap-2.5 shadow-lg relative z-50 animate-in slide-in-from-top-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-black border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm">
          <img
            src={appLogoUrl || '/images/app_logo.jpg'}
            alt="ReelPay BD"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[11px] font-black text-emerald-300 flex items-center gap-1 truncate">
            <span>{lang === 'bn' ? 'অফিশিয়াল অ্যান্ড্রয়েড অ্যাপ' : 'Official Android App'}</span>
            <span className="px-1.5 py-0.2 bg-emerald-500 text-black text-[9px] font-black rounded">PWA</span>
          </div>
          <p className="text-[10px] text-neutral-300 truncate font-medium">
            {lang === 'bn' ? 'ফোনের হোম স্ক্রিনে অ্যাপ ইনস্টল করুন' : 'Install ReelPay BD app to home screen'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenInstallModal}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00c853] to-[#00e676] hover:brightness-110 text-black font-black text-[11px] shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{lang === 'bn' ? 'ইনস্টল করুন' : 'Install App'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="w-7 h-7 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
