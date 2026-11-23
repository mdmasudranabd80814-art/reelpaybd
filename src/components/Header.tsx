import React from 'react';
import { Bell, User as UserIcon, Volume2, VolumeX } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';
import { CATEGORIES_LIST, getCategoryMeta, ReelCategory } from '../utils/categories';

interface HeaderProps {
  onOpenNotifications: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  unreadAnnouncementsCount: number;
  lang: 'bn' | 'en';
  onToggleLang: () => void;
  isAuthenticated?: boolean;
  onOpenAuth?: (view?: 'login' | 'register') => void;
  userPoints?: number;
  showCategoryTabs?: boolean;
  categories?: ReelCategory[];
  selectedCategory?: ReelCategory;
  onSelectCategory?: (category: ReelCategory) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  isMuted,
  onToggleMute,
  unreadAnnouncementsCount,
  lang,
  onToggleLang,
  isAuthenticated = false,
  onOpenAuth,
  userPoints = 0,
  showCategoryTabs = false,
  categories = CATEGORIES_LIST,
  selectedCategory = 'সকল',
  onSelectCategory,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#09120d]/95 backdrop-blur-md border-b border-emerald-900/50">
      <div className="max-w-md mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2">
        {/* Brand Mark */}
        <div className="flex items-center gap-2 select-none min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00b248] text-black flex items-center justify-center font-black text-base shadow-md shadow-emerald-500/25 shrink-0">
            ৳
          </div>
          <div className="min-w-0 leading-tight">
            <span className="text-[15px] font-black text-white tracking-tight block truncate">
              ReelPay <span className="text-[#00e676]">BD</span>
            </span>
          </div>
        </div>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isAuthenticated ? (
            <>
              {userPoints > 0 && (
                <div
                  className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-xl text-amber-300 text-[11px] font-bold border border-amber-500/25 tabular-nums"
                  title={lang === 'bn' ? 'গেস্ট প্রিভিউ পয়েন্ট (উত্তোলনযোগ্য নয়)' : 'Guest preview points (Non-withdrawable)'}
                >
                  <span>🪙</span>
                  <span>{toBengaliNumber(userPoints, lang)}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-black text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{lang === 'bn' ? 'লগইন' : 'Login'}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#12241a] px-2.5 py-1.5 rounded-xl text-white text-xs font-extrabold border border-emerald-800/60 tabular-nums">
              <span className="text-amber-400 text-xs">🪙</span>
              <span>{toBengaliNumber(userPoints, lang)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? (lang === 'bn' ? 'শব্দ চালু করুন' : 'Unmute sound') : (lang === 'bn' ? 'শব্দ বন্ধ করুন' : 'Mute sound')}
            title={isMuted ? (lang === 'bn' ? 'শব্দ চালু করুন' : 'Unmute') : (lang === 'bn' ? 'শব্দ বন্ধ করুন' : 'Mute')}
            className="w-9 h-9 rounded-xl bg-[#122018] hover:bg-[#192b20] border border-emerald-900/50 text-neutral-300 hover:text-white transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={onToggleLang}
            id="langBtn"
            className="h-9 px-2.5 rounded-xl bg-[#122018] hover:bg-[#192b20] border border-emerald-900/50 text-emerald-300 font-extrabold text-[10px] tracking-wider uppercase transition active:scale-95 cursor-pointer"
          >
            {lang === 'bn' ? 'EN' : 'বাং'}
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
            className="relative w-9 h-9 rounded-xl bg-[#122018] hover:bg-[#192b20] border border-emerald-900/50 text-neutral-200 hover:text-white transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {unreadAnnouncementsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border border-[#09120d] tabular-nums">
                {toBengaliNumber(unreadAnnouncementsCount, lang)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Tabs Bar */}
      {showCategoryTabs && onSelectCategory && categories.length > 0 && (
        <div
          role="tablist"
          aria-label={lang === 'bn' ? 'রিল ক্যাটাগরি' : 'Reel categories'}
          className="max-w-md mx-auto px-3.5 pt-1.5 pb-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-emerald-950/60"
        >
          {categories.map((cat) => {
            const meta = getCategoryMeta(cat);
            const isSelected = selectedCategory === cat;
            const displayLabel =
              cat === '🔴 লাইভ'
                ? lang === 'bn'
                  ? 'লাইভ'
                  : meta.labelEn
                : lang === 'bn'
                  ? meta.labelBn
                  : meta.labelEn;

            return (
              <button
                key={cat}
                id={`cat-tab-${cat}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCategory(cat)}
                className={`shrink-0 h-8 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border select-none cursor-pointer transition-all duration-200 ease-out origin-center active:scale-95 ${
                  isSelected
                    ? `${meta.activeBg} ${meta.activeText} border-white/20 shadow-md shadow-emerald-500/20 scale-105 animate-category-scale-up`
                    : 'bg-[#122018] hover:bg-[#192b20] text-neutral-300 hover:text-white border-emerald-900/50 scale-100'
                }`}
              >
                <span
                  className={`text-xs transition-transform duration-200 ${
                    isSelected ? 'scale-110' : 'scale-100'
                  }`}
                >
                  {meta.icon}
                </span>
                <span className="whitespace-nowrap tracking-wide">{displayLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
