import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Image, Film, ShieldAlert, Loader2, Check, CheckCheck } from 'lucide-react';
import { ChatSession, ChatMessage, User, Reel } from '../types';
import { useFirebase } from '../hooks/useFirebase';
import { orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { toBengaliNumber } from '../utils/bengali';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  currentUser: User;
  otherUser: User;
  lang: 'bn' | 'en';
  onShareReel?: (reel: Reel) => void;
  allReels: Reel[];
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  session,
  currentUser,
  otherUser,
  lang,
  allReels,
}) => {
  const { user: firebaseUser, onSnapshot, addDocument, updateDocument } = useFirebase();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync Messages (only when Firebase-authenticated)
  useEffect(() => {
    if (!isOpen || !session.id || !firebaseUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(`chats/${session.id}/messages`, (data) => {
      setMessages((data as ChatMessage[]).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      setLoading(false);
    }, [orderBy('createdAt', 'desc'), limit(100)]);
    return unsub;
  }, [isOpen, session.id, firebaseUser]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !session.id || !firebaseUser) return;

    const msgText = inputText.trim();
    setInputText('');

    const newMsg: Partial<ChatMessage> = {
      sessionId: session.id,
      senderId: currentUser.id,
      text: msgText,
      createdAt: new Date().toISOString(),
      isHidden: false,
    };

    try {
      await addDocument(`chats/${session.id}/messages`, newMsg);
      // Update session last message
      await updateDocument('chats', session.id, {
        lastMessage: msgText,
        lastMessageTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSendImage = async () => {
    // In a real app, this would open a picker. For now, we simulate a prompt
    const url = prompt(lang === 'bn' ? 'ছবির লিঙ্ক দিন:' : 'Enter image URL:');
    if (url && session.id) {
      const newMsg: Partial<ChatMessage> = {
        sessionId: session.id,
        senderId: currentUser.id,
        text: lang === 'bn' ? 'ছবি পাঠিয়েছেন' : 'Sent an image',
        imageUrl: url,
        createdAt: new Date().toISOString(),
        isHidden: false,
      };
      await addDocument(`chats/${session.id}/messages`, newMsg);
      await updateDocument('chats', session.id, {
        lastMessage: '📷 ' + (lang === 'bn' ? 'ছবি' : 'Image'),
        lastMessageTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full sm:h-[600px] bg-[#0a120e] border sm:border-emerald-900/60 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-emerald-950/60 bg-[#0d1811]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={otherUser.avatar} className="w-10 h-10 rounded-2xl object-cover border border-emerald-500/30" alt="" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d1811]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">{otherUser.name}</h3>
                {(otherUser.role === 'admin' || otherUser.id === 'admin') && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-bold">
                    {lang === 'bn' ? 'অফিসিয়াল এডমিন' : 'Official Admin'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">Online</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-repeat"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/10">
                <MessageCircle className="w-8 h-8 text-emerald-500/50" />
              </div>
              <p className="text-xs text-neutral-500">
                {lang === 'bn' ? 'এখনই চ্যাট শুরু করুন!' : 'Start your conversation now!'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              if (msg.isHidden && !isMine) return null; // Admins hide messages

              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-1`}
                >
                  <div className={`max-w-[80%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {msg.isHidden && (
                      <span className="text-[9px] text-rose-500 mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        {lang === 'bn' ? 'এই মেসেজটি হাইড করা হয়েছে' : 'This message is hidden'}
                      </span>
                    )}
                    
                    <div className={`
                      p-3 rounded-2xl text-xs relative group
                      ${isMine 
                        ? 'bg-[#00c853] text-black font-medium rounded-tr-none' 
                        : 'bg-[#1a2b22] text-white rounded-tl-none border border-emerald-900/40'
                      }
                      ${msg.isHidden ? 'opacity-40 grayscale' : ''}
                    `}>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} className="w-full rounded-xl mb-2 border border-black/10 shadow-sm" alt="" />
                      )}
                      
                      {msg.sharedReelId && (
                        <div className="mb-2 p-2 rounded-xl bg-black/20 border border-white/10 flex items-center gap-2">
                          <img src={msg.sharedReelThumbnail} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-inherit truncate">রিল শেয়ার করেছেন</p>
                            <div className="flex items-center gap-1 text-[9px] opacity-70">
                              <Film className="w-2.5 h-2.5" />
                              <span>দেখুন</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      
                      <div className={`text-[8px] mt-1 flex items-center gap-1 ${isMine ? 'text-black/50' : 'text-neutral-500'}`}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#0d1811] border-t border-emerald-950/60">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleSendImage}
              className="p-2 rounded-xl hover:bg-neutral-800 text-emerald-400 transition"
            >
              <Image className="w-5 h-5" />
            </button>
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={lang === 'bn' ? 'বার্তা লিখুন...' : 'Type a message...'}
              className="flex-1 bg-[#070d0a] border border-emerald-950 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-[#00c853] hover:bg-[#00e676] text-black disabled:opacity-50 disabled:grayscale transition shadow-lg shadow-emerald-500/20"
            >
              <Send className="w-5 h-5 fill-current" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import { MessageCircle } from 'lucide-react';
