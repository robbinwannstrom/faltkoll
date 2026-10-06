import React, { useState, useEffect } from 'react';
import {
  Project,
  ProjectType,
  UserSettings,
  UserAccount,
  AppLayoutMode,
} from '../types';
import { ALL_MOMENTS, PROJECT_TYPE_LABELS } from '../data/momentsData';
import { getDeletedProjects } from '../db/indexedDb';
import {
  getContextVocabulary,
  resolveAppContextMode,
} from '../utils/contextLabels';
import {
  Plus,
  FolderOpen,
  FileText,
  Trash2,
  MapPin,
  CheckCircle2,
  Users,
  Shield,
  ArrowRight,
  BookOpen,
  Filter,
  List,
  LayoutGrid,
  Table,
  ChevronDown,
  Search,
  X,
  GraduationCap,
  Eye,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  fieldProjects?: Project[];
  activeFilterScope?: 'ALL' | 'MINE';
  onFilterScopeChange?: (scope: 'ALL' | 'MINE') => void;
  onOpenProject: (projectId: string) => void;
  onCreateNew: () => void;
  onDeleteProject: (projectId: string) => void;
  onOpenReportDirect: (project: Project) => void;
  onOpenCollaboration?: () => void;
  onOpenTrashBin?: () => void;
  onOpenAccounts?: () => void;
  onOpenFieldMonitor?: () => void;
  onOpenAPKExport?: () => void;
  onOpenQRCodeModal?: () => void;
  onOpenTutorial?: (projectId?: string) => void;
  onOpenExerciseCreator?: () => void;
  currentUser?: UserAccount | null;
  userSettings?: UserSettings;
  onUpdateUserSettings?: (newSettings: UserSettings) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  fieldProjects,
  activeFilterScope = 'ALL',
  onFilterScopeChange,
  onOpenProject,
  onCreateNew,
  onDeleteProject,
  onOpenReportDirect,
  onOpenCollaboration,
  onOpenTrashBin,
  onOpenAccounts,
  onOpenFieldMonitor,
  onOpenTutorial,
  onOpenExerciseCreator,
  currentUser,
  userSettings,
  onUpdateUserSettings,
}) => {
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [hideReminder, setHideReminder] = useState<boolean>(false);
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('faltkoll_show_quick_guide') !== 'false';
    } catch {
      return true;
    }
  });

  const getProjectTypeEmoji = (type: ProjectType) => {
    switch (type) {
      case 'HUSGRUND':
        return '🏠';
      case 'ALTAN_TRADACK':
        return '🪵';
      case 'PLATTSATTNING':
        return '🧱';
      case 'ENSKILT_AVLOPP':
        return '🚰';
      default:
        return '🏗️';
    }
  };

  // Filter & Layout popover state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ProjectType>('ALL');

  const activeContextMode = resolveAppContextMode(userSettings, currentUser);
  const vocab = getContextVocabulary(activeContextMode);
  const layoutMode: AppLayoutMode = userSettings?.appLayoutMode || 'SIMPLE_LIST';

  const handleSetLayoutMode = (mode: AppLayoutMode) => {
    if (userSettings && onUpdateUserSettings) {
      onUpdateUserSettings({
        ...userSettings,
        appLayoutMode: mode,
      });
    }
  };

  const uninspectedProjects = projects.filter(
    (p) => !p.preInspectionCompleted && !p.isDeleted
  );

  const checkDeleted = async () => {
    try {
      const list = await getDeletedProjects();
      setDeletedCount(list.length);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    checkDeleted();
  }, [projects]);

  const getProjectStats = (project: Project) => {
    const relevant =
      project.customMoments && project.customMoments.length > 0
        ? project.customMoments
        : ALL_MOMENTS.filter((m) => m.projectType === project.projectType);
    const totalMoments = relevant.length;
    const completedMoments = relevant.filter(
      (m) => project.moments[m.id]?.status === 'GREEN'
    ).length;
    const inProgressMoments = relevant.filter(
      (m) => project.moments[m.id]?.status === 'YELLOW'
    ).length;
    const percent =
      totalMoments > 0 ? Math.round((completedMoments / totalMoments) * 100) : 0;
    return { totalMoments, completedMoments, inProgressMoments, percent };
  };

  const handleSoftDelete = (project: Project) => {
    if (confirm(`Vill du flytta "${project.name}" till papperskorgen?`)) {
      onDeleteProject(project.id);
      setToastMsg(`"${project.name}" flyttades till papperskorgen.`);
      setTimeout(() => setToastMsg(null), 4000);
      checkDeleted();
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((project) => {
    const stats = getProjectStats(project);
    if (typeFilter !== 'ALL' && project.projectType !== typeFilter) return false;
    if (statusFilter === 'COMPLETED' && stats.percent < 100) return false;
    if (
      statusFilter === 'IN_PROGRESS' &&
      (stats.percent === 100 || (stats.completedMoments === 0 && stats.inProgressMoments === 0))
    ) {
      return false;
    }
    if (
      statusFilter === 'NOT_STARTED' &&
      (stats.completedMoments > 0 || stats.inProgressMoments > 0)
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = project.name.toLowerCase().includes(q);
      const matchProp = project.propertyDesignation?.toLowerCase().includes(q);
      const matchGroup = project.groupCode?.toLowerCase().includes(q);
      if (!matchName && !matchProp && !matchGroup) return false;
    }
    return true;
  });

  const activeFilterCount =
    (statusFilter !== 'ALL' ? 1 : 0) +
    (typeFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const completedProjectsCount = projects.filter((p) => getProjectStats(p).percent === 100).length;
  const inProgressProjectsCount = projects.filter((p) => {
    const s = getProjectStats(p);
    return s.percent < 100 && (s.completedMoments > 0 || s.inProgressMoments > 0);
  }).length;

  // Active exercises running in field by any student or user
  const runningExercises = (fieldProjects && fieldProjects.length > 0 ? fieldProjects : projects).filter(
    (p) =>
      !p.isDeleted &&
      (p.isTeacherExercise ||
        !!p.exerciseCode ||
        !!p.studentId ||
        (p.studentName && p.studentName.toLowerCase().includes('elev')) ||
        p.creatorRole === 'STUDENT')
  );

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-6 py-4 sm:py-5 pb-28 space-y-4 sm:space-y-5 font-sans w-full max-w-full overflow-x-clip min-w-0">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-[#1c1914] border border-orange-500/60 rounded-xl p-3.5 flex items-center justify-between text-xs sm:text-sm text-orange-200">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          {onOpenTrashBin && (
            <button
              onClick={onOpenTrashBin}
              className="text-orange-300 hover:text-white font-bold text-xs underline cursor-pointer ml-3"
            >
              Öppna papperskorgen
            </button>
          )}
        </div>
      )}

      {/* SUPER-ENKEL 3-STEGSGUIDE (Lätt som en plätt för alla) */}
      {showQuickGuide && (
        <div className="bg-gradient-to-r from-[#1a1a1a] via-[#1b1916] to-[#181818] border border-orange-500/40 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">🎈</span>
              <h2 className="text-xs sm:text-sm md:text-base font-black text-white">
                Så här enkelt fungerar det:
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowQuickGuide(false);
                try {
                  localStorage.setItem('faltkoll_show_quick_guide', 'false');
                } catch {}
              }}
              className="text-[11px] sm:text-xs text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              title="Dölj guiden"
            >
              ✕ Dölj
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3">
            <div className="bg-[#121212]/95 border border-[#262626] rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-xl sm:text-2xl shrink-0 leading-none">1️⃣</span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-white">Välj eller Skapa</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Tryck på <strong className="text-orange-400">"➕ Nytt Projekt"</strong> eller öppna ett bygge i listan.
                </p>
              </div>
            </div>

            <div className="bg-[#121212]/95 border border-[#262626] rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-xl sm:text-2xl shrink-0 leading-none">2️⃣</span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-white">Bocka av & Fota</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Tryck på cirkeln vid momentet: <strong className="text-emerald-400">Grön bock = Klart!</strong> Fota med kameran.
                </p>
              </div>
            </div>

            <div className="bg-[#121212]/95 border border-[#262626] rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-xl sm:text-2xl shrink-0 leading-none">3️⃣</span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-white">Klart! 🎉</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Allt sparas automatiskt i din enhet. Tryck på <strong className="text-orange-400">Rapport</strong> när du vill se resultatet.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STOR TYDLIG HUVUDKNAPP FÖR ATT SKAPA PROJEKT */}
      <div className="bg-[#161616] border-2 border-orange-500/30 hover:border-orange-500/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 transition-all shadow-xl">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏗️</span>
            <h2 className="text-base sm:text-lg font-black text-white truncate">
              Starta en ny egenkontroll eller bygge
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Välj husgrund, altan, plattsättning eller avloppskontroll med några klick.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="min-h-[48px] sm:min-h-[52px] px-5 sm:px-6 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-orange-500/25 shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>➕ Skapa Nytt Projekt</span>
        </button>
      </div>

      {/* REN TOPPRAD: Titel och verktyg */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {vocab.projectsHeading}
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#1c1c1c] text-slate-400 border border-[#2c2c2c]">
              {filteredProjects.length}
              {filteredProjects.length !== projects.length ? ` av ${projects.length}` : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{vocab.projectsSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* FILTER & LAYOUT-KNAPP */}
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`min-h-[38px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-colors ${
              isFilterPanelOpen || activeFilterCount > 0
                ? 'bg-orange-500/15 border-orange-500/60 text-orange-300'
                : 'bg-[#181818] hover:bg-[#222222] text-slate-300 border-[#2e2e2e]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-orange-400" />
            <span>Filter & Vy</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-black font-black text-[10px]">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isFilterPanelOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Konton / Personal */}
          {onOpenAccounts && (
            <button
              type="button"
              onClick={onOpenAccounts}
              className="min-h-[38px] px-3 bg-[#181818] hover:bg-[#222222] text-slate-200 border border-[#2e2e2e] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-orange-400" />
              <span>
                {currentUser?.role === 'STUDENT'
                  ? vocab.myAccountButton
                  : vocab.accountsHeaderButton}
              </span>
            </button>
          )}

          {/* Anslut med kod */}
          {onOpenCollaboration && (
            <button
              type="button"
              onClick={onOpenCollaboration}
              className="min-h-[38px] px-3 bg-[#181818] hover:bg-[#222222] text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Anslut till projekt eller grupparbete med kod"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Anslut med kod</span>
            </button>
          )}

          {!showQuickGuide && (
            <button
              type="button"
              onClick={() => {
                setShowQuickGuide(true);
                try { localStorage.setItem('faltkoll_show_quick_guide', 'true'); } catch {}
              }}
              className="min-h-[38px] px-3 bg-[#181818] hover:bg-[#222] text-orange-400 border border-[#2e2e2e] font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              title="Visa 3-stegs guiden"
            >
              <span>💡 Snabbguide</span>
            </button>
          )}
        </div>
      </div>

      {/* SNABBFLIKAR FÖR ENKEL FILTRERING: Alla, Pågående, Klara */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`min-h-[36px] px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === 'ALL'
                  ? 'bg-white text-black border-white font-black shadow-sm'
                  : 'bg-[#181818] hover:bg-[#222] text-slate-300 border-[#2e2e2e]'
              }`}
            >
              <span>Alla projekt ({projects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`min-h-[36px] px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-amber-400 text-black border-amber-400 font-black shadow-sm'
                  : 'bg-[#181818] hover:bg-[#222] text-amber-300 border-[#2e2e2e]'
              }`}
            >
              <span>🟡 Pågående ({inProgressProjectsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`min-h-[36px] px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-400 text-black border-emerald-400 font-black shadow-sm'
                  : 'bg-[#181818] hover:bg-[#222] text-emerald-300 border-[#2e2e2e]'
              }`}
            >
              <span>🟢 Helt klara ({completedProjectsCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* LÄRARE / ADMIN: VÄLJ VY MELLAN ALLA AKTIVA FÄLTARBETEN & EGNA PROJEKT */}
      {currentUser?.role !== 'STUDENT' && onFilterScopeChange && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161616] border border-[#2a2a2a] p-2 sm:p-2.5 rounded-2xl">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onFilterScopeChange('ALL')}
              className={`min-h-[38px] px-3.5 sm:px-4 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all border ${
                activeFilterScope === 'ALL'
                  ? 'bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/20'
                  : 'bg-[#121212] hover:bg-[#1f1f1f] text-slate-300 border-[#2e2e2e]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Alla pågående övningar & projekt</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeFilterScope === 'ALL'
                    ? 'bg-black text-orange-400'
                    : 'bg-[#222] text-slate-400'
                }`}
              >
                {projects.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onFilterScopeChange('MINE')}
              className={`min-h-[38px] px-3.5 sm:px-4 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all border ${
                activeFilterScope === 'MINE'
                  ? 'bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/20'
                  : 'bg-[#121212] hover:bg-[#1f1f1f] text-slate-300 border-[#2e2e2e]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Mina egna mallar & projekt</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 px-2.5 py-1 bg-[#121212] rounded-xl border border-[#262626]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-bold text-slate-300">
              {runningExercises.length} övningar i fält
            </span>
          </div>
        </div>
      )}

      {/* UTFÄLLBAR PANEL UNDER KNAPPEN "FILTER & VY" */}
      {isFilterPanelOpen && (
        <div className="bg-[#161616] border border-[#2c2c2c] rounded-2xl p-4 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#242424] pb-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-orange-400" />
              <span>Filtrera & välj listlayout</span>
            </span>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-bold text-orange-400 hover:underline cursor-pointer"
                >
                  Nollställ filter
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Välj Layout (Enkel lista, Kompakt tabell, Stora kort) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Layout / Visningsläge:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetLayoutMode('SIMPLE_LIST')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                    layoutMode === 'SIMPLE_LIST' || layoutMode === 'GUIDED_STEP'
                      ? 'bg-orange-500 text-black border-orange-400 font-black'
                      : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Enkel lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLayoutMode('COMPACT')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                    layoutMode === 'COMPACT'
                      ? 'bg-orange-500 text-black border-orange-400 font-black'
                      : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Kompakt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLayoutMode('FIELD_CLEAR')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                    layoutMode === 'FIELD_CLEAR'
                      ? 'bg-orange-500 text-black border-orange-400 font-black'
                      : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Stora kort</span>
                </button>
              </div>
            </div>

            {/* 2. Statusfilter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full min-h-[38px] px-3 bg-[#121212] border border-[#2e2e2e] rounded-lg text-xs text-white font-bold outline-none"
              >
                <option value="ALL">Alla statusar ({projects.length})</option>
                <option value="IN_PROGRESS">Pågående</option>
                <option value="COMPLETED">Klara (100%)</option>
                <option value="NOT_STARTED">Ej påbörjade</option>
              </select>
            </div>

            {/* 3. Typ & Sök */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Sök eller filtrera typ:
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Sök namn, fastighet..."
                    className="w-full min-h-[38px] pl-8 pr-2.5 bg-[#121212] border border-[#2e2e2e] rounded-lg text-xs text-white outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="min-h-[38px] px-2.5 bg-[#121212] border border-[#2e2e2e] rounded-lg text-xs text-slate-200 font-bold outline-none"
                >
                  <option value="ALL">Alla typer</option>
                  <option value="HUSGRUND">Husgrund</option>
                  <option value="ALTAN_TRADACK">Altan & Trädäck</option>
                  <option value="PLATTSATTNING">Plattsättning</option>
                  <option value="ENSKILT_AVLOPP">Enskilt Avlopp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Papperskorg & Försyn-genväg längst ner i filterpanelen */}
          <div className="pt-2 border-t border-[#242424] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              {!hideReminder && uninspectedProjects.length > 0 && onOpenTutorial && (
                <button
                  type="button"
                  onClick={() => onOpenTutorial(uninspectedProjects[0]?.id)}
                  className="text-orange-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    Försyn & Skadeguide ({uninspectedProjects.length} ej fotade)
                  </span>
                </button>
              )}
            </div>
            {onOpenTrashBin && (
              <button
                type="button"
                onClick={onOpenTrashBin}
                className="text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  Papperskorg ({deletedCount})
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fältöversikt & Elevinspektion för lärare & administratörer */}
      {currentUser?.role !== 'STUDENT' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#1c1c1c] via-[#1a1714] to-[#1c1c1c] border border-orange-500/40 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base sm:text-lg">
                    {runningExercises.length > 0
                      ? `🟢 ${runningExercises.length} övningar igång i fält just nu`
                      : 'Fältöversikt & Elevinspektion (Live)'}
                  </h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-xs text-slate-300">
                  {runningExercises.length > 0
                    ? 'Elever och lärlingar har pågående fältarbeten. Följ deras framsteg, fotobevis och stoppunkter i realtid.'
                    : 'Inga elever har övningar igång för tillfället. Så fort ett konto startar en övning synkas den automatiskt hit live.'}
                </p>
              </div>
            </div>

            {onOpenFieldMonitor && (
              <button
                type="button"
                onClick={onOpenFieldMonitor}
                className="min-h-[42px] px-5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-orange-500/20 shrink-0"
              >
                <span>Öppna Elevinspektion</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Snabblista med pågående övningar om sådana finns */}
          {runningExercises.length > 0 && (
            <div className="pt-3 border-t border-[#2a2a2a] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {runningExercises.slice(0, 6).map((rx) => {
                const rxStats = getProjectStats(rx);
                return (
                  <div
                    key={rx.id}
                    onClick={() => onOpenProject(rx.id)}
                    className="p-3 rounded-xl bg-[#141414] border border-[#2b2b2b] hover:border-orange-500/50 cursor-pointer transition-all flex flex-col justify-between gap-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-emerald-400 block truncate flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{rx.studentName || rx.contractorName || 'Elev'}</span>
                        </span>
                        <h4 className="text-xs font-bold text-white group-hover:text-orange-400 truncate mt-0.5">
                          {rx.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#202020] text-orange-300 border border-[#333] shrink-0">
                        {rx.exerciseCode || rx.groupCode || 'Fält'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#202020]">
                      <span className="text-emerald-400 font-mono font-bold">
                        {rxStats.percent}% klart ({rxStats.completedMoments}/{rxStats.totalMoments})
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {rx.schoolClass || 'Klass'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Diskret envägspåminnelse om försyn (endast om ej dold, enkel rad utan bling) */}
      {!hideReminder && uninspectedProjects.length > 0 && !isFilterPanelOpen && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <Shield className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="truncate">
              <strong>Försyn före schakt:</strong> {uninspectedProjects.length}{' '}
              {uninspectedProjects.length > 1
                ? vocab.projectNounPlural
                : vocab.projectNounSingular}{' '}
              saknar försynsfoton.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenTutorial && (
              <button
                type="button"
                onClick={() => onOpenTutorial(uninspectedProjects[0]?.id)}
                className="px-2.5 py-1 bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/40 font-bold rounded-lg cursor-pointer"
              >
                Öppna försyn
              </button>
            )}
            <button
              type="button"
              onClick={() => setHideReminder(true)}
              className="text-slate-500 hover:text-slate-300 cursor-pointer px-1"
              title="Dölj"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* PROJEKTLISTA — ANPASSAD EFTER VALD LAYOUT */}
      {projects.length === 0 ? (
        <div className="bg-[#161616] border border-[#282828] rounded-2xl p-10 text-center space-y-4">
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">
              {vocab.emptyProjectsTitle}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {vocab.emptyProjectsSubtitle}
            </p>
          </div>
          <div>
            <button
              onClick={onCreateNew}
              className="min-h-[44px] px-6 bg-orange-500 hover:bg-orange-400 text-black font-black text-sm rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{vocab.createFirstProjectButton}</span>
            </button>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-[#161616] border border-[#282828] rounded-xl p-8 text-center space-y-2">
          <p className="text-sm text-slate-300 font-bold">
            Inga {vocab.projectNounPlural} matchade ditt filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setTypeFilter('ALL');
              setSearchQuery('');
            }}
            className="text-xs text-orange-400 hover:underline font-bold cursor-pointer"
          >
            Visa alla ({projects.length})
          </button>
        </div>
      ) : layoutMode === 'COMPACT' ? (
        /* =====================================================================
           LAYOUT 2: KOMPAKT TABELLVY (Maximal översikt, täta rader)
           ===================================================================== */
        <div className="bg-[#151515] border border-[#262626] rounded-xl overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2.5 bg-[#1a1a1a] border-b border-[#262626] text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <div className="col-span-4 md:col-span-5">Namn</div>
            <div className="col-span-3 md:col-span-3">Typ & Fastighet</div>
            <div className="col-span-2 md:col-span-2">Framsteg</div>
            <div className="col-span-3 md:col-span-2 text-right">Åtgärd</div>
          </div>
          <div className="divide-y divide-[#222222]">
            {filteredProjects.map((project) => {
              const stats = getProjectStats(project);
              const typeInfo = PROJECT_TYPE_LABELS[project.projectType];
              const isCompleted = stats.percent === 100;

              return (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="px-4 py-3 hover:bg-[#1c1c1c] transition-colors cursor-pointer flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-2 sm:gap-3"
                >
                  <div className="sm:col-span-4 md:col-span-5 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-400'
                            : stats.completedMoments > 0
                            ? 'bg-orange-400'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span className="font-bold text-sm text-white truncate">
                        {project.name}
                      </span>
                      {project.isGroupProject && (
                        <span className="text-[10px] font-mono bg-[#222] text-slate-300 px-1.5 py-0.2 rounded border border-[#333] shrink-0">
                          {project.groupCode || 'Lag'}
                        </span>
                      )}
                    </div>
                    {(project.studentName || project.isTeacherExercise) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pl-4 mt-0.5 truncate">
                        <Users className="w-3 h-3 shrink-0" />
                        <span className="font-bold">{project.studentName || project.contractorName || 'Elev'}</span>
                        {project.schoolClass && <span className="text-slate-400">• {project.schoolClass}</span>}
                        {(project.isTeacherExercise || project.exerciseCode) && (
                          <span className="text-orange-400 font-semibold">• Övning {project.exerciseCode || ''}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-3 md:col-span-3 text-xs text-slate-400 truncate">
                    {typeInfo.title}
                    {project.propertyDesignation ? ` • ${project.propertyDesignation}` : ''}
                  </div>

                  <div className="sm:col-span-2 md:col-span-2 flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isCompleted ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {stats.completedMoments}/{stats.totalMoments} ({stats.percent}%)
                    </span>
                  </div>

                  <div
                    className="sm:col-span-3 md:col-span-2 flex items-center justify-end gap-1.5 shrink-0 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenProject(project.id)}
                      className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs rounded-lg cursor-pointer shrink-0"
                    >
                      Öppna
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenReportDirect(project)}
                      className="p-1.5 bg-[#202020] hover:bg-[#2a2a2a] text-slate-300 rounded-lg border border-[#333] cursor-pointer shrink-0"
                      title="Rapport"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSoftDelete(project)}
                      className="p-1.5 bg-[#202020] hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg border border-[#333] cursor-pointer shrink-0"
                      title="Ta bort"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : layoutMode === 'FIELD_CLEAR' ? (
        /* =====================================================================
           LAYOUT 3: STORA FÄLTKORT (För arbete med handskar)
           ===================================================================== */
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => {
            const stats = getProjectStats(project);
            const typeInfo = PROJECT_TYPE_LABELS[project.projectType];
            const isCompleted = stats.percent === 100;

            return (
              <div
                key={project.id}
                className="bg-[#181818] border border-[#2c2c2c] rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h2
                      onClick={() => onOpenProject(project.id)}
                      className="text-lg sm:text-xl font-black text-white cursor-pointer hover:text-orange-400 transition-colors truncate"
                    >
                      {project.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-bold text-slate-300">{typeInfo.title}</span>
                      {project.propertyDesignation && (
                        <span>• {project.propertyDesignation}</span>
                      )}
                      {project.isGroupProject && (
                        <span>• Kod: {project.groupCode}</span>
                      )}
                      {project.studentName && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          <Users className="w-3 h-3 text-emerald-400" />
                          <span>Elev: {project.studentName}</span>
                          {project.schoolClass && <span className="text-slate-400">• {project.schoolClass}</span>}
                        </span>
                      )}
                      {(project.isTeacherExercise || project.exerciseCode) && (
                        <span className="inline-flex items-center gap-1 font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/30">
                          <GraduationCap className="w-3 h-3 text-orange-400" />
                          <span>Aktiv övning {project.exerciseCode ? `(${project.exerciseCode})` : ''}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xl font-black font-mono text-white block">
                      {stats.percent}%
                    </span>
                    <span className="text-xs text-slate-400">
                      {stats.completedMoments} av {stats.totalMoments} klara
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-[#111111] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isCompleted ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    className="flex-1 min-h-[48px] px-5 bg-orange-500 hover:bg-orange-400 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>{vocab.openProjectButton}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenReportDirect(project)}
                      className="min-h-[48px] px-4 bg-[#121212] hover:bg-[#222222] text-white border border-[#333333] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-orange-400" />
                      <span>Rapport</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSoftDelete(project)}
                      className="min-h-[48px] w-12 bg-[#121212] hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-[#333333] rounded-xl flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =====================================================================
           LAYOUT 1 (STANDARD): SUPER-ENKEL LISTA
           Tydlig, visuell och begriplig för alla med stora knappar och framsteg
           ===================================================================== */
        <div className="bg-[#161616] border border-[#262626] rounded-2xl divide-y divide-[#242424] overflow-hidden shadow-xl">
          {filteredProjects.map((project) => {
            const stats = getProjectStats(project);
            const typeInfo = PROJECT_TYPE_LABELS[project.projectType];
            const isCompleted = stats.percent === 100;

            return (
              <div
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="p-3.5 sm:p-5 hover:bg-[#1a1a1a] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer"
              >
                {/* Vänster: Stor visuell ikon + Namn + Framstegsrad */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border text-xl sm:text-2xl shadow-inner ${
                      isCompleted
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                        : stats.completedMoments > 0
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                        : 'bg-[#121212] border-[#2e2e2e] text-slate-400'
                    }`}
                  >
                    {isCompleted ? '🎉' : getProjectTypeEmoji(project.projectType)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white truncate">
                        {project.name}
                      </h2>
                      {isCompleted ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-black border border-emerald-400 shrink-0">
                          ✓ Helt klart!
                        </span>
                      ) : stats.completedMoments > 0 ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                          🟡 Pågår ({stats.percent}%)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#202020] text-slate-400 border border-[#333] shrink-0">
                          ⚪ Inte påbörjad
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-300">
                      <span className="font-bold text-orange-400">{typeInfo.title}</span>
                      <span>•</span>
                      <span className="text-slate-300">
                        <strong>{stats.completedMoments}</strong> av {stats.totalMoments} moment klara
                      </span>
                      {project.propertyDesignation && (
                        <>
                          <span className="hidden xs:inline">•</span>
                          <span className="text-slate-400 truncate max-w-[140px] hidden xs:inline">
                            {project.propertyDesignation}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Liten tydlig framstegsbar */}
                    <div className="w-full max-w-xs h-1.5 bg-[#101010] rounded-full overflow-hidden border border-[#242424] mt-1">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${stats.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Höger: Stora och tydliga åtgärdsknappar */}
                <div
                  className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 self-end sm:self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    className="min-h-[42px] px-4.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                  >
                    <span>Öppna</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.8]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenReportDirect(project)}
                    className="min-h-[42px] px-3 bg-[#181818] hover:bg-[#242424] text-slate-200 border border-[#2e2e2e] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Visa rapport"
                  >
                    <FileText className="w-3.5 h-3.5 text-orange-400" />
                    <span>Rapport</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSoftDelete(project)}
                    className="min-h-[42px] w-9 bg-[#181818] hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-[#2e2e2e] rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    title="Flytta till papperskorgen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
