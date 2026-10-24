import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with the dedicated database ID and safe proxy/undefined handling
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      ignoreUndefinedProperties: true,
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch {
  firestoreInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db: Firestore = firestoreInstance;

// Firestore Quota Circuit Breaker
// Automatically engages when Firestore returns 8 RESOURCE_EXHAUSTED (free tier daily write limit reached)
let firestoreQuotaExceededUntil = 0;

export function isFirestoreQuotaExceeded(): boolean {
  if (firestoreQuotaExceededUntil && Date.now() < firestoreQuotaExceededUntil) {
    return true;
  }
  // Check browser storage
  if (typeof window !== 'undefined') {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const savedDate = localStorage.getItem('firestore_quota_exceeded_date');
      if (savedDate === today) {
        return true;
      }
      const stored =
        sessionStorage.getItem('firestore_quota_exceeded_until') ||
        localStorage.getItem('firestore_quota_exceeded_until');
      if (stored) {
        const until = parseInt(stored, 10);
        if (until && Date.now() < until) {
          firestoreQuotaExceededUntil = until;
          return true;
        }
      }
    } catch {}
  }
  // Check server-side filesystem if in Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fs = typeof require === 'function' ? require('fs') : null;
      const path = typeof require === 'function' ? require('path') : null;
      if (fs && path) {
        const p = path.resolve(process.cwd(), 'data', 'firestore_quota.json');
        if (fs.existsSync(p)) {
          const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
          if (raw?.until && Date.now() < raw.until) {
            firestoreQuotaExceededUntil = raw.until;
            return true;
          }
          if (raw?.date === new Date().toISOString().slice(0, 10)) {
            return true;
          }
        }
      }
    } catch {}
  }
  return false;
}

export function canWriteToFirestore(): boolean {
  return !isFirestoreQuotaExceeded();
}

export function markFirestoreQuotaExceeded(durationMinutes = 1440) {
  firestoreQuotaExceededUntil = Date.now() + durationMinutes * 60 * 1000;
  const today = new Date().toISOString().slice(0, 10);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('firestore_quota_exceeded_until', String(firestoreQuotaExceededUntil));
      localStorage.setItem('firestore_quota_exceeded_until', String(firestoreQuotaExceededUntil));
      localStorage.setItem('firestore_quota_exceeded_date', today);
    } catch {}

    // Notify backend server so all clients and server stay synchronized
    try {
      fetch('/api/system/firestore-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotaExceeded: true, until: firestoreQuotaExceededUntil, durationMinutes }),
      }).catch(() => {});
    } catch {}
  }

  // If in Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fs = typeof require === 'function' ? require('fs') : null;
      const path = typeof require === 'function' ? require('path') : null;
      if (fs && path) {
        const p = path.resolve(process.cwd(), 'data', 'firestore_quota.json');
        fs.writeFileSync(
          p,
          JSON.stringify({ quotaExceeded: true, until: firestoreQuotaExceededUntil, date: today }),
          'utf-8'
        );
      }
    } catch {}
  }

  // Immediately disable network connection to terminate the failing gRPC write stream
  if (db) {
    try {
      disableNetwork(db).catch(() => {});
    } catch {}
  }
}

export function clearFirestoreQuotaExceeded() {
  firestoreQuotaExceededUntil = 0;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('firestore_quota_exceeded_until');
      localStorage.removeItem('firestore_quota_exceeded_until');
      localStorage.removeItem('firestore_quota_exceeded_date');
    } catch {}
  }
  if (db) {
    try {
      enableNetwork(db).catch(() => {});
    } catch {}
  }
}

// Immediately engage circuit breaker if quota is already marked as exceeded
if (isFirestoreQuotaExceeded() && db) {
  disableNetwork(db).catch(() => {});
}

// Global unhandled rejection listeners to catch any quota error from Firestore SDK background threads
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason || '');
    const code = reason?.code;
    if (
      code === 'resource-exhausted' ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('Free daily write units')
    ) {
      console.warn('Firestore skrivkvot nådd. Växlar över till Express-serverns reservlagring.');
      markFirestoreQuotaExceeded(1440);
      event.preventDefault();
    }
  });

  // Sync quota status with backend on client startup
  try {
    fetch('/api/system/firestore-status')
      .then((r) => r.json())
      .then((data) => {
        if (data?.quotaExceeded) {
          markFirestoreQuotaExceeded(1440);
        }
      })
      .catch(() => {});
  } catch {}
}

if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason: any) => {
    const msg = String(reason?.message || reason || '');
    const code = reason?.code;
    if (
      code === 'resource-exhausted' ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('Free daily write units')
    ) {
      console.warn('Firestore write quota exceeded on server. Switched to Express backup storage.');
      markFirestoreQuotaExceeded(1440);
    }
  });
}

// Validate connection to Firestore on startup (safe for offline fieldwork)
async function testConnection() {
  if (!canWriteToFirestore()) return;
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline mode active.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export default db;
