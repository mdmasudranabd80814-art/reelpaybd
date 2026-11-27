const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string | undefined | null, lang: 'bn' | 'en' = 'bn'): string {
  if (num === undefined || num === null) return lang === 'en' ? '0' : '০';
  const str = String(num);
  if (lang === 'en') return str;
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)] || digit);
}

export function formatTaka(amount: number, lang: 'bn' | 'en' = 'bn'): string {
  if (lang === 'en') {
    return `৳${amount.toLocaleString('en-US')}`;
  }
  return `৳${toBengaliNumber(amount, 'bn')}`;
}

export function formatPoints(points: number, lang: 'bn' | 'en' = 'bn'): string {
  if (lang === 'en') {
    return `${points.toLocaleString('en-US')} Points`;
  }
  return `${toBengaliNumber(points, 'bn')} পয়েন্ট`;
}

export function formatRelativeTime(dateInput?: string | number | null, lang: 'bn' | 'en' = 'bn'): string {
  if (!dateInput) {
    return lang === 'bn' ? 'সম্প্রতি' : 'Recently';
  }
  const timestamp = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
  if (!Number.isFinite(timestamp)) {
    return lang === 'bn' ? 'সম্প্রতি' : 'Recently';
  }
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) {
    return lang === 'bn' ? 'এইমাত্র' : 'Just now';
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return lang === 'bn' ? `${toBengaliNumber(diffMinutes, 'bn')} মি.` : `${diffMinutes}m`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return lang === 'bn' ? `${toBengaliNumber(diffHours, 'bn')} ঘ.` : `${diffHours}h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return lang === 'bn' ? `${toBengaliNumber(diffDays, 'bn')} দিন` : `${diffDays}d`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return lang === 'bn' ? `${toBengaliNumber(diffMonths, 'bn')} মাস` : `${diffMonths}mo`;
  }
  const diffYears = Math.floor(diffMonths / 12);
  return lang === 'bn' ? `${toBengaliNumber(diffYears, 'bn')} বছর` : `${diffYears}y`;
}
