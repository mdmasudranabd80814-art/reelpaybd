import React, { useState } from 'react';
import {
  User as UserIcon,
  Phone,
  ShieldCheck,
  Award,
  Video,
  LogOut,
  Coins,
  ArrowRight,
  HelpCircle,
  FileText,
  Edit3,
  Trash2,
  MessageCircle,
  Users,
  UserPlus,
  Check,
  Camera,
  ChevronRight,
  Bookmark,
  Play,
  Sparkles,
  Lock,
  Mail,
  Smartphone,
} from 'lucide-react';
import { User, Reel, EarningSettings, LiveStream, LiveMode, PaymentMethodConfig, DEFAULT_PAYMENT_METHODS } from '../types';
import { toBengaliNumber, formatTaka } from '../utils/bengali';
import { getUserLevel, getNextLevel, getProgressToNextLevel } from '../utils/levels';
import { isHapticsEnabled, setHapticsEnabled, vibrateLight, vibrateSuccess, vibrateError } from '../utils/haptics';
import { ProfileInfoModal, ProfileInfoModalMode } from './ProfileInfoModal';
import { TopEarnersLeaderboard } from './TopEarnersLeaderboard';

interface ProfileViewProps {
  user: User;
  pointRate: number;
  onLogout: () => void;
  onSwitchUser: (updatedUser: User) => void;
  onClaimDailyBonus: (bonusPoints: number) => void;
  isClaimedToday: boolean;
  isMuted: boolean;
  isAuthenticated: boolean;
  onRequireAuth: (msg?: string) => void;
  lang: 'bn' | 'en';
  setShowGiftSheet: (show: boolean) => void;
  setShowLiveSheet: (show: boolean) => void;
  onOpenPersonalLive?: (mode?: LiveMode) => void;
  activeMyLive?: LiveStream | null;
  onManageMyLive?: (liveId: string) => void;
  onEndMyLive?: (liveId: string) => void;
  reels: Reel[];
  onOpenReel: (reel: Reel) => void;
  onEditReel?: (reel: Reel) => void;
  onDeleteReel?: (reel: Reel) => void;
  onOpenChatList?: () => void;
  onOpenFollowList?: (tab: 'followers' | 'following') => void;
  onOpenWallet?: () => void;
  minWithdrawal?: number;
  earningSettings?: EarningSettings;
  savedReelIds?: string[];
  onToggleSave?: (reelId: string) => void;
  onNavigateToHome?: () => void;
  paymentMethods?: PaymentMethodConfig[];
  allowUserAudioLive?: boolean;
  allowUserVideoLive?: boolean;
  isDirectChatEnabled?: boolean;
  users?: User[];
  onOpenUserProfile?: (userId: string) => void;
  onApplyReferralCode?: (code: string) => Promise<{ ok: boolean; message: string }>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  pointRate,
  onLogout,
  onSwitchUser,
  onClaimDailyBonus,
  isClaimedToday,
  isMuted,
  isAuthenticated,
  onRequireAuth,
  lang,
  setShowGiftSheet,
  setShowLiveSheet,
  onOpenPersonalLive,
  activeMyLive,
  onManageMyLive,
  onEndMyLive,
  reels,
  onOpenReel,
  onEditReel,
  onDeleteReel,
  onOpenChatList,
  onOpenFollowList,
  onOpenWallet,
  minWithdrawal = 100,
  earningSettings,
  savedReelIds = [],
  onToggleSave,
  onNavigateToHome,
  paymentMethods,
  allowUserAudioLive = true,
  allowUserVideoLive = true,
  isDirectChatEnabled = true,
  users = [],
  onOpenUserProfile,
  onApplyReferralCode,
}) => {
  const availablePaymentMethods = React.useMemo(() => {
    const base = paymentMethods && paymentMethods.length > 0 ? paymentMethods : DEFAULT_PAYMENT_METHODS;
    const enabled = base.filter((m) => m.isEnabled);
    return enabled.length > 0 ? enabled : DEFAULT_PAYMENT_METHODS;
  }, [paymentMethods]);

  const [activeMediaTab, setActiveMediaTab] = useState<'my_reels' | 'saved'>('my_reels');
  const [isEditing, setIsEditing] = useState(false);
  const [infoModalMode, setInfoModalMode] = useState<ProfileInfoModalMode | null>(null);
  const [reelToDelete, setReelToDelete] = useState<Reel | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [hapticsOn, setHapticsOn] = useState<boolean>(() => isHapticsEnabled());
  const [referralNote, setReferralNote] = useState<{ text: string; isError?: boolean } | null>(null);
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [referredByInput, setReferredByInput] = useState('');
  const [nameInput, setNameInput] = useState(user.name);
  const [phoneInput, setPhoneInput] = useState(user.phone);
  const [emailInput, setEmailInput] = useState(user.email || '');
  const [avatarInput, setAvatarInput] = useState(user.avatar || '');
  const [methodInput, setMethodInput] = useState<string>(user.paymentMethod || availablePaymentMethods[0]?.name || 'bKash');
  const [accNumInput, setAccNumInput] = useState(user.paymentAccountNumber || '');
  const [accHolderInput, setAccHolderInput] = useState(user.paymentAccountHolder || '');
  const [bankNameInput, setBankNameInput] = useState(user.paymentBankName || '');
  const [branchNameInput, setBranchNameInput] = useState(user.paymentBranchName || '');

  React.useEffect(() => {
    setNameInput(user.name);
    setPhoneInput(user.phone);
    setEmailInput(user.email || '');
    setAvatarInput(user.avatar || '');
    setMethodInput(user.paymentMethod || availablePaymentMethods[0]?.name || 'bKash');
    setAccNumInput(user.paymentAccountNumber || '');
    setAccHolderInput(user.paymentAccountHolder || '');
    setBankNameInput(user.paymentBankName || '');
    setBranchNameInput(user.paymentBranchName || '');
  }, [user.id, user.name, user.phone, user.email, user.avatar, user.paymentMethod, user.paymentAccountNumber, user.paymentAccountHolder, user.paymentBankName, user.paymentBranchName]);

  const selectedMethodConfig = availablePaymentMethods.find((m) => m.name === methodInput);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSide = 240;
        const ratio = Math.min(maxSide / img.width, maxSide / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setAvatarInput(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onSwitchUser({
        ...user,
        name: nameInput.trim().slice(0, 100),
        phone: phoneInput.trim().slice(0, 20),
        email: emailInput.trim(),
        avatar: avatarInput.trim() || user.avatar,
        paymentMethod: methodInput,
        paymentAccountNumber: accNumInput.trim(),
        paymentAccountHolder: accHolderInput.trim(),
        paymentBankName: bankNameInput.trim(),
        paymentBranchName: branchNameInput.trim(),
      });
      setIsEditing(false);
      vibrateSuccess();
    }
  };

  const currentLevel = getUserLevel(user.reelsWatchedCount);
  const nextLevel = getNextLevel(user.reelsWatchedCount);
  const progress = getProgressToNextLevel(user.reelsWatchedCount);

  // Show user's created reels: strictly show only this specific user's uploaded reels
  const userReels = reels.filter((r) => r.userId === user.id);

  // Saved reels (local list)
  const savedReels = (savedReelIds || [])
    .map((id) => reels.find((r) => r.id === id))
    .filter((r): r is Reel => Boolean(r));

  return (
    <div className="space-y-4 pb-20 text-white">
      {/* Profile Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#122419] to-[#0c1811] p-5 border border-emerald-900/60 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-lg"
            />
            {user.isVerified && (
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-black rounded-full flex items-center justify-center text-[10px] font-black shadow"
                title={lang === 'bn' ? 'ভেরিফায়েড অ্যাকাউন্ট' : 'Verified Account'}
              >
                ✓
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold truncate">{user.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-opacity-20 flex items-center gap-1 ${
                currentLevel.level >= 4 ? 'bg-amber-500 text-amber-300 border border-amber-500/30' : 'bg-emerald-500 text-emerald-300 border border-emerald-500/30'
              }`}>
                <span className="text-xs">{currentLevel.badge}</span>
                <span>{currentLevel.nameBn}</span>
              </span>
            </div>

            {user.phone ? (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{user.phone}</span>
              </div>
            ) : user.email ? (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            ) : null}

            <p className="text-[11px] text-neutral-500 mt-0.5">
              {lang === 'bn' ? 'যুক্ত হয়েছেন:' : 'Joined:'}{' '}
              {(() => {
                if (!user.createdAt) return '—';
                const parsed = new Date(user.createdAt);
                return Number.isNaN(parsed.getTime())
                  ? user.createdAt
                  : parsed.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
              })()}
            </p>
          </div>

          {/* Quick Direct Message / Inbox Button in Header Card */}
          <button
            type="button"
            disabled={!isDirectChatEnabled}
            onClick={isDirectChatEnabled ? onOpenChatList : undefined}
            className={`min-h-[44px] px-3 py-2 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-md shrink-0 ${
              isDirectChatEnabled
                ? 'bg-[#00c853] hover:bg-[#00e676] text-black active:scale-95 cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
            title={
              isDirectChatEnabled
                ? (lang === 'bn' ? 'মেসেজ ইনবক্স খুলুন' : 'Open Message Inbox')
                : (lang === 'bn' ? 'চ্যাট সাময়িকভাবে বন্ধ রয়েছে' : 'Chat paused by Admin')
            }
          >
            {isDirectChatEnabled ? <MessageCircle className="w-4 h-4 fill-current" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{lang === 'bn' ? (isDirectChatEnabled ? 'মেসেজ' : 'চ্যাট বন্ধ') : 'Message'}</span>
          </button>
        </div>

        {/* Level Progress Bar (Clickable to view all levels) */}
        <button
          type="button"
          onClick={() => setInfoModalMode('levels')}
          className="w-full text-left mt-4 p-3 rounded-xl bg-black/30 hover:bg-black/45 border border-emerald-950/50 hover:border-emerald-700/60 transition cursor-pointer"
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span>{lang === 'bn' ? 'লেভেল প্রগ্রেস' : 'Level Progress'}</span>
              <ChevronRight className="w-3 h-3" />
            </span>
            <span className="text-[10px] text-neutral-400">
              {toBengaliNumber(user.reelsWatchedCount)} / {nextLevel ? toBengaliNumber(nextLevel.minWatched) : 'MAX'} {lang === 'bn' ? 'রিল' : 'reels'}
            </span>
          </div>
          <div className="h-2 w-full bg-emerald-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          {nextLevel && (
            <p className="text-[9px] text-neutral-400 mt-1.5">
              পরবর্তী লেভেল: <span className="text-emerald-400 font-bold">{nextLevel.nameBn}</span> হতে আরও <span className="text-white">{toBengaliNumber(nextLevel.minWatched - user.reelsWatchedCount)}টি</span> রিল দেখুন (ট্যাপ করে সব লেভেল দেখুন)।
            </p>
          )}
        </button>

        {/* Referral Section */}
        <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">রেফার কোড (আমার)</span>
              <button 
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(user.referralCode);
                  vibrateLight();
                  setCopiedRef(true);
                  setTimeout(() => setCopiedRef(false), 1800);
                }}
                className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-md hover:bg-emerald-500/30 transition inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedRef && <Check className="w-3 h-3" />}
                <span>{copiedRef ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
              </button>
            </div>
            <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2 border border-emerald-900/50">
              <span className="text-sm font-mono font-bold tracking-widest text-emerald-300">{user.referralCode}</span>
              <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                <HelpCircle className="w-3 h-3" />
                <span>{toBengaliNumber(earningSettings?.referralRewardPoints ?? 50)} পয়েন্ট বোনাস</span>
              </div>
            </div>
          </div>

          {!user.referredBy ? (
            <div className="pt-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">বন্ধুর রেফার কোড দিন</span>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={referredByInput}
                  disabled={applyingReferral}
                  onChange={(e) => {
                    setReferredByInput(e.target.value.toUpperCase());
                    if (referralNote) setReferralNote(null);
                  }}
                  placeholder="যেমন: REEL1234"
                  className="flex-1 bg-black/40 border border-emerald-900/50 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                />
                <button 
                  type="button"
                  disabled={applyingReferral || referredByInput.trim().length < 4}
                  onClick={async () => {
                    const val = referredByInput.trim().toUpperCase();
                    if (val.length < 4 || val === (user.referralCode || '').toUpperCase()) {
                      vibrateError();
                      setReferralNote({
                        text: lang === 'bn' ? 'সঠিক রেফার কোড দিন!' : 'Enter a valid referral code!',
                        isError: true,
                      });
                      return;
                    }
                    if (onApplyReferralCode) {
                      setApplyingReferral(true);
                      try {
                        const res = await onApplyReferralCode(val);
                        setReferralNote({ text: res.message, isError: !res.ok });
                        if (res.ok) setReferredByInput('');
                      } finally {
                        setApplyingReferral(false);
                      }
                    } else {
                      onSwitchUser({ ...user, referredBy: val });
                      setReferredByInput('');
                      setReferralNote({
                        text: lang === 'bn' ? 'রেফার কোড সফলভাবে যুক্ত হয়েছে!' : 'Referral code added!',
                      });
                      vibrateSuccess();
                    }
                  }}
                  className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    applyingReferral || referredByInput.trim().length < 4
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 cursor-pointer'
                  }`}
                >
                  {applyingReferral ? (lang === 'bn' ? 'যাচাই...' : 'Checking...') : (lang === 'bn' ? 'সাবমিট' : 'Submit')}
                </button>
              </div>
              {referralNote && (
                <p className={`text-[11px] mt-1 ${referralNote.isError ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {referralNote.text}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px] text-emerald-400/80 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
              <Award className="w-3 h-3" />
              <span>আপনি রেফার কোড <b>{user.referredBy}</b> ব্যবহার করেছেন।</span>
            </div>
          )}
        </div>

        {/* Interactive Stats Grid: Followers, Following, Points, Withdrawn */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-emerald-950/80 text-center">
          <button
            type="button"
            onClick={() => onOpenFollowList?.('followers')}
            className="p-2.5 rounded-xl bg-black/40 hover:bg-[#15281e] border border-emerald-950 hover:border-emerald-600/50 transition cursor-pointer active:scale-95"
          >
            <div className="flex items-center justify-center text-emerald-400 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-white block tabular-nums">
              {toBengaliNumber(user.followersCount || 0, lang)}
            </span>
            <p className="text-[10px] text-neutral-300 font-semibold">ফলোয়ার ↗</p>
          </button>

          <button
            type="button"
            onClick={() => onOpenFollowList?.('following')}
            className="p-2.5 rounded-xl bg-black/40 hover:bg-[#15281e] border border-emerald-950 hover:border-cyan-600/50 transition cursor-pointer active:scale-95"
          >
            <div className="flex items-center justify-center text-cyan-400 mb-1">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-white block tabular-nums">
              {toBengaliNumber(user.followingCount || 0, lang)}
            </span>
            <p className="text-[10px] text-neutral-300 font-semibold">ফলোয়িং ↗</p>
          </button>

          <button
            type="button"
            onClick={() => onOpenWallet?.()}
            className="p-2.5 rounded-xl bg-black/40 hover:bg-[#15281e] border border-emerald-950 hover:border-amber-600/50 transition cursor-pointer active:scale-95"
          >
            <div className="flex items-center justify-center text-amber-400 mb-1">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-white block tabular-nums">
              {toBengaliNumber(user.points, lang)}
            </span>
            <p className="text-[10px] text-neutral-300 font-semibold">মোট পয়েন্ট ↗</p>
          </button>

          <button
            type="button"
            onClick={() => onOpenWallet?.()}
            className="p-2.5 rounded-xl bg-black/40 hover:bg-[#15281e] border border-emerald-950 hover:border-green-600/50 transition cursor-pointer active:scale-95"
          >
            <div className="flex items-center justify-center text-green-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-white block tabular-nums">
              {formatTaka(user.totalWithdrawn, lang)}
            </span>
            <p className="text-[10px] text-neutral-300 font-semibold">উত্তোলিত টাকা ↗</p>
          </button>
        </div>
      </div>

      {/* Profile Edit Section */}
      <div>
        {isEditing ? (
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 space-y-3"
          >
            <h3 className="text-sm font-bold text-emerald-400">প্রোফাইল তথ্য আপডেট</h3>
            <div className="flex items-center gap-3 pb-2 border-b border-emerald-950">
              <img
                src={avatarInput || user.avatar}
                alt={nameInput}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/60 shrink-0"
              />
              <div className="flex-1 space-y-1.5">
                <label className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#0d1611] border border-emerald-800/60 text-xs font-bold text-emerald-300 inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#16251d]">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'প্রোফাইল ছবি পরিবর্তন' : 'Change Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </label>
                <p className="text-[10px] text-neutral-400">
                  {lang === 'bn' ? 'গ্যালারি থেকে নতুন ছবি বেছে নিন' : 'Pick a new photo from gallery'}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">আপনার নাম:</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">মোবাইল নম্বর:</label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">ইমেইল:</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">পেমেন্ট মেথড:</label>
              <select
                value={methodInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setMethodInput(val);
                  const matched = availablePaymentMethods.find((m) => m.name === val);
                  if (matched?.bankName) setBankNameInput(matched.bankName);
                }}
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white"
              >
                {availablePaymentMethods.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.nameBn} ({m.name}) — {m.category === 'bank' ? 'ব্যাংক' : m.category === 'card' ? 'কার্ড' : m.category === 'mobile_banking' ? 'মোবাইল' : 'অন্যান্য'}
                  </option>
                ))}
                {!availablePaymentMethods.some((m) => m.name === methodInput) && methodInput && (
                  <option value={methodInput}>{methodInput}</option>
                )}
              </select>
            </div>
            {(selectedMethodConfig?.category === 'bank' || selectedMethodConfig?.category === 'card') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">
                    {selectedMethodConfig.category === 'bank' ? 'ব্যাংকের নাম:' : 'কার্ড টাইপ:'}
                  </label>
                  <input
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    placeholder={selectedMethodConfig.category === 'bank' ? 'যেমন: DBBL / IBBL' : 'Visa / MasterCard'}
                    className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">হোল্ডারের নাম:</label>
                  <input
                    type="text"
                    value={accHolderInput}
                    onChange={(e) => setAccHolderInput(e.target.value)}
                    placeholder="Account / Card Holder"
                    className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                {selectedMethodConfig.category === 'bank' && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-neutral-400 block mb-1">শাখা (Branch):</label>
                    <input
                      type="text"
                      value={branchNameInput}
                      onChange={(e) => setBranchNameInput(e.target.value)}
                      placeholder="শাখার নাম লিখুন..."
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="text-xs text-neutral-400 block mb-1">পেমেন্ট অ্যাকাউন্ট / কার্ড নম্বর:</label>
              <input
                type="text"
                value={accNumInput}
                onChange={(e) => setAccNumInput(e.target.value)}
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 min-h-[42px] py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black text-xs font-bold transition cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full min-h-[44px] py-2.5 rounded-xl bg-[#141f19] hover:bg-[#1a2821] border border-emerald-950 text-xs font-bold text-neutral-300 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>প্রোফাইল পরিবর্তন করুন</span>
          </button>
        )}
      </div>

      {/* Help & Support Links + Haptics Preference */}
      <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-2 space-y-1">
        <button
          type="button"
          onClick={() => {
            const next = !hapticsOn;
            setHapticsEnabled(next);
            setHapticsOn(next);
            if (next) vibrateLight();
          }}
          className="w-full min-h-[46px] px-3 py-2 rounded-xl flex items-center justify-between text-xs text-neutral-200 hover:bg-white/5 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">
              {lang === 'bn' ? 'টাচ ভাইব্রেশন (Haptic Feedback)' : 'Touch Vibration (Haptics)'}
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border transition ${
              hapticsOn
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            {hapticsOn ? (lang === 'bn' ? 'চালু' : 'ON') : (lang === 'bn' ? 'বন্ধ' : 'OFF')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setInfoModalMode('faq')}
          className="w-full min-h-[46px] px-3 py-2 rounded-xl border-t border-emerald-950/60 flex items-center justify-between text-xs text-neutral-200 hover:bg-white/5 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">সচরাচর জিজ্ঞাসা (FAQ)</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
        </button>
        <button
          type="button"
          onClick={() => setInfoModalMode('terms')}
          className="w-full min-h-[46px] px-3 py-2 rounded-xl border-t border-emerald-950/60 flex items-center justify-between text-xs text-neutral-200 hover:bg-white/5 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">শর্তাবলী ও নিয়মাবলী</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
        </button>
      </div>

      {/* Top Earners Leaderboard */}
      <TopEarnersLeaderboard
        users={users}
        currentUser={user}
        lang={lang}
        pointRate={pointRate}
        onOpenUserProfile={onOpenUserProfile}
      />

      {/* My Reels & Saved Reels Switcher */}
      <div className="pt-2">
        <div className="grid grid-cols-2 gap-2 mb-3 bg-[#101914] p-1 rounded-2xl border border-emerald-950/70">
          <button
            type="button"
            onClick={() => setActiveMediaTab('my_reels')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeMediaTab === 'my_reels'
                ? 'bg-[#00c853] text-black shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>আমার রিলস ({toBengaliNumber(userReels.length, lang)})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMediaTab('saved')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeMediaTab === 'saved'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>সংরক্ষিত ({toBengaliNumber(savedReels.length, lang)})</span>
          </button>
        </div>

        {activeMediaTab === 'my_reels' ? (
          userReels.length === 0 ? (
            <div className="bg-[#141f19] rounded-2xl p-8 border border-emerald-950 text-center">
              <Video className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-neutral-500">
                {lang === 'bn' ? 'আপনি এখনো কোনো রিল পাবলিশ করেননি।' : 'You have not published any reels yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {userReels.map((reel) => (
                <div
                  key={reel.id}
                  className="relative aspect-[3/4] bg-[#0d1611] rounded-2xl overflow-hidden border border-emerald-950/60 shadow-md group"
                >
                  <div onClick={() => onOpenReel(reel)} className="absolute inset-0 cursor-pointer">
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                    {onEditReel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditReel(reel);
                        }}
                        className="w-7 h-7 rounded-full bg-black/75 hover:bg-emerald-500 hover:text-black text-emerald-400 backdrop-blur-md flex items-center justify-center transition shadow-lg cursor-pointer"
                        title={lang === 'bn' ? 'রিল এডিট করুন' : 'Edit Reel'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteReel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReelToDelete(reel);
                        }}
                        className="w-7 h-7 rounded-full bg-black/75 hover:bg-rose-500 hover:text-white text-rose-400 backdrop-blur-md flex items-center justify-center transition shadow-lg cursor-pointer"
                        title={lang === 'bn' ? 'রিল মুছুন' : 'Delete Reel'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => onOpenReel(reel)}
                    className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none cursor-pointer"
                  >
                    <p className="text-xs font-bold text-white truncate drop-shadow-sm mb-0.5">
                      {reel.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        <span>{toBengaliNumber(reel.viewsCount || 0, lang)}</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/60 text-emerald-300 border border-emerald-500/20">
                        {reel.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : savedReels.length === 0 ? (
          <div className="bg-[#101c15] rounded-3xl p-8 border border-amber-500/25 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/8 via-transparent to-transparent pointer-events-none" />
            <div className="relative w-16 h-16 bg-gradient-to-tr from-amber-950/80 to-amber-900/30 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/35 shadow-lg">
              <Bookmark className="w-8 h-8 text-amber-400 fill-amber-400/20" />
            </div>
            <h4 className="text-sm font-black text-white mb-1">
              {lang === 'bn' ? 'সংরক্ষিত রিল নেই' : 'No Saved Reels'}
            </h4>
            <p className="text-xs text-neutral-400 max-w-[240px] mb-4 leading-relaxed">
              {lang === 'bn' ? 'আপনি এখনো কোনো রিল সেভ করেননি। রিল ফিড থেকে পছন্দের রিলগুলো সেভ করে রাখুন।' : 'You haven\'t saved any reels yet. Bookmark your favorite reels to watch anytime.'}
            </p>
            {onNavigateToHome && (
              <button
                type="button"
                onClick={onNavigateToHome}
                className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'bn' ? 'হোম ফিড থেকে রিল দেখুন' : 'Explore Reels'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {savedReels.map((reel) => (
              <div
                key={reel.id}
                className="relative aspect-[3/4] bg-[#0d1611] rounded-2xl overflow-hidden border border-amber-500/30 shadow-md group"
              >
                <div onClick={() => onOpenReel(reel)} className="absolute inset-0 cursor-pointer">
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-black/50 border border-amber-400/70 flex items-center justify-center text-amber-300">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                {onToggleSave && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(reel.id);
                    }}
                    className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/75 hover:bg-rose-500 text-amber-400 hover:text-white flex items-center justify-center shadow-lg cursor-pointer"
                    title={lang === 'bn' ? 'সেভ থেকে সরান' : 'Remove bookmark'}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <p className="text-xs font-bold text-white truncate drop-shadow-sm pointer-events-none">
                    {reel.title}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenUserProfile?.(reel.userId);
                    }}
                    className="text-[10px] text-amber-300 hover:text-emerald-300 hover:underline truncate block max-w-full text-left cursor-pointer"
                  >
                    {reel.creatorName}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full py-3 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>লগআউট করুন</span>
      </button>

      {/* In-app Delete Confirmation Modal (no browser popups) */}
      {reelToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121c17] border border-rose-900/60 rounded-2xl p-5 max-w-xs w-full text-center shadow-2xl space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-600/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base mb-1">
                {lang === 'bn' ? 'রিল মুছে ফেলতে চান?' : 'Delete this reel?'}
              </h4>
              <p className="text-xs text-neutral-300 line-clamp-2 px-1">
                &ldquo;{reelToDelete.title}&rdquo; {lang === 'bn' ? 'মুছে ফেলা হবে। এটি হোম ও প্রোফাইল থেকে অপসারিত হবে।' : 'will be deleted.'}
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setReelToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = reelToDelete;
                  setReelToDelete(null);
                  if (onDeleteReel && target) {
                    onDeleteReel(target);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Profile Info Modal (Levels, FAQ, Terms) */}
      <ProfileInfoModal
        mode={infoModalMode}
        onClose={() => setInfoModalMode(null)}
        reelsWatchedCount={user.reelsWatchedCount || 0}
        pointRate={pointRate}
        minWithdrawal={minWithdrawal}
        lang={lang}
      />
    </div>
  );
};
