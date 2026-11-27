import React, { useState } from 'react';
import { Bell, User as UserIcon, Volume2, VolumeX, Search, X } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';
import { CATEGORIES_LIST, getCategoryMeta, ReelCategory } from '../utils/categories';
import { SiteSettings } from '../types';

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
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  durationFilter?: 'all' | 'short' | 'long';
  onDurationFilterChange?: (filter: 'all' | 'short' | 'long') => void;
  siteSettings?: SiteSettings;
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
  searchQuery,
  onSearchChange,
  siteSettings,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const isSearchVisible = Boolean(showCategoryTabs && onSearchChange && (searchOpen || (searchQuery && searchQuery.length > 0)));

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09120d]/95 backdrop-blur-md border-b border-emerald-900/50">
      <div className="max-w-md mx-auto px-3.5 py-2 flex items-center justify-between gap-2">
        {/* Brand Mark */}
        <div className="flex items-center gap-2 select-none min-w-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-neutral-800 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md">
            <img
              src={siteSettings?.appLogoUrl || '/images/app_logo.jpg'}
              alt="ReelPay BD"
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.endsWith('/images/app_logo.jpg')) {
                  img.src = '/images/app_logo.jpg';
                }
              }}
            />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="text-[16px] font-black text-white tracking-tight block truncate">
              ReelPay <span className="text-[#00e676]">BD</span>
            </span>
          </div>
        </div>

        {/* Right Facebook-Style Circular Utility Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {!isAuthenticated ? (
            <>
              {userPoints > 0 && (
                <div
                  className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-full text-amber-300 text-[11px] font-bold border border-amber-500/25 tabular-nums"
                  title={lang === 'bn' ? 'গেস্ট প্রিভিউ পয়েন্ট (উত্তোলনযোগ্য নয়)' : 'Guest preview points (Non-withdrawable)'}
                >
                  <span>🪙</span>
                  <span>{toBengaliNumber(userPoints, lang)}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3 py-1 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-black text-xs shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{lang === 'bn' ? 'লগইন' : 'Login'}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 bg-[#12241a] px-2.5 py-1 rounded-full text-white text-xs font-extrabold border border-emerald-800/60 tabular-nums">
              <span className="text-amber-400 text-xs">🪙</span>
              <span>{toBengaliNumber(userPoints, lang)}</span>
            </div>
          )}

          {showCategoryTabs && onSearchChange && (
            <button
              type="button"
              onClick={() => {
                if (searchOpen && searchQuery) {
                  onSearchChange('');
                }
                setSearchOpen((prev) => !prev);
              }}
              aria-label={lang === 'bn' ? 'রিল খুঁজুন' : 'Search reels'}
              aria-expanded={isSearchVisible}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition flex items-center justify-center cursor-pointer active:scale-95 ${
                isSearchVisible
                  ? 'bg-[#00c853]/20 border-emerald-500/60 text-[#00e676]'
                  : 'bg-[#122018] hover:bg-[#192b20] border-emerald-900/50 text-neutral-200 hover:text-white'
              }`}
            >
              {isSearchVisible ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? (lang === 'bn' ? 'শব্দ চালু করুন' : 'Unmute sound') : (lang === 'bn' ? 'শব্দ বন্ধ করুন' : 'Mute sound')}
            title={isMuted ? (lang === 'bn' ? 'শব্দ চালু করুন' : 'Unmute') : (lang === 'bn' ? 'শব্দ বন্ধ করুন' : 'Mute')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#122018] hover:bg-[#192b20] border border-emerald-900/50 text-neutral-300 hover:text-white transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={onToggleLang}
            id="langBtn"
            className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-full bg-[#122018] hover:bg-[#192b20] border border-emerald-900/50 text-emerald-300 font-extrabold text-[10px] tracking-wider uppercase transition active:scale-95 cursor-pointer"
          >
            {lang === 'bn' ? 'EN' : 'বাং'}
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#122018] hover:bg-[#192b20] border border-emerald-900/50 text-neutral-200 hover:text-white transition flex items-center justify-center cursor-pointer active:scale-95"
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

      {/* Expandable Facebook-Style Search Bar */}
      {isSearchVisible && onSearchChange && (
        <div className="max-w-md mx-auto px-3.5 pt-1 pb-2 border-t border-emerald-950/60 animate-in fade-in slide-in-from-top-1">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-emerald-400 pointer-events-none" />
            <input
              type="text"
              autoFocus={searchOpen}
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={lang === 'bn' ? 'রিল, বিষয় বা ক্রিয়েটর খুঁজুন...' : 'Search reels, topics or creators...'}
              className="w-full bg-[#122018] hover:bg-[#16271e] focus:bg-[#16271e] border border-emerald-900/60 focus:border-emerald-500/80 rounded-full pl-10 pr-9 py-2 text-xs text-white placeholder-neutral-400 focus:outline-none transition shadow-inner"
            />
            {searchQuery && searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 w-5 h-5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-neutral-300 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer"
                aria-label={lang === 'bn' ? 'মুছে ফেলুন' : 'Clear search'}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Compact Category Tabs & Duration Filter */}
      {showCategoryTabs && onSelectCategory && categories.length > 0 && (
        <div
          role="tablist"
          aria-label={lang === 'bn' ? 'রিল ক্যাটাগরি ও ফিল্টার' : 'Reel categories and filter'}
          className="max-w-md mx-auto px-3.5 py-1.5 flex items-center justify-between gap-2 border-t border-emerald-950/60"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
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
                  className={`shrink-0 h-8 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border select-none cursor-pointer transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? `${meta.activeBg} ${meta.activeText} border-white/20 shadow-sm shadow-emerald-500/20`
                      : 'bg-[#122018] hover:bg-[#192b20] text-neutral-300 hover:text-white border-emerald-900/50'
                  }`}
                >
                  <span className="text-xs">{meta.icon}</span>
                  <span className="whitespace-nowrap">{displayLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

