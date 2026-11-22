import { Reel, User } from '../types';

export const buildCreatorHandle = (name?: string, fallbackPhone?: string): string => {
  const cleanedName = (name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  if (cleanedName) return cleanedName.slice(0, 32);

  const cleanedPhone = (fallbackPhone || '').replace(/[^0-9a-zA-Z]/g, '');
  if (cleanedPhone) return cleanedPhone.slice(0, 20);

  return 'creator';
};

export const buildUserMap = (users: User[], currentUser?: User | null): Map<string, User> => {
  const map = new Map<string, User>();
  for (const u of users) {
    if (u && u.id) {
      map.set(u.id, u);
    }
  }
  if (currentUser && currentUser.id && !currentUser.id.startsWith('GUEST-')) {
    const existing = map.get(currentUser.id);
    map.set(currentUser.id, existing ? { ...existing, ...currentUser } : currentUser);
  }
  return map;
};

export const resolveReelWithOwner = (reel: Reel, userMap: Map<string, User>): Reel => {
  if (!reel.userId) return reel;
  const owner = userMap.get(reel.userId);
  if (!owner) return reel;

  const ownerName = owner.name?.trim();
  const hasValidOwnerName = Boolean(ownerName && ownerName !== 'অতিথি ইউজার');

  const nextCreatorName = hasValidOwnerName ? ownerName! : reel.creatorName;
  const nextCreatorAvatar = owner.avatar || reel.creatorAvatar;
  const nextIsVerified = Boolean(owner.isVerified || reel.isVerified);

  if (
    nextCreatorName === reel.creatorName &&
    nextCreatorAvatar === reel.creatorAvatar &&
    nextIsVerified === Boolean(reel.isVerified)
  ) {
    return reel;
  }

  return {
    ...reel,
    creatorName: nextCreatorName,
    creatorAvatar: nextCreatorAvatar,
    isVerified: nextIsVerified,
  };
};
