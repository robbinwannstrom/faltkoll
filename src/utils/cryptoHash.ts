/**
 * FaltKoll Cryptographic Hash & Data Integrity Utilities
 * 
 * Provides hardware-accelerated SHA-256 checksums using Web Crypto API (`crypto.subtle`)
 * for instant integrity verification, de-duplication, and forensic/legal compliance.
 */

import { MomentPhoto, Project } from '../types';

/**
 * Calculates a standard SHA-256 hash of a string, ArrayBuffer, or Uint8Array.
 * Returns a 64-character lowercase hexadecimal string.
 */
export async function calculateSha256(data: string | ArrayBuffer | Uint8Array): Promise<string> {
  if (!data) return '';

  let buffer: BufferSource;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else {
    buffer = data as unknown as BufferSource;
  }

  // Use Web Crypto API available in all modern browsers and Node 18+
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for environments where crypto.subtle might be unavailable (e.g. non-secure local contexts)
  let hash = 0;
  const str = typeof data === 'string' ? data : new TextDecoder().decode(data);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fallback_' + Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Extracts and hashes the pure binary payload of a base64 dataUrl (ignoring headers)
 * to ensure two identical photos with different MIME-types or timestamps match.
 */
export async function calculatePhotoBinaryHash(dataUrl: string): Promise<string> {
  if (!dataUrl) return '';
  const commaIdx = dataUrl.indexOf(',');
  const payload = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return calculateSha256(payload);
}

/**
 * Ensures a photo object has a verified SHA-256 hash.
 * If missing, computes and attaches it.
 */
export async function ensurePhotoHash(photo: MomentPhoto): Promise<MomentPhoto> {
  if (!photo || !photo.dataUrl) return photo;

  if (photo.hash && photo.hashVerified) {
    return photo;
  }

  try {
    const hash = await calculatePhotoBinaryHash(photo.dataUrl);
    return {
      ...photo,
      hash,
      hashVerified: true,
    };
  } catch (err) {
    console.warn('Could not compute photo hash:', err);
    return photo;
  }
}

/**
 * Verifies that a photo's stored hash matches its current dataUrl content.
 * Returns true if valid, false if corrupted.
 */
export async function verifyPhotoIntegrity(photo: MomentPhoto): Promise<boolean> {
  if (!photo || !photo.dataUrl || !photo.hash) return true;
  try {
    const computed = await calculatePhotoBinaryHash(photo.dataUrl);
    return computed === photo.hash;
  } catch {
    return false;
  }
}

/**
 * Calculates a deterministic content hash of an entire project revision.
 * Hashes all moments, completed statuses, field measurements, and photo hashes.
 */
export async function calculateProjectContentHash(project: Project): Promise<string> {
  if (!project) return '';

  const momentsSummary: Record<string, any> = {};
  if (project.moments) {
    const sortedMomentIds = Object.keys(project.moments).sort();
    for (const mId of sortedMomentIds) {
      const m = project.moments[mId];
      momentsSummary[mId] = {
        status: m.status,
        comment: m.comment,
        signature: m.signature,
        completedAt: m.completedAt,
        photos: (m.photos || []).map((p) => p.hash || p.id).sort(),
      };
    }
  }

  const payload = JSON.stringify({
    id: project.id,
    name: project.name,
    projectType: project.projectType,
    clientName: project.clientName,
    propertyDesignation: project.propertyDesignation,
    moments: momentsSummary,
    fieldMeasurements: project.fieldMeasurements || null,
    notes: project.notes || '',
  });

  return calculateSha256(payload);
}
