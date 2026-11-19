import { EarningSettings } from '../types';

export interface GiftSplitResult {
  hostPct: number;
  adminPct: number;
  cashbackPct: number;
  creatorShare: number;
  adminShare: number;
  userCashback: number;
}

export function calculateGiftSplit(
  costPoints: number,
  settings?: Partial<EarningSettings> | null
): GiftSplitResult {
  const rawHost = Math.max(0, Math.min(100, Number(settings?.giftHostPercent ?? 60)));
  const rawAdmin = Math.max(0, Math.min(100, Number(settings?.giftAdminPercent ?? 20)));
  const rawCashback = Math.max(0, Math.min(100, Number(settings?.giftCashbackPercent ?? 20)));

  const sum = rawHost + rawAdmin + rawCashback;
  let hostPct = rawHost;
  let adminPct = rawAdmin;
  let cashbackPct = rawCashback;

  if (sum > 100 && sum > 0) {
    hostPct = Math.round((rawHost / sum) * 100);
    adminPct = Math.round((rawAdmin / sum) * 100);
    cashbackPct = Math.max(0, 100 - hostPct - adminPct);
  }

  const creatorShare = Math.round((costPoints * hostPct) / 100);
  const adminShare = Math.round((costPoints * adminPct) / 100);
  const userCashback = Math.round((costPoints * cashbackPct) / 100);

  return {
    hostPct,
    adminPct,
    cashbackPct,
    creatorShare,
    adminShare,
    userCashback,
  };
}
