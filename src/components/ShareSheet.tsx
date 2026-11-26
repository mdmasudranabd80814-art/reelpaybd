import React, { useState } from 'react';
import { X, Copy, Share2, Facebook, MessageCircle, Send, Download, Check, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Reel, LiveStream } from '../types';
import { downloadReelVideo } from '../utils/videoDownload';
import { vibrateLight } from '../utils/haptics';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Reel | null;
  liveStream?: LiveStream | null;
  lang: 'bn' | 'en';
  onSendInChat?: (reel: Reel) => void;
  onDownloadReel?: (reel: Reel) => void;
  onShareTracked?: (reelId: string) => void;
  onReport?: (reel: Reel, reason: string) => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  isOpen,
  onClose,
  reel,
  liveStream,
  lang,
  onSendInChat,
  onDownloadReel,
  onShareTracked,
  onReport,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('nudity');
  const [customReportNote, setCustomReportNote] = useState('');

  if (!reel && !liveStream) return null;

  const isLiveShare = Boolean(liveStream);
  const shareUrl = isLiveShare && liveStream
    ? `${window.location.origin}${window.location.pathname}?liveId=${liveStream.id}`
    : `${window.location.origin}${window.location.pathname}?reelId=${reel!.id}`;

  const shareText = isLiveShare && liveStream
    ? lang === 'bn'
      ? `ReelPay BD তে ${liveStream.hostName}-এর সরাসরি ${liveStream.mode === 'audio' ? 'অডিও আড্ডা' : 'লাইভ ভিডিও'} "${liveStream.title}" দেখুন! 🔴`
      : `Join ${liveStream.hostName}'s ${liveStream.mode === 'audio' ? 'Audio Adda' : 'Live Video'} "${liveStream.title}" on ReelPay BD! 🔴`
    : lang === 'bn'
      ? `ReelPay BD তে "${reel!.title}" রিলটি দেখুন এবং পয়েন্ট অর্জন করুন! 💰`
      : `Watch "${reel!.title}" on ReelPay BD and earn points! 💰`;

  const handleDownload = async () => {
    if (!reel) return;
    vibrateLight();
    setIsDownloading(true);

    if (onDownloadReel) {
      onDownloadReel(reel);
    } else {
      await downloadReelVideo(reel, lang);
    }

    setIsDownloading(false);
    setDownloadDone(true);
    setTimeout(() => {
      setDownloadDone(false);
      onClose();
    }, 1200);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      vibrateLight();
      if (!isLiveShare && reel && onShareTracked) {
        onShareTracked(reel.id);
      }
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ReelPay BD',
          text: shareText,
          url: shareUrl,
        });
        vibrateLight();
        if (!isLiveShare && reel && onShareTracked) {
          onShareTracked(reel.id);
        }
        onClose();
      } else {
        copyToClipboard();
      }
    } catch (err) {
      console.log('Share cancelled or failed', err);
    }
  };

  const shareToSocial = (platform: string) => {
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'messenger':
        url = `fb-messenger://share/?link=${encodedUrl}`;
        if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          url = `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=123456789&redirect_uri=${encodedUrl}`;
        }
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
    }

    if (url) {
      vibrateLight();
      if (!isLiveShare && reel && onShareTracked) {
        onShareTracked(reel.id);
      }
      window.open(url, '_blank');
      onClose();
    }
  };

  const handleSubmitReport = () => {
    if (!reel) return;
    const reasonText = selectedReportReason === 'other' ? (customReportNote.trim() || 'Other') : selectedReportReason;
    if (onReport) {
      onReport(reel, reasonText);
    }
    setShowReportModal(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-md bg-[#0a120e] border-t border-emerald-900/40 rounded-t-[32px] p-6 pb-10 shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-emerald-900/40 rounded-full mx-auto mb-6" />

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <span>
                  {isLiveShare
                    ? lang === 'bn'
                      ? 'লাইভ শেয়ার করুন'
                      : 'Share Live'
                    : lang === 'bn'
                    ? 'শেয়ার ও অপশন'
                    : 'Share & Options'}
                </span>
              </h3>
              <button
                onClick={onClose}
                className="p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {/* DOWNLOAD BUTTON INSIDE SHARE SHEET (Reels only) */}
              {!isLiveShare && reel && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg border ${
                    downloadDone
                      ? 'bg-emerald-500 text-black border-emerald-400 scale-105'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40 group-hover:bg-amber-400 group-hover:text-black'
                  }`}>
                    {downloadDone ? (
                      <Check className="w-7 h-7 stroke-[3]" />
                    ) : (
                      <Download className={`w-7 h-7 ${isDownloading ? 'animate-bounce' : ''}`} />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-amber-300">
                    {downloadDone
                      ? (lang === 'bn' ? 'সম্পন্ন ✓' : 'Done ✓')
                      : isDownloading
                      ? (lang === 'bn' ? 'হচ্ছে...' : 'Downloading...')
                      : (lang === 'bn' ? 'ডাউনলোড' : 'Download')}
                  </span>
                </button>
              )}

              {/* REPORT OPTION INSIDE SHARE SHEET (Reels only) */}
              {!isLiveShare && reel && (
                <button
                  onClick={() => {
                    vibrateLight();
                    setShowReportModal(true);
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-lg">
                    <Flag className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-medium text-rose-300">
                    {lang === 'bn' ? 'রিপোর্ট' : 'Report'}
                  </span>
                </button>
              )}

              {!isLiveShare && reel && onSendInChat && (
                <button
                  onClick={() => {
                    if (reel) onSendInChat(reel);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#00c853]/10 border border-[#00c853]/30 flex items-center justify-center text-[#00c853] group-hover:bg-[#00c853] group-hover:text-black transition-all shadow-lg">
                    <MessageCircle className="w-7 h-7 fill-current" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-400">{lang === 'bn' ? 'মেসেঞ্জার' : 'Messenger'}</span>
                </button>
              )}

              <button
                onClick={() => shareToSocial('whatsapp')}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-600/30 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-lg">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-medium text-neutral-400">WhatsApp</span>
              </button>

              <button
                onClick={() => shareToSocial('facebook')}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
                  <Facebook className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-medium text-neutral-400">Facebook</span>
              </button>

              <button
                onClick={() => shareToSocial('telegram')}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-lg">
                  <Send className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-medium text-neutral-400">Telegram</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white group-hover:bg-neutral-700 transition-all shadow-lg">
                  <Share2 className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-medium text-neutral-400">{lang === 'bn' ? 'আরও' : 'More'}</span>
              </button>
            </div>

            <div className="bg-[#122419] border border-emerald-900/40 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner">
              <div className="truncate text-[11px] text-emerald-200/60 font-mono pl-1">
                {shareUrl}
              </div>
              <button
                onClick={copyToClipboard}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>
                  {copiedLink
                    ? lang === 'bn'
                      ? 'কপি হয়েছে ✓'
                      : 'Copied ✓'
                    : lang === 'bn'
                    ? 'লিংক কপি'
                    : 'Copy'}
                </span>
              </button>
            </div>
          </motion.div>

          {/* Report Confirmation Modal inside ShareSheet */}
          {showReportModal && reel && (
            <div
              className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
              onClick={(e) => {
                e.stopPropagation();
                setShowReportModal(false);
              }}
            >
              <div
                className="w-full max-w-md bg-[#121915] border border-emerald-900/80 rounded-3xl p-5 shadow-2xl text-white space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black">
                        {lang === 'bn' ? 'আপত্তিকর কন্টেন্ট রিপোর্ট করুন' : 'Report Inappropriate Content'}
                      </h3>
                      <p className="text-[11px] text-neutral-400 truncate max-w-[240px]">
                        {reel.title}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 cursor-pointer transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-neutral-300">
                    {lang === 'bn' ? 'এই রিলটি কেন রিপোর্ট করতে চান? সঠিক কারণটি সিলেক্ট করুন:' : 'Please select the reason for reporting this reel:'}
                  </p>

                  {[
                    { id: 'nudity', labelBn: 'যৌন বা অশ্লীল কন্টেন্ট (Nudity / Sexual)', labelEn: 'Nudity or Sexual content' },
                    { id: 'violence', labelBn: 'হিংসাত্মক বা বিপজ্জনক কন্টেন্ট (Violence)', labelEn: 'Violence or Dangerous content' },
                    { id: 'hate', labelBn: 'ঘৃণা ছড়ানো বা হয়রানি (Hate speech)', labelEn: 'Hate speech or Harassment' },
                    { id: 'spam', labelBn: 'স্প্যাম বা বিভ্রান্তিকর তথ্য (Spam / Misleading)', labelEn: 'Spam or Misleading' },
                    { id: 'copyright', labelBn: 'কপিরাইট লঙ্ঘন (Copyright violation)', labelEn: 'Copyright violation' },
                    { id: 'other', labelBn: 'অন্যান্য কারণ (Other)', labelEn: 'Other reason' },
                  ].map((reason) => (
                    <label
                      key={reason.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                        selectedReportReason === reason.id
                          ? 'bg-rose-950/40 border-rose-500 text-white'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shareReportReason"
                        value={reason.id}
                        checked={selectedReportReason === reason.id}
                        onChange={() => setSelectedReportReason(reason.id)}
                        className="accent-rose-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold">
                        {lang === 'bn' ? reason.labelBn : reason.labelEn}
                      </span>
                    </label>
                  ))}

                  {selectedReportReason === 'other' && (
                    <textarea
                      value={customReportNote}
                      onChange={(e) => setCustomReportNote(e.target.value)}
                      placeholder={lang === 'bn' ? 'বিস্তারিত কারণ লিখুন...' : 'Enter details here...'}
                      className="w-full h-20 bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-950">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 cursor-pointer transition"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white cursor-pointer transition shadow-md shadow-rose-600/30"
                  >
                    {lang === 'bn' ? 'রিপোর্ট সাবমিট করুন' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
