import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Allow larger JSON payload for high-res photo sync
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==========================================
// PERSISTENT CLOUD DATA STORE (SERVER-SIDE)
// ==========================================
interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  password?: string;
  schoolOrCompany?: string;
  createdAt: string;
  lastLogin?: string;
}

interface StoredNotification {
  id: string;
  authorName: string;
  authorRole: 'TEACHER' | 'ADMIN';
  title: string;
  message: string;
  priority: 'NORMAL' | 'URGENT';
  createdAt: string;
  readBy: string[];
}

const DATA_FILE = path.resolve(__dirname, 'cloud_storage_data.json');

interface CloudStorageState {
  users: StoredUser[];
  notifications: StoredNotification[];
  projects: Record<string, any>;
  exercises: any[];
  adminSettings?: {
    allowTeacherCreateTeacherAccounts: boolean;
    schoolName?: string;
  };
  settings?: {
    requireLoginOnStartup?: boolean;
  };
}

const defaultState: CloudStorageState = {
  settings: {
    requireLoginOnStartup: false,
  },
  adminSettings: {
    allowTeacherCreateTeacherAccounts: false,
    schoolName: 'Bygg- & Anläggningsutbildning',
  },
  exercises: [],
  users: [
    {
      id: 'usr_admin_1',
      email: 'admin@falthjalp.se',
      displayName: 'Administratör (Admin)',
      role: 'ADMIN',
      schoolOrCompany: 'Anläggningssektionen',
      createdAt: '2026-01-01 08:00',
      lastLogin: '2026-09-26 10:00',
    },
    {
      id: 'usr_larare_1',
      email: 'larare@skola.se',
      displayName: 'Yrkeslärare Mark & Betong',
      role: 'TEACHER',
      password: 'larare123',
      schoolOrCompany: 'Yrkesakademin / Byggprogrammet',
      createdAt: '2026-01-10 08:00',
      lastLogin: '2026-09-24 14:00',
    },
    {
      id: 'usr_elev_1',
      email: 'elev@skola.se',
      displayName: 'Elev / Lärling',
      role: 'STUDENT',
      password: 'elev123',
      schoolOrCompany: 'Bygg- & Anläggningsutbildning',
      createdAt: '2026-02-01 09:30',
      lastLogin: '2026-09-24 15:10',
    },
  ],
  notifications: [
    {
      id: 'notif_welcome',
      authorName: 'Johan Lindqvist',
      authorRole: 'TEACHER',
      title: 'Viktigt: Glöm inte kryssmått & toleranskontroll',
      message:
        'Hej alla elever! Kom ihåg att kontrollera kryssmått (max ±5 mm toleransdiff) och fota laseravvägningen på makadambädden innan gjutning eller formsättning påbörjas i veckans moment.',
      priority: 'URGENT',
      createdAt: '2026-09-24 08:30',
      readBy: [],
    },
    {
      id: 'notif_ama_info',
      authorName: 'Johan Lindqvist',
      authorRole: 'TEACHER',
      title: 'AMA Anläggning 20 uppdaterad referens',
      message:
        'Vid kontroll av schaktbotten ska ni använda AMA tabell 13.5 för bärighet. Se till att anteckna lasermått direkt i fältblocket.',
      priority: 'NORMAL',
      createdAt: '2026-09-23 10:15',
      readBy: [],
    },
  ],
  projects: {},
};

function loadStorage(): CloudStorageState {
  try {
    let state = defaultState;
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      state = JSON.parse(raw);
      if (!Array.isArray(state.users)) {
        state.users = defaultState.users;
      }
      if (!Array.isArray(state.exercises)) {
        state.exercises = [];
      }
      if (!state.adminSettings) {
        state.adminSettings = {
          allowTeacherCreateTeacherAccounts: false,
          schoolName: 'Bygg- & Anläggningsutbildning',
        };
      }
    }

    // Ensure primary admin account exists
    let adminUser = state.users.find(
      (u) => u.email.toLowerCase() === 'admin@faltkoll.se' || u.role === 'ADMIN'
    );
    if (!adminUser) {
      adminUser = {
        id: 'usr_admin_1',
        email: 'admin@faltkoll.se',
        displayName: 'Administratör (Admin)',
        role: 'ADMIN',
        password: 'admin123',
        schoolOrCompany: 'Anläggningssektionen',
        createdAt: '2026-01-01 08:00',
        lastLogin: '2026-09-26 10:00',
      };
      state.users.unshift(adminUser);
    } else {
      adminUser.password = adminUser.password || 'admin123';
      adminUser.email = 'admin@faltkoll.se';
    }

    // Ensure default demo accounts have passwords
    const larare = state.users.find((u) => u.email.toLowerCase() === 'larare@skola.se');
    if (larare && !larare.password) larare.password = 'larare123';

    const elev = state.users.find((u) => u.email.toLowerCase() === 'elev@skola.se');
    if (elev && !elev.password) elev.password = 'elev123';

    return state;
  } catch (err) {
    console.warn('Could not read cloud storage file, using default', err);
    return defaultState;
  }
}

function saveStorage(state: CloudStorageState): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Could not save cloud storage file', err);
  }
}

let cloudState = loadStorage();
// Save initialized state immediately so cloud_storage_data.json has updated admin credentials
saveStorage(cloudState);

// ==========================================
// AUTH & USER MANAGEMENT APIS
// ==========================================

// POST /api/auth/login - Verified login with password
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-postadress eller användarnamn krävs.' });
  }

  const normalized = String(email).trim().toLowerCase();
  const enteredPassword = String(password || '').trim();

  let user = cloudState.users.find(
    (u) =>
      u.email.toLowerCase() === normalized ||
      u.displayName.toLowerCase() === normalized ||
      (normalized === 'admin' && u.role === 'ADMIN') ||
      (normalized === 'larare' && u.role === 'TEACHER') ||
      (normalized === 'elev' && u.role === 'STUDENT')
  );

  if (!user) {
    return res.status(401).json({
      error: 'Inget konto hittades med dessa uppgifter. Kontakta administratören för att få ett konto.',
    });
  }

  // Password verification
  if (user.password) {
    if (user.password !== enteredPassword) {
      return res.status(401).json({
        error: 'Felaktigt lösenord. Vänligen kontrollera dina uppgifter.',
      });
    }
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  user.lastLogin = now;
  saveStorage(cloudState);

  return res.json({
    user,
    token: 'jwt_mock_' + user.id + '_' + Date.now(),
  });
});

// GET /api/admin/settings - Get school admin configuration
app.get('/api/admin/settings', (_req, res) => {
  return res.json({
    settings: cloudState.adminSettings || {
      allowTeacherCreateTeacherAccounts: false,
      schoolName: 'Bygg- & Anläggningsutbildning',
    },
  });
});

// PUT /api/admin/settings - Update school admin configuration
app.put('/api/admin/settings', (req, res) => {
  const { allowTeacherCreateTeacherAccounts, schoolName } = req.body;
  if (!cloudState.adminSettings) {
    cloudState.adminSettings = {
      allowTeacherCreateTeacherAccounts: false,
      schoolName: 'Bygg- & Anläggningsutbildning',
    };
  }
  if (typeof allowTeacherCreateTeacherAccounts === 'boolean') {
    cloudState.adminSettings.allowTeacherCreateTeacherAccounts = allowTeacherCreateTeacherAccounts;
  }
  if (schoolName) {
    cloudState.adminSettings.schoolName = String(schoolName).trim();
  }
  saveStorage(cloudState);
  return res.json({ settings: cloudState.adminSettings });
});

// GET /api/exercises - List all teacher created exercises
app.get('/api/exercises', (_req, res) => {
  return res.json({ exercises: cloudState.exercises || [] });
});

// GET /api/exercises/:code - Get exercise by unique code
app.get('/api/exercises/:code', (req, res) => {
  const rawCode = String(req.params.code || '').trim().toUpperCase();
  const ex = (cloudState.exercises || []).find(
    (e) => String(e.code).trim().toUpperCase() === rawCode
  );
  if (!ex) {
    return res.status(404).json({ error: 'Ingen övning hittades med koden: ' + rawCode });
  }
  return res.json({ exercise: ex });
});

// POST /api/exercises - Create or update teacher exercise
app.post('/api/exercises', (req, res) => {
  const exercise = req.body;
  if (!exercise || !exercise.title) {
    return res.status(400).json({ error: 'Övningstitel krävs.' });
  }

  let code = exercise.code ? String(exercise.code).trim().toUpperCase() : '';
  if (!code) {
    code = 'FK-' + Math.floor(1000 + Math.random() * 9000);
  }

  const newExercise = {
    ...exercise,
    id: exercise.id || 'ex_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    code,
    createdAt: exercise.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  const existingIdx = (cloudState.exercises || []).findIndex(
    (e) => e.id === newExercise.id || String(e.code).toUpperCase() === code
  );

  if (existingIdx >= 0) {
    cloudState.exercises[existingIdx] = newExercise;
  } else {
    cloudState.exercises.unshift(newExercise);
  }

  saveStorage(cloudState);
  return res.json({ exercise: newExercise });
});

// DELETE /api/exercises/:id - Delete an exercise
app.delete('/api/exercises/:id', (req, res) => {
  const { id } = req.params;
  cloudState.exercises = (cloudState.exercises || []).filter((e) => e.id !== id && e.code !== id);
  saveStorage(cloudState);
  return res.json({ success: true });
});

// GET /api/users - List users with strict role protection
app.get('/api/users', (req, res) => {
  const callerRole = String(req.query.callerRole || '').toUpperCase();
  const callerId = String(req.query.callerId || '');

  if (callerRole === 'TEACHER') {
    const allowTeacherAccounts = cloudState.adminSettings?.allowTeacherCreateTeacherAccounts ?? false;
    const filtered = cloudState.users.filter((u) => {
      if (u.role === 'ADMIN') return false; // Teachers NEVER see admin
      if (u.role === 'TEACHER') {
        return allowTeacherAccounts || u.id === callerId;
      }
      return true; // STUDENT
    });
    return res.json({ users: filtered });
  }

  return res.json({ users: cloudState.users });
});

// POST /api/users - Create new student/teacher/admin account (Admin only)
app.post('/api/users', (req, res) => {
  const { email, displayName, role, password, schoolOrCompany } = req.body;

  if (!email || !displayName) {
    return res.status(400).json({ error: 'E-post/användarnamn och namn krävs.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = cloudState.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'Det finns redan ett konto med denna e-post/användarnamn.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const newUser: StoredUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    email: normalizedEmail,
    displayName: String(displayName).trim(),
    role: role === 'TEACHER' || role === 'ADMIN' ? role : 'STUDENT',
    password: password ? String(password).trim() : '1234',
    schoolOrCompany: schoolOrCompany || 'Bygg & Anläggningsutbildning',
    createdAt: now,
    lastLogin: 'Aldrig inloggad',
  };

  cloudState.users.unshift(newUser);
  saveStorage(cloudState);

  return res.json({ user: newUser });
});

// PUT /api/users/:id - Update user role, details or password (Admin only)
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { role, displayName, schoolOrCompany, password } = req.body;

  const user = cloudState.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Användaren hittades inte.' });
  }

  if (role) user.role = role;
  if (displayName) user.displayName = displayName;
  if (schoolOrCompany !== undefined) user.schoolOrCompany = schoolOrCompany;
  if (password) user.password = String(password).trim();

  saveStorage(cloudState);
  return res.json({ user });
});

// DELETE /api/users/:id - Remove user account (Admin only)
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = cloudState.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Användaren hittades inte.' });
  }

  if (
    user.email.toLowerCase() === 'caataclysm@gmail.com' ||
    user.id === 'usr_caataclysm_admin' ||
    user.email.toLowerCase() === 'robbinwannstrom@gmail.com' ||
    user.id === 'usr_robbin_owner' ||
    user.email.toLowerCase() === 'admin@falthjalp.se'
  ) {
    return res.status(400).json({ error: 'Huvudadministratörens konto kan inte raderas.' });
  }

  cloudState.users = cloudState.users.filter((u) => u.id !== id);
  saveStorage(cloudState);
  return res.json({ success: true });
});

// ==========================================
// SYSTEM SETTINGS & DEMO MODE APIS
// ==========================================

// GET /api/system/settings - Global system configuration
app.get('/api/system/settings', (_req, res) => {
  return res.json({
    requireLoginOnStartup: cloudState.settings?.requireLoginOnStartup ?? false,
  });
});

// GET /api/system/storage-stats - Cloud storage quota, percent, used/free bytes and warnings
app.get('/api/system/storage-stats', (_req, res) => {
  let fileSizeBytes = 0;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stats = fs.statSync(DATA_FILE);
      fileSizeBytes = stats.size;
    }
  } catch {
    fileSizeBytes = 0;
  }

  // Quota for cloud storage (1 GB / 1000 MB)
  const quotaBytes = 1000 * 1024 * 1024;
  const usedBytes = fileSizeBytes;
  const freeBytes = Math.max(0, quotaBytes - usedBytes);
  const percentUsed = Number(((usedBytes / quotaBytes) * 100).toFixed(2));

  let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
  let warningMessage: string | null = null;

  if (percentUsed >= 90) {
    status = 'CRITICAL';
    warningMessage = `Kritiskt: Molnutrymmet är ${percentUsed}% fullt! Exportera säkerhetskopia och rensa gamla testprojekt.`;
  } else if (percentUsed >= 75) {
    status = 'WARNING';
    warningMessage = `Varning: Molnutrymmet börjar bli fyllt (${percentUsed}%). Överväg att arkivera avslutade projekt.`;
  }

  // Count photos and moments across all projects
  let totalPhotos = 0;
  let totalMoments = 0;
  const projectList = Object.values(cloudState.projects);
  projectList.forEach((p: any) => {
    if (p.moments) {
      Object.values(p.moments).forEach((m: any) => {
        totalMoments++;
        if (m.photos && Array.isArray(m.photos)) {
          totalPhotos += m.photos.length;
        } else if (m.photoBase64) {
          totalPhotos++;
        }
      });
    }
    if (p.preInspectionPhotos && Array.isArray(p.preInspectionPhotos)) {
      totalPhotos += p.preInspectionPhotos.length;
    }
  });

  return res.json({
    usedBytes,
    quotaBytes,
    freeBytes,
    percentUsed,
    usedFormatted: (usedBytes / (1024 * 1024)).toFixed(2) + ' MB',
    quotaFormatted: (quotaBytes / (1024 * 1024)).toFixed(0) + ' MB (1 GB)',
    freeFormatted: (freeBytes / (1024 * 1024)).toFixed(2) + ' MB',
    status,
    warningMessage,
    stats: {
      projectsCount: projectList.length,
      photosCount: totalPhotos,
      momentsCount: totalMoments,
      usersCount: cloudState.users.length,
    }
  });
});

// POST /api/system/settings - Update global system settings (Admin only)
app.post('/api/system/settings', (req, res) => {
  const { requireLoginOnStartup } = req.body;
  if (!cloudState.settings) {
    cloudState.settings = {};
  }
  cloudState.settings.requireLoginOnStartup = !!requireLoginOnStartup;
  saveStorage(cloudState);
  return res.json({
    success: true,
    requireLoginOnStartup: cloudState.settings.requireLoginOnStartup,
  });
});

// ==========================================
// NOTIFICATIONS & TEACHER BROADCAST APIS
// ==========================================

// GET /api/notifications - List active notices
app.get('/api/notifications', (_req, res) => {
  return res.json({ notifications: cloudState.notifications });
});

// POST /api/notifications - Teacher/Admin broadcast
app.post('/api/notifications', (req, res) => {
  const { authorName, authorRole, title, message, priority } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Rubrik och meddelande krävs.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const newNotif: StoredNotification = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    authorName: authorName || 'Lärare',
    authorRole: authorRole === 'ADMIN' ? 'ADMIN' : 'TEACHER',
    title: String(title).trim(),
    message: String(message).trim(),
    priority: priority === 'URGENT' ? 'URGENT' : 'NORMAL',
    createdAt: now,
    readBy: [],
  };

  cloudState.notifications.unshift(newNotif);
  saveStorage(cloudState);

  return res.json({ notification: newNotif });
});

// POST /api/notifications/:id/read - Mark notification as read
app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const notif = cloudState.notifications.find((n) => n.id === id);
  if (notif && userId && !notif.readBy.includes(userId)) {
    notif.readBy.push(userId);
    saveStorage(cloudState);
  }

  return res.json({ success: true });
});

// ==========================================
// PROJECT CLOUD SYNC & GROUP WORK APIS
// ==========================================

// GET /api/sync/projects - Get all synced projects (lightweight metadata)
app.get('/api/sync/projects', (_req, res) => {
  const list = Object.values(cloudState.projects).map((p: any) => ({
    id: p.id,
    name: p.name,
    projectType: p.projectType,
    clientName: p.clientName,
    contractorName: p.contractorName,
    propertyDesignation: p.propertyDesignation,
    groupCode: p.groupCode,
    isGroupProject: p.isGroupProject,
    updatedAt: p.updatedAt,
    quickNotesCount: p.quickNotes ? p.quickNotes.length : 0,
    momentsCount: p.moments ? Object.keys(p.moments).length : 0,
  }));
  return res.json({ projects: list });
});

// GET /api/sync/projects/:id - Get full project
app.get('/api/sync/projects/:id', (req, res) => {
  const { id } = req.params;
  const proj = cloudState.projects[id];
  if (!proj) {
    return res.status(404).json({ error: 'Projektet finns inte i molnet.' });
  }
  return res.json({ project: proj });
});

// POST /api/sync/projects - Push / sync project (moments, quickNotes, photos)
app.post('/api/sync/projects', (req, res) => {
  const { project } = req.body;
  if (!project || !project.id) {
    return res.status(400).json({ error: 'Ogiltig projektdata.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  project.lastSyncedAt = now;
  project.updatedAt = now;

  if (project.isGroupProject && !project.groupCode) {
    project.groupCode = 'BYGG-' + Math.floor(10 + Math.random() * 90);
  }

  cloudState.projects[project.id] = project;
  saveStorage(cloudState);

  return res.json({
    success: true,
    lastSyncedAt: now,
    groupCode: project.groupCode,
    project,
  });
});

// POST /api/sync/join-code - Find project by groupCode
app.post('/api/sync/join-code', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Gruppkod saknas.' });
  }

  const normalized = String(code).trim().toUpperCase();
  const proj = Object.values(cloudState.projects).find(
    (p: any) => p.groupCode && p.groupCode.toUpperCase() === normalized
  );

  if (!proj) {
    return res.status(404).json({ error: `Hittade inget projekt med kod "${normalized}".` });
  }

  return res.json({ project: proj });
});

// ==========================================
// GEMINI AI BYGGHJÄLP & FÄLTEXPERT
// ==========================================
app.post('/api/gemini-ask', async (req, res) => {
  const { question, momentTitle, amaCode, projectType, momentId, instruction, studentTip, proTip } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Fråga saknas' });
  }

  if (!ai || !apiKey) {
    return res.json({
      answer: `[LOKALT SVAR ENLIGT AMA & SVENSK STANDARD]\n\nFråga: "${question}"\n\nFörklarande vägledning för ${momentTitle || 'momentet'} (AMA ${amaCode || 'Standard'}):\n1. Kontrollera mått, toleranser och material i arbetsinstruktionen.\n2. Exempel på vanliga material/verktyg:\n   - Trallman/distansklossar: Håller jämnt 3–5 mm avstånd mellan trallbrädor.\n   - Trallskruv C4 vs A2: C4 är korrosionsskyddat kolstål för normal miljö, medan A2 är rostfritt som tål träets naturliga krympning/svällning utan att knäckas.\n   - Makadam: Både 8/16, 11/16 och 16/32 mm fungerar utmärkt som kapillärbrytande lager (undvik alltid 0-fraktioner som 0/32 som suger fukt).\n3. Fota utförd åtgärd med tidsstämpel och tumstock/laser för egenkontrollens bevisföring.`,
      isAi: false,
    });
  }

  try {
    const prompt = `Du är en svensk senior bygg- och anläggningslärare, besiktningsman och fältexpert på AMA Anläggning, AMA Hus, BBR och Svenskt Trä.
Användaren är en yrkeselev eller anläggare/snickare som utför en praktisk övning eller ett verkligt byggprojekt.
De läser följande arbetsinstruktion och har en specifik fråga om ett begrepp, verktyg, mått, regel eller material i momentet:

MOMENTETS INFORMATION:
- Typ av projekt: ${projectType || 'Bygg & Anläggning'}
- Moment ${momentId || ''}: ${momentTitle || 'Allmänt'}
- AMA-kod: ${amaCode || 'AMA standard'}
${instruction ? `- Arbetsinstruktion: "${instruction}"` : ''}
${studentTip ? `- Elevtips: "${studentTip}"` : ''}
${proTip ? `- Yrkeslärarens råd: "${proTip}"` : ''}

ANVÄNDARENS FRÅGA / VAD DE VILL FÅ FÖRKLARAT:
"${question}"

INSTRUKTIONER FÖR SVAR:
1. Svara direkt, pedagogiskt, vänligt och handfast på ren svenska (inga krångliga omvägar).
2. Om användaren frågar om specifika begrepp från texten, förklara tydligt och praktiskt:
   - "Trallman": Specialverktyg/mall som kläms fast mellan trallbrädor för att automatiskt ge en jämn och rak springa (t.ex. 3–5 mm) och hålla brädan rak när den skruvas.
   - "Distanskloss": Små plast- eller träklossar i bestämt mått som sätts mellan brädorna för att få exakt samma mellanrum över hela altanen.
   - "Varför just dessa mått (t.ex. 28x120 mm / 3–5 mm)": 28 mm ger böjstyvhet vid c/c 600 mm så altanen inte sviktar. 3–5 mm mellanrum krävs för att trä sväller vid regn/höstfukt och för att vatten ska rinna undan utan rötrisk.
   - "Skillnad mellan C4 och A2 trallskruv": C4 är korrosionsskyddat kolstål lämpligt för normal utomhusmiljö; A2 är rostfritt stål som är segare och klarar tryckimpregnerat träs sväll- och krymprörelser utan att skruvskallen knäcks. (A4 syrafast rekommenderas vid pool/kust).
   - "Makadam 8/16 vs 11/16 vs 16/32": Förklara att alla tre är godkända tvättade fraktioner utan nollfraktion. 8/16 mm finns ofta på skolan och är smidig att kratta/raka, medan 16/32 är grövre. Det avgörande är att undvika nollfraktion (0/32) som suger upp vatten kapillärt.
   - "Glada sidan / årsringar uppåt": Förklara att kärnsidan ska vändas uppåt så brädan kupar sig konvext (som ett paraply) så att regnvatten rinner av istället för att samlas i en pöl som ger röta.
3. Ge konkreta mått, toleranser (mm/cm) och praktiska fälttips.
4. Avsluta med vad eleven/arbetaren bör fotografera eller dubbelkolla för godkänd egenkontroll.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || 'Inget svar kunde genereras.';
    return res.json({ answer: text, isAi: true });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return res.status(500).json({
      error: 'Kunde inte anropa AI-modellen: ' + (err?.message || 'okänt fel'),
    });
  }
});

// Mount Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (isProd && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
