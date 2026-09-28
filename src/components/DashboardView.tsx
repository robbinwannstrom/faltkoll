import React, { useState, useEffect } from 'react';
import { Project, ProjectType, UserSettings } from '../types';
import { ALL_MOMENTS, PROJECT_TYPE_LABELS } from '../data/momentsData';
import { getDeletedProjects } from '../db/indexedDb';
import {
  Plus,
  FolderOpen,
  FileText,
  Trash2,
  MapPin,
  CheckCircle2,
  Smartphone,
  Users,
  Shield,
  Clock,
  ArrowRight,
  QrCode,
} from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onCreateNew: () => void;
  onDeleteProject: (projectId: string) => void;
  onOpenReportDirect: (project: Project) => void;
  onOpenCollaboration?: () => void;
  onOpenTrashBin?: () => void;
  onOpenAccounts?: () => void;
  onOpenAPKExport?: () => void;
  onOpenQRCodeModal?: () => void;
  onOpenTutorial?: (projectId?: string) => void;
  userSettings?: UserSettings;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onOpenProject,
  onCreateNew,
  onDeleteProject,
  onOpenReportDirect,
  onOpenCollaboration,
  onOpenTrashBin,
  onOpenAccounts,
  onOpenAPKExport,
  onOpenQRCodeModal,
  onOpenTutorial,
  userSettings,
}) => {
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [hideReminder, setHideReminder] = useState<boolean>(false);

  // Check if any project has incomplete / skipped försyn
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
    const totalMoments = ALL_MOMENTS.filter((m) => m.projectType === project.projectType).length;
    const completedMoments = Object.values(project.moments).filter((m) => m.status === 'GREEN').length;
    const inProgressMoments = Object.values(project.moments).filter((m) => m.status === 'YELLOW').length;
    const percent = totalMoments > 0 ? Math.round((completedMoments / totalMoments) * 100) : 0;
    return { totalMoments, completedMoments, inProgressMoments, percent };
  };

  const handleSoftDelete = (project: Project) => {
    if (confirm(`Vill du flytta övningen "${project.name}" till papperskorgen?`)) {
      onDeleteProject(project.id);
      setToastMsg(`"${project.name}" flyttades till papperskorgen.`);
      setTimeout(() => setToastMsg(null), 4000);
      checkDeleted();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-[#1e1a12] border border-orange-500/80 rounded-2xl p-4 flex items-center justify-between text-sm text-orange-200 shadow-xl">
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-orange-400 shrink-0" />
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

      {/* Startsida Toppsektion (Minimalistisk & Gubbsäker) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-orange-400 bg-orange-950/60 px-2.5 py-0.5 rounded-full border border-orange-800/80">
            Anläggningsutbildning • Egenkontroll
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
            Mina Skolövningar ({projects.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Välj en övning nedan för att gå igenom utbildningens faser, ta fotobevis och signera.
          </p>
        </div>

        {/* Action-knappar i toppen */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Papperskorg */}
          {onOpenTrashBin && (
            <button
              type="button"
              onClick={onOpenTrashBin}
              className="min-h-[48px] px-3.5 bg-[#1e1e1e] hover:bg-[#282828] text-slate-400 hover:text-white border border-[#333333] font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-1.5 cursor-pointer transition-all"
              title="Papperskorg för borttagna övningar"
            >
              <Trash2 className="w-4 h-4" />
              {deletedCount > 0 && (
                <span className="text-[11px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 px-1.5 rounded-full">
                  {deletedCount}
                </span>
              )}
            </button>
          )}

          {/* Ny övning i stark orange kontrast */}
          <button
            type="button"
            onClick={onCreateNew}
            className="min-h-[48px] px-5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer touch-manipulation"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Ny övning</span>
          </button>
        </div>
      </div>

      {/* Påminnelseruta för Försyn (om ej genomförd, kan döljas) */}
      {!hideReminder && uninspectedProjects.length > 0 && (
        <div className="bg-[#1a1712] border-2 border-orange-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-orange-950/20 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold">
              <Shield className="w-5 h-5 text-orange-400" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                  Påminnelse: Försyn & Skadeguide
                </span>
                <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-800 px-2 py-0.2 rounded-full font-bold">
                  {uninspectedProjects.length} övning{uninspectedProjects.length > 1 ? 'ar' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Kom ihåg att dokumentera grannens fasad, sockel, staket och asfalt innan schaktning eller tunga transporter startar för att skydda dig mot skadeståndskrav.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            {onOpenTutorial && (
              <button
                type="button"
                onClick={() => onOpenTutorial(uninspectedProjects[0]?.id)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl cursor-pointer shadow-md shadow-orange-500/20 transition-all active:scale-95"
              >
                Gör försyn nu
              </button>
            )}
            <button
              type="button"
              onClick={() => setHideReminder(true)}
              className="px-3 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-slate-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              title="Dölj påminnelse för denna session"
            >
              Dölj
            </button>
          </div>
        </div>
      )}

      {/* Projektlista - Stora, rena kort utan visuellt brus */}
      {projects.length === 0 ? (
        <div className="bg-[#181818] border-2 border-dashed border-[#333333] rounded-3xl p-10 sm:p-14 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#222222] border border-[#383838] flex items-center justify-center mx-auto text-3xl">
            🏗️
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xl font-black text-white">
              Inga övningar skapade än
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Starta en ny övning för Husgrund, Plattsättning eller Enskilt Avlopp för att börja egenkontrollen under skoldagen.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onCreateNew}
              className="w-full sm:w-auto min-h-[52px] px-8 bg-orange-500 hover:bg-orange-400 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Skapa första övningen</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {projects.map((project) => {
            const stats = getProjectStats(project);
            const typeInfo = PROJECT_TYPE_LABELS[project.projectType];
            const isCompleted = stats.percent === 100;

            return (
              <div
                key={project.id}
                className="bg-[#1a1a1a] hover:bg-[#1e1e1e] border-2 border-[#282828] hover:border-orange-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 transition-all"
              >
                {/* 1. ÖVERST: Skolprojektets namn i stor fetstil & diskreta etiketter direkt undertill */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Skolprojektets namn i fetstil (t.ex. "Övning Husgrund 1") */}
                    <h2
                      onClick={() => onOpenProject(project.id)}
                      className="text-xl sm:text-2xl font-black text-white tracking-tight cursor-pointer hover:text-orange-400 transition-colors leading-tight truncate"
                    >
                      {project.name}
                    </h2>

                    {/* Små, diskreta etiketter (tags) direkt undertill */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {/* Projekttyp tag */}
                      <span className="text-xs font-bold text-slate-300 bg-[#121212] px-3 py-1 rounded-xl border border-[#333333] flex items-center gap-1.5">
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.title}</span>
                      </span>

                      {/* Status tag */}
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                            : stats.completedMoments > 0
                            ? 'bg-orange-950/80 text-orange-300 border-orange-700/80'
                            : 'bg-[#121212] text-slate-400 border-[#333333]'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Klar • Alla moment godkända</span>
                          </>
                        ) : stats.completedMoments > 0 ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                            <span>Pågår • {stats.completedMoments} av {stats.totalMoments} klara</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                            <span>Ej påbörjad • {stats.totalMoments} moment</span>
                          </>
                        )}
                      </span>

                      {/* Grupp / Klass tag */}
                      {project.isGroupProject && (
                        <span className="text-xs font-bold text-sky-300 bg-sky-950/80 px-2.5 py-1 rounded-xl border border-sky-800 flex items-center gap-1">
                          <Users className="w-3 h-3 text-sky-400" />
                          <span>{project.groupCode || 'Grupp'}</span>
                        </span>
                      )}

                      {/* Fastighet/beteckning tag */}
                      {project.propertyDesignation && (
                        <span className="text-xs text-slate-400 bg-[#121212] px-2.5 py-1 rounded-xl border border-[#2a2a2a] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{project.propertyDesignation}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Procent & framsteg */}
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white block">
                      {stats.percent}%
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {stats.completedMoments} av {stats.totalMoments} klara
                    </span>
                  </div>
                </div>

                {/* Tydlig framstegsindikator */}
                <div className="w-full h-2.5 bg-[#121212] rounded-full overflow-hidden border border-[#2c2c2c]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>

                {/* Stora, gubbsäkra knappar för kall fingrar och arbetshandskar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  {/* Primärknapp i skarpt orange */}
                  <button
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    className="flex-1 min-h-[54px] px-6 bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/15 cursor-pointer transition-all touch-manipulation"
                  >
                    <FolderOpen className="w-5 h-5 stroke-[2.5]" />
                    <span>Öppna övning & moment</span>
                    <ArrowRight className="w-4 h-4 ml-1 stroke-[3]" />
                  </button>

                  <div className="flex items-center gap-2.5">
                    {/* Skriv ut / Visa rapport */}
                    <button
                      type="button"
                      onClick={() => onOpenReportDirect(project)}
                      className="min-h-[54px] px-5 bg-[#141414] hover:bg-[#222222] text-white border-2 border-[#333333] hover:border-[#444444] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      title="Visa formell rapport"
                    >
                      <FileText className="w-4 h-4 text-orange-400" />
                      <span>Rapport</span>
                    </button>

                    {/* Ta bort till papperskorg */}
                    <button
                      type="button"
                      onClick={() => handleSoftDelete(project)}
                      className="min-h-[54px] w-14 bg-[#141414] hover:bg-rose-950 text-slate-500 hover:text-rose-400 border-2 border-[#333333] hover:border-rose-800 rounded-2xl flex items-center justify-center cursor-pointer transition-colors"
                      title="Flytta övning till papperskorgen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
