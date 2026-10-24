import React, { useState } from 'react';
import { Project, MomentPhoto } from '../types';
import { ALL_MOMENTS } from '../data/momentsData';
import { normalizePhotoUrl, createPhotoPlaceholderSvg } from '../utils/photoUtils';
import { ArrowRightLeft, Check, Search, X, Folder, AlertCircle } from 'lucide-react';

interface MovePhotoModalProps {
  photo: MomentPhoto;
  sourceMomentId: string;
  sourceMomentTitle?: string;
  project: Project;
  onClose: () => void;
  onConfirmMove: (photoId: string, fromMomentId: string, toMomentId: string) => Promise<boolean> | boolean;
}

export const MovePhotoModal: React.FC<MovePhotoModalProps> = ({
  photo,
  sourceMomentId,
  sourceMomentTitle,
  project,
  onClose,
  onConfirmMove,
}) => {
  const [selectedTargetMomentId, setSelectedTargetMomentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available moments for this project type (default to HUSGRUND if unspecified)
  const projectType = project.projectType || 'HUSGRUND';
  const availableMoments = ALL_MOMENTS.filter(
    (m) => m.projectType === projectType
  );

  // Group moments by Phase
  const phasesMap = new Map<string, typeof availableMoments>();
  availableMoments.forEach((m) => {
    const phaseKey = m.phaseName || `Fas ${m.phaseNumber}`;
    const list = phasesMap.get(phaseKey) || [];
    list.push(m);
    phasesMap.set(phaseKey, list);
  });

  const handleExecuteMove = async () => {
    if (!selectedTargetMomentId) {
      setErrorMessage('Välj ett moment eller en fas som mål för bilden.');
      return;
    }
    if (selectedTargetMomentId === sourceMomentId) {
      setErrorMessage('Bilden ligger redan i detta moment. Välj ett annat moment.');
      return;
    }

    // Verify target exists
    const isValidTarget =
      selectedTargetMomentId === 'Försyn' ||
      availableMoments.some((m) => m.id === selectedTargetMomentId);

    if (!isValidTarget) {
      setErrorMessage('Det valda målmomentet är ogiltigt eller existerar inte. Bilden lämnas kvar på sin plats.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const success = await onConfirmMove(photo.id, sourceMomentId, selectedTargetMomentId);
      if (success) {
        onClose();
      } else {
        setErrorMessage('Kunde inte genomföra flytten. Bilden förblir på sin ursprungliga plats.');
      }
    } catch (err: any) {
      console.error('Fel vid flytt av foto:', err);
      setErrorMessage(`Ett fel uppstod vid flytten: ${err?.message || 'Okänt fel'}. Bilden ändrades inte.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter moments if search query is provided
  const query = searchQuery.trim().toLowerCase();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121520] border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-100"
      >
        {/* Header */}
        <div className="bg-[#161a28] border-b border-slate-800 p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Flytta bild mellan moment
              </h3>
              <p className="text-xs text-slate-400">
                Behåller bildfil, ID och metadata – ändrar endast placering
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-all shrink-0 border border-slate-700"
            title="Avbryt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Photo Info Card */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-xl bg-black overflow-hidden border border-slate-800 shrink-0 relative">
            <img
              src={normalizePhotoUrl(photo.dataUrl, sourceMomentTitle || 'Foto', photo.id)}
              alt="Foto som flyttas"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = createPhotoPlaceholderSvg(
                  sourceMomentTitle || 'Foto',
                  'Förhandsvisning'
                );
              }}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <span>Från:</span>
              <span className="bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate">
                {sourceMomentId === 'Försyn' ? 'Försyn & Förbesiktning' : `Moment ${sourceMomentId}`}
              </span>
            </div>
            <div className="text-xs font-semibold text-white truncate" title={sourceMomentTitle}>
              {sourceMomentTitle || `Moment ${sourceMomentId}`}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Tid: {photo.capturedAt || 'Registrerat'} • {photo.category || 'Kontroll'}
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Search Input */}
        <div className="p-3 sm:px-4 bg-slate-950/40 border-b border-slate-850">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök mål (t.ex. 1.2, schakt, duk, rör)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Moment Destination List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-4 max-h-[46vh]">
          {/* Target: Försyn */}
          {(!query || 'försyn'.includes(query) || 'besiktning'.includes(query)) && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Förbesiktning & Arbetsplats
              </div>
              <button
                type="button"
                disabled={sourceMomentId === 'Försyn'}
                onClick={() => {
                  setSelectedTargetMomentId('Försyn');
                  setErrorMessage(null);
                }}
                className={`w-full p-3 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center justify-between border transition-all cursor-pointer ${
                  sourceMomentId === 'Försyn'
                    ? 'bg-slate-900/40 border-slate-850 text-slate-500 opacity-60 cursor-not-allowed'
                    : selectedTargetMomentId === 'Försyn'
                    ? 'bg-amber-500/15 border-amber-400 text-white font-bold shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      selectedTargetMomentId === 'Försyn'
                        ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                        : 'border-slate-750 bg-slate-850'
                    }`}
                  >
                    {selectedTargetMomentId === 'Försyn' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-white">Försyn & Skadedokumentation</span>
                    <span className="block text-[11px] text-slate-400">
                      Befintliga markskador, brunnar, fasader och ledningar
                    </span>
                  </div>
                </div>
                {sourceMomentId === 'Försyn' && (
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    Nuvarande plats
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Target Phases and Moments */}
          {Array.from(phasesMap.entries()).map(([phaseTitle, momentsInPhase]) => {
            const filteredInPhase = momentsInPhase.filter((m) => {
              if (!query) return true;
              return (
                m.id.toLowerCase().includes(query) ||
                m.title.toLowerCase().includes(query) ||
                m.amaCode.toLowerCase().includes(query) ||
                m.phaseName.toLowerCase().includes(query)
              );
            });

            if (filteredInPhase.length === 0) return null;

            return (
              <div key={phaseTitle} className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 px-1 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>{phaseTitle}</span>
                </div>

                <div className="space-y-1.5">
                  {filteredInPhase.map((m) => {
                    const isCurrent = m.id === sourceMomentId;
                    const isSelected = m.id === selectedTargetMomentId;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          setSelectedTargetMomentId(m.id);
                          setErrorMessage(null);
                        }}
                        className={`w-full p-2.5 sm:p-3 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center justify-between border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-900/40 border-slate-850 text-slate-500 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white font-bold shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                                : 'border-slate-750 bg-slate-850'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-amber-400 bg-black/40 px-1.5 py-0.2 rounded border border-slate-800">
                                {m.id}
                              </span>
                              <span className="text-white font-semibold truncate">{m.title}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              AMA: {m.amaCode}
                            </span>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded shrink-0">
                            Nuvarande
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#141824] border-t border-slate-800 p-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleExecuteMove}
            disabled={!selectedTargetMomentId || selectedTargetMomentId === sourceMomentId || isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRightLeft className="w-4 h-4 stroke-[2.2]" />
            <span>{isSubmitting ? 'Flyttar bild...' : 'Flytta bild hit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
