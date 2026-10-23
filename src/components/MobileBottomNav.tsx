import React from 'react';
import { ViewState } from '../types';
import {
  FolderKanban,
  PlusCircle,
  Compass,
  Camera,
  Menu,
  ClipboardList,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onOpenMenu: () => void;
  onOpenCrossMeasure: () => void;
  onOpenPhotoArchive: () => void;
  hasActiveProject?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenMenu,
  onOpenCrossMeasure,
  onOpenPhotoArchive,
  hasActiveProject = false,
}) => {
  return (
    <nav
      aria-label="Snabbnavigering mobil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-md border-t border-[#262626] safe-area-pb"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-14 px-1">
        {/* 1. Projekt / Hem */}
        <button
          type="button"
          onClick={() => onNavigate('DASHBOARD')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
            currentView === 'DASHBOARD'
              ? 'text-orange-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderKanban className="w-5 h-5 stroke-[2]" />
          <span>Projekt</span>
        </button>

        {/* 2. Ny kontroll / Skapa */}
        <button
          type="button"
          onClick={() => onNavigate('CREATE_PROJECT')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
            currentView === 'CREATE_PROJECT'
              ? 'text-orange-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-5 h-5 stroke-[2]" />
          <span>Ny kontroll</span>
        </button>

        {/* 3. Kryssmått (Direkt fältverktyg) */}
        <button
          type="button"
          onClick={onOpenCrossMeasure}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <Compass className="w-5 h-5 stroke-[2]" />
          <span>Kryssmått</span>
        </button>

        {/* 4. Fotopärm / Galleri */}
        <button
          type="button"
          onClick={onOpenPhotoArchive}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <Camera className="w-5 h-5 stroke-[2]" />
          <span>Foton</span>
        </button>

        {/* 5. Öppna meny */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <Menu className="w-5 h-5 stroke-[2]" />
          <span>Meny</span>
        </button>
      </div>
    </nav>
  );
};
