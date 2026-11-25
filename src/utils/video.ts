export const DEFAULT_FALLBACK_VIDEOS = [
  '/videos/ai_comedian_stage.mp4',
  '/videos/ai_comedian_village.mp4',
  '/videos/ai_drama_rain.mp4',
  '/videos/ai_drama_campus.mp4',
  '/videos/ai_movie_detective.mp4',
  '/videos/ai_movie_hero.mp4',
  '/videos/ai_song_concert.mp4',
  '/videos/ai_song_folk.mp4',
  '/videos/ai_song_majhi.mp4',
  '/videos/ai_ent_morar.mp4',
  '/videos/ai_ent_prabhat.mp4',
  '/videos/ai_comedy_tea_stall.mp4',
  '/videos/ai_comedy_standup.mp4',
  '/videos/ai_comedy_cat_boss.mp4',
  '/videos/ai_comedy_rickshaw.mp4',
  '/videos/ai_comedy_cricket.mp4',
  '/videos/ai_trending_dhaka.mp4',
  '/videos/ai_trending_neon_music.mp4',
  '/videos/ai_training_fitness.mp4',
  '/videos/ai_training_freelance.mp4',
  '/videos/ai_training_cricket.mp4',
  '/videos/ai_training_camera.mp4',
  '/videos/ai_gaming_esports.mp4',
  '/videos/ai_gaming_vr.mp4',
  '/videos/ai_cooking_biryani.mp4',
  '/videos/ai_cooking_streetfood.mp4',
  '/videos/ai_education_tech.mp4',
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
