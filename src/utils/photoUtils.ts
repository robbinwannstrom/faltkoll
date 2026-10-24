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
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="1" opacity="0.4"/>
      </pattern>
    </defs>
    <rect width="640" height="480" fill="url(#g_f97316)"/>
    <rect width="640" height="480" fill="url(#grid)"/>
    <rect x="24" y="24" width="592" height="432" rx="16" fill="none" stroke="#f97316" stroke-width="2" stroke-dasharray="8 6" opacity="0.9"/>
    <circle cx="320" cy="180" r="54" fill="#f97316" opacity="0.18"/>
    <text x="320" y="172" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#f97316" text-anchor="middle">📷 FÄLTDOKUMENTATION</text>
    <text x="320" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#ffffff" text-anchor="middle">${cleanTitle}</text>
    <text x="320" y="245" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#cbd5e1" text-anchor="middle">${cleanSub}</text>
    <rect x="35" y="395" width="570" height="50" rx="12" fill="#020617" opacity="0.92" stroke="#334155" stroke-width="1"/>
    <text x="55" y="426" font-family="ui-monospace, monospace" font-size="13" font-weight="900" fill="#f97316">FÄLTKOLL • ${cleanCat.toUpperCase()}</text>
    <text x="585" y="426" font-family="ui-monospace, monospace" font-size="12" fill="#e2e8f0" text-anchor="end">${timeStr}</text>
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

export function normalizePhotoUrl(
  dataUrl?: string | null,
  fallbackTitle?: string,
  photoId?: string
): string {
  const trimmed = dataUrl && typeof dataUrl === 'string' ? dataUrl.trim() : '';

  // 1. If empty or truncated but photoId is provided, point to direct raw image stream
  if (!trimmed || isTruncatedPhoto(trimmed)) {
    if (photoId) {
      return `/api/photos/${photoId}`;
    }
    return fallbackTitle
      ? createPhotoPlaceholderSvg(
          fallbackTitle,
          'Klicka "Ladda upp / Ersätt" för att uppdatera med originalbild'
        )
      : '';
  }

  // 2. If pointing to JSON endpoint, convert to binary raw image endpoint
  if (trimmed.startsWith('/api/sync/photos/')) {
    const extractedId = trimmed.replace('/api/sync/photos/', '').split('?')[0];
    if (extractedId) {
      return `/api/photos/${extractedId}`;
    }
  }

  // 3. Fix invalid `data:image/svg+xml;utf8,...` MIME type
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

  // 4. Fix unencoded or non-base64 svg with charset
  if (trimmed.startsWith('data:image/svg+xml;charset=utf-8,')) {
    try {
      const rawSvg = decodeURIComponent(trimmed.substring('data:image/svg+xml;charset=utf-8,'.length));
      if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(rawSvg)));
      }
    } catch {}
    return trimmed;
  }

  // 5. Regular image dataUrl or HTTP URL
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
  // Valid real photos are long JPEG/PNG/WebP data URLs, standard web URLs, or photo API endpoints
  if (
    clean.startsWith('data:image/jpeg') ||
    clean.startsWith('data:image/png') ||
    clean.startsWith('data:image/webp') ||
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('/api/photos/') ||
    clean.startsWith('/api/sync/photos/') ||
    clean.startsWith('/')
  ) {
    return true;
  }
  return false;
}

/**
 * Dedicated diagnostic logger for photo lifecycle and deletion tracing
 */
export function logPhotoDiagnostic(
  action: string,
  details: {
    photoId?: string;
    projectId?: string;
    momentId?: string;
    source?: string;
    extra?: any;
  }
) {
  const timestamp = new Date().toISOString();
  console.log(
    `[FÄLTKOLL FOTO-DIAGNOSTIK ${timestamp}] ${action} | Foto-ID: ${details.photoId || 'N/A'} | Projekt: ${details.projectId || 'N/A'} | Moment: ${details.momentId || 'N/A'} | Källa: ${details.source || 'N/A'}`,
    details.extra ? details.extra : ''
  );
}

/**
 * Merge two photo lists preserving full-resolution photos and respecting deletions
 */
export function mergePhotoListsSafely(
  localPhotos: MomentPhoto[] = [],
  incomingPhotos: MomentPhoto[] = [],
  deletedPhotoIds: string[] = [],
  momentId?: string
): MomentPhoto[] {
  // Aggregate all deleted photo IDs and variants (with and without moment prefix)
  const cleanDeletedSet = new Set<string>();
  (deletedPhotoIds || []).filter(Boolean).forEach((id) => {
    cleanDeletedSet.add(id);
    if (id.includes(':')) {
      cleanDeletedSet.add(id.split(':')[1]);
    }
  });

  const map = new Map<string, MomentPhoto>();

  // Filter out any explicitly deleted photos from incoming
  const cleanIncoming = (incomingPhotos || []).filter((p) => {
    if (!p || !p.id) return false;
    const isDeleted =
      cleanDeletedSet.has(p.id) ||
      (momentId ? cleanDeletedSet.has(`${momentId}:${p.id}`) : false);
    if (isDeleted) {
      logPhotoDiagnostic('ÅTERINFÖRING BLOCKERAD', {
        photoId: p.id,
        momentId,
        source: 'mergePhotoListsSafely (Inkommande foto från moln/server fanns i deletedPhotoIds)',
      });
      return false;
    }
    return true;
  });

  // Filter out any explicitly deleted photos from local
  const cleanLocal = (localPhotos || []).filter((p) => {
    if (!p || !p.id) return false;
    const isDeleted =
      cleanDeletedSet.has(p.id) ||
      (momentId ? cleanDeletedSet.has(`${momentId}:${p.id}`) : false);
    if (isDeleted) {
      logPhotoDiagnostic('BORTTAGEN BILD FILTRERAD', {
        photoId: p.id,
        momentId,
        source: 'mergePhotoListsSafely (Lokalt foto fanns i deletedPhotoIds)',
      });
      return false;
    }
    return true;
  });

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

  return Array.from(map.values()).filter((p) => {
    const isDeleted =
      cleanDeletedSet.has(p.id) ||
      (momentId ? cleanDeletedSet.has(`${momentId}:${p.id}`) : false);
    return !isDeleted;
  });
}

/**
 * Ensures that if a photo was moved between phases/exercises, old snapshots do not
 * re-introduce duplicate instances in the previous moment. The most recent location
 * (evaluated by movedAt, movedToMomentId, or data fidelity) retains the photo.
 */
export function pruneMovedPhotoDuplicatesAcrossMoments(
  moments: Record<string, MomentRecord>,
  preInspectionPhotos?: MomentPhoto[]
): {
  moments: Record<string, MomentRecord>;
  preInspectionPhotos: MomentPhoto[];
} {
  const resultMoments: Record<string, MomentRecord> = { ...moments };
  let resultPre: MomentPhoto[] = [...(preInspectionPhotos || [])];

  interface PhotoOccurrence {
    photo: MomentPhoto;
    locationType: 'moment' | 'pre';
    momentId?: string;
  }
  const photoOccurrences = new Map<string, PhotoOccurrence[]>();

  for (const [mId, mom] of Object.entries(resultMoments)) {
    if (!mom || !Array.isArray(mom.photos)) continue;
    mom.photos.forEach((p) => {
      if (!p || !p.id) return;
      const list = photoOccurrences.get(p.id) || [];
      list.push({ photo: p, locationType: 'moment', momentId: mId });
      photoOccurrences.set(p.id, list);
    });
  }

  resultPre.forEach((p) => {
    if (!p || !p.id) return;
    const list = photoOccurrences.get(p.id) || [];
    list.push({ photo: p, locationType: 'pre' });
    photoOccurrences.set(p.id, list);
  });

  photoOccurrences.forEach((occurrences, photoId) => {
    if (occurrences.length <= 1) return;

    // Pick winner
    let winner = occurrences[0];
    for (let i = 1; i < occurrences.length; i++) {
      const candidate = occurrences[i];
      const winMovedAt = winner.photo.movedAt ? new Date(winner.photo.movedAt).getTime() : 0;
      const candMovedAt = candidate.photo.movedAt ? new Date(candidate.photo.movedAt).getTime() : 0;

      if (candMovedAt > winMovedAt) {
        winner = candidate;
      } else if (candMovedAt === winMovedAt) {
        if (candidate.locationType === 'moment' && candidate.photo.movedToMomentId === candidate.momentId) {
          winner = candidate;
        } else if ((candidate.photo.dataUrl?.length || 0) > (winner.photo.dataUrl?.length || 0)) {
          winner = candidate;
        }
      }
    }

    // Prune losing occurrences
    occurrences.forEach((occ) => {
      if (occ === winner) return;

      if (occ.locationType === 'moment' && occ.momentId && resultMoments[occ.momentId]) {
        const mom = resultMoments[occ.momentId];
        const updatedPhotos = (mom.photos || []).filter((p) => p.id !== photoId);
        let updatedB64 = mom.photoBase64;
        if (updatedB64 && (mom.photoBase64 === occ.photo.dataUrl || !updatedPhotos.some((p) => p.dataUrl === updatedB64))) {
          updatedB64 = updatedPhotos[0]?.dataUrl;
        }
        resultMoments[occ.momentId] = {
          ...mom,
          photos: updatedPhotos,
          photoBase64: updatedB64,
        };
      } else if (occ.locationType === 'pre') {
        resultPre = resultPre.filter((p) => p.id !== photoId);
      }
    });
  });

  return {
    moments: resultMoments,
    preInspectionPhotos: resultPre,
  };
}

/**
 * Merge an incoming project with a local project, protecting photos and sync settings against data loss
 */
export function mergeProjectSafely(
  localProj: Project | undefined,
  incomingProj: Project
): Project {
  // Aggregate all deleted photo IDs from both versions and all moments comprehensively
  const combinedDeletedSet = new Set<string>();

  const collectDeletions = (proj?: Project) => {
    if (!proj) return;
    (proj.deletedPhotoIds || []).filter(Boolean).forEach((id) => {
      const rawId = id.includes(':') ? id.split(':')[1] : id;
      combinedDeletedSet.add(rawId);
      combinedDeletedSet.add(id);
    });
    if (proj.moments) {
      Object.entries(proj.moments).forEach(([mId, m]) => {
        (m?.deletedPhotoIds || []).filter(Boolean).forEach((id) => {
          const rawId = id.includes(':') ? id.split(':')[1] : id;
          combinedDeletedSet.add(rawId);
          combinedDeletedSet.add(`${mId}:${rawId}`);
        });
      });
    }
  };

  collectDeletions(localProj);
  collectDeletions(incomingProj);

  if (!localProj) {
    // Normalize any photos in incoming project
    const normalizedMoments: Record<string, MomentRecord> = {};
    if (incomingProj.moments) {
      for (const [mId, mom] of Object.entries(incomingProj.moments)) {
        const momDeleted = new Set<string>([
          ...(mom.deletedPhotoIds || []),
          ...Array.from(combinedDeletedSet)
            .filter((id) => !id.includes(':') || id.startsWith(`${mId}:`))
            .map((id) => (id.includes(':') ? id.split(':')[1] : id)),
          ...Array.from(combinedDeletedSet),
        ].filter(Boolean));

        const cleanPhotos = (mom.photos || [])
          .filter((p) => {
            if (!p || !p.id) return false;
            const isDel = momDeleted.has(p.id) || momDeleted.has(`${mId}:${p.id}`) || combinedDeletedSet.has(p.id);
            if (isDel) {
              logPhotoDiagnostic('BORTTAGEN BILD FILTRERAD I NYTT PROJEKT', {
                photoId: p.id,
                projectId: incomingProj.id,
                momentId: mId,
                source: 'mergeProjectSafely (!localProj)',
              });
              return false;
            }
            return true;
          })
          .map((p) => ({ ...p, dataUrl: normalizePhotoUrl(p.dataUrl, p.caption) }));

        let b64: string | undefined = undefined;
        if (cleanPhotos.length > 0) {
          b64 = cleanPhotos[0].dataUrl;
        } else if (mom.photoBase64 && !momDeleted.has('p_1') && !momDeleted.has(`ph_${mId}_base`) && !isTruncatedPhoto(mom.photoBase64) && momDeleted.size === 0) {
          b64 = normalizePhotoUrl(mom.photoBase64);
        }

        normalizedMoments[mId] = {
          ...mom,
          deletedPhotoIds: Array.from(momDeleted),
          photoBase64: b64,
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

    const prunedIncoming = pruneMovedPhotoDuplicatesAcrossMoments(normalizedMoments, normalizedPre);

    const enrichedIncoming = {
      ...incomingProj,
      deletedPhotoIds: Array.from(combinedDeletedSet),
      moments: prunedIncoming.moments,
      preInspectionPhotos: prunedIncoming.preInspectionPhotos,
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

    // Isolate moment-level deleted photo IDs
    const momentDeletedSet = new Set<string>([
      ...(locMom?.deletedPhotoIds || []),
      ...(incMom?.deletedPhotoIds || []),
      ...Array.from(combinedDeletedSet)
        .filter((id) => !id.includes(':') || id.startsWith(`${mId}:`))
        .map((id) => (id.includes(':') ? id.split(':')[1] : id)),
      ...Array.from(combinedDeletedSet),
    ].filter(Boolean));

    if (locMom && !incMom) {
      const cleanPhotos = (locMom.photos || [])
        .filter((p) => p && p.id && !momentDeletedSet.has(p.id) && !momentDeletedSet.has(`${mId}:${p.id}`))
        .map((p) => ({ ...p, dataUrl: normalizePhotoUrl(p.dataUrl, p.caption) }));

      let b64: string | undefined = undefined;
      if (cleanPhotos.length > 0) {
        b64 = cleanPhotos[0].dataUrl;
      } else if (locMom.photoBase64 && !momentDeletedSet.has('p_1') && !momentDeletedSet.has(`ph_${mId}_base`) && !isTruncatedPhoto(locMom.photoBase64) && momentDeletedSet.size === 0) {
        b64 = normalizePhotoUrl(locMom.photoBase64);
      }

      mergedMoments[mId] = {
        ...locMom,
        deletedPhotoIds: Array.from(momentDeletedSet),
        photoBase64: b64,
        photos: cleanPhotos,
      };
    } else if (!locMom && incMom) {
      const cleanPhotos = (incMom.photos || [])
        .filter((p) => p && p.id && !momentDeletedSet.has(p.id) && !momentDeletedSet.has(`${mId}:${p.id}`))
        .map((p) => ({ ...p, dataUrl: normalizePhotoUrl(p.dataUrl, p.caption) }));

      let b64: string | undefined = undefined;
      if (cleanPhotos.length > 0) {
        b64 = cleanPhotos[0].dataUrl;
      } else if (incMom.photoBase64 && !momentDeletedSet.has('p_1') && !momentDeletedSet.has(`ph_${mId}_base`) && !isTruncatedPhoto(incMom.photoBase64) && momentDeletedSet.size === 0) {
        b64 = normalizePhotoUrl(incMom.photoBase64);
      }

      mergedMoments[mId] = {
        ...incMom,
        deletedPhotoIds: Array.from(momentDeletedSet),
        photoBase64: b64,
        photos: cleanPhotos,
      };
    } else if (locMom && incMom) {
      // Merge photos safely: local real photos NEVER get wiped out, and deleted photos NEVER return!
      const mergedPhotos = mergePhotoListsSafely(
        locMom.photos || [],
        incMom.photos || [],
        Array.from(momentDeletedSet),
        mId
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

  const prunedMerged = pruneMovedPhotoDuplicatesAcrossMoments(mergedMoments, mergedPrePhotos);

  return {
    ...localProj,
    ...incomingProj,
    deletedPhotoIds: Array.from(combinedDeletedSet),
    groupCode: finalGroupCode || undefined,
    isGroupProject: finalIsGroup,
    syncEnabled: finalSyncEnabled,
    memberIds: mergedMemberIds,
    members: mergedMembers,
    lastSyncedAt: incomingProj.lastSyncedAt || localProj.lastSyncedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
    moments: prunedMerged.moments,
    preInspectionPhotos: prunedMerged.preInspectionPhotos,
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
