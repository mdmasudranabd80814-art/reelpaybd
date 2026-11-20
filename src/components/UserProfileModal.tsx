import React from 'react';
import { X, MessageCircle, Video, ShieldCheck, Check, UserPlus, Users, Lock } from 'lucide-react';
import { User, Reel } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { getUserLevel } from '../utils/levels';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onOpenChat: (user: User) => void;
  onOpenChatList?: () => void;
  lang: 'bn' | 'en';
  currentUser: User;
  allReels: Reel[];
  onOpenReel: (reel: Reel) => void;
  onToggleFollow?: (userId: string, creatorName?: string) => void;
  isFollowing?: boolean;
  onOpenFollowList?: (tab: 'followers' | 'following') => void;
  isDirectChatEnabled?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onOpenChat,
  onOpenChatList,
  lang,
  currentUser,
  allReels,
  onOpenReel,
  onToggleFollow,
  isFollowing = false,
  onOpenFollowList,
  isDirectChatEnabled = true,
}) => {
  const currentLevel = getUserLevel(user.reelsWatchedCount || 0);
  const userReels = allReels.filter(r => r.userId === user.id);
  const isSelf = currentUser.id === user.id;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0a120e] border border-emerald-900/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex justify-between items-center p-4 border-b border-emerald-950/60">
          <h3 className="font-bold text-white">
            {lang === 'bn' ? 'ইউজার প্রোফাইল' : 'User Profile'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Cover / Avatar Section */}
          <div className="relative h-32 bg-gradient-to-br from-emerald-900/40 to-black" />
          
          <div className="px-6 -mt-12 mb-4 text-center">
            <div className="relative inline-block">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-[#0a120e] shadow-2xl mx-auto"
              />
              {user.isVerified && (
                <span className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 text-black rounded-full flex items-center justify-center border-2 border-[#0a120e] shadow-lg">
                  <Check className="w-3.5 h-3.5 stroke-[4]" />
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-black text-white">{user.name}</h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {lang === 'bn' ? 'যুক্ত হয়েছেন: ' : 'Joined: '} {user.createdAt?.split('T')[0] || 'N/A'}
              </p>

              <div className="mt-3 flex justify-center gap-2">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold bg-opacity-20 flex items-center gap-1.5 border ${
                  currentLevel.level >= 4 ? 'bg-amber-500 text-amber-300 border-amber-500/30' : 'bg-emerald-500 text-emerald-300 border-emerald-500/30'
                }`}>
                  <span className="text-sm">{currentLevel.badge}</span>
                  <span>{lang === 'bn' ? currentLevel.nameBn : currentLevel.nameEn}</span>
                </span>
              </div>
            </div>

            {/* Actions: Follow and Message Buttons */}
            <div className="mt-5 flex gap-2.5 justify-center max-w-xs mx-auto">
              {!isSelf && onToggleFollow && (
                <button
                  onClick={() => onToggleFollow(user.id, user.name)}
                  className={`flex-1 py-3 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer ${
                    isFollowing
                      ? 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
                      : 'bg-gradient-to-r from-[#00e676] to-[#00c853] hover:from-[#00ff88] hover:to-[#00e676] text-black ring-2 ring-emerald-400/60 shadow-emerald-500/30 animate-pulse'
                  }`}
                >
                  {isFollowing ? <Check className="w-4 h-4 stroke-[3]" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isFollowing ? (lang === 'bn' ? '✓ ফলোয়িং' : '✓ Following') : (lang === 'bn' ? '+ ফলো করুন' : '+ Follow')}</span>
                </button>
              )}

              <button
                type="button"
                disabled={!isDirectChatEnabled}
                onClick={() => {
                  if (!isDirectChatEnabled) return;
                  if (!isSelf) {
                    onOpenChat(user);
                  } else if (onOpenChatList) {
                    onClose();
                    onOpenChatList();
                  } else {
                    onClose();
                  }
                }}
                className={`py-3 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition ${
                  !isSelf ? 'flex-1' : 'w-full'
                } ${
                  isDirectChatEnabled
                    ? 'bg-[#132219] hover:bg-[#1a2f22] text-emerald-400 border border-emerald-500/40 active:scale-95 cursor-pointer'
                    : 'bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed'
                }`}
              >
                {isDirectChatEnabled ? <MessageCircle className="w-4 h-4 fill-current" /> : <Lock className="w-4 h-4" />}
                <span>
                  {!isDirectChatEnabled
                    ? (lang === 'bn' ? 'চ্যাট বন্ধ রয়েছে' : 'Chat Paused')
                    : !isSelf
                    ? (lang === 'bn' ? 'মেসেজ পাঠান' : 'Send Message')
                    : (lang === 'bn' ? 'আমার ইনবক্স' : 'My Inbox')}
                </span>
              </button>
            </div>
          </div>

          {/* Stats: 4 Cards (Followers, Following, Videos, Points) */}
          <div className="grid grid-cols-4 gap-2 px-4 mb-6">
            <button
              type="button"
              onClick={() => onOpenFollowList?.('followers')}
              className="bg-[#122419] hover:bg-[#183122] border border-emerald-950/60 hover:border-emerald-600/50 rounded-2xl p-2.5 text-center transition cursor-pointer active:scale-95"
            >
              <div className="text-emerald-400 mb-1 flex justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-base font-black text-white">{toBengaliNumber(user.followersCount || 0, lang)}</div>
              <div className="text-[9px] text-neutral-400">{lang === 'bn' ? 'ফলোয়ার' : 'Followers'}</div>
            </button>

            <button
              type="button"
              onClick={() => onOpenFollowList?.('following')}
              className="bg-[#122419] hover:bg-[#183122] border border-emerald-950/60 hover:border-cyan-600/50 rounded-2xl p-2.5 text-center transition cursor-pointer active:scale-95"
            >
              <div className="text-cyan-400 mb-1 flex justify-center">
                <UserPlus className="w-3.5 h-3.5" />
              </div>
              <div className="text-base font-black text-white">{toBengaliNumber(user.followingCount || 0, lang)}</div>
              <div className="text-[9px] text-neutral-400">{lang === 'bn' ? 'ফলোয়িং' : 'Following'}</div>
            </button>

            <div className="bg-[#122419] border border-emerald-950/60 rounded-2xl p-2.5 text-center">
              <div className="text-amber-400 mb-1 flex justify-center">
                <Video className="w-3.5 h-3.5" />
              </div>
              <div className="text-base font-black text-white">{toBengaliNumber(userReels.length, lang)}</div>
              <div className="text-[9px] text-neutral-400">{lang === 'bn' ? 'ভিডিও' : 'Videos'}</div>
            </div>

            <div className="bg-[#122419] border border-emerald-950/60 rounded-2xl p-2.5 text-center">
              <div className="text-yellow-400 mb-1 flex justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-base font-black text-white">{toBengaliNumber(user.points || 0, lang)}</div>
              <div className="text-[9px] text-neutral-400">{lang === 'bn' ? 'পয়েন্ট' : 'Points'}</div>
            </div>
          </div>

          {/* User's Reels Grid */}
          <div className="px-6 pb-6">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
              {lang === 'bn' ? 'ভিডিও গ্যালারি' : 'Video Gallery'}
            </h4>
            {userReels.length === 0 ? (
              <div className="py-8 text-center bg-black/20 rounded-2xl border border-dashed border-emerald-900/30">
                <p className="text-xs text-neutral-600 italic">
                  {lang === 'bn' ? 'কোনো ভিডিও নেই' : 'No videos found'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {userReels.map(reel => (
                  <div 
                    key={reel.id}
                    onClick={() => onOpenReel(reel)}
                    className="aspect-[3/4] rounded-xl overflow-hidden bg-neutral-900 relative cursor-pointer group"
                  >
                    <img 
                      src={reel.thumbnailUrl} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300" 
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
