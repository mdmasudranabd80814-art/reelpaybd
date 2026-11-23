import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Gift,
  CheckCircle2,
  PlayCircle,
  ExternalLink,
  RotateCw,
  Lock,
  Send,
  Youtube,
  Users,
  Flame,
  Share2,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { User, TaskItem, EarningSettings, DEFAULT_EARNING_SETTINGS } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { playCoinSound, playSuccessChime } from '../utils/audio';
import { vibrateLight, vibrateError } from '../utils/haptics';
import confetti from 'canvas-confetti';
import { TopReferrersLeaderboard } from './TopReferrersLeaderboard';
import {
  getDailyEarningUsage,
  getOfferRequirementProgress,
  isTaskCompletedForUser,
  normalizeTaskOffer,
} from '../utils/offers';

interface EarnViewProps {
  user: User;
  tasks: TaskItem[];
  onCompleteTask: (taskId: string, reward: number) => void;
  onAddPoints: (points: number, reason: string) => void;
  isMuted: boolean;
  spinPrizes?: number[];
  scratchPrize?: number;
  earningSettings?: EarningSettings;
  users?: User[];
  lang?: 'bn' | 'en';
  onRecordSpin?: () => void;
  onClaimScratch?: (prize: number) => void;
  todayKey?: string;
  pointRate?: number;
}

const renderOfferIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Send':
      return <Send className="w-4 h-4 text-sky-400" />;
    case 'Youtube':
      return <Youtube className="w-4 h-4 text-rose-400" />;
    case 'Users':
      return <Users className="w-4 h-4 text-amber-400" />;
    case 'Flame':
      return <Flame className="w-4 h-4 text-orange-400" />;
    case 'Sparkles':
      return <Sparkles className="w-4 h-4 text-fuchsia-400" />;
    case 'Share2':
      return <Share2 className="w-4 h-4 text-cyan-400" />;
    case 'Award':
      return <Award className="w-4 h-4 text-yellow-400" />;
    case 'Gift':
      return <Gift className="w-4 h-4 text-emerald-400" />;
    case 'PlayCircle':
    default:
      return <PlayCircle className="w-4 h-4 text-emerald-400" />;
  }
};

export const EarnView: React.FC<EarnViewProps> = ({
  user,
  tasks,
  onCompleteTask,
  onAddPoints,
  isMuted,
  spinPrizes = [10, 25, 50, 15, 100, 30, 20, 40],
  scratchPrize = 35,
  earningSettings,
  users = [],
  lang = 'bn',
  onRecordSpin,
  onClaimScratch,
  todayKey,
  pointRate = 10,
}) => {
  const resolvedSettings = earningSettings || DEFAULT_EARNING_SETTINGS;
  const isMasterOn = resolvedSettings.isMasterEarningEnabled;
  const isSpinOn = isMasterOn && resolvedSettings.isSpinWheelEnabled;
  const isScratchOn = isMasterOn && resolvedSettings.isScratchCardEnabled;
  const isTasksOn = isMasterOn && resolvedSettings.isTasksEnabled;

  const effectiveSpinPrizes = resolvedSettings.spinPrizes?.length ? resolvedSettings.spinPrizes : spinPrizes;
  const effectiveScratchPrize = resolvedSettings.scratchCardPrize ?? scratchPrize;
  const effectiveReferralPoints = resolvedSettings.referralRewardPoints ?? 50;
  const limitMode = resolvedSettings.spinLimitMode || 'video_based';
  const videosRequired = Math.max(1, resolvedSettings.spinVideosRequired || 2);
  const effectiveTodayKey = todayKey || new Date().toISOString().slice(0, 10);
  const watchedToday = user.dailyReelClaimDate === effectiveTodayKey ? (user.dailyReelClaimsCount || 0) : 0;

  const totalAllowedSpins = limitMode === 'video_based'
    ? Math.floor(watchedToday / videosRequired)
    : (resolvedSettings.dailyMaxSpins ?? 5);

  const legacyTodayStr = new Date().toDateString();
  const isSameSpinDay =
    user.dailySpinClaimDate === effectiveTodayKey || user.dailySpinClaimDate === legacyTodayStr;
  const spinsToday = isSameSpinDay ? (user.dailySpinClaimsCount || 0) : 0;
  const remainingSpins = Math.max(0, totalAllowedSpins - spinsToday);

  const usage = getDailyEarningUsage(user, resolvedSettings, effectiveTodayKey);
  const dailyTotalProgressPct =
    usage.isTotalLimitEnabled && usage.dailyMaxTotalPoints > 0
      ? Math.min(100, Math.round((usage.dailyTotalEarnedToday / usage.dailyMaxTotalPoints) * 100))
      : 0;

  const [spinning, setSpinning] = useState(false);
  const [spinDegree, setSpinDegree] = useState(0);
  const [lastSpinPrize, setLastSpinPrize] = useState<number | null>(null);
  const [selectedOfferCategory, setSelectedOfferCategory] = useState<string>('সকল');

  // Scratch card state (persisted per day in Firestore + localStorage fallback)
  const scratchStorageKey = `rt_scratch_${user.id}`;
  const [localScratched, setLocalScratched] = useState(false);
  const isScratched = Boolean(
    localScratched ||
      user.dailyScratchClaimDate === effectiveTodayKey ||
      (typeof window !== 'undefined' && localStorage.getItem(scratchStorageKey) === effectiveTodayKey)
  );
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  const activeOffers = useMemo(() => {
    return (tasks || [])
      .map((t) => normalizeTaskOffer(t))
      .filter((t) => t.isActive)
      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
  }, [tasks]);

  const offerCategories = useMemo(() => {
    const unique = Array.from(new Set(activeOffers.map((t) => t.category).filter(Boolean)));
    return ['সকল', ...unique];
  }, [activeOffers]);

  const visibleOffers = useMemo(() => {
    if (selectedOfferCategory === 'সকল') return activeOffers;
    return activeOffers.filter((t) => t.category === selectedOfferCategory);
  }, [activeOffers, selectedOfferCategory]);

  const handleSpinWheel = () => {
    if (!isSpinOn) {
      vibrateError();
      showNotice(lang === 'bn' ? 'স্পিন হুইল বর্তমানে বন্ধ রয়েছে।' : 'Spin wheel is currently paused.');
      return;
    }
    if (usage.isDailyTotalLimitReached) {
      vibrateError();
      showNotice(
        lang === 'bn'
          ? `আজকের মোট উপার্জন লিমিট পূর্ণ হয়েছে (${toBengaliNumber(usage.dailyTotalEarnedToday, lang)}/${toBengaliNumber(usage.dailyMaxTotalPoints, lang)} পয়েন্ট)।`
          : 'Daily total earning limit reached.'
      );
      return;
    }
    if (spinsToday >= totalAllowedSpins) {
      vibrateError();
      if (limitMode === 'video_based') {
        showNotice(
          lang === 'bn'
            ? `আরও স্পিন পেতে আরও ${toBengaliNumber(videosRequired - (watchedToday % videosRequired))}টি রিল দেখুন!`
            : `Watch ${videosRequired - (watchedToday % videosRequired)} more reels to unlock a spin!`
        );
      } else {
        showNotice(
          lang === 'bn'
            ? `আজকের স্পিন লিমিট শেষ (${toBengaliNumber(totalAllowedSpins)} বার)। আগামীকাল আবার চেষ্টা করুন।`
            : `Daily spin limit reached (${totalAllowedSpins}). Try again tomorrow.`
        );
      }
      return;
    }
    if (spinning) return;
    vibrateLight();
    setSpinning(true);
    setLastSpinPrize(null);

    const randomSegment = Math.floor(Math.random() * effectiveSpinPrizes.length);
    const prize = effectiveSpinPrizes[randomSegment];
    const segmentDegree = 360 / effectiveSpinPrizes.length;
    const baseDegree = spinDegree - (spinDegree % 360);
    const sliceCenter = randomSegment * segmentDegree + segmentDegree / 2;
    const targetDegree = baseDegree + 1800 + (360 - sliceCenter);

    setSpinDegree(targetDegree);

    setTimeout(() => {
      setSpinning(false);
      setLastSpinPrize(prize);
      onAddPoints(prize, 'লাকি স্পিন হুইল');
      if (onRecordSpin) onRecordSpin();
      if (!isMuted) playSuccessChime();

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00e676', '#ffab00', '#ffffff'],
        });
      } catch {
        // Ignore
      }
    }, 1500);
  };

  const handleScratch = () => {
    if (!isScratchOn) {
      vibrateError();
      showNotice(lang === 'bn' ? 'স্ক্র্যাচ কার্ড বর্তমানে বন্ধ রয়েছে।' : 'Scratch card is currently paused.');
      return;
    }
    if (isScratched) return;
    if (usage.isDailyTotalLimitReached || usage.remainingTotalPoints <= 0) {
      vibrateError();
      showNotice(
        lang === 'bn'
          ? `আজকের মোট উপার্জন লিমিট পূর্ণ হয়েছে (${toBengaliNumber(usage.dailyTotalEarnedToday, lang)}/${toBengaliNumber(usage.dailyMaxTotalPoints, lang)} পয়েন্ট)!`
          : 'Daily total earning limit reached!'
      );
      return;
    }

    setLocalScratched(true);
    try {
      localStorage.setItem(scratchStorageKey, effectiveTodayKey);
    } catch {
      // Ignore storage failures
    }
    if (!isMuted) playCoinSound();
    if (onClaimScratch) {
      onClaimScratch(effectiveScratchPrize);
    } else {
      onAddPoints(effectiveScratchPrize, 'স্ক্র্যাচ কার্ড পুরস্কার');
    }

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#00c853', '#ffab00'],
      });
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {noticeMsg && (
        <div className="rounded-xl bg-amber-950/90 border border-amber-500/40 px-3.5 py-2 text-xs font-bold text-amber-200 text-center">
          ⚠️ {noticeMsg}
        </div>
      )}

      {/* Child 1: Banner + Global Daily Earning Limit Meter */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-[#102419] to-emerald-900/60 p-4 border border-emerald-900/60 shadow-lg text-white space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>টাস্ক ও রিওয়ার্ড হাব</span>
            </div>
            {!isMasterOn && (
              <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 text-[10px] font-bold border border-rose-800/60">
                ⛔ আর্নিং সাময়িক স্থগিত
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white">সহজ কাজ করে আরও বেশি পয়েন্ট জিতুন</h2>
          <p className="text-xs text-neutral-300 mt-1">
            {isMasterOn
              ? 'রিল দেখার পাশাপাশি স্পিন, স্ক্র্যাচ, অফার ও বন্ধুদের রেফার করে আয় দ্বিগুণ করুন!'
              : 'পয়েন্ট আর্নিং ফাংশনসমূহ এডমিন দ্বারা সাময়িকভাবে বন্ধ রয়েছে।'}
          </p>
        </div>

        {usage.isTotalLimitEnabled && usage.dailyMaxTotalPoints > 0 && (
          <div className="p-2.5 rounded-xl bg-black/35 border border-emerald-900/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>আজকের মোট উপার্জন সীমা</span>
              </span>
              <span className={`font-extrabold tabular-nums ${usage.isDailyTotalLimitReached ? 'text-rose-400' : 'text-white'}`}>
                {toBengaliNumber(usage.dailyTotalEarnedToday, lang)} / {toBengaliNumber(usage.dailyMaxTotalPoints, lang)} পয়েন্ট
              </span>
            </div>
            <div className="h-1.5 w-full bg-emerald-950 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usage.isDailyTotalLimitReached ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-green-400'
                }`}
                style={{ width: `${dailyTotalProgressPct}%` }}
              />
            </div>
            {usage.isDailyTotalLimitReached && (
              <p className="text-[10px] text-rose-300 font-semibold">
                🔒 আজকের দৈনিক পয়েন্ট সীমা পূর্ণ হয়েছে। আগামীকাল আবার উপার্জন করতে পারবেন।
              </p>
            )}
          </div>
        )}
      </div>

      {/* Child 2: Lucky Spin Wheel Section */}
      <div className="rounded-2xl bg-[#141f19] border border-emerald-950/80 p-4 shadow-lg text-white text-center relative overflow-hidden">
        {!isSpinOn && (
          <div className="absolute top-3 right-3 z-30">
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold text-[10px] flex items-center gap-1 border border-neutral-700">
              <Lock className="w-3 h-3" />
              <span>বন্ধ</span>
            </span>
          </div>
        )}
        <h3 className="font-bold text-base flex items-center justify-center gap-2 mb-1">
          <RotateCw className="w-4 h-4 text-emerald-400" />
          <span>ভাগ্য চাকা (Lucky Spin Wheel)</span>
        </h3>
        <p className="text-xs text-neutral-400 mb-0.5">
          {!isSpinOn ? 'স্পিন হুইল বর্তমানে বন্ধ আছে' : (limitMode === 'video_based' ? `প্রতি ${toBengaliNumber(videosRequired)}টি রিল দেখলে ১টি স্পিন!` : 'স্পিন করে জিতে নিন আকর্ষণীয় পয়েন্ট!')}
        </p>
        <p className="text-[11px] text-emerald-400 font-semibold mb-4 tabular-nums">
          {isSpinOn && (
            limitMode === 'video_based'
              ? `দেখা রিল: ${toBengaliNumber(watchedToday, lang)} টি | মোট স্পিন: ${toBengaliNumber(totalAllowedSpins, lang)} | বাকি: ${toBengaliNumber(remainingSpins, lang)}`
              : `আজকের বাকি স্পিন: ${toBengaliNumber(remainingSpins, lang)} / ${toBengaliNumber(totalAllowedSpins, lang)}`
          )}
        </p>

        {/* Wheel Container */}
        <div className={`relative w-48 h-48 mx-auto my-3 flex items-center justify-center ${!isSpinOn || remainingSpins <= 0 || usage.isDailyTotalLimitReached ? 'opacity-50 grayscale' : ''}`}>
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-rose-500 drop-shadow" />

          <div
            className="w-full h-full rounded-full border-4 border-emerald-400/80 shadow-2xl overflow-hidden relative transition-transform ease-out duration-[1400ms]"
            style={{
              transform: `rotate(${spinDegree}deg)`,
              background: 'conic-gradient(#00c853 0deg 45deg, #1b5e20 45deg 90deg, #ffab00 90deg 135deg, #00b0ff 135deg 180deg, #aa00ff 180deg 225deg, #ff1744 225deg 270deg, #00e676 270deg 315deg, #ff6d00 315deg 360deg)',
            }}
          >
            {effectiveSpinPrizes.map((p, idx) => {
              const segDeg = 360 / Math.max(1, effectiveSpinPrizes.length);
              const rot = idx * segDeg + segDeg / 2;
              return (
                <div
                  key={idx}
                  className="absolute w-full h-full text-center text-xs font-black text-white drop-shadow-md select-none"
                  style={{
                    transform: `rotate(${rot}deg)`,
                  }}
                >
                  <span className="inline-block mt-2 font-mono tabular-nums">+{p}</span>
                </div>
              );
            })}
          </div>

          <div className="absolute w-12 h-12 rounded-full bg-neutral-900 border-2 border-emerald-400 flex items-center justify-center shadow-lg text-emerald-300 font-black text-xs z-10">
            স্পিন
          </div>
        </div>

        {lastSpinPrize !== null && (
          <div className="my-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold tabular-nums">
            🎉 অভিনন্দন! আপনি +{toBengaliNumber(lastSpinPrize, lang)} পয়েন্ট জিতেছেন!
          </div>
        )}

        <button
          type="button"
          onClick={handleSpinWheel}
          disabled={spinning || !isSpinOn || remainingSpins <= 0 || usage.isDailyTotalLimitReached}
          className={`mt-2 min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer ${
            !isSpinOn || remainingSpins <= 0 || usage.isDailyTotalLimitReached
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
              : spinning
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              : 'bg-[#00c853] hover:bg-[#00e676] active:scale-95 text-black shadow-emerald-500/30'
          }`}
        >
          {!isSpinOn
            ? 'স্পিন স্থগিত 🔒'
            : usage.isDailyTotalLimitReached
            ? 'দৈনিক আর্নিং লিমিট পূর্ণ ⏰'
            : remainingSpins <= 0
            ? (limitMode === 'video_based' ? 'রিল দেখে স্পিন আনলক করুন 🎬' : 'আজকের স্পিন লিমিট শেষ ⏰')
            : spinning
            ? 'চাকা ঘুরছে...'
            : 'এখনই স্পিন করুন 🎯'}
        </button>
      </div>

      {/* Child 3: Lucky Scratch Card Section */}
      <div className="rounded-2xl bg-[#141f19] border border-emerald-950/80 p-4 shadow-lg text-white relative">
        {!isScratchOn && (
          <div className="absolute top-3 right-3 z-30">
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold text-[10px] flex items-center gap-1 border border-neutral-700">
              <Lock className="w-3 h-3" />
              <span>বন্ধ</span>
            </span>
          </div>
        )}
        <h3 className="font-bold text-base flex items-center gap-2 mb-1">
          <Gift className="w-4 h-4 text-emerald-400" />
          <span>দৈনিক স্ক্র্যাচ কার্ড (Scratch & Win)</span>
        </h3>
        <p className="text-xs text-neutral-400 mb-3">
          {!isScratchOn ? 'স্ক্র্যাচ কার্ড বর্তমানে বন্ধ রয়েছে' : 'কার্ডটি ঘষে নিশ্চিত পয়েন্ট উপহার নিন'}
        </p>

        <div
          onClick={handleScratch}
          className={`h-28 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2 relative overflow-hidden select-none ${
            !isScratchOn || (usage.isDailyTotalLimitReached && !isScratched)
              ? 'bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
              : isScratched
              ? 'bg-gradient-to-br from-emerald-900 to-[#10291d] border-emerald-400 text-white shadow-inner cursor-default'
              : 'bg-gradient-to-br from-neutral-800 to-neutral-700 hover:from-neutral-700 hover:to-neutral-600 border-neutral-600 text-neutral-200 cursor-pointer'
          }`}
        >
          {!isScratchOn ? (
            <div className="text-center">
              <Lock className="w-6 h-6 mx-auto mb-1 text-neutral-500" />
              <p className="text-xs font-bold text-neutral-400">স্ক্র্যাচ কার্ড বর্তমানে স্থগিত</p>
            </div>
          ) : isScratched ? (
            <div className="text-center animate-in zoom-in-90">
              <span className="text-3xl font-black text-[#00e676]">
                +{toBengaliNumber(effectiveScratchPrize)} পয়েন্ট
              </span>
              <p className="text-xs text-emerald-200 font-semibold mt-1">
                পুরস্কার আপনার ওয়ালেটে যোগ হয়েছে!
              </p>
            </div>
          ) : usage.isDailyTotalLimitReached ? (
            <div className="text-center px-3">
              <Lock className="w-5 h-5 mx-auto mb-1 text-amber-400" />
              <p className="text-xs font-bold text-amber-300">আজকের দৈনিক আর্নিং লিমিট পূর্ণ হয়েছে</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-2xl mb-1 block">✨ 🎁 ✨</span>
              <p className="text-xs font-bold text-neutral-200">
                এখানে ক্লিক করে ঘষুন ও পয়েন্ট দেখুন!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Child 4: Top Referrers Leaderboard Widget */}
      <TopReferrersLeaderboard
        users={users}
        currentUser={user}
        lang={lang}
        referralRewardPoints={effectiveReferralPoints}
        pointRate={pointRate}
      />

      {/* Child 5 (Focus Target div:nth-of-type(5)): Tasks & Offers Center */}
      <div className="rounded-2xl bg-[#141f19] border border-emerald-950/80 p-4 shadow-lg text-white relative space-y-3">
        {!isTasksOn && (
          <div className="absolute top-3 right-3 z-30">
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold text-[10px] flex items-center gap-1 border border-neutral-700">
              <Lock className="w-3 h-3" />
              <span>স্থগিত</span>
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>টাস্ক ও অফার সেন্টার</span>
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              প্রতিটি অফারের শর্ত পূরণ করে বোনাস পয়েন্ট সংগ্রহ করুন
            </p>
          </div>
          {isTasksOn && usage.isTaskLimitEnabled && usage.dailyMaxTaskClaims > 0 && (
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tabular-nums border ${
                usage.isDailyTaskLimitReached
                  ? 'bg-rose-950/70 text-rose-300 border-rose-800/60'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
              }`}
            >
              আজকের অফার: {toBengaliNumber(usage.dailyTaskClaimsUsed, lang)} / {toBengaliNumber(usage.dailyMaxTaskClaims, lang)}
            </span>
          )}
        </div>

        {/* Category Filter Tabs */}
        {isTasksOn && offerCategories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {offerCategories.map((cat) => {
              const active = selectedOfferCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedOfferCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-[#00c853] text-black shadow-sm'
                      : 'bg-[#0e1712] text-neutral-300 hover:bg-[#17281e] border border-emerald-950'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {!isTasksOn ? (
          <p className="text-xs text-neutral-400 py-3 text-center">টাস্ক ও অফার সেন্টার বর্তমানে এডমিন কর্তৃক বন্ধ রাখা হয়েছে।</p>
        ) : visibleOffers.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400 rounded-xl bg-[#0e1712] border border-emerald-950/60">
            বর্তমানে কোনো সক্রিয় অফার বা টাস্ক উপলব্ধ নেই। এডমিন নতুন অফার যোগ করলে এখানে দেখা যাবে।
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleOffers.map((task) => {
              const completed = isTaskCompletedForUser(task, user, effectiveTodayKey);
              const req = getOfferRequirementProgress(task, user, effectiveTodayKey);
              const reqPct = Math.min(100, Math.round((req.current / Math.max(1, req.required)) * 100));
              const needsProgressBar =
                req.requirementType === 'referral_count' || req.requirementType === 'reels_watched';
              const isBlockedByLimit =
                !completed &&
                req.met &&
                (usage.isDailyTaskLimitReached ||
                  (task.rewardPoints > 0 && usage.isDailyTotalLimitReached));

              return (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-[#0e1712] border border-emerald-950 flex flex-col gap-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                        {renderOfferIcon(task.iconName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-bold text-white leading-snug">{task.title}</p>
                          {task.badgeText && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              {task.badgeText}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-emerald-400 font-extrabold">
                            +{toBengaliNumber(task.rewardPoints, lang)} পয়েন্ট
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-semibold">
                            {task.category}
                          </span>
                          {task.isRepeatableDaily && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-semibold">
                              দৈনিক রিসেট
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {completed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>সম্পন্ন</span>
                        </span>
                      ) : !req.met ? (
                        <button
                          type="button"
                          onClick={() => {
                            vibrateError();
                            if (req.requirementType === 'referral_count') {
                              showNotice(
                                `এই অফারটি নিতে কমপক্ষে ${toBengaliNumber(req.required, lang)} জন বন্ধু রেফার করুন (${toBengaliNumber(req.current, lang)}/${toBengaliNumber(req.required, lang)})।`
                              );
                            } else {
                              showNotice(
                                `এই অফারটি নিতে কমপক্ষে ${toBengaliNumber(req.required, lang)}টি রিল দেখুন (${toBengaliNumber(req.current, lang)}/${toBengaliNumber(req.required, lang)})।`
                              );
                            }
                          }}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-neutral-800/90 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Lock className="w-3 h-3" />
                          <span>
                            {req.requirementType === 'referral_count' ? 'রেফার প্রয়োজন' : 'রিল দেখা বাকি'}
                          </span>
                        </button>
                      ) : isBlockedByLimit ? (
                        <button
                          type="button"
                          onClick={() => {
                            vibrateError();
                            showNotice(
                              usage.isDailyTaskLimitReached
                                ? `আজকের অফার ক্লেইম লিমিট শেষ (${toBengaliNumber(usage.dailyTaskClaimsUsed, lang)}/${toBengaliNumber(usage.dailyMaxTaskClaims, lang)})।`
                                : 'আজকের দৈনিক উপার্জন লিমিট পূর্ণ হয়েছে।'
                            );
                          }}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 border border-neutral-700 font-bold text-[11px] flex items-center gap-1 cursor-not-allowed"
                        >
                          <Lock className="w-3 h-3" />
                          <span>লিমিট শেষ</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (task.actionUrl) {
                              window.open(task.actionUrl, '_blank', 'noopener,noreferrer');
                            }
                            onCompleteTask(task.id, task.rewardPoints);
                          }}
                          className="min-h-[38px] px-3.5 py-2 rounded-lg bg-[#00c853] hover:bg-[#00e676] active:scale-95 text-black font-extrabold transition flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <span>{task.actionUrl ? 'ভিজিট ও ক্লেইম' : (lang === 'bn' ? 'সংগ্রহ করুন' : 'Claim')}</span>
                          {task.actionUrl && <ExternalLink className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Requirement Progress Bar for Referral & Reel Watch Offers */}
                  {needsProgressBar && !completed && (
                    <div className="pt-1.5 border-t border-emerald-950/70 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={req.met ? 'text-emerald-400 font-bold' : 'text-amber-300 font-semibold'}>
                          {req.requirementType === 'referral_count'
                            ? `শর্ত: ${toBengaliNumber(req.required, lang)} জন সফল রেফার`
                            : `শর্ত: ${toBengaliNumber(req.required, lang)}টি রিল দেখা`}
                        </span>
                        <span className="font-bold text-neutral-300 tabular-nums">
                          {toBengaliNumber(req.current, lang)} / {toBengaliNumber(req.required, lang)}
                          {req.met ? ' ✓' : ''}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            req.met ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${reqPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
