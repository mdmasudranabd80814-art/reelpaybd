import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Gift,
  Sparkles,
  Check,
  Music,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  AlertCircle,
  RotateCcw,
  Radio,
  Users,
  Mic,
  Send,
  Flame,
  Eye,
  UserPlus,
  Bookmark,
  Play,
  Pause,
} from 'lucide-react';
import { Reel, LiveStream, EarningSettings } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { playCoinSound, playPopSound } from '../utils/audio';
import { vibrateLike, vibrateError } from '../utils/haptics';
import { normalizeVideoUrl, extractYouTubeId, extractVimeoId } from '../utils/video';
import { getVideoFromDB } from '../utils/videoStorage';
import confetti from 'canvas-confetti';
import { getCategoryMeta } from '../utils/categories';

interface FullScreenReelModalProps {
  reels: Reel[];
  initialReelId: string;
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: (reelId: string) => void;
  onOpenComments: (reel: Reel) => void;
  onRewardEarned: (points: number, reelTitle: string, reelId?: string) => void;
  onOpenGiftSheet?: (reel?: Reel) => void;
  onDownload?: (reel: Reel) => void;
  onShare: (reel: Reel) => void;
  onOpenProfile?: (userId: string) => void;
  lang: 'bn' | 'en';
  isMuted: boolean;
  onToggleMute: () => void;
  levelProgress: number;
  activeLiveStreams?: LiveStream[];
  onOpenLiveSheet?: () => void;
  earningSettings?: EarningSettings;
  watchedReelIds?: string[];
  isDailyLimitReached?: boolean;
  dailyClaimsUsed?: number;
  dailyClaimsLimit?: number;
  dailyPointsUsed?: number;
  dailyPointsLimit?: number;
  onToggleFollow?: (userId: string, creatorName?: string) => void;
  isFollowingCreator?: boolean;
  followingIds?: string[];
  onOpenChatWithCreator?: (creatorId: string) => void;
  savedReelIds?: string[];
  onToggleSave?: (reelId: string) => void;
  isGiftsEnabled?: boolean;
  isCommentsEnabled?: boolean;
  isDirectChatEnabled?: boolean;
  onVideoCompleted?: (reelId: string) => void;
  currentUserId?: string;
  onSelectCategory?: (category: Reel['category']) => void;
  onWatchProgressChange?: (reelId: string, progressPercent: number) => void;
  onLoadMoreReels?: () => void;
  likedReelIds?: string[];
  hasMore?: boolean;
}

export const FullScreenReelModal: React.FC<FullScreenReelModalProps> = ({
  reels,
  initialReelId,
  onClose,
  isLiked,
  onToggleLike,
  onOpenComments,
  onRewardEarned,
  onOpenGiftSheet,
  onShare,
  onOpenProfile,
  lang,
  isMuted,
  onToggleMute,
  levelProgress,
  activeLiveStreams = [],
  onOpenLiveSheet,
  earningSettings,
  watchedReelIds = [],
  isDailyLimitReached = false,
  dailyClaimsUsed = 0,
  dailyClaimsLimit = 0,
  dailyPointsUsed = 0,
  dailyPointsLimit = 0,
  onToggleFollow,
  isFollowingCreator = false,
  followingIds,
  onOpenChatWithCreator,
  savedReelIds,
  onToggleSave,
  isGiftsEnabled = true,
  isCommentsEnabled = true,
  isDirectChatEnabled = true,
  onVideoCompleted,
  currentUserId,
  onSelectCategory,
  onWatchProgressChange,
  onLoadMoreReels,
  likedReelIds,
  hasMore = true,
}) => {
  const [viewMode, setViewMode] = useState<'reels' | 'live'>('reels');
  const [activeLiveIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = reels.findIndex((r) => r.id === initialReelId);
    return idx !== -1 ? idx : 0;
  });

  useEffect(() => {
    const idx = reels.findIndex((r) => r.id === initialReelId);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setViewMode('reels');
    }
  }, [initialReelId]);

  const reel = reels[currentIndex] || reels[0];
  const currentIsLiked = likedReelIds && reel ? likedReelIds.includes(reel.id) : isLiked;
  const [videoSrc, setVideoSrc] = useState<string>(() => reel?.videoUrl || '');
  const [videoFailed, setVideoFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  // Continuously preload more AI reels as user approaches the end of the current list
  const onLoadMoreRef = useRef(onLoadMoreReels);
  onLoadMoreRef.current = onLoadMoreReels;

  useEffect(() => {
    if (viewMode === 'reels' && hasMore && onLoadMoreRef.current && currentIndex >= Math.max(0, reels.length - 4)) {
      onLoadMoreRef.current();
    }
  }, [currentIndex, reels.length, viewMode, hasMore]);

  useEffect(() => {
    setThumbFailed(false);
  }, [reel?.id, reel?.thumbnailUrl]);

  useEffect(() => {
    let isCancelled = false;
    let createdBlobUrl = '';

    const resolveVideo = async () => {
      setVideoFailed(false);
      setShowWatchAgain(false);

      if (!reel) {
        setVideoSrc('');
        return;
      }

      // Check IndexedDB for uploaded user videos by reel.id
      if (reel.id) {
        const dbBlob = await getVideoFromDB(reel.id);
        if (dbBlob && !isCancelled) {
          createdBlobUrl = URL.createObjectURL(dbBlob);
          setVideoSrc(createdBlobUrl);
          return;
        }
      }

      // Check if videoUrl starts with 'local:'
      if (reel.videoUrl?.startsWith('local:')) {
        const localKey = reel.videoUrl.replace('local:', '');
        const dbBlob = await getVideoFromDB(localKey);
        if (dbBlob && !isCancelled) {
          createdBlobUrl = URL.createObjectURL(dbBlob);
          setVideoSrc(createdBlobUrl);
          return;
        }
      }

      // If it's a broken sample bucket URL from legacy seed data, sanitize it; otherwise preserve user's original URL!
      if (!isCancelled) {
        const sanitized = normalizeVideoUrl(reel.videoUrl, currentIndex);
        setVideoSrc(sanitized || reel.videoUrl || '');
      }
    };

    resolveVideo();

    return () => {
      isCancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [currentIndex, reel?.id, reel?.videoUrl]);

  // Master & Reel Earning Eligibility controlled by Admin (own reels never earn points)
  const isOwnReel = Boolean(currentUserId && reel?.userId === currentUserId);
  const masterEarningOn = earningSettings ? earningSettings.isMasterEarningEnabled : true;
  const videoEarningOn = earningSettings ? earningSettings.isVideoWatchEarningEnabled : true;
  const scope = earningSettings?.videoEarningScope || 'all_reels';
  
  // Specific reel earning criteria
  const isReelEligible = scope === 'offer_reels_only'
    ? Boolean(reel?.isEarningEnabled || reel?.isSpecialOffer)
    : (reel?.isEarningEnabled !== false);

  const isEarningActive = masterEarningOn && videoEarningOn && isReelEligible && !isOwnReel;

  // Custom seconds controlled by admin (per reel or default app setting)
  const totalSeconds = (reel?.customWatchSeconds && reel.customWatchSeconds > 0)
    ? reel.customWatchSeconds
    : (earningSettings?.videoWatchDurationSeconds || 15);

  const currentRewardPoints = reel?.pointsReward || earningSettings?.defaultVideoRewardPoints || 10;

  const [watchSeconds, setWatchSeconds] = useState(0);
  const [hasClaimedCurrent, setHasClaimedCurrent] = useState(false);
  const [modalNotice, setModalNotice] = useState<string | null>(null);
  const isFollowingCurrent = followingIds
    ? Boolean(reel && followingIds.includes(reel.userId))
    : isFollowingCreator;
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const [isSpringing, setIsSpringing] = useState(false);
  const [showIncrement, setShowIncrement] = useState(false);
  const [incrementKey, setIncrementKey] = useState(0);
  const [centerHeartAnim, setCenterHeartAnim] = useState(false);
  const [showWatchAgain, setShowWatchAgain] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoplayMuted, setAutoplayMuted] = useState(false);
  const isPausedRef = useRef(false);
  const [tapPulse, setTapPulse] = useState<'pause' | 'play' | null>(null);
  const [autoAdvanceToast, setAutoAdvanceToast] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextClickRef = useRef(false);
  const onVideoCompletedRef = useRef(onVideoCompleted);
  onVideoCompletedRef.current = onVideoCompleted;

  const safePlayVideo = async (vid: HTMLVideoElement | null) => {
    if (!vid || isPausedRef.current) return;
    try {
      vid.muted = isMuted;
      await vid.play();
      setAutoplayMuted(false);
    } catch {
      if (!vid.muted) {
        try {
          vid.muted = true;
          await vid.play();
          setAutoplayMuted(true);
        } catch {
          // Wait for user interaction
        }
      }
    }
  };

  const showModalNotice = (msg: string) => {
    setModalNotice(msg);
    setTimeout(() => setModalNotice(null), 2600);
  };

  const isReelAlreadyClaimed = hasClaimedCurrent || (reel ? watchedReelIds.includes(reel.id) : false);
  const requireFullWatch = earningSettings ? earningSettings.requireFullWatchTimeInFullScreen !== false : true;
  const isLimitActive = Boolean(earningSettings?.isDailyReelLimitEnabled !== false);

  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const lastWheelNavRef = useRef<number>(0);

  // Clear pending tap / auto-advance timers on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (tapPulseTimeoutRef.current) clearTimeout(tapPulseTimeoutRef.current);
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    };
  }, []);

  // Reset pause & auto-advance state whenever switching reels
  useEffect(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
    isPausedRef.current = false;
    setIsPaused(false);
    setAutoplayMuted(false);
    setShowWatchAgain(false);
    setAutoAdvanceToast(false);
    setTapPulse(null);
  }, [currentIndex, reel?.id]);

  const togglePlayPause = () => {
    const vid = videoRef.current;
    const currentlyPlaying = vid ? !vid.paused : !isPausedRef.current;
    const nextPaused = currentlyPlaying;
    isPausedRef.current = nextPaused;
    setIsPaused(nextPaused);

    if (vid) {
      if (nextPaused) {
        vid.pause();
      } else {
        setShowWatchAgain(false);
        vid.muted = isMuted;
        setAutoplayMuted(false);
        vid.play().catch(() => {
          safePlayVideo(vid);
        });
      }
    }

    if (tapPulseTimeoutRef.current) clearTimeout(tapPulseTimeoutRef.current);
    setTapPulse(nextPaused ? 'pause' : 'play');
    tapPulseTimeoutRef.current = setTimeout(() => {
      setTapPulse(null);
    }, 650);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const diffY = touchStartY.current - touchEndY;
    const diffX = touchStartX.current - touchEndX;
    if (Math.abs(diffY) > 45 || Math.abs(diffX) > 45) {
      ignoreNextClickRef.current = true;
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      if (diffY > 45) {
        goNext();
      } else if (diffY < -45) {
        goPrev();
      }
    }
  };

  const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'reels') return;
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, select, iframe, [role="button"]')) {
      return;
    }

    if (tapTimeoutRef.current) {
      // 2nd tap within 240ms -> Double-Tap Like (do NOT toggle pause)
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
      handleDoubleTapLike();
      return;
    }

    // 1st single tap -> toggle Pause / Play after disambiguation window
    tapTimeoutRef.current = setTimeout(() => {
      tapTimeoutRef.current = null;
      togglePlayPause();
    }, 240);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode !== 'reels') return;
    if (Math.abs(e.deltaY) < 25) return;
    const now = Date.now();
    if (now - lastWheelNavRef.current < 420) return;
    lastWheelNavRef.current = now;
    if (e.deltaY > 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (viewMode !== 'reels') return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Watch Timer Progress (pauses cleanly when video is paused)
  useEffect(() => {
    setWatchSeconds(0);
    setHasClaimedCurrent(reel ? watchedReelIds.includes(reel.id) : false);

    if (videoRef.current && viewMode === 'reels' && !isPausedRef.current) {
      videoRef.current.currentTime = 0;
      safePlayVideo(videoRef.current);
    }

    if (!isEarningActive || isDailyLimitReached || (reel && watchedReelIds.includes(reel.id))) {
      return;
    }

    const timer = setInterval(() => {
      if (isPausedRef.current) return;
      setWatchSeconds((prev) => {
        if (prev >= totalSeconds) {
          clearInterval(timer);
          return totalSeconds;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, reel?.id, totalSeconds, isEarningActive, isDailyLimitReached]);

  // Pause background reel video when viewing Live tab, resume when back on Reels (if not manually paused)
  useEffect(() => {
    if (!videoRef.current) return;
    if (viewMode === 'live') {
      videoRef.current.pause();
    } else if (!isPausedRef.current) {
      safePlayVideo(videoRef.current);
    }
  }, [viewMode]);

  // Fallback view tracking & auto-advance for AI visual motion reels (YouTube/Vimeo or image-motion reels)
  const resolvedYtId = extractYouTubeId(videoSrc);
  const resolvedVimeoId = extractVimeoId(videoSrc);
  const isNativeVideoElement = !resolvedYtId && !resolvedVimeoId && !videoFailed && Boolean(videoSrc);

  useEffect(() => {
    if (viewMode !== 'reels' || !reel?.id || isNativeVideoElement) {
      return;
    }
    let elapsed = 0;
    const isVisualOnly = !resolvedYtId && !resolvedVimeoId;
    const targetDuration = Math.max(1, totalSeconds);
    const autoSlideDuration = Math.max(8, Math.min(10, totalSeconds));
    let completedSent = false;

    const viewTimer = setInterval(() => {
      if (isPausedRef.current) return;
      elapsed += 1;
      if (!completedSent && elapsed >= targetDuration) {
        completedSent = true;
        onVideoCompletedRef.current?.(reel.id);
      }
      if (isVisualOnly && elapsed >= autoSlideDuration) {
        clearInterval(viewTimer);
        if (!completedSent) {
          completedSent = true;
          onVideoCompletedRef.current?.(reel.id);
        }
        setAutoAdvanceToast(true);
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          setAutoAdvanceToast(false);
          goNext();
        }, 280);
      }
    }, 1000);

    return () => clearInterval(viewTimer);
  }, [viewMode, reel?.id, isNativeVideoElement, resolvedYtId, resolvedVimeoId, totalSeconds]);

  // Sync mute state & ensure video starts playing cleanly when videoSrc resolves
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        setAutoplayMuted(false);
      }
      if (viewMode === 'reels' && !isPausedRef.current && videoSrc) {
        safePlayVideo(videoRef.current);
      }
    }
  }, [isMuted, videoSrc]);

  useEffect(() => {
    if (reel?.id && watchSeconds > 0 && totalSeconds > 0) {
      const pct = Math.min(100, (watchSeconds / totalSeconds) * 100);
      onWatchProgressChange?.(reel.id, pct);
    }
    if (isEarningActive && !isDailyLimitReached && !isReelAlreadyClaimed && watchSeconds >= totalSeconds) {
      handleClaimPoints(true);
    }
  }, [watchSeconds, isReelAlreadyClaimed, isEarningActive, isDailyLimitReached, totalSeconds, reel?.id, onWatchProgressChange]);

  // Handle claiming points (respects watch time & admin daily limit; strictly blocks own reels)
  const handleClaimPoints = (fromTimer = false) => {
    if (isOwnReel) {
      vibrateError();
      showModalNotice(
        lang === 'bn'
          ? '📺 নিজের ভিডিও দেখে পয়েন্ট অর্জন করা যাবে না। অন্য ইউজারের ভিডিও দেখুন!'
          : '📺 You cannot earn points from watching your own video.'
      );
      return;
    }

    if (!isEarningActive) {
      vibrateError();
      showModalNotice(lang === 'bn' ? '📺 এই ভিডিওতে পয়েন্ট আর্নিং বন্ধ রয়েছে।' : '📺 Point earning is disabled on this video.');
      return;
    }

    if (isReelAlreadyClaimed) {
      vibrateError();
      showModalNotice(lang === 'bn' ? '✓ আপনি ইতিমধ্যে এই রিলের পয়েন্ট সংগ্রহ করেছেন!' : '✓ You already collected points for this reel!');
      return;
    }

    if (isDailyLimitReached) {
      vibrateError();
      showModalNotice(
        lang === 'bn'
          ? `🔒 আজকের রিল আর্নিং লিমিট পূর্ণ হয়েছে! (${toBengaliNumber(dailyClaimsUsed, lang)}/${toBengaliNumber(dailyClaimsLimit, lang)} রিল)`
          : `🔒 Daily reel earning limit reached! (${dailyClaimsUsed}/${dailyClaimsLimit})`
      );
      return;
    }

    if (!fromTimer && requireFullWatch && watchSeconds < totalSeconds) {
      const remaining = Math.max(1, totalSeconds - watchSeconds);
      vibrateError();
      showModalNotice(
        lang === 'bn'
          ? `⏳ পয়েন্ট পেতে আর ${toBengaliNumber(remaining, lang)} সেকেন্ড ভিডিওটি দেখুন!`
          : `⏳ Watch ${remaining}s more to unlock points!`
      );
      return;
    }

    if (!isMuted) {
      playCoinSound();
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00e676', '#00c853', '#ffffff', '#ffab00'],
      });
    } catch {
      // Ignore
    }

    setHasClaimedCurrent(true);
    onRewardEarned(currentRewardPoints, reel.title, reel.id);
  };

  const handleLike = () => {
    if (!isMuted) playPopSound();

    const willBeLiked = !currentIsLiked;

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

      // Spawn floating heart
      const newHeart = { id: Date.now(), x: Math.random() * 40 - 20 };
      setFloatingHearts((prev) => [...prev, newHeart]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 1200);
    } else {
      setShowIncrement(false);
    }

    onToggleLike(reel.id);
  };

  const handleDoubleTapLike = () => {
    setCenterHeartAnim(true);
    setTimeout(() => setCenterHeartAnim(false), 850);

    if (!currentIsLiked) {
      handleLike();
    } else {
      if (!isMuted) playPopSound();
      vibrateLike(true);
      setIsSpringing(false);
      requestAnimationFrame(() => {
        setIsSpringing(true);
        setTimeout(() => setIsSpringing(false), 650);
      });
      const newHeart = { id: Date.now(), x: Math.random() * 40 - 20 };
      setFloatingHearts((prev) => [...prev, newHeart]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 1200);
    }
  };

  const handleShare = () => {
    onShare(reel);
  };

  const goNext = () => {
    if (hasMore && onLoadMoreRef.current && currentIndex >= Math.max(0, reels.length - 4)) {
      onLoadMoreRef.current();
    }
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (hasMore && onLoadMoreRef.current) {
      onLoadMoreRef.current();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const progressPercent = Math.min(100, (watchSeconds / totalSeconds) * 100);
  const likesDisplay = Math.max(0, reel.likesCount || 0);
  const fullScreenThumbSrc = thumbFailed
    ? '/images/ai_comedy_tea_stall.jpg'
    : (reel.thumbnailUrl || '/images/ai_comedy_tea_stall.jpg');
  const isImageMotionReel = !videoSrc && !reel.videoUrl;

  return (
    <div className="fixed inset-0 z-50 bg-black flex justify-center items-center select-none overflow-hidden">
      {/* Mobile Frame Container */}
      <div 
        className="relative w-full h-full max-w-md bg-neutral-950 flex flex-col justify-between overflow-hidden shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onClick={handleSurfaceClick}
      >
        {/* Background Visual (Video, YouTube Embed, or Animated AI Image) */}
        <div key={reel.id} className="absolute inset-0 z-0 animate-reel-slide-in" style={reel.filter ? { filter: reel.filter } : {}}>
          {(() => {
            const ytId = extractYouTubeId(videoSrc);
            const vimeoId = extractVimeoId(videoSrc);

            if (ytId) {
              return (
                <div className="w-full h-full relative overflow-hidden bg-black pointer-events-auto">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${ytId}&controls=0&modestbranding=1&playsinline=1&rel=0`}
                    title={reel.title}
                    className="w-full h-full object-cover scale-[1.3] pointer-events-auto border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }

            if (vimeoId) {
              return (
                <div className="w-full h-full relative overflow-hidden bg-black pointer-events-auto">
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=${isMuted ? 1 : 0}&loop=1&controls=0`}
                    title={reel.title}
                    className="w-full h-full object-cover scale-[1.3] pointer-events-auto border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                  />
                </div>
              );
            }

            if (!videoFailed && videoSrc) {
              return (
                <video
                  ref={videoRef}
                  key={`${reel?.id || 'reel'}-${videoSrc}`}
                  src={videoSrc}
                  poster={reel.thumbnailUrl}
                  autoPlay={viewMode === 'reels'}
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  onLoadedData={(e) => {
                    if (viewMode === 'reels' && !isPausedRef.current && e.currentTarget.paused) {
                      safePlayVideo(e.currentTarget);
                    }
                  }}
                  onCanPlay={(e) => {
                    if (viewMode === 'reels' && !isPausedRef.current && e.currentTarget.paused) {
                      safePlayVideo(e.currentTarget);
                    }
                  }}
                  onPlay={() => {
                    isPausedRef.current = false;
                    setIsPaused(false);
                    setShowWatchAgain(false);
                  }}
                  onEnded={(e) => {
                    if (viewMode !== 'reels') return;
                    if (
                      reel?.id &&
                      Number.isFinite(e.currentTarget.duration) &&
                      e.currentTarget.duration > 0
                    ) {
                      onVideoCompletedRef.current?.(reel.id);
                    }
                    // Automatically play the next reel without manual scroll
                    if (currentIndex < reels.length - 1 || hasMore) {
                      setAutoAdvanceToast(true);
                      autoAdvanceTimeoutRef.current = setTimeout(() => {
                        setAutoAdvanceToast(false);
                        goNext();
                      }, 280);
                    } else {
                      setShowWatchAgain(true);
                    }
                  }}
                  onError={() => {
                    // DO NOT replace user's video with another video!
                    setVideoFailed(true);
                  }}
                  className="w-full h-full object-cover"
                />
              );
            }

            return (
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={fullScreenThumbSrc}
                  alt={reel.title}
                  className={`w-full h-full object-cover ${isImageMotionReel ? 'animate-ken-burns' : ''}`}
                  onError={() => setThumbFailed(true)}
                />
                {isImageMotionReel && (
                  <div className="absolute top-24 left-4 z-10 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-[10px] font-black flex items-center gap-1.5 shadow-md pointer-events-none">
                    <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
                    <span>{lang === 'bn' ? 'AI ভিজ্যুয়াল মোশন' : 'AI Visual Motion'}</span>
                  </div>
                )}
                {videoFailed && Boolean(videoSrc) && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
                    <AlertCircle className="w-9 h-9 text-amber-400 mb-2" />
                    <p className="text-sm font-bold text-white mb-1">
                      {lang === 'bn' ? 'ইউজারের মূল ভিডিও চালানো যায়নি' : 'Original video could not be played'}
                    </p>
                    <p className="text-[11px] text-neutral-300 mb-3 max-w-xs">
                      {lang === 'bn'
                        ? 'ভিডিও ফরম্যাট বা লিংক চেক করুন।'
                        : 'Please check video format or link.'}
                    </p>
                    <button
                      onClick={() => {
                        setVideoFailed(false);
                        if (videoRef.current) {
                          videoRef.current.load();
                          videoRef.current.play().catch(() => {});
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Watch Again / Next Reel Overlay Buttons */}
          {showWatchAgain && viewMode === 'reels' && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[2px] transition-all animate-fade-in pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWatchAgain(false);
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.6)] flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-emerald-300"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{lang === 'bn' ? 'আবার দেখুন (Watch Again)' : 'Watch Again'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWatchAgain(false);
                  goNext();
                }}
                className="px-5 py-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs border border-white/25 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>{lang === 'bn' ? 'পরবর্তী রিল দেখুন' : 'Next Reel'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Gradients matching Screenshot 2 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
        </div>

        {/* Paused Overlay (1st tap pauses -> 2nd single tap resumes; pointer-events-none so tapping center works seamlessly) */}
        {isPaused && viewMode === 'reels' && !showWatchAgain && (
          <div className="absolute inset-0 z-25 pointer-events-none flex flex-col items-center justify-center gap-2.5 bg-black/25 backdrop-blur-[1px]">
            <div className="w-20 h-20 rounded-full bg-black/65 border-2 border-emerald-400/80 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.45)]">
              <Play className="w-10 h-10 text-emerald-400 fill-emerald-400 ml-1" />
            </div>
            <span className="px-3.5 py-1 rounded-full bg-black/75 border border-white/15 text-[11px] font-bold text-white shadow-lg">
              {lang === 'bn' ? 'ভিডিও পজ করা হয়েছে • চালু করতে ১ বার চাপুন' : 'Paused • Tap once to resume'}
            </span>
          </div>
        )}

        {/* Brief Tap Pulse Indicator on Play/Pause toggle */}
        {tapPulse && !isPaused && viewMode === 'reels' && (
          <div className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/60 border border-white/25 flex items-center justify-center animate-ping">
              {tapPulse === 'pause' ? (
                <Pause className="w-7 h-7 text-white fill-white" />
              ) : (
                <Play className="w-7 h-7 text-emerald-400 fill-emerald-400 ml-0.5" />
              )}
            </div>
          </div>
        )}

        {/* Auto-advance subtle toast */}
        {autoAdvanceToast && viewMode === 'reels' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-3.5 py-1 rounded-full bg-emerald-500 text-black text-[11px] font-black shadow-lg">
            {lang === 'bn' ? '▶ পরবর্তী ভিডিও চালু হচ্ছে...' : '▶ Playing next video...'}
          </div>
        )}

        {/* Sound unlock prompt when browser policy forced muted autoplay */}
        {autoplayMuted && !isMuted && viewMode === 'reels' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.play().catch(() => {});
              }
              setAutoplayMuted(false);
            }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-emerald-300 border border-emerald-400/50 text-[11px] font-bold shadow-lg flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সাউন্ড চালু করতে চাপুন' : 'Tap to unmute sound'}</span>
          </button>
        )}

        {/* Center Heart Pop for double tap */}
        {centerHeartAnim && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <Heart className="w-28 h-28 fill-rose-500 text-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.95)] animate-center-heart" />
          </div>
        )}

        {/* Floating Heart Animations */}
        {floatingHearts.map((h) => (
          <div
            key={h.id}
            className="absolute z-30 bottom-40 right-8 text-rose-500 pointer-events-none animate-floatUp"
            style={{ transform: `translateX(${h.x}px)` }}
          >
            <Heart className="w-8 h-8 fill-rose-500 drop-shadow-lg" />
          </div>
        ))}

        {/* TOP BAR matching Screenshot 2 with Reels vs Live Switcher */}
        <div className="relative z-20 pt-3 px-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-white tracking-wide">
                ReelPay <span className="text-emerald-400">✨</span>
              </span>
            </div>

            {/* Interactive Top Switcher: Reels vs Live */}
            <div className="flex items-center bg-black/60 backdrop-blur-md p-0.5 rounded-full border border-white/10 shadow-lg">
              <button
                onClick={() => setViewMode('reels')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  viewMode === 'reels'
                    ? 'bg-[#00c853] text-black shadow-md'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {lang === 'bn' ? 'রিলস' : 'Reels'}
              </button>
              <button
                onClick={() => setViewMode('live')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'live'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{lang === 'bn' ? 'লাইভ' : 'Live'}</span>
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                onClick={onToggleMute}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Mode Content: Live Streams vs Reels */}
        {viewMode === 'live' ? (
          /* FULL-SCREEN LIVE STREAM MODE */
          activeLiveStreams.length === 0 ? (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center mb-4">
                <Radio className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1.5">
                {lang === 'bn' ? 'বর্তমানে কোনো লাইভ চলছে না' : 'No Live Streams Right Now'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-xs mb-5">
                {lang === 'bn'
                  ? 'এই মুহূর্তে কোনো ক্রিয়েটর লাইভে নেই। আপনি রিলস দেখতে পারেন অথবা নিজেই লাইভ শুরু করতে পারেন।'
                  : 'No creators are live right now. Watch Reels or start your own live stream.'}
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setViewMode('reels')}
                  className="px-4 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black text-xs font-extrabold transition cursor-pointer"
                >
                  {lang === 'bn' ? 'রিলসে ফিরে যান' : 'Back to Reels'}
                </button>
                {onOpenLiveSheet && (
                  <button
                    onClick={onOpenLiveSheet}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition cursor-pointer"
                  >
                    {lang === 'bn' ? 'লাইভ করুন' : 'Go Live'}
                  </button>
                )}
              </div>
            </div>
          ) : (() => {
            const currentLive = activeLiveStreams[activeLiveIndex] || activeLiveStreams[0];
            return (
              <div className="relative z-10 flex-1 flex flex-col justify-between p-4 pt-2">
                {/* Live Host Stage Header */}
                <div className="flex items-center justify-between bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-rose-500/30 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={currentLive.hostAvatar}
                        alt={currentLive.hostName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-rose-500"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-rose-600 text-[8px] font-black text-white px-1 rounded uppercase border border-black animate-pulse">LIVE</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white flex items-center gap-1">
                        <span>{currentLive.hostName}</span>
                      </h3>
                      <p className="text-[10px] text-rose-300 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-rose-400" />
                        <span>{toBengaliNumber(currentLive.viewersCount || 0, lang)} {lang === 'bn' ? 'জন সরাসরি দেখছে' : 'watching live'}</span>
                      </p>
                    </div>
                  </div>

                  {onOpenLiveSheet && (
                    <button
                      onClick={onOpenLiveSheet}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'চ্যাট রুম' : 'Chat Room'}</span>
                    </button>
                  )}
                </div>

                {/* Live Stage Visual */}
                <div className="relative flex-1 my-3 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-950/40 via-neutral-900 to-black border border-rose-900/40 flex flex-col justify-center items-center text-center p-6 shadow-2xl">
                  <img
                    src={currentLive.hostAvatar}
                    alt={currentLive.hostName}
                    className="absolute inset-0 w-full h-full object-cover opacity-35 blur-xs"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-full bg-rose-600/30 border-2 border-rose-500/50 flex items-center justify-center mx-auto mb-3 animate-pulse shadow-lg">
                      <Mic className="w-8 h-8 text-rose-400" />
                    </div>
                    <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-md inline-block mb-2 animate-bounce">
                      🔴 LIVE STREAM
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-white drop-shadow-md">
                      {currentLive.title}
                    </h2>
                    <p className="text-xs text-neutral-300 mt-1 max-w-xs mx-auto">
                      {lang === 'bn' ? 'লাইভে মেসেজ করুন এবং প্রিয় ক্রিয়েটরকে গিফট পাঠান!' : 'Chat live and send gifts to support the host!'}
                    </p>
                  </div>

                  {/* Real Live Stats & Actions */}
                  <div className="relative z-10 flex gap-3 mt-5">
                    <div className="px-4 py-2 rounded-2xl bg-rose-600/80 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Heart className="w-4 h-4 fill-current" />
                      <span>{toBengaliNumber(currentLive.likesCount || 0, lang)}</span>
                    </div>
                    {isGiftsEnabled && onOpenGiftSheet && !(currentUserId && currentLive.hostId === currentUserId) && (
                      <button
                        type="button"
                        onClick={() => onOpenGiftSheet(reel)}
                        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-extrabold text-xs transition flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
                      >
                        <Gift className="w-4 h-4" />
                        <span>{lang === 'bn' ? '🎁 গিফট পাঠান' : '🎁 Send Gift'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Live Chat Action */}
                <div className="relative z-20 flex items-center justify-between gap-2 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <span className="text-xs text-neutral-300 font-medium truncate flex-1">
                    💬 {lang === 'bn' ? 'লাইভ চ্যাট চলছে...' : 'Live chat active...'}
                  </span>
                  {onOpenLiveSheet && (
                    <button
                      onClick={onOpenLiveSheet}
                      className="px-3 py-1.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-bold text-xs transition cursor-pointer shadow-md"
                    >
                      {lang === 'bn' ? 'লাইভে যোগ দিন' : 'Join Live'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          /* STANDARD REELS MODE */
          <div className="relative z-10 flex-1 flex flex-col justify-between">
            {/* Watch Progress Bar & Coin Counter matching Screenshot 2 or Entertainment Banner */}
            {isEarningActive ? (
              <div className="w-full flex flex-col gap-1 mt-1 px-4">
                {modalNotice && (
                  <div className="mx-auto mb-1 px-3 py-1.5 rounded-xl bg-black/85 border border-amber-400/50 text-amber-200 text-[11px] font-bold shadow-lg text-center animate-in fade-in">
                    {modalNotice}
                  </div>
                )}

                {/* Special Offer Badge if configured by Admin */}
                {reel.isSpecialOffer && (
                  <div className="self-start px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-black font-black text-[10px] flex items-center gap-1 shadow-md animate-pulse mb-0.5">
                    <Flame className="w-3 h-3 fill-current text-black" />
                    <span>{reel.specialOfferBadge || (lang === 'bn' ? '🔥 স্পেশাল অফার রিল' : '🔥 Special Offer')} (+{toBengaliNumber(currentRewardPoints, lang)} Pts)</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400/80 px-1 mb-0.5">
                  <span>
                    {isDailyLimitReached
                      ? (lang === 'bn' ? '🔒 আজকের লিমিট পূর্ণ হয়েছে' : '🔒 Daily Limit Reached')
                      : isReelAlreadyClaimed
                      ? (lang === 'bn' ? '✓ এই রিলের পয়েন্ট অর্জিত' : '✓ Reel Points Claimed')
                      : (lang === 'bn' ? 'রিওয়ার্ড প্রগ্রেস' : 'Reward Progress')}
                  </span>
                  <span>
                    {isDailyLimitReached || isReelAlreadyClaimed
                      ? '১০০%'
                      : `${toBengaliNumber(Math.round(progressPercent), lang)}%`}
                  </span>
                </div>
                <div className="w-full bg-neutral-800/80 rounded-full h-1.5 overflow-hidden backdrop-blur-sm relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 shadow-sm ${
                      isDailyLimitReached ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
                    }`}
                    style={{ width: `${isDailyLimitReached || isReelAlreadyClaimed ? 100 : progressPercent}%` }}
                  />
                </div>
                
                {/* Level Progress Bar matching prompt: Next Reel Reward (Higher multiplier) */}
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-[9px] font-bold text-amber-400/80 px-1 mb-0.5">
                    <span>{lang === 'bn' ? 'পরবর্তী লেভেল রিওয়ার্ড' : 'Next Level Reward'}</span>
                    <span>{toBengaliNumber(Math.round(levelProgress), lang)}%</span>
                  </div>
                  <div className="w-full bg-neutral-800/60 rounded-full h-1 overflow-hidden backdrop-blur-sm">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-300 drop-shadow-sm mt-1">
                  {isLimitActive && (dailyClaimsLimit > 0 || dailyPointsLimit > 0) ? (
                    <span className={isDailyLimitReached ? 'text-amber-300 font-bold' : 'text-neutral-300'}>
                      {lang === 'bn'
                        ? `লিমিট: ${dailyClaimsLimit > 0 ? `${toBengaliNumber(dailyClaimsUsed, lang)}/${toBengaliNumber(dailyClaimsLimit, lang)} রিল` : ''}${dailyClaimsLimit > 0 && dailyPointsLimit > 0 ? ' • ' : ''}${dailyPointsLimit > 0 ? `${toBengaliNumber(dailyPointsUsed, lang)}/${toBengaliNumber(dailyPointsLimit, lang)} Pts` : ''}`
                        : `Limit: ${dailyClaimsLimit > 0 ? `${dailyClaimsUsed}/${dailyClaimsLimit} reels` : ''}${dailyClaimsLimit > 0 && dailyPointsLimit > 0 ? ' • ' : ''}${dailyPointsLimit > 0 ? `${dailyPointsUsed}/${dailyPointsLimit} pts` : ''}`}
                    </span>
                  ) : <span />}
                  <span>
                    পয়েন্ট +{toBengaliNumber(currentRewardPoints, lang)} • {toBengaliNumber(Math.floor(watchSeconds / 60), lang)}:
                    {toBengaliNumber(watchSeconds % 60 < 10 ? `0${watchSeconds % 60}` : watchSeconds % 60, lang)} /{' '}
                    {toBengaliNumber(Math.floor(totalSeconds / 60), lang)}:{toBengaliNumber(totalSeconds % 60 < 10 ? `0${totalSeconds % 60}` : totalSeconds % 60, lang)} 🪙
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full mt-1 px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-md border border-neutral-800/80 flex items-center justify-between text-xs">
                <div className={`flex items-center gap-1.5 font-bold ${isOwnReel ? 'text-emerald-300' : 'text-amber-300'}`}>
                  <Eye className={`w-3.5 h-3.5 ${isOwnReel ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>
                    {isOwnReel
                      ? (lang === 'bn' ? 'আপনার নিজের ভিডিও (আয় প্রযোজ্য নয়)' : 'Your Own Video (No Self-Earn)')
                      : (lang === 'bn' ? 'বিনোদন মোড (আর্নিং বন্ধ)' : 'Entertainment Mode (Earning Off)')}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {lang === 'bn' ? 'শুধুমাত্র ভিডিও দেখুন' : 'Watch only'}
                </span>
              </div>
            )}

          {/* Up / Down navigation buttons for quick flipping */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 pointer-events-auto">
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-emerald-500 hover:text-black transition shadow-lg cursor-pointer"
              title="পূর্ববর্তী রিল"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          )}
          {(currentIndex < reels.length - 1 || hasMore) && (
            <button
              onClick={goNext}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-emerald-500 hover:text-black transition shadow-lg cursor-pointer"
              title="পরবর্তী রিল"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* RIGHT SIDE FLOATING ACTION DOCK matching Screenshot 2 */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-20 self-end mr-3 mb-2 flex flex-col items-center gap-4 text-white"
        >
          {/* Like Button */}
          <button
            onClick={handleLike}
            className="relative flex flex-col items-center gap-0.5 cursor-pointer group select-none"
            aria-label={currentIsLiked ? (lang === 'bn' ? 'আনলাইক করুন' : 'Unlike') : (lang === 'bn' ? 'লাইক করুন' : 'Like')}
          >
            {/* Animated floating number increment badge (+1 / +১) */}
            {showIncrement && (
              <div
                key={incrementKey}
                className="absolute -top-4 pointer-events-none z-30 flex items-center justify-center animate-increment-float select-none"
              >
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xl shadow-rose-500/60 flex items-center gap-0.5 tabular-nums ring-1 ring-white/30 drop-shadow">
                  <span>+</span>
                  <span>{toBengaliNumber(1, lang)}</span>
                </span>
              </div>
            )}

            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Burst shockwave ring & sparkles when springing */}
              {isSpringing && currentIsLiked && (
                <>
                  <span className="absolute inset-0 rounded-2xl border-2 border-rose-500/90 pointer-events-none animate-heart-burst" />
                  <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-rose-400 pointer-events-none animate-ping" />
                  <span className="absolute -right-1 w-1.5 h-1.5 rounded-full bg-pink-400 pointer-events-none animate-ping" />
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-rose-400 pointer-events-none animate-ping" />
                  <span className="absolute -left-1 w-1.5 h-1.5 rounded-full bg-pink-400 pointer-events-none animate-ping" />
                </>
              )}

              <div
                className={`w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all ${
                  currentIsLiked
                    ? 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                    : 'text-white hover:bg-black/60'
                } ${isSpringing ? 'animate-heart-spring' : ''}`}
              >
                <Heart
                  className={`w-6 h-6 transition-transform duration-150 ${
                    currentIsLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
                  }`}
                />
              </div>
            </div>

            <span
              className={`text-xs font-bold drop-shadow tabular-nums transition-colors duration-200 ${
                currentIsLiked ? 'text-rose-400' : 'text-white'
              } ${showIncrement ? 'animate-number-bump' : ''}`}
            >
              {toBengaliNumber(likesDisplay, lang)}
            </span>
          </button>

          {/* Comment Button */}
          {isCommentsEnabled && (
            <button
              onClick={() => onOpenComments(reel)}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold drop-shadow">
                {toBengaliNumber(reel.commentsCount)}
              </span>
            </button>
          )}

          {/* Bookmark / সেভ Button */}
          <button
            onClick={() => {
              if (!isMuted) playPopSound();
              if (onToggleSave && reel) onToggleSave(reel.id);
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer group select-none transition ${
              savedReelIds?.includes(reel?.id) ? 'text-amber-400' : 'text-white'
            }`}
            aria-label={savedReelIds?.includes(reel?.id) ? (lang === 'bn' ? 'আনসেভ করুন' : 'Remove Bookmark') : (lang === 'bn' ? 'সেভ করুন' : 'Bookmark')}
            title={savedReelIds?.includes(reel?.id) ? (lang === 'bn' ? 'সংরক্ষিত থেকে সরান' : 'Remove from saved') : (lang === 'bn' ? 'ফেভারিট সেভ করুন' : 'Save to favorites')}
          >
            <div className={`w-12 h-12 rounded-2xl backdrop-blur-md border flex items-center justify-center transition-all ${
              savedReelIds?.includes(reel?.id)
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
            }`}>
              <Bookmark className={`w-6 h-6 transition-transform duration-150 ${savedReelIds?.includes(reel?.id) ? 'fill-amber-400 text-amber-400 scale-110' : ''}`} />
            </div>
            <span className={`text-xs font-bold drop-shadow ${savedReelIds?.includes(reel?.id) ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
              {lang === 'bn' ? (savedReelIds?.includes(reel?.id) ? 'সংরক্ষিত' : 'সেভ') : (savedReelIds?.includes(reel?.id) ? 'Saved' : 'Save')}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-0.5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold drop-shadow tabular-nums">
              {reel.sharesCount ? toBengaliNumber(reel.sharesCount, lang) : (lang === 'bn' ? 'শেয়ার' : 'Share')}
            </span>
          </button>

          {/* Gift / উপহার Button (strictly hidden on user's own reels) */}
          {isGiftsEnabled && onOpenGiftSheet && !isOwnReel && (
            <button
              type="button"
              onClick={() => onOpenGiftSheet(reel)}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-black/65 transition text-rose-400">
                <Gift className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold drop-shadow">
                {lang === 'bn' ? 'উপহার' : 'Gift'}
              </span>
            </button>
          )}

          {/* Reward Button or Own Reel / Entertainment Badge */}
          {isEarningActive ? (
            <button
              type="button"
              onClick={() => handleClaimPoints(false)}
              className={`px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-xl transition-all active:scale-95 cursor-pointer tabular-nums ${
                isReelAlreadyClaimed
                  ? 'bg-emerald-950/85 text-emerald-400 border border-emerald-500/40'
                  : isDailyLimitReached
                  ? 'bg-neutral-900/90 text-amber-300 border border-amber-500/40'
                  : requireFullWatch && watchSeconds < totalSeconds
                  ? 'bg-black/75 text-emerald-300 border border-emerald-500/40'
                  : reel.isSpecialOffer
                  ? 'bg-gradient-to-r from-amber-400 to-[#00c853] hover:from-amber-300 hover:to-[#00e676] text-black shadow-amber-500/40 border border-amber-300'
                  : 'bg-[#00c853] hover:bg-[#00e676] text-black shadow-emerald-500/40'
              }`}
            >
              {reel.isSpecialOffer && !isDailyLimitReached && !isReelAlreadyClaimed ? (
                <Flame className="w-4 h-4 fill-current text-black" />
              ) : (
                <Sparkles className="w-4 h-4 fill-current" />
              )}
              <span>
                {isReelAlreadyClaimed
                  ? (lang === 'bn' ? 'পয়েন্ট অর্জিত ✓' : 'Earned ✓')
                  : isDailyLimitReached
                  ? (lang === 'bn' ? '🔒 লিমিট পূর্ণ' : '🔒 Limit Reached')
                  : requireFullWatch && watchSeconds < totalSeconds
                  ? `⏳ ${toBengaliNumber(Math.max(1, totalSeconds - watchSeconds), lang)}s • +${toBengaliNumber(currentRewardPoints, lang)}`
                  : `+${toBengaliNumber(currentRewardPoints, lang)} পয়েন্ট`}
              </span>
            </button>
          ) : (
            <div className="px-2.5 py-1.5 rounded-2xl text-[10px] font-bold bg-neutral-900/90 text-neutral-300 border border-neutral-700/70 flex items-center gap-1 shadow-md select-none">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isOwnReel
                  ? (lang === 'bn' ? 'নিজের রিল' : 'Own Reel')
                  : (lang === 'bn' ? 'আর্নিং বন্ধ' : 'Earning Off')}
              </span>
            </div>
          )}
        </div>

        {/* BOTTOM METADATA OVERLAY matching Screenshot 2 */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-20 px-4 pb-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-6"
        >
          {/* Creator row */}
          <div className="flex items-center gap-2.5 mb-2">
            <button
              type="button"
              className="flex items-center gap-2.5 cursor-pointer group/creator text-left min-w-0"
              onClick={(e) => {
                e.stopPropagation();
                onOpenProfile && onOpenProfile(reel.userId);
              }}
              title={
                lang === 'bn'
                  ? `${reel.creatorName}-এর প্রোফাইল দেখুন`
                  : `View ${reel.creatorName}'s profile`
              }
            >
              <div className="relative shrink-0">
                <img
                  src={reel.creatorAvatar}
                  alt={reel.creatorName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shadow-md group-hover/creator:border-white transition"
                />
                {reel.isVerified && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-black rounded-full flex items-center justify-center text-[9px] font-black">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-sm font-extrabold text-white tracking-wide group-hover/creator:text-emerald-400 group-hover/creator:underline transition truncate">
                  {reel.creatorName}
                </span>
                {reel.title && (
                  <span className="text-[11px] text-neutral-300/90 truncate">
                    {reel.title}
                  </span>
                )}
              </div>
            </button>

            {/* Follow Button (hidden on own reels) */}
            {onToggleFollow && (!currentUserId || reel.userId !== currentUserId) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow(reel.userId, reel.creatorName);
                }}
                className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer ${
                  isFollowingCurrent
                    ? 'bg-neutral-800/90 text-neutral-300 border border-neutral-600 hover:bg-neutral-700'
                    : 'bg-gradient-to-r from-[#00e676] to-[#00c853] hover:from-[#00ff88] hover:to-[#00e676] text-black ring-2 ring-emerald-400/60 shadow-emerald-500/40 animate-pulse'
                }`}
                title={lang === 'bn' ? 'ক্রিয়েটরকে ফলো করুন' : 'Follow Creator'}
              >
                {isFollowingCurrent ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{lang === 'bn' ? 'ফলোয়িং' : 'Following'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ ফলো' : '+ Follow'}</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Direct Message Button (hidden on own reels) */}
            {onOpenChatWithCreator && isDirectChatEnabled && (!currentUserId || reel.userId !== currentUserId) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChatWithCreator(reel.userId);
                }}
                className="w-7 h-7 rounded-full bg-black/60 hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition shadow-md active:scale-95 cursor-pointer ml-0.5"
                title={lang === 'bn' ? 'ক্রিয়েটরকে মেসেজ পাঠান' : 'Message Creator'}
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Badge & Special Tags */}
          <div className="flex items-center gap-2 mb-2">
            {reel.category && (() => {
              const catMeta = getCategoryMeta(reel.category);
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectCategory) {
                      onSelectCategory(reel.category);
                      onClose();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border backdrop-blur-md shadow-md transition-all active:scale-95 cursor-pointer hover:brightness-125 select-none ${catMeta.badgeBg} ${catMeta.badgeBorder} ${catMeta.badgeText}`}
                  title={
                    lang === 'bn'
                      ? `${catMeta.labelBn} ক্যাটাগরির রিল দেখুন`
                      : `View ${catMeta.labelEn} reels`
                  }
                >
                  <span className="text-xs">{catMeta.icon}</span>
                  <span>{lang === 'bn' ? catMeta.labelBn : catMeta.labelEn}</span>
                </button>
              );
            })()}
            {reel.isSpecialOffer && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-black shadow-md flex items-center gap-1 border border-amber-300">
                <Flame className="w-3 h-3 fill-current text-black" />
                <span>{reel.specialOfferBadge || (lang === 'bn' ? 'অফার রিল' : 'Offer')}</span>
              </span>
            )}
          </div>

          {/* Caption & Hashtags */}
          <p className="text-sm text-slate-100 font-medium leading-relaxed drop-shadow-sm mb-1.5">
            {reel.caption}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {reel.hashtags.map((tag, idx) => (
              <span key={idx} className="text-xs font-semibold text-emerald-400">
                {tag}
              </span>
            ))}
          </div>

          {/* Audio Marquee & View Count */}
          <div className="flex items-center justify-between gap-2 text-xs text-neutral-300 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Music className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <div className="truncate font-medium">{reel.audioTrack}</div>
            </div>
            <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-slate-100 tabular-nums">
              <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{toBengaliNumber((reel.viewsCount || 0).toLocaleString('en-US'), lang)}</span>
              <span className="text-[9px] text-neutral-300 font-medium">
                {lang === 'bn' ? 'ভিউ' : 'views'}
              </span>
            </div>
          </div>
        </div>
        </div>
        )}
      </div>
    </div>
  );
};
