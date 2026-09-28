/**
 * Helper to determine the target application URL for QR codes, sharing, and installation.
 * Defaults to the public GitHub Pages deployment so that scanned QR codes always work
 * for any device or external user without requiring AI Studio authentication.
 */
export function getAppUrl(customUrl?: string): string {
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('falthjalp_user_settings') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.customDeployUrl?.trim()) {
        return parsed.customDeployUrl.trim();
      }
    }
  } catch {}

  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname.includes('github.io')) {
      return window.location.href.split('?')[0].split('#')[0];
    }
  }

  return 'https://robbinwannstrom.github.io/faltkoll/';
}
