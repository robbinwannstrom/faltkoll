import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  PlusCircle,
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
  Camera,
  CheckCircle2,
  Trash2,
  Edit3,
  Copy,
  Check,
  Download,
  Share2,
  PenTool,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  Wrench,
  HelpCircle,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  AtaItem,
  AtaCategory,
  AtaStatus,
  AtaPricingType,
  Project,
  UserAccount,
  MomentPhoto,
} from '../types';
import { fileToBase64Optimized, getFormattedCurrentTime } from '../db/indexedDb';

interface AtaModalProps {
  onClose: () => void;
  project: Project;
  onUpdateProject: (updatedProject: Project) => void;
  currentUser?: UserAccount | null;
  onInsertToNotes?: (text: string) => void;
}

const ATA_CATEGORIES: Array<{
  id: AtaCategory;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    id: 'HINDER_MARK',
    label: 'Oväntat markförhållande',
    icon: '🪨',
    description: 'Berg i schakt, stora stenblock, dålig bärighet, lera eller grundvatten.',
  },
  {
    id: 'BESTALLARANDRING',
    label: 'Beställarändring',
    icon: '📐',
    description: 'Byggherren/kunden önskar ändrad yta, annat mönster, utökat arbete eller materialbyte.',
  },
  {
    id: 'LEDNING_KABEL',
    label: 'Hindrande ledning/kabel/VA',
    icon: '⚡',
    description: 'Okända elkablar, fiber, gamla vattenrör eller brunnar som kräver anpassning.',
  },
  {
    id: 'PROJEKTERING',
    label: 'Projekterings-/ritningsmiss',
    icon: '📋',
    description: 'Höjder, ritningsmått eller marklinjer stämmer inte med verkligheten i fält.',
  },
  {
    id: 'FORCERING',
    label: 'Forcering & Tidsändring',
    icon: '⏱️',
    description: 'Överenskommen forcering, helgarbete eller ändrad tidplan på beställarens begäran.',
  },
  {
    id: 'OVRIGT',
    label: 'Övrigt tilläggsarbete',
    icon: '❓',
    description: 'Annat tillkommande eller avgående arbete utanför ursprunglig uppgift/avtal.',
  },
];

const STATUS_LABELS: Record<AtaStatus, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: {
    label: 'Utkast',
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  },
  SUBMITTED: {
    label: 'Anmäld / Granskning',
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-700',
  },
  APPROVED: {
    label: '✓ Godkänd',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    border: 'border-emerald-700',
  },
  REJECTED: {
    label: 'Avvisad',
    bg: 'bg-rose-950/80',
    text: 'text-rose-300',
    border: 'border-rose-700',
  },
};

export const AtaModal: React.FC<AtaModalProps> = ({
  onClose,
  project,
  onUpdateProject,
  currentUser,
  onInsertToNotes,
}) => {
  const [filterStatus, setFilterStatus] = useState<AtaStatus | 'ALL'>('ALL');
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [editingAtaId, setEditingAtaId] = useState<string | null>(null);
  const [signingAtaId, setSigningAtaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for creating/editing ÄTA
  const [formData, setFormData] = useState<{
    ataNumber: string;
    title: string;
    category: AtaCategory;
    description: string;
    cause: string;
    pricingType: AtaPricingType;
    workHours: string;
    hourlyRate: string;
    machineHours: string;
    machineType: string;
    machineRate: string;
    materialCost: string;
    materialDescription: string;
    fixedAmount: string;
    timeExtensionDays: string;
    status: AtaStatus;
    photos: MomentPhoto[];
  }>({
    ataNumber: 'ÄTA-01',
    title: '',
    category: 'HINDER_MARK',
    description: '',
    cause: '',
    pricingType: 'LOPANDE',
    workHours: '8',
    hourlyRate: '650',
    machineHours: '4',
    machineType: 'Grävmaskin 8t med hammare',
    machineRate: '950',
    materialCost: '2500',
    materialDescription: 'Krossmaterial & rördelar',
    fixedAmount: '0',
    timeExtensionDays: '1',
    status: 'SUBMITTED',
    photos: [],
  });

  // Signature canvas states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(
    project.clientName || currentUser?.displayName || 'Beställare / Handledare'
  );
  const [signerRole, setSignerRole] = useState<'BESTÄLLARE' | 'PLATSLEDNING' | 'YRKESLÄRARE'>(
    currentUser?.role === 'TEACHER' ? 'YRKESLÄRARE' : 'BESTÄLLARE'
  );
  const [signComment, setSignComment] = useState('Arbetet och kostnaden godkänns.');

  const atas = project.atas || [];

  // Summary statistics
  const totalAtas = atas.length;
  const approvedAtas = atas.filter((a) => a.status === 'APPROVED');
  const totalApprovedAmount = approvedAtas.reduce((sum, a) => sum + (a.totalEstimatedCost || 0), 0);
  const totalSubmittedAmount = atas.reduce((sum, a) => sum + (a.totalEstimatedCost || 0), 0);
  const totalApprovedHours = approvedAtas.reduce((sum, a) => sum + (a.workHours || 0), 0);
  const totalApprovedDays = approvedAtas.reduce((sum, a) => sum + (a.timeExtensionDays || 0), 0);

  // Filtered list
  const filteredAtas = filterStatus === 'ALL'
    ? atas
    : atas.filter((a) => a.status === filterStatus);

  // Auto-generate next ÄTA number
  const getNextAtaNumber = (): string => {
    const existing = atas.length + 1;
    return `ÄTA-${existing < 10 ? '0' : ''}${existing}`;
  };

  const handleStartCreate = () => {
    setFormData({
      ataNumber: getNextAtaNumber(),
      title: '',
      category: 'HINDER_MARK',
      description: '',
      cause: '',
      pricingType: 'LOPANDE',
      workHours: '8',
      hourlyRate: '650',
      machineHours: '4',
      machineType: 'Grävmaskin 8t med hammare',
      machineRate: '950',
      materialCost: '2500',
      materialDescription: 'Massor & fyllnadsmaterial',
      fixedAmount: '0',
      timeExtensionDays: '1',
      status: 'SUBMITTED',
      photos: [],
    });
    setEditingAtaId(null);
    setIsCreatingOrEditing(true);
  };

  const handleStartEdit = (item: AtaItem) => {
    setFormData({
      ataNumber: item.ataNumber,
      title: item.title,
      category: item.category,
      description: item.description,
      cause: item.cause,
      pricingType: item.pricingType,
      workHours: String(item.workHours || 0),
      hourlyRate: String(item.hourlyRate || 650),
      machineHours: String(item.machineHours || 0),
      machineType: item.machineType || '',
      machineRate: String(item.machineRate || 950),
      materialCost: String(item.materialCost || 0),
      materialDescription: item.materialDescription || '',
      fixedAmount: String(item.fixedAmount || 0),
      timeExtensionDays: String(item.timeExtensionDays || 0),
      status: item.status,
      photos: item.photos || [],
    });
    setEditingAtaId(item.id);
    setIsCreatingOrEditing(true);
  };

  // Calculate live total amount
  const calculateTotalCost = (): number => {
    if (formData.pricingType === 'FAST_PRIS') {
      return parseFloat(formData.fixedAmount) || 0;
    }
    const labor = (parseFloat(formData.workHours) || 0) * (parseFloat(formData.hourlyRate) || 0);
    const machine = (parseFloat(formData.machineHours) || 0) * (parseFloat(formData.machineRate) || 0);
    const material = parseFloat(formData.materialCost) || 0;
    return labor + machine + material;
  };

  // Save / Update ÄTA
  const handleSaveAta = () => {
    if (!formData.title.trim()) {
      alert('Vänligen ange en titel för ÄTA-arbetet.');
      return;
    }

    const totalCost = calculateTotalCost();
    const now = getFormattedCurrentTime();

    let updatedList: AtaItem[];

    if (editingAtaId) {
      // Update existing
      updatedList = atas.map((item) => {
        if (item.id === editingAtaId) {
          return {
            ...item,
            ataNumber: formData.ataNumber,
            title: formData.title,
            category: formData.category,
            description: formData.description,
            cause: formData.cause,
            pricingType: formData.pricingType,
            workHours: parseFloat(formData.workHours) || 0,
            hourlyRate: parseFloat(formData.hourlyRate) || 0,
            machineHours: parseFloat(formData.machineHours) || 0,
            machineType: formData.machineType,
            machineRate: parseFloat(formData.machineRate) || 0,
            materialCost: parseFloat(formData.materialCost) || 0,
            materialDescription: formData.materialDescription,
            fixedAmount: parseFloat(formData.fixedAmount) || 0,
            totalEstimatedCost: totalCost,
            timeExtensionDays: parseFloat(formData.timeExtensionDays) || 0,
            status: formData.status,
            photos: formData.photos,
          };
        }
        return item;
      });
    } else {
      // Create new
      const newAta: AtaItem = {
        id: `ata_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ataNumber: formData.ataNumber,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        cause: formData.cause,
        pricingType: formData.pricingType,
        workHours: parseFloat(formData.workHours) || 0,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        machineHours: parseFloat(formData.machineHours) || 0,
        machineType: formData.machineType,
        machineRate: parseFloat(formData.machineRate) || 0,
        materialCost: parseFloat(formData.materialCost) || 0,
        materialDescription: formData.materialDescription,
        fixedAmount: parseFloat(formData.fixedAmount) || 0,
        totalEstimatedCost: totalCost,
        timeExtensionDays: parseFloat(formData.timeExtensionDays) || 0,
        status: formData.status,
        createdAt: now,
        createdBy: currentUser?.displayName || 'Fältpersonal',
        creatorRole: currentUser?.role,
        submittedAt: now,
        photos: formData.photos,
      };
      updatedList = [newAta, ...atas];
    }

    onUpdateProject({
      ...project,
      atas: updatedList,
      updatedAt: now,
    });

    setIsCreatingOrEditing(false);
    setEditingAtaId(null);
  };

  const handleDeleteAta = (id: string) => {
    if (!confirm('Är du säker på att du vill radera denna ÄTA?')) return;
    const updated = atas.filter((a) => a.id !== id);
    onUpdateProject({
      ...project,
      atas: updated,
      updatedAt: getFormattedCurrentTime(),
    });
  };

  // Add photo to current ÄTA form
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      const dataUrl = await fileToBase64Optimized(file, {
        property: `${project.name} (${project.propertyDesignation || ''})`,
        momentTitle: `${formData.ataNumber}: ${formData.title || 'ÄTA Fotobevis'}`,
        userName: currentUser?.displayName || 'Fältutförare',
      });

      const newPhoto: MomentPhoto = {
        id: `photo_ata_${Date.now()}`,
        dataUrl,
        capturedAt: getFormattedCurrentTime(),
        category: 'ÄTA-Bevis',
        caption: `${formData.ataNumber} Fältbevis`,
      };

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, newPhoto],
      }));
    } catch (err) {
      console.error('Error adding ÄTA photo', err);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== photoId),
    }));
  };

  // -------------------------------------------------------------
  // SIGNATURE CANVAS HANDLING
  // -------------------------------------------------------------
  useEffect(() => {
    if (!signingAtaId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, [signingAtaId]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#2563eb'; // blue ink
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSaveSignature = () => {
    if (!signingAtaId) return;
    const canvas = canvasRef.current;
    const signatureImage = canvas ? canvas.toDataURL('image/png') : undefined;

    const now = getFormattedCurrentTime();
    const updated = atas.map((item) => {
      if (item.id === signingAtaId) {
        return {
          ...item,
          status: 'APPROVED' as AtaStatus,
          approvedBy: `${signerName} (${signerRole})`,
          approvedAt: now,
          approvedComment: signComment,
          signatureImage: hasDrawn ? signatureImage : item.signatureImage,
        };
      }
      return item;
    });

    onUpdateProject({
      ...project,
      atas: updated,
      updatedAt: now,
    });

    setSigningAtaId(null);
  };

  // -------------------------------------------------------------
  // FORMAL ÄTA SUMMARY TEXT FOR COPY / SMS
  // -------------------------------------------------------------
  const generateAtaText = (item: AtaItem): string => {
    const cat = ATA_CATEGORIES.find((c) => c.id === item.category)?.label || item.category;
    return `FORMEL ÄTA-ANMÄLAN
Projekt: ${project.name} (${project.propertyDesignation || 'Ej angiven fastighet'})
Nummer: ${item.ataNumber} - ${item.title}
Kategori: ${cat}
Datum: ${item.createdAt}
Beställare/Byggherre: ${project.clientName || 'Ej angiven'}
Entreprenör: ${project.contractorName || 'Ej angiven'}

BESKRIVNING AV HINDER/TILLKOMMANDE ARBETE:
${item.description || 'Ingen ytterligare beskrivning.'}

ORSAK TILL ATT ARBETET EJ INGÅR I GRUNDAVTAL/ÖVNING:
${item.cause || 'Oförutsett fältförhållande.'}

KOSTNADS- & RESURSKALKYL:
Ersättningsform: ${item.pricingType === 'FAST_PRIS' ? 'Fast pris' : 'Löpande räkning'}
${
  item.pricingType === 'FAST_PRIS'
    ? `Överenskommet belopp: ${item.fixedAmount?.toLocaleString('sv-SE')} kr exkl. moms`
    : `• Arbetstid: ${item.workHours || 0} timmar á ${item.hourlyRate || 650} kr/h = ${(
        (item.workHours || 0) * (item.hourlyRate || 650)
      ).toLocaleString('sv-SE')} kr
• Maskintid: ${item.machineHours || 0} h (${item.machineType || 'Maskin'}) á ${item.machineRate || 950} kr/h = ${(
        (item.machineHours || 0) * (item.machineRate || 950)
      ).toLocaleString('sv-SE')} kr
• Material/Massor: ${(item.materialCost || 0).toLocaleString('sv-SE')} kr (${item.materialDescription || 'Material'})`
}
BERÄKNAD TOTALKOSTNAD: ${item.totalEstimatedCost?.toLocaleString('sv-SE')} kr exkl. moms
Begärd tidsförlängning: ${item.timeExtensionDays || 0} arbetsdagar

STATUS: ${STATUS_LABELS[item.status]?.label}
${item.approvedBy ? `Godkänd av: ${item.approvedBy} (${item.approvedAt})` : 'Väntar på skriftligt godkännande före påbörjan.'}
Fotobevis: ${item.photos?.length || 0} st bifogade`;
  };

  const handleCopyAta = (item: AtaItem) => {
    const text = generateAtaText(item);
    navigator.clipboard?.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // -------------------------------------------------------------
  // DOWNLOAD INDIVIDUAL ÄTA PDF
  // -------------------------------------------------------------
  const handleDownloadAtaPdf = (item: AtaItem) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const marginX = 15;
    const contentWidth = pageWidth - marginX * 2;
    let y = 15;

    // Header banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(249, 115, 22); // orange-500 stripe
    doc.rect(0, 28, pageWidth, 2.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ÄTA-BESTÄLLNING & ANMÄLAN I FÄLT', marginX, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(254, 215, 170); // orange-200
    doc.text('Svensk Byggstandard (AB 04 / ABT 06 Kap 2 § 3 - Ändringar och Tilläggsarbeten)', marginX, 20);

    // Number badge
    doc.setFillColor(249, 115, 22);
    doc.roundedRect(pageWidth - marginX - 35, 8, 35, 12, 2, 2, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(item.ataNumber, pageWidth - marginX - 17.5, 15.5, { align: 'center' });

    y = 36;

    // 1. Projektdetaljer Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX, y, contentWidth, 24, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    doc.setFont('helvetica', 'bold');
    doc.text('Projekt:', marginX + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(project.name || 'Projekt', marginX + 22, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Fastighet:', marginX + 70, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(project.propertyDesignation || '-', marginX + 88, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Datum:', marginX + 130, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(item.createdAt, marginX + 144, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Beställare:', marginX + 4, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(project.clientName || 'Ej angiven', marginX + 22, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('Entreprenör:', marginX + 70, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(project.contractorName || 'Ej angiven', marginX + 92, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('Upprättad av:', marginX + 130, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(item.createdBy || 'Fältpersonal', marginX + 152, y + 13);

    y += 28;

    // 2. ÄTA Rubrik & Kategori
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(marginX, y, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.ataNumber}: ${item.title}`, marginX + 4, y + 6);

    const catInfo = ATA_CATEGORIES.find((c) => c.id === item.category);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Kategori: ${catInfo?.label || item.category} (${catInfo?.description || ''})`, marginX + 4, y + 11);

    y += 18;

    // 3. Beskrivning & Orsak
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('BESKRIVNING AV TILLKOMMANDE ARBETE:', marginX, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(item.description || 'Ingen specifik beskrivning.', contentWidth);
    doc.text(descLines, marginX, y);
    y += descLines.length * 4 + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('ORSAK (VARFÖR ARBETET EJ INGICK I GRUNDAVTALET):', marginX, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const causeLines = doc.splitTextToSize(item.cause || 'Oförutsett mark- eller fältförhållande.', contentWidth);
    doc.text(causeLines, marginX, y);
    y += causeLines.length * 4 + 6;

    // 4. Kostnadsspecifikation Tabell
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('RESURS / KOSTNADSSPECIFIKATION', marginX + 3, y + 4.2);
    doc.text('ERSÄTTNINGSFORM', marginX + 85, y + 4.2);
    doc.text('BELOPP EXKL. MOMS', marginX + 145, y + 4.2);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    if (item.pricingType === 'FAST_PRIS') {
      doc.setFont('helvetica', 'normal');
      doc.text('Överenskommet fast pris för samtliga ingående moment', marginX + 3, y + 5);
      doc.text('Fast pris', marginX + 85, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${(item.fixedAmount || 0).toLocaleString('sv-SE')} kr`, marginX + 145, y + 5);
      y += 8;
    } else {
      // Arbetstid
      doc.setFont('helvetica', 'normal');
      doc.text(`Arbetstid: ${item.workHours || 0} tim á ${item.hourlyRate || 650} kr/h`, marginX + 3, y + 5);
      doc.text('Löpande', marginX + 85, y + 5);
      doc.text(`${(((item.workHours || 0) * (item.hourlyRate || 650))).toLocaleString('sv-SE')} kr`, marginX + 145, y + 5);
      y += 6;

      // Maskintid
      doc.text(`Maskin (${item.machineType || 'Maskin'}): ${item.machineHours || 0} tim á ${item.machineRate || 950} kr/h`, marginX + 3, y + 5);
      doc.text('Löpande', marginX + 85, y + 5);
      doc.text(`${(((item.machineHours || 0) * (item.machineRate || 950))).toLocaleString('sv-SE')} kr`, marginX + 145, y + 5);
      y += 6;

      // Material
      doc.text(`Material/Massor: ${item.materialDescription || 'Material'}`, marginX + 3, y + 5);
      doc.text('Självkostnad', marginX + 85, y + 5);
      doc.text(`${(item.materialCost || 0).toLocaleString('sv-SE')} kr`, marginX + 145, y + 5);
      y += 8;
    }

    // Total rad
    doc.setFillColor(254, 243, 199); // amber-100
    doc.rect(marginX, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`TOTALT ATT FAKTURERA:`, marginX + 3, y + 4.8);
    doc.text(`${(item.totalEstimatedCost || 0).toLocaleString('sv-SE')} KR EXKL. MOMS`, marginX + 125, y + 4.8);
    y += 11;

    // Tidsförlängning rad
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Begärd tidsförlängning av kontraktstid: ${item.timeExtensionDays || 0} arbetsdagar`, marginX, y);
    y += 8;

    // 5. Fotobevis om finns
    if (item.photos && item.photos.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`FOTOBEVIS FRÅN FÄLTET (${item.photos.length} ST):`, marginX, y);
      y += 4;

      const photoWidth = 55;
      const photoHeight = 40;
      item.photos.slice(0, 3).forEach((p, idx) => {
        const px = marginX + idx * (photoWidth + 6);
        try {
          doc.addImage(p.dataUrl, 'JPEG', px, y, photoWidth, photoHeight);
          doc.setFontSize(6);
          doc.setTextColor(100, 116, 139);
          doc.text(`Foto ${idx + 1} - ${p.capturedAt}`, px, y + photoHeight + 3.5);
        } catch {
          doc.rect(px, y, photoWidth, photoHeight);
          doc.text('Fotoarkiverad', px + 5, y + 20);
        }
      });
      y += photoHeight + 9;
    }

    // 6. Signatur & Godkännande Box
    const signBoxY = 240;
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX, signBoxY, contentWidth, 42, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('BESTÄLLARENS / YRKESLÄRARENS GODKÄNNANDE', marginX + 4, signBoxY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Härmed godkänns ovan specificerade tilläggsarbete och överenskommen kostnadsersättning enl. AB 04/ABT 06.',
      marginX + 4,
      signBoxY + 11
    );

    // Left col: Entreprenör / Elev
    doc.text(`Anmält av: ${item.createdBy || 'Fältpersonal'}`, marginX + 4, signBoxY + 20);
    doc.text(`Datum anmäld: ${item.createdAt}`, marginX + 4, signBoxY + 26);

    // Right col: Godkännare
    const rightX = marginX + 90;
    if (item.status === 'APPROVED') {
      doc.setTextColor(22, 101, 52); // green
      doc.setFont('helvetica', 'bold');
      doc.text(`✓ GODKÄND I FÄLT: ${item.approvedBy || 'Beställare'}`, rightX, signBoxY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(`Godkänd datum: ${item.approvedAt || '-'}`, rightX, signBoxY + 26);
      if (item.approvedComment) {
        doc.text(`Kommentar: ${item.approvedComment}`, rightX, signBoxY + 31);
      }
      if (item.signatureImage) {
        try {
          doc.addImage(item.signatureImage, 'PNG', rightX + 45, signBoxY + 14, 38, 16);
        } catch {}
      }
    } else {
      doc.setTextColor(153, 27, 27);
      doc.setFont('helvetica', 'bold');
      doc.text('EJ GODKÄND / AVVAKTAR SIGNATUR', rightX, signBoxY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text('Namnteckning beställare / handledare krävs', rightX, signBoxY + 26);
    }

    doc.save(`FaltKoll_ATA_${item.ataNumber}_${project.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#10131c] border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#191924] to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  ÄTA-hantering i fält
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  AB 04 / ABT 06
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ändrings-, Tilläggs- och Avgående arbeten med fotobevis & digital signatur
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-950/80 border-b border-slate-800">
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Totalt antal ÄTA</span>
            <span className="text-base font-black text-white font-mono">
              {totalAtas} st ({approvedAtas.length} godkända)
            </span>
          </div>

          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Godkänt belopp</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {totalApprovedAmount.toLocaleString('sv-SE')} kr
            </span>
          </div>

          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Totalt ansökt</span>
            <span className="text-base font-black text-amber-300 font-mono">
              {totalSubmittedAmount.toLocaleString('sv-SE')} kr
            </span>
          </div>

          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Extra timmar / Dagar</span>
            <span className="text-base font-black text-sky-300 font-mono">
              {totalApprovedHours} h / +{totalApprovedDays} d
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Action Toolbar */}
          {!isCreatingOrEditing && !signingAtaId && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: 'ALL', label: `Alla (${totalAtas})` },
                  { id: 'SUBMITTED', label: `Anmälda (${atas.filter((a) => a.status === 'SUBMITTED').length})` },
                  { id: 'APPROVED', label: `Godkända (${approvedAtas.length})` },
                  { id: 'DRAFT', label: `Utkast (${atas.filter((a) => a.status === 'DRAFT').length})` },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setFilterStatus(st.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                      filterStatus === st.id
                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3.5 py-2 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Ny ÄTA-anmälan</span>
              </button>
            </div>
          )}

          {/* SIGNING MODAL / VIEW */}
          {signingAtaId && (
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-emerald-400" />
                    <span>Digital signering och godkännande av ÄTA</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Signera direkt på skärmen som beställare, platsledning eller yrkeslärare.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSigningAtaId(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Namn på godkännare
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Roll
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['BESTÄLLARE', 'PLATSLEDNING', 'YRKESLÄRARE'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSignerRole(r)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg border cursor-pointer ${
                          signerRole === r
                            ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Godkännandekommentar / Villkor
                </label>
                <input
                  type="text"
                  value={signComment}
                  onChange={(e) => setSignComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              {/* Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-300">
                    Namnteckning (Rita med fingret / pennan):
                  </span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Rensa</span>
                  </button>
                </div>
                <div className="border border-slate-700 rounded-xl bg-white overflow-hidden touch-none relative h-36">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={144}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                    className="w-full h-full cursor-crosshair"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                      Rita namnteckning här...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSigningAtaId(null)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignature}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Godkänn och stämpla ÄTA</span>
                </button>
              </div>
            </div>
          )}

          {/* CREATE / EDIT FORM */}
          {isCreatingOrEditing && (
            <div className="p-4 rounded-xl bg-slate-900 border border-orange-500/40 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    {formData.ataNumber}
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {editingAtaId ? 'Redigera ÄTA-anmälan' : 'Ny ÄTA-anmälan i fält'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingOrEditing(false);
                    setEditingAtaId(null);
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Titel & Nummer */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    ÄTA-nummer
                  </label>
                  <input
                    type="text"
                    value={formData.ataNumber}
                    onChange={(e) => setFormData({ ...formData, ataNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Titel / Sammanfattning av arbete
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="t.ex. Bortmejsling av oväntat bergblock i schakt"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. Kategori */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Kategori av orsak
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ATA_CATEGORIES.map((cat) => {
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-white'
                            : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span>{cat.icon}</span>
                          <span className={isSelected ? 'text-white' : 'text-slate-300'}>
                            {cat.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {cat.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Beskrivning & Orsak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Beskrivning av tillkommande åtgärd
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Beskriv vad som måste göras, vilka maskiner som krävs och vilka massor som berörs..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Orsak (Varför ingår det inte i ursprungsavtal/uppgift?)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.cause}
                    onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                    placeholder="t.ex. Berget låg dolt under moränlagret på 60 cm djup och syntes inte vid försyn eller markprov..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Fotobevis */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-orange-400" />
                    <span>Fotobevis från fältet ({formData.photos.length} st)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Ta / Lägg till foto</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </div>

                {formData.photos.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {formData.photos.map((photo) => (
                      <div key={photo.id} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                        <img src={photo.dataUrl} alt="ÄTA bevis" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-900 text-white rounded-md cursor-pointer"
                          title="Ta bort foto"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    Inga fotobevis bifogade ännu. Fota hindret i schaktbotten för 100% juridiskt underlag.
                  </div>
                )}
              </div>

              {/* 5. Kostnadskalkyl & Resurser */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Ersättningsform & Kostnadskalkyl
                  </span>
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pricingType: 'LOPANDE' })}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                        formData.pricingType === 'LOPANDE'
                          ? 'bg-orange-500 text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Löpande räkning (á-priser)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pricingType: 'FAST_PRIS' })}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                        formData.pricingType === 'FAST_PRIS'
                          ? 'bg-orange-500 text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Fast överenskommet pris
                    </button>
                  </div>
                </div>

                {formData.pricingType === 'LOPANDE' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Arbetstid */}
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-300 block">Arbetstimmar</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Timmar (h)</label>
                          <input
                            type="number"
                            value={formData.workHours}
                            onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Taxa (kr/h)</label>
                          <input
                            type="number"
                            value={formData.hourlyRate}
                            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] text-amber-300 font-mono text-right pt-0.5">
                        ={(((parseFloat(formData.workHours) || 0) * (parseFloat(formData.hourlyRate) || 0))).toLocaleString('sv-SE')} kr
                      </div>
                    </div>

                    {/* Maskintid */}
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-300 block">Maskintid</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Timmar (h)</label>
                          <input
                            type="number"
                            value={formData.machineHours}
                            onChange={(e) => setFormData({ ...formData, machineHours: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Taxa (kr/h)</label>
                          <input
                            type="number"
                            value={formData.machineRate}
                            onChange={(e) => setFormData({ ...formData, machineRate: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={formData.machineType}
                          onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                          placeholder="Maskintyp (t.ex. Grävare 8t)"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-white text-[10px]"
                        />
                      </div>
                      <div className="text-[11px] text-amber-300 font-mono text-right pt-0.5">
                        ={(((parseFloat(formData.machineHours) || 0) * (parseFloat(formData.machineRate) || 0))).toLocaleString('sv-SE')} kr
                      </div>
                    </div>

                    {/* Material & Massor */}
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-300 block">Material & Massor</span>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Belopp (kr)</label>
                        <input
                          type="number"
                          value={formData.materialCost}
                          onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={formData.materialDescription}
                          onChange={(e) => setFormData({ ...formData, materialDescription: e.target.value })}
                          placeholder="Beskrivning av material"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-white text-[10px]"
                        />
                      </div>
                      <div className="text-[11px] text-amber-300 font-mono text-right pt-0.5">
                        ={(parseFloat(formData.materialCost) || 0).toLocaleString('sv-SE')} kr
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Överenskommet fast belopp (kr exkl. moms)
                    </label>
                    <input
                      type="number"
                      value={formData.fixedAmount}
                      onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm font-bold"
                    />
                  </div>
                )}

                {/* Totalbelopp & Tidsförlängning */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Begärd tidsförlängning (arbetsdagar)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.timeExtensionDays}
                      onChange={(e) => setFormData({ ...formData, timeExtensionDays: e.target.value })}
                      className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Total beräknad ÄTA-kostnad
                    </span>
                    <span className="text-xl font-black text-orange-400 font-mono">
                      {calculateTotalCost().toLocaleString('sv-SE')} KR
                    </span>
                  </div>
                </div>
              </div>

              {/* Status väljare */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Status:</span>
                  <div className="flex gap-1">
                    {(['DRAFT', 'SUBMITTED', 'APPROVED'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: st })}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${
                          formData.status === st
                            ? 'bg-orange-500 text-black border-orange-400 font-black'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {STATUS_LABELS[st].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingOrEditing(false);
                      setEditingAtaId(null);
                    }}
                    className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Avbryt
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAta}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Spara ÄTA</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ÄTA LIST OF CARDS */}
          {!isCreatingOrEditing && !signingAtaId && (
            <div className="space-y-3">
              {filteredAtas.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Inga ÄTA-arbeten registrerade</h4>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                      Stöter du på oväntat berg, elkablar, förändrad layout eller begärda tillägg? Skapa en ÄTA direkt i mobilen med fotobevis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="px-4 py-2 bg-orange-500 text-black font-black text-xs rounded-xl cursor-pointer hover:bg-orange-400"
                  >
                    Skapa första ÄTA
                  </button>
                </div>
              ) : (
                filteredAtas.map((item) => {
                  const cat = ATA_CATEGORIES.find((c) => c.id === item.category);
                  const st = STATUS_LABELS[item.status];
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      {/* Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                            {item.ataNumber}
                          </span>
                          <span className="text-xs font-bold text-white">{item.title}</span>
                          <span className="text-xs">{cat?.icon}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                            {st.label}
                          </span>
                        </div>
                      </div>

                      {/* Description & Cause snippet */}
                      <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                        <p><strong className="text-slate-400">Beskrivning:</strong> {item.description || 'Ingen'}</p>
                        {item.cause && (
                          <p><strong className="text-slate-400">Orsak:</strong> {item.cause}</p>
                        )}
                      </div>

                      {/* Key metrics & Photos */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">
                            Prisform: <strong className="text-white">{item.pricingType === 'FAST_PRIS' ? 'Fast pris' : 'Löpande'}</strong>
                          </span>
                          <span className="text-slate-400">
                            Belopp: <strong className="text-orange-400 font-mono text-sm">{item.totalEstimatedCost?.toLocaleString('sv-SE')} kr</strong>
                          </span>
                          {item.timeExtensionDays ? (
                            <span className="text-slate-400 font-mono">
                              +{item.timeExtensionDays} dgr
                            </span>
                          ) : null}
                        </div>

                        {item.photos && item.photos.length > 0 && (
                          <span className="text-[11px] text-sky-400 flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{item.photos.length} foton</span>
                          </span>
                        )}
                      </div>

                      {/* Approval badge if approved */}
                      {item.status === 'APPROVED' && (
                        <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center justify-between text-xs text-emerald-300">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Godkänd av <strong>{item.approvedBy}</strong> ({item.approvedAt})</span>
                          </div>
                          {item.signatureImage && (
                            <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono">
                              Digital namnteckning sparad
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyAta(item)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                            title="Kopiera formell ÄTA-text till urklipp"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Kopierad!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Kopiera text</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadAtaPdf(item)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-300 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                            title="Ladda ner som officiell ÄTA-blankett PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Ladda ner PDF</span>
                          </button>

                          {onInsertToNotes && (
                            <button
                              type="button"
                              onClick={() => {
                                onInsertToNotes(generateAtaText(item));
                                setCopiedId(item.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-lg cursor-pointer"
                              title="Klistra in i projektets fältblock"
                            >
                              Till Fältblocket
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => setSigningAtaId(item.id)}
                              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>Signera / Godkänn</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                            title="Redigera ÄTA"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAta(item.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            title="Radera ÄTA"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>Kopplat till projektet: <strong>{project.name}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
