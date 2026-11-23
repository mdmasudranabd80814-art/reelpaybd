// Browser Vibration API utility for tactile haptic feedback on core user actions

const HAPTICS_STORAGE_KEY = 'rt_haptics_enabled';

export function isHapticsEnabled(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    const stored = window.localStorage.getItem(HAPTICS_STORAGE_KEY);
    return stored === null ? true : stored !== 'false';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(HAPTICS_STORAGE_KEY, String(enabled));
    }
  } catch {
    // Ignore storage failures
  }
}

export function isVibrationSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
}

export function triggerVibration(pattern: number | number[]): boolean {
  if (!isHapticsEnabled() || !isVibrationSupported()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    // Silent fallback if browser restricts vibration (e.g. unsupported device or iframe policy)
    return false;
  }
}

/** Subtle 10ms tap for navigation tabs, category pills, bookmarking, copying links, and sharing */
export function vibrateLight(): void {
  triggerVibration(10);
}

/** Heartbeat double-pulse when liking a reel/comment/live; soft tap when unliking */
export function vibrateLike(isLiking = true): void {
  if (isLiking) {
    triggerVibration([15, 35, 25]);
  } else {
    triggerVibration(8);
  }
}

/** Celebratory ascending triple-pulse when claiming rewards, bonuses, scratch cards, or spin prizes */
export function vibrateReward(): void {
  triggerVibration([20, 40, 35, 40, 60]);
}

/** Festive rhythmic pulse when sending a gift to a creator or live host */
export function vibrateGift(): void {
  triggerVibration([25, 35, 45, 35, 30]);
}

/** Crisp double confirmation pulse for publishing, following, commenting, or submitting requests */
export function vibrateSuccess(): void {
  triggerVibration([16, 36, 24]);
}

/** Distinct double-buzz warning for blocked/invalid actions (insufficient points, daily limit, self-gift) */
export function vibrateError(): void {
  triggerVibration([40, 45, 40]);
}
