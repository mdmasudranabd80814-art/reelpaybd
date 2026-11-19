/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Level {
  level: number;
  nameBn: string;
  nameEn: string;
  badge: string;
  minWatched: number;
  multiplier: number;
  color: string;
}

export const LEVELS: Level[] = [
  {
    level: 1,
    nameBn: 'নতুন সদস্য',
    nameEn: 'Beginner',
    badge: '🌱',
    minWatched: 0,
    multiplier: 1.0,
    color: 'emerald',
  },
  {
    level: 2,
    nameBn: 'ব্রোঞ্জ মেম্বার',
    nameEn: 'Bronze Member',
    badge: '🥉',
    minWatched: 10,
    multiplier: 1.1,
    color: 'orange',
  },
  {
    level: 3,
    nameBn: 'সিলভার মেম্বার',
    nameEn: 'Silver Member',
    badge: '🥈',
    minWatched: 50,
    multiplier: 1.25,
    color: 'slate',
  },
  {
    level: 4,
    nameBn: 'গোল্ড মেম্বার',
    nameEn: 'Gold Member',
    badge: '🥇',
    minWatched: 150,
    multiplier: 1.5,
    color: 'amber',
  },
  {
    level: 5,
    nameBn: 'প্লাটিনাম মেম্বার',
    nameEn: 'Platinum Member',
    badge: '💎',
    minWatched: 400,
    multiplier: 2.0,
    color: 'cyan',
  },
  {
    level: 6,
    nameBn: 'ডায়মন্ড মেম্বার',
    nameEn: 'Diamond Member',
    badge: '👑',
    minWatched: 1000,
    multiplier: 3.0,
    color: 'purple',
  },
];

export function getUserLevel(watchedCount: number): Level {
  let userLevel = LEVELS[0];
  for (const lvl of LEVELS) {
    if (watchedCount >= lvl.minWatched) {
      userLevel = lvl;
    } else {
      break;
    }
  }
  return userLevel;
}

export function getNextLevel(watchedCount: number): Level | null {
  const current = getUserLevel(watchedCount);
  const nextIndex = LEVELS.findIndex(l => l.level === current.level) + 1;
  return nextIndex < LEVELS.length ? LEVELS[nextIndex] : null;
}

export function getProgressToNextLevel(watchedCount: number): number {
  const current = getUserLevel(watchedCount);
  const next = getNextLevel(watchedCount);
  
  if (!next) return 100;
  
  const range = next.minWatched - current.minWatched;
  const progress = watchedCount - current.minWatched;
  return Math.min(100, Math.max(0, (progress / range) * 100));
}
