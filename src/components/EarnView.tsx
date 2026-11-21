import React, { useState } from 'react';
import {
  Sparkles,
  Gift,
  Share2,
  Copy,
  CheckCircle2,
  PlayCircle,
  ExternalLink,
  RotateCw,
  Lock,
} from 'lucide-react';
import { User, TaskItem, EarningSettings } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { playCoinSound, playSuccessChime } from '../utils/audio';
import confetti from 'canvas-confetti';
import { TopReferrersLeaderboard } from './TopReferrersLeaderboard';

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
}

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
}) => {
  const isMasterOn = earningSettings ? earningSettings.isMasterEarningEnabled : true;
  const isSpinOn = isMasterOn && (earningSettings ? earningSettings.isSpinWheelEnabled : true);
  const isScratchOn = isMasterOn && (earningSettings ? earningSettings.isScratchCardEnabled : true);
  const isReferralOn = isMasterOn && (earningSettings ? earningSettings.isReferralEnabled : true);
  const isTasksOn = isMasterOn && (earningSettings ? earningSettings.isTasksEnabled : true);

  const effectiveSpinPrizes = earningSettings?.spinPrizes?.length ? earningSettings.spinPrizes : spinPrizes;
  const effectiveScratchPrize = earningSettings?.scratchCardPrize || scratchPrize;
  const effectiveReferralPoints = earningSettings?.referralRewardPoints || 50;
  const limitMode = earningSettings?.spinLimitMode || 'video_based';
  const videosRequired = earningSettings?.spinVideosRequired || 2;
  const watchedToday = user.dailyReelClaimsCount || 0;

  const totalAllowedSpins = limitMode === 'video_based'
    ? Math.floor(watchedToday / videosRequired)
    : (earningSettings?.dailyMaxSpins ?? 5);

  const todayStr = new Date().toDateString();
  const spinsToday = user.dailySpinClaimDate === todayStr ? (user.dailySpinClaimsCount || 0) : 0;
  const remainingSpins = Math.max(0, totalAllowedSpins - spinsToday);

  const [copied, setCopied] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinDegree, setSpinDegree] = useState(0);
  const [lastSpinPrize, setLastSpinPrize] = useState<number | null>(null);

  // Scratch card state
  const [isScratched, setIsScratched] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 2600);
  };

  const handleSpinWheel = () => {
    if (!isSpinOn) {
      showNotice('স্পিন হুইল বর্তমানে বন্ধ রয়েছে।');
      return;
    }
    if (spinsToday >= totalAllowedSpins) {
      if (limitMode === 'video_based') {
        showNotice(`আরও স্পিন পেতে আরও ${toBengaliNumber(videosRequired - (watchedToday % videosRequired))}টি রিল দেখুন!`);
      } else {
        showNotice(`আজকের স্পিন লিমিট শেষ (${toBengaliNumber(totalAllowedSpins)} বার)। আগামীকাল আবার চেষ্টা করুন।`);
      }
      return;
    }
    if (spinning) return;
    setSpinning(true);
    setLastSpinPrize(null);

    const randomSegment = Math.floor(Math.random() * effectiveSpinPrizes.length);
    const prize = effectiveSpinPrizes[randomSegment];
    const segmentDegree = 360 / effectiveSpinPrizes.length;
    // 5 full rotations + segment
    const targetDegree = spinDegree + 1800 + (360 - randomSegment * segmentDegree);

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
      showNotice('স্ক্র্যাচ কার্ড বর্তমানে বন্ধ রয়েছে।');
      return;
    }
    if (isScratched) return;
    setIsScratched(true);
    if (!isMuted) playCoinSound();
    onAddPoints(effectiveScratchPrize, 'স্ক্র্যাচ কার্ড পুরস্কার');

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode || 'REEL778');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20">
      {noticeMsg && (
        <div className="rounded-xl bg-amber-950/90 border border-amber-500/40 px-3.5 py-2 text-xs font-bold text-amber-200 text-center">
          ⚠️ {noticeMsg}
        </div>
      )}
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-[#102419] to-emerald-900/60 p-4 border border-emerald-900/60 shadow-lg text-white">
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
            ? 'রিল দেখার পাশাপাশি স্পিন, স্ক্র্যাচ ও বন্ধুদের রেফার করে আয় দ্বিগুণ করুন!'
            : 'পয়েন্ট আর্নিং ফাংশনসমূহ এডমিন দ্বারা সাময়িকভাবে বন্ধ রয়েছে।'}
        </p>
      </div>

      {/* Lucky Spin Wheel Section */}
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
        <p className="text-[11px] text-emerald-400 font-semibold mb-4">
          {isSpinOn && (
            limitMode === 'video_based'
              ? `দেখা রিল: ${toBengaliNumber(watchedToday)} টি | মোট স্পিন: ${toBengaliNumber(totalAllowedSpins)} | বাকি: ${toBengaliNumber(remainingSpins)}`
              : `আজকের বাকি স্পিন: ${toBengaliNumber(remainingSpins)} / ${toBengaliNumber(totalAllowedSpins)}`
          )}
        </p>

        {/* Wheel Container */}
        <div className={`relative w-48 h-48 mx-auto my-3 flex items-center justify-center ${!isSpinOn || remainingSpins <= 0 ? 'opacity-50 grayscale' : ''}`}>
          {/* Wheel Pointer Pin */}
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-rose-500 drop-shadow" />

          {/* Wheel Circle */}
          <div
            className="w-full h-full rounded-full border-4 border-emerald-400/80 shadow-2xl overflow-hidden relative transition-transform ease-out duration-[1400ms]"
            style={{
              transform: `rotate(${spinDegree}deg)`,
              background: 'conic-gradient(#00c853 0deg 45deg, #1b5e20 45deg 90deg, #ffab00 90deg 135deg, #00b0ff 135deg 180deg, #aa00ff 180deg 225deg, #ff1744 225deg 270deg, #00e676 270deg 315deg, #ff6d00 315deg 360deg)',
            }}
          >
            {effectiveSpinPrizes.map((p, idx) => {
              const rot = idx * 45 + 22.5;
              return (
                <div
                  key={idx}
                  className="absolute w-full h-full text-center text-xs font-black text-white drop-shadow-md select-none"
                  style={{
                    transform: `rotate(${rot}deg)`,
                  }}
                >
                  <span className="inline-block mt-2 font-mono">+{p}</span>
                </div>
              );
            })}
          </div>

          {/* Center Hub */}
          <div className="absolute w-12 h-12 rounded-full bg-neutral-900 border-2 border-emerald-400 flex items-center justify-center shadow-lg text-emerald-300 font-black text-xs z-10">
            স্পিন
          </div>
        </div>

        {/* Last spin prize result */}
        {lastSpinPrize !== null && (
          <div className="my-2 p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold animate-pulse">
            🎉 অভিনন্দন! আপনি +{toBengaliNumber(lastSpinPrize)} পয়েন্ট জিতেছেন!
          </div>
        )}

        <button
          onClick={handleSpinWheel}
          disabled={spinning || !isSpinOn || remainingSpins <= 0}
          className={`mt-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg ${
            !isSpinOn || remainingSpins <= 0
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
              : spinning
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              : 'bg-[#00c853] hover:bg-[#00e676] active:scale-95 text-black shadow-emerald-500/30'
          }`}
        >
          {!isSpinOn
            ? 'স্পিন স্থগিত 🔒'
            : remainingSpins <= 0
            ? (limitMode === 'video_based' ? 'রিল দেখে স্পিন আনলক করুন 🎬' : 'আজকের লিমিট শেষ ⏰')
            : spinning
            ? 'চাকা ঘুরছে...'
            : 'এখনই স্পিন করুন 🎯'}
        </button>
      </div>

      {/* Lucky Scratch Card Section */}
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
            !isScratchOn
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

      {/* Referral Program Card */}
      <div className="rounded-2xl bg-[#141f19] border border-emerald-950/80 p-4 shadow-lg text-white relative">
        {!isReferralOn && (
          <div className="absolute top-3 right-3 z-30">
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold text-[10px] flex items-center gap-1 border border-neutral-700">
              <Lock className="w-3 h-3" />
              <span>স্থগিত</span>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Share2 className="w-4 h-4" />
          <span>রেফারাল বোনাস</span>
        </div>
        <h3 className="font-bold text-base mb-1">
          প্রতি রেফারে পান {toBengaliNumber(effectiveReferralPoints)} পয়েন্ট!
        </h3>
        <p className="text-xs text-neutral-400 mb-3">
          আপনার রেফারাল কোড বা লিংক বন্ধুদের পাঠিয়ে দিন। তারা জয়েন করলেই আপনি পাবেন পয়েন্ট বোনাস।
        </p>

        <div className="flex items-center gap-2 bg-[#0d1611] border border-emerald-950 p-2.5 rounded-xl">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-neutral-500 block">আপনার রেফার কোড:</span>
            <span className="font-mono text-base font-extrabold text-[#00e676]">
              {user.referralCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>কপি</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Referrers Leaderboard Widget */}
      <TopReferrersLeaderboard
        users={users}
        currentUser={user}
        lang={lang}
        referralRewardPoints={effectiveReferralPoints}
      />

      {/* Tasks List */}
      <div className="rounded-2xl bg-[#141f19] border border-emerald-950/80 p-4 shadow-lg text-white relative">
        {!isTasksOn && (
          <div className="absolute top-3 right-3 z-30">
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold text-[10px] flex items-center gap-1 border border-neutral-700">
              <Lock className="w-3 h-3" />
              <span>স্থগিত</span>
            </span>
          </div>
        )}
        <h3 className="font-bold text-base mb-3 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-emerald-400" />
          <span>টাস্ক সেন্টার</span>
        </h3>

        {!isTasksOn ? (
          <p className="text-xs text-neutral-400 py-3 text-center">টাস্ক সেন্টার বর্তমানে এডমিন কর্তৃক বন্ধ রাখা হয়েছে।</p>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-[#0e1712] border border-emerald-950 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-400 font-bold">
                      +{toBengaliNumber(task.rewardPoints)} পয়েন্ট
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {task.category}
                    </span>
                  </div>
                </div>

                <div>
                  {user.completedTaskIds?.includes(task.id) || task.completed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>সম্পন্ন</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (task.actionUrl) {
                          window.open(task.actionUrl, '_blank');
                        }
                        onCompleteTask(task.id, task.rewardPoints);
                        if (!isMuted) playSuccessChime();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#00c853] hover:bg-[#00e676] active:scale-95 text-black font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <span>করুন</span>
                      {task.actionUrl && <ExternalLink className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
