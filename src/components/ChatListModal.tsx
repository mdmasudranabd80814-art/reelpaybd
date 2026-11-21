import React, { useState, useEffect } from 'react';
import { X, Search, MessageCircle, ChevronRight, Loader2, MessageSquareOff } from 'lucide-react';
import { ChatSession, User } from '../types';
import { useFirebase } from '../hooks/useFirebase';
import { where } from 'firebase/firestore';

interface ChatListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onOpenChat: (otherUser: User) => void;
  onOpenUserPicker?: () => void;
  lang: 'bn' | 'en';
}

export const ChatListModal: React.FC<ChatListModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onOpenChat,
  onOpenUserPicker,
  lang,
}) => {
  const { user: firebaseUser, onSnapshot, getDocument } = useFirebase();
  const [sessions, setChatSessions] = useState<ChatSession[]>([]);
  const [extraProfiles, setExtraProfiles] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen || !firebaseUser || !firebaseUser.emailVerified) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Query only sessions where currentUser.id is a participant (enforced by Firestore rules)
    const unsub = onSnapshot('chats', (data) => {
      const mySessions = (data as ChatSession[]).filter(s => Array.isArray(s.participants) && s.participants.includes(currentUser.id));
      setChatSessions(mySessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      setLoading(false);
    }, [where('participants', 'array-contains', currentUser.id)]);

    return unsub;
  }, [isOpen, currentUser.id, firebaseUser]);

  useEffect(() => {
    if (!isOpen || sessions.length === 0) return;
    let cancelled = false;
    const missingIds = Array.from(
      new Set(
        sessions
          .map((s) => s.participants.find((id) => id !== currentUser.id))
          .filter((id): id is string => Boolean(id && !users.some((u) => u.id === id) && !extraProfiles[id]))
      )
    );
    if (missingIds.length === 0) return;

    Promise.all(
      missingIds.slice(0, 20).map(async (uid) => {
        try {
          const prof = (await getDocument('public_profiles', uid)) as User | null;
          return prof ? [uid, prof] : null;
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const next: Record<string, User> = {};
      entries.forEach((entry) => {
        if (entry) next[entry[0] as string] = entry[1] as User;
      });
      if (Object.keys(next).length > 0) {
        setExtraProfiles((prev) => ({ ...prev, ...next }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, sessions, currentUser.id, users, getDocument]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full sm:h-[600px] bg-[#0a120e] border sm:border-emerald-900/60 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-emerald-950/60 bg-[#0d1811]">
          <h3 className="font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <span>{lang === 'bn' ? 'আমার মেসেজ' : 'My Messages'}</span>
          </h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={onOpenUserPicker}
              className="p-2 bg-emerald-500/10 text-emerald-400 rounded-full hover:bg-emerald-500/20 transition"
              title={lang === 'bn' ? 'নতুন মেসেজ' : 'New Message'}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-emerald-950/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'বন্ধু খুঁজুন...' : 'Search friends...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070d0a] border border-emerald-950 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                {lang === 'bn' ? 'মেসেজ লোড হচ্ছে...' : 'Loading Messages...'}
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-950 to-emerald-900/40 rounded-3xl flex items-center justify-center mb-4 border border-emerald-500/30 shadow-xl animate-[bounce_3s_ease-in-out_infinite]">
                <MessageCircle className="w-10 h-10 text-emerald-400 animate-pulse" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center animate-ping">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-amber-400/20 rounded-full animate-bounce" />
              </div>
              <h4 className="text-sm font-black text-white mb-1 tracking-wide">
                {lang === 'bn' ? 'কোনো মেসেজ নেই' : 'No Messages Yet'}
              </h4>
              <p className="text-[11px] text-neutral-400 max-w-[220px] leading-relaxed">
                {lang === 'bn' 
                  ? 'কাউকে মেসেজ পাঠাতে তার প্রোফাইলে যান এবং চ্যাট বাটনে ক্লিক করুন।' 
                  : 'To start a conversation, visit any creator profile and tap the message button.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => {
                const otherUserId = session.participants.find(id => id !== currentUser.id);
                let otherUser = users.find(u => u.id === otherUserId) || (otherUserId ? extraProfiles[otherUserId] : undefined);
                
                if (!otherUser) {
                  const isAdminUser = otherUserId === 'admin' || otherUserId?.includes('admin');
                  otherUser = {
                    id: otherUserId || 'admin',
                    name: isAdminUser ? (lang === 'bn' ? '👑 ReelPay এডমিন (অফিসিয়াল)' : '👑 ReelPay Admin') : (lang === 'bn' ? 'ব্যবহারকারী' : 'User'),
                    phone: isAdminUser ? 'অফিসিয়াল সাপোর্ট' : '',
                    email: '',
                    avatar: isAdminUser ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                    points: 0,
                    role: isAdminUser ? 'admin' : 'user',
                    createdAt: '2026-01-01',
                    referralCode: 'ADMIN',
                    isVerified: true,
                    totalWithdrawn: 0,
                    reelsWatchedCount: 0,
                  };
                }

                if (searchTerm.trim() && !(otherUser.name || '').toLowerCase().includes(searchTerm.trim().toLowerCase())) {
                  return null;
                }

                const isAdminPartner = otherUser.role === 'admin' || otherUserId === 'admin';

                return (
                  <button
                    key={session.id}
                    onClick={() => onOpenChat(otherUser!)}
                    className="w-full p-3 rounded-2xl hover:bg-emerald-900/10 flex items-center gap-3 transition group text-left border border-transparent hover:border-emerald-900/20"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-emerald-900/60 group-hover:border-emerald-500/40 transition"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a120e]" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <p className="text-sm font-black text-white truncate group-hover:text-emerald-400 transition">
                            {otherUser.name}
                          </p>
                          {isAdminPartner && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold shrink-0">
                              {lang === 'bn' ? 'এডমিন' : 'Admin'}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-neutral-600 font-medium shrink-0 ml-1">
                          {session.lastMessageTime ? new Date(session.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate font-medium">
                        {session.lastMessage || (lang === 'bn' ? 'মেসেজ নেই' : 'No messages')}
                      </p>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-neutral-800 group-hover:text-emerald-500 transition" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
