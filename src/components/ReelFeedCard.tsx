import React from 'react';
import { Play, Heart, MessageCircle, Share2, Check, Sparkles, Flame, Eye, Bookmark, Volume2, VolumeX } from 'lucide-react';
import { Reel, EarningSettings } from '../types';
import { toBengaliNumber, formatRelativeTime } from '../utils/bengali';
import { playPopSound } from '../utils/audio';
import { extractYouTubeId, extractVimeoId, normalizeVideoUrl } from '../utils/video';
import { getVideoFromDB } from '../utils/videoStorage';
import { getCategoryMeta } from '../utils/categories';
import { WatermarkOverlay } from './WatermarkOverlay';

const DEFAULT_AVATAR_URL = '/images/masud_rana_avatar.jpg';

interface ReelFeedCardProps {
  reel: Reel;
  isLiked: boolean;
  hasWatched: boolean;
  onLikeToggle: (reelId: string) => void;
  onOpenReel: (reel: Reel) => void;
  onOpenComments: (reel: Reel) => void;
  onClaimDirect: (reel: Reel) => void;
  onOpenGift?: (reel: Reel) => void;
  onOpenCreatorProfile: (userId: string) => void;
  onShare: (reel: Reel) => void;
  lang: 'bn' | 'en';
  isMuted: boolean;
  onToggleMute?: () => void;
  isFocusedInFeed?: boolean;
  isAudioUnlocked?: boolean;
  onAudioUnlock?: () => void;
  levelProgress: number;
  earningSettings?: EarningSettings;
  isDailyLimitReached?: boolean;
  isSaved?: boolean;
  onToggleSave?: (reelId: string) => void;
  isGiftsEnabled?: boolean;
  isCommentsEnabled?: boolean;
  currentUserId?: string;
  onSelectCategory?: (category: Reel['category']) => void;
  activeCategory?: string;
  watchProgress?: number;
  onWatchProgressChange?: (reelId: string, progressPercent: number) => void;
  isModalOpen?: boolean;
}

export const ReelFeedCard: React.FC<ReelFeedCardProps> = ({
  reel,
  isLiked,
  hasWatched,
  onLikeToggle,
  onOpenReel,
  onOpenComments,
  onClaimDirect,
  onOpenCreatorProfile,
  onShare,
  lang,
  isMuted,
  onToggleMute,
  isFocusedInFeed,
  isAudioUnlocked = false,
  onAudioUnlock,
  earningSettings,
  isDailyLimitReached = false,
  isSaved = false,
  onToggleSave,
  isCommentsEnabled = true,
  currentUserId,
  onSelectCategory,
  activeCategory,
  watchProgress: externalWatchProgress = 0,
  onWatchProgressChange,
  isModalOpen = false,
}) => {
  const [isSpringing, setIsSpringing] = React.useState(false);
  const [isBookmarkSpringing, setIsBookmarkSpringing] = React.useState(false);
  const [showIncrement, setShowIncrement] = React.useState(false);
  const [incrementKey, setIncrementKey] = React.useState(0);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [thumbFailed, setThumbFailed] = React.useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const [hasTitleOverflow, setHasTitleOverflow] = React.useState(false);
  const titleLineRef = React.useRef<HTMLParagraphElement>(null);

  // Viewport & preview playback state
  const cardContainerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isNearView, setIsNearView] = React.useState(false);
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [isActiveInView, setIsActiveInView] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPageVisible, setIsPageVisible] = React.useState(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  const [videoSrc, setVideoSrc] = React.useState<string>('');
  const [videoReady, setVideoReady] = React.useState(false);
  const [videoFailed, setVideoFailed] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [autoplayBlockedMuted, setAutoplayBlockedMuted] = React.useState(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<0.5 | 1 | 2>(1);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, videoReady, isPlaying]);

  const handleToggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed = playbackSpeed === 0.5 ? 1 : playbackSpeed === 1 ? 2 : 0.5;
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  // Watch progress & milestone ripple state
  const [localProgress, setLocalProgress] = React.useState<number>(() =>
    hasWatched ? 100 : Math.max(0, Math.min(100, externalWatchProgress))
  );
  const [milestoneMetInline, setMilestoneMetInline] = React.useState(false);
  const [showMilestoneRipple, setShowMilestoneRipple] = React.useState(false);
  const [rippleKey, setRippleKey] = React.useState(0);
  const rippleTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHasWatchedRef = React.useRef<boolean>(hasWatched);
  const pendingModalRippleRef = React.useRef<boolean>(false);
  const lastReportedProgressRef = React.useRef<number>(localProgress);
  const prevLocalProgressRef = React.useRef<number>(localProgress);
  const onWatchProgressChangeRef = React.useRef(onWatchProgressChange);
  React.useEffect(() => {
    onWatchProgressChangeRef.current = onWatchProgressChange;
  }, [onWatchProgressChange]);

  const triggerMilestoneRipple = React.useCallback(() => {
    if (rippleTimeoutRef.current) {
      clearTimeout(rippleTimeoutRef.current);
    }
    setRippleKey((prev) => prev + 1);
    setShowMilestoneRipple(true);
    rippleTimeoutRef.current = setTimeout(() => {
      setShowMilestoneRipple(false);
      rippleTimeoutRef.current = null;
    }, 1150);
  }, []);

  React.useEffect(() => {
    return () => {
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
    };
  }, []);

  const categoryMeta = getCategoryMeta(reel.category);

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMuted) playPopSound();
    if (onSelectCategory) {
      onSelectCategory(reel.category);
    }
  };

  const viewsCount = reel.viewsCount || 0;
  const prevViewsRef = React.useRef<number>(viewsCount);
  const [viewJustIncremented, setViewJustIncremented] = React.useState(false);

  React.useEffect(() => {
    if (viewsCount > prevViewsRef.current) {
      setViewJustIncremented(true);
      const timer = setTimeout(() => setViewJustIncremented(false), 1200);
      prevViewsRef.current = viewsCount;
      return () => clearTimeout(timer);
    }
    prevViewsRef.current = viewsCount;
  }, [viewsCount]);

  const isOwnReel = Boolean(currentUserId && reel.userId === currentUserId);
  const masterEarningOn = earningSettings ? earningSettings.isMasterEarningEnabled : true;
  const videoEarningOn = earningSettings ? earningSettings.isVideoWatchEarningEnabled : true;
  const allowFeedClaim = earningSettings ? earningSettings.allowDirectFeedClaim : true;
  const scope = earningSettings?.videoEarningScope || 'all_reels';

  const isReelEligible = scope === 'offer_reels_only'
    ? Boolean(reel.isEarningEnabled || reel.isSpecialOffer)
    : (reel.isEarningEnabled !== false);

  const isEarningActive = masterEarningOn && videoEarningOn && isReelEligible && !isOwnReel;
  const rewardPoints = reel.pointsReward || earningSettings?.defaultVideoRewardPoints || 10;
  const milestoneSeconds = (reel.customWatchSeconds && reel.customWatchSeconds > 0)
    ? reel.customWatchSeconds
    : (earningSettings?.videoWatchDurationSeconds || 15);

  // Pause inline preview if browser tab becomes hidden
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Observe card visibility for inline video autoplay/pause & active watch tracking
  React.useEffect(() => {
    const el = cardContainerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsNearView(true);
      setIsIntersecting(true);
      setIsActiveInView(true);
      return;
    }

    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearView(true);
        }
      },
      { rootMargin: '200px 0px' }
    );

    const activeObserver = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsIntersecting(visible);
        setIsActiveInView(visible && entry.intersectionRatio >= 0.2);
      },
      { rootMargin: '0px 0px', threshold: [0, 0.2, 0.5, 0.75, 1] }
    );

    nearObserver.observe(el);
    activeObserver.observe(el);

    return () => {
      nearObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  // Resolve inline video source when card approaches viewport
  React.useEffect(() => {
    if (!isNearView) return;
    let cancelled = false;
    let createdBlobUrl = '';

    const resolveVideo = async () => {
      setVideoFailed(false);
      setVideoReady(false);

      if (reel.id) {
        const dbBlob = await getVideoFromDB(reel.id).catch(() => null);
        if (dbBlob && !cancelled) {
          createdBlobUrl = URL.createObjectURL(dbBlob);
          setVideoSrc(createdBlobUrl);
          return;
        }
      }

      if (reel.videoUrl?.startsWith('local:')) {
        const localKey = reel.videoUrl.replace('local:', '');
        const dbBlob = await getVideoFromDB(localKey).catch(() => null);
        if (dbBlob && !cancelled) {
          createdBlobUrl = URL.createObjectURL(dbBlob);
          setVideoSrc(createdBlobUrl);
          return;
        }
      }

      if (!cancelled) {
        const sanitized = normalizeVideoUrl(reel.videoUrl);
        setVideoSrc(sanitized || reel.videoUrl || '');
      }
    };

    resolveVideo();

    return () => {
      cancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [isNearView, reel.id, reel.videoUrl]);

  const ytId = extractYouTubeId(reel.videoUrl);
  const vimeoId = extractVimeoId(videoSrc || reel.videoUrl);
  const isImageMotionReel = !reel.videoUrl && !videoSrc;
  const isNativeVideo = Boolean(videoSrc && !ytId && !vimeoId && !videoFailed);
  const shouldPlayPreview =
    (isFocusedInFeed !== undefined
      ? isFocusedInFeed
      : isActiveInView || (isHovered && isIntersecting)) &&
    !isModalOpen &&
    isPageVisible;

  // Control inline middle-viewport video playback WITH sound (falling back to muted play only if browser blocks unmuted autoplay prior to first user gesture)
  React.useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !isNativeVideo) {
      setIsPlaying(false);
      return;
    }

    if (shouldPlayPreview) {
      const wantMuted = isMuted;
      videoEl.muted = wantMuted;
      if (!wantMuted) {
        videoEl.volume = 1;
      }

      if (videoEl.paused) {
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (!wantMuted) {
                setAutoplayBlockedMuted(false);
              }
            })
            .catch(() => {
              // Browser prevented unmuted autoplay before first interaction -> play muted so video keeps moving
              videoEl.muted = true;
              setAutoplayBlockedMuted(true);
              videoEl.play().catch(() => {});
            });
        }
      } else if (!wantMuted && isAudioUnlocked) {
        videoEl.muted = false;
        videoEl.volume = 1;
        setAutoplayBlockedMuted(false);
      }
    } else {
      videoEl.muted = true;
      if (!videoEl.paused) {
        videoEl.pause();
      }
    }
  }, [shouldPlayPreview, isNativeVideo, videoSrc, videoReady, isMuted, isAudioUnlocked]);

  const handleToggleInlineSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAudioUnlock?.();
    const videoEl = videoRef.current;
    if (autoplayBlockedMuted && !isMuted && videoEl) {
      videoEl.muted = false;
      videoEl.volume = 1;
      setAutoplayBlockedMuted(false);
      if (videoEl.paused) {
        videoEl.play().catch(() => {});
      }
      return;
    }
    onToggleMute?.();
  };

  // Sync external progress (e.g. from FullScreenReelModal) upward
  React.useEffect(() => {
    if (externalWatchProgress > 0) {
      setLocalProgress((prev) => Math.max(prev, Math.min(100, externalWatchProgress)));
    }
  }, [externalWatchProgress]);

  // Trigger subtle ripple when watch-to-earn reward status flips from false -> true
  React.useEffect(() => {
    const wasWatched = prevHasWatchedRef.current;
    prevHasWatchedRef.current = hasWatched;

    if (hasWatched) {
      setLocalProgress(100);
      if (!wasWatched) {
        if (isModalOpen) {
          pendingModalRippleRef.current = true;
        } else {
          triggerMilestoneRipple();
        }
      }
    }
  }, [hasWatched, isModalOpen, triggerMilestoneRipple]);

  // Fire deferred ripple right after FullScreenReelModal closes if earned inside modal
  React.useEffect(() => {
    if (!isModalOpen && pendingModalRippleRef.current) {
      pendingModalRippleRef.current = false;
      const timer = setTimeout(() => {
        triggerMilestoneRipple();
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, triggerMilestoneRipple]);

  // Track watch progress smoothly while previewing/watching in feed
  const isActivelyTracking = shouldPlayPreview && !hasWatched && localProgress < 100;

  React.useEffect(() => {
    if (!isActivelyTracking) return;

    const stepPercent = (0.1 / Math.max(1, milestoneSeconds)) * 100;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (isNativeVideo && videoReady && videoRef.current && videoRef.current.paused) return;

      setLocalProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + stepPercent);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [
    isActivelyTracking,
    milestoneSeconds,
    isNativeVideo,
    videoReady,
  ]);

  // Report watch progress upward and trigger inline milestone ripple after render commit
  React.useEffect(() => {
    const prev = prevLocalProgressRef.current;
    prevLocalProgressRef.current = localProgress;

    if (
      localProgress > 0 &&
      (Math.abs(localProgress - lastReportedProgressRef.current) >= 4 || localProgress >= 100)
    ) {
      lastReportedProgressRef.current = localProgress;
      onWatchProgressChangeRef.current?.(reel.id, localProgress);
    }

    if (
      prev < 100 &&
      localProgress >= 100 &&
      !hasWatched &&
      !isModalOpen &&
      isEarningActive &&
      !isDailyLimitReached
    ) {
      setMilestoneMetInline(true);
      triggerMilestoneRipple();
    }
  }, [
    localProgress,
    reel.id,
    hasWatched,
    isModalOpen,
    isEarningActive,
    isDailyLimitReached,
    triggerMilestoneRipple,
  ]);

  const effectiveProgress = hasWatched ? 100 : Math.min(100, Math.max(0, localProgress));

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMuted) playPopSound();

    const willBeLiked = !isLiked;

    // Reset and trigger spring animation
    setIsSpringing(false);
    requestAnimationFrame(() => {
      setIsSpringing(true);
      setTimeout(() => setIsSpringing(false), 650);
    });

    if (willBeLiked) {
      setShowIncrement(true);
      setIncrementKey((prev) => prev + 1);
      setTimeout(() => setShowIncrement(false), 850);
    } else {
      setShowIncrement(false);
    }

    onLikeToggle(reel.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(reel);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMuted) playPopSound();

    setIsBookmarkSpringing(false);
    requestAnimationFrame(() => {
      setIsBookmarkSpringing(true);
      setTimeout(() => setIsBookmarkSpringing(false), 650);
    });

    if (onToggleSave) {
      onToggleSave(reel.id);
    }
  };

  const likesDisplay = Math.max(0, reel.likesCount || 0);
  const rawThumbnail = (ytId && (!reel.thumbnailUrl || reel.thumbnailUrl.includes('unsplash')))
    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    : (reel.thumbnailUrl || '/images/ai_comedy_tea_stall.jpg');
  const displayThumbnail = thumbFailed ? '/images/ai_comedy_tea_stall.jpg' : rawThumbnail;

  React.useEffect(() => {
    setThumbFailed(false);
  }, [reel.id, reel.thumbnailUrl]);

  const actionColumnsCount = 2 + (isCommentsEnabled ? 1 : 0);
  const actionGridClass = actionColumnsCount === 3 ? 'grid-cols-3' : 'grid-cols-2';

  const hasDistinctCaption = Boolean(
    reel.caption && reel.caption.trim() && reel.caption.trim() !== reel.title.trim()
  );

  React.useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [reel.id]);

  React.useEffect(() => {
    if (isDescriptionExpanded) return;
    const checkOverflow = () => {
      const el = titleLineRef.current;
      if (!el) return;
      setHasTitleOverflow(el.scrollWidth > el.clientWidth + 1);
    };
    const raf = requestAnimationFrame(checkOverflow);
    window.addEventListener('resize', checkOverflow);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [reel.id, reel.title, reel.caption, isDescriptionExpanded]);

  const hasMoreDescription =
    hasDistinctCaption ||
    Boolean(reel.hashtags && reel.hashtags.length > 0) ||
    hasTitleOverflow;

  return (
    <article className="bg-[#101914] border border-emerald-950/80 rounded-2xl overflow-hidden shadow-lg mb-3">
      {/* 1. Facebook-Style Post Header */}
      <div className="px-3.5 pt-3 pb-2 flex items-start justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-2.5 cursor-pointer group/creator min-w-0 flex-1 text-left"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCreatorProfile(reel.userId);
          }}
          title={
            lang === 'bn'
              ? `${reel.creatorName}-এর প্রোফাইল দেখুন`
              : `View ${reel.creatorName}'s profile`
          }
        >
          <div className="relative shrink-0">
            <img
              src={reel.creatorAvatar || DEFAULT_AVATAR_URL}
              alt={reel.creatorName}
              className="w-10 h-10 rounded-full object-cover border border-emerald-500/50 group-hover/creator:border-[#00e676] transition"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR_URL;
              }}
            />
            {reel.isVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00c853] text-black rounded-full flex items-center justify-center border-2 border-[#101914]">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[13.5px] font-extrabold text-white truncate group-hover/creator:text-[#00e676] group-hover/creator:underline transition-colors">
                {reel.creatorName}
              </span>
              {isOwnReel && (
                <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                  · {lang === 'bn' ? 'আপনার পোস্ট' : 'Your post'}
                </span>
              )}
            </div>

            <div className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5 flex-wrap mt-0.5">
              <span>{formatRelativeTime(reel.createdAt, lang)}</span>
              <span aria-hidden="true">·</span>
              <span
                role="button"
                tabIndex={0}
                onClick={handleCategoryClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(e as unknown as React.MouseEvent);
                  }
                }}
                className={`inline-flex items-center gap-1 font-bold hover:underline cursor-pointer ${
                  activeCategory === reel.category ? 'text-[#00e676]' : 'text-emerald-300/90'
                }`}
                title={
                  lang === 'bn'
                    ? `${categoryMeta.labelBn} ক্যাটাগরির রিল ফিল্টার করুন`
                    : `Filter feed by ${categoryMeta.labelEn}`
                }
              >
                <span>{categoryMeta.icon}</span>
                <span>{lang === 'bn' ? categoryMeta.labelBn : categoryMeta.labelEn}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span
                data-testid="reel-view-count"
                className={`inline-flex items-center gap-1 tabular-nums transition-colors ${
                  viewJustIncremented ? 'text-emerald-300 font-bold' : 'text-neutral-400'
                }`}
              >
                <Eye className="w-3 h-3 text-emerald-400/80" />
                <span>{toBengaliNumber(viewsCount.toLocaleString('en-US'), lang)}</span>
              </span>
            </div>
          </div>
        </button>

        {/* Right Header Controls: Status & Save */}
        <div className="flex items-center gap-1 shrink-0">
          {reel.isSpecialOffer && !isOwnReel && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-black flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current text-black" />
              <span>{reel.specialOfferBadge || (lang === 'bn' ? 'অফার' : 'Offer')}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleBookmark}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer select-none ${
              isSaved
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-neutral-300 hover:text-white hover:bg-[#192b20]'
            }`}
            aria-label={isSaved ? (lang === 'bn' ? 'আনসেভ করুন' : 'Remove Bookmark') : (lang === 'bn' ? 'সেভ করুন' : 'Bookmark')}
            title={isSaved ? (lang === 'bn' ? 'সংরক্ষিত থেকে সরান' : 'Remove from saved') : (lang === 'bn' ? 'ফেভারিট সেভ করুন' : 'Save to favorites')}
          >
            {isBookmarkSpringing && isSaved && (
              <span className="absolute inset-1 rounded-full border-2 border-amber-400/80 pointer-events-none animate-ping" />
            )}
            <Bookmark
              className={`w-4 h-4 transition-transform duration-150 ${
                isSaved ? 'fill-current text-amber-400 scale-110' : ''
              } ${isBookmarkSpringing ? 'scale-125' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 2. Facebook-Style Post Title & Caption Above Media (1-line preview + Show more) */}
      <div className="px-3.5 pb-2.5">
        {!isDescriptionExpanded ? (
          <div className="flex items-baseline gap-1.5">
            <p
              ref={titleLineRef}
              onClick={() => (hasMoreDescription ? setIsDescriptionExpanded(true) : onOpenReel(reel))}
              className="text-[13px] font-bold text-slate-100 leading-snug truncate flex-1 min-w-0 cursor-pointer hover:text-emerald-200 transition-colors"
            >
              {reel.title || reel.caption}
            </p>
            {hasMoreDescription && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDescriptionExpanded(true);
                }}
                className="shrink-0 text-xs font-extrabold text-[#00e676] hover:text-emerald-300 hover:underline cursor-pointer select-none"
              >
                ...Show more
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1 animate-in fade-in duration-150">
            {reel.title && (
              <h3
                onClick={() => onOpenReel(reel)}
                className="text-[13.5px] font-bold text-slate-100 leading-snug whitespace-pre-line cursor-pointer hover:text-emerald-200 transition-colors"
              >
                {reel.title}
              </h3>
            )}
            {hasDistinctCaption && (
              <p className="text-xs text-neutral-300/95 leading-relaxed whitespace-pre-line">
                {reel.caption}
              </p>
            )}
            {reel.hashtags && reel.hashtags.length > 0 && (
              <p className="text-[11px] font-semibold text-emerald-400/90 flex flex-wrap gap-x-1.5 gap-y-0.5">
                {reel.hashtags.map((tag, idx) => (
                  <span key={idx}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                ))}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDescriptionExpanded(false);
              }}
              className="inline-block text-xs font-extrabold text-emerald-400 hover:text-[#00e676] hover:underline cursor-pointer select-none pt-0.5"
            >
              Show less
            </button>
          </div>
        )}
      </div>

      {/* 3. Full-Width Edge-to-Edge Media Container */}
      <div
        ref={cardContainerRef}
        data-feed-media="true"
        onClick={() => onOpenReel(reel)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full h-72 sm:h-80 bg-black cursor-pointer group overflow-hidden border-y border-emerald-950/60"
      >
        {/* Skeleton State */}
        {!imgLoaded && !videoReady && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Background Image / Video Poster / AI Motion Image */}
        <img
          src={displayThumbnail}
          alt={reel.title}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isImageMotionReel ? 'animate-ken-burns' : 'group-hover:scale-[1.02]'
          } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={reel.filter ? { filter: reel.filter } : {}}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            if (!thumbFailed) {
              setThumbFailed(true);
            } else {
              setImgLoaded(true);
            }
          }}
        />

        {/* Inline Middle-Viewport Video Preview (plays continuously with sound when focused) */}
        {isNativeVideo && (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={displayThumbnail}
            autoPlay={shouldPlayPreview}
            muted={!shouldPlayPreview || isMuted || autoplayBlockedMuted}
            playsInline
            loop
            preload={isNearView ? 'auto' : 'metadata'}
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={(e) => {
              setVideoReady(true);
              if (shouldPlayPreview && e.currentTarget.paused) {
                const wantMuted = isMuted;
                e.currentTarget.muted = wantMuted;
                if (!wantMuted) e.currentTarget.volume = 1;
                e.currentTarget.play().catch(() => {
                  e.currentTarget.muted = true;
                  setAutoplayBlockedMuted(true);
                  e.currentTarget.play().catch(() => {});
                });
              }
            }}
            onPlaying={() => {
              setVideoReady(true);
              setIsPlaying(true);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              setVideoFailed(true);
              setIsPlaying(false);
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
              (videoReady || isPlaying) && !videoFailed ? 'opacity-100' : 'opacity-0'
            }`}
            style={reel.filter ? { filter: reel.filter } : {}}
          />
        )}

        {/* Subtle Edge Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 pointer-events-none" />

        {/* Creator Watermark Protection Overlay */}
        {reel.watermark?.enabled && (
          <WatermarkOverlay
            watermark={reel.watermark}
            fallbackText={reel.creatorHandle}
            isFullScreen={false}
          />
        )}

        {/* Subtle Top-Right Player Controls (Sound / Speed / AI Visual / No Earn) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
          {isNativeVideo && shouldPlayPreview && (
            <button
              type="button"
              onClick={handleToggleInlineSound}
              className={`pointer-events-auto px-2 py-1 rounded-lg text-[10px] font-black backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 ${
                !isMuted && !autoplayBlockedMuted
                  ? 'bg-black/75 text-[#00e676] border-[#00c853]/50 hover:bg-[#00c853] hover:text-black'
                  : 'bg-black/80 text-amber-300 border-amber-400/60 hover:bg-amber-400 hover:text-black'
              }`}
              aria-label={isMuted || autoplayBlockedMuted ? (lang === 'bn' ? 'সাউন্ড চালু করুন' : 'Unmute sound') : (lang === 'bn' ? 'মিউট করুন' : 'Mute sound')}
              title={isMuted || autoplayBlockedMuted ? (lang === 'bn' ? 'সাউন্ড চালু করুন' : 'Unmute sound') : (lang === 'bn' ? 'সাউন্ড বন্ধ করুন' : 'Mute sound')}
            >
              {!isMuted && !autoplayBlockedMuted ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  {autoplayBlockedMuted && !isMuted && (
                    <span>{lang === 'bn' ? 'সাউন্ড অন' : 'Sound'}</span>
                  )}
                </>
              )}
            </button>
          )}
          {isNativeVideo && (
            <button
              type="button"
              onClick={handleToggleSpeed}
              className="pointer-events-auto px-2 py-0.5 rounded-lg text-[10px] font-black bg-black/75 backdrop-blur-md text-emerald-300 border border-emerald-500/40 hover:bg-[#00c853] hover:text-black transition-all cursor-pointer tabular-nums shadow-sm active:scale-95"
              title={lang === 'bn' ? 'প্লেব্যাক স্পিড পরিবর্তন (০.৫x / ১x / ২x)' : 'Toggle playback speed (0.5x / 1x / 2x)'}
            >
              {playbackSpeed}x
            </button>
          )}
          {isImageMotionReel && (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-black/65 backdrop-blur-md text-emerald-300 border border-emerald-500/35 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{lang === 'bn' ? 'AI ভিজ্যুয়াল' : 'AI Visual'}</span>
            </span>
          )}
          {!isOwnReel && !isEarningActive && (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-black/70 backdrop-blur-md text-neutral-300 border border-white/15 flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" />
              <span>{lang === 'bn' ? 'শুধু বিনোদন' : 'Watch Only'}</span>
            </span>
          )}
        </div>

        {/* Centered Circular Play Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-14 h-14 rounded-full bg-black/45 backdrop-blur-sm border-2 border-[#00e676]/85 flex items-center justify-center text-[#00e676] group-hover:scale-110 group-hover:bg-[#00c853] group-hover:text-black group-hover:border-emerald-300 transition-all duration-200 shadow-lg shadow-black/50 ${
              isNativeVideo && videoReady && isPlaying
                ? 'opacity-0 group-hover:opacity-100 scale-90'
                : 'opacity-100'
            }`}
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Subtle Ripple Animation when Watch-to-Earn Milestone is Met */}
        {showMilestoneRipple && (
          <div
            key={`ripple-${rippleKey}`}
            className="absolute bottom-0 right-4 z-20 pointer-events-none"
            aria-hidden="true"
          >
            <span className="absolute w-14 h-14 rounded-full border border-emerald-300/65 bg-emerald-400/15 animate-milestone-ripple-1" />
            <span className="absolute w-14 h-14 rounded-full border border-teal-200/45 bg-emerald-300/10 animate-milestone-ripple-2" />
          </div>
        )}

        {/* Watch Progress Bar at Bottom of Video Player */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          role="progressbar"
          aria-label={lang === 'bn' ? 'ভিডিও দেখার অগ্রগতি' : 'Watch progress'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(effectiveProgress)}
        >
          <div className="relative w-full h-[3px] group-hover:h-1 transition-[height] duration-200 bg-black/60 overflow-hidden">
            <div
              className={`relative h-full w-full origin-left transition-transform duration-150 ease-linear ${
                hasWatched || milestoneMetInline
                  ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300'
                  : reel.isSpecialOffer && isEarningActive
                  ? 'bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-300'
                  : isEarningActive
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300'
                  : 'bg-white/65'
              }`}
              style={{ transform: `scaleX(${effectiveProgress / 100})` }}
            >
              {isActivelyTracking && effectiveProgress > 2 && effectiveProgress < 100 && (
                <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-progress-sheen" />
              )}
            </div>

            {showMilestoneRipple && (
              <span
                key={`wave-${rippleKey}`}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/80 to-transparent animate-milestone-wave"
              />
            )}
          </div>

          {effectiveProgress > 1 && effectiveProgress < 100 && isActivelyTracking && (
            <span
              className="absolute top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-200 shadow-[0_0_6px_rgba(110,231,183,0.9)] transition-[left] duration-150 ease-linear"
              style={{ left: `${effectiveProgress}%` }}
            />
          )}
        </div>
      </div>

      {/* 4. Facebook-Style Engagement Count Row + Watch-to-Earn Claim Action */}
      <div className="px-3.5 py-2 flex items-center justify-between gap-2 text-[11.5px] text-neutral-400 border-b border-emerald-950/70">
        <div className="flex items-center gap-1.5 min-w-0 tabular-nums">
          <span className="inline-flex items-center gap-1 text-slate-300 font-semibold">
            <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 inline-flex items-center justify-center">
              <Heart className="w-2.5 h-2.5 fill-current" />
            </span>
            <span>{toBengaliNumber(likesDisplay, lang)}</span>
          </span>
          {isCommentsEnabled && (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenComments(reel);
                }}
                className="hover:text-white hover:underline transition cursor-pointer"
              >
                {toBengaliNumber(reel.commentsCount, lang)} {lang === 'bn' ? 'মন্তব্য' : 'comments'}
              </button>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>
            {toBengaliNumber(reel.sharesCount || 0, lang)} {lang === 'bn' ? 'শেয়ার' : 'shares'}
          </span>
        </div>

        {/* Watch-to-Earn Direct Claim CTA */}
        {isEarningActive && allowFeedClaim ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClaimDirect(reel);
            }}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer tabular-nums ${
              hasWatched
                ? 'bg-emerald-950/85 text-emerald-400 border border-emerald-500/35'
                : isDailyLimitReached
                ? 'bg-neutral-900/90 text-amber-300 border border-amber-500/35'
                : reel.isSpecialOffer
                ? 'bg-gradient-to-r from-amber-400 to-[#00c853] text-black shadow-sm shadow-amber-500/20'
                : 'bg-[#00c853] hover:bg-[#00e676] text-black shadow-sm shadow-emerald-500/20'
            } ${
              milestoneMetInline && !hasWatched && !isDailyLimitReached
                ? 'ring-2 ring-emerald-300/80 ring-offset-1 ring-offset-[#101914]'
                : ''
            }`}
            title={
              hasWatched
                ? (lang === 'bn' ? 'ইতিমধ্যে পয়েন্ট নেওয়া হয়েছে' : 'Already claimed')
                : isDailyLimitReached
                ? (lang === 'bn' ? 'আজকের পয়েন্ট লিমিট পূর্ণ হয়েছে' : 'Daily limit reached')
                : (lang === 'bn' ? 'রিলটি দেখে পয়েন্ট সংগ্রহ করুন' : 'Claim reel points')
            }
          >
            {hasWatched ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>+{toBengaliNumber(rewardPoints, lang)} {lang === 'bn' ? 'সংগৃহীত' : 'Claimed'}</span>
              </>
            ) : isDailyLimitReached ? (
              <span>🔒 {lang === 'bn' ? 'লিমিট' : 'Limit'}</span>
            ) : (
              <>
                {reel.isSpecialOffer ? (
                  <Flame className="w-3 h-3 fill-current text-black" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>+{toBengaliNumber(rewardPoints, lang)} {lang === 'bn' ? 'পয়েন্ট' : 'Pts'}</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenReel(reel);
            }}
            className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 bg-[#16271d] hover:bg-[#1d3326] text-emerald-300 border border-emerald-900/60 transition active:scale-95 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{lang === 'bn' ? 'পূর্ণ দেখুন' : 'Watch Full'}</span>
          </button>
        )}
      </div>

      {/* 5. Facebook-Style Equal-Column Bottom Action Bar */}
      <div className={`grid ${actionGridClass} px-1.5 py-1 gap-1`}>
        {/* Like Button with Spring + Floating +1 */}
        <button
          type="button"
          onClick={handleLike}
          className={`relative min-h-[44px] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer select-none active:scale-95 ${
            isLiked
              ? 'text-rose-400 bg-rose-500/10'
              : 'text-slate-300 hover:text-white hover:bg-[#16271d]'
          }`}
          aria-label={isLiked ? (lang === 'bn' ? 'আনলাইক করুন' : 'Unlike') : (lang === 'bn' ? 'লাইক করুন' : 'Like')}
        >
          {showIncrement && (
            <div
              key={incrementKey}
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center animate-increment-float select-none"
            >
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/50 flex items-center gap-0.5 tabular-nums ring-1 ring-white/30">
                <span>+</span>
                <span>{toBengaliNumber(1, lang)}</span>
              </span>
            </div>
          )}

          <span className="relative inline-flex items-center justify-center">
            {isSpringing && isLiked && (
              <span className="absolute inset-0 rounded-full border-2 border-rose-500/80 pointer-events-none animate-heart-burst" />
            )}
            <Heart
              className={`w-4 h-4 transition-transform duration-150 ${
                isLiked ? 'fill-current text-rose-500 scale-110' : ''
              } ${isSpringing ? 'animate-heart-spring' : ''}`}
            />
          </span>
          <span className={showIncrement ? 'animate-number-bump' : ''}>
            {lang === 'bn' ? 'লাইক' : 'Like'}
          </span>
        </button>

        {/* Comment Button */}
        {isCommentsEnabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(reel);
            }}
            className="min-h-[44px] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#16271d] transition cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{lang === 'bn' ? 'মন্তব্য' : 'Comment'}</span>
          </button>
        )}

        {/* Share Button (includes Gift, Download, Report inside ShareSheet) */}
        <button
          type="button"
          onClick={handleShare}
          className="min-h-[44px] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#16271d] transition cursor-pointer active:scale-95"
        >
          <Share2 className="w-4 h-4" />
          <span>{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
        </button>
      </div>
    </article>
  );
};

