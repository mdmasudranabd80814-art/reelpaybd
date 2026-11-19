export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  paymentMethod?: 'bKash' | 'Nagad' | 'Rocket';
  paymentAccountNumber?: string;
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
  accountType: 'Personal' | 'Agent';
  method: 'bKash' | 'Nagad' | 'Rocket';
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
  method: 'bKash' | 'Nagad' | 'Rocket';
  amountBDT: number;
  pointsToAdd: number;
  transactionId: string;
  senderNumber: string;
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
