import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  DollarSign,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { Reel, User, WithdrawalRequest } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';

interface AdminAnalyticsTabProps {
  withdrawals: WithdrawalRequest[];
  users: User[];
  reels: Reel[];
  onNavigateTab?: (tab: 'withdrawals' | 'users' | 'reels') => void;
}

type DayRange = 7 | 14 | 30;
type WithdrawalStatusFilter = 'all' | 'approved' | 'pending';
type SignupChartMode = 'daily' | 'cumulative';
type ViewsChartMode = 'daily' | 'top_reels' | 'category';

interface DailyWithdrawalDatum {
  dateKey: string;
  label: string;
  fullDate: string;
  approvedBDT: number;
  pendingBDT: number;
  rejectedBDT: number;
  totalBDT: number;
  requestsCount: number;
}

interface DailySignupDatum {
  dateKey: string;
  label: string;
  fullDate: string;
  signups: number;
  verifiedSignups: number;
  cumulativeUsers: number;
}

interface DailyViewsDatum {
  dateKey: string;
  label: string;
  fullDate: string;
  dailyViews: number;
  cumulativeViews: number;
  reelsPublished: number;
}

interface TopReelDatum {
  id: string;
  name: string;
  fullTitle: string;
  creatorName: string;
  category: string;
  viewsCount: number;
  likesCount: number;
}

interface CategoryViewsDatum {
  category: string;
  viewsCount: number;
  reelsCount: number;
}

const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#06b6d4', '#f43f5e', '#8b5cf6'];

function toUtcDateKey(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function formatShortDateLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${toBengaliNumber(Number(day))}/${toBengaliNumber(Number(month))}`;
}

function formatFullDateLabel(dateKey: string): string {
  const parsed = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function buildDateWindowKeys(days: DayRange): string[] {
  const keys: string[] = [];
  const now = new Date();
  const baseUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(baseUtc - i * 86_400_000);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({
  withdrawals,
  users,
  reels,
  onNavigateTab,
}) => {
  const [dayRange, setDayRange] = useState<DayRange>(14);
  const [withdrawalFilter, setWithdrawalFilter] = useState<WithdrawalStatusFilter>('all');
  const [signupMode, setSignupMode] = useState<SignupChartMode>('daily');
  const [viewsMode, setViewsMode] = useState<ViewsChartMode>('daily');

  const dateKeys = useMemo(() => buildDateWindowKeys(dayRange), [dayRange]);
  const windowStartKey = dateKeys[0];

  // 1. Daily Withdrawals Aggregation
  const dailyWithdrawalsData = useMemo<DailyWithdrawalDatum[]>(() => {
    const buckets = new Map<
      string,
      { approvedBDT: number; pendingBDT: number; rejectedBDT: number; requestsCount: number }
    >();
    for (const key of dateKeys) {
      buckets.set(key, { approvedBDT: 0, pendingBDT: 0, rejectedBDT: 0, requestsCount: 0 });
    }

    for (const w of withdrawals) {
      const key = toUtcDateKey(w.createdAt);
      if (!key || !buckets.has(key)) continue;
      const bucket = buckets.get(key)!;
      const amt = Math.max(0, Number(w.amountBDT) || 0);
      if (w.status === 'approved') bucket.approvedBDT += amt;
      else if (w.status === 'pending') bucket.pendingBDT += amt;
      else if (w.status === 'rejected') bucket.rejectedBDT += amt;
      bucket.requestsCount += 1;
    }

    return dateKeys.map((key) => {
      const b = buckets.get(key)!;
      const totalBDT =
        withdrawalFilter === 'approved'
          ? b.approvedBDT
          : withdrawalFilter === 'pending'
          ? b.pendingBDT
          : b.approvedBDT + b.pendingBDT + b.rejectedBDT;
      return {
        dateKey: key,
        label: formatShortDateLabel(key),
        fullDate: formatFullDateLabel(key),
        approvedBDT: b.approvedBDT,
        pendingBDT: b.pendingBDT,
        rejectedBDT: b.rejectedBDT,
        totalBDT,
        requestsCount: b.requestsCount,
      };
    });
  }, [withdrawals, dateKeys, withdrawalFilter]);

  const withdrawalSummary = useMemo(() => {
    let approvedInRange = 0;
    let pendingInRange = 0;
    let totalInRange = 0;
    let requestsInRange = 0;
    let approvedCountInRange = 0;
    let decidedCountInRange = 0;

    for (const d of dailyWithdrawalsData) {
      approvedInRange += d.approvedBDT;
      pendingInRange += d.pendingBDT;
      totalInRange += d.totalBDT;
      requestsInRange += d.requestsCount;
    }

    for (const w of withdrawals) {
      const key = toUtcDateKey(w.createdAt);
      if (!key || key < windowStartKey) continue;
      if (w.status === 'approved') {
        approvedCountInRange += 1;
        decidedCountInRange += 1;
      } else if (w.status === 'rejected') {
        decidedCountInRange += 1;
      }
    }

    const approvalRate =
      decidedCountInRange > 0 ? Math.round((approvedCountInRange / decidedCountInRange) * 100) : 0;

    return {
      approvedInRange,
      pendingInRange,
      totalInRange,
      requestsInRange,
      approvalRate,
      decidedCountInRange,
    };
  }, [dailyWithdrawalsData, withdrawals, windowStartKey]);

  // 2. Daily New User Signups Aggregation
  const dailySignupsData = useMemo<DailySignupDatum[]>(() => {
    const buckets = new Map<string, { signups: number; verifiedSignups: number }>();
    for (const key of dateKeys) {
      buckets.set(key, { signups: 0, verifiedSignups: 0 });
    }

    let baselineUsersBeforeWindow = 0;
    for (const u of users) {
      const key = toUtcDateKey(u.createdAt);
      if (!key) continue;
      if (key < windowStartKey) {
        baselineUsersBeforeWindow += 1;
        continue;
      }
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.signups += 1;
        if (u.isVerified) bucket.verifiedSignups += 1;
      }
    }

    let runningTotal = baselineUsersBeforeWindow;
    return dateKeys.map((key) => {
      const b = buckets.get(key)!;
      runningTotal += b.signups;
      return {
        dateKey: key,
        label: formatShortDateLabel(key),
        fullDate: formatFullDateLabel(key),
        signups: b.signups,
        verifiedSignups: b.verifiedSignups,
        cumulativeUsers: runningTotal,
      };
    });
  }, [users, dateKeys, windowStartKey]);

  const signupSummary = useMemo(() => {
    const signupsInRange = dailySignupsData.reduce((sum, d) => sum + d.signups, 0);
    const verifiedInRange = dailySignupsData.reduce((sum, d) => sum + d.verifiedSignups, 0);
    const totalUsersCount = users.length;
    return {
      signupsInRange,
      verifiedInRange,
      totalUsersCount,
    };
  }, [dailySignupsData, users.length]);

  // 3. Total Reel Views Aggregation (Daily Trajectory, Top Reels, Category Breakdown)
  const dailyViewsData = useMemo<DailyViewsDatum[]>(() => {
    const buckets = new Map<string, { dailyViews: number; reelsPublished: number }>();
    for (const key of dateKeys) {
      buckets.set(key, { dailyViews: 0, reelsPublished: 0 });
    }

    let baselineViewsBeforeWindow = 0;
    for (const r of reels) {
      const views = Math.max(0, Number(r.viewsCount) || 0);
      const key = toUtcDateKey(r.createdAt);
      if (!key || key < windowStartKey) {
        baselineViewsBeforeWindow += views;
        continue;
      }
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.dailyViews += views;
        bucket.reelsPublished += 1;
      }
    }

    let runningViews = baselineViewsBeforeWindow;
    return dateKeys.map((key) => {
      const b = buckets.get(key)!;
      runningViews += b.dailyViews;
      return {
        dateKey: key,
        label: formatShortDateLabel(key),
        fullDate: formatFullDateLabel(key),
        dailyViews: b.dailyViews,
        cumulativeViews: runningViews,
        reelsPublished: b.reelsPublished,
      };
    });
  }, [reels, dateKeys, windowStartKey]);

  const topReelsData = useMemo<TopReelDatum[]>(() => {
    return [...reels]
      .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        name: r.title.length > 14 ? `${r.title.slice(0, 13)}…` : r.title,
        fullTitle: r.title,
        creatorName: r.creatorName || 'Creator',
        category: r.category,
        viewsCount: Math.max(0, Number(r.viewsCount) || 0),
        likesCount: Math.max(0, Number(r.likesCount) || 0),
      }));
  }, [reels]);

  const categoryViewsData = useMemo<CategoryViewsDatum[]>(() => {
    const map = new Map<string, { viewsCount: number; reelsCount: number }>();
    for (const r of reels) {
      const cat = r.category || 'সকল';
      const cur = map.get(cat) || { viewsCount: 0, reelsCount: 0 };
      cur.viewsCount += Math.max(0, Number(r.viewsCount) || 0);
      cur.reelsCount += 1;
      map.set(cat, cur);
    }
    return Array.from(map.entries())
      .map(([category, val]) => ({
        category,
        viewsCount: val.viewsCount,
        reelsCount: val.reelsCount,
      }))
      .sort((a, b) => b.viewsCount - a.viewsCount);
  }, [reels]);

  const viewsSummary = useMemo(() => {
    const totalViews = reels.reduce((sum, r) => sum + Math.max(0, Number(r.viewsCount) || 0), 0);
    const viewsInWindow = dailyViewsData.reduce((sum, d) => sum + d.dailyViews, 0);
    const avgViewsPerReel = reels.length > 0 ? Math.round(totalViews / reels.length) : 0;
    return {
      totalViews,
      viewsInWindow,
      avgViewsPerReel,
    };
  }, [reels, dailyViewsData]);

  const tickInterval = dayRange === 30 ? 4 : dayRange === 14 ? 1 : 0;

  return (
    <div className="space-y-5">
      {/* Header & Range Controls */}
      <div className="rounded-2xl bg-[#0d141d] border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>প্ল্যাটফর্ম অ্যানালিটিক্স</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            <span>দৈনিক উইথড্রয়াল</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>নতুন ইউজার সাইনআপ</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>মোট রিল ভিউ বিশ্লেষণ</span>
          </p>
        </div>

        <div
          className="flex items-center gap-1 p-1 bg-[#070b11] rounded-xl border border-slate-800"
          role="group"
          aria-label="সময়সীমা নির্বাচন করুন"
        >
          {([7, 14, 30] as DayRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDayRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                dayRange === range
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {toBengaliNumber(range)} দিন
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-[#0d141d] border border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>উইথড্রয়াল ({toBengaliNumber(dayRange)} দিন)</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <p className="text-xl font-extrabold text-white tabular-nums mt-1.5">
            {formatTaka(withdrawalSummary.totalInRange)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            <span>{toBengaliNumber(withdrawalSummary.requestsInRange)} টি রিকোয়েস্ট</span>
            <span aria-hidden="true" className="mx-1">·</span>
            <span className="text-emerald-400">অনুমোদিত {formatTaka(withdrawalSummary.approvedInRange)}</span>
          </p>
        </div>

        <div className="rounded-2xl bg-[#0d141d] border border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>নতুন সাইনআপ ({toBengaliNumber(dayRange)} দিন)</span>
            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xl font-extrabold text-white tabular-nums mt-1.5">
            {toBengaliNumber(signupSummary.signupsInRange)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            <span>মোট {toBengaliNumber(signupSummary.totalUsersCount)} জন</span>
            <span aria-hidden="true" className="mx-1">·</span>
            <span className="text-cyan-400">ভেরিফাইড {toBengaliNumber(signupSummary.verifiedInRange)}</span>
          </p>
        </div>

        <div className="rounded-2xl bg-[#0d141d] border border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>মোট রিল ভিউ</span>
            <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          </div>
          <p className="text-xl font-extrabold text-white tabular-nums mt-1.5">
            {toBengaliNumber(viewsSummary.totalViews.toLocaleString('en-US'))}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            <span>{toBengaliNumber(reels.length)} টি রিল</span>
            <span aria-hidden="true" className="mx-1">·</span>
            <span className="text-blue-400">গড় {toBengaliNumber(viewsSummary.avgViewsPerReel)} ভিউ</span>
          </p>
        </div>

        <div className="rounded-2xl bg-[#0d141d] border border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>পেমেন্ট অনুমোদন হার</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <p className="text-xl font-extrabold text-white tabular-nums mt-1.5">
            {toBengaliNumber(withdrawalSummary.approvalRate)}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            <span>পেন্ডিং {formatTaka(withdrawalSummary.pendingInRange)}</span>
          </p>
        </div>
      </div>

      {/* Chart 1: Total Daily Withdrawals */}
      <section className="rounded-2xl bg-[#0d141d] border border-slate-800 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>দৈনিক মোট উইথড্রয়াল (Daily Withdrawals)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              <span>গত {toBengaliNumber(dayRange)} দিনের দৈনিক পেআউট ও রিকোয়েস্ট পরিমাণ (৳)</span>
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#070b11] rounded-xl border border-slate-800">
            {(
              [
                { id: 'all', label: 'সবগুলো' },
                { id: 'approved', label: 'অনুমোদিত' },
                { id: 'pending', label: 'পেন্ডিং' },
              ] as Array<{ id: WithdrawalStatusFilter; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setWithdrawalFilter(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  withdrawalFilter === opt.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-300">
          {(withdrawalFilter === 'all' || withdrawalFilter === 'approved') && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>অনুমোদিত (৳)</span>
            </span>
          )}
          {(withdrawalFilter === 'all' || withdrawalFilter === 'pending') && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>পেন্ডিং (৳)</span>
            </span>
          )}
          {withdrawalFilter === 'all' && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>বাতিল (৳)</span>
            </span>
          )}
        </div>

        {withdrawals.length === 0 ? (
          <div className="rounded-xl bg-[#070b11] border border-slate-800 p-8 text-center space-y-2.5">
            <Calendar className="w-7 h-7 text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-200">
              এখনও কোনো উইথড্রয়াল রিকোয়েস্ট রেকর্ড করা হয়নি
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              ইউজাররা ক্যাশআউট রিকোয়েস্ট জমা দিলে এখানে প্রতিটি দিনের মোট উইথড্রয়াল গ্রাফ প্রদর্শিত হবে।
            </p>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('withdrawals')}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <span>উইথড্রয়াল ট্যাব দেখুন</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="h-64 w-full bg-[#070b11] rounded-xl p-3 border border-slate-800/80">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={dailyWithdrawalsData}
                  margin={{ top: 8, right: 8, left: -8, bottom: 2 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tickFormatter={(v) => `৳${toBengaliNumber(Number(v) || 0)}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const d = payload[0].payload as DailyWithdrawalDatum;
                      return (
                        <div className="rounded-xl bg-[#0b131d] border border-slate-700 p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
                          <p className="font-bold text-white">{d.fullDate}</p>
                          <div className="pt-1 border-t border-slate-800 space-y-1 tabular-nums text-[11px]">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">মোট পরিমাণ:</span>
                              <span className="font-bold text-white">{formatTaka(d.totalBDT)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-emerald-400">অনুমোদিত:</span>
                              <span className="font-bold text-emerald-400">{formatTaka(d.approvedBDT)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-amber-400">পেন্ডিং:</span>
                              <span className="font-bold text-amber-400">{formatTaka(d.pendingBDT)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">রিকোয়েস্ট:</span>
                              <span className="font-semibold text-slate-200">{toBengaliNumber(d.requestsCount)} টি</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {withdrawalFilter === 'all' && (
                    <>
                      <Bar
                        dataKey="approvedBDT"
                        stackId="wd"
                        fill="#10b981"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={28}
                        name="অনুমোদিত (৳)"
                      />
                      <Bar
                        dataKey="pendingBDT"
                        stackId="wd"
                        fill="#f59e0b"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={28}
                        name="পেন্ডিং (৳)"
                      />
                      <Bar
                        dataKey="rejectedBDT"
                        stackId="wd"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                        name="বাতিল (৳)"
                      />
                    </>
                  )}
                  {withdrawalFilter === 'approved' && (
                    <Bar
                      dataKey="approvedBDT"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                      name="অনুমোদিত (৳)"
                    />
                  )}
                  {withdrawalFilter === 'pending' && (
                    <Bar
                      dataKey="pendingBDT"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                      name="পেন্ডিং (৳)"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {withdrawalSummary.totalInRange === 0 && dayRange !== 30 && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>নির্বাচিত {toBengaliNumber(dayRange)} দিনে কোনো উইথড্রয়াল নেই।</span>
                <button
                  type="button"
                  onClick={() => setDayRange(30)}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  ৩০ দিনের ডেটা দেখুন
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Chart 2: New User Signups */}
      <section className="rounded-2xl bg-[#0d141d] border border-slate-800 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>নতুন ইউজার সাইনআপ (New User Signups)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              {signupMode === 'daily'
                ? `গত ${toBengaliNumber(dayRange)} দিনে প্রতিদিন নিবন্ধিত নতুন ইউজার`
                : `মোট নিবন্ধিত ইউজারের ক্রমবর্ধমান বৃদ্ধি (${toBengaliNumber(signupSummary.totalUsersCount)} জন)`}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#070b11] rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSignupMode('daily')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                signupMode === 'daily'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              দৈনিক সাইনআপ
            </button>
            <button
              type="button"
              onClick={() => setSignupMode('cumulative')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                signupMode === 'cumulative'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              মোট বৃদ্ধি
            </button>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="rounded-xl bg-[#070b11] border border-slate-800 p-8 text-center space-y-2.5">
            <Users className="w-7 h-7 text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-200">
              এখনও কোনো নিবন্ধিত ইউজার পাওয়া যায়নি
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              নতুন ইউজার অ্যাকাউন্ট তৈরি করলে এখানে দৈনিক সাইনআপ ও প্রবৃদ্ধির চার্ট দেখা যাবে।
            </p>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('users')}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <span>ইউজার কন্ট্রোল দেখুন</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="h-64 w-full bg-[#070b11] rounded-xl p-3 border border-slate-800/80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart
                data={dailySignupsData}
                margin={{ top: 8, right: 8, left: -16, bottom: 2 }}
              >
                <defs>
                  <linearGradient id="analyticsSignupsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="analyticsVerifiedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickFormatter={(v) => toBengaliNumber(Number(v) || 0)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const d = payload[0].payload as DailySignupDatum;
                    return (
                      <div className="rounded-xl bg-[#0b131d] border border-slate-700 p-3 shadow-2xl text-xs space-y-1.5 min-w-[170px]">
                        <p className="font-bold text-white">{d.fullDate}</p>
                        <div className="pt-1 border-t border-slate-800 space-y-1 tabular-nums text-[11px]">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-cyan-400">নতুন সাইনআপ:</span>
                            <span className="font-bold text-cyan-400">{toBengaliNumber(d.signups)} জন</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-emerald-400">ইমেইল ভেরিফাইড:</span>
                            <span className="font-bold text-emerald-400">{toBengaliNumber(d.verifiedSignups)} জন</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">মোট ইউজার:</span>
                            <span className="font-semibold text-white">{toBengaliNumber(d.cumulativeUsers)} জন</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                {signupMode === 'daily' ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey="signups"
                      stroke="#06b6d4"
                      strokeWidth={2.25}
                      fillOpacity={1}
                      fill="url(#analyticsSignupsGrad)"
                      name="নতুন সাইনআপ"
                    />
                    <Area
                      type="monotone"
                      dataKey="verifiedSignups"
                      stroke="#10b981"
                      strokeWidth={1.75}
                      fillOpacity={1}
                      fill="url(#analyticsVerifiedGrad)"
                      name="ভেরিফাইড সাইনআপ"
                    />
                  </>
                ) : (
                  <Area
                    type="monotone"
                    dataKey="cumulativeUsers"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#analyticsSignupsGrad)"
                    name="মোট ইউজার"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Chart 3: Total Reel Views */}
      <section className="rounded-2xl bg-[#0d141d] border border-slate-800 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400 shrink-0" />
              <span>মোট রিল ভিউ (Total Reel Views)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              {viewsMode === 'daily'
                ? `সর্বমোট ${toBengaliNumber(viewsSummary.totalViews.toLocaleString('en-US'))} ভিউ · সময়সীমায় প্রকাশিত রিলে ${toBengaliNumber(viewsSummary.viewsInWindow.toLocaleString('en-US'))} ভিউ`
                : viewsMode === 'top_reels'
                ? 'সর্বাধিক দেখা শীর্ষ ৮টি রিলের ভিউ তুলনা'
                : 'ক্যাটাগরি অনুযায়ী মোট রিল ভিউ বিভাজন'}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#070b11] rounded-xl border border-slate-800">
            {(
              [
                { id: 'daily', label: 'দৈনিক ও মোট' },
                { id: 'top_reels', label: 'শীর্ষ রিল' },
                { id: 'category', label: 'ক্যাটাগরি' },
              ] as Array<{ id: ViewsChartMode; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setViewsMode(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewsMode === opt.id
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {reels.length === 0 ? (
          <div className="rounded-xl bg-[#070b11] border border-slate-800 p-8 text-center space-y-2.5">
            <Eye className="w-7 h-7 text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-200">
              এখনও কোনো রিল পাওয়া যায়নি
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              রিল আপলোড এবং ভিউ হতে শুরু করলে এখানে মোট রিল ভিউ চার্ট প্রদর্শিত হবে।
            </p>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('reels')}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <span>রিলস কন্ট্রোল দেখুন</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="h-64 w-full bg-[#070b11] rounded-xl p-3 border border-slate-800/80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              {viewsMode === 'daily' ? (
                <AreaChart
                  data={dailyViewsData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 2 }}
                >
                  <defs>
                    <linearGradient id="analyticsCumulativeViewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="analyticsDailyViewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tickFormatter={(v) => toBengaliNumber(Number(v) || 0)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const d = payload[0].payload as DailyViewsDatum;
                      return (
                        <div className="rounded-xl bg-[#0b131d] border border-slate-700 p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
                          <p className="font-bold text-white">{d.fullDate}</p>
                          <div className="pt-1 border-t border-slate-800 space-y-1 tabular-nums text-[11px]">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-blue-400">সর্বমোট ক্রমবর্ধমান ভিউ:</span>
                              <span className="font-bold text-blue-400">{toBengaliNumber(d.cumulativeViews)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-emerald-400">এই দিনের রিলে ভিউ:</span>
                              <span className="font-bold text-emerald-400">{toBengaliNumber(d.dailyViews)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">প্রকাশিত রিল:</span>
                              <span className="font-semibold text-white">{toBengaliNumber(d.reelsPublished)} টি</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeViews"
                    stroke="#3b82f6"
                    strokeWidth={2.25}
                    fillOpacity={1}
                    fill="url(#analyticsCumulativeViewsGrad)"
                    name="মোট রিল ভিউ"
                  />
                  <Area
                    type="monotone"
                    dataKey="dailyViews"
                    stroke="#10b981"
                    strokeWidth={1.75}
                    fillOpacity={1}
                    fill="url(#analyticsDailyViewsGrad)"
                    name="দৈনিক রিল ভিউ"
                  />
                </AreaChart>
              ) : viewsMode === 'top_reels' ? (
                <BarChart
                  data={topReelsData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 2 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tickFormatter={(v) => toBengaliNumber(Number(v) || 0)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const d = payload[0].payload as TopReelDatum;
                      return (
                        <div className="rounded-xl bg-[#0b131d] border border-slate-700 p-3 shadow-2xl text-xs space-y-1.5 max-w-[220px]">
                          <p className="font-bold text-white truncate">{d.fullTitle}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {d.creatorName} · {d.category}
                          </p>
                          <div className="pt-1 border-t border-slate-800 space-y-1 tabular-nums text-[11px]">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-blue-400">মোট ভিউ:</span>
                              <span className="font-bold text-blue-400">{toBengaliNumber(d.viewsCount)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-rose-400">লাইক:</span>
                              <span className="font-bold text-rose-400">{toBengaliNumber(d.likesCount)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="viewsCount" radius={[6, 6, 0, 0]} maxBarSize={32} name="মোট ভিউ">
                    {topReelsData.map((entry, idx) => (
                      <Cell key={entry.id} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={categoryViewsData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 2 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="category"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tickFormatter={(v) => toBengaliNumber(Number(v) || 0)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const d = payload[0].payload as CategoryViewsDatum;
                      return (
                        <div className="rounded-xl bg-[#0b131d] border border-slate-700 p-3 shadow-2xl text-xs space-y-1.5 min-w-[160px]">
                          <p className="font-bold text-white">{d.category}</p>
                          <div className="pt-1 border-t border-slate-800 space-y-1 tabular-nums text-[11px]">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-blue-400">মোট ভিউ:</span>
                              <span className="font-bold text-blue-400">{toBengaliNumber(d.viewsCount)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">রিল সংখ্যা:</span>
                              <span className="font-semibold text-white">{toBengaliNumber(d.reelsCount)} টি</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="viewsCount" radius={[6, 6, 0, 0]} maxBarSize={36} name="ক্যাটাগরি ভিউ">
                    {categoryViewsData.map((entry, idx) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
};
