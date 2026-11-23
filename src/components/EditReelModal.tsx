import React, { useState, useRef, useEffect } from 'react';
import { X, Edit3, Video, UploadCloud, Link as LinkIcon, Sparkles, UserCheck } from 'lucide-react';
import { Reel, User } from '../types';
import { playSuccessChime } from '../utils/audio';
import { storeVideoInDB, fileToDataUrl, captureVideoThumbnail } from '../utils/videoStorage';
import { extractYouTubeId } from '../utils/video';
import { buildCreatorHandle } from '../utils/reelOwner';
import { REEL_UPLOAD_CATEGORIES } from '../utils/categories';

interface EditReelModalProps {
  reel: Reel;
  isOpen: boolean;
  onClose: () => void;
  onUpdateReel: (reelId: string, updatedData: Partial<Reel>) => Promise<void>;
  lang: 'bn' | 'en';
  isMuted: boolean;
  users?: User[];
}

export const EditReelModal: React.FC<EditReelModalProps> = ({
  reel,
  isOpen,
  onClose,
  onUpdateReel,
  lang,
  isMuted,
  users,
}) => {
  const [title, setTitle] = useState(reel.title);
  const [category, setCategory] = useState(reel.category);
  const [caption, setCaption] = useState(reel.caption || '');
  const [videoUrl, setVideoUrl] = useState(reel.videoUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(reel.thumbnailUrl || '');
  const [pointsReward, setPointsReward] = useState<number>(reel.pointsReward ?? 10);
  const [customWatchSeconds, setCustomWatchSeconds] = useState<number>(reel.customWatchSeconds ?? 15);
  const [isEarningEnabled, setIsEarningEnabled] = useState<boolean>(reel.isEarningEnabled !== false);
  const [isSpecialOffer, setIsSpecialOffer] = useState<boolean>(Boolean(reel.isSpecialOffer));
  const [specialOfferBadge, setSpecialOfferBadge] = useState<string>(reel.specialOfferBadge || '🔥 স্পেশাল অফার');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(reel.userId || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(reel.title);
    setCategory(reel.category);
    setCaption(reel.caption || '');
    setVideoUrl(reel.videoUrl || '');
    setThumbnailUrl(reel.thumbnailUrl || '');
    setPointsReward(reel.pointsReward ?? 10);
    setCustomWatchSeconds(reel.customWatchSeconds ?? 15);
    setIsEarningEnabled(reel.isEarningEnabled !== false);
    setIsSpecialOffer(Boolean(reel.isSpecialOffer));
    setSpecialOfferBadge(reel.specialOfferBadge || '🔥 স্পেশাল অফার');
    setSelectedOwnerId(reel.userId || '');
  }, [reel.id]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setVideoPreview(preview);
      try {
        const thumb = await captureVideoThumbnail(file);
        if (thumb) {
          setThumbnailUrl(thumb);
        }
      } catch (err) {
        console.warn('Failed capturing video thumbnail:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert(lang === 'bn' ? 'রিলের শিরোনাম লিখুন।' : 'Please enter reel title.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalVideoUrl = videoUrl.trim();

      if (selectedFile) {
        await storeVideoInDB(reel.id, selectedFile);
        if (selectedFile.size <= 800000) {
          try {
            finalVideoUrl = await fileToDataUrl(selectedFile);
          } catch {
            finalVideoUrl = `local:${reel.id}`;
          }
        } else {
          finalVideoUrl = `local:${reel.id}`;
        }
      }

      const ytId = extractYouTubeId(finalVideoUrl);
      const finalThumb = thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : reel.thumbnailUrl);

      const hashtags = caption
        .split(' ')
        .filter((w) => w.startsWith('#'))
        .slice(0, 10);

      const selectedOwner = users?.find((u) => u.id === selectedOwnerId);
      const ownerPatch: Partial<Reel> = selectedOwner
        ? {
            userId: selectedOwner.id,
            creatorName: selectedOwner.name,
            creatorAvatar: selectedOwner.avatar || reel.creatorAvatar,
            creatorHandle: `@${buildCreatorHandle(selectedOwner.name, selectedOwner.phone)}`,
            isVerified: Boolean(selectedOwner.isVerified),
          }
        : {};

      await onUpdateReel(reel.id, {
        ...ownerPatch,
        title: title.trim(),
        category,
        caption: caption.trim(),
        videoUrl: finalVideoUrl || reel.videoUrl,
        thumbnailUrl: finalThumb,
        pointsReward: Number(pointsReward) || 10,
        customWatchSeconds: Number(customWatchSeconds) || 15,
        isEarningEnabled,
        isSpecialOffer,
        specialOfferBadge: specialOfferBadge.trim(),
        hashtags: hashtags.length > 0 ? hashtags : reel.hashtags,
      });

      if (!isMuted) playSuccessChime();
      onClose();
    } catch (error) {
      console.error('Update reel failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="w-full max-w-sm bg-[#121c16] border border-emerald-900/80 rounded-3xl p-5 text-white shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm">
              {lang === 'bn' ? 'রিল এডিট করুন' : 'Edit Reel'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          {/* Owner User Profile Selector (when users list is passed, e.g. Admin) */}
          {users && users.length > 0 && (
            <div className="p-2.5 rounded-xl bg-[#0d1611] border border-emerald-900/70 space-y-1.5">
              <label className="text-emerald-300 font-bold flex items-center gap-1.5 text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'bn' ? 'ভিডিওর ইউজার প্রোফাইল (Creator):' : 'Owner User Profile:'}</span>
              </label>
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="w-full bg-[#14231b] border border-emerald-900 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-semibold"
              >
                {!users.some((u) => u.id === selectedOwnerId) && (
                  <option value={selectedOwnerId}>
                    {reel.creatorName} ({selectedOwnerId || 'unassigned'})
                  </option>
                )}
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.role === 'admin' ? '(Admin)' : ''} • {u.email || u.phone || u.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-neutral-400 block mb-1">
              {lang === 'bn' ? 'রিলের শিরোনাম:' : 'Reel Title:'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-neutral-400 block mb-1">
              {lang === 'bn' ? 'ক্যাটাগরি:' : 'Category:'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Reel['category'])}
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {REEL_UPLOAD_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {lang === 'bn' ? cat.labelBn : cat.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Caption */}
          <div>
            <label className="text-neutral-400 block mb-1">
              {lang === 'bn' ? 'ক্যাপশন ও হ্যাশট্যাগ:' : 'Caption & Hashtags:'}
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Video URL or Replace Video */}
          <div>
            <label className="text-neutral-400 block mb-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-emerald-400" />
              <span>{lang === 'bn' ? 'ভিডিও লিংক (YouTube / MP4):' : 'Video Link (YouTube / MP4):'}</span>
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/shorts/... বা MP4 লিংক"
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Upload New Video file */}
          <div>
            <label className="text-neutral-400 block mb-1">
              {lang === 'bn' ? 'বা নতুন ভিডিও ফাইল আপলোড করুন (ঐচ্ছিক):' : 'Or upload new video file (optional):'}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-emerald-800/80 rounded-xl p-2.5 bg-[#0d1611] hover:bg-[#15231c] cursor-pointer text-center transition"
            >
              <UploadCloud className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] text-neutral-300">
                {selectedFile ? `📹 ${selectedFile.name}` : (lang === 'bn' ? 'নতুন ফাইল সিলেক্ট করতে ক্লিক করুন' : 'Click to select new video')}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Video preview if newly selected */}
          {videoPreview && (
            <div className="rounded-xl overflow-hidden border border-emerald-500/40 bg-black max-h-32">
              <video src={videoPreview} controls playsInline className="w-full h-32 object-cover" />
            </div>
          )}

          {/* Earning & Special Offer Controls for this Specific Video */}
          <div className="p-3 rounded-2xl bg-[#0e1913] border border-emerald-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'পয়েন্ট ও আর্নিং কন্ট্রোল' : 'Earning & Reward Control'}</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEarningEnabled}
                  onChange={(e) => setIsEarningEnabled(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-[11px] font-bold text-neutral-300">
                  {isEarningEnabled ? (lang === 'bn' ? 'আর্নিং চালু ✅' : 'Earning On') : (lang === 'bn' ? 'আর্নিং বন্ধ ❌' : 'Earning Off')}
                </span>
              </label>
            </div>

            {/* Points & Watch Duration */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-0.5">
                  {lang === 'bn' ? 'পয়েন্ট রিওয়ার্ড:' : 'Reward Points:'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={pointsReward}
                  onChange={(e) => setPointsReward(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#14231b] border border-emerald-950 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-0.5">
                  {lang === 'bn' ? 'ভিডিও দেখার সময় (সেকেন্ড):' : 'Watch Duration (sec):'}
                </label>
                <input
                  type="number"
                  min="3"
                  max="300"
                  value={customWatchSeconds}
                  onChange={(e) => setCustomWatchSeconds(parseInt(e.target.value, 10) || 15)}
                  className="w-full bg-[#14231b] border border-emerald-950 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Special Offer Reel Toggle */}
            <div className="pt-1 border-t border-emerald-950/80">
              <label className="flex items-center justify-between cursor-pointer mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <span>🔥 {lang === 'bn' ? 'স্পেশাল অফার ভিডিও হিসেবে চিহ্নিত করুন' : 'Mark as Special Offer Video'}</span>
                </span>
                <input
                  type="checkbox"
                  checked={isSpecialOffer}
                  onChange={(e) => setIsSpecialOffer(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
              </label>

              {isSpecialOffer && (
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-0.5">
                    {lang === 'bn' ? 'অফার ব্যাজ শিরোনাম:' : 'Offer Badge Text:'}
                  </label>
                  <input
                    type="text"
                    value={specialOfferBadge}
                    onChange={(e) => setSpecialOfferBadge(e.target.value)}
                    placeholder="যেমন: 🔥 স্পেশাল অফার বা 💎 ডাবল পয়েন্ট"
                    className="w-full bg-[#14231b] border border-amber-900/60 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 focus:border-amber-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? (lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'আপডেট সংরক্ষণ করুন' : 'Save Changes')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
