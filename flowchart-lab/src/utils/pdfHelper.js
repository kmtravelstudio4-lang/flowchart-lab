// Flowchart Quest - Bulletproof Google Drive & PDF Viewer Engine
// Supports Google Drive, Google Slides, Google Docs, Canva, and standard PDF links

/**
 * Extracts Google File ID or Returns appropriate embed URL
 */
export function extractGoogleFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Match /d/FILE_ID/ or /file/d/FILE_ID
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];

  // Match ?id=FILE_ID or &id=FILE_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  return null;
}

/**
 * Converts various Google Drive / Docs / Slides or PDF links into an embeddable preview URL
 * @param {string} url - Input URL from teacher/admin
 * @param {number} strategyIndex - 0: standard preview, 1: docs explorer viewer, 2: gview
 * @returns {string} - Formatted embed URL or empty string
 */
export function formatEmbedPdfUrl(url, strategyIndex = 0) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    // 1. Google Slides (/presentation/d/ID/...)
    if (trimmed.includes('docs.google.com/presentation')) {
      const idMatch = trimmed.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://docs.google.com/presentation/d/${idMatch[1]}/embed?start=false&loop=false&delayms=3000`;
      }
    }

    // 2. Google Docs (/document/d/ID/...)
    if (trimmed.includes('docs.google.com/document')) {
      const idMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://docs.google.com/document/d/${idMatch[1]}/preview`;
      }
    }

    // 3. Canva Embed Link
    if (trimmed.includes('canva.com/design')) {
      const canvaClean = trimmed.split('?')[0];
      return `${canvaClean}/view?embed`;
    }

    // 4. Google Drive File (PDF/Doc/Slide)
    const fileId = extractGoogleFileId(trimmed);
    if (fileId && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
      if (strategyIndex === 1) {
        // Fallback strategy 1: Google Docs Explorer Viewer
        return `https://docs.google.com/viewer?srcid=${fileId}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
      } else if (strategyIndex === 2) {
        // Fallback strategy 2: Google GView Engine
        return `https://docs.google.com/gview?url=https://drive.google.com/uc?id=${fileId}&embedded=true`;
      }
      // Default Strategy 0: Direct Google Drive Preview
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // 5. Standard PDF or External Web URL
    if (trimmed.endsWith('.pdf')) {
      if (strategyIndex === 1) {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(trimmed)}&embedded=true`;
      }
      return trimmed;
    }

    return trimmed;
  } catch (err) {
    console.warn('Failed to parse PDF URL:', err);
    return trimmed;
  }
}

/**
 * Checks if a URL is a valid Google Drive or PDF link
 */
export function isValidPdfUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('canva.com')
  );
}
