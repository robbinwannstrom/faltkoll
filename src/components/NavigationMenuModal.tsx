import React, { useState } from 'react';
import { UserSettings, Project, UserAccount, AppLayoutMode } from '../types';
import {
  getContextVocabulary,
  getContextualRoleLabel,
  resolveAppContextMode,
} from '../utils/contextLabels';
import { StorageStatusWidget } from './StorageStatusWidget';
import { useAppVersion } from '../hooks/useAppVersion';
import {
  X,
  Search,
  FolderKanban,
  PlusCircle,
  Compass,
  Camera,
  FileText,
  BookOpen,
  ShieldCheck,
  Share2,
  History,
  Trash2,
  Sliders,
  Bell,
  Users,
  Smartphone,
  Database,
  LogOut,
  ChevronRight,
  HardHat,
  Info,
  Layers,
  HelpCircle,
  List,
  Table,
  LayoutGrid,
  ListOrdered,
  Check,
  Sparkles,
} from 'lucide-react';

interface NavigationMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  onUpdateUserSettings: (newSettings: UserSettings) => void;
  onOpenSettings: () => void;
  onOpenTrashBin: () => void;
  onOpenNotices: () => void;
  onOpenAccounts: () => void;
  onOpenExerciseCreator?: () => void;
  onOpenAPKExport?: () => void;
  onOpenQRCodeModal?: () => void;
  onOpenRevisions?: () => void;
  onOpenTutorial: () => void;
  onOpenAppTutorial?: () => void;
  onOpenPhotoArchive: () => void;
  onOpenCollaboration: () => void;
  onOpenBackup: () => void;
  onOpenGdprModal?: () => void;
  onOpenCrossMeasure?: () => void;
  onOpenQuickNotes?: () => void;
  onOpenFieldHelper?: () => void;
  onOpenFieldMonitor?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToCreate?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  activeProject?: Project;
  currentUser?: UserAccount | null;
  unreadNoticesCount?: number;
}

export type MenuCategoryKey = 'CORE' | 'TOOLS' | 'LAYOUT' | 'COLLAB' | 'SYSTEM';

interface MenuItem {
  id: string;
  category: MenuCategoryKey;
  categoryLabel: string;
  title: string;
  subtitle: string;
  keywords: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  action: () => void;
  accentClass: string;
}

interface CategoryConfig {
  key: MenuCategoryKey;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: string;
  headerAccent: string;
  badgeStyle: string;
  iconBoxStyle: string;
  containerBorder: string;
}

export const NavigationMenuModal: React.FC<NavigationMenuModalProps> = ({
  isOpen,
  onClose,
  userSettings,
  onUpdateUserSettings,
  onOpenSettings,
  onOpenTrashBin,
  onOpenNotices,
  onOpenAccounts,
  onOpenExerciseCreator,
  onOpenQRCodeModal,
  onOpenRevisions,
  onOpenTutorial,
  onOpenAppTutorial,
  onOpenPhotoArchive,
  onOpenCollaboration,
  onOpenBackup,
  onOpenGdprModal,
  onOpenCrossMeasure,
  onOpenQuickNotes,
  onOpenFieldHelper,
  onOpenFieldMonitor,
  onNavigateToDashboard,
  onNavigateToCreate,
  onOpenLogin,
  onLogout,
  activeProject,
  currentUser,
  unreadNoticesCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const appVersion = useAppVersion(userSettings);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset search when opened
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const activeContextMode = resolveAppContextMode(userSettings, currentUser);
  const vocab = getContextVocabulary(activeContextMode);

  const currentLayoutId = userSettings.appLayoutMode || 'SIMPLE_LIST';

  const layoutCards: {
    id: AppLayoutMode;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'SIMPLE_LIST',
      label: 'Enkel lista',
      sublabel: 'Klassisk & snabb checklista',
      icon: <List className="w-4 h-4" />,
    },
    {
      id: 'COMPACT',
      label: 'Tabellvy',
      sublabel: 'Kompakt för snabb överblick',
      icon: <Table className="w-4 h-4" />,
    },
    {
      id: 'FIELD_CLEAR',
      label: 'Stora fältkort',
      sublabel: 'Stora tryckytor för gropen',
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      id: 'GUIDED_STEP',
      label: 'Steg-vy',
      sublabel: 'Guidad, ett moment i taget',
      icon: <ListOrdered className="w-4 h-4" />,
    },
  ];

  // Helper to trigger and close
  const trigger = (fn?: () => void) => {
    if (fn) {
      onClose();
      fn();
    }
  };

  // Build clean catalog of all menu items
  const allMenuItems: MenuItem[] = [
    // --- 1. HUVUDFUNKTIONER (Projekt & Egenkontroller) ---
    {
      id: 'projects',
      category: 'CORE',
      categoryLabel: 'Huvudfunktioner',
      title: `${vocab.projectsHeading} (Översikt)`,
      subtitle: `Se alla aktiva byggen och ${vocab.projectNounPlural.toLowerCase()}`,
      keywords: 'projekt byggen översikt start hem lista alla mina projekt',
      icon: <FolderKanban className="w-5 h-5" />,
      action: () => trigger(onNavigateToDashboard),
      accentClass: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    },
    {
      id: 'create_project',
      category: 'CORE',
      categoryLabel: 'Huvudfunktioner',
      title: vocab.createProjectButton,
      subtitle: 'Starta en ny egenkontroll (husgrund, altan, schakt, avlopp)',
      keywords: 'skapa nytt bygge egenkontroll starta lägg till husgrund altan schakt avlopp',
      icon: <PlusCircle className="w-5 h-5 stroke-[2.2]" />,
      action: () => trigger(onNavigateToCreate),
      accentClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'app_tutorial',
      category: 'CORE',
      categoryLabel: 'Huvudfunktioner',
      title: 'App-guide & Tutorial',
      subtitle: 'Kryssmått, fältblocket, lärare, molnsynk, finger-signering & alla finesser',
      keywords: 'tutorial guide hjälp introduktion genomgång bilder kryssmått pythagoras fältblock fältbok lärare skola synk samarbete signera',
      icon: <HelpCircle className="w-5 h-5 stroke-[2.2]" />,
      badge: 'Interaktiv guide',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      action: () => trigger(onOpenAppTutorial || onOpenTutorial),
      accentClass: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    },

    // --- 2. FÄLTVERKTYG (Mått, foton, AMA & problemlösning) ---
    {
      id: 'cross_measure',
      category: 'TOOLS',
      categoryLabel: 'Fältverktyg',
      title: 'Kryssmått & Pythagoras (3-4-5)',
      subtitle: 'Räkna ut 90°-vinklar och exakta diagonaler direkt på bygget',
      keywords: 'kryssmått diagonal vinkel 3-4-5 pythagoras mått räknare laser fält geometri',
      icon: <Compass className="w-5 h-5 stroke-[2.2]" />,
      badge: '3-4-5 räknare',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      action: () => trigger(onOpenCrossMeasure),
      accentClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'field_notes',
      category: 'TOOLS',
      categoryLabel: 'Fältverktyg',
      title: 'Fältblocket (Mått & Anteckningar)',
      subtitle: 'Spara måttnoteringar, laserhöjder, rörfall, leveranser och minne',
      keywords: 'fältbok fältblock anteckningar mått noteringar minne laser höjd fall leverans block',
      icon: <FileText className="w-5 h-5" />,
      badge: 'Offline-block',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      action: () => trigger(onOpenQuickNotes),
      accentClass: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    },
    {
      id: 'photos',
      category: 'TOOLS',
      categoryLabel: 'Fältverktyg',
      title: 'Fotopärm & Galleri',
      subtitle: 'Tidsstämplade kontrollfoton sorterade per moment och fas',
      keywords: 'foton fotopärm galleri bilder kamera bevis tidsstämpel kontroll dokumentation',
      icon: <Camera className="w-5 h-5" />,
      action: () => trigger(onOpenPhotoArchive),
      accentClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      id: 'field_helper',
      category: 'TOOLS',
      categoryLabel: 'Fältverktyg',
      title: 'Byggkrav & Problemlösare (AMA)',
      subtitle: 'Fackstöd om bärlager, stenmjöl, fall, sättningar, dukar och toleranser',
      keywords: 'ama byggkrav fackstöd råd toleranser lösningar mark problem hjälp regler bärlager duk',
      icon: <BookOpen className="w-5 h-5" />,
      action: () => trigger(onOpenFieldHelper),
      accentClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'pre_inspection',
      category: 'TOOLS',
      categoryLabel: 'Fältverktyg',
      title: 'Försyn & Skadeguide',
      subtitle: 'Fotoguide för fasad, sockel & staket före schakt och grävning',
      keywords: 'försyn besiktning skador fasad sprickor sockel guide förbesiktning grävning',
      icon: <ShieldCheck className="w-5 h-5" />,
      action: () => trigger(onOpenTutorial),
      accentClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },

    // --- 3. SAMARBETE & SKOLA (Arbetslag, Lärare & Elever) ---
    {
      id: 'collab',
      category: 'COLLAB',
      categoryLabel: 'Samarbete & Övningar',
      title: activeContextMode === 'WORKPLACE'
        ? 'Arbetslag & Molnsynk'
        : activeContextMode === 'APL'
        ? 'APL-delning & Molnsynk'
        : 'Grupparbete & Molnsynk',
      subtitle: 'Dela projekt med fältkod eller QR och samarbeta i realtid',
      keywords: 'dela kod grupp samarbete moln synk länk anslut team arbetslag',
      icon: <Share2 className="w-5 h-5" />,
      badge: 'Realtidssynk',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      action: () => trigger(onOpenCollaboration),
      accentClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    ...(currentUser?.role === 'TEACHER' && onOpenFieldMonitor
      ? [
          {
            id: 'field_monitor',
            category: 'COLLAB' as const,
            categoryLabel: 'Samarbete & Övningar',
            title: 'Fältöversikt & Elevinspektion',
            subtitle: 'Se elever i fält, granska kontrollfoton och ge direkt återkoppling',
            keywords: 'lärare elever inspektion fältöversikt skola klass bedömning återkoppling',
            icon: <Users className="w-5 h-5 stroke-[2.2]" />,
            badge: 'Yrkeslärare',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            action: () => trigger(onOpenFieldMonitor),
            accentClass: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
          },
        ]
      : []),
    ...(currentUser?.role !== 'STUDENT' && onOpenExerciseCreator
      ? [
          {
            id: 'exercise_creator',
            category: 'COLLAB' as const,
            categoryLabel: 'Samarbete & Övningar',
            title: vocab.creatorPanelTitle,
            subtitle: `Skapa och tilldela mallar och övningar till ${vocab.groupLabelPlural.toLowerCase()}`,
            keywords: 'mall mallbyggare övning uppgift tilldela skapa kontrollmoment skola',
            icon: <BookOpen className="w-5 h-5" />,
            action: () => trigger(onOpenExerciseCreator),
            accentClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          },
        ]
      : []),
    {
      id: 'revisions',
      category: 'COLLAB',
      categoryLabel: 'Samarbete & Övningar',
      title: 'Versionshistorik (Tidsmaskin)',
      subtitle: 'Granska tidigare sparade ändringar och återskapa vid behov',
      keywords: 'historik versioner ändringar återställ backup tidsmaskin logg sparad',
      icon: <History className="w-5 h-5" />,
      action: () => trigger(onOpenRevisions),
      accentClass: 'text-slate-300 bg-slate-800 border-slate-700',
    },
    {
      id: 'trash',
      category: 'COLLAB',
      categoryLabel: 'Samarbete & Övningar',
      title: 'Papperskorg',
      subtitle: `Återställ eller töm raderade ${vocab.projectNounPlural.toLowerCase()}`,
      keywords: 'papperskorg raderade borttagna återställ töm ta bort',
      icon: <Trash2 className="w-5 h-5" />,
      action: () => trigger(onOpenTrashBin),
      accentClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    },

    // --- 4. INSTÄLLNINGAR & SYSTEM ---
    {
      id: 'settings',
      category: 'SYSTEM',
      categoryLabel: 'Inställningar & System',
      title: 'Inställningar & Anpassning',
      subtitle: 'AMA-krav, färgteman, företagsnamn och funktioner',
      keywords: 'inställningar layout färger utseende konfiguration preferenser ama',
      icon: <Sliders className="w-5 h-5" />,
      action: () => trigger(onOpenSettings),
      accentClass: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    },
    {
      id: 'accounts',
      category: 'SYSTEM',
      categoryLabel: 'Inställningar & System',
      title: currentUser?.role === 'STUDENT' ? vocab.myAccountButton : vocab.accountsViewTitle,
      subtitle: currentUser?.role === 'STUDENT'
        ? `Se din profil, ${vocab.groupLabel.toLowerCase()} och behörighet`
        : `Hantera användare, koder och ${vocab.groupLabelPlural.toLowerCase()}`,
      keywords: 'konto profil användare elever lärare behörighet klasser roller inloggning',
      icon: <Users className="w-5 h-5" />,
      action: () => trigger(onOpenAccounts),
      accentClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      id: 'install_app',
      category: 'SYSTEM',
      categoryLabel: 'Inställningar & System',
      title: 'Installera på mobilen / QR-kod',
      subtitle: 'Öppna på mobilen eller spara som appikon på hemskärmen (PWA)',
      keywords: 'installera app qr mobil hemskärm pwa länk spara telefon',
      icon: <Smartphone className="w-5 h-5" />,
      action: () => trigger(onOpenQRCodeModal),
      accentClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'backup',
      category: 'SYSTEM',
      categoryLabel: 'Inställningar & System',
      title: 'Säkerhetskopia (Export & Import)',
      subtitle: 'Spara offline-backup som JSON eller återställ sparad data',
      keywords: 'backup säkerhetskopia export import json spara fil data återställning',
      icon: <Database className="w-5 h-5" />,
      action: () => trigger(onOpenBackup),
      accentClass: 'text-slate-300 bg-slate-800 border-slate-700',
    },
    {
      id: 'gdpr',
      category: 'SYSTEM',
      categoryLabel: 'Inställningar & System',
      title: 'GDPR & Skolsekretess',
      subtitle: 'Fotoregler, elevsekretess och lokal datalagring',
      keywords: 'gdpr integritet sekretess lagring foto skola regler pub dataskydd',
      icon: <ShieldCheck className="w-5 h-5" />,
      action: () => trigger(onOpenGdprModal),
      accentClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'notices',
      category: 'SYSTEM',
      categoryLabel: 'Inställningar & System',
      title: vocab.noticesTitle,
      subtitle: 'Systemmeddelanden och aviseringar från administratör',
      keywords: 'notiser meddelanden aviseringar larm info uppdatering',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNoticesCount > 0 ? `${unreadNoticesCount} nya` : undefined,
      badgeColor: 'bg-rose-500 text-white border-transparent',
      action: () => trigger(onOpenNotices),
      accentClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
  ];

  // Search filter
  const q = searchQuery.toLowerCase().trim();
  const filteredItems = !q
    ? allMenuItems
    : allMenuItems.filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q)
        );
      });

  // Stora, tydliga kategoridefinitioner som är omöjliga att missa
  const categoryConfigs: CategoryConfig[] = [
    {
      key: 'CORE',
      label: 'Huvudfunktioner',
      subtitle: 'Projekt, byggen & egenkontroll',
      icon: <FolderKanban className="w-5 h-5 text-orange-400" />,
      badge: '3 funktioner',
      headerAccent: 'text-orange-400',
      badgeStyle: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      iconBoxStyle: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
      containerBorder: 'border-orange-500/30 bg-[#161616]',
    },
    {
      key: 'TOOLS',
      label: 'Fältverktyg',
      subtitle: 'Kryssmått, fältblocket, foton & AMA',
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      badge: '5 verktyg',
      headerAccent: 'text-amber-400',
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      iconBoxStyle: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
      containerBorder: 'border-amber-500/30 bg-[#161616]',
    },
    {
      key: 'LAYOUT',
      label: 'Vy och Layout',
      subtitle: 'Välj skärmvisning för gropen eller kontoret',
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      badge: `Aktiv: ${layoutCards.find((l) => l.id === currentLayoutId)?.label || 'Lista'}`,
      headerAccent: 'text-indigo-400',
      badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      iconBoxStyle: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400',
      containerBorder: 'border-indigo-500/30 bg-[#161616]',
    },
    {
      key: 'COLLAB',
      label: 'Samarbete & Övningar',
      subtitle: 'Arbetslag, yrkeslärare, elever & molnsynk',
      icon: <Users className="w-5 h-5 text-sky-400" />,
      badge: 'Realtidssynk',
      headerAccent: 'text-sky-400',
      badgeStyle: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      iconBoxStyle: 'bg-sky-500/20 border-sky-500/40 text-sky-400',
      containerBorder: 'border-sky-500/30 bg-[#161616]',
    },
    {
      key: 'SYSTEM',
      label: 'Inställningar & System',
      subtitle: 'Konto, säkerhetskopia & GDPR',
      icon: <Sliders className="w-5 h-5 text-emerald-400" />,
      badge: `v${appVersion.effectiveVersion}`,
      headerAccent: 'text-emerald-400',
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      iconBoxStyle: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      containerBorder: 'border-emerald-500/30 bg-[#161616]',
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/85 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-[#121212] border-r-2 border-[#2b2b2b] w-full max-w-sm sm:max-w-md h-full flex flex-col shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 py-3.5 border-b border-[#242424] flex items-center justify-between bg-[#171717] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
              <HardHat className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-black text-white text-sm sm:text-base tracking-tight leading-tight flex items-center gap-2">
                <span>{appVersion.effectiveAppName}</span>
                <span className="font-mono text-[10px] text-orange-400 font-bold bg-[#222] px-1.5 py-0.2 rounded border border-[#333]">
                  {appVersion.effectiveVersion}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {vocab.modeTitle} • Huvudmeny (☰)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#222] hover:bg-[#2c2c2c] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Stäng meny"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Direkt sökfält i menyn */}
        <div className="p-3 bg-[#151515] border-b border-[#222] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök funktion (kryssmått, fältblock, foto, lärare, vy)..."
              className="w-full min-h-[40px] pl-9 pr-8 bg-[#1e1e1e] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
              autoFocus={false}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 rounded-full hover:bg-[#2a2a2a] text-slate-400 hover:text-white flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                title="Rensa sökning"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Snabbval i toppen (De 4 vanligaste funktionerna direkt klickbara) */}
        {!searchQuery && (
          <div className="p-3 bg-[#131313] border-b border-[#202020] shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 px-0.5">
              Snabbval
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => trigger(onNavigateToDashboard)}
                className="p-2 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-colors group"
                title="Gå till mina projekt"
              >
                <FolderKanban className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-200 group-hover:text-white truncate w-full">
                  Projekt
                </span>
              </button>

              <button
                type="button"
                onClick={() => trigger(onNavigateToCreate)}
                className="p-2 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-colors group"
                title="Starta ny egenkontroll"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-200 group-hover:text-white truncate w-full">
                  Nytt bygge
                </span>
              </button>

              <button
                type="button"
                onClick={() => trigger(onOpenCrossMeasure)}
                className="p-2 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-colors group"
                title="Öppna kryssmått & Pythagoras"
              >
                <Compass className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-200 group-hover:text-white truncate w-full">
                  Kryssmått
                </span>
              </button>

              <button
                type="button"
                onClick={() => trigger(onOpenPhotoArchive)}
                className="p-2 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-colors group"
                title="Öppna fotopärmen"
              >
                <Camera className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-200 group-hover:text-white truncate w-full">
                  Fotopärm
                </span>
              </button>
            </div>

            {/* Snabbknapp till App Tutorial */}
            <button
              type="button"
              onClick={() => trigger(onOpenAppTutorial || onOpenTutorial)}
              className="mt-2 w-full p-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-orange-300 font-bold">
                <HelpCircle className="w-4 h-4 text-orange-400 shrink-0" />
                <span>App-guide & Tutorial (Alla finurliga verktyg)</span>
              </div>
              <span className="text-[10px] text-orange-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold shrink-0">
                Starta guide ➜
              </span>
            </button>
          </div>
        )}

        {/* Scrollable Body med stora tydliga kategorier */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Ingen funktion matchade &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-orange-400 font-bold underline cursor-pointer"
              >
                Visa alla kategorier
              </button>
            </div>
          ) : searchQuery ? (
            /* Sökresultat vy */
            <div className="space-y-2">
              <div className="px-1 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Sökresultat ({filteredItems.length} träffar)
              </div>
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="w-full p-3 rounded-xl bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] hover:border-orange-500/50 text-left flex items-center gap-3 transition-colors cursor-pointer group shadow-sm"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.accentClass}`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white group-hover:text-orange-300">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            item.badgeColor || 'bg-[#222] text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            /* STORA, TYDLIGA KATEGORIER SOM ÄR OMÖJLIGA ATT MISSA */
            categoryConfigs.map((cat) => {
              if (cat.key === 'LAYOUT') {
                /* Specialrender för "Vy och Layout" med interaktiva kort */
                return (
                  <section
                    key={cat.key}
                    aria-label={cat.label}
                    className={`rounded-2xl border-2 ${cat.containerBorder} overflow-hidden shadow-lg space-y-0`}
                  >
                    {/* Stor omisskännlig kategori-header */}
                    <div className="px-3.5 py-3 bg-[#1d1d1d] border-b border-[#282828] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center border font-black ${cat.iconBoxStyle}`}
                        >
                          {cat.icon}
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                            {cat.label}
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            {cat.subtitle}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeStyle}`}
                      >
                        {cat.badge}
                      </span>
                    </div>

                    {/* Innehåll för Vy & Layout: 4 interaktiva visningskort */}
                    <div className="p-3 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        {layoutCards.map((opt) => {
                          const isActive = currentLayoutId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                onUpdateUserSettings({
                                  ...userSettings,
                                  appLayoutMode: opt.id,
                                });
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] relative ${
                                isActive
                                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                                  : 'bg-[#1a1a1a] hover:bg-[#222] border-[#2c2c2c] text-slate-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    isActive
                                      ? 'bg-indigo-500 text-black font-black'
                                      : 'bg-[#252525] text-slate-300'
                                  }`}
                                >
                                  {opt.icon}
                                </div>
                                {isActive && (
                                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-indigo-500 text-black px-1.5 py-0.2 rounded font-mono">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    Aktiv
                                  </span>
                                )}
                              </div>

                              <div className="pt-1">
                                <div className="font-bold text-xs">
                                  {opt.label}
                                </div>
                                <div className="text-[10px] text-slate-400 leading-tight">
                                  {opt.sublabel}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Länk till fullständiga utseendeinställningar */}
                      <button
                        type="button"
                        onClick={() => trigger(onOpenSettings)}
                        className="w-full py-2 px-3 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#2e2e2e] text-left flex items-center justify-between text-xs text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer group"
                      >
                        <span className="font-bold">
                          Fler tema- & layoutinställningar
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </section>
                );
              }

              // Övriga kategorier (Huvudfunktioner, Fältverktyg, Samarbete & Övningar, System)
              const items = allMenuItems.filter((i) => i.category === cat.key);
              if (items.length === 0) return null;

              return (
                <section
                  key={cat.key}
                  aria-label={cat.label}
                  className={`rounded-2xl border-2 ${cat.containerBorder} overflow-hidden shadow-lg space-y-0`}
                >
                  {/* Stor omisskännlig kategori-header */}
                  <div className="px-3.5 py-3 bg-[#1d1d1d] border-b border-[#282828] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border font-black ${cat.iconBoxStyle}`}
                      >
                        {cat.icon}
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                          {cat.label}
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {cat.subtitle}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeStyle}`}
                    >
                      {cat.badge}
                    </span>
                  </div>

                  {/* Kategori-innehåll / Lista med funktioner */}
                  <div className="p-2 sm:p-2.5 space-y-1.5">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        className="w-full p-2.5 sm:p-3 rounded-xl bg-[#191919] hover:bg-[#222] border border-[#272727] hover:border-orange-500/40 text-left flex items-center gap-3 transition-colors cursor-pointer group shadow-xs"
                      >
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.accentClass}`}
                        >
                          {item.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-white group-hover:text-orange-300">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  item.badgeColor || 'bg-[#222] text-slate-300'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>

        {/* Cloud Status Footer */}
        <div className="px-3.5 py-2.5 bg-[#141414] border-t border-[#222] shrink-0">
          <StorageStatusWidget compact />
        </div>

        {/* Utloggning */}
        {currentUser && onLogout && (
          <div className="p-3 border-t border-[#242424] bg-[#111] shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => onLogout(), 10);
              }}
              className="w-full min-h-[40px] px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Logga ut ({currentUser.displayName || currentUser.email})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
