import { UserSettings } from '../types';

export interface AppVersionInfo {
  projectName: string;
  detectedVersion: string;
  packageVersion: string;
  customAppName?: string;
  customAppVersion?: string;
  effectiveAppName: string;
  effectiveVersion: string;
  isCustom: boolean;
  source: 'AUTOMATIC_METADATA' | 'CUSTOM_OVERRIDE';
  description?: string;
  lastUpdated?: string;
}

// Fallback values if metadata cannot be reached
export const FALLBACK_PROJECT_NAME = 'Remix Remix FältKoll || Anläggning & Egenkontroll v0.55';
export const FALLBACK_VERSION = 'v0.55';
export const FALLBACK_APP_NAME = 'FältKoll';

/**
 * Extracts a version number like "v0.55" or "0.55" from a project name or string.
 */
export function extractVersionFromText(text: string): string {
  if (!text) return FALLBACK_VERSION;

  // Search for patterns like "v0.55", "v1.2.3", "version 0.55", "v0.55-beta"
  const vMatch = text.match(/(?:v|ver|version)[\s\.\-_]*(\d+(?:\.\d+)*(?:-[\w\.]+)?)/i);
  if (vMatch && vMatch[1]) {
    return `v${vMatch[1]}`;
  }

  // Search for raw semver numbers like "0.55" or "1.0.4"
  const numMatch = text.match(/\b(\d+\.\d+(?:\.\d+)?)\b/);
  if (numMatch && numMatch[1]) {
    return `v${numMatch[1]}`;
  }

  return FALLBACK_VERSION;
}

// In-memory cache for fast synchronous access
let cachedServerInfo: Partial<AppVersionInfo> | null = null;
const LISTENERS = new Set<() => void>();

export function subscribeToVersionChanges(callback: () => void): () => void {
  LISTENERS.add(callback);
  return () => {
    LISTENERS.delete(callback);
  };
}

function notifyVersionListeners() {
  LISTENERS.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.warn('Error in version listener', e);
    }
  });
}

/**
 * Computes current AppVersionInfo considering UserSettings, localStorage and metadata.
 */
export function getAppVersionInfo(userSettings?: UserSettings): AppVersionInfo {
  const customVersionFromSettings = userSettings?.customAppVersion?.trim();
  const customNameFromSettings = userSettings?.customAppName?.trim();

  // Check localStorage for any overrides
  let localVersion = '';
  let localName = '';
  try {
    localVersion = (localStorage.getItem('faltkoll_custom_version') || '').trim();
    localName = (localStorage.getItem('faltkoll_custom_app_name') || '').trim();
  } catch {}

  const activeCustomVersion = customVersionFromSettings || localVersion;
  const activeCustomName = customNameFromSettings || localName;

  const rawProjectName = cachedServerInfo?.projectName || FALLBACK_PROJECT_NAME;
  const detectedVersion =
    cachedServerInfo?.detectedVersion || extractVersionFromText(rawProjectName);
  const packageVersion = cachedServerInfo?.packageVersion || '0.0.0';

  const isCustom = Boolean(activeCustomVersion || activeCustomName);

  return {
    projectName: rawProjectName,
    detectedVersion,
    packageVersion,
    customAppName: activeCustomName || undefined,
    customAppVersion: activeCustomVersion || undefined,
    effectiveAppName: activeCustomName || FALLBACK_APP_NAME,
    effectiveVersion: activeCustomVersion || detectedVersion,
    isCustom,
    source: isCustom ? 'CUSTOM_OVERRIDE' : 'AUTOMATIC_METADATA',
    description: cachedServerInfo?.description,
    lastUpdated: cachedServerInfo?.lastUpdated,
  };
}

/**
 * Fetches latest project metadata and version from the backend API.
 */
export async function fetchServerAppInfo(): Promise<AppVersionInfo> {
  try {
    const res = await fetch('/api/system/version');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        cachedServerInfo = {
          projectName: data.projectName || FALLBACK_PROJECT_NAME,
          detectedVersion: data.detectedVersion || extractVersionFromText(data.projectName || ''),
          packageVersion: data.packageVersion || '0.0.0',
          description: data.description,
          lastUpdated: data.timestamp,
        };

        // If server stored a custom global version, sync if not locally overridden
        if (data.customAppVersion) {
          cachedServerInfo.customAppVersion = data.customAppVersion;
        }
        if (data.customAppName) {
          cachedServerInfo.customAppName = data.customAppName;
        }

        notifyVersionListeners();
      }
    }
  } catch (err) {
    console.warn('Could not fetch server version info, using client fallbacks:', err);
  }

  return getAppVersionInfo();
}

/**
 * Saves custom version and/or custom name locally and to server.
 */
export async function saveCustomVersion(
  version: string,
  appName?: string
): Promise<AppVersionInfo> {
  const cleanVersion = version.trim();
  const cleanName = (appName || '').trim();

  try {
    if (cleanVersion) {
      localStorage.setItem('faltkoll_custom_version', cleanVersion);
    } else {
      localStorage.removeItem('faltkoll_custom_version');
    }

    if (cleanName) {
      localStorage.setItem('faltkoll_custom_app_name', cleanName);
    } else {
      localStorage.removeItem('faltkoll_custom_app_name');
    }
  } catch {}

  // Sync to server
  try {
    await fetch('/api/system/version', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customAppVersion: cleanVersion || null,
        customAppName: cleanName || null,
      }),
    });
  } catch (err) {
    console.warn('Could not save custom version to server:', err);
  }

  notifyVersionListeners();
  return getAppVersionInfo();
}

/**
 * Resets custom version and restores automatic metadata version.
 */
export async function resetCustomVersion(): Promise<AppVersionInfo> {
  try {
    localStorage.removeItem('faltkoll_custom_version');
    localStorage.removeItem('faltkoll_custom_app_name');
  } catch {}

  try {
    await fetch('/api/system/version', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customAppVersion: null,
        customAppName: null,
      }),
    });
  } catch (err) {
    console.warn('Could not reset custom version on server:', err);
  }

  notifyVersionListeners();
  return getAppVersionInfo();
}
