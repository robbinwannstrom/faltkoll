/**
 * FaltKoll Permanent Photo Vault Service
 * 
 * Provides an immutable, offline-first permanent photo store in IndexedDB.
 * Any photo captured, uploaded, or loaded is mirrored here.
 * Even if cloud sync, deletion cascades, or metadata corruption occurs in a project,
 * the original photo binaries and metadata are preserved here and can be recovered.
 */

import { MomentPhoto, Project, MomentRecord } from '../types';
import { calculatePhotoBinaryHash } from '../utils/cryptoHash';

const VAULT_DB_NAME = 'FaltKoll_PermanentVault_v1';
const VAULT_DB_VERSION = 1;
const STORE_NAME = 'photo_vault';

export interface VaultPhotoRecord {
  id: string; // photo ID (e.g. ph_...)
  projectId: string;
  momentId?: string;
  dataUrl: string;
  caption?: string;
  category?: string;
  capturedAt: string;
  savedToVaultAt: string;
  hash?: string; // SHA-256 binary integrity hash
}

let dbInstance: IDBDatabase | null = null;

function openVaultDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB inte tillgänglig'));
      return;
    }

    const request = indexedDB.open(VAULT_DB_NAME, VAULT_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('momentId', 'momentId', { unique: false });
        store.createIndex('savedToVaultAt', 'savedToVaultAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error('Kunde inte öppna fotovalvet'));
    };
  });
}

/**
 * Permanently saves or updates a photo in the immutable local vault
 */
export async function savePhotoToVault(params: {
  id: string;
  projectId: string;
  momentId?: string;
  dataUrl: string;
  caption?: string;
  category?: string;
  capturedAt?: string;
  hash?: string;
}): Promise<string> {
  if (!params.id || !params.dataUrl || params.dataUrl.length < 500) return '';

  try {
    const db = await openVaultDB();
    const hash = params.hash || (await calculatePhotoBinaryHash(params.dataUrl));
    const record: VaultPhotoRecord = {
      id: params.id,
      projectId: params.projectId || 'unknown',
      momentId: params.momentId || '',
      dataUrl: params.dataUrl,
      caption: params.caption || '',
      category: params.category || 'Kontroll',
      capturedAt: params.capturedAt || new Date().toISOString(),
      savedToVaultAt: new Date().toISOString(),
      hash,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return hash;
  } catch (err) {
    console.warn('Photo vault write notice:', err);
    return '';
  }
}

/**
 * Get all photos stored in the vault for a specific project
 */
export async function getVaultPhotosForProject(projectId: string): Promise<VaultPhotoRecord[]> {
  if (!projectId) return [];
  try {
    const db = await openVaultDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('projectId');
      const req = index.getAll(projectId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Get total count and statistics of photos in the vault
 */
export async function getVaultStats(): Promise<{ totalPhotos: number; projectIds: string[]; verifiedPhotos: number }> {
  try {
    const db = await openVaultDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list: VaultPhotoRecord[] = req.result || [];
        const pIds = Array.from(new Set(list.map((p) => p.projectId).filter(Boolean)));
        resolve({
          totalPhotos: list.length,
          projectIds: pIds,
          verifiedPhotos: list.filter((p) => !!p.hash).length,
        });
      };
      req.onerror = () => resolve({ totalPhotos: 0, projectIds: [], verifiedPhotos: 0 });
    });
  } catch {
    return { totalPhotos: 0, projectIds: [], verifiedPhotos: 0 };
  }
}

/**
 * Scan all moments in a project and automatically mirror their photos into the vault
 */
export async function mirrorProjectPhotosToVault(project: Project): Promise<number> {
  if (!project || !project.moments) return 0;
  let count = 0;
  for (const [mId, m] of Object.entries(project.moments)) {
    if (m && m.photos && m.photos.length > 0) {
      for (const ph of m.photos) {
        if (ph && ph.id && ph.dataUrl && ph.dataUrl.length > 500) {
          const hash = await savePhotoToVault({
            id: ph.id,
            projectId: project.id,
            momentId: mId,
            dataUrl: ph.dataUrl,
            caption: ph.caption,
            category: ph.category,
            capturedAt: ph.capturedAt,
            hash: ph.hash,
          });
          if (hash && !ph.hash) {
            ph.hash = hash;
            ph.hashVerified = true;
          }
          count++;
        }
      }
    } else if (m && m.photoBase64 && m.photoBase64.length > 500) {
      await savePhotoToVault({
        id: `ph_${mId}_base`,
        projectId: project.id,
        momentId: mId,
        dataUrl: m.photoBase64,
        caption: (m as any).notes || m.comment || 'Momentfoto',
        capturedAt: m.completedAt || new Date().toISOString(),
      });
      count++;
    }
  }

  // Pre-inspection photos
  if (project.preInspectionPhotos && project.preInspectionPhotos.length > 0) {
    for (const ph of project.preInspectionPhotos) {
      if (ph && ph.id && ph.dataUrl && ph.dataUrl.length > 500) {
        const hash = await savePhotoToVault({
          id: ph.id,
          projectId: project.id,
          momentId: 'pre_inspection',
          dataUrl: ph.dataUrl,
          caption: ph.caption,
          category: 'Förbesiktning',
          capturedAt: ph.capturedAt,
          hash: ph.hash,
        });
        if (hash && !ph.hash) {
          ph.hash = hash;
          ph.hashVerified = true;
        }
        count++;
      }
    }
  }

  return count;
}

/**
 * Recovers all photos for a project from the vault and re-attaches them into the moments
 */
export async function restoreProjectFromVault(project: Project): Promise<{
  project: Project;
  restoredPhotosCount: number;
}> {
  if (!project) return { project, restoredPhotosCount: 0 };

  const vaultPhotos = await getVaultPhotosForProject(project.id);
  if (vaultPhotos.length === 0) {
    return { project, restoredPhotosCount: 0 };
  }

  const projectDeletedSet = new Set<string>((project.deletedPhotoIds || []).filter(Boolean));
  const updatedMoments: Record<string, MomentRecord> = { ...(project.moments || {}) };
  let restoredCount = 0;

  // Group vault photos by momentId
  const momentMap = new Map<string, VaultPhotoRecord[]>();
  vaultPhotos.forEach((vp) => {
    if (vp.momentId) {
      const list = momentMap.get(vp.momentId) || [];
      list.push(vp);
      momentMap.set(vp.momentId, list);
    }
  });

  for (const [mId, mPhotos] of momentMap.entries()) {
    if (mId === 'pre_inspection') continue;
    const existing = updatedMoments[mId] || {
      momentId: mId,
      status: 'GREEN',
      comment: '',
      signature: '',
      photos: [],
      completedAt: new Date().toISOString(),
    };

    const momentDeletedSet = new Set<string>([
      ...(existing.deletedPhotoIds || []),
      ...Array.from(projectDeletedSet)
        .filter((id) => !id.includes(':') || id.startsWith(`${mId}:`))
        .map((id) => (id.includes(':') ? id.split(':')[1] : id)),
      ...Array.from(projectDeletedSet),
    ].filter(Boolean));

    const existingPhotos: MomentPhoto[] = [...(existing.photos || [])].filter(
      (p) => p && p.id && !momentDeletedSet.has(p.id) && !momentDeletedSet.has(`${mId}:${p.id}`)
    );
    const existingIds = new Set(existingPhotos.map((p) => p.id));

    mPhotos.forEach((vp) => {
      // NEVER restore photos that have been explicitly deleted
      if (momentDeletedSet.has(vp.id) || momentDeletedSet.has(`${mId}:${vp.id}`)) {
        return;
      }

      if (!existingIds.has(vp.id)) {
        existingPhotos.push({
          id: vp.id,
          dataUrl: vp.dataUrl,
          caption: vp.caption || '',
          category: vp.category || 'Kontroll',
          capturedAt: vp.capturedAt || vp.savedToVaultAt,
          hash: vp.hash,
          hashVerified: !!vp.hash,
        });
        existingIds.add(vp.id);
        restoredCount++;
      } else {
        // Check if existing was blank or placeholder
        const idx = existingPhotos.findIndex((p) => p.id === vp.id);
        if (idx !== -1 && (!existingPhotos[idx].dataUrl || existingPhotos[idx].dataUrl.length < 500)) {
          existingPhotos[idx] = {
            ...existingPhotos[idx],
            dataUrl: vp.dataUrl,
            hash: vp.hash,
            hashVerified: !!vp.hash,
          };
          restoredCount++;
        }
      }
    });

    const firstGood = existingPhotos.find((p) => p.dataUrl && p.dataUrl.length > 500);

    updatedMoments[mId] = {
      ...existing,
      photos: existingPhotos,
      photoBase64: firstGood ? firstGood.dataUrl : (existingPhotos.length === 0 ? undefined : existing.photoBase64),
      deletedPhotoIds: Array.from(momentDeletedSet),
    };
  }

  const updatedProject: Project = {
    ...project,
    moments: updatedMoments,
    deletedPhotoIds: Array.from(projectDeletedSet),
  };

  return { project: updatedProject, restoredPhotosCount: restoredCount };
}
