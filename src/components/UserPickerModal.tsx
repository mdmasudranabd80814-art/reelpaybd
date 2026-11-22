import React, { useState } from 'react';
import { X, Search, User as UserIcon, Send } from 'lucide-react';
import { User } from '../types';

interface UserPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onPickUser: (user: User) => void;
  lang: 'bn' | 'en';
  currentUser: User;
}

const DEMO_USER_IDS = new Set([
  'usr_bd_01',
  'system_admin',
  'creator_sakib',
  'creator_russell',
  'creator_tanjila',
  'user_001',
  'user_002',
  'user_003',
  'user_004',
  'user_005',
  'user_006',
  'user_7788',
]);

export const UserPickerModal: React.FC<UserPickerModalProps> = ({
  isOpen,
  onClose,
  users,
  onPickUser,
  lang,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      !u.id.startsWith('GUEST-') &&
      !DEMO_USER_IDS.has(u.id) &&
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0a120e] border border-emerald-900/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-emerald-950 flex justify-between items-center bg-[#0d1811]">
          <h3 className="font-bold text-white">
            {lang === 'bn' ? 'কাকে পাঠাতে চান?' : 'Send to...'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'নাম দিয়ে খুঁজুন...' : 'Search by name...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070d0a] border border-emerald-950 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => onPickUser(user)}
              className="w-full p-3 rounded-2xl hover:bg-emerald-900/10 flex items-center gap-3 transition group text-left"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-xl object-cover border border-emerald-900/60"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{user.name}</p>
                <p className="text-[10px] text-neutral-500 truncate">@{user.name.toLowerCase().replace(/\s/g, '_')}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <Send className="w-3.5 h-3.5 fill-current" />
              </div>
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-neutral-600 italic text-xs">
              {lang === 'bn' ? 'কোনো ইউজার পাওয়া যায়নি' : 'No users found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
