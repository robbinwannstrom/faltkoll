import { MomentPhoto, Project, MomentRecord } from '../types';
import { safeFetchJson } from './apiHelper';
import { db, canWriteToFirestore } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface QueuedPhotoItem {
  id: string; // Queue ID: e.g. "q_ph_123"
  photoId: string;
  projectId: string;
  momentId?: string;
  photo: MomentPhoto;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'SYNCED';
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncedCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

const DB_NAME = 'FaltKoll_PhotoSyncQueue_v2';
const DB_VERSION = 1;
const STORE_QUEUE = 'photo_queue';
const STORE_CACHE = 'photo_cache';

let dbInstance: IDBDatabase | null = null;
let isProcessingQueue = false;
let syncListeners: Array<(status: SyncStatus) => void> = [];

let currentSyncStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  syncedCount: 0,
  lastSyncedAt: null,
  lastError: null,
};

function notifyListeners() {
  const statusCopy = { ...currentSyncStatus };
  syncListeners.forEach((fn) => {
    try {
      fn(statusCopy);
    } catch (e) {
      console.warn('Sync status listener error:', e);
    }
  });
}

function openSyncDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB inte tillgänglig'));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Cache photo in permanent local storage so it can never be lost
 * during memory cleanup or app restart.
 */
export async function cachePhotoLocally(photo: MomentPhoto): Promise<void> {
  if (!photo || !photo.id || !photo.dataUrl) return;
  try {
    const db = await openSyncDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      const store = tx.objectStore(STORE_CACHE);
      store.put({
        id: photo.id,
        dataUrl: photo.dataUrl,
        caption: photo.caption || '',
        category: photo.category || 'Kontroll',
        capturedAt: photo.capturedAt || '',
        cachedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not cache photo to IndexedDB:', err);
  }
}

/**
 * Retrieve cached photo by ID
 */
export async function getPhotoFromLocalCache(photoId: string): Promise<string | null> {
  if (!photoId) return null;
  try {
    const db = await openSyncDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get(photoId);
      req.onsuccess = () => {
        resolve(req.result ? req.result.dataUrl : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export const getCachedPhoto = getPhotoFromLocalCache;

/**
 * Add a photo to the persistent sync queue
 */
export async function enqueuePhotoForSync(
  photo: MomentPhoto,
  projectId: string,
  momentId?: string
): Promise<void> {
  if (!photo || !photo.id || !photo.dataUrl) return;

  // 1. Always cache immediately in IndexedDB
  await cachePhotoLocally(photo);

  // 2. Put into persistent upload queue
  const queueItem: QueuedPhotoItem = {
    id: `queue_${photo.id}`,
    photoId: photo.id,
    projectId,
    momentId,
    photo,
    status: 'PENDING',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await openSyncDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      store.put(queueItem);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not enqueue photo in IndexedDB:', err);
  }

  await refreshQueueCount();

  // 3. If online, trigger background sync immediately
  if (navigator.onLine) {
    processSyncQueue().catch(() => {});
  }
}

/**
 * Count pending queue items
 */
export async function refreshQueueCount(): Promise<number> {
  try {
    const db = await openSyncDB();
    const count = await new Promise<number>((resolve) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
    currentSyncStatus.pendingCount = count;
    notifyListeners();
    return count;
  } catch {
    return 0;
  }
}

/**
 * Get all queued items
 */
async function getAllQueuedItems(): Promise<QueuedPhotoItem[]> {
  try {
    const db = await openSyncDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Remove an item from the queue once successfully uploaded to the cloud
 */
async function removeQueuedItem(id: string): Promise<void> {
  try {
    const db = await openSyncDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not remove item from sync queue:', err);
  }
}

/**
 * Update an item's status in the queue
 */
async function updateQueuedItem(item: QueuedPhotoItem): Promise<void> {
  try {
    const db = await openSyncDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/**
 * Process all pending items in the sync queue with auto-retry
 */
export async function processSyncQueue(): Promise<{
  succeeded: number;
  failed: number;
  errors: string[];
}> {
  if (isProcessingQueue) return { succeeded: 0, failed: 0, errors: [] };
  if (!navigator.onLine) {
    currentSyncStatus.isOnline = false;
    currentSyncStatus.lastError = 'Enheten är offline (saknar internetanslutning).';
    notifyListeners();
    return { succeeded: 0, failed: 0, errors: ['Enheten är offline'] };
  }

  isProcessingQueue = true;
  currentSyncStatus.isSyncing = true;
  currentSyncStatus.isOnline = true;
  notifyListeners();

  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const queue = await getAllQueuedItems();
    if (queue.length === 0) {
      currentSyncStatus.pendingCount = 0;
      currentSyncStatus.isSyncing = false;
      notifyListeners();
      isProcessingQueue = false;
      return { succeeded: 0, failed: 0, errors: [] };
    }

    for (const item of queue) {
      item.status = 'SYNCING';
      item.attempts = (item.attempts || 0) + 1;
      item.lastAttemptAt = new Date().toISOString();
      await updateQueuedItem(item);

      let uploadSucceeded = false;
      let failureReason = '';

      // 1. Try upload to Express server storage (/api/sync/photos)
      try {
        const res = await safeFetchJson<{ ok: boolean; error?: string }>('/api/sync/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photo: item.photo,
            projectId: item.projectId,
            momentId: item.momentId,
          }),
          timeoutMs: 30000,
        });

        if (res && res.ok) {
          uploadSucceeded = true;
        } else {
          failureReason = res?.error || 'Serverfel vid fotouppladdning';
        }
      } catch (err: any) {
        failureReason = err?.message || 'Nätverksfel vid kontakt med Express-servern';
      }

      // 2. Also try Firestore subcollection if Firestore is available and write quota is not exceeded
      if (canWriteToFirestore() && db && item.projectId) {
        try {
          const photoDocRef = doc(db, 'projects', item.projectId, 'photos', item.photo.id);
          await setDoc(
            photoDocRef,
            {
              id: item.photo.id,
              projectId: item.projectId,
              momentId: item.momentId || '',
              dataUrl: item.photo.dataUrl,
              capturedAt: item.photo.capturedAt || '',
              category: item.photo.category || 'Kontroll',
              caption: item.photo.caption || '',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          uploadSucceeded = true;
        } catch (fErr: any) {
          console.debug('Firestore subcollection sync notice:', fErr);
        }
      }

      if (uploadSucceeded) {
        // Success: safely remove from upload queue (original is still in local photo_cache & photo_vault)
        await removeQueuedItem(item.id);
        succeeded++;
        currentSyncStatus.syncedCount++;
        currentSyncStatus.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        currentSyncStatus.lastError = null;
      } else {
        // Failure: KEEP the photo safely in queue and IndexedDB cache
        item.status = 'FAILED';
        item.errorMessage = failureReason || 'Uppladdningen misslyckades';
        await updateQueuedItem(item);
        failed++;
        if (item.errorMessage) {
          errors.push(item.errorMessage);
          currentSyncStatus.lastError = item.errorMessage;
        }
      }
    }
  } catch (err: any) {
    console.warn('Queue processing error:', err);
    currentSyncStatus.lastError = err?.message || 'Fel i synkkö';
    if (currentSyncStatus.lastError) {
      errors.push(currentSyncStatus.lastError);
    }
  } finally {
    isProcessingQueue = false;
    currentSyncStatus.isSyncing = false;
    await refreshQueueCount();
  }

  return { succeeded, failed, errors };
}

/**
 * Subscribe to real-time sync queue status
 */
export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncListeners.push(listener);
  listener({ ...currentSyncStatus });
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
}

export function getSyncStatus(): SyncStatus {
  return { ...currentSyncStatus };
}

// Background network listeners & heartbeat setup
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentSyncStatus.isOnline = true;
    notifyListeners();
    processSyncQueue().catch(() => {});
  });

  window.addEventListener('offline', () => {
    currentSyncStatus.isOnline = false;
    currentSyncStatus.isSyncing = false;
    notifyListeners();
  });

  // Check queue count and trigger background sync heartbeat every 12 seconds
  setInterval(() => {
    if (navigator.onLine && !isProcessingQueue) {
      refreshQueueCount().then((count) => {
        if (count > 0) {
          processSyncQueue().catch(() => {});
        }
      });
    }
  }, 12000);

  // Initial check on module load
  setTimeout(() => {
    refreshQueueCount().then((count) => {
      if (count > 0 && navigator.onLine) {
        processSyncQueue().catch(() => {});
      }
    });
  }, 2000);
}

/**
 * Retrieve all cached photos stored in offline IndexedDB
 */
export async function getAllCachedPhotos(): Promise<Record<string, { id: string; dataUrl: string; caption?: string; category?: string; capturedAt?: string }>> {
  try {
    const db = await openSyncDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.getAll();
      req.onsuccess = () => {
        const result: Record<string, any> = {};
        if (Array.isArray(req.result)) {
          for (const item of req.result) {
            if (item && item.id) {
              result[item.id] = item;
            }
          }
        }
        resolve(result);
      };
      req.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

/**
 * Dequeue and un-cache a deleted photo so background sync queue never uploads it
 */
export async function dequeuePhotoFromSync(photoId: string): Promise<void> {
  if (!photoId) return;
  try {
    const db = await openSyncDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE, STORE_CACHE], 'readwrite');
      const queueStore = tx.objectStore(STORE_QUEUE);
      const cacheStore = tx.objectStore(STORE_CACHE);
      queueStore.delete(`queue_${photoId}`);
      cacheStore.delete(photoId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await refreshQueueCount();
  } catch (err) {
    console.warn('Could not dequeue deleted photo from offline sync queue:', err);
  }
}

/**
 * Safely recovers and re-attaches high-resolution photo dataUrls from the local IndexedDB cache
 * if any photos were ever blanked, lost during sync, or misplaced.
 * Strictly respects deletedPhotoIds so deleted photos are NEVER resurrected.
 */
export async function autoRecoverProjectPhotosFromCache(project: Project): Promise<Project> {
  if (!project || !project.moments) return project;
  try {
    const db = await openSyncDB();
    const cachedMap = await new Promise<Map<string, any>>((resolve) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.getAll();
      req.onsuccess = () => {
        const m = new Map<string, any>();
        if (Array.isArray(req.result)) {
          for (const item of req.result) {
            if (item && item.id && item.dataUrl) {
              m.set(item.id, item);
            }
          }
        }
        resolve(m);
      };
      req.onerror = () => resolve(new Map());
    });

    if (cachedMap.size === 0) return project;

    const projectDeletedSet = new Set<string>((project.deletedPhotoIds || []).filter(Boolean));
    let modified = false;
    const updatedMoments: Record<string, MomentRecord> = { ...project.moments };

    for (const [mId, mom] of Object.entries(updatedMoments)) {
      if (mom && mom.photos && mom.photos.length > 0) {
        const momDeletedSet = new Set<string>([
          ...Array.from(projectDeletedSet),
          ...(mom.deletedPhotoIds || []),
        ].filter(Boolean));

        const nonDeletedPhotos = mom.photos.filter(
          (p) => p && p.id && !momDeletedSet.has(p.id) && !momDeletedSet.has(`${mId}:${p.id}`)
        );

        if (nonDeletedPhotos.length !== mom.photos.length) {
          modified = true;
        }

        const newPhotos = nonDeletedPhotos.map((p) => {
          if (!p.dataUrl || p.dataUrl.length < 500) {
            const cached = cachedMap.get(p.id);
            if (cached && cached.dataUrl && !momDeletedSet.has(p.id)) {
              modified = true;
              return {
                ...p,
                dataUrl: cached.dataUrl,
                caption: p.caption || cached.caption || '',
                category: p.category || cached.category || 'Kontroll',
                capturedAt: p.capturedAt || cached.capturedAt || '',
              };
            }
          }
          return p;
        });

        if (modified) {
          const firstGood = newPhotos.find((ph) => ph.dataUrl && ph.dataUrl.length > 500);
          updatedMoments[mId] = {
            ...mom,
            photos: newPhotos,
            photoBase64: firstGood?.dataUrl || (newPhotos.length === 0 ? undefined : mom.photoBase64),
            deletedPhotoIds: Array.from(momDeletedSet),
          };
        }
      }
    }

    if (modified) {
      return {
        ...project,
        moments: updatedMoments,
        deletedPhotoIds: Array.from(projectDeletedSet),
      };
    }
  } catch (e) {
    console.debug('autoRecoverProjectPhotosFromCache notice:', e);
  }
  return project;
}

