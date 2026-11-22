export type ReelCategory =
  | 'সকল'
  | '🔴 লাইভ'
  | 'ট্রেন্ডিং'
  | 'কমেডি'
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
  'ট্রেন্ডিং',
  'কমেডি',
  'গেমিং',
  'রান্না',
  'শিক্ষা',
];

export function getCategoryMeta(category?: string): CategoryMeta {
  if (!category) return CATEGORY_DEFINITIONS['সকল'];
  if (CATEGORY_DEFINITIONS[category]) {
    return CATEGORY_DEFINITIONS[category];
  }
  // Try English mapping if matched
  const lower = category.toLowerCase().trim();
  if (lower === 'all') return CATEGORY_DEFINITIONS['সকল'];
  if (lower === 'live') return CATEGORY_DEFINITIONS['🔴 লাইভ'];
  if (lower === 'trending') return CATEGORY_DEFINITIONS['ট্রেন্ডিং'];
  if (lower === 'comedy') return CATEGORY_DEFINITIONS['কমেডি'];
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
