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

