import React, { useRef, useState, useEffect } from 'react';
import { Project, UserAccount } from '../types';
import { getAllProjects, saveProject } from '../db/indexedDb';
import { StorageStatusWidget } from './StorageStatusWidget';
import { safeFetchJson } from '../services/apiHelper';
import {
  saveProjectToCloud,
  saveProjectToFirestore,
  findProjectByCodeInFirestore,
} from '../services/studentWorkService';
import { fetchExerciseByCode, convertExerciseToProject } from '../services/exerciseService';
import {
  Share2,
  Users,
  CheckCircle2,
  X,
  Copy,
  Check,
  Cloud,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Layers,
  FolderOpen,
} from 'lucide-react';

interface CollaborationModalProps {
  project?: Project;
  projects?: Project[];
  onClose: () => void;
  onProjectImported?: (importedProject: Project) => void;
  onUpdateProject?: (updatedProject: Project) => void;
  currentUser?: UserAccount | null;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  project,
  projects = [],
  onClose,
  onProjectImported,
  onUpdateProject,
  currentUser,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    project?.id || (projects.length > 0 ? projects[0].id : '')
  );

  const activeProj =
    (projects.length > 0 ? projects.find((p) => p.id === selectedProjectId) : null) ||
    project ||
    (projects.length > 0 ? projects[0] : null);

  const [joinCode, setJoinCode] = useState(() => {
    try {
      return localStorage.getItem('falthjalp_saved_group_code') || '';
    } catch {
      return '';
    }
  });

  const getInitialCodeForProject = (proj: Project | null) => {
    if (proj?.groupCode && proj.groupCode.trim()) {
      return proj.groupCode.trim().toUpperCase();
    }
    const saved = localStorage.getItem('falthjalp_saved_group_code') || '';
    if (saved && saved.trim()) {
      return saved.trim().toUpperCase();
    }
    if (proj?.id) {
      return `KLASS-${proj.id.slice(-4).toUpperCase()}`;
    }
    return `BYGG-${Math.floor(10 + Math.random() * 90)}`;
  };

  const [customCode, setCustomCode] = useState<string>(() =>
    getInitialCodeForProject(activeProj)
  );
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync internal state when active project changes
  useEffect(() => {
    if (activeProj?.groupCode && activeProj.groupCode.trim()) {
      setCustomCode(activeProj.groupCode.trim().toUpperCase());
    } else if (activeProj) {
      setCustomCode(getInitialCodeForProject(activeProj));
    }
  }, [activeProj?.id, activeProj?.groupCode]);

  const currentCode = (customCode || '').trim().toUpperCase();

  const handleCopyCode = () => {
    if (!currentCode) return;
    navigator.clipboard?.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Spara egen gruppkod
  const handleSaveCustomGroupCode = async (overrideCode?: string) => {
    const raw = overrideCode !== undefined ? overrideCode : customCode;
    const clean = raw.trim().toUpperCase();
    if (!clean) {
      setMessage({
        text: 'Vänligen ange en gruppkod (t.ex. BYGG-4A eller MINKOD).',
        isError: true,
      });
      return;
    }

    setIsEditingCode(false);

    try {
      localStorage.setItem('falthjalp_saved_group_code', clean);
    } catch {}

    setCustomCode(clean);
    setJoinCode(clean);

    if (activeProj) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const updatedProj: Project = {
        ...activeProj,
        groupCode: clean,
        isGroupProject: true,
        syncEnabled: true,
        updatedAt: now,
        lastSyncedAt: now,
      };

      // 1. Spara lokalt i IndexedDB
      await saveProject(updatedProj);

      // 2. Uppdatera React state i App
      if (onUpdateProject) {
        onUpdateProject(updatedProj);
      }

      // 3. Registrera direkt i Google Cloud Firestore och på servern
      try {
        await Promise.allSettled([
          saveProjectToFirestore(updatedProj),
          saveProjectToCloud(updatedProj),
        ]);
      } catch {}

      setMessage({
        text: `✓ Egen gruppkod "${clean}" har sparats och aktiverats i molnet för "${activeProj.name}"! Alla som anger denna kod ansluter direkt.`,
        isError: false,
      });
    } else {
      // Om inga projekt finns än, spara i LocalStorage för framtida projekt
      setMessage({
        text: `✓ Egen gruppkod "${clean}" har sparats som standardkod för dina projekt!`,
        isError: false,
      });
    }
  };

  // Anslut till projekt med kod
  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToUse = joinCode.trim().toUpperCase();
    if (!codeToUse) return;

    try {
      setIsJoining(true);
      setMessage(null);

      // Spara koden i localStorage så man slipper skriva om den
      try {
        localStorage.setItem('falthjalp_saved_group_code', codeToUse);
      } catch {}

      let foundProject: Project | null = null;

      // 1. Sök direkt i Google Cloud Firestore först (offlinesäkert, fungerar även på Netlify/GitHub Pages!)
      try {
        foundProject = await findProjectByCodeInFirestore(codeToUse);
      } catch (cloudErr) {
        console.debug('Firestore lookup notice:', cloudErr);
      }

      // 2. Om ej hittat i Firestore, fråga Express REST API:et (om backend är igång)
      if (!foundProject) {
        try {
          const res = await safeFetchJson<{ project: Project }>('/api/sync/join-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: codeToUse }),
          });

          if (res.ok && res.data?.project) {
            foundProject = res.data.project;
          }
        } catch {}
      }

      // 3. Kontrollera om koden matchar en lärarövning (t.ex. GRUND-1, PLATTA-2, AVLOPP-1)
      if (!foundProject) {
        try {
          const ex = await fetchExerciseByCode(codeToUse);
          if (ex) {
            foundProject = convertExerciseToProject(
              ex,
              currentUser?.displayName || 'Elev / Grupp',
              codeToUse
            );
            foundProject.groupCode = codeToUse;
            foundProject.isGroupProject = true;
            foundProject.syncEnabled = true;
            await saveProjectToCloud(foundProject);
          }
        } catch {}
      }

      // 4. Kontrollera lokala projekt i IndexedDB
      if (!foundProject) {
        try {
          const allLocal = await getAllProjects(false);
          const stripped = codeToUse.replace(/[\s-_]/g, '');
          foundProject =
            allLocal.find((p) => {
              const g = String(p.groupCode || '').trim().toUpperCase();
              const ex = String(p.exerciseCode || '').trim().toUpperCase();
              const nr = String(p.projectNumber || '').trim().toUpperCase();
              return (
                g === codeToUse ||
                ex === codeToUse ||
                nr === codeToUse ||
                (stripped.length >= 3 && g.replace(/[\s-_]/g, '') === stripped) ||
                (stripped.length >= 3 && ex.replace(/[\s-_]/g, '') === stripped)
              );
            }) || null;
        } catch {}
      }

      if (foundProject) {
        // Se till att koden är satt på projektet
        foundProject.groupCode = codeToUse;
        foundProject.isGroupProject = true;
        foundProject.syncEnabled = true;

        await saveProject(foundProject);
        if (onUpdateProject) {
          onUpdateProject(foundProject);
        }

        setMessage({
          text: `✓ Projekt "${foundProject.name}" har anslutits framgångsrikt med kod "${codeToUse}"!`,
          isError: false,
        });

        if (onProjectImported) {
          setTimeout(() => {
            onProjectImported(foundProject!);
          }, 600);
        }
      } else {
        setMessage({
          text: `Hittade inget aktivt projekt eller övning med koden "${codeToUse}". Kontrollera att din lärare eller kamrat har sparat koden och klickat på "Synka".`,
          isError: true,
        });
      }
    } catch {
      setMessage({
        text: `Kunde inte ansluta med koden "${codeToUse}". Kontrollera anslutningen eller koden.`,
        isError: true,
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Synka projektet direkt med molnet
  const handleSyncCurrentProject = async () => {
    if (!activeProj) return;
    try {
      setIsSyncing(true);
      setMessage(null);

      const codeToSync = currentCode || getInitialCodeForProject(activeProj);
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const updatedProj: Project = {
        ...activeProj,
        groupCode: codeToSync,
        isGroupProject: true,
        syncEnabled: true,
        updatedAt: now,
        lastSyncedAt: now,
      };

      await saveProject(updatedProj);
      if (onUpdateProject) {
        onUpdateProject(updatedProj);
      }

      // Spara till både Firestore och server
      await Promise.allSettled([
        saveProjectToFirestore(updatedProj),
        saveProjectToCloud(updatedProj),
      ]);

      setMessage({
        text: `✓ "${updatedProj.name}" är synkat till molnet! Kod: "${codeToSync}". Kollegor och elever kan ansluta direkt.`,
        isError: false,
      });
    } catch (err: any) {
      setMessage({
        text: 'Sparat lokalt på enheten: ' + (err?.message || 'Offline'),
        isError: false,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportProjectFile = () => {
    if (!activeProj) return;
    const json = JSON.stringify(activeProj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProj.name.replace(/\s+/g, '_')}_Delning.faltkoll`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as Project;
      if (!imported.id || !imported.moments) {
        throw new Error('Ogiltigt projektformat. Filen saknar moment eller projekt-ID.');
      }
      await saveProject(imported);
      setMessage({ text: `Projekt "${imported.name}" har importerats från fil!` });
      if (onProjectImported) {
        onProjectImported(imported);
      }
    } catch (err: any) {
      setMessage({ text: 'Kunde inte importera projekt: ' + (err?.message || 'Fel i filen'), isError: true });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto text-slate-100"
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,.faltkoll"
        onChange={handleImportFile}
        className="hidden"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12151e] border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Grupparbete & Molnsynk
              </h3>
              <p className="text-xs text-slate-400">
                Synka kontroller, fältblock och foton direkt med egen kod
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meddelande banner */}
        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
              message.isError
                ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
            }`}
          >
            {message.isError ? (
              <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-snug">{message.text}</span>
          </div>
        )}

        {/* Sektion 1: Anslut till projekt med gruppkod */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-4 h-4" />
              1. Anslut till ett projekt med kod
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Har du fått en kod av din lärare eller arbetskamrat? Skriv in den här för att hämta projektet direkt till din telefon:
          </p>

          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="T.ex. BYGG-4A eller MINKOD"
              className="flex-1 min-h-[44px] px-3.5 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl text-white font-mono font-bold text-sm outline-none uppercase placeholder-slate-600"
            />
            <button
              type="submit"
              disabled={isJoining}
              className="min-h-[44px] px-4 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
            >
              {isJoining ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>{isJoining ? 'Hämtar...' : 'Anslut nu'}</span>
            </button>
          </form>
        </div>

        {/* Sektion 2: Aktivt projekt & Ange egen kod */}
        <div className="bg-[#151926] border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              2. Välj egen kod & dela projekt
            </span>
          </div>

          {/* Projektväljare om det finns flera projekt */}
          {projects.length > 1 && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 block">
                Välj projekt att hantera:
              </label>
              <select
                value={activeProj?.id || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full min-h-[38px] px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.groupCode ? `(Kod: ${p.groupCode})` : '(Ingen kod än)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeProj ? (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">
                  Projekt: <strong className="text-white">{activeProj.name}</strong>
                </span>
              </div>

              {/* Kod-visning och redigering */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-300 block">
                  Gruppkod för detta projekt (ange valfri egen kod):
                </label>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveCustomGroupCode();
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      placeholder="T.ex. BYGG-4A eller MINKOD"
                      className="w-full min-h-[42px] px-3.5 bg-slate-900 border border-amber-500/60 focus:border-amber-400 rounded-xl text-white font-mono text-base font-bold uppercase outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="min-h-[42px] px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all shrink-0"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Spara egen kod</span>
                  </button>
                </form>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      disabled={!currentCode}
                      className="min-h-[34px] px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode ? 'Kopierad!' : 'Kopiera kod'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncCurrentProject}
                      disabled={isSyncing}
                      className="min-h-[34px] px-3 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Synkar...' : 'Synka till molnet'}</span>
                    </button>
                  </div>

                  {activeProj.lastSyncedAt && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Senast synkad: {activeProj.lastSyncedAt}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                💡 <strong>Hur det fungerar:</strong> När du sparar din egen kod registreras den i molnet. Dina klasskamrater eller kollegor anger koden 1 gång under <em>"1. Anslut till ett projekt med kod"</em> ovan för att hämta projektet.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
              Skapa eller öppna ett projekt för att dela det med en egen gruppkod.
            </div>
          )}

          {/* Molnutrymmes-mätare och fyllnadsgrad */}
          <StorageStatusWidget />
        </div>

        {/* Sektion 3: Reserv Fil-export & Import */}
        <div className="pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Offline-filhantering (reserv):</span>
            <div className="flex items-center gap-2">
              {activeProj && (
                <button
                  type="button"
                  onClick={handleExportProjectFile}
                  className="text-sky-400 hover:underline cursor-pointer"
                >
                  Exportera .faltkoll
                </button>
              )}
              <span>•</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sky-400 hover:underline cursor-pointer"
              >
                Öppna fil
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-xs transition-colors"
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
};
