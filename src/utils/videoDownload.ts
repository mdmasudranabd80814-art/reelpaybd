import { Reel } from '../types';
import { getVideoFromDB } from './videoStorage';

export const downloadReelVideo = async (reel: Reel, lang: 'bn' | 'en' = 'bn'): Promise<boolean> => {
  try {
    const fileName = `${(reel.title || 'reel').replace(/[^a-zA-Z0-9_\-]/g, '_')}.mp4`;
    let targetUrl = reel.videoUrl || '';

    // 1. Check IndexedDB if it's a locally stored video ID
    if (reel.id) {
      const dbBlob = await getVideoFromDB(reel.id);
      if (dbBlob) {
        const blobUrl = URL.createObjectURL(dbBlob);
        triggerAnchorDownload(blobUrl, fileName);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return true;
      }
    }

    if (targetUrl.startsWith('local:')) {
      const localKey = targetUrl.replace('local:', '');
      const dbBlob = await getVideoFromDB(localKey);
      if (dbBlob) {
        const blobUrl = URL.createObjectURL(dbBlob);
        triggerAnchorDownload(blobUrl, fileName);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return true;
      }
    }

    // 2. Blob or Direct MP4 / WebM URL
    if (targetUrl.startsWith('blob:') || targetUrl.startsWith('data:')) {
      triggerAnchorDownload(targetUrl, fileName);
      return true;
    }

    // 3. Try fetching URL as Blob for cross-origin force download
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      try {
        const response = await fetch(targetUrl, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          triggerAnchorDownload(blobUrl, fileName);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return true;
        }
      } catch {
        // Fall back to direct anchor download if CORS header prevents fetch
      }

      // Direct link fallback
      triggerAnchorDownload(targetUrl, fileName);
      return true;
    }

    // 4. Fallback if thumbnail is available
    if (reel.thumbnailUrl) {
      triggerAnchorDownload(reel.thumbnailUrl, `${fileName.replace('.mp4', '')}_preview.jpg`);
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error downloading video:', err);
    return false;
  }
};

const triggerAnchorDownload = (url: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
