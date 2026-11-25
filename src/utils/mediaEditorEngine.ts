import { ReelWatermark } from '../types';

export type AspectRatioOption = '9:16' | '1:1' | '4:5' | '16:9';
export type BackgroundMode = 'blur' | 'solid' | 'gradient' | 'image';
export type VfxEffectId =
  | 'none'
  | 'vhs_retro'
  | 'sparkle'
  | 'glitch'
  | 'cinema_bars'
  | 'light_leak'
  | 'film_grain'
  | 'warm_glow'
  | 'camera_shake'
  | 'heart_float'
  | 'rain'
  | 'snow'
  | 'matrix_rain'
  | 'vignette_pulse';

export type ImageMotionPreset = 'ken_burns' | 'pan_horizontal' | 'pulse_beat' | 'static';

export interface TextOverlayItem {
  id: string;
  text: string;
  x: number; // 0..1 normalized center X
  y: number; // 0..1 normalized center Y
  color: string;
  bgColor: string; // 'transparent' or hex
  fontSize: number; // px relative to 720px canvas width
  fontWeight: 'bold' | 'normal';
  align: 'center' | 'left' | 'right';
}

export interface StickerOverlayItem {
  id: string;
  emoji: string;
  x: number; // 0..1 normalized center X
  y: number; // 0..1 normalized center Y
  size: number; // px relative to 720px canvas width
  rotation: number; // degrees
}

export interface MediaEditConfig {
  presetId: string;
  brightness: number; // 50..160 (default 100)
  contrast: number; // 50..160 (default 100)
  saturate: number; // 0..200 (default 100)
  warmth: number; // -100..100 (default 0)
  hueRotate: number; // -180..180 (default 0)
  fade: number; // 0..60 (default 0)
  vignette: number; // 0..100 (default 0)
  grayscale: number; // 0..100 (default 0)
  sepia: number; // 0..100 (default 0)

  aspectRatio: AspectRatioOption;
  fitMode: 'cover' | 'contain';
  scale: number; // 0.5..1.6
  borderRadius: number; // 0..64
  frameBorderWidth: number; // 0..16
  frameBorderColor: string;
  backgroundMode: BackgroundMode;
  backgroundBlur: number; // 6..45
  backgroundColor: string;
  backgroundGradient: [string, string, number];
  backgroundImageUrl?: string;

  chromaKeyEnabled: boolean;
  chromaKeyColor: string;
  chromaKeySimilarity: number; // 15..130
  chromaKeySmoothness: number; // 5..60

  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;

  vfxEffect: VfxEffectId;
  vfxIntensity: number; // 10..100
  imageMotion: ImageMotionPreset;

  texts: TextOverlayItem[];
  stickers: StickerOverlayItem[];

  trimStart: number;
  trimEnd: number;
  playbackRate: number;
  originalVolume: number;
  bgAudioUrl?: string;
  bgAudioName?: string;
  bgAudioVolume: number;
  voiceoverUrl?: string;
  voiceoverName?: string;
  voiceoverVolume: number;
  watermark?: ReelWatermark;
}

export interface ColorPreset {
  id: string;
  nameBn: string;
  nameEn: string;
  swatch: string;
  patch: Partial<MediaEditConfig>;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'normal',
    nameBn: 'স্বাভাবিক',
    nameEn: 'Original',
    swatch: 'linear-gradient(135deg,#334155,#0f172a)',
    patch: {
      brightness: 100,
      contrast: 100,
      saturate: 100,
      warmth: 0,
      hueRotate: 0,
      fade: 0,
      vignette: 0,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'cinematic',
    nameBn: 'সিনেম্যাটিক',
    nameEn: 'Cinematic',
    swatch: 'linear-gradient(135deg,#0f766e,#ea580c)',
    patch: {
      brightness: 98,
      contrast: 124,
      saturate: 115,
      warmth: 18,
      hueRotate: -6,
      fade: 8,
      vignette: 42,
      grayscale: 0,
      sepia: 10,
    },
  },
  {
    id: 'vivid',
    nameBn: 'ভাইব্র্যান্ট প্রো',
    nameEn: 'Vivid Pro',
    swatch: 'linear-gradient(135deg,#10b981,#f59e0b)',
    patch: {
      brightness: 108,
      contrast: 118,
      saturate: 148,
      warmth: 12,
      hueRotate: 0,
      fade: 0,
      vignette: 12,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'golden',
    nameBn: 'গোল্ডেন আওয়ার',
    nameEn: 'Golden Hour',
    swatch: 'linear-gradient(135deg,#fbbf24,#b45309)',
    patch: {
      brightness: 106,
      contrast: 108,
      saturate: 125,
      warmth: 48,
      hueRotate: -4,
      fade: 6,
      vignette: 25,
      grayscale: 0,
      sepia: 22,
    },
  },
  {
    id: 'baul_folk',
    nameBn: 'মাটির ফোক',
    nameEn: 'Bangla Folk',
    swatch: 'linear-gradient(135deg,#92400e,#d97706)',
    patch: {
      brightness: 102,
      contrast: 112,
      saturate: 118,
      warmth: 35,
      hueRotate: -8,
      fade: 10,
      vignette: 32,
      grayscale: 0,
      sepia: 18,
    },
  },
  {
    id: 'moody',
    nameBn: 'মুডি ড্রামা',
    nameEn: 'Moody Drama',
    swatch: 'linear-gradient(135deg,#1e293b,#020617)',
    patch: {
      brightness: 90,
      contrast: 128,
      saturate: 82,
      warmth: -18,
      hueRotate: 0,
      fade: 14,
      vignette: 55,
      grayscale: 15,
      sepia: 0,
    },
  },
  {
    id: 'neon_dhaka',
    nameBn: 'ঢাকা নিয়ন',
    nameEn: 'Dhaka Neon',
    swatch: 'linear-gradient(135deg,#06b6d4,#ec4899)',
    patch: {
      brightness: 104,
      contrast: 126,
      saturate: 162,
      warmth: -25,
      hueRotate: 22,
      fade: 0,
      vignette: 30,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'vintage',
    nameBn: 'ভিন্টেজ ৮০s',
    nameEn: 'Vintage 80s',
    swatch: 'linear-gradient(135deg,#d6c096,#785937)',
    patch: {
      brightness: 102,
      contrast: 96,
      saturate: 85,
      warmth: 30,
      hueRotate: 0,
      fade: 22,
      vignette: 35,
      grayscale: 0,
      sepia: 48,
    },
  },
  {
    id: 'noir',
    nameBn: 'সাদা-কালো নয়ার',
    nameEn: 'B&W Noir',
    swatch: 'linear-gradient(135deg,#e2e8f0,#0f172a)',
    patch: {
      brightness: 102,
      contrast: 135,
      saturate: 0,
      warmth: 0,
      hueRotate: 0,
      fade: 6,
      vignette: 48,
      grayscale: 100,
      sepia: 0,
    },
  },
  {
    id: 'arctic',
    nameBn: 'শীতল ব্লু',
    nameEn: 'Arctic Cool',
    swatch: 'linear-gradient(135deg,#38bdf8,#1e3a8a)',
    patch: {
      brightness: 104,
      contrast: 110,
      saturate: 108,
      warmth: -48,
      hueRotate: 8,
      fade: 4,
      vignette: 18,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'emerald',
    nameBn: 'সবুজ বাংলা',
    nameEn: 'Emerald Bangla',
    swatch: 'linear-gradient(135deg,#10b981,#047857)',
    patch: {
      brightness: 103,
      contrast: 116,
      saturate: 135,
      warmth: -8,
      hueRotate: -15,
      fade: 2,
      vignette: 24,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'cyberpunk',
    nameBn: 'সাইবারপাঙ্ক',
    nameEn: 'Cyberpunk',
    swatch: 'linear-gradient(135deg,#d946ef,#0284c7)',
    patch: {
      brightness: 106,
      contrast: 130,
      saturate: 155,
      warmth: -30,
      hueRotate: 45,
      fade: 0,
      vignette: 35,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'pastel_lofi',
    nameBn: 'সফট লফি',
    nameEn: 'Soft Lofi',
    swatch: 'linear-gradient(135deg,#fed7aa,#f472b6)',
    patch: {
      brightness: 110,
      contrast: 92,
      saturate: 110,
      warmth: 20,
      hueRotate: -10,
      fade: 24,
      vignette: 15,
      grayscale: 0,
      sepia: 8,
    },
  },
  {
    id: 'sepia',
    nameBn: 'নস্টালজিক সেপিয়া',
    nameEn: 'Retro Sepia',
    swatch: 'linear-gradient(135deg,#a16207,#ca8a04)',
    patch: {
      brightness: 100,
      contrast: 105,
      saturate: 70,
      warmth: 50,
      hueRotate: 0,
      fade: 12,
      vignette: 40,
      grayscale: 0,
      sepia: 80,
    },
  },
  {
    id: 'ultra_hdr',
    nameBn: 'আল্ট্রা এইচডিআর',
    nameEn: 'Ultra HDR',
    swatch: 'linear-gradient(135deg,#ef4444,#eab308)',
    patch: {
      brightness: 112,
      contrast: 138,
      saturate: 150,
      warmth: 8,
      hueRotate: 0,
      fade: 0,
      vignette: 20,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    id: 'sunbeam',
    nameBn: 'রৌদ্রোজ্জ্বল',
    nameEn: 'Sunbeam',
    swatch: 'linear-gradient(135deg,#fde047,#ea580c)',
    patch: {
      brightness: 114,
      contrast: 104,
      saturate: 128,
      warmth: 42,
      hueRotate: -5,
      fade: 4,
      vignette: 14,
      grayscale: 0,
      sepia: 12,
    },
  },
];

export interface MusicTrackPreset {
  id: string;
  titleBn: string;
  titleEn: string;
  artistBn: string;
  artistEn: string;
  genreBn: string;
  genreEn: string;
  url: string;
  badge: string;
}

export const PRESET_MUSIC_LIBRARY: MusicTrackPreset[] = [
  {
    id: 'folk_baul',
    titleBn: 'মাটির গান ও বাউল সুর',
    titleEn: 'Bangla Baul Folk Soul',
    artistBn: 'ফোক ফিউশন',
    artistEn: 'Folk Fusion',
    genreBn: 'বাউল ফোক',
    genreEn: 'Folk',
    url: '/videos/ai_song_folk.mp4',
    badge: '🔥 জনপ্রিয়',
  },
  {
    id: 'dhaka_neon',
    titleBn: 'ঢাকা নিয়ন নাইট ড্রিমস',
    titleEn: 'Dhaka Neon Night EDM',
    artistBn: 'ডিজে নিয়ন',
    artistEn: 'DJ Neon',
    genreBn: 'ইলেকট্রো',
    genreEn: 'EDM',
    url: '/videos/ai_trending_neon_music.mp4',
    badge: '⚡ ট্রেন্ডিং',
  },
  {
    id: 'majhi_river',
    titleBn: 'নদীর মাঝি ও ভাটিয়ালী',
    titleEn: 'River Majhi Melody',
    artistBn: 'পদ্মা সুর',
    artistEn: 'River Waves',
    genreBn: 'ভাটিয়ালী',
    genreEn: 'Acoustic',
    url: '/videos/ai_song_majhi.mp4',
    badge: '🌊 শান্ত সুর',
  },
  {
    id: 'concert_rock',
    titleBn: 'লাইভ কনসার্ট রক ভাইব',
    titleEn: 'Live Concert Energy',
    artistBn: 'রক ব্যান্ড',
    artistEn: 'Rock Band',
    genreBn: 'রক',
    genreEn: 'Rock Beat',
    url: '/videos/ai_song_concert.mp4',
    badge: '🎸 এনার্জি',
  },
  {
    id: 'trending_dhaka',
    titleBn: 'ট্রেন্ডিং ঢাকা আরবান বিট',
    titleEn: 'Dhaka Urban Groove',
    artistBn: 'আরবান ঢাকা',
    artistEn: 'Urban Beats',
    genreBn: 'হিপ-হপ',
    genreEn: 'Hip-Hop',
    url: '/videos/ai_trending_dhaka.mp4',
    badge: '🎵 ভাইরাল',
  },
];

export interface BengaliVoiceClip {
  id: string;
  labelBn: string;
  labelEn: string;
  textBn: string;
  url: string;
  duration: string;
}

export const BENGALI_VOICE_CLIPS: BengaliVoiceClip[] = [
  {
    id: 'voice_1',
    labelBn: 'লাইক ও শেয়ার করুন',
    labelEn: 'Like & Share',
    textBn: 'ভিডিওটি ভালো লাগলে লাইক ও শেয়ার করুন',
    url: '/videos/voice_1.mp3',
    duration: '2.5s',
  },
  {
    id: 'voice_2',
    labelBn: 'স্বাগতম বার্তা',
    labelEn: 'Welcome Greeting',
    textBn: 'রিলপে বিডিতে সবাইকে স্বাগতম',
    url: '/videos/voice_2.mp3',
    duration: '3.0s',
  },
  {
    id: 'voice_3',
    labelBn: 'অসাধারণ ক্রিয়েটর',
    labelEn: 'Awesome Creator',
    textBn: 'অসাধারণ ক্রিয়েটর পারফরম্যান্স',
    url: '/videos/voice_3.mp3',
    duration: '2.8s',
  },
  {
    id: 'voice_4',
    labelBn: 'ইনকাম ও পয়েন্ট অফার',
    labelEn: 'Earn with Reels',
    textBn: 'প্রতিদিন রিল দেখুন ও ইনকাম করুন',
    url: '/videos/voice_4.mp3',
    duration: '2.6s',
  },
  {
    id: 'voice_5',
    labelBn: 'নতুন ভিডিওতে ফলো',
    labelEn: 'Follow for Updates',
    textBn: 'নতুন ভিডিও আপডেট পেতে ফলো করুন',
    url: '/videos/voice_5.mp3',
    duration: '2.7s',
  },
];

export const BG_SOLID_COLORS: string[] = [
  '#060a08',
  '#0d1f17',
  '#0f172a',
  '#1f1215',
  '#27272a',
  '#1e1b4b',
  '#450a0a',
  '#f8fafc',
  '#fef3c7',
];

export interface BackgroundGradientPreset {
  id: string;
  labelBn: string;
  labelEn: string;
  value: [string, string, number];
}

export const BG_GRADIENTS: BackgroundGradientPreset[] = [
  { id: 'emerald_night', labelBn: 'এমেরাল্ড নাইট', labelEn: 'Emerald Night', value: ['#042f2e', '#059669', 145] },
  { id: 'sunset_fire', labelBn: 'সানসেট', labelEn: 'Sunset', value: ['#7c2d12', '#f59e0b', 135] },
  { id: 'ocean_deep', labelBn: 'সমুদ্র নীল', labelEn: 'Deep Ocean', value: ['#0c4a6e', '#0f172a', 160] },
  { id: 'crimson_velvet', labelBn: 'ক্রিমসন', labelEn: 'Crimson', value: ['#881337', '#18181b', 140] },
  { id: 'royal_gold', labelBn: 'রয়্যাল গোল্ড', labelEn: 'Royal Gold', value: ['#422006', '#ca8a04', 130] },
  { id: 'arctic_mist', labelBn: 'আর্কটিক', labelEn: 'Arctic', value: ['#1e3a8a', '#06b6d4', 150] },
];

export const VFX_EFFECTS: Array<{ id: VfxEffectId; labelBn: string; labelEn: string; icon: string }> = [
  { id: 'none', labelBn: 'সাধারণ', labelEn: 'None', icon: '○' },
  { id: 'vhs_retro', labelBn: 'ভিএইচএস ৯০s', labelEn: 'VHS 90s', icon: '📼' },
  { id: 'sparkle', labelBn: 'স্পার্কল স্টার', labelEn: 'Sparkles', icon: '✨' },
  { id: 'glitch', labelBn: 'আরজিবি গ্লিচ', labelEn: 'RGB Glitch', icon: '⚡' },
  { id: 'cinema_bars', labelBn: 'সিনেমা বার', labelEn: 'Cinema Bars', icon: '▬' },
  { id: 'light_leak', labelBn: 'লাইট লিক', labelEn: 'Light Leak', icon: '☀' },
  { id: 'film_grain', labelBn: 'ফিল্ম গ্রেইন', labelEn: 'Film Grain', icon: '▒' },
  { id: 'warm_glow', labelBn: 'গোল্ডেন গ্লো', labelEn: 'Warm Glow', icon: '✦' },
  { id: 'camera_shake', labelBn: 'ক্যামেরা শেক', labelEn: 'Camera Shake', icon: '💥' },
  { id: 'heart_float', labelBn: 'লাভ ও ফুল', labelEn: 'Heart & Flora', icon: '🌸' },
  { id: 'rain', labelBn: 'বর্ষার বৃষ্টি', labelEn: 'Rain', icon: '🌧' },
  { id: 'snow', labelBn: 'তুষারপাত', labelEn: 'Snowfall', icon: '❄' },
  { id: 'matrix_rain', labelBn: 'ম্যাট্রিক্স কোড', labelEn: 'Matrix Code', icon: '💚' },
  { id: 'vignette_pulse', labelBn: 'বিট পালস', labelEn: 'Beat Pulse', icon: '◉' },
];

export const STICKER_PACK = [
  '🔥', '✨', '❤️', '😂', '🎬', '🇧🇩', '৳', '💎', '⚡', '👑', '🎵', '🌟', '🎉', '😍', '💯', '🚀',
  '☕', '🛺', '🏏', '👏', '🏆', '💥', '💃', '🎤', '🥰', '🤩', '🙌', '👌', '💰', '🥳', '📸', '🎁'
];

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatioOption, { w: number; h: number; labelBn: string; labelEn: string }> = {
  '9:16': { w: 540, h: 960, labelBn: 'রিলস (9:16)', labelEn: 'Reels 9:16' },
  '1:1': { w: 720, h: 720, labelBn: 'স্কয়ার (1:1)', labelEn: 'Square 1:1' },
  '4:5': { w: 600, h: 750, labelBn: 'পোর্ট্রেট (4:5)', labelEn: 'Portrait 4:5' },
  '16:9': { w: 960, h: 540, labelBn: 'ওয়াইড (16:9)', labelEn: 'Wide 16:9' },
};

export function createDefaultEditConfig(duration = 0): MediaEditConfig {
  return {
    presetId: 'normal',
    brightness: 100,
    contrast: 100,
    saturate: 100,
    warmth: 0,
    hueRotate: 0,
    fade: 0,
    vignette: 0,
    grayscale: 0,
    sepia: 0,

    aspectRatio: '9:16',
    fitMode: 'cover',
    scale: 1,
    borderRadius: 0,
    frameBorderWidth: 0,
    frameBorderColor: '#10b981',
    backgroundMode: 'blur',
    backgroundBlur: 24,
    backgroundColor: '#060a08',
    backgroundGradient: ['#042f2e', '#059669', 145],
    backgroundImageUrl: undefined,

    chromaKeyEnabled: false,
    chromaKeyColor: '#00d800',
    chromaKeySimilarity: 58,
    chromaKeySmoothness: 22,

    rotation: 0,
    flipH: false,
    flipV: false,

    vfxEffect: 'none',
    vfxIntensity: 65,
    imageMotion: 'ken_burns',

    texts: [],
    stickers: [],

    trimStart: 0,
    trimEnd: duration > 0 ? duration : 0,
    playbackRate: 1,
    originalVolume: 1,
    bgAudioUrl: undefined,
    bgAudioName: undefined,
    bgAudioVolume: 0.65,
    voiceoverUrl: undefined,
    voiceoverName: undefined,
    voiceoverVolume: 1,
    watermark: undefined,
  };
}

export function buildCssFilterString(config: MediaEditConfig): string {
  const parts: string[] = [];
  if (config.brightness !== 100) parts.push(`brightness(${config.brightness}%)`);
  if (config.contrast !== 100) parts.push(`contrast(${config.contrast}%)`);
  if (config.saturate !== 100) parts.push(`saturate(${config.saturate}%)`);
  if (config.hueRotate !== 0) parts.push(`hue-rotate(${config.hueRotate}deg)`);
  if (config.grayscale > 0) parts.push(`grayscale(${config.grayscale}%)`);
  const effectiveSepia = Math.min(100, Math.max(0, config.sepia + (config.warmth > 0 ? config.warmth * 0.25 : 0)));
  if (effectiveSepia > 0) parts.push(`sepia(${Math.round(effectiveSepia)}%)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r || 0, g || 0, b || 0];
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return [0, 216, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Offscreen reusable buffers for chroma key & glitch
let chromaCanvas: HTMLCanvasElement | null = null;
let glitchCanvas: HTMLCanvasElement | null = null;
const logoImageCache = new Map<string, HTMLImageElement>();

function getCachedLogoImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  let img = logoImageCache.get(url);
  if (!img) {
    img = new Image();
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = url;
    logoImageCache.set(url, img);
  }
  return img;
}

function drawMediaFit(
  ctx: CanvasRenderingContext2D,
  source: HTMLVideoElement | HTMLImageElement,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  fitMode: 'cover' | 'contain',
  scale: number,
  rotation: 0 | 90 | 180 | 270,
  flipH: boolean,
  flipV: boolean,
  extraOffsetX = 0,
  extraOffsetY = 0
) {
  const isRotated90 = rotation === 90 || rotation === 270;
  const effSrcW = isRotated90 ? srcH : srcW;
  const effSrcH = isRotated90 ? srcW : srcH;

  const baseScale =
    fitMode === 'cover'
      ? Math.max(dstW / effSrcW, dstH / effSrcH)
      : Math.min(dstW / effSrcW, dstH / effSrcH);

  const finalScale = baseScale * scale;
  const drawW = srcW * finalScale;
  const drawH = srcH * finalScale;

  ctx.save();
  ctx.translate(dstW / 2 + extraOffsetX, dstH / 2 + extraOffsetY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(source, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function getProcessedChromaSource(
  source: HTMLVideoElement | HTMLImageElement,
  srcW: number,
  srcH: number,
  config: MediaEditConfig
): HTMLCanvasElement {
  if (!chromaCanvas) {
    chromaCanvas = document.createElement('canvas');
  }
  const maxDim = 420;
  const ratio = Math.min(maxDim / srcW, maxDim / srcH, 1);
  const w = Math.max(2, Math.round(srcW * ratio));
  const h = Math.max(2, Math.round(srcH * ratio));
  if (chromaCanvas.width !== w || chromaCanvas.height !== h) {
    chromaCanvas.width = w;
    chromaCanvas.height = h;
  }
  const cctx = chromaCanvas.getContext('2d', { willReadFrequently: true });
  if (!cctx) return chromaCanvas;

  cctx.clearRect(0, 0, w, h);
  cctx.drawImage(source, 0, 0, w, h);

  try {
    const imgData = cctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const [kr, kg, kb] = hexToRgb(config.chromaKeyColor);
    const sim = config.chromaKeySimilarity;
    const smooth = Math.max(1, config.chromaKeySmoothness);
    const simSq = sim * sim;
    const outerSq = (sim + smooth) * (sim + smooth);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dr = r - kr;
      const dg = g - kg;
      const db = b - kb;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq < simSq) {
        data[i + 3] = 0;
      } else if (distSq < outerSq) {
        const dist = Math.sqrt(distSq);
        const alphaFactor = Math.min(1, Math.max(0, (dist - sim) / smooth));
        data[i + 3] = Math.round(data[i + 3] * alphaFactor);
        // Subtle green spill reduction when keying green
        if (kg > kr && kg > kb && g > r && g > b) {
          data[i + 1] = Math.round(g * (0.7 + 0.3 * alphaFactor));
        }
      }
    }
    cctx.putImageData(imgData, 0, 0);
  } catch {
    // CORS-tainted source cannot read pixels; return canvas as-is
  }
  return chromaCanvas;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  source: HTMLVideoElement | HTMLImageElement | null,
  srcW: number,
  srcH: number,
  config: MediaEditConfig,
  bgImage: HTMLImageElement | null
) {
  if (config.backgroundMode === 'solid') {
    ctx.fillStyle = config.backgroundColor || '#060a08';
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (config.backgroundMode === 'gradient') {
    const [c1, c2, angleDeg] = config.backgroundGradient;
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const x0 = w / 2 - Math.cos(rad) * w * 0.6;
    const y0 = h / 2 - Math.sin(rad) * h * 0.6;
    const x1 = w / 2 + Math.cos(rad) * w * 0.6;
    const y1 = h / 2 + Math.sin(rad) * h * 0.6;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (config.backgroundMode === 'image' && bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    drawMediaFit(
      ctx,
      bgImage,
      bgImage.naturalWidth,
      bgImage.naturalHeight,
      w,
      h,
      'cover',
      1,
      0,
      false,
      false
    );
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // Default: 'blur' background from source media
  ctx.fillStyle = '#090d0b';
  ctx.fillRect(0, 0, w, h);
  if (source && srcW > 0 && srcH > 0) {
    ctx.save();
    ctx.filter = `blur(${Math.max(4, config.backgroundBlur)}px) brightness(0.72) saturate(1.15)`;
    drawMediaFit(
      ctx,
      source,
      srcW,
      srcH,
      w,
      h,
      'cover',
      1.15,
      config.rotation,
      config.flipH,
      config.flipV
    );
    ctx.restore();
  }
}

function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawVfxOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeSec: number,
  effect: VfxEffectId,
  intensityPct: number
) {
  if (effect === 'none') return;
  const alpha = Math.max(0.1, Math.min(1, intensityPct / 100));

  if (effect === 'vhs_retro') {
    ctx.save();
    // Scanlines
    ctx.fillStyle = `rgba(0, 0, 0, ${0.16 * alpha})`;
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }
    // Rolling tracking distortion bar
    const barY = ((timeSec * 0.28) % 1) * h;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.08 * alpha})`;
    ctx.fillRect(0, barY, w, 12);

    // VHS Camcorder green/white font timestamp
    const sec = Math.floor(timeSec % 60);
    const min = Math.floor((timeSec / 60) % 60);
    const timeStr = `00:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    ctx.font = `bold ${Math.round(w * 0.038)}px monospace`;
    ctx.fillStyle = `rgba(34, 197, 94, ${0.9 * alpha})`;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('PLAY ▶ SP', w * 0.06, h * 0.08);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * alpha})`;
    ctx.fillText(timeStr, w * 0.06, h * 0.13);
    ctx.fillText('AUTO TAPE', w * 0.62, h * 0.08);
    ctx.restore();
    return;
  }

  if (effect === 'sparkle') {
    const count = Math.round(28 * (0.4 + 0.6 * alpha));
    ctx.save();
    for (let i = 0; i < count; i++) {
      const px = (((i * 89 + 17) % 97) / 97) * w;
      const py = (((i * 47 + 23) % 89) / 89) * h;
      const phase = timeSec * 3.2 + i * 1.4;
      const size = Math.max(0, Math.sin(phase)) * (w * 0.032);
      if (size > 1.2) {
        ctx.strokeStyle = `rgba(254, 240, 138, ${0.85 * alpha})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(px - size, py);
        ctx.lineTo(px + size, py);
        ctx.moveTo(px, py - size);
        ctx.lineTo(px, py + size);
        ctx.stroke();
        // Center glow dot
        ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }

  if (effect === 'camera_shake') {
    const intensity = 8 * alpha;
    const dx = (Math.sin(timeSec * 35) * 0.6 + Math.cos(timeSec * 21) * 0.4) * intensity;
    const dy = (Math.cos(timeSec * 29) * 0.6 + Math.sin(timeSec * 19) * 0.4) * intensity;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${0.12 * alpha})`;
    ctx.fillRect(0, 0, Math.abs(dx) + 3, h);
    ctx.fillRect(w - Math.abs(dx) - 3, 0, Math.abs(dx) + 3, h);
    ctx.fillRect(0, 0, w, Math.abs(dy) + 3);
    ctx.fillRect(0, h - Math.abs(dy) - 3, w, Math.abs(dy) + 3);
    ctx.restore();
    return;
  }

  if (effect === 'heart_float') {
    const hearts = Math.round(18 * (0.4 + 0.6 * alpha));
    ctx.save();
    ctx.font = `${Math.round(w * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < hearts; i++) {
      const baseX = ((i * 61 + 13) % 91) / 91;
      const speed = 0.12 + ((i * 23) % 7) * 0.02;
      const y = ((1.1 - ((timeSec * speed + i * 0.19) % 1.2))) * h;
      const x = (baseX * w + Math.sin(timeSec * 2 + i) * (w * 0.04) + w) % w;
      const heartOpacity = Math.max(0, Math.min(1, Math.sin((y / h) * Math.PI))) * alpha;
      ctx.globalAlpha = heartOpacity;
      ctx.fillText(i % 2 === 0 ? '❤️' : '🌸', x, y);
    }
    ctx.restore();
    return;
  }

  if (effect === 'matrix_rain') {
    const cols = 16;
    const colW = w / cols;
    ctx.save();
    ctx.font = `bold ${Math.round(colW * 0.7)}px monospace`;
    ctx.textAlign = 'center';
    const glyphs = '০১১২৩৪৫৬৭৮৯০101010৳#@$%&';
    for (let c = 0; c < cols; c++) {
      const speed = 0.2 + ((c * 17) % 5) * 0.08;
      const headY = ((timeSec * speed + (c * 0.23)) % 1.2) * h;
      for (let trail = 0; trail < 7; trail++) {
        const charY = headY - trail * colW * 0.9;
        if (charY >= 0 && charY <= h) {
          const charOpacity = Math.max(0, (1 - trail / 7)) * alpha;
          ctx.fillStyle = trail === 0 ? '#ffffff' : `rgba(34, 197, 94, ${charOpacity})`;
          const charIndex = (Math.floor(timeSec * 6) + c * 3 + trail) % glyphs.length;
          ctx.fillText(glyphs[charIndex], (c + 0.5) * colW, charY);
        }
      }
    }
    ctx.restore();
    return;
  }

  if (effect === 'cinema_bars') {
    const barH = Math.round(h * 0.11 * (0.6 + 0.4 * alpha));
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h - barH, w, barH);
    return;
  }

  if (effect === 'light_leak') {
    const shift = Math.sin(timeSec * 1.4) * w * 0.18;
    const grad = ctx.createRadialGradient(
      w * 0.2 + shift,
      h * 0.22,
      w * 0.04,
      w * 0.25 + shift,
      h * 0.25,
      w * 0.78
    );
    grad.addColorStop(0, `rgba(255, 168, 60, ${0.52 * alpha})`);
    grad.addColorStop(0.45, `rgba(244, 63, 94, ${0.24 * alpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  if (effect === 'warm_glow') {
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.05, w * 0.5, h * 0.48, w * 0.75);
    grad.addColorStop(0, `rgba(253, 224, 71, ${0.28 * alpha})`);
    grad.addColorStop(0.55, `rgba(249, 115, 22, ${0.14 * alpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  if (effect === 'film_grain') {
    const count = Math.round(90 * alpha);
    ctx.save();
    for (let i = 0; i < count; i++) {
      const seed = (i * 9301 + Math.floor(timeSec * 24) * 49297) % 233280;
      const rx = (seed / 233280) * w;
      const ry = (((seed * 7 + i * 131) % 233280) / 233280) * h;
      const bright = i % 2 === 0;
      ctx.fillStyle = bright ? `rgba(255,255,255,${0.16 * alpha})` : `rgba(0,0,0,${0.22 * alpha})`;
      ctx.fillRect(rx, ry, 2, 2);
    }
    // Subtle vertical scratch line
    const scratchX = ((Math.floor(timeSec * 6) * 197) % 100) / 100 * w;
    ctx.strokeStyle = `rgba(255,255,255,${0.09 * alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scratchX, 0);
    ctx.lineTo(scratchX + 2, h);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (effect === 'snow') {
    const flakes = Math.round(45 * (0.4 + 0.6 * alpha));
    ctx.save();
    for (let i = 0; i < flakes; i++) {
      const baseX = ((i * 73 + 19) % 100) / 100;
      const speed = 0.14 + ((i * 37) % 10) * 0.025;
      const y = ((timeSec * speed + (i * 0.17)) % 1.05) * h;
      const x = (baseX * w + Math.sin(timeSec * 1.5 + i) * 16 + w) % w;
      const r = 1.6 + (i % 3) * 1.1;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + 0.4 * alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (effect === 'rain') {
    const drops = Math.round(55 * (0.4 + 0.6 * alpha));
    ctx.save();
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.42 * alpha})`;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < drops; i++) {
      const baseX = ((i * 53 + 11) % 100) / 100;
      const speed = 0.85 + ((i * 29) % 7) * 0.15;
      const y = ((timeSec * speed + (i * 0.11)) % 1.1) * h;
      const x = (baseX * w - y * 0.12 + w * 2) % w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 18 + (i % 3) * 5);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (effect === 'vignette_pulse') {
    const pulse = (Math.sin(timeSec * 6.2) + 1) * 0.5;
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.22, w / 2, h / 2, Math.max(w, h) * 0.72);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${(0.35 + pulse * 0.45) * alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (effect === 'glitch') {
    if (!glitchCanvas) glitchCanvas = document.createElement('canvas');
    if (glitchCanvas.width !== w || glitchCanvas.height !== h) {
      glitchCanvas.width = w;
      glitchCanvas.height = h;
    }
    const gctx = glitchCanvas.getContext('2d');
    if (gctx) {
      gctx.clearRect(0, 0, w, h);
      gctx.drawImage(ctx.canvas, 0, 0, w, h);
      const tick = Math.floor(timeSec * 14);
      const slices = 5;
      for (let i = 0; i < slices; i++) {
        const sy = (((tick * 73 + i * 193) % 85) / 100) * h;
        const sh = Math.max(8, h * 0.045);
        const offset = Math.sin(tick * 3.1 + i * 2.2) * 18 * alpha;
        ctx.drawImage(glitchCanvas, 0, sy, w, sh, offset, sy, w, sh);
      }
      // Subtle scanlines + chromatic tint bars
      ctx.fillStyle = `rgba(6, 182, 212, ${0.12 * alpha})`;
      ctx.fillRect(0, ((tick * 41) % 90) / 100 * h, w, 4);
      ctx.fillStyle = `rgba(244, 63, 94, ${0.12 * alpha})`;
      ctx.fillRect(0, ((tick * 67) % 90) / 100 * h, w, 3);
    }
  }
}

export function renderEditedFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  source: HTMLVideoElement | HTMLImageElement | null,
  config: MediaEditConfig,
  timeSec: number,
  options?: {
    isImageSource?: boolean;
    bgImage?: HTMLImageElement | null;
    selectedOverlayId?: string | null;
  }
) {
  const isImageSource = Boolean(options?.isImageSource);
  const bgImage = options?.bgImage || null;
  const selectedOverlayId = options?.selectedOverlayId || null;

  const srcW =
    source instanceof HTMLVideoElement
      ? source.videoWidth || 0
      : source instanceof HTMLImageElement
      ? source.naturalWidth || 0
      : 0;
  const srcH =
    source instanceof HTMLVideoElement
      ? source.videoHeight || 0
      : source instanceof HTMLImageElement
      ? source.naturalHeight || 0
      : 0;

  ctx.clearRect(0, 0, w, h);

  // 1. Background layer
  drawBackground(ctx, w, h, source, srcW, srcH, config, bgImage);

  // 2. Foreground media
  if (source && srcW > 0 && srcH > 0) {
    let fgSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement = source;
    let fgW = srcW;
    let fgH = srcH;

    if (config.chromaKeyEnabled) {
      const processed = getProcessedChromaSource(source, srcW, srcH, config);
      fgSource = processed;
      fgW = processed.width;
      fgH = processed.height;
    }

    // Image Motion calculation
    let motionScale = config.scale;
    let offsetX = 0;
    let offsetY = 0;
    if (isImageSource && config.imageMotion !== 'static') {
      if (config.imageMotion === 'ken_burns') {
        const cycle = (Math.sin(timeSec * 0.7) + 1) * 0.5;
        motionScale *= 1 + cycle * 0.12;
        offsetX = Math.sin(timeSec * 0.5) * w * 0.015;
        offsetY = Math.cos(timeSec * 0.45) * h * 0.012;
      } else if (config.imageMotion === 'pan_horizontal') {
        motionScale *= 1.12;
        offsetX = Math.sin(timeSec * 0.85) * w * 0.05;
      } else if (config.imageMotion === 'pulse_beat') {
        const beat = Math.pow(Math.max(0, Math.sin(timeSec * 4.5)), 4);
        motionScale *= 1 + beat * 0.06;
      }
    }

    const pad = config.fitMode === 'contain' && config.scale < 1 ? (1 - config.scale) * 0.35 : 0;
    const frameX = Math.round(w * pad);
    const frameY = Math.round(h * pad);
    const frameW = w - frameX * 2;
    const frameH = h - frameY * 2;

    ctx.save();
    if (config.borderRadius > 0 || config.fitMode === 'contain') {
      drawRoundedRectPath(ctx, frameX, frameY, frameW, frameH, config.borderRadius);
      ctx.clip();
    }

    const cssFilter = buildCssFilterString(config);
    ctx.filter = cssFilter;

    // Draw foreground
    drawMediaFit(
      ctx,
      fgSource as HTMLVideoElement | HTMLImageElement,
      fgW,
      fgH,
      w,
      h,
      config.fitMode,
      motionScale,
      config.rotation,
      config.flipH,
      config.flipV,
      offsetX,
      offsetY
    );

    ctx.filter = 'none';

    // Warmth color temperature tint
    if (config.warmth !== 0) {
      const strength = Math.min(0.28, (Math.abs(config.warmth) / 100) * 0.28);
      ctx.fillStyle =
        config.warmth > 0
          ? `rgba(255, 145, 25, ${strength})`
          : `rgba(56, 189, 248, ${strength})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Fade / matte shadow lift
    if (config.fade > 0) {
      ctx.fillStyle = `rgba(28, 32, 38, ${Math.min(0.45, config.fade / 120)})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();

    // Optional rounded border frame
    if (config.frameBorderWidth > 0) {
      ctx.save();
      drawRoundedRectPath(
        ctx,
        frameX + config.frameBorderWidth / 2,
        frameY + config.frameBorderWidth / 2,
        frameW - config.frameBorderWidth,
        frameH - config.frameBorderWidth,
        Math.max(0, config.borderRadius - config.frameBorderWidth / 2)
      );
      ctx.strokeStyle = config.frameBorderColor || '#10b981';
      ctx.lineWidth = config.frameBorderWidth;
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. Vignette
  if (config.vignette > 0) {
    const vAlpha = Math.min(0.88, (config.vignette / 100) * 0.85);
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.24, w / 2, h / 2, Math.max(w, h) * 0.72);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${vAlpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // 4. VFX Effect
  drawVfxOverlay(ctx, w, h, timeSec, config.vfxEffect, config.vfxIntensity);

  // 5. Text Overlays
  const scaleFactor = w / 720;
  for (const item of config.texts) {
    const px = item.x * w;
    const py = item.y * h;
    const fontPx = Math.max(14, Math.round(item.fontSize * scaleFactor));
    ctx.save();
    ctx.font = `${item.fontWeight === 'bold' ? '700' : '500'} ${fontPx}px 'Hind Siliguri', 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.textAlign = item.align;
    ctx.textBaseline = 'middle';

    const lines = item.text.split('\n');
    const lineHeight = fontPx * 1.25;
    const totalH = lines.length * lineHeight;
    let maxLineW = 0;
    for (const ln of lines) {
      maxLineW = Math.max(maxLineW, ctx.measureText(ln).width);
    }

    const padX = Math.round(fontPx * 0.45);
    const padY = Math.round(fontPx * 0.25);
    let boxX = px - maxLineW / 2 - padX;
    if (item.align === 'left') boxX = px - padX;
    if (item.align === 'right') boxX = px - maxLineW - padX;
    const boxY = py - totalH / 2 - padY;
    const boxW = maxLineW + padX * 2;
    const boxH = totalH + padY * 2;

    if (item.bgColor && item.bgColor !== 'transparent') {
      ctx.fillStyle = item.bgColor;
      drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, Math.round(fontPx * 0.35));
      ctx.fill();
    }

    ctx.shadowColor = 'rgba(0,0,0,0.72)';
    ctx.shadowBlur = Math.max(2, fontPx * 0.14);
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = item.color || '#ffffff';

    lines.forEach((ln, idx) => {
      const ly = py - totalH / 2 + lineHeight * (idx + 0.5);
      ctx.fillText(ln, px, ly);
    });

    if (selectedOverlayId === item.id) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(boxX - 4, boxY - 4, boxW + 8, boxH + 8);
    }
    ctx.restore();
  }

  // 6. Sticker Overlays
  for (const st of config.stickers) {
    const px = st.x * w;
    const py = st.y * h;
    const sPx = Math.max(20, Math.round(st.size * scaleFactor));
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((st.rotation * Math.PI) / 180);
    ctx.font = `${sPx}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.emoji, 0, 0);

    if (selectedOverlayId === st.id) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-sPx * 0.65, -sPx * 0.65, sPx * 1.3, sPx * 1.3);
    }
    ctx.restore();
  }

  // 7. Watermark Overlay Protection
  if (config.watermark && config.watermark.enabled) {
    const wm = config.watermark;
    const opacity = Math.max(0.1, Math.min(1, wm.opacity ?? 0.85));
    ctx.save();
    ctx.globalAlpha = opacity;

    if (wm.type === 'logo' && wm.logoUrl) {
      const logoImg = getCachedLogoImage(wm.logoUrl);
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const baseH = wm.size === 'small' ? 32 : wm.size === 'large' ? 68 : 48;
        const targetH = Math.round(baseH * scaleFactor);
        const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
        const targetW = Math.round(targetH * aspect);
        const margin = Math.round(24 * scaleFactor);

        let lx = w - targetW - margin;
        let ly = h - targetH - margin;
        if (wm.position === 'top-left') {
          lx = margin;
          ly = margin;
        } else if (wm.position === 'top-right') {
          lx = w - targetW - margin;
          ly = margin;
        } else if (wm.position === 'bottom-left') {
          lx = margin;
          ly = h - targetH - margin;
        } else if (wm.position === 'center') {
          lx = (w - targetW) / 2;
          ly = (h - targetH) / 2;
        }

        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = Math.round(8 * scaleFactor);
        ctx.drawImage(logoImg, lx, ly, targetW, targetH);
      }
    } else {
      const text = wm.text?.trim() || 'ReelPay BD';
      const baseFontPx = wm.size === 'small' ? 16 : wm.size === 'large' ? 28 : 22;
      const fontPx = Math.max(12, Math.round(baseFontPx * scaleFactor));
      ctx.font = `800 ${fontPx}px 'Hind Siliguri', 'Plus Jakarta Sans', system-ui, sans-serif`;

      const badgeText = `🛡️ ${text}`;
      const textMetrics = ctx.measureText(badgeText);
      const textW = textMetrics.width;
      const padX = Math.round(fontPx * 0.65);
      const padY = Math.round(fontPx * 0.35);
      const badgeW = textW + padX * 2;
      const badgeH = fontPx * 1.45 + padY * 2;
      const margin = Math.round(24 * scaleFactor);

      let bx = w - badgeW - margin;
      let by = h - badgeH - margin;
      if (wm.position === 'top-left') {
        bx = margin;
        by = margin;
      } else if (wm.position === 'top-right') {
        bx = w - badgeW - margin;
        by = margin;
      } else if (wm.position === 'bottom-left') {
        bx = margin;
        by = h - badgeH - margin;
      } else if (wm.position === 'center') {
        bx = (w - badgeW) / 2;
        by = (h - badgeH) / 2;
      }

      // Rounded pill background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = Math.round(6 * scaleFactor);
      drawRoundedRectPath(ctx, bx, by, badgeW, badgeH, Math.round(badgeH / 2));
      ctx.fill();

      // Border outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = Math.max(1, Math.round(1.5 * scaleFactor));
      ctx.stroke();

      // Text inside
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = wm.color || '#ffffff';
      ctx.fillText(badgeText, bx + padX, by + badgeH / 2);
    }

    ctx.restore();
  }
}

export async function exportEditedImage(
  image: HTMLImageElement,
  config: MediaEditConfig,
  bgImage?: HTMLImageElement | null
): Promise<{ blob: Blob; dataUrl: string; file: File }> {
  const dims = ASPECT_RATIO_DIMENSIONS[config.aspectRatio];
  const canvas = document.createElement('canvas');
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  renderEditedFrame(ctx, dims.w, dims.h, image, config, 0.5, {
    isImageSource: true,
    bgImage,
  });

  // Compress until <= 180KB so Firestore thumbnailUrl limit (200KB) never fails
  let quality = 0.88;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 180000 && quality > 0.42) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], `edited_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
  return { blob, dataUrl, file };
}

export async function exportCanvasThumbnail(
  source: HTMLVideoElement | HTMLImageElement,
  config: MediaEditConfig,
  isImageSource: boolean,
  bgImage?: HTMLImageElement | null
): Promise<string> {
  const dims = ASPECT_RATIO_DIMENSIONS[config.aspectRatio];
  const scale = 0.6;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(dims.w * scale);
  canvas.height = Math.round(dims.h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  renderEditedFrame(ctx, canvas.width, canvas.height, source, config, 0.5, {
    isImageSource,
    bgImage,
  });

  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 175000 && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
}

function getSupportedRecorderMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

export async function exportEditedVideo(
  videoUrl: string,
  config: MediaEditConfig,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
  bgImage?: HTMLImageElement | null
): Promise<{ blob: Blob; file: File; thumbnailDataUrl: string }> {
  const dims = ASPECT_RATIO_DIMENSIONS[config.aspectRatio];
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = dims.w;
  exportCanvas.height = dims.h;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const vid = document.createElement('video');
  vid.crossOrigin = 'anonymous';
  vid.playsInline = true;
  vid.preload = 'auto';
  vid.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    const onLoaded = () => resolve();
    const onErr = () => reject(new Error('Failed to load video for rendering'));
    vid.addEventListener('loadeddata', onLoaded, { once: true });
    vid.addEventListener('error', onErr, { once: true });
  });

  const totalDur = Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 10;
  const startSec = Math.max(0, Math.min(config.trimStart || 0, totalDur - 0.5));
  const endSec =
    config.trimEnd && config.trimEnd > startSec + 0.3
      ? Math.min(config.trimEnd, totalDur)
      : totalDur;
  const clipDuration = Math.max(0.5, endSec - startSec);
  const rate = config.playbackRate || 1;

  vid.currentTime = startSec;
  await new Promise<void>((resolve) => {
    vid.addEventListener('seeked', () => resolve(), { once: true });
    setTimeout(resolve, 600);
  });

  // Setup Audio Mixing
  let audioCtx: AudioContext | null = null;
  let bgAudioEl: HTMLAudioElement | null = null;
  let voiceoverEl: HTMLAudioElement | null = null;
  const stream = exportCanvas.captureStream(30);

  try {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextCtor) {
      audioCtx = new AudioContextCtor();
      const dest = audioCtx.createMediaStreamDestination();

      // Original video audio
      if (config.originalVolume > 0) {
        try {
          const vidSource = audioCtx.createMediaElementSource(vid);
          const vidGain = audioCtx.createGain();
          vidGain.gain.value = config.originalVolume;
          vidSource.connect(vidGain);
          vidGain.connect(dest);
        } catch {
          // Ignore if video has no audio track or CORS restricted
        }
      } else {
        vid.muted = true;
      }

      // Background audio track
      if (config.bgAudioUrl && config.bgAudioVolume > 0) {
        bgAudioEl = new Audio(config.bgAudioUrl);
        bgAudioEl.crossOrigin = 'anonymous';
        bgAudioEl.loop = true;
        try {
          const bgSource = audioCtx.createMediaElementSource(bgAudioEl);
          const bgGain = audioCtx.createGain();
          bgGain.gain.value = config.bgAudioVolume;
          bgSource.connect(bgGain);
          bgGain.connect(dest);
        } catch {
          // Ignore audio connect issues
        }
      }

      // Voiceover audio track
      if (config.voiceoverUrl && (config.voiceoverVolume ?? 1) > 0) {
        voiceoverEl = new Audio(config.voiceoverUrl);
        voiceoverEl.crossOrigin = 'anonymous';
        try {
          const voSource = audioCtx.createMediaElementSource(voiceoverEl);
          const voGain = audioCtx.createGain();
          voGain.gain.value = config.voiceoverVolume ?? 1;
          voSource.connect(voGain);
          voGain.connect(dest);
        } catch {
          // Ignore voiceover connect issues
        }
      }

      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
  } catch {
    vid.muted = config.originalVolume === 0;
  }

  const mimeType = getSupportedRecorderMimeType();
  const recorder = new MediaRecorder(
    stream,
    mimeType ? { mimeType, videoBitsPerSecond: 2_600_000 } : { videoBitsPerSecond: 2_600_000 }
  );

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  let thumbnailDataUrl = '';
  let rafId = 0;
  let stopped = false;

  const stopAll = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(rafId);
    try {
      vid.pause();
    } catch {}
    try {
      bgAudioEl?.pause();
    } catch {}
    try {
      voiceoverEl?.pause();
    } catch {}
    if (recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {}
    }
    try {
      audioCtx?.close();
    } catch {}
  };

  if (signal) {
    signal.addEventListener('abort', stopAll, { once: true });
  }

  const resultPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      if (signal?.aborted) {
        reject(new Error('Render cancelled'));
        return;
      }
      const outType = mimeType || 'video/webm';
      resolve(new Blob(chunks, { type: outType }));
    };
    recorder.onerror = () => reject(new Error('MediaRecorder error'));
  });

  vid.playbackRate = rate;
  recorder.start(250);
  await vid.play().catch(() => {});
  if (bgAudioEl) {
    bgAudioEl.play().catch(() => {});
  }
  if (voiceoverEl) {
    voiceoverEl.currentTime = 0;
    voiceoverEl.play().catch(() => {});
  }

  const startWall = performance.now();

  const tick = () => {
    if (stopped || signal?.aborted) return;

    const currentMediaTime = vid.currentTime;
    const elapsedMedia = Math.max(0, currentMediaTime - startSec);
    const pct = Math.min(99, Math.round((elapsedMedia / clipDuration) * 100));
    onProgress(pct);

    const animTime = (performance.now() - startWall) / 1000;
    renderEditedFrame(ctx, dims.w, dims.h, vid, config, animTime, {
      isImageSource: false,
      bgImage,
    });

    if (!thumbnailDataUrl && pct >= 15) {
      let q = 0.8;
      let thumb = exportCanvas.toDataURL('image/jpeg', q);
      while (thumb.length > 175000 && q > 0.4) {
        q -= 0.1;
        thumb = exportCanvas.toDataURL('image/jpeg', q);
      }
      thumbnailDataUrl = thumb;
    }

    if (currentMediaTime >= endSec || vid.ended) {
      onProgress(100);
      stopAll();
      return;
    }
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  const blob = await resultPromise;
  if (!thumbnailDataUrl) {
    thumbnailDataUrl = await exportCanvasThumbnail(vid, config, false, bgImage);
  }
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([blob], `master_reel_${Date.now()}.${ext}`, { type: blob.type });
  return { blob, file, thumbnailDataUrl };
}

export async function exportImageAsVideo(
  image: HTMLImageElement,
  config: MediaEditConfig,
  durationSec = 6,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
  bgImage?: HTMLImageElement | null
): Promise<{ blob: Blob; file: File; thumbnailDataUrl: string }> {
  const dims = ASPECT_RATIO_DIMENSIONS[config.aspectRatio];
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = dims.w;
  exportCanvas.height = dims.h;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const stream = exportCanvas.captureStream(30);
  let audioCtx: AudioContext | null = null;
  let bgAudioEl: HTMLAudioElement | null = null;
  let voiceoverEl: HTMLAudioElement | null = null;

  if ((config.bgAudioUrl && config.bgAudioVolume > 0) || (config.voiceoverUrl && (config.voiceoverVolume ?? 1) > 0)) {
    try {
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) {
        audioCtx = new AudioContextCtor();
        const dest = audioCtx.createMediaStreamDestination();

        if (config.bgAudioUrl && config.bgAudioVolume > 0) {
          bgAudioEl = new Audio(config.bgAudioUrl);
          bgAudioEl.crossOrigin = 'anonymous';
          bgAudioEl.loop = true;
          const bgSrc = audioCtx.createMediaElementSource(bgAudioEl);
          const gain = audioCtx.createGain();
          gain.gain.value = config.bgAudioVolume;
          bgSrc.connect(gain);
          gain.connect(dest);
        }

        if (config.voiceoverUrl && (config.voiceoverVolume ?? 1) > 0) {
          voiceoverEl = new Audio(config.voiceoverUrl);
          voiceoverEl.crossOrigin = 'anonymous';
          const voSrc = audioCtx.createMediaElementSource(voiceoverEl);
          const gain = audioCtx.createGain();
          gain.gain.value = config.voiceoverVolume ?? 1;
          voSrc.connect(gain);
          gain.connect(dest);
        }

        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      }
    } catch {
      // Ignore audio attach error
    }
  }

  const mimeType = getSupportedRecorderMimeType();
  const recorder = new MediaRecorder(
    stream,
    mimeType ? { mimeType, videoBitsPerSecond: 2_400_000 } : { videoBitsPerSecond: 2_400_000 }
  );
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  let rafId = 0;
  let stopped = false;

  const stopAll = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(rafId);
    try {
      bgAudioEl?.pause();
    } catch {}
    try {
      voiceoverEl?.pause();
    } catch {}
    if (recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {}
    }
    try {
      audioCtx?.close();
    } catch {}
  };

  if (signal) {
    signal.addEventListener('abort', stopAll, { once: true });
  }

  const resultPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      if (signal?.aborted) {
        reject(new Error('Render cancelled'));
        return;
      }
      resolve(new Blob(chunks, { type: mimeType || 'video/webm' }));
    };
    recorder.onerror = () => reject(new Error('MediaRecorder error'));
  });

  recorder.start(250);
  if (bgAudioEl) bgAudioEl.play().catch(() => {});
  if (voiceoverEl) {
    voiceoverEl.currentTime = 0;
    voiceoverEl.play().catch(() => {});
  }

  const startMs = performance.now();
  let thumbnailDataUrl = '';

  const tick = () => {
    if (stopped || signal?.aborted) return;
    const elapsed = (performance.now() - startMs) / 1000;
    const pct = Math.min(99, Math.round((elapsed / durationSec) * 100));
    onProgress(pct);

    renderEditedFrame(ctx, dims.w, dims.h, image, config, elapsed, {
      isImageSource: true,
      bgImage,
    });

    if (!thumbnailDataUrl && pct >= 10) {
      let q = 0.82;
      let thumb = exportCanvas.toDataURL('image/jpeg', q);
      while (thumb.length > 175000 && q > 0.4) {
        q -= 0.1;
        thumb = exportCanvas.toDataURL('image/jpeg', q);
      }
      thumbnailDataUrl = thumb;
    }

    if (elapsed >= durationSec) {
      onProgress(100);
      stopAll();
      return;
    }
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  const blob = await resultPromise;
  if (!thumbnailDataUrl) {
    thumbnailDataUrl = await exportCanvasThumbnail(image, config, true, bgImage);
  }
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([blob], `photo_reel_${Date.now()}.${ext}`, { type: blob.type });
  return { blob, file, thumbnailDataUrl };
}
