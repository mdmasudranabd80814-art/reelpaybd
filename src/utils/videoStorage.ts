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

/**
 * Compresses any gallery image File/Blob into a JPEG/WebP Data URL under Firestore size limits.
 */
export async function compressImageFileToDataUrl(
  file: Blob,
  maxDimension = 720,
  maxLength = 175000
): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxDimension / Math.max(img.width || 1, img.height || 1), 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let q = 0.86;
      let out = canvas.toDataURL('image/jpeg', q);
      while (out.length > maxLength && q > 0.35) {
        q -= 0.1;
        out = canvas.toDataURL('image/jpeg', q);
      }
      resolve(out);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Center-crops and compresses a gallery image into a crisp square app logo/icon Data URL (<= 140KB).
 */
export async function compressAppLogoToDataUrl(file: Blob, size = 256): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      const minSide = Math.min(img.width || size, img.height || size);
      const sx = Math.max(0, ((img.width || size) - minSide) / 2);
      const sy = Math.max(0, ((img.height || size) - minSide) / 2);
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

      // Prefer PNG if compact enough (preserves transparency), otherwise compress as WebP/JPEG
      const pngOut = canvas.toDataURL('image/png');
      if (pngOut.length <= 140000) {
        resolve(pngOut);
        return;
      }
      let q = 0.9;
      let out = canvas.toDataURL('image/webp', q);
      if (!out.startsWith('data:image/webp')) {
        out = canvas.toDataURL('image/jpeg', q);
      }
      const mime = out.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
      while (out.length > 140000 && q > 0.4) {
        q -= 0.1;
        out = canvas.toDataURL(mime, q);
      }
      resolve(out);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

