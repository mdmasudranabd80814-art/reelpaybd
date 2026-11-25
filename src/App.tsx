/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { User, Reel, WithdrawalRequest, Comment, TaskItem, DepositRequest, Notification, LiveStream, LiveMode, ChatSession, ChatMessage, EarningSettings, DEFAULT_EARNING_SETTINGS, SiteSettings, DEFAULT_SITE_SETTINGS } from './types';
import { INITIAL_REELS, INITIAL_TASKS } from './data/initialData';
import { Header } from './components/Header';
import { ReelFeedCard } from './components/ReelFeedCard';
import { BottomNav, TabType } from './components/BottomNav';
import { ChevronRight, Sparkles, Radio, Mic, Video, Loader2, Headphones, Play, Users, Wrench, Filter, Search, X, Tag } from 'lucide-react';
import type { StartLivePayload } from './components/GoLiveSetupModal';
import { GiftItem } from './types';
import { playCoinSound, playSuccessChime, playPopSound } from './utils/audio';
import { vibrateLike, vibrateReward, vibrateGift, vibrateSuccess, vibrateLight, vibrateError } from './utils/haptics';
import { toBengaliNumber } from './utils/bengali';
import { getUserLevel, getProgressToNextLevel } from './utils/levels';
import { calculateGiftSplit } from './utils/gifts';
import confetti from 'canvas-confetti';
import { CATEGORIES_LIST, getCategoryMeta, ReelCategory } from './utils/categories';

// Lazy Loaded Components
const AdminPortal = lazy(() => import('./components/AdminPortal').then(m => ({ default: m.AdminPortal })));
const FullScreenReelModal = lazy(() => import('./components/FullScreenReelModal').then(m => ({ default: m.FullScreenReelModal })));
const WalletView = lazy(() => import('./components/WalletView').then(m => ({ default: m.WalletView })));
const EarnView = lazy(() => import('./components/EarnView').then(m => ({ default: m.EarnView })));
const ProfileView = lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));
const CommentsModal = lazy(() => import('./components/CommentsModal').then(m => ({ default: m.CommentsModal })));
const NotificationModal = lazy(() => import('./components/NotificationModal').then(m => ({ default: m.NotificationModal })));
const GiftSheet = lazy(() => import('./components/GiftSheet').then(m => ({ default: m.GiftSheet })));
const DepositSheet = lazy(() => import('./components/DepositSheet').then(m => ({ default: m.DepositSheet })));
const LiveStreamSheet = lazy(() => import('./components/LiveStreamSheet').then(m => ({ default: m.LiveStreamSheet })));
const GoLiveSetupModal = lazy(() => import('./components/GoLiveSetupModal').then(m => ({ default: m.GoLiveSetupModal })));
const PlusSheet = lazy(() => import('./components/PlusSheet').then(m => ({ default: m.PlusSheet })));
const ShareSheet = lazy(() => import('./components/ShareSheet').then(m => ({ default: m.ShareSheet })));
const EditReelModal = lazy(() => import('./components/EditReelModal').then(m => ({ default: m.EditReelModal })));
const ChatModal = lazy(() => import('./components/ChatModal').then(m => ({ default: m.ChatModal })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
const FollowListModal = lazy(() => import('./components/FollowListModal').then(m => ({ default: m.FollowListModal })));
const UserPickerModal = lazy(() => import('./components/UserPickerModal').then(m => ({ default: m.UserPickerModal })));
const ChatListModal = lazy(() => import('./components/ChatListModal').then(m => ({ default: m.ChatListModal })));
import { AuthPage } from './components/AuthPage';
import { EmailVerificationGate } from './components/EmailVerificationGate';
import { GuestEarnView } from './components/GuestEarnView';
import { GuestWalletView } from './components/GuestWalletView';
import { GuestProfileView } from './components/GuestProfileView';
import { AuthPromptModal } from './components/AuthPromptModal';
import { useFirebase, formatFirebaseAuthError } from './hooks/useFirebase';
import { where, orderBy, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { normalizeVideoUrl } from './utils/video';
import { downloadReelVideo } from './utils/videoDownload';
import { buildUserMap, resolveReelWithOwner, resolveMasudRanaCreator, MASUD_RANA_FALLBACK_ID, MASUD_RANA_AVATAR, MASUD_RANA_NAME } from './utils/reelOwner';
import { generateUnlimitedAiReelsBatch } from './utils/aiReelGenerator';
import {
  buildScaledSpinPrizes,
  getDailyEarningUsage,
  getOfferRequirementProgress,
  isTaskCompletedForUser,
  normalizeTaskOffer,
} from './utils/offers';

const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
  </div>
);

const FullPageLoader = () => (
  <div className="min-h-screen bg-[#0a0f0d] text-white flex flex-col items-center justify-center p-6 gap-3">
    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
    <p className="text-xs font-bold text-emerald-300">সিকিউরিটি যাচাই হচ্ছে...</p>
  </div>
);

const CATEGORIES: ReelCategory[] = CATEGORIES_LIST;

const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

const createGuestUser = (id: string, points = 0): User => ({
  id,
  name: 'অতিথি ইউজার',
  phone: '',
  avatar: DEFAULT_AVATAR_URL,
  paymentMethod: 'bKash',
  paymentAccountNumber: '',
  points,
  role: 'user',
  createdAt: new Date().toISOString().slice(0, 10),
  referralCode: '',
  isVerified: false,
  totalWithdrawn: 0,
  reelsWatchedCount: 0,
  followersCount: 0,
  followingCount: 0,
  followers: [],
  following: [],
  completedTaskIds: [],
  likedReelIds: [],
  likedCommentIds: [],
  referralsCount: 0,
  referralEarnedPoints: 0,
});

const toPublicProfile = (u: User) => ({
  id: u.id,
  name: (u.name || 'User').slice(0, 100),
  avatar: u.avatar || DEFAULT_AVATAR_URL,
  isVerified: Boolean(u.isVerified),
  role: u.role || 'user',
  points: Math.max(0, u.points || 0),
  referralCode: (u.referralCode || '').slice(0, 20),
  followersCount: u.followersCount || 0,
  followingCount: u.followingCount || 0,
  followers: (u.followers || []).slice(0, 1000),
  following: (u.following || []).slice(0, 1000),
  reelsWatchedCount: u.reelsWatchedCount || 0,
  referralsCount: u.referralsCount || 0,
  referralEarnedPoints: u.referralEarnedPoints || 0,
  dailyReferralDate: (u.dailyReferralDate || '').slice(0, 20),
  dailyReferralsCount: Math.max(0, u.dailyReferralsCount || 0),
  createdAt: u.createdAt || new Date().toISOString(),
});

const DEMO_USER_IDS = new Set<string>([
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
  MASUD_RANA_FALLBACK_ID,
]);

const DEMO_REEL_IDS = new Set<string>([
  'reel_01',
  'reel_02',
]);

const isRealUserId = (id?: string | null): id is string =>
  Boolean(id && !id.startsWith('GUEST-') && !DEMO_USER_IDS.has(id));

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06090e] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="max-w-sm w-full bg-[#121923] border border-rose-700/50 rounded-3xl p-6 space-y-3 shadow-2xl">
            <h2 className="text-lg font-black text-rose-400">সিস্টেম এরর ধরা পড়েছে</h2>
            <p className="text-xs text-neutral-300 leading-relaxed break-words">
              {this.state.errorMessage || 'অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে রিলোড করুন।'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition"
            >
              পুনরায় লোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const checkIsAdminLocation = () => {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    hash === '#/admin' ||
    hash.startsWith('#/admin/')
  );
};

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminLocation);

  useEffect(() => {
    const syncRoute = () => setIsAdminRoute(checkIsAdminLocation());
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  if (isAdminRoute) {
    return (
      <AppErrorBoundary>
        <Suspense fallback={<FullPageLoader />}>
          <AdminPortal />
        </Suspense>
      </AppErrorBoundary>
    );
  }
  return (
    <AppErrorBoundary>
      <UserApp />
    </AppErrorBoundary>
  );
}

function UserApp() {
  const {
    user: firebaseUser,
    emailVerified,
    loading: authLoading,
    authError,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resendVerificationEmail,
    refreshVerificationStatus,
    resetPassword,
    logout: firebaseLogout,
    getDocument,
    getCollection,
    setDocument,
    updateDocument,
    deleteDocument,
    addDocument,
    onSnapshot: firebaseOnSnapshot,
    onDocumentSnapshot,
  } = useFirebase();

  const [profileSyncing, setProfileSyncing] = useState<boolean>(false);
  const [authSyncError, setAuthSyncError] = useState<string | null>(null);
  const [syncRetryNonce, setSyncRetryNonce] = useState<number>(0);

  // Persistent State
  const [users, setUsers] = useState<User[]>([]);
  const [guestId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem('rt_guest_id');
      if (existing) return existing;
      const created = `GUEST-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('rt_guest_id', created);
      return created;
    } catch {
      return `GUEST-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  });
  const [guestPoints, setGuestPoints] = useState<number>(() => {
    try {
      const val = localStorage.getItem('rt_guest_points');
      return val ? Math.max(0, Number(val)) : 0;
    } catch {
      return 0;
    }
  });
  const [guestWatchedReelIds, setGuestWatchedReelIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rt_guest_watched_reels') || '[]');
    } catch {
      return [];
    }
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  const [authPromptState, setAuthPromptState] = useState<{ open: boolean; title?: string; message?: string }>({
    open: false,
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(() => createGuestUser(guestId, 0));
  const [pointRate, setPointRate] = useState<number>(() => {
    try {
      const val = localStorage.getItem('rt_point_rate');
      return val ? Number(val) : 10;
    } catch {
      return 10;
    }
  });
  const [minWithdrawal, setMinWithdrawal] = useState<number>(() => {
    try {
      const val = localStorage.getItem('rt_min_withdrawal');
      return val ? Number(val) : 100;
    } catch {
      return 100;
    }
  });
  const [adminPaymentNumbers, setAdminPaymentNumbers] = useState<{ bKash: string; Nagad: string; Rocket: string }>(() => {
    try {
      const val = localStorage.getItem('rt_payment_numbers');
      return val ? JSON.parse(val) : { bKash: '01700000000', Nagad: '01800000000', Rocket: '01900000000' };
    } catch {
      return { bKash: '01700000000', Nagad: '01800000000', Rocket: '01900000000' };
    }
  });
  const [announcement, setAnnouncement] = useState<string>(() => {
    try {
      const val = localStorage.getItem('rt_announcement');
      return val || '📢 আজকের স্পেশাল অফার! প্রতিটি রিল দেখলে ইনস্ট্যান্ট ১০ পয়েন্ট। বন্ধুদের ইনভাইট করে ৫০ টাকা বোনাস বুঝে নিন!';
    } catch {
      return '📢 আজকের স্পেশাল অফার! প্রতিটি রিল দেখলে ইনস্ট্যান্ট ১০ পয়েন্ট। বন্ধুদের ইনভাইট করে ৫০ টাকা বোনাস বুঝে নিন!';
    }
  });

  const [deletedReelIds, setDeletedReelIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rt_deleted_reels') || '[]');
    } catch {
      return [];
    }
  });
  const [editedReelsMap, setEditedReelsMap] = useState<Record<string, Partial<Reel>>>(() => {
    try {
      return JSON.parse(localStorage.getItem('rt_edited_reels') || '{}');
    } catch {
      return {};
    }
  });
  const [reels, setReels] = useState<Reel[]>(() => INITIAL_REELS);
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [likedReelIds, setLikedReelIds] = useState<string[]>([]);
  const [savedReelIds, setSavedReelIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rt_saved_reels') || '[]');
    } catch {
      return [];
    }
  });
  const [watchedReelIds, setWatchedReelIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rt_watched_reels') || '[]');
    } catch {
      return [];
    }
  });
  const [reelWatchProgressMap, setReelWatchProgressMap] = useState<Record<string, number>>({});
  const handleWatchProgressChange = useCallback((reelId: string, progressPercent: number) => {
    setReelWatchProgressMap((prev) => {
      const existing = prev[reelId] || 0;
      const clamped = Math.max(existing, Math.min(100, progressPercent));
      if (clamped <= existing || (Math.abs(clamped - existing) < 0.5 && clamped < 100)) {
        return prev;
      }
      return { ...prev, [reelId]: clamped };
    });
  }, []);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [personalNotifications, setPersonalNotifications] = useState<Notification[]>([]);
  const [activeLiveStreams, setActiveLiveStreams] = useState<LiveStream[]>([]);

  // Spin Wheel & Scratch Card Admin Control State
  const [spinMaxPrize, setSpinMaxPrize] = useState<number>(() => {
    try {
      const val = localStorage.getItem('rt_spin_max');
      return val ? Number(val) : 100;
    } catch {
      return 100;
    }
  });
  const [scratchPrize, setScratchPrize] = useState<number>(() => {
    try {
      const val = localStorage.getItem('rt_scratch_prize');
      return val ? Number(val) : 35;
    } catch {
      return 35;
    }
  });

  // Admin Customization of Point Earning & Special Offers
  const [earningSettings, setEarningSettings] = useState<EarningSettings>(() => {
    try {
      const saved = localStorage.getItem('rt_earning_settings');
      return saved ? { ...DEFAULT_EARNING_SETTINGS, ...JSON.parse(saved) } : DEFAULT_EARNING_SETTINGS;
    } catch {
      return DEFAULT_EARNING_SETTINGS;
    }
  });

  // Global Site & Payment Settings controlled by Admin
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('rt_site_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SITE_SETTINGS,
          ...parsed,
          paymentMethods:
            Array.isArray(parsed.paymentMethods) && parsed.paymentMethods.length > 0
              ? parsed.paymentMethods
              : DEFAULT_SITE_SETTINGS.paymentMethods,
        };
      }
      return DEFAULT_SITE_SETTINGS;
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  });

  // Send Notification Helper
  const sendNotification = async (userId: string, title: string, message: string, type: Notification['type']) => {
    try {
      await addDocument(`users/${userId}/notifications`, {
        userId,
        title,
        message,
        type,
        createdAt: new Date().toISOString(),
        read: false
      });
    } catch (err) {
      console.warn('Failed to send notification:', err);
    }
  };

  const currentUserRef = useRef<User>(currentUser);
  currentUserRef.current = currentUser;

  useEffect(() => {
    if (authError && !firebaseUser) {
      setShowAuthModal(true);
    }
  }, [authError, firebaseUser]);

  // Auth Sync: strictly require verified email before reading/writing Firestore
  useEffect(() => {
    let cancelled = false;
    if (firebaseUser && emailVerified) {
      setShowAuthModal(false);
      setAuthPromptState({ open: false });
      setAuthSyncError(null);
      setProfileSyncing(true);
      const syncProfile = async () => {
        try {
          // Ensure auth ID token carries latest email_verified claim before Firestore access
          await firebaseUser.getIdToken(true).catch(() => {});

          const resolvedEmail = (
            firebaseUser.email ||
            firebaseUser.providerData?.find((p) => p.email)?.email ||
            ''
          ).slice(0, 150);

          let profile: User | null = null;
          try {
            profile = (await getDocument('users', firebaseUser.uid)) as User | null;
          } catch (firstErr) {
            await firebaseUser.getIdToken(true).catch(() => {});
            profile = (await getDocument('users', firebaseUser.uid)) as User | null;
            if (!profile && firstErr) {
              console.warn('Retried profile fetch:', firstErr);
            }
          }

          const remoteSettings = (await getDocument('settings', 'earning').catch(() => null)) as Partial<EarningSettings> | null;
          if (cancelled) return;

          const liveSettings: EarningSettings = {
            ...DEFAULT_EARNING_SETTINGS,
            ...earningSettings,
            ...(remoteSettings || {}),
          };

          const isOfferActive = Boolean(
            liveSettings.isLoginOfferEnabled &&
            Number(liveSettings.loginOfferPoints) > 0 &&
            liveSettings.isMasterEarningEnabled !== false
          );
          const offerPoints = isOfferActive
            ? Math.max(0, Math.round(Number(liveSettings.loginOfferPoints)))
            : 0;
          const activeCampaignId = isOfferActive
            ? (liveSettings.loginOfferCampaignId || `offer_${offerPoints}`)
            : '';

          if (profile) {
            // Check if Admin enabled a new login offer campaign that this user hasn't claimed yet
            if (
              isOfferActive &&
              offerPoints > 0 &&
              activeCampaignId &&
              profile.loginOfferCampaignId !== activeCampaignId
            ) {
              const updatedUser: User = {
                ...profile,
                id: firebaseUser.uid,
                email: (profile.email || resolvedEmail).slice(0, 150),
                isVerified: true,
                points: (profile.points || 0) + offerPoints,
                loginOfferClaimed: true,
                loginOfferCampaignId: activeCampaignId,
              };
              setCurrentUser(updatedUser);
              setLikedReelIds(Array.isArray(updatedUser.likedReelIds) ? updatedUser.likedReelIds : []);
              setIsAuthenticated(true);
              await Promise.all([
                updateDocument('users', firebaseUser.uid, {
                  points: increment(offerPoints),
                  loginOfferClaimed: true,
                  loginOfferCampaignId: activeCampaignId,
                }).catch((err) => console.warn('Login offer credit sync warning:', err)),
                setDocument('public_profiles', firebaseUser.uid, toPublicProfile(updatedUser)).catch(() => {}),
              ]);
              if (!isMuted) playSuccessChime();
              vibrateReward();
              showToast(
                lang === 'bn'
                  ? `🎁 এডমিন লগইন অফার! +${toBengaliNumber(offerPoints, lang)} পয়েন্ট আপনার অ্যাকাউন্টে যোগ হয়েছে!`
                  : `🎁 Admin Login Offer! +${offerPoints} points credited!`
              );
            } else {
              const hydratedProfile: User = {
                ...profile,
                id: firebaseUser.uid,
                email: (profile.email || resolvedEmail).slice(0, 150),
                isVerified: true,
              };
              setCurrentUser(hydratedProfile);
              setLikedReelIds(Array.isArray(hydratedProfile.likedReelIds) ? hydratedProfile.likedReelIds : []);
              setIsAuthenticated(true);
              setDocument('public_profiles', firebaseUser.uid, toPublicProfile(hydratedProfile)).catch(() => {});
            }
          } else {
            let pendingReg: Partial<User> = {};
            try {
              const raw = localStorage.getItem('rt_pending_reg');
              if (raw) {
                pendingReg = JSON.parse(raw);
                localStorage.removeItem('rt_pending_reg');
              }
            } catch {}

            let pendingRefCode = (pendingReg.referredBy || '').trim().toUpperCase();
            if (!pendingRefCode) {
              try {
                pendingRefCode = (localStorage.getItem('rt_pending_ref') || '').trim().toUpperCase();
              } catch {}
            }

            let validatedReferredBy = '';
            const myNewReferralCode = `REEL${Math.floor(1000 + Math.random() * 9000)}`;
            if (pendingRefCode.length >= 4 && pendingRefCode !== myNewReferralCode) {
              try {
                const matchedReferrers = await getCollection('public_profiles', [
                  where('referralCode', '==', pendingRefCode),
                ]);
                const matched = matchedReferrers?.[0] as User | undefined;
                if (matched && isRealUserId(matched.id) && matched.id !== firebaseUser.uid) {
                  validatedReferredBy = pendingRefCode;
                }
              } catch {}
              try {
                localStorage.removeItem('rt_pending_ref');
              } catch {}
            }

            const safeName = (
              pendingReg.name ||
              firebaseUser.displayName ||
              (resolvedEmail ? resolvedEmail.split('@')[0] : '') ||
              'User'
            ).trim().slice(0, 100);

            const newUser: User = {
              id: firebaseUser.uid,
              name: safeName || 'User',
              phone: (pendingReg.phone || '').trim().slice(0, 20),
              email: resolvedEmail,
              avatar: firebaseUser.photoURL || DEFAULT_AVATAR_URL,
              paymentMethod: (pendingReg.paymentMethod || siteSettings.paymentMethods?.[0]?.name || 'bKash').slice(0, 100),
              paymentAccountNumber: (pendingReg.paymentAccountNumber || '').slice(0, 100),
              paymentAccountHolder: (pendingReg.paymentAccountHolder || '').slice(0, 120),
              paymentBankName: (pendingReg.paymentBankName || '').slice(0, 120),
              points: offerPoints,
              role: 'user',
              createdAt: new Date().toISOString().slice(0, 10),
              referralCode: myNewReferralCode,
              ...(validatedReferredBy ? { referredBy: validatedReferredBy } : {}),
              isVerified: true,
              totalWithdrawn: 0,
              reelsWatchedCount: 0,
              followersCount: 0,
              followingCount: 0,
              followers: [],
              following: [],
              completedTaskIds: [],
              likedReelIds: [],
              likedCommentIds: [],
              referralsCount: 0,
              referralEarnedPoints: 0,
              loginOfferClaimed: offerPoints > 0,
              loginOfferCampaignId: activeCampaignId,
            };

            // Persist user document BEFORE activating authenticated listeners/tracking
            await setDocument('users', firebaseUser.uid, newUser);
            if (cancelled) return;

            setCurrentUser(newUser);
            setLikedReelIds([]);
            setIsAuthenticated(true);
            setDocument('public_profiles', firebaseUser.uid, toPublicProfile(newUser)).catch(() => {});

            if (validatedReferredBy && liveSettings.requireReelWatchForReferral === false) {
              processReferralRewardIfEligible(newUser, liveSettings).catch(() => {});
            }

            if (offerPoints > 0) {
              if (!isMuted) playSuccessChime();
              vibrateReward();
              showToast(
                lang === 'bn'
                  ? `🎉 অ্যাকাউন্ট তৈরি হয়েছে! লগইন অফার +${toBengaliNumber(offerPoints, lang)} পয়েন্ট যোগ হয়েছে!`
                  : `🎉 Account created! Login offer +${offerPoints} points added!`
              );
            } else {
              showToast(
                lang === 'bn'
                  ? '✅ Google ভেরিফাইড লগইন সম্পন্ন হয়েছে! রিল দেখে ও টাস্ক করে আর্ন শুরু করুন।'
                  : '✅ Verified Google sign-in successful! Start earning now.'
              );
            }
          }
        } catch (err) {
          console.error('Auth sync error:', err);
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : String(err);
            setAuthSyncError(
              lang === 'bn'
                ? `আপনার ভেরিফাইড অ্যাকাউন্টটি প্রোফাইলের সাথে সিঙ্ক করতে সমস্যা হয়েছে (${msg.slice(0, 120)})`
                : `Failed to sync your verified profile (${msg.slice(0, 120)})`
            );
          }
        } finally {
          if (!cancelled) {
            setProfileSyncing(false);
          }
        }
      };
      syncProfile();
    } else {
      setProfileSyncing(false);
      setAuthSyncError(null);
      setIsAuthenticated(false);
      setLikedReelIds([]);
      setCurrentUser(createGuestUser(guestId, guestPoints));
    }
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, emailVerified, guestId, syncRetryNonce]);

  const firestoreReelIdsRef = useRef<Set<string>>(new Set());
  const aiSeqRef = useRef<number>(1);
  const feedSentinelRef = useRef<HTMLDivElement | null>(null);

  const masudCreator = React.useMemo(
    () =>
      resolveMasudRanaCreator(
        users,
        isAuthenticated ? currentUser : null,
        firebaseUser?.email
      ),
    [users, isAuthenticated, currentUser, firebaseUser?.email]
  );

  const masudCreatorRef = useRef(masudCreator);
  masudCreatorRef.current = masudCreator;

  const loadMoreInfiniteReels = useCallback((targetCategory?: string) => {
    const startSeq = aiSeqRef.current;
    const count = 8;
    aiSeqRef.current += count;
    const batch = generateUnlimitedAiReelsBatch({
      startSequence: startSeq,
      count,
      category: targetCategory === '🔴 লাইভ' ? 'সকল' : (targetCategory || 'সকল'),
      creator: masudCreatorRef.current,
    });
    setReels((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const uniqueBatch = batch.filter((r) => !existingIds.has(r.id));
      if (uniqueBatch.length === 0) return prev;
      return [...prev, ...uniqueBatch];
    });
  }, []);

  // Public Reels Listener (Viewable in Guest Mode & Verified Mode; paused during unverified gate)
  // Merges Firestore reels + curated comedy/category INITIAL_REELS + infinite AI reels
  useEffect(() => {
    if (firebaseUser && !emailVerified) return;

    const unsubReels = firebaseOnSnapshot('reels', (data) => {
      const deleted: string[] = (() => {
        try {
          return JSON.parse(localStorage.getItem('rt_deleted_reels') || '[]');
        } catch {
          return [];
        }
      })();
      const edited: Record<string, Partial<Reel>> = (() => {
        try {
          return JSON.parse(localStorage.getItem('rt_edited_reels') || '{}');
        } catch {
          return {};
        }
      })();

      const remoteData = ((data || []) as Reel[]).filter(
        (r) => r && r.id && !DEMO_REEL_IDS.has(r.id)
      );
      firestoreReelIdsRef.current = new Set(remoteData.map((r) => r.id));

      const remoteIds = new Set(remoteData.map((r) => r.id));
      const combinedBase = [
        ...remoteData,
        ...INITIAL_REELS.filter((r) => !remoteIds.has(r.id)),
      ]
        .filter((r) => !deleted.includes(r.id))
        .map((r, idx) => {
          const patched = edited[r.id] ? { ...r, ...edited[r.id] } : r;
          return {
            ...patched,
            viewsCount: patched.viewsCount || 0,
            likesCount: patched.likesCount || 0,
            commentsCount: patched.commentsCount || 0,
            sharesCount: patched.sharesCount || 0,
            videoUrl: normalizeVideoUrl(patched.videoUrl, idx) ?? patched.videoUrl,
          };
        });

      const baseIds = new Set(combinedBase.map((r) => r.id));

      setReels((prev) => {
        const existingAiReels = prev.filter(
          (r) => r.id.startsWith('ai_reel_') && !baseIds.has(r.id) && !deleted.includes(r.id)
        );
        if (existingAiReels.length > 0) {
          return [...combinedBase, ...existingAiReels];
        }
        const initialAiBatch = generateUnlimitedAiReelsBatch({
          startSequence: aiSeqRef.current,
          count: 10,
          category: 'সকল',
          creator: masudCreatorRef.current,
        });
        aiSeqRef.current += 10;
        return [...combinedBase, ...initialAiBatch];
      });
    }, [orderBy('createdAt', 'desc')]);

    return () => {
      unsubReels();
    };
  }, [firebaseUser?.uid, emailVerified]);

  // Authenticated & Email-Verified Private Firestore Listeners
  useEffect(() => {
    if (!firebaseUser || !emailVerified) return;

    // Public discovery profiles (non-PII directory)
    const unsubPublicProfiles = firebaseOnSnapshot('public_profiles', (data) => {
      setUsers(((data || []) as User[]).filter((u) => isRealUserId(u.id)));
    });

    // User-specific financial listeners (Owner only - client-side sort avoids composite index requirement)
    const unsubUserWithdrawals = firebaseOnSnapshot('withdrawals', (data) => {
      const sorted = (data as WithdrawalRequest[]).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setWithdrawals(sorted);
    }, [where('userId', '==', firebaseUser.uid)]);

    const unsubUserDeposits = firebaseOnSnapshot('deposits', (data) => {
      const sorted = (data as DepositRequest[]).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setDepositRequests(sorted);
    }, [where('userId', '==', firebaseUser.uid)]);

    return () => {
      unsubPublicProfiles();
      unsubUserWithdrawals();
      unsubUserDeposits();
    };
  }, [firebaseUser?.uid, emailVerified]);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('rt_active_tab');
    return saved === 'earn' || saved === 'wallet' || saved === 'profile' ? saved : 'home';
  });

  // Sync current user's private profile via direct document listener (uses allow get directly)
  useEffect(() => {
    if (isAuthenticated && firebaseUser && emailVerified && isRealUserId(currentUser.id) && currentUser.id === firebaseUser.uid) {
      const unsubUser = onDocumentSnapshot('users', firebaseUser.uid, (me) => {
        if (me) {
          const nextUser = me as User;
          setCurrentUser(nextUser);
          setLikedReelIds(Array.isArray(nextUser.likedReelIds) ? nextUser.likedReelIds : []);
        }
      });
      return unsubUser;
    }
  }, [isAuthenticated, currentUser.id, firebaseUser?.uid, emailVerified, onDocumentSnapshot]);

  // Sync personal notifications
  useEffect(() => {
    if (isAuthenticated && firebaseUser && emailVerified && isRealUserId(currentUser.id) && currentUser.id === firebaseUser.uid) {
      const unsub = firebaseOnSnapshot(`users/${firebaseUser.uid}/notifications`, (data) => {
        setPersonalNotifications(data as Notification[]);
      }, [orderBy('createdAt', 'desc')]);
      return unsub;
    }
  }, [isAuthenticated, currentUser.id, firebaseUser?.uid, emailVerified]);

  // Sync active live streams (viewable in Guest preview & Verified User mode)
  useEffect(() => {
    if (firebaseUser && !emailVerified) return;
    const unsub = firebaseOnSnapshot('live_streams', (data) => {
      const active = (data as LiveStream[])
        .filter((s) => s && s.status === 'active' && isRealUserId(s.hostId))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setActiveLiveStreams(active);
    });
    return unsub;
  }, [firebaseUser?.uid, emailVerified]);

  // Sync tasks from Firestore
  useEffect(() => {
    if (!firebaseUser || !emailVerified) return;
    const unsubTasks = firebaseOnSnapshot('tasks', (data) => {
      if (data && data.length > 0) {
        const sorted = [...(data as TaskItem[])].sort(
          (a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)
        );
        setTasks(sorted);
      } else {
        setTasks(INITIAL_TASKS);
      }
    });
    return unsubTasks;
  }, [firebaseUser?.uid, emailVerified]);

  // Sync Earning & Global Site Settings from Firestore (accessible in Guest & Verified User modes)
  useEffect(() => {
    if (firebaseUser && !emailVerified) return;
    const unsubSettings = firebaseOnSnapshot('settings', (data) => {
      if (data && data.length > 0) {
        const earningDoc = (data as any[]).find((d) => d.id === 'earning');
        if (earningDoc) {
          setEarningSettings((prev) => ({ ...prev, ...earningDoc }));
          if (typeof earningDoc.spinMaxPrize === 'number') {
            setSpinMaxPrize(earningDoc.spinMaxPrize);
          }
          if (typeof earningDoc.scratchCardPrize === 'number') {
            setScratchPrize(earningDoc.scratchCardPrize);
          }
          try {
            localStorage.setItem('rt_earning_settings', JSON.stringify(earningDoc));
          } catch {}
        }

        const siteDoc = (data as any[]).find((d) => d.id === 'site') as Partial<SiteSettings> | undefined;
        if (siteDoc) {
          setSiteSettings((prev) => {
            const next: SiteSettings = {
              ...DEFAULT_SITE_SETTINGS,
              ...prev,
              ...siteDoc,
              paymentMethods:
                Array.isArray(siteDoc.paymentMethods) && siteDoc.paymentMethods.length > 0
                  ? siteDoc.paymentMethods
                  : prev.paymentMethods,
            };
            try {
              localStorage.setItem('rt_site_settings', JSON.stringify(next));
            } catch {}
            return next;
          });
          if (typeof siteDoc.pointRate === 'number' && siteDoc.pointRate > 0) {
            setPointRate(siteDoc.pointRate);
            try { localStorage.setItem('rt_point_rate', String(siteDoc.pointRate)); } catch {}
          }
          if (typeof siteDoc.minWithdrawal === 'number' && siteDoc.minWithdrawal > 0) {
            setMinWithdrawal(siteDoc.minWithdrawal);
            try { localStorage.setItem('rt_min_withdrawal', String(siteDoc.minWithdrawal)); } catch {}
          }
          if (typeof siteDoc.announcement === 'string') {
            setAnnouncement(siteDoc.announcement);
            try { localStorage.setItem('rt_announcement', siteDoc.announcement); } catch {}
          }
        }
      }
    });
    return unsubSettings;
  }, [firebaseUser?.uid, emailVerified]);

  useEffect(() => {
    localStorage.setItem('rt_active_tab', activeTab);
  }, [activeTab]);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  // UI Navigation & View State
  const [selectedCategory, setSelectedCategory] = useState<ReelCategory>('সকল');
  const [feedSearchQuery, setFeedSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'most_watched' | 'popular'>('newest');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Category selection handler with horizontal pill auto-scroll and audio feedback
  const handleSelectCategory = useCallback((cat: ReelCategory | string) => {
    const target = (cat as ReelCategory);
    setSelectedCategory(target);
    if (!isMuted) playPopSound();
    vibrateLight();
    requestAnimationFrame(() => {
      const el = document.getElementById(`cat-tab-${target}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }, [isMuted]);

  // Support deep-linked category & referral code parameters (?category=..., ?ref=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category') || params.get('cat');
      if (catParam) {
        const decoded = decodeURIComponent(catParam).trim().toLowerCase();
        const matched = CATEGORIES_LIST.find(
          (c) => c.toLowerCase() === decoded || getCategoryMeta(c).labelEn.toLowerCase() === decoded
        );
        if (matched) {
          setSelectedCategory(matched);
        }
      }
      const refParam = params.get('ref');
      if (refParam && refParam.trim().length >= 4) {
        localStorage.setItem('rt_pending_ref', refParam.trim().toUpperCase().slice(0, 20));
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const levelProgress = getProgressToNextLevel(currentUser.reelsWatchedCount);

  const [lang, setLang] = useState<'bn' | 'en'>(() => {
    return (localStorage.getItem('rt_lang') as 'bn' | 'en') || 'bn';
  });

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'bn' ? 'en' : 'bn';
      localStorage.setItem('rt_lang', next);
      return next;
    });
  };

  // Track newly started live streams and alert other users in real-time
  const prevLiveIdsRef = useRef<Set<string>>(new Set());
  const initialLiveLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (initialLiveLoadRef.current) {
      if (activeLiveStreams.length > 0) {
        prevLiveIdsRef.current = new Set(activeLiveStreams.map((s) => s.id));
      }
      initialLiveLoadRef.current = false;
      return;
    }

    const currentIds = new Set(activeLiveStreams.map((s) => s.id));
    for (const live of activeLiveStreams) {
      if (!prevLiveIdsRef.current.has(live.id) && live.hostId !== currentUser.id) {
        showToast(
          lang === 'bn'
            ? `🔴 ${live.hostName} লাইভ শুরু করেছেন! এখনই যোগ দিন।`
            : `🔴 ${live.hostName} is now LIVE! Tap to join.`
        );
        if (!isMuted) playPopSound();
        break;
      }
    }
    prevLiveIdsRef.current = currentIds;
  }, [activeLiveStreams, currentUser.id, isMuted, lang]);

  // Modal Dialogs & Sheets
  const [fullScreenReelId, setFullScreenReelId] = useState<string | null>(null);
  const [activeCommentReel, setActiveCommentReel] = useState<Reel | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showGiftSheet, setShowGiftSheet] = useState<boolean>(false);
  const [giftTarget, setGiftTarget] = useState<{ userId?: string; liveId?: string; creatorName?: string } | null>(null);
  const [showDepositSheet, setShowDepositSheet] = useState<boolean>(false);
  const [showLiveSheet, setShowLiveSheet] = useState<boolean>(false);
  const [showGoLiveSetupModal, setShowGoLiveSetupModal] = useState<boolean>(false);
  const [goLiveInitialMode, setGoLiveInitialMode] = useState<LiveMode>('audio');
  const [showPlusSheet, setShowPlusSheet] = useState<boolean>(false);
  const [showShareSheet, setShowShareSheet] = useState<boolean>(false);
  const [sharingReel, setSharingReel] = useState<Reel | null>(null);
  const [sharingLiveStream, setSharingLiveStream] = useState<LiveStream | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Messenger & Profile Modals
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isChatListModalOpen, setIsChatListModalOpen] = useState(false);
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
  const [activeChatOtherUser, setActiveChatOtherUser] = useState<User | null>(null);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [selectedUserProfileUser, setSelectedUserProfileUser] = useState<User | null>(null);
  const [followListModal, setFollowListModal] = useState<{ user: User; tab: 'followers' | 'following' } | null>(null);

  // Sharing in Chat
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [sharingReelInChat, setSharingReelInChat] = useState<Reel | null>(null);

  const openAuthModal = (view: 'login' | 'register' = 'login') => {
    setAuthModalView(view);
    setShowAuthModal(true);
  };

  const triggerAuthPrompt = (message?: string, title?: string) => {
    vibrateError();
    setAuthPromptState({
      open: true,
      title,
      message,
    });
  };

  const handleUserEmailRegister = async (email: string, pass: string, userData: Partial<User>) => {
    try {
      localStorage.setItem('rt_pending_reg', JSON.stringify({
        name: userData.name || '',
        phone: userData.phone || '',
        paymentMethod: userData.paymentMethod || siteSettings.paymentMethods?.[0]?.name || 'bKash',
        paymentAccountNumber: userData.paymentAccountNumber || '',
        paymentAccountHolder: userData.paymentAccountHolder || '',
        paymentBankName: userData.paymentBankName || '',
        referredBy: userData.referredBy || '',
      }));
    } catch {}
    return registerWithEmail(email, pass, userData.name);
  };

  const handleUserGoogleLogin = async (pendingProfile?: Partial<User>) => {
    if (pendingProfile) {
      try {
        localStorage.setItem('rt_pending_reg', JSON.stringify({
          name: pendingProfile.name || '',
          phone: pendingProfile.phone || '',
          paymentMethod: pendingProfile.paymentMethod || siteSettings.paymentMethods?.[0]?.name || 'bKash',
          paymentAccountNumber: pendingProfile.paymentAccountNumber || '',
          paymentAccountHolder: pendingProfile.paymentAccountHolder || '',
          paymentBankName: pendingProfile.paymentBankName || '',
          referredBy: pendingProfile.referredBy || '',
        }));
      } catch {}
    }
    return loginWithGoogle();
  };

  // Activity Tracking Effect (for verified user)
  useEffect(() => {
    const updateTracking = () => {
      if (
        !isAuthenticated ||
        !firebaseUser ||
        !emailVerified ||
        !isRealUserId(currentUser.id) ||
        currentUser.id !== firebaseUser.uid
      ) {
        return;
      }
      const now = new Date().toISOString();
      const pageInfo = fullScreenReelId ? `Reel: ${fullScreenReelId}` : `Tab: ${activeTab}`;
      updateDocument('users', firebaseUser.uid, {
        lastActive: now,
        lastPage: pageInfo,
        totalSessions: (currentUser.totalSessions || 0) + (currentUser.lastActive ? 0 : 1),
      }).catch(() => {});
    };

    updateTracking();
    const interval = setInterval(updateTracking, 30000);
    return () => clearInterval(interval);
  }, [activeTab, fullScreenReelId, isAuthenticated, currentUser.id, firebaseUser?.uid, emailVerified]);

  // Fast & Atomic Optimistic Point Mutation Helper (0ms UI response + Firestore increment)
  const applyFastUserMutation = (pointDelta: number, extraFields: Record<string, any> = {}) => {
    const activeUser = currentUserRef.current;
    if (
      !isAuthenticated ||
      !firebaseUser ||
      !emailVerified ||
      !isRealUserId(activeUser.id) ||
      activeUser.id !== firebaseUser.uid
    ) {
      return;
    }

    const currentPts = activeUser.points || 0;
    const safeDelta = pointDelta < 0 ? -Math.min(currentPts, Math.abs(pointDelta)) : pointDelta;

    // 1. Instant 0ms optimistic state update
    setCurrentUser((prev) => ({
      ...prev,
      ...extraFields,
      points: Math.max(0, (prev.points || 0) + safeDelta),
    }));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === activeUser.id
          ? { ...u, ...extraFields, points: Math.max(0, (u.points || 0) + safeDelta) }
          : u
      )
    );

    // 2. Atomic Firestore update in background
    const firestorePayload: Record<string, any> = { ...extraFields };
    if (safeDelta !== 0) {
      firestorePayload.points = increment(safeDelta);
      updateDocument('public_profiles', activeUser.id, { points: increment(safeDelta) }).catch(() => {});
    }
    if (Object.keys(firestorePayload).length > 0) {
      updateDocument('users', activeUser.id, firestorePayload).catch((err) => {
        console.warn('Fast point mutation sync error:', err);
      });
    }
  };

  // User Actions: Fast Points Update
  const updateUserPoints = (delta: number) => {
    applyFastUserMutation(delta);
  };

  // Claim Daily Bonus & Daily Reel/Total Earning Limit Calculations
  const todayKey = new Date().toISOString().slice(0, 10);
  const isClaimedToday = isAuthenticated && currentUser.dailyClaimedDate === todayKey;

  const isReelLimitEnabled = earningSettings.isDailyReelLimitEnabled !== false;
  const dailyClaimsLimit = earningSettings.dailyMaxReelClaims ?? 5;
  const dailyPointsLimit = earningSettings.dailyMaxReelPoints ?? 100;
  const isSameReelClaimDay = isAuthenticated && currentUser.dailyReelClaimDate === todayKey;
  const dailyClaimsUsed = isSameReelClaimDay ? (currentUser.dailyReelClaimsCount || 0) : 0;
  const dailyPointsUsed = isSameReelClaimDay ? (currentUser.dailyReelPointsEarned || 0) : 0;
  const isDailyReelLimitReached = Boolean(
    isAuthenticated &&
    isReelLimitEnabled &&
    ((dailyClaimsLimit > 0 && dailyClaimsUsed >= dailyClaimsLimit) ||
      (dailyPointsLimit > 0 && dailyPointsUsed >= dailyPointsLimit))
  );

  // Validated Referral Bonus Processor (enforces referral watch rule, daily referrer cap, & referred user bonus)
  const processReferralRewardIfEligible = async (
    targetUser: User,
    settingsObj: EarningSettings = earningSettings
  ) => {
    if (
      !settingsObj.isMasterEarningEnabled ||
      !settingsObj.isReferralEnabled ||
      !targetUser.referredBy ||
      targetUser.referralBonusClaimed ||
      !isRealUserId(targetUser.id)
    ) {
      return;
    }

    if (
      settingsObj.requireReelWatchForReferral !== false &&
      (targetUser.reelsWatchedCount || 0) < 1
    ) {
      return;
    }

    try {
      const matched = await getCollection('public_profiles', [
        where('referralCode', '==', targetUser.referredBy.trim().toUpperCase()),
      ]);
      if (!matched || matched.length === 0) return;

      const referrer = matched[0] as User;
      if (!isRealUserId(referrer.id) || referrer.id === targetUser.id) return;

      const refBonus = Math.max(0, Math.round(settingsObj.referralRewardPoints ?? 50));
      const maxDailyRefs = Math.max(0, Math.round(settingsObj.dailyMaxReferrals ?? 10));
      const refSameDay = referrer.dailyReferralDate === todayKey;
      const refDailyCount = refSameDay ? Math.max(0, referrer.dailyReferralsCount || 0) : 0;
      const referrerUnderCap = maxDailyRefs === 0 || refDailyCount < maxDailyRefs;

      const rawReferredBonus = Math.max(0, Math.round(settingsObj.referredUserRewardPoints ?? 0));
      const usage = getDailyEarningUsage(targetUser, settingsObj, todayKey);
      const awardedSelfBonus =
        rawReferredBonus > 0
          ? Number.isFinite(usage.remainingTotalPoints)
            ? Math.min(rawReferredBonus, usage.remainingTotalPoints)
            : rawReferredBonus
          : 0;

      // Mark claimed immediately on local state to prevent duplicate fires
      setCurrentUser((prev) => ({
        ...prev,
        referralBonusClaimed: true,
        ...(awardedSelfBonus > 0
          ? {
              points: (prev.points || 0) + awardedSelfBonus,
              dailyTotalEarnedDate: todayKey,
              dailyTotalPointsEarned: usage.dailyTotalEarnedToday + awardedSelfBonus,
            }
          : {}),
      }));

      const selfPayload: Record<string, any> = {
        referralBonusClaimed: true,
      };
      if (awardedSelfBonus > 0) {
        selfPayload.points = increment(awardedSelfBonus);
        selfPayload.dailyTotalEarnedDate = todayKey;
        selfPayload.dailyTotalPointsEarned = usage.dailyTotalEarnedToday + awardedSelfBonus;
      }

      const promises: Promise<any>[] = [
        updateDocument('users', targetUser.id, selfPayload),
      ];
      if (awardedSelfBonus > 0) {
        promises.push(
          updateDocument('public_profiles', targetUser.id, {
            points: increment(awardedSelfBonus),
          }).catch(() => {})
        );
      }

      if (referrerUnderCap && refBonus > 0) {
        const nextDailyRefCount = refDailyCount + 1;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === referrer.id
              ? {
                  ...u,
                  points: (u.points || 0) + refBonus,
                  referralsCount: (u.referralsCount || 0) + 1,
                  referralEarnedPoints: (u.referralEarnedPoints || 0) + refBonus,
                  dailyReferralDate: todayKey,
                  dailyReferralsCount: nextDailyRefCount,
                }
              : u
          )
        );
        promises.push(
          updateDocument('users', referrer.id, {
            points: increment(refBonus),
            referralsCount: increment(1),
            referralEarnedPoints: increment(refBonus),
            dailyReferralDate: todayKey,
            dailyReferralsCount: refSameDay ? increment(1) : 1,
          }),
          updateDocument('public_profiles', referrer.id, {
            points: increment(refBonus),
            referralsCount: increment(1),
            referralEarnedPoints: increment(refBonus),
            dailyReferralDate: todayKey,
            dailyReferralsCount: refSameDay ? increment(1) : 1,
          }).catch(() => {})
        );
        sendNotification(
          referrer.id,
          '👥 নতুন সফল রেফারেল!',
          `অভিনন্দন! ${targetUser.name} আপনার রেফার কোড ব্যবহার করে সক্রিয় হয়েছেন। +${toBengaliNumber(refBonus, lang)} পয়েন্ট যোগ হয়েছে!`,
          'general'
        );
      }

      await Promise.all(promises);

      if (awardedSelfBonus > 0) {
        showToast(
          lang === 'bn'
            ? `🎁 রেফারেল ওয়েলকাম বোনাস +${toBengaliNumber(awardedSelfBonus, lang)} পয়েন্ট আপনার ওয়ালেটে যোগ হয়েছে!`
            : `🎁 Referral welcome bonus +${awardedSelfBonus} pts added to your wallet!`
        );
      } else if (referrerUnderCap && refBonus > 0) {
        showToast(
          lang === 'bn'
            ? `🎁 রেফারেল বোনাস (+${toBengaliNumber(refBonus, lang)} পয়েন্ট) সফলভাবে সম্পন্ন হয়েছে!`
            : `🎁 Referral bonus (+${refBonus} pts) completed!`
        );
      }
    } catch (err) {
      console.error('Referral bonus processing error:', err);
    }
  };

  const handleApplyReferralCode = async (
    rawCode: string
  ): Promise<{ ok: boolean; message: string }> => {
    if (!isAuthenticated || !firebaseUser || !emailVerified || !isRealUserId(currentUserRef.current.id)) {
      return {
        ok: false,
        message: lang === 'bn' ? 'অনুগ্রহ করে আগে লগইন করুন।' : 'Please log in first.',
      };
    }
    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isReferralEnabled) {
      vibrateError();
      return {
        ok: false,
        message: lang === 'bn' ? 'রেফারেল সিস্টেম বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : 'Referral system is paused by Admin.',
      };
    }

    const activeUser = currentUserRef.current;
    if (activeUser.referredBy) {
      return {
        ok: false,
        message: lang === 'bn' ? 'আপনি ইতিমধ্যে একটি রেফার কোড ব্যবহার করেছেন।' : 'You have already used a referral code.',
      };
    }

    const code = rawCode.trim().toUpperCase().slice(0, 20);
    if (code.length < 4 || code === (activeUser.referralCode || '').toUpperCase()) {
      vibrateError();
      return {
        ok: false,
        message: lang === 'bn' ? 'সঠিক রেফার কোড দিন (নিজের কোড ব্যবহার করা যাবে না)।' : 'Enter a valid referral code.',
      };
    }

    try {
      const matched = await getCollection('public_profiles', [
        where('referralCode', '==', code),
      ]);
      const referrer = matched?.[0] as User | undefined;
      if (!referrer || !isRealUserId(referrer.id) || referrer.id === activeUser.id) {
        vibrateError();
        return {
          ok: false,
          message:
            lang === 'bn'
              ? '❌ এই রেফার কোডটি খুঁজে পাওয়া যায়নি! সঠিক ইউজার কোড দিন।'
              : '❌ Referral code not found. Please check and try again.',
        };
      }

      const updatedUser: User = { ...activeUser, referredBy: code };
      setCurrentUser(updatedUser);
      await updateDocument('users', activeUser.id, { referredBy: code });

      if (
        earningSettings.requireReelWatchForReferral === false ||
        (updatedUser.reelsWatchedCount || 0) >= 1
      ) {
        await processReferralRewardIfEligible(updatedUser, earningSettings);
      }

      vibrateSuccess();
      const msg =
        earningSettings.requireReelWatchForReferral !== false && (updatedUser.reelsWatchedCount || 0) < 1
          ? lang === 'bn'
            ? '✅ রেফার কোড যুক্ত হয়েছে! বোনাস আনলক করতে কমপক্ষে ১টি রিল সম্পূর্ণ দেখুন।'
            : '✅ Referral code applied! Watch at least 1 reel to unlock the bonus.'
          : lang === 'bn'
          ? '✅ রেফার কোড সফলভাবে ভেরিফাই ও যুক্ত হয়েছে!'
          : '✅ Referral code verified and applied!';

      showToast(msg);
      return { ok: true, message: msg };
    } catch (err) {
      console.warn('Referral code apply error:', err);
      return {
        ok: false,
        message: lang === 'bn' ? 'রেফার কোড যাচাই করতে সমস্যা হয়েছে।' : 'Failed to verify referral code.',
      };
    }
  };

  const handleClaimDailyBonus = (bonusPoints: number) => {
    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isDailyBonusEnabled) {
      vibrateError();
      showToast(lang === 'bn' ? '⚠️ দৈনিক বোনাস আর্নিং বর্তমানে এডমিন দ্বারা বন্ধ রয়েছে।' : '⚠️ Daily bonus is currently disabled.');
      return;
    }

    if (!isAuthenticated || isClaimedToday) return;
    const activeUser = currentUserRef.current;
    const usage = getDailyEarningUsage(activeUser, earningSettings, todayKey);
    if (usage.isDailyTotalLimitReached || usage.remainingTotalPoints <= 0) {
      vibrateError();
      showToast(
        lang === 'bn'
          ? `🔒 আজকের মোট উপার্জন লিমিট পূর্ণ হয়েছে (${toBengaliNumber(usage.dailyTotalEarnedToday, lang)}/${toBengaliNumber(usage.dailyMaxTotalPoints, lang)} পয়েন্ট)!`
          : `🔒 Daily total earning limit reached (${usage.dailyTotalEarnedToday}/${usage.dailyMaxTotalPoints} pts)!`
      );
      return;
    }

    const rawBonus = Math.max(0, Math.round(earningSettings.dailyBonusPoints ?? bonusPoints));
    const actualBonus = Number.isFinite(usage.remainingTotalPoints)
      ? Math.min(rawBonus, usage.remainingTotalPoints)
      : rawBonus;
    if (actualBonus <= 0) {
      vibrateError();
      showToast(lang === 'bn' ? '⚠️ বর্তমানে বোনাস পয়েন্ট 0 সেট করা রয়েছে বা লিমিট শেষ।' : '⚠️ Daily bonus is 0 or limit reached.');
      return;
    }

    applyFastUserMutation(actualBonus, {
      dailyClaimedDate: todayKey,
      dailyTotalEarnedDate: todayKey,
      dailyTotalPointsEarned: usage.dailyTotalEarnedToday + actualBonus,
    });
    vibrateReward();

    showToast(`🎉 দৈনিক বোনাস +${toBengaliNumber(actualBonus, lang)} পয়েন্ট আপনার ওয়ালেটে যুক্ত হয়েছে!`);
  };

  // Real Firestore-persisted Reel Like
  const handleToggleLike = (reelId: string) => {
    if (!isAuthenticated || !firebaseUser || !emailVerified || !isRealUserId(currentUserRef.current.id)) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'রিলে লাইক দিতে অনুগ্রহ করে লগইন বা রেজিস্ট্রেশন করুন!'
          : 'Please log in or register to like reels!'
      );
      return;
    }
    const me = currentUserRef.current;
    const currentLiked = me.likedReelIds || likedReelIds;
    const willLike = !currentLiked.includes(reelId);
    const nextLiked = willLike
      ? Array.from(new Set([...currentLiked, reelId]))
      : currentLiked.filter((id) => id !== reelId);

    setLikedReelIds(nextLiked);
    setCurrentUser((prev) => ({ ...prev, likedReelIds: nextLiked }));
    vibrateLike(willLike);

    const targetReel = reels.find((r) => r.id === reelId);
    const currentLikesCount = Math.max(0, targetReel?.likesCount || 0);
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId
          ? { ...r, likesCount: Math.max(0, (r.likesCount || 0) + (willLike ? 1 : -1)) }
          : r
      )
    );

    updateDocument('users', me.id, {
      likedReelIds: willLike ? arrayUnion(reelId) : arrayRemove(reelId),
    }).catch((err) => console.warn('User likedReelIds sync note:', err));

    if (firestoreReelIdsRef.current.has(reelId) && (willLike || currentLikesCount > 0)) {
      updateDocument('reels', reelId, {
        likesCount: increment(willLike ? 1 : -1),
      }).catch((err) => console.warn('Reel likesCount sync note:', err));
    }
  };

  // Real Firestore-persisted Reel Share tracking
  const handleRecordReelShare = (reelId: string) => {
    if (!reelId) return;
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, sharesCount: (r.sharesCount || 0) + 1 } : r
      )
    );
    if (
      isAuthenticated &&
      firebaseUser &&
      emailVerified &&
      firestoreReelIdsRef.current.has(reelId)
    ) {
      updateDocument('reels', reelId, {
        sharesCount: increment(1),
      }).catch((err) => console.warn('Reel sharesCount sync note:', err));
    }
  };

  // Real Firestore-persisted Comment Like
  const handleToggleCommentLike = async (reelId: string, commentId: string, willLike: boolean) => {
    if (!isAuthenticated || !firebaseUser || !emailVerified || !isRealUserId(currentUserRef.current.id)) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'কমেন্টে লাইক দিতে অনুগ্রহ করে লগইন করুন!'
          : 'Please log in to like comments!'
      );
      return;
    }
    const me = currentUserRef.current;
    const existingLiked = me.likedCommentIds || [];
    if (!willLike && !existingLiked.includes(commentId)) return;

    const nextLiked = willLike
      ? Array.from(new Set([...existingLiked, commentId]))
      : existingLiked.filter((id) => id !== commentId);

    setCurrentUser((prev) => ({ ...prev, likedCommentIds: nextLiked }));
    vibrateLike(willLike);

    try {
      await Promise.all([
        updateDocument('users', me.id, {
          likedCommentIds: willLike ? arrayUnion(commentId) : arrayRemove(commentId),
        }),
        updateDocument(`reels/${reelId}/comments`, commentId, {
          likes: increment(willLike ? 1 : -1),
        }),
      ]);
    } catch (err) {
      console.warn('Comment like sync note:', err);
    }
  };

  // Increment Reel View Count (every time a user watches the full video)
  const handleIncrementReelView = useCallback((reelId: string) => {
    if (!reelId) return;

    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, viewsCount: (r.viewsCount || 0) + 1 } : r
      )
    );

    if (
      isAuthenticated &&
      firebaseUser &&
      emailVerified &&
      firestoreReelIdsRef.current.has(reelId)
    ) {
      updateDocument('reels', reelId, { viewsCount: increment(1) }).catch((err) => {
        console.warn('Reel view count sync note:', err);
      });
    }
  }, [isAuthenticated, firebaseUser, emailVerified, updateDocument]);

  // Bookmark / Save Reel
  const handleToggleSave = (reelId: string) => {
    setSavedReelIds((prev) => {
      const alreadySaved = prev.includes(reelId);
      const next = alreadySaved ? prev.filter((id) => id !== reelId) : [...prev, reelId];
      if (alreadySaved) vibrateLight();
      else vibrateSuccess();
      try {
        localStorage.setItem('rt_saved_reels', JSON.stringify(next));
      } catch {}
      showToast(
        alreadySaved
          ? (lang === 'bn' ? 'সংরক্ষিত তালিকা থেকে সরানো হয়েছে।' : 'Removed from saved.')
          : (lang === 'bn' ? '🔖 রিলটি প্রোফাইলের সেভড সেকশনে সংরক্ষণ করা হয়েছে!' : '🔖 Reel saved to Profile!')
      );
      return next;
    });
  };

  const isOwnContentUser = (ownerId?: string | null) =>
    Boolean(
      ownerId &&
        ((isAuthenticated && currentUserRef.current.id && ownerId === currentUserRef.current.id) ||
          (firebaseUser?.uid && ownerId === firebaseUser.uid))
    );

  // Claim Reel Reward (Instant 0ms + Atomic Firestore increment + Admin Limit Guard)
  const handleEarnReelReward = (rewardPoints: number, _reelTitle: string, explicitReelId?: string) => {
    // 1. Check master toggle & video earning toggle
    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isVideoWatchEarningEnabled) {
      vibrateError();
      showToast(lang === 'bn' ? '📺 বিনোদন মোড: পয়েন্ট আর্নিং সিস্টেম বর্তমানে বন্ধ রয়েছে।' : '📺 Entertainment mode: earning is currently disabled.');
      return;
    }

    const targetReelId = explicitReelId || fullScreenReelId || undefined;

    // 2. Check if target reel has earning enabled or matches offer filter, and block self-watch earning
    const activeReel = targetReelId ? reels.find(r => r.id === targetReelId) : undefined;
    if (activeReel) {
      if (isOwnContentUser(activeReel.userId)) {
        vibrateError();
        showToast(
          lang === 'bn'
            ? '📺 নিজের ভিডিও দেখে পয়েন্ট অর্জন করা যাবে না। অন্য ইউজারের রিলস দেখে আয় করুন!'
            : '📺 You cannot earn points from watching your own video. Watch other creators\' reels to earn!'
        );
        return;
      }
      if (activeReel.isEarningEnabled === false) {
        vibrateError();
        showToast(lang === 'bn' ? '📺 এই রিলটিতে পয়েন্ট আর্নিং বন্ধ রয়েছে (শুধুমাত্র বিনোদন)।' : '📺 Earning is disabled for this reel.');
        return;
      }
      if (earningSettings.videoEarningScope === 'offer_reels_only' && !activeReel.isSpecialOffer) {
        vibrateError();
        showToast(lang === 'bn' ? '📺 শুধুমাত্র স্পেশাল অফার রিলগুলোতে পয়েন্ট প্রযোজ্য।' : '📺 Earning is only available for special offer reels.');
        return;
      }
    }

    if (!isAuthenticated) {
      if (!siteSettings.allowGuestPreviewPoints) {
        showToast(
          lang === 'bn'
            ? '🔒 গেস্ট প্রিভিউ পয়েন্ট বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে। রিয়েল পয়েন্ট পেতে লগইন করুন!'
            : '🔒 Guest preview points disabled by Admin. Please log in to earn!'
        );
        return;
      }
      if (targetReelId && guestWatchedReelIds.includes(targetReelId)) {
        showToast(
          lang === 'bn'
            ? 'এই রিলের গেস্ট প্রিভিউ পয়েন্ট ইতিমধ্যে সংগ্রহ করেছেন (উত্তোলনযোগ্য নয়)।'
            : 'Already collected guest preview points for this reel (non-withdrawable).'
        );
        return;
      }
      const previewReward = Math.max(1, Math.round(rewardPoints));
      setGuestPoints((prev) => {
        const next = prev + previewReward;
        try {
          localStorage.setItem('rt_guest_points', String(next));
        } catch {}
        return next;
      });
      if (targetReelId) {
        setGuestWatchedReelIds((prev) => {
          if (prev.includes(targetReelId)) return prev;
          const next = [...prev, targetReelId];
          try {
            localStorage.setItem('rt_guest_watched_reels', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
      if (!isMuted) playCoinSound();
      vibrateReward();
      showToast(
        lang === 'bn'
          ? `🪙 গেস্ট প্রিভিউ +${toBengaliNumber(previewReward, lang)} পয়েন্ট (উত্তোলনযোগ্য নয়)। আসল টাকা আর্ন করতে লগইন করুন!`
          : `🪙 Guest preview +${previewReward} pts (Non-withdrawable). Login with a real account to earn!`
      );
      return;
    }

    // 3. Prevent claiming the same reel twice
    if (targetReelId && watchedReelIds.includes(targetReelId)) {
      showToast(lang === 'bn' ? 'আপনি ইতিমধ্যে এই রিলের পয়েন্ট সংগ্রহ করেছেন!' : 'You have already collected points for this reel!');
      return;
    }

    // 4. Enforce Admin-controlled Daily Reel & Global Daily Earning Limits
    const activeUser = currentUserRef.current;
    if (!firebaseUser || !isRealUserId(activeUser.id) || activeUser.id !== firebaseUser.uid) {
      return;
    }
    const sameDay = activeUser.dailyReelClaimDate === todayKey;
    const usedClaims = sameDay ? (activeUser.dailyReelClaimsCount || 0) : 0;
    const usedPoints = sameDay ? (activeUser.dailyReelPointsEarned || 0) : 0;

    if (isReelLimitEnabled) {
      if (dailyClaimsLimit > 0 && usedClaims >= dailyClaimsLimit) {
        showToast(
          lang === 'bn'
            ? `🔒 আজকের রিল আর্নিং লিমিট শেষ (${toBengaliNumber(usedClaims, lang)}/${toBengaliNumber(dailyClaimsLimit, lang)}টি রিল)! আগামীকাল আবার পয়েন্ট পাবেন।`
            : `🔒 Daily reel limit reached (${usedClaims}/${dailyClaimsLimit} reels)! Try again tomorrow.`
        );
        return;
      }
      if (dailyPointsLimit > 0 && usedPoints >= dailyPointsLimit) {
        showToast(
          lang === 'bn'
            ? `🔒 আজকের রিল পয়েন্ট লিমিট শেষ (${toBengaliNumber(usedPoints, lang)}/${toBengaliNumber(dailyPointsLimit, lang)} পয়েন্ট)! আগামীকাল আবার পয়েন্ট পাবেন।`
            : `🔒 Daily reel point limit reached (${usedPoints}/${dailyPointsLimit} pts)! Try again tomorrow.`
        );
        return;
      }
    }

    const totalUsage = getDailyEarningUsage(activeUser, earningSettings, todayKey);
    if (totalUsage.isDailyTotalLimitReached || totalUsage.remainingTotalPoints <= 0) {
      vibrateError();
      showToast(
        lang === 'bn'
          ? `🔒 আজকের মোট উপার্জন লিমিট পূর্ণ হয়েছে (${toBengaliNumber(totalUsage.dailyTotalEarnedToday, lang)}/${toBengaliNumber(totalUsage.dailyMaxTotalPoints, lang)} পয়েন্ট)! আগামীকাল আবার আয় করুন।`
          : `🔒 Daily total earning limit reached (${totalUsage.dailyTotalEarnedToday}/${totalUsage.dailyMaxTotalPoints} pts)!`
      );
      return;
    }

    const currentLevel = getUserLevel(activeUser.reelsWatchedCount);
    const multiplier = earningSettings.isLevelMultiplierEnabled ? currentLevel.multiplier : 1;
    const rawReward = Math.round(rewardPoints * multiplier);
    const reelCapped =
      isReelLimitEnabled && dailyPointsLimit > 0
        ? Math.min(rawReward, Math.max(0, dailyPointsLimit - usedPoints))
        : rawReward;
    const finalReward = Number.isFinite(totalUsage.remainingTotalPoints)
      ? Math.min(reelCapped, totalUsage.remainingTotalPoints)
      : reelCapped;

    if (finalReward <= 0) {
      showToast(lang === 'bn' ? '🔒 আজকের পয়েন্ট লিমিট পূর্ণ হয়েছে!' : '🔒 Daily point limit reached!');
      return;
    }

    if (!isMuted) playCoinSound();
    vibrateReward();

    const newWatchedCount = activeUser.reelsWatchedCount + 1;
    const prevLevel = getUserLevel(activeUser.reelsWatchedCount);
    const nextLevelObj = getUserLevel(newWatchedCount);

    if (nextLevelObj.level > prevLevel.level) {
      setTimeout(() => {
        try {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffcc00', '#00c853', '#00e676', '#ffffff']
          });
          if (!isMuted) playSuccessChime();
          vibrateReward();
        } catch (e) {}
        
        showToast(
          lang === 'bn' 
            ? `🎊 অভিনন্দন! আপনি এখন ${nextLevelObj.nameBn}! বোনাস মাল্টিপ্লায়ার: ${toBengaliNumber(nextLevelObj.multiplier, lang)}x`
            : `🎊 Congrats! You've reached ${nextLevelObj.nameEn}! Bonus Multiplier: ${nextLevelObj.multiplier}x`
        );
      }, 600);
    }

    const nextClaimsToday = usedClaims + 1;
    const nextPointsToday = usedPoints + finalReward;
    const sameTotalDay = activeUser.dailyTotalEarnedDate === todayKey;
    const nextTotalEarnedToday = totalUsage.dailyTotalEarnedToday + finalReward;

    if (
      earningSettings.isReferralEnabled &&
      newWatchedCount >= 1 &&
      activeUser.referredBy &&
      !activeUser.referralBonusClaimed
    ) {
      processReferralRewardIfEligible(
        {
          ...activeUser,
          reelsWatchedCount: newWatchedCount,
          dailyTotalEarnedDate: todayKey,
          dailyTotalPointsEarned: nextTotalEarnedToday,
        },
        earningSettings
      ).catch(() => {});
    }

    // Instant 0ms UI update + atomic Firestore increment
    setCurrentUser((prev) => ({
      ...prev,
      points: (prev.points || 0) + finalReward,
      reelsWatchedCount: (prev.reelsWatchedCount || 0) + 1,
      levelName: nextLevelObj.nameEn,
      multiplier: nextLevelObj.multiplier,
      dailyReelClaimDate: todayKey,
      dailyReelClaimsCount: nextClaimsToday,
      dailyReelPointsEarned: nextPointsToday,
      dailyTotalEarnedDate: todayKey,
      dailyTotalPointsEarned: nextTotalEarnedToday,
    }));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === activeUser.id
          ? {
              ...u,
              points: (u.points || 0) + finalReward,
              reelsWatchedCount: (u.reelsWatchedCount || 0) + 1,
              levelName: nextLevelObj.nameEn,
              multiplier: nextLevelObj.multiplier,
              dailyReelClaimDate: todayKey,
              dailyReelClaimsCount: nextClaimsToday,
              dailyReelPointsEarned: nextPointsToday,
              dailyTotalEarnedDate: todayKey,
              dailyTotalPointsEarned: nextTotalEarnedToday,
            }
          : u
      )
    );

    updateDocument('users', activeUser.id, {
      points: increment(finalReward),
      reelsWatchedCount: increment(1),
      levelName: nextLevelObj.nameEn,
      multiplier: nextLevelObj.multiplier,
      dailyReelClaimDate: todayKey,
      dailyReelClaimsCount: sameDay ? increment(1) : 1,
      dailyReelPointsEarned: sameDay ? increment(finalReward) : finalReward,
      dailyTotalEarnedDate: todayKey,
      dailyTotalPointsEarned: sameTotalDay ? increment(finalReward) : finalReward,
    }).catch((err) => console.warn('Reel reward sync error:', err));

    updateDocument('public_profiles', activeUser.id, {
      points: increment(finalReward),
      reelsWatchedCount: increment(1),
    }).catch(() => {});

    if (targetReelId && !watchedReelIds.includes(targetReelId)) {
      setWatchedReelIds((prev) => {
        if (prev.includes(targetReelId)) return prev;
        const nextWatched = [...prev, targetReelId];
        try {
          localStorage.setItem('rt_watched_reels', JSON.stringify(nextWatched));
        } catch {}
        return nextWatched;
      });
    }

    const limitStatusText = isReelLimitEnabled && dailyClaimsLimit > 0
      ? ` (${toBengaliNumber(nextClaimsToday, lang)}/${toBengaliNumber(dailyClaimsLimit, lang)})`
      : '';

    showToast(
      lang === 'bn'
        ? `💰 রিল দেখে +${toBengaliNumber(finalReward, lang)} পয়েন্ট যোগ হয়েছে!${limitStatusText}`
        : `💰 Earned +${finalReward} points!${limitStatusText}`
    );
  };

  // Direct Claim from Feed (Respects Admin Daily Limit & Blocks Self-Watch Earning)
  const handleClaimDirect = (reel: Reel) => {
    if (isOwnContentUser(reel.userId)) {
      vibrateError();
      showToast(
        lang === 'bn'
          ? '📺 নিজের ভিডিও দেখে পয়েন্ট অর্জন করা যাবে না। অন্য ইউজারের রিলস দেখে আয় করুন!'
          : '📺 You cannot earn points from watching your own video. Watch other creators\' reels to earn!'
      );
      return;
    }

    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isVideoWatchEarningEnabled || !earningSettings.allowDirectFeedClaim) {
      vibrateError();
      showToast(lang === 'bn' ? '📺 হোম ফিড থেকে ক্লেইম বা আর্নিং বন্ধ রয়েছে।' : '📺 Earning from feed is currently disabled.');
      return;
    }

    if (reel.isEarningEnabled === false) {
      vibrateError();
      showToast(lang === 'bn' ? '📺 এই রিলটিতে পয়েন্ট আর্নিং বন্ধ রয়েছে।' : '📺 Earning is disabled for this reel.');
      return;
    }

    if (earningSettings.videoEarningScope === 'offer_reels_only' && !reel.isSpecialOffer) {
      vibrateError();
      showToast(lang === 'bn' ? '📺 শুধুমাত্র স্পেশাল অফার রিলগুলোতে পয়েন্ট প্রযোজ্য।' : '📺 Earning only applies to special offer reels.');
      return;
    }

    if (!isAuthenticated) {
      if (!siteSettings.allowGuestPreviewPoints) {
        showToast(
          lang === 'bn'
            ? '🔒 গেস্ট প্রিভিউ পয়েন্ট বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে। রিয়েল পয়েন্ট পেতে লগইন করুন!'
            : '🔒 Guest preview points disabled by Admin. Please log in to earn!'
        );
        return;
      }
      if (guestWatchedReelIds.includes(reel.id)) {
        showToast(
          lang === 'bn'
            ? 'এই রিলের গেস্ট প্রিভিউ পয়েন্ট ইতিমধ্যে সংগ্রহ করেছেন (উত্তোলনযোগ্য নয়)।'
            : 'Already collected guest preview points for this reel (non-withdrawable).'
        );
        return;
      }
      try {
        confetti({
          particleCount: 24,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#fbbf24', '#00c853', '#ffffff'],
        });
      } catch {}
      const pts = reel.pointsReward || earningSettings.defaultVideoRewardPoints || 10;
      handleEarnReelReward(pts, reel.title, reel.id);
      return;
    }

    if (watchedReelIds.includes(reel.id)) {
      vibrateLight();
      showToast(lang === 'bn' ? 'আপনি ইতিমধ্যে এই রিলের পয়েন্ট সংগ্রহ করেছেন!' : 'Already collected points for this reel!');
      return;
    }

    if (isDailyReelLimitReached) {
      vibrateError();
      showToast(
        lang === 'bn'
          ? `🔒 আজকের রিল আর্নিং লিমিট পূর্ণ হয়েছে (${toBengaliNumber(dailyClaimsUsed, lang)}/${toBengaliNumber(dailyClaimsLimit, lang)} রিল • ${toBengaliNumber(dailyPointsUsed, lang)}/${toBengaliNumber(dailyPointsLimit, lang)} Pts)!`
          : `🔒 Daily reel limit reached!`
      );
      return;
    }

    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#00c853', '#00e676', '#ffffff'],
      });
    } catch {
      // Ignore
    }

    const pts = reel.pointsReward || earningSettings.defaultVideoRewardPoints || 10;
    handleEarnReelReward(pts, reel.title, reel.id);
  };

  // Add Comment
  const handleAddComment = async (reelId: string, text: string) => {
    if (!siteSettings.isCommentsEnabled) {
      showToast(lang === 'bn' ? '🔒 এডমিন কর্তৃক মন্তব্য করা সাময়িকভাবে বন্ধ রাখা হয়েছে।' : '🔒 Comments disabled by Admin.');
      return;
    }
    if (!isAuthenticated) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'মন্তব্য করতে অনুগ্রহ করে লগইন বা রেজিস্ট্রেশন করুন!'
          : 'Please log in or register to comment!'
      );
      return;
    }
    const newComment: Partial<Comment> = {
      reelId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    await addDocument(`reels/${reelId}/comments`, newComment);
    vibrateSuccess();

    // Update comment counter on reel optimistically & in Firestore
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r
      )
    );
    if (firestoreReelIdsRef.current.has(reelId)) {
      updateDocument('reels', reelId, { commentsCount: increment(1) }).catch((err) =>
        console.warn('Reel commentsCount sync note:', err)
      );
    }
  };

  // Withdrawal Request (Validated + Optimistic UI + Rollback on Failure)
  const handleRequestWithdrawal = async (
    reqData: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    if (!siteSettings.isWithdrawalsEnabled) {
      showToast(lang === 'bn' ? '🔒 উইথড্রয়াল সিস্টেম বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '🔒 Withdrawals are disabled by Admin.');
      return;
    }
    if (!isAuthenticated || !firebaseUser || !emailVerified || !isRealUserId(currentUserRef.current.id)) {
      triggerAuthPrompt(
        lang === 'bn' ? 'উত্তোলন রিকোয়েস্ট পাঠাতে লগইন করুন!' : 'Please log in to request a withdrawal!'
      );
      return;
    }
    if (
      !Number.isFinite(reqData.amountBDT) ||
      !Number.isInteger(reqData.amountBDT) ||
      reqData.amountBDT <= 0 ||
      !Number.isFinite(reqData.pointsDeducted) ||
      reqData.pointsDeducted <= 0
    ) {
      showToast(lang === 'bn' ? '⚠️ সঠিক উত্তোলনের পরিমাণ লিখুন।' : '⚠️ Invalid withdrawal amount.');
      return;
    }
    const minRequiredPoints = Math.round(reqData.amountBDT * (pointRate || 10));
    if (reqData.pointsDeducted < minRequiredPoints) {
      showToast(lang === 'bn' ? '⚠️ পয়েন্টের হিসাব সঠিক নয়।' : '⚠️ Invalid points calculation.');
      return;
    }
    const effectiveMin = siteSettings.minWithdrawal || minWithdrawal;
    const effectiveMax = siteSettings.maxWithdrawal || 0;
    if (reqData.amountBDT < effectiveMin) {
      showToast(lang === 'bn' ? `⚠️ সর্বনিম্ন উত্তোলন ৳${effectiveMin}` : `⚠️ Minimum withdrawal is ৳${effectiveMin}`);
      return;
    }
    if (effectiveMax > 0 && reqData.amountBDT > effectiveMax) {
      showToast(lang === 'bn' ? `⚠️ সর্বোচ্চ উত্তোলন ৳${effectiveMax}` : `⚠️ Maximum withdrawal is ৳${effectiveMax}`);
      return;
    }
    const activeUser = currentUserRef.current;
    if ((activeUser.points || 0) < reqData.pointsDeducted) {
      showToast(lang === 'bn' ? '⚠️ আপনার অ্যাকাউন্টে পর্যাপ্ত পয়েন্ট নেই!' : '⚠️ Insufficient points!');
      return;
    }

    const createdAt = new Date().toISOString();
    const tempId = `temp_${Date.now()}`;
    const newReq: Partial<WithdrawalRequest> = {
      ...reqData,
      userId: activeUser.id,
      status: 'pending',
      createdAt,
    };

    // Instant 0ms deduction + optimistic history entry
    applyFastUserMutation(-reqData.pointsDeducted);
    vibrateSuccess();
    setWithdrawals((prev) => [{ ...(newReq as WithdrawalRequest), id: tempId }, ...prev]);
    showToast(
      lang === 'bn'
        ? `💸 ৳${toBengaliNumber(reqData.amountBDT, lang)} উত্তোলনের আবেদন পেন্ডিং রয়েছে।`
        : `💸 ৳${reqData.amountBDT} withdrawal request submitted.`
    );

    try {
      await addDocument('withdrawals', newReq);
    } catch (err) {
      console.error('Withdrawal request error:', err);
      // Roll back points and temp entry if server write fails
      applyFastUserMutation(reqData.pointsDeducted);
      setWithdrawals((prev) => prev.filter((w) => w.id !== tempId));
      showToast(
        lang === 'bn'
          ? '⚠️ উত্তোলনের আবেদন পাঠানো যায়নি! পয়েন্ট ফেরত দেওয়া হয়েছে।'
          : '⚠️ Withdrawal failed! Your points were restored.'
      );
    }
  };

  // Deposit Points (Manual Request)
  const handleSubmitDepositRequest = async (req: Omit<DepositRequest, 'id' | 'createdAt' | 'status' | 'userId' | 'userName' | 'userPhone'>) => {
    if (!siteSettings.isDepositsEnabled) {
      showToast(lang === 'bn' ? '🔒 ডিপোজিট সিস্টেম বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '🔒 Deposits are disabled by Admin.');
      return;
    }
    if (siteSettings.minDeposit > 0 && req.amountBDT < siteSettings.minDeposit) {
      showToast(lang === 'bn' ? `⚠️ সর্বনিম্ন ডিপোজিট ৳${siteSettings.minDeposit}` : `⚠️ Minimum deposit is ৳${siteSettings.minDeposit}`);
      return;
    }
    const newReq: Partial<DepositRequest> = {
      ...req,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    await addDocument('deposits', newReq);
    vibrateSuccess();
    showToast(
      lang === 'bn'
        ? `💎 ডিপোজিট রিকোয়েস্ট জমা হয়েছে। এডমিন যাচাই করে পয়েন্ট যোগ করে দেবে।`
        : `💎 Deposit request submitted. Admin will credit points after verification.`
    );
  };

  // Send Gift (Instant 0ms deduction + host/creator & admin commission split + Live Stream Celebration)
  const handleSendGift = async (
    gift: GiftItem,
    _creatorShare?: number,
    _userCashback?: number,
    explicitTargetUserId?: string,
    explicitLiveId?: string,
    _explicitAdminShare?: number
  ) => {
    if (!siteSettings.isGiftsEnabled) {
      vibrateError();
      showToast(lang === 'bn' ? '🔒 গিফট পাঠানো বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '🔒 Gifts are disabled by Admin.');
      return;
    }
    if (!isAuthenticated) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'গিফট পাঠাতে ও রিয়েল পয়েন্ট ব্যবহার করতে লগইন করুন!'
          : 'Please log in to send gifts!'
      );
      return;
    }

    const resolvedTargetUserId = explicitTargetUserId ?? giftTarget?.userId;
    const resolvedLiveId = explicitLiveId ?? giftTarget?.liveId;

    // Strictly block self-gifting BEFORE any point deduction
    if (!resolvedTargetUserId || isOwnContentUser(resolvedTargetUserId)) {
      vibrateError();
      showToast(
        lang === 'bn'
          ? '🎁 নিজের ভিডিও বা লাইভে গিফট পাঠানো যাবে না! গিফট শুধুমাত্র অন্য ইউজারদের জন্য।'
          : '🎁 You cannot send gifts to yourself! Gifts are only for other creators.'
      );
      return;
    }

    const split = calculateGiftSplit(gift.costPoints, earningSettings);
    const creatorShare = split.creatorShare;
    const adminShare = split.adminShare;
    const userCashback = split.userCashback;
    const netCost = Math.max(0, gift.costPoints - userCashback);

    if ((currentUserRef.current.points || 0) < gift.costPoints) {
      vibrateError();
      showToast(lang === 'bn' ? '⚠️ পর্যাপ্ত পয়েন্ট নেই!' : '⚠️ Insufficient points!');
      return;
    }

    const adminUid =
      earningSettings.adminCommissionReceiverId ||
      users.find((u) => u.role === 'admin')?.id ||
      '';

    const senderNetDelta =
      -netCost +
      (adminShare > 0 && adminUid && adminUid === currentUserRef.current.id ? adminShare : 0);

    applyFastUserMutation(senderNetDelta);
    vibrateGift();

    if (resolvedTargetUserId && resolvedTargetUserId !== currentUserRef.current.id && creatorShare > 0) {
      setUsers((prev) =>
        prev.map((u) => (u.id === resolvedTargetUserId ? { ...u, points: (u.points || 0) + creatorShare } : u))
      );
      if (isRealUserId(resolvedTargetUserId)) {
        updateDocument('users', resolvedTargetUserId, { points: increment(creatorShare) }).catch((err) =>
          console.warn('Gift creator credit warning:', err)
        );
        updateDocument('public_profiles', resolvedTargetUserId, { points: increment(creatorShare) }).catch(() => {});
        sendNotification(
          resolvedTargetUserId,
          '🎁 উপহার পেয়েছেন',
          `অভিনন্দন! ${currentUserRef.current.name} আপনাকে ${gift.icon} ${gift.nameBn} উপহার দিয়েছেন (+${creatorShare} পয়েন্ট যুক্ত হয়েছে)।`,
          'general'
        );
      }
    }

    if (adminShare > 0 && adminUid && adminUid !== currentUserRef.current.id) {
      setUsers((prev) =>
        prev.map((u) => (u.id === adminUid ? { ...u, points: (u.points || 0) + adminShare } : u))
      );
      if (isRealUserId(adminUid)) {
        updateDocument('users', adminUid, { points: increment(adminShare) }).catch((err) =>
          console.warn('Gift admin commission credit warning:', err)
        );
        updateDocument('public_profiles', adminUid, { points: increment(adminShare) }).catch(() => {});
      }
    }

    if (resolvedLiveId) {
      updateDocument('live_streams', resolvedLiveId, {
        giftsTotalPoints: increment(creatorShare),
        adminGiftPoints: increment(adminShare),
      }).catch((err) => console.warn('Live gift total update warning:', err));

      addDocument(`live_streams/${resolvedLiveId}/chat`, {
        userId: currentUserRef.current.id,
        userName: currentUserRef.current.name,
        userAvatar: currentUserRef.current.avatar,
        text:
          lang === 'bn'
            ? `পাঠালেন ${gift.nameBn}!`
            : `sent ${gift.nameEn}!`,
        type: 'gift',
        giftId: gift.id,
        giftIcon: gift.icon,
        giftName: lang === 'bn' ? gift.nameBn : gift.nameEn,
        giftPoints: gift.costPoints,
        createdAt: new Date().toISOString(),
      }).catch((err) => console.warn('Live gift chat message warning:', err));
    }

    showToast(
      lang === 'bn'
        ? `🎁 ${gift.icon} ${gift.nameBn} উপহার পাঠানো হয়েছে! ক্যাশব্যাক: +${toBengaliNumber(userCashback, lang)} পয়েন্ট`
        : `🎁 Sent ${gift.icon} ${gift.nameEn}! Cashback: +${userCashback} pts`
    );
  };

  const userMap = React.useMemo(
    () => buildUserMap(users, isAuthenticated ? currentUser : null),
    [users, isAuthenticated, currentUser]
  );

  const resolvedReels = React.useMemo(
    () => reels.map((r) => resolveReelWithOwner(r, userMap, masudCreator)),
    [reels, userMap, masudCreator]
  );

  const handleOpenUserProfile = async (userId: string) => {
    if (!userId) {
      showToast(lang === 'bn' ? 'ইউজার প্রোফাইল পাওয়া যায়নি।' : 'User profile not found.');
      return;
    }

    const userToView = userMap.get(userId);
    if (userToView) {
      setSelectedUserProfileUser(userToView);
      setIsUserProfileModalOpen(true);
      return;
    }

    if (isAuthenticated && isRealUserId(userId)) {
      try {
        const remoteUser = (await getDocument('public_profiles', userId)) as User | null;
        if (remoteUser) {
          setSelectedUserProfileUser(remoteUser);
          setIsUserProfileModalOpen(true);
          return;
        }
      } catch {
        // fallback to reel creator metadata below
      }
    }

    const creatorReel = resolvedReels.find((r) => r.userId === userId);
    if (creatorReel || userId === MASUD_RANA_FALLBACK_ID || userId === masudCreator.id) {
      const isMasud = userId === MASUD_RANA_FALLBACK_ID || userId === masudCreator.id || userId === 'system_admin';
      setSelectedUserProfileUser({
        id: userId,
        name: creatorReel?.creatorName || masudCreator.name || MASUD_RANA_NAME,
        phone: '',
        avatar: creatorReel?.creatorAvatar || masudCreator.avatar || MASUD_RANA_AVATAR,
        points: 0,
        role: isMasud ? 'admin' : 'user',
        createdAt: creatorReel?.createdAt || new Date().toISOString().slice(0, 10),
        referralCode: '',
        isVerified: Boolean(creatorReel?.isVerified || isMasud),
        totalWithdrawn: 0,
        reelsWatchedCount: 0,
        followersCount: 0,
        followingCount: 0,
        followers: [],
        following: [],
      });
      setIsUserProfileModalOpen(true);
    } else {
      showToast(lang === 'bn' ? 'ইউজার প্রোফাইল পাওয়া যায়নি।' : 'User profile not found.');
    }
  };

  const handleToggleFollow = async (targetUserId: string, targetName?: string) => {
    if (!isAuthenticated) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'ক্রিয়েটরদের ফলো করতে অনুগ্রহ করে লগইন বা রেজিস্ট্রেশন করুন!'
          : 'Please log in or register to follow creators!'
      );
      return;
    }

    const me = currentUserRef.current;
    if (!targetUserId || targetUserId === me.id) return;

    const myFollowing = me.following || [];
    const currentlyFollowing = myFollowing.includes(targetUserId);
    const nextFollowing = currentlyFollowing
      ? myFollowing.filter((id) => id !== targetUserId)
      : Array.from(new Set([...myFollowing, targetUserId]));
    const nextFollowingCount = Math.max(0, (me.followingCount ?? myFollowing.length) + (currentlyFollowing ? -1 : 1));

    setCurrentUser((prev) => ({
      ...prev,
      following: nextFollowing,
      followingCount: nextFollowingCount,
    }));

    const updateTargetState = (u: User): User => {
      if (u.id === me.id) {
        return { ...u, following: nextFollowing, followingCount: nextFollowingCount };
      }
      if (u.id === targetUserId) {
        const existingFollowers = u.followers || [];
        const nextFollowers = currentlyFollowing
          ? existingFollowers.filter((id) => id !== me.id)
          : Array.from(new Set([...existingFollowers, me.id]));
        const nextFollowersCount = Math.max(0, (u.followersCount ?? existingFollowers.length) + (currentlyFollowing ? -1 : 1));
        return { ...u, followers: nextFollowers, followersCount: nextFollowersCount };
      }
      return u;
    };

    setUsers((prev) => prev.map(updateTargetState));
    setSelectedUserProfileUser((prev) => (prev ? updateTargetState(prev) : prev));
    setFollowListModal((prev) => (prev ? { ...prev, user: updateTargetState(prev.user) } : prev));

    if (!isMuted) playPopSound();
    if (currentlyFollowing) vibrateLight();
    else vibrateSuccess();
    showToast(
      currentlyFollowing
        ? (lang === 'bn' ? `${targetName || 'ক্রিয়েটর'}-কে আনফলো করেছেন।` : `Unfollowed ${targetName || 'creator'}.`)
        : (lang === 'bn' ? `✅ ${targetName || 'ক্রিয়েটর'}-কে ফলো করেছেন!` : `✅ Followed ${targetName || 'creator'}!`)
    );

    const selfFollowPatch = {
      following: currentlyFollowing ? arrayRemove(targetUserId) : arrayUnion(targetUserId),
      followingCount: currentlyFollowing
        ? (me.followingCount ?? myFollowing.length) > 0 ? increment(-1) : 0
        : increment(1),
    };

    if (isRealUserId(me.id) && firebaseUser && me.id === firebaseUser.uid) {
      try {
        await Promise.all([
          updateDocument('users', me.id, selfFollowPatch),
          updateDocument('public_profiles', me.id, selfFollowPatch).catch(() => {}),
        ]);
      } catch (err) {
        console.warn('Follow sync on self warning:', err);
      }
    }

    if (isRealUserId(targetUserId)) {
      try {
        const targetLocal = users.find((u) => u.id === targetUserId);
        const targetFollowersCount = targetLocal?.followersCount ?? (targetLocal?.followers?.length || 0);
        const targetFollowPatch = {
          followers: currentlyFollowing ? arrayRemove(me.id) : arrayUnion(me.id),
          followersCount: currentlyFollowing
            ? targetFollowersCount > 0 ? increment(-1) : 0
            : increment(1),
        };

        await Promise.all([
          updateDocument('users', targetUserId, targetFollowPatch).catch(() => {}),
          updateDocument('public_profiles', targetUserId, targetFollowPatch).catch(() => {}),
        ]);

        if (!currentlyFollowing) {
          sendNotification(
            targetUserId,
            lang === 'bn' ? '👥 নতুন ফলোয়ার!' : '👥 New Follower!',
            lang === 'bn'
              ? `${me.name} আপনাকে ফলো করা শুরু করেছেন।`
              : `${me.name} started following you.`,
            'general'
          );
        }
      } catch (err) {
        console.warn('Follow sync on target warning:', err);
      }
    }
  };

  const handleOpenChat = async (otherUser: User) => {
    if (!siteSettings.isDirectChatEnabled) {
      showToast(lang === 'bn' ? '🔒 ডিরেক্ট চ্যাট বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '🔒 Direct chat is disabled by Admin.');
      return;
    }
    if (!isAuthenticated) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'মেসেজ পাঠাতে অনুগ্রহ করে লগইন করুন!'
          : 'Please log in to send messages!'
      );
      return;
    }

    // Generate unique session ID: uid1_uid2 (alphabetically sorted)
    const sessionId = [currentUser.id, otherUser.id].sort().join('_');
    
    // Check if session exists
    let session = await getDocument('chats', sessionId) as ChatSession | null;
    
    if (!session) {
      // Create new session
      session = {
        id: sessionId,
        participants: [currentUser.id, otherUser.id],
        updatedAt: new Date().toISOString()
      };
      await setDocument('chats', sessionId, session);
    }

    setActiveChatSession(session);
    setActiveChatOtherUser(otherUser);
    setIsChatModalOpen(true);
    setIsUserProfileModalOpen(false); // Close profile if open
    setIsChatListModalOpen(false); // Close list if open
  };

  const handleShareInChat = (reel: Reel) => {
    if (!siteSettings.isDirectChatEnabled) {
      showToast(lang === 'bn' ? '🔒 ডিরেক্ট চ্যাট বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '🔒 Direct chat is disabled by Admin.');
      return;
    }
    if (!isAuthenticated) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'চ্যাটে রিল শেয়ার করতে অনুগ্রহ করে লগইন করুন!'
          : 'Please log in to share reels in chat!'
      );
      return;
    }
    setSharingReelInChat(reel);
    setIsUserPickerOpen(true);
  };

  const handlePickUserForShare = async (user: User) => {
    if (!sharingReelInChat) return;

    // Create session
    const sessionId = [currentUser.id, user.id].sort().join('_');
    const now = new Date().toISOString();
    
    // Add message with reel
    const newMsg: Partial<ChatMessage> = {
      sessionId,
      senderId: currentUser.id,
      text: lang === 'bn' ? `আপনার সাথে একটি রিল শেয়ার করেছেন: ${sharingReelInChat.title}` : `Shared a reel with you: ${sharingReelInChat.title}`,
      sharedReelId: sharingReelInChat.id,
      sharedReelThumbnail: sharingReelInChat.thumbnailUrl,
      createdAt: now,
      isHidden: false,
    };

    try {
      // Check if session exists or create it
      const session = await getDocument('chats', sessionId) as ChatSession | null;
      if (!session) {
        await setDocument('chats', sessionId, {
          id: sessionId,
          participants: [currentUser.id, user.id],
          updatedAt: now,
          lastMessage: '🎥 ' + (lang === 'bn' ? 'রিল শেয়ার' : 'Shared a reel'),
          lastMessageTime: now,
        });
      } else {
        await updateDocument('chats', sessionId, {
          updatedAt: now,
          lastMessage: '🎥 ' + (lang === 'bn' ? 'রিল শেয়ার' : 'Shared a reel'),
          lastMessageTime: now,
        });
      }

      await addDocument(`chats/${sessionId}/messages`, newMsg);
      handleRecordReelShare(sharingReelInChat.id);
      showToast(lang === 'bn' ? '✅ রিলটি সফলভাবে পাঠানো হয়েছে!' : '✅ Reel shared successfully!');
      
      setIsUserPickerOpen(false);
      setSharingReelInChat(null);
      
      // Optionally open the chat
      handleOpenChat(user);
    } catch (err) {
      console.error(err);
    }
  };



  // Share Reel
  const handleOpenShare = (reel: Reel) => {
    setSharingLiveStream(null);
    setSharingReel(reel);
    setShowShareSheet(true);
  };

  // Task / Offer Completion (Strictly verifies referral/watch requirements + daily task/total limits)
  const handleCompleteTask = (taskId: string, _rewardPoints: number) => {
    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isTasksEnabled) {
      vibrateError();
      showToast(lang === 'bn' ? '⚠️ টাস্ক আর্নিং বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '⚠️ Task earning is paused by Admin.');
      return;
    }
    const activeUser = currentUserRef.current;
    if (
      !isAuthenticated ||
      !firebaseUser ||
      !emailVerified ||
      !isRealUserId(activeUser.id) ||
      activeUser.id !== firebaseUser.uid
    ) {
      return;
    }

    const rawTask = tasks.find((t) => t.id === taskId);
    if (!rawTask) {
      vibrateError();
      showToast(lang === 'bn' ? '⚠️ এই অফার বা টাস্কটি খুঁজে পাওয়া যায়নি।' : '⚠️ Offer not found.');
      return;
    }
    const task = normalizeTaskOffer(rawTask);
    if (!task.isActive) {
      vibrateError();
      showToast(lang === 'bn' ? '⚠️ এই অফারটি বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '⚠️ This offer is currently paused.');
      return;
    }

    if (isTaskCompletedForUser(task, activeUser, todayKey)) {
      vibrateLight();
      showToast(
        lang === 'bn'
          ? task.isRepeatableDaily
            ? 'আজকের জন্য এই টাস্কটি ইতিমধ্যে সম্পন্ন করেছেন!'
            : 'আপনি ইতিমধ্যে এই অফারটি সম্পন্ন করেছেন!'
          : 'Offer already completed!'
      );
      return;
    }

    const req = getOfferRequirementProgress(task, activeUser, todayKey);
    if (!req.met) {
      vibrateError();
      if (req.requirementType === 'referral_count') {
        showToast(
          lang === 'bn'
            ? `🔒 রেফার ছাড়া পয়েন্ট পাওয়া যাবে না! কমপক্ষে ${toBengaliNumber(req.required, lang)} জন সফল রেফার প্রয়োজন (বর্তমান: ${toBengaliNumber(req.current, lang)}/${toBengaliNumber(req.required, lang)})।`
            : `🔒 Need ${req.required} verified referrals to claim (${req.current}/${req.required}).`
        );
      } else if (req.requirementType === 'reels_watched') {
        showToast(
          lang === 'bn'
            ? `🔒 এই অফার আনলক করতে কমপক্ষে ${toBengaliNumber(req.required, lang)}টি রিল দেখুন (সম্পন্ন: ${toBengaliNumber(req.current, lang)}/${toBengaliNumber(req.required, lang)})।`
            : `🔒 Watch ${req.required} reels to unlock this offer (${req.current}/${req.required}).`
        );
      }
      return;
    }

    const usage = getDailyEarningUsage(activeUser, earningSettings, todayKey);
    if (usage.isDailyTaskLimitReached) {
      vibrateError();
      showToast(
        lang === 'bn'
          ? `🔒 আজকের টাস্ক/অফার ক্লেইম লিমিট শেষ (${toBengaliNumber(usage.dailyTaskClaimsUsed, lang)}/${toBengaliNumber(usage.dailyMaxTaskClaims, lang)})! আগামীকাল আবার চেষ্টা করুন।`
          : `🔒 Daily task limit reached (${usage.dailyTaskClaimsUsed}/${usage.dailyMaxTaskClaims})!`
      );
      return;
    }
    if (task.rewardPoints > 0 && (usage.isDailyTotalLimitReached || usage.remainingTotalPoints <= 0)) {
      vibrateError();
      showToast(
        lang === 'bn'
          ? `🔒 আজকের মোট উপার্জন লিমিট পূর্ণ হয়েছে (${toBengaliNumber(usage.dailyTotalEarnedToday, lang)}/${toBengaliNumber(usage.dailyMaxTotalPoints, lang)} পয়েন্ট)!`
          : `🔒 Daily total earning limit reached!`
      );
      return;
    }

    const awardedPoints = Number.isFinite(usage.remainingTotalPoints)
      ? Math.min(Math.max(0, task.rewardPoints), usage.remainingTotalPoints)
      : Math.max(0, task.rewardPoints);

    const extraFields: Record<string, any> = {
      dailyTaskClaimDate: todayKey,
      dailyTaskClaimsCount: usage.dailyTaskClaimsUsed + 1,
      dailyTotalEarnedDate: todayKey,
      dailyTotalPointsEarned: usage.dailyTotalEarnedToday + awardedPoints,
    };

    if (task.isRepeatableDaily) {
      const prevDailyIds =
        activeUser.dailyTaskClaimDate === todayKey && Array.isArray(activeUser.dailyCompletedTaskIds)
          ? activeUser.dailyCompletedTaskIds
          : [];
      extraFields.dailyCompletedTaskIds = Array.from(new Set([...prevDailyIds, taskId]));
    } else {
      const currentCompleted = activeUser.completedTaskIds || [];
      extraFields.completedTaskIds = Array.from(new Set([...currentCompleted, taskId]));
    }

    applyFastUserMutation(awardedPoints, extraFields);
    vibrateReward();
    if (!isMuted) playSuccessChime();
    showToast(
      lang === 'bn'
        ? `🎉 অফার সম্পন্ন হয়েছে! +${toBengaliNumber(awardedPoints, lang)} পয়েন্ট অর্জিত।`
        : `🎉 Offer completed! +${awardedPoints} pts.`
    );
  };

  // Add Points (Spin Wheel — respects spin toggle, spin limits, & global daily earning limit)
  const handleAddPointsGeneral = (pts: number, reason: string) => {
    const activeUser = currentUserRef.current;
    if (
      !isAuthenticated ||
      !firebaseUser ||
      !emailVerified ||
      !isRealUserId(activeUser.id) ||
      !Number.isFinite(pts) ||
      pts <= 0
    ) {
      return;
    }
    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isSpinWheelEnabled) {
      vibrateError();
      showToast(lang === 'bn' ? '⚠️ স্পিন হুইল বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '⚠️ Spin wheel is paused by Admin.');
      return;
    }

    const usage = getDailyEarningUsage(activeUser, earningSettings, todayKey);
    if (usage.isDailyTotalLimitReached || usage.remainingTotalPoints <= 0) {
      vibrateError();
      showToast(
        lang === 'bn'
          ? `🔒 আজকের মোট উপার্জন লিমিট পূর্ণ হয়েছে (${toBengaliNumber(usage.dailyTotalEarnedToday, lang)}/${toBengaliNumber(usage.dailyMaxTotalPoints, lang)} পয়েন্ট)!`
          : `🔒 Daily total earning limit reached!`
      );
      return;
    }

    const awardedPts = Number.isFinite(usage.remainingTotalPoints)
      ? Math.min(Math.round(pts), usage.remainingTotalPoints)
      : Math.round(pts);
    if (awardedPts <= 0) return;

    applyFastUserMutation(awardedPts, {
      dailyTotalEarnedDate: todayKey,
      dailyTotalPointsEarned: usage.dailyTotalEarnedToday + awardedPts,
    });
    vibrateReward();
    showToast(
      lang === 'bn'
        ? `🎉 ${reason}: +${toBengaliNumber(awardedPts, lang)} পয়েন্ট ওয়ালেটে যুক্ত হয়েছে!`
        : `🎉 ${reason}: +${awardedPts} points added to wallet!`
    );
  };

  const handleClaimScratchCard = (prizePts: number) => {
    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isScratchCardEnabled) {
      vibrateError();
      showToast(lang === 'bn' ? '⚠️ স্ক্র্যাচ কার্ড বর্তমানে বন্ধ রয়েছে।' : '⚠️ Scratch card is currently paused.');
      return;
    }
    const activeUser = currentUserRef.current;
    if (!isAuthenticated || !firebaseUser || !emailVerified || !isRealUserId(activeUser.id) || activeUser.id !== firebaseUser.uid) {
      return;
    }
    if (activeUser.dailyScratchClaimDate === todayKey) {
      vibrateLight();
      showToast(lang === 'bn' ? 'আজকের স্ক্র্যাচ কার্ড পুরস্কার ইতিমধ্যে সংগ্রহ করেছেন!' : 'Already claimed today\'s scratch card!');
      return;
    }

    const usage = getDailyEarningUsage(activeUser, earningSettings, todayKey);
    if (usage.isDailyTotalLimitReached || usage.remainingTotalPoints <= 0) {
      vibrateError();
      showToast(
        lang === 'bn'
          ? `🔒 আজকের মোট উপার্জন লিমিট পূর্ণ হয়েছে (${toBengaliNumber(usage.dailyTotalEarnedToday, lang)}/${toBengaliNumber(usage.dailyMaxTotalPoints, lang)} পয়েন্ট)!`
          : `🔒 Daily total earning limit reached!`
      );
      return;
    }

    const rawPrize = Math.max(0, Math.round(earningSettings.scratchCardPrize ?? prizePts));
    const actualPrize = Number.isFinite(usage.remainingTotalPoints)
      ? Math.min(rawPrize, usage.remainingTotalPoints)
      : rawPrize;
    if (actualPrize <= 0) {
      vibrateError();
      showToast(lang === 'bn' ? '⚠️ স্ক্র্যাচ কার্ড পয়েন্ট 0 সেট করা রয়েছে বা আজকের লিমিট শেষ।' : '⚠️ Scratch prize is 0 or limit reached.');
      return;
    }

    applyFastUserMutation(actualPrize, {
      dailyScratchClaimDate: todayKey,
      dailyTotalEarnedDate: todayKey,
      dailyTotalPointsEarned: usage.dailyTotalEarnedToday + actualPrize,
    });
    vibrateReward();
    try {
      localStorage.setItem(`rt_scratch_${activeUser.id}`, todayKey);
    } catch {}
    showToast(
      lang === 'bn'
        ? `🎁 স্ক্র্যাচ কার্ড: +${toBengaliNumber(actualPrize, lang)} পয়েন্ট ওয়ালেটে যুক্ত হয়েছে!`
        : `🎁 Scratch Card: +${actualPrize} points added!`
    );
  };

  const handleRecordSpin = () => {
    const activeUser = currentUserRef.current;
    const legacyTodayStr = new Date().toDateString();
    const isSameDay =
      activeUser.dailySpinClaimDate === todayKey || activeUser.dailySpinClaimDate === legacyTodayStr;
    const currentCount = isSameDay ? (activeUser.dailySpinClaimsCount || 0) : 0;
    const updatedCount = currentCount + 1;
    setCurrentUser((prev) => ({
      ...prev,
      dailySpinClaimDate: todayKey,
      dailySpinClaimsCount: updatedCount,
    }));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === activeUser.id
          ? { ...u, dailySpinClaimDate: todayKey, dailySpinClaimsCount: updatedCount }
          : u
      )
    );
    if (isAuthenticated && firebaseUser && emailVerified && isRealUserId(activeUser.id) && activeUser.id === firebaseUser.uid) {
      updateDocument('users', activeUser.id, {
        dailySpinClaimDate: todayKey,
        dailySpinClaimsCount: updatedCount,
      }).catch((err) => console.warn('Record spin sync error:', err));
    }
  };

  const handleAddNewReel = async (
    newReelData: Pick<Reel, 'title' | 'userId' | 'creatorName' | 'creatorHandle' | 'creatorAvatar' | 'category' | 'thumbnailUrl' | 'videoUrl' | 'pointsReward' | 'audioTrack' | 'caption' | 'hashtags' | 'isVerified'>
  ) => {
    if (!siteSettings.allowUserReelUpload) {
      showToast(lang === 'bn' ? '🔒 এডমিন কর্তৃক ইউজার রিল আপলোড সাময়িকভাবে বন্ধ রয়েছে।' : '🔒 Reel upload disabled by Admin.');
      return;
    }
    const newReel: Reel = {
      ...newReelData,
      pointsReward: newReelData.pointsReward ?? siteSettings.defaultUserReelRewardPoints ?? 10,
      id: `reel_${Date.now()}`,
      videoUrl: newReelData.videoUrl, // Preserve user's original video
      userId: newReelData.userId || firebaseUser?.uid || currentUser.id,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      timeAgo: 'এখনো',
    };
    // Optimistic addition
    setReels((prev) => [newReel, ...prev]);
    showToast(lang === 'bn' ? '🎉 রিলটি সফলভাবে পাবলিশ হয়েছে! আসল ভিডিওটি চলবে।' : '🎉 Reel published successfully!');
    try {
      await addDocument('reels', newReel);
    } catch (err) {
      console.warn('Firestore add reel note:', err);
    }
  };

  const [currentLiveStreamId, setCurrentLiveStreamId] = useState<string | null>(null);
  const deepLinkedLiveHandledRef = useRef(false);

  useEffect(() => {
    if (deepLinkedLiveHandledRef.current || activeLiveStreams.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const liveParam = params.get('liveId');
    if (liveParam && activeLiveStreams.some((s) => s.id === liveParam)) {
      deepLinkedLiveHandledRef.current = true;
      setCurrentLiveStreamId(liveParam);
      setShowLiveSheet(true);
    }
  }, [activeLiveStreams]);

  const handleJoinLiveStream = (liveId: string) => {
    if (!isAuthenticated) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'সরাসরি লাইভে যুক্ত হতে ও চ্যাট/গিফট পাঠাতে অনুগ্রহ করে লগইন করুন!'
          : 'Please log in to join live streams and interact!'
      );
      return;
    }
    setCurrentLiveStreamId(liveId);
    setShowLiveSheet(true);
  };

  const openPersonalLiveStudio = (mode: LiveMode = 'audio') => {
    if (!siteSettings.allowUserAudioLive && !siteSettings.allowUserVideoLive) {
      showToast(lang === 'bn' ? '🔒 লাইভ স্ট্রিমিং বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '🔒 Live streaming is disabled by Admin.');
      return;
    }
    if (!isAuthenticated) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'লাইভ স্ট্রিম শুরু করতে অনুগ্রহ করে লগইন করুন!'
          : 'Please log in to start a live stream!'
      );
      return;
    }
    const existingMyLive = activeLiveStreams.find((s) => s.hostId === currentUser.id);
    if (existingMyLive) {
      setCurrentLiveStreamId(existingMyLive.id);
      setShowLiveSheet(true);
      return;
    }
    let resolvedMode = mode;
    if (mode === 'audio' && !siteSettings.allowUserAudioLive && siteSettings.allowUserVideoLive) {
      resolvedMode = 'video';
    } else if (mode === 'video' && !siteSettings.allowUserVideoLive && siteSettings.allowUserAudioLive) {
      resolvedMode = 'audio';
    }
    setGoLiveInitialMode(resolvedMode);
    setShowGoLiveSetupModal(true);
  };

  const handleStartLive = async (payload: StartLivePayload) => {
    if (!isAuthenticated) return;
    if ((payload.mode === 'audio' && !siteSettings.allowUserAudioLive) || (payload.mode === 'video' && !siteSettings.allowUserVideoLive)) {
      showToast(lang === 'bn' ? '🔒 এই লাইভ মোডটি এডমিন কর্তৃক বন্ধ রয়েছে।' : '🔒 This live mode is disabled by Admin.');
      return;
    }

    const hostId = firebaseUser?.uid || currentUser.id;

    // Close any lingering active stream from the same user cleanly
    const existingStreams = activeLiveStreams.filter(
      (s) => s.hostId === hostId || s.hostId === currentUser.id
    );
    for (const prev of existingStreams) {
      updateDocument('live_streams', prev.id, {
        status: 'ended',
        endedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    const liveId = `live_${Date.now()}`;
    const cleanTitle = (
      payload.title.trim() ||
      (payload.mode === 'audio'
        ? `${currentUser.name}-এর অডিও আড্ডা`
        : `${currentUser.name}-এর লাইভ ভিডিও`)
    ).slice(0, 140);

    const newLive: LiveStream = {
      id: liveId,
      hostId,
      hostName: currentUser.name || 'ইউজার',
      hostAvatar: currentUser.avatar || DEFAULT_AVATAR_URL,
      title: cleanTitle,
      mode: payload.mode,
      category: (payload.category || 'আড্ডা').slice(0, 50),
      pinnedNotice: (payload.pinnedNotice || '').slice(0, 240),
      isMicMuted: false,
      isCameraOn: payload.mode === 'video',
      chatEnabled: payload.chatEnabled !== false,
      allowSpeakerRequests: payload.allowSpeakerRequests !== false,
      viewersCount: 1,
      peakViewersCount: 1,
      peakAt: new Date().toISOString(),
      likesCount: 0,
      giftsTotalPoints: 0,
      adminGiftPoints: 0,
      coHosts: [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDocument('live_streams', liveId, newLive);
      setActiveLiveStreams((prev) => [newLive, ...prev.filter((s) => s.id !== liveId)]);
      setCurrentLiveStreamId(liveId);
      setShowLiveSheet(true);
      if (!isMuted) playSuccessChime();
      vibrateSuccess();
      showToast(
        payload.mode === 'audio'
          ? lang === 'bn'
            ? '🎙️ আপনার অডিও আড্ডা লাইভ শুরু হয়েছে!'
            : '🎙️ Your Audio Adda is now LIVE!'
          : lang === 'bn'
          ? '📹 আপনার লাইভ ভিডিও শুরু হয়েছে!'
          : '📹 Your Video Live has started!'
      );
    } catch (err) {
      console.error('Failed to start live:', err);
      showToast(
        lang === 'bn'
          ? '⚠️ লাইভ শুরু করা যায়নি! ইন্টারনেট বা লগইন চেক করুন।'
          : '⚠️ Failed to start live! Check connection.'
      );
      throw err;
    }
  };

  const handleEndLive = async (liveId: string) => {
    if (!firebaseUser) return;
    const endedPayload: Partial<LiveStream> = {
      status: 'ended',
      endedAt: new Date().toISOString(),
    };
    try {
      await updateDocument('live_streams', liveId, endedPayload);
      setActiveLiveStreams((prev) => prev.filter((s) => s.id !== liveId));
      if (currentLiveStreamId === liveId) {
        setCurrentLiveStreamId(null);
      }
      showToast(lang === 'bn' ? '🛑 আপনার লাইভ সেশনটি শেষ হয়েছে।' : '🛑 Live session ended.');
    } catch (err) {
      console.error('Failed to end live:', err);
      throw err;
    }
  };

  const handleUpdateReel = async (reelId: string, updatedData: Partial<Reel>) => {
    // 1. Persist to edited map
    const newMap = { ...editedReelsMap, [reelId]: { ...(editedReelsMap[reelId] || {}), ...updatedData } };
    setEditedReelsMap(newMap);
    try {
      localStorage.setItem('rt_edited_reels', JSON.stringify(newMap));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    // 2. Immediately update in memory
    setReels((prev) =>
      prev.map((r) => (r.id === reelId ? { ...r, ...updatedData } : r))
    );
    playSuccessChime();
    showToast(lang === 'bn' ? '✅ রিলটি সফলভাবে আপডেট হয়েছে!' : '✅ Reel updated successfully!');

    // 3. Persist to Firestore
    try {
      await updateDocument('reels', reelId, updatedData);
    } catch (err) {
      console.warn('Firestore update note (may be local demo reel):', err);
    }
  };

  const handleDeleteReel = async (reel: Reel, reason?: string) => {
    // 1. Immediately record in deletedReelIds and localStorage
    const updatedDeleted = Array.from(new Set([...deletedReelIds, reel.id]));
    setDeletedReelIds(updatedDeleted);
    try {
      localStorage.setItem('rt_deleted_reels', JSON.stringify(updatedDeleted));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    // 2. Immediately remove from local state
    setReels((prev) => prev.filter((r) => r.id !== reel.id));
    if (fullScreenReelId === reel.id) {
      setFullScreenReelId(null);
    }

    // 3. User feedback
    playSuccessChime();
    showToast(lang === 'bn' ? '🗑️ রিলটি সফলভাবে মুছে ফেলা হয়েছে।' : '🗑️ Reel deleted successfully.');

    // 4. Remote delete from Firestore
    try {
      await deleteDocument('reels', reel.id);
      
      // 5. Send notification to user
      if (reel.userId) {
        sendNotification(
          reel.userId,
          '⚠️ ভিডিও অপসারণ করা হয়েছে',
          `আপনার "${reel.title}" ভিডিওটি অপসারণ করা হয়েছে। ${reason ? `কারণ: ${reason}` : 'এটি আমাদের কমিউনিটি গাইডলাইন লঙ্ঘন করেছে।'}`,
          'reel_deleted'
        );
      }
    } catch (err) {
      console.warn('Firestore delete note (may be initial demo reel):', err);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    const ownedReels = reels.filter((r) => r.userId === updatedUser.id);
    if (ownedReels.length > 0) {
      setReels((prev) =>
        prev.map((r) =>
          r.userId === updatedUser.id
            ? {
                ...r,
                creatorName: updatedUser.name,
                creatorAvatar: updatedUser.avatar,
                isVerified: Boolean(updatedUser.isVerified),
              }
            : r
        )
      );
    }
    if (isRealUserId(updatedUser.id)) {
      try {
        await Promise.all([
          updateDocument('users', updatedUser.id, updatedUser),
          updateDocument('public_profiles', updatedUser.id, toPublicProfile(updatedUser)).catch(() => {}),
          ...ownedReels
            .filter((r) => firestoreReelIdsRef.current.has(r.id))
            .map((r) =>
              updateDocument('reels', r.id, {
                creatorName: updatedUser.name,
                creatorAvatar: updatedUser.avatar,
                isVerified: Boolean(updatedUser.isVerified),
              }).catch(() => {})
            ),
        ]);
      } catch (err) {
        console.warn('Firestore update user note:', err);
      }
    }
    showToast(lang === 'bn' ? '✅ প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' : '✅ Profile updated!');
  };

  const handleLogout = async () => {
    await firebaseLogout();
    setActiveTab('home');
    showToast(
      lang === 'bn'
        ? 'সফলভাবে সাইন-আউট সম্পন্ন হয়েছে।'
        : 'Signed out successfully.'
    );
  };

  // Filtered and Sorted Reels
  const filteredReels = (() => {
    if (selectedCategory === '🔴 লাইভ') {
      return [];
    }
    let result = selectedCategory === 'সকল'
      ? resolvedReels
      : resolvedReels.filter((r) => r.category === selectedCategory);

    if (feedSearchQuery.trim()) {
      const q = feedSearchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const catMeta = getCategoryMeta(r.category);
        return (
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          catMeta.labelEn.toLowerCase().includes(q) ||
          catMeta.labelBn.toLowerCase().includes(q) ||
          r.creatorName.toLowerCase().includes(q) ||
          (r.caption && r.caption.toLowerCase().includes(q)) ||
          (r.hashtags && r.hashtags.some((tag) => tag.toLowerCase().includes(q)))
        );
      });
    }

    if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'most_watched') {
      result = [...result].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    } else if (sortBy === 'popular') {
      result = [...result].sort((a, b) => b.likesCount - a.likesCount);
    }

    return result;
  })();

  // Ensure every category immediately has plenty of AI videos & visuals
  useEffect(() => {
    if (selectedCategory === '🔴 লাইভ' || feedSearchQuery.trim()) return;
    const countInCategory =
      selectedCategory === 'সকল'
        ? reels.length
        : reels.filter((r) => r.category === selectedCategory).length;
    if (countInCategory < 8) {
      loadMoreInfiniteReels(selectedCategory);
    }
  }, [selectedCategory, reels.length, feedSearchQuery, loadMoreInfiniteReels]);

  // Infinite scroll observer for the Home feed
  useEffect(() => {
    if (activeTab !== 'home' || selectedCategory === '🔴 লাইভ') return;
    const sentinel = feedSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreInfiniteReels(selectedCategory);
        }
      },
      { rootMargin: '600px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, selectedCategory, loadMoreInfiniteReels, filteredReels.length]);

  // MANDATORY SECURITY GATES: Show loader during auth init, and enforce email verification whenever signed in
  if (authLoading) {
    return <FullPageLoader />;
  }

  if (firebaseUser && !emailVerified) {
    const resolvedGateEmail =
      firebaseUser.email ||
      firebaseUser.providerData?.find((p) => p.email)?.email ||
      '';
    return (
      <EmailVerificationGate
        email={resolvedGateEmail}
        portal="user"
        lang={lang}
        onRefreshStatus={refreshVerificationStatus}
        onResendEmail={resendVerificationEmail}
        onLogout={firebaseLogout}
      />
    );
  }

  if (firebaseUser && emailVerified && !isAuthenticated && profileSyncing) {
    return <FullPageLoader />;
  }

  if (firebaseUser && emailVerified && !isAuthenticated && authSyncError) {
    return (
      <div className="min-h-screen bg-[#0a0f0d] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-[#121f18] border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
          <h2 className="text-lg font-black text-rose-400">
            {lang === 'bn' ? 'প্রোফাইল সিঙ্ক সমস্যা' : 'Profile Sync Error'}
          </h2>
          <p className="text-xs text-neutral-300 leading-relaxed break-words">{authSyncError}</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSyncRetryNonce((n) => n + 1)}
              className="w-full py-3 rounded-2xl bg-[#00c853] hover:bg-[#00e676] text-black font-black text-xs cursor-pointer transition"
            >
              {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Sync'}
            </button>
            <button
              type="button"
              onClick={() => firebaseLogout()}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-neutral-200 font-bold text-xs cursor-pointer transition"
            >
              {lang === 'bn' ? 'সাইন-আউট করুন' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (siteSettings.maintenanceMode) {
    return (
      <div className="min-h-screen bg-[#0a0f0d] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-[#121f18] border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <Wrench className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">মেইনটেন্যান্স চলছে</h2>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {siteSettings.maintenanceMessage || DEFAULT_SITE_SETTINGS.maintenanceMessage}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-2xl bg-[#00c853] hover:bg-[#00e676] text-black font-bold text-xs cursor-pointer transition"
          >
            পুনরায় যাচাই করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-slate-100 flex flex-col font-sans selection:bg-[#00c853] selection:text-black">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[90] bg-[#122419] border border-emerald-400 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 max-w-[92vw]">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Main Container constrained to Mobile/Tablet Frame */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-[#0a120e] flex flex-col relative shadow-2xl border-x border-emerald-950/40">
        <Header
          onOpenNotifications={() => {
            setShowNotifications(true);
            const unreadList = personalNotifications.filter((n) => !n.read);
            if (unreadList.length > 0) {
              setPersonalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              if (isAuthenticated && firebaseUser && emailVerified) {
                unreadList.forEach((n) => {
                  updateDocument(`users/${firebaseUser.uid}/notifications`, n.id, { read: true }).catch(() => {});
                });
              }
            }
          }}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          unreadAnnouncementsCount={personalNotifications.filter((n) => !n.read).length}
          lang={lang}
          onToggleLang={toggleLang}
          isAuthenticated={isAuthenticated}
          onOpenAuth={(view) => openAuthModal(view || 'login')}
          userPoints={isAuthenticated ? currentUser.points : guestPoints}
          showCategoryTabs={activeTab === 'home'}
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Global Announcement Marquee Ticker */}
        {announcement && (
          <div className="bg-[#121f18] border-b border-emerald-950/60 px-3 py-1.5 flex items-center gap-2 text-[11px] text-emerald-300 overflow-hidden select-none">
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] z-10 shadow-sm">
              {lang === 'bn' ? 'নোটিশ' : 'Notice'}
            </span>
            <div className="flex-1 overflow-hidden min-w-0 flex items-center">
              <div className="animate-marquee font-medium text-emerald-300 text-xs">
                {announcement}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Body Content (User Portal Only) */}
        <main className="flex-1 p-3.5 space-y-3.5">
          <Suspense fallback={<LoadingSpinner />}>
            <>
                {activeTab === 'home' && (
                  <div className="space-y-3.5 pb-20">

                    {/* Quick Search removed */}

                    {/* DEDICATED LIVE STREAMS FEED WHEN '🔴 লাইভ' CATEGORY IS SELECTED */}
                    {selectedCategory === '🔴 লাইভ' ? (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                            <span>{lang === 'bn' ? 'সকল সরাসরি লাইভ স্ট্রিম' : 'All Active Live Streams'}</span>
                          </h3>
                          <span className="text-[11px] text-neutral-400 font-bold">
                            {toBengaliNumber(activeLiveStreams.length, lang)} {lang === 'bn' ? 'টি সক্রিয়' : 'active'}
                          </span>
                        </div>

                        {activeLiveStreams.length === 0 ? (
                          <div className="p-8 rounded-3xl bg-[#0f1913] border border-emerald-950/60 text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                              <Radio className="w-8 h-8" />
                            </div>
                            <h4 className="font-extrabold text-sm text-white">
                              {lang === 'bn' ? 'বর্তমানে কোনো লাইভ সক্রিয় নেই' : 'No active live streams'}
                            </h4>
                            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                              {lang === 'bn'
                                ? 'আপনি কি বন্ধুদের সাথে অডিও আড্ডা বা ভিডিও লাইভ শুরু করতে চান? এখনই প্রথম লাইভ শুরু করুন!'
                                : 'Start your audio adda or video live and interact with your followers!'}
                            </p>
                            <button
                              type="button"
                              onClick={() => openPersonalLiveStudio('audio')}
                              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 cursor-pointer"
                            >
                              🎙️ {lang === 'bn' ? 'নিজেই প্রথম লাইভ শুরু করুন' : 'Start First Live'}
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {activeLiveStreams.map((live) => (
                              <div
                                key={live.id}
                                className="p-4 rounded-3xl bg-[#111c15] border border-emerald-900/40 shadow-xl space-y-3 text-white"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={live.hostAvatar || DEFAULT_AVATAR_URL}
                                      alt={live.hostName}
                                      className="w-11 h-11 rounded-2xl object-cover border border-emerald-500/40"
                                    />
                                    <div>
                                      <h4 className="text-xs font-black flex items-center gap-1">
                                        <span>{live.hostName}</span>
                                        <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                                      </h4>
                                      <span className="text-[10px] text-neutral-400 font-semibold">
                                        {live.category || 'আড্ডা'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                    live.mode === 'audio'
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                      : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                                  }`}>
                                    {live.mode === 'audio' ? <Mic className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                                    <span>{live.mode === 'audio' ? 'অডিও আড্ডা' : 'ভিডিও লাইভ'}</span>
                                  </span>
                                </div>

                                <div>
                                  <h3 className="text-sm font-extrabold text-neutral-100">
                                    {live.title}
                                  </h3>
                                  {live.pinnedNotice && (
                                    <p className="text-xs text-amber-300/80 mt-0.5">
                                      📌 {live.pinnedNotice}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-emerald-950">
                                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                                      <Users className="w-3.5 h-3.5" />
                                      <span>{toBengaliNumber(live.viewersCount || 1, lang)} জন দেখছেন</span>
                                    </span>
                                    <span>•</span>
                                    <span className="text-emerald-400 font-bold">
                                      ❤️ {toBengaliNumber(live.likesCount || 0, lang)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleJoinLiveStream(live.id)}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:brightness-110 font-black text-xs text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>{lang === 'bn' ? 'সরাসরি যুক্ত হন' : 'Join Live'}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Toolbar removed */}

                        {/* Feed List of Reels matching Screenshot 1 + Download + Gift */}
                        <div className="space-y-1">
                          {filteredReels.length === 0 ? (
                            <div className="p-8 rounded-3xl bg-[#0f1913] border border-emerald-950/60 text-center space-y-3 my-2">
                              <div className="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl shadow-inner">
                                {getCategoryMeta(selectedCategory).icon}
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-sm text-white">
                                  {lang === 'bn'
                                    ? `${getCategoryMeta(selectedCategory).labelBn} ক্যাটাগরিতে কোনো রিল পাওয়া যায়নি`
                                    : `No reels found in ${getCategoryMeta(selectedCategory).labelEn}`}
                                </h4>
                                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                                  {lang === 'bn'
                                    ? 'অন্য ক্যাটাগরি বেছে নিন অথবা সকল রিল দেখতে রিসেট বাটনে ট্যাপ করুন।'
                                    : 'Select another category or tap reset to browse all reels.'}
                                </p>
                              </div>
                              <div className="flex items-center justify-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory('সকল');
                                    setFeedSearchQuery('');
                                  }}
                                  className="px-4 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer"
                                >
                                  ✨ {lang === 'bn' ? 'সকল রিল দেখুন (রিসেট)' : 'View All Reels (Reset)'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            filteredReels.map((reel) => (
                              <ReelFeedCard
                                key={reel.id}
                                reel={reel}
                                currentUserId={isAuthenticated ? currentUser.id : undefined}
                                isLiked={likedReelIds.includes(reel.id)}
                                hasWatched={(isAuthenticated ? watchedReelIds : guestWatchedReelIds).includes(reel.id)}
                                onLikeToggle={handleToggleLike}
                                onOpenReel={(r) => setFullScreenReelId(r.id)}
                                onOpenComments={(r) => setActiveCommentReel(r)}
                                onClaimDirect={handleClaimDirect}
                                onOpenGift={() => {
                                  if (!isAuthenticated) {
                                    triggerAuthPrompt(
                                      lang === 'bn'
                                        ? 'ক্রিয়েটরকে গিফট পাঠাতে অনুগ্রহ করে রিয়েল আইডিতে লগইন করুন!'
                                        : 'Please log in with a real account to send gifts!'
                                    );
                                    return;
                                  }
                                  if (isOwnContentUser(reel.userId)) {
                                    vibrateError();
                                    showToast(
                                      lang === 'bn'
                                        ? '🎁 নিজের ভিডিওতে গিফট পাঠানো যাবে না! গিফট শুধুমাত্র অন্য ইউজারদের জন্য।'
                                        : '🎁 You cannot send gifts to your own video!'
                                    );
                                    return;
                                  }
                                  setGiftTarget({ userId: reel.userId, creatorName: reel.creatorName });
                                  setShowGiftSheet(true);
                                }}
                                onOpenCreatorProfile={(userId) => handleOpenUserProfile(userId)}
                                onShare={handleOpenShare}
                                lang={lang}
                                isMuted={isMuted}
                                levelProgress={levelProgress}
                                earningSettings={earningSettings}
                                isDailyLimitReached={isDailyReelLimitReached}
                                isSaved={savedReelIds.includes(reel.id)}
                                onToggleSave={handleToggleSave}
                                isGiftsEnabled={siteSettings.isGiftsEnabled}
                                isCommentsEnabled={siteSettings.isCommentsEnabled}
                                onSelectCategory={handleSelectCategory}
                                activeCategory={selectedCategory}
                                watchProgress={reelWatchProgressMap[reel.id] || 0}
                                onWatchProgressChange={handleWatchProgressChange}
                                isModalOpen={Boolean(fullScreenReelId)}
                              />
                            ))
                          )}

                          {/* Infinite Scroll Sentinel for Endless AI Reels */}
                          {filteredReels.length > 0 && (
                            <div
                              ref={feedSentinelRef}
                              className="py-5 flex flex-col items-center justify-center gap-2 text-center"
                            >
                              <button
                                type="button"
                                onClick={() => loadMoreInfiniteReels(selectedCategory)}
                                className="px-4 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                <span>
                                  {lang === 'bn'
                                    ? 'আরও AI ভিডিও ও রিলস লোড করুন...'
                                    : 'Load more AI videos & visuals...'}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'earn' && (
                  isAuthenticated ? (
                    <EarnView
                      user={currentUser}
                      tasks={tasks}
                      onCompleteTask={handleCompleteTask}
                      onAddPoints={handleAddPointsGeneral}
                      isMuted={isMuted}
                      spinPrizes={
                        earningSettings.spinPrizes?.length
                          ? earningSettings.spinPrizes
                          : buildScaledSpinPrizes(spinMaxPrize)
                      }
                      scratchPrize={scratchPrize}
                      earningSettings={earningSettings}
                      users={users}
                      lang={lang}
                      pointRate={pointRate}
                      onRecordSpin={handleRecordSpin}
                      onClaimScratch={handleClaimScratchCard}
                      todayKey={todayKey}
                    />
                  ) : (
                    <GuestEarnView
                      onLogin={() => openAuthModal('login')}
                      onRegister={() => openAuthModal('register')}
                      lang={lang}
                      earningSettings={earningSettings}
                    />
                  )
                )}

                {activeTab === 'wallet' && (
                  isAuthenticated ? (
                    <WalletView
                      user={currentUser}
                      pointRate={pointRate}
                      withdrawals={withdrawals}
                      depositRequests={depositRequests}
                      onRequestWithdrawal={handleRequestWithdrawal}
                      onDepositClick={() => setShowDepositSheet(true)}
                      isMuted={isMuted}
                      minWithdrawal={siteSettings.minWithdrawal || minWithdrawal}
                      maxWithdrawal={siteSettings.maxWithdrawal}
                      isWithdrawalsEnabled={siteSettings.isWithdrawalsEnabled}
                      isDepositsEnabled={siteSettings.isDepositsEnabled}
                      paymentMethods={siteSettings.paymentMethods}
                      lang={lang}
                    />
                  ) : (
                    <GuestWalletView
                      pointRate={pointRate}
                      guestId={guestId}
                      guestPoints={guestPoints}
                      onLogin={() => openAuthModal('login')}
                      onRegister={() => openAuthModal('register')}
                      lang={lang}
                    />
                  )
                )}

                {activeTab === 'profile' && (
                  isAuthenticated ? (
                    <ProfileView
                      user={currentUser}
                      pointRate={pointRate}
                      onLogout={handleLogout}
                      onSwitchUser={handleUpdateUser}
                      onClaimDailyBonus={handleClaimDailyBonus}
                      isClaimedToday={isClaimedToday}
                      isMuted={isMuted}
                      isAuthenticated={isAuthenticated}
                      onRequireAuth={(msg) => triggerAuthPrompt(msg)}
                      lang={lang}
                      setShowGiftSheet={setShowGiftSheet}
                      setShowLiveSheet={setShowLiveSheet}
                      onOpenPersonalLive={(mode) => openPersonalLiveStudio(mode || 'audio')}
                      activeMyLive={activeLiveStreams.find((s) => s.hostId === currentUser.id) || null}
                      onManageMyLive={(liveId) => handleJoinLiveStream(liveId)}
                      onEndMyLive={handleEndLive}
                      reels={resolvedReels}
                      onOpenReel={(r) => setFullScreenReelId(r.id)}
                      onEditReel={(r) => setEditingReel(r)}
                      onDeleteReel={handleDeleteReel}
                      onOpenChatList={() => {
                        if (!siteSettings.isDirectChatEnabled) {
                          showToast(lang === 'bn' ? '🔒 ডিরেক্ট চ্যাট বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '🔒 Direct chat paused by Admin.');
                          return;
                        }
                        setIsChatListModalOpen(true);
                      }}
                      onOpenFollowList={(tab) => setFollowListModal({ user: currentUser, tab })}
                      onOpenWallet={() => setActiveTab('wallet')}
                      minWithdrawal={siteSettings.minWithdrawal || minWithdrawal}
                      earningSettings={earningSettings}
                      savedReelIds={savedReelIds}
                      onToggleSave={handleToggleSave}
                      onNavigateToHome={() => setActiveTab('home')}
                      paymentMethods={siteSettings.paymentMethods}
                      allowUserAudioLive={siteSettings.allowUserAudioLive}
                      allowUserVideoLive={siteSettings.allowUserVideoLive}
                      isDirectChatEnabled={siteSettings.isDirectChatEnabled}
                      users={users}
                      onOpenUserProfile={handleOpenUserProfile}
                      onApplyReferralCode={handleApplyReferralCode}
                    />
                  ) : (
                    <GuestProfileView
                      guestId={guestId}
                      guestPoints={guestPoints}
                      savedCount={savedReelIds.length}
                      onLogin={() => openAuthModal('login')}
                      onRegister={() => openAuthModal('register')}
                      lang={lang}
                    />
                  )
                )}
            </>
          </Suspense>
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(t) => setActiveTab(t)}
          onOpenCreate={() => {
            if (!isAuthenticated) {
              triggerAuthPrompt(
                lang === 'bn'
                  ? 'নতুন রিল তৈরি করতে বা লাইভে যেতে লগইন করুন!'
                  : 'Please log in to create a reel or go live!'
              );
              return;
            }
            setShowPlusSheet(true);
          }}
          lang={lang}
        />

        {/* Modals & Sheets wrapped in Suspense */}
        <Suspense fallback={null}>
          {/* Full-Screen Immersive Reel Player Modal */}
          {fullScreenReelId && (() => {
            const fullScreenReelsList = filteredReels.some((r) => r.id === fullScreenReelId)
              ? filteredReels
              : resolvedReels;
            return (
            <FullScreenReelModal
              reels={fullScreenReelsList}
              initialReelId={fullScreenReelId}
              onClose={() => setFullScreenReelId(null)}
              isLiked={likedReelIds.includes(fullScreenReelId)}
              likedReelIds={likedReelIds}
              onLoadMoreReels={() => loadMoreInfiniteReels(selectedCategory)}
              hasMore={true}
              onToggleLike={handleToggleLike}
              onOpenComments={(r) => setActiveCommentReel(r)}
              onRewardEarned={handleEarnReelReward}
              onOpenGiftSheet={(activeModalReel) => {
                if (!isAuthenticated) {
                  triggerAuthPrompt(
                    lang === 'bn'
                      ? 'ক্রিয়েটরকে গিফট পাঠাতে অনুগ্রহ করে রিয়েল আইডিতে লগইন করুন!'
                      : 'Please log in to send gifts!'
                  );
                  return;
                }
                const targetReel = activeModalReel || resolvedReels.find((r) => r.id === fullScreenReelId);
                if (targetReel) {
                  if (isOwnContentUser(targetReel.userId)) {
                    vibrateError();
                    showToast(
                      lang === 'bn'
                        ? '🎁 নিজের ভিডিওতে গিফট পাঠানো যাবে না! গিফট শুধুমাত্র অন্য ইউজারদের জন্য।'
                        : '🎁 You cannot send gifts to your own video!'
                    );
                    return;
                  }
                  setGiftTarget({ userId: targetReel.userId, creatorName: targetReel.creatorName });
                }
                setShowGiftSheet(true);
              }}
              onShare={handleOpenShare}
              onOpenProfile={handleOpenUserProfile}
              lang={lang}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              levelProgress={levelProgress}
              activeLiveStreams={activeLiveStreams}
              onOpenLiveSheet={() => {
                if (!isAuthenticated) {
                  triggerAuthPrompt(
                    lang === 'bn'
                      ? 'লাইভ স্ট্রিমে যুক্ত হতে অনুগ্রহ করে লগইন করুন!'
                      : 'Please log in to join live streams!'
                  );
                  return;
                }
                setFullScreenReelId(null);
                if (activeLiveStreams.length > 0) {
                  handleJoinLiveStream(activeLiveStreams[0].id);
                } else {
                  openPersonalLiveStudio('audio');
                }
              }}
              earningSettings={earningSettings}
              watchedReelIds={isAuthenticated ? watchedReelIds : guestWatchedReelIds}
              isDailyLimitReached={isDailyReelLimitReached}
              dailyClaimsUsed={dailyClaimsUsed}
              dailyClaimsLimit={dailyClaimsLimit}
              dailyPointsUsed={dailyPointsUsed}
              dailyPointsLimit={dailyPointsLimit}
              onToggleFollow={handleToggleFollow}
              followingIds={currentUser.following || []}
              savedReelIds={savedReelIds}
              onToggleSave={handleToggleSave}
              isGiftsEnabled={siteSettings.isGiftsEnabled}
              isCommentsEnabled={siteSettings.isCommentsEnabled}
              isDirectChatEnabled={siteSettings.isDirectChatEnabled}
              onVideoCompleted={handleIncrementReelView}
              currentUserId={currentUser.id}
              onSelectCategory={handleSelectCategory}
              onWatchProgressChange={handleWatchProgressChange}
              onOpenChatWithCreator={async (creatorId) => {
                if (!siteSettings.isDirectChatEnabled) {
                  showToast(lang === 'bn' ? '🔒 ডিরেক্ট চ্যাট বর্তমানে এডমিন কর্তৃক বন্ধ রয়েছে।' : '🔒 Direct chat paused by Admin.');
                  return;
                }
                if (!isAuthenticated) {
                  triggerAuthPrompt(
                    lang === 'bn'
                      ? 'ক্রিয়েটরের সাথে চ্যাট করতে অনুগ্রহ করে লগইন করুন!'
                      : 'Please log in to chat with creators!'
                  );
                  return;
                }
                const known = users.find((u) => u.id === creatorId) || (await getDocument('public_profiles', creatorId) as User | null);
                if (known) {
                  setFullScreenReelId(null);
                  handleOpenChat(known);
                } else {
                  setFullScreenReelId(null);
                  handleOpenUserProfile(creatorId);
                }
              }}
            />
            );
          })()}

          {/* Edit Reel Modal */}
          {editingReel && (
            <EditReelModal
              reel={editingReel}
              isOpen={!!editingReel}
              onClose={() => setEditingReel(null)}
              onUpdateReel={handleUpdateReel}
              lang={lang}
              isMuted={isMuted}
              users={currentUser.role === 'admin' ? users : undefined}
            />
          )}

          {/* Comments Modal Drawer */}
          {activeCommentReel && (
            <CommentsModal
              reel={activeCommentReel}
              currentUser={currentUser}
              onClose={() => setActiveCommentReel(null)}
              onAddComment={handleAddComment}
              onOpenProfile={(userId) => {
                setActiveCommentReel(null);
                handleOpenUserProfile(userId);
              }}
              isCommentsEnabled={siteSettings.isCommentsEnabled}
              likedCommentIds={currentUser.likedCommentIds || []}
              onToggleCommentLike={handleToggleCommentLike}
            />
          )}

          {showNotifications && (
            <NotificationModal
              announcement={announcement}
              personalNotifications={personalNotifications}
              onClose={() => setShowNotifications(false)}
              lang={lang}
            />
          )}

          {/* Create Reel / Plus Sheet */}
          {showPlusSheet && (
            <PlusSheet
              isOpen={showPlusSheet}
              onClose={() => setShowPlusSheet(false)}
              currentUser={currentUser}
              onPublishReel={handleAddNewReel}
              onOpenLive={() => openPersonalLiveStudio('audio')}
              lang={lang}
              isMuted={isMuted}
              allowUserReelUpload={siteSettings.allowUserReelUpload}
              defaultReelRewardPoints={siteSettings.defaultUserReelRewardPoints}
              allowUserLive={siteSettings.allowUserAudioLive || siteSettings.allowUserVideoLive}
            />
          )}

          {/* Personal Live Studio Setup Modal */}
          {showGoLiveSetupModal && (
            <GoLiveSetupModal
              isOpen={showGoLiveSetupModal}
              onClose={() => setShowGoLiveSetupModal(false)}
              currentUser={currentUser}
              initialMode={goLiveInitialMode}
              onStartLive={handleStartLive}
              lang={lang}
              allowAudioLive={siteSettings.allowUserAudioLive}
              allowVideoLive={siteSettings.allowUserVideoLive}
            />
          )}

          {/* Gift Sheet (🎁 গিফট পাঠান) */}
          {showGiftSheet && (
            <GiftSheet
              isOpen={showGiftSheet}
              onClose={() => {
                setShowGiftSheet(false);
                setGiftTarget(null);
              }}
              userPoints={currentUser.points}
              onSendGift={(gift, creatorShare, userCashback, adminShare) =>
                handleSendGift(gift, creatorShare, userCashback, undefined, undefined, adminShare)
              }
              onOpenDeposit={() => setShowDepositSheet(true)}
              lang={lang}
              isMuted={isMuted}
              recipientName={giftTarget?.creatorName}
              earningSettings={earningSettings}
              isSelfTarget={Boolean(giftTarget?.userId && isOwnContentUser(giftTarget.userId))}
            />
          )}

          {/* Deposit Sheet (💎 পয়েন্ট জমা করুন) */}
          {showDepositSheet && (
            <DepositSheet
              isOpen={showDepositSheet}
              onClose={() => setShowDepositSheet(false)}
              onSubmitRequest={handleSubmitDepositRequest}
              pointRate={pointRate}
              lang={lang}
              isMuted={isMuted}
              adminPaymentNumbers={adminPaymentNumbers}
              paymentMethods={siteSettings.paymentMethods}
              minDeposit={siteSettings.minDeposit}
              isDepositsEnabled={siteSettings.isDepositsEnabled}
            />
          )}

          {/* Personal Live Stream Room (Audio Adda & Video Live) */}
          {showLiveSheet && (
            <LiveStreamSheet
              isOpen={showLiveSheet}
              onClose={() => setShowLiveSheet(false)}
              onOpenGift={(stream) => {
                if (isOwnContentUser(stream.hostId)) {
                  showToast(
                    lang === 'bn'
                      ? '🎁 নিজের লাইভে নিজেকে গিফট পাঠানো যাবে না!'
                      : '🎁 You cannot send gifts to your own live stream!'
                  );
                  return;
                }
                setGiftTarget({
                  userId: stream.hostId,
                  liveId: stream.id,
                  creatorName: stream.hostName,
                });
                setShowGiftSheet(true);
              }}
              onQuickGift={(gift, stream) => {
                if (isOwnContentUser(stream.hostId)) {
                  showToast(
                    lang === 'bn'
                      ? '🎁 নিজের লাইভে নিজেকে গিফট পাঠানো যাবে না!'
                      : '🎁 You cannot send gifts to your own live stream!'
                  );
                  return;
                }
                const split = calculateGiftSplit(gift.costPoints, earningSettings);
                handleSendGift(gift, split.creatorShare, split.userCashback, stream.hostId, stream.id, split.adminShare);
              }}
              lang={lang}
              isMuted={isMuted}
              liveStreamId={currentLiveStreamId}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
              onRequireAuth={(msg) => triggerAuthPrompt(msg)}
              onEndLive={handleEndLive}
              onOpenProfile={handleOpenUserProfile}
              onToggleFollow={handleToggleFollow}
              isAdminOverride={false}
              isGiftsEnabled={siteSettings.isGiftsEnabled}
              isFollowingHost={Boolean(
                (() => {
                  const activeLive = activeLiveStreams.find((s) => s.id === currentLiveStreamId);
                  return activeLive && (currentUser.following || []).includes(activeLive.hostId);
                })()
              )}
              initialStream={activeLiveStreams.find((s) => s.id === currentLiveStreamId) || null}
              onShare={(stream) => {
                setSharingReel(null);
                setSharingLiveStream(stream);
                setShowShareSheet(true);
              }}
            />
          )}

          {/* Floating Live Stream Ticker (Shown on non-Home tabs so Home isn't duplicated) */}
          {activeTab !== 'home' && activeLiveStreams.length > 0 && !showLiveSheet && (
            <button
              type="button"
              onClick={() => handleJoinLiveStream(activeLiveStreams[0].id)}
              className="fixed bottom-20 right-3 z-40 min-h-[40px] bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white px-3.5 py-2 rounded-full shadow-2xl border-2 border-black/40 flex items-center gap-2 cursor-pointer hover:scale-105 transition active:scale-95"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-xs font-black">
                🔴 {activeLiveStreams[0].hostName} {lang === 'bn' ? 'লাইভে আছেন ▶' : 'is LIVE ▶'}
              </span>
            </button>
          )}

          {/* Share Sheet */}
          <ShareSheet
            isOpen={showShareSheet}
            onClose={() => {
              setShowShareSheet(false);
              setSharingReel(null);
              setSharingLiveStream(null);
            }}
            reel={sharingReel}
            liveStream={sharingLiveStream}
            lang={lang}
            onSendInChat={handleShareInChat}
            onDownloadReel={(r) => downloadReelVideo(r, lang)}
            onShareTracked={handleRecordReelShare}
          />

          {/* User Profile Modal */}
          {isUserProfileModalOpen && selectedUserProfileUser && (
            <UserProfileModal
              user={selectedUserProfileUser}
              currentUser={currentUser}
              onClose={() => setIsUserProfileModalOpen(false)}
              onOpenChat={handleOpenChat}
              onOpenChatList={() => setIsChatListModalOpen(true)}
              onToggleFollow={handleToggleFollow}
              isFollowing={(currentUser.following || []).includes(selectedUserProfileUser.id)}
              onOpenFollowList={(tab) => setFollowListModal({ user: selectedUserProfileUser, tab })}
              lang={lang}
              allReels={resolvedReels}
              onOpenReel={(r) => {
                setFullScreenReelId(r.id);
                setIsUserProfileModalOpen(false);
              }}
              isDirectChatEnabled={siteSettings.isDirectChatEnabled}
            />
          )}

          {/* Followers / Following / Discover Creators Modal */}
          {followListModal && (
            <FollowListModal
              isOpen={!!followListModal}
              onClose={() => setFollowListModal(null)}
              targetUser={followListModal.user}
              currentUser={currentUser}
              initialTab={followListModal.tab}
              knownUsers={users}
              isAuthenticated={isAuthenticated}
              onToggleFollow={handleToggleFollow}
              onOpenProfile={(uid) => {
                setFollowListModal(null);
                if (uid !== currentUser.id) {
                  handleOpenUserProfile(uid);
                } else {
                  setActiveTab('profile');
                }
              }}
              onOpenChat={(target) => {
                setFollowListModal(null);
                handleOpenChat(target);
              }}
              lang={lang}
            />
          )}

          {/* Messenger Chat List Modal */}
          {isChatListModalOpen && (
            <ChatListModal
              isOpen={isChatListModalOpen}
              onClose={() => setIsChatListModalOpen(false)}
              currentUser={currentUser}
              users={users}
              onOpenChat={handleOpenChat}
              onOpenUserPicker={() => {
                setIsChatListModalOpen(false);
                setIsUserPickerOpen(true);
              }}
              lang={lang}
            />
          )}

          {/* Messenger / Chat Modal */}
          {isChatModalOpen && activeChatSession && activeChatOtherUser && (
            <ChatModal
              isOpen={isChatModalOpen}
              onClose={() => setIsChatModalOpen(false)}
              session={activeChatSession}
              currentUser={currentUser}
              otherUser={activeChatOtherUser}
              lang={lang}
              allReels={resolvedReels}
            />
          )}

          {/* User Picker for Sharing */}
          {isUserPickerOpen && (
            <UserPickerModal
              isOpen={isUserPickerOpen}
              onClose={() => setIsUserPickerOpen(false)}
              users={users}
              currentUser={currentUser}
              onPickUser={handlePickUserForShare}
              lang={lang}
            />
          )}
        </Suspense>

        {/* Auth Prompt Modal for Guest Actions */}
        <AuthPromptModal
          isOpen={authPromptState.open}
          onClose={() => setAuthPromptState({ open: false })}
          onOpenLogin={() => openAuthModal('login')}
          onOpenRegister={() => openAuthModal('register')}
          title={authPromptState.title}
          message={authPromptState.message}
          lang={lang}
          earningSettings={earningSettings}
        />

        {/* Dismissible Login / Registration Overlay for Guest Users */}
        {showAuthModal && !firebaseUser && (
          <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#0a0f0d]">
            <AuthPage
              onEmailLogin={loginWithEmail}
              onEmailRegister={handleUserEmailRegister}
              onGoogleLogin={handleUserGoogleLogin}
              onResetPassword={resetPassword}
              onClose={() => setShowAuthModal(false)}
              initialView={authModalView}
              externalError={authError ? formatFirebaseAuthError(authError, lang) : null}
              lang={lang}
              paymentMethods={siteSettings.paymentMethods}
            />
          </div>
        )}
      </div>
    </div>
  );
}
