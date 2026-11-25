import React, { useState, useRef } from 'react';
import { X, Video, Sparkles, UploadCloud, Link as LinkIcon, SlidersHorizontal } from 'lucide-react';
import { Reel, User, ReelWatermark } from '../types';
import { playSuccessChime } from '../utils/audio';
import { storeVideoInDB, fileToDataUrl, captureVideoThumbnail } from '../utils/videoStorage';
import { extractYouTubeId } from '../utils/video';
import { buildCreatorHandle } from '../utils/reelOwner';
import { REEL_UPLOAD_CATEGORIES } from '../utils/categories';
import { MediaMasterEditorModal, MasterEditorResult } from './MediaMasterEditorModal';
import { MediaEditConfig, createDefaultEditConfig } from '../utils/mediaEditorEngine';
import { WatermarkConfigurator } from './WatermarkConfigurator';
import { WatermarkOverlay } from './WatermarkOverlay';

interface CreateReelModalProps {
  currentUser: User;
  onClose: () => void;
  onAddReel: (
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
    >
  ) => void;
  isMuted: boolean;
}

export const CreateReelModal: React.FC<CreateReelModalProps> = ({
  currentUser,
  onClose,
  onAddReel,
  isMuted,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Reel['category']>('কমেডি');
  const [caption, setCaption] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [filter, setFilter] = useState('none');
  const [editConfig, setEditConfig] = useState<MediaEditConfig | undefined>(undefined);
  const [showMasterEditor, setShowMasterEditor] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImg = file.type.startsWith('image/');
      setMediaType(isImg ? 'image' : 'video');
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setRawPreview(preview);
      setVideoPreview(preview);
      setEditConfig(createDefaultEditConfig());
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      setIsProcessing(true);
      try {
        if (isImg) {
          const dataUrl = await fileToDataUrl(file);
          setThumbnailUrl(dataUrl);
        } else {
          const thumb = await captureVideoThumbnail(file);
          if (thumb) {
            setThumbnailUrl(thumb);
          }
        }
      } catch (err) {
        console.warn('Failed capturing thumbnail:', err);
      } finally {
        setIsProcessing(false);
      }
      setShowMasterEditor(true);
    }
  };

  const handleMasterEditApply = (result: MasterEditorResult) => {
    setMediaType(result.mediaType);
    if (result.editedFile) {
      setSelectedFile(result.editedFile);
    }
    if (result.editedPreviewUrl) {
      setVideoPreview(result.editedPreviewUrl);
    }
    if (result.thumbnailDataUrl) {
      setThumbnailUrl(result.thumbnailDataUrl);
    }
    setFilter(result.cssFilter || 'none');
    setEditConfig(result.config);
    setShowMasterEditor(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const reelUniqueId = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let finalVideoUrl: string | undefined = videoUrlInput.trim() || undefined;

    if (selectedFile && mediaType === 'video') {
      await storeVideoInDB(reelUniqueId, selectedFile);
      if (selectedFile.size <= 450000) {
        try {
          finalVideoUrl = await fileToDataUrl(selectedFile);
        } catch {
          finalVideoUrl = `local:${reelUniqueId}`;
        }
      } else {
        finalVideoUrl = `local:${reelUniqueId}`;
      }
    } else if (selectedFile && mediaType === 'image') {
      finalVideoUrl = undefined;
    }

    if (!finalVideoUrl && !thumbnailUrl) return;

    const ytId = finalVideoUrl ? extractYouTubeId(finalVideoUrl) : null;
    const finalThumb =
      thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '/images/ai_comedian_stage.jpg');

    onAddReel({
      title: title.trim(),
      userId: currentUser.id,
      creatorName: currentUser.name,
      creatorHandle: buildCreatorHandle(currentUser.name, currentUser.phone),
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
      watermark: watermark.enabled ? watermark : undefined,
    });

    if (!isMuted) playSuccessChime();
    onClose();
  };

  const editorSource = rawPreview || videoUrlInput.trim();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
        <div className="w-full max-w-sm bg-[#121c16] border border-emerald-900/80 rounded-3xl p-5 text-white shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400">
                <Video className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm">নতুন রিল তৈরি করুন</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-300 block mb-1 font-semibold">ভিডিও বা ছবি নির্বাচন করুন:</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-emerald-700/60 rounded-2xl p-3 bg-[#0d1611] hover:bg-[#15231c] cursor-pointer text-center transition"
              >
                <UploadCloud className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <p className="text-[11px] text-neutral-300">
                  {selectedFile ? selectedFile.name : 'গ্যালারি বা ডিভাইস থেকে ভিডিও বা ছবি সিলেক্ট করুন'}
                </p>
                <p className="text-[9px] text-neutral-500">MP4, WebM, MOV, JPG, PNG সাপোর্টেড</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {videoPreview && (
              <div className="rounded-xl overflow-hidden border border-emerald-500/40 bg-black">
                {mediaType === 'image' ? (
                  <img
                    src={videoPreview}
                    alt="Preview"
                    className="w-full h-36 object-contain"
                    style={filter !== 'none' ? { filter } : undefined}
                  />
                ) : (
                  <video
                    src={videoPreview}
                    controls
                    playsInline
                    className="w-full h-36 object-contain"
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
                <button
                  type="button"
                  onClick={() => setShowMasterEditor(true)}
                  className="w-full py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border-t border-white/10 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>ভিডিও মাস্টার এডিটরে এডিট করুন</span>
                </button>
              </div>
            )}

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
                onChange={(e) => setCategory(e.target.value as Reel['category'])}
                className="w-full bg-[#0d1611] border border-emerald-950 rounded-xl px-3 py-2 text-white"
              >
                {REEL_UPLOAD_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.labelBn}
                  </option>
                ))}
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

            {/* Watermark Configurator */}
            <WatermarkConfigurator
              watermark={watermark}
              onChange={setWatermark}
              creatorName={currentUser.name}
              creatorHandle={creatorHandle}
              previewThumbnailUrl={thumbnailUrl || undefined}
              lang="bn"
            />

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

      {showMasterEditor && editorSource && (
        <MediaMasterEditorModal
          isOpen={showMasterEditor}
          mediaType={mediaType}
          sourceUrl={editorSource}
          sourceFile={selectedFile}
          initialConfig={editConfig}
          lang="bn"
          onClose={() => setShowMasterEditor(false)}
          onApplyEdit={handleMasterEditApply}
        />
      )}
    </>
  );
};
