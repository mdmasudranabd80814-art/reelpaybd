export type ReelCategory =
  | 'সকল'
  | '🔴 লাইভ'
  | 'কমেডি'
  | 'শর্ট ড্রামা'
  | 'শর্ট মুভি'
  | 'গান'
  | 'বিনোদন'
  | 'ট্রেন্ডিং'
  | 'গেমিং'
  | 'রান্না'
  | 'শিক্ষা';

export interface CategoryMeta {
  key: ReelCategory;
  labelBn: string;
  labelEn: string;
  icon: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  badgeHover: string;
  activeBg: string;
  activeText: string;
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryMeta> = {
  সকল: {
    key: 'সকল',
    labelBn: 'সকল',
    labelEn: 'All',
    icon: '✨',
    badgeBg: 'bg-emerald-950/70',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300',
    badgeHover: 'hover:bg-emerald-900/80',
    activeBg: 'bg-[#00c853]',
    activeText: 'text-black',
  },
  '🔴 লাইভ': {
    key: '🔴 লাইভ',
    labelBn: '🔴 লাইভ',
    labelEn: 'Live',
    icon: '🔴',
    badgeBg: 'bg-rose-950/70',
    badgeBorder: 'border-rose-500/40',
    badgeText: 'text-rose-300',
    badgeHover: 'hover:bg-rose-900/80',
    activeBg: 'bg-rose-600',
    activeText: 'text-white',
  },
  কমেডি: {
    key: 'কমেডি',
    labelBn: 'কমেডি',
    labelEn: 'Comedy',
    icon: '🎭',
    badgeBg: 'bg-purple-950/80',
    badgeBorder: 'border-purple-500/50',
    badgeText: 'text-purple-300',
    badgeHover: 'hover:bg-purple-900/80',
    activeBg: 'bg-purple-500',
    activeText: 'text-white',
  },
  'শর্ট ড্রামা': {
    key: 'শর্ট ড্রামা',
    labelBn: 'শর্ট ড্রামা',
    labelEn: 'Short Drama',
    icon: '🎬',
    badgeBg: 'bg-rose-950/80',
    badgeBorder: 'border-rose-500/50',
    badgeText: 'text-rose-300',
    badgeHover: 'hover:bg-rose-900/80',
    activeBg: 'bg-rose-500',
    activeText: 'text-white',
  },
  'শর্ট মুভি': {
    key: 'শর্ট মুভি',
    labelBn: 'শর্ট মুভি',
    labelEn: 'Short Movie',
    icon: '🎥',
    badgeBg: 'bg-indigo-950/80',
    badgeBorder: 'border-indigo-500/50',
    badgeText: 'text-indigo-300',
    badgeHover: 'hover:bg-indigo-900/80',
    activeBg: 'bg-indigo-500',
    activeText: 'text-white',
  },
  গান: {
    key: 'গান',
    labelBn: 'গান',
    labelEn: 'Music',
    icon: '🎵',
    badgeBg: 'bg-pink-950/80',
    badgeBorder: 'border-pink-500/50',
    badgeText: 'text-pink-300',
    badgeHover: 'hover:bg-pink-900/80',
    activeBg: 'bg-pink-500',
    activeText: 'text-white',
  },
  বিনোদন: {
    key: 'বিনোদন',
    labelBn: 'বিনোদন',
    labelEn: 'Entertainment',
    icon: '🌟',
    badgeBg: 'bg-teal-950/80',
    badgeBorder: 'border-teal-500/50',
    badgeText: 'text-teal-300',
    badgeHover: 'hover:bg-teal-900/80',
    activeBg: 'bg-teal-500',
    activeText: 'text-black',
  },
  ট্রেন্ডিং: {
    key: 'ট্রেন্ডিং',
    labelBn: 'ট্রেন্ডিং',
    labelEn: 'Trending',
    icon: '🔥',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-500/50',
    badgeText: 'text-amber-300',
    badgeHover: 'hover:bg-amber-900/80',
    activeBg: 'bg-amber-500',
    activeText: 'text-black',
  },
  গেমিং: {
    key: 'গেমিং',
    labelBn: 'গেমিং',
    labelEn: 'Gaming',
    icon: '🎮',
    badgeBg: 'bg-cyan-950/80',
    badgeBorder: 'border-cyan-500/50',
    badgeText: 'text-cyan-300',
    badgeHover: 'hover:bg-cyan-900/80',
    activeBg: 'bg-cyan-500',
    activeText: 'text-black',
  },
  রান্না: {
    key: 'রান্না',
    labelBn: 'রান্না',
    labelEn: 'Cooking',
    icon: '🍳',
    badgeBg: 'bg-orange-950/80',
    badgeBorder: 'border-orange-500/50',
    badgeText: 'text-orange-300',
    badgeHover: 'hover:bg-orange-900/80',
    activeBg: 'bg-orange-500',
    activeText: 'text-white',
  },
  শিক্ষা: {
    key: 'শিক্ষা',
    labelBn: 'শিক্ষা',
    labelEn: 'Education',
    icon: '📚',
    badgeBg: 'bg-blue-950/80',
    badgeBorder: 'border-blue-500/50',
    badgeText: 'text-blue-300',
    badgeHover: 'hover:bg-blue-900/80',
    activeBg: 'bg-blue-500',
    activeText: 'text-white',
  },
};

export const CATEGORIES_LIST: ReelCategory[] = [
  'সকল',
  '🔴 লাইভ',
  'কমেডি',
  'শর্ট ড্রামা',
  'শর্ট মুভি',
  'গান',
  'বিনোদন',
  'ট্রেন্ডিং',
  'গেমিং',
  'রান্না',
  'শিক্ষা',
];

export const REEL_UPLOAD_CATEGORIES: Array<{ value: Exclude<ReelCategory, '🔴 লাইভ'>; labelBn: string; labelEn: string }> = [
  { value: 'কমেডি', labelBn: '🎭 কমেডি / কমেডিয়ান', labelEn: 'Comedy / Comedian' },
  { value: 'শর্ট ড্রামা', labelBn: '🎬 শর্ট ড্রামা', labelEn: 'Short Drama' },
  { value: 'শর্ট মুভি', labelBn: '🎥 শর্ট মুভি', labelEn: 'Short Movie' },
  { value: 'গান', labelBn: '🎵 গান ও মিউজিক', labelEn: 'Songs & Music' },
  { value: 'বিনোদন', labelBn: '🌟 বিনোদন (৩০ সেকেন্ড)', labelEn: 'Entertainment' },
  { value: 'ট্রেন্ডিং', labelBn: '🔥 ট্রেন্ডিং', labelEn: 'Trending' },
  { value: 'গেমিং', labelBn: '🎮 গেমিং', labelEn: 'Gaming' },
  { value: 'রান্না', labelBn: '🍳 রান্না', labelEn: 'Cooking' },
  { value: 'শিক্ষা', labelBn: '📚 শিক্ষা', labelEn: 'Education' },
  { value: 'সকল', labelBn: '✨ সকল', labelEn: 'All' },
];

export function getCategoryMeta(category?: string): CategoryMeta {
  if (!category) return CATEGORY_DEFINITIONS['সকল'];
  if (CATEGORY_DEFINITIONS[category]) {
    return CATEGORY_DEFINITIONS[category];
  }
  const lower = category.toLowerCase().trim();
  if (lower === 'all') return CATEGORY_DEFINITIONS['সকল'];
  if (lower === 'live') return CATEGORY_DEFINITIONS['🔴 লাইভ'];
  if (lower === 'comedy' || lower === 'comedian') return CATEGORY_DEFINITIONS['কমেডি'];
  if (lower === 'short drama' || lower === 'drama') return CATEGORY_DEFINITIONS['শর্ট ড্রামা'];
  if (lower === 'short movie' || lower === 'movie') return CATEGORY_DEFINITIONS['শর্ট মুভি'];
  if (lower === 'song' || lower === 'music') return CATEGORY_DEFINITIONS['গান'];
  if (lower === 'entertainment') return CATEGORY_DEFINITIONS['বিনোদন'];
  if (lower === 'trending') return CATEGORY_DEFINITIONS['ট্রেন্ডিং'];
  if (lower === 'gaming') return CATEGORY_DEFINITIONS['গেমিং'];
  if (lower === 'cooking' || lower === 'food') return CATEGORY_DEFINITIONS['রান্না'];
  if (lower === 'education' || lower === 'learning') return CATEGORY_DEFINITIONS['শিক্ষা'];

  return {
    key: category as any,
    labelBn: category,
    labelEn: category,
    icon: '🏷️',
    badgeBg: 'bg-neutral-900/80',
    badgeBorder: 'border-neutral-700/60',
    badgeText: 'text-neutral-200',
    badgeHover: 'hover:bg-neutral-800',
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
  };
}
