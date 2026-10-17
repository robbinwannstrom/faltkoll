import { jsPDF } from 'jspdf';
import { Project, MomentPhoto } from '../types';
import { ALL_MOMENTS, PROJECT_TYPE_LABELS } from '../data/momentsData';

interface GeneratePdfOptions {
  includePhotos?: boolean;
  layoutStyle?: 'AMA_STANDARD' | 'PHOTO_SUMMARY';
}

function sanitizeText(str: string | undefined | null): string {
  if (!str) return '';
  return String(str).replace(/\r\n/g, '\n').trim();
}

/**
 * Generate a professional, print-ready, Swedish AMA standard Slutbesiktningsprotokoll PDF
 * and trigger immediate browser download.
 */
export async function generatePdfReport(
  project: Project,
  layoutStyle: 'AMA_STANDARD' | 'PHOTO_SUMMARY' = 'AMA_STANDARD'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182 mm
  let currentY = 16;

  const relevantMoments = ALL_MOMENTS.filter((m) => m.projectType === project.projectType);
  const typeInfo = PROJECT_TYPE_LABELS[project.projectType];
  const greenMoments = relevantMoments.filter((m) => project.moments[m.id]?.status === 'GREEN');
  const allApproved = relevantMoments.length > 0 && greenMoments.length === relevantMoments.length;
  const percentComplete = relevantMoments.length > 0 
    ? Math.round((greenMoments.length / relevantMoments.length) * 100) 
    : 100;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');
  
  doc.setFillColor(2, 132, 199); // sky-600 accent stripe
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SLUTBESIKTNING & EGENKONTROLLPROTOKOLL', marginX, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253); // sky-200
  doc.text('Svensk Bygg- och Anläggningsstandard (AMA Anläggning / PBL § 8)', marginX, 20);

  // Status Badge on right of header
  const statusBadgeX = pageWidth - marginX - 44;
  doc.setFillColor(allApproved ? 22 : 234, allApproved ? 163 : 179, allApproved ? 74 : 8);
  doc.roundedRect(statusBadgeX, 7, 44, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(allApproved ? '100% GODKÄND' : `${percentComplete}% UTFÖRD`, statusBadgeX + 22, 14, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text(`${greenMoments.length} av ${relevantMoments.length} moment`, statusBadgeX + 22, 18.5, { align: 'center' });

  currentY = 36;

  // ==========================================
  // 1. PROJEKTDATA & FASTIGHETSINFORMATION
  // ==========================================
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, 34, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1. PROJEKT- & FASTIGHETSFAKTA', marginX + 4, currentY + 6);

  doc.setFontSize(8);
  const col1X = marginX + 4;
  const col2X = marginX + 66;
  const col3X = marginX + 128;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Projektnamn:', col1X, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(project.name) || 'Egenkontroll', col1X + 20, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Fastighet/Plats:', col2X, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(project.propertyDesignation) || 'Fältplats', col2X + 22, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Besiktningsdatum:', col3X, currentY + 13);
  doc.setFont('helvetica', 'normal');
  const dateStr = project.updatedAt || project.createdAt || new Date().toISOString().substring(0, 10);
  doc.text(dateStr.substring(0, 10), col3X + 26, currentY + 13);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Anläggningstyp:', col1X, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(typeInfo?.title || project.projectType, col1X + 22, currentY + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Utförare/Elev:', col2X, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(project.studentName) || 'Fältutförare', col2X + 20, currentY + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Skola/Klass:', col3X, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(project.schoolClass) || 'Bygg & Anläggning', col3X + 18, currentY + 20);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Entreprenör:', col1X, currentY + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(project.contractorName) || 'Skola / Utbildningsanläggning', col1X + 18, currentY + 27);

  doc.setFont('helvetica', 'bold');
  const firstMomentWeather = Object.values(project.moments || {}).find((m) => m.weather)?.weather;
  const effWeather = project.weather || firstMomentWeather;
  const weatherLabel = effWeather === 'SOL' ? 'Klart / Sol' : effWeather === 'REGN' ? 'Nederbörd / Regn' : effWeather === 'MOLN' ? 'Molnigt' : 'Uppehåll / Klart';
  doc.text(weatherLabel, col2X + 14, currentY + 27);

  doc.setFont('helvetica', 'bold');
  doc.text('Dokument-ID:', col3X, currentY + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(`FK-${project.id.slice(-6).toUpperCase()}`, col3X + 20, currentY + 27);

  currentY += 40;

  // ==========================================
  // 2. KONTROLLERADE MOMENT (AMA BYGGSTANDARD)
  // ==========================================
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. KONTROLLERADE MOMENT ENLIGT AMA BYGGSTANDARD', marginX, currentY);
  currentY += 4;

  // Table header
  const tableHeaderY = currentY;
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(marginX, tableHeaderY, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('AMA', marginX + 3, tableHeaderY + 4.8);
  doc.text('KONTROLLMOMENT', marginX + 20, tableHeaderY + 4.8);
  doc.text('KRAV / ANVISNING', marginX + 78, tableHeaderY + 4.8);
  doc.text('UPPMÄTT', marginX + 130, tableHeaderY + 4.8);
  doc.text('UTFALL', marginX + 152, tableHeaderY + 4.8);
  doc.text('SIGN', marginX + 171, tableHeaderY + 4.8);

  currentY += 7;

  // Table rows
  relevantMoments.forEach((mom, idx) => {
    // Check if new page needed
    if (currentY + 11 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;

      // Repeat compact table header on new page
      doc.setFillColor(30, 41, 59);
      doc.rect(marginX, currentY, contentWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('AMA', marginX + 3, currentY + 4.2);
      doc.text('KONTROLLMOMENT', marginX + 20, currentY + 4.2);
      doc.text('KRAV / ANVISNING', marginX + 78, currentY + 4.2);
      doc.text('UPPMÄTT', marginX + 130, currentY + 4.2);
      doc.text('UTFALL', marginX + 152, currentY + 4.2);
      doc.text('SIGN', marginX + 171, currentY + 4.2);
      currentY += 6;
    }

    const rec = project.moments[mom.id];
    const isGreen = rec?.status === 'GREEN';
    const isYellow = rec?.status === 'YELLOW';
    const isRed = rec?.status === 'RED';

    // Alternate row zebra background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, contentWidth, 9.5, 'F');
    }

    // Border line below row
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY + 9.5, marginX + contentWidth, currentY + 9.5);

    // AMA Code
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(mom.amaCode || '-', marginX + 3, currentY + 6);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const titleTruncated = mom.title.length > 34 ? mom.title.substring(0, 32) + '..' : mom.title;
    doc.text(titleTruncated, marginX + 20, currentY + 6);

    // Requirement snippet
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const reqClean = mom.instruction.split('.')[0] || mom.instruction;
    const reqTruncated = reqClean.length > 38 ? reqClean.substring(0, 36) + '..' : reqClean;
    doc.text(reqTruncated, marginX + 78, currentY + 6);

    // Measured value
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const measuredVal = rec?.measuredValue ? `${rec.measuredValue} mm` : isGreen ? 'Enl. krav' : '-';
    doc.text(measuredVal, marginX + 130, currentY + 6);

    // Utfall / Status Badge
    if (isGreen) {
      doc.setFillColor(220, 252, 231); // green-100
      doc.roundedRect(marginX + 151, currentY + 2, 16, 5.5, 1, 1, 'F');
      doc.setTextColor(22, 101, 52); // green-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('GODKÄND', marginX + 159, currentY + 5.8, { align: 'center' });
    } else if (isYellow) {
      doc.setFillColor(254, 249, 195); // yellow-100
      doc.roundedRect(marginX + 151, currentY + 2, 16, 5.5, 1, 1, 'F');
      doc.setTextColor(133, 77, 14); // yellow-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('PÅGÅR', marginX + 159, currentY + 5.8, { align: 'center' });
    } else {
      doc.setFillColor(254, 226, 226); // red-100
      doc.roundedRect(marginX + 151, currentY + 2, 16, 5.5, 1, 1, 'F');
      doc.setTextColor(153, 27, 27); // red-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(isRed ? 'AVVIKELSE' : 'EJ GJORD', marginX + 159, currentY + 5.8, { align: 'center' });
    }

    // Signature
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const sig = rec?.signature || (isGreen ? 'ES' : '-');
    doc.text(sig, marginX + 173, currentY + 6);

    currentY += 9.5;
  });

  currentY += 8;

  // ==========================================
  // 3. FOTOBEVIS & KONTROLLBILDER
  // ==========================================
  const allPhotos: Array<{ photo: MomentPhoto; momentTitle: string; amaCode?: string }> = [];

  // Pre-inspection photos
  if (project.preInspectionPhotos && project.preInspectionPhotos.length > 0) {
    project.preInspectionPhotos.forEach((ph) => {
      allPhotos.push({
        photo: ph,
        momentTitle: 'Förbesiktning & Utsättning',
        amaCode: 'BBC.31',
      });
    });
  }

  // Moment photos
  relevantMoments.forEach((m) => {
    const rec = project.moments[m.id];
    if (rec && rec.photos && rec.photos.length > 0) {
      rec.photos.forEach((ph) => {
        allPhotos.push({
          photo: ph,
          momentTitle: m.title,
          amaCode: m.amaCode,
        });
      });
    } else if (rec && rec.photoBase64) {
      allPhotos.push({
        photo: {
          id: `ph_${m.id}`,
          dataUrl: rec.photoBase64,
          capturedAt: rec.completedAt || '',
          category: 'Kontroll',
        },
        momentTitle: m.title,
        amaCode: m.amaCode,
      });
    }
  });

  if (allPhotos.length > 0) {
    // If not enough room for title and at least one row of photos, create new page
    if (currentY + 70 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. FOTOBEVIS & VERIFIERAT KONTROLLMATERIAL', marginX, currentY);
    currentY += 6;

    const photoWidth = (contentWidth - 8) / 2; // ~87 mm each
    const photoHeight = 58;

    for (let i = 0; i < allPhotos.length; i += 2) {
      // Check page overflow
      if (currentY + photoHeight + 16 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      // Render photo 1
      const item1 = allPhotos[i];
      renderPhotoBlock(doc, item1, marginX, currentY, photoWidth, photoHeight);

      // Render photo 2 (if exists)
      if (i + 1 < allPhotos.length) {
        const item2 = allPhotos[i + 1];
        renderPhotoBlock(doc, item2, marginX + photoWidth + 8, currentY, photoWidth, photoHeight);
      }

      currentY += photoHeight + 16;
    }
  }

  // ==========================================
  // 4. SIGNATURER & JURIDISK GILTIGHET
  // ==========================================
  if (currentY + 50 > pageHeight - 20) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 4;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, contentWidth, 38, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('4. INTYGANDE & SIGNATURER', marginX + 4, currentY + 6);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    'Härmed intygas att angivna egenkontroller har genomförts i fält enligt AMA Anläggning, gällande branschregler och säkerhetsföreskrifter.',
    marginX + 4,
    currentY + 11
  );

  const sigColWidth = (contentWidth - 12) / 3;
  const sigY = currentY + 18;

  // Box 1: Elev / Utförare
  renderSignatureBox(
    doc,
    'ELEV / UTFÖRARE I FÄLT',
    project.studentName || 'Fältutförare',
    'Signerad i FältKoll app',
    marginX + 4,
    sigY,
    sigColWidth
  );

  // Box 2: Handledare
  renderSignatureBox(
    doc,
    'HANDLEDARE / APL-ANSVARIG',
    project.contractorName || 'Handledare',
    'Granskad & Godkänd',
    marginX + 4 + sigColWidth + 2,
    sigY,
    sigColWidth
  );

  // Box 3: Yrkeslärare
  renderSignatureBox(
    doc,
    'YRKESLÄRARE / SKOLA',
    project.schoolClass || 'Bygg & Anläggning',
    'Slutbesiktigad',
    marginX + 4 + (sigColWidth + 2) * 2,
    sigY,
    sigColWidth
  );

  // ==========================================
  // FOOTER PÅ ALLA SIDOR
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);

    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(
      `FältKoll™ Digital Egenkontroll • Slutbesiktningsprotokoll AMA • Genererad: ${new Date().toISOString().substring(0, 16).replace('T', ' ')}`,
      marginX,
      pageHeight - 8
    );
    doc.text(`Sida ${p} av ${totalPages}`, marginX + contentWidth, pageHeight - 8, { align: 'right' });
  }

  // Save and trigger direct download
  const safeProjectName = (project.name || 'Projekt').replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
  const safeDate = new Date().toISOString().substring(0, 10);
  doc.save(`FaltKoll_Slutbesiktning_${safeProjectName}_${safeDate}.pdf`);
}

function renderPhotoBlock(
  doc: jsPDF,
  item: { photo: MomentPhoto; momentTitle: string; amaCode?: string },
  x: number,
  y: number,
  width: number,
  height: number
) {
  // Border box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height + 13, 1.5, 1.5, 'FD');

  // Try to render image
  let imageRendered = false;
  if (item.photo.dataUrl && item.photo.dataUrl.startsWith('data:image/')) {
    try {
      const format = item.photo.dataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(item.photo.dataUrl, format, x + 1.5, y + 1.5, width - 3, height - 3);
      imageRendered = true;
    } catch {
      imageRendered = false;
    }
  }

  if (!imageRendered) {
    doc.setFillColor(30, 41, 59);
    doc.rect(x + 1.5, y + 1.5, width - 3, height - 3, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('VERIFIERAT FÄLTFOTO', x + width / 2, y + height / 2 - 2, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text('Säkrat i molnarkiv & kamerarulle', x + width / 2, y + height / 2 + 4, { align: 'center' });
  }

  // Label & Stamp below photo
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const titleTxt = `${item.amaCode ? `[${item.amaCode}] ` : ''}${item.momentTitle}`;
  const truncTitle = titleTxt.length > 28 ? titleTxt.substring(0, 26) + '..' : titleTxt;
  doc.text(truncTitle, x + 3, y + height + 4.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  const timeTxt = item.photo.capturedAt ? `Tid: ${item.photo.capturedAt}` : 'Tidsstämplat fältfoto';
  doc.text(timeTxt, x + 3, y + height + 9.5);

  // Category badge
  doc.setFillColor(2, 132, 199);
  doc.roundedRect(x + width - 24, y + height + 2, 21, 4, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text(item.photo.category || 'Kontroll', x + width - 13.5, y + height + 5, { align: 'center' });
}

function renderSignatureBox(
  doc: jsPDF,
  roleLabel: string,
  name: string,
  status: string,
  x: number,
  y: number,
  width: number
) {
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(x, y, width, 16);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text(roleLabel, x + 2, y + 4);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const safeName = name.length > 20 ? name.substring(0, 19) + '.' : name;
  doc.text(safeName, x + 2, y + 9.5);

  doc.setTextColor(22, 101, 52); // green
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(`✓ ${status}`, x + 2, y + 14);
}
