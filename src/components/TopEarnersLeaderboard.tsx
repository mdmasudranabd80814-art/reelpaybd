import React from 'react';
import { Trophy, Sparkles, Flame } from 'lucide-react';
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
]);

interface TopEarnersLeaderboardProps {
  users?: User[];
  currentUser?: User;
  lang?: 'bn' | 'en';
  pointRate?: number;
  onOpenUserProfile?: (userId: string) => void;
}

export const TopEarnersLeaderboard: React.FC<TopEarnersLeaderboardProps> = ({
  users = [],
  currentUser,
  lang = 'bn',
  pointRate = 10,
  onOpenUserProfile,
}) => {
  const safeRate = pointRate > 0 ? pointRate : 10;

  // Merge real users + currentUser, deduplicate, filter demo/guest & zero-point entries, sort desc
  const topEarners = React.useMemo(() => {
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
    const list = Array.from(byId.values()).filter((u) => (u.points || 0) > 0);
    list.sort((a, b) => (b.points || 0) - (a.points || 0));
    return list.slice(0, 5);
  }, [users, currentUser]);

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#182a20] via-[#122018] to-[#0d1611] border border-amber-500/40 p-4 shadow-xl text-white space-y-3.5 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-white flex items-center gap-1.5 tracking-wide">
              <span>{lang === 'bn' ? 'টপ আর্নার্স লিডারবোর্ড' : 'Top Earners Leaderboard'}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[10px] text-neutral-400">
              {lang === 'bn' ? 'সর্বাধিক পয়েন্ট অর্জনকারী সেরা ৫ জন সদস্য' : 'Top 5 members with highest real earnings'}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
          <span>{lang === 'bn' ? 'শীর্ষ তালিকায়' : 'Top 5'}</span>
        </span>
      </div>

      {/* Top 5 Real Earners List */}
      {topEarners.length === 0 ? (
        <div className="p-5 rounded-2xl bg-[#0d1611]/90 border border-emerald-950/80 text-center space-y-1">
          <p className="text-xs font-bold text-neutral-300">
            {lang === 'bn' ? 'এখনো কোনো রিয়েল আর্নিং র‍্যাংক তৈরি হয়নি' : 'No real earner rankings yet'}
          </p>
          <p className="text-[11px] text-neutral-400">
            {lang === 'bn' ? 'রিল দেখে পয়েন্ট অর্জন করলে এখানে রিয়েল লিডারবোর্ড দেখা যাবে।' : 'Watch reels and earn points to appear on the real leaderboard.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {topEarners.map((user, index) => {
            const rank = index + 1;
            const isMe = currentUser && user.id === currentUser.id;
            const taka = Math.floor((user.points || 0) / safeRate);

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
                key={user.id}
                onClick={() => onOpenUserProfile && onOpenUserProfile(user.id)}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isMe
                    ? 'bg-emerald-500/15 border-2 border-emerald-400/70 shadow-lg shadow-emerald-900/30'
                    : 'bg-[#0d1611]/90 border border-emerald-950/80 hover:border-emerald-700/60'
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
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                  />

                  {/* Name & Badge */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <h4 className="text-xs font-black text-white truncate">
                        {user.name} {isMe && <span className="text-[10px] text-emerald-400 font-bold">({lang === 'bn' ? 'আপনি' : 'You'})</span>}
                      </h4>
                      {user.isVerified && (
                        <span className="text-[10px] text-emerald-400 shrink-0">✓</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {user.role === 'admin' ? (lang === 'bn' ? 'অফিসিয়াল এডমিন' : 'Admin') : (lang === 'bn' ? 'সক্রিয় মেম্বার' : 'Active Member')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Points & Taka Value */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-amber-300 block">
                    {toBengaliNumber(user.points || 0, lang)} pts
                  </span>
                  <span className="text-[10px] text-emerald-400 font-extrabold">
                    ≈ ৳{toBengaliNumber(taka, lang)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Footer Note */}
      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 text-center leading-snug font-medium">
        ⭐ {lang === 'bn' ? 'রিল দেখে, স্পিন করে ও রেফার করে প্রতিদিন শীর্ষে থাকুন!' : 'Watch reels, spin & refer to rank on top!'}
      </div>
    </div>
  );
};
