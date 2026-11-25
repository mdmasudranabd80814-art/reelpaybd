import React, { useRef } from 'react';
import {
  ShieldCheck,
  Type,
  Image as ImageIcon,
  Upload,
  Check,
  Sparkles,
  Trash2,
  Sliders,
} from 'lucide-react';
import { ReelWatermark, WatermarkPosition, WatermarkType } from '../types';

interface WatermarkConfiguratorProps {
  watermark: ReelWatermark;
  onChange: (updated: ReelWatermark) => void;
  creatorName?: string;
  creatorHandle?: string;
  previewThumbnailUrl?: string;
  lang: 'bn' | 'en';
}

const COLOR_SWATCHES = [
  { label: 'White', hex: '#ffffff' },
  { label: 'Emerald', hex: '#00e676' },
  { label: 'Gold', hex: '#fbbf24' },
  { label: 'Cyan', hex: '#38bdf8' },
  { label: 'Rose', hex: '#f43f5e' },
];

const PRESET_LOGOS = [
  {
    id: 'badge_verified',
    nameBn: 'ভেরিফাইড ব্যাজ',
    nameEn: 'Verified Shield',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%2300c853"/><path d="M30 52 L44 65 L70 35" stroke="white" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    id: 'badge_star',
    nameBn: 'স্টার ক্রিয়েটর',
    nameEn: 'Star Creator',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill="%23fbbf24" stroke="%23f59e0b" stroke-width="4"/></svg>',
  },
  {
    id: 'badge_reelpay',
    nameBn: 'ReelPay BD',
    nameEn: 'ReelPay BD',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50" fill="none"><rect width="160" height="50" rx="25" fill="%230d1611" stroke="%2300c853" stroke-width="3"/><circle cx="28" cy="25" r="14" fill="%2300c853"/><text x="24" y="31" font-family="sans-serif" font-weight="900" font-size="16" fill="black">৳</text><text x="52" y="32" font-family="sans-serif" font-weight="900" font-size="16" fill="white">ReelPay</text></svg>',
  },
];

export const WatermarkConfigurator: React.FC<WatermarkConfiguratorProps> = ({
  watermark,
  onChange,
  creatorName = 'Creator',
  creatorHandle = '@creator',
  previewThumbnailUrl,
  lang,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const cleanHandle = creatorHandle.startsWith('@') ? creatorHandle : `@${creatorHandle}`;

  const handleToggle = (enabled: boolean) => {
    onChange({
      ...watermark,
      enabled,
      text: watermark.text || cleanHandle || creatorName,
    });
  };

  const handleTypeChange = (type: WatermarkType) => {
    onChange({
      ...watermark,
      type,
      text: watermark.text || cleanHandle || creatorName,
      logoUrl: type === 'logo' && !watermark.logoUrl ? PRESET_LOGOS[0].url : watermark.logoUrl,
    });
  };

  const handlePositionSelect = (pos: WatermarkPosition) => {
    onChange({ ...watermark, position: pos });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange({
            ...watermark,
            type: 'logo',
            logoUrl: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const positions: Array<{ pos: WatermarkPosition; labelBn: string; labelEn: string; icon: string }> = [
    { pos: 'top-left', labelBn: 'উপরে বামে', labelEn: 'Top Left', icon: '↖' },
    { pos: 'top-right', labelBn: 'উপরে ডানে', labelEn: 'Top Right', icon: '↗' },
    { pos: 'center', labelBn: 'মাঝখানে', labelEn: 'Center', icon: '⏺' },
    { pos: 'bottom-left', labelBn: 'নিচে বামে', labelEn: 'Bottom Left', icon: '↙' },
    { pos: 'bottom-right', labelBn: 'নিচে ডানে', labelEn: 'Bottom Right', icon: '↘' },
  ];

  const currentText = watermark.text || cleanHandle || creatorName;
  const currentOpacity = watermark.opacity ?? 0.85;

  return (
    <div className="p-3.5 rounded-2xl bg-[#0e1a13] border border-emerald-900/80 space-y-3">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
              <span>{lang === 'bn' ? 'কনটেন্ট ওয়াটারমার্ক প্রটেকশন' : 'Content Watermark Protection'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </h4>
            <p className="text-[10px] text-neutral-400">
              {lang === 'bn'
                ? 'ভিডিওতে নাম বা লোগো দিয়ে কপি হওয়া রোধ করুন'
                : 'Protect content from uncredited reposts'}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={watermark.enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
        </label>
      </div>

      {watermark.enabled && (
        <div className="space-y-3 pt-2 border-t border-emerald-950 animate-in fade-in-50 duration-200">
          {/* Type selector: Text vs Logo */}
          <div className="grid grid-cols-2 gap-2 bg-[#09110d] p-1 rounded-xl border border-emerald-950">
            <button
              type="button"
              onClick={() => handleTypeChange('text')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                watermark.type === 'text'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'টেক্সট ওয়াটারমার্ক' : 'Text Watermark'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('logo')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                watermark.type === 'logo'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লোগো ওয়াটারমার্ক' : 'Logo Watermark'}</span>
            </button>
          </div>

          {/* Text Watermark Controls */}
          {watermark.type === 'text' && (
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  {lang === 'bn' ? 'ওয়াটারমার্ক টেক্সট:' : 'Watermark Text:'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={watermark.text ?? cleanHandle}
                    onChange={(e) => onChange({ ...watermark, text: e.target.value })}
                    maxLength={40}
                    placeholder="@yourhandle বা নাম"
                    className="w-full bg-[#132219] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 font-semibold"
                  />
                  <ShieldCheck className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5 pointer-events-none opacity-60" />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-neutral-400">{lang === 'bn' ? 'কুইক টেক্সট:' : 'Presets:'}</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...watermark, text: cleanHandle })}
                  className="px-2 py-0.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-[10px] text-emerald-300 font-semibold cursor-pointer"
                >
                  {cleanHandle}
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...watermark, text: creatorName })}
                  className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-200 cursor-pointer"
                >
                  {creatorName}
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...watermark, text: '© ReelPay BD' })}
                  className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-200 cursor-pointer"
                >
                  © ReelPay BD
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...watermark, text: '🔒 Original Content' })}
                  className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-200 cursor-pointer"
                >
                  🔒 Original
                </button>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-neutral-400">{lang === 'bn' ? 'টেক্সট কালার:' : 'Color:'}</span>
                <div className="flex items-center gap-1.5">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => onChange({ ...watermark, color: swatch.hex })}
                      className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                        (watermark.color || '#ffffff') === swatch.hex
                          ? 'border-emerald-400 scale-110 shadow-sm'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Logo Watermark Controls */}
          {watermark.type === 'logo' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'কাস্টম লোগো আপলোড (PNG/JPG)' : 'Upload Custom Logo'}</span>
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {watermark.logoUrl && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...watermark, logoUrl: undefined })}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 border border-neutral-700 cursor-pointer"
                    title={lang === 'bn' ? 'লোগো মুছুন' : 'Remove logo'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Logo Presets */}
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">
                  {lang === 'bn' ? 'বা রেডিমেড লোগো সিলেক্ট করুন:' : 'Or choose preset badge:'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_LOGOS.map((preset) => {
                    const isSelected = watermark.logoUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onChange({ ...watermark, logoUrl: preset.url })}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-400 shadow-sm'
                            : 'bg-[#101b15] border-emerald-950 hover:bg-[#15231c]'
                        }`}
                      >
                        <img src={preset.url} alt={preset.nameEn} className="h-6 object-contain" />
                        <span className="text-[9px] font-bold text-neutral-300 truncate max-w-full">
                          {lang === 'bn' ? preset.nameBn : preset.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Position Grid */}
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">
              {lang === 'bn' ? 'ওয়াটারমার্কের অবস্থান (Position):' : 'Position on Video:'}
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {positions.map((item) => {
                const isSelected = (watermark.position || 'bottom-right') === item.pos;
                return (
                  <button
                    key={item.pos}
                    type="button"
                    onClick={() => handlePositionSelect(item.pos)}
                    className={`p-1.5 rounded-xl border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm font-black'
                        : 'bg-[#121f17] border-emerald-950 text-neutral-300 hover:bg-[#182a20]'
                    }`}
                    title={lang === 'bn' ? item.labelBn : item.labelEn}
                  >
                    <span className="text-sm block">{item.icon}</span>
                    <span className="text-[9px] block truncate">
                      {lang === 'bn' ? item.labelBn : item.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opacity & Size Controls */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Opacity slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                <span>{lang === 'bn' ? 'স্বচ্ছতা (Opacity):' : 'Opacity:'}</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {Math.round(currentOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={currentOpacity}
                onChange={(e) =>
                  onChange({ ...watermark, opacity: parseFloat(e.target.value) || 0.85 })
                }
                className="w-full accent-emerald-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Size selector */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">
                {lang === 'bn' ? 'সাইজ (Size):' : 'Size:'}
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[#09110d] p-0.5 rounded-lg border border-emerald-950">
                {(['small', 'medium', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onChange({ ...watermark, size: sz })}
                    className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer capitalize ${
                      (watermark.size || 'medium') === sz
                        ? 'bg-emerald-500 text-black shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {sz === 'small' ? (lang === 'bn' ? 'ছোট' : 'S') : sz === 'medium' ? (lang === 'bn' ? 'মাঝারি' : 'M') : (lang === 'bn' ? 'বড়' : 'L')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Live Mini-Preview */}
          <div className="pt-2 border-t border-emerald-950/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{lang === 'bn' ? 'ওয়াটারমার্ক লাইভ প্রিভিউ:' : 'Watermark Live Preview:'}</span>
              </span>
              <span className="text-[9px] text-emerald-400 font-bold">
                ✓ {lang === 'bn' ? 'ভিডিওতে প্রদর্শিত হবে' : 'Active on video'}
              </span>
            </div>

            <div className="relative w-full h-28 rounded-xl overflow-hidden border border-emerald-800/70 bg-gradient-to-br from-neutral-900 via-[#101b15] to-black">
              {previewThumbnailUrl ? (
                <img
                  src={previewThumbnailUrl}
                  alt="Preview"
                  className="w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-600 text-xs font-semibold">
                  {lang === 'bn' ? 'ভিডিও ফ্রেম' : 'Video Frame'}
                </div>
              )}

              {/* Dynamic Watermark rendered inside preview box */}
              <div
                className={`absolute pointer-events-none select-none transition-all duration-200 ${
                  watermark.position === 'top-left'
                    ? 'top-2 left-2'
                    : watermark.position === 'top-right'
                    ? 'top-2 right-2'
                    : watermark.position === 'center'
                    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                    : watermark.position === 'bottom-left'
                    ? 'bottom-2 left-2'
                    : 'bottom-2 right-2'
                }`}
                style={{ opacity: currentOpacity }}
              >
                {watermark.type === 'logo' && watermark.logoUrl ? (
                  <img
                    src={watermark.logoUrl}
                    alt="Logo watermark"
                    className={`object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                      watermark.size === 'small'
                        ? 'h-4 max-w-[50px]'
                        : watermark.size === 'large'
                        ? 'h-7 max-w-[85px]'
                        : 'h-5 max-w-[65px]'
                    }`}
                  />
                ) : (
                  <div
                    className={`flex items-center rounded-full bg-black/70 backdrop-blur-md border border-white/30 shadow-lg tracking-wide ${
                      watermark.size === 'small'
                        ? 'text-[8px] px-1.5 py-0.5 gap-0.5'
                        : watermark.size === 'large'
                        ? 'text-[11px] px-2.5 py-1 gap-1.5 font-black'
                        : 'text-[9px] px-2 py-0.5 gap-1 font-bold'
                    }`}
                    style={{ color: watermark.color || '#ffffff' }}
                  >
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[140px] drop-shadow-sm font-sans">
                      {currentText}
                    </span>
                    <Sparkles className="w-2 h-2 text-amber-300 shrink-0" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
