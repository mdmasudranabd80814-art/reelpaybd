import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface ApkDownloadBannerProps {
  lang: 'bn' | 'en';
  onOpenInstallModal: () => void;
}

export const ApkDownloadBanner: React.FC<ApkDownloadBannerProps> = ({ lang, onOpenInstallModal }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-[#12241a] to-emerald-950 border-b border-emerald-500/40 px-3.5 py-2 text-white flex items-center justify-between gap-2.5 shadow-lg relative z-50 animate-in slide-in-from-top-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
          <Smartphone className="w-4 h-4 animate-pulse" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[11px] font-black text-emerald-300 flex items-center gap-1 truncate">
            <span>{lang === 'bn' ? 'অফিশিয়াল অ্যান্ড্রয়েড APK' : 'Official Android APK'}</span>
            <span className="px-1.5 py-0.2 bg-emerald-500 text-black text-[9px] font-black rounded">v2.4</span>
          </div>
          <p className="text-[10px] text-neutral-300 truncate font-medium">
            {lang === 'bn' ? 'ফোনে ইনস্টল করতে .APK ডাউনলোড করুন' : 'Download .APK package for Android'}
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
          <span>{lang === 'bn' ? 'APK ডাউনলোড' : 'Download APK'}</span>
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
