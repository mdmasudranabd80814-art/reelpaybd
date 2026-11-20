import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Check,
  MessageCircle,
  Search,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { limit } from 'firebase/firestore';
import { User } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { getUserLevel } from '../utils/levels';
import { useFirebase } from '../hooks/useFirebase';
import { INITIAL_USERS_LIST } from '../data/initialData';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User;
  currentUser: User;
  initialTab: 'followers' | 'following';
  knownUsers: User[];
  isAuthenticated: boolean;
  onToggleFollow: (userId: string, name?: string) => void;
  onOpenProfile: (userId: string) => void;
  onOpenChat: (user: User) => void;
  lang: 'bn' | 'en';
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  initialTab,
  knownUsers,
  isAuthenticated,
  onToggleFollow,
  onOpenProfile,
  onOpenChat,
  lang,
}) => {
  const { getCollection, getDocument } = useFirebase();
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'discover'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadedUsersMap, setLoadedUsersMap] = useState<Record<string, User>>({});
  const [discoverUsers, setDiscoverUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchTerm('');
    }
  }, [isOpen, initialTab, targetUser.id]);

  // Load follower/following profiles + discoverable creators from Firestore when opened
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadProfiles = async () => {
      setLoading(true);
      const nextMap: Record<string, User> = {};

      for (const u of [...INITIAL_USERS_LIST, ...knownUsers, currentUser, targetUser]) {
        if (u && u.id) {
          nextMap[u.id] = u;
        }
      }

      if (isAuthenticated) {
        try {
          const remoteList = (await getCollection('public_profiles', [limit(50)])) as User[];
          if (!cancelled && Array.isArray(remoteList)) {
            remoteList.forEach((u) => {
              if (u && u.id) nextMap[u.id] = u;
            });
            setDiscoverUsers(remoteList.filter((u) => u.id && u.id !== currentUser.id));
          }
        } catch (err) {
          console.warn('Could not load directory users:', err);
        }

        // Fetch any specific follower/following IDs not yet in map
        const neededIds = Array.from(
          new Set([...(targetUser.followers || []), ...(targetUser.following || [])])
        ).filter((id) => id && !nextMap[id]);

        if (neededIds.length > 0) {
          await Promise.all(
            neededIds.slice(0, 20).map(async (uid) => {
              try {
                const doc = (await getDocument('public_profiles', uid)) as User | null;
                if (doc && doc.id) nextMap[doc.id] = doc;
              } catch {
                // ignore missing profile
              }
            })
          );
        }
      } else {
        setDiscoverUsers(INITIAL_USERS_LIST.filter((u) => u.id !== currentUser.id));
      }

      if (!cancelled) {
        setLoadedUsersMap(nextMap);
        setLoading(false);
      }
    };

    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [isOpen, targetUser.id, isAuthenticated]);

  const followerIds = targetUser.followers || [];
  const followingIds = targetUser.following || [];
  const myFollowingIds = currentUser.following || [];

  const resolvedList = useMemo(() => {
    const ids = activeTab === 'followers' ? followerIds : activeTab === 'following' ? followingIds : [];
    let list: User[] = [];

    if (activeTab === 'discover') {
      const pool = discoverUsers.length > 0 ? discoverUsers : INITIAL_USERS_LIST;
      const seen = new Set<string>();
      list = pool.filter((u) => {
        if (!u.id || u.id === currentUser.id || seen.has(u.id)) return false;
        seen.add(u.id);
        return true;
      });
    } else {
      list = ids.map((id) => {
        if (loadedUsersMap[id]) return loadedUsersMap[id];
        return {
          id,
          name: lang === 'bn' ? 'রিয়েলপে ইউজার' : 'ReelPay User',
          phone: '',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          points: 0,
          role: 'user',
          createdAt: '',
          referralCode: '',
          totalWithdrawn: 0,
          reelsWatchedCount: 0,
        } as User;
      });
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
    );
  }, [activeTab, followerIds, followingIds, loadedUsersMap, discoverUsers, currentUser.id, searchTerm, lang]);

  if (!isOpen) return null;

  const followersDisplayCount = Math.max(targetUser.followersCount || 0, followerIds.length);
  const followingDisplayCount = Math.max(targetUser.followingCount || 0, followingIds.length);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0f1913] border-t sm:border border-emerald-900/70 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[86vh] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-emerald-950 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white truncate">{targetUser.name}</h3>
            <p className="text-[11px] text-neutral-400">
              {lang === 'bn' ? 'নেটওয়ার্ক ও কানেকশন' : 'Network & Connections'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-[#0a110d] border-b border-emerald-950">
          <button
            type="button"
            onClick={() => setActiveTab('followers')}
            className={`min-h-[40px] rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'followers'
                ? 'bg-[#00c853] text-black shadow'
                : 'text-neutral-300 hover:bg-white/5'
            }`}
          >
            {lang === 'bn'
              ? `ফলোয়ার (${toBengaliNumber(followersDisplayCount, lang)})`
              : `Followers (${followersDisplayCount})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`min-h-[40px] rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'following'
                ? 'bg-[#00c853] text-black shadow'
                : 'text-neutral-300 hover:bg-white/5'
            }`}
          >
            {lang === 'bn'
              ? `ফলোয়িং (${toBengaliNumber(followingDisplayCount, lang)})`
              : `Following (${followingDisplayCount})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`min-h-[40px] rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-neutral-300 hover:bg-white/5'
            }`}
          >
            {lang === 'bn' ? 'ক্রিয়েটর খুঁজুন' : 'Discover'}
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-emerald-950/60">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'bn' ? 'নাম দিয়ে খুঁজুন...' : 'Search by name...'}
              className="w-full min-h-[40px] bg-[#0a120e] border border-emerald-950 rounded-xl pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {loading && resolvedList.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-neutral-400 text-xs">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <span>{lang === 'bn' ? 'তালিকা লোড হচ্ছে...' : 'Loading list...'}</span>
            </div>
          ) : resolvedList.length === 0 ? (
            <div className="py-10 text-center space-y-3 bg-[#0a120e] rounded-2xl border border-emerald-950/70 p-4">
              <Users className="w-9 h-9 text-neutral-600 mx-auto" />
              <p className="text-xs text-neutral-400">
                {activeTab === 'followers'
                  ? lang === 'bn'
                    ? 'এখনো কোনো ফলোয়ার তালিকায় যুক্ত হয়নি।'
                    : 'No followers found yet.'
                  : activeTab === 'following'
                  ? lang === 'bn'
                    ? 'আপনি এখনো কাউকে ফলো করেননি।'
                    : 'Not following anyone yet.'
                  : lang === 'bn'
                  ? 'কোনো ক্রিয়েটর পাওয়া যায়নি।'
                  : 'No creators found.'}
              </p>
              {activeTab !== 'discover' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('discover')}
                  className="min-h-[40px] px-4 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black text-xs font-extrabold cursor-pointer"
                >
                  {lang === 'bn' ? 'ক্রিয়েটর খুঁজুন ও ফলো করুন' : 'Discover Creators'}
                </button>
              )}
            </div>
          ) : (
            resolvedList.map((u) => {
              const lvl = getUserLevel(u.reelsWatchedCount || 0);
              const isSelf = u.id === currentUser.id;
              const isFollowing = myFollowingIds.includes(u.id);

              return (
                <div
                  key={u.id}
                  className="p-2.5 rounded-2xl bg-[#0b140f] border border-emerald-950/80 flex items-center justify-between gap-2.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfile(u.id);
                    }}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-11 h-11 rounded-2xl object-cover border border-emerald-800/70 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">{u.name}</span>
                        {u.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {lvl.badge} {lang === 'bn' ? lvl.nameBn : lvl.nameEn}
                        {u.followersCount ? ` · ${toBengaliNumber(u.followersCount, lang)} ${lang === 'bn' ? 'ফলোয়ার' : 'followers'}` : ''}
                      </p>
                    </div>
                  </button>

                  {!isSelf && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleFollow(u.id, u.name)}
                        className={`min-h-[38px] px-3 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 ${
                          isFollowing
                            ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                            : 'bg-[#00c853] hover:bg-[#00e676] text-black'
                        }`}
                      >
                        {isFollowing ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                        <span>
                          {isFollowing
                            ? lang === 'bn'
                              ? 'ফলোয়িং'
                              : 'Following'
                            : lang === 'bn'
                            ? 'ফলো'
                            : 'Follow'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenChat(u);
                        }}
                        className="min-w-[38px] min-h-[38px] rounded-xl bg-[#16251d] hover:bg-[#1f3328] text-emerald-300 border border-emerald-900/60 flex items-center justify-center cursor-pointer"
                        title={lang === 'bn' ? 'মেসেজ পাঠান' : 'Message'}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
