import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Mail,
  Lock,
  LogIn,
  LogOut,
  Loader2,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { orderBy, increment } from 'firebase/firestore';
import { useFirebase, formatFirebaseAuthError } from '../hooks/useFirebase';
import { EmailVerificationGate } from './EmailVerificationGate';
import { AdminPanel } from './AdminPanel';
import { EditReelModal } from './EditReelModal';
import { LiveStreamSheet } from './LiveStreamSheet';
import {
  User,
  Reel,
  WithdrawalRequest,
  DepositRequest,
  TaskItem,
  EarningSettings,
  DEFAULT_EARNING_SETTINGS,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_PAYMENT_METHODS,
  LiveStream,
  ChatSession,
  Notification,
} from '../types';
import { INITIAL_REELS, INITIAL_TASKS, INITIAL_USER } from '../data/initialData';
import { playSuccessChime } from '../utils/audio';
import { toBengaliNumber } from '../utils/bengali';
import { normalizeVideoUrl } from '../utils/video';

export const AdminPortal: React.FC = () => {
  const {
    user: firebaseUser,
    emailVerified,
    loading: authLoading,
    authError: redirectAuthError,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resendVerificationEmail,
    refreshVerificationStatus,
    resetPassword,
    logout,
    verifyAdminAccess,
    getDocument,
    setDocument,
    updateDocument,
    deleteDocument,
    addDocument,
    onSnapshot: firebaseOnSnapshot,
  } = useFirebase();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  useEffect(() => {
    if (redirectAuthError) {
      setAuthError(formatFirebaseAuthError(redirectAuthError, 'bn'));
    }
  }, [redirectAuthError]);

  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Admin data states
  const [users, setUsers] = useState<User[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [activeLiveStreams, setActiveLiveStreams] = useState<LiveStream[]>([]);
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [currentLiveStreamId, setCurrentLiveStreamId] = useState<string | null>(null);
  const [showLiveSheet, setShowLiveSheet] = useState(false);

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
      return val || '📢 আজকের স্পেশাল অফার! প্রতিটি রিল দেখলে ইনস্ট্যান্ট ১০ পয়েন্ট।';
    } catch {
      return '📢 আজকের স্পেশাল অফার! প্রতিটি রিল দেখলে ইনস্ট্যান্ট ১০ পয়েন্ট।';
    }
  });
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
  const [earningSettings, setEarningSettings] = useState<EarningSettings>(() => {
    try {
      const saved = localStorage.getItem('rt_earning_settings');
      return saved ? { ...DEFAULT_EARNING_SETTINGS, ...JSON.parse(saved) } : DEFAULT_EARNING_SETTINGS;
    } catch {
      return DEFAULT_EARNING_SETTINGS;
    }
  });
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
              : DEFAULT_PAYMENT_METHODS,
        };
      }
    } catch {}
    return {
      ...DEFAULT_SITE_SETTINGS,
      pointRate,
      minWithdrawal,
      announcement,
      paymentMethods: DEFAULT_PAYMENT_METHODS.map((pm) => {
        if (pm.name === 'bKash') return { ...pm, accountNumber: adminPaymentNumbers.bKash };
        if (pm.name === 'Nagad') return { ...pm, accountNumber: adminPaymentNumbers.Nagad };
        if (pm.name === 'Rocket') return { ...pm, accountNumber: adminPaymentNumbers.Rocket };
        return pm;
      }),
    };
  });

  const adminIdRef = useRef<string>('');
  adminIdRef.current = firebaseUser?.uid || '';

  const resolvedEmail = (
    firebaseUser?.email ||
    firebaseUser?.providerData?.find((p) => p.email)?.email ||
    ''
  ).toLowerCase();

  // Verify admin authority strictly via server-side Firestore rules (zero client email exposure)
  useEffect(() => {
    let cancelled = false;
    if (!firebaseUser || !emailVerified) {
      setIsAuthorizedAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    const verifyAdmin = async () => {
      setCheckingAdmin(true);
      try {
        const allowed = await verifyAdminAccess();
        if (!cancelled) {
          setIsAuthorizedAdmin(allowed);
        }
      } catch {
        if (!cancelled) {
          setIsAuthorizedAdmin(false);
        }
      } finally {
        if (!cancelled) setCheckingAdmin(false);
      }
    };

    verifyAdmin();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid, emailVerified, verifyAdminAccess]);

  // Ensure admin commission UID is synced AFTER settings load from Firestore
  useEffect(() => {
    if (
      settingsLoaded &&
      isAuthorizedAdmin &&
      firebaseUser?.uid &&
      earningSettings.adminCommissionReceiverId !== firebaseUser.uid
    ) {
      setDocument('settings', 'earning', {
        ...earningSettings,
        id: 'earning',
        adminCommissionReceiverId: firebaseUser.uid,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }, [settingsLoaded, isAuthorizedAdmin, firebaseUser?.uid, earningSettings.adminCommissionReceiverId]);

  // Attach Firestore listeners ONLY when emailVerified AND isAuthorizedAdmin
  useEffect(() => {
    if (!isAuthorizedAdmin || !firebaseUser || !emailVerified) return;

    const unsubUsers = firebaseOnSnapshot('users', (data) => {
      setUsers(data as User[]);
    });

    const unsubWithdrawals = firebaseOnSnapshot(
      'withdrawals',
      (data) => setWithdrawals(data as WithdrawalRequest[]),
      [orderBy('createdAt', 'desc')]
    );

    const unsubDeposits = firebaseOnSnapshot(
      'deposits',
      (data) => setDepositRequests(data as DepositRequest[]),
      [orderBy('createdAt', 'desc')]
    );

    const unsubReels = firebaseOnSnapshot(
      'reels',
      (data) => {
        if (data && data.length > 0) {
          const loaded = (data as Reel[])
            .filter((r) => r.id !== 'reel_01' && r.id !== 'reel_02')
            .map((r, idx) => ({
              ...r,
              videoUrl: normalizeVideoUrl(r.videoUrl, idx) ?? r.videoUrl,
            }));
          setReels(loaded.length > 0 ? loaded : INITIAL_REELS);
        } else {
          setReels(INITIAL_REELS);
        }
      },
      [orderBy('createdAt', 'desc')]
    );

    const unsubTasks = firebaseOnSnapshot('tasks', (data) => {
      setTasks(data && data.length > 0 ? (data as TaskItem[]) : INITIAL_TASKS);
    });

    const unsubSettings = firebaseOnSnapshot('settings', (data) => {
      const docs = (data || []) as any[];
      const earningDoc = docs.find((d) => d.id === 'earning');
      if (earningDoc) {
        setEarningSettings((prev) => ({ ...prev, ...earningDoc }));
        if (typeof earningDoc.spinMaxPrize === 'number') setSpinMaxPrize(earningDoc.spinMaxPrize);
        if (typeof earningDoc.scratchCardPrize === 'number') setScratchPrize(earningDoc.scratchCardPrize);
        try {
          localStorage.setItem('rt_earning_settings', JSON.stringify(earningDoc));
        } catch {}
      }
      const siteDoc = docs.find((d) => d.id === 'site');
      if (siteDoc) {
        const mergedSite: SiteSettings = {
          ...DEFAULT_SITE_SETTINGS,
          ...siteDoc,
          paymentMethods:
            Array.isArray(siteDoc.paymentMethods) && siteDoc.paymentMethods.length > 0
              ? siteDoc.paymentMethods
              : DEFAULT_PAYMENT_METHODS,
        };
        setSiteSettings(mergedSite);
        setPointRate(mergedSite.pointRate);
        setMinWithdrawal(mergedSite.minWithdrawal);
        setAnnouncement(mergedSite.announcement);
        const bk = mergedSite.paymentMethods.find((m) => m.name === 'bKash')?.accountNumber || adminPaymentNumbers.bKash;
        const ng = mergedSite.paymentMethods.find((m) => m.name === 'Nagad')?.accountNumber || adminPaymentNumbers.Nagad;
        const rk = mergedSite.paymentMethods.find((m) => m.name === 'Rocket')?.accountNumber || adminPaymentNumbers.Rocket;
        setAdminPaymentNumbers({ bKash: bk, Nagad: ng, Rocket: rk });
        try {
          localStorage.setItem('rt_site_settings', JSON.stringify(mergedSite));
          localStorage.setItem('rt_point_rate', String(mergedSite.pointRate));
          localStorage.setItem('rt_min_withdrawal', String(mergedSite.minWithdrawal));
          localStorage.setItem('rt_announcement', mergedSite.announcement);
          localStorage.setItem('rt_payment_numbers', JSON.stringify({ bKash: bk, Nagad: ng, Rocket: rk }));
        } catch {}
      }
      setSettingsLoaded(true);
    });

    const unsubLives = firebaseOnSnapshot('live_streams', (data) => {
      setActiveLiveStreams(
        (data as LiveStream[])
          .filter((s) => s && s.status === 'active')
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      );
    });

    return () => {
      unsubUsers();
      unsubWithdrawals();
      unsubDeposits();
      unsubReels();
      unsubTasks();
      unsubSettings();
      unsubLives();
    };
  }, [isAuthorizedAdmin, firebaseUser?.uid, emailVerified]);

  const handleAdminEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    if (!loginEmail.trim() || !loginPass) {
      setAuthError('এডমিন ইমেইল এবং পাসওয়ার্ড দিন।');
      return;
    }
    if (authMode === 'register' && loginPass.length < 6) {
      setAuthError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    setAuthSubmitting(true);
    if (authMode === 'register') {
      const res = await registerWithEmail(loginEmail.trim(), loginPass, 'Admin');
      if (res.error) {
        setAuthError(formatFirebaseAuthError(res.error, 'bn'));
      }
    } else {
      const res = await loginWithEmail(loginEmail.trim(), loginPass);
      if (res.error) {
        setAuthError(formatFirebaseAuthError(res.error, 'bn'));
      }
    }
    setAuthSubmitting(false);
  };

  const handleAdminGoogleLogin = async () => {
    if (authSubmitting) return;
    setAuthError(null);
    setAuthInfo(null);
    setAuthSubmitting(true);
    const res = await loginWithGoogle();
    if (res.redirecting) {
      setAuthInfo('Google সাইন-ইন পেজে নিয়ে যাওয়া হচ্ছে...');
      return;
    }
    if (res.error) {
      setAuthError(formatFirebaseAuthError(res.error, 'bn'));
    }
    setAuthSubmitting(false);
  };

  const handleAdminForgotPassword = async () => {
    setAuthError(null);
    setAuthInfo(null);
    if (!loginEmail.trim()) {
      setAuthError('পাসওয়ার্ড রিসেট করতে প্রথমে ইমেইল লিখুন।');
      return;
    }
    setAuthSubmitting(true);
    const res = await resetPassword(loginEmail.trim());
    if (res.ok) {
      setAuthInfo('পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে।');
    } else {
      setAuthError(formatFirebaseAuthError(res.error, 'bn'));
    }
    setAuthSubmitting(false);
  };

  const sendNotification = async (
    userId: string,
    title: string,
    message: string,
    type: Notification['type']
  ) => {
    try {
      await addDocument(`users/${userId}/notifications`, {
        userId,
        title,
        message,
        type,
        createdAt: new Date().toISOString(),
        read: false,
      });
    } catch (err) {
      console.warn('Notification send failed:', err);
    }
  };

  // Admin Action Handlers
  const handleApproveWithdrawal = async (id: string) => {
    const w = withdrawals.find((req) => req.id === id);
    if (!w) return;
    const trxId = `TRX${Math.floor(10000000 + Math.random() * 90000000)}`;
    setWithdrawals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved', transactionId: trxId } : item))
    );
    playSuccessChime();
    showToast('✅ উইথড্রয়াল অনুমোদন করা হয়েছে!');
    try {
      await Promise.all([
        updateDocument('users', w.userId, { totalWithdrawn: increment(w.amountBDT) }),
        updateDocument('withdrawals', id, { status: 'approved', transactionId: trxId }),
      ]);
      sendNotification(
        w.userId,
        '💸 উত্তোলন সফল',
        `আপনার ৳${w.amountBDT} উত্তোলনের আবেদনটি সফলভাবে সম্পন্ন হয়েছে।`,
        'withdrawal'
      );
    } catch (err) {
      console.warn('Approve withdrawal sync warning:', err);
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    const req = withdrawals.find((w) => w.id === id);
    if (!req) return;
    setWithdrawals((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item)));
    showToast('❌ রিকোয়েস্ট বাতিল করা হয়েছে এবং পয়েন্ট ফেরত দেওয়া হয়েছে।');
    try {
      await Promise.all([
        updateDocument('users', req.userId, { points: increment(req.pointsDeducted) }),
        updateDocument('public_profiles', req.userId, { points: increment(req.pointsDeducted) }).catch(() => {}),
        updateDocument('withdrawals', id, { status: 'rejected' }),
      ]);
      sendNotification(
        req.userId,
        '❌ উত্তোলন বাতিল',
        `আপনার ৳${req.amountBDT} উত্তোলনের আবেদনটি বাতিল করা হয়েছে এবং পয়েন্ট ফেরত দেওয়া হয়েছে।`,
        'withdrawal'
      );
    } catch (err) {
      console.warn('Reject withdrawal sync warning:', err);
    }
  };

  const handleApproveDeposit = async (id: string) => {
    const req = depositRequests.find((d) => d.id === id);
    if (!req) return;
    setDepositRequests((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'approved' } : d)));
    playSuccessChime();
    showToast('✅ ডিপোজিট অনুমোদন করা হয়েছে এবং পয়েন্ট যোগ করা হয়েছে!');
    try {
      await Promise.all([
        updateDocument('users', req.userId, { points: increment(req.pointsToAdd) }),
        updateDocument('public_profiles', req.userId, { points: increment(req.pointsToAdd) }).catch(() => {}),
        updateDocument('deposits', id, { status: 'approved' }),
      ]);
      sendNotification(
        req.userId,
        '✅ ডিপোজিট সফল',
        `আপনার ৳${req.amountBDT} ডিপোজিট সফল হয়েছে (+${req.pointsToAdd} পয়েন্ট)।`,
        'deposit'
      );
    } catch (err) {
      console.warn('Approve deposit sync warning:', err);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    const req = depositRequests.find((d) => d.id === id);
    setDepositRequests((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'rejected' } : d)));
    showToast('❌ ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে।');
    if (req) {
      sendNotification(
        req.userId,
        '❌ ডিপোজিট বাতিল',
        `আপনার ৳${req.amountBDT} ডিপোজিট রিকোয়েস্টটি বাতিল করা হয়েছে।`,
        'deposit'
      );
    }
    await updateDocument('deposits', id, { status: 'rejected' }).catch(() => {});
  };

  const handleAddNewReel = async (
    newReelData: Omit<Reel, 'id' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'viewsCount' | 'createdAt' | 'timeAgo'>
  ) => {
    const newReel: Reel = {
      ...newReelData,
      id: `reel_${Date.now()}`,
      userId: newReelData.userId || firebaseUser?.uid || '',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      timeAgo: 'এখনো',
    };
    setReels((prev) => [newReel, ...prev]);
    await addDocument('reels', newReel).catch((err) => console.warn('Add reel sync warning:', err));
    showToast('🎉 রিলটি সফলভাবে পাবলিশ হয়েছে!');
  };

  const handleUpdateReel = async (reelId: string, updatedData: Partial<Reel>) => {
    setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, ...updatedData } : r)));
    playSuccessChime();
    showToast('✅ রিলটি সফলভাবে আপডেট হয়েছে!');
    await updateDocument('reels', reelId, updatedData).catch((err) =>
      console.warn('Update reel sync warning:', err)
    );
  };

  const handleDeleteReel = async (reel: Reel, reason?: string) => {
    setReels((prev) => prev.filter((r) => r.id !== reel.id));
    playSuccessChime();
    showToast('🗑️ রিলটি সফলভাবে মুছে ফেলা হয়েছে।');
    try {
      await deleteDocument('reels', reel.id);
      if (reel.userId) {
        sendNotification(
          reel.userId,
          '⚠️ ভিডিও অপসারণ করা হয়েছে',
          `আপনার "${reel.title}" ভিডিওটি অপসারণ করা হয়েছে। ${reason ? `কারণ: ${reason}` : ''}`,
          'reel_deleted'
        );
      }
    } catch (err) {
      console.warn('Delete reel note:', err);
    }
  };

  const handleGiveUserBonus = async (userId: string, pointsDelta: number) => {
    const targetUser = users.find((u) => u.id === userId);
    const currentPts = targetUser?.points ?? 0;
    const effectiveDelta = pointsDelta < 0 ? -Math.min(currentPts, Math.abs(pointsDelta)) : pointsDelta;
    if (effectiveDelta === 0) {
      showToast('⚠️ পয়েন্ট পরিবর্তন শূন্য হতে পারবে না!');
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, points: Math.max(0, (u.points || 0) + effectiveDelta) } : u))
    );
    if (effectiveDelta > 0) playSuccessChime();
    showToast(
      effectiveDelta > 0
        ? `🎉 +${toBengaliNumber(effectiveDelta)} পয়েন্ট যোগ করা হয়েছে!`
        : `➖ ${toBengaliNumber(Math.abs(effectiveDelta))} পয়েন্ট কমানো হয়েছে!`
    );
    await Promise.all([
      updateDocument('users', userId, { points: increment(effectiveDelta) }).catch((err) =>
        console.warn('Bonus sync warning:', err)
      ),
      updateDocument('public_profiles', userId, { points: increment(effectiveDelta) }).catch(() => {}),
    ]);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
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
    await Promise.all([
      updateDocument('users', updatedUser.id, updatedUser).catch(() => {}),
      updateDocument('public_profiles', updatedUser.id, {
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        isVerified: updatedUser.isVerified,
        role: updatedUser.role || 'user',
        points: updatedUser.points || 0,
        followersCount: updatedUser.followersCount || 0,
        followingCount: updatedUser.followingCount || 0,
        referralsCount: updatedUser.referralsCount || 0,
        referralEarnedPoints: updatedUser.referralEarnedPoints || 0,
      }).catch(() => {}),
      ...ownedReels.map((r) =>
        updateDocument('reels', r.id, {
          creatorName: updatedUser.name,
          creatorAvatar: updatedUser.avatar,
          isVerified: Boolean(updatedUser.isVerified),
        }).catch(() => {})
      ),
    ]);
    showToast('✅ ইউজার প্রোফাইল আপডেট করা হয়েছে!');
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    await Promise.all([
      deleteDocument('users', userId).catch(() => {}),
      deleteDocument('public_profiles', userId).catch(() => {}),
    ]);
    showToast(`🗑️ ${userName} কে সফলভাবে রিমুভ করা হয়েছে!`);
  };

  const handleAddTask = async (newTaskData: Omit<TaskItem, 'id' | 'completed'>) => {
    await addDocument('tasks', {
      ...newTaskData,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    showToast('✅ নতুন টাস্ক যোগ করা হয়েছে!');
  };

  const handleEditTask = async (task: TaskItem) => {
    await updateDocument('tasks', task.id, task);
    showToast('✅ টাস্ক আপডেট করা হয়েছে!');
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteDocument('tasks', taskId);
    showToast('🗑️ টাস্ক মুছে ফেলা হয়েছে!');
  };

  const handleSendDirectMessage = async (targetUserId: string, _title: string, message: string) => {
    const adminId = firebaseUser?.uid || 'admin';
    const sessionId = [adminId, targetUserId].sort().join('_');
    const now = new Date().toISOString();
    const messageText = message.trim();
    const existingSession = (await getDocument('chats', sessionId)) as ChatSession | null;
    if (!existingSession) {
      await setDocument('chats', sessionId, {
        id: sessionId,
        participants: [adminId, targetUserId],
        updatedAt: now,
        lastMessage: messageText,
        lastMessageTime: now,
      });
    } else {
      await updateDocument('chats', sessionId, {
        updatedAt: now,
        lastMessage: messageText,
        lastMessageTime: now,
      });
    }
    await addDocument(`chats/${sessionId}/messages`, {
      sessionId,
      senderId: adminId,
      text: messageText,
      createdAt: now,
      isHidden: false,
    });
    showToast('✅ মেসেজটি ইউজারের মেসেজ ইনবক্সে পাঠানো হয়েছে!');
  };

  const handleBroadcastMessage = async (title: string, message: string) => {
    const adminId = firebaseUser?.uid || 'admin';
    const now = new Date().toISOString();
    const messageText = title ? `📢 [${title}]\n${message.trim()}` : message.trim();
    for (const u of users) {
      if (u.id && u.id !== adminId) {
        const sessionId = [adminId, u.id].sort().join('_');
        try {
          const existingSession = (await getDocument('chats', sessionId)) as ChatSession | null;
          if (!existingSession) {
            await setDocument('chats', sessionId, {
              id: sessionId,
              participants: [adminId, u.id],
              updatedAt: now,
              lastMessage: messageText,
              lastMessageTime: now,
            });
          } else {
            await updateDocument('chats', sessionId, {
              updatedAt: now,
              lastMessage: messageText,
              lastMessageTime: now,
            });
          }
          await addDocument(`chats/${sessionId}/messages`, {
            sessionId,
            senderId: adminId,
            text: messageText,
            createdAt: now,
            isHidden: false,
          });
        } catch (err) {
          console.warn('Broadcast chat error:', u.id, err);
        }
      }
    }
    showToast(`✅ সকল ${toBengaliNumber(users.length)} জন ইউজারের মেসেজ ইনবক্সে পাঠানো হয়েছে!`);
  };

  const handleUpdateEarningSettings = async (newSettings: EarningSettings) => {
    const normalizedSettings: EarningSettings = {
      ...newSettings,
      adminCommissionReceiverId:
        newSettings.adminCommissionReceiverId ||
        earningSettings.adminCommissionReceiverId ||
        firebaseUser?.uid ||
        '',
      loginOfferCampaignId:
        newSettings.isLoginOfferEnabled && (newSettings.loginOfferPoints || 0) > 0
          ? newSettings.loginOfferCampaignId || `offer_${Date.now()}`
          : '',
    };
    setEarningSettings(normalizedSettings);
    try {
      localStorage.setItem('rt_earning_settings', JSON.stringify(normalizedSettings));
    } catch {}
    if (normalizedSettings.spinMaxPrize) setSpinMaxPrize(normalizedSettings.spinMaxPrize);
    if (normalizedSettings.scratchCardPrize) setScratchPrize(normalizedSettings.scratchCardPrize);

    await setDocument('settings', 'earning', {
      ...normalizedSettings,
      id: 'earning',
      updatedAt: new Date().toISOString(),
    }).catch((err) => console.warn('Save settings error:', err));

    showToast('✅ আর্নিং ও অফার সেটিংস সফলভাবে সেভ করা হয়েছে!');
  };

  const handleUpdateSiteSettings = async (nextSite: SiteSettings, customToast?: string) => {
    const cleanSite: SiteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      ...nextSite,
      id: 'site',
      updatedAt: new Date().toISOString(),
    };
    setSiteSettings(cleanSite);
    setPointRate(cleanSite.pointRate);
    setMinWithdrawal(cleanSite.minWithdrawal);
    setAnnouncement(cleanSite.announcement);
    const bk = cleanSite.paymentMethods.find((m) => m.name === 'bKash')?.accountNumber || adminPaymentNumbers.bKash;
    const ng = cleanSite.paymentMethods.find((m) => m.name === 'Nagad')?.accountNumber || adminPaymentNumbers.Nagad;
    const rk = cleanSite.paymentMethods.find((m) => m.name === 'Rocket')?.accountNumber || adminPaymentNumbers.Rocket;
    setAdminPaymentNumbers({ bKash: bk, Nagad: ng, Rocket: rk });
    try {
      localStorage.setItem('rt_site_settings', JSON.stringify(cleanSite));
      localStorage.setItem('rt_point_rate', String(cleanSite.pointRate));
      localStorage.setItem('rt_min_withdrawal', String(cleanSite.minWithdrawal));
      localStorage.setItem('rt_announcement', cleanSite.announcement);
      localStorage.setItem('rt_payment_numbers', JSON.stringify({ bKash: bk, Nagad: ng, Rocket: rk }));
    } catch {}

    await setDocument('settings', 'site', cleanSite).catch((err) =>
      console.warn('Save site settings error:', err)
    );
    showToast(customToast || '✅ সাইট ও ফিচার কন্ট্রোল সেটিংস সংরক্ষণ করা হয়েছে!');
  };

  const handleDeleteReelComment = async (reelId: string, commentId: string) => {
    try {
      await deleteDocument(`reels/${reelId}/comments`, commentId);
      const reel = reels.find((r) => r.id === reelId);
      if (reel) {
        const nextCount = Math.max(0, (reel.commentsCount || 1) - 1);
        setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, commentsCount: nextCount } : r)));
        await updateDocument('reels', reelId, { commentsCount: nextCount }).catch(() => {});
      }
      showToast('🗑️ মন্তব্যটি মুছে ফেলা হয়েছে!');
    } catch (err) {
      console.warn('Delete comment error:', err);
    }
  };

  const handleCancelLive = async (liveId: string, reason?: string) => {
    const targetStream = activeLiveStreams.find((s) => s.id === liveId);
    const cleanReason = (reason || '').trim();
    await updateDocument('live_streams', liveId, {
      status: 'ended',
      endedAt: new Date().toISOString(),
      cancelledByAdmin: true,
      cancelReason: cleanReason || 'এডমিন নীতিমালার কারণে লাইভটি বাতিল করা হয়েছে',
    });
    setActiveLiveStreams((prev) => prev.filter((s) => s.id !== liveId));
    await addDocument(`live_streams/${liveId}/chat`, {
      userId: firebaseUser?.uid || 'admin',
      userName: firebaseUser?.displayName || 'Admin',
      userAvatar: firebaseUser?.photoURL || INITIAL_USER.avatar,
      text: cleanReason
        ? `🛑 এডমিন লাইভটি ক্যানসেল করেছেন (${cleanReason})`
        : '🛑 এডমিন এই লাইভ সেশনটি ক্যানসেল করেছেন',
      type: 'system',
      createdAt: new Date().toISOString(),
    }).catch(() => {});
    if (targetStream?.hostId) {
      sendNotification(
        targetStream.hostId,
        '🛑 লাইভ ক্যানসেল করা হয়েছে',
        cleanReason
          ? `আপনার "${targetStream.title}" লাইভটি এডমিন ক্যানসেল করেছেন। কারণ: ${cleanReason}`
          : `আপনার "${targetStream.title}" লাইভটি এডমিন ক্যানসেল করেছেন।`,
        'general'
      );
    }
    showToast('🛑 লাইভ সেশনটি এডমিন দ্বারা ক্যানসেল করা হয়েছে।');
  };

  // GATE 1: Loading Auth
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-[#06090e] text-white flex flex-col items-center justify-center p-6 gap-4">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-xs font-bold text-blue-200 tracking-wide">
          এডমিন সিকিউরিটি সেশন যাচাই হচ্ছে...
        </p>
      </div>
    );
  }

  // GATE 2: Not Signed In -> Dedicated Admin Login Portal
  if (!firebaseUser) {
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    return (
      <div className="min-h-screen bg-[#06090e] text-white p-4 flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-[120px]" />

        <div className="max-w-sm w-full mx-auto z-10 space-y-5">
          <div className="text-center space-y-2.5">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-4 ring-blue-500/20">
              <KeyRound className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              ReelPay BD <span className="text-blue-400">ADMIN</span>
            </h1>
            <p className="text-xs text-neutral-400">
              পৃথক এডমিন পোর্টাল — ইমেইল ভেরিফিকেশন ও অনুমোদন বাধ্যতামূলক
            </p>
          </div>

          <div className="bg-[#0e1522]/90 backdrop-blur-xl border border-blue-900/50 rounded-[32px] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold w-fit mx-auto">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security-First Admin Gateway</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#090e17] rounded-2xl border border-blue-900/40">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthInfo(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                এডমিন লগইন
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                  setAuthInfo(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ইমেইল রেজিস্ট্রেশন
              </button>
            </div>

            {authError && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold px-3.5 py-2.5 rounded-2xl leading-relaxed">
                ⚠️ {authError}
              </div>
            )}

            {authInfo && (
              <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-2xl leading-relaxed">
                ✅ {authInfo}
              </div>
            )}

            <form onSubmit={handleAdminEmailSubmit} className="space-y-3.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="অনুমোদিত এডমিন ইমেইল"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#090e17] border border-blue-900/50 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder={authMode === 'register' ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'এডমিন পাসওয়ার্ড'}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-[#090e17] border border-blue-900/50 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              {authMode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAdminForgotPassword}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full bg-[#2962ff] hover:bg-blue-600 text-white font-black py-3.5 rounded-2xl transition active:scale-95 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {authSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>
                      {authMode === 'register'
                        ? 'রেজিস্ট্রেশন ও ইমেইল ভেরিফাই করুন'
                        : 'এডমিন ইমেইল লগইন'}
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-blue-900/40" />
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">অথবা</span>
              <div className="h-px flex-1 bg-blue-900/40" />
            </div>

            <button
              type="button"
              onClick={handleAdminGoogleLogin}
              disabled={authSubmitting}
              className="w-full bg-white hover:bg-neutral-100 text-black font-black py-3.5 rounded-2xl transition active:scale-95 shadow-lg flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Google দিয়ে এডমিন সাইন-ইন</span>
            </button>

            {isInIframe && (
              <a
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-bold transition"
              >
                পপআপ ব্লক হলে এডমিন লিংক নতুন ট্যাবে খুলুন ↗
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GATE 3: Signed In, But Email NOT Verified -> Mandatory Verification Gate
  if (!emailVerified) {
    return (
      <EmailVerificationGate
        email={resolvedEmail || firebaseUser.email || ''}
        portal="admin"
        lang="bn"
        onRefreshStatus={refreshVerificationStatus}
        onResendEmail={resendVerificationEmail}
        onLogout={logout}
      />
    );
  }

  // GATE 4: Email Verified, But NOT an Authorized Admin -> 403 Access Denied
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-[#06090e] text-white p-4 flex flex-col justify-center items-center">
        <div className="max-w-sm w-full bg-[#130b10] border border-rose-700/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">403 — অ্যাক্সেস অনুমোদিত নয়</h2>
          <p className="text-xs text-neutral-300 leading-relaxed">
            আপনার অ্যাকাউন্টটি অনুমোদিত এডমিন তালিকায় নেই। শুধুমাত্র অনুমোদিত এডমিনরাই এই প্যানেলে প্রবেশ করতে পারবেন।
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full min-h-[44px] rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <LogOut className="w-4 h-4" />
            <span>অন্য অ্যাকাউন্ট দিয়ে লগইন করতে সাইন আউট করুন</span>
          </button>
        </div>
      </div>
    );
  }

  const adminActorUser: User = {
    ...INITIAL_USER,
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'Master Admin',
    email: firebaseUser.email || '',
    phone: '',
    avatar: firebaseUser.photoURL || INITIAL_USER.avatar,
    role: 'admin',
    isVerified: true,
    points: 0,
    totalWithdrawn: 0,
    reelsWatchedCount: 0,
  };

  // GATE 5: Verified & Authorized Master Admin Panel
  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans">
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] bg-[#101c2e] border border-blue-400 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto min-h-screen bg-[#090e17] border-x border-blue-950/60 p-3.5 sm:p-5 shadow-2xl">
        <AdminPanel
          users={users}
          pointRate={pointRate}
          onUpdateRate={(r) => {
            handleUpdateSiteSettings({ ...siteSettings, pointRate: r }, `✅ পয়েন্ট রেট ${toBengaliNumber(r)} = ৳১ সেভ করা হয়েছে!`);
          }}
          announcement={announcement}
          onUpdateAnnouncement={(text) => {
            handleUpdateSiteSettings({ ...siteSettings, announcement: text }, '📢 অ্যানাউন্সমেন্ট আপডেট করা হয়েছে!');
          }}
          withdrawals={withdrawals}
          onApproveWithdrawal={handleApproveWithdrawal}
          onRejectWithdrawal={handleRejectWithdrawal}
          depositRequests={depositRequests}
          onApproveDeposit={handleApproveDeposit}
          onRejectDeposit={handleRejectDeposit}
          reels={reels}
          onAddReel={handleAddNewReel}
          onEditReel={(r) => setEditingReel(r)}
          onDeleteReel={handleDeleteReel}
          onDeleteReelComment={handleDeleteReelComment}
          onGiveUserBonus={handleGiveUserBonus}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onExitAdmin={() => logout()}
          currentUserUid={firebaseUser.uid}
          adminPaymentNumbers={adminPaymentNumbers}
          onUpdatePaymentNumbers={(nums) => {
            const updatedMethods = siteSettings.paymentMethods.map((pm) => {
              if (pm.name === 'bKash') return { ...pm, accountNumber: nums.bKash };
              if (pm.name === 'Nagad') return { ...pm, accountNumber: nums.Nagad };
              if (pm.name === 'Rocket') return { ...pm, accountNumber: nums.Rocket };
              return pm;
            });
            handleUpdateSiteSettings({ ...siteSettings, paymentMethods: updatedMethods }, '✅ পেমেন্ট নম্বর সংরক্ষিত হয়েছে!');
          }}
          minWithdrawal={minWithdrawal}
          onUpdateMinWithdrawal={(amt) => {
            handleUpdateSiteSettings({ ...siteSettings, minWithdrawal: amt }, `✅ সর্বনিম্ন ক্যাশআউট ৳${amt} সেভ করা হয়েছে!`);
          }}
          tasks={tasks}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          spinMaxPrize={spinMaxPrize}
          onUpdateSpinMaxPrize={(val) => {
            setSpinMaxPrize(val);
            try {
              localStorage.setItem('rt_spin_max', String(val));
            } catch {}
            const ratio = Math.max(0.1, val / 100);
            const scaledPrizes = [10, 25, 50, 15, 100, 30, 20, 40].map((p) =>
              p === 100 ? val : Math.max(1, Math.round(p * ratio))
            );
            handleUpdateEarningSettings({
              ...earningSettings,
              spinMaxPrize: val,
              spinPrizes: scaledPrizes,
            });
          }}
          scratchCardPrize={scratchPrize}
          onUpdateScratchPrize={(val) => {
            setScratchPrize(val);
            try {
              localStorage.setItem('rt_scratch_prize', String(val));
            } catch {}
            handleUpdateEarningSettings({
              ...earningSettings,
              scratchCardPrize: val,
            });
          }}
          onSendNotification={handleSendDirectMessage}
          onBroadcastNotification={handleBroadcastMessage}
          earningSettings={earningSettings}
          onUpdateEarningSettings={handleUpdateEarningSettings}
          siteSettings={siteSettings}
          onUpdateSiteSettings={handleUpdateSiteSettings}
          onQuickUpdateReel={handleUpdateReel}
          onInspectLive={(liveId) => {
            setCurrentLiveStreamId(liveId);
            setShowLiveSheet(true);
          }}
          onCancelLive={handleCancelLive}
          isAuthorizedAdmin={isAuthorizedAdmin}
        />
      </div>

      {editingReel && (
        <EditReelModal
          reel={editingReel}
          isOpen={!!editingReel}
          onClose={() => setEditingReel(null)}
          onUpdateReel={handleUpdateReel}
          lang="bn"
          isMuted={false}
          users={users}
        />
      )}

      {showLiveSheet && (
        <LiveStreamSheet
          isOpen={showLiveSheet}
          onClose={() => setShowLiveSheet(false)}
          onOpenGift={() => showToast('এডমিন ইন্সপেকশন মোড')}
          lang="bn"
          isMuted={false}
          liveStreamId={currentLiveStreamId}
          currentUser={adminActorUser}
          isAuthenticated={true}
          onEndLive={(id, _byAdmin, reason) => handleCancelLive(id, reason)}
          isAdminOverride={true}
          initialStream={activeLiveStreams.find((s) => s.id === currentLiveStreamId) || null}
        />
      )}
    </div>
  );
};
