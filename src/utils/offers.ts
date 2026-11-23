import { EarningSettings, TaskItem, TaskRequirementType, User } from '../types';

export function buildScaledSpinPrizes(maxPrize: number): number[] {
  const safeMax = Math.max(10, Math.round(maxPrize || 100));
  const ratio = Math.max(0.1, safeMax / 100);
  return [10, 25, 50, 15, 100, 30, 20, 40].map((p) =>
    p === 100 ? safeMax : Math.max(1, Math.round(p * ratio))
  );
}

export function normalizeTaskOffer(task: TaskItem): TaskItem & {
  requirementType: TaskRequirementType;
  requirementValue: number;
  isActive: boolean;
  isRepeatableDaily: boolean;
} {
  let reqType: TaskRequirementType = task.requirementType || 'instant';
  if (!task.requirementType) {
    if (
      task.id === 'task_05' ||
      task.category === 'রেফারাল' ||
      task.title.includes('রেফার') ||
      task.title.toLowerCase().includes('refer')
    ) {
      reqType = 'referral_count';
    } else if (
      task.id === 'task_02' ||
      task.title.includes('রিল') ||
      task.title.toLowerCase().includes('reel')
    ) {
      reqType = 'reels_watched';
    } else if (task.id === 'task_01' || task.category === 'দৈনিক') {
      reqType = 'daily_checkin';
    }
  }

  let reqVal = Math.max(1, Math.round(Number(task.requirementValue) || 0));
  if (!task.requirementValue) {
    if (reqType === 'reels_watched') {
      reqVal = 5;
    } else if (reqType === 'referral_count') {
      reqVal = 1;
    }
  }

  const isRepeatable =
    typeof task.isRepeatableDaily === 'boolean'
      ? task.isRepeatableDaily
      : reqType === 'daily_checkin' || task.id === 'task_02';

  return {
    ...task,
    isActive: task.isActive !== false,
    requirementType: reqType,
    requirementValue: reqVal,
    isRepeatableDaily: isRepeatable,
  };
}

export function isTaskCompletedForUser(
  rawTask: TaskItem,
  user: User,
  todayKey: string
): boolean {
  const task = normalizeTaskOffer(rawTask);
  if (task.isRepeatableDaily) {
    if (user.dailyTaskClaimDate !== todayKey) return false;
    return Array.isArray(user.dailyCompletedTaskIds)
      ? user.dailyCompletedTaskIds.includes(task.id)
      : false;
  }
  return Boolean(user.completedTaskIds?.includes(task.id) || task.completed);
}

export function getOfferRequirementProgress(
  rawTask: TaskItem,
  user: User,
  todayKey: string
): {
  requirementType: TaskRequirementType;
  required: number;
  current: number;
  met: boolean;
} {
  const task = normalizeTaskOffer(rawTask);
  const reqType = task.requirementType;
  const required = task.requirementValue;

  if (reqType === 'referral_count') {
    const current = Math.max(0, user.referralsCount || 0);
    return { requirementType: reqType, required, current, met: current >= required };
  }

  if (reqType === 'reels_watched') {
    const current = task.isRepeatableDaily
      ? user.dailyReelClaimDate === todayKey
        ? user.dailyReelClaimsCount || 0
        : 0
      : user.reelsWatchedCount || 0;
    return { requirementType: reqType, required, current, met: current >= required };
  }

  return { requirementType: reqType, required: 1, current: 1, met: true };
}

export function getDailyEarningUsage(
  user: User,
  earningSettings: EarningSettings,
  todayKey: string
) {
  const sameTotalDay = user.dailyTotalEarnedDate === todayKey;
  const dailyTotalEarnedToday = sameTotalDay ? Math.max(0, user.dailyTotalPointsEarned || 0) : 0;
  const isTotalLimitEnabled = earningSettings.isDailyTotalLimitEnabled !== false;
  const dailyMaxTotalPoints = Math.max(0, earningSettings.dailyMaxTotalPoints ?? 250);
  const remainingTotalPoints =
    isTotalLimitEnabled && dailyMaxTotalPoints > 0
      ? Math.max(0, dailyMaxTotalPoints - dailyTotalEarnedToday)
      : Infinity;
  const isDailyTotalLimitReached = Boolean(
    isTotalLimitEnabled && dailyMaxTotalPoints > 0 && dailyTotalEarnedToday >= dailyMaxTotalPoints
  );

  const sameTaskDay = user.dailyTaskClaimDate === todayKey;
  const dailyTaskClaimsUsed = sameTaskDay ? Math.max(0, user.dailyTaskClaimsCount || 0) : 0;
  const isTaskLimitEnabled = earningSettings.isDailyTaskLimitEnabled !== false;
  const dailyMaxTaskClaims = Math.max(0, earningSettings.dailyMaxTaskClaims ?? 5);
  const isDailyTaskLimitReached = Boolean(
    isTaskLimitEnabled && dailyMaxTaskClaims > 0 && dailyTaskClaimsUsed >= dailyMaxTaskClaims
  );

  return {
    dailyTotalEarnedToday,
    isTotalLimitEnabled,
    dailyMaxTotalPoints,
    remainingTotalPoints,
    isDailyTotalLimitReached,
    dailyTaskClaimsUsed,
    isTaskLimitEnabled,
    dailyMaxTaskClaims,
    isDailyTaskLimitReached,
  };
}

export function sanitizeTaskPayload(
  task: Partial<TaskItem> & { title: string; rewardPoints: number; category: string }
): Record<string, any> {
  const payload: Record<string, any> = {
    title: task.title.trim().slice(0, 160),
    rewardPoints: Math.max(0, Math.round(Number(task.rewardPoints) || 0)),
    category: (task.category || 'সোশ্যাল').trim().slice(0, 60),
    iconName: (task.iconName || 'Gift').trim().slice(0, 60),
    completed: Boolean(task.completed),
    isActive: task.isActive !== false,
    requirementType: task.requirementType || 'instant',
    requirementValue: Math.max(1, Math.round(Number(task.requirementValue) || 1)),
    isRepeatableDaily: Boolean(task.isRepeatableDaily),
    sortOrder: Number.isFinite(Number(task.sortOrder)) ? Number(task.sortOrder) : 99,
  };

  if (task.description && task.description.trim()) {
    payload.description = task.description.trim().slice(0, 500);
  }
  if (task.badgeText && task.badgeText.trim()) {
    payload.badgeText = task.badgeText.trim().slice(0, 60);
  }
  if (task.actionUrl && task.actionUrl.trim()) {
    payload.actionUrl = task.actionUrl.trim().slice(0, 500);
  }
  if (task.createdAt) {
    payload.createdAt = task.createdAt;
  }
  if (task.updatedAt) {
    payload.updatedAt = task.updatedAt;
  }
  return payload;
}

