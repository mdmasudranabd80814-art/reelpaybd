import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Radio, Rocket, Sparkles, Lock, SlidersHorizontal, Film, BookOpen, CheckCircle2 } from 'lucide-react';
import { Reel, User, ReelWatermark } from '../types';
import { playSuccessChime } from '../utils/audio';
import { vibrateSuccess, vibrateError } from '../utils/haptics';
import { storeVideoInDB, fileToDataUrl, captureVideoThumbnail } from '../utils/videoStorage';
import { extractYouTubeId } from '../utils/video';
import { buildCreatorHandle } from '../utils/reelOwner';
import { REEL_UPLOAD_CATEGORIES } from '../utils/categories';
import { MediaMasterEditorModal, MasterEditorResult } from './MediaMasterEditorModal';
import { MediaEditConfig, COLOR_PRESETS, buildCssFilterString, createDefaultEditConfig } from '../utils/mediaEditorEngine';
import { WatermarkConfigurator } from './WatermarkConfigurator';
import { WatermarkOverlay } from './WatermarkOverlay';

interface PlusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPublishReel: (
    reel: Pick<
      Reel,
      | 'title'
      | 'userId'
      | 'creatorName'
      | 'creatorHandle'
      | 'creatorAvatar'
      | 'category'
      | 'thumbnailUrl'
      | 'videoUrl'
      | 'pointsReward'
      | 'audioTrack'
      | 'caption'
      | 'hashtags'
      | 'isVerified'
      | 'filter'
      | 'watermark'
      | 'shareToStory'
      | 'storyExpiresAt'
    >
  ) => void;
  onOpenLive: () => void;
  onOpenCreateStory?: () => void;
  lang: 'bn' | 'en';
  isMuted: boolean;
  allowUserReelUpload?: boolean;
  defaultReelRewardPoints?: number;
  allowUserLive?: boolean;
}

async function compressImageFileToDataUrl(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 720;
      const ratio = Math.min(maxW / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let q = 0.85;
      let out = canvas.toDataURL('image/jpeg', q);
      while (out.length > 175000 && q > 0.4) {
        q -= 0.1;
        out = canvas.toDataURL('image/jpeg', q);
      }
      resolve(out);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const PlusSheet: React.FC<PlusSheetProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPublishReel,
  onOpenLive,
  onOpenCreateStory,
  lang,
  isMuted,
  allowUserReelUpload = true,
  defaultReelRewardPoints = 10,
  allowUserLive = true,
}) => {
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null);
  const [rawSelectedFile, setRawSelectedFile] = useState<File | null>(null);

  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);
  const [editedMediaType, setEditedMediaType] = useState<'video' | 'image'>('video');
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<MediaEditConfig | undefined>(undefined);
  const [showMasterEditor, setShowMasterEditor] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<Reel['category']>('কমেডি');
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [filter, setFilter] = useState('none');
  const [shareToStory, setShareToStory] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const creatorHandle = `@${buildCreatorHandle(currentUser.name, currentUser.phone)}`;
  const [watermark, setWatermark] = useState<ReelWatermark>(() => ({
    enabled: true,
    type: 'text',
    text: creatorHandle,
    position: 'bottom-right',
    opacity: 0.85,
    size: 'medium',
    color: '#ffffff',
  }));

  const recordInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError(null);
    const isImg = file.type.startsWith('image/');
    const detectedType: 'video' | 'image' = isImg ? 'image' : 'video';
    setMediaType(detectedType);
    setEditedMediaType(detectedType);
    setRawSelectedFile(file);
    setEditedFile(file);

    const url = URL.createObjectURL(file);
    setRawPreviewUrl(url);
    setEditedPreviewUrl(url);
    setSelectedFileName(file.name);
    setEditConfig(createDefaultEditConfig());
    setFilter('none');

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    setIsProcessing(true);
    try {
      if (isImg) {
        const compressed = await compressImageFileToDataUrl(file);
        setGeneratedThumbnail(compressed);
      } else {
        const thumb = await captureVideoThumbnail(file);
        if (thumb) {
          setGeneratedThumbnail(thumb);
        }
      }
    } catch (err) {
      console.warn('Failed capturing thumbnail:', err);
    } finally {
      setIsProcessing(false);
    }

    // Automatically open Video/Image Master Editor so user can edit colors, background, effects & text immediately
    setShowMasterEditor(true);
  };

  const handleMasterEditApply = (result: MasterEditorResult) => {
    setEditedMediaType(result.mediaType);
    if (result.editedFile) {
      setEditedFile(result.editedFile);
    }
    if (result.editedPreviewUrl) {
      setEditedPreviewUrl(result.editedPreviewUrl);
    }
    if (result.thumbnailDataUrl) {
      setGeneratedThumbnail(result.thumbnailDataUrl);
    }
    setFilter(result.cssFilter || 'none');
    setEditConfig(result.config);
    setShowMasterEditor(false);
  };

  const handleOpenEditorForExternalUrl = () => {
    const url = externalVideoUrl.trim();
    if (!url) {
      setFormError(lang === 'bn' ? 'প্রথমে ভিডিওর লিংক দিন বা ফাইল সিলেক্ট করুন।' : 'Please enter a video link or pick a file first.');
      return;
    }
    setFormError(null);
    setMediaType('video');
    setEditedMediaType('video');
    setRawPreviewUrl(url);
    setShowMasterEditor(true);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      vibrateError();
      setFormError(lang === 'bn' ? 'ভিডিও বা ছবির শিরোনাম লিখুন' : 'Please enter a title');
      return;
    }

    const reelUniqueId = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let finalVideoUrl: string | undefined = externalVideoUrl.trim() || undefined;
    let finalThumbnail = generatedThumbnail || '';

    if (editedMediaType === 'video' && editedFile) {
      await storeVideoInDB(reelUniqueId, editedFile);
      if (editedFile.size <= 450000) {
        try {
          finalVideoUrl = await fileToDataUrl(editedFile);
        } catch {
          finalVideoUrl = `local:${reelUniqueId}`;
        }
      } else {
        finalVideoUrl = `local:${reelUniqueId}`;
      }
    } else if (editedMediaType === 'image' && editedFile) {
      // Photo reel: keep videoUrl undefined so ReelFeedCard/FullScreenReelModal renders it as Photo Motion Reel
      finalVideoUrl = undefined;
      if (!finalThumbnail) {
        finalThumbnail = await compressImageFileToDataUrl(editedFile);
      }
    }

    if (!finalVideoUrl && !finalThumbnail) {
      vibrateError();
      setFormError(
        lang === 'bn'
          ? 'অনুগ্রহ করে ভিডিও বা ছবি আপলোড করুন অথবা ভিডিও লিংক দিন।'
          : 'Please upload a video/photo or provide a video link.'
      );
      return;
    }

    const ytId = finalVideoUrl ? extractYouTubeId(finalVideoUrl) : null;
    if (!finalThumbnail) {
      finalThumbnail = ytId
        ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
        : '/images/ai_comedy_tea_stall.jpg';
    }

    const customBgAudioNote = editConfig?.bgAudioName ? ` + ${editConfig.bgAudioName}` : '';
    const storyExpiry = shareToStory ? new Date(Date.now() + 86400000).toISOString() : undefined;

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
      audioTrack: `Original Sound - ${currentUser.name}${customBgAudioNote}`,
      caption: caption.trim() || `${title.trim()} #রিলতাকা #ReelPay`,
      hashtags: ['#রিলতাকা', '#ভাইরাল', '#বাংলাদেশ'],
      filter: filter !== 'none' ? filter : undefined,
      watermark: watermark.enabled ? watermark : undefined,
      shareToStory,
      storyExpiresAt: storyExpiry,
    });

    if (!isMuted) playSuccessChime();
    vibrateSuccess();

    // Reset
    setRawPreviewUrl(null);
    setRawSelectedFile(null);
    setEditedPreviewUrl(null);
    setEditedFile(null);
    setGeneratedThumbnail(null);
    setEditConfig(undefined);
    setExternalVideoUrl('');
    setSelectedFileName(null);
    setTitle('');
    setCaption('');
    setFilter('none');
    setShareToStory(false);
    onClose();
  };

  const activePreview = editedPreviewUrl || rawPreviewUrl;
  const activeEditorSource = rawPreviewUrl || externalVideoUrl.trim();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-end p-0 sm:p-4">
        <div className="w-full max-w-md bg-[#16231c] border-t sm:border border-emerald-900/80 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl animate-in slide-in-from-bottom-5 max-h-[88vh] overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base">
                {lang === 'bn' ? 'পোস্ট ও মাস্টার এডিটর' : 'Create & Master Editor'}
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
            {lang === 'bn'
              ? 'ভিডিও বা ছবি সিলেক্ট করে কালার, ব্যাকগ্রাউন্ড, ইফেক্ট ও টেক্সট এডিট করুন'
              : 'Pick a video or photo to edit color, background, VFX, and overlays'}
          </p>

          {allowUserReelUpload ? (
            <>
              {/* Option 1: Record Video */}
              <label className="block p-3.5 rounded-2xl bg-[#1e2e25] hover:bg-[#25392e] border border-emerald-900/60 mb-2.5 cursor-pointer transition active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <b className="text-sm block">
                      {lang === 'bn' ? 'ভিডিও রেকর্ড করুন' : 'Record Video'}
                    </b>
                    <small className="text-neutral-400 text-xs">
                      {lang === 'bn' ? 'ক্যামেরা দিয়ে রেকর্ড করে মাস্টার এডিটরে এডিট করুন' : 'Record with camera & edit in Master Studio'}
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

              {/* Option 2: Upload Video or Photo from Gallery */}
              <label className="block p-3.5 rounded-2xl bg-[#1e2e25] hover:bg-[#25392e] border border-emerald-900/60 mb-2.5 cursor-pointer transition active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center text-blue-400 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <b className="text-sm block">
                      {lang === 'bn' ? 'গ্যালারি থেকে ভিডিও বা ছবি' : 'Upload Video or Photo'}
                    </b>
                    <small className="text-neutral-400 text-xs">
                      {lang === 'bn'
                        ? 'ভিডিও বা ছবি বেছে নিয়ে প্রফেশনাল এডিট করুন'
                        : 'Select video or photo for Master Editor'}
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

              {/* Option 3: External URL */}
              <div className="mb-3">
                <label className="text-[11px] text-emerald-400 font-semibold mb-1 block">
                  {lang === 'bn' ? 'অথবা ভিডিওর সরাসরি লিংক দিন:' : 'Or enter direct Video Link:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={externalVideoUrl}
                    onChange={(e) => setExternalVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="flex-1 bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                  {externalVideoUrl.trim() && (
                    <button
                      type="button"
                      onClick={handleOpenEditorForExternalUrl}
                      className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                    </button>
                  )}
                </div>
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

          {/* Option 4: Create Standalone Story (24h) */}
          {onOpenCreateStory && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateStory();
              }}
              className="w-full text-left p-3.5 rounded-2xl bg-[#1a2c22] hover:bg-[#22392c] border border-[#00c853]/40 mb-2.5 cursor-pointer transition active:scale-[0.98] flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-[#00e676] shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <b className="text-sm block text-emerald-300">
                  {lang === 'bn' ? 'নতুন হিস্টরি / স্টোরি দিন (২৪ ঘণ্টা)' : 'Create Story (24 Hours)'}
                </b>
                <small className="text-neutral-400 text-xs">
                  {lang === 'bn'
                    ? 'ছবি, ভিডিও বা টেক্সট স্ট্যাটাস হিসেবে স্টোরিতে দিন'
                    : 'Share a photo, video, or text status to Stories'}
                </small>
              </div>
            </button>
          )}

          {/* Option 5: Personal Live Studio */}
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
                  {lang === 'bn' ? 'পার্সোনাল লাইভে যান' : 'Go Personal Live'}
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

          {/* Edited Media Preview + Master Editor Launch Button */}
          {activePreview && (
            <div className="mb-3 space-y-2.5">
              <div className="rounded-2xl overflow-hidden border border-emerald-500/45 bg-black relative">
                {editedMediaType === 'image' ? (
                  <img
                    src={activePreview}
                    alt={selectedFileName || 'Edited preview'}
                    className="w-full h-48 object-contain bg-black"
                    style={filter !== 'none' ? { filter } : undefined}
                  />
                ) : (
                  <video
                    src={activePreview}
                    controls
                    playsInline
                    className="w-full h-48 object-contain bg-black"
                    style={filter !== 'none' ? { filter } : undefined}
                  />
                )}

                {watermark.enabled && (
                  <WatermarkOverlay
                    watermark={watermark}
                    fallbackText={creatorHandle}
                    isFullScreen={false}
                  />
                )}

                <div className="p-2.5 bg-[#0d1611] border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-emerald-300 truncate">
                    {selectedFileName || (editedMediaType === 'image' ? 'Edited Photo' : 'Edited Video')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMasterEditor(true)}
                    className="min-h-[36px] px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'মাস্টার এডিটর' : 'Master Editor'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Color Filter Strip */}
              <div className="p-3 rounded-2xl bg-[#0d1611] border border-emerald-950">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'কুইক কালার ফিল্টার:' : 'Quick Color Presets:'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMasterEditor(true)}
                    className="text-[11px] text-emerald-400 font-semibold hover:underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'ব্যাকগ্রাউন্ড ও ইফেক্ট এডিট →' : 'Edit BG & VFX →'}
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {COLOR_PRESETS.slice(0, 7).map((preset) => {
                    const css = buildCssFilterString({ ...createDefaultEditConfig(), ...preset.patch });
                    const isSelected = filter === css;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFilter(css)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border shrink-0 transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : 'bg-neutral-900/90 text-neutral-300 border-emerald-950/80 hover:bg-neutral-800'
                        }`}
                      >
                        {lang === 'bn' ? preset.nameBn : preset.nameEn}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Title, Caption, Publish Form */}
          {allowUserReelUpload && (
            <form onSubmit={handlePublish} className="space-y-2.5">
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={lang === 'bn' ? 'ভিডিও বা ছবির শিরোনাম...' : 'Post title...'}
                  className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Reel['category'])}
                    className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    {REEL_UPLOAD_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {lang === 'bn' ? cat.labelBn : cat.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={lang === 'bn' ? 'ক্যাপশন... #হ্যাশট্যাগ' : 'Caption... #hashtags'}
                    className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500"
                  />
                </div>
              </div>

              {/* Watermark Protection Configurator */}
              <WatermarkConfigurator
                watermark={watermark}
                onChange={setWatermark}
                creatorName={currentUser.name}
                creatorHandle={creatorHandle}
                previewThumbnailUrl={generatedThumbnail || undefined}
                lang={lang}
              />

              {/* Explicit Story / History Sharing Choice */}
              <div className="p-3 rounded-2xl bg-[#0d1611] border border-emerald-900/70 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#00e676]" />
                    <span>
                      {lang === 'bn'
                        ? 'রিলটি কি হিস্টরিতেও (Story) যাবে?'
                        : 'Also post this reel to Story?'}
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShareToStory(true)}
                    className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      shareToStory
                        ? 'bg-[#00c853]/20 border-[#00e676] text-white shadow-sm'
                        : 'bg-[#132018] border-emerald-950 text-neutral-300 hover:bg-[#192b20]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${shareToStory ? 'text-[#00e676]' : 'text-neutral-600'}`}
                    />
                    <div className="min-w-0">
                      <span className="text-[11.5px] font-extrabold block leading-tight">
                        {lang === 'bn' ? 'হ্যাঁ, হিস্টরিতে যাবে' : 'Yes, share to Story'}
                      </span>
                      <span className="text-[9.5px] text-neutral-400 block truncate">
                        {lang === 'bn' ? 'ফিড + ২৪ ঘণ্টার হিস্টরি' : 'Feed + 24h Story'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareToStory(false)}
                    className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      !shareToStory
                        ? 'bg-[#152a1e] border-emerald-500/70 text-white shadow-sm'
                        : 'bg-[#132018] border-emerald-950 text-neutral-300 hover:bg-[#192b20]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${!shareToStory ? 'text-emerald-400' : 'text-neutral-600'}`}
                    />
                    <div className="min-w-0">
                      <span className="text-[11.5px] font-extrabold block leading-tight">
                        {lang === 'bn' ? 'না, হিস্টরিতে যাবে না' : 'No, Reels Feed only'}
                      </span>
                      <span className="text-[9.5px] text-neutral-400 block truncate">
                        {lang === 'bn' ? 'শুধু মূল রিল ফিডে থাকবে' : 'Main Reels Feed only'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>
                  {isProcessing
                    ? lang === 'bn'
                      ? 'প্রসেসিং হচ্ছে...'
                      : 'Processing...'
                    : lang === 'bn'
                    ? 'প্রকাশ করুন'
                    : 'Publish Post'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-900/60 text-rose-300 font-bold text-xs transition cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Full-Screen Video & Image Master Editor */}
      {showMasterEditor && activeEditorSource && (
        <MediaMasterEditorModal
          isOpen={showMasterEditor}
          mediaType={mediaType}
          sourceUrl={activeEditorSource}
          sourceFile={rawSelectedFile}
          initialConfig={editConfig}
          lang={lang}
          onClose={() => setShowMasterEditor(false)}
          onApplyEdit={handleMasterEditApply}
        />
      )}
    </>
  );
};
