import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Type, Sparkles, UploadCloud, Video, Clock } from 'lucide-react';
import { User, UserStory } from '../types';
import { playSuccessChime } from '../utils/audio';
import { vibrateSuccess, vibrateError } from '../utils/haptics';
import {
  storeVideoInDB,
  fileToDataUrl,
  captureVideoThumbnail,
  compressImageFileToDataUrl,
} from '../utils/videoStorage';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onCreateStory: (story: Omit<UserStory, 'id' | 'viewsCount' | 'likesCount' | 'createdAt' | 'expiresAt'> & { id?: string }) => Promise<void>;
  lang: 'bn' | 'en';
  isMuted: boolean;
}

const STORY_BG_PRESETS = [
  { id: 'emerald', labelBn: 'এমারেল্ড', className: 'from-[#0a2e1c] via-[#0f3d26] to-[#00c853]/50' },
  { id: 'midnight', labelBn: 'নাইট', className: 'from-[#071510] via-[#102b22] to-teal-700/60' },
  { id: 'amber', labelBn: 'গোল্ডেন', className: 'from-[#1f1608] via-[#4a2e08] to-amber-500/50' },
  { id: 'rose', labelBn: 'রোজ', className: 'from-[#230b14] via-[#4a1026] to-rose-500/55' },
  { id: 'teal', labelBn: 'সায়ান', className: 'from-[#071c1f] via-[#0c3940] to-emerald-500/50' },
];

const STORY_FILTER_PRESETS = [
  { id: 'none', labelBn: 'স্বাভাবিক', labelEn: 'Normal', css: 'none' },
  { id: 'vivid', labelBn: 'ভাইব্র্যান্ট', labelEn: 'Vivid', css: 'saturate(1.35) contrast(1.08)' },
  { id: 'cinema', labelBn: 'সিনেমা', labelEn: 'Cinema', css: 'contrast(1.18) brightness(0.95) saturate(0.9)' },
  { id: 'warm', labelBn: 'ওয়ার্ম', labelEn: 'Warm', css: 'sepia(0.22) saturate(1.25) brightness(1.03)' },
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCreateStory,
  lang,
  isMuted,
}) => {
  const [mode, setMode] = useState<'media' | 'text'>('media');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [bgPresetId, setBgPresetId] = useState<string>('emerald');
  const [filterCss, setFilterCss] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeBg = STORY_BG_PRESETS.find((b) => b.id === bgPresetId) || STORY_BG_PRESETS[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    const isImg = file.type.startsWith('image/');
    setMediaType(isImg ? 'image' : 'video');
    setSelectedFile(file);
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);

    try {
      if (isImg) {
        const compressed = await compressImageFileToDataUrl(file, 900, 185000);
        setThumbnailDataUrl(compressed);
      } else {
        const thumb = await captureVideoThumbnail(file);
        if (thumb) {
          setThumbnailDataUrl(thumb);
        }
      }
    } catch (err) {
      console.warn('Story thumbnail preparation note:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const storyId = `story_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (mode === 'text') {
      if (!caption.trim()) {
        vibrateError();
        setErrorMsg(lang === 'bn' ? 'হিস্টরির জন্য কিছু লিখুন।' : 'Please write something for your story.');
        return;
      }
      setIsSubmitting(true);
      try {
        await onCreateStory({
          id: storyId,
          userId: currentUser.id,
          creatorName: currentUser.name,
          creatorAvatar: currentUser.avatar,
          isVerified: Boolean(currentUser.isVerified),
          mediaType: 'text',
          caption: caption.trim().slice(0, 280),
          bgColor: activeBg.className,
        });
        if (!isMuted) playSuccessChime();
        vibrateSuccess();
        onClose();
      } catch (err) {
        console.error('Failed creating text story:', err);
        setErrorMsg(lang === 'bn' ? 'হিস্টরি পাবলিশ করতে সমস্যা হয়েছে।' : 'Failed to publish story.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedFile && !previewUrl) {
      vibrateError();
      setErrorMsg(lang === 'bn' ? 'গ্যালারি থেকে একটি ছবি বা ভিডিও নির্বাচন করুন।' : 'Please select a photo or video from gallery.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalMediaUrl = '';
      let finalThumb = thumbnailDataUrl;

      if (selectedFile) {
        if (mediaType === 'image') {
          const compressed =
            thumbnailDataUrl ||
            (await compressImageFileToDataUrl(selectedFile, 900, 185000));
          finalMediaUrl = compressed;
          finalThumb = compressed;
        } else {
          await storeVideoInDB(storyId, selectedFile);
          if (selectedFile.size <= 350000) {
            try {
              finalMediaUrl = await fileToDataUrl(selectedFile);
            } catch {
              finalMediaUrl = `local:${storyId}`;
            }
          } else {
            finalMediaUrl = `local:${storyId}`;
          }
          if (!finalThumb) {
            finalThumb = (await captureVideoThumbnail(selectedFile)) || '/images/ai_comedy_tea_stall.jpg';
          }
        }
      }

      await onCreateStory({
        id: storyId,
        userId: currentUser.id,
        creatorName: currentUser.name,
        creatorAvatar: currentUser.avatar,
        isVerified: Boolean(currentUser.isVerified),
        mediaType,
        mediaUrl: finalMediaUrl,
        thumbnailUrl: finalThumb || '/images/ai_comedy_tea_stall.jpg',
        caption: caption.trim() ? caption.trim().slice(0, 280) : undefined,
        filter: filterCss !== 'none' ? filterCss : undefined,
      });

      if (!isMuted) playSuccessChime();
      vibrateSuccess();
      onClose();
    } catch (err) {
      console.error('Failed creating media story:', err);
      setErrorMsg(lang === 'bn' ? 'হিস্টরি আপলোড করতে সমস্যা হয়েছে।' : 'Failed to upload story.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#121c16] border-t sm:border border-emerald-900/80 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl animate-in slide-in-from-bottom-5 max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]" />
              <span>{lang === 'bn' ? 'নতুন হিস্টরি (Story) দিন' : 'Create Story'}</span>
            </h3>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{lang === 'bn' ? '২৪ ঘণ্টা সবার হোম ফিডে দৃশ্যমান থাকবে' : 'Visible in Stories tray for 24 hours'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher: Media vs Text Story */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#0b130e] border border-emerald-950 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('media');
              setErrorMsg(null);
            }}
            className={`min-h-[40px] rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'media'
                ? 'bg-[#00c853] text-black shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ছবি / ভিডিও' : 'Photo / Video'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('text');
              setErrorMsg(null);
            }}
            className={`min-h-[40px] rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'text'
                ? 'bg-[#00c853] text-black shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>{lang === 'bn' ? 'টেক্সট স্ট্যাটাস' : 'Text Status'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'media' ? (
            <>
              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-700/60 rounded-2xl p-6 bg-[#0d1611] hover:bg-[#14221b] cursor-pointer text-center transition space-y-2"
                >
                  <UploadCloud className="w-8 h-8 text-[#00e676] mx-auto" />
                  <p className="text-xs font-bold text-white">
                    {lang === 'bn' ? 'গ্যালারি থেকে ছবি বা ভিডিও বেছে নিন' : 'Choose photo or video from gallery'}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {lang === 'bn' ? 'JPG, PNG, MP4, WebM সাপোর্টেড' : 'JPG, PNG, MP4, WebM supported'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="relative h-64 rounded-2xl overflow-hidden bg-black border border-emerald-500/40 flex items-center justify-center">
                    {mediaType === 'image' ? (
                      <img
                        src={previewUrl}
                        alt="Story Preview"
                        className="w-full h-full object-cover"
                        style={filterCss !== 'none' ? { filter: filterCss } : undefined}
                      />
                    ) : (
                      <video
                        src={previewUrl}
                        controls
                        playsInline
                        className="w-full h-full object-cover"
                        style={filterCss !== 'none' ? { filter: filterCss } : undefined}
                      />
                    )}
                    {caption.trim() && (
                      <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-xl bg-black/65 backdrop-blur-sm text-white text-xs font-semibold text-center">
                        {caption}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-xl bg-black/70 hover:bg-black text-emerald-300 text-[11px] font-bold border border-emerald-500/40 cursor-pointer flex items-center gap-1"
                    >
                      {mediaType === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      <span>{lang === 'bn' ? 'পরিবর্তন' : 'Change'}</span>
                    </button>
                  </div>

                  {/* Quick Color Filters */}
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {STORY_FILTER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFilterCss(preset.css)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 cursor-pointer transition ${
                          filterCss === preset.css
                            ? 'bg-[#00c853] text-black border-[#00e676]'
                            : 'bg-[#0d1611] text-neutral-300 border-emerald-950 hover:bg-[#16271d]'
                        }`}
                      >
                        {lang === 'bn' ? preset.labelBn : preset.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={280}
                  placeholder={lang === 'bn' ? 'হিস্টরির ক্যাপশন লিখুন (ঐচ্ছিক)...' : 'Add a caption to your story (optional)...'}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          ) : (
            <>
              {/* Text Story Card Preview */}
              <div
                className={`h-60 rounded-2xl border border-emerald-500/40 p-5 flex items-center justify-center text-center shadow-inner bg-gradient-to-br ${activeBg.className}`}
              >
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={260}
                  rows={4}
                  placeholder={lang === 'bn' ? 'আপনার মনের কথা লিখুন...' : 'Type your status here...'}
                  className="w-full bg-transparent text-white placeholder-white/60 text-base font-extrabold text-center resize-none focus:outline-none leading-relaxed"
                />
              </div>

              {/* Background Gradient Selector */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {STORY_BG_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setBgPresetId(preset.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 cursor-pointer flex items-center gap-1.5 transition ${
                      bgPresetId === preset.id
                        ? 'border-[#00e676] text-white bg-[#17281f]'
                        : 'border-emerald-950 text-neutral-400 bg-[#0d1611]'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${preset.className} border border-white/30`} />
                    <span>{preset.labelBn}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="pt-1 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? lang === 'bn'
                    ? 'পাবলিশ হচ্ছে...'
                    : 'Publishing...'
                  : lang === 'bn'
                  ? 'হিস্টরিতে শেয়ার করুন'
                  : 'Share to Story'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 min-h-[44px] rounded-xl bg-[#16271d] hover:bg-[#1e3528] text-neutral-300 font-bold text-xs cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
