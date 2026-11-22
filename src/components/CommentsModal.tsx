import React, { useState, useEffect } from 'react';
import { X, Send, Heart, Lock } from 'lucide-react';
import { Reel, Comment, User } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { useFirebase } from '../hooks/useFirebase';
import { orderBy } from 'firebase/firestore';

interface CommentsModalProps {
  reel: Reel;
  currentUser: User;
  onClose: () => void;
  onAddComment: (reelId: string, text: string) => void;
  onOpenProfile?: (userId: string) => void;
  isCommentsEnabled?: boolean;
  likedCommentIds?: string[];
  onToggleCommentLike?: (reelId: string, commentId: string, willLike: boolean) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  reel,
  currentUser,
  onClose,
  onAddComment,
  onOpenProfile,
  isCommentsEnabled = true,
  likedCommentIds,
  onToggleCommentLike,
}) => {
  const [inputText, setInputText] = useState('');
  const [reelComments, setReelComments] = useState<Comment[]>([]);
  const { onSnapshot } = useFirebase();
  const activeLikedCommentIds = likedCommentIds ?? currentUser.likedCommentIds ?? [];

  useEffect(() => {
    const unsub = onSnapshot(`reels/${reel.id}/comments`, (data) => {
      setReelComments(data as Comment[]);
    }, [orderBy('createdAt', 'desc')]);
    return unsub;
  }, [reel.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onAddComment(reel.id, inputText.trim());
      setInputText('');
    }
  };

  const toggleCommentLike = (id: string) => {
    const willLike = !activeLikedCommentIds.includes(id);
    if (onToggleCommentLike) {
      onToggleCommentLike(reel.id, id, willLike);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'এখনো';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#111c16] border border-emerald-950 rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col text-white shadow-2xl animate-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="p-4 border-b border-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">মন্তব্যসমূহ</h3>
            <span className="text-xs text-neutral-400">
              ({toBengaliNumber(reelComments.length)})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {reelComments.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন!
            </div>
          ) : (
            reelComments.map((comment) => {
              const isLiked = activeLikedCommentIds.includes(comment.id);
              const likes = Math.max(0, comment.likes || 0);
              return (
                <div key={comment.id} className="flex gap-3 text-xs">
                  <div 
                    className="cursor-pointer group"
                    onClick={() => onOpenProfile && onOpenProfile(comment.userId)}
                  >
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-emerald-500/40 group-hover:border-emerald-400 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-bold text-slate-200 cursor-pointer hover:text-emerald-400 transition"
                        onClick={() => onOpenProfile && onOpenProfile(comment.userId)}
                      >
                        {comment.userName}
                      </span>
                      <span className="text-[10px] text-neutral-500">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-neutral-300 mt-0.5 leading-relaxed">{comment.text}</p>
                  </div>
                  <button
                    onClick={() => toggleCommentLike(comment.id)}
                    className="shrink-0 flex flex-col items-center gap-0.5 text-neutral-400 hover:text-rose-500"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isLiked ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span className="text-[10px]">{toBengaliNumber(likes)}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input */}
        {isCommentsEnabled ? (
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-emerald-950 bg-[#0d1611] flex items-center gap-2"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-emerald-500"
            />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="একটি সুন্দর মন্তব্য লিখুন..."
              className="flex-1 bg-[#15231c] border border-emerald-900/60 rounded-full px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-full bg-[#00c853] hover:bg-[#00e676] disabled:bg-neutral-800 disabled:text-neutral-500 text-black transition"
            >
              <Send className="w-3.5 h-3.5 fill-current" />
            </button>
          </form>
        ) : (
          <div className="p-3.5 border-t border-emerald-950 bg-[#0d1611] text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>এডমিন কর্তৃক মন্তব্য করা সাময়িকভাবে বন্ধ রাখা হয়েছে।</span>
          </div>
        )}
      </div>
    </div>
  );
};

