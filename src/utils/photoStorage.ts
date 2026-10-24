import JSZip from 'jszip';
import { Project, MomentPhoto } from '../types';
import { ALL_MOMENTS } from '../data/momentsData';

export const PHOTO_CATEGORIES = [
  { id: 'Schakt', label: 'Schakt & Terrass', path: 'appen/jobb/Schakt', icon: '🚜' },
  { id: 'VA', label: 'VA & Avlopp', path: 'appen/jobb/VA', icon: '💧' },
  { id: 'Grund', label: 'Grund & Betong', path: 'appen/jobb/Grund', icon: '🏗️' },
  { id: 'Kontrollbevis', label: 'Kontrollbevis & Mätning', path: 'appen/jobb/Kontrollbevis', icon: '📐' },
  { id: 'Avvikelser', label: 'Avvikelser & Hinder', path: 'appen/jobb/Avvikelser', icon: '⚠️' },
];

export function getDefaultCategoryForMoment(momentId: string, phaseName?: string): string {
  const m = ALL_MOMENTS.find((x) => x.id === momentId);
  const text = `${m?.title || ''} ${phaseName || ''} ${m?.amaCode || ''}`.toLowerCase();

  if (text.includes('avlopp') || text.includes('rör') || text.includes('dränering') || text.includes('dagvatten') || text.includes('va')) {
    return 'VA';
  }
  if (text.includes('schakt') || text.includes('terrass') || text.includes('avtäck') || text.includes('geotextil') || text.includes('fiberduk')) {
    return 'Schakt';
  }
  if (text.includes('laser') || text.includes('rulltest') || text.includes('kontroll') || text.includes('fall') || text.includes('provtryck')) {
    return 'Kontrollbevis';
  }
  if (text.includes('avvikelse') || text.includes('hinder') || text.includes('berg')) {
    return 'Avvikelser';
  }
  return 'Grund';
}

export function downloadPhotoDirect(dataUrl: string, filename: string) {
  try {
    const isSvg = dataUrl.includes('image/svg');
    let finalName = filename;
    if (isSvg && finalName.toLowerCase().endsWith('.jpg')) {
      finalName = finalName.replace(/\.jpg$/i, '.svg');
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('Kunde inte ladda ner bild direkt:', e);
  }
}

/**
 * Universal safe helper to save or download a photo directly to the device (mobile camera roll or downloads folder).
 * Supports:
 * - Direct base64 data URLs
 * - Remote and relative URLs (e.g. /api/photos/:id)
 * - Mobile Web Share API with files (iOS "Spara bild", Android gallery integration)
 * - Browser download fallback with proper blob revocation
 * - Zero impact on project state, sync queues, or deletedPhotoIds
 */
export async function savePhotoToDevice(
  photoUrlOrDataUrl: string,
  filename: string,
  photoTitle?: string
): Promise<{ success: boolean; message: string; method?: 'share' | 'download' }> {
  try {
    if (!photoUrlOrDataUrl || typeof photoUrlOrDataUrl !== 'string' || photoUrlOrDataUrl.trim() === '') {
      return {
        success: false,
        message: 'Ingen giltig bildfil hittades att spara.',
      };
    }

    let finalName = filename || `Faltfoto_${Date.now()}.jpg`;
    const isSvg = photoUrlOrDataUrl.includes('image/svg');
    if (isSvg && finalName.toLowerCase().endsWith('.jpg')) {
      finalName = finalName.replace(/\.jpg$/i, '.svg');
    }

    // Convert dataUrl or remote URL to Blob
    let blob: Blob;
    try {
      if (photoUrlOrDataUrl.startsWith('data:')) {
        const res = await fetch(photoUrlOrDataUrl);
        blob = await res.blob();
      } else {
        // Fetch from server / URL
        const res = await fetch(photoUrlOrDataUrl, { credentials: 'same-origin' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        blob = await res.blob();
      }
    } catch (fetchErr: any) {
      console.error('Kunde inte hämta bildfil för nedladdning:', fetchErr);
      return {
        success: false,
        message: `Kunde inte hämta bildfilen från servern: ${fetchErr?.message || 'Nätverksfel'}. Kontrollera anslutningen.`,
      };
    }

    const mimeType = blob.type || (isSvg ? 'image/svg+xml' : 'image/jpeg');

    // 1. Try mobile Web Share API if supported and user can share files (native "Spara bild" on iOS/Android)
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      typeof navigator.share === 'function' &&
      typeof File !== 'undefined'
    ) {
      try {
        const file = new File([blob], finalName, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: photoTitle || 'FältKoll Kontrollfoto',
            text: photoTitle ? `Kontrollfoto från FältKoll: ${photoTitle}` : 'Kontrollfoto från FältKoll',
          });
          return {
            success: true,
            message: 'Bilden öppnades för sparande/delning till enheten!',
            method: 'share',
          };
        }
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          // User closed share dialog, which is normal
          return {
            success: false,
            message: 'Sparande avbröts av användaren.',
          };
        }
        console.info('Web Share inte tillgängligt eller nekades, fallback till direkt nedladdning:', shareErr);
      }
    }

    // 2. Direct browser download fallback via Blob Object URL
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = finalName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      } catch {}
    }, 1000);

    return {
      success: true,
      message: `Bilden "${finalName}" har laddats ner till enheten!`,
      method: 'download',
    };
  } catch (err: any) {
    console.error('Oväntat fel vid sparande av bild till mobilen:', err);
    return {
      success: false,
      message: `Kunde inte spara bilden: ${err?.message || 'Okänt fel'}`,
    };
  }
}

/**
 * Automatically saves a captured photo directly to the device's camera roll / downloads folder.
 * Standard for student field work so photos never disappear even if browser cache or offline state changes.
 */
export function savePhotoToDeviceGallery(dataUrl: string, filename: string): boolean {
  try {
    if (!dataUrl || typeof dataUrl !== 'string') return false;
    const isSvg = dataUrl.includes('image/svg');
    let finalName = filename || `Faltfoto_${Date.now()}.jpg`;
    if (isSvg && finalName.toLowerCase().endsWith('.jpg')) {
      finalName = finalName.replace(/\.jpg$/i, '.svg');
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = finalName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {}
    }, 100);
    return true;
  } catch (e) {
    console.warn('Kunde inte spara foto till kamerarullen/nedladdningar:', e);
    return false;
  }
}

export async function exportProjectPhotosZip(project: Project): Promise<void> {
  const zip = new JSZip();
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
  const projFolder = zip.folder(sanitize(project.name || 'Projekt'));

  // Group all photos from all moments
  let totalPhotos = 0;
  const indexLines: string[] = [
    `FOTOFÖRTECKNING & EGENKONTROLL`,
    `Projekt: ${project.name}`,
    `Fastighet: ${project.propertyDesignation}`,
    `Byggherre: ${project.clientName}`,
    `Entreprenör: ${project.contractorName}`,
    `Skapad: ${project.createdAt}`,
    `=========================================\n`,
  ];

  for (const [momentId, record] of Object.entries(project.moments)) {
    const momentDef = ALL_MOMENTS.find((m) => m.id === momentId);
    const photos: MomentPhoto[] = [];

    if (record.photos && record.photos.length > 0) {
      photos.push(...record.photos);
    } else if (record.photoBase64) {
      photos.push({
        id: 'legacy_1',
        dataUrl: record.photoBase64,
        capturedAt: record.completedAt || '',
        category: getDefaultCategoryForMoment(momentId, momentDef?.phaseName),
        caption: record.comment,
      });
    }

    if (photos.length > 0) {
      indexLines.push(`Moment ${momentId}: ${momentDef?.title || ''}`);
      indexLines.push(`Status: ${record.status} | Signatur: ${record.signature || 'Ej signerat'}`);
      indexLines.push(`Notering: "${record.comment || 'Ingen'}"`);

      photos.forEach((photo, idx) => {
        totalPhotos++;
        const category = photo.category || getDefaultCategoryForMoment(momentId, momentDef?.phaseName);
        const folder = projFolder?.folder(category) || zip;

        const isSvg = photo.dataUrl.includes('image/svg');
        const ext = isSvg ? 'svg' : 'jpg';
        const base64Data = photo.dataUrl.split(',')[1] || photo.dataUrl;
        const timeClean = (photo.capturedAt || 'okand_tid').replace(/[^0-9]/g, '_');
        const fileName = `Moment_${momentId}_Foto_${idx + 1}_${timeClean}.${ext}`;

        if (isSvg && !photo.dataUrl.includes(';base64,')) {
          folder.file(fileName, decodeURIComponent(base64Data));
        } else {
          folder.file(fileName, base64Data, { base64: true });
        }
        indexLines.push(`  -> [${category}] ${fileName}${photo.caption ? ` ("${photo.caption}")` : ''}`);
      });
      indexLines.push('');
    }
  }

  if (totalPhotos === 0) {
    console.warn('Det finns inga foton sparade i detta projekt att exportera än.');
    return;
  }

  projFolder?.file('Fotoförteckning.txt', indexLines.join('\n'));

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${sanitize(project.name)}_Foton_Underkategorier.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
