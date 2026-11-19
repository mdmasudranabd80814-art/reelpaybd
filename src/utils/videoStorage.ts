const DB_NAME = 'ReelPay_VideoDB_v1';
const STORE_NAME = 'uploaded_videos';

function openVideoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores a video File/Blob in IndexedDB associated with a reel ID.
 */
export async function storeVideoInDB(reelId: string, blob: Blob): Promise<void> {
  try {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, reelId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not store video in IndexedDB:', err);
  }
}

/**
 * Retrieves a stored video Blob from IndexedDB by reel ID.
 */
export async function getVideoFromDB(reelId: string): Promise<Blob | null> {
  try {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(reelId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not retrieve video from IndexedDB:', err);
    return null;
  }
}

/**
 * Converts a small Blob/File into a Base64 data URL string.
 */
export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Captures an actual video frame as an image thumbnail (JPEG Data URL)
 * so user's reel has its genuine first frame as thumbnail.
 */
export function captureVideoThumbnail(file: File | Blob): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const tempUrl = URL.createObjectURL(file);
    video.src = tempUrl;

    let hasResolved = false;

    const cleanupAndResolve = (result: string) => {
      if (hasResolved) return;
      hasResolved = true;
      URL.revokeObjectURL(tempUrl);
      resolve(result);
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 480, 480);
        canvas.height = Math.min(video.videoHeight || 640, 640);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL('image/jpeg', 0.8);
          cleanupAndResolve(thumb);
          return;
        }
      } catch (err) {
        // Fallback
      }
      cleanupAndResolve('');
    };

    video.onerror = () => {
      cleanupAndResolve('');
    };

    // Timeout safety
    setTimeout(() => {
      cleanupAndResolve('');
    }, 4000);
  });
}
