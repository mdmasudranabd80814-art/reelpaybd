export const DEFAULT_FALLBACK_VIDEOS = [
  '/videos/reel_taka_earn.mp4',
  '/videos/reel_bkash_cashout.mp4',
  '/videos/reel_creator_star.mp4',
  '/videos/reel_daily_bonus.mp4',
  '/videos/reel_livestream_gift.mp4',
];

/**
 * Extracts YouTube video ID from various YouTube URL formats (standard, shorts, embed, youtu.be).
 */
export function extractYouTubeId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Checks if a URL is a YouTube link.
 */
export function isYouTubeUrl(url?: string | null): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Extracts Vimeo video ID.
 */
export function extractVimeoId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+))/);
  return match ? match[1] : null;
}

/**
 * Checks if a URL is a Vimeo link.
 */
export function isVimeoUrl(url?: string | null): boolean {
  return extractVimeoId(url) !== null;
}

/**
 * Checks if a given video URL is known to be the old broken Google bucket or coverr.co URLs.
 */
export function isBrokenVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('commondatastorage.googleapis.com') ||
    lower.includes('gtv-videos-bucket') ||
    lower.includes('coverr.co')
  );
}

/**
 * Normalizes video URLs ONLY for system initial sample reels if they contain broken sample buckets.
 * User-provided videos (blob:, data:, local:, http:, https:, youtube) are preserved untouched!
 */
export function normalizeVideoUrl(url?: string | null, fallbackIndex = 0): string | undefined {
  if (!url) return undefined;
  if (isBrokenVideoUrl(url)) {
    const fallback = DEFAULT_FALLBACK_VIDEOS[Math.abs(fallbackIndex) % DEFAULT_FALLBACK_VIDEOS.length];
    return fallback;
  }
  return url.trim();
}
