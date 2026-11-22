import React, { useState } from 'react';
import { X, Copy, Share2, Facebook, MessageCircle, Send, Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Reel, LiveStream } from '../types';
import { downloadReelVideo } from '../utils/videoDownload';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Reel | null;
  liveStream?: LiveStream | null;
  lang: 'bn' | 'en';
  onSendInChat?: (reel: Reel) => void;
  onDownloadReel?: (reel: Reel) => void;
  onShareTracked?: (reelId: string) => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({ isOpen, onClose, reel, liveStream, lang, onSendInChat, onDownloadReel, onShareTracked }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
      if (!isLiveShare && reel && onShareTracked) {
        onShareTracked(reel.id);
      }
      window.open(url, '_blank');
      onClose();
    }
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
                    ? 'শেয়ার ও ডাউনলোড'
                    : 'Share & Download'}
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
        </>
      )}
    </AnimatePresence>
  );
};
