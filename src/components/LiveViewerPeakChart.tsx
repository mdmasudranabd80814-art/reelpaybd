import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Users, Radio, BarChart3, Activity, Crown } from 'lucide-react';
import { LiveStream } from '../types';
import { toBengaliNumber } from '../utils/bengali';

interface LiveViewerPeakChartProps {
  streams: LiveStream[];
  lang?: 'bn' | 'en';
}

interface TimelinePoint {
  time: string;
  totalConcurrent: number;
  sessionPeak: number;
  activeStreams: number;
}

interface StreamBarDatum {
  id: string;
  name: string;
  fullTitle: string;
  hostName: string;
  mode: 'audio' | 'video';
  currentViewers: number;
  peakViewers: number;
  peakAt?: string;
}

export const LiveViewerPeakChart: React.FC<LiveViewerPeakChartProps> = ({
  streams,
  lang = 'bn',
}) => {
  const [chartMode, setChartMode] = useState<'streams' | 'timeline'>('streams');
  const [includeEndedFallback, setIncludeEndedFallback] = useState(false);

  // Track highest observed concurrent viewer count per stream during this admin session
  const [streamSessionPeaks, setStreamSessionPeaks] = useState<Record<string, number>>(() => {
    try {
      const saved = sessionStorage.getItem('rt_admin_live_stream_peaks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track concurrent total viewer timeline points across snapshots
  const [timeline, setTimeline] = useState<TimelinePoint[]>(() => {
    try {
      const saved = sessionStorage.getItem('rt_admin_live_peak_timeline');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const sessionTotalPeakRef = useRef<number>(0);

  const activeStreams = useMemo(
    () => streams.filter((s) => s && s.status === 'active'),
    [streams]
  );

  const endedStreams = useMemo(
    () => streams.filter((s) => s && s.status !== 'active'),
    [streams]
  );

  // Update per-stream session peaks & real-time concurrent viewer timeline whenever activeStreams changes
  useEffect(() => {
    if (activeStreams.length === 0) return;

    setStreamSessionPeaks((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const s of activeStreams) {
        const current = Math.max(0, s.viewersCount || 0);
        const persistedPeak = Math.max(0, s.peakViewersCount || 0);
        const best = Math.max(current, persistedPeak, prev[s.id] || 0);
        if (best !== prev[s.id]) {
          next[s.id] = best;
          changed = true;
        }
      }
      if (changed) {
        try {
          sessionStorage.setItem('rt_admin_live_stream_peaks', JSON.stringify(next));
        } catch {}
        return next;
      }
      return prev;
    });

    const totalNow = activeStreams.reduce((acc, s) => acc + Math.max(0, s.viewersCount || 0), 0);
    const totalPersistedPeak = activeStreams.reduce(
      (acc, s) => acc + Math.max(s.viewersCount || 0, s.peakViewersCount || 0),
      0
    );

    const timeLabel = new Date().toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    setTimeline((prev) => {
      const prevMax = prev.reduce((m, p) => Math.max(m, p.sessionPeak), 0);
      const nextPeak = Math.max(prevMax, sessionTotalPeakRef.current, totalNow, totalPersistedPeak);
      sessionTotalPeakRef.current = nextPeak;

      const last = prev[prev.length - 1];
      if (
        last &&
        last.totalConcurrent === totalNow &&
        last.sessionPeak === nextPeak &&
        last.activeStreams === activeStreams.length
      ) {
        return prev;
      }

      const nextPoint: TimelinePoint = {
        time: timeLabel,
        totalConcurrent: totalNow,
        sessionPeak: nextPeak,
        activeStreams: activeStreams.length,
      };
      const updated = [...prev, nextPoint].slice(-24);
      try {
        sessionStorage.setItem('rt_admin_live_peak_timeline', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [activeStreams, lang]);

  // Periodic live heartbeat sample while active streams are running so timeline stays smooth
  useEffect(() => {
    if (activeStreams.length === 0) return;
    const interval = setInterval(() => {
      const totalNow = activeStreams.reduce((acc, s) => acc + Math.max(0, s.viewersCount || 0), 0);
      const timeLabel = new Date().toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setTimeline((prev) => {
        const prevMax = prev.reduce((m, p) => Math.max(m, p.sessionPeak), 0);
        const nextPeak = Math.max(prevMax, sessionTotalPeakRef.current, totalNow);
        sessionTotalPeakRef.current = nextPeak;
        const updated = [
          ...prev,
          {
            time: timeLabel,
            totalConcurrent: totalNow,
            sessionPeak: nextPeak,
            activeStreams: activeStreams.length,
          },
        ].slice(-24);
        try {
          sessionStorage.setItem('rt_admin_live_peak_timeline', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [activeStreams, lang]);

  const streamsToDisplay =
    activeStreams.length > 0
      ? activeStreams
      : includeEndedFallback
      ? endedStreams.slice(0, 8)
      : [];

  const barChartData: StreamBarDatum[] = useMemo(() => {
    return streamsToDisplay
      .map((s) => {
        const current = Math.max(0, s.viewersCount || 0);
        const peak = Math.max(current, s.peakViewersCount || 0, streamSessionPeaks[s.id] || 0);
        const shortHost =
          (s.hostName || 'Host').length > 12
            ? `${(s.hostName || 'Host').slice(0, 11)}…`
            : s.hostName || 'Host';
        return {
          id: s.id,
          name: shortHost,
          fullTitle: s.title || s.hostName,
          hostName: s.hostName,
          mode: s.mode,
          currentViewers: current,
          peakViewers: peak,
          peakAt: s.peakAt,
        };
      })
      .sort((a, b) => b.peakViewers - a.peakViewers)
      .slice(0, 8);
  }, [streamsToDisplay, streamSessionPeaks]);

  const totalCurrentConcurrent = useMemo(
    () => activeStreams.reduce((acc, s) => acc + Math.max(0, s.viewersCount || 0), 0),
    [activeStreams]
  );

  const highestStreamPeak = useMemo(() => {
    if (barChartData.length === 0) return null;
    return barChartData.reduce(
      (best, item) => (item.peakViewers > best.peakViewers ? item : best),
      barChartData[0]
    );
  }, [barChartData]);

  const combinedPeakConcurrent = useMemo(() => {
    const timelineMax = timeline.reduce((m, p) => Math.max(m, p.sessionPeak), 0);
    const activePeaksSum = activeStreams.reduce(
      (acc, s) => acc + Math.max(s.viewersCount || 0, s.peakViewersCount || 0, streamSessionPeaks[s.id] || 0),
      0
    );
    return Math.max(totalCurrentConcurrent, timelineMax, activePeaksSum);
  }, [timeline, activeStreams, streamSessionPeaks, totalCurrentConcurrent]);

  const formatNum = (val: number) => toBengaliNumber(val.toLocaleString('en-US'), lang);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#121c27] via-[#101c18] to-[#0c1411] border border-rose-500/30 p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {activeStreams.length > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  activeStreams.length > 0 ? 'bg-rose-500' : 'bg-neutral-500'
                }`}
              />
            </span>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span>
                {lang === 'bn'
                  ? 'অ্যাক্টিভ লাইভ স্ট্রিম: কনকারেন্ট ভিউয়ার পিক (Recharts)'
                  : 'Active Live Streams: Concurrent Viewer Peaks'}
              </span>
            </h3>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {lang === 'bn'
              ? 'প্রতিটি চলমান লাইভের বর্তমান দর্শক ও সর্বোচ্চ সমসাময়িক পিক রিয়েল-টাইমে পর্যবেক্ষণ করুন'
              : 'Real-time concurrent viewer counts and peak concurrency across active live streams'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#090f12] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setChartMode('streams')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
              chartMode === 'streams'
                ? 'bg-rose-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'স্ট্রিম পিক' : 'Stream Peaks'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('timeline')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
              chartMode === 'timeline'
                ? 'bg-emerald-500 text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'লাইভ ট্রেন্ড' : 'Live Trend'}</span>
          </button>
        </div>
      </div>

      {/* 3 KPI Summary Pills */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-[#0b1315] border border-emerald-900/60">
          <span className="text-[10px] text-neutral-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-emerald-400" />
            <span>{lang === 'bn' ? 'চলমান দর্শক' : 'Live Now'}</span>
          </span>
          <p className="text-lg font-black text-emerald-400 tabular-nums mt-0.5">
            {formatNum(totalCurrentConcurrent)}
          </p>
          <span className="text-[9px] text-neutral-500">
            {formatNum(activeStreams.length)} {lang === 'bn' ? 'টি অ্যাক্টিভ লাইভ' : 'active streams'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0b1315] border border-rose-900/60">
          <span className="text-[10px] text-neutral-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-rose-400" />
            <span>{lang === 'bn' ? 'সম্মিলিত পিক' : 'Combined Peak'}</span>
          </span>
          <p className="text-lg font-black text-rose-400 tabular-nums mt-0.5">
            {formatNum(combinedPeakConcurrent)}
          </p>
          <span className="text-[9px] text-neutral-500">
            {lang === 'bn' ? 'সর্বোচ্চ সমসাময়িক' : 'Max concurrent'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0b1315] border border-amber-900/60 min-w-0">
          <span className="text-[10px] text-neutral-400 flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>{lang === 'bn' ? 'শীর্ষ স্ট্রিম পিক' : 'Top Stream Peak'}</span>
          </span>
          <p className="text-lg font-black text-amber-300 tabular-nums mt-0.5">
            {formatNum(highestStreamPeak?.peakViewers || 0)}
          </p>
          <span className="text-[9px] text-neutral-400 truncate block">
            {highestStreamPeak ? highestStreamPeak.hostName : (lang === 'bn' ? 'কোনো লাইভ নেই' : 'No active stream')}
          </span>
        </div>
      </div>

      {/* Chart Area */}
      {activeStreams.length === 0 && !includeEndedFallback ? (
        <div className="rounded-xl bg-[#090f12] border border-white/10 p-6 text-center space-y-2.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <Radio className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-neutral-200">
            {lang === 'bn'
              ? 'বর্তমানে কোনো অ্যাক্টিভ লাইভ স্ট্রিম চলছে না'
              : 'No active live streams at the moment'}
          </p>
          <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
            {lang === 'bn'
              ? 'ইউজাররা লাইভ শুরু করলে এখানে প্রতিটি স্ট্রিমের বর্তমান দর্শক ও পিক কনকারেন্সি গ্রাফ রিয়েল-টাইমে দেখা যাবে।'
              : 'Real-time concurrent viewer peak charts will appear here as soon as a live stream goes active.'}
          </p>
          {endedStreams.length > 0 && (
            <button
              type="button"
              onClick={() => setIncludeEndedFallback(true)}
              className="mt-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-amber-300 cursor-pointer transition"
            >
              {lang === 'bn'
                ? `সাম্প্রতিক সমাপ্ত ${formatNum(endedStreams.length)}টি স্ট্রিমের পিক দেখুন`
                : `View peaks from ${endedStreams.length} recent ended streams`}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activeStreams.length === 0 && includeEndedFallback && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
              <span>
                {lang === 'bn'
                  ? '📜 সমাপ্ত হওয়া সাম্প্রতিক লাইভ স্ট্রিমের পিক ডেটা প্রদর্শিত হচ্ছে'
                  : 'Showing peak viewer data from recent ended live streams'}
              </span>
              <button
                type="button"
                onClick={() => setIncludeEndedFallback(false)}
                className="text-amber-300 underline font-bold cursor-pointer ml-2"
              >
                {lang === 'bn' ? 'লুকান' : 'Hide'}
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] font-bold">
            {chartMode === 'streams' ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  <span className="text-rose-300">
                    {lang === 'bn' ? 'সর্বোচ্চ দর্শক পিক (Peak)' : 'Peak Concurrent'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-emerald-300">
                    {lang === 'bn' ? 'বর্তমান দর্শক (Current)' : 'Current Concurrent'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-rose-300">
                    {lang === 'bn' ? 'সেশন পিক লিমিট' : 'Session Peak'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-300">
                    {lang === 'bn' ? 'মোট সমসাময়িক দর্শক' : 'Total Concurrent'}
                  </span>
                </div>
              </div>
            )}
            <span className="text-neutral-500 font-medium">
              {chartMode === 'streams'
                ? (lang === 'bn' ? 'শীর্ষ ৮টি স্ট্রিম' : 'Top 8 streams')
                : (lang === 'bn' ? 'লাইভ টাইমলাইন' : 'Live timeline')}
            </span>
          </div>

          <div className="h-60 w-full bg-[#090f12] rounded-xl p-2.5 border border-white/10">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'streams' ? (
                <BarChart
                  data={barChartData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
                  barGap={4}
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
                    tickFormatter={(v) => formatNum(Number(v) || 0)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const datum = payload[0].payload as StreamBarDatum;
                      return (
                        <div className="rounded-xl bg-[#0b131d] border border-rose-500/40 p-2.5 shadow-2xl text-xs space-y-1 max-w-[220px]">
                          <p className="font-black text-white truncate">{datum.fullTitle}</p>
                          <p className="text-[10px] text-neutral-400">
                            {datum.hostName} · {datum.mode === 'video' ? '📹 ভিডিও লাইভ' : '🎙️ অডিও আড্ডা'}
                          </p>
                          <div className="pt-1 border-t border-white/10 space-y-0.5 text-[11px] font-bold">
                            <div className="flex items-center justify-between gap-4 text-rose-400">
                              <span>{lang === 'bn' ? 'সর্বোচ্চ পিক:' : 'Peak Viewers:'}</span>
                              <span>{formatNum(datum.peakViewers)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-emerald-400">
                              <span>{lang === 'bn' ? 'বর্তমান দর্শক:' : 'Current:'}</span>
                              <span>{formatNum(datum.currentViewers)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="peakViewers"
                    name={lang === 'bn' ? 'সর্বোচ্চ পিক' : 'Peak Viewers'}
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="currentViewers"
                    name={lang === 'bn' ? 'বর্তমান দর্শক' : 'Current Viewers'}
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={
                    timeline.length > 0
                      ? timeline
                      : [
                          {
                            time: lang === 'bn' ? 'এখন' : 'Now',
                            totalConcurrent: totalCurrentConcurrent,
                            sessionPeak: combinedPeakConcurrent,
                            activeStreams: activeStreams.length,
                          },
                        ]
                  }
                  margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="liveConcurrentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="livePeakGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="time"
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
                    tickFormatter={(v) => formatNum(Number(v) || 0)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b131d',
                      borderColor: 'rgba(244, 63, 94, 0.4)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                    formatter={(value: any) => [formatNum(Number(value) || 0), '']}
                  />
                  {combinedPeakConcurrent > 0 && (
                    <ReferenceLine
                      y={combinedPeakConcurrent}
                      stroke="#fbbf24"
                      strokeDasharray="4 4"
                      strokeOpacity={0.7}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="sessionPeak"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#livePeakGrad)"
                    name={lang === 'bn' ? 'সর্বোচ্চ পিক' : 'Session Peak'}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalConcurrent"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#liveConcurrentGrad)"
                    name={lang === 'bn' ? 'চলমান দর্শক' : 'Concurrent Viewers'}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Compact Top Peak Streams Breakdown */}
          {barChartData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {barChartData.slice(0, 4).map((item, idx) => (
                <div
                  key={item.id}
                  className="px-3 py-2 rounded-xl bg-[#0b1315] border border-white/10 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black flex items-center justify-center shrink-0">
                      #{formatNum(idx + 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{item.fullTitle}</p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {item.hostName} · {item.mode === 'video' ? '📹 ভিডিও' : '🎙️ অডিও'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <span className="block text-[11px] font-black text-rose-400">
                      পিক {formatNum(item.peakViewers)}
                    </span>
                    <span className="block text-[9px] text-emerald-400 font-semibold">
                      এখন {formatNum(item.currentViewers)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
