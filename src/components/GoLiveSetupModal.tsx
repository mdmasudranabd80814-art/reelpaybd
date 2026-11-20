import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Video,
  VideoOff,
  Sparkles,
  MessageSquare,
  Hand,
  Radio,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { LiveMode, User } from '../types';

export interface StartLivePayload {
  title: string;
  mode: LiveMode;
  category: string;
  pinnedNotice: string;
  chatEnabled: boolean;
  allowSpeakerRequests: boolean;
}

interface GoLiveSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  initialMode?: LiveMode;
  onStartLive: (payload: StartLivePayload) => Promise<void> | void;
  lang: 'bn' | 'en';
  allowAudioLive?: boolean;
  allowVideoLive?: boolean;
}

const LIVE_CATEGORIES_BN = ['আড্ডা', 'গান ও গল্প', 'গেমিং', 'প্রশ্নোত্তর', 'বিনোদন'];
const QUICK_TITLES_BN: Record<LiveMode, string[]> = {
  audio: ['রাতের আড্ডা ও গান 🎙️', 'বন্ধুদের ভয়েস আড্ডা ☕', 'প্রশ্নোত্তর ও গল্প ✨'],
  video: ['সরাসরি লাইভ ভিডিও 📹', 'ফ্যানদের সাথে লাইভ Q&A 💬', 'লাইভ গিফট চ্যালেঞ্জ 🎁'],
};

export const GoLiveSetupModal: React.FC<GoLiveSetupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialMode = 'audio',
  onStartLive,
  lang,
  allowAudioLive = true,
  allowVideoLive = true,
}) => {
  const [mode, setMode] = useState<LiveMode>(initialMode);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('আড্ডা');
  const [pinnedNotice, setPinnedNotice] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [allowSpeakerRequests, setAllowSpeakerRequests] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local media preview state
  const [mediaStatus, setMediaStatus] = useState<'idle' | 'ready' | 'unavailable'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isOpen) {
      let safeMode = initialMode;
      if (initialMode === 'audio' && !allowAudioLive && allowVideoLive) safeMode = 'video';
      if (initialMode === 'video' && !allowVideoLive && allowAudioLive) safeMode = 'audio';
      setMode(safeMode);
      setErrorMsg(null);
    }
  }, [isOpen, initialMode, allowAudioLive, allowVideoLive]);

  const stopPreviewMedia = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  };

  useEffect(() => {
    if (!isOpen) {
      stopPreviewMedia();
      return;
    }

    let cancelled = false;
    const initPreview = async () => {
      stopPreviewMedia();
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaStatus('unavailable');
        return;
      }

      try {
        const constraints =
          mode === 'video' ? { video: { facingMode: 'user' }, audio: true } : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setMediaStatus('ready');

        if (mode === 'video' && videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        // Audio level visualizer
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass && stream.getAudioTracks().length > 0) {
          const ctx = new AudioContextClass();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          src.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);

          const tick = () => {
            if (cancelled) return;
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(tick);
          };
          tick();
        }
      } catch {
        if (!cancelled) {
          setMediaStatus('unavailable');
        }
      }
    };

    initPreview();
    return () => {
      cancelled = true;
      stopPreviewMedia();
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((mode === 'audio' && !allowAudioLive) || (mode === 'video' && !allowVideoLive)) {
      setErrorMsg(lang === 'bn' ? 'এই লাইভ মোডটি বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : 'This live mode is currently disabled by Admin.');
      return;
    }
    const finalTitle =
      title.trim() ||
      (mode === 'audio'
        ? lang === 'bn'
          ? `${currentUser.name}-এর অডিও আড্ডা`
          : `${currentUser.name}'s Audio Adda`
        : lang === 'bn'
        ? `${currentUser.name}-এর লাইভ ভিডিও`
        : `${currentUser.name}'s Live Video`);

    if (finalTitle.length > 140) {
      setErrorMsg(lang === 'bn' ? 'শিরোনাম ১৪০ অক্ষরের মধ্যে লিখুন।' : 'Title must be under 140 characters.');
      return;
    }

    setIsStarting(true);
    setErrorMsg(null);
    stopPreviewMedia();
    try {
      await onStartLive({
        title: finalTitle,
        mode,
        category,
        pinnedNotice: pinnedNotice.trim(),
        chatEnabled,
        allowSpeakerRequests,
      });
      setTitle('');
      setPinnedNotice('');
      onClose();
    } catch {
      setErrorMsg(lang === 'bn' ? 'লাইভ শুরু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to start live. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#111c16] border-t sm:border border-emerald-900/70 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-5">
        {/* Grab handle on mobile */}
        <div className="w-10 h-1.5 bg-emerald-950 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {lang === 'bn' ? 'পার্সোনাল লাইভ স্টুডিও' : 'Personal Live Studio'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {lang === 'bn' ? 'অডিও আড্ডা বা লাইভ ভিডিও বেছে নিন' : 'Choose Audio Adda or Video Live'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopPreviewMedia();
              onClose();
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector: Audio Adda vs Video Live */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            type="button"
            disabled={!allowAudioLive}
            onClick={() => allowAudioLive && setMode('audio')}
            className={`min-h-[82px] p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              !allowAudioLive
                ? 'bg-neutral-900/70 border-neutral-800 opacity-50 cursor-not-allowed'
                : mode === 'audio'
                ? 'bg-emerald-950/80 border-emerald-400 shadow-lg shadow-emerald-500/10 cursor-pointer'
                : 'bg-[#0b130f] border-emerald-950 hover:border-emerald-800 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  mode === 'audio' && allowAudioLive ? 'bg-emerald-500 text-black' : 'bg-neutral-900 text-emerald-400'
                }`}
              >
                <Mic className="w-4 h-4" />
              </div>
              {mode === 'audio' && allowAudioLive && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="mt-2">
              <div className="text-xs font-extrabold text-white">
                {lang === 'bn' ? 'অডিও আড্ডা' : 'Audio Adda'}
              </div>
              <div className="text-[10px] text-neutral-400">
                {!allowAudioLive
                  ? (lang === 'bn' ? 'এডমিন কর্তৃক বন্ধ' : 'Disabled by Admin')
                  : (lang === 'bn' ? 'ভয়েস রুম ও স্পিকার সিট' : 'Voice hangout & speakers')}
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={!allowVideoLive}
            onClick={() => allowVideoLive && setMode('video')}
            className={`min-h-[82px] p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              !allowVideoLive
                ? 'bg-neutral-900/70 border-neutral-800 opacity-50 cursor-not-allowed'
                : mode === 'video'
                ? 'bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/10 cursor-pointer'
                : 'bg-[#0b130f] border-emerald-950 hover:border-rose-900/60 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  mode === 'video' && allowVideoLive ? 'bg-rose-500 text-white' : 'bg-neutral-900 text-rose-400'
                }`}
              >
                <Video className="w-4 h-4" />
              </div>
              {mode === 'video' && allowVideoLive && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
            </div>
            <div className="mt-2">
              <div className="text-xs font-extrabold text-white">
                {lang === 'bn' ? 'লাইভ ভিডিও' : 'Live Video'}
              </div>
              <div className="text-[10px] text-neutral-400">
                {!allowVideoLive
                  ? (lang === 'bn' ? 'এডমিন কর্তৃক বন্ধ' : 'Disabled by Admin')
                  : (lang === 'bn' ? 'সরাসরি ক্যামেরা ব্রডকাস্ট' : 'Live camera stream')}
              </div>
            </div>
          </button>
        </div>

        {/* Live Pre-flight Stage Preview */}
        <div className="relative h-36 rounded-2xl overflow-hidden bg-[#0b130f] border border-emerald-950 mb-4 flex items-center justify-center">
          {mode === 'video' && mediaStatus === 'ready' ? (
            <>
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-semibold">
                  {lang === 'bn' ? 'ক্যামেরা ও মাইক প্রস্তুত' : 'Camera & mic ready'}
                </span>
                <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-100"
                    style={{ width: `${Math.max(12, audioLevel)}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 text-center">
              <div className="relative mb-2">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border border-[#0b130f] ${
                    mode === 'audio' ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                  }`}
                >
                  {mode === 'audio' ? <Mic className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </span>
              </div>
              {mediaStatus === 'ready' ? (
                <div className="space-y-1.5 w-48">
                  <p className="text-[11px] font-semibold text-emerald-300">
                    {lang === 'bn' ? 'মাইক্রোফোন সংযুক্ত • কথা বলে দেখুন' : 'Mic connected • Speak to test'}
                  </p>
                  <div className="w-full h-1.5 bg-emerald-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-300 transition-all duration-75"
                      style={{ width: `${Math.max(8, audioLevel)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-400 max-w-xs">
                  {lang === 'bn'
                    ? 'ক্যামেরা/মাইক পারমিশন না থাকলে স্টেজ ও চ্যাট মোডে লাইভ চলবে'
                    : 'Runs in live stage & chat mode if cam/mic permission is unavailable'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-neutral-300 mb-1.5">
              {lang === 'bn' ? 'লাইভের শিরোনাম' : 'Live Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              placeholder={
                mode === 'audio'
                  ? lang === 'bn'
                    ? 'যেমন: রাতের আড্ডা ও গান...'
                    : 'e.g. Late night audio adda...'
                  : lang === 'bn'
                  ? 'যেমন: বন্ধুদের সাথে লাইভ ভিডিও...'
                  : 'e.g. Live video hangout...'
              }
              className="w-full min-h-[44px] bg-[#0b130f] border border-emerald-950 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            {/* Quick-fill suggestions */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2">
              {QUICK_TITLES_BN[mode].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#17261e] hover:bg-[#1f3328] text-[11px] text-emerald-300 border border-emerald-950 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-300 mb-1.5">
              {lang === 'bn' ? 'ক্যাটাগরি / বিষয়' : 'Category / Topic'}
            </label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {LIVE_CATEGORIES_BN.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[36px] shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    category === cat
                      ? 'bg-emerald-500 text-black'
                      : 'bg-[#0b130f] text-neutral-400 border border-emerald-950 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Pinned Notice */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-300 mb-1.5">
              {lang === 'bn' ? 'পিন করা বার্তা (ঐচ্ছিক)' : 'Pinned Notice (Optional)'}
            </label>
            <input
              type="text"
              value={pinnedNotice}
              onChange={(e) => setPinnedNotice(e.target.value)}
              maxLength={240}
              placeholder={
                lang === 'bn'
                  ? 'যেমন: সবাই সুন্দর কমেন্ট করুন ও গিফট পাঠান ❤️'
                  : 'e.g. Welcome everyone! Tap like & send gifts'
              }
              className="w-full min-h-[44px] bg-[#0b130f] border border-emerald-950 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Room Controls */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            <label className="min-h-[46px] flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0b130f] border border-emerald-950 cursor-pointer">
              <span className="flex items-center gap-2 text-xs text-neutral-200 font-semibold">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'bn' ? 'দর্শকদের লাইভ কমেন্ট চালু' : 'Enable viewer comments'}</span>
              </span>
              <input
                type="checkbox"
                checked={chatEnabled}
                onChange={(e) => setChatEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
            </label>

            <label className="min-h-[46px] flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0b130f] border border-emerald-950 cursor-pointer">
              <span className="flex items-center gap-2 text-xs text-neutral-200 font-semibold">
                <Hand className="w-4 h-4 text-amber-400" />
                <span>{lang === 'bn' ? 'অডিও আড্ডায় স্পিকার রিকোয়েস্ট' : 'Allow speaker requests'}</span>
              </span>
              <input
                type="checkbox"
                checked={allowSpeakerRequests}
                onChange={(e) => setAllowSpeakerRequests(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
            </label>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Start Live CTA */}
          <button
            type="submit"
            disabled={isStarting || (!allowAudioLive && !allowVideoLive)}
            className={`w-full min-h-[48px] rounded-2xl font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-[0.98] disabled:opacity-60 ${
              mode === 'audio'
                ? 'bg-gradient-to-r from-[#00c853] to-[#00e676] text-black shadow-emerald-500/25'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-600/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isStarting
                ? lang === 'bn'
                  ? 'লাইভ চালু হচ্ছে...'
                  : 'Starting Live...'
                : mode === 'audio'
                ? lang === 'bn'
                  ? '🎙️ অডিও আড্ডা শুরু করুন'
                  : '🎙️ Start Audio Adda'
                : lang === 'bn'
                ? '📹 লাইভ ভিডিও শুরু করুন'
                : '📹 Go Live Video'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
