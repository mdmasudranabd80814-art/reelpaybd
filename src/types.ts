export type PaymentMethodCategory = 'mobile_banking' | 'bank' | 'card' | 'other';

export interface PaymentMethodConfig {
  id: string;
  name: string;
  nameBn: string;
  category: PaymentMethodCategory;
  accountNumber: string;
  accountTitle?: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  accountTypeLabel?: string;
  instructions?: string;
  colorHex?: string;
  supportsDeposit: boolean;
  supportsWithdrawal: boolean;
  isEnabled: boolean;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'pm_bkash',
    name: 'bKash',
    nameBn: 'বিকাশ',
    category: 'mobile_banking',
    accountNumber: '01700000000',
    accountTitle: 'ReelPay BD Official',
    accountTypeLabel: 'Personal / Agent',
    instructions: 'সেন্ড মানি (Send Money) করে আপনার প্রেরক নম্বর ও TrxID জমা দিন।',
    colorHex: '#e2136e',
    supportsDeposit: true,
    supportsWithdrawal: true,
    isEnabled: true,
  },
  {
    id: 'pm_nagad',
    name: 'Nagad',
    nameBn: 'নগদ',
    category: 'mobile_banking',
    accountNumber: '01800000000',
    accountTitle: 'ReelPay BD Official',
    accountTypeLabel: 'Personal / Agent',
    instructions: 'নগদে সেন্ড মানি (Send Money) করে TrxID ও প্রেরক নম্বর লিখুন।',
    colorHex: '#f7941d',
    supportsDeposit: true,
    supportsWithdrawal: true,
    isEnabled: true,
  },
  {
    id: 'pm_rocket',
    name: 'Rocket',
    nameBn: 'রকেট',
    category: 'mobile_banking',
    accountNumber: '01900000000',
    accountTitle: 'ReelPay BD Official',
    accountTypeLabel: 'Personal / Agent',
    instructions: 'রকেট থেকে সেন্ড মানি করে TrxID সহ তথ্য সাবমিট করুন।',
    colorHex: '#8c2d8c',
    supportsDeposit: true,
    supportsWithdrawal: true,
    isEnabled: true,
  },
];

export const PAYMENT_METHOD_PRESETS: Array<Omit<PaymentMethodConfig, 'id' | 'accountNumber'>> = [
  // Mobile Banking
  { name: 'bKash', nameBn: 'বিকাশ', category: 'mobile_banking', accountTypeLabel: 'Personal / Merchant', colorHex: '#e2136e', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'Nagad', nameBn: 'নগদ', category: 'mobile_banking', accountTypeLabel: 'Personal / Merchant', colorHex: '#f7941d', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'Rocket', nameBn: 'রকেট', category: 'mobile_banking', accountTypeLabel: 'Personal / Agent', colorHex: '#8c2d8c', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'Upay', nameBn: 'উপায়', category: 'mobile_banking', accountTypeLabel: 'Personal', colorHex: '#00a6e2', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'CellFin', nameBn: 'সেলফিন', category: 'mobile_banking', accountTypeLabel: 'IBBL CellFin', colorHex: '#059669', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'tap', nameBn: 'ট্যাপ', category: 'mobile_banking', accountTypeLabel: 'Personal', colorHex: '#16a34a', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'SureCash', nameBn: 'শিওরক্যাশ', category: 'mobile_banking', accountTypeLabel: 'Personal', colorHex: '#2563eb', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'mCash', nameBn: 'এমক্যাশ', category: 'mobile_banking', accountTypeLabel: 'Personal', colorHex: '#0d9488', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'MyCash', nameBn: 'মাইক্যাশ', category: 'mobile_banking', accountTypeLabel: 'Personal', colorHex: '#dc2626', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'OK Wallet', nameBn: 'ওকে ওয়ালেট', category: 'mobile_banking', accountTypeLabel: 'One Bank OK Wallet', colorHex: '#ea580c', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  // Banks
  { name: 'Dutch-Bangla Bank (DBBL)', nameBn: 'ডাচ-বাংলা ব্যাংক', category: 'bank', bankName: 'Dutch-Bangla Bank PLC', accountTypeLabel: 'Savings / Current', colorHex: '#0f766e', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'Islami Bank (IBBL)', nameBn: 'ইসলামী ব্যাংক', category: 'bank', bankName: 'Islami Bank Bangladesh PLC', accountTypeLabel: 'Savings / Current', colorHex: '#15803d', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'BRAC Bank', nameBn: 'ব্র্যাক ব্যাংক', category: 'bank', bankName: 'BRAC Bank PLC', accountTypeLabel: 'Savings / Current', colorHex: '#0284c7', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'City Bank', nameBn: 'সিটি ব্যাংক', category: 'bank', bankName: 'The City Bank PLC', accountTypeLabel: 'Savings / Current', colorHex: '#b91c1c', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'Sonali Bank', nameBn: 'সোনালী ব্যাংক', category: 'bank', bankName: 'Sonali Bank PLC', accountTypeLabel: 'Savings / Current', colorHex: '#047857', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'Eastern Bank (EBL)', nameBn: 'ইস্টার্ন ব্যাংক', category: 'bank', bankName: 'Eastern Bank PLC', accountTypeLabel: 'Savings / Current', colorHex: '#1d4ed8', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  // Cards
  { name: 'Visa Card', nameBn: 'ভিসা কার্ড', category: 'card', accountTypeLabel: 'Visa Debit / Credit', colorHex: '#1e40af', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'MasterCard', nameBn: 'মাস্টারকার্ড', category: 'card', accountTypeLabel: 'MasterCard Debit / Credit', colorHex: '#c2410c', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'NexusPay Card', nameBn: 'নেক্সাস পে কার্ড', category: 'card', accountTypeLabel: 'DBBL NexusPay', colorHex: '#0f766e', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
  { name: 'American Express', nameBn: 'অ্যামেরিকান এক্সপ্রেস', category: 'card', accountTypeLabel: 'Amex Card', colorHex: '#0369a1', supportsDeposit: true, supportsWithdrawal: true, isEnabled: true },
];

export interface SiteSettings {
  id: 'site';
  pointRate: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  minDeposit: number;
  announcement: string;
  paymentMethods: PaymentMethodConfig[];
  isDepositsEnabled: boolean;
  isWithdrawalsEnabled: boolean;
  allowUserReelUpload: boolean;
  defaultUserReelRewardPoints: number;
  allowUserAudioLive: boolean;
  allowUserVideoLive: boolean;
  isGiftsEnabled: boolean;
  isCommentsEnabled: boolean;
  isDirectChatEnabled: boolean;
  allowGuestPreviewPoints: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  updatedAt?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'site',
  pointRate: 10,
  minWithdrawal: 100,
  maxWithdrawal: 50000,
  minDeposit: 20,
  announcement: '📢 আজকের স্পেশাল অফার! প্রতিটি রিল দেখলে ইনস্ট্যান্ট ১০ পয়েন্ট। বন্ধুদের ইনভাইট করে ৫০ টাকা বোনাস বুঝে নিন!',
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  isDepositsEnabled: true,
  isWithdrawalsEnabled: true,
  allowUserReelUpload: true,
  defaultUserReelRewardPoints: 10,
  allowUserAudioLive: true,
  allowUserVideoLive: true,
  isGiftsEnabled: true,
  isCommentsEnabled: true,
  isDirectChatEnabled: true,
  allowGuestPreviewPoints: true,
  maintenanceMode: false,
  maintenanceMessage: 'সিস্টেম আপগ্রেডের কাজ চলছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
};

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  paymentMethod?: string;
  paymentAccountNumber?: string;
  paymentAccountHolder?: string;
  paymentBankName?: string;
  paymentBranchName?: string;
  points: number;
  role: 'user' | 'admin';
  avatar: string;
  createdAt: string;
  totalWithdrawn: number;
  reelsWatchedCount: number;
  levelName?: string;
  multiplier?: number;
  dailyClaimedDate?: string;
  referralCode: string;
  referredBy?: string;
  referralBonusClaimed?: boolean;
  lastActive?: string;
  lastPage?: string;
  totalSessions?: number;
  isVerified: boolean;
  completedTaskIds?: string[];
  dailyReelClaimDate?: string;
  dailyReelClaimsCount?: number;
  dailyReelPointsEarned?: number;
  loginOfferClaimed?: boolean;
  loginOfferCampaignId?: string;
  dailySpinClaimDate?: string;
  dailySpinClaimsCount?: number;
  followersCount?: number;
  followingCount?: number;
  followers?: string[];
  following?: string[];
}

export interface Reel {
  id: string;
  userId: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string;
  isVerified?: boolean;
  category: 'সকল' | 'ট্রেন্ডিং' | 'কমেডি' | 'গেমিং' | 'রান্না' | 'শিক্ষা';
  thumbnailUrl: string;
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  pointsReward: number;
  timeAgo: string;
  createdAt: string;
  viewsCount: number;
  audioTrack: string;
  caption: string;
  hashtags: string[];
  isEarningEnabled?: boolean;
  isSpecialOffer?: boolean;
  specialOfferBadge?: string;
  customWatchSeconds?: number;
  filter?: string;
}

export interface EarningSettings {
  isMasterEarningEnabled: boolean;
  isLoginOfferEnabled: boolean;
  loginOfferPoints: number;
  loginOfferCampaignId?: string;
  loginOfferTitle?: string;
  isVideoWatchEarningEnabled: boolean;
  videoWatchDurationSeconds: number;
  defaultVideoRewardPoints: number;
  videoEarningScope: 'all_reels' | 'offer_reels_only';
  allowDirectFeedClaim: boolean;
  isDailyReelLimitEnabled: boolean;
  dailyMaxReelClaims: number;
  dailyMaxReelPoints: number;
  requireFullWatchTimeInFullScreen: boolean;
  isDailyBonusEnabled: boolean;
  dailyBonusPoints: number;
  isSpinWheelEnabled: boolean;
  spinMaxPrize: number;
  spinPrizes: number[];
  dailyMaxSpins: number;
  spinLimitMode: 'fixed' | 'video_based';
  spinVideosRequired: number;
  isScratchCardEnabled: boolean;
  scratchCardPrize: number;
  isReferralEnabled: boolean;
  referralRewardPoints: number;
  referredUserRewardPoints: number;
  isTasksEnabled: boolean;
  isLevelMultiplierEnabled: boolean;
  giftHostPercent: number;
  giftAdminPercent: number;
  giftCashbackPercent: number;
  adminCommissionReceiverId?: string;
}

export const DEFAULT_EARNING_SETTINGS: EarningSettings = {
  isMasterEarningEnabled: true,
  isLoginOfferEnabled: false,
  loginOfferPoints: 0,
  loginOfferCampaignId: '',
  loginOfferTitle: 'ওয়েলকাম লগইন অফার',
  isVideoWatchEarningEnabled: true,
  videoWatchDurationSeconds: 15, // Users watch fullscreen video for 15s (admin configurable)
  defaultVideoRewardPoints: 10,
  videoEarningScope: 'all_reels',
  allowDirectFeedClaim: true,
  isDailyReelLimitEnabled: true,
  dailyMaxReelClaims: 5,
  dailyMaxReelPoints: 100,
  requireFullWatchTimeInFullScreen: true,
  isDailyBonusEnabled: true,
  dailyBonusPoints: 50,
  isSpinWheelEnabled: true,
  spinMaxPrize: 100,
  spinPrizes: [10, 25, 50, 15, 100, 30, 20, 40],
  dailyMaxSpins: 5,
  spinLimitMode: 'video_based',
  spinVideosRequired: 2,
  isScratchCardEnabled: true,
  scratchCardPrize: 35,
  isReferralEnabled: true,
  referralRewardPoints: 50,
  referredUserRewardPoints: 20,
  isTasksEnabled: true,
  isLevelMultiplierEnabled: true,
  giftHostPercent: 60,
  giftAdminPercent: 20,
  giftCashbackPercent: 20,
  adminCommissionReceiverId: '',
};

export interface Comment {
  id: string;
  reelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timeAgo?: string;
  createdAt: string;
  likes: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  accountNumber: string;
  accountType: string;
  method: string;
  methodCategory?: PaymentMethodCategory;
  accountHolderName?: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  accountDetails?: string;
  pointsDeducted: number;
  amountBDT: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  transactionId?: string;
  rejectionReason?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  rewardPoints: number;
  category: string;
  iconName: string;
  completed: boolean;
  actionUrl?: string;
  createdAt?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  method: string;
  methodCategory?: PaymentMethodCategory;
  receiverAccountNumber?: string;
  amountBDT: number;
  pointsToAdd: number;
  transactionId: string;
  senderNumber: string;
  senderDetails?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface GiftItem {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  costPoints: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reel_deleted' | 'deposit' | 'withdrawal' | 'general';
  createdAt: string;
  read: boolean;
}

export type LiveMode = 'audio' | 'video';

export interface LiveCoHost {
  id: string;
  name: string;
  avatar: string;
  isMuted?: boolean;
  joinedAt?: string;
}

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  mode: LiveMode;
  category?: string;
  pinnedNotice?: string;
  isMicMuted?: boolean;
  isCameraOn?: boolean;
  chatEnabled?: boolean;
  allowSpeakerRequests?: boolean;
  viewersCount: number;
  likesCount: number;
  giftsTotalPoints?: number;
  adminGiftPoints?: number;
  coHosts?: LiveCoHost[];
  status: 'active' | 'ended';
  cancelledByAdmin?: boolean;
  cancelReason?: string;
  createdAt: string;
  endedAt?: string;
}

export interface LiveChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  type?: 'chat' | 'gift' | 'join' | 'system';
  giftId?: string;
  giftIcon?: string;
  giftName?: string;
  giftPoints?: number;
  createdAt: string;
}

export interface LiveSpeakerRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ChatSession {
  id: string; // Typically "uid1_uid2" sorted
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  sharedReelId?: string;
  sharedReelThumbnail?: string;
  createdAt: string;
  isHidden?: boolean;
}
