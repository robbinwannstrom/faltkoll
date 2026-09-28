import React, { useState, useRef, useEffect } from 'react';
import { Project, MomentDefinition, MomentRecord, MomentStatus, MomentPhoto, UserSettings } from '../types';
import { ALL_MOMENTS, PROJECT_TYPE_LABELS } from '../data/momentsData';
import { PhotoQuickMenuModal } from './PhotoQuickMenuModal';
import { PhotoArchiveModal } from './PhotoArchiveModal';
import { CrossMeasureCalculatorModal } from './CrossMeasureCalculatorModal';
import { QuickNotesModal } from './QuickNotesModal';
import { FieldHelperModal } from './FieldHelperModal';
import { MomentAiHelperModal } from './MomentAiHelperModal';
import { fileToBase64Optimized, getFormattedCurrentTime } from '../db/indexedDb';
import { getDefaultCategoryForMoment } from '../utils/photoStorage';
import { getSuggestionsForMoment } from '../data/momentCheckSuggestions';
import {
  CheckCircle2,
  Camera,
  FolderOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  Compass,
  Bot,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
  Trash2,
  Eye,
  Eraser,
  PenTool,
  Check,
  AlertTriangle,
  ArrowUp,
  Layers,
  History,
  ShieldCheck,
  Ruler,
  HelpCircle,
  Info,
} from 'lucide-react';

interface ChecklistViewProps {
  project: Project;
  userSettings: UserSettings;
  onUpdateUserSettings: (newSettings: UserSettings) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onOpenReport: () => void;
  onBackToDashboard: () => void;
  onOpenRevisions?: () => void;
  onOpenTutorial?: () => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  project,
  userSettings,
  onUpdateUserSettings,
  onUpdateProject,
  onOpenReport,
  onBackToDashboard,
  onOpenRevisions,
  onOpenTutorial,
}) => {
  const relevantMoments = ALL_MOMENTS.filter((m) => m.projectType === project.projectType);
  const typeInfo = PROJECT_TYPE_LABELS[project.projectType];

  // Distinct phases in chronological order
  const phases = Array.from(new Set(relevantMoments.map((m) => m.phaseName)));

  // Selected phase view or "ALL"
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');

  // Expanded moment map (expanded moment id, or null for single open, or record)
  const [expandedMoments, setExpandedMoments] = useState<Record<string, boolean>>({});

  // Modals state
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isCrossMeasureOpen, setIsCrossMeasureOpen] = useState(false);
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);
  const [isFieldHelperOpen, setIsFieldHelperOpen] = useState(false);
  const [helperMoment, setHelperMoment] = useState<{ title: string; ama: string } | null>(null);
  const [activeMomentForAi, setActiveMomentForAi] = useState<MomentDefinition | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  const handleOpenMomentAiHelper = (moment: MomentDefinition) => {
    setActiveMomentForAi(moment);
  };

  const handleInsertAiNoteToMoment = (noteText: string) => {
    if (!activeMomentForAi) return;
    const currentComment = project.moments[activeMomentForAi.id]?.comment || '';
    const updatedComment = currentComment ? `${currentComment}\n\n${noteText}` : noteText;
    handleUpdateMomentComment(activeMomentForAi.id, updatedComment);
  };

  // Försyn Exemption Multi-step confirmation state
  const [isExemptModalOpen, setIsExemptModalOpen] = useState(false);
  const [exemptStep, setExemptStep] = useState<1 | 2>(1);
  const [exemptReason, setExemptReason] = useState('Praktisk skolövning i övningshall');

  // Cloud sync status
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(project.lastSyncedAt || 'Sparad lokalt');

  // Hidden camera file input ref for direct card photo capture
  const directCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [activeMomentForPhoto, setActiveMomentForPhoto] = useState<string | null>(null);
  const [photoCategoryForMoment, setPhotoCategoryForMoment] = useState<string>('Schakt');
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  // Signature canvas states per moment
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const isDrawingMap = useRef<Record<string, boolean>>({});

  // Stats calculation
  const totalCount = relevantMoments.length;
  const completedCount = Object.values(project.moments).filter((m) => m.status === 'GREEN').length;
  const inProgressCount = Object.values(project.moments).filter((m) => m.status === 'YELLOW').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Total photos count across all moments
  const totalPhotosCount =
    Object.values(project.moments).reduce((sum, rec) => {
      return sum + (rec.photos?.length || (rec.photoBase64 ? 1 : 0));
    }, 0) + (project.preInspectionPhotos?.length || 0);

  // Ensure scroll is at top on mount/project change so user is never stuck in the middle
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [project.id]);

  const toggleMomentExpand = (momentId: string) => {
    setExpandedMoments((prev) => ({
      ...prev,
      [momentId]: !prev[momentId],
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger camera for a specific moment
  const handleTriggerCameraForMoment = (momentId: string, phaseName?: string) => {
    setActiveMomentForPhoto(momentId);
    const cat = getDefaultCategoryForMoment(momentId, phaseName);
    setPhotoCategoryForMoment(cat);
    if (directCameraInputRef.current) {
      directCameraInputRef.current.value = '';
      directCameraInputRef.current.click();
    }
  };

  const handleDirectCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeMomentForPhoto) return;

    try {
      setIsCapturingPhoto(true);
      const def = relevantMoments.find((m) => m.id === activeMomentForPhoto);
      const base64 = await fileToBase64Optimized(file, {
        momentId: activeMomentForPhoto,
        momentTitle: def?.title,
        property: project.propertyDesignation,
      });
      handleAddPhotoToMoment(activeMomentForPhoto, base64, photoCategoryForMoment);
    } catch (err: any) {
      alert('Kunde inte läsa in fotot: ' + (err?.message || 'Okänt fel'));
    } finally {
      setIsCapturingPhoto(false);
      setActiveMomentForPhoto(null);
    }
  };

  const handleAddPhotoToMoment = (momentId: string, base64: string, category: string) => {
    const time = getFormattedCurrentTime();
    const newPhoto: MomentPhoto = {
      id: 'ph_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      dataUrl: base64,
      capturedAt: time,
      category: category || 'Schakt',
    };

    const existingRecord: MomentRecord = project.moments[momentId] || {
      momentId,
      status: 'YELLOW',
      comment: '',
      signature: '',
      photos: [],
    };

    const updatedPhotos = existingRecord.photos ? [...existingRecord.photos, newPhoto] : [newPhoto];

    const updatedRecord: MomentRecord = {
      ...existingRecord,
      status: existingRecord.status === 'GREEN' ? 'GREEN' : 'YELLOW',
      photoBase64: base64,
      photos: updatedPhotos,
      completedAt: existingRecord.completedAt || time,
    };

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: updatedRecord,
      },
    });
  };

  const handleDeletePhotoFromMoment = (momentId: string, photoId: string) => {
    const existing = project.moments[momentId];
    if (!existing || !existing.photos) return;

    const filtered = existing.photos.filter((p) => p.id !== photoId);
    const updatedRecord: MomentRecord = {
      ...existing,
      photos: filtered,
      photoBase64: filtered.length > 0 ? filtered[0].dataUrl : undefined,
    };

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: updatedRecord,
      },
    });
  };

  // Update moment comment / notes
  const handleUpdateMomentComment = (momentId: string, text: string) => {
    const existing: MomentRecord = project.moments[momentId] || {
      momentId,
      status: 'RED',
      comment: '',
      signature: '',
    };

    const newStatus: MomentStatus =
      existing.status === 'RED' && text.trim().length > 0 ? 'YELLOW' : existing.status;

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: {
          ...existing,
          status: newStatus,
          comment: text,
        },
      },
    });
  };

  // Structured checks toggle & remove
  const handleToggleStructuredCheck = (momentId: string, checkLabel: string) => {
    const existing: MomentRecord = project.moments[momentId] || {
      momentId,
      status: 'RED',
      comment: '',
      signature: '',
      structuredChecks: [],
    };

    const currentChecks = existing.structuredChecks || [];
    const isAlreadyAdded = currentChecks.includes(checkLabel);

    let nextChecks: string[];
    if (isAlreadyAdded) {
      nextChecks = currentChecks.filter((item) => item !== checkLabel);
    } else {
      nextChecks = [...currentChecks, checkLabel];
    }

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: {
          ...existing,
          status: existing.status === 'RED' ? 'YELLOW' : existing.status,
          structuredChecks: nextChecks,
        },
      },
    });
  };

  const handleRemoveStructuredCheck = (momentId: string, checkLabel: string) => {
    const existing = project.moments[momentId];
    if (!existing || !existing.structuredChecks) return;

    const nextChecks = existing.structuredChecks.filter((item) => item !== checkLabel);
    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: {
          ...existing,
          structuredChecks: nextChecks,
        },
      },
    });
  };

  // Set Moment status
  const handleSetStatus = (moment: MomentDefinition, newStatus: MomentStatus) => {
    const time = getFormattedCurrentTime();
    const existing: MomentRecord = project.moments[moment.id] || {
      momentId: moment.id,
      status: 'RED',
      comment: '',
      signature: '',
    };

    const updatedRecord: MomentRecord = {
      ...existing,
      status: newStatus,
      completedAt: newStatus === 'GREEN' ? time : existing.completedAt,
      completedTimestamp: newStatus === 'GREEN' ? Date.now() : existing.completedTimestamp,
      signature:
        newStatus === 'GREEN' && !existing.signature
          ? userSettings.userName || 'Ansvarig Yrkeslärare/Elev'
          : existing.signature,
    };

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [moment.id]: updatedRecord,
      },
    });
  };

  // Canvas Drawing & Touch Signature handlers
  const startDrawing = (momentId: string, x: number, y: number) => {
    const canvas = canvasRefs.current[momentId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingMap.current[momentId] = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#f97316'; // Safety orange ink
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (momentId: string, x: number, y: number) => {
    if (!isDrawingMap.current[momentId]) return;
    const canvas = canvasRefs.current[momentId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (momentId: string) => {
    isDrawingMap.current[momentId] = false;
  };

  const clearSignatureCanvas = (momentId: string) => {
    const canvas = canvasRefs.current[momentId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Sign & Complete Moment from Canvas
  const handleSignMomentWithFinger = (momentId: string) => {
    const canvas = canvasRefs.current[momentId];
    const time = getFormattedCurrentTime();
    const existing: MomentRecord = project.moments[momentId] || {
      momentId,
      status: 'RED',
      comment: '',
      signature: '',
    };

    const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : '';
    const signerName = userSettings.userName || 'Elev / Yrkeslärare';

    const updatedRecord: MomentRecord = {
      ...existing,
      status: 'GREEN',
      signature: `${signerName} [Finger-signatur godkänd ${time}]`,
      completedAt: time,
      completedTimestamp: Date.now(),
    };

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: updatedRecord,
      },
    });

    setCloudSyncMsg(`Moment ${momentId} godkänt och signerat!`);
    setTimeout(() => setCloudSyncMsg(null), 3000);
  };

  // Cloud sync
  const handleSyncProjectCloud = async () => {
    try {
      setIsCloudSyncing(true);
      setCloudSyncMsg('Synkar med molnet...');
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      if (res.ok) {
        setCloudSyncMsg('Synkning klar! Allt sparat i molnet.');
      } else {
        setCloudSyncMsg('Sparat lokalt på enheten.');
      }
    } catch {
      setCloudSyncMsg('Offlineläge: Allt sparat lokalt på telefonen.');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setCloudSyncMsg(null), 4000);
    }
  };

  // Filter moments by phase
  const displayedMoments =
    selectedPhase === 'ALL'
      ? relevantMoments
      : relevantMoments.filter((m) => m.phaseName === selectedPhase);

  // Helper to dynamically interpolate entered kryssmått into instructions with *****
  const renderInstructionWithMeasurements = (text: string) => {
    if (!text.includes('*****')) return text;
    const diagonal = project.fieldMeasurements?.diagonal;
    const parts = text.split('*****');
    return (
      <span>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              diagonal ? (
                <button
                  type="button"
                  onClick={() => setIsCrossMeasureOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-black font-black px-2.5 py-0.5 rounded-lg font-mono text-sm sm:text-base mx-1 shadow-md shadow-orange-500/20 cursor-pointer align-baseline transition-transform active:scale-95"
                  title="Klicka för att se eller justera kryssmåttet"
                >
                  <Compass className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{diagonal.toFixed(2)} m</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCrossMeasureOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/60 px-2.5 py-0.5 rounded-lg font-bold text-xs sm:text-sm mx-1 cursor-pointer align-baseline transition-transform active:scale-95 animate-pulse"
                  title="Klicka här för att mata in längd och bredd i räknaren"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                  <span>[📐 Ange kryssmått]</span>
                </button>
              )
            )}
          </React.Fragment>
        ))}
      </span>
    );
  };

  const handleConfirmExempt = () => {
    const updated: Project = {
      ...project,
      preInspectionExempted: true,
      preInspectionExemptReason: exemptReason || 'Praktisk skolövning',
    };
    onUpdateProject(updated);
    setIsExemptModalOpen(false);
    setCloudSyncMsg('Försyn markerad som avböjd för denna övning. Du kan fortfarande utföra den när som helst!');
    setTimeout(() => setCloudSyncMsg(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-32 space-y-6 font-sans">
      {/* Hidden file input for mobile direct camera capture */}
      <input
        type="file"
        ref={directCameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleDirectCameraChange}
        className="hidden"
      />

      {/* TOP HEADER & TOOLBAR (Kolfärgad #1a1a1a bakgrund) */}
      <div className="bg-[#1a1a1a] border-2 border-[#282828] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-12 h-12 rounded-2xl bg-[#141414] hover:bg-[#222222] text-white flex items-center justify-center border border-[#333333] cursor-pointer transition-colors shrink-0"
              title="Tillbaka till projektöversikten"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-400 bg-orange-950/60 border border-orange-800/80 px-2.5 py-0.5 rounded-full">
                  {typeInfo.title}
                </span>
                {project.propertyDesignation && (
                  <span className="text-xs text-slate-400 font-mono">
                    {project.propertyDesignation}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                {project.name}
              </h1>
            </div>
          </div>

          {/* Snabba Fältverktyg i toppen - Tydliga, förklarade knappar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Snabbfota (Skarpt orange) */}
            <button
              type="button"
              onClick={() => setIsPhotoMenuOpen(true)}
              className="min-h-[46px] px-4 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-sm rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
              title="Snabbfota till valfritt moment"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>Snabbfota</span>
            </button>

            {/* 2. Fotopärm */}
            <button
              type="button"
              onClick={() => setIsArchiveOpen(true)}
              className="min-h-[46px] px-4 bg-[#181818] hover:bg-[#222222] text-slate-200 border border-[#333333] font-bold text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              title="Öppna fotopärmen"
            >
              <FolderOpen className="w-4 h-4 text-orange-400" />
              <span>Fotopärm ({totalPhotosCount})</span>
            </button>

            {/* 3. Kryssmått */}
            <button
              type="button"
              onClick={() => setIsCrossMeasureOpen(true)}
              className="min-h-[46px] px-4 bg-[#181818] hover:bg-[#222222] text-amber-400 border border-amber-500/40 font-bold text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              title="Kryssmåttsberäknare & 3-4-5 metoden"
            >
              <Compass className="w-4 h-4 stroke-[2.2]" />
              <span>Kryssmått</span>
            </button>

            {/* 4. Fältboken */}
            <button
              type="button"
              onClick={() => setIsQuickNotesOpen(true)}
              className="min-h-[46px] px-4 bg-[#181818] hover:bg-[#222222] text-sky-400 border border-sky-500/40 font-bold text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              title="Fältbok för snabba mått och anteckningar"
            >
              <FileText className="w-4 h-4" />
              <span>Fältbok</span>
            </button>
          </div>
        </div>

        {/* Framstegsindikator */}
        <div className="space-y-2 pt-1 border-t border-[#262626]">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-400 font-medium">
              Totalt framsteg i utbildningen ({completedCount} av {totalCount} moment godkända):
            </span>
            <span className="font-mono font-black text-white text-base">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-[#121212] rounded-full overflow-hidden border border-[#2c2c2c]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPercent === 100 ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {cloudSyncMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/80 rounded-xl text-xs sm:text-sm text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cloudSyncMsg}</span>
            </div>
          )}
        </div>

        {/* DYNAMISK STATUS: 1. FÖRSYN & SKADEGUIDE */}
        <div className="pt-2 border-t border-[#262626]">
          {project.preInspectionCompleted ? (
            <div className="bg-[#121a14] border border-emerald-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Försyn & Skadeguide Genomförd</span>
                    <span className="text-[11px] font-mono bg-emerald-900 text-emerald-300 px-2 py-0.2 rounded-full">
                      {project.preInspectionPhotos?.length || 0} foton
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Befintligt skick på fasad, staket och väg dokumenterat före start.
                  </p>
                </div>
              </div>
              {onOpenTutorial && (
                <button
                  type="button"
                  onClick={onOpenTutorial}
                  className="px-3.5 py-1.5 bg-[#1a2e20] hover:bg-[#24422e] text-emerald-300 border border-emerald-600 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
                >
                  Visa / Komplettera foton
                </button>
              )}
            </div>
          ) : project.preInspectionExempted ? (
            <div className="bg-[#1e1a12] border border-amber-600/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-950 text-amber-400 border border-amber-700 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Försyn Avböjd för denna övning</span>
                    <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.2 rounded-full">
                      Undantag godkänt
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Motivering: {project.preInspectionExemptReason || 'Praktisk skolövning'}.
                  </p>
                </div>
              </div>
              {onOpenTutorial && (
                <button
                  type="button"
                  onClick={onOpenTutorial}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
                >
                  Genomför försyn ändå
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#1f1912] border-2 border-orange-500/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-orange-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-orange-400 bg-orange-950/80 px-2 py-0.2 rounded border border-orange-800">
                      Viktigt moment före schakt
                    </span>
                    <h4 className="text-sm font-bold text-white">Försyn & Skadeguide</h4>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Fota grannfastighet, staket och asfalt så att skolan skyddas mot skadeståndskrav.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                {onOpenTutorial && (
                  <button
                    type="button"
                    onClick={onOpenTutorial}
                    className="flex-1 sm:flex-none px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs sm:text-sm rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-orange-500/20"
                  >
                    Starta fotoguide
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setExemptStep(1);
                    setIsExemptModalOpen(true);
                  }}
                  className="px-3 py-2 bg-[#161616] hover:bg-[#252525] text-slate-300 hover:text-white border border-[#383838] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  title="Avböj försyn med motivering"
                >
                  Avböj försyn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DYNAMISK STATUS: 2. FÄLTMÅTT & REGISTRERAT KRYSSMÅTT */}
        <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Fältmått & Kryssmått
                </span>
                {project.fieldMeasurements?.diagonal ? (
                  <span className="text-xs font-black font-mono bg-orange-500 text-black px-2 py-0.2 rounded-md">
                    {project.fieldMeasurements.diagonal.toFixed(2)} m
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">Ej beräknat</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {project.fieldMeasurements?.diagonal
                  ? `Längd: ${project.fieldMeasurements.sideA || '-'} m • Bredd: ${project.fieldMeasurements.sideB || '-'} m. Måttet fylls i automatiskt i dina arbetsmoment!`
                  : 'Ange övningens sidomått så beräknas kryssmåttet automatiskt och visas som hjälpmedel i momenten.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCrossMeasureOpen(true)}
            className="px-4 py-2 bg-[#1c1c1c] hover:bg-[#262626] text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
          >
            {project.fieldMeasurements?.diagonal ? 'Ändra kryssmått' : 'Mata in mått'}
          </button>
        </div>
      </div>

      {/* FASVÄLJARE / FILTER (Ren och gubbsäker) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-orange-400" />
            Utbildningens Faser:
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {selectedPhase === 'ALL' ? `Visar alla ${phases.length} faser` : selectedPhase}
          </span>
        </div>

        {/* Fas-knappar */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedPhase('ALL')}
            className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
              selectedPhase === 'ALL'
                ? 'bg-orange-500 text-black border-orange-400 font-black'
                : 'bg-[#1a1a1a] text-slate-300 border-[#2d2d2d] hover:border-[#3d3d3d]'
            }`}
          >
            Alla faser ({relevantMoments.length} moment)
          </button>

          {phases.map((phase) => {
            const pMoments = relevantMoments.filter((m) => m.phaseName === phase);
            const pDone = pMoments.filter((m) => project.moments[m.id]?.status === 'GREEN').length;
            const isAllDone = pDone === pMoments.length && pMoments.length > 0;
            const isSelected = selectedPhase === phase;

            return (
              <button
                key={phase}
                type="button"
                onClick={() => setSelectedPhase(phase)}
                className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-orange-500 text-black border-orange-400 font-black'
                    : isAllDone
                    ? 'bg-[#16201a] border-emerald-800 text-emerald-300'
                    : 'bg-[#1a1a1a] text-slate-300 border-[#2d2d2d] hover:border-[#3d3d3d]'
                }`}
              >
                <span>{phase}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected
                      ? 'bg-black/20 text-black font-black'
                      : isAllDone
                      ? 'bg-emerald-950 text-emerald-400 font-bold'
                      : 'bg-[#141414] text-slate-400'
                  }`}
                >
                  {pDone}/{pMoments.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHECKLISTA - RENA RADER MED MYCKET LUFT OCH TYDLIG FASHIERARKI */}
      <div className="space-y-6">
        {phases
          .filter((phase) => selectedPhase === 'ALL' || selectedPhase === phase)
          .map((phaseName) => {
            const phaseMoments = relevantMoments.filter((m) => m.phaseName === phaseName);
            const phaseCompleted = phaseMoments.filter(
              (m) => project.moments[m.id]?.status === 'GREEN'
            ).length;

            return (
              <div key={phaseName} className="space-y-3">
                {/* 3. CHECKLISTA: Gruppera momenten under tydliga rubrikrader baserat på utbildningens Faser */}
                <div className="flex items-center justify-between px-2 pt-2 border-b border-[#262626] pb-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                    <span className="text-orange-400">■</span>
                    <span>{phaseName}</span>
                  </h2>
                  <span className="text-xs font-bold font-mono text-slate-400">
                    {phaseCompleted} av {phaseMoments.length} klara
                  </span>
                </div>

                {/* Momentraderna i fasen */}
                <div className="space-y-3">
                  {phaseMoments.map((moment) => {
                    const record: MomentRecord = project.moments[moment.id] || {
                      momentId: moment.id,
                      status: 'RED',
                      comment: '',
                      signature: '',
                    };

                    const status: MomentStatus = record.status || 'RED';
                    const isExpanded = !!expandedMoments[moment.id];

                    const photos: MomentPhoto[] =
                      record.photos && record.photos.length > 0
                        ? record.photos
                        : record.photoBase64
                        ? [
                            {
                              id: 'p_1',
                              dataUrl: record.photoBase64,
                              capturedAt: record.completedAt || '',
                              category: getDefaultCategoryForMoment(moment.id, moment.phaseName),
                            },
                          ]
                        : [];

                    return (
                      <div
                        key={moment.id}
                        className={`rounded-3xl border-2 transition-all overflow-hidden ${
                          status === 'GREEN'
                            ? 'bg-[#151c17] border-emerald-800/80 shadow-lg'
                            : status === 'YELLOW'
                            ? 'bg-[#1c1a14] border-orange-800/80 shadow-lg'
                            : 'bg-[#1a1a1a] border-[#2c2c2c] hover:border-[#3c3c3c]'
                        }`}
                      >
                        {/* MOMENTRAD: Mycket luft, Momentets namn till vänster, AMA-koden högerjusterad */}
                        <div
                          onClick={() => toggleMomentExpand(moment.id)}
                          className="p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer touch-manipulation select-none"
                        >
                          {/* Vänster: Statusikon och Momentets namn med mycket luft */}
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            {/* Stor, tydlig statuscirkel */}
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 font-black transition-all ${
                                status === 'GREEN'
                                  ? 'bg-emerald-500 border-emerald-400 text-black shadow-md shadow-emerald-500/20'
                                  : status === 'YELLOW'
                                  ? 'bg-orange-500 border-orange-400 text-black shadow-md shadow-orange-500/20'
                                  : 'bg-[#141414] border-[#383838] text-slate-500'
                              }`}
                            >
                              {status === 'GREEN' ? (
                                <Check className="w-5 h-5 stroke-[3.5]" />
                              ) : status === 'YELLOW' ? (
                                <span className="w-3 h-3 rounded-full bg-black"></span>
                              ) : (
                                <span className="w-3 h-3 rounded-full bg-slate-600"></span>
                              )}
                            </div>

                            {/* Momentets namn med stor, luftig typografi */}
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <h3 className="text-base sm:text-xl font-black text-white truncate leading-snug">
                                {moment.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-mono">
                                  Moment {moment.id}
                                </span>
                                {status === 'GREEN' && (
                                  <span className="text-xs font-bold text-emerald-400">
                                    • Godkänd & Signerad
                                  </span>
                                )}
                                {status === 'YELLOW' && (
                                  <span className="text-xs font-bold text-orange-400">
                                    • Påbörjad
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Höger: AMA-koden högerjusterad & expand-pil */}
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {/* AI-Hjälpare Snabbknapp på varje moment */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMomentAiHelper(moment);
                              }}
                              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-500/50 hover:border-sky-400 text-sky-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                              title={`Fråga AI-hjälparen om moment ${moment.id}`}
                            >
                              <Bot className="w-3.5 h-3.5 text-sky-400" />
                              <span className="hidden sm:inline">AI-hjälpare</span>
                            </button>

                            {/* Högerjusterad AMA-kod */}
                            <span className="text-xs sm:text-sm font-mono font-black text-orange-400 bg-orange-950/60 border border-orange-800/80 px-3 py-1.5 rounded-xl tracking-wide">
                              AMA: {moment.amaCode}
                            </span>

                            {/* Fotobadge om foton finns */}
                            {photos.length > 0 && (
                              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700 px-2.5 py-1 rounded-xl flex items-center gap-1">
                                <Camera className="w-3.5 h-3.5" />
                                <span>{photos.length}</span>
                              </span>
                            )}

                            {/* Expanderingsknapp */}
                            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#333333] flex items-center justify-center text-slate-300">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-orange-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 4. DETALJVY (Inuti ett moment): Tydlig vertikal kedja med mycket tomrum ("breathing room") emellan */}
                        {isExpanded && (
                          <div className="p-6 sm:p-8 border-t-2 border-[#262626] bg-[#121212] space-y-8">
                            {/* ELEMENT 1 (Överst): En låst textruta med stor och tydlig typografi för "Skolans Arbetsinstruktion" */}
                            <div className="bg-[#181818] border-2 border-[#2a2a2a] rounded-3xl p-6 sm:p-7 space-y-4 shadow-md">
                              <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
                                <div className="flex items-center gap-2">
                                  <Lock className="w-5 h-5 text-orange-400" />
                                  <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-orange-400">
                                    Skolans Arbetsinstruktion (Låst krav)
                                  </h4>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-400 bg-[#121212] px-2.5 py-1 rounded-lg border border-[#333333]">
                                  AMA {moment.amaCode}
                                </span>
                              </div>

                              {/* Huvudinstruktion med stor, tydlig typografi och dynamiskt kryssmått */}
                              <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
                                {renderInstructionWithMeasurements(moment.instruction)}
                              </p>

                              {/* AI-HJÄLPAREN FÖR DETTA MOMENT */}
                              <div className="bg-gradient-to-r from-sky-950/70 via-[#0e1624] to-sky-950/40 border-2 border-sky-500/40 hover:border-sky-400/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-sky-950/40 transition-all">
                                <div className="flex items-start sm:items-center gap-3.5">
                                  <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/40 flex items-center justify-center shrink-0 shadow-sm">
                                    <Bot className="w-6 h-6 stroke-[2.2]" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI-Hjälparen för Moment {moment.id}
                                      </span>
                                      <span className="text-[10px] font-bold bg-sky-900/90 text-sky-200 px-2 py-0.5 rounded-full border border-sky-700">
                                        Smart ordförklaring & frågor
                                      </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                                      Förstår du inte någon del av texten eller begreppen? Klicka för snabbförklaringar eller ställ egna frågor fritt!
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenMomentAiHelper(moment)}
                                  className="w-full sm:w-auto px-5 py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-500/20 shrink-0"
                                >
                                  <Bot className="w-4 h-4" />
                                  <span>Fråga AI-hjälparen</span>
                                </button>
                              </div>

                              {/* Dynamiskt kryssmått hjälpmedel om momentet kräver kryssmått */}
                              {moment.instruction.includes('*****') && (
                                <div className="bg-[#1e1710] border border-orange-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0">
                                      <Compass className="w-5 h-5 stroke-[2.5]" />
                                    </div>
                                    <div>
                                      <span className="text-xs font-black text-orange-400 uppercase tracking-wider block">
                                        Hjälpmedel: Registrerat kryssmått för övningen
                                      </span>
                                      <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                                        {project.fieldMeasurements?.diagonal ? (
                                          <>
                                            Kontrollera diagonalen mot{' '}
                                            <span className="font-mono font-black text-orange-400 bg-orange-950 px-2 py-0.5 rounded border border-orange-800">
                                              {project.fieldMeasurements.diagonal.toFixed(2)} m
                                            </span>{' '}
                                            (beräknat från Sida A: {project.fieldMeasurements.sideA || '-'} m, Sida B: {project.fieldMeasurements.sideB || '-'} m).
                                          </>
                                        ) : (
                                          'Inget kryssmått registrerat än. Ange mått här så räknas diagonalen ut automatiskt.'
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setIsCrossMeasureOpen(true)}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl cursor-pointer transition-all active:scale-95 shrink-0 shadow-md shadow-orange-500/20"
                                  >
                                    {project.fieldMeasurements?.diagonal ? 'Justera mått' : 'Räkna ut kryssmått'}
                                  </button>
                                </div>
                              )}

                              {/* Kritiskt fotokrav & Yrkeslärarens råd */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                {/* Kritiskt dolt moment att fota */}
                                <div className="bg-[#121212] border-2 border-orange-500/40 rounded-2xl p-4 space-y-1.5">
                                  <span className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                                    <Camera className="w-4 h-4 stroke-[2.5]" />
                                    Kritiskt dolt moment:
                                  </span>
                                  <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed">
                                    {moment.criticalValidationHint || 'Fota utfört moment med tydlig referens innan övertäckning.'}
                                  </p>
                                </div>

                                {/* Yrkeslärarens / Handledarens fältråd */}
                                <div className="bg-[#121212] border border-[#333333] rounded-2xl p-4 space-y-1.5">
                                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" />
                                    Yrkeslärarens fältråd:
                                  </span>
                                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                    {moment.proTip}
                                  </p>
                                </div>
                              </div>

                              {/* Standardmallar & Förslag på kontroller med Minus-knapp */}
                              <div className="space-y-2 pt-2 border-t border-[#262626]">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-300">
                                    Snabbval för egenkontroll (AMA {moment.amaCode}):
                                  </span>
                                  <span className="text-slate-500">Klicka för att lägga till eller ta bort</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {getSuggestionsForMoment(moment.id).map((sug) => {
                                    const isAdded = record.structuredChecks?.includes(sug.label);
                                    return (
                                      <button
                                        key={sug.id}
                                        type="button"
                                        onClick={() => handleToggleStructuredCheck(moment.id, sug.label)}
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                          isAdded
                                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                                            : 'bg-[#121212] text-slate-300 border-[#333333] hover:border-orange-500 hover:text-white'
                                        }`}
                                      >
                                        {isAdded ? (
                                          <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                                            <span>{sug.label}</span>
                                            <span
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveStructuredCheck(moment.id, sug.label);
                                              }}
                                              className="w-4 h-4 rounded-full bg-emerald-900 hover:bg-rose-600 text-rose-200 hover:text-white flex items-center justify-center font-bold text-xs"
                                              title="Ta bort detta val (-)"
                                            >
                                              -
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="text-orange-400 font-black">+</span>
                                            <span>{sug.label}</span>
                                          </>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* ELEMENT 2 (Mitten): Ett stort, tomt inmatningsfält för "Egen anteckning / Avvikelse / Kommentar till läraren" */}
                            <div className="space-y-3">
                              <label className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-200 block">
                                Egen anteckning / Avvikelse / Kommentar till läraren:
                              </label>

                              <textarea
                                rows={5}
                                value={record.comment || ''}
                                onChange={(e) => handleUpdateMomentComment(moment.id, e.target.value)}
                                placeholder="Skriv egna anteckningar här... T.ex. lasermått, rörfall i mm/m, temperatur, grusfraktion eller frågor till läraren."
                                className="w-full min-h-[140px] p-5 bg-[#141414] border-2 border-[#2e2e2e] focus:border-orange-500 rounded-3xl text-white text-base leading-relaxed outline-none resize-y placeholder-slate-500 shadow-inner"
                              />

                              {/* Visning av valda strukturerade kontroller med minusknapp [-] */}
                              {record.structuredChecks && record.structuredChecks.length > 0 && (
                                <div className="p-3 bg-[#162019] border border-emerald-700/80 rounded-2xl flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold text-emerald-300">
                                    Valda kontrollpunkter:
                                  </span>
                                  {record.structuredChecks.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="inline-flex items-center gap-1.5 bg-[#0f1712] border border-emerald-600 text-emerald-200 text-xs px-3 py-1 rounded-xl font-medium"
                                    >
                                      <span>✓ {item}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveStructuredCheck(moment.id, item)}
                                        className="w-4 h-4 rounded-full bg-emerald-950 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer transition-colors ml-1"
                                        title="Ta bort (-)"
                                      >
                                        -
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* ELEMENT 3 (Nederst): Stora tydliga knappar för "Ta bild (Kamera)" & tidsstämplade foton */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-200">
                                  Fotobevis på kritiska dolda moment ({photos.length} st):
                                </span>
                                <span className="text-xs text-orange-400 font-bold">
                                  Automatisk tidsstämpel bränns in
                                </span>
                              </div>

                              {/* Stor, tydlig kamera-knapp i skarpt varningsorange/gult */}
                              <button
                                type="button"
                                onClick={() => handleTriggerCameraForMoment(moment.id, moment.phaseName)}
                                disabled={isCapturingPhoto}
                                className="w-full min-h-[64px] bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-orange-500/25 cursor-pointer transition-all touch-manipulation"
                              >
                                <Camera className="w-6 h-6 stroke-[2.5]" />
                                <span>
                                  {isCapturingPhoto ? 'Sparar foto...' : 'Ta bild (Kamera)'}
                                </span>
                              </button>

                              {/* Galleri av tagna bilder */}
                              {photos.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                  {photos.map((p, idx) => (
                                    <div
                                      key={p.id}
                                      className="bg-[#181818] border-2 border-[#2e2e2e] rounded-2xl overflow-hidden shadow-lg group relative"
                                    >
                                      <div
                                        onClick={() =>
                                          setLightboxPhoto({
                                            url: p.dataUrl,
                                            title: `Foto ${idx + 1} • Moment ${moment.id}: ${moment.title}`,
                                          })
                                        }
                                        className="h-48 bg-black relative cursor-pointer"
                                      >
                                        <img
                                          src={p.dataUrl}
                                          alt="Fotobevis"
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm">
                                          <Eye className="w-5 h-5" />
                                          <span>Klicka för att förstora</span>
                                        </div>
                                      </div>

                                      <div className="p-3 bg-[#141414] border-t border-[#2a2a2a] flex items-center justify-between text-xs">
                                        <div className="space-y-0.5">
                                          <span className="font-bold text-white block">
                                            Foto {idx + 1} • Tidsstämplat
                                          </span>
                                          <span className="text-slate-400 font-mono">
                                            {p.capturedAt || 'Idag'}
                                          </span>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleDeletePhotoFromMoment(moment.id, p.id)}
                                          className="p-2 text-slate-500 hover:text-rose-400 cursor-pointer"
                                          title="Ta bort detta foto"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* ELEMENT 4 (Längst ner): Bred signaturruta i botten där eleven eller läraren kan signera övningen med fingret */}
                            <div className="bg-[#181818] border-2 border-[#2c2c2c] rounded-3xl p-6 sm:p-7 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2a2a2a] pb-3">
                                <div>
                                  <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <PenTool className="w-5 h-5 text-orange-400" />
                                    <span>Signera momentet med fingret</span>
                                  </h4>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Rita din namnteckning direkt i rutan nedan med fingret eller musen.
                                  </p>
                                </div>

                                {record.completedAt && (
                                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800">
                                    Signerat: {record.completedAt}
                                  </span>
                                )}
                              </div>

                              {/* Interaktiv touch canvas för fingerritning */}
                              <div className="space-y-2">
                                <div className="border-2 border-dashed border-[#444444] rounded-2xl bg-[#0f0f0f] relative overflow-hidden">
                                  <canvas
                                    ref={(el) => {
                                      canvasRefs.current[moment.id] = el;
                                    }}
                                    width={700}
                                    height={180}
                                    className="w-full h-[160px] sm:h-[180px] touch-none cursor-crosshair"
                                    onMouseDown={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const scaleX = e.currentTarget.width / rect.width;
                                      const scaleY = e.currentTarget.height / rect.height;
                                      startDrawing(
                                        moment.id,
                                        (e.clientX - rect.left) * scaleX,
                                        (e.clientY - rect.top) * scaleY
                                      );
                                    }}
                                    onMouseMove={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const scaleX = e.currentTarget.width / rect.width;
                                      const scaleY = e.currentTarget.height / rect.height;
                                      draw(
                                        moment.id,
                                        (e.clientX - rect.left) * scaleX,
                                        (e.clientY - rect.top) * scaleY
                                      );
                                    }}
                                    onMouseUp={() => stopDrawing(moment.id)}
                                    onMouseLeave={() => stopDrawing(moment.id)}
                                    onTouchStart={(e) => {
                                      e.preventDefault();
                                      const touch = e.touches[0];
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const scaleX = e.currentTarget.width / rect.width;
                                      const scaleY = e.currentTarget.height / rect.height;
                                      startDrawing(
                                        moment.id,
                                        (touch.clientX - rect.left) * scaleX,
                                        (touch.clientY - rect.top) * scaleY
                                      );
                                    }}
                                    onTouchMove={(e) => {
                                      e.preventDefault();
                                      const touch = e.touches[0];
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const scaleX = e.currentTarget.width / rect.width;
                                      const scaleY = e.currentTarget.height / rect.height;
                                      draw(
                                        moment.id,
                                        (touch.clientX - rect.left) * scaleX,
                                        (touch.clientY - rect.top) * scaleY
                                      );
                                    }}
                                    onTouchEnd={() => stopDrawing(moment.id)}
                                  />

                                  {/* Hjälptext i bakgrunden */}
                                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-700 font-mono text-sm font-bold select-none opacity-40">
                                    [ RITA SIGNATUR HÄR ]
                                  </div>
                                </div>

                                {/* Signaturåtgärder */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => clearSignatureCanvas(moment.id)}
                                    className="w-full sm:w-auto min-h-[46px] px-5 bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 border border-[#3c3c3c] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Eraser className="w-4 h-4" />
                                    <span>Rensa signatur</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSignMomentWithFinger(moment.id)}
                                    className="w-full sm:w-auto min-h-[52px] px-8 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/20 cursor-pointer transition-all"
                                  >
                                    <Check className="w-5 h-5 stroke-[3]" />
                                    <span>Godkänn & Signera Moment</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* FIXED BOTTOM ACTION BAR FÖR PRAKTISKA ÖVNINGAR */}
      <div className="sticky bottom-4 z-30 pt-4">
        <div className="bg-[#1a1a1a]/95 backdrop-blur-md border-2 border-[#2d2d2d] rounded-3xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={scrollToTop}
              className="w-12 h-12 rounded-2xl bg-[#141414] hover:bg-[#242424] text-slate-300 border border-[#333333] flex items-center justify-center cursor-pointer transition-colors shrink-0"
              title="Till toppen"
            >
              <ArrowUp className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsArchiveOpen(true)}
              className="min-h-[48px] px-4 bg-[#141414] hover:bg-[#242424] text-white border border-[#333333] rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-orange-400" />
              <span>Fotopärm ({totalPhotosCount})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenReport}
            className="min-h-[50px] px-6 bg-orange-500 hover:bg-orange-400 text-black font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer transition-all active:scale-95"
          >
            <FileText className="w-5 h-5 stroke-[2.5]" />
            <span>Skapa Slutrapport</span>
          </button>
        </div>
      </div>

      {/* MODALER */}
      {/* 1. Snabbfota Modal */}
      {isPhotoMenuOpen && (
        <PhotoQuickMenuModal
          project={project}
          moments={relevantMoments}
          onClose={() => setIsPhotoMenuOpen(false)}
          onAddMomentPhoto={(momentId, photoBase64, category) =>
            handleAddPhotoToMoment(momentId, photoBase64, category)
          }
        />
      )}

      {/* 2. Fotopärm Modal */}
      {isArchiveOpen && (
        <PhotoArchiveModal
          project={project}
          userSettings={userSettings}
          onUpdateUserSettings={onUpdateUserSettings}
          onClose={() => setIsArchiveOpen(false)}
          onOpenLightbox={(url, title) => setLightboxPhoto({ url, title })}
        />
      )}

      {/* 3. Kryssmått Modal */}
      {isCrossMeasureOpen && (
        <CrossMeasureCalculatorModal
          onClose={() => setIsCrossMeasureOpen(false)}
          initialMeasurements={project.fieldMeasurements}
          onSaveMeasurements={(meas) => {
            onUpdateProject({
              ...project,
              fieldMeasurements: {
                ...project.fieldMeasurements,
                ...meas,
              },
            });
            setCloudSyncMsg(`Kryssmått ${meas.diagonal.toFixed(2)} m sparat i övningen!`);
            setTimeout(() => setCloudSyncMsg(null), 3500);
          }}
          onInsertToNotes={(text) => {
            const cur = project.notes || '';
            onUpdateProject({
              ...project,
              notes: cur ? cur + '\n' + text : text,
            });
          }}
        />
      )}

      {/* 4. Avböj Försyn (Flera bekräftelsesteg) Modal */}
      {isExemptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#121212] border-2 border-orange-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Avböj Försyn & Skadeguide
                  </h3>
                  <span className="text-xs text-orange-400 font-bold">
                    Steg {exemptStep} av 2: Bekräfta undantag
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExemptModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#1c1c1c] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Steg 1: Varning & Branschfakta */}
            {exemptStep === 1 && (
              <div className="space-y-4">
                <div className="bg-[#1a140f] border border-orange-500/40 rounded-2xl p-4 space-y-2">
                  <h4 className="text-sm font-black text-orange-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    Varför är försyn så viktigt i branschen?
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    I verkliga anläggningsarbeten är försyn (skadefotografering av grannfastigheters socklar, staket och asfalt före schaktstart) ett lagkrav för att skydda entreprenören mot falska skadeståndsanspråk.
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-300">
                  Om detta är en <strong>övning på skolan</strong> i en övningsbädd där ingen grannfastighet berörs kan du avböja försynen för att kunna slutföra rapporten.
                </p>

                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-3 text-[11px] text-slate-400">
                  💡 <strong>Obs:</strong> Inget beslut försvinner permanent. Du kan när som helst ångra dig och komplettera med försynsfoton i efterhand!
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExemptModalOpen(false)}
                    className="px-4 py-2.5 bg-[#1c1c1c] hover:bg-[#252525] text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="button"
                    onClick={() => setExemptStep(2)}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl text-xs sm:text-sm cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    Gå vidare till steg 2 →
                  </button>
                </div>
              </div>
            )}

            {/* Steg 2: Val av anledning & Slutlig bekräftelse */}
            {exemptStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Välj anledning till undantag för denna övning:
                  </label>
                  <select
                    value={exemptReason}
                    onChange={(e) => setExemptReason(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 bg-[#181818] border border-[#333333] focus:border-orange-500 rounded-xl text-white text-xs sm:text-sm outline-none"
                  >
                    <option value="Praktisk skolövning i övningshall / övningsbädd">
                      Praktisk skolövning i övningshall / övningsbädd
                    </option>
                    <option value="Inga anslutande fastigheter eller grannar berörs">
                      Inga anslutande fastigheter eller grannar berörs
                    </option>
                    <option value="Repetition / Delmoment utan yttre markpåverkan">
                      Repetition / Delmoment utan yttre markpåverkan
                    </option>
                    <option value="Godkänt undantag av yrkeslärare">
                      Godkänt undantag av yrkeslärare
                    </option>
                  </select>
                </div>

                <div className="bg-[#161f1a] border border-emerald-800/60 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-400 block">
                    ✓ Full tillgänglighet bevaras
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Egenkontrollrapporten kommer att godkännas med noteringen: <em>"{exemptReason}"</em>. Du kan när som helst klicka på "Genomför försyn ändå" för att lägga till foton.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setExemptStep(1)}
                    className="px-3.5 py-2.5 bg-[#1c1c1c] hover:bg-[#252525] text-slate-400 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ← Tillbaka
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmExempt}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl text-xs sm:text-sm cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    Bekräfta undantag
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Snabbanteckningar / Fältblock Modal */}
      {isQuickNotesOpen && (
        <QuickNotesModal
          project={project}
          onUpdateProject={onUpdateProject}
          onClose={() => setIsQuickNotesOpen(false)}
        />
      )}

      {/* 5. FältKoll & Byggexpert Modal */}
      {isFieldHelperOpen && (
        <FieldHelperModal
          onClose={() => setIsFieldHelperOpen(false)}
          currentMomentTitle={helperMoment?.title}
          currentAmaCode={helperMoment?.ama}
        />
      )}

      {/* 5b. Moment-specifik AI-Hjälpare Modal */}
      {activeMomentForAi && (
        <MomentAiHelperModal
          moment={activeMomentForAi}
          onClose={() => setActiveMomentForAi(null)}
          onInsertToNotes={handleInsertAiNoteToMoment}
        />
      )}

      {/* 6. Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 p-4 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-white">
            <h4 className="font-bold text-base truncate">{lightboxPhoto.title}</h4>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="p-2 bg-[#222222] rounded-xl text-white cursor-pointer font-bold"
            >
              ✕ Stäng
            </button>
          </div>
          <img
            src={lightboxPhoto.url}
            alt="Förstorad bild"
            className="max-h-[85vh] max-w-full object-contain rounded-2xl border-2 border-[#333333] shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
