import React from 'react';
import { Plus, Radio, Flame, Play, BookOpen, Film, Check } from 'lucide-react';
import { LiveStream, Reel, UserStory } from '../types';
import { toBengaliNumber } from '../utils/bengali';

const DEFAULT_AVATAR_URL = '/images/masud_rana_avatar.jpg';

interface FacebookStoriesRowProps {
  stories: UserStory[];
  reels: Reel[];
  activeLiveStreams: LiveStream[];
  currentUserAvatar?: string;
  currentUserName?: string;
  appLogoUrl?: string;
  isAuthenticated: boolean;
  onCreateStory: () => void;
  onOpenStory: (index: number) => void;
  onOpenReel: (reel: Reel) => void;
  onJoinLive: (liveId: string) => void;
  onViewAllLive: () => void;
  lang: 'bn' | 'en';
}

export const FacebookStoriesRow: React.FC<FacebookStoriesRowProps> = ({
  stories,
  reels,
  activeLiveStreams,
  currentUserAvatar,
  currentUserName,
  appLogoUrl,
  isAuthenticated,
  onCreateStory,
  onOpenStory,
  onOpenReel,
  onJoinLive,
  onViewAllLive,
  lang,
}) => {
  // Only include reels in the story bar if they explicitly opted into Story (shareToStory === true)
  // and do not already have a synced UserStory doc (or fallback demo reels when zero stories exist)
  const fallbackStoryReels = React.useMemo(() => {
    const nowMs = Date.now();
    const linkedIds = new Set(stories.map((s) => s.linkedReelId).filter(Boolean) as string[]);

    const explicitOptInReels = reels.filter(
      (r) =>
        r.shareToStory === true &&
        !linkedIds.has(r.id) &&
        (!r.storyExpiresAt || new Date(r.storyExpiresAt).getTime() > nowMs)
    );

    if (stories.length > 0 || explicitOptInReels.length > 0) {
      return explicitOptInReels.slice(0, 8);
    }

    // When no user stories exist yet, show curated built-in featured demo reels (never user-uploaded shareToStory=false reels)
    const seenCreators = new Set<string>();
    const picked: Reel[] = [];
    for (const r of reels) {
      if (r.shareToStory === false) continue;
      if (r.id.startsWith('reel_') && !r.id.startsWith('reel_app_')) continue;
      if (!r.thumbnailUrl && !r.videoUrl) continue;
      if (!seenCreators.has(r.userId) || picked.length < 6) {
        seenCreators.add(r.userId);
        picked.push(r);
      }
      if (picked.length >= 8) break;
    }
    return picked;
  }, [stories, reels]);

  const createCardImage =
    isAuthenticated && currentUserAvatar
      ? currentUserAvatar
      : appLogoUrl || '/images/app_logo.jpg';

  return (
    <section
      aria-label={lang === 'bn' ? 'হিস্টরি এবং সরাসরি লাইভ' : 'Stories and Live Streams'}
      className="bg-[#101914] border border-emerald-950/80 rounded-2xl py-3 shadow-md"
    >
      <div className="px-3.5 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#00e676]" />
          <h2 className="text-xs font-extrabold text-slate-100 tracking-wide">
            {lang === 'bn' ? 'হিস্টরি ও লাইভ' : 'Stories & Live'}
          </h2>
          {stories.length > 0 && (
            <span className="text-[10px] font-bold text-emerald-400 tabular-nums">
              ({toBengaliNumber(stories.length, lang)})
            </span>
          )}
        </div>

        {activeLiveStreams.length > 0 && (
          <button
            type="button"
            onClick={onViewAllLive}
            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer transition"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>
              {toBengaliNumber(activeLiveStreams.length, lang)}{' '}
              {lang === 'bn' ? 'টি লাইভ চলছে' : 'Live now'}
            </span>
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-3.5">
        {/* Card 1: Create Story (+ হিস্টরি দিন) */}
        <button
          type="button"
          onClick={onCreateStory}
          className="w-[98px] h-[160px] rounded-2xl overflow-hidden bg-[#15241b] border border-emerald-900/60 hover:border-[#00c853]/70 shrink-0 relative flex flex-col cursor-pointer group transition active:scale-[0.98] text-left"
        >
          <div className="h-[66%] w-full overflow-hidden bg-[#0c1410] relative">
            <img
              src={createCardImage}
              alt={currentUserName || 'ReelPay BD'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR_URL;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          </div>
          <div className="flex-1 w-full bg-[#15241b] relative flex flex-col items-center justify-end pb-2 px-1.5">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#00c853] group-hover:bg-[#00e676] text-black border-[3px] border-[#15241b] flex items-center justify-center shadow-md transition">
              <Plus className="w-4 h-4 stroke-[3]" />
            </span>
            <span className="text-[11px] font-extrabold text-white text-center leading-tight">
              {lang === 'bn' ? 'হিস্টরি দিন' : 'Create story'}
            </span>
          </div>
        </button>

        {/* Active Live Stream Story Cards */}
        {activeLiveStreams.map((live) => (
          <button
            key={`story-live-${live.id}`}
            type="button"
            onClick={() => onJoinLive(live.id)}
            className="w-[98px] h-[160px] rounded-2xl overflow-hidden bg-[#121f18] border border-rose-500/60 shrink-0 relative cursor-pointer group transition active:scale-[0.98] text-left"
          >
            <img
              src={live.hostAvatar || DEFAULT_AVATAR_URL}
              alt={live.hostName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR_URL;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/45" />

            <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black tracking-wide flex items-center gap-1 shadow">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>LIVE</span>
              </span>
              <span className="text-[9px] font-bold text-white/90 tabular-nums drop-shadow">
                {toBengaliNumber(live.viewersCount || 1, lang)}
              </span>
            </div>

            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-[11px] font-extrabold text-white leading-tight line-clamp-2 drop-shadow">
                {live.hostName}
              </p>
            </div>
          </button>
        ))}

        {/* User Stories (Standalone Photo / Video / Text + Opt-in Reels) */}
        {stories.map((story, idx) => (
          <button
            key={`user-story-${story.id}`}
            type="button"
            onClick={() => onOpenStory(idx)}
            className="w-[98px] h-[160px] rounded-2xl overflow-hidden bg-[#0c1410] border border-[#00c853]/50 hover:border-[#00e676] shrink-0 relative cursor-pointer group transition active:scale-[0.98] text-left"
          >
            {story.mediaType === 'text' ? (
              <div
                className={`w-full h-full flex items-center justify-center p-2.5 pt-8 pb-7 text-center bg-gradient-to-br ${
                  story.bgColor || 'from-[#0a2e1c] via-[#0f3d26] to-[#00c853]/50'
                }`}
              >
                <p className="text-[10.5px] font-extrabold text-white leading-snug line-clamp-4 drop-shadow break-words">
                  {story.caption}
                </p>
              </div>
            ) : (
              <img
                src={
                  story.thumbnailUrl ||
                  (story.mediaType === 'image' ? story.mediaUrl : '') ||
                  '/images/ai_comedy_tea_stall.jpg'
                }
                alt={story.caption || story.creatorName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={story.filter ? { filter: story.filter } : undefined}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = '/images/ai_comedy_tea_stall.jpg';
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/45 pointer-events-none" />

            {/* Top-left Creator Avatar Ring */}
            <div className="absolute top-2 left-2">
              <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-[#00c853] to-[#00e676] shadow-md relative">
                <img
                  src={story.creatorAvatar || DEFAULT_AVATAR_URL}
                  alt={story.creatorName}
                  className="w-full h-full rounded-full object-cover border border-[#0c1410]"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR_URL;
                  }}
                />
                {story.isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00c853] text-black flex items-center justify-center border border-[#0c1410]">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </span>
                )}
              </div>
            </div>

            {/* Top-right media badge */}
            <div className="absolute top-2 right-2">
              {story.linkedReelId ? (
                <span
                  title={lang === 'bn' ? 'রিল হিস্টরি' : 'Reel Story'}
                  className="w-5 h-5 rounded-full bg-[#00c853] text-black flex items-center justify-center shadow"
                >
                  <Film className="w-2.5 h-2.5" />
                </span>
              ) : story.mediaType === 'video' ? (
                <span className="w-5 h-5 rounded-full bg-black/55 text-white flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </span>
              ) : null}
            </div>

            {/* Bottom Creator Name */}
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-[11px] font-bold text-white leading-tight line-clamp-2 drop-shadow">
                {story.creatorName}
              </p>
            </div>
          </button>
        ))}

        {/* Opt-in / Featured Fallback Reel Story Cards */}
        {fallbackStoryReels.map((reel) => (
          <button
            key={`story-reel-${reel.id}`}
            type="button"
            onClick={() => onOpenReel(reel)}
            className="w-[98px] h-[160px] rounded-2xl overflow-hidden bg-[#0c1410] border border-emerald-900/50 hover:border-emerald-500/50 shrink-0 relative cursor-pointer group transition active:scale-[0.98] text-left"
          >
            <img
              src={reel.thumbnailUrl || '/images/ai_comedy_tea_stall.jpg'}
              alt={reel.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/images/ai_comedy_tea_stall.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/45" />

            <div className="absolute top-2 left-2">
              <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-[#00c853] to-[#00e676] shadow-md">
                <img
                  src={reel.creatorAvatar || DEFAULT_AVATAR_URL}
                  alt={reel.creatorName}
                  className="w-full h-full rounded-full object-cover border border-[#0c1410]"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR_URL;
                  }}
                />
              </div>
            </div>

            <div className="absolute top-2 right-2">
              {reel.isSpecialOffer ? (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center shadow">
                  <Flame className="w-3 h-3 fill-current" />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full bg-black/50 text-white/90 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </span>
              )}
            </div>

            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-[11px] font-bold text-white leading-tight line-clamp-2 drop-shadow">
                {reel.creatorName}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
