import { Reel, User } from '../types';

export const MASUD_RANA_FALLBACK_ID = 'masud_rana';
export const MASUD_RANA_NAME = 'মাসুদ রানা';
export const MASUD_RANA_HANDLE = '@masud_rana';
export const MASUD_RANA_AVATAR = '/images/masud_rana_avatar.jpg';
export const MASUD_RANA_EMAIL = 'mdmasudranabd80814@gmail.com';

export interface MasudRanaCreatorIdentity {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isVerified: boolean;
}

export const DEFAULT_MASUD_CREATOR: MasudRanaCreatorIdentity = {
  id: MASUD_RANA_FALLBACK_ID,
  name: MASUD_RANA_NAME,
  handle: MASUD_RANA_HANDLE,
  avatar: MASUD_RANA_AVATAR,
  isVerified: true,
};

export const resolveMasudRanaCreator = (
  users: User[],
  currentUser?: User | null,
  currentEmail?: string | null
): MasudRanaCreatorIdentity => {
  const normalizedEmail = (currentEmail || currentUser?.email || '').trim().toLowerCase();
  const isCurrentUserMasud = Boolean(
    currentUser &&
      currentUser.id &&
      !currentUser.id.startsWith('GUEST-') &&
      (normalizedEmail === MASUD_RANA_EMAIL ||
        currentUser.role === 'admin' ||
        /masud|মাসুদ/i.test(currentUser.name || ''))
  );

  if (isCurrentUserMasud && currentUser) {
    return {
      id: currentUser.id,
      name: currentUser.name?.trim() || MASUD_RANA_NAME,
      handle: MASUD_RANA_HANDLE,
      avatar: currentUser.avatar || MASUD_RANA_AVATAR,
      isVerified: true,
    };
  }

  const matchedUser = users.find(
    (u) =>
      u &&
      u.id &&
      !u.id.startsWith('GUEST-') &&
      (u.role === 'admin' || /masud|মাসুদ/i.test(u.name || ''))
  );

  if (matchedUser) {
    return {
      id: matchedUser.id,
      name: matchedUser.name?.trim() || MASUD_RANA_NAME,
      handle: MASUD_RANA_HANDLE,
      avatar: matchedUser.avatar || MASUD_RANA_AVATAR,
      isVerified: true,
    };
  }

  return DEFAULT_MASUD_CREATOR;
};

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

export const resolveReelWithOwner = (
  reel: Reel,
  userMap: Map<string, User>,
  masudCreator: MasudRanaCreatorIdentity = DEFAULT_MASUD_CREATOR
): Reel => {
  const isAllMasudMode = true;
  if (isAllMasudMode) {
    const owner = userMap.get(masudCreator.id);
    const nextUserId = masudCreator.id;
    const nextCreatorName = owner?.name?.trim() && owner.name.trim() !== 'অতিথি ইউজার'
      ? owner.name.trim()
      : masudCreator.name;
    const nextCreatorAvatar = owner?.avatar || masudCreator.avatar;
    const nextHandle = masudCreator.handle;

    if (
      reel.userId === nextUserId &&
      reel.creatorName === nextCreatorName &&
      reel.creatorAvatar === nextCreatorAvatar &&
      reel.creatorHandle === nextHandle &&
      Boolean(reel.isVerified)
    ) {
      return reel;
    }

    return {
      ...reel,
      userId: nextUserId,
      creatorName: nextCreatorName,
      creatorHandle: nextHandle,
      creatorAvatar: nextCreatorAvatar,
      isVerified: true,
    };
  }

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
