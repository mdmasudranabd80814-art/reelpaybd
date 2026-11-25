import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { ReelWatermark } from '../types';

interface WatermarkOverlayProps {
  watermark?: ReelWatermark;
  fallbackText?: string;
  isFullScreen?: boolean;
  className?: string;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  watermark,
  fallbackText,
  isFullScreen = false,
  className = '',
}) => {
  if (!watermark || !watermark.enabled) {
    return null;
  }

  const {
    type = 'text',
    text,
    logoUrl,
    position = 'bottom-right',
    opacity = 0.85,
    size = 'medium',
    color = '#ffffff',
  } = watermark;

  const displayText = text?.trim() || fallbackText || 'ReelPay BD';

  // Position classes depending on feed card vs full-screen view
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return isFullScreen
          ? 'top-16 left-3.5 sm:top-20 sm:left-4'
          : 'top-10 left-2.5';
      case 'top-right':
        return isFullScreen
          ? 'top-16 right-3.5 sm:top-20 sm:right-4'
          : 'top-10 right-2.5';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'bottom-left':
        return isFullScreen
          ? 'bottom-28 left-3.5 sm:bottom-32 sm:left-4'
          : 'bottom-11 left-2.5';
      case 'bottom-right':
      default:
        return isFullScreen
          ? 'bottom-28 right-16 sm:bottom-32 sm:right-20'
          : 'bottom-11 right-2.5';
    }
  };

  // Size styling
  const getTextSizeClasses = () => {
    switch (size) {
      case 'small':
        return isFullScreen
          ? 'text-[11px] px-2 py-0.5 gap-1'
          : 'text-[9px] px-1.5 py-0.5 gap-1';
      case 'large':
        return isFullScreen
          ? 'text-sm sm:text-base px-3.5 py-1.5 gap-2 font-black'
          : 'text-xs px-2.5 py-1 gap-1.5 font-bold';
      case 'medium':
      default:
        return isFullScreen
          ? 'text-xs sm:text-sm px-2.5 py-1 gap-1.5 font-extrabold'
          : 'text-[10px] px-2 py-0.5 gap-1 font-bold';
    }
  };

  const getLogoSizeClasses = () => {
    switch (size) {
      case 'small':
        return isFullScreen ? 'h-6 sm:h-7 max-w-[90px]' : 'h-5 max-w-[70px]';
      case 'large':
        return isFullScreen ? 'h-11 sm:h-14 max-w-[160px]' : 'h-8 max-w-[110px]';
      case 'medium':
      default:
        return isFullScreen ? 'h-8 sm:h-10 max-w-[125px]' : 'h-6 max-w-[85px]';
    }
  };

  const safeOpacity = Math.max(0.15, Math.min(1, opacity ?? 0.85));

  return (
    <div
      data-testid="reel-watermark-overlay"
      className={`absolute z-20 pointer-events-none select-none transition-all duration-200 ${getPositionClasses()} ${className}`}
      style={{ opacity: safeOpacity }}
    >
      {type === 'logo' && logoUrl ? (
        <div className="relative group/wm flex items-center">
          <img
            src={logoUrl}
            alt="Watermark logo"
            className={`object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] filter ${getLogoSizeClasses()}`}
            onError={(e) => {
              // If logo fails, fall back gracefully to text display
              (e.currentTarget as HTMLElement).style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `<span class="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">🛡️ ${displayText}</span>`;
              }
            }}
          />
        </div>
      ) : (
        <div
          className={`flex items-center rounded-full bg-black/65 backdrop-blur-md border border-white/25 shadow-[0_2px_12px_rgba(0,0,0,0.6)] tracking-wide transition-transform ${getTextSizeClasses()}`}
          style={{ color: color || '#ffffff' }}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0 drop-shadow-sm" />
          <span className="truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] font-sans">
            {displayText}
          </span>
          <Sparkles className="w-2.5 h-2.5 text-amber-300 shrink-0 opacity-80" />
        </div>
      )}
    </div>
  );
};
