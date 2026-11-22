import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Radio, Rocket, Sparkles, Lock } from 'lucide-react';
import { Reel, User } from '../types';
import { playSuccessChime } from '../utils/audio';
import { storeVideoInDB, fileToDataUrl, captureVideoThumbnail } from '../utils/videoStorage';
import { extractYouTubeId } from '../utils/video';
import { buildCreatorHandle } from '../utils/reelOwner';

interface PlusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPublishReel: (reel: Pick<Reel, 'title' | 'userId' | 'creatorName' | 'creatorHandle' | 'creatorAvatar' | 'category' | 'thumbnailUrl' | 'videoUrl' | 'pointsReward' | 'audioTrack' | 'caption' | 'hashtags' | 'isVerified' | 'filter'>) => void;
  onOpenLive: () => void;
  lang: 'bn' | 'en';
  isMuted: boolean;
  allowUserReelUpload?: boolean;
  defaultReelRewardPoints?: number;
  allowUserLive?: boolean;
}

export const PlusSheet: React.FC<PlusSheetProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPublishReel,
  onOpenLive,
  lang,
  isMuted,
  allowUserReelUpload = true,
  defaultReelRewardPoints = 10,
  allowUserLive = true,
}) => {
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<'সকল' | 'ট্রেন্ডিং' | 'কমেডি' | 'গেমিং' | 'রান্না' | 'শিক্ষা'>('ট্রেন্ডিং');
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [filter, setFilter] = useState('none');
  const [formError, setFormError] = useState<string | null>(null);

  const filters = [
    { name: lang === 'bn' ? 'সাধারণ' : 'Normal', value: 'none' },
    { name: lang === 'bn' ? 'ধূসর' : 'Grayscale', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: lang === 'bn' ? 'উজ্জ্বল' : 'Bright', value: 'brightness(125%) saturate(125%)' },
    { name: 'Vintage', value: 'sepia(50%) contrast(110%) brightness(95%)' },
    { name: 'Cyberpunk', value: 'hue-rotate(90deg) saturate(150%) contrast(120%)' },
  ];

  const recordInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormError(null);
      setSelectedVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      setSelectedFileName(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      setIsProcessing(true);
      try {
        const thumb = await captureVideoThumbnail(file);
        if (thumb) {
          setGeneratedThumbnail(thumb);
        }
      } catch (err) {
        console.warn('Failed capturing video thumbnail:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError(lang === 'bn' ? 'ভিডিওর শিরোনাম লিখুন' : 'Please enter reel title');
      return;
    }

    const reelUniqueId = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let finalVideoUrl = externalVideoUrl.trim();

    // If user uploaded a physical video file:
    if (selectedVideoFile) {
      // 1. Store in IndexedDB under this reel's unique key so this device always plays the exact original file
      await storeVideoInDB(reelUniqueId, selectedVideoFile);

      // 2. If video is small (< 800KB), also convert to Base64 so it persists directly in Firestore across users
      if (selectedVideoFile.size <= 800000) {
        try {
          finalVideoUrl = await fileToDataUrl(selectedVideoFile);
        } catch {
          finalVideoUrl = `local:${reelUniqueId}`;
        }
      } else {
        finalVideoUrl = `local:${reelUniqueId}`;
      }
    }

    if (!finalVideoUrl) {
      setFormError(lang === 'bn' ? 'অনুগ্রহ করে ভিডিও রেকর্ড বা আপলোড করুন অথবা ভিডিও লিংক দিন।' : 'Please upload a video or provide a video link.');
      return;
    }

    // Determine accurate thumbnail from user's video or YouTube
    const ytId = extractYouTubeId(finalVideoUrl);
    const finalThumbnail = generatedThumbnail ||
      (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : (videoPreviewUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80'));

    onPublishReel({
      title: title.trim(),
      userId: currentUser.id,
      creatorName: currentUser.name,
      creatorHandle: buildCreatorHandle(currentUser.name, currentUser.phone),
      creatorAvatar: currentUser.avatar,
      isVerified: true,
      category,
      thumbnailUrl: finalThumbnail,
      videoUrl: finalVideoUrl,
      pointsReward: Math.max(0, Number(defaultReelRewardPoints ?? 10)),
      audioTrack: 'Original Sound - ' + currentUser.name,
      caption: caption.trim() || `${title.trim()} #রিলতাকা #ReelTaka`,
      hashtags: ['#রিলতাকা', '#ভাইরাল', '#বাংলাদেশ'],
      filter: filter !== 'none' ? filter : undefined,
    });

    if (!isMuted) playSuccessChime();

    // Reset
    setVideoPreviewUrl(null);
    setSelectedVideoFile(null);
    setGeneratedThumbnail(null);
    setExternalVideoUrl('');
    setSelectedFileName(null);
    setTitle('');
    setCaption('');
    setFilter('none');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-end p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#16231c] border-t sm:border border-emerald-900/80 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl animate-in slide-in-from-bottom-5 max-h-[88vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <h3 className="font-bold text-base">
              {lang === 'bn' ? 'তৈরি করুন / Create' : 'Create / তৈরি করুন'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 mb-3">
          {lang === 'bn' ? 'একটি অপশন বেছে নিন' : 'Choose an option to share or go live'}
        </p>

        {allowUserReelUpload ? (
          <>
            {/* Option 1: Record Video */}
            <label className="block p-3.5 rounded-2xl bg-[#1e2e25] hover:bg-[#25392e] border border-emerald-900/60 mb-2.5 cursor-pointer transition active:scale-98">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <b className="text-sm block">
                    {lang === 'bn' ? '📷 ভিডিও রেকর্ড করুন / Record Video' : '📷 Record Video'}
                  </b>
                  <small className="text-neutral-400 text-xs">
                    {lang === 'bn' ? 'ক্যামেরা খুলে এখনই রেকর্ড করুন' : 'Open camera and record live video'}
                  </small>
                </div>
              </div>
              <input
                ref={recordInputRef}
                type="file"
                accept="video/*"
                capture="user"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Option 2: Upload from Gallery */}
            <label className="block p-3.5 rounded-2xl bg-[#1e2e25] hover:bg-[#25392e] border border-emerald-900/60 mb-2.5 cursor-pointer transition active:scale-98">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center text-blue-400 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <b className="text-sm block">
                    {lang === 'bn'
                      ? '🖼️ গ্যালারি থেকে আপলোড করুন / Upload from Gallery'
                      : '🖼️ Upload from Gallery'}
                  </b>
                  <small className="text-neutral-400 text-xs">
                    {lang === 'bn'
                      ? 'আপনার গ্যালারি থেকে ভিডিও বা ছবি বেছে নিন'
                      : 'Choose video file from your device'}
                  </small>
                </div>
              </div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Option 3: External URL (Persistence) */}
            <div className="mb-3">
              <label className="text-[10px] text-emerald-400 font-bold uppercase mb-1 block">
                {lang === 'bn' ? 'বা ভিডিওর লিঙ্ক দিন (স্থায়ী):' : 'Or provide Video Link (Persistent):'}
              </label>
              <input
                type="text"
                value={externalVideoUrl}
                onChange={(e) => setExternalVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[9px] text-neutral-500 mt-1">
                {lang === 'bn' 
                  ? 'গ্যালারি থেকে আপলোড করা ভিডিও সাময়িক। স্থায়ী করতে লিঙ্ক ব্যবহার করুন।' 
                  : 'Uploaded files are temporary. Use a link for permanent videos.'}
              </p>
            </div>
          </>
        ) : (
          <div className="mb-3 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-center space-y-1.5">
            <Lock className="w-6 h-6 text-amber-400 mx-auto" />
            <p className="text-xs font-bold text-amber-200">
              {lang === 'bn' ? 'রিল আপলোড সাময়িকভাবে বন্ধ রয়েছে' : 'Reel upload temporarily disabled'}
            </p>
            <p className="text-[11px] text-neutral-400">
              {lang === 'bn' ? 'এডমিন কর্তৃক ইউজার রিল আপলোড ফিচারটি বর্তমানে বন্ধ করা আছে।' : 'Admin has disabled user reel uploads.'}
            </p>
          </div>
        )}

        {/* Option 4: Personal Live Studio (Audio Adda or Video Live) */}
        {allowUserLive ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLive();
            }}
            className="w-full text-left p-3.5 rounded-2xl bg-[#1e2e25] hover:bg-[#25392e] border border-rose-900/60 mb-3 cursor-pointer transition active:scale-[0.98] flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-950 flex items-center justify-center text-rose-400 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <b className="text-sm block text-rose-300">
                {lang === 'bn' ? '🎙️ / 📹 পার্সোনাল লাইভে যান' : '🎙️ / 📹 Go Personal Live'}
              </b>
              <small className="text-neutral-400 text-xs">
                {lang === 'bn'
                  ? 'অডিও আড্ডা বা লাইভ ভিডিও চালু করুন ও গিফট নিন'
                  : 'Start Audio Adda or Live Video and receive gifts'}
              </small>
            </div>
          </button>
        ) : (
          <div className="mb-3 p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{lang === 'bn' ? 'পার্সোনাল লাইভ ফিচারটি এডমিন কর্তৃক বন্ধ রয়েছে।' : 'Live streaming disabled by Admin.'}</span>
          </div>
        )}

        {formError && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {formError}
          </div>
        )}

        {/* Video Player Preview & Filter Selection Menu */}
        {videoPreviewUrl && (
          <div className="mb-3 space-y-2">
            <div className="rounded-2xl overflow-hidden border border-emerald-500/50 bg-black">
              <video
                src={videoPreviewUrl}
                controls
                playsInline
                className="w-full h-44 object-cover transition-all"
                style={{ filter }}
              />
              {selectedFileName && (
                <div className="p-2 bg-neutral-900 text-[11px] text-emerald-400 truncate">
                  📹 নির্বাচিত: {selectedFileName}
                </div>
              )}
            </div>

            {/* Video Filter Selection Menu */}
            <div className="p-3 rounded-2xl bg-[#0d1611] border border-emerald-950">
              <label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ভিডিও ফিল্টার বেছে নিন (Video Filters):' : 'Choose Video Filter:'}</span>
              </label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 transition active:scale-95 cursor-pointer ${
                      filter === f.value
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black border-emerald-400 shadow-md shadow-emerald-950/40'
                        : 'bg-neutral-900/90 text-neutral-300 border-emerald-950/80 hover:bg-neutral-800'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Title, Caption, Publish Form (only when upload is enabled) */}
        {allowUserReelUpload && (
          <form onSubmit={handlePublish} className="space-y-2.5">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  lang === 'bn' ? 'ভিডিওর শিরোনাম / Title...' : 'Reel Title (e.g. Dhaka Rain Vlog)...'
                }
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="সকল">{lang === 'bn' ? 'সকল' : 'All'}</option>
                  <option value="ট্রেন্ডিং">{lang === 'bn' ? 'ট্রেন্ডিং' : 'Trending'}</option>
                  <option value="কমেডি">{lang === 'bn' ? 'কমেডি' : 'Comedy'}</option>
                  <option value="গেমিং">{lang === 'bn' ? 'গেমিং' : 'Gaming'}</option>
                  <option value="রান্না">{lang === 'bn' ? 'রান্না' : 'Cooking'}</option>
                  <option value="শিক্ষা">{lang === 'bn' ? 'শিক্ষা' : 'Education'}</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={lang === 'bn' ? 'ক্যাপশন... #হ্যাশট্যাগ' : 'Caption... #hashtags'}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '🚀 প্রকাশ করুন / Publish' : '🚀 Publish Reel'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-900/60 text-rose-300 font-bold text-xs transition cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল / Cancel' : 'Cancel / বাতিল'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
