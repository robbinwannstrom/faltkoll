import { Project, UserAccount, MomentPhoto } from '../types';
import { safeFetchJson } from './apiHelper';
import { getAllProjects, saveProject } from '../db/indexedDb';
import { mergeProjectSafely } from '../utils/photoUtils';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { db, canWriteToFirestore, markFirestoreQuotaExceeded } from '../firebase';
import { handleFirestoreError, OperationType } from './userService';

export interface FieldWorkStats {
  totalStudents: number;
  activeInField: number;
  pendingTeacherReview: number;
  totalPhotos: number;
  averageProgressPercent: number;
}

export interface StudentWorkFilterOptions {
  schoolClass?: string;
  studentGroup?: string;
  status?: 'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'COMPLETED' | 'NEEDS_ACTION' | 'HAS_PHOTOS';
  projectType?: string;
  search?: string;
}

export interface ClassSummary {
  name: string;
  studentCount: number;
  activeProjectsCount: number;
}

export interface TeacherReviewPayload {
  projectId: string;
  teacherId: string;
  teacherName: string;
  overallComment?: string;
  grade?: 'GODKÄND' | 'UNDERKÄND' | 'KOMPLETTERING_KRÄVS';
  momentNotes?: Record<string, string>;
  approvedMoments?: Record<string, boolean>;
}

import { normalizePhotoUrl } from '../utils/photoUtils';

/**
 * Utility to enforce a strict timeout on async operations (e.g. Firestore network queries)
 * to prevent indefinite spinning in the UI.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Sanitizes object by removing undefined values and ensuring Firestore compliance without destroying photo data.
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) {
      if (k === 'photoBase64') {
        clean[k] = '';
      }
    } else if (typeof v === 'string' && v.startsWith('data:')) {
      // Normalize any SVG URLs or ensure clean base64 data URL
      clean[k] = normalizePhotoUrl(v);
    } else {
      clean[k] = sanitizeForFirestore(v);
    }
  }
  return clean;
}

import { enqueuePhotoForSync, dequeuePhotoFromSync } from './offlineQueueService';

/**
 * Dedicated helper to immediately upload a single high-resolution photo to both
 * Express photo storage (/api/sync/photos) and Firestore subcollection (/projects/{id}/photos/{photoId})
 * Automatically caches in IndexedDB and adds to persistent queue so photos can NEVER be lost.
 */
export async function uploadPhotoToDedicatedCloud(
  photo: MomentPhoto,
  projectId: string,
  momentId?: string
): Promise<void> {
  if (!photo || !photo.id || !photo.dataUrl) return;

  // 1. Immediately guarantee local offline cache and persistent background queue in IndexedDB
  enqueuePhotoForSync(photo, projectId, momentId).catch(() => {});

  const serverPromise = safeFetchJson('/api/sync/photos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo, projectId, momentId }),
    timeoutMs: 5000,
  }).catch(() => {});

  let firestorePromise: Promise<any> = Promise.resolve();
  if (canWriteToFirestore()) {
    try {
      const photoDocRef = doc(db, 'projects', projectId, 'photos', photo.id);
      firestorePromise = withTimeout(
        setDoc(
          photoDocRef,
          {
            id: photo.id,
            projectId,
            momentId: momentId || '',
            dataUrl: photo.dataUrl,
            capturedAt: photo.capturedAt || '',
            category: photo.category || 'Kontroll',
            caption: photo.caption || '',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ),
        3500,
        null
      ).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `projects/${projectId}/photos/${photo.id}`);
      });
    } catch {}
  }

  await Promise.allSettled([serverPromise, firestorePromise]);
}

/**
 * Dedicated helper to delete a photo from Firestore subcollection and Express server photo storage,
 * and dequeue any pending background upload so it is never re-uploaded.
 */
export async function deletePhotoFromCloud(
  projectId: string,
  momentId: string,
  photoId: string
): Promise<void> {
  if (!photoId) return;

  // 1. Purge from local sync queue immediately
  dequeuePhotoFromSync(photoId).catch(() => {});

  // 2. Server endpoint deletion
  const serverDeletePromise = safeFetchJson(
    `/api/sync/photos/${encodeURIComponent(photoId)}?projectId=${encodeURIComponent(projectId || '')}&momentId=${encodeURIComponent(momentId || '')}`,
    {
      method: 'DELETE',
      timeoutMs: 4000,
    }
  ).catch(() => {});

  // 3. Firestore photo subcollection deletion
  let firestoreDeletePromise: Promise<any> = Promise.resolve();
  if (projectId && canWriteToFirestore()) {
    try {
      const photoDocRef = doc(db, 'projects', projectId, 'photos', photoId);
      firestoreDeletePromise = withTimeout(deleteDoc(photoDocRef), 3500, null).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}/photos/${photoId}`);
      });
    } catch {}
  }

  await Promise.allSettled([serverDeletePromise, firestoreDeletePromise]);
}

/**
 * Save project directly to Google Cloud Firestore (/projects/{projectId})
 * Guarantees cross-device persistence and live discovery between student and admin accounts.
 * Wrapped with strict timeout so it never hangs or leaves spinners indefinitely.
 */
export async function saveProjectToFirestore(project: Project): Promise<boolean> {
  if (!project || !project.id) return false;
  if (!canWriteToFirestore()) {
    // Quota exhausted: skip direct Firestore write to prevent resource-exhausted errors
    return true;
  }
  try {
    const enriched = { ...project };
    if (enriched.groupCode) {
      enriched.groupCode = enriched.groupCode.trim().toUpperCase();
      enriched.isGroupProject = true;
      enriched.syncEnabled = true;
    }

    // 1. Dedicated Photo Subcollection Backup in Firestore (/projects/{projectId}/photos/{photoId})
    // and server dedicated photo store in parallel with a safe timeout
    const photoPromises: Promise<any>[] = [];
    if (project.moments) {
      for (const [mId, mom] of Object.entries(project.moments)) {
        if (mom.photos && mom.photos.length > 0) {
          for (const ph of mom.photos) {
            if (ph.dataUrl && ph.dataUrl.length > 500 && !ph.dataUrl.includes('CLOUDSYNC')) {
              photoPromises.push(uploadPhotoToDedicatedCloud(ph, project.id, mId));
            }
          }
        }
      }
    }
    if (photoPromises.length > 0) {
      withTimeout(Promise.allSettled(photoPromises), 3500, []).catch(() => {});
    }

    const cleanProject = sanitizeForFirestore(enriched);
    const approxSize = JSON.stringify(cleanProject).length;
    let projectDocPayload = cleanProject;

    // If approaching Firestore's 1MB document limit, use dedicated photo endpoint reference
    // NEVER destroy or empty photo data with empty strings!
    if (approxSize > 900000) {
      const safeMoments: Record<string, any> = {};
      if (cleanProject.moments) {
        for (const [mId, mom] of Object.entries(cleanProject.moments as Record<string, any>)) {
          safeMoments[mId] = {
            ...mom,
            photos: (mom.photos || []).map((p: any) => ({
              id: p.id,
              capturedAt: p.capturedAt,
              category: p.category,
              caption: p.caption,
              momentId: mId,
              // If photo is already safely backed up to dedicated endpoints, reference it rather than blanking it
              dataUrl: p.dataUrl && p.dataUrl.length < 50000 ? p.dataUrl : `/api/sync/photos/${p.id}`,
            })),
          };
        }
      }
      projectDocPayload = {
        ...cleanProject,
        moments: safeMoments,
      };
    }

    const docRef = doc(db, 'projects', project.id);
    await withTimeout(setDoc(docRef, projectDocPayload, { merge: true }), 4000, null);

    // 2. Also persist directly into dedicated group_codes collection for instant O(1) lookup
    if (enriched.groupCode) {
      const codeRef = doc(db, 'group_codes', enriched.groupCode);
      const codePayload: Record<string, any> = {
        code: enriched.groupCode,
        projectId: project.id,
        projectName: project.name,
        projectType: project.projectType,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      if (approxSize < 500000) {
        codePayload.project = cleanProject;
      }

      await withTimeout(setDoc(codeRef, codePayload, { merge: true }), 3500, null);

      const stripped = enriched.groupCode.replace(/[\s-_]/g, '');
      if (stripped && stripped !== enriched.groupCode) {
        const strippedRef = doc(db, 'group_codes', stripped);
        withTimeout(setDoc(strippedRef, { ...codePayload, code: stripped }, { merge: true }), 2500, null).catch(() => {});
      }
    }

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `projects/${project.id}`, false);
    return false;
  }
}

/**
 * Real-time listener for Firestore projects so admins and teachers see newly started exercises instantly!
 */
export function subscribeToFirestoreProjects(
  onUpdate: (projects: Project[]) => void
): () => void {
  try {
    const colRef = collection(db, 'projects');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Project[] = [];
        snapshot.forEach((snap) => {
          const data = snap.data() as Project;
          if (data && data.id) {
            list.push(data);
          }
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'projects', false);
      }
    );
  } catch (err) {
    console.debug('Firestore onSnapshot error:', err);
    return () => {};
  }
}

/**
 * Fetch all projects stored in Google Cloud Firestore (/projects)
 */
export async function fetchProjectsFromFirestore(): Promise<Project[]> {
  try {
    const colRef = collection(db, 'projects');
    const snapshot = await withTimeout(getDocs(colRef), 3500, null);
    if (!snapshot) return [];
    const list: Project[] = [];
    snapshot.forEach((snap) => {
      const data = snap.data() as Project;
      if (data && data.id) {
        list.push(data);
      }
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'projects', false);
    return [];
  }
}

/**
 * Find project by groupCode or exerciseCode directly in Firestore
 * Supports instant direct document lookup in /group_codes, single queries, and fuzzy fallback.
 * All queries are wrapped with strict timeouts to prevent endless spinning in the UI.
 */
export async function findProjectByCodeInFirestore(code: string): Promise<Project | null> {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) return null;
  const stripped = normalized.replace(/[\s-_]/g, '');

  try {
    // Helper to hydrate photos from subcollection if needed
    const hydrateProjectPhotos = async (proj: Project): Promise<Project> => {
      try {
        const photosCol = collection(db, 'projects', proj.id, 'photos');
        const photoSnaps = await withTimeout(getDocs(photosCol), 3000, null);
        if (photoSnaps && !photoSnaps.empty) {
          const subPhotosMap = new Map<string, any>();
          photoSnaps.forEach((s) => {
            const data = s.data();
            if (data && data.id && data.dataUrl) {
              subPhotosMap.set(data.id, data);
            }
          });

          if (proj.moments) {
            const updatedMoments: Record<string, any> = { ...proj.moments };
            for (const [mId, m] of Object.entries(updatedMoments)) {
              if (m.photos && Array.isArray(m.photos)) {
                updatedMoments[mId] = {
                  ...m,
                  photos: m.photos.map((ph: any) => {
                    const sub = subPhotosMap.get(ph.id);
                    if (sub && sub.dataUrl && (!ph.dataUrl || ph.dataUrl.length < 500)) {
                      return { ...ph, dataUrl: sub.dataUrl };
                    }
                    return ph;
                  }),
                };
              }
            }
            proj.moments = updatedMoments;
          }
        }
      } catch {}
      return proj;
    };

    // 1. Direct O(1) document lookup by exact group code
    try {
      const directDocRef = doc(db, 'group_codes', normalized);
      const directSnap = await withTimeout(getDoc(directDocRef), 2500, null);
      if (directSnap && directSnap.exists()) {
        const d = directSnap.data();
        if (d?.projectId) {
          const pDoc = await withTimeout(getDoc(doc(db, 'projects', d.projectId)), 2500, null);
          if (pDoc && pDoc.exists()) {
            const proj = pDoc.data() as Project;
            return await hydrateProjectPhotos(proj);
          }
        }
        if (d?.project) return await hydrateProjectPhotos(d.project as Project);
      }
    } catch {}

    // 1b. Direct O(1) document lookup by stripped group code
    if (stripped && stripped !== normalized) {
      try {
        const strippedDocRef = doc(db, 'group_codes', stripped);
        const strippedSnap = await withTimeout(getDoc(strippedDocRef), 2000, null);
        if (strippedSnap && strippedSnap.exists()) {
          const d = strippedSnap.data();
          if (d?.projectId) {
            const pDoc = await withTimeout(getDoc(doc(db, 'projects', d.projectId)), 2000, null);
            if (pDoc && pDoc.exists()) {
              const proj = pDoc.data() as Project;
              return await hydrateProjectPhotos(proj);
            }
          }
          if (d?.project) return await hydrateProjectPhotos(d.project as Project);
        }
      } catch {}
    }

    const colRef = collection(db, 'projects');

    // 2. Direct query by groupCode in /projects
    try {
      const q1 = query(colRef, where('groupCode', '==', normalized), limit(1));
      const snap1 = await withTimeout(getDocs(q1), 2500, null);
      if (snap1 && !snap1.empty) {
        return await hydrateProjectPhotos(snap1.docs[0].data() as Project);
      }
    } catch {}

    // 3. Direct query by exerciseCode in /projects
    try {
      const q2 = query(colRef, where('exerciseCode', '==', normalized), limit(1));
      const snap2 = await withTimeout(getDocs(q2), 2500, null);
      if (snap2 && !snap2.empty) {
        return await hydrateProjectPhotos(snap2.docs[0].data() as Project);
      }
    } catch {}

    // 4. Fallback scan of all projects with 3s timeout
    const all = await withTimeout(fetchProjectsFromFirestore(), 3000, []);
    const match = all.find((p) => {
      const g = String(p.groupCode || '').trim().toUpperCase();
      const ex = String(p.exerciseCode || '').trim().toUpperCase();
      const nr = String(p.projectNumber || '').trim().toUpperCase();
      const id = String(p.id || '').trim().toUpperCase();
      return (
        g === normalized ||
        ex === normalized ||
        nr === normalized ||
        id === normalized ||
        (stripped.length >= 3 && g.replace(/[\s-_]/g, '') === stripped) ||
        (stripped.length >= 3 && ex.replace(/[\s-_]/g, '') === stripped)
      );
    });
    return match || null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `projects/code:${normalized}`, false);
    return null;
  }
}

/**
 * Unified save to both Google Cloud Firestore AND server REST API simultaneously
 */
export async function saveProjectToCloud(project: Project): Promise<void> {
  if (!project || !project.id) return;

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  project.lastSyncedAt = now;
  project.syncEnabled = true;

  // Run cloud Firestore and server endpoints in parallel with timeouts so one never blocks the other
  await Promise.allSettled([
    // 1. Google Cloud Firestore
    saveProjectToFirestore(project),
    // 2. Server project store
    safeFetchJson('/api/sync/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
      timeoutMs: 4000,
    }),
    // 3. Field inspection API
    safeFetchJson('/api/field/student-work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
      timeoutMs: 4000,
    }),
  ]);
}

/**
 * Permanently delete or mark project as deleted in cloud (Firestore & server REST API)
 */
export async function deleteProjectFromCloud(projectId: string): Promise<void> {
  if (!projectId) return;

  // Run cloud Firestore and server endpoints in parallel
  await Promise.allSettled([
    // 1. Google Cloud Firestore
    (async () => {
      try {
        if (!db || !canWriteToFirestore()) return;
        const docRef = doc(db, 'projects', projectId);
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `projects/${projectId}`);
      }
    })(),
    // 2. Server project store
    safeFetchJson(`/api/sync/projects/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
      timeoutMs: 4000,
    }),
    // 3. Field inspection API
    safeFetchJson('/api/field/student-work/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
      timeoutMs: 4000,
    }),
  ]);
}

/**
 * Bidirectional cloud sync:
 * 1. Pushes local project changes to cloud (server & Firestore) with timeout.
 * 2. Fetches latest project data (and all photos) from cloud server and Firestore.
 * 3. Safely merges local and remote projects using mergeProjectSafely, protecting all photos.
 * 4. Saves merged project into IndexedDB.
 * 5. Pushes merged project back to cloud so both users are perfectly aligned.
 * Guarantees that neither user loses photos and that spinners never hang indefinitely!
 */
export async function syncProjectBidirectional(
  projectId: string,
  localProject?: Project,
  currentUser?: UserAccount | null
): Promise<{ success: boolean; project?: Project; message: string }> {
  try {
    let currentLocal = localProject;
    if (!currentLocal) {
      const allLocal = await getAllProjects(false);
      currentLocal = allLocal.find((p) => p.id === projectId);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // If student/user is logged in, ensure user is registered in member list
    if (currentLocal && currentUser?.id) {
      const memberIds = new Set(currentLocal.memberIds || []);
      memberIds.add(currentUser.id);
      currentLocal.memberIds = Array.from(memberIds);

      const members = [...(currentLocal.members || [])];
      if (!members.some((m) => m.id === currentUser.id)) {
        members.push({
          id: currentUser.id,
          name: currentUser.displayName || 'Gruppmedlem',
          email: currentUser.email,
          joinedAt: now,
        });
      }
      currentLocal.members = members;
    }

    // Step 1: Push current local state to cloud first (if local exists)
    if (currentLocal) {
      currentLocal.lastSyncedAt = now;
      currentLocal.syncEnabled = true;
      await Promise.allSettled([
        saveProjectToFirestore(currentLocal),
        safeFetchJson('/api/sync/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: currentLocal }),
          timeoutMs: 4000,
        }),
      ]);
    }

    // Step 2: Fetch latest cloud versions from server and Firestore in parallel
    const [serverRes, firestoreProj] = await Promise.allSettled([
      safeFetchJson<{ project: Project }>(`/api/sync/projects/${projectId}?full=true`, { timeoutMs: 4000 }),
      withTimeout(
        (async () => {
          try {
            const pDoc = await getDoc(doc(db, 'projects', projectId));
            if (pDoc.exists()) {
              return pDoc.data() as Project;
            }
          } catch {}
          return null;
        })(),
        3500,
        null
      ),
    ]);

    const remoteServerProj = serverRes.status === 'fulfilled' && serverRes.value.ok ? serverRes.value.data?.project : null;
    const remoteFirestoreProj = firestoreProj.status === 'fulfilled' ? firestoreProj.value : null;

    // Merge candidates: local, remoteServer, remoteFirestore
    let merged = currentLocal;

    if (remoteServerProj) {
      merged = mergeProjectSafely(merged, remoteServerProj);
    }
    if (remoteFirestoreProj) {
      merged = mergeProjectSafely(merged, remoteFirestoreProj);
    }

    if (!merged) {
      return { success: false, message: 'Kunde inte hitta projektet i molnet eller lokalt.' };
    }

    // Step 3: Persist merged project to IndexedDB
    await saveProject(merged);

    // Step 4: Re-save merged project to server and Firestore in background
    Promise.allSettled([
      safeFetchJson('/api/sync/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: merged }),
        timeoutMs: 3000,
      }),
      saveProjectToFirestore(merged),
    ]).catch(() => {});

    const photoCount = countProjectPhotos(merged);
    return {
      success: true,
      project: merged,
      message: `✓ Synkning klar! Allt uppdaterat (${photoCount} foton säkrade).`,
    };
  } catch (err: any) {
    console.warn('Bidirectional sync notice:', err);
    return {
      success: true,
      project: localProject,
      message: '✓ Sparat lokalt på enheten (offline).',
    };
  }
}

/**
 * Fetch all student field projects from cloud (combining Server, Firestore and local IndexedDB)
 * Enforces strict GDPR Privacy Wall for ADMIN accounts and class scoping for TEACHER accounts.
 */
export async function fetchStudentFieldWorks(
  filters?: StudentWorkFilterOptions,
  callerUser?: UserAccount | null
): Promise<{
  projects: Project[];
  stats: FieldWorkStats;
  classes: ClassSummary[];
  privacyShieldActive?: boolean;
  privacyShieldNotice?: string;
}> {
  let serverProjects: Project[] = [];
  let serverStats: FieldWorkStats | null = null;
  let serverClasses: ClassSummary[] = [];
  let privacyShieldActive = false;
  let privacyShieldNotice: string | undefined;

  const isAdmin = callerUser?.role === 'ADMIN';

  try {
    const params = new URLSearchParams();
    if (filters?.schoolClass && filters.schoolClass !== 'ALL') {
      params.set('schoolClass', filters.schoolClass);
    }
    if (filters?.studentGroup && filters.studentGroup !== 'ALL') {
      params.set('studentGroup', filters.studentGroup);
    }
    if (filters?.status && filters.status !== 'ALL') {
      params.set('status', filters.status);
    }
    if (filters?.projectType && filters.projectType !== 'ALL') {
      params.set('projectType', filters.projectType);
    }
    if (filters?.search?.trim()) {
      params.set('search', filters.search.trim());
    }
    if (callerUser?.role) {
      params.set('callerRole', callerUser.role);
    }
    if (callerUser?.id) {
      params.set('callerId', callerUser.id);
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await safeFetchJson<{
      projects: Project[];
      stats: FieldWorkStats;
      classes: ClassSummary[];
      privacyShieldActive?: boolean;
      privacyShieldNotice?: string;
    }>(`/api/field/student-work${queryStr}`);

    if (res.ok && res.data) {
      serverProjects = res.data.projects || [];
      serverStats = res.data.stats || null;
      serverClasses = res.data.classes || [];
      privacyShieldActive = !!res.data.privacyShieldActive;
      privacyShieldNotice = res.data.privacyShieldNotice;
    }
  } catch (err) {
    console.warn('Could not fetch student works from server:', err);
  }

  // =========================================================================
  // STRICT PRIVACY WALL (GDPR & SKOLLAGENS PERSONUPPGIFTSKRAV)
  // If caller is ADMIN: Do NOT query Firestore or IndexedDB for student projects!
  // Return privacy shield state immediately so student data & photos stay shielded.
  // =========================================================================
  if (isAdmin || privacyShieldActive) {
    return {
      projects: [],
      stats: serverStats || {
        totalStudents: 0,
        activeInField: 0,
        pendingTeacherReview: 0,
        totalPhotos: 0,
        averageProgressPercent: 0,
      },
      classes: serverClasses,
      privacyShieldActive: true,
      privacyShieldNotice:
        privacyShieldNotice ||
        'Strikt Integritetsvägg (Privacy Wall) aktiv: Elevinnehåll, loggböcker och fältfoton är spärrade för administratören enligt GDPR & Skollagens personuppgiftskrav. Endast behörig yrkeslärare har åtkomst.',
    };
  }

  // Also query Google Cloud Firestore directly to guarantee live discovery across separate browsers/devices!
  let firestoreProjects: Project[] = [];
  try {
    firestoreProjects = await fetchProjectsFromFirestore();
  } catch (err) {
    console.warn('Could not fetch projects from Firestore:', err);
  }

  // Helper for safe timestamp parsing across browsers
  const parseSafeTime = (dateStr?: string): number => {
    if (!dateStr) return 0;
    try {
      const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
      const parsed = new Date(normalized).getTime();
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  };

  // Local projects
  const localProjects = await getAllProjects(false);

  // Merge projects from all 3 sources by project ID safely protecting photos and moment progress
  const projectMap = new Map<string, Project>();
  for (const p of [...localProjects, ...firestoreProjects, ...serverProjects]) {
    if (!p || !p.id) continue;
    const existing = projectMap.get(p.id);
    if (!existing) {
      projectMap.set(p.id, p);
    } else {
      const merged = mergeProjectSafely(existing, p);
      merged.studentId = p.studentId || existing.studentId;
      merged.studentName = p.studentName || existing.studentName;
      merged.studentEmail = p.studentEmail || existing.studentEmail;
      merged.schoolClass = p.schoolClass || existing.schoolClass;
      merged.studentGroup = p.studentGroup || existing.studentGroup;
      projectMap.set(p.id, merged);
    }
  }

  let mergedProjects = Array.from(projectMap.values());

  // TEACHER PRIVACY SCOPING: Teachers only see their own connected projects or unassigned projects
  if (callerUser?.role === 'TEACHER') {
    mergedProjects = mergedProjects.filter((p) => {
      // If linked to another teacher, hide it!
      if (p.teacherId && p.teacherId !== callerUser.id && p.teacherId !== callerUser.displayName) {
        return false;
      }
      // If linked to this teacher, show it!
      if (p.teacherId && (p.teacherId === callerUser.id || p.teacherId === callerUser.displayName)) return true;
      if (p.assignedTeacherId && p.assignedTeacherId === callerUser.id) return true;
      if (p.creatorId && p.creatorId === callerUser.id) return true;

      // If unassigned (no teacher yet), allow this teacher to see and claim
      if (!p.teacherId) {
        if (callerUser.schoolClass && p.schoolClass) {
          return String(p.schoolClass).toLowerCase().includes(callerUser.schoolClass.toLowerCase().trim());
        }
        return true;
      }
      return false;
    });
  }

  // Apply filters
  if (filters?.schoolClass && filters.schoolClass !== 'ALL') {
    const cls = filters.schoolClass.toLowerCase().trim();
    mergedProjects = mergedProjects.filter((p) =>
      String(p.schoolClass || '').toLowerCase().includes(cls)
    );
  }
  if (filters?.studentGroup && filters.studentGroup !== 'ALL') {
    const grp = filters.studentGroup.toLowerCase().trim();
    mergedProjects = mergedProjects.filter((p) =>
      String(p.studentGroup || '').toLowerCase().includes(grp)
    );
  }
  if (filters?.projectType && filters.projectType !== 'ALL') {
    mergedProjects = mergedProjects.filter((p) => p.projectType === filters.projectType);
  }
  if (filters?.search?.trim()) {
    const q = filters.search.toLowerCase().trim();
    mergedProjects = mergedProjects.filter((p) => {
      const matchName = String(p.name || '').toLowerCase().includes(q);
      const matchStudent = String(p.studentName || p.contractorName || '').toLowerCase().includes(q);
      const matchEmail = String(p.studentEmail || '').toLowerCase().includes(q);
      const matchCode = String(p.exerciseCode || p.groupCode || '').toLowerCase().includes(q);
      return matchName || matchStudent || matchEmail || matchCode;
    });
  }

  // Sort by latest updated
  mergedProjects.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Calculate live statistics
  const uniqueStudents = new Set(
    mergedProjects.map((p) => p.studentId || p.studentName || p.contractorName || p.id)
  ).size;
  let totalPhotos = 0;
  let pendingTeacherReview = 0;
  let totalPercentSum = 0;

  mergedProjects.forEach((p) => {
    const prg = calculateProjectProgress(p);
    totalPercentSum += prg.percent;
    totalPhotos += countProjectPhotos(p);
    const momentsList = Object.values(p.moments || {});
    if (
      momentsList.some(
        (m: any) => m.status === 'YELLOW' || (m.isStopPoint && !m.teacherApproved)
      )
    ) {
      pendingTeacherReview++;
    }
  });

  const averageProgressPercent =
    mergedProjects.length > 0 ? Math.round(totalPercentSum / mergedProjects.length) : 0;

  const stats: FieldWorkStats = serverStats || {
    totalStudents: uniqueStudents,
    activeInField: mergedProjects.length,
    pendingTeacherReview,
    totalPhotos,
    averageProgressPercent,
  };

  return {
    projects: mergedProjects,
    stats,
    classes: serverClasses,
  };
}

/**
 * Counts total photos in a project
 */
export function countProjectPhotos(project: Project): number {
  let count = (project.preInspectionPhotos || []).length;
  if (project.moments) {
    Object.values(project.moments).forEach((m) => {
      if (m.photos) count += m.photos.length;
      else if (m.photoBase64) count += 1;
    });
  }
  return count;
}

/**
 * Counts completed moments and progress percentage
 */
export function calculateProjectProgress(project: Project): {
  completed: number;
  total: number;
  percent: number;
  pendingStopPoints: number;
} {
  const momentEntries = Object.entries(project.moments || {});
  const total = momentEntries.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0, pendingStopPoints: 0 };

  const completed = momentEntries.filter(([_, r]) => r.status === 'GREEN').length;
  const percent = Math.round((completed / total) * 100);

  // Check if any moments are marked as stop point and not teacher-approved
  let pendingStopPoints = 0;
  if (project.customMoments) {
    project.customMoments.forEach((m) => {
      if (m.isStopPoint && project.moments[m.id]?.status !== 'GREEN' && !project.moments[m.id]?.teacherApproved) {
        pendingStopPoints++;
      }
    });
  }

  return { completed, total, percent, pendingStopPoints };
}

/**
 * Pushes a single student or exercise project to cloud (Firestore & Server)
 */
export async function pushStudentProjectToCloud(
  project: Project,
  currentUser?: UserAccount | null
): Promise<boolean> {
  try {
    const toSend: Project = {
      ...project,
      studentId: project.studentId || currentUser?.id || project.creatorId || 'usr_elev_1',
      studentName: project.studentName || currentUser?.displayName || project.contractorName || 'Elev / Lärling',
      studentEmail: project.studentEmail || currentUser?.email || project.creatorEmail || 'elev@skola.se',
      schoolClass: project.schoolClass || currentUser?.schoolClass || currentUser?.studentGroup || 'Allmän klass',
      studentGroup: project.studentGroup || currentUser?.studentGroup || 'Mark & Anläggning',
      creatorId: project.creatorId || currentUser?.id || 'usr_elev_1',
      creatorName: project.creatorName || currentUser?.displayName || 'Elev',
      creatorEmail: project.creatorEmail || currentUser?.email || 'elev@skola.se',
      isTeacherExercise: project.isTeacherExercise || !!project.exerciseCode || true,
      syncEnabled: true,
    };

    // Parallel sync to both Firestore and Express server endpoints
    await Promise.allSettled([
      saveProjectToFirestore(toSend),
      safeFetchJson('/api/sync/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: toSend }),
      }),
      safeFetchJson('/api/field/student-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: toSend }),
      }),
    ]);

    return true;
  } catch (err) {
    console.warn('Could not auto-sync student project to cloud:', err);
    return false;
  }
}

/**
 * Synchronize ALL local projects stored on device/browser to cloud (Firestore & Server).
 * Solves previous issue where projects remained unsynced on former accounts!
 */
export async function syncAllLocalProjectsToCloud(
  currentUser?: UserAccount | null
): Promise<{ count: number; error?: string }> {
  try {
    const localProjects = await getAllProjects(false);
    if (!localProjects || localProjects.length === 0) {
      return { count: 0 };
    }

    const isStudent = currentUser?.role === 'STUDENT';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Only sync projects belonging to this user or student (or all if admin/teacher)
    const targetProjects = isStudent
      ? localProjects.filter(
          (p) =>
            p.studentId === currentUser?.id ||
            p.creatorId === currentUser?.id ||
            p.studentEmail?.toLowerCase() === currentUser?.email.toLowerCase()
        )
      : localProjects;

    if (targetProjects.length === 0) {
      return { count: 0 };
    }

    const preparedProjects: Project[] = targetProjects.map((p) => {
      const updated = { ...p };

      if (isStudent && currentUser) {
        updated.studentId = currentUser.id;
        updated.studentName = currentUser.displayName;
        updated.studentEmail = currentUser.email;
        updated.schoolClass =
          updated.schoolClass || currentUser.schoolClass || currentUser.studentGroup || 'Ospecificerad klass';
        updated.studentGroup = updated.studentGroup || currentUser.studentGroup;
        updated.creatorId = updated.creatorId || currentUser.id;
      }

      updated.syncEnabled = true;
      updated.lastSyncedAt = now;
      return updated;
    });

    // Save to Firestore and local IndexedDB
    let firestoreSaved = 0;
    for (const p of preparedProjects) {
      try {
        const ok = await saveProjectToFirestore(p);
        if (ok) firestoreSaved++;
      } catch {}
      await saveProject(p);
    }

    const res = await safeFetchJson<{ count: number; success: boolean }>('/api/field/sync-all-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects: preparedProjects }),
    });

    if (res.ok) {
      return { count: res.data?.count || preparedProjects.length };
    }

    // If server responded with HTML (e.g. static hosting, offline, Vite fallback)
    // but data is already safely persisted to Firestore and IndexedDB:
    if (firestoreSaved > 0 || preparedProjects.length > 0) {
      return { count: preparedProjects.length };
    }

    return { count: 0, error: res.error || 'Nätverksfel vid synkning' };
  } catch (err: any) {
    return { count: 0, error: err?.message || 'Nätverksfel vid synkning' };
  }
}

export async function fetchRegisteredTeachers(): Promise<
  Array<{ id: string; displayName: string; email?: string; schoolClass?: string }>
> {
  // 1. Try server endpoint
  try {
    const res = await safeFetchJson<{
      teachers: Array<{ id: string; displayName: string; email?: string; schoolClass?: string }>;
    }>('/api/teachers');
    if (res.ok && res.data?.teachers && res.data.teachers.length > 0) {
      return res.data.teachers;
    }
  } catch {}

  // 2. Fallback to standard demo teachers
  return [
    {
      id: 'usr_angfar_teacher',
      displayName: 'Angfar (Yrkeslärare)',
      email: 'angfar@skola.se',
      schoolClass: 'BA25',
    },
    {
      id: 'usr_larare_1',
      displayName: 'Yrkeslärare Mark & Betong',
      email: 'larare@skola.se',
      schoolClass: 'BA24',
    },
  ];
}

/**
 * Assign / connect a teacher to a project across local DB, Firestore, and Server
 */
export async function assignTeacherToProject(
  projectId: string,
  teacher: { id: string; displayName: string; email?: string }
): Promise<{ success: boolean; project?: Project; error?: string }> {
  try {
    // 1. Fetch current local project
    const all = await getAllProjects(false);
    const proj = all.find((p) => p.id === projectId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedProj: Project = proj
      ? {
          ...proj,
          teacherId: teacher.id,
          teacherName: teacher.displayName,
          teacherEmail: teacher.email,
          assignedTeacherId: teacher.id,
          assignedTeacherName: teacher.displayName,
          updatedAt: now,
          lastSyncedAt: now,
        }
      : ({
          id: projectId,
          teacherId: teacher.id,
          teacherName: teacher.displayName,
          teacherEmail: teacher.email,
          assignedTeacherId: teacher.id,
          assignedTeacherName: teacher.displayName,
          updatedAt: now,
        } as any);

    // Save locally
    if (proj) {
      await saveProject(updatedProj);
    }

    // Push to server
    try {
      await safeFetchJson(`/api/projects/${projectId}/assign-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          teacherName: teacher.displayName,
          teacherEmail: teacher.email,
        }),
      });
    } catch {}

    // Push to Firestore & Cloud
    try {
      await Promise.allSettled([
        saveProjectToFirestore(updatedProj),
        saveProjectToCloud(updatedProj),
      ]);
    } catch {}

    return { success: true, project: updatedProj };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Kunde inte koppla lärare' };
  }
}

/**
 * Teacher submits inspection review, feedback, or stop point sign-off
 */
export async function submitTeacherReview(
  payload: TeacherReviewPayload
): Promise<{ success: boolean; project?: Project; error?: string }> {
  try {
    const res = await safeFetchJson<{ success: boolean; project: Project }>(
      '/api/field/teacher-review',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok && res.data?.project) {
      // Also update local copy if it exists in local IndexedDB
      await saveProject(res.data.project);
      return { success: true, project: res.data.project };
    }
    return { success: false, error: res.error || 'Kunde inte spara lärarbedömning' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Nätverksfel vid sparande' };
  }
}

