import React from 'react';
import {
  Menu,
  ArrowLeft,
  FileText,
  HardHat,
  Bell,
  LogOut,
  Download,
  Users,
  FolderKanban,
  PlusCircle,
  Compass,
  Camera,
  Sliders,
} from 'lucide-react';
import { ViewState, UserAccount, UserSettings } from '../types';
import {
  getContextVocabulary,
  resolveAppContextMode,
} from '../utils/contextLabels';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAppVersion } from '../hooks/useAppVersion';

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  projectName?: string;
  onOpenMenu: () => void;
  onOpenSettings?: () => void;
  onOpenCollaboration?: () => void;
  onOpenReport?: () => void;
  onOpenNotices?: () => void;
  onOpenAccounts?: () => void;
  onOpenAPKExport?: () => void;
  onOpenQRCodeModal?: () => void;
  onOpenCrossMeasure?: () => void;
  onOpenPhotoArchive?: () => void;
  onLogout?: () => void;
  unreadNoticesCount?: number;
  activeFieldCount?: number;
  currentUser?: UserAccount | null;
  userSettings?: UserSettings;
  onUpdateUserSettings?: (newSettings: UserSettings) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  projectName,
  onOpenMenu,
  onOpenSettings,
  onOpenReport,
  onOpenNotices,
  onOpenQRCodeModal,
  onOpenCrossMeasure,
  onOpenPhotoArchive,
  onLogout,
  unreadNoticesCount = 0,
  activeFieldCount,
  currentUser,
  userSettings,
}) => {
  const contextMode = resolveAppContextMode(userSettings, currentUser);
  const vocab = getContextVocabulary(contextMode);
  const { isInstallable, install } = usePWAInstall();
  const appVersion = useAppVersion(userSettings);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted && onOpenQRCodeModal) {
        onOpenQRCodeModal();
      }
    } else if (onOpenQRCodeModal) {
      onOpenQRCodeModal();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#121212] border-b border-[#242424] font-sans w-full max-w-full overflow-x-clip">
      {/* Top Header Row */}
      <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
        {/* Left: Menu trigger & App/Project Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenMenu}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] text-white border border-[#2e2e2e] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title="Öppna huvudmeny (☰) – se App-guiden/tutorialen och alla verktyg här"
            aria-label="Öppna huvudmeny"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {currentView !== 'DASHBOARD' ? (
            <button
              onClick={() => onNavigate('DASHBOARD')}
              className="min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 bg-[#1a1a1a] hover:bg-[#252525] text-white font-bold border border-[#2e2e2e] rounded-xl flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer transition-colors shrink-0"
              title="Tillbaka till översikten"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 stroke-[2.5]" />
              <span>Hem</span>
            </button>
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <HardHat className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xs sm:text-base font-black text-white tracking-tight truncate leading-tight">
                {projectName ? projectName : appVersion.effectiveAppName}
              </h1>
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center text-[10px] sm:text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#1e1e1e] hover:bg-[#282828] text-orange-400 hover:text-orange-300 border border-[#2e2e2e] hover:border-orange-500/50 shrink-0 transition-colors cursor-pointer"
                title={`Version: ${appVersion.effectiveVersion} - Klicka för information`}
              >
                {appVersion.effectiveVersion}
              </button>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate leading-none mt-0.5">
              {projectName ? vocab.activeProjectSubtitle : vocab.modeSubtitle}
            </span>
          </div>
        </div>

        {/* Center: Desktop Direct Navigation Shortcuts (Enkelt & direkt - inga menyer behövs) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#181818] border border-[#262626] p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('DASHBOARD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'DASHBOARD'
                ? 'bg-orange-500 text-black font-black'
                : 'text-slate-300 hover:text-white hover:bg-[#222]'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Projekt</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('CREATE_PROJECT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'CREATE_PROJECT'
                ? 'bg-orange-500 text-black font-black'
                : 'text-slate-300 hover:text-white hover:bg-[#222]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ny kontroll</span>
          </button>

          {onOpenCrossMeasure && (
            <button
              type="button"
              onClick={onOpenCrossMeasure}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-[#222] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Öppna Kryssmått & Vinkelräknare"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Kryssmått</span>
            </button>
          )}

          {onOpenPhotoArchive && (
            <button
              type="button"
              onClick={onOpenPhotoArchive}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-[#222] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Öppna Fotopärm & Kontrollbilder"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>Fotopärm</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-[#222] flex items-center gap-1 transition-colors cursor-pointer"
              title="Inställningar"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </nav>

        {/* Right: Actions + User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {currentUser?.role === 'TEACHER' && (
            <button
              type="button"
              onClick={() => onNavigate(currentView === 'FIELD_MONITOR' ? 'DASHBOARD' : 'FIELD_MONITOR')}
              className={`min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border ${
                currentView === 'FIELD_MONITOR'
                  ? 'bg-orange-500 text-black border-orange-400 font-black'
                  : 'bg-[#1a1a1a] hover:bg-[#252525] text-orange-400 hover:text-orange-300 border-orange-500/40'
              }`}
              title="Fältöversikt & Elever"
            >
              <Users className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="hidden sm:inline">Elever</span>
              {typeof activeFieldCount === 'number' && activeFieldCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black font-black text-[10px]">
                  {activeFieldCount}
                </span>
              )}
            </button>
          )}

          {currentView === 'CHECKLIST' && onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              title="Öppna kontrollrapport"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>Rapport</span>
            </button>
          )}

          {onOpenNotices && unreadNoticesCount > 0 && (
            <button
              type="button"
              onClick={onOpenNotices}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] text-slate-300 hover:text-white border border-[#2e2e2e] flex items-center justify-center cursor-pointer transition-colors relative"
              title={vocab.noticesTitle}
            >
              <Bell className="w-3.5 h-3.5 text-orange-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {unreadNoticesCount}
              </span>
            </button>
          )}

          {currentUser && (
            <div className="flex items-center gap-1.5 bg-[#181818] border border-[#2a2a2a] pl-2 pr-1 py-1 rounded-xl">
              <span className="font-bold text-xs text-white max-w-[90px] sm:max-w-[120px] truncate hidden sm:inline">
                {currentUser.displayName}
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="min-h-[28px] sm:min-h-[32px] px-2 rounded-lg bg-[#242424] hover:bg-rose-600 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Logga ut"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden xl:inline">Ut</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
