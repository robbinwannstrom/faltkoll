import { MomentPhoto } from '../types';
import { safeFetchJson } from './apiHelper';

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
export async function processSyncQueue(): Promise<{ succeeded: number; failed: number }> {
  if (isProcessingQueue) return { succeeded: 0, failed: 0 };
  if (!navigator.onLine) {
    currentSyncStatus.isOnline = false;
    notifyListeners();
    return { succeeded: 0, failed: 0 };
  }

  isProcessingQueue = true;
  currentSyncStatus.isSyncing = true;
  currentSyncStatus.isOnline = true;
  notifyListeners();

  let succeeded = 0;
  let failed = 0;

  try {
    const queue = await getAllQueuedItems();
    if (queue.length === 0) {
      currentSyncStatus.pendingCount = 0;
      currentSyncStatus.isSyncing = false;
      notifyListeners();
      isProcessingQueue = false;
      return { succeeded: 0, failed: 0 };
    }

    for (const item of queue) {
      // Don't overwhelm network with too many consecutive retries if rapidly failing
      item.status = 'SYNCING';
      item.attempts = (item.attempts || 0) + 1;
      item.lastAttemptAt = new Date().toISOString();
      await updateQueuedItem(item);

      try {
        const res = await safeFetchJson<{ ok: boolean; error?: string }>('/api/sync/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photo: item.photo,
            projectId: item.projectId,
            momentId: item.momentId,
          }),
          timeoutMs: 6000,
        });

        if (res && res.ok) {
          await removeQueuedItem(item.id);
          succeeded++;
          currentSyncStatus.syncedCount++;
          currentSyncStatus.lastSyncedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
          currentSyncStatus.lastError = null;
        } else {
          item.status = 'FAILED';
          item.errorMessage = res?.error || 'Serverfel vid fotouppladdning';
          await updateQueuedItem(item);
          failed++;
        }
      } catch (err: any) {
        item.status = 'FAILED';
        item.errorMessage = err?.message || 'Nätverksfel vid fotouppladdning';
        await updateQueuedItem(item);
        failed++;
        currentSyncStatus.lastError = item.errorMessage || null;
      }
    }
  } catch (err: any) {
    console.warn('Queue processing error:', err);
    currentSyncStatus.lastError = err?.message || 'Fel i synkkö';
  } finally {
    isProcessingQueue = false;
    currentSyncStatus.isSyncing = false;
    await refreshQueueCount();
  }

  return { succeeded, failed };
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
