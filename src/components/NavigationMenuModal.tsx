import React from 'react';
import { UserSettings, Project, UserAccount } from '../types';
import { StorageStatusWidget } from './StorageStatusWidget';
import {
  X,
  Compass,
  FileText,
  Bot,
  FolderOpen,
  ShieldCheck,
  Share2,
  History,
  Trash2,
  Sliders,
  Bell,
  HardHat,
  Smartphone,
  Database,
  LogOut,
  Plus,
  Home,
  Check,
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
  onOpenAPKExport?: () => void;
  onOpenQRCodeModal?: () => void;
  onOpenRevisions?: () => void;
  onOpenTutorial: () => void;
  onOpenPhotoArchive: () => void;
  onOpenCollaboration: () => void;
  onOpenBackup: () => void;
  onOpenCrossMeasure?: () => void;
  onOpenQuickNotes?: () => void;
  onOpenFieldHelper?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToCreate?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  activeProject?: Project;
  currentUser?: UserAccount | null;
  unreadNoticesCount?: number;
}

export const NavigationMenuModal: React.FC<NavigationMenuModalProps> = ({
  isOpen,
  onClose,
  userSettings,
  onOpenSettings,
  onOpenTrashBin,
  onOpenNotices,
  onOpenAccounts,
  onOpenQRCodeModal,
  onOpenRevisions,
  onOpenTutorial,
  onOpenPhotoArchive,
  onOpenCollaboration,
  onOpenBackup,
  onOpenCrossMeasure,
  onOpenQuickNotes,
  onOpenFieldHelper,
  onNavigateToDashboard,
  onNavigateToCreate,
  onOpenLogin,
  onLogout,
  activeProject,
  currentUser,
  unreadNoticesCount = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/85 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="bg-[#121212] border-r-2 border-[#262626] w-full max-w-sm sm:max-w-md h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
              <HardHat className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-white text-base tracking-tight leading-tight">
                FältKoll Meny
              </h3>
              <p className="text-[11px] text-slate-400">
                Verktyg, inställningar & övningar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3 mx-3 my-2.5 rounded-2xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                currentUser?.role === 'TEACHER'
                  ? 'bg-amber-500 text-black'
                  : currentUser?.role === 'ADMIN'
                  ? 'bg-purple-600 text-white'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
              }`}
            >
              {currentUser?.displayName ? currentUser.displayName.charAt(0) : 'U'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-white truncate leading-tight">
                {currentUser?.displayName || userSettings.userName || 'Gästanvändare (Demo)'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentUser?.schoolOrCompany || userSettings.companyName || 'Direktstart utan inloggning'}
              </div>
            </div>
          </div>

          {currentUser ? (
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                currentUser.role === 'ADMIN'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : currentUser.role === 'TEACHER'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-orange-950 text-orange-300 border border-orange-800'
              }`}
            >
              {currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'TEACHER' ? 'Lärare' : 'Elev'}
            </span>
          ) : (
            onOpenLogin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="text-xs font-black bg-orange-500 hover:bg-orange-400 active:scale-95 text-black px-3 py-1.5 rounded-xl cursor-pointer shadow-sm transition-all shrink-0"
              >
                Logga in
              </button>
            )
          )}
        </div>

        {/* Scrollable Menu Items */}
        <div className="p-3 space-y-5 flex-1 overflow-y-auto">
          {/* SECTION 1: TYDLIGA FÄLTVERKTYG I TOPPEN */}
          <div className="space-y-2">
            <div className="px-1 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <span>🛠️</span>
                <span>Snabba Fältverktyg & Bygghjälp</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Klicka för att öppna</span>
            </div>

            {/* 1. Kryssmått */}
            {onOpenCrossMeasure && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCrossMeasure();
                }}
                className="w-full p-3 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] hover:border-amber-500/50 text-left flex items-start gap-3 transition-all cursor-pointer group shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Compass className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm text-white group-hover:text-amber-300 flex items-center gap-2">
                    <span>Kryssmått & 3-4-5 Vinkelräknare</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Räkna ut räta vinklar och diagonaler i fält snabbt och enkelt.
                  </p>
                </div>
              </button>
            )}

            {/* 2. Fältboken */}
            {onOpenQuickNotes && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQuickNotes();
                }}
                className="w-full p-3 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] hover:border-sky-500/50 text-left flex items-start gap-3 transition-all cursor-pointer group shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm text-white group-hover:text-sky-300 flex items-center gap-2">
                    <span>Fältboken (Mått & Anteckningar)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Spara måttnoteringar, fall, leveransdata och snabba minnesanteckningar.
                  </p>
                </div>
              </button>
            )}

            {/* 3. Bygghjälp & Problemlösare */}
            {onOpenFieldHelper && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFieldHelper();
                }}
                className="w-full p-3 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] hover:border-emerald-500/50 text-left flex items-start gap-3 transition-all cursor-pointer group shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm text-white group-hover:text-emerald-300 flex items-center gap-2">
                    <span>Bygghjälp & Problemlösare (AMA)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Få råd om stenmjöl, felaktigt fall, sättningar och vanliga markproblem.
                  </p>
                </div>
              </button>
            )}

            {/* 4. Fotopärm & Bilder */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPhotoArchive();
              }}
              className="w-full p-3 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] hover:border-orange-500/50 text-left flex items-start gap-3 transition-all cursor-pointer group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-sm text-white group-hover:text-orange-300 flex items-center gap-2">
                  <span>Fotopärm & Galleri</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Alla tidsstämplade kontrollfoton sorterade efter fas och moment.
                </p>
              </div>
            </button>

            {/* 5. Försyn & Skadeguide */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTutorial();
              }}
              className="w-full p-3 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] hover:border-sky-500/50 text-left flex items-start gap-3 transition-all cursor-pointer group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-sm text-white group-hover:text-sky-300 flex items-center gap-2">
                  <span>Försyn & Skadeguide</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Steg-för-steg fotoguide för fasad, sockel, staket och asfalt före schakt.
                </p>
              </div>
            </button>
          </div>

          {/* SECTION 2: PROJEKT & SAMARBETE */}
          <div className="space-y-1.5 pt-3 border-t border-[#262626]">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 block">
              📁 Mina Övningar & Hantering
            </span>

            {/* Till Översikten (Dashboard) */}
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDashboard();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-[#1f1f1f] text-left flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
              >
                <Home className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-sm">Alla Skolövningar (Översikt)</span>
              </button>
            )}

            {/* Skapa Ny Övning */}
            {onNavigateToCreate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToCreate();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-[#1f1f1f] text-left flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
              >
                <Plus className="w-4 h-4 text-orange-400 stroke-[3]" />
                <span className="font-bold text-sm">Starta Ny Övning</span>
              </button>
            )}

            {/* Grupparbete & Molnsynk */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCollaboration();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-[#1f1f1f] text-left flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm">Grupparbete & Molnsynk</span>
            </button>

            {/* Versionshistorik (Tidsmaskin) */}
            {onOpenRevisions && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRevisions();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-[#1f1f1f] text-left flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">Versionshistorik (Tidsmaskin)</span>
              </button>
            )}

            {/* Papperskorg */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTrashBin();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-[#1f1f1f] text-left flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-sm">Papperskorg (Borttagna övningar)</span>
            </button>
          </div>

          {/* SECTION 3: INSTÄLLNINGAR & SYSTEM */}
          <div className="space-y-1.5 pt-3 border-t border-[#262626]">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 block">
              ⚙️ Inställningar & System
            </span>

            {/* Inställningar (Layout & Färgpalett) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full p-3 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/40 text-left flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-black flex items-center justify-center shrink-0 font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-sm text-white group-hover:text-orange-300">
                  Inställningar (Layout & Färg)
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Byt färgpalett, fältläge & försyn-regler
                </div>
              </div>
            </button>

            {/* Lärarnotiser */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNotices();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-[#1f1f1f] text-left flex items-center justify-between transition-colors cursor-pointer text-slate-200 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm">Lärarnotiser & Utskick</span>
              </div>
              {unreadNoticesCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                  {unreadNoticesCount} nya
                </span>
              )}
            </button>

            {/* Adminpanel & Kontohantering (Demoläge-knapp, behörigheter & elever) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAccounts();
              }}
              className="w-full p-2.5 rounded-xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-800/40 text-left flex items-center justify-between transition-colors cursor-pointer text-purple-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  A
                </div>
                <div>
                  <span className="font-bold text-sm block group-hover:text-purple-100">
                    Adminpanel & Konton
                  </span>
                  <span className="text-[10px] text-purple-300/70 block">
                    {currentUser?.role === 'ADMIN'
                      ? `Inloggad som Admin (${currentUser?.displayName || 'Admin'})`
                      : 'Demoläge, behörigheter & inloggningskontroll'}
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-purple-900 text-purple-200 border border-purple-600'
                    : 'bg-[#252525] text-slate-300 border border-[#3a3a3a]'
                }`}
              >
                {currentUser?.role === 'ADMIN' ? 'Admin' : 'Öppna'}
              </span>
            </button>

            {/* Installera på mobilen */}
            {onOpenQRCodeModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQRCodeModal();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-[#1f1f1f] text-left flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
              >
                <Smartphone className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-sm">Installera som app / QR-kod</span>
              </button>
            )}

            {/* Säkerhetskopia */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBackup();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-[#1f1f1f] text-left flex items-center gap-3 transition-colors cursor-pointer text-slate-400 hover:text-white"
            >
              <Database className="w-4 h-4" />
              <span className="font-bold text-sm">Säkerhetskopia (Export & Import)</span>
            </button>
          </div>

          {/* Molnlagringsstatus & Varning */}
          <div className="pt-2 px-1">
            <StorageStatusWidget compact />
          </div>
        </div>

        {/* Logout button in footer */}
        {currentUser && onLogout && (
          <div className="p-3 border-t border-[#262626] bg-[#161616]">
            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => onLogout(), 10);
              }}
              className="w-full min-h-[46px] px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Logga ut ({currentUser.displayName || currentUser.email})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
