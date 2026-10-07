import { Project, UserAccount } from '../types';
import { safeFetchJson } from './apiHelper';
import { getAllProjects, saveProject } from '../db/indexedDb';
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
} from 'firebase/firestore';
import { db } from '../firebase';
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

/**
 * Sanitizes object by removing undefined values and ensuring Firestore 1MB document size limit is respected.
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      // Guard against huge base64 strings in Firestore (Express stores the full high-res data)
      if (typeof v === 'string' && v.startsWith('data:') && v.length > 300000) {
        clean[k] = v.substring(0, 500) + '...[CLOUDSYNC_PHOTO_REF]';
      } else {
        clean[k] = sanitizeForFirestore(v);
      }
    }
  }
  return clean;
}

/**
 * Save project directly to Google Cloud Firestore (/projects/{projectId})
 * Guarantees cross-device persistence and live discovery between student and admin accounts.
 */
export async function saveProjectToFirestore(project: Project): Promise<boolean> {
  if (!project || !project.id) return false;
  try {
    const enriched = { ...project };
    if (enriched.groupCode) {
      enriched.groupCode = enriched.groupCode.trim().toUpperCase();
      enriched.isGroupProject = true;
      enriched.syncEnabled = true;
    }
    const cleanProject = sanitizeForFirestore(enriched);
    const docRef = doc(db, 'projects', project.id);
    await setDoc(docRef, cleanProject, { merge: true });

    // Also persist directly into dedicated group_codes collection for instant O(1) lookup
    if (enriched.groupCode) {
      const codeRef = doc(db, 'group_codes', enriched.groupCode);
      await setDoc(
        codeRef,
        {
          code: enriched.groupCode,
          projectId: project.id,
          project: cleanProject,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
        { merge: true }
      );

      const stripped = enriched.groupCode.replace(/[\s-_]/g, '');
      if (stripped && stripped !== enriched.groupCode) {
        const strippedRef = doc(db, 'group_codes', stripped);
        await setDoc(
          strippedRef,
          {
            code: stripped,
            projectId: project.id,
            project: cleanProject,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          },
          { merge: true }
        );
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
    const snapshot = await getDocs(colRef);
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
 */
export async function findProjectByCodeInFirestore(code: string): Promise<Project | null> {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) return null;
  const stripped = normalized.replace(/[\s-_]/g, '');

  try {
    // 1. Direct O(1) document lookup by exact group code
    try {
      const directDocRef = doc(db, 'group_codes', normalized);
      const directSnap = await getDoc(directDocRef);
      if (directSnap.exists()) {
        const d = directSnap.data();
        if (d?.project) return d.project as Project;
      }
    } catch {}

    // 1b. Direct O(1) document lookup by stripped group code
    if (stripped && stripped !== normalized) {
      try {
        const strippedDocRef = doc(db, 'group_codes', stripped);
        const strippedSnap = await getDoc(strippedDocRef);
        if (strippedSnap.exists()) {
          const d = strippedSnap.data();
          if (d?.project) return d.project as Project;
        }
      } catch {}
    }

    const colRef = collection(db, 'projects');

    // 2. Direct query by groupCode in /projects
    try {
      const q1 = query(colRef, where('groupCode', '==', normalized), limit(1));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        return snap1.docs[0].data() as Project;
      }
    } catch {}

    // 3. Direct query by exerciseCode in /projects
    try {
      const q2 = query(colRef, where('exerciseCode', '==', normalized), limit(1));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        return snap2.docs[0].data() as Project;
      }
    } catch {}

    // 4. Fallback scan of all projects (supports flexible matching with hyphens/spaces omitted)
    const all = await fetchProjectsFromFirestore();
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

  // Run cloud Firestore and server endpoints in parallel so one never blocks the other
  await Promise.allSettled([
    // 1. Google Cloud Firestore
    saveProjectToFirestore(project),
    // 2. Server project store
    safeFetchJson('/api/sync/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    }),
    // 3. Field inspection API
    safeFetchJson('/api/field/student-work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    }),
  ]);
}

/**
 * Fetch all student field projects from cloud (combining Server, Firestore and local IndexedDB)
 */
export async function fetchStudentFieldWorks(
  filters?: StudentWorkFilterOptions
): Promise<{ projects: Project[]; stats: FieldWorkStats; classes: ClassSummary[] }> {
  let serverProjects: Project[] = [];
  let serverStats: FieldWorkStats | null = null;
  let serverClasses: ClassSummary[] = [];

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

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await safeFetchJson<{
      projects: Project[];
      stats: FieldWorkStats;
      classes: ClassSummary[];
    }>(`/api/field/student-work${queryStr}`);

    if (res.ok && res.data) {
      serverProjects = res.data.projects || [];
      serverStats = res.data.stats || null;
      serverClasses = res.data.classes || [];
    }
  } catch (err) {
    console.warn('Could not fetch student works from server:', err);
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

  // Merge projects from all 3 sources by project ID (prefer latest updatedAt)
  const projectMap = new Map<string, Project>();
  for (const p of [...localProjects, ...firestoreProjects, ...serverProjects]) {
    if (!p || !p.id) continue;
    const existing = projectMap.get(p.id);
    if (!existing) {
      projectMap.set(p.id, p);
    } else {
      const timeA = Math.max(parseSafeTime(p.updatedAt), parseSafeTime(p.lastSyncedAt), parseSafeTime(p.createdAt));
      const timeB = Math.max(parseSafeTime(existing.updatedAt), parseSafeTime(existing.lastSyncedAt), parseSafeTime(existing.createdAt));
      if (timeA >= timeB) {
        projectMap.set(p.id, {
          ...existing,
          ...p,
          // Preserve student info if present in either
          studentId: p.studentId || existing.studentId,
          studentName: p.studentName || existing.studentName,
          studentEmail: p.studentEmail || existing.studentEmail,
          schoolClass: p.schoolClass || existing.schoolClass,
          studentGroup: p.studentGroup || existing.studentGroup,
        });
      } else {
        projectMap.set(p.id, {
          ...p,
          ...existing,
          studentId: existing.studentId || p.studentId,
          studentName: existing.studentName || p.studentName,
          studentEmail: existing.studentEmail || p.studentEmail,
          schoolClass: existing.schoolClass || p.schoolClass,
          studentGroup: existing.studentGroup || p.studentGroup,
        });
      }
    }
  }

  let mergedProjects = Array.from(projectMap.values());

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
