import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  Users,
  Coins,
  Clock,
  Settings,
  Bell,
  BellRing,
  CheckCircle2,
  XCircle,
  PlusCircle,
  LogOut,
  ArrowLeft,
  DollarSign,
  Gift,
  Mail,
  Phone,
  Video,
  Image as ImageIcon,
  UploadCloud,
  Edit3,
  Trash2,
  ShieldCheck,
  Search,
  Sparkles,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Sliders,
  Check,
  X,
  Play,
  Activity,
  Calendar,
  Flame,
  Folder,
  MessageCircle,
  ShieldAlert,
  PlayCircle,
  Lock,
  Zap,
  Target,
  RotateCw,
  Share2,
  Send,
  Radio,
  Mic,
  MicOff,
  VideoOff,
  MessageSquare,
  MessageSquareOff,
  CreditCard,
  Landmark,
  Smartphone,
  Wrench,
  Copy,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import { useFirebase } from '../hooks/useFirebase';
import { orderBy, limit } from 'firebase/firestore';
import {
  User,
  WithdrawalRequest,
  Reel,
  DepositRequest,
  ChatSession,
  ChatMessage,
  TaskItem,
  TaskRequirementType,
  EarningSettings,
  DEFAULT_EARNING_SETTINGS,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_PAYMENT_METHODS,
  PaymentMethodConfig,
  PaymentMethodCategory,
  PAYMENT_METHOD_PRESETS,
  Comment,
  LiveStream,
} from '../types';
import { toBengaliNumber, formatTaka } from '../utils/bengali';
import { playSuccessChime, playPopSound } from '../utils/audio';
import { storeVideoInDB, fileToDataUrl, captureVideoThumbnail, compressImageFileToDataUrl, compressAppLogoToDataUrl } from '../utils/videoStorage';
import { extractYouTubeId } from '../utils/video';
import { getUserLevel } from '../utils/levels';
import { calculateGiftSplit } from '../utils/gifts';
import { buildCreatorHandle } from '../utils/reelOwner';
import { REEL_UPLOAD_CATEGORIES } from '../utils/categories';
import { buildScaledSpinPrizes, normalizeTaskOffer } from '../utils/offers';
import { LiveViewerPeakChart } from './LiveViewerPeakChart';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';

export interface AdminPanelProps {
  users: User[];
  pointRate: number;
  onUpdateRate: (newRate: number) => void;
  announcement: string;
  onUpdateAnnouncement: (text: string) => void;
  withdrawals: WithdrawalRequest[];
  onApproveWithdrawal: (id: string) => void;
  onRejectWithdrawal: (id: string) => void;
  depositRequests: DepositRequest[];
  onApproveDeposit: (id: string) => void;
  onRejectDeposit: (id: string) => void;
  reels: Reel[];
  onAddReel: (reel: Omit<Reel, 'id' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'viewsCount' | 'createdAt' | 'timeAgo'>) => void;
  onEditReel: (reel: Reel) => void;
  onDeleteReel: (reel: Reel, reason?: string) => void;
  onDeleteReelComment?: (reelId: string, commentId: string) => void;
  onGiveUserBonus: (userId: string, points: number) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onExitAdmin: () => void;
  currentUserUid: string;
  adminPaymentNumbers?: { bKash: string; Nagad: string; Rocket: string };
  onUpdatePaymentNumbers?: (nums: { bKash: string; Nagad: string; Rocket: string }) => void;
  minWithdrawal?: number;
  onUpdateMinWithdrawal?: (amt: number) => void;
  tasks?: TaskItem[];
  onAddTask?: (task: Omit<TaskItem, 'id' | 'completed'>) => void;
  onEditTask?: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
  spinMaxPrize?: number;
  onUpdateSpinMaxPrize?: (prize: number) => void;
  scratchCardPrize?: number;
  onUpdateScratchPrize?: (prize: number) => void;
  onSendNotification?: (userId: string, title: string, message: string) => void;
  onBroadcastNotification?: (title: string, message: string) => void;
  earningSettings?: EarningSettings;
  onUpdateEarningSettings?: (newSettings: EarningSettings) => void;
  siteSettings?: SiteSettings;
  onUpdateSiteSettings?: (nextSite: SiteSettings, customToast?: string) => void;
  onQuickUpdateReel?: (reelId: string, updatedData: Partial<Reel>) => void;
  onInspectLive?: (liveId: string) => void;
  onCancelLive?: (liveId: string, reason?: string) => void;
  isAuthorizedAdmin?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  pointRate,
  onUpdateRate,
  announcement,
  onUpdateAnnouncement,
  withdrawals,
  onApproveWithdrawal,
  onRejectWithdrawal,
  depositRequests,
  onApproveDeposit,
  onRejectDeposit,
  reels,
  onAddReel,
  onEditReel,
  onDeleteReel,
  onDeleteReelComment,
  onGiveUserBonus,
  onUpdateUser,
  onDeleteUser,
  onExitAdmin,
  currentUserUid,
  adminPaymentNumbers = { bKash: '01700000000', Nagad: '01800000000', Rocket: '01900000000' },
  onUpdatePaymentNumbers,
  minWithdrawal = 50,
  onUpdateMinWithdrawal,
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
  spinMaxPrize = 100,
  onUpdateSpinMaxPrize,
  scratchCardPrize = 35,
  onUpdateScratchPrize,
  onSendNotification,
  onBroadcastNotification,
  earningSettings = DEFAULT_EARNING_SETTINGS,
  onUpdateEarningSettings,
  siteSettings = DEFAULT_SITE_SETTINGS,
  onUpdateSiteSettings,
  onQuickUpdateReel,
  onInspectLive,
  onCancelLive,
  isAuthorizedAdmin = false,
}) => {
  // Navigation Tabs inside Admin Panel
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'analytics' | 'reels' | 'users' | 'earning' | 'live' | 'payments' | 'settings' | 'withdrawals' | 'deposits' | 'chats' | 'tasks'>('reels');
  
  // Local Earning & Site Settings State
  const [localEarning, setLocalEarning] = useState<EarningSettings>(() => earningSettings || DEFAULT_EARNING_SETTINGS);
  const [localSite, setLocalSite] = useState<SiteSettings>(() => ({
    ...DEFAULT_SITE_SETTINGS,
    ...siteSettings,
    paymentMethods:
      siteSettings?.paymentMethods && siteSettings.paymentMethods.length > 0
        ? siteSettings.paymentMethods
        : DEFAULT_PAYMENT_METHODS,
  }));
  const [panelToast, setPanelToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showPanelToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setPanelToast({ msg, type });
    setTimeout(() => setPanelToast(null), 3200);
  };

  // Unlimited Payment Methods Form State
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState<'all' | PaymentMethodCategory>('all');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [pmForm, setPmForm] = useState<Omit<PaymentMethodConfig, 'id'>>({
    name: '',
    nameBn: '',
    category: 'mobile_banking',
    accountNumber: '',
    accountTitle: '',
    bankName: '',
    branchName: '',
    routingNumber: '',
    accountTypeLabel: 'Personal',
    instructions: '',
    colorHex: '#00c853',
    supportsDeposit: true,
    supportsWithdrawal: true,
    isEnabled: true,
  });

  // Reel Comments Moderation State
  const [moderatingReel, setModeratingReel] = useState<Reel | null>(null);
  const [moderatingComments, setModeratingComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (earningSettings) {
      setLocalEarning({ ...DEFAULT_EARNING_SETTINGS, ...earningSettings });
    }
  }, [earningSettings]);

  useEffect(() => {
    setSpinMaxInput(String(spinMaxPrize));
  }, [spinMaxPrize]);

  useEffect(() => {
    setScratchPrizeInput(String(scratchCardPrize));
  }, [scratchCardPrize]);

  useEffect(() => {
    if (siteSettings) {
      setLocalSite({
        ...DEFAULT_SITE_SETTINGS,
        ...siteSettings,
        paymentMethods:
          siteSettings.paymentMethods && siteSettings.paymentMethods.length > 0
            ? siteSettings.paymentMethods
            : DEFAULT_PAYMENT_METHODS,
      });
      setRateInput(String(siteSettings.pointRate ?? pointRate));
      setMinWithdrawInput(String(siteSettings.minWithdrawal ?? minWithdrawal));
      setNoticeInput(siteSettings.announcement ?? announcement);
    }
  }, [siteSettings]);

  // Video offer filter & search state for the Earning Control Tab
  const [reelSearchTerm, setReelSearchTerm] = useState('');
  const [reelOfferFilter, setReelOfferFilter] = useState<'all' | 'offers_only' | 'earning_on' | 'earning_off'>('all');

  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskBadgeText, setTaskBadgeText] = useState('');
  const [taskPoints, setTaskPoints] = useState<number>(50);
  const [taskCategory, setTaskCategory] = useState<string>('সোশ্যাল');
  const [taskActionUrl, setTaskActionUrl] = useState<string>('');
  const [taskIconName, setTaskIconName] = useState<string>('Send');
  const [taskRequirementType, setTaskRequirementType] = useState<TaskRequirementType>('instant');
  const [taskRequirementValue, setTaskRequirementValue] = useState<number>(1);
  const [taskIsRepeatableDaily, setTaskIsRepeatableDaily] = useState<boolean>(false);
  const [taskIsActive, setTaskIsActive] = useState<boolean>(true);
  const [taskSortOrder, setTaskSortOrder] = useState<number>(10);

  // Earn Wheel & Scratch Card Admin Control State
  const [spinMaxInput, setSpinMaxInput] = useState<string>(String(spinMaxPrize));
  const [scratchPrizeInput, setScratchPrizeInput] = useState<string>(String(scratchCardPrize));

  // Admin Broadcast & Direct Messaging State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [directMsgUserId, setDirectMsgUserId] = useState('');
  const [directMsgText, setDirectMsgText] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [liveStreamsList, setLiveStreamsList] = useState<LiveStream[]>([]);
  const [liveFilter, setLiveFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [liveFeedback, setLiveFeedback] = useState<string | null>(null);
  const {
    user: adminFirebaseUser,
    loginWithGoogle: adminLoginWithGoogle,
    onSnapshot: adminOnSnapshot,
    updateDocument,
    addDocument,
    deleteDocument,
  } = useFirebase();

  const isAdminFirebaseAuthed = Boolean(
    adminFirebaseUser &&
      adminFirebaseUser.emailVerified &&
      isAuthorizedAdmin
  );

  const showLiveFeedback = (msg: string) => {
    setLiveFeedback(msg);
    setTimeout(() => setLiveFeedback(null), 3500);
  };

  // Sync Live Streams for Admin Moderation
  useEffect(() => {
    if (!isAdminFirebaseAuthed) return;
    const unsub = adminOnSnapshot('live_streams', (data: any[]) => {
      setLiveStreamsList(data as LiveStream[]);
    }, [orderBy('createdAt', 'desc'), limit(40)]);
    return unsub;
  }, [isAdminFirebaseAuthed]);

  // Sync Chat Sessions for Admin ONLY when authenticated as Firebase Admin
  useEffect(() => {
    if (activeAdminTab === 'chats' && isAdminFirebaseAuthed) {
      const unsub = adminOnSnapshot('chats', (data: any[]) => {
        setChatSessions(data as ChatSession[]);
      }, [orderBy('updatedAt', 'desc')]);
      return unsub;
    }
    if (!isAdminFirebaseAuthed) {
      setChatSessions([]);
    }
  }, [activeAdminTab, isAdminFirebaseAuthed]);

  // Sync Messages for selected session ONLY when authenticated as Firebase Admin
  useEffect(() => {
    if (selectedChatId && isAdminFirebaseAuthed) {
      const unsub = adminOnSnapshot(`chats/${selectedChatId}/messages`, (data: any[]) => {
        setChatMessages((data as ChatMessage[]).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      }, [orderBy('createdAt', 'asc'), limit(100)]);
      return unsub;
    } else {
      setChatMessages([]);
    }
  }, [selectedChatId, isAdminFirebaseAuthed]);

  // Sync comments for moderated reel
  useEffect(() => {
    if (moderatingReel && isAdminFirebaseAuthed) {
      const unsub = adminOnSnapshot(`reels/${moderatingReel.id}/comments`, (data: any[]) => {
        setModeratingComments(
          (data as Comment[]).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        );
      });
      return unsub;
    } else {
      setModeratingComments([]);
    }
  }, [moderatingReel?.id, isAdminFirebaseAuthed]);

  const handleToggleMessageHide = async (msg: ChatMessage) => {
    if (!selectedChatId || !isAdminFirebaseAuthed) return;
    try {
      await updateDocument(`chats/${selectedChatId}/messages`, msg.id, { isHidden: !msg.isHidden });
    } catch (err) {
      console.error('Failed to toggle message visibility:', err);
    }
  };

  const handleAdminSendReply = async () => {
    if (!selectedChatId || !adminReplyText.trim() || !isAdminFirebaseAuthed) return;
    const text = adminReplyText.trim();
    setAdminReplyText('');
    const now = new Date().toISOString();
    try {
      await addDocument(`chats/${selectedChatId}/messages`, {
        sessionId: selectedChatId,
        senderId: currentUserUid || 'admin',
        text,
        createdAt: now,
        isHidden: false,
      });
      await updateDocument('chats', selectedChatId, {
        lastMessage: text,
        lastMessageTime: now,
        updatedAt: now,
      });
      playSuccessChime();
    } catch (err) {
      console.error('Failed to send admin reply in chat:', err);
    }
  };

  // Reel Form state
  const [showAddReel, setShowAddReel] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>(currentUserUid || '');
  const [newTitle, setNewTitle] = useState('');
  const [newCreator, setNewCreator] = useState('');
  const [newCategory, setNewCategory] = useState<Reel['category']>('কমেডি');
  const [newPointsReward, setNewPointsReward] = useState<number>(15);
  const [newCaption, setNewCaption] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newThumbUrl, setNewThumbUrl] = useState('');

  useEffect(() => {
    if (!targetUserId && (currentUserUid || users.length > 0)) {
      const preferred =
        users.find((u) => u.id === currentUserUid) ||
        users.find((u) => u.role === 'admin') ||
        users[0];
      if (preferred) {
        setTargetUserId(preferred.id);
        setNewCreator((prev) => prev || preferred.name);
      } else if (currentUserUid) {
        setTargetUserId(currentUserUid);
      }
    }
  }, [currentUserUid, users, targetUserId]);
  
  // Gallery file upload states
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // File input refs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // User management states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserPointsInput, setEditUserPointsInput] = useState<string>('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // User Profile Inspection Modal states
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [userDetailSubTab, setUserDetailSubTab] = useState<'reels' | 'activity' | 'withdrawals' | 'deposits'>('reels');
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [detailUserPointsInput, setDetailUserPointsInput] = useState<string>('');

  // Helper to isolate reels uploaded by a specific user
  const getUserReels = (u: User) => {
    return reels.filter((r) => r.userId === u.id);
  };

  // App Settings Form states
  const [rateInput, setRateInput] = useState(String(pointRate));
  const [noticeInput, setNoticeInput] = useState(announcement);
  const [minWithdrawInput, setMinWithdrawInput] = useState(String(minWithdrawal));
  const [bkashNumInput, setBkashNumInput] = useState(adminPaymentNumbers.bKash);
  const [nagadNumInput, setNagadNumInput] = useState(adminPaymentNumbers.Nagad);
  const [rocketNumInput, setRocketNumInput] = useState(adminPaymentNumbers.Rocket);

  // Custom Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    showInput?: boolean;
    inputValue?: string;
    onConfirm: (val?: string) => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, onConfirm: (val?: string) => void, showInput?: boolean) => {
    setConfirmModal({ show: true, title, message, onConfirm, showInput, inputValue: '' });
  };

  // Metrics
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const pendingDeposits = depositRequests?.filter((d) => d.status === 'pending') || [];
  const totalApprovedBDT = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((acc, w) => acc + w.amountBDT, 0);
  const onlineUsers = users.filter(
    (u) => u.lastActive && new Date().getTime() - new Date(u.lastActive).getTime() < 60000
  ).length;

  // Generate analytics data for the last 7 days
  const analyticsData = useMemo(() => {
    const days = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];
    const today = new Date();
    const data = [];
    
    const totalViewsNow = reels.reduce((acc, r) => acc + (r.viewsCount || 0), 0);
    const totalUsersNow = users.length;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      
      // Simulate active users: 30-70% of total users
      // Seeded random for consistency within the session but looks varied
      const seed = (d.getFullYear() * 10000) + ((d.getMonth() + 1) * 100) + d.getDate();
      const pseudoRandom = (Math.sin(seed) + 1) / 2;
      
      const activeUsers = i === 0 
        ? Math.max(onlineUsers, Math.floor(totalUsersNow * (0.5 + (pseudoRandom * 0.2))))
        : Math.floor(totalUsersNow * (0.3 + (pseudoRandom * 0.4)));
      
      // Simulate total views trend
      const dailyTotalViews = Math.floor(totalViewsNow * (1 - (i * 0.08) + (pseudoRandom * 0.04)));

      data.push({
        name: dayName,
        users: activeUsers,
        views: dailyTotalViews,
      });
    }
    return data;
  }, [users.length, reels, onlineUsers]);

  // Handle Video Selection from Gallery
  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedVideoFile(file);
    const preview = URL.createObjectURL(file);
    setVideoPreviewUrl(preview);

    // Try automatic thumbnail capture from the uploaded video
    try {
      const capturedThumb = await captureVideoThumbnail(file);
      if (capturedThumb && !imagePreviewUrl) {
        setImagePreviewUrl(capturedThumb);
        setNewThumbUrl(capturedThumb);
      }
    } catch (err) {
      console.warn('Could not auto-capture video thumbnail:', err);
    }
  };

  // Handle Image/Thumbnail Selection from Gallery (compressed for Firestore)
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageFile(file);
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setImagePreviewUrl(dataUrl);
      setNewThumbUrl(dataUrl);
    } catch {
      const preview = URL.createObjectURL(file);
      setImagePreviewUrl(preview);
      setNewThumbUrl(preview);
    }
  };

  // Handle App Logo / Icon Selection directly from Device Gallery (with instant sync)
  const handleAppLogoGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploadingLogo(true);
    try {
      const compressedLogo = await compressAppLogoToDataUrl(file, 256);
      const nextSite: SiteSettings = {
        ...localSite,
        appLogoUrl: compressedLogo,
      };
      setLocalSite(nextSite);
      if (onUpdateSiteSettings) {
        await Promise.resolve(
          onUpdateSiteSettings(nextSite, '✅ গ্যালারি থেকে অ্যাপ লোগো ও আইকন সাথে সাথে পরিবর্তন হয়েছে!')
        );
      }
      playSuccessChime();
      showPanelToast('✅ গ্যালারি থেকে অ্যাপ লোগো ও আইকন সাথে সাথে পরিবর্তন হয়েছে!');
    } catch (err) {
      console.error('App logo gallery upload failed:', err);
      showPanelToast('⚠️ গ্যালারি থেকে লোগো আপলোড করতে সমস্যা হয়েছে। অন্য ছবি চেষ্টা করুন।', 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Create Reel with gallery photo/video or URLs
  const handleCreateReelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showPanelToast('রিলের শিরোনাম লিখুন।', 'error');
      return;
    }

    setIsUploading(true);
    const reelUniqueId = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let finalVideoUrl = newVideoUrl.trim();
    let finalThumbUrl = newThumbUrl.trim();

    try {
      // 1. Process Video File if selected from Gallery
      if (selectedVideoFile) {
        await storeVideoInDB(reelUniqueId, selectedVideoFile);
        if (selectedVideoFile.size <= 800000) {
          try {
            finalVideoUrl = await fileToDataUrl(selectedVideoFile);
          } catch {
            finalVideoUrl = `local:${reelUniqueId}`;
          }
        } else {
          finalVideoUrl = `local:${reelUniqueId}`;
        }
      }

      // 2. Process Image File if selected from Gallery
      if (selectedImageFile && !finalThumbUrl.startsWith('data:')) {
        try {
          finalThumbUrl = await fileToDataUrl(selectedImageFile);
        } catch {
          // fallback
        }
      }

      // 3. Fallback thumbnail if YouTube or default
      const ytId = extractYouTubeId(finalVideoUrl);
      if (!finalThumbUrl) {
        finalThumbUrl = ytId
          ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
          : '/images/ai_comedian_stage.jpg';
      }

      if (!finalVideoUrl) {
        showPanelToast('অনুগ্রহ করে গ্যালারি থেকে একটি ভিডিও ফাইল সিলেক্ট করুন অথবা ভিডিও লিংক দিন।', 'error');
        setIsUploading(false);
        return;
      }

      const targetOwner =
        users.find((u) => u.id === targetUserId) ||
        users.find((u) => u.id === currentUserUid);
      const resolvedOwnerId = targetOwner?.id || targetUserId || currentUserUid;
      const creatorTitle = newCreator.trim() || targetOwner?.name || 'ক্রিয়েটর';
      const creatorAvatar =
        targetOwner?.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
      const creatorVerified = targetOwner ? Boolean(targetOwner.isVerified) : true;

      onAddReel({
        title: newTitle.trim(),
        userId: resolvedOwnerId,
        creatorName: creatorTitle,
        creatorHandle: `@${buildCreatorHandle(creatorTitle, targetOwner?.phone)}`,
        creatorAvatar,
        category: newCategory,
        thumbnailUrl: finalThumbUrl,
        videoUrl: finalVideoUrl,
        isVerified: creatorVerified,
        pointsReward: Number(newPointsReward) || 15,
        audioTrack: 'Original Sound - ' + creatorTitle,
        caption: newCaption.trim() || `${newTitle.trim()} #ReelPayBD`,
        hashtags: ['#ReelPayBD', '#AdminReel', '#TrendingBD'],
      });

      playSuccessChime();
      showPanelToast(`🎉 "${creatorTitle}"-এর প্রোফাইলে রিলটি সফলভাবে পাবলিশ করা হয়েছে!`);

      // Reset Form
      setNewTitle('');
      setNewCreator(targetOwner?.name || '');
      setNewCaption('');
      setNewVideoUrl('');
      setNewThumbUrl('');
      setSelectedVideoFile(null);
      setVideoPreviewUrl(null);
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setShowAddReel(false);
    } catch (err) {
      console.error('Reel upload failed:', err);
      showPanelToast('রিল আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Save Settings (atomically saves ALL site settings + feature controls to Firestore)
  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = Math.max(1, parseInt(rateInput, 10) || localSite.pointRate || 10);
    const minW = Math.max(10, parseInt(minWithdrawInput, 10) || localSite.minWithdrawal || 100);

    const updatedMethods = (localSite.paymentMethods || []).map((pm) => {
      if (pm.name === 'bKash') return { ...pm, accountNumber: bkashNumInput.trim() || pm.accountNumber };
      if (pm.name === 'Nagad') return { ...pm, accountNumber: nagadNumInput.trim() || pm.accountNumber };
      if (pm.name === 'Rocket') return { ...pm, accountNumber: rocketNumInput.trim() || pm.accountNumber };
      return pm;
    });

    const mergedSite: SiteSettings = {
      ...localSite,
      pointRate: rateVal,
      minWithdrawal: minW,
      announcement: noticeInput.trim(),
      paymentMethods: updatedMethods,
    };

    setLocalSite(mergedSite);
    if (onUpdateSiteSettings) {
      onUpdateSiteSettings(mergedSite, '✅ সাইট সেটিংস ও ইউজার প্যানেল কন্ট্রোল সফলভাবে সেভ করা হয়েছে!');
    } else {
      onUpdateRate(rateVal);
      onUpdateAnnouncement(noticeInput.trim());
      if (onUpdatePaymentNumbers) {
        onUpdatePaymentNumbers({
          bKash: bkashNumInput.trim(),
          Nagad: nagadNumInput.trim(),
          Rocket: rocketNumInput.trim(),
        });
      }
      if (onUpdateMinWithdrawal) {
        onUpdateMinWithdrawal(minW);
      }
    }

    playSuccessChime();
    showPanelToast('✅ সাইট সেটিংস ও কাস্টমাইজেশন সফলভাবে সেভ করা হয়েছে!');
  };

  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmForm.name.trim() || !pmForm.accountNumber.trim()) {
      showPanelToast('মেথডের নাম এবং অ্যাকাউন্ট / কার্ড / ওয়ালেট নম্বর দিন।', 'error');
      return;
    }

    const cleanMethod: PaymentMethodConfig = {
      id: editingPaymentId || `pm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: pmForm.name.trim(),
      nameBn: pmForm.nameBn.trim() || pmForm.name.trim(),
      category: pmForm.category,
      accountNumber: pmForm.accountNumber.trim(),
      accountTitle: pmForm.accountTitle?.trim() || '',
      bankName: pmForm.bankName?.trim() || '',
      branchName: pmForm.branchName?.trim() || '',
      routingNumber: pmForm.routingNumber?.trim() || '',
      accountTypeLabel: pmForm.accountTypeLabel?.trim() || 'Personal',
      instructions: pmForm.instructions?.trim() || '',
      colorHex: pmForm.colorHex || '#00c853',
      supportsDeposit: pmForm.supportsDeposit,
      supportsWithdrawal: pmForm.supportsWithdrawal,
      isEnabled: pmForm.isEnabled,
    };

    const existingList = localSite.paymentMethods || [];
    const nextList = editingPaymentId
      ? existingList.map((m) => (m.id === editingPaymentId ? cleanMethod : m))
      : [...existingList, cleanMethod];

    const nextSite: SiteSettings = { ...localSite, paymentMethods: nextList };
    setLocalSite(nextSite);
    onUpdateSiteSettings?.(
      nextSite,
      editingPaymentId ? '✅ পেমেন্ট মেথড আপডেট করা হয়েছে!' : '✅ নতুন পেমেন্ট মেথড যোগ করা হয়েছে!'
    );

    if (cleanMethod.name === 'bKash') setBkashNumInput(cleanMethod.accountNumber);
    if (cleanMethod.name === 'Nagad') setNagadNumInput(cleanMethod.accountNumber);
    if (cleanMethod.name === 'Rocket') setRocketNumInput(cleanMethod.accountNumber);

    setEditingPaymentId(null);
    setShowPaymentForm(false);
    playSuccessChime();
    showPanelToast(editingPaymentId ? '✅ পেমেন্ট মেথড আপডেট করা হয়েছে!' : '✅ নতুন পেমেন্ট মেথড যোগ করা হয়েছে!');
  };

  const handleTogglePaymentMethodField = (
    id: string,
    field: 'isEnabled' | 'supportsDeposit' | 'supportsWithdrawal'
  ) => {
    const nextList = (localSite.paymentMethods || []).map((m) =>
      m.id === id ? { ...m, [field]: !m[field] } : m
    );
    const nextSite: SiteSettings = { ...localSite, paymentMethods: nextList };
    setLocalSite(nextSite);
    onUpdateSiteSettings?.(nextSite, '✅ পেমেন্ট মেথড স্ট্যাটাস আপডেট হয়েছে!');
    playPopSound();
  };

  const handleDeletePaymentMethod = (id: string) => {
    const nextList = (localSite.paymentMethods || []).filter((m) => m.id !== id);
    const nextSite: SiteSettings = { ...localSite, paymentMethods: nextList };
    setLocalSite(nextSite);
    onUpdateSiteSettings?.(nextSite, '🗑️ পেমেন্ট মেথড মুছে ফেলা হয়েছে!');
  };

  return (
    <div className="space-y-4 pb-20 text-white animate-in fade-in">
      {/* Top Admin Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-[#101c2e] to-indigo-950 p-4 border border-blue-900/60 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border border-emerald-500/50 bg-black shrink-0 shadow-md">
            <img
              src={localSite.appLogoUrl || '/images/app_logo.jpg'}
              alt="ReelPay BD"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 truncate">
                <span>👑 মাস্টার এডমিন কন্ট্রোল প্যানেল</span>
              </h2>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5 truncate">
              রিলস এডিট/ডিলিট, গ্যালারি থেকে ভিডিও ও অ্যাপ লোগো আপলোড, ইউজার কাস্টমাইজেশন
            </p>
          </div>
        </div>

        <button
          onClick={onExitAdmin}
          className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-800 border border-rose-700/60 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>লগআউট</span>
        </button>
      </div>

      {/* Firebase Admin Auth Status Banner */}
      {!isAdminFirebaseAuthed && (
        <div className="rounded-2xl bg-amber-950/60 border border-amber-500/50 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>এডমিন ডাটাবেজ কন্ট্রোল এক্টিভ করতে Google সাইন-ইন করুন</span>
            </p>
            <p className="text-[11px] text-amber-100/80 mt-0.5">
              {adminFirebaseUser?.email
                ? 'বর্তমান অ্যাকাউন্টটি এডমিন নয়। অনুমোদিত এডমিন অ্যাকাউন্ট দিয়ে লগইন করুন।'
                : 'লাইভ ক্যানসেল, ডিলিট, চ্যাট মনিটরিং ও ডাটাবেজ এডিট করতে অনুমোদিত এডমিন অ্যাকাউন্টে সাইন-ইন করুন।'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => adminLoginWithGoogle()}
            className="min-h-[40px] px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs cursor-pointer shadow shrink-0"
          >
            🔐 Google দিয়ে এডমিন লগইন
          </button>
        </div>
      )}

      {/* Admin Tab Navigation Bar */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 bg-[#101914] p-1.5 rounded-2xl border border-emerald-950/70">
        <button
          onClick={() => setActiveAdminTab('reels')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'reels'
              ? 'bg-[#00c853] text-black shadow-lg shadow-emerald-500/25'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>রিলস কন্ট্রোল ({toBengaliNumber(reels.length)})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('analytics')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'analytics'
              ? 'bg-[#00c853] text-black shadow-lg shadow-emerald-500/25'
              : 'text-emerald-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics (অ্যানালিটিক্স)</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-[#00c853] text-black shadow-lg shadow-emerald-500/25'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>ইউজার কন্ট্রোল ({toBengaliNumber(users.length)})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('earning')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'earning'
              ? 'bg-gradient-to-r from-amber-400 to-emerald-400 text-black shadow-lg shadow-amber-400/25 ring-2 ring-amber-300'
              : 'text-amber-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>🎯 পয়েন্ট ও অফার কন্ট্রোল</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('live')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'live'
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25 ring-2 ring-rose-300/60'
              : 'text-rose-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>📡 লাইভ ও গিফট ({toBengaliNumber(liveStreamsList.filter((s) => s.status === 'active').length)})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('payments')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'payments'
              ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-300/60'
              : 'text-cyan-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>💳 পেমেন্ট মেথড ({toBengaliNumber((localSite.paymentMethods || []).length)})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'settings'
              ? 'bg-[#00c853] text-black shadow-lg shadow-emerald-500/25'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>সাইট ও ফিচার কন্ট্রোল</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('withdrawals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'withdrawals'
              ? 'bg-[#00c853] text-black shadow-lg shadow-emerald-500/25'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>উইথড্রয়াল ({toBengaliNumber(pendingWithdrawals.length)})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('deposits')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'deposits'
              ? 'bg-[#00c853] text-black shadow-lg shadow-emerald-500/25'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>ডিপোজিট ({toBengaliNumber(pendingDeposits.length)})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('chats')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'chats'
              ? 'bg-[#00c853] text-black shadow-lg shadow-emerald-500/25'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>চ্যাট মডারেশন</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('tasks')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'tasks'
              ? 'bg-[#00c853] text-black shadow-lg shadow-emerald-500/25'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>টাস্ক ও সোশ্যাল লিংক ({toBengaliNumber(tasks.length)})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeAdminTab === 'overview'
              ? 'bg-[#00c853] text-black shadow-lg shadow-emerald-500/25'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>ওভারভিউ</span>
        </button>
      </div>

      {/* TAB 1: REELS CONTROL (Create, Edit, Delete, Upload Photo/Video from Gallery) */}
      {activeAdminTab === 'reels' && (
        <div className="space-y-4">
          {/* Create Reel Box */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>🎬 নতুন রিল তৈরি ও গ্যালারি থেকে আপলোড</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  ডিভাইসের গ্যালারি থেকে ছবি ও ভিডিও আপলোড করুন অথবা লিংক দিন
                </p>
              </div>
              <button
                onClick={() => setShowAddReel(!showAddReel)}
                className="px-3.5 py-1.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black text-xs font-bold transition cursor-pointer shadow-md"
              >
                {showAddReel ? 'বন্ধ করুন' : '+ রিল আপলোড'}
              </button>
            </div>

            {showAddReel && (
              <form onSubmit={handleCreateReelSubmit} className="mt-4 space-y-3 pt-3 border-t border-emerald-950">
                {/* 1. Video Upload from Device Gallery */}
                <div className="space-y-1">
                  <label className="text-xs text-neutral-300 font-bold flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                    <span>গ্যালারি থেকে ভিডিও নির্বাচন করুন (MP4, WebM):</span>
                  </label>
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-700/60 rounded-2xl p-4 bg-[#0d1611] hover:bg-[#15231c] cursor-pointer text-center transition"
                  >
                    <UploadCloud className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-white">
                      {selectedVideoFile ? `📹 ${selectedVideoFile.name}` : '📁 গ্যালারি বা ফাইল থেকে ভিডিও পছন্দ করুন'}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      ক্লিক করে ডিভাইস থেকে যেকোনো শর্টস বা ভিডিও আপলোড করুন
                    </p>
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoFileSelect}
                  />

                  {/* Video Live Preview */}
                  {videoPreviewUrl && (
                    <div className="rounded-xl overflow-hidden border border-emerald-500/40 bg-black mt-2">
                      <video src={videoPreviewUrl} controls playsInline className="w-full h-40 object-cover" />
                    </div>
                  )}
                </div>

                {/* 2. Photo/Thumbnail Upload from Gallery */}
                <div className="space-y-1">
                  <label className="text-xs text-neutral-300 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>গ্যালারি থেকে কভার ফটো / থাম্বনেইল নির্বাচন করুন:</span>
                  </label>
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="border border-dashed border-neutral-700 rounded-xl p-3 bg-[#0d1611] hover:bg-[#15231c] cursor-pointer text-center transition"
                  >
                    <p className="text-xs text-neutral-200">
                      {selectedImageFile ? `🖼️ ${selectedImageFile.name}` : '📷 কভার থাম্বনেইল ছবি সিলেক্ট করুন (ঐচ্ছিক)'}
                    </p>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileSelect}
                  />

                  {/* Thumbnail Preview */}
                  {imagePreviewUrl && (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={imagePreviewUrl} alt="Thumbnail preview" className="w-16 h-20 object-cover rounded-lg border border-emerald-500/50" />
                      <span className="text-[11px] text-emerald-400 font-semibold">কভার থাম্বনেইল প্রস্তুত ✅</span>
                    </div>
                  )}
                </div>

                {/* Alternative: Video URL input */}
                <div>
                  <label className="text-xs text-neutral-400 flex items-center gap-1 mb-1">
                    <LinkIcon className="w-3 h-3 text-emerald-400" />
                    <span>অথবা ভিডিও URL / YouTube Short লিংক:</span>
                  </label>
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://... বা https://youtube.com/shorts/..."
                    className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Target User Profile Selector */}
                <div className="p-3 rounded-xl bg-[#0d1611] border border-emerald-900/70 space-y-2">
                  <label className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>কোন ইউজারের প্রোফাইলে ভিডিও দিবে *:</span>
                  </label>
                  <select
                    value={targetUserId}
                    onChange={(e) => {
                      const nextUid = e.target.value;
                      setTargetUserId(nextUid);
                      const picked = users.find((u) => u.id === nextUid);
                      if (picked) {
                        setNewCreator(picked.name);
                      }
                    }}
                    className="w-full bg-[#132219] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {!users.some((u) => u.id === targetUserId) && currentUserUid && (
                      <option value={currentUserUid}>বর্তমান এডমিন ({currentUserUid.slice(0, 8)})</option>
                    )}
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.role === 'admin' ? '(Admin)' : ''} • {u.email || u.phone || u.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const picked = users.find((u) => u.id === targetUserId);
                    if (!picked) return null;
                    return (
                      <div className="flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-900/50">
                        <img src={picked.avatar} alt={picked.name} className="w-5 h-5 rounded-full object-cover border border-emerald-400" />
                        <span>
                          ভিডিওতে <b className="text-white">{picked.name}</b> নাম শো করবে এবং তাদের প্রোফাইলে যুক্ত হবে।
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Title & Creator */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">রিলের শিরোনাম *:</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="যেমন: বিকাশ ক্যাশআউট টিউটোরিয়াল"
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">প্রদর্শিত ক্রিয়েটর নাম:</label>
                    <input
                      type="text"
                      value={newCreator}
                      onChange={(e) => setNewCreator(e.target.value)}
                      placeholder="সিলেক্ট করা ইউজারের নাম"
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Category & Points Reward */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">ক্যাটাগরি:</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as Reel['category'])}
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {REEL_UPLOAD_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.labelBn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">ভিউ রিওয়ার্ড পয়েন্ট:</label>
                    <input
                      type="number"
                      min="1"
                      value={newPointsReward}
                      onChange={(e) => setNewPointsReward(parseInt(e.target.value, 10) || 10)}
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                {/* Caption */}
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">ক্যাপশন ও হ্যাশট্যাগ:</label>
                  <textarea
                    rows={2}
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="ভিডিও সম্পর্কে কিছু লিখুন... #ReelPayBD #Income"
                    className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'প্রসেসিং ও আপলোড হচ্ছে...' : 'রিলটি ফিডে পাবলিশ করুন 🚀'}</span>
                </button>
              </form>
            )}
          </div>

          {/* All Reels Grid with Edit & Delete */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <span>📋 সকল সক্রিয় রিলসের তালিকা ({toBengaliNumber(reels.length)})</span>
              </h3>
              <div className="flex items-center gap-2">
                {(() => {
                  const staleReels = reels.filter((r) => {
                    const owner = users.find((u) => u.id === r.userId);
                    return owner && owner.name && (owner.name !== r.creatorName || owner.avatar !== r.creatorAvatar);
                  });
                  if (staleReels.length === 0 || !onQuickUpdateReel) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        staleReels.forEach((r) => {
                          const owner = users.find((u) => u.id === r.userId);
                          if (owner) {
                            onQuickUpdateReel(r.id, {
                              creatorName: owner.name,
                              creatorAvatar: owner.avatar,
                              isVerified: Boolean(owner.isVerified),
                            });
                          }
                        });
                        showPanelToast(`✅ ${toBengaliNumber(staleReels.length)}টি রিলের প্রোফাইল নাম ডাটাবেসে সিঙ্ক করা হয়েছে!`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 hover:text-black text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition cursor-pointer"
                    >
                      🔄 {toBengaliNumber(staleReels.length)}টি রিলে নাম সিঙ্ক করুন
                    </button>
                  );
                })()}
                <span className="text-[11px] text-neutral-400">এডিট ✏️ ও ডিলিট 🗑️ কন্ট্রোল</span>
              </div>
            </div>

            {reels.length === 0 ? (
              <p className="text-center py-8 text-neutral-500 text-xs">কোনো রিল পাওয়া যায়নি।</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reels.map((reel) => {
                  const owner = users.find((u) => u.id === reel.userId);
                  const displayCreatorName = owner?.name || reel.creatorName;
                  return (
                  <div
                    key={reel.id}
                    className="p-3 rounded-2xl bg-[#0e1712] border border-emerald-950/70 flex gap-3 items-center justify-between hover:border-emerald-800/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={reel.thumbnailUrl}
                        alt={reel.title}
                        className="w-14 h-18 rounded-xl object-cover shrink-0 border border-emerald-950 shadow-md"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs truncate mb-0.5">{reel.title}</p>
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 truncate">
                          <button
                            type="button"
                            onClick={() => {
                              if (owner) {
                                setSelectedUserForDetails(owner);
                                setUserDetailSubTab('reels');
                                setDetailUserPointsInput(String(owner.points));
                              } else {
                                onEditReel(reel);
                              }
                            }}
                            className="text-emerald-300 hover:text-emerald-200 hover:underline font-semibold truncate cursor-pointer text-left"
                            title={owner ? `${displayCreatorName}-এর প্রোফাইল দেখুন` : 'রিলের ইউজার এডিট করুন'}
                          >
                            👤 {displayCreatorName}
                          </button>
                          <span className="shrink-0">({reel.category})</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 mt-1">
                          <span>👁️ {toBengaliNumber(reel.viewsCount || 0)} ভিউ</span>
                          <span>•</span>
                          <span>💰 +{toBengaliNumber(reel.pointsReward)} Pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => onEditReel(reel)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-emerald-600 hover:text-black text-emerald-300 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                        title="রিল এডিট করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">এডিট</span>
                      </button>
                      <button
                        onClick={() => setModeratingReel(reel)}
                        className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-600 hover:text-black text-cyan-300 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-cyan-900/40"
                        title="মন্তব্য দেখুন ও ডিলিট করুন"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">মন্তব্য ({toBengaliNumber(reel.commentsCount || 0)})</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerConfirm(
                            'রিল মুছে ফেলতে চান?',
                            `আপনি কি নিশ্চিত যে "${reel.title}" রিলটি মুছে ফেলতে চান? এটি ফিড থেকে স্থায়ীভাবে ডিলিট হয়ে যাবে। ইউজারকে কোনো বিশেষ কারণ জানাতে চাইলে নিচে লিখুন।`,
                            (reason) => onDeleteReel(reel, reason),
                            true
                          );
                        }}
                        className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-600 hover:text-white text-rose-300 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-rose-900/40"
                        title="রিল মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">মুছুন</span>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USERS CONTROL (Edit points, verify, delete, send messages) */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          {/* Admin Broadcast & Direct Messaging Box */}
          <div id="admin-msg-box" className="rounded-2xl bg-gradient-to-br from-[#12241b] to-[#0c1812] border border-emerald-900/80 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>📢 ইউজারের মেসেজ ইনবক্স কন্ট্রোল (Broadcast & Direct Message)</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/40">
                ১-ক্লিকে ইনবক্সে পৌঁছাবে
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Option A: Broadcast to All Users */}
              <div className="bg-[#0b140f] p-3 rounded-xl border border-emerald-950 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>১ ক্লিকে সকল ইউজারকে মেসেজ পাঠান (Broadcast)</span>
                </div>
                <input
                  type="text"
                  placeholder="মেসেজের শিরোনাম (যেমন: অফার নোটিশ / সিস্টেম আপডেট)"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-[#132219] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
                <textarea
                  rows={2}
                  placeholder="মেসেজের বিস্তারিত লিখুন যা সকল ইউজারের ইনবক্সে দেখা যাবে..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-[#132219] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                />
                <button
                  onClick={() => {
                    if (!broadcastMessage.trim()) {
                      showPanelToast('মেসেজের তথ্য লিখুন।', 'error');
                      return;
                    }
                    if (onBroadcastNotification) {
                      onBroadcastNotification(broadcastTitle.trim() || '📢 জরুরী নোটিশ', broadcastMessage.trim());
                      playSuccessChime();
                      setBroadcastTitle('');
                      setBroadcastMessage('');
                    }
                  }}
                  className="w-full py-2 rounded-lg bg-[#00c853] hover:bg-[#00e676] text-black font-extrabold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>সকল ইউজারকে মেসেজ পাঠান ({toBengaliNumber(users.length)})</span>
                </button>
              </div>

              {/* Option B: Direct Personal Message to Specific User */}
              <div className="bg-[#0b140f] p-3 rounded-xl border border-emerald-950 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>নির্দিষ্ট ইউজারকে মেসেজ পাঠান (শুধু মেসেজ অপশনে যাবে)</span>
                </div>
                <select
                  value={directMsgUserId}
                  onChange={(e) => setDirectMsgUserId(e.target.value)}
                  className="w-full bg-[#132219] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="">-- ইউজার সিলেক্ট করুন --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.phone || u.email || u.id})
                    </option>
                  ))}
                </select>
                <textarea
                  rows={2}
                  placeholder="ইউজারের মেসেজ অপশনে পাঠানোর জন্য মেসেজ লিখুন..."
                  value={directMsgText}
                  onChange={(e) => setDirectMsgText(e.target.value)}
                  className="w-full bg-[#132219] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                />
                <button
                  onClick={() => {
                    if (!directMsgUserId) {
                      showPanelToast('ইউজার সিলেক্ট করুন।', 'error');
                      return;
                    }
                    if (!directMsgText.trim()) {
                      showPanelToast('মেসেজের বিস্তারিত তথ্য লিখুন।', 'error');
                      return;
                    }
                    if (onSendNotification) {
                      onSendNotification(directMsgUserId, '📢 এডমিন মেসেজ', directMsgText.trim());
                      playSuccessChime();
                      setDirectMsgText('');
                    }
                  }}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>ইউজারের মেসেজ অপশনে পাঠান ✉️</span>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>👥 ব্যবহারকারী পরিচালনা ও পয়েন্ট কাস্টমাইজেশন</span>
              </h3>
            
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full sm:w-56 bg-[#0d1611] border border-emerald-950 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto no-scrollbar">
            {users
              .filter(
                (u) =>
                  u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  u.phone.includes(userSearchTerm)
              )
              .map((u) => {
                const isOnline = u.lastActive && new Date().getTime() - new Date(u.lastActive).getTime() < 60000;
                const isEditingThis = editingUserId === u.id;
                const uReels = getUserReels(u);

                return (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl bg-[#0e1712] border border-emerald-950 flex flex-col gap-3 shadow-md hover:border-emerald-800/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => {
                          setSelectedUserForDetails(u);
                          setUserDetailSubTab('reels');
                          setDetailUserPointsInput(String(u.points));
                        }}
                        className="flex items-center gap-3 min-w-0 cursor-pointer group"
                        title="ইউজারের সকল ডিটেইলস ও রিলস দেখতে ক্লিক করুন"
                      >
                        <div className="relative">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-emerald-500/30 group-hover:border-emerald-400 transition"
                          />
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-emerald-300 transition">
                              {u.name}
                            </p>
                            {u.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 uppercase">
                              {u.role}
                            </span>
                            {isOnline && (
                              <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                                Online
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" /> {u.phone || 'N/A'}
                            <span className="text-emerald-900">•</span>
                            <Mail className="w-2.5 h-2.5" /> {u.email || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Points Display & Bonus Button */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-400 text-sm">
                            {toBengaliNumber(u.points)} <span className="text-[10px] text-neutral-400 font-normal">Pts</span>
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (isEditingThis) {
                              setEditingUserId(null);
                            } else {
                              setEditingUserId(u.id);
                              setEditUserPointsInput(String(u.points));
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-emerald-300 transition cursor-pointer"
                        >
                          {isEditingThis ? 'বাতিল' : 'পয়েন্ট এডিট'}
                        </button>
                        <button
                          onClick={() => {
                            setDirectMsgUserId(u.id);
                            const element = document.getElementById('admin-msg-box');
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1 rounded-xl bg-cyan-950 hover:bg-cyan-800 border border-cyan-800/60 text-xs font-bold text-cyan-300 transition cursor-pointer flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>মেসেজ</span>
                        </button>
                      </div>
                    </div>

                    {/* User Stats Summary Strip: Uploaded Reels + Watched Items + Cashouts */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] bg-[#070e0a] px-3 py-1.5 rounded-xl border border-emerald-950/80">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Video className="w-3.5 h-3.5" />
                        <span>আপলোড রিলস: {toBengaliNumber(uReels.length)} টি</span>
                      </span>
                      <span className="text-emerald-900">•</span>
                      <span className="flex items-center gap-1 text-cyan-300 font-bold">
                        <Eye className="w-3.5 h-3.5" />
                        <span>দেখা হয়েছে: {toBengaliNumber(u.reelsWatchedCount || 0)} টি</span>
                      </span>
                      <span className="text-emerald-900">•</span>
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <span>মোট উত্তোলন: ৳{toBengaliNumber(u.totalWithdrawn || 0)}</span>
                      </span>
                    </div>

                    {/* Drilldown Button: View User's Full Profile, Reels, and Details */}
                    <button
                      onClick={() => {
                        setSelectedUserForDetails(u);
                        setUserDetailSubTab('reels');
                        setDetailUserPointsInput(String(u.points));
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-950/70 via-[#102219] to-emerald-950/70 hover:from-blue-900 hover:to-emerald-900 border border-blue-600/40 hover:border-emerald-500/60 text-blue-200 hover:text-white text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-md group"
                    >
                      <span className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-blue-400 group-hover:text-emerald-400 transition" />
                        <span>ইউজারের প্রোফাইল, আপলোডকৃত রিলস ({toBengaliNumber(uReels.length)}) ও সকল ডিটেইলস</span>
                      </span>
                      <span className="text-emerald-400 font-extrabold text-[11px]">দেখুন ➔</span>
                    </button>

                    {/* Inline Point Editor */}
                    {isEditingThis && (
                      <div className="p-3 rounded-xl bg-black/40 border border-emerald-700/40 flex items-center gap-2 animate-in fade-in">
                        <span className="text-xs text-neutral-300 font-semibold">নতুন পয়েন্ট:</span>
                        <input
                          type="number"
                          value={editUserPointsInput}
                          onChange={(e) => setEditUserPointsInput(e.target.value)}
                          className="flex-1 bg-[#121c16] border border-emerald-950 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                        />
                        <button
                          onClick={() => {
                            const newPts = parseInt(editUserPointsInput, 10);
                            if (!isNaN(newPts) && newPts >= 0) {
                              onUpdateUser({ ...u, points: newPts });
                              setEditingUserId(null);
                              playSuccessChime();
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-[#00c853] hover:bg-[#00e676] text-black text-xs font-bold transition cursor-pointer"
                        >
                          সেভ
                        </button>
                      </div>
                    )}

                    {/* Control Row: Toggle Verified, Toggle Role, Delete User */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-950/60 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onUpdateUser({ ...u, isVerified: !u.isVerified });
                            playPopSound();
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                            u.isVerified
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{u.isVerified ? 'ভেরিফায়েড টিক আছে' : '+ ভেরিফায়েড করুন'}</span>
                        </button>

                        <button
                          onClick={() => {
                            const newRole = u.role === 'admin' ? 'user' : 'admin';
                            onUpdateUser({ ...u, role: newRole });
                            playPopSound();
                          }}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-amber-300 transition cursor-pointer"
                        >
                          রোল: {u.role === 'admin' ? 'এডমিন (User করুন)' : 'ইউজার (Admin করুন)'}
                        </button>

                        <button
                          onClick={() => onGiveUserBonus(u.id, 50)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 transition cursor-pointer flex items-center gap-1"
                        >
                          <Gift className="w-3 h-3" />
                          <span>+৫০</span>
                        </button>

                        <button
                          onClick={() => onGiveUserBonus(u.id, 100)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 transition cursor-pointer flex items-center gap-1"
                        >
                          <Gift className="w-3 h-3" />
                          <span>+১০০</span>
                        </button>

                        <button
                          onClick={() => onGiveUserBonus(u.id, -50)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                        >
                          <span>-৫০</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          triggerConfirm(
                            'ইউজার রিমুভ করবেন?',
                            `আপনি কি নিশ্চিত যে ইউজার "${u.name}"-কে ডিলিট বা ব্যান করতে চান? এটি তার সকল ডাটা ডিলিট করে দেবে!`,
                            () => onDeleteUser(u.id, u.name)
                          );
                        }}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ইউজার মুছুন</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      )}

      {/* TAB: POINT EARNING & OFFER CONTROL (কাস্টমাইজেশন, সময় নির্ধারণ ও অফার ভিডিও) */}
      {activeAdminTab === 'earning' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header Banner & Save Action */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-950 via-[#21160a] to-[#122216] border border-amber-500/40 p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>পয়েন্ট আর্নিং ও অফার কন্ট্রোল হাব</span>
                </h3>
              </div>
              <p className="text-xs text-amber-200/80 mt-1">
                ইউজারদের সমস্ত পয়েন্ট আর্নিং ফাংশন অন/অফ, ফুল স্ক্রিন দেখার সময় ও নির্দিষ্ট ভিডিওর অফার কন্ট্রোল করুন
              </p>
            </div>

            <button
              onClick={() => {
                if (onUpdateEarningSettings) {
                  onUpdateEarningSettings(localEarning);
                  playSuccessChime();
                  showPanelToast('✅ সমস্ত আর্নিং সেটিংস ও কাস্টমাইজেশন সফলভাবে সেভ করা হয়েছে!');
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#00c853] hover:from-amber-300 hover:to-[#00e676] text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>সব সেটিংস সেভ করুন 💾</span>
            </button>
          </div>

          {/* 1. MASTER EARNING TOGGLE SWITCH */}
          <div className={`rounded-2xl p-4 border transition-all shadow-xl ${
            localEarning.isMasterEarningEnabled
              ? 'bg-gradient-to-r from-[#112419] to-[#0c1811] border-emerald-500/50 shadow-emerald-500/10'
              : 'bg-gradient-to-r from-[#291313] to-[#180a0a] border-rose-500/50 shadow-rose-500/10'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  localEarning.isMasterEarningEnabled
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                    : 'bg-rose-500/20 border-rose-400 text-rose-400'
                }`}>
                  <Zap className={`w-6 h-6 ${localEarning.isMasterEarningEnabled ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white">
                      গ্লোবাল মাস্টার আর্নিং সুইচ (Master Earning Switch)
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      localEarning.isMasterEarningEnabled
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-rose-950 text-rose-300 border-rose-600'
                    }`}>
                      {localEarning.isMasterEarningEnabled ? 'চালু (Active) ✅' : 'বন্ধ (Off) ⛔'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                    {localEarning.isMasterEarningEnabled
                      ? 'অ্যাপের সমস্ত পয়েন্ট আর্নিং সিস্টেম সক্রিয় রয়েছে। ইউজাররা রিলস দেখে এবং বিভিন্ন টাস্কে পয়েন্ট আর্ন করতে পারছে।'
                      : '⚠️ সমস্ত পয়েন্ট আর্নিং সাময়িকভাবে বন্ধ রয়েছে। ইউজাররা শুধু রিলস এবং বিনোদনের ভিডিও দেখতে পারবে, কোন আর্নিং বা পয়েন্ট পাবে না!'}
                  </p>
                </div>
              </div>

              {/* Master Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...localEarning,
                    isMasterEarningEnabled: !localEarning.isMasterEarningEnabled,
                  };
                  setLocalEarning(updated);
                  if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                  playPopSound();
                }}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 shrink-0 ${
                  localEarning.isMasterEarningEnabled
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-[#00c853] hover:bg-[#00e676] text-black ring-2 ring-emerald-300'
                }`}
              >
                <span>{localEarning.isMasterEarningEnabled ? '🛑 আর্নিং বন্ধ করুন (বিনোদন মোড)' : '⚡ সমস্ত আর্নিং চালু করুন'}</span>
              </button>
            </div>
          </div>

          {/* 1.5 LOGIN / REGISTRATION BONUS OFFER CONTROL */}
          <div className={`rounded-2xl p-4 border transition-all shadow-xl space-y-3 ${
            localEarning.isLoginOfferEnabled && (localEarning.loginOfferPoints || 0) > 0
              ? 'bg-gradient-to-r from-[#172610] to-[#0d1812] border-amber-500/60 shadow-amber-500/10'
              : 'bg-[#141f19] border-emerald-950'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-950/80">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  localEarning.isLoginOfferEnabled
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-400'
                }`}>
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-white">
                      🎁 নতুন রেজিস্ট্রেশন ও লগইন অফার (Login Offer)
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      localEarning.isLoginOfferEnabled && (localEarning.loginOfferPoints || 0) > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}>
                      {localEarning.isLoginOfferEnabled && (localEarning.loginOfferPoints || 0) > 0
                        ? `চালু (+${toBengaliNumber(localEarning.loginOfferPoints)} পয়েন্ট)`
                        : 'বন্ধ (নতুন অ্যাকাউন্টে ০ পয়েন্ট)'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {localEarning.isLoginOfferEnabled && (localEarning.loginOfferPoints || 0) > 0
                      ? `এখন নতুন রেজিস্ট্রেশন বা লগইন করলে ইউজার +${toBengaliNumber(localEarning.loginOfferPoints)} পয়েন্ট অফার বোনাস পাবে।`
                      : 'অফার বন্ধ থাকলে নতুন রেজিস্ট্রেশনে আগে থেকে কোনো পয়েন্ট যোগ থাকবে না (০ পয়েন্ট দিয়ে শুরু হবে)।'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextEnabled = !localEarning.isLoginOfferEnabled;
                  const nextPoints = nextEnabled
                    ? (localEarning.loginOfferPoints && localEarning.loginOfferPoints > 0 ? localEarning.loginOfferPoints : 100)
                    : 0;
                  const updated: EarningSettings = {
                    ...localEarning,
                    isLoginOfferEnabled: nextEnabled,
                    loginOfferPoints: nextPoints,
                    loginOfferCampaignId: nextEnabled ? `offer_${Date.now()}` : '',
                  };
                  setLocalEarning(updated);
                  if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                  playSuccessChime();
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer shrink-0 active:scale-95 shadow-md ${
                  localEarning.isLoginOfferEnabled
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-black'
                }`}
              >
                {localEarning.isLoginOfferEnabled ? 'অফার বন্ধ করুন (০ পয়েন্ট)' : 'লগইন অফার চালু করুন 🎁'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-xs font-bold text-emerald-300 block mb-1.5">
                  লগইন / রেজিস্ট্রেশন অফার পয়েন্ট:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={localEarning.loginOfferPoints ?? 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setLocalEarning(prev => ({
                        ...prev,
                        loginOfferPoints: val,
                        isLoginOfferEnabled: val > 0,
                        loginOfferCampaignId: val > 0 ? `offer_${Date.now()}` : '',
                      }));
                    }}
                    className="w-28 bg-[#0d1611] border border-emerald-900 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-neutral-400">পয়েন্ট</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 block mb-1.5">দ্রুত অফার সিলেক্ট করুন:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 50, 100, 200, 500].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => {
                        const updated: EarningSettings = {
                          ...localEarning,
                          isLoginOfferEnabled: pts > 0,
                          loginOfferPoints: pts,
                          loginOfferCampaignId: pts > 0 ? `offer_${Date.now()}` : '',
                        };
                        setLocalEarning(updated);
                        if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                        playSuccessChime();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                        (localEarning.isLoginOfferEnabled ? localEarning.loginOfferPoints : 0) === pts
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-[#0e1712] text-neutral-300 hover:text-white border border-emerald-900/60'
                      }`}
                    >
                      {pts === 0 ? '০ (অফার নেই)' : `+${toBengaliNumber(pts)} পয়েন্ট`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. FULLSCREEN VIDEO & REEL WATCH EARNING CONTROL */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-950">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    🎬 ফুল স্ক্রিন ভিডিও দেখার সময় ও পয়েন্ট নির্ধারণ
                  </h4>
                  <p className="text-xs text-neutral-400">
                    ইউজার কতক্ষণ সময় ফুল স্ক্রিন ভিডিও দেখবে এবং কত পয়েন্ট পাবে তা এখান থেকে পরিবর্তন করুন
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 bg-[#0e1712] px-3 py-1.5 rounded-xl border border-emerald-900/60 cursor-pointer self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={localEarning.isVideoWatchEarningEnabled}
                  onChange={(e) => setLocalEarning(prev => ({ ...prev, isVideoWatchEarningEnabled: e.target.checked }))}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-xs font-bold text-white">
                  {localEarning.isVideoWatchEarningEnabled ? 'ভিডিও ওয়াচ আর্নিং চালু ✅' : 'ভিডিও ওয়াচ আর্নিং বন্ধ ❌'}
                </span>
              </label>
            </div>

            {/* Duration & Points Customization Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Watch Time in Seconds */}
              <div className="bg-[#0e1712] p-3.5 rounded-xl border border-emerald-950 space-y-2">
                <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                  <span>⏱️ ফুল স্ক্রিন ভিডিও দেখার সময় (সেকেন্ডে):</span>
                  <span className="text-amber-400 font-extrabold text-sm font-mono">
                    {toBengaliNumber(localEarning.videoWatchDurationSeconds)} সেকেন্ড ({localEarning.videoWatchDurationSeconds}s)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="3"
                    max="600"
                    value={localEarning.videoWatchDurationSeconds}
                    onChange={(e) => {
                      const val = Math.max(3, parseInt(e.target.value, 10) || 15);
                      setLocalEarning(prev => ({ ...prev, videoWatchDurationSeconds: val }));
                    }}
                    className="w-24 bg-[#14231b] border border-emerald-900 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-neutral-400 font-medium">সেকেন্ড ফুল স্ক্রিনে দেখলে রিওয়ার্ড সম্পন্ন হবে</span>
                </div>

                {/* Quick Preset Buttons */}
                <div className="pt-1">
                  <span className="text-[10px] text-neutral-400 block mb-1">দ্রুত সময় সিলেক্ট করুন:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 15, 20, 30, 45, 60].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setLocalEarning(prev => ({ ...prev, videoWatchDurationSeconds: sec }))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          localEarning.videoWatchDurationSeconds === sec
                            ? 'bg-amber-400 text-black shadow-md'
                            : 'bg-[#14231b] text-neutral-300 hover:text-white border border-emerald-900/60'
                        }`}
                      >
                        {toBengaliNumber(sec)} সেকেন্ড
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Default Reward Points per Reel */}
              <div className="bg-[#0e1712] p-3.5 rounded-xl border border-emerald-950 space-y-2">
                <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                  <span>💰 ডিফল্ট রিওয়ার্ড পয়েন্ট (প্রতি ভিডিওতে):</span>
                  <span className="text-emerald-400 font-extrabold text-sm font-mono">
                    +{toBengaliNumber(localEarning.defaultVideoRewardPoints)} পয়েন্ট ({localEarning.defaultVideoRewardPoints} Pts)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={localEarning.defaultVideoRewardPoints}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 10);
                      setLocalEarning(prev => ({ ...prev, defaultVideoRewardPoints: val }));
                    }}
                    className="w-24 bg-[#14231b] border border-emerald-900 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-neutral-400 font-medium">পয়েন্ট ইউজারের একাউন্টে যুক্ত হবে</span>
                </div>

                {/* Quick Presets for Points */}
                <div className="pt-1">
                  <span className="text-[10px] text-neutral-400 block mb-1">দ্রুত পয়েন্ট সিলেক্ট করুন:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 15, 20, 25, 50, 100].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setLocalEarning(prev => ({ ...prev, defaultVideoRewardPoints: pts }))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          localEarning.defaultVideoRewardPoints === pts
                            ? 'bg-[#00c853] text-black shadow-md'
                            : 'bg-[#14231b] text-neutral-300 hover:text-white border border-emerald-900/60'
                        }`}
                      >
                        +{toBengaliNumber(pts)} Pts
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scope Selection: All Videos vs Specific Offer Videos */}
            <div className="bg-[#0e1712] p-3.5 rounded-xl border border-emerald-950 space-y-2">
              <label className="text-xs font-bold text-white block">
                🎯 অফার ভিডিওর আর্নিং স্কোপ (Earning Target Scope):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                  localEarning.videoEarningScope === 'all_reels'
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-white shadow-md'
                    : 'bg-[#131f18] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}>
                  <input
                    type="radio"
                    name="earningScope"
                    checked={localEarning.videoEarningScope === 'all_reels'}
                    onChange={() => setLocalEarning(prev => ({ ...prev, videoEarningScope: 'all_reels' }))}
                    className="text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-white block">সকল ভিডিওতে আর্নিং চালু</span>
                    <span className="text-[10px] text-neutral-400 block">অ্যাপের যেকোনো রিল দেখলেই ইউজার পয়েন্ট পাবে</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                  localEarning.videoEarningScope === 'offer_reels_only'
                    ? 'bg-amber-950/60 border-amber-500/80 text-white shadow-md'
                    : 'bg-[#131f18] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}>
                  <input
                    type="radio"
                    name="earningScope"
                    checked={localEarning.videoEarningScope === 'offer_reels_only'}
                    onChange={() => setLocalEarning(prev => ({ ...prev, videoEarningScope: 'offer_reels_only' }))}
                    className="text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-amber-300 block">শুধুমাত্র নির্দিষ্ট অফার ভিডিওতে আর্নিং চালু 🔥</span>
                    <span className="text-[10px] text-neutral-400 block">এডমিন যেসব ভিডিওতে অফার দেবে শুধু সেগুলোতেই পয়েন্ট পাবে</span>
                  </div>
                </label>
              </div>

              {/* Feed Direct Claim Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-emerald-950/80 mt-2">
                <div>
                  <span className="text-xs font-bold text-neutral-200 block">হোম ফিড থেকে সরাসরি ক্লেইম বাটন (+পয়েন্ট) চালু:</span>
                  <span className="text-[10px] text-neutral-400">ফিড স্ক্রল করার সময় ইউজার ক্লেইম করতে পারবে কিনা</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localEarning.allowDirectFeedClaim}
                    onChange={(e) => {
                      const updated = { ...localEarning, allowDirectFeedClaim: e.target.checked };
                      setLocalEarning(updated);
                      if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                    }}
                    className="rounded text-emerald-500 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-emerald-400">
                    {localEarning.allowDirectFeedClaim ? 'চালু' : 'বন্ধ'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* 2.4 GLOBAL DAILY TOTAL EARNING LIMIT CONTROL (ALL SOURCES) */}
          <div className={`rounded-2xl p-4 border shadow-lg space-y-4 transition-all ${
            localEarning.isDailyTotalLimitEnabled !== false
              ? 'bg-gradient-to-r from-[#1a2211] to-[#0d1611] border-amber-500/45'
              : 'bg-[#141f19] border-emerald-950'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-950">
              <div className="flex items-start gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  localEarning.isDailyTotalLimitEnabled !== false
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-white">
                      🛑 গ্লোবাল দৈনিক মোট উপার্জন লিমিট (Global Daily Earning Cap)
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      localEarning.isDailyTotalLimitEnabled !== false
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}>
                      {localEarning.isDailyTotalLimitEnabled !== false
                        ? `সক্রিয় (সর্বোচ্চ ${toBengaliNumber(localEarning.dailyMaxTotalPoints ?? 250)} Pts/দিন)`
                        : 'বন্ধ (শুধু সেকশন-ভিত্তিক লিমিট)'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    রিল দেখা, স্পিন, স্ক্র্যাচ কার্ড, দৈনিক বোনাস ও টাস্ক/অফার মিলিয়ে একজন ইউজার প্রতিদিন সর্বোচ্চ কত পয়েন্ট উপার্জন করতে পারবে তা নির্ধারণ করুন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextEnabled = localEarning.isDailyTotalLimitEnabled === false;
                  const updated: EarningSettings = {
                    ...localEarning,
                    isDailyTotalLimitEnabled: nextEnabled,
                  };
                  setLocalEarning(updated);
                  if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                  playSuccessChime();
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer shrink-0 active:scale-95 shadow-md ${
                  localEarning.isDailyTotalLimitEnabled !== false
                    ? 'bg-amber-400 hover:bg-amber-300 text-black'
                    : 'bg-neutral-700 hover:bg-neutral-600 text-white'
                }`}
              >
                {localEarning.isDailyTotalLimitEnabled !== false ? '✅ গ্লোবাল লিমিট চালু' : '🚫 লিমিট বন্ধ (চালু করুন)'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Global Daily Max Total Points */}
              <div className="bg-[#0e1712] p-3.5 rounded-xl border border-emerald-950 space-y-2">
                <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>🪙 দৈনিক সর্বোচ্চ মোট পয়েন্ট লিমিট (সকল উৎস):</span>
                  <span className="text-emerald-400 font-extrabold text-sm font-mono">
                    {(localEarning.dailyMaxTotalPoints ?? 250) > 0
                      ? `${toBengaliNumber(localEarning.dailyMaxTotalPoints ?? 250)} Pts/দিন`
                      : 'আনলিমিটেড'}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={localEarning.dailyMaxTotalPoints ?? 250}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value, 10);
                      const val = Number.isNaN(raw) ? 0 : Math.max(0, raw);
                      setLocalEarning(prev => ({ ...prev, dailyMaxTotalPoints: val }));
                    }}
                    className="w-28 bg-[#14231b] border border-emerald-900 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-neutral-400">পয়েন্ট (সকল অফার/টাস্ক/রিলস মিলিয়ে)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[100, 200, 250, 500, 1000, 2000].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => {
                        const updated = { ...localEarning, isDailyTotalLimitEnabled: true, dailyMaxTotalPoints: pts };
                        setLocalEarning(updated);
                        if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                        playPopSound();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        (localEarning.dailyMaxTotalPoints ?? 250) === pts
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-[#14231b] text-neutral-300 hover:text-white border border-emerald-900/60'
                      }`}
                    >
                      {toBengaliNumber(pts)} Pts
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Task/Offer Claims Limit */}
              <div className="bg-[#0e1712] p-3.5 rounded-xl border border-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-300">
                    🎯 দৈনিক সর্বোচ্চ অফার / টাস্ক ক্লেইম লিমিট:
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localEarning.isDailyTaskLimitEnabled !== false}
                      onChange={(e) => {
                        const updated = { ...localEarning, isDailyTaskLimitEnabled: e.target.checked };
                        setLocalEarning(updated);
                        if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                      }}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-emerald-400">
                      {localEarning.isDailyTaskLimitEnabled !== false ? 'চালু' : 'বন্ধ'}
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={localEarning.dailyMaxTaskClaims ?? 5}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value, 10);
                      const val = Number.isNaN(raw) ? 0 : Math.max(0, raw);
                      setLocalEarning(prev => ({ ...prev, dailyMaxTaskClaims: val }));
                    }}
                    className="w-24 bg-[#14231b] border border-emerald-900 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-neutral-400">টি অফার/দিন (০ = আনলিমিটেড)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[2, 3, 5, 10, 0].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localEarning,
                          isDailyTaskLimitEnabled: cnt > 0,
                          dailyMaxTaskClaims: cnt,
                        };
                        setLocalEarning(updated);
                        if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                        playPopSound();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        (localEarning.dailyMaxTaskClaims ?? 5) === cnt
                          ? 'bg-[#00c853] text-black shadow-md'
                          : 'bg-[#14231b] text-neutral-300 hover:text-white border border-emerald-900/60'
                      }`}
                    >
                      {cnt === 0 ? 'আনলিমিটেড' : `${toBengaliNumber(cnt)}টি/দিন`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2.5 DAILY REEL & POINT EARNING LIMIT CONTROL */}
          <div className={`rounded-2xl p-4 border shadow-lg space-y-4 transition-all ${
            localEarning.isDailyReelLimitEnabled !== false
              ? 'bg-gradient-to-r from-[#112119] to-[#0d1611] border-emerald-500/40'
              : 'bg-[#141f19] border-emerald-950'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-950">
              <div className="flex items-start gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  localEarning.isDailyReelLimitEnabled !== false
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-white">
                      🛡️ দৈনিক রিল ও পয়েন্ট আর্নিং লিমিট (Daily Limit Control)
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      localEarning.isDailyReelLimitEnabled !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}>
                      {localEarning.isDailyReelLimitEnabled !== false
                        ? `সক্রিয় (সর্বোচ্চ ${toBengaliNumber(localEarning.dailyMaxReelClaims ?? 5)} রিল / ${toBengaliNumber(localEarning.dailyMaxReelPoints ?? 100)} Pts)`
                        : 'লিমিট বন্ধ (আনলিমিটেড)'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    হোম পেজ ও ফুল স্ক্রিন বাটনে ক্লিক করে একজন ইউজার প্রতিদিন সর্বোচ্চ কতটি রিল থেকে কত পয়েন্ট আয় করতে পারবে তা নিয়ন্ত্রণ করুন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextEnabled = localEarning.isDailyReelLimitEnabled === false;
                  const updated: EarningSettings = {
                    ...localEarning,
                    isDailyReelLimitEnabled: nextEnabled,
                  };
                  setLocalEarning(updated);
                  if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                  playSuccessChime();
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer shrink-0 active:scale-95 shadow-md ${
                  localEarning.isDailyReelLimitEnabled !== false
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-neutral-700 hover:bg-neutral-600 text-white'
                }`}
              >
                {localEarning.isDailyReelLimitEnabled !== false ? '✅ লিমিট চালু আছে' : '🚫 লিমিট বন্ধ (চালু করুন)'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Daily Reel Claims */}
              <div className="bg-[#0e1712] p-3.5 rounded-xl border border-emerald-950 space-y-2">
                <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                  <span>🎬 দৈনিক সর্বোচ্চ রিল ক্লেইম সংখ্যা:</span>
                  <span className="text-amber-400 font-extrabold text-sm font-mono">
                    {(localEarning.dailyMaxReelClaims ?? 5) > 0
                      ? `${toBengaliNumber(localEarning.dailyMaxReelClaims ?? 5)}টি রিল/দিন`
                      : 'আনলিমিটেড'}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={localEarning.dailyMaxReelClaims ?? 5}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setLocalEarning(prev => ({ ...prev, dailyMaxReelClaims: val }));
                    }}
                    className="w-24 bg-[#14231b] border border-emerald-900 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-neutral-400">টি রিল (০ দিলে শুধু পয়েন্ট লিমিট চলবে)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[3, 5, 10, 20, 50].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        const updated = { ...localEarning, isDailyReelLimitEnabled: true, dailyMaxReelClaims: cnt };
                        setLocalEarning(updated);
                        if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                        playPopSound();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        (localEarning.dailyMaxReelClaims ?? 5) === cnt
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-[#14231b] text-neutral-300 hover:text-white border border-emerald-900/60'
                      }`}
                    >
                      {toBengaliNumber(cnt)}টি রিল
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Daily Reel Points */}
              <div className="bg-[#0e1712] p-3.5 rounded-xl border border-emerald-950 space-y-2">
                <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                  <span>🪙 দৈনিক সর্বোচ্চ রিল পয়েন্ট লিমিট:</span>
                  <span className="text-emerald-400 font-extrabold text-sm font-mono">
                    {(localEarning.dailyMaxReelPoints ?? 100) > 0
                      ? `${toBengaliNumber(localEarning.dailyMaxReelPoints ?? 100)} Pts/দিন`
                      : 'আনলিমিটেড'}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={localEarning.dailyMaxReelPoints ?? 100}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setLocalEarning(prev => ({ ...prev, dailyMaxReelPoints: val }));
                    }}
                    className="w-24 bg-[#14231b] border border-emerald-900 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-neutral-400">পয়েন্ট (০ দিলে শুধু রিল সংখ্যা লিমিট চলবে)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[50, 100, 200, 500, 1000].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => {
                        const updated = { ...localEarning, isDailyReelLimitEnabled: true, dailyMaxReelPoints: pts };
                        setLocalEarning(updated);
                        if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                        playPopSound();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        (localEarning.dailyMaxReelPoints ?? 100) === pts
                          ? 'bg-[#00c853] text-black shadow-md'
                          : 'bg-[#14231b] text-neutral-300 hover:text-white border border-emerald-900/60'
                      }`}
                    >
                      {toBengaliNumber(pts)} Pts
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fullscreen Wait Timer Rule + Quick Save */}
            <div className="bg-[#0e1712] p-3.5 rounded-xl border border-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localEarning.requireFullWatchTimeInFullScreen !== false}
                  onChange={(e) => {
                    const updated = { ...localEarning, requireFullWatchTimeInFullScreen: e.target.checked };
                    setLocalEarning(updated);
                    if (onUpdateEarningSettings) onUpdateEarningSettings(updated);
                  }}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    ⏳ ফুল স্ক্রিনে পুরো সময় না দেখা পর্যন্ত বাটন লক রাখুন
                  </span>
                  <span className="text-[10px] text-neutral-400 block">
                    চালু থাকলে ইউজার ফুল স্ক্রিনে নির্ধারিত {toBengaliNumber(localEarning.videoWatchDurationSeconds)} সেকেন্ড না দেখে ক্লিক করে পয়েন্ট নিতে পারবে না
                  </span>
                </div>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (onUpdateEarningSettings) onUpdateEarningSettings(localEarning);
                  playSuccessChime();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition active:scale-95 cursor-pointer shrink-0 shadow-md"
              >
                লিমিট সেভ করুন ✅
              </button>
            </div>
          </div>

          {/* 3. SPECIFIC VIDEO OFFER & REEL EARNING MANAGER */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>🎥 নির্দিষ্ট ভিডিওর অফার ও আর্নিং কাস্টমাইজেশন</span>
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  যেকোনো ভিডিওর পয়েন্ট আর্নিং অন/অফ করুন, ফুলস্ক্রিন দেখার সময় ও স্পেশাল অফার সেট করুন
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ভিডিও খুঁজুন..."
                    value={reelSearchTerm}
                    onChange={(e) => setReelSearchTerm(e.target.value)}
                    className="bg-[#0e1712] border border-emerald-950 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-36 sm:w-44"
                  />
                </div>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'all', label: `সকল ভিডিও (${reels.length})` },
                { id: 'offers_only', label: `🔥 স্পেশাল অফার (${reels.filter(r => r.isSpecialOffer).length})` },
                { id: 'earning_on', label: `✅ আর্নিং চালু (${reels.filter(r => r.isEarningEnabled !== false).length})` },
                { id: 'earning_off', label: `❌ আর্নিং বন্ধ (${reels.filter(r => r.isEarningEnabled === false).length})` },
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setReelOfferFilter(chip.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    reelOfferFilter === chip.id
                      ? 'bg-[#00c853] text-black shadow-md'
                      : 'bg-[#0e1712] text-neutral-300 hover:text-white border border-emerald-950'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Reels Table / Card List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto no-scrollbar pt-2">
              {reels
                .filter((r) => {
                  const matchSearch = r.title.toLowerCase().includes(reelSearchTerm.toLowerCase()) ||
                    r.creatorName.toLowerCase().includes(reelSearchTerm.toLowerCase());
                  if (!matchSearch) return false;

                  if (reelOfferFilter === 'offers_only') return Boolean(r.isSpecialOffer);
                  if (reelOfferFilter === 'earning_on') return r.isEarningEnabled !== false;
                  if (reelOfferFilter === 'earning_off') return r.isEarningEnabled === false;
                  return true;
                })
                .map((reel) => {
                  const owner = users.find((u) => u.id === reel.userId);
                  const displayCreatorName = owner?.name || reel.creatorName;
                  return (
                  <div
                    key={reel.id}
                    className="p-3.5 rounded-2xl bg-[#0d1611] border border-emerald-950/80 hover:border-emerald-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
                  >
                    {/* Left: Thumbnail & Meta */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={reel.thumbnailUrl}
                          alt={reel.title}
                          className="w-14 h-18 rounded-xl object-cover border border-emerald-950 shadow-md"
                        />
                        {reel.isSpecialOffer && (
                          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase shadow-md animate-pulse">
                            অফার
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h5 className="font-bold text-white text-xs truncate max-w-xs">{reel.title}</h5>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                            {reel.category}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (owner) {
                              setSelectedUserForDetails(owner);
                              setUserDetailSubTab('reels');
                              setDetailUserPointsInput(String(owner.points));
                            } else {
                              onEditReel(reel);
                            }
                          }}
                          className="text-[11px] text-emerald-300 hover:text-emerald-200 hover:underline font-semibold cursor-pointer text-left"
                        >
                          👤 {displayCreatorName}
                        </button>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            reel.isEarningEnabled !== false
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                          }`}>
                            {reel.isEarningEnabled !== false ? '✅ আর্নিং চালু' : '❌ আর্নিং বন্ধ'}
                          </span>

                          <span className="text-amber-400 font-bold bg-[#14231b] px-2 py-0.5 rounded-full border border-emerald-900/60">
                            💰 +{toBengaliNumber(reel.pointsReward)} Pts
                          </span>

                          <span className="text-cyan-300 font-bold bg-[#14231b] px-2 py-0.5 rounded-full border border-emerald-900/60">
                            ⏱️ {toBengaliNumber(reel.customWatchSeconds || localEarning.videoWatchDurationSeconds)} সেকেন্ড
                          </span>

                          {reel.isSpecialOffer && (
                            <span className="text-amber-300 font-black bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/60">
                              {reel.specialOfferBadge || '🔥 স্পেশাল অফার'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800/80 shrink-0">
                      {/* Earning Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...reel,
                            isEarningEnabled: reel.isEarningEnabled === false ? true : false,
                          };
                          if (onQuickUpdateReel) {
                            onQuickUpdateReel(reel.id, { isEarningEnabled: updated.isEarningEnabled });
                          } else {
                            onEditReel(updated);
                          }
                          playSuccessChime();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm ${
                          reel.isEarningEnabled !== false
                            ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        }`}
                        title="এই ভিডিওতে পয়েন্ট দেওয়া হবে কিনা"
                      >
                        {reel.isEarningEnabled !== false ? 'আর্নিং চালু ✓' : 'আর্নিং বন্ধ ✕'}
                      </button>

                      {/* Special Offer Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          const newOfferState = !reel.isSpecialOffer;
                          const updated = {
                            ...reel,
                            isSpecialOffer: newOfferState,
                            specialOfferBadge: reel.specialOfferBadge || '🔥 স্পেশাল অফার',
                            pointsReward: newOfferState ? Math.max(reel.pointsReward, 25) : reel.pointsReward,
                          };
                          if (onQuickUpdateReel) {
                            onQuickUpdateReel(reel.id, {
                              isSpecialOffer: updated.isSpecialOffer,
                              specialOfferBadge: updated.specialOfferBadge,
                              pointsReward: updated.pointsReward,
                            });
                          } else {
                            onEditReel(updated);
                          }
                          playSuccessChime();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm ${
                          reel.isSpecialOffer
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-black font-extrabold shadow-amber-500/20'
                            : 'bg-[#18271e] hover:bg-[#203428] text-amber-300 border border-amber-900/60'
                        }`}
                        title="স্পেশাল অফার হিসেবে ভিডিওটি হাইলাইট করুন"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>{reel.isSpecialOffer ? 'অফার সক্রিয় 🔥' : '+ অফার দিন'}</span>
                      </button>

                      {/* Edit full details */}
                      <button
                        type="button"
                        onClick={() => onEditReel(reel)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        title="সময় ও পয়েন্ট বিস্তারিত এডিট করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>কাস্টমাইজ</span>
                      </button>
                    </div>
                  </div>
                  );
                })}
            </div>
          </div>

          {/* 4. OTHER POINT EARNING FUNCTIONS CUSTOMIZATION */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>🎁 অন্যান্য সকল আর্নিং মেথড কাস্টমাইজেশন</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Daily Bonus Control */}
              <div className="p-3.5 rounded-xl bg-[#0e1712] border border-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    <span>দৈনিক বোনাস (Daily Bonus):</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localEarning.isDailyBonusEnabled}
                      onChange={(e) => setLocalEarning(prev => ({ ...prev, isDailyBonusEnabled: e.target.checked }))}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-emerald-400">
                      {localEarning.isDailyBonusEnabled ? 'চালু' : 'বন্ধ'}
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">দৈনিক বোনাস পয়েন্ট:</span>
                  <input
                    type="number"
                    min="0"
                    value={localEarning.dailyBonusPoints}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value, 10);
                      setLocalEarning(prev => ({ ...prev, dailyBonusPoints: Number.isNaN(raw) ? 0 : Math.max(0, raw) }));
                    }}
                    className="w-24 bg-[#14231b] border border-emerald-900 rounded-lg px-2.5 py-1 text-xs text-white font-bold text-center focus:border-emerald-500"
                  />
                  <span className="text-xs text-neutral-400">পয়েন্ট</span>
                </div>
              </div>

              {/* Lucky Spin Wheel Control */}
              <div className="p-3.5 rounded-xl bg-[#0e1712] border border-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <RotateCw className="w-4 h-4 text-emerald-400" />
                    <span>ভাগ্য চাকা (Lucky Spin Wheel):</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localEarning.isSpinWheelEnabled}
                      onChange={(e) => setLocalEarning(prev => ({ ...prev, isSpinWheelEnabled: e.target.checked }))}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-emerald-400">
                      {localEarning.isSpinWheelEnabled ? 'চালু' : 'বন্ধ'}
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">সর্বোচ্চ পুরস্কার পয়েন্ট:</span>
                    <input
                      type="number"
                      min="1"
                      value={localEarning.spinMaxPrize}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        const val = Number.isNaN(raw) ? 10 : Math.max(1, raw);
                        setLocalEarning(prev => ({
                          ...prev,
                          spinMaxPrize: val,
                          spinPrizes: buildScaledSpinPrizes(val),
                        }));
                      }}
                      className="w-24 bg-[#14231b] border border-emerald-900 rounded-lg px-2.5 py-1 text-xs text-white font-bold text-center focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-emerald-950/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-semibold">স্পিন লিমিট পদ্ধতি:</span>
                    <select
                      value={localEarning.spinLimitMode || 'video_based'}
                      onChange={(e) => setLocalEarning(prev => ({ ...prev, spinLimitMode: e.target.value as 'fixed' | 'video_based' }))}
                      className="bg-[#14231b] border border-emerald-900 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:border-emerald-500"
                    >
                      <option value="video_based">ভিডিও দেখার ওপর ভিত্তি করে (Video Based)</option>
                      <option value="fixed">নির্দিষ্ট দৈনিক লিমিট (Fixed Daily)</option>
                    </select>
                  </div>

                  {localEarning.spinLimitMode === 'video_based' ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">প্রতি কয়টি রিল দেখলে ১ স্পিন:</span>
                      <input
                        type="number"
                        min="1"
                        value={localEarning.spinVideosRequired ?? 2}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          setLocalEarning(prev => ({ ...prev, spinVideosRequired: Number.isNaN(raw) ? 1 : Math.max(1, raw) }));
                        }}
                        className="w-24 bg-[#14231b] border border-emerald-900 rounded-lg px-2.5 py-1 text-xs text-white font-bold text-center focus:border-emerald-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">দৈনিক সর্বোচ্চ স্পিন:</span>
                      <input
                        type="number"
                        min="0"
                        value={localEarning.dailyMaxSpins ?? 5}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          setLocalEarning(prev => ({ ...prev, dailyMaxSpins: Number.isNaN(raw) ? 0 : Math.max(0, raw) }));
                        }}
                        className="w-24 bg-[#14231b] border border-emerald-900 rounded-lg px-2.5 py-1 text-xs text-white font-bold text-center focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <div className="pt-1">
                    <span className="text-[10px] text-neutral-400 block mb-1">চাকার ৮টি স্লটের পয়েন্ট (কমা দিয়ে কাস্টমাইজ):</span>
                    <input
                      type="text"
                      value={(localEarning.spinPrizes || []).join(', ')}
                      onChange={(e) => {
                        const nums = e.target.value
                          .split(',')
                          .map((s) => parseInt(s.trim(), 10))
                          .filter((n) => !Number.isNaN(n) && n >= 0)
                          .slice(0, 12);
                        if (nums.length > 0) {
                          setLocalEarning(prev => ({ ...prev, spinPrizes: nums, spinMaxPrize: Math.max(...nums) }));
                        }
                      }}
                      className="w-full bg-[#14231b] border border-emerald-900 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-emerald-300 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Scratch Card Control */}
              <div className="p-3.5 rounded-xl bg-[#0e1712] border border-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>দৈনিক স্ক্র্যাচ কার্ড (Scratch Card):</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localEarning.isScratchCardEnabled}
                      onChange={(e) => setLocalEarning(prev => ({ ...prev, isScratchCardEnabled: e.target.checked }))}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-emerald-400">
                      {localEarning.isScratchCardEnabled ? 'চালু' : 'বন্ধ'}
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">নিশ্চিত পুরস্কার পয়েন্ট:</span>
                  <input
                    type="number"
                    min="0"
                    value={localEarning.scratchCardPrize}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value, 10);
                      setLocalEarning(prev => ({ ...prev, scratchCardPrize: Number.isNaN(raw) ? 0 : Math.max(0, raw) }));
                    }}
                    className="w-24 bg-[#14231b] border border-emerald-900 rounded-lg px-2.5 py-1 text-xs text-white font-bold text-center focus:border-emerald-500"
                  />
                  <span className="text-xs text-neutral-400">পয়েন্ট</span>
                </div>
              </div>

              {/* Referral System Control */}
              <div className="p-3.5 rounded-xl bg-[#0e1712] border border-emerald-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span>রেফারাল সিস্টেম ও শর্ত কন্ট্রোল:</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localEarning.isReferralEnabled}
                      onChange={(e) => setLocalEarning(prev => ({ ...prev, isReferralEnabled: e.target.checked }))}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-emerald-400">
                      {localEarning.isReferralEnabled ? 'চালু' : 'বন্ধ'}
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">রেফারকারী পাবে:</span>
                    <input
                      type="number"
                      min="0"
                      value={localEarning.referralRewardPoints}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        setLocalEarning(prev => ({ ...prev, referralRewardPoints: Number.isNaN(raw) ? 0 : Math.max(0, raw) }));
                      }}
                      className="w-full bg-[#14231b] border border-emerald-900 rounded-lg px-2 py-1 text-xs text-white font-bold text-center focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">নতুন ফ্রেন্ড পাবে:</span>
                    <input
                      type="number"
                      min="0"
                      value={localEarning.referredUserRewardPoints}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        setLocalEarning(prev => ({ ...prev, referredUserRewardPoints: Number.isNaN(raw) ? 0 : Math.max(0, raw) }));
                      }}
                      className="w-full bg-[#14231b] border border-emerald-900 rounded-lg px-2 py-1 text-xs text-white font-bold text-center focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">দৈনিক রেফার লিমিট:</span>
                    <input
                      type="number"
                      min="0"
                      value={localEarning.dailyMaxReferrals ?? 10}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        setLocalEarning(prev => ({ ...prev, dailyMaxReferrals: Number.isNaN(raw) ? 0 : Math.max(0, raw) }));
                      }}
                      className="w-full bg-[#14231b] border border-emerald-900 rounded-lg px-2 py-1 text-xs text-white font-bold text-center focus:border-emerald-500"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1 cursor-pointer text-[11px] text-neutral-300">
                  <input
                    type="checkbox"
                    checked={localEarning.requireReelWatchForReferral !== false}
                    onChange={(e) => setLocalEarning(prev => ({ ...prev, requireReelWatchForReferral: e.target.checked }))}
                    className="rounded text-emerald-500 focus:ring-0"
                  />
                  <span>বন্ধু ১টি রিল দেখার পরই রেফার বোনাস আনলক হবে (অ্যান্টি-ফেক চেক)</span>
                </label>
              </div>

              {/* Tasks Center Control */}
              <div className="p-3.5 rounded-xl bg-[#0e1712] border border-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-emerald-400" />
                    <span>টাস্ক ও অফার সেন্টার (Tasks Center):</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localEarning.isTasksEnabled}
                      onChange={(e) => setLocalEarning(prev => ({ ...prev, isTasksEnabled: e.target.checked }))}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-emerald-400">
                      {localEarning.isTasksEnabled ? 'চালু' : 'বন্ধ'}
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-neutral-400">সোশ্যাল, রেফারাল ও স্পেশাল অফার টাস্ক চালু/বন্ধ এবং &apos;টাস্ক ও অফার&apos; ট্যাব থেকে অফার ম্যানেজ করুন</p>
              </div>

              {/* Level Multipliers Control */}
              <div className="p-3.5 rounded-xl bg-[#0e1712] border border-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>লেভেল বোনাস মাল্টিপ্লায়ার (Level Multipliers):</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localEarning.isLevelMultiplierEnabled}
                      onChange={(e) => setLocalEarning(prev => ({ ...prev, isLevelMultiplierEnabled: e.target.checked }))}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-emerald-400">
                      {localEarning.isLevelMultiplierEnabled ? 'চালু' : 'বন্ধ'}
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-neutral-400">লেভেল অনুযায়ী রিলস দেখার বোনাস গুনক (১.১x, ১.২৫x, ১.৫০x) সক্রিয়/নিষ্ক্রিয় করুন</p>
              </div>
            </div>
          </div>

          {/* Bottom Permanent Save Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (onUpdateEarningSettings) {
                  onUpdateEarningSettings(localEarning);
                  playSuccessChime();
                  showPanelToast('✅ সমস্ত আর্নিং সেটিংস ও কাস্টমাইজেশন সফলভাবে সেভ করা হয়েছে!');
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-emerald-400 to-[#00c853] hover:opacity-95 text-black font-black text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>সমস্ত পয়েন্ট আর্নিং ও অফার সেটিংস সংরক্ষণ করুন (Save All) 🚀</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2.8: LIVE STREAMS MODERATION & GIFT COMMISSION CONTROLS */}
      {activeAdminTab === 'live' && (() => {
        const activeLiveStreams = liveStreamsList.filter((s) => s.status === 'active');
        const endedLiveStreams = liveStreamsList.filter((s) => s.status !== 'active');
        const filteredStreams =
          liveFilter === 'active'
            ? activeLiveStreams
            : liveFilter === 'ended'
            ? endedLiveStreams
            : liveStreamsList;
        const totalAdminGiftPoints = liveStreamsList.reduce((acc, s) => acc + (s.adminGiftPoints || 0), 0);
        const totalHostGiftPoints = liveStreamsList.reduce((acc, s) => acc + (s.giftsTotalPoints || 0), 0);

        const rawHostPct = Math.max(0, Number(localEarning.giftHostPercent ?? 60));
        const rawAdminPct = Math.max(0, Number(localEarning.giftAdminPercent ?? 20));
        const rawCashbackPct = Math.max(0, Number(localEarning.giftCashbackPercent ?? 20));
        const rawPctSum = rawHostPct + rawAdminPct + rawCashbackPct;
        const previewSplit = calculateGiftSplit(100, localEarning);

        return (
          <div className="space-y-4">
            {liveFeedback && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{liveFeedback}</span>
              </div>
            )}

            {/* 0. Active Live Streams Concurrent Viewer Peak Chart (Recharts) */}
            <LiveViewerPeakChart streams={liveStreamsList} lang="bn" />

            {/* 1. Gift Commission Split & Percentage Controls */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1b1623] via-[#141f19] to-[#111c16] border border-amber-500/40 p-4 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>🎁 লাইভ ও রিল গিফট কমিশন শেয়ার কন্ট্রোল</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    গিফটের কত শতাংশ হোস্ট পাবে, এডমিন পাবে এবং সেন্ডার ক্যাশব্যাক পাবে তা নির্ধারণ করুন।
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block">মোট এডমিন গিফট আয়</span>
                  <span className="text-sm font-black text-emerald-400">
                    👑 +{toBengaliNumber(totalAdminGiftPoints)} Pts
                  </span>
                </div>
              </div>

              {/* 3 Percentage Inputs */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#0b130f] border border-emerald-900/70 space-y-1">
                  <label className="text-[11px] font-bold text-emerald-300 block">
                    🎙️ হোস্ট / ক্রিয়েটর (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localEarning.giftHostPercent ?? 60}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                      setLocalEarning((prev) => ({ ...prev, giftHostPercent: val }));
                    }}
                    className="w-full min-h-[40px] bg-[#14231b] border border-emerald-800 rounded-lg px-2.5 text-sm text-white font-extrabold text-center focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#0b130f] border border-amber-800/70 space-y-1">
                  <label className="text-[11px] font-bold text-amber-300 block">
                    👑 এডমিন পাবে (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localEarning.giftAdminPercent ?? 20}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                      setLocalEarning((prev) => ({ ...prev, giftAdminPercent: val }));
                    }}
                    className="w-full min-h-[40px] bg-[#1e1a12] border border-amber-700/70 rounded-lg px-2.5 text-sm text-amber-300 font-extrabold text-center focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#0b130f] border border-cyan-900/70 space-y-1">
                  <label className="text-[11px] font-bold text-cyan-300 block">
                    💎 ক্যাশব্যাক (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localEarning.giftCashbackPercent ?? 20}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                      setLocalEarning((prev) => ({ ...prev, giftCashbackPercent: val }));
                    }}
                    className="w-full min-h-[40px] bg-[#112026] border border-cyan-800 rounded-lg px-2.5 text-sm text-cyan-300 font-extrabold text-center focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Quick Split Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-neutral-400 font-semibold">কুইক প্রিসেট:</span>
                {[
                  { host: 60, admin: 20, cashback: 20, label: '৬০ / ২০ / ২০' },
                  { host: 50, admin: 30, cashback: 20, label: '৫০ / ৩০ / ২০' },
                  { host: 70, admin: 20, cashback: 10, label: '৭০ / ২০ / ১০' },
                  { host: 50, admin: 40, cashback: 10, label: '৫০ / ৪০ / ১০' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setLocalEarning((prev) => ({
                        ...prev,
                        giftHostPercent: preset.host,
                        giftAdminPercent: preset.admin,
                        giftCashbackPercent: preset.cashback,
                      }))
                    }
                    className="min-h-[34px] px-2.5 rounded-lg bg-[#0d1611] hover:bg-emerald-950 border border-emerald-900/60 text-[11px] font-bold text-neutral-200 cursor-pointer transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Live 100-pt Breakdown Preview */}
              <div className="p-3 rounded-xl bg-black/35 border border-emerald-950 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300 font-semibold">
                    ১০০ পয়েন্ট গিফট হিসাব (মোট যোগফল: {toBengaliNumber(rawPctSum)}%):
                  </span>
                  {rawPctSum !== 100 && (
                    <span className="text-[10px] font-bold text-amber-300">
                      স্বয়ংক্রিয়ভাবে ১০০%-এ সমন্বয় হবে
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-bold">
                  <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-300">
                    হোস্ট: +{toBengaliNumber(previewSplit.creatorShare)} Pts ({toBengaliNumber(previewSplit.hostPct)}%)
                  </div>
                  <div className="p-2 rounded-lg bg-amber-950/60 text-amber-300">
                    এডমিন: +{toBengaliNumber(previewSplit.adminShare)} Pts ({toBengaliNumber(previewSplit.adminPct)}%)
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-300">
                    ক্যাশব্যাক: +{toBengaliNumber(previewSplit.userCashback)} Pts ({toBengaliNumber(previewSplit.cashbackPct)}%)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated: EarningSettings = {
                    ...localEarning,
                    adminCommissionReceiverId: currentUserUid || localEarning.adminCommissionReceiverId || '',
                  };
                  setLocalEarning(updated);
                  if (onUpdateEarningSettings) {
                    onUpdateEarningSettings(updated);
                  }
                  playSuccessChime();
                  showLiveFeedback('✅ গিফট কমিশন শেয়ার সেটিংস সংরক্ষণ করা হয়েছে!');
                }}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:opacity-95 text-black font-black text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-[0.98]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>গিফট কমিশন (%) সেটিংস সেভ করুন</span>
              </button>
            </div>

            {/* 2. Live Stream Overview Stats + Filter */}
            <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400" />
                  <span>📡 ইউজারদের লাইভ পরিচালনা ও কন্ট্রোল</span>
                </h3>
                <div className="text-[11px] text-neutral-400 flex items-center gap-3">
                  <span>হোস্ট গিফট: <b className="text-amber-300">{toBengaliNumber(totalHostGiftPoints)}</b></span>
                  <span>এডমিন আয়: <b className="text-emerald-400">{toBengaliNumber(totalAdminGiftPoints)}</b></span>
                </div>
              </div>

              <div className="flex gap-2">
                {[
                  { id: 'all', label: `সকল (${toBengaliNumber(liveStreamsList.length)})` },
                  { id: 'active', label: `চলমান (${toBengaliNumber(activeLiveStreams.length)})` },
                  { id: 'ended', label: `বন্ধ / ক্যানসেল (${toBengaliNumber(endedLiveStreams.length)})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLiveFilter(tab.id as any)}
                    className={`min-h-[38px] px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      liveFilter === tab.id
                        ? 'bg-[#00c853] text-black'
                        : 'bg-[#0d1611] text-neutral-300 border border-emerald-950 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredStreams.length === 0 ? (
                <div className="text-center py-10 bg-[#0d1611] rounded-2xl border border-emerald-950 text-xs text-neutral-500">
                  কোনো লাইভ সেশন পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStreams.map((live) => {
                    const isActive = live.status === 'active';
                    return (
                      <div
                        key={live.id}
                        className={`p-3.5 rounded-2xl border space-y-3 transition ${
                          isActive
                            ? 'bg-[#0f1b15] border-rose-500/40 shadow-md'
                            : 'bg-[#0b130f] border-emerald-950/70 opacity-85'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={live.hostAvatar}
                              alt={live.hostName}
                              className="w-12 h-12 rounded-2xl object-cover border border-emerald-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-sm text-white truncate">{live.title}</h4>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                    isActive
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : live.cancelledByAdmin
                                      ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                                      : 'bg-neutral-800 text-neutral-400'
                                  }`}
                                >
                                  {isActive
                                    ? live.mode === 'video'
                                      ? '🔴 LIVE VIDEO'
                                      : '🎙️ অডিও আড্ডা'
                                    : live.cancelledByAdmin
                                    ? '🛑 এডমিন ক্যানসেল'
                                    : 'সমাপ্ত'}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 mt-0.5 truncate">
                                হোস্ট: <b className="text-emerald-300">{live.hostName}</b> · {live.category || 'আড্ডা'}
                              </p>
                              {live.cancelReason && (
                                <p className="text-[11px] text-rose-300 mt-1">
                                  কারণ: {live.cancelReason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right text-[11px] shrink-0 space-y-0.5">
                            <div className="text-neutral-300 font-bold">
                              👁️ {toBengaliNumber(live.viewersCount || 0)} · ❤️ {toBengaliNumber(live.likesCount || 0)}
                            </div>
                            <div className="text-rose-400 font-bold">
                              📈 পিক: {toBengaliNumber(Math.max(live.peakViewersCount || 0, live.viewersCount || 0))}
                            </div>
                            <div className="text-amber-300 font-bold">
                              🎁 হোস্ট: {toBengaliNumber(live.giftsTotalPoints || 0)}
                            </div>
                            <div className="text-emerald-400 font-extrabold">
                              👑 এডমিন: {toBengaliNumber(live.adminGiftPoints || 0)}
                            </div>
                          </div>
                        </div>

                        {/* Admin Moderation Controls */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-950/70">
                          {onInspectLive && isActive && (
                            <button
                              type="button"
                              onClick={() => onInspectLive(live.id)}
                              className="min-h-[40px] px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 hover:brightness-110 text-black font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Eye className="w-4 h-4" />
                              <span>লাইভ দেখুন ও ফুল কন্ট্রোল</span>
                            </button>
                          )}

                          {isActive && (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!isAdminFirebaseAuthed) {
                                    showLiveFeedback('⚠️ আগে উপরের বাটন থেকে এডমিন Google অ্যাকাউন্টে লগইন করুন!');
                                    return;
                                  }
                                  try {
                                    await updateDocument('live_streams', live.id, { isMicMuted: !live.isMicMuted });
                                    playPopSound();
                                    showLiveFeedback(
                                      !live.isMicMuted
                                        ? `🔇 ${live.hostName}-এর মাইক মিউট করা হয়েছে`
                                        : `🎙️ ${live.hostName}-এর মাইক চালু করা হয়েছে`
                                    );
                                  } catch {
                                    showLiveFeedback('⚠️ পরিবর্তন ব্যর্থ! এডমিন Google অ্যাকাউন্টে লগইন নিশ্চিত করুন।');
                                  }
                                }}
                                className={`min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                                  live.isMicMuted
                                    ? 'bg-rose-950/70 border-rose-700/50 text-rose-300'
                                    : 'bg-[#14231b] border-emerald-900 text-emerald-300'
                                }`}
                              >
                                {live.isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                <span>{live.isMicMuted ? 'মাইক মিউট' : 'মাইক চালু'}</span>
                              </button>

                              {live.mode === 'video' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!isAdminFirebaseAuthed) {
                                      showLiveFeedback('⚠️ আগে উপরের বাটন থেকে এডমিন Google অ্যাকাউন্টে লগইন করুন!');
                                      return;
                                    }
                                    const nextCam = live.isCameraOn === false;
                                    try {
                                      await updateDocument('live_streams', live.id, { isCameraOn: nextCam });
                                      playPopSound();
                                      showLiveFeedback(nextCam ? '📹 ক্যামেরা অন করা হয়েছে' : '🚫 ক্যামেরা অফ করা হয়েছে');
                                    } catch {
                                      showLiveFeedback('⚠️ পরিবর্তন ব্যর্থ! এডমিন Google অ্যাকাউন্টে লগইন নিশ্চিত করুন।');
                                    }
                                  }}
                                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                                    live.isCameraOn === false
                                      ? 'bg-rose-950/70 border-rose-700/50 text-rose-300'
                                      : 'bg-[#14231b] border-emerald-900 text-cyan-300'
                                  }`}
                                >
                                  {live.isCameraOn === false ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                                  <span>{live.isCameraOn === false ? 'ক্যামেরা অফ' : 'ক্যামেরা অন'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={async () => {
                                  if (!isAdminFirebaseAuthed) {
                                    showLiveFeedback('⚠️ আগে উপরের বাটন থেকে এডমিন Google অ্যাকাউন্টে লগইন করুন!');
                                    return;
                                  }
                                  const nextChat = live.chatEnabled === false;
                                  try {
                                    await updateDocument('live_streams', live.id, { chatEnabled: nextChat });
                                    playPopSound();
                                    showLiveFeedback(nextChat ? '💬 লাইভ চ্যাট চালু হয়েছে' : '🚫 লাইভ চ্যাট বন্ধ করা হয়েছে');
                                  } catch {
                                    showLiveFeedback('⚠️ পরিবর্তন ব্যর্থ! এডমিন Google অ্যাকাউন্টে লগইন নিশ্চিত করুন।');
                                  }
                                }}
                                className={`min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                                  live.chatEnabled === false
                                    ? 'bg-amber-950/70 border-amber-700/50 text-amber-300'
                                    : 'bg-[#14231b] border-emerald-900 text-neutral-200'
                                }`}
                              >
                                {live.chatEnabled === false ? <MessageSquareOff className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                                <span>{live.chatEnabled === false ? 'চ্যাট অফ' : 'চ্যাট চালু'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!isAdminFirebaseAuthed) {
                                    showLiveFeedback('⚠️ আগে উপরের বাটন থেকে এডমিন Google অ্যাকাউন্টে লগইন করুন!');
                                    return;
                                  }
                                  triggerConfirm(
                                    'লাইভে সতর্কবার্তা পাঠান',
                                    `"${live.title}" (${live.hostName}) লাইভে একটি পিনড ওয়ার্নিং পাঠাতে নিচে লিখুন:`,
                                    async (warn) => {
                                      const text = (warn || '').trim();
                                      if (!text) return;
                                      try {
                                        await Promise.all([
                                          updateDocument('live_streams', live.id, {
                                            pinnedNotice: `⚠️ এডমিন সতর্কবার্তা: ${text}`,
                                          }),
                                          addDocument(`live_streams/${live.id}/chat`, {
                                            userId: currentUserUid || 'admin',
                                            userName: 'Admin',
                                            userAvatar: '',
                                            text: `⚠️ এডমিন সতর্কবার্তা: ${text}`,
                                            type: 'system',
                                            createdAt: new Date().toISOString(),
                                          }),
                                        ]);
                                        playSuccessChime();
                                        showLiveFeedback(`⚠️ "${live.title}" লাইভে সতর্কবার্তা পাঠানো হয়েছে`);
                                      } catch {
                                        showLiveFeedback('⚠️ সতর্কবার্তা পাঠানো যায়নি! এডমিন Google লগইন চেক করুন।');
                                      }
                                    },
                                    true
                                  );
                                }}
                                className="min-h-[40px] px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <BellRing className="w-3.5 h-3.5" />
                                <span>ওয়ার্নিং</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!isAdminFirebaseAuthed) {
                                    showLiveFeedback('⚠️ লাইভ ক্যানসেল করতে আগে উপরের বাটন থেকে এডমিন Google অ্যাকাউন্টে লগইন করুন!');
                                    return;
                                  }
                                  triggerConfirm(
                                    'লাইভ ক্যানসেল করবেন?',
                                    `আপনি কি "${live.title}" (${live.hostName}) লাইভটি ক্যানসেল করতে চান? ইউজারকে কারণ জানাতে নিচে লিখুন।`,
                                    async (reason) => {
                                      try {
                                        if (onCancelLive) {
                                          await onCancelLive(live.id, reason);
                                        } else {
                                          await updateDocument('live_streams', live.id, {
                                            status: 'ended',
                                            cancelledByAdmin: true,
                                            cancelReason: (reason || '').trim() || 'এডমিন নীতিমালার কারণে লাইভটি বাতিল করা হয়েছে',
                                            endedAt: new Date().toISOString(),
                                          });
                                        }
                                        showLiveFeedback(`🛑 "${live.title}" লাইভটি ক্যানসেল করা হয়েছে`);
                                      } catch {
                                        showLiveFeedback('⚠️ লাইভ ক্যানসেল ব্যর্থ! অনুমোদিত এডমিন অ্যাকাউন্ট দিয়ে লগইন করুন।');
                                      }
                                    },
                                    true
                                  );
                                }}
                                className="min-h-[40px] px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>ক্যানসেল লাইভ</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (!isAdminFirebaseAuthed) {
                                showLiveFeedback('⚠️ ডিলিট করতে আগে উপরের বাটন থেকে এডমিন Google অ্যাকাউন্টে লগইন করুন!');
                                return;
                              }
                              triggerConfirm(
                                'লাইভ রেকর্ড ডিলিট করবেন?',
                                `আপনি কি "${live.title}" রেকর্ডটি ডিলিট করতে চান?`,
                                async () => {
                                  try {
                                    await deleteDocument('live_streams', live.id);
                                    showLiveFeedback('🗑️ লাইভ রেকর্ড ডিলিট করা হয়েছে');
                                  } catch {
                                    showLiveFeedback('⚠️ ডিলিট ব্যর্থ হয়েছে! এডমিন Google লগইন চেক করুন।');
                                  }
                                }
                              );
                            }}
                            className="min-h-[40px] px-3 rounded-xl bg-neutral-800 hover:bg-rose-950 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ডিলিট</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB: UNLIMITED PAYMENT METHODS MANAGER */}
      {activeAdminTab === 'payments' && (() => {
        const allMethods = localSite.paymentMethods || [];
        const filteredMethods =
          paymentCategoryFilter === 'all'
            ? allMethods
            : allMethods.filter((m) => m.category === paymentCategoryFilter);

        const getCategoryLabel = (cat: PaymentMethodCategory) => {
          if (cat === 'mobile_banking') return '📱 মোবাইল ব্যাংকিং';
          if (cat === 'bank') return '🏦 ব্যাংক অ্যাকাউন্ট';
          if (cat === 'card') return '💳 কার্ড (Visa/MC)';
          return '🔹 অন্যান্য';
        };

        return (
          <div className="space-y-4 animate-in fade-in">
            {/* Header & Add Button */}
            <div className="rounded-2xl bg-gradient-to-r from-cyan-950 via-[#0e1f26] to-[#12241b] border border-cyan-500/40 p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <span>আনলিমিটেড পেমেন্ট মেথড কন্ট্রোল ({toBengaliNumber(allMethods.length)})</span>
                </h3>
                <p className="text-xs text-cyan-200/80 mt-0.5">
                  মোবাইল ব্যাংকিং (bKash, Nagad, Rocket, Upay, CellFin), ব্যাংক অ্যাকাউন্ট ও ভিসা/মাস্টারকার্ড আনলিমিটেড যোগ ও কন্ট্রোল করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPaymentId(null);
                  setPmForm({
                    name: '',
                    nameBn: '',
                    category: 'mobile_banking',
                    accountNumber: '',
                    accountTitle: 'ReelPay BD Official',
                    bankName: '',
                    branchName: '',
                    routingNumber: '',
                    accountTypeLabel: 'Personal / Merchant',
                    instructions: '',
                    colorHex: '#00c853',
                    supportsDeposit: true,
                    supportsWithdrawal: true,
                    isEnabled: true,
                  });
                  setShowPaymentForm((prev) => !prev);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showPaymentForm ? 'ফর্ম বন্ধ করুন' : '+ কাস্টম পেমেন্ট মেথড'}</span>
              </button>
            </div>

            {/* 1-Tap Quick Presets */}
            <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>১-ট্যাপ কুইক প্রিসেট (যে কোনো ব্যাংক, কার্ড বা ওয়ালেট সিলেক্ট করে যোগ করুন)</span>
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHOD_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setEditingPaymentId(null);
                      setPmForm({
                        ...preset,
                        accountNumber: '',
                        accountTitle: 'ReelPay BD Official',
                        branchName: '',
                        routingNumber: '',
                        instructions:
                          preset.category === 'bank'
                            ? `${preset.nameBn} অ্যাকাউন্টে ট্রান্সফার করে ট্রানজেকশন রেফারেন্স ও প্রেরকের তথ্য দিন।`
                            : preset.category === 'card'
                            ? `${preset.nameBn} দিয়ে পেমেন্ট করে ট্রানজেকশন আইডি ও শেষ ৪ ডিজিট দিন।`
                            : `${preset.nameBn} থেকে সেন্ড মানি করে আপনার নম্বর ও TrxID জমা দিন।`,
                      });
                      setShowPaymentForm(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#0b140f] hover:bg-neutral-800 border border-emerald-950 text-[11px] font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: preset.colorHex || '#00c853' }}
                    />
                    <span>+ {preset.nameBn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add / Edit Payment Method Form */}
            {showPaymentForm && (
              <form
                onSubmit={handleSavePaymentMethod}
                className="rounded-2xl bg-[#11201b] border border-cyan-500/40 p-4 shadow-xl space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white">
                    {editingPaymentId ? '✏️ পেমেন্ট মেথড এডিট করুন' : '➕ নতুন পেমেন্ট মেথড যোগ করুন'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setEditingPaymentId(null);
                    }}
                    className="text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-neutral-300 font-bold block mb-1">ক্যাটাগরি *:</label>
                    <select
                      value={pmForm.category}
                      onChange={(e) => setPmForm((prev) => ({ ...prev, category: e.target.value as PaymentMethodCategory }))}
                      className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="mobile_banking">📱 মোবাইল ব্যাংকিং (MFS)</option>
                      <option value="bank">🏦 ব্যাংক অ্যাকাউন্ট (Bank)</option>
                      <option value="card">💳 কার্ড (Visa / MasterCard / Amex)</option>
                      <option value="other">🔹 অন্যান্য মেথড</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-300 font-bold block mb-1">মেথডের নাম (English) *:</label>
                    <input
                      type="text"
                      value={pmForm.name}
                      onChange={(e) => setPmForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="যেমন: Visa Card / BRAC Bank / Upay"
                      className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-300 font-bold block mb-1">বাংলা নাম:</label>
                    <input
                      type="text"
                      value={pmForm.nameBn}
                      onChange={(e) => setPmForm((prev) => ({ ...prev, nameBn: e.target.value }))}
                      placeholder="যেমন: ভিসা কার্ড / ব্র্যাক ব্যাংক"
                      className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                      {pmForm.category === 'bank'
                        ? 'অফিসিয়াল ব্যাংক অ্যাকাউন্ট নম্বর *:'
                        : pmForm.category === 'card'
                        ? 'কার্ড / মার্চেন্ট অ্যাকাউন্ট নম্বর *:'
                        : 'অফিসিয়াল ওয়ালেট / পেমেন্ট নম্বর *:'}
                    </label>
                    <input
                      type="text"
                      value={pmForm.accountNumber}
                      onChange={(e) => setPmForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="যেমন: 017XXXXXXXX বা 2050XXXXXXXX বা 4532-XXXX-XXXX"
                      className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-300 font-bold block mb-1">অ্যাকাউন্ট হোল্ডার / প্রাপকের নাম:</label>
                    <input
                      type="text"
                      value={pmForm.accountTitle || ''}
                      onChange={(e) => setPmForm((prev) => ({ ...prev, accountTitle: e.target.value }))}
                      placeholder="যেমন: ReelPay BD Official"
                      className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {(pmForm.category === 'bank' || pmForm.category === 'card') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] text-neutral-300 font-bold block mb-1">ব্যাংক / কার্ড ইস্যুকারী:</label>
                      <input
                        type="text"
                        value={pmForm.bankName || ''}
                        onChange={(e) => setPmForm((prev) => ({ ...prev, bankName: e.target.value }))}
                        placeholder="যেমন: Dutch-Bangla Bank PLC"
                        className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-300 font-bold block mb-1">ব্রাঞ্চের নাম (ঐচ্ছিক):</label>
                      <input
                        type="text"
                        value={pmForm.branchName || ''}
                        onChange={(e) => setPmForm((prev) => ({ ...prev, branchName: e.target.value }))}
                        placeholder="যেমন: Motijheel Branch"
                        className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-300 font-bold block mb-1">রাউটিং নম্বর (ঐচ্ছিক):</label>
                      <input
                        type="text"
                        value={pmForm.routingNumber || ''}
                        onChange={(e) => setPmForm((prev) => ({ ...prev, routingNumber: e.target.value }))}
                        placeholder="যেমন: 090270001"
                        className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-neutral-300 font-bold block mb-1">অ্যাকাউন্ট টাইপ লেবেল:</label>
                    <input
                      type="text"
                      value={pmForm.accountTypeLabel || ''}
                      onChange={(e) => setPmForm((prev) => ({ ...prev, accountTypeLabel: e.target.value }))}
                      placeholder="Personal / Agent / Savings / Visa"
                      className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-300 font-bold block mb-1">ব্যাজ কালার:</label>
                    <div className="flex items-center gap-2 bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-1.5">
                      <input
                        type="color"
                        value={pmForm.colorHex || '#00c853'}
                        onChange={(e) => setPmForm((prev) => ({ ...prev, colorHex: e.target.value }))}
                        className="w-7 h-6 bg-transparent border-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-neutral-300">{pmForm.colorHex}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pmForm.supportsDeposit}
                        onChange={(e) => setPmForm((prev) => ({ ...prev, supportsDeposit: e.target.checked }))}
                        className="accent-emerald-500"
                      />
                      <span>ডিপোজিট</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-amber-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pmForm.supportsWithdrawal}
                        onChange={(e) => setPmForm((prev) => ({ ...prev, supportsWithdrawal: e.target.checked }))}
                        className="accent-amber-500"
                      />
                      <span>উইথড্রয়াল</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pmForm.isEnabled}
                        onChange={(e) => setPmForm((prev) => ({ ...prev, isEnabled: e.target.checked }))}
                        className="accent-cyan-500"
                      />
                      <span>চালু (Active)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-300 font-bold block mb-1">ইউজারের জন্য নির্দেশনা (Deposit Instructions):</label>
                  <textarea
                    rows={2}
                    value={pmForm.instructions || ''}
                    onChange={(e) => setPmForm((prev) => ({ ...prev, instructions: e.target.value }))}
                    placeholder="যেমন: এই অ্যাকাউন্টে টাকা পাঠিয়ে TrxID এবং আপনার প্রেরক তথ্য সাবমিট করুন।"
                    className="w-full bg-[#09120e] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-[#00c853] hover:opacity-95 text-black font-black text-xs cursor-pointer shadow-lg"
                >
                  {editingPaymentId ? 'পেমেন্ট মেথড আপডেট করুন 💾' : 'পেমেন্ট মেথড যোগ ও পাবলিশ করুন 🚀'}
                </button>
              </form>
            )}

            {/* Configured Payment Methods List */}
            <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>সক্রিয় ও সংরক্ষিত পেমেন্ট মেথড ({toBengaliNumber(filteredMethods.length)})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'সকল' },
                    { id: 'mobile_banking', label: '📱 মোবাইল' },
                    { id: 'bank', label: '🏦 ব্যাংক' },
                    { id: 'card', label: '💳 কার্ড' },
                    { id: 'other', label: '🔹 অন্যান্য' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaymentCategoryFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                        paymentCategoryFilter === tab.id
                          ? 'bg-emerald-500 text-black'
                          : 'bg-[#0b140f] text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMethods.length === 0 ? (
                <p className="text-center py-8 text-neutral-400 text-xs">এই ক্যাটাগরিতে কোনো পেমেন্ট মেথড নেই। উপরের "+ কাস্টম পেমেন্ট মেথড" থেকে যোগ করুন।</p>
              ) : (
                <div className="space-y-2.5">
                  {filteredMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        pm.isEnabled ? 'bg-[#0e1712] border-emerald-900/80' : 'bg-[#171113] border-rose-900/50 opacity-75'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: pm.colorHex || '#00c853' }}
                          />
                          <span className="font-black text-white text-xs sm:text-sm">
                            {pm.nameBn} ({pm.name})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-200 font-bold">
                            {getCategoryLabel(pm.category)}
                          </span>
                          {!pm.isEnabled && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 font-bold border border-rose-800/40">
                              বন্ধ (Disabled)
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-emerald-400 font-bold">
                          নম্বর / অ্যাকাউন্ট: {pm.accountNumber}
                          {pm.accountTitle ? ` • ${pm.accountTitle}` : ''}
                        </div>
                        {(pm.bankName || pm.branchName || pm.routingNumber) && (
                          <p className="text-[11px] text-neutral-400">
                            {[pm.bankName, pm.branchName ? `শাখা: ${pm.branchName}` : '', pm.routingNumber ? `রাউটিং: ${pm.routingNumber}` : '']
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePaymentMethodField(pm.id, 'supportsDeposit')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                            pm.supportsDeposit
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                              : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                          }`}
                        >
                          ডিপোজিট {pm.supportsDeposit ? 'ON' : 'OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePaymentMethodField(pm.id, 'supportsWithdrawal')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                            pm.supportsWithdrawal
                              ? 'bg-amber-950 text-amber-300 border-amber-700/50'
                              : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                          }`}
                        >
                          উইথড্র {pm.supportsWithdrawal ? 'ON' : 'OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePaymentMethodField(pm.id, 'isEnabled')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                            pm.isEnabled
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-700/50'
                              : 'bg-rose-950 text-rose-300 border-rose-700/50'
                          }`}
                        >
                          {pm.isEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPaymentId(pm.id);
                            setPmForm({
                              name: pm.name,
                              nameBn: pm.nameBn,
                              category: pm.category,
                              accountNumber: pm.accountNumber,
                              accountTitle: pm.accountTitle || '',
                              bankName: pm.bankName || '',
                              branchName: pm.branchName || '',
                              routingNumber: pm.routingNumber || '',
                              accountTypeLabel: pm.accountTypeLabel || '',
                              instructions: pm.instructions || '',
                              colorHex: pm.colorHex || '#00c853',
                              supportsDeposit: pm.supportsDeposit,
                              supportsWithdrawal: pm.supportsWithdrawal,
                              isEnabled: pm.isEnabled,
                            });
                            setShowPaymentForm(true);
                          }}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-emerald-500 hover:text-black text-emerald-300 cursor-pointer"
                          title="এডিট"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            triggerConfirm(
                              'পেমেন্ট মেথড মুছে ফেলবেন?',
                              `আপনি কি "${pm.nameBn}" মেথডটি তালিকা থেকে মুছে ফেলতে চান?`,
                              () => handleDeletePaymentMethod(pm.id)
                            )
                          }
                          className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-600 text-rose-300 hover:text-white cursor-pointer"
                          title="ডিলিট"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB 3: SITE SETTINGS & USER PANEL MASTER FEATURE CONTROLS */}
      {activeAdminTab === 'settings' && (
        <form onSubmit={handleSaveAllSettings} className="space-y-4">
          {/* App Logo & Branding Customization */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>🎨 অ্যাপ লোগো ও আইকন কাস্টমাইজেশন (গ্যালারি সাপোর্ট)</span>
              </h3>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/50 font-bold">
                আপলোড করলেই সাথে সাথে চেঞ্জ হবে
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              ডিভাইসের গ্যালারি থেকে সরাসরি ছবি/আইকন নির্বাচন করুন অথবা ইমেজ URL দিন — সাথে সাথেই পুরো অ্যাপের লোগো ও আইকন পরিবর্তন হয়ে যাবে।
            </p>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAppLogoGallerySelect}
            />

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="relative w-18 h-18 rounded-2xl overflow-hidden border-2 border-emerald-500/60 bg-black flex items-center justify-center shrink-0 shadow-lg cursor-pointer group hover:border-emerald-400 transition"
                title="গ্যালারি থেকে আইকন নির্বাচন করুন"
              >
                <img
                  src={localSite.appLogoUrl || '/images/app_logo.jpg'}
                  alt="App Logo Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <UploadCloud className="w-5 h-5 text-emerald-300" />
                </div>
              </button>

              <div className="flex-1 min-w-[220px] space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00c853] to-[#00e676] hover:brightness-110 text-black font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition disabled:opacity-60"
                  >
                    <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isUploadingLogo ? 'আপলোড হচ্ছে...' : '📁 গ্যালারি থেকে আইকন/লোগো দিন'}
                    </span>
                  </button>

                  {localSite.appLogoUrl && localSite.appLogoUrl !== '/images/app_logo.jpg' && (
                    <button
                      type="button"
                      onClick={() => {
                        const resetSite: SiteSettings = {
                          ...localSite,
                          appLogoUrl: '/images/app_logo.jpg',
                        };
                        setLocalSite(resetSite);
                        onUpdateSiteSettings?.(resetSite, '↺ ডিফল্ট অ্যাপ লোগো ফিরিয়ে আনা হয়েছে!');
                        playPopSound();
                        showPanelToast('↺ ডিফল্ট অ্যাপ লোগো সেট করা হয়েছে!');
                      }}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-bold text-xs cursor-pointer transition"
                    >
                      ↺ ডিফল্ট লোগো
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 font-bold block mb-1">
                    অথবা অ্যাপ লোগো ইমেজ URL (Image URL):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localSite.appLogoUrl ?? ''}
                      onChange={(e) =>
                        setLocalSite((prev) => ({ ...prev, appLogoUrl: e.target.value.trim() }))
                      }
                      className="flex-1 bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      placeholder="/images/app_logo.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = (localSite.appLogoUrl || '').trim() || '/images/app_logo.jpg';
                        const nextSite: SiteSettings = { ...localSite, appLogoUrl: url };
                        setLocalSite(nextSite);
                        onUpdateSiteSettings?.(nextSite, '✅ নতুন লোগো URL সেভ ও অ্যাপ্লাই হয়েছে!');
                        playSuccessChime();
                        showPanelToast('✅ নতুন লোগো URL অ্যাপ্লাই হয়েছে!');
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-pointer shrink-0 transition"
                    >
                      প্রয়োগ করুন
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Point Rate, Withdrawal & Deposit Limits */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>⚙️ পয়েন্ট, ডিপোজিট ও উইথড্রয়াল লিমিট সেটিংস</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  পয়েন্ট রেট (কত পয়েন্ট = ৳১):
                </label>
                <input
                  type="number"
                  min="1"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  সর্বনিম্ন উইথড্র (৳):
                </label>
                <input
                  type="number"
                  min="10"
                  value={minWithdrawInput}
                  onChange={(e) => setMinWithdrawInput(e.target.value)}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  সর্বোচ্চ উইথড্র (৳) [০ = সীমাহীন]:
                </label>
                <input
                  type="number"
                  min="0"
                  value={localSite.maxWithdrawal}
                  onChange={(e) =>
                    setLocalSite((prev) => ({
                      ...prev,
                      maxWithdrawal: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  সর্বনিম্ন ডিপোজিট (৳):
                </label>
                <input
                  type="number"
                  min="1"
                  value={localSite.minDeposit}
                  onChange={(e) =>
                    setLocalSite((prev) => ({
                      ...prev,
                      minDeposit: Math.max(1, parseInt(e.target.value, 10) || 10),
                    }))
                  }
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Complete User Panel Master Feature Controls */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-900/80 p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>🎛️ ইউজার প্যানেলের সকল ফিচার মাস্টার কন্ট্রোল (১-ট্যাপ অন/অফ)</span>
              </h3>
              <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-700/50 font-bold">
                সব ডিভাইসে লাইভ সিঙ্ক হবে
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'isDepositsEnabled', label: '💎 ইউজার ডিপোজিট সিস্টেম', desc: 'বন্ধ করলে ইউজার নতুন ডিপোজিট করতে পারবে না' },
                { key: 'isWithdrawalsEnabled', label: '💸 ইউজার উইথড্রয়াল / ক্যাশআউট', desc: 'বন্ধ করলে উত্তোলন রিকোয়েস্ট সাময়িকভাবে বন্ধ থাকবে' },
                { key: 'allowUserReelUpload', label: '🎬 ইউজার রিলস আপলোড (+ বাটন)', desc: 'বন্ধ করলে শুধু এডমিন রিলস আপলোড করতে পারবে' },
                { key: 'allowUserAudioLive', label: '🎙️ ইউজার অডিও আড্ডা লাইভ', desc: 'বন্ধ করলে ইউজার অডিও লাইভ শুরু করতে পারবে না' },
                { key: 'allowUserVideoLive', label: '📹 ইউজার ভিডিও লাইভ', desc: 'বন্ধ করলে ইউজার ভিডিও লাইভ শুরু করতে পারবে না' },
                { key: 'isGiftsEnabled', label: '🎁 লাইভ ও রিলে গিফট পাঠানো', desc: 'গিফট বাটন ও গিফট শিট চালু/বন্ধ করুন' },
                { key: 'isCommentsEnabled', label: '💬 রিলসে মন্তব্য (Comments)', desc: 'বন্ধ করলে ইউজাররা নতুন কমেন্ট করতে পারবে না' },
                { key: 'isDirectChatEnabled', label: '✉️ ইউজার-টু-ইউজার সরাসরি চ্যাট', desc: 'বন্ধ করলে ইউজাররা প্রাইভেট চ্যাট শুরু করতে পারবে না' },
                { key: 'allowGuestPreviewPoints', label: '👀 গেস্ট প্রিভিউ পয়েন্ট অর্জন', desc: 'লগইন ছাড়া গেস্ট অবস্থায় প্রিভিউ পয়েন্ট গণনা চালু/বন্ধ' },
                { key: 'maintenanceMode', label: '🚧 মেইনটেন্যান্স মোড (সাইট সাময়িক বন্ধ)', desc: 'চালু করলে ইউজার প্যানেলে মেইনটেন্যান্স নোটিশ দেখাবে' },
              ].map((item) => {
                const enabled = Boolean((localSite as any)[item.key]);
                const isMaint = item.key === 'maintenanceMode';
                return (
                  <div
                    key={item.key}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      isMaint && enabled
                        ? 'bg-rose-950/50 border-rose-500/60'
                        : 'bg-[#0b140f] border-emerald-950'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{item.label}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSite((prev) => ({ ...prev, [item.key]: !(prev as any)[item.key] }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black shrink-0 cursor-pointer transition ${
                        enabled
                          ? isMaint
                            ? 'bg-rose-500 text-white'
                            : 'bg-[#00c853] text-black'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {enabled ? 'চালু (ON)' : 'বন্ধ (OFF)'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  ইউজার নতুন রিল আপলোডের ডিফল্ট রিওয়ার্ড পয়েন্ট:
                </label>
                <input
                  type="number"
                  min="0"
                  value={localSite.defaultUserReelRewardPoints}
                  onChange={(e) =>
                    setLocalSite((prev) => ({
                      ...prev,
                      defaultUserReelRewardPoints: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  মেইনটেন্যান্স মেসেজ (যদি মেইনটেন্যান্স মোড চালু থাকে):
                </label>
                <input
                  type="text"
                  value={localSite.maintenanceMessage || ''}
                  onChange={(e) =>
                    setLocalSite((prev) => ({ ...prev, maintenanceMessage: e.target.value }))
                  }
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Broadcast Announcement Notice */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>📢 স্ক্রলিং নোটিশ ও লাইভ ঘোষণা</span>
            </h3>
            <p className="text-xs text-neutral-400">হোম স্ক্রিনের টিকার বারে এই লেখাটি প্রদর্শিত হবে।</p>
            <textarea
              rows={2}
              value={noticeInput}
              onChange={(e) => setNoticeInput(e.target.value)}
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Quick Official Payment Numbers + Link to Unlimited Manager */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>📱 কুইক মোবাইল ব্যাংকিং নম্বর (সব ব্যাংক/ভিসা কার্ড ম্যানেজ করতে 💳 পেমেন্ট মেথড ট্যাবে যান)</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveAdminTab('payments')}
                className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold cursor-pointer hover:bg-cyan-500/30"
              >
                + আনলিমিটেড ব্যাংক / কার্ড / ওয়ালেট যোগ করুন ↗
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-0.5">বিকাশ নাম্বার (bKash):</label>
                <input
                  type="text"
                  value={bkashNumInput}
                  onChange={(e) => setBkashNumInput(e.target.value)}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 block mb-0.5">নগদ নাম্বার (Nagad):</label>
                <input
                  type="text"
                  value={nagadNumInput}
                  onChange={(e) => setNagadNumInput(e.target.value)}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 block mb-0.5">রকেট নাম্বার (Rocket):</label>
                <input
                  type="text"
                  value={rocketNumInput}
                  onChange={(e) => setRocketNumInput(e.target.value)}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[#00c853] hover:bg-[#00e676] text-black font-extrabold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>সকল সেটিংস ও ইউজার প্যানেল কন্ট্রোল সেভ করুন 💾</span>
          </button>
        </form>
      )}

      {/* TAB 4: WITHDRAWALS (Approve/Reject) */}
      {activeAdminTab === 'withdrawals' && (
        <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>💸 উইথড্রয়াল রিকোয়েস্ট তালিকা ({toBengaliNumber(withdrawals.length)})</span>
            </h3>
            <span className="text-xs text-rose-400 font-bold">
              {toBengaliNumber(pendingWithdrawals.length)} টি পেন্ডিং
            </span>
          </div>

          {withdrawals.length === 0 ? (
            <p className="text-center py-6 text-neutral-500 text-xs">কোনো রিকোয়েস্ট নেই।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-emerald-950 text-neutral-400">
                    <th className="py-2 px-1">ইউজার ও অ্যাকাউন্ট তথ্য</th>
                    <th className="py-2 px-1">পরিমাণ</th>
                    <th className="py-2 px-1">মেথড</th>
                    <th className="py-2 px-1">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/60">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-black/20">
                      <td className="py-2 px-1">
                        <div className="font-bold text-white">{w.userName}</div>
                        <div className="text-[10px] text-emerald-300 font-mono">{w.accountNumber}</div>
                        {(w.accountHolderName || w.bankName || w.branchName || w.routingNumber || w.accountDetails) && (
                          <div className="text-[10px] text-neutral-400 mt-0.5 max-w-[220px]">
                            {[w.accountHolderName, w.bankName, w.branchName, w.routingNumber ? `Routing: ${w.routingNumber}` : '', w.accountDetails]
                              .filter(Boolean)
                              .join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-1 font-bold text-emerald-400">
                        {formatTaka(w.amountBDT)}
                      </td>
                      <td className="py-2 px-1">
                        <div className="font-bold text-white">{w.method}</div>
                        {w.accountType && <div className="text-[10px] text-neutral-400">{w.accountType}</div>}
                      </td>
                      <td className="py-2 px-1">
                        {w.status === 'pending' ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onApproveWithdrawal(w.id)}
                              className="px-2 py-1 rounded bg-[#00c853] hover:bg-[#00e676] text-black text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>অনুমোদন</span>
                            </button>
                            <button
                              onClick={() => onRejectWithdrawal(w.id)}
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>বাতিল</span>
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`text-[11px] font-bold ${
                              w.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {w.status === 'approved' ? '✅ Paid' : '❌ Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DEPOSITS (Approve/Reject) */}
      {activeAdminTab === 'deposits' && (
        <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-white">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>💎 ডিপোজিট রিকোয়েস্ট তালিকা</span>
            </h3>
            <span className="text-xs text-emerald-400 font-bold">
              {toBengaliNumber(pendingDeposits.length)} টি পেন্ডিং
            </span>
          </div>

          {(!depositRequests || depositRequests.length === 0) ? (
            <p className="text-center py-6 text-neutral-500 text-xs">কোনো ডিপোজিট রিকোয়েস্ট নেই।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-emerald-950 text-neutral-400">
                    <th className="py-2 px-1">ইউজার / ট্রানজেকশন</th>
                    <th className="py-2 px-1">পরিমাণ / পয়েন্ট</th>
                    <th className="py-2 px-1">মেথড ও তথ্য</th>
                    <th className="py-2 px-1">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/60">
                  {depositRequests.map((d) => (
                    <tr key={d.id} className="hover:bg-black/20">
                      <td className="py-2 px-1">
                        <div className="font-bold text-white">{d.userName}</div>
                        <div className="text-[10px] text-amber-400 font-mono">{d.transactionId}</div>
                      </td>
                      <td className="py-2 px-1">
                        <div className="font-bold text-white">৳{toBengaliNumber(d.amountBDT)}</div>
                        <div className="text-[10px] text-emerald-400">+{toBengaliNumber(d.pointsToAdd)} Pts</div>
                      </td>
                      <td className="py-2 px-1">
                        <div className="font-bold text-white">{d.method}</div>
                        <div className="text-[10px] text-neutral-300 font-mono">{d.senderNumber}</div>
                        {(d.receiverAccountNumber || d.senderDetails) && (
                          <div className="text-[10px] text-neutral-400 mt-0.5 max-w-[200px]">
                            {[d.receiverAccountNumber ? `To: ${d.receiverAccountNumber}` : '', d.senderDetails]
                              .filter(Boolean)
                              .join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-1">
                        {d.status === 'pending' ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onApproveDeposit(d.id)}
                              className="px-2 py-1 rounded bg-[#00c853] hover:bg-[#00e676] text-black text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => onRejectDeposit(d.id)}
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`text-[11px] font-bold ${
                              d.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {d.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: OVERVIEW KPIS */}
      {/* TAB 6: CHAT MODERATION */}
      {activeAdminTab === 'chats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          {/* Sessions List */}
          <div className="md:col-span-1 bg-[#141f19] border border-emerald-950 rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto no-scrollbar">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>সক্রিয় চ্যাট সেশন ({toBengaliNumber(chatSessions.length)})</span>
            </h3>
            <div className="space-y-2">
              {chatSessions.map((session) => {
                const p1 = users.find(u => u.id === session.participants[0]);
                const p2 = users.find(u => u.id === session.participants[1]);
                const isSelected = selectedChatId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedChatId(session.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected ? 'bg-[#00c853]/10 border-[#00c853] shadow-md' : 'bg-black/20 border-emerald-950 hover:border-emerald-800'
                    }`}
                  >
                    <div className="flex -space-x-2 mb-2">
                      <img src={p1?.avatar} className="w-6 h-6 rounded-full border border-black object-cover" alt="" />
                      <img src={p2?.avatar} className="w-6 h-6 rounded-full border border-black object-cover" alt="" />
                    </div>
                    <p className="text-[11px] font-bold text-white truncate">
                      {p1?.name || 'Unknown'} & {p2?.name || 'Unknown'}
                    </p>
                    <p className="text-[9px] text-neutral-400 truncate mt-0.5">{session.lastMessage || 'No messages'}</p>
                    <p className="text-[8px] text-neutral-600 mt-1">{new Date(session.updatedAt).toLocaleString()}</p>
                  </div>
                );
              })}
              {chatSessions.length === 0 && <p className="text-center py-10 text-neutral-600 text-xs italic">কোনো চ্যাট সেশন পাওয়া যায়নি।</p>}
            </div>
          </div>

          {/* Messages View */}
          <div className="md:col-span-2 bg-[#0d1611] border border-emerald-950 rounded-2xl flex flex-col shadow-inner">
            {selectedChatId ? (
              <>
                <div className="p-3 border-b border-emerald-950 bg-black/20 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">মেসেজ হিস্টোরি</h4>
                  <button onClick={() => setSelectedChatId(null)} className="text-neutral-500 hover:text-white"><X className="w-4 h-4"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                  {chatMessages.map((msg) => {
                    const sender = users.find(u => u.id === msg.senderId);
                    return (
                      <div key={msg.id} className={`flex items-start gap-2 ${msg.isHidden ? 'opacity-50' : ''}`}>
                        <img src={sender?.avatar} className="w-6 h-6 rounded-full shrink-0 object-cover border border-emerald-900" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-400">{sender?.name}</span>
                            <span className="text-[8px] text-neutral-600">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div className={`p-2 rounded-lg text-xs mt-1 relative group ${msg.isHidden ? 'bg-rose-950/20 text-rose-300 line-through' : 'bg-black/40 text-neutral-200'}`}>
                            {msg.imageUrl && <img src={msg.imageUrl} className="w-20 rounded-md mb-1" alt=""/>}
                            <p>{msg.text}</p>
                            <button 
                              onClick={() => handleToggleMessageHide(msg)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition p-1 bg-black/60 rounded text-[9px] font-bold"
                            >
                              {msg.isHidden ? <Eye className="w-3 h-3 text-emerald-400"/> : <EyeOff className="w-3 h-3 text-rose-500"/>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {chatMessages.length === 0 && <p className="text-center py-20 text-neutral-700 italic text-xs">সেশনে কোনো মেসেজ নেই।</p>}
                </div>
                {/* Admin Direct Chat Reply */}
                <div className="p-3 bg-black/40 border-t border-emerald-950 flex items-center gap-2">
                  <input
                    type="text"
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdminSendReply();
                    }}
                    placeholder="ইউজারকে রিপ্লাই পাঠান (মেসেজ অপশনে যাবে)..."
                    className="flex-1 bg-[#121f17] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleAdminSendReply}
                    disabled={!adminReplyText.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-40 text-black font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>পাঠান</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-600">
                <ShieldAlert className="w-12 h-12 opacity-20 mb-3" />
                <p className="text-xs">মডারেশন করতে বাম পাশ থেকে একটি সেশন সিলেক্ট করুন</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeAdminTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#141f19] border border-emerald-950 shadow-md">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>মোট ইউজার</span>
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{toBengaliNumber(users.length)}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141f19] border border-emerald-950 shadow-md">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>অনলাইন ইউজার</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400">{toBengaliNumber(onlineUsers)}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141f19] border border-emerald-950 shadow-md">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>মোট পরিশোধিত</span>
                <DollarSign className="w-3.5 h-3.5 text-green-400" />
              </div>
              <p className="text-2xl font-extrabold text-green-400">{formatTaka(totalApprovedBDT)}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141f19] border border-emerald-950 shadow-md">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>মোট রিলস</span>
                <Video className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-amber-400">{toBengaliNumber(reels.length)}</p>
            </div>
          </div>

          {/* Analytics Chart */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>📈 সাপ্তাহিক অ্যাক্টিভিটি অ্যানালিটিক্স (অ্যাক্টিভ ইউজার ও ভিউস)</span>
              </h3>
              <div className="flex gap-3 text-[10px] font-bold">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-400">অ্যাক্টিভ ইউজার</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-blue-400">মোট ভিউস</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full bg-black/20 rounded-xl p-2 border border-emerald-950/50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                    tickFormatter={(value) => toBengaliNumber(value)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                    itemStyle={{ padding: '2px 0' }}
                    formatter={(value: any) => [toBengaliNumber(value), '']}
                    labelStyle={{ marginBottom: '4px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                    name="ইউজার"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                    name="ভিউস"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-[10px] text-neutral-500 text-center italic">
              * গত ৭ দিনের ইউজার অ্যাক্টিভিটি এবং রিলস ভিউসের একটি তুলনামূলক চিত্র
            </p>
          </div>

          {/* Active Live Streams Concurrent Viewer Peak Analytics (Recharts) */}
          <LiveViewerPeakChart streams={liveStreamsList} lang="bn" />
        </div>
      )}

      {activeAdminTab === 'analytics' && (
        <AdminAnalyticsTab
          withdrawals={withdrawals}
          users={users}
          reels={reels}
          onNavigateTab={(tab) => setActiveAdminTab(tab)}
        />
      )}

      {/* TAB 7: TASKS & CUSTOM OFFERS MANAGEMENT */}
      {activeAdminTab === 'tasks' && (
        <div className="space-y-4">
          {/* Spin Wheel & Scratch Card Admin Control Box */}
          <div className="rounded-2xl bg-gradient-to-br from-[#12241b] to-[#0c1812] border border-emerald-900/80 p-4 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>🎮 &apos;আয় করুন&apos; সেকশন গেমের পয়েন্ট কাস্টমাইজেশন (স্পিন হুইল ও স্ক্র্যাচ কার্ড)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-[#0b140f] p-3 rounded-xl border border-emerald-950 space-y-2">
                <label className="text-xs text-neutral-300 font-bold block">
                  ভাগ্য চাকা (Spin Wheel) সর্বোচ্চ পয়েন্ট:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={spinMaxInput}
                    onChange={(e) => setSpinMaxInput(e.target.value)}
                    className="flex-1 bg-[#132219] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(spinMaxInput, 10);
                      if (val && val > 0 && onUpdateSpinMaxPrize) {
                        onUpdateSpinMaxPrize(val);
                        playSuccessChime();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#00c853] hover:bg-[#00e676] text-black font-extrabold text-xs transition cursor-pointer"
                  >
                    সেভ
                  </button>
                </div>
              </div>

              <div className="bg-[#0b140f] p-3 rounded-xl border border-emerald-950 space-y-2">
                <label className="text-xs text-neutral-300 font-bold block">
                  দৈনিক স্ক্র্যাচ কার্ড (Scratch Card) নিশ্চিত পয়েন্ট:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={scratchPrizeInput}
                    onChange={(e) => setScratchPrizeInput(e.target.value)}
                    className="flex-1 bg-[#132219] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(scratchPrizeInput, 10);
                      if (val && val > 0 && onUpdateScratchPrize) {
                        onUpdateScratchPrize(val);
                        playSuccessChime();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#00c853] hover:bg-[#00e676] text-black font-extrabold text-xs transition cursor-pointer"
                  >
                    সেভ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  <span>🎯 টাস্ক ও কাস্টম অফার ম্যানেজমেন্ট (সব অফার নিয়ন্ত্রণ)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  রেফারাল অফার, সোশ্যাল লিংক, রিল ওয়াচ চ্যালেঞ্জ বা স্পেশাল অফার ইচ্ছামতো শর্ত ও পয়েন্ট দিয়ে যোগ করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const willOpen = !(showAddTask || editingTask);
                  setEditingTask(null);
                  setTaskTitle('');
                  setTaskDescription('');
                  setTaskBadgeText('');
                  setTaskPoints(50);
                  setTaskCategory('সোশ্যাল');
                  setTaskActionUrl('');
                  setTaskIconName('Send');
                  setTaskRequirementType('instant');
                  setTaskRequirementValue(1);
                  setTaskIsRepeatableDaily(false);
                  setTaskIsActive(true);
                  setTaskSortOrder((tasks?.length || 0) + 1);
                  setShowAddTask(willOpen);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black text-xs font-extrabold transition cursor-pointer shadow-md shrink-0"
              >
                {showAddTask || editingTask ? 'ফর্ম বন্ধ করুন ✕' : '+ নতুন অফার / টাস্ক যোগ করুন'}
              </button>
            </div>

            {/* 1-Click Quick Offer Templates */}
            {!(showAddTask || editingTask) && (
              <div className="pt-2 border-t border-emerald-950/70">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  দ্রুত অফার টেমপ্লেট (এক ক্লিকে ফর্ম পূরণ করুন):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: '📢 টেলিগ্রাম/সোশ্যাল অফার',
                      title: 'টেলিগ্রাম চ্যানেলে জয়েন করুন',
                      desc: 'চ্যানেলে জয়েন করে অফার বোনাস বুঝে নিন।',
                      badge: 'সোশ্যাল অফার',
                      pts: 100,
                      cat: 'সোশ্যাল',
                      icon: 'Send',
                      reqType: 'instant' as TaskRequirementType,
                      reqVal: 1,
                      daily: false,
                      url: 'https://t.me/',
                    },
                    {
                      label: '👥 রেফারাল চ্যালেঞ্জ অফার',
                      title: '৩ জন বন্ধুকে রেফার করুন (মেগা বোনাস)',
                      desc: 'কমপক্ষে ৩ জন সফল রেফার সম্পন্ন করলেই এই বোনাস আনলক হবে।',
                      badge: 'রেফার শর্ত',
                      pts: 300,
                      cat: 'রেফারাল',
                      icon: 'Users',
                      reqType: 'referral_count' as TaskRequirementType,
                      reqVal: 3,
                      daily: false,
                      url: '',
                    },
                    {
                      label: '🎬 রিল ওয়াচ অফার',
                      title: '১০টি রিল সম্পূর্ণ দেখুন',
                      desc: 'আজকের ফিড থেকে ১০টি রিল দেখলে অতিরিক্ত বোনাস পাবেন।',
                      badge: 'ওয়াচ অফার',
                      pts: 80,
                      cat: 'দৈনিক',
                      icon: 'PlayCircle',
                      reqType: 'reels_watched' as TaskRequirementType,
                      reqVal: 10,
                      daily: true,
                      url: '',
                    },
                    {
                      label: '🔥 স্পেশাল লিংক / অ্যাপ অফার',
                      title: 'স্পেশাল পার্টনার অফার ভিজিট করুন',
                      desc: 'লিংক ভিজিট করে বিশেষ অফার বোনাস সংগ্রহ করুন।',
                      badge: '🔥 হট অফার',
                      pts: 150,
                      cat: 'স্পেশাল',
                      icon: 'Flame',
                      reqType: 'instant' as TaskRequirementType,
                      reqVal: 1,
                      daily: false,
                      url: 'https://',
                    },
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setEditingTask(null);
                        setTaskTitle(tpl.title);
                        setTaskDescription(tpl.desc);
                        setTaskBadgeText(tpl.badge);
                        setTaskPoints(tpl.pts);
                        setTaskCategory(tpl.cat);
                        setTaskIconName(tpl.icon);
                        setTaskRequirementType(tpl.reqType);
                        setTaskRequirementValue(tpl.reqVal);
                        setTaskIsRepeatableDaily(tpl.daily);
                        setTaskIsActive(true);
                        setTaskSortOrder((tasks?.length || 0) + 1);
                        setTaskActionUrl(tpl.url);
                        setShowAddTask(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#0d1611] hover:bg-[#17281e] border border-emerald-900/60 text-emerald-300 text-[11px] font-bold transition cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(showAddTask || editingTask) && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!taskTitle.trim()) {
                    showPanelToast('অফার বা টাস্কের শিরোনাম লিখুন।', 'error');
                    return;
                  }
                  const cleanPayload = {
                    title: taskTitle.trim(),
                    description: taskDescription.trim() || undefined,
                    badgeText: taskBadgeText.trim() || undefined,
                    rewardPoints: Math.max(0, Number(taskPoints) || 0),
                    category: taskCategory.trim() || 'সোশ্যাল',
                    actionUrl: taskActionUrl.trim() || undefined,
                    iconName: taskIconName || 'Gift',
                    requirementType: taskRequirementType,
                    requirementValue: Math.max(1, Number(taskRequirementValue) || 1),
                    isRepeatableDaily: taskRequirementType === 'daily_checkin' ? true : taskIsRepeatableDaily,
                    isActive: taskIsActive,
                    sortOrder: Number(taskSortOrder) || 99,
                  };
                  if (editingTask && onEditTask) {
                    onEditTask({
                      ...editingTask,
                      ...cleanPayload,
                    });
                    playSuccessChime();
                    setEditingTask(null);
                    setShowAddTask(false);
                  } else if (onAddTask) {
                    onAddTask(cleanPayload);
                    playSuccessChime();
                    setShowAddTask(false);
                  }
                }}
                className="mt-4 space-y-3 pt-3 border-t border-emerald-950"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs text-neutral-300 font-bold block mb-1">অফার / টাস্কের শিরোনাম *:</label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="যেমন: আমাদের টেলিগ্রাম চ্যানেলে যোগ দিন"
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-300 font-bold block mb-1">রিওয়ার্ড পয়েন্ট *:</label>
                    <input
                      type="number"
                      min="0"
                      value={taskPoints}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        setTaskPoints(Number.isNaN(raw) ? 0 : Math.max(0, raw));
                      }}
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-bold block mb-1">অফারের বিবরণ / শর্ত নির্দেশনা (ঐচ্ছিক):</label>
                  <input
                    type="text"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="যেমন: রেফার কোডে ১ জন বন্ধু জয়েন করে রিল দেখলে বোনাস পাবেন"
                    className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs text-neutral-300 font-bold block mb-1">ক্যাটাগরি:</label>
                    <select
                      value={['সোশ্যাল', 'দৈনিক', 'স্পেশাল', 'রেফারাল'].includes(taskCategory) ? taskCategory : 'কাস্টম'}
                      onChange={(e) => {
                        if (e.target.value === 'কাস্টম') {
                          if (['সোশ্যাল', 'দৈনিক', 'স্পেশাল', 'রেফারাল'].includes(taskCategory)) {
                            setTaskCategory('বিশেষ অফার');
                          }
                        } else {
                          setTaskCategory(e.target.value);
                        }
                      }}
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="সোশ্যাল">সোশ্যাল (Social)</option>
                      <option value="দৈনিক">দৈনিক (Daily)</option>
                      <option value="স্পেশাল">স্পেশাল অফার (Special)</option>
                      <option value="রেফারাল">রেফারাল (Referral)</option>
                      <option value="কাস্টম">কাস্টম ক্যাটাগরি (Custom)</option>
                    </select>
                    {!['সোশ্যাল', 'দৈনিক', 'স্পেশাল', 'রেফারাল'].includes(taskCategory) && (
                      <input
                        type="text"
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value)}
                        placeholder="কাস্টম ক্যাটাগরির নাম লিখুন..."
                        className="mt-1.5 w-full bg-[#0d1611] border border-emerald-700/70 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-neutral-300 font-bold block mb-1">ব্যাজ লেবেল (ঐচ্ছিক):</label>
                    <input
                      type="text"
                      value={taskBadgeText}
                      onChange={(e) => setTaskBadgeText(e.target.value)}
                      placeholder="যেমন: 🔥 হট অফার / VIP"
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-300 font-bold block mb-1">আইকন:</label>
                    <select
                      value={taskIconName}
                      onChange={(e) => setTaskIconName(e.target.value)}
                      className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Send">Telegram / Send</option>
                      <option value="Youtube">YouTube / Video</option>
                      <option value="Users">Referral / Users</option>
                      <option value="PlayCircle">Reel / Play</option>
                      <option value="Gift">Gift / Bonus</option>
                      <option value="Flame">Hot Offer / Flame</option>
                      <option value="Sparkles">Special / Sparkles</option>
                      <option value="Share2">Share / Social</option>
                      <option value="Award">Reward / Award</option>
                    </select>
                  </div>
                </div>

                {/* Offer Verification / Requirement Rules */}
                <div className="p-3 rounded-xl bg-[#0d1611] border border-emerald-900/50 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs text-emerald-300 font-bold block mb-1">
                        🔒 অফার আনলক শর্ত (Verification Rule):
                      </label>
                      <select
                        value={taskRequirementType}
                        onChange={(e) => setTaskRequirementType(e.target.value as TaskRequirementType)}
                        className="w-full bg-[#132219] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="instant">সরাসরি / লিংক ভিজিট অফার (Instant)</option>
                        <option value="referral_count">সফল রেফার শর্ত (রেফার ছাড়া পয়েন্ট নয়)</option>
                        <option value="reels_watched">রিল দেখা শর্ত (নির্দিষ্ট রিল দেখলে আনলক)</option>
                        <option value="daily_checkin">দৈনিক চেক-ইন অফার (প্রতিদিন ১ বার)</option>
                      </select>
                    </div>

                    {(taskRequirementType === 'referral_count' || taskRequirementType === 'reels_watched') && (
                      <div>
                        <label className="text-xs text-amber-300 font-bold block mb-1">
                          {taskRequirementType === 'referral_count'
                            ? 'সর্বনিম্ন কতজন সফল রেফার প্রয়োজন:'
                            : 'সর্বনিম্ন কতটি রিল দেখা প্রয়োজন:'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={taskRequirementValue}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value, 10);
                            setTaskRequirementValue(Number.isNaN(raw) ? 1 : Math.max(1, raw));
                          }}
                          className="w-full bg-[#132219] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-amber-400"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center pt-1">
                    <div>
                      <label className="text-xs text-neutral-300 font-bold block mb-1">সোশ্যাল / অ্যাকশন লিংক (ঐচ্ছিক URL):</label>
                      <input
                        type="url"
                        value={taskActionUrl}
                        onChange={(e) => setTaskActionUrl(e.target.value)}
                        placeholder="https://t.me/yourchannel বা https://youtube.com/..."
                        className="w-full bg-[#132219] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pt-3 sm:pt-5">
                      <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskRequirementType === 'daily_checkin' ? true : taskIsRepeatableDaily}
                          disabled={taskRequirementType === 'daily_checkin'}
                          onChange={(e) => setTaskIsRepeatableDaily(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <span>প্রতিদিন রিসেট হবে (Daily)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-emerald-300 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskIsActive}
                          onChange={(e) => setTaskIsActive(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <span>অফার চালু (Active)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-extrabold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    {editingTask ? 'অফার / টাস্ক আপডেট করুন 💾' : 'নতুন অফার / টাস্ক পাবলিশ করুন 🚀'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTask(false);
                      setEditingTask(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Active & Paused Offers List */}
          <div className="rounded-2xl bg-[#141f19] border border-emerald-950 p-4 shadow-lg">
            <h3 className="text-sm font-bold text-white flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>সকল অফার ও টাস্কসমূহ ({(tasks || []).length})</span>
              </span>
              <span className="text-xs text-neutral-400 font-normal">
                সক্রিয়: {toBengaliNumber((tasks || []).filter((t) => t.isActive !== false).length)}টি
              </span>
            </h3>

            {(tasks || []).length === 0 ? (
              <p className="text-center py-8 text-neutral-500 text-xs">কোনো অফার বা টাস্ক পাওয়া যায়নি।</p>
            ) : (
              <div className="space-y-2.5">
                {(tasks || []).map((rawTask) => {
                  const t = normalizeTaskOffer(rawTask);
                  const reqBadge =
                    t.requirementType === 'referral_count'
                      ? `🔒 শর্ত: ${toBengaliNumber(t.requirementValue)} রেফার`
                      : t.requirementType === 'reels_watched'
                      ? `🎬 শর্ত: ${toBengaliNumber(t.requirementValue)} রিল`
                      : t.requirementType === 'daily_checkin'
                      ? '📅 দৈনিক চেক-ইন'
                      : '⚡ ইনস্ট্যান্ট';

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md transition ${
                        t.isActive
                          ? 'bg-[#0e1712] border-emerald-950 hover:border-emerald-800/40'
                          : 'bg-[#0b100d] border-neutral-800/80 opacity-75'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-white text-xs sm:text-sm">{t.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/40">
                            {t.category}
                          </span>
                          {t.badgeText && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                              {t.badgeText}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            t.isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            {t.isActive ? 'সক্রিয়' : 'বন্ধ'}
                          </span>
                        </div>
                        {t.description && (
                          <p className="text-[11px] text-neutral-400 line-clamp-2">{t.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                          <span className="text-emerald-400 font-extrabold">+{toBengaliNumber(t.rewardPoints)} Pts</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#14231b] text-cyan-300 border border-emerald-900/50 font-semibold">
                            {reqBadge}
                          </span>
                          {t.isRepeatableDaily && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 font-semibold">
                              প্রতিদিন
                            </span>
                          )}
                          {t.actionUrl && (
                            <span className="text-neutral-500 font-mono text-[10px] truncate max-w-[180px]">
                              🔗 {t.actionUrl}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (onEditTask) {
                              onEditTask({ ...t, isActive: !t.isActive });
                              playPopSound();
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            t.isActive
                              ? 'bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-700/40'
                              : 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700/40'
                          }`}
                        >
                          {t.isActive ? 'বন্ধ করুন' : 'চালু করুন'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask(t);
                            setTaskTitle(t.title);
                            setTaskDescription(t.description || '');
                            setTaskBadgeText(t.badgeText || '');
                            setTaskPoints(t.rewardPoints);
                            setTaskCategory(t.category);
                            setTaskActionUrl(t.actionUrl || '');
                            setTaskIconName(t.iconName || 'Send');
                            setTaskRequirementType(t.requirementType);
                            setTaskRequirementValue(t.requirementValue);
                            setTaskIsRepeatableDaily(t.isRepeatableDaily);
                            setTaskIsActive(t.isActive);
                            setTaskSortOrder(t.sortOrder ?? 10);
                            setShowAddTask(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-emerald-600 hover:text-black text-emerald-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>এডিট</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerConfirm(
                              'অফার / টাস্ক মুছে ফেলতে চান?',
                              `আপনি কি নিশ্চিত যে "${t.title}" অফারটি মুছে ফেলতে চান? এটি আয়ের পৃষ্ঠা থেকে অপসারণ করা হবে।`,
                              () => onDeleteTask && onDeleteTask(t.id)
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-600 hover:text-white text-rose-300 text-xs font-bold transition border border-rose-900/40 cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ডিলিট</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exit Admin Button */}
      <button
        onClick={onExitAdmin}
        className="w-full py-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/50 text-rose-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
      >
        <LogOut className="w-4 h-4" />
        <span>এডমিন প্যানেল থেকে সাইন আউট করুন</span>
      </button>

      {/* Global Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121c17] border border-rose-900/60 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-950/80 border border-rose-600/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-900/20">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-black text-white text-lg mb-2 leading-tight">{confirmModal.title}</h4>
              <p className="text-xs text-neutral-300 leading-relaxed px-1 font-medium mb-3">{confirmModal.message}</p>
              
              {confirmModal.showInput && (
                <input
                  type="text"
                  value={confirmModal.inputValue}
                  onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                  placeholder="অপসারণের কারণ (ঐচ্ছিক)..."
                  className="w-full bg-black/40 border border-emerald-900/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-rose-500/50 transition-colors"
                  autoFocus
                />
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="flex-1 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm(confirmModal.inputValue);
                  setConfirmModal(prev => ({ ...prev, show: false }));
                }}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL INSPECTION MODAL (ইউজার প্রোফাইল, আপলোডকৃত রিলস ও অ্যাক্টিভিটি) */}
      {selectedUserForDetails && (() => {
        const detailUserReels = getUserReels(selectedUserForDetails);
        const detailUserWithdrawals = withdrawals.filter(
          (w) => w.userId === selectedUserForDetails.id || (selectedUserForDetails.phone && w.userPhone === selectedUserForDetails.phone)
        );
        const detailUserDeposits = depositRequests.filter(
          (d) => d.userId === selectedUserForDetails.id || (selectedUserForDetails.phone && d.userPhone === selectedUserForDetails.phone)
        );
        const detailUserLevel = getUserLevel(selectedUserForDetails.reelsWatchedCount || 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
            <div className="bg-[#111c15] border border-emerald-900/80 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 bg-gradient-to-r from-blue-950 via-[#132219] to-emerald-950 border-b border-emerald-900/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <img
                      src={selectedUserForDetails.avatar}
                      alt={selectedUserForDetails.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                    />
                    {selectedUserForDetails.lastActive && new Date().getTime() - new Date(selectedUserForDetails.lastActive).getTime() < 60000 && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white truncate">{selectedUserForDetails.name}</h3>
                      {selectedUserForDetails.isVerified && (
                        <span title="ভেরিফাইড ইউজার">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                        </span>
                      )}
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/50 text-emerald-300 border border-emerald-500/30 uppercase">
                        {selectedUserForDetails.role}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 flex items-center gap-2 mt-0.5">
                      <span>📱 {selectedUserForDetails.phone || 'ফোন নেই'}</span>
                      <span>•</span>
                      <span>✉️ {selectedUserForDetails.email || 'ইমেইল নেই'}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUserForDetails(null)}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 4 Core Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-[#0c140f] border-b border-emerald-950/80 shrink-0">
                <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/50">
                  <p className="text-[10px] text-neutral-400">ব্যালেন্স পয়েন্ট</p>
                  <p className="text-sm sm:text-base font-extrabold text-emerald-400">
                    {toBengaliNumber(selectedUserForDetails.points)} <span className="text-[10px] text-neutral-300 font-normal">pts</span>
                  </p>
                  <p className="text-[10px] text-emerald-300/80">৳ {toBengaliNumber(Math.floor(selectedUserForDetails.points / (pointRate || 10)))} টাকা</p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/50">
                  <p className="text-[10px] text-neutral-400">আপলোড করা রিলস</p>
                  <p className="text-sm sm:text-base font-extrabold text-blue-400">
                    {toBengaliNumber(detailUserReels.length)} <span className="text-[10px] font-normal">টি রিল</span>
                  </p>
                  <p className="text-[10px] text-blue-300/80">ইউজারের কনটেন্ট</p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/50">
                  <p className="text-[10px] text-neutral-400">দেখা রিলস (Watched)</p>
                  <p className="text-sm sm:text-base font-extrabold text-cyan-400">
                    {toBengaliNumber(selectedUserForDetails.reelsWatchedCount || 0)} <span className="text-[10px] font-normal">টি</span>
                  </p>
                  <p className="text-[10px] text-cyan-300/80">{detailUserLevel.nameBn}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/50">
                  <p className="text-[10px] text-neutral-400">মোট উত্তোলন</p>
                  <p className="text-sm sm:text-base font-extrabold text-amber-400">
                    ৳ {toBengaliNumber(selectedUserForDetails.totalWithdrawn || 0)}
                  </p>
                  <p className="text-[10px] text-amber-300/80">ক্যাশআউট প্রুভড</p>
                </div>
              </div>

              {/* Sub Tabs Selector */}
              <div className="flex gap-2 px-4 pt-3 border-b border-emerald-950 bg-[#111c15] overflow-x-auto no-scrollbar shrink-0">
                <button
                  onClick={() => setUserDetailSubTab('reels')}
                  className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    userDetailSubTab === 'reels'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>ইউজারের আপলোডকৃত রিলস ({toBengaliNumber(detailUserReels.length)})</span>
                </button>

                <button
                  onClick={() => setUserDetailSubTab('activity')}
                  className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    userDetailSubTab === 'activity'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>দেখা ও অ্যাক্টিভিটি ডিটেলস</span>
                </button>

                <button
                  onClick={() => setUserDetailSubTab('withdrawals')}
                  className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    userDetailSubTab === 'withdrawals'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>উইথড্রয়াল ({toBengaliNumber(detailUserWithdrawals.length)})</span>
                </button>

                <button
                  onClick={() => setUserDetailSubTab('deposits')}
                  className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    userDetailSubTab === 'deposits'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>ডিপোজিট ({toBengaliNumber(detailUserDeposits.length)})</span>
                </button>
              </div>

              {/* Scrollable SubTab Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* SUBTAB 1: USER'S UPLOADED REELS */}
                {userDetailSubTab === 'reels' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                      <span>🎬 এই ইউজারের আপলোড করা মোট রিলস: <b className="text-white">{toBengaliNumber(detailUserReels.length)} টি</b></span>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetUserId(selectedUserForDetails.id);
                          setNewCreator(selectedUserForDetails.name);
                          setSelectedUserForDetails(null);
                          setActiveAdminTab('reels');
                          setShowAddReel(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#00c853] hover:bg-[#00e676] text-black font-extrabold text-[11px] transition cursor-pointer flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>এই ইউজারের প্রোফাইলে রিল দিন</span>
                      </button>
                    </div>

                    {detailUserReels.length === 0 ? (
                      <div className="text-center py-10 bg-[#0d1611] rounded-2xl border border-dashed border-emerald-950 p-6 space-y-2">
                        <Video className="w-10 h-10 text-neutral-600 mx-auto" />
                        <p className="text-sm font-bold text-neutral-300">এই ইউজার এখনো কোনো রিল আপলোড করেননি।</p>
                        <p className="text-xs text-neutral-500">ইউজার অ্যাপ থেকে ভিডিও আপলোড করলে সরাসরি এখানে এবং তার প্রোফাইলে দেখাবে।</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {detailUserReels.map((reel) => (
                          <div
                            key={reel.id}
                            className="p-3 rounded-2xl bg-[#0e1712] border border-emerald-950 flex flex-col justify-between gap-3 shadow-md hover:border-emerald-800/50 transition"
                          >
                            <div className="flex gap-3">
                              <div
                                onClick={() => reel.videoUrl && setVideoModalUrl(reel.videoUrl)}
                                className="relative w-16 h-22 rounded-xl overflow-hidden shrink-0 border border-emerald-950 shadow-md cursor-pointer group"
                              >
                                <img
                                  src={reel.thumbnailUrl}
                                  alt={reel.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
                                  <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-white text-xs line-clamp-2 mb-1">{reel.title}</p>
                                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] font-semibold mb-1.5">
                                  {reel.category}
                                </span>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-400">
                                  <span className="text-emerald-400 font-bold">👁️ {toBengaliNumber(reel.viewsCount || 0)} ভিউ</span>
                                  <span>•</span>
                                  <span>❤️ {toBengaliNumber(reel.likesCount || 0)}</span>
                                  <span>•</span>
                                  <span>💰 +{toBengaliNumber(reel.pointsReward)} Pts</span>
                                </div>
                                {reel.caption && (
                                  <p className="text-[10px] text-neutral-400 truncate mt-1 italic">"{reel.caption}"</p>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons for Reel */}
                            <div className="flex items-center justify-between pt-2 border-t border-emerald-950/70 text-xs">
                              <button
                                onClick={() => reel.videoUrl && setVideoModalUrl(reel.videoUrl)}
                                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-emerald-300" />
                                <span>প্লে করুন</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onEditReel(reel)}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-emerald-600 hover:text-black text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>এডিট</span>
                                </button>
                                <button
                                  onClick={() => {
                                      triggerConfirm(
                                        'রিল মুছে ফেলতে চান?',
                                        `আপনি কি নিশ্চিত যে "${reel.title}" রিলটি মুছে ফেলতে চান? এটি ফিড থেকে স্থায়ীভাবে ডিলিট হয়ে যাবে। ইউজারকে কোনো বিশেষ কারণ জানাতে চাইলে নিচে লিখুন।`,
                                        (reason) => onDeleteReel(reel, reason),
                                        true
                                      );
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-600 hover:text-white text-rose-300 text-[11px] font-bold border border-rose-900/40 flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>ডিলিট</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB 2: ACTIVITY & WATCH DETAILS */}
                {userDetailSubTab === 'activity' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-[#0e1712] border border-emerald-950 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        <span>রিল দেখা ও সক্রিয়তার বিস্তারিত তথ্য</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/40 space-y-1">
                          <span className="text-[10px] text-neutral-400 block">মোট সম্পূর্ণ দেখা রিলস:</span>
                          <span className="text-sm font-extrabold text-cyan-300">
                            👁️ {toBengaliNumber(selectedUserForDetails.reelsWatchedCount || 0)} টি ভিডিও রিল
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/40 space-y-1">
                          <span className="text-[10px] text-neutral-400 block">মেম্বারশিপ লেভেল ও গুণক:</span>
                          <span className="text-sm font-extrabold text-amber-300">
                            {detailUserLevel.badge} {detailUserLevel.nameBn} ({detailUserLevel.multiplier}x বোনাস)
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/40 space-y-1">
                          <span className="text-[10px] text-neutral-400 block">শেষ সক্রিয় থাকার সময়:</span>
                          <span className="text-xs font-semibold text-neutral-200">
                            {selectedUserForDetails.lastActive ? new Date(selectedUserForDetails.lastActive).toLocaleString('bn-BD') : 'তথ্য নেই'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/40 space-y-1">
                          <span className="text-[10px] text-neutral-400 block">শেষ ভিজিট করা পেজ:</span>
                          <span className="text-xs font-semibold text-emerald-400 truncate block">
                            {selectedUserForDetails.lastPage || 'হোম ফিড'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/40 space-y-1">
                          <span className="text-[10px] text-neutral-400 block">মোট অ্যাপ সেশন:</span>
                          <span className="text-xs font-semibold text-neutral-200">
                            {toBengaliNumber(selectedUserForDetails.totalSessions || 1)} বার
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/40 space-y-1">
                          <span className="text-[10px] text-neutral-400 block">ইউজার রেফারেল কোড:</span>
                          <span className="text-xs font-bold text-amber-400 font-mono">
                            {selectedUserForDetails.referralCode || 'REEL100'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/40 space-y-1">
                          <span className="text-[10px] text-neutral-400 block">রেজিস্ট্রেশন তারিখ:</span>
                          <span className="text-xs font-semibold text-neutral-200">
                            {selectedUserForDetails.createdAt || 'N/A'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#14231a] border border-emerald-900/40 space-y-1">
                          <span className="text-[10px] text-neutral-400 block">ডিফল্ট পেমেন্ট নাম্বার:</span>
                          <span className="text-xs font-semibold text-emerald-300">
                            {selectedUserForDetails.paymentMethod || 'bKash'} ({selectedUserForDetails.paymentAccountNumber || selectedUserForDetails.phone || 'নেই'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: WITHDRAWALS */}
                {userDetailSubTab === 'withdrawals' && (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-400">
                      এই ইউজারের মোট উত্তোলনের আবেদন: <b className="text-white">{toBengaliNumber(detailUserWithdrawals.length)} টি</b>
                    </p>

                    {detailUserWithdrawals.length === 0 ? (
                      <p className="text-center py-8 text-xs text-neutral-500 bg-[#0d1611] rounded-2xl border border-emerald-950">
                        এই ইউজার এখনো কোনো উত্তোলনের আবেদন করেননি।
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {detailUserWithdrawals.map((w) => (
                          <div
                            key={w.id}
                            className="p-3 rounded-xl bg-[#0e1712] border border-emerald-950 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white text-sm">৳{toBengaliNumber(w.amountBDT)}</span>
                                <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-bold">
                                  {w.method}
                                </span>
                                <span className="text-[10px] text-neutral-400">({w.accountNumber})</span>
                              </div>
                              <p className="text-[10px] text-neutral-500 mt-0.5">
                                পয়েন্ট কর্তন: {toBengaliNumber(w.pointsDeducted)} Pts • {new Date(w.createdAt).toLocaleDateString('bn-BD')}
                              </p>
                            </div>

                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                w.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                  : w.status === 'pending'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                              }`}
                            >
                              {w.status === 'approved' ? 'অনুমোদিত' : w.status === 'pending' ? 'পেন্ডিং' : 'বাতিল'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB 4: DEPOSITS */}
                {userDetailSubTab === 'deposits' && (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-400">
                      এই ইউজারের ডিপোজিট আবেদন: <b className="text-white">{toBengaliNumber(detailUserDeposits.length)} টি</b>
                    </p>

                    {detailUserDeposits.length === 0 ? (
                      <p className="text-center py-8 text-xs text-neutral-500 bg-[#0d1611] rounded-2xl border border-emerald-950">
                        এই ইউজারের কোনো ডিপোজিট হিস্ট্রি নেই।
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {detailUserDeposits.map((d) => (
                          <div
                            key={d.id}
                            className="p-3 rounded-xl bg-[#0e1712] border border-emerald-950 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-emerald-400 text-sm">৳{toBengaliNumber(d.amountBDT)}</span>
                                <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-bold">
                                  {d.method}
                                </span>
                                <span className="text-[10px] text-amber-300 font-bold">+{toBengaliNumber(d.pointsToAdd)} Pts</span>
                              </div>
                              <p className="text-[10px] text-neutral-500 mt-0.5">
                                প্রেরক নম্বর: {d.senderNumber} • TrxID: {d.transactionId}
                              </p>
                            </div>

                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                d.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                  : d.status === 'pending'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                              }`}
                            >
                              {d.status === 'approved' ? 'অনুমোদিত' : d.status === 'pending' ? 'পেন্ডিং' : 'বাতিল'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Bottom Admin Actions Strip */}
              <div className="p-3.5 bg-[#0a120e] border-t border-emerald-950/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400 font-semibold">পয়েন্ট কাস্টমাইজ:</span>
                  <input
                    type="number"
                    value={detailUserPointsInput}
                    onChange={(e) => setDetailUserPointsInput(e.target.value)}
                    className="w-24 bg-[#14231a] border border-emerald-950 rounded-lg px-2 py-1 text-xs text-white font-bold"
                  />
                  <button
                    onClick={() => {
                      const pts = parseInt(detailUserPointsInput, 10);
                      if (!isNaN(pts) && pts >= 0) {
                        const updated = { ...selectedUserForDetails, points: pts };
                        onUpdateUser(updated);
                        setSelectedUserForDetails(updated);
                        playSuccessChime();
                        showPanelToast(`✅ ${selectedUserForDetails.name}-এর পয়েন্ট সফলভাবে ${pts}-এ সেট করা হয়েছে!`);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#00c853] hover:bg-[#00e676] text-black font-bold text-xs transition cursor-pointer"
                  >
                    সেভ
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      onGiveUserBonus(selectedUserForDetails.id, 100);
                      const updated = { ...selectedUserForDetails, points: selectedUserForDetails.points + 100 };
                      setSelectedUserForDetails(updated);
                      setDetailUserPointsInput(String(updated.points));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>+১০০ বোনাস</span>
                  </button>

                  <button
                    onClick={() => {
                      onGiveUserBonus(selectedUserForDetails.id, 500);
                      const updated = { ...selectedUserForDetails, points: selectedUserForDetails.points + 500 };
                      setSelectedUserForDetails(updated);
                      setDetailUserPointsInput(String(updated.points));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>+৫০০ বোনাস</span>
                  </button>

                  <button
                    onClick={() => {
                      const updated = { ...selectedUserForDetails, isVerified: !selectedUserForDetails.isVerified };
                      onUpdateUser(updated);
                      setSelectedUserForDetails(updated);
                      playPopSound();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      selectedUserForDetails.isVerified
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-700/50'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedUserForDetails.isVerified ? 'ভেরিফাইড টিক আছে' : '+ ভেরিফাইড করুন'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const newRole = selectedUserForDetails.role === 'admin' ? 'user' : 'admin';
                      const updated = { ...selectedUserForDetails, role: newRole as any };
                      onUpdateUser(updated);
                      setSelectedUserForDetails(updated);
                      playPopSound();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-bold transition cursor-pointer"
                  >
                    রোল: {selectedUserForDetails.role === 'admin' ? 'এডমিন (User করুন)' : 'ইউজার (Admin করুন)'}
                  </button>

                  <button
                    onClick={() => {
                      triggerConfirm(
                        'ইউজার ডিলিট করবেন?',
                        `আপনি কি নিশ্চিত যে ইউজার "${selectedUserForDetails.name}"-কে ডিলিট বা ব্যান করতে চান? এটি তার সকল ডাটা ডিলিট করে দেবে!`,
                        () => {
                          onDeleteUser(selectedUserForDetails.id, selectedUserForDetails.name);
                          setSelectedUserForDetails(null);
                        }
                      );
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/40 text-rose-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ইউজার ডিলিট</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FULL VIDEO PLAYER MODAL IN ADMIN PANEL */}
      {videoModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121c16] border border-emerald-900/80 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative">
            <div className="p-3 bg-black flex items-center justify-between border-b border-emerald-950">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>রিল প্রিভিউ প্লেয়ার</span>
              </h4>
              <button
                onClick={() => setVideoModalUrl(null)}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-[9/16] bg-black">
              <video
                src={videoModalUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* REEL COMMENTS MODERATION MODAL */}
      {moderatingReel && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121c17] border border-cyan-800/60 rounded-3xl max-w-md w-full max-h-[82vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#0a120e] border-b border-emerald-950 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  <span>মন্তব্য মডারেশন ({toBengaliNumber(moderatingComments.length)})</span>
                </h4>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{moderatingReel.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setModeratingReel(null)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {moderatingComments.length === 0 ? (
                <p className="text-center py-8 text-xs text-neutral-400">এই রিলে কোনো মন্তব্য পাওয়া যায়নি।</p>
              ) : (
                moderatingComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-[#0b140f] border border-emerald-950 flex items-start justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{c.userName}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{c.userId.slice(0, 8)}</span>
                      </div>
                      <p className="text-xs text-neutral-200 mt-1 break-words">{c.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (onDeleteReelComment) {
                          onDeleteReelComment(moderatingReel.id, c.id);
                        } else {
                          await deleteDocument(`reels/${moderatingReel.id}/comments`, c.id).catch(() => {});
                        }
                        setModeratingComments((prev) => prev.filter((item) => item.id !== c.id));
                        showPanelToast('🗑️ মন্তব্য মুছে ফেলা হয়েছে!');
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-600 text-rose-300 hover:text-white cursor-pointer shrink-0"
                      title="মন্তব্য মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking Panel Toast Banner */}
      {panelToast && (
        <div
          className={`fixed bottom-5 right-5 z-[130] px-4 py-2.5 rounded-2xl text-xs font-black shadow-2xl border flex items-center gap-2 animate-in fade-in ${
            panelToast.type === 'error'
              ? 'bg-rose-950 border-rose-500 text-rose-100'
              : 'bg-[#0e1f17] border-emerald-400 text-emerald-100'
          }`}
        >
          <span>{panelToast.msg}</span>
        </div>
      )}
    </div>
  );
};
