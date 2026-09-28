import { TeacherExercise, Project, MomentRecord, MomentDefinition } from '../types';
import { ALL_MOMENTS } from '../data/momentsData';
import { getFormattedCurrentTime } from '../db/indexedDb';

const LOCAL_EXERCISES_KEY = 'faltkoll_custom_exercises';
const LOCAL_ADMIN_SETTINGS_KEY = 'faltkoll_admin_settings';

export interface AdminSettingsConfig {
  allowTeacherCreateTeacherAccounts: boolean;
  schoolName: string;
}

// Default pre-packaged exercise templates
export const DEFAULT_EXERCISES: TeacherExercise[] = [
  {
    id: 'ex_grund_standard_1',
    code: 'GRUND-1',
    title: 'Övning: Platta på mark - Schakt & Makadam',
    description: 'Praktisk övning i anläggningshallen. Mät kryssmått och laseravväg makadambädd med max ±5 mm tolerans.',
    projectType: 'HUSGRUND',
    createdAt: '2026-09-20 08:30',
    createdByTeacherName: 'Yrkeslärare Mark & Betong',
    createdByTeacherId: 'usr_larare_1',
    instructions: '1. Kontrollera ledningsanvisning\n2. Mät ut profiler och beräkna diagonal\n3. Schakta och jämna av schaktbotten\n4. Lägg fiberduk och makadambädd',
    links: [
      {
        id: 'link_yt_1',
        title: 'Instruktionsfilm: Utsättning av profiler',
        url: 'https://www.youtube.com',
        category: 'VIDEO',
      },
      {
        id: 'link_ama_1',
        title: 'AMA Anläggning tabell för toleranser (PDF)',
        url: 'https://svenskbyggtjanst.se',
        category: 'AMA_REGEL',
      },
    ],
    customMoments: ALL_MOMENTS.filter((m) => m.projectType === 'HUSGRUND').slice(0, 8),
    fieldMeasurements: {
      sideA: 10.0,
      sideB: 8.0,
      diagonal: 12.81,
      fallCmPerM: 1.0,
    },
  },
  {
    id: 'ex_sten_standard_1',
    code: 'PLATTA-2',
    title: 'Övning: Marksten & Plattsättning Garageinfart',
    description: 'Övning i sättsand, fall 2 cm/meter och fogning enligt AMA Anläggning.',
    projectType: 'PLATTSATTNING',
    createdAt: '2026-09-22 09:00',
    createdByTeacherName: 'Yrkeslärare Mark & Betong',
    createdByTeacherId: 'usr_larare_1',
    instructions: 'Säkerställ att bärlagret är väl paddat. Dra av sättsanden med rätskiva och kontrollera fall bort från sockel.',
    links: [
      {
        id: 'link_sten_1',
        title: 'Monteringsanvisning marksten & kantstöd',
        url: 'https://www.benders.se',
        category: 'RITNING',
      },
    ],
    customMoments: ALL_MOMENTS.filter((m) => m.projectType === 'PLATTSATTNING'),
    fieldMeasurements: {
      sideA: 6.0,
      sideB: 4.0,
      diagonal: 7.21,
      fallCmPerM: 2.0,
    },
  },
];

export const getLocalExercises = (): TeacherExercise[] => {
  try {
    const raw = localStorage.getItem(LOCAL_EXERCISES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_EXERCISES;
};

export const saveLocalExercises = (list: TeacherExercise[]): void => {
  try {
    localStorage.setItem(LOCAL_EXERCISES_KEY, JSON.stringify(list));
  } catch {}
};

// Fetch all exercises from server (with offline fallback)
export const fetchTeacherExercises = async (): Promise<TeacherExercise[]> => {
  try {
    const res = await fetch('/api/exercises');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.exercises)) {
        if (data.exercises.length === 0) {
          // If server is empty, seed defaults
          saveLocalExercises(DEFAULT_EXERCISES);
          return DEFAULT_EXERCISES;
        }
        saveLocalExercises(data.exercises);
        return data.exercises;
      }
    }
  } catch {}
  return getLocalExercises();
};

// Lookup exercise by code
export const fetchExerciseByCode = async (code: string): Promise<TeacherExercise | null> => {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const res = await fetch(`/api/exercises/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.exercise) return data.exercise;
    }
  } catch {}

  // Fallback to local storage
  const localList = getLocalExercises();
  const match = localList.find((e) => e.code.trim().toUpperCase() === cleanCode);
  return match || null;
};

// Save exercise (create or update)
export const saveTeacherExercise = async (
  exercise: TeacherExercise
): Promise<TeacherExercise> => {
  let saved = exercise;
  try {
    const res = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.exercise) saved = data.exercise;
    }
  } catch {}

  // Update local storage
  const current = getLocalExercises();
  const idx = current.findIndex((e) => e.id === saved.id || e.code === saved.code);
  let updatedList: TeacherExercise[];
  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = saved;
  } else {
    updatedList = [saved, ...current];
  }
  saveLocalExercises(updatedList);
  return saved;
};

// Delete exercise
export const deleteTeacherExercise = async (id: string): Promise<boolean> => {
  try {
    await fetch(`/api/exercises/${id}`, { method: 'DELETE' });
  } catch {}

  const current = getLocalExercises();
  const updated = current.filter((e) => e.id !== id && e.code !== id);
  saveLocalExercises(updated);
  return true;
};

// Admin Settings
export const fetchAdminSettings = async (): Promise<AdminSettingsConfig> => {
  try {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.settings) {
        localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(data.settings));
        return data.settings;
      }
    }
  } catch {}

  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    allowTeacherCreateTeacherAccounts: false,
    schoolName: 'Bygg- & Anläggningsutbildning',
  };
};

export const saveAdminSettings = async (
  settings: Partial<AdminSettingsConfig>
): Promise<AdminSettingsConfig> => {
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.settings) {
        localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(data.settings));
        return data.settings;
      }
    }
  } catch {}

  const current = await fetchAdminSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};

// Clone a teacher exercise into an active student project
export const convertExerciseToProject = (
  exercise: TeacherExercise,
  studentName: string
): Project => {
  const initialMoments: Record<string, MomentRecord> = {};
  const momentsToUse = exercise.customMoments && exercise.customMoments.length > 0
    ? exercise.customMoments
    : ALL_MOMENTS.filter((m) => m.projectType === exercise.projectType);

  momentsToUse.forEach((m) => {
    initialMoments[m.id] = {
      momentId: m.id,
      status: 'RED',
      comment: '',
      signature: '',
      photos: [],
    };
  });

  const now = getFormattedCurrentTime();

  return {
    id: 'proj_ex_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: exercise.title,
    projectType: exercise.projectType,
    propertyDesignation: `Övningskod: ${exercise.code}`,
    clientName: exercise.createdByTeacherName || 'Yrkeslärare',
    contractorName: studentName || 'Elev / Lärling',
    projectNumber: exercise.code,
    applicableDocs: 'AMA Anläggning 20 / Lärarens instruktioner',
    createdAt: now,
    updatedAt: now,
    notes: exercise.description || exercise.instructions || '',
    moments: initialMoments,
    exerciseCode: exercise.code,
    isTeacherExercise: true,
    exerciseInstructions: exercise.instructions,
    customMoments: exercise.customMoments,
    externalLinks: exercise.links,
    fieldMeasurements: exercise.fieldMeasurements,
    preInspectionCompleted: true, // School exercise starts ready for field inspection
    preInspectionPhotos: [],
  };
};
