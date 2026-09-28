import React from 'react';
import { Menu, ArrowLeft, Share2, FileText, HardHat, Bell, Smartphone, Users, QrCode, LogOut } from 'lucide-react';
import { ViewState, UserAccount } from '../types';

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  projectName?: string;
  onOpenMenu: () => void;
  onOpenCollaboration?: () => void;
  onOpenReport?: () => void;
  onOpenNotices?: () => void;
  onOpenAccounts?: () => void;
  onOpenAPKExport?: () => void;
  onOpenQRCodeModal?: () => void;
  onLogout?: () => void;
  unreadNoticesCount?: number;
  currentUser?: UserAccount | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  projectName,
  onOpenMenu,
  onOpenCollaboration,
  onOpenReport,
  onOpenNotices,
  onOpenAccounts,
  onOpenAPKExport,
  onOpenQRCodeModal,
  onLogout,
  unreadNoticesCount = 0,
  currentUser,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#121212] border-b-2 border-[#242424] shadow-md font-sans">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Hamburger Menu & Back Button */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMenu}
            className="w-11 h-11 rounded-2xl bg-[#1c1c1c] hover:bg-[#262626] text-white border border-[#333333] flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
            title="Öppna meny och inställningar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {currentView !== 'DASHBOARD' ? (
            <button
              onClick={() => onNavigate('DASHBOARD')}
              className="min-h-[44px] px-4 bg-[#1c1c1c] hover:bg-[#262626] text-white font-bold border border-[#333333] rounded-2xl flex items-center gap-2 text-xs sm:text-sm cursor-pointer transition-colors"
              title="Tillbaka till övningarna"
            >
              <ArrowLeft className="w-4 h-4 text-orange-400 stroke-[2.5]" />
              <span>Översikt</span>
            </button>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/40 text-orange-400 flex items-center justify-center font-bold text-base shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate leading-tight">
              {projectName ? projectName : 'FältKoll'}
            </h1>
            <span className="text-[11px] text-slate-400 block truncate">
              {projectName ? 'Aktiv övning' : 'Anläggning & Egenkontroll'}
            </span>
          </div>
        </div>

        {/* Right Action buttons - Stilren och minimalistisk */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Rapport-knapp endast när en övning granskas i checklistan */}
          {currentView === 'CHECKLIST' && onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="min-h-[42px] px-3.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
              title="Öppna kontrollrapport"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Rapport</span>
            </button>
          )}

          {/* Lärarnotiser (endast för behöriga roller eller olästa notiser) */}
          {onOpenNotices && (currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN' || unreadNoticesCount > 0) && (
            <button
              type="button"
              onClick={onOpenNotices}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1c1c1c] hover:bg-[#262626] text-slate-300 hover:text-white border border-[#333333] flex items-center justify-center cursor-pointer transition-all active:scale-95 relative"
              title="Lärarnotiser & utskick"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              {unreadNoticesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                  {unreadNoticesCount}
                </span>
              )}
            </button>
          )}

          {/* Inloggad profil & Tydlig utloggningsknapp */}
          {currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#181818] border border-[#2c2c2c] pl-2 sm:pl-3 pr-1 py-1 rounded-2xl">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-slate-200 max-w-[80px] sm:max-w-[120px] truncate hidden xs:inline">
                  {currentUser.displayName}
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-lg ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : currentUser.role === 'TEACHER'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-orange-950 text-orange-300 border border-orange-800'
                  }`}
                >
                  {currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'TEACHER' ? 'Lärare' : 'Elev'}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="min-h-[34px] px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  title="Logga ut från appen"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Logga ut</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
