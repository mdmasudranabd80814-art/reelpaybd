import React, { useEffect, useState, useRef } from 'react';
import { X, Check, Heart, Eye, Film, Trash2, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { UserStory } from '../types';
import { toBengaliNumber, formatRelativeTime } from '../utils/bengali';
import { getVideoFromDB } from '../utils/videoStorage';
import { extractYouTubeId } from '../utils/video';

const DEFAULT_AVATAR_URL = '/images/masud_rana_avatar.jpg';
const STORY_DURATION_MS = 6500;

interface StoryViewerModalProps {
  stories: UserStory[];
  initialIndex: number;
  currentUserId?: string;
  isAdmin?: boolean;
  onClose: () => void;
  onLikeStory: (storyId: string) => void;
  onViewStory: (storyId: string) => void;
  onDeleteStory: (story: UserStory) => void;
  onOpenLinkedReel: (reelId: string) => void;
  onOpenCreatorProfile: (userId: string) => void;
  likedStoryIds: string[];
  lang: 'bn' | 'en';
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex,
  currentUserId,
  isAdmin = false,
  onClose,
  onLikeStory,
  onViewStory,
  onDeleteStory,
  onOpenLinkedReel,
  onOpenCreatorProfile,
  likedStoryIds,
  lang,
}) => {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, stories.length - 1)))
  );
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string>('');
  const viewedIdsRef = useRef<Set<string>>(new Set());

  const currentStory = stories[activeIndex];

  useEffect(() => {
    if (stories.length === 0) {
      onClose();
      return;
    }
    if (activeIndex >= stories.length) {
      setActiveIndex(stories.length - 1);
    }
  }, [stories.length, activeIndex, onClose]);

  useEffect(() => {
    if (!currentStory) return;
    setProgress(0);

    if (!viewedIdsRef.current.has(currentStory.id)) {
      viewedIdsRef.current.add(currentStory.id);
      onViewStory(currentStory.id);
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    if (currentStory.mediaType === 'video' && currentStory.mediaUrl) {
      if (currentStory.mediaUrl.startsWith('local:')) {
        const localKey = currentStory.mediaUrl.replace('local:', '');
        getVideoFromDB(localKey)
          .then((blob) => {
            if (cancelled) return;
            if (blob) {
              objectUrl = URL.createObjectURL(blob);
              setResolvedVideoSrc(objectUrl);
            } else {
              setResolvedVideoSrc('');
            }
          })
          .catch(() => {
            if (!cancelled) setResolvedVideoSrc('');
          });
      } else {
        setResolvedVideoSrc(currentStory.mediaUrl);
      }
    } else {
      setResolvedVideoSrc('');
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentStory?.id]);

  // Auto-advance timer for image & text stories (video advances via onEnded or fallback)
  useEffect(() => {
    if (!currentStory || isPaused) return;
    if (currentStory.mediaType === 'video' && resolvedVideoSrc && !extractYouTubeId(resolvedVideoSrc)) {
      return;
    }

    const startedAt = Date.now() - (progress / 100) * STORY_DURATION_MS;
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        if (activeIndex < stories.length - 1) {
          setActiveIndex((idx) => idx + 1);
        } else {
          onClose();
        }
      }
    }, 60);

    return () => clearInterval(timer);
  }, [currentStory?.id, activeIndex, stories.length, isPaused, resolvedVideoSrc]);

  if (!currentStory) return null;

  const isOwnOrAdmin = Boolean(
    isAdmin || (currentUserId && currentStory.userId === currentUserId)
  );
  const isLiked = likedStoryIds.includes(currentStory.id);
  const ytId = resolvedVideoSrc ? extractYouTubeId(resolvedVideoSrc) : null;

  const goPrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((i) => i - 1);
    } else {
      setProgress(0);
    }
  };

  const goNext = () => {
    if (activeIndex < stories.length - 1) {
      setActiveIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[85] bg-black flex items-center justify-center">
      <div className="relative w-full max-w-md h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden bg-[#0a120e] border border-emerald-950/80 flex flex-col shadow-2xl">
        {/* Top Segmented Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 pt-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent space-y-2.5">
          <div className="flex items-center gap-1">
            {stories.map((st, idx) => {
              const barPct = idx < activeIndex ? 100 : idx === activeIndex ? progress : 0;
              return (
                <div
                  key={st.id}
                  className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden"
                >
                  <div
                    className="h-full bg-[#00e676] transition-[width] duration-75"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Creator Header */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreatorProfile(currentStory.userId);
              }}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
            >
              <div className="relative shrink-0">
                <img
                  src={currentStory.creatorAvatar || DEFAULT_AVATAR_URL}
                  alt={currentStory.creatorName}
                  className="w-9 h-9 rounded-full object-cover border border-[#00e676]"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR_URL;
                  }}
                />
                {currentStory.isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#00c853] text-black flex items-center justify-center border border-black">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate group-hover:text-[#00e676]">
                  {currentStory.creatorName}
                </p>
                <p className="text-[10px] text-neutral-300">
                  {formatRelativeTime(currentStory.createdAt, lang)} · {lang === 'bn' ? 'হিস্টরি' : 'Story'}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                aria-label={isPaused ? 'Play' : 'Pause'}
                className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer"
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              </button>

              {isOwnOrAdmin && (
                <button
                  type="button"
                  onClick={() => onDeleteStory(currentStory)}
                  aria-label={lang === 'bn' ? 'হিস্টরি মুছুন' : 'Delete story'}
                  className="w-9 h-9 rounded-full bg-rose-950/70 hover:bg-rose-600 text-rose-200 hover:text-white flex items-center justify-center cursor-pointer transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Story Media Canvas */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {currentStory.mediaType === 'text' ? (
            <div
              className={`w-full h-full flex items-center justify-center p-8 text-center bg-gradient-to-br ${
                currentStory.bgColor || 'from-[#0a2e1c] via-[#0f3d26] to-[#00c853]/50'
              }`}
            >
              <p className="text-xl sm:text-2xl font-black text-white leading-relaxed drop-shadow-md break-words">
                {currentStory.caption}
              </p>
            </div>
          ) : currentStory.mediaType === 'video' && resolvedVideoSrc && !ytId ? (
            <video
              key={currentStory.id}
              src={resolvedVideoSrc}
              poster={currentStory.thumbnailUrl}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={currentStory.filter ? { filter: currentStory.filter } : undefined}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration && Number.isFinite(v.duration)) {
                  setProgress(Math.min(100, (v.currentTime / v.duration) * 100));
                }
              }}
              onEnded={goNext}
            />
          ) : (
            <img
              src={
                currentStory.mediaType === 'image'
                  ? currentStory.mediaUrl || currentStory.thumbnailUrl || '/images/ai_comedy_tea_stall.jpg'
                  : currentStory.thumbnailUrl || '/images/ai_comedy_tea_stall.jpg'
              }
              alt={currentStory.caption || currentStory.creatorName}
              className="w-full h-full object-cover animate-ken-burns"
              style={currentStory.filter ? { filter: currentStory.filter } : undefined}
              onError={(e) => {
                e.currentTarget.src = '/images/ai_comedy_tea_stall.jpg';
              }}
            />
          )}

          {/* Caption Overlay for Image / Video Stories */}
          {currentStory.mediaType !== 'text' && currentStory.caption && (
            <div className="absolute bottom-24 left-4 right-4 z-20 px-4 py-2.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 text-center">
              <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Left / Right Tap Navigation Zones */}
          <button
            type="button"
            onClick={goPrev}
            aria-label={lang === 'bn' ? 'আগের হিস্টরি' : 'Previous story'}
            className="absolute inset-y-20 left-0 w-1/3 z-20 cursor-pointer flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition"
          >
            {activeIndex > 0 && (
              <span className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
                <ChevronLeft className="w-5 h-5" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label={lang === 'bn' ? 'পরের হিস্টরি' : 'Next story'}
            className="absolute inset-y-20 right-0 w-1/3 z-20 cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition"
          >
            <span className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </span>
          </button>
        </div>

        {/* Bottom Interactive Footer */}
        <div className="relative z-30 px-4 py-3.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 text-xs text-neutral-300 tabular-nums">
            <span className="flex items-center gap-1 font-bold">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>{toBengaliNumber(currentStory.viewsCount || 0, lang)}</span>
            </span>

            <button
              type="button"
              onClick={() => onLikeStory(currentStory.id)}
              className={`min-h-[40px] px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-extrabold transition cursor-pointer active:scale-95 ${
                isLiked
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-400'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
              <span>{toBengaliNumber(currentStory.likesCount || 0, lang)}</span>
            </button>
          </div>

          {currentStory.linkedReelId && (
            <button
              type="button"
              onClick={() => {
                const reelId = currentStory.linkedReelId!;
                onClose();
                onOpenLinkedReel(reelId);
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition"
            >
              <Film className="w-4 h-4" />
              <span>{lang === 'bn' ? 'মূল রিল দেখুন' : 'Watch Full Reel'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
