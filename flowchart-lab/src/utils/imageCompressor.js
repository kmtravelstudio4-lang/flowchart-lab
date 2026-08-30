/**
 * High-Efficiency In-Browser Image Compressor
 * Resizes large images and compresses to JPEG/WebP to minimize storage size (under ~40-60 KB)
 */
export const compressImage = (fileOrDataUrl, maxWidth = 750, maxHeight = 750, quality = 0.65) => {
  return new Promise((resolve, reject) => {
    const processImage = (src, origBytes) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate scaling preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Enable high-quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw white background for transparent PNG conversion to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with specified quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Calculate approximate size in bytes
        const head = 'data:image/jpeg;base64,';
        const base64Len = dataUrl.length - head.length;
        const compressedBytes = Math.round((base64Len * 3) / 4);

        const reduction = origBytes > 0 
          ? Math.max(0, Math.round(((origBytes - compressedBytes) / origBytes) * 100))
          : 0;

        resolve({
          dataUrl,
          originalSize: origBytes,
          compressedSize: compressedBytes,
          reductionPercent: reduction,
          width,
          height
        });
      };

      img.onerror = () => {
        reject(new Error('ไม่สามารถประมวลผลไฟล์รูปภาพได้'));
      };

      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      const origBytes = Math.round((fileOrDataUrl.length * 3) / 4);
      processImage(fileOrDataUrl, origBytes);
    } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
      const origBytes = fileOrDataUrl.size;
      const reader = new FileReader();
      reader.onload = (e) => {
        processImage(e.target.result, origBytes);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      reject(new Error('รูปแบบไฟล์ไม่ถูกต้อง'));
    }
  });
};

export const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
