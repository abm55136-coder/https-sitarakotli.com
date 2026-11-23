import { MediaAsset, MediaCategory } from '../types';

/**
 * Format bytes into readable KB/MB size
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Validate image file type and size limit (max 15MB)
 */
export function validateImageFile(file: { type: string; size: number }): { valid: boolean; error?: string } {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
  if (!allowed.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Only JPG, PNG, WEBP, and GIF images are supported.' };
  }
  const maxBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxBytes) {
    return { valid: false, error: 'Image exceeds maximum limit of 15MB.' };
  }
  return { valid: true };
}

/**
 * Rotate an angle in 90-degree steps (clockwise or counter-clockwise)
 */
export function rotateAngle(current: number, direction: 'cw' | 'ccw'): number {
  if (direction === 'cw') {
    return (current + 90) % 360;
  }
  return (current - 90 + 360) % 360;
}

/**
 * Compute cropped width and height centered based on target aspect ratio
 */
export function computeCroppedDimensions(
  originalW: number,
  originalH: number,
  ratio: 'free' | '1:1' | '4:5' | '16:9'
): { width: number; height: number; x: number; y: number } {
  if (ratio === 'free') {
    return { width: originalW, height: originalH, x: 0, y: 0 };
  }

  let targetRatio = 1;
  if (ratio === '1:1') targetRatio = 1;
  else if (ratio === '4:5') targetRatio = 4 / 5;
  else if (ratio === '16:9') targetRatio = 16 / 9;

  let cropW = originalW;
  let cropH = originalH;

  const currentRatio = originalW / originalH;

  if (currentRatio > targetRatio) {
    cropW = Math.round(originalH * targetRatio);
    cropH = originalH;
  } else {
    cropW = originalW;
    cropH = Math.round(originalW / targetRatio);
  }

  const x = Math.round((originalW - cropW) / 2);
  const y = Math.round((originalH - cropH) / 2);

  return { width: cropW, height: cropH, x, y };
}

/**
 * Filter media assets by category and search keyword
 */
export function filterMediaAssets(
  assets: MediaAsset[],
  category: MediaCategory | 'all',
  searchQuery = ''
): MediaAsset[] {
  const query = searchQuery.trim().toLowerCase();

  return assets.filter((asset) => {
    const matchesCategory = category === 'all' || asset.category === category;
    if (!matchesCategory) return false;

    if (!query) return true;

    const inTitle = asset.title.toLowerCase().includes(query);
    const inDesc = asset.description?.toLowerCase().includes(query);
    const inTags = asset.tags?.some((t: string) => t.toLowerCase().includes(query));

    return inTitle || inDesc || inTags;
  });
}
