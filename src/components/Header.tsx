import React from 'react';
import { Bell, Settings, Volume2, VolumeX, X, User as UserIcon } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';

interface HeaderProps {
  onOpenNotifications: () => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  unreadAnnouncementsCount: number;
  lang: 'bn' | 'en';
  onToggleLang: () => void;
  onSecretAdminTrigger?: () => void;
  isAuthenticated?: boolean;
  onOpenAuth?: (view?: 'login' | 'register') => void;
  userPoints?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  isAdmin,
  onToggleAdmin,
  isMuted,
  onToggleMute,
  unreadAnnouncementsCount,
  lang,
  onToggleLang,
  onSecretAdminTrigger,
  isAuthenticated = false,
  onOpenAuth,
  userPoints = 0,
}) => {
  const secretTapCountRef = React.useRef(0);
  const secretTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    const next = secretTapCountRef.current + 1;
    if (next >= 5) {
      secretTapCountRef.current = 0;
      if (secretTimerRef.current) clearTimeout(secretTimerRef.current);
      if (isAdmin) {
        onToggleAdmin();
      } else if (onSecretAdminTrigger) {
        onSecretAdminTrigger();
      }
      return;
    }

    secretTapCountRef.current = next;
    if (secretTimerRef.current) clearTimeout(secretTimerRef.current);
    secretTimerRef.current = setTimeout(() => {
      secretTapCountRef.current = 0;
    }, 2500);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0f0d] border-b border-emerald-950/40">

      {/* Main Bar */}
      <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between bg-[#00c853]">
        <div
          onClick={handleLogoTap}
          className="flex items-center gap-2 select-none cursor-pointer"
        >
          <span className="text-lg font-black text-white tracking-tight">৳ ReelPay BD</span>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <button
              onClick={() => onOpenAuth?.('login')}
              className="px-3 py-1.5 rounded-full bg-black/85 hover:bg-black text-[#00e676] font-black text-xs shadow-md border border-emerald-400/40 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগইন' : 'Login'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-xs font-black border border-white/20">
              <span className="text-amber-300">💰</span>
              <span>{toBengaliNumber(userPoints, lang)}</span>
            </div>
          )}

          <button
            onClick={onToggleLang}
            id="langBtn"
            className="px-2.5 py-1.5 rounded-full bg-white text-black font-black text-[10px] uppercase shadow-sm transition active:scale-95 cursor-pointer"
          >
            {lang === 'bn' ? 'EN | BN' : 'BN | EN'}
          </button>
          
          <button
            onClick={onOpenNotifications}
            className="relative w-8 h-8 rounded-full bg-black/10 text-white hover:bg-black/20 transition flex items-center justify-center cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadAnnouncementsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-[#00c853]">
                {toBengaliNumber(unreadAnnouncementsCount, lang)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
