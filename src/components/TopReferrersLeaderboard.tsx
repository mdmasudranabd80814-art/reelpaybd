import React from 'react';
import { Trophy, Sparkles, Crown } from 'lucide-react';
import { User } from '../types';
import { toBengaliNumber } from '../utils/bengali';

const DEMO_USER_IDS = new Set([
  'usr_bd_01',
  'system_admin',
  'creator_sakib',
  'creator_russell',
  'creator_tanjila',
  'user_001',
  'user_002',
  'user_003',
  'user_004',
  'user_005',
  'user_006',
  'user_7788',
  'masud_rana',
]);

interface TopReferrersLeaderboardProps {
  users?: User[];
  currentUser?: User;
  lang?: 'bn' | 'en';
  referralRewardPoints?: number;
  pointRate?: number;
}

export const TopReferrersLeaderboard: React.FC<TopReferrersLeaderboardProps> = ({
  users = [],
  currentUser,
  lang = 'bn',
  referralRewardPoints = 50,
  pointRate = 10,
}) => {
  const safeRate = pointRate > 0 ? pointRate : 10;

  // Build real referrer leaderboard using actual Firestore referralsCount & referralEarnedPoints
  const leaderboardData = React.useMemo(() => {
    const byId = new Map<string, User>();
    for (const u of users || []) {
      if (u && u.id && !u.id.startsWith('GUEST-') && !DEMO_USER_IDS.has(u.id)) {
        byId.set(u.id, u);
      }
    }
    if (
      currentUser &&
      currentUser.id &&
      !currentUser.id.startsWith('GUEST-') &&
      !DEMO_USER_IDS.has(currentUser.id)
    ) {
      byId.set(currentUser.id, { ...(byId.get(currentUser.id) || {}), ...currentUser });
    }

    const mapped = Array.from(byId.values())
      .filter((u) => (u.referralsCount || 0) > 0)
      .map((u) => {
        const count = u.referralsCount || 0;
        const totalEarned =
          typeof u.referralEarnedPoints === 'number'
            ? u.referralEarnedPoints
            : count * referralRewardPoints;
        return {
          id: u.id,
          name: u.name || (lang === 'bn' ? 'ইউজার' : 'User'),
          avatar: u.avatar,
          referralCode: u.referralCode || '',
          referralsCount: count,
          totalEarned,
          isMe: Boolean(currentUser && u.id === currentUser.id),
        };
      });

    mapped.sort((a, b) => b.referralsCount - a.referralsCount || b.totalEarned - a.totalEarned);
    return mapped.slice(0, 10);
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
          <span>{lang === 'bn' ? 'রিয়েল র‍্যাংক' : 'Real Rank'}</span>
        </span>
      </div>

      {/* Leaderboard List */}
      {leaderboardData.length === 0 ? (
        <div className="p-5 rounded-2xl bg-[#0d1611] border border-emerald-950/80 text-center space-y-1">
          <p className="text-xs font-bold text-neutral-300">
            {lang === 'bn' ? 'এখনো কোনো সফল রেফার সম্পন্ন হয়নি' : 'No completed referrals yet'}
          </p>
          <p className="text-[11px] text-neutral-400">
            {lang === 'bn'
              ? 'বন্ধুরা আপনার রেফার কোড ব্যবহার করে প্রথম রিল দেখলে রিয়েল লিডারবোর্ড আপডেট হবে।'
              : 'Refer friends to join and watch their first reel to appear on the real leaderboard.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto no-scrollbar pr-0.5">
          {leaderboardData.map((item, index) => {
            const rank = index + 1;
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
                      {item.referralCode && (
                        <span className="text-[10px] text-neutral-400 font-mono bg-black/40 px-1.5 py-0.2 rounded border border-white/5">
                          {item.referralCode}
                        </span>
                      )}
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
                    ≈ ৳{toBengaliNumber(Math.floor(item.totalEarned / safeRate), lang)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Incentive Note */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 text-center leading-snug">
        💡 {lang === 'bn' ? 'আপনার প্রোফাইল থেকে রেফার কোড শেয়ার করে রিয়েল রেফারাল লিডারবোর্ডে এগিয়ে থাকুন!' : 'Share your referral code from Profile to climb the real referral leaderboard!'}
      </div>
    </div>
  );
};
