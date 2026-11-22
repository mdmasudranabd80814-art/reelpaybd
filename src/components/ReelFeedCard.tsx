import React from 'react';
import { Play, Heart, MessageCircle, Share2, Check, Sparkles, Flame, Eye, Bookmark } from 'lucide-react';
import { Reel, EarningSettings } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { playPopSound } from '../utils/audio';
import { extractYouTubeId } from '../utils/video';
import { getCategoryMeta } from '../utils/categories';

interface ReelFeedCardProps {
  reel: Reel;
  isLiked: boolean;
  hasWatched: boolean;
  onLikeToggle: (reelId: string) => void;
  onOpenReel: (reel: Reel) => void;
  onOpenComments: (reel: Reel) => void;
  onClaimDirect: (reel: Reel) => void;
  onOpenGift: (reel: Reel) => void;
  onOpenCreatorProfile: (userId: string) => void;
  onShare: (reel: Reel) => void;
  lang: 'bn' | 'en';
  isMuted: boolean;
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
}

export const ReelFeedCard: React.FC<ReelFeedCardProps> = ({
  reel,
  isLiked,
  hasWatched,
  onLikeToggle,
  onOpenReel,
  onOpenComments,
  onClaimDirect,
  onOpenGift,
  onOpenCreatorProfile,
  onShare,
  lang,
  isMuted,
  levelProgress,
  earningSettings,
  isDailyLimitReached = false,
  isSaved = false,
  onToggleSave,
  isGiftsEnabled = true,
  isCommentsEnabled = true,
  currentUserId,
  onSelectCategory,
  activeCategory,
}) => {
  const [isSpringing, setIsSpringing] = React.useState(false);
  const [isBookmarkSpringing, setIsBookmarkSpringing] = React.useState(false);
  const [showIncrement, setShowIncrement] = React.useState(false);
  const [incrementKey, setIncrementKey] = React.useState(0);
  const [imgLoaded, setImgLoaded] = React.useState(false);

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
  const ytId = extractYouTubeId(reel.videoUrl);
  const displayThumbnail = (ytId && (!reel.thumbnailUrl || reel.thumbnailUrl.includes('unsplash')))
    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    : (reel.thumbnailUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80');

  return (
    <div className="flex gap-2.5 items-end mb-4">
      {/* Video Preview Container */}
      <div
        onClick={() => onOpenReel(reel)}
        className="relative flex-1 h-64 sm:h-72 rounded-2xl overflow-hidden bg-[#101914] border border-emerald-950/60 cursor-pointer group shadow-lg"
      >
        {/* Skeleton State */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Background Image / Video Poster */}
        <img
          src={displayThumbnail}
          alt={reel.title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={reel.filter ? { filter: reel.filter } : {}}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

        {/* Centered Circular Play Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border-2 border-emerald-400/80 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-300 transition-all duration-200 shadow-lg shadow-black/50">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Category badge button on top left & Own Reel / Special Offer badge on top right */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10 pointer-events-none">
          <button
            type="button"
            onClick={handleCategoryClick}
            className={`pointer-events-auto px-2.5 py-1 rounded-xl text-[11px] font-black backdrop-blur-md border shadow-md flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 group/cat hover:brightness-125 select-none ${
              categoryMeta.badgeBg
            } ${categoryMeta.badgeBorder} ${categoryMeta.badgeText} ${
              activeCategory === reel.category ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black/50 shadow-emerald-500/25' : ''
            }`}
            title={
              lang === 'bn'
                ? `${categoryMeta.labelBn} ক্যাটাগরির রিল ফিল্টার করুন`
                : `Filter feed by ${categoryMeta.labelEn}`
            }
          >
            <span className="text-xs transition-transform duration-200 group-hover/cat:scale-125">
              {categoryMeta.icon}
            </span>
            <span className="tracking-wide">
              {lang === 'bn' ? categoryMeta.labelBn : categoryMeta.labelEn}
            </span>
          </button>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {isOwnReel ? (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/35">
                {lang === 'bn' ? 'আপনার রিল' : 'Your Reel'}
              </span>
            ) : reel.isSpecialOffer ? (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-black shadow-lg flex items-center gap-1 border border-amber-300">
                <Flame className="w-3 h-3 fill-current text-black" />
                <span>{reel.specialOfferBadge || (lang === 'bn' ? 'অফার রিল' : 'Offer')}</span>
              </span>
            ) : !isEarningActive ? (
              <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-neutral-900/80 backdrop-blur-md text-neutral-300 border border-neutral-700/60 flex items-center gap-1">
                <Eye className="w-2.5 h-2.5" />
                <span>{lang === 'bn' ? 'শুধু বিনোদন' : 'No Earn'}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Progress Bar towards next level/reward matching prompt */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            style={{ width: `${levelProgress}%` }}
          />
        </div>

        {/* Bottom Creator Pill & View Count Social Proof */}
        <div className="absolute bottom-3 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer group/creator min-w-0 flex-1 text-left"
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
              <div className={`w-7 h-7 rounded-full bg-neutral-800 ${!imgLoaded ? 'animate-pulse' : ''}`}>
                <img
                  src={reel.creatorAvatar}
                  alt={reel.creatorName}
                  className={`w-7 h-7 rounded-full object-cover border border-emerald-400 group-hover/creator:border-white transition-all ${
                    imgLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
              {reel.isVerified && imgLoaded && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-black rounded-full flex items-center justify-center text-[8px] font-black">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {imgLoaded ? (
                <>
                  <p className="text-xs font-extrabold text-white truncate drop-shadow-sm group-hover/creator:text-emerald-400 group-hover/creator:underline transition-colors">
                    {reel.creatorName}
                  </p>
                  <div className="text-[10px] font-medium text-neutral-300/90 truncate drop-shadow-sm flex items-center gap-1.5 mt-0.5">
                    <button
                      type="button"
                      onClick={handleCategoryClick}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black border transition-all cursor-pointer hover:brightness-125 shrink-0 ${
                        categoryMeta.badgeBg
                      } ${categoryMeta.badgeBorder} ${categoryMeta.badgeText}`}
                      title={
                        lang === 'bn'
                          ? `${categoryMeta.labelBn} ক্যাটাগরি ফিল্টার করুন`
                          : `Filter by ${categoryMeta.labelEn}`
                      }
                    >
                      <span>{categoryMeta.icon}</span>
                      <span>{lang === 'bn' ? categoryMeta.labelBn : categoryMeta.labelEn}</span>
                    </button>
                    <span className="text-neutral-500 text-[8px] shrink-0">•</span>
                    <span className="truncate">{reel.title}</span>
                  </div>
                </>
              ) : (
                <div className="h-3 bg-neutral-800 rounded w-24 animate-pulse" />
              )}
            </div>
          </button>

          {/* View Count Indicator */}
          <div
            data-testid="reel-view-count"
            className={`shrink-0 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border text-[10px] font-bold flex items-center gap-1 tabular-nums shadow-sm transition-all duration-300 pointer-events-none ${
              viewJustIncremented
                ? 'border-emerald-400 text-emerald-300 scale-110 shadow-emerald-500/30'
                : 'border-white/15 text-slate-100'
            }`}
            title={lang === 'bn' ? 'মোট ভিউ' : 'Total views'}
          >
            <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{toBengaliNumber(viewsCount.toLocaleString('en-US'), lang)}</span>
            <span className="text-[9px] text-slate-300 font-medium">
              {lang === 'bn' ? 'ভিউ' : 'views'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side Vertical Action Dock matching Screenshot 1 + Prompt features */}
      <div className="flex flex-col items-center gap-2 shrink-0 py-1">
        {/* Heart / Like with spring animation and animated number increment */}
        <button
          onClick={handleLike}
          className="relative flex flex-col items-center gap-0.5 text-slate-300 hover:text-white transition group cursor-pointer select-none"
          aria-label={isLiked ? (lang === 'bn' ? 'আনলাইক করুন' : 'Unlike') : (lang === 'bn' ? 'লাইক করুন' : 'Like')}
        >
          {/* Animated floating number increment badge (+1 / +১) */}
          {showIncrement && (
            <div
              key={incrementKey}
              className="absolute -top-3.5 pointer-events-none z-20 flex items-center justify-center animate-increment-float select-none"
            >
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/50 flex items-center gap-0.5 tabular-nums ring-1 ring-white/30 drop-shadow-sm">
                <span>+</span>
                <span>{toBengaliNumber(1, lang)}</span>
              </span>
            </div>
          )}

          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Burst shockwave ring & sparkles when springing */}
            {isSpringing && isLiked && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-rose-500/80 pointer-events-none animate-heart-burst" />
                <span className="absolute -top-1 w-1 h-1 rounded-full bg-rose-400 pointer-events-none animate-ping" />
                <span className="absolute -right-1 w-1 h-1 rounded-full bg-pink-400 pointer-events-none animate-ping" />
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-rose-400 pointer-events-none animate-ping" />
                <span className="absolute -left-1 w-1 h-1 rounded-full bg-pink-400 pointer-events-none animate-ping" />
              </>
            )}

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isLiked
                  ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                  : 'text-slate-200 hover:bg-neutral-800/60'
              } ${isSpringing ? 'animate-heart-spring' : ''}`}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-150 ${
                  isLiked ? 'fill-current text-rose-500 scale-105' : ''
                }`}
              />
            </div>
          </div>

          <span
            className={`text-[10px] font-semibold tabular-nums transition-colors duration-200 ${
              isLiked ? 'text-rose-400 font-bold' : 'text-slate-300'
            } ${showIncrement ? 'animate-number-bump' : ''}`}
          >
            {toBengaliNumber(likesDisplay, lang)}
          </span>
        </button>

        {/* Comment */}
        {isCommentsEnabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(reel);
            }}
            className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-800/60 text-slate-200">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-slate-300">
              {toBengaliNumber(reel.commentsCount, lang)}
            </span>
          </button>
        )}

        {/* Bookmark / সেভ */}
        <button
          onClick={handleBookmark}
          className={`relative flex flex-col items-center gap-0.5 transition group cursor-pointer select-none ${
            isSaved ? 'text-amber-400' : 'text-slate-300 hover:text-white'
          }`}
          aria-label={isSaved ? (lang === 'bn' ? 'আনসেভ করুন' : 'Remove Bookmark') : (lang === 'bn' ? 'সেভ করুন' : 'Bookmark')}
          title={isSaved ? (lang === 'bn' ? 'সংরক্ষিত থেকে সরান' : 'Remove from saved') : (lang === 'bn' ? 'ফেভারিট সেভ করুন' : 'Save to favorites')}
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            {isBookmarkSpringing && isSaved && (
              <span className="absolute inset-0 rounded-full border-2 border-amber-400/80 pointer-events-none animate-ping" />
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isSaved
                  ? 'bg-amber-500/20 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                  : 'text-slate-200 hover:bg-neutral-800/60'
              } ${isBookmarkSpringing ? 'scale-125' : ''}`}
            >
              <Bookmark
                className={`w-4 h-4 transition-transform duration-150 ${
                  isSaved ? 'fill-current text-amber-400 scale-105' : ''
                }`}
              />
            </div>
          </div>
          <span
            className={`text-[10px] font-medium tabular-nums transition-colors duration-200 ${
              isSaved ? 'text-amber-300 font-bold' : 'text-slate-300'
            }`}
          >
            {lang === 'bn' ? (isSaved ? 'সংরক্ষিত' : 'সেভ') : (isSaved ? 'Saved' : 'Save')}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-white transition cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-800/60 text-slate-200">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-slate-300 tabular-nums">
            {reel.sharesCount ? toBengaliNumber(reel.sharesCount, lang) : (lang === 'bn' ? 'শেয়ার' : 'Share')}
          </span>
        </button>

        {/* Gift Button: strictly hidden on user's own reels */}
        {isGiftsEnabled && !isOwnReel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenGift(reel);
            }}
            className="flex flex-col items-center gap-0.5 cursor-pointer"
            title={lang === 'bn' ? 'গিফট পাঠান' : 'Send Gift'}
          >
            <div className="w-8 h-8 rounded-xl bg-[#ff2d55]/20 border border-[#ff2d55]/60 hover:bg-[#ff2d55] text-white flex items-center justify-center shadow-md transition active:scale-95 text-xs">
              🎁
            </div>
            <span className="text-[9px] font-bold text-rose-300">
              {lang === 'bn' ? 'গিফট' : 'Gift'}
            </span>
          </button>
        )}

        {/* Action Button: + পয়েন্ট বা শুধু দেখা (Own reels never earn points) */}
        {isEarningActive && allowFeedClaim ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClaimDirect(reel);
            }}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer tabular-nums ${
              hasWatched
                ? 'bg-emerald-950/85 text-emerald-400 border border-emerald-500/40'
                : isDailyLimitReached
                ? 'bg-neutral-900/90 text-amber-300 border border-amber-500/40'
                : reel.isSpecialOffer
                ? 'bg-gradient-to-r from-amber-400 to-[#00c853] text-black border border-amber-300 shadow-amber-500/30'
                : 'bg-[#00c853] hover:bg-[#00e676] text-black shadow-emerald-500/30'
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
                <Check className="w-2.5 h-2.5 stroke-[3]" />
                <span>+{toBengaliNumber(rewardPoints, lang)}</span>
              </>
            ) : isDailyLimitReached ? (
              <span>🔒 {lang === 'bn' ? 'লিমিট' : 'Limit'}</span>
            ) : (
              <>
                {reel.isSpecialOffer ? <Flame className="w-2.5 h-2.5 fill-current text-black" /> : <Sparkles className="w-2.5 h-2.5" />}
                <span>+{toBengaliNumber(rewardPoints, lang)}</span>
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
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 shadow-sm transition active:scale-95 cursor-pointer"
            title={lang === 'bn' ? 'রিলটি প্লে করুন' : 'Watch reel'}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{lang === 'bn' ? 'দেখুন' : 'Watch'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
