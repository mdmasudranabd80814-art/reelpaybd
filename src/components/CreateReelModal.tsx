import React, { useState, useRef } from 'react';
import { X, Video, Sparkles, UploadCloud, Link as LinkIcon } from 'lucide-react';
import { Reel, User } from '../types';
import { playSuccessChime } from '../utils/audio';
import { storeVideoInDB, fileToDataUrl, captureVideoThumbnail } from '../utils/videoStorage';
import { extractYouTubeId } from '../utils/video';

interface CreateReelModalProps {
  currentUser: User;
  onClose: () => void;
  onAddReel: (reel: Pick<Reel, 'title' | 'userId' | 'creatorName' | 'creatorHandle' | 'creatorAvatar' | 'category' | 'thumbnailUrl' | 'videoUrl' | 'pointsReward' | 'audioTrack' | 'caption' | 'hashtags' | 'isVerified' | 'filter'>) => void;
  isMuted: boolean;
}

export const CreateReelModal: React.FC<CreateReelModalProps> = ({
  currentUser,
  onClose,
  onAddReel,
  isMuted,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'সকল' | 'ট্রেন্ডিং' | 'কমেডি' | 'গেমিং' | 'রান্না' | 'শিক্ষা'>('ট্রেন্ডিং');
  const [caption, setCaption] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [filter, setFilter] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);

  const filters = [
    { name: 'Normal', value: 'none' },
    { name: 'Grayscale', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Invert', value: 'invert(100%)' },
    { name: 'Blur', value: 'blur(2px)' },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setVideoPreview(preview);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      setIsProcessing(true);
      try {
        const thumb = await captureVideoThumbnail(file);
        if (thumb) {
          setThumbnailUrl(thumb);
        }
      } catch (err) {
        console.warn('Failed capturing video thumbnail:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('রিলের শিরোনাম লিখুন');
      return;
    }

    const reelUniqueId = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let finalVideoUrl = videoUrlInput.trim();

    if (selectedFile) {
      // Store in IndexedDB
      await storeVideoInDB(reelUniqueId, selectedFile);
      if (selectedFile.size <= 800000) {
        try {
          finalVideoUrl = await fileToDataUrl(selectedFile);
        } catch {
          finalVideoUrl = `local:${reelUniqueId}`;
        }
      } else {
        finalVideoUrl = `local:${reelUniqueId}`;
      }
    }

    if (!finalVideoUrl) {
      alert('অনুগ্রহ করে একটি ভিডিও ফাইল আপলোড করুন অথবা ভিডিও লিংক দিন।');
      return;
    }

    const ytId = extractYouTubeId(finalVideoUrl);
    const finalThumb = thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80');

    onAddReel({
      title: title.trim(),
      userId: currentUser.id,
      creatorName: currentUser.name,
      creatorHandle: (currentUser.phone || 'creator').replace(/[^0-9a-zA-Z]/g, ''),
      creatorAvatar: currentUser.avatar,
      isVerified: true,
      category,
      thumbnailUrl: finalThumb,
      videoUrl: finalVideoUrl,
      pointsReward: 10,
      audioTrack: 'Original Sound - ' + currentUser.name,
      caption: caption.trim() || `${title.trim()} #রিলতাকা`,
      hashtags: ['#রিলতাকা', '#আমারভিডিও', '#নতুনরিল'],
      filter: filter !== 'none' ? filter : undefined,
    });

    if (!isMuted) playSuccessChime();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="w-full max-w-sm bg-[#121c16] border border-emerald-900/80 rounded-3xl p-5 text-white shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400">
              <Video className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm">নতুন রিল তৈরি করুন (Create Reel)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Video File Picker */}
          <div>
            <label className="text-neutral-300 block mb-1 font-semibold">ভিডিও ফাইল নির্বাচন করুন:</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-emerald-700/60 rounded-2xl p-3 bg-[#0d1611] hover:bg-[#15231c] cursor-pointer text-center transition"
            >
              <UploadCloud className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] text-neutral-300">
                {selectedFile ? `📹 ${selectedFile.name}` : 'গ্যালারি বা ডিভাইস থেকে ভিডিও সিলেক্ট করুন'}
              </p>
              <p className="text-[9px] text-neutral-500">MP4, WebM, MOV ফরম্যাট সাপোর্টেড</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Video Preview if selected */}
          {videoPreview && (
            <div className="rounded-xl overflow-hidden border border-emerald-500/40 bg-black max-h-36">
              <video src={videoPreview} controls playsInline className="w-full h-36 object-cover" style={{ filter }} />
            </div>
          )}

          {/* Filter Selection */}
          <div>
            <label className="text-neutral-400 block mb-1">ভিডিও ফিল্টার:</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${
                    filter === f.value
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Video URL Alternative */}
          <div>
            <label className="text-neutral-400 block mb-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-emerald-400" />
              <span>অথবা ভিডিওর সরাসরি লিংক (YouTube, MP4):</span>
            </label>
            <input
              type="text"
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              placeholder="https://youtube.com/shorts/... বা MP4 লিংক"
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">রিলের শিরোনাম:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ছুটির দিনে পুরান ঢাকার ফুড ভ্লগ..."
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">ক্যাটাগরি:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-white"
            >
              <option value="সকল">সকল</option>
              <option value="ট্রেন্ডিং">ট্রেন্ডিং</option>
              <option value="কমেডি">কমেডি</option>
              <option value="গেমিং">গেমিং</option>
              <option value="রান্না">রান্না</option>
              <option value="শিক্ষা">শিক্ষা</option>
            </select>
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">ক্যাপশন ও বর্ণনা:</label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="ভিডিও সম্পর্কে কিছু লিখুন..."
              className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'প্রসেসিং হচ্ছে...' : 'রিলটি পাবলিশ করুন'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
