import React, { useState } from 'react';
import { ProjectType, UserSettings } from '../types';
import { PROJECT_TYPE_LABELS } from '../data/momentsData';
import { initializeNewProject } from '../db/indexedDb';
import { HardHat, ArrowLeft, Check, AlertCircle, ShieldCheck, AlertTriangle } from 'lucide-react';

interface CreateProjectViewProps {
  onCancel: () => void;
  onProjectCreated: (newProjectId: string) => void;
  onSaveNewProject: (project: any) => Promise<void>;
  defaultType?: ProjectType;
  userSettings?: UserSettings;
}

export const CreateProjectView: React.FC<CreateProjectViewProps> = ({
  onCancel,
  onProjectCreated,
  onSaveNewProject,
  defaultType,
  userSettings,
}) => {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>(defaultType || 'HUSGRUND');
  const [propertyDesignation, setPropertyDesignation] = useState('');
  const [clientName, setClientName] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [applicableDocs, setApplicableDocs] = useState('Bygghandling M30-1-01, M-10.1-01, AMA Anläggning 20');
  const [notes, setNotes] = useState('');
  const [isGroupProject, setIsGroupProject] = useState(false);
  const [groupCode, setGroupCode] = useState(`BYGG-${Math.floor(10 + Math.random() * 90)}`);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Val om Försyn & Skadeguide
  const [preInspectionChoice, setPreInspectionChoice] = useState<'DO' | 'SKIP'>(
    userSettings?.preInspectionPreference === 'SKIP_DEFAULT' ? 'SKIP' : 'DO'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vänligen ange ett projektnamn (t.ex. Skogsgläntan LSS-boende, Villa Solhem).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const newProj = initializeNewProject(
        name.trim(),
        projectType,
        propertyDesignation.trim() || 'Ej angiven fastighet',
        clientName.trim() || 'Beställare / Byggherre',
        contractorName.trim() || 'Entreprenad AB',
        notes.trim(),
        projectNumber.trim() || `3313200-${Math.floor(1000 + Math.random() * 9000)}`,
        applicableDocs.trim() || 'Bygghandling M30, AMA Anläggning 20'
      );

      newProj.isGroupProject = isGroupProject;
      newProj.syncEnabled = syncEnabled;
      if (isGroupProject) {
        newProj.groupCode = groupCode.trim().toUpperCase();
      }

      if (preInspectionChoice === 'SKIP') {
        newProj.preInspectionExempted = true;
        newProj.preInspectionExemptReason = 'Valde att hoppa över vid projektstart (Privat/eget val)';
      } else {
        newProj.preInspectionExempted = false;
      }

      await onSaveNewProject(newProj);
      onProjectCreated(newProj.id);
    } catch (err: any) {
      setError(err?.message || 'Ett fel inträffade när projektet skulle sparas.');
      setIsSubmitting(false);
    }
  };

  const types = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[];

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="min-h-[44px] px-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-750 rounded-xl flex items-center gap-2 text-sm cursor-pointer transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Tillbaka</span>
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Skapa nytt projekt
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error notification */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-600 rounded-xl p-3.5 flex items-center gap-3 text-rose-200 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Project Type */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-3xl p-6 space-y-4 shadow-xl">
          <label className="block text-xs font-black text-orange-400 uppercase tracking-wider">
            1. Välj typ av övning (Moment laddas automatiskt) *
          </label>

          <div className="grid grid-cols-1 gap-3">
            {types.map((type) => {
              const info = PROJECT_TYPE_LABELS[type];
              const isSelected = projectType === type;
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => setProjectType(type)}
                  className={`min-h-[64px] p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all cursor-pointer touch-manipulation ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500 text-white ring-1 ring-orange-500/50'
                      : 'bg-[#141414] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl sm:text-3xl shrink-0">{info.icon}</span>
                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        {info.title}
                        <span className="text-xs bg-[#121212] text-orange-300 font-bold px-2 py-0.5 rounded-lg border border-[#333333]">
                          {info.count} moment
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {info.subtitle}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500 text-black font-black'
                        : 'border-[#383838] bg-[#121212]'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Project Metadata */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-3xl p-6 space-y-4 shadow-xl">
          <label className="block text-xs font-black text-orange-400 uppercase tracking-wider">
            2. Övningsuppgifter (Skolans referenser & ritning)
          </label>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Projektnamn *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="T.ex. Skogsgläntan LSS-boende, Villa Granen"
                className="w-full min-h-[50px] px-4 bg-slate-950 border border-slate-700/80 focus:border-sky-400 rounded-xl text-white text-base font-semibold placeholder-slate-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Fastighetsbeteckning / Adress
                </label>
                <input
                  type="text"
                  value={propertyDesignation}
                  onChange={(e) => setPropertyDesignation(e.target.value)}
                  placeholder="T.ex. Avesta Skogen 4:12"
                  className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700/80 focus:border-sky-400 rounded-xl text-white text-sm placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Projektnummer
                </label>
                <input
                  type="text"
                  value={projectNumber}
                  onChange={(e) => setProjectNumber(e.target.value)}
                  placeholder="T.ex. 3313200-5001"
                  className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700/80 focus:border-sky-400 rounded-xl text-white text-sm font-mono placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Byggherre / Beställare
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="T.ex. Gamla Byn AB"
                  className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700/80 focus:border-sky-400 rounded-xl text-white text-sm placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Totalentreprenör / Utförare
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="T.ex. Svensk Grundentreprenad AB"
                  className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700/80 focus:border-sky-400 rounded-xl text-white text-sm placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Gällande handlingar (AMA / Bygghandling)
              </label>
              <input
                type="text"
                value={applicableDocs}
                onChange={(e) => setApplicableDocs(e.target.value)}
                placeholder="Bygghandling M30-1-01, M-10.1-01, AMA Anläggning 20"
                className="w-full min-h-[48px] px-4 bg-slate-950 border border-slate-700/80 focus:border-sky-400 rounded-xl text-white text-sm placeholder-slate-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Arbetsform & Molnsynkning */}
        <div className="bg-[#12151e] border border-slate-750 rounded-2xl p-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            3. Arbetsform & Synkning (Ensam eller Grupp)
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsGroupProject(false)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                !isGroupProject
                  ? 'bg-sky-500/10 border-sky-500 text-white ring-1 ring-sky-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>👤 Individuellt arbete</span>
                {!isGroupProject && <Check className="w-4 h-4 text-sky-400 stroke-[3]" />}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Egenkontroll som du utför och signerar på egen hand.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setIsGroupProject(true)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isGroupProject
                  ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>👥 Grupparbete (Flera elever/kollegor)</span>
                {isGroupProject && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Dela och synka kontroller & fältblock automatiskt via gruppkod.
              </p>
            </button>
          </div>

          {isGroupProject && (
            <div className="p-3 bg-slate-950 border border-amber-500/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-amber-300">
                  Gruppkod för direkt delning (inga filer krävs):
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Dela koden med dina klasskamrater</span>
              </div>
              <input
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                className="w-full min-h-[42px] px-3.5 bg-slate-900 border border-slate-700 font-mono font-bold text-sm text-amber-300 rounded-lg outline-none uppercase"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-300">
              Automatisk molnsynkning aktiverad:
            </span>
            <button
              type="button"
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                syncEnabled
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  : 'bg-slate-900 text-slate-400 border-slate-750'
              }`}
            >
              {syncEnabled ? '✓ Synkning aktiv' : 'Av'}
            </button>
          </div>
        </div>

        {/* Step 4: Försyn och Skadeguide */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>4. Försyn och Skadeguide (Befintligt skick före start)</span>
            </label>
            <span className="text-[11px] text-slate-400">Valfritt för privat bruk</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300">
            Vill du genomföra eller hoppa över försyn och skadeguide för detta projekt?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Val A: Genomför försyn */}
            <button
              type="button"
              onClick={() => setPreInspectionChoice('DO')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                preInspectionChoice === 'DO'
                  ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/50'
                  : 'bg-[#141414] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <span>🛡️ Genomför försyn</span>
                </span>
                {preInspectionChoice === 'DO' && <Check className="w-4 h-4 text-orange-400 stroke-[3]" />}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-snug">
                Fotografera fasad, sockel, staket och asfalt innan maskiner och leveranser startar.
              </p>
            </button>

            {/* Val B: Hoppa över försyn */}
            <button
              type="button"
              onClick={() => setPreInspectionChoice('SKIP')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                preInspectionChoice === 'SKIP'
                  ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/50'
                  : 'bg-[#141414] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <span>🏡 Hoppa över försyn</span>
                </span>
                {preInspectionChoice === 'SKIP' && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-snug">
                Hoppa över fotoguide på fasad och grannar. Rekommenderas för eget arbete på privat tomt.
              </p>
            </button>
          </div>

          {/* Varning om konsekvenser om man hoppar över */}
          {preInspectionChoice === 'SKIP' && (
            <div className="p-4 rounded-2xl bg-[#1e1710] border-2 border-amber-500/50 space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 font-black text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Varning om konsekvenser om något händer:</span>
              </div>
              <p className="text-amber-100 leading-relaxed">
                Utan fotodokumenterad försyn innan maskiner och tunga transporter rullar in riskerar du att hållas betalnings- och skadeståndsskyldig för redan befintliga sättningssprickor i fasad, sprucken asfalt eller skadade kantstenar och häckar vid en tvist med granne eller beställare.
              </p>
              <div className="pt-1.5 border-t border-amber-800/40 text-amber-300 font-semibold flex items-center gap-1.5">
                <span>💡</span>
                <span>Du kan när som helst göra försynen senare under schaktmomentet i checklistan.</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[55px] px-6 bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 transition-all touch-manipulation"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{isSubmitting ? 'Skapar övning...' : 'Skapa övning & starta'}</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="min-h-[55px] px-6 bg-[#1a1a1a] hover:bg-[#262626] text-slate-300 font-bold text-base rounded-2xl border border-[#333333] flex items-center justify-center cursor-pointer transition-all"
          >
            Avbryt
          </button>
        </div>
      </form>
    </div>
  );
};
