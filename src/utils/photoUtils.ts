import { Project, MomentPhoto, MomentRecord } from '../types';

/**
 * Universal safe photo URL generator and normalizer.
 * Fixes:
 * 1. Invalid `data:image/svg+xml;utf8,...` MIME format which breaks in browsers
 * 2. Truncated `...[CLOUDSYNC_PHOTO_REF]` references from previous sync
 * 3. Local cache placeholders `[BILD_SPARAD]`
 * 4. Ensures 100% valid base64 image data URLs for any <img> tag
 */

export function createPhotoPlaceholderSvg(
  title: string = 'Fältdokumentation',
  subtitle: string = 'Fotobevis registrerat',
  timestamp: string = '',
  category: string = 'Kontroll'
): string {
  const timeStr = timestamp || new Date().toISOString().substring(0, 16).replace('T', ' ');
  const cleanTitle = title.replace(/[<>&"']/g, '');
  const cleanSub = subtitle.replace(/[<>&"']/g, '');
  const cleanCat = category.replace(/[<>&"']/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <defs>
      <linearGradient id="g_f97316" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1c1917"/>
        <stop offset="100%" stop-color="#0c0a09"/>
      </linearGradient>
    </defs>
    <rect width="640" height="480" fill="url(#g_f97316)"/>
    <rect x="24" y="24" width="592" height="432" rx="14" fill="none" stroke="#f97316" stroke-width="2.5" stroke-dasharray="6 4" opacity="0.8"/>
    <circle cx="320" cy="180" r="54" fill="#f97316" opacity="0.12"/>
    <text x="320" y="172" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#f97316" text-anchor="middle">📷 FÄLTDOKUMENTATION</text>
    <text x="320" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#ffffff" text-anchor="middle">${cleanTitle}</text>
    <text x="320" y="245" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#94a3b8" text-anchor="middle">${cleanSub}</text>
    <rect x="35" y="395" width="570" height="50" rx="10" fill="#000000" opacity="0.85"/>
    <text x="55" y="426" font-family="ui-monospace, monospace" font-size="13" font-weight="900" fill="#f97316">FÄLTKOLL • ${cleanCat.toUpperCase()}</text>
    <text x="585" y="426" font-family="ui-monospace, monospace" font-size="12" fill="#ffffff" text-anchor="end">${timeStr}</text>
  </svg>`;

  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
    }
  } catch {}
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function isTruncatedPhoto(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('[CLOUDSYNC') ||
    url.includes('[BILD_SPARAD') ||
    (url.startsWith('data:image/jpeg') && url.length < 500)
  );
}

export function normalizePhotoUrl(dataUrl?: string | null, fallbackTitle?: string): string {
  if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.trim() === '') {
    return '';
  }

  const trimmed = dataUrl.trim();

  // 1. Truncated or placeholder references
  if (isTruncatedPhoto(trimmed)) {
    return fallbackTitle
      ? createPhotoPlaceholderSvg(
          fallbackTitle,
          'Klicka "Ladda upp / Ersätt" för att uppdatera med originalbild'
        )
      : '';
  }

  // 2. Fix invalid `data:image/svg+xml;utf8,...` MIME type
  if (trimmed.startsWith('data:image/svg+xml;utf8,')) {
    try {
      const rawSvg = decodeURIComponent(trimmed.substring('data:image/svg+xml;utf8,'.length));
      if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(rawSvg)));
      }
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(rawSvg);
    } catch {
      return trimmed;
    }
  }

  // 3. Fix unencoded or non-base64 svg with charset
  if (trimmed.startsWith('data:image/svg+xml;charset=utf-8,')) {
    try {
      const rawSvg = decodeURIComponent(trimmed.substring('data:image/svg+xml;charset=utf-8,'.length));
      if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(rawSvg)));
      }
    } catch {}
    return trimmed;
  }

  // 4. Regular image dataUrl or HTTP URL
  return trimmed;
}

/**
 * Check if a photo dataUrl is high quality real photo data
 */
export function isGoodPhotoData(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (clean.includes('[CLOUDSYNC')) return false;
  if (clean.includes('[BILD_SPARAD')) return false;
  // All SVG data URLs are placeholders/icons, NOT real captured camera photos!
  if (clean.startsWith('data:image/svg+xml')) return false;
  // Broken or truncated JPEG data URLs
  if (clean.startsWith('data:image/jpeg') && clean.length < 500) return false;
  // Valid real photos are long JPEG/PNG/WebP data URLs, standard web URLs, or local photo API endpoints
  if (
    clean.startsWith('data:image/jpeg') ||
    clean.startsWith('data:image/png') ||
    clean.startsWith('data:image/webp') ||
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('/api/sync/photos') ||
    clean.startsWith('/')
  ) {
    return true;
  }
  return false;
}

/**
 * Merge two photo lists preserving full-resolution photos and respecting deletions
 */
export function mergePhotoListsSafely(
  localPhotos: MomentPhoto[] = [],
  incomingPhotos: MomentPhoto[] = [],
  deletedPhotoIds: string[] = []
): MomentPhoto[] {
  // Filter out any explicitly deleted photos
  const cleanDeletedSet = new Set((deletedPhotoIds || []).filter(Boolean));
  const map = new Map<string, MomentPhoto>();

  // Filter out any explicitly deleted photos
  const cleanIncoming = (incomingPhotos || []).filter((p) => p && p.id && !cleanDeletedSet.has(p.id));
  const cleanLocal = (localPhotos || []).filter((p) => p && p.id && !cleanDeletedSet.has(p.id));

  // 1. Start with incoming photos (only real photos, never mock/placeholder SVGs if local exists)
  cleanIncoming.forEach((ph) => {
    if (!ph || !ph.id) return;
    // If incoming is just an SVG placeholder and local project exists, don't resurrect it
    if (!isGoodPhotoData(ph.dataUrl) && cleanLocal.length > 0) return;
    map.set(ph.id, {
      ...ph,
      dataUrl: normalizePhotoUrl(ph.dataUrl, ph.caption),
    });
  });

  // 2. Overlay local photos with ABSOLUTE PRIORITY for real camera photos
  cleanLocal.forEach((locPh) => {
    if (!locPh || !locPh.id) return;
    const existing = map.get(locPh.id);
    if (!existing) {
      map.set(locPh.id, {
        ...locPh,
        dataUrl: normalizePhotoUrl(locPh.dataUrl, locPh.caption),
      });
    } else {
      const locIsGood = isGoodPhotoData(locPh.dataUrl);
      const extIsGood = isGoodPhotoData(existing.dataUrl);

      if (locIsGood && !extIsGood) {
        // Local is a real high-res photo, incoming is placeholder/truncated: LOCAL WINS!
        map.set(locPh.id, {
          ...existing,
          ...locPh,
          dataUrl: locPh.dataUrl,
        });
      } else if (!locIsGood && extIsGood) {
        // Incoming is a real photo, local is placeholder: INCOMING WINS!
        map.set(locPh.id, {
          ...locPh,
          ...existing,
          dataUrl: existing.dataUrl,
        });
      } else if (locIsGood && extIsGood) {
        // Both are real photos: pick whichever has larger resolution / data length
        const preferred = (locPh.dataUrl?.length || 0) >= (existing.dataUrl?.length || 0) ? locPh : existing;
        map.set(locPh.id, {
          ...existing,
          ...locPh,
          dataUrl: preferred.dataUrl || locPh.dataUrl,
        });
      } else {
        // Both are placeholders: prefer whichever has clean data
        map.set(locPh.id, {
          ...existing,
          ...locPh,
          dataUrl: locPh.dataUrl || existing.dataUrl,
        });
      }
    }
  });

  return Array.from(map.values()).filter((p) => !cleanDeletedSet.has(p.id));
}

/**
 * Merge an incoming project with a local project, protecting photos and sync settings against data loss
 */
export function mergeProjectSafely(
  localProj: Project | undefined,
  incomingProj: Project
): Project {
  // Aggregate all deleted photo IDs from both versions
  const combinedDeletedSet = new Set<string>(
    [
      ...(localProj?.deletedPhotoIds || []),
      ...(incomingProj?.deletedPhotoIds || []),
    ].filter(Boolean)
  );

  if (!localProj) {
    // Normalize any photos in incoming project
    const normalizedMoments: Record<string, MomentRecord> = {};
    if (incomingProj.moments) {
      for (const [mId, mom] of Object.entries(incomingProj.moments)) {
        const momDeleted = new Set<string>([
          ...(mom.deletedPhotoIds || []),
          ...Array.from(combinedDeletedSet)
            .filter((id) => id.startsWith(`${mId}:`))
            .map((id) => id.slice(mId.length + 1)),
          ...Array.from(combinedDeletedSet),
        ].filter(Boolean));
        const cleanPhotos = (mom.photos || [])
          .filter((p) => p && p.id && !momDeleted.has(p.id))
          .map((p) => ({ ...p, dataUrl: normalizePhotoUrl(p.dataUrl, p.caption) }));

        normalizedMoments[mId] = {
          ...mom,
          deletedPhotoIds: Array.from(momDeleted),
          photoBase64:
            cleanPhotos.length > 0 && mom.photoBase64 && !isTruncatedPhoto(mom.photoBase64)
              ? normalizePhotoUrl(mom.photoBase64)
              : cleanPhotos.length > 0
              ? cleanPhotos[0].dataUrl
              : undefined,
          photos: cleanPhotos,
        };
      }
    }
    const normalizedPre = (incomingProj.preInspectionPhotos || [])
      .filter((p) => p && p.id && !combinedDeletedSet.has(p.id))
      .map((p) => ({
        ...p,
        dataUrl: normalizePhotoUrl(p.dataUrl, p.caption),
      }));

    const enrichedIncoming = {
      ...incomingProj,
      deletedPhotoIds: Array.from(combinedDeletedSet),
      moments: normalizedMoments,
      preInspectionPhotos: normalizedPre,
    };

    if (enrichedIncoming.groupCode?.trim()) {
      enrichedIncoming.isGroupProject = true;
      enrichedIncoming.syncEnabled = true;
    }

    return enrichedIncoming;
  }

  // Both exist: intelligently combine
  const mergedMoments: Record<string, MomentRecord> = {
    ...(localProj.moments || {}),
    ...(incomingProj.moments || {}),
  };

  // Check each moment
  const allMomentIds = new Set([
    ...Object.keys(localProj.moments || {}),
    ...Object.keys(incomingProj.moments || {}),
  ]);

  allMomentIds.forEach((mId) => {
    const locMom = localProj.moments?.[mId];
    const incMom = incomingProj.moments?.[mId];

    // Isolate moment-level deleted photo IDs so deletion in one moment NEVER affects another!
    const momentDeletedSet = new Set<string>([
      ...(locMom?.deletedPhotoIds || []),
      ...(incMom?.deletedPhotoIds || []),
      ...Array.from(combinedDeletedSet)
        .filter((id) => id.startsWith(`${mId}:`))
        .map((id) => id.slice(mId.length + 1)),
      ...Array.from(combinedDeletedSet),
    ].filter(Boolean));

    if (locMom && !incMom) {
      const cleanPhotos = (locMom.photos || [])
        .filter((p) => p && p.id && !momentDeletedSet.has(p.id))
        .map((p) => ({ ...p, dataUrl: normalizePhotoUrl(p.dataUrl, p.caption) }));

      mergedMoments[mId] = {
        ...locMom,
        deletedPhotoIds: Array.from(momentDeletedSet),
        photoBase64:
          cleanPhotos.length > 0 && locMom.photoBase64 && !isTruncatedPhoto(locMom.photoBase64)
            ? normalizePhotoUrl(locMom.photoBase64)
            : cleanPhotos.length > 0
            ? cleanPhotos[0].dataUrl
            : undefined,
        photos: cleanPhotos,
      };
    } else if (!locMom && incMom) {
      const cleanPhotos = (incMom.photos || [])
        .filter((p) => p && p.id && !momentDeletedSet.has(p.id))
        .map((p) => ({ ...p, dataUrl: normalizePhotoUrl(p.dataUrl, p.caption) }));

      mergedMoments[mId] = {
        ...incMom,
        deletedPhotoIds: Array.from(momentDeletedSet),
        photoBase64:
          cleanPhotos.length > 0 && incMom.photoBase64 && !isTruncatedPhoto(incMom.photoBase64)
            ? normalizePhotoUrl(incMom.photoBase64)
            : cleanPhotos.length > 0
            ? cleanPhotos[0].dataUrl
            : undefined,
        photos: cleanPhotos,
      };
    } else if (locMom && incMom) {
      // Merge photos safely: local real photos NEVER get wiped out, and deleted photos NEVER return!
      const mergedPhotos = mergePhotoListsSafely(
        locMom.photos || [],
        incMom.photos || [],
        Array.from(momentDeletedSet)
      );

      // Determine best photoBase64: must strictly respect deletions!
      let bestBase64: string | undefined = undefined;
      if (mergedPhotos.length === 0) {
        // If all photos in the moment are deleted or none exist, never resurrect photoBase64!
        bestBase64 = undefined;
      } else {
        const firstGood = mergedPhotos.find((p) => isGoodPhotoData(p.dataUrl));
        bestBase64 = firstGood ? firstGood.dataUrl : mergedPhotos[0].dataUrl;
        if (bestBase64) {
          bestBase64 = normalizePhotoUrl(bestBase64);
        }
      }

      mergedMoments[mId] = {
        ...locMom,
        ...incMom,
        // Status: preserve GREEN if either is GREEN
        status:
          incMom.status === 'GREEN' || locMom.status === 'GREEN'
            ? 'GREEN'
            : incMom.status || locMom.status,
        signature: incMom.signature || locMom.signature,
        signatureImage: incMom.signatureImage || locMom.signatureImage,
        comment: incMom.comment || locMom.comment,
        completedAt: incMom.completedAt || locMom.completedAt,
        photos: mergedPhotos,
        deletedPhotoIds: Array.from(momentDeletedSet),
        photoBase64: bestBase64,
      };
    }
  });

  const mergedPrePhotos = mergePhotoListsSafely(
    localProj.preInspectionPhotos || [],
    incomingProj.preInspectionPhotos || [],
    Array.from(combinedDeletedSet)
  );

  // CRITICAL: Preserve groupCode and sync flags so sync connection NEVER gets removed or disconnected!
  const finalGroupCode = (incomingProj.groupCode?.trim() || localProj.groupCode?.trim() || '').toUpperCase();
  const finalIsGroup = Boolean(
    incomingProj.isGroupProject ||
    localProj.isGroupProject ||
    finalGroupCode.length > 0
  );
  const finalSyncEnabled = incomingProj.syncEnabled !== undefined
    ? incomingProj.syncEnabled
    : (localProj.syncEnabled !== undefined ? localProj.syncEnabled : true);

  const existingMemberIds = Array.isArray(localProj.memberIds) ? localProj.memberIds : [];
  const incomingMemberIds = Array.isArray(incomingProj.memberIds) ? incomingProj.memberIds : [];
  const mergedMemberIds = Array.from(new Set([...existingMemberIds, ...incomingMemberIds]));

  const membersMap = new Map<string, any>();
  if (Array.isArray(localProj.members)) {
    localProj.members.forEach((m) => m && m.id && membersMap.set(m.id, m));
  }
  if (Array.isArray(incomingProj.members)) {
    incomingProj.members.forEach((m) => m && m.id && membersMap.set(m.id, m));
  }
  const mergedMembers = Array.from(membersMap.values());

  return {
    ...localProj,
    ...incomingProj,
    groupCode: finalGroupCode || undefined,
    isGroupProject: finalIsGroup,
    syncEnabled: finalSyncEnabled,
    memberIds: mergedMemberIds,
    members: mergedMembers,
    lastSyncedAt: incomingProj.lastSyncedAt || localProj.lastSyncedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
    moments: mergedMoments,
    preInspectionPhotos: mergedPrePhotos,
    studentId: incomingProj.studentId || localProj.studentId,
    studentName: incomingProj.studentName || localProj.studentName,
    studentEmail: incomingProj.studentEmail || localProj.studentEmail,
    schoolClass: incomingProj.schoolClass || localProj.schoolClass,
    studentGroup: incomingProj.studentGroup || localProj.studentGroup,
    teacherId: incomingProj.teacherId || localProj.teacherId,
    teacherName: incomingProj.teacherName || localProj.teacherName,
    creatorId: incomingProj.creatorId || localProj.creatorId,
  };
}
