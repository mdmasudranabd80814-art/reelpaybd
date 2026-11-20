/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
  INITIAL_USER,
  INITIAL_USERS_LIST,
  INITIAL_REELS,
  INITIAL_WITHDRAWALS,
  INITIAL_TASKS,
} from './data/initialData';
import { User, Reel, WithdrawalRequest, Comment, TaskItem, DepositRequest, Notification, LiveStream, LiveMode, ChatSession, ChatMessage, EarningSettings, DEFAULT_EARNING_SETTINGS } from './types';
import { Header } from './components/Header';
import { ReelFeedCard } from './components/ReelFeedCard';
import { BottomNav, TabType } from './components/BottomNav';
import { ChevronRight, Sparkles, Radio, Mic, Video, Loader2, Headphones, Play, Users } from 'lucide-react';
import type { StartLivePayload } from './components/GoLiveSetupModal';
import { GiftItem } from './types';
import { playCoinSound, playSuccessChime, playPopSound } from './utils/audio';
import { toBengaliNumber } from './utils/bengali';
import { getUserLevel, getProgressToNextLevel } from './utils/levels';
import { calculateGiftSplit } from './utils/gifts';
import confetti from 'canvas-confetti';

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
import { GuestBanner } from './components/GuestBanner';
import { GuestEarnView } from './components/GuestEarnView';
import { GuestWalletView } from './components/GuestWalletView';
import { GuestProfileView } from './components/GuestProfileView';
import { AuthPromptModal } from './components/AuthPromptModal';
import { useFirebase } from './hooks/useFirebase';
import { where, orderBy, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { normalizeVideoUrl } from './utils/video';
import { downloadReelVideo } from './utils/videoDownload';

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

const CATEGORIES: ('সকল' | '🔴 লাইভ' | 'ট্রেন্ডিং' | 'কমেডি' | 'গেমিং' | 'রান্না' | 'শিক্ষা')[] = [
  'সকল',
  '🔴 লাইভ',
  'ট্রেন্ডিং',
  'কমেডি',
  'গেমিং',
  'রান্না',
  'শিক্ষা',
];

const toPublicProfile = (u: User) => ({
  id: u.id,
  name: (u.name || 'User').slice(0, 100),
  avatar: u.avatar || INITIAL_USER.avatar,
  isVerified: Boolean(u.isVerified),
  referralCode: (u.referralCode || '').slice(0, 20),
  followersCount: u.followersCount || 0,
  followingCount: u.followingCount || 0,
  followers: (u.followers || []).slice(0, 1000),
  following: (u.following || []).slice(0, 1000),
  reelsWatchedCount: u.reelsWatchedCount || 0,
  createdAt: u.createdAt || new Date().toISOString(),
});

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
  } = useFirebase();

  // Persistent State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS_LIST);
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
  const [currentUser, setCurrentUser] = useState<User>(() => ({
    ...INITIAL_USER,
    id: guestId,
    name: 'অতিথি ইউজার',
    points: 0,
  }));
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
  const [reels, setReels] = useState<Reel[]>(() => {
    try {
      const deleted = JSON.parse(localStorage.getItem('rt_deleted_reels') || '[]');
      return INITIAL_REELS.filter(r => !deleted.includes(r.id));
    } catch {
      return INITIAL_REELS;
    }
  });
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [likedReelIds, setLikedReelIds] = useState<string[]>(['reel_app_01']);
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
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
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

  // Auth Sync: strictly require verified email before reading/writing Firestore
  useEffect(() => {
    if (firebaseUser && emailVerified) {
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthPromptState({ open: false });
      const syncProfile = async () => {
        try {
          const [profile, remoteSettings] = await Promise.all([
            getDocument('users', firebaseUser.uid) as Promise<User | null>,
            getDocument('settings', 'earning').catch(() => null) as Promise<Partial<EarningSettings> | null>,
          ]);

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
                points: (profile.points || 0) + offerPoints,
                loginOfferClaimed: true,
                loginOfferCampaignId: activeCampaignId,
              };
              setCurrentUser(updatedUser);
              await Promise.all([
                updateDocument('users', profile.id, {
                  points: increment(offerPoints),
                  loginOfferClaimed: true,
                  loginOfferCampaignId: activeCampaignId,
                }),
                setDocument('public_profiles', profile.id, toPublicProfile(updatedUser)).catch(() => {}),
              ]);
              if (!isMuted) playSuccessChime();
              showToast(
                lang === 'bn'
                  ? `🎁 এডমিন লগইন অফার! +${toBengaliNumber(offerPoints, lang)} পয়েন্ট আপনার অ্যাকাউন্টে যোগ হয়েছে!`
                  : `🎁 Admin Login Offer! +${offerPoints} points credited!`
              );
            } else {
              setCurrentUser(profile);
              setDocument('public_profiles', profile.id, toPublicProfile(profile)).catch(() => {});
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

            const newUser: User = {
              ...INITIAL_USER,
              id: firebaseUser.uid,
              name: (pendingReg.name || firebaseUser.displayName || 'User').slice(0, 100),
              phone: (pendingReg.phone || '').slice(0, 20),
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || INITIAL_USER.avatar,
              paymentMethod: pendingReg.paymentMethod || 'bKash',
              paymentAccountNumber: pendingReg.paymentAccountNumber || '',
              points: offerPoints,
              role: 'user',
              createdAt: new Date().toISOString(),
              referralCode: `REEL${Math.floor(1000 + Math.random() * 9000)}`,
              isVerified: true,
              totalWithdrawn: 0,
              reelsWatchedCount: 0,
              followersCount: 0,
              followingCount: 0,
              followers: [],
              following: [],
              completedTaskIds: [],
              loginOfferClaimed: offerPoints > 0,
              loginOfferCampaignId: activeCampaignId,
            };

            setCurrentUser(newUser);
            await Promise.all([
              setDocument('users', firebaseUser.uid, newUser),
              setDocument('public_profiles', firebaseUser.uid, toPublicProfile(newUser)).catch(() => {}),
            ]);

            if (offerPoints > 0) {
              if (!isMuted) playSuccessChime();
              showToast(
                lang === 'bn'
                  ? `🎉 অ্যাকাউন্ট তৈরি হয়েছে! লগইন অফার +${toBengaliNumber(offerPoints, lang)} পয়েন্ট যোগ হয়েছে!`
                  : `🎉 Account created! Login offer +${offerPoints} points added!`
              );
            } else {
              showToast(
                lang === 'bn'
                  ? '✅ অ্যাকাউন্ট তৈরি হয়েছে (০ পয়েন্ট)! রিল দেখে ও টাস্ক করে আর্ন শুরু করুন।'
                  : '✅ Account created with 0 points! Start earning now.'
              );
            }
          }
        } catch (err) {
          console.error('Auth sync error:', err);
        }
      };
      syncProfile();
    } else {
      setIsAuthenticated(false);
      setCurrentUser({
        ...INITIAL_USER,
        id: guestId,
        name: 'অতিথি ইউজার',
        points: guestPoints,
      });
    }
  }, [firebaseUser, emailVerified, guestId]);

  // Public Reels Listener (Viewable in Guest Mode & Verified Mode; paused during unverified gate)
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

      if (data && data.length > 0) {
        const currentData = (data as Reel[]).filter((r) => r.id !== 'reel_01' && r.id !== 'reel_02');
        if (currentData.length > 0) {
          const loadedReels = currentData
            .filter((r) => !deleted.includes(r.id))
            .map((r, idx) => {
              const patched = edited[r.id] ? { ...r, ...edited[r.id] } : r;
              return {
                ...patched,
                videoUrl: normalizeVideoUrl(patched.videoUrl, idx) ?? patched.videoUrl,
              };
            });
          setReels(loadedReels);
          return;
        }
      }

      const initial = INITIAL_REELS
        .filter((r) => !deleted.includes(r.id))
        .map((r) => (edited[r.id] ? { ...r, ...edited[r.id] } : r));
      setReels(initial);
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
      if (data && data.length > 0) {
        setUsers(data as User[]);
      }
    });

    // User-specific financial listeners (Owner only)
    const unsubUserWithdrawals = firebaseOnSnapshot('withdrawals', (data) => {
      setWithdrawals(data as WithdrawalRequest[]);
    }, [where('userId', '==', firebaseUser.uid), orderBy('createdAt', 'desc')]);

    const unsubUserDeposits = firebaseOnSnapshot('deposits', (data) => {
      setDepositRequests(data as DepositRequest[]);
    }, [where('userId', '==', firebaseUser.uid), orderBy('createdAt', 'desc')]);

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

  // Sync current user's private profile
  useEffect(() => {
    if (isAuthenticated && firebaseUser && emailVerified && currentUser.id !== INITIAL_USER.id) {
      const unsubUser = firebaseOnSnapshot('users', (data) => {
        const me = data.find(u => u.id === firebaseUser.uid) as User | undefined;
        if (me) {
          setCurrentUser(me);
        }
      }, [where('id', '==', firebaseUser.uid)]);
      return unsubUser;
    }
  }, [isAuthenticated, currentUser.id, firebaseUser?.uid, emailVerified]);

  // Sync personal notifications
  useEffect(() => {
    if (isAuthenticated && firebaseUser && emailVerified && currentUser.id !== INITIAL_USER.id) {
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
        .filter((s) => s && s.status === 'active')
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
        setTasks(data as TaskItem[]);
      } else {
        setTasks(INITIAL_TASKS);
      }
    });
    return unsubTasks;
  }, [firebaseUser?.uid, emailVerified]);

  // Sync Earning Settings from Firestore
  useEffect(() => {
    if (!firebaseUser || !emailVerified) return;
    const unsubSettings = firebaseOnSnapshot('settings', (data) => {
      if (data && data.length > 0) {
        const earningDoc = (data as any[]).find((d) => d.id === 'earning');
        if (earningDoc) {
          setEarningSettings((prev) => ({ ...prev, ...earningDoc }));
          try {
            localStorage.setItem('rt_earning_settings', JSON.stringify(earningDoc));
          } catch (e) {}
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
  const [selectedCategory, setSelectedCategory] = useState<
    'সকল' | '🔴 লাইভ' | 'ট্রেন্ডিং' | 'কমেডি' | 'গেমিং' | 'রান্না' | 'শিক্ষা'
  >('সকল');
  const [sortBy, setSortBy] = useState<'newest' | 'most_watched' | 'popular'>('newest');
  const [isMuted, setIsMuted] = useState<boolean>(false);

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
        paymentMethod: userData.paymentMethod || 'bKash',
        paymentAccountNumber: userData.paymentAccountNumber || '',
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
          paymentMethod: pendingProfile.paymentMethod || 'bKash',
          paymentAccountNumber: pendingProfile.paymentAccountNumber || '',
        }));
      } catch {}
    }
    return loginWithGoogle();
  };

  // Activity Tracking Effect (for verified user)
  useEffect(() => {
    const updateTracking = () => {
      if (!isAuthenticated || !firebaseUser || !emailVerified || currentUser.id === INITIAL_USER.id) return;
      const now = new Date().toISOString();
      const pageInfo = fullScreenReelId ? `Reel: ${fullScreenReelId}` : `Tab: ${activeTab}`;
      updateDocument('users', currentUser.id, {
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
    if (!isAuthenticated || activeUser.id === INITIAL_USER.id) return;

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

  // Claim Daily Bonus & Daily Reel Earning Limit Calculations
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

  const handleClaimDailyBonus = (bonusPoints: number) => {
    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isDailyBonusEnabled) {
      showToast(lang === 'bn' ? '⚠️ দৈনিক বোনাস আর্নিং বর্তমানে এডমিন দ্বারা বন্ধ রয়েছে।' : '⚠️ Daily bonus is currently disabled.');
      return;
    }

    if (!isAuthenticated || isClaimedToday) return;

    const actualBonus = earningSettings.dailyBonusPoints || bonusPoints;
    applyFastUserMutation(actualBonus, { dailyClaimedDate: todayKey });

    showToast(`🎉 দৈনিক বোনাস +${toBengaliNumber(actualBonus, lang)} পয়েন্ট আপনার ওয়ালেটে যুক্ত হয়েছে!`);
  };

  // Like Reel
  const handleToggleLike = (reelId: string) => {
    setLikedReelIds((prev) => {
      const next = prev.includes(reelId)
        ? prev.filter((id) => id !== reelId)
        : [...prev, reelId];

      localStorage.setItem('rt_liked_reels', JSON.stringify(next));
      return next;
    });
  };

  // Bookmark / Save Reel
  const handleToggleSave = (reelId: string) => {
    setSavedReelIds((prev) => {
      const alreadySaved = prev.includes(reelId);
      const next = alreadySaved ? prev.filter((id) => id !== reelId) : [...prev, reelId];
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

  // Claim Reel Reward (Instant 0ms + Atomic Firestore increment + Admin Limit Guard)
  const handleEarnReelReward = (rewardPoints: number, _reelTitle: string, explicitReelId?: string) => {
    // 1. Check master toggle & video earning toggle
    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isVideoWatchEarningEnabled) {
      showToast(lang === 'bn' ? '📺 বিনোদন মোড: পয়েন্ট আর্নিং সিস্টেম বর্তমানে বন্ধ রয়েছে।' : '📺 Entertainment mode: earning is currently disabled.');
      return;
    }

    const targetReelId = explicitReelId || fullScreenReelId || undefined;

    // 2. Check if target reel has earning enabled or matches offer filter
    const activeReel = targetReelId ? reels.find(r => r.id === targetReelId) : undefined;
    if (activeReel) {
      if (activeReel.isEarningEnabled === false) {
        showToast(lang === 'bn' ? '📺 এই রিলটিতে পয়েন্ট আর্নিং বন্ধ রয়েছে (শুধুমাত্র বিনোদন)।' : '📺 Earning is disabled for this reel.');
        return;
      }
      if (earningSettings.videoEarningScope === 'offer_reels_only' && !activeReel.isSpecialOffer) {
        showToast(lang === 'bn' ? '📺 শুধুমাত্র স্পেশাল অফার রিলগুলোতে পয়েন্ট প্রযোজ্য।' : '📺 Earning is only available for special offer reels.');
        return;
      }
    }

    if (!isAuthenticated) {
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

    // 4. Enforce Admin-controlled Daily Reel & Point Limits
    const activeUser = currentUserRef.current;
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
            ? `🔒 আজকের পয়েন্ট আর্নিং লিমিট শেষ (${toBengaliNumber(usedPoints, lang)}/${toBengaliNumber(dailyPointsLimit, lang)} পয়েন্ট)! আগামীকাল আবার পয়েন্ট পাবেন।`
            : `🔒 Daily point limit reached (${usedPoints}/${dailyPointsLimit} pts)! Try again tomorrow.`
        );
        return;
      }
    }

    const currentLevel = getUserLevel(activeUser.reelsWatchedCount);
    const multiplier = earningSettings.isLevelMultiplierEnabled ? currentLevel.multiplier : 1;
    const rawReward = Math.round(rewardPoints * multiplier);
    const finalReward =
      isReelLimitEnabled && dailyPointsLimit > 0
        ? Math.min(rawReward, Math.max(0, dailyPointsLimit - usedPoints))
        : rawReward;

    if (finalReward <= 0) {
      showToast(lang === 'bn' ? '🔒 আজকের পয়েন্ট লিমিট পূর্ণ হয়েছে!' : '🔒 Daily point limit reached!');
      return;
    }

    if (!isMuted) playCoinSound();

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
        } catch (e) {}
        
        showToast(
          lang === 'bn' 
            ? `🎊 অভিনন্দন! আপনি এখন ${nextLevelObj.nameBn}! বোনাস মাল্টিপ্লায়ার: ${toBengaliNumber(nextLevelObj.multiplier, lang)}x`
            : `🎊 Congrats! You've reached ${nextLevelObj.nameEn}! Bonus Multiplier: ${nextLevelObj.multiplier}x`
        );
      }, 600);
    }

    if (earningSettings.isReferralEnabled && newWatchedCount === 1 && activeUser.referredBy && !activeUser.referralBonusClaimed) {
      const findReferrerAndBonus = async () => {
        try {
          const referrerCode = activeUser.referredBy;
          const usersList = await getCollection('public_profiles', [where('referralCode', '==', referrerCode)]);
          if (usersList && usersList.length > 0) {
            const referrer = usersList[0] as User;
            const refBonus = earningSettings.referralRewardPoints || 50;
            setUsers((prev) =>
              prev.map((u) => (u.id === referrer.id ? { ...u, points: (u.points || 0) + refBonus } : u))
            );
            await updateDocument('users', referrer.id, {
              points: increment(refBonus)
            });
            await updateDocument('users', activeUser.id, {
              referralBonusClaimed: true
            });
            showToast(
              lang === 'bn'
                ? `🎁 রেফারেল বোনাস (+${toBengaliNumber(refBonus, lang)} পয়েন্ট) সফলভাবে সম্পন্ন হয়েছে!`
                : `🎁 Referral bonus (+${refBonus} pts) successful!`
            );
          }
        } catch (err) {
          console.error("Referral bonus error:", err);
        }
      };
      findReferrerAndBonus();
    }

    const nextClaimsToday = usedClaims + 1;
    const nextPointsToday = usedPoints + finalReward;

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
    }).catch((err) => console.warn('Reel reward sync error:', err));

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

  // Direct Claim from Feed (Respects Admin Daily Limit)
  const handleClaimDirect = (reel: Reel) => {
    if (!earningSettings.isMasterEarningEnabled || !earningSettings.isVideoWatchEarningEnabled || !earningSettings.allowDirectFeedClaim) {
      showToast(lang === 'bn' ? '📺 হোম ফিড থেকে ক্লেইম বা আর্নিং বন্ধ রয়েছে।' : '📺 Earning from feed is currently disabled.');
      return;
    }

    if (reel.isEarningEnabled === false) {
      showToast(lang === 'bn' ? '📺 এই রিলটিতে পয়েন্ট আর্নিং বন্ধ রয়েছে।' : '📺 Earning is disabled for this reel.');
      return;
    }

    if (earningSettings.videoEarningScope === 'offer_reels_only' && !reel.isSpecialOffer) {
      showToast(lang === 'bn' ? '📺 শুধুমাত্র স্পেশাল অফার রিলগুলোতে পয়েন্ট প্রযোজ্য।' : '📺 Earning only applies to special offer reels.');
      return;
    }

    if (!isAuthenticated) {
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
      showToast(lang === 'bn' ? 'আপনি ইতিমধ্যে এই রিলের পয়েন্ট সংগ্রহ করেছেন!' : 'Already collected points for this reel!');
      return;
    }

    if (isDailyReelLimitReached) {
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

    // Update comment counter on reel
    const reel = reels.find(r => r.id === reelId);
    if (reel) {
      updateDocument('reels', reelId, { commentsCount: reel.commentsCount + 1 });
    }
  };

  // Withdrawal Request (Instant 0ms deduction + atomic increment)
  const handleRequestWithdrawal = async (
    reqData: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    const activeUser = currentUserRef.current;
    if ((activeUser.points || 0) < reqData.pointsDeducted) {
      showToast(lang === 'bn' ? '⚠️ আপনার অ্যাকাউন্টে পর্যাপ্ত পয়েন্ট নেই!' : '⚠️ Insufficient points!');
      return;
    }

    const newReq: Partial<WithdrawalRequest> = {
      ...reqData,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Instant 0ms deduction
    applyFastUserMutation(-reqData.pointsDeducted);
    showToast(`💸 ৳${reqData.amountBDT} উত্তোলনের আবেদন পেন্ডিং রয়েছে।`);

    addDocument('withdrawals', newReq).catch((err) => {
      console.error('Withdrawal request error:', err);
    });
  };

  // Deposit Points (Manual Request)
  const handleSubmitDepositRequest = async (req: Omit<DepositRequest, 'id' | 'createdAt' | 'status' | 'userId' | 'userName' | 'userPhone'>) => {
    const newReq: Partial<DepositRequest> = {
      ...req,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    await addDocument('deposits', newReq);
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
    if (!isAuthenticated) {
      triggerAuthPrompt(
        lang === 'bn'
          ? 'গিফট পাঠাতে ও রিয়েল পয়েন্ট ব্যবহার করতে লগইন করুন!'
          : 'Please log in to send gifts!'
      );
      return;
    }
    const split = calculateGiftSplit(gift.costPoints, earningSettings);
    const creatorShare = split.creatorShare;
    const adminShare = split.adminShare;
    const userCashback = split.userCashback;
    const netCost = Math.max(0, gift.costPoints - userCashback);

    if ((currentUserRef.current.points || 0) < gift.costPoints) {
      showToast(lang === 'bn' ? '⚠️ পর্যাপ্ত পয়েন্ট নেই!' : '⚠️ Insufficient points!');
      return;
    }

    const resolvedTargetUserId = explicitTargetUserId ?? giftTarget?.userId;
    const resolvedLiveId = explicitLiveId ?? giftTarget?.liveId;
    const adminUid =
      earningSettings.adminCommissionReceiverId ||
      users.find((u) => u.role === 'admin')?.id ||
      '';

    const senderNetDelta =
      -netCost +
      (adminShare > 0 && adminUid && adminUid === currentUserRef.current.id ? adminShare : 0);

    applyFastUserMutation(senderNetDelta);

    if (resolvedTargetUserId && resolvedTargetUserId !== currentUserRef.current.id && creatorShare > 0) {
      setUsers((prev) =>
        prev.map((u) => (u.id === resolvedTargetUserId ? { ...u, points: (u.points || 0) + creatorShare } : u))
      );
      updateDocument('users', resolvedTargetUserId, { points: increment(creatorShare) }).catch((err) =>
        console.warn('Gift creator credit warning:', err)
      );
      sendNotification(
        resolvedTargetUserId,
        '🎁 উপহার পেয়েছেন',
        `অভিনন্দন! ${currentUserRef.current.name} আপনাকে ${gift.icon} ${gift.nameBn} উপহার দিয়েছেন (+${creatorShare} পয়েন্ট যুক্ত হয়েছে)।`,
        'general'
      );
    }

    if (adminShare > 0 && adminUid && adminUid !== currentUserRef.current.id) {
      setUsers((prev) =>
        prev.map((u) => (u.id === adminUid ? { ...u, points: (u.points || 0) + adminShare } : u))
      );
      updateDocument('users', adminUid, { points: increment(adminShare) }).catch((err) =>
        console.warn('Gift admin commission credit warning:', err)
      );
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

  const handleOpenUserProfile = async (userId: string) => {
    const userToView = users.find(u => u.id === userId);
    if (userToView) {
      setSelectedUserProfileUser(userToView);
      setIsUserProfileModalOpen(true);
    } else {
      if (!isAuthenticated) {
        triggerAuthPrompt(
          lang === 'bn'
            ? 'ক্রিয়েটরের পূর্ণ প্রোফাইল দেখতে অনুগ্রহ করে লগইন করুন!'
            : 'Please log in to view full creator profiles!'
        );
        return;
      }
      const remoteUser = await getDocument('public_profiles', userId) as User | null;
      if (remoteUser) {
        setSelectedUserProfileUser(remoteUser);
        setIsUserProfileModalOpen(true);
      } else {
        showToast(lang === 'bn' ? 'ইউজার প্রোফাইল পাওয়া যায়নি।' : 'User profile not found.');
      }
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

    try {
      await Promise.all([
        updateDocument('users', me.id, selfFollowPatch),
        updateDocument('public_profiles', me.id, selfFollowPatch).catch(() => {}),
      ]);
    } catch (err) {
      console.warn('Follow sync on self warning:', err);
    }

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
  };

  const handleOpenChat = async (otherUser: User) => {
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

  // Task Completion (Instant 0ms + atomic increment)
  const handleCompleteTask = (taskId: string, rewardPoints: number) => {
    if (!isAuthenticated || currentUserRef.current.id === INITIAL_USER.id) return;
    const currentCompleted = currentUserRef.current.completedTaskIds || [];
    if (!currentCompleted.includes(taskId)) {
      const updatedCompleted = [...currentCompleted, taskId];
      applyFastUserMutation(rewardPoints, { completedTaskIds: updatedCompleted });
      showToast(lang === 'bn' ? `🎉 টাস্ক সম্পন্ন হয়েছে! +${toBengaliNumber(rewardPoints, lang)} পয়েন্ট অর্জিত।` : `🎉 Task completed! +${rewardPoints} pts.`);
    }
  };

  // Add Points (e.g., from spin wheel or scratch card)
  const handleAddPointsGeneral = (pts: number, reason: string) => {
    updateUserPoints(pts);
    showToast(`🎉 ${reason}: +${pts} পয়েন্ট ওয়ালেটে যুক্ত হয়েছে!`);
  };

  const handleAddNewReel = async (
    newReelData: Pick<Reel, 'title' | 'userId' | 'creatorName' | 'creatorHandle' | 'creatorAvatar' | 'category' | 'thumbnailUrl' | 'videoUrl' | 'pointsReward' | 'audioTrack' | 'caption' | 'hashtags' | 'isVerified'>
  ) => {
    const newReel: Reel = {
      ...newReelData,
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
    setGoLiveInitialMode(mode);
    setShowGoLiveSetupModal(true);
  };

  const handleStartLive = async (payload: StartLivePayload) => {
    if (!isAuthenticated) return;

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
      hostAvatar: currentUser.avatar || INITIAL_USER.avatar,
      title: cleanTitle,
      mode: payload.mode,
      category: (payload.category || 'আড্ডা').slice(0, 50),
      pinnedNotice: (payload.pinnedNotice || '').slice(0, 240),
      isMicMuted: false,
      isCameraOn: payload.mode === 'video',
      chatEnabled: payload.chatEnabled !== false,
      allowSpeakerRequests: payload.allowSpeakerRequests !== false,
      viewersCount: 1,
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
    try {
      await Promise.all([
        updateDocument('users', updatedUser.id, updatedUser),
        updateDocument('public_profiles', updatedUser.id, toPublicProfile(updatedUser)).catch(() => {}),
      ]);
    } catch (err) {
      console.warn('Firestore update user note:', err);
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
      ? reels
      : reels.filter((r) => r.category === selectedCategory);

    if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'most_watched') {
      result = [...result].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    } else if (sortBy === 'popular') {
      result = [...result].sort((a, b) => b.likesCount - a.likesCount);
    }

    return result;
  })();

  // MANDATORY SECURITY GATES: Show loader during auth init, and enforce email verification whenever signed in
  if (authLoading) {
    return <FullPageLoader />;
  }

  if (firebaseUser && !emailVerified) {
    return (
      <EmailVerificationGate
        email={firebaseUser.email || ''}
        portal="user"
        lang={lang}
        onRefreshStatus={refreshVerificationStatus}
        onResendEmail={resendVerificationEmail}
        onLogout={firebaseLogout}
      />
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
          onOpenNotifications={() => setShowNotifications(true)}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          unreadAnnouncementsCount={personalNotifications.filter((n) => !n.read).length || 1}
          lang={lang}
          onToggleLang={toggleLang}
          isAuthenticated={isAuthenticated}
          onOpenAuth={(view) => openAuthModal(view || 'login')}
          userPoints={isAuthenticated ? currentUser.points : guestPoints}
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
                    {!isAuthenticated && (
                      <GuestBanner
                        guestId={guestId}
                        guestPoints={guestPoints}
                        onLogin={() => openAuthModal('login')}
                        onRegister={() => openAuthModal('register')}
                        lang={lang}
                      />
                    )}
                    {/* TOP STORIES / LIVE STREAMERS BAR (Always visible for fast live discovery) */}
                    <div className="space-y-2 pb-1 bg-[#0d1611]/80 -mx-1 px-3 py-2.5 rounded-3xl border border-emerald-950/60 shadow-lg">
                      <div className="flex items-center justify-between px-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                          <h3 className="text-xs font-black text-white flex items-center gap-1.5 tracking-wide">
                            <span>{lang === 'bn' ? 'সরাসরি লাইভ আড্ডা' : 'Live Streams'}</span>
                            {activeLiveStreams.length > 0 && (
                              <span className="bg-rose-600/90 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                                {toBengaliNumber(activeLiveStreams.length, lang)} {lang === 'bn' ? 'চলমান' : 'LIVE'}
                              </span>
                            )}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => openPersonalLiveStudio('audio')}
                          className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition active:scale-95 cursor-pointer bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/40"
                        >
                          <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                          <span>{lang === 'bn' ? '+ লাইভে যান' : '+ Go Live'}</span>
                        </button>
                      </div>

                      {/* Stories Horizontal Reel */}
                      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                        {/* 1. Host's Personal Live Tile */}
                        {(() => {
                          const myLive = activeLiveStreams.find(
                            (s) => s.hostId === currentUser.id || (firebaseUser && s.hostId === firebaseUser.uid)
                          );
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                if (myLive) {
                                  handleJoinLiveStream(myLive.id);
                                } else {
                                  openPersonalLiveStudio('audio');
                                }
                              }}
                              className="flex flex-col items-center gap-1.5 shrink-0 group transition active:scale-95 cursor-pointer"
                            >
                              <div className="relative">
                                <div className={`w-15 h-15 rounded-2xl p-[2.5px] overflow-hidden ${
                                  myLive
                                    ? 'bg-gradient-to-tr from-rose-500 via-amber-400 to-rose-600 animate-pulse ring-2 ring-rose-500/50'
                                    : 'bg-gradient-to-tr from-emerald-500 to-teal-400'
                                }`}>
                                  <img
                                    src={currentUser.avatar || INITIAL_USER.avatar}
                                    alt={currentUser.name}
                                    className="w-full h-full object-cover rounded-[13px] bg-black"
                                  />
                                </div>
                                <span className={`absolute -bottom-1 -right-1 text-[8px] font-black text-white px-1.5 py-0.5 rounded-md border border-black flex items-center gap-0.5 ${
                                  myLive ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'
                                }`}>
                                  {myLive ? <Radio className="w-2.5 h-2.5" /> : '+'}
                                  <span>{myLive ? (lang === 'bn' ? 'আমার' : 'MY LIVE') : (lang === 'bn' ? 'লাইভ' : 'GO')}</span>
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-neutral-200 truncate max-w-[68px]">
                                {myLive ? (lang === 'bn' ? 'আমার লাইভ 🔴' : 'My Live') : (lang === 'bn' ? 'লাইভে যান' : 'Go Live')}
                              </span>
                            </button>
                          );
                        })()}

                        {/* 2. All Active Live Streams from Other Users */}
                        {activeLiveStreams
                          .filter((live) => live.hostId !== currentUser.id && (!firebaseUser || live.hostId !== firebaseUser.uid))
                          .map((live) => (
                            <button
                              key={live.id}
                              type="button"
                              onClick={() => handleJoinLiveStream(live.id)}
                              className="flex flex-col items-center gap-1.5 shrink-0 group transition active:scale-95 cursor-pointer"
                            >
                              <div className="relative">
                                <div className={`w-15 h-15 rounded-2xl p-[2.5px] overflow-hidden shadow-lg ${
                                  live.mode === 'audio'
                                    ? 'bg-gradient-to-tr from-emerald-500 via-cyan-400 to-teal-400 ring-2 ring-emerald-500/40'
                                    : 'bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-400 animate-pulse ring-2 ring-rose-500/50'
                                }`}>
                                  <img
                                    src={live.hostAvatar || INITIAL_USER.avatar}
                                    alt={live.hostName}
                                    className="w-full h-full object-cover rounded-[13px] border border-black/30 bg-neutral-900"
                                  />
                                </div>
                                {/* Top Viewers Badge */}
                                <span className="absolute -top-1 -right-1 bg-black/80 text-[8px] font-black text-rose-300 px-1 py-0.5 rounded-md border border-rose-500/40 flex items-center gap-0.5">
                                  <Users className="w-2 h-2 text-rose-400" />
                                  <span>{toBengaliNumber(live.viewersCount || 1, lang)}</span>
                                </span>
                                {/* Bottom Mode Badge */}
                                <span className={`absolute -bottom-1 -left-1 text-[8px] font-black text-white px-1 py-0.5 rounded-md border border-black flex items-center gap-0.5 ${
                                  live.mode === 'audio' ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}>
                                  {live.mode === 'audio' ? <Mic className="w-2 h-2" /> : <Video className="w-2 h-2" />}
                                  <span>{live.mode === 'audio' ? 'অডিও' : 'LIVE'}</span>
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-neutral-200 truncate max-w-[68px]">
                                {live.hostName}
                              </span>
                            </button>
                          ))}

                        {/* If no other lives, show friendly invite pill */}
                        {activeLiveStreams.filter((l) => l.hostId !== currentUser.id && (!firebaseUser || l.hostId !== firebaseUser.uid)).length === 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#122018]/60 border border-emerald-950/60 text-neutral-400 text-[11px] shrink-0">
                            <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{lang === 'bn' ? 'বন্ধুরা লাইভের অপেক্ষায় • আপনিই প্রথম শুরু করুন!' : 'No live active. Start your personal live!'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* HERO FEATURED LIVE BROADCAST BANNER (When any live is active) */}
                    {activeLiveStreams.length > 0 && (
                      <div className="relative overflow-hidden rounded-3xl p-3.5 bg-gradient-to-br from-[#1a080c] via-[#121c16] to-[#0a150f] border-2 border-rose-500/60 shadow-xl shadow-rose-950/30 text-white animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                            </span>
                            <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                              🔴 {activeLiveStreams[0].mode === 'audio' ? 'সরাসরি অডিও আড্ডা' : 'সরাসরি লাইভ ভিডিও'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-rose-300 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-rose-900/40">
                            <Users className="w-3 h-3 text-rose-400" />
                            <span>{toBengaliNumber(activeLiveStreams[0].viewersCount || 1, lang)} {lang === 'bn' ? 'জন সরাসরি যুক্ত' : 'watching'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className={`w-14 h-14 rounded-2xl p-[2px] ${
                              activeLiveStreams[0].mode === 'audio'
                                ? 'bg-gradient-to-tr from-emerald-500 to-cyan-400'
                                : 'bg-gradient-to-tr from-rose-500 to-amber-400'
                            }`}>
                              <img
                                src={activeLiveStreams[0].hostAvatar || INITIAL_USER.avatar}
                                alt={activeLiveStreams[0].hostName}
                                className="w-full h-full object-cover rounded-[13px] bg-neutral-900"
                              />
                            </div>
                            {/* Animated Equalizer Visualizer */}
                            <div className="absolute -bottom-1 -right-1 bg-black/90 px-1 py-0.5 rounded flex items-end gap-0.5 border border-rose-500/50">
                              <span className="w-0.5 h-2 bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-0.5 h-3.5 bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-0.5 h-2.5 bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-white truncate">
                                {activeLiveStreams[0].hostName}
                              </h4>
                              <span className="text-[10px] text-emerald-400 font-bold shrink-0">✓</span>
                              <span className="text-[9px] text-neutral-400 font-semibold px-1.5 py-0.2 rounded bg-white/5 shrink-0">
                                {activeLiveStreams[0].category || 'আড্ডা'}
                              </span>
                            </div>
                            <p className="text-[11px] font-extrabold text-neutral-100 truncate mt-0.5">
                              {activeLiveStreams[0].title || (lang === 'bn' ? 'বন্ধুদের সাথে আড্ডা ও সরাসরি কথোপকথন' : 'Live conversation')}
                            </p>
                            {activeLiveStreams[0].pinnedNotice && (
                              <p className="text-[10px] text-amber-300/90 truncate mt-0.5">
                                📌 {activeLiveStreams[0].pinnedNotice}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Direct Watch Button */}
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleJoinLiveStream(activeLiveStreams[0].id)}
                            className="flex-1 min-h-[38px] rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-110 font-black text-xs text-white shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{lang === 'bn' ? 'সরাসরি যুক্ত হন ও দেখুন' : 'Watch Live Now'}</span>
                          </button>
                          {activeLiveStreams.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSelectedCategory('🔴 লাইভ')}
                              className="px-3 min-h-[38px] rounded-2xl bg-white/10 hover:bg-white/15 text-[11px] font-bold text-neutral-200 border border-white/10 shrink-0 cursor-pointer"
                            >
                              +{toBengaliNumber(activeLiveStreams.length - 1, lang)} {lang === 'bn' ? 'অন্যান্য' : 'more'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Category Pills */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                            selectedCategory === cat
                              ? cat === '🔴 লাইভ'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                                : 'bg-[#00c853] text-black shadow-md shadow-emerald-500/25'
                              : cat === '🔴 লাইভ' && activeLiveStreams.length > 0
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40 animate-pulse'
                              : 'bg-[#15231c] text-neutral-300 hover:text-white border border-emerald-950'
                          }`}
                        >
                          <span>{cat}</span>
                          {cat === '🔴 লাইভ' && activeLiveStreams.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                          )}
                        </button>
                      ))}
                    </div>

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
                                      src={live.hostAvatar || INITIAL_USER.avatar}
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
                        {/* Section Title Header */}
                        <div className="flex items-center justify-between pt-1">
                          <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                            <span>{lang === 'bn' ? 'ReelPay BD' : "ReelPay BD"}</span>
                          </h2>
                          <div className="flex items-center gap-3">
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value as any)}
                              className="bg-[#15231c] text-[10px] font-bold text-emerald-400 border border-emerald-950/60 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-[#1a2b22] transition-colors"
                            >
                              <option value="newest">{lang === 'bn' ? 'নতুন' : 'Newest'}</option>
                              <option value="most_watched">{lang === 'bn' ? 'বেশি দেখা' : 'Most Watched'}</option>
                              <option value="popular">{lang === 'bn' ? 'জনপ্রিয়' : 'Popular'}</option>
                            </select>
                            <button
                              onClick={() => setSelectedCategory('সকল')}
                              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{lang === 'bn' ? 'আরও দেখুন' : 'See more'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Feed List of Reels matching Screenshot 1 + Download + Gift */}
                        <div className="space-y-1">
                          {filteredReels.length === 0 ? (
                            <div className="text-center py-12 text-neutral-400 text-xs">
                              {lang === 'bn' ? 'এই ক্যাটাগরিতে কোনো রিল পাওয়া যায়নি।' : 'No reels in this category.'}
                            </div>
                          ) : (
                            filteredReels.map((reel, rIdx) => (
                              <React.Fragment key={reel.id}>
                                <ReelFeedCard
                                  reel={reel}
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
                                />

                                {/* In-feed Live Recommendation Interstitial Card after 1st reel */}
                                {rIdx === 0 && activeLiveStreams.length > 0 && (
                                  <div
                                    onClick={() => handleJoinLiveStream(activeLiveStreams[0].id)}
                                    className="my-2 p-3.5 rounded-3xl bg-gradient-to-r from-rose-950/60 via-[#13221a] to-[#0d1611] border border-rose-500/40 shadow-lg flex items-center justify-between cursor-pointer hover:border-rose-400/60 transition group"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="relative shrink-0">
                                        <img
                                          src={activeLiveStreams[0].hostAvatar || INITIAL_USER.avatar}
                                          alt={activeLiveStreams[0].hostName}
                                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-rose-500 animate-pulse"
                                        />
                                        <span className="absolute -bottom-1 -right-1 bg-rose-600 text-[8px] font-black text-white px-1 py-0.2 rounded border border-black">
                                          LIVE
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                                            <span>{activeLiveStreams[0].mode === 'audio' ? 'অডিও আড্ডা' : 'লাইভ ভিডিও'}</span>
                                          </span>
                                          <span className="text-[10px] text-neutral-400">• {toBengaliNumber(activeLiveStreams[0].viewersCount || 1, lang)} জন যুক্ত</span>
                                        </div>
                                        <h4 className="text-xs font-black text-white truncate mt-0.5">
                                          {activeLiveStreams[0].hostName}: {activeLiveStreams[0].title}
                                        </h4>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="px-3 py-1.5 rounded-xl bg-rose-600 group-hover:bg-rose-500 text-white font-black text-[11px] shrink-0 shadow flex items-center gap-1 cursor-pointer"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>দেখুন</span>
                                    </button>
                                  </div>
                                )}
                              </React.Fragment>
                            ))
                          )}
                        </div>
                      </>
                    )}

                    {/* LIVE STREAM HIGHLIGHT CARD matching prompt - moved to ProfileView */}
                    {/*
                    <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-950/40 via-[#19221d] to-[#121c17] border-2 border-[#ff2d55] shadow-lg mt-3 text-white">
                      <span className="bg-[#ff2d55] text-white px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-sm animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        <span>🔴 LIVE • {toBengaliNumber('2.3', lang)} {lang === 'bn' ? 'হাজার দেখছে' : 'k watching'}</span>
                      </span>

                      <div className="mt-3">
                        <b className="text-base font-extrabold text-white block">
                          {lang === 'bn' ? 'আরিয়ান লাইভে আছে 🎤' : 'Aryan is LIVE 🎤'}
                        </b>
                        <p className="text-xs text-neutral-400 mt-1">
                          {lang === 'bn' ? 'লাইভ দেখে ভালো লাগলে গিফট পাঠান!' : 'Watch live stream and send gifts to support!'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-neutral-800">
                        <button
                          onClick={() => {
                            if (!isAuthenticated) {
                              triggerAuthPrompt(
                                lang === 'bn'
                                  ? 'লাইভে গিফট পাঠাতে অনুগ্রহ করে লগইন বা রেজিস্ট্রেশন করুন!'
                                  : 'Login or register to send live gifts!'
                              );
                              return;
                            }
                            setShowGiftSheet(true);
                          }}
                          className="py-2.5 rounded-xl font-bold text-xs bg-[#ff2d55] hover:bg-[#e0264b] text-white transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <span>🎁 {lang === 'bn' ? 'লাইভে গিফট পাঠান' : 'Send Gift'}</span>
                        </button>
                        <button
                          onClick={() => setShowLiveSheet(true)}
                          className="py-2.5 rounded-xl font-bold text-xs bg-[#00c853] hover:bg-[#00e676] text-black transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <span>👁️ {lang === 'bn' ? 'লাইভ দেখুন' : 'Watch Live'}</span>
                        </button>
                      </div>
                    </div>
                    */}
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
                      spinPrizes={[10, 25, 50, 15, spinMaxPrize, 30, 20, Math.round(spinMaxPrize * 0.4)]}
                      scratchPrize={scratchPrize}
                      earningSettings={earningSettings}
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
                      onRequestWithdrawal={handleRequestWithdrawal}
                      onDepositClick={() => setShowDepositSheet(true)}
                      isMuted={isMuted}
                      minWithdrawal={minWithdrawal}
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
                      reels={reels}
                      onOpenReel={(r) => setFullScreenReelId(r.id)}
                      onEditReel={(r) => setEditingReel(r)}
                      onDeleteReel={handleDeleteReel}
                      onOpenChatList={() => setIsChatListModalOpen(true)}
                      onOpenFollowList={(tab) => setFollowListModal({ user: currentUser, tab })}
                      onOpenWallet={() => setActiveTab('wallet')}
                      minWithdrawal={minWithdrawal}
                      earningSettings={earningSettings}
                      savedReelIds={savedReelIds}
                      onToggleSave={handleToggleSave}
                      onNavigateToHome={() => setActiveTab('home')}
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
          {fullScreenReelId && (
            <FullScreenReelModal
              reels={reels}
              initialReelId={fullScreenReelId}
              onClose={() => setFullScreenReelId(null)}
              isLiked={likedReelIds.includes(fullScreenReelId)}
              onToggleLike={handleToggleLike}
              onOpenComments={(r) => setActiveCommentReel(r)}
              onRewardEarned={handleEarnReelReward}
              onOpenGiftSheet={() => {
                if (!isAuthenticated) {
                  triggerAuthPrompt(
                    lang === 'bn'
                      ? 'ক্রিয়েটরকে গিফট পাঠাতে অনুগ্রহ করে রিয়েল আইডিতে লগইন করুন!'
                      : 'Please log in to send gifts!'
                  );
                  return;
                }
                const targetReel = reels.find((r) => r.id === fullScreenReelId);
                if (targetReel) {
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
              onOpenChatWithCreator={async (creatorId) => {
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
          )}

          {/* Edit Reel Modal */}
          {editingReel && (
            <EditReelModal
              reel={editingReel}
              isOpen={!!editingReel}
              onClose={() => setEditingReel(null)}
              onUpdateReel={handleUpdateReel}
              lang={lang}
              isMuted={isMuted}
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
            />
          )}

          {showNotifications && (
            <NotificationModal
              announcement={announcement}
              personalNotifications={personalNotifications}
              onClose={() => setShowNotifications(false)}
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
            />
          )}

          {/* Personal Live Stream Room (Audio Adda & Video Live) */}
          {showLiveSheet && (
            <LiveStreamSheet
              isOpen={showLiveSheet}
              onClose={() => setShowLiveSheet(false)}
              onOpenGift={(stream) => {
                setGiftTarget({
                  userId: stream.hostId,
                  liveId: stream.id,
                  creatorName: stream.hostName,
                });
                setShowGiftSheet(true);
              }}
              onQuickGift={(gift, stream) => {
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

          {/* Floating Live Stream Ticker (When live stream is active and user is browsing feed) */}
          {activeLiveStreams.length > 0 && !showLiveSheet && (
            <button
              type="button"
              onClick={() => handleJoinLiveStream(activeLiveStreams[0].id)}
              className="fixed bottom-20 right-3 z-40 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white px-3.5 py-2 rounded-full shadow-2xl border-2 border-black/40 flex items-center gap-2 cursor-pointer hover:scale-105 transition active:scale-95 animate-pulse"
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
              allReels={reels}
              onOpenReel={(r) => {
                setFullScreenReelId(r.id);
                setIsUserProfileModalOpen(false);
              }}
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
              allReels={reels}
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
        {showAuthModal && !isAuthenticated && (
          <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#0a0f0d]">
            <AuthPage
              onEmailLogin={loginWithEmail}
              onEmailRegister={handleUserEmailRegister}
              onGoogleLogin={handleUserGoogleLogin}
              onResetPassword={resetPassword}
              onClose={() => setShowAuthModal(false)}
              initialView={authModalView}
              lang={lang}
            />
          </div>
        )}
      </div>
    </div>
  );
}
