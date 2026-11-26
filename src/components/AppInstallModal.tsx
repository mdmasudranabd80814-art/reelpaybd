import React from 'react';
import { X, Smartphone, Download, ExternalLink, Cpu, ShieldCheck, Zap, Copy } from 'lucide-react';
import { vibrateLight } from '../utils/haptics';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  const appUrl = window.location.origin;

  const handleCopyUrl = () => {
    vibrateLight();
    navigator.clipboard.writeText(appUrl);
    alert(lang === 'bn' ? 'অ্যাপ লিংক কপি হয়েছে! APK কনভার্টারে পেস্ট করুন।' : 'App URL copied! Paste into APK converter.');
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[32px] bg-gradient-to-b from-[#13231a] via-[#0d1a14] to-[#0a120e] border border-emerald-500/40 p-6 shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 pt-1">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-[#00c853] text-black flex items-center justify-center mx-auto text-3xl font-black shadow-lg shadow-emerald-500/30">
            🤖
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">
              {lang === 'bn' ? 'ReelPay BD APK ডাউনলোড ও জেনারেটর' : 'ReelPay BD APK Download Center'}
            </h3>
            <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
              {lang === 'bn'
                ? 'আপনার অ্যান্ড্রয়েড ফোনের জন্য সরাসরি .APK ফাইল তৈরি বা ডাউনলোড করুন।'
                : 'Create and download the official .APK package for your Android phone.'}
            </p>
          </div>
        </div>

        {/* 1-Click APK Builder Tools */}
        <div className="space-y-2.5 pt-1">
          <div className="text-[11px] font-extrabold text-emerald-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'bn' ? '১ ক্লিকে রিয়েল .APK ফাইল তৈরি করুন:' : 'Generate Real .APK File in 1 Click:'}</span>
          </div>

          <a
            href="https://www.appsgeyser.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs flex items-center justify-between shadow-md transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span>🚀</span>
              <span>AppsGeyser APK Creator</span>
            </div>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href="https://www.webintoapp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-3.5 rounded-xl bg-[#122018] hover:bg-[#1a2e22] border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center justify-between shadow-md transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span>📱</span>
              <span>WebIntoApp APK Generator</span>
            </div>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* URL Copy Box */}
        <div className="p-3.5 rounded-2xl bg-[#091a14] border border-emerald-900/60 space-y-2">
          <div className="text-[10px] font-bold text-neutral-300 flex items-center justify-between">
            <span>{lang === 'bn' ? 'APK কনভার্টারে এই অ্যাপ লিংকটি দিন:' : 'App URL to paste into APK builder:'}</span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-bold text-[10px]"
            >
              <Copy className="w-3 h-3" />
              <span>{lang === 'bn' ? 'কপি করুন' : 'Copy URL'}</span>
            </button>
          </div>
          <div className="bg-black/60 p-2.5 rounded-xl border border-emerald-900 text-[11px] text-emerald-300 font-mono truncate select-all">
            {appUrl}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-neutral-300">
              {lang === 'bn' ? '১০০% ফ্রি' : '100% Free'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-neutral-300">
              {lang === 'bn' ? 'নিরাপদ APK' : 'Safe APK'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950">
            <Smartphone className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-neutral-300">
              {lang === 'bn' ? 'অ্যান্ড্রয়েড' : 'Android App'}
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
