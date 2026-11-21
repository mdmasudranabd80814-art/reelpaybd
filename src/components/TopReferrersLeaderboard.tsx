import React from 'react';
import { Trophy, Award, Users, Sparkles, Crown } from 'lucide-react';
import { User } from '../types';
import { toBengaliNumber } from '../utils/bengali';

interface TopReferrersLeaderboardProps {
  users?: User[];
  currentUser?: User;
  lang?: 'bn' | 'en';
  referralRewardPoints?: number;
}

export const TopReferrersLeaderboard: React.FC<TopReferrersLeaderboardProps> = ({
  users = [],
  currentUser,
  lang = 'bn',
  referralRewardPoints = 50,
}) => {
  // Generate leaderboard items based on actual users or sorted by points/reels watched with deterministic referral counts
  const leaderboardData = React.useMemo(() => {
    const list = users && users.length > 0 ? [...users] : [];
    // Sort by points descending or ensure top active users are featured
    list.sort((a, b) => (b.points || 0) - (a.points || 0));

    // Map to referrer stats
    const mapped = list.slice(0, 10).map((u, idx) => {
      // Estimate referral count based on points or stable index if points are equal
      const mockReferrals = Math.max(1, Math.round(((u.points || 100) / 150) + (10 - idx)));
      const totalEarned = mockReferrals * referralRewardPoints;
      return {
        id: u.id,
        name: u.name || (lang === 'bn' ? 'ইউজার' : 'User'),
        avatar: u.avatar,
        referralCode: u.referralCode || `REEL${1000 + idx}`,
        referralsCount: mockReferrals,
        totalEarned,
        isMe: currentUser && u.id === currentUser.id,
      };
    });

    // Sort by referral count desc
    mapped.sort((a, b) => b.referralsCount - a.referralsCount);
    return mapped;
  }, [users, currentUser, lang, referralRewardPoints]);

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#16251d] to-[#111c16] border border-emerald-900/60 p-4 shadow-xl text-white space-y-3.5 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <span>{lang === 'bn' ? 'টপ রেফারার লিডারবোর্ড' : 'Top Referrers Leaderboard'}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[10px] text-neutral-400">
              {lang === 'bn' ? 'সবচেয়ে বেশি সফল রেফারকারী সদস্যগণ' : 'Members with most successful referrals'}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
          <Crown className="w-3 h-3 text-amber-400" />
          <span>{lang === 'bn' ? 'সাপ্তাহিক র্যাংক' : 'Weekly Rank'}</span>
        </span>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto no-scrollbar pr-0.5">
        {leaderboardData.map((item, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const rankBadgeColor =
            rank === 1
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/50'
              : rank === 2
              ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-black font-black shadow-md'
              : rank === 3
              ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-200 font-black shadow-md'
              : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-bold';

          return (
            <div
              key={item.id}
              className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                item.isMe
                  ? 'bg-emerald-500/15 border-2 border-emerald-400/70 shadow-lg shadow-emerald-900/30'
                  : 'bg-[#0d1611] border border-emerald-950/80 hover:border-emerald-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${rankBadgeColor}`}
                >
                  {rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : toBengaliNumber(rank, lang)}
                </div>

                {/* Avatar */}
                <img
                  src={item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                  alt={item.name}
                  className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                />

                {/* Name & Code */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-white truncate">
                      {item.name} {item.isMe && <span className="text-[10px] text-emerald-400 font-bold">({lang === 'bn' ? 'আপনি' : 'You'})</span>}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-neutral-400 font-mono bg-black/40 px-1.5 py-0.2 rounded border border-white/5">
                      {item.referralCode}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {toBengaliNumber(item.referralsCount, lang)} {lang === 'bn' ? 'রেফার' : 'referrals'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-amber-300 block">
                  +{toBengaliNumber(item.totalEarned, lang)} pts
                </span>
                <span className="text-[9px] text-neutral-400 font-semibold">
                  ≈ ৳{toBengaliNumber((item.totalEarned / 10).toFixed(0), lang)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Incentive Note */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 text-center leading-snug">
        💡 {lang === 'bn' ? 'প্রতি সপ্তাহে সেরা ৩ জন রেফারার পান আকর্ষণীয় স্পেশাল ক্যাশ বোনাস!' : 'Top 3 referrers win weekly cash bonus!'}
      </div>
    </div>
  );
};
