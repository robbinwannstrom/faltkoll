import React, { useState, useEffect } from 'react';
import { Project, ViewState, UserSettings, ProjectType, MomentPhoto, UserAccount } from './types';
import {
  getAllProjects,
  saveProject,
  softDeleteProject,
  deleteProject,
  seedInitialDemoProjectsIfEmpty,
  getUserSettings,
  saveUserSettings,
} from './db/indexedDb';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CreateProjectView } from './components/CreateProjectView';
import { ChecklistView } from './components/ChecklistView';
import { ReportModal } from './components/ReportModal';
import { BackupModal } from './components/BackupModal';
import { SetupWizardModal } from './components/SetupWizardModal';
import { NavigationMenuModal } from './components/NavigationMenuModal';
import { PreInspectionTutorialModal } from './components/PreInspectionTutorialModal';
import { CollaborationModal } from './components/CollaborationModal';
import { PhotoArchiveModal } from './components/PhotoArchiveModal';
import { CrossMeasureCalculatorModal } from './components/CrossMeasureCalculatorModal';
import { QuickNotesModal } from './components/QuickNotesModal';
import { FieldHelperModal } from './components/FieldHelperModal';
import { TrashBinModal } from './components/TrashBinModal';
import { TeacherNoticesModal } from './components/TeacherNoticesModal';
import { AccountsView } from './components/AccountsView';
import { APKExportView } from './components/APKExportView';
import { ProjectRevisionsModal } from './components/ProjectRevisionsModal';
import { MobileInstallModal } from './components/MobileInstallModal';
import { LoginView } from './components/LoginView';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeReportProject, setActiveReportProject] = useState<Project | null>(null);

  // Modals state
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isCrossMeasureOpen, setIsCrossMeasureOpen] = useState(false);
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);
  const [isFieldHelperOpen, setIsFieldHelperOpen] = useState(false);
  const [isTrashBinOpen, setIsTrashBinOpen] = useState(false);
  const [isNoticesOpen, setIsNoticesOpen] = useState(false);
  const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);
  const [isMobileInstallOpen, setIsMobileInstallOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  const [userSettings, setUserSettings] = useState<UserSettings>(getUserSettings());
  const [isLoading, setIsLoading] = useState(true);

  // User Accounts & Authentication State (Persists across sessions via localStorage)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const raw = localStorage.getItem('falthjalp_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [unreadNoticesCount, setUnreadNoticesCount] = useState<number>(1);

  // Check unread notices from server
  const checkNotices = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        if (currentUser) {
          const unread = list.filter(
            (n: any) => !n.readBy || !n.readBy.includes(currentUser.id)
          ).length;
          setUnreadNoticesCount(unread);
        }
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    checkNotices();
    // Battery-saving interval: check only every 60s when active, or on focus
    const interval = setInterval(() => {
      if (!document.hidden) {
        checkNotices();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Smart battery-efficient sync: sync on app resume / tab focus without draining battery outdoors
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkNotices();
        if (activeProjectId) {
          const p = projects.find((x) => x.id === activeProjectId);
          if (p?.isGroupProject && p.groupCode) {
            fetch(`/api/sync/pull?code=${encodeURIComponent(p.groupCode)}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => {
                if (data?.project) {
                  saveProject(data.project);
                  setProjects((prev) =>
                    prev.map((x) => (x.id === data.project.id ? data.project : x))
                  );
                }
              })
              .catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeProjectId, projects]);

  // Load projects from IndexedDB on startup
  const loadProjectsFromDB = async () => {
    try {
      setIsLoading(true);
      await seedInitialDemoProjectsIfEmpty();
      const loaded = await getAllProjects();
      setProjects(loaded);

      // Check if user has completed wizard before
      const settings = getUserSettings();
      setUserSettings(settings);
      if (!settings.hasSeenWizard) {
        setIsWizardOpen(true);
      }
    } catch (err) {
      console.error('Kunde inte läsa projekt från IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjectsFromDB();
  }, []);

  // Sync color palette class to document root
  useEffect(() => {
    const palette = userSettings.colorPalette || 'ORANGE_WORK';
    const root = document.documentElement;
    root.classList.remove('palette-yellow', 'palette-daylight', 'palette-blue');
    if (palette === 'SAFETY_YELLOW') {
      root.classList.add('palette-yellow');
    } else if (palette === 'DAYLIGHT_HIGH_CONTRAST') {
      root.classList.add('palette-daylight');
    } else if (palette === 'NORDIC_BLUE') {
      root.classList.add('palette-blue');
    }
  }, [userSettings.colorPalette]);

  // Ensure scroll is always at top when navigating between views or projects
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [view, activeProjectId]);

  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setView('CHECKLIST');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Helper to open project-specific tools even if on Dashboard
  const handleOpenToolWithProject = (tool: 'PHOTO' | 'NOTES' | 'TUTORIAL' | 'REVISIONS') => {
    let targetId = activeProjectId;
    if (!targetId && projects.length > 0) {
      targetId = projects[0].id;
      setActiveProjectId(projects[0].id);
    }

    if (!targetId && projects.length === 0) {
      setView('CREATE_PROJECT');
      return;
    }

    if (tool === 'PHOTO') setIsArchiveOpen(true);
    if (tool === 'NOTES') setIsQuickNotesOpen(true);
    if (tool === 'TUTORIAL') setIsTutorialOpen(true);
    if (tool === 'REVISIONS') setIsRevisionsOpen(true);
  };

  const handleSaveNewProject = async (newProj: Project) => {
    await saveProject(newProj);
    const updated = await getAllProjects();
    setProjects(updated);
  };

  const handleUpdateProject = async (updatedProj: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
    await saveProject(updatedProj);
  };

  // Move to Papperskorg (Soft delete)
  const handleDeleteProject = async (id: string) => {
    await softDeleteProject(id);
    const updated = await getAllProjects();
    setProjects(updated);
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setView('DASHBOARD');
    }
  };

  const handleCreateFromWizard = (_type?: ProjectType) => {
    setView('DASHBOARD');
  };

  const handleCompleteTutorial = async (photos: MomentPhoto[]) => {
    if (!activeProjectId) return;
    const p = projects.find((x) => x.id === activeProjectId);
    if (!p) return;

    // Merge photos so we never lose existing ones
    const prevPhotos = p.preInspectionPhotos || [];
    const merged = [...prevPhotos];
    photos.forEach((ph) => {
      const idx = merged.findIndex((m) => m.caption === ph.caption || m.id === ph.id);
      if (idx !== -1) {
        merged[idx] = ph;
      } else {
        merged.push(ph);
      }
    });

    const updatedProj: Project = {
      ...p,
      preInspectionCompleted: merged.length > 0,
      preInspectionPhotos: merged,
    };

    await handleUpdateProject(updatedProj);
  };

  const handleProjectImported = async (imported: Project) => {
    await loadProjectsFromDB();
    setActiveProjectId(imported.id);
    setView('CHECKLIST');
    setIsCollabOpen(false);
  };

  const handleUserLogin = (user: UserAccount, rememberMe: boolean = true) => {
    setCurrentUser(user);
    if (rememberMe) {
      try {
        localStorage.setItem('falthjalp_current_user', JSON.stringify(user));
      } catch {}
    }
    // Also update userSettings userName if empty
    if (!userSettings.userName) {
      const updated = { ...userSettings, userName: user.displayName };
      setUserSettings(updated);
      saveUserSettings(updated);
    }
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    setActiveProjectId(null);
    setIsNavMenuOpen(false);
    setIsSettingsOpen(false);
    setIsCollabOpen(false);
    setIsBackupOpen(false);
    setIsNoticesOpen(false);
    setIsMobileInstallOpen(false);
    setIsTrashBinOpen(false);
    setIsFieldHelperOpen(false);
    setIsQuickNotesOpen(false);
    setIsRevisionsOpen(false);
    try {
      localStorage.removeItem('falthjalp_current_user');
      const raw = localStorage.getItem('falthjalp_license');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.requireLoginOnStartup = true;
      localStorage.setItem('falthjalp_license', JSON.stringify(parsed));
    } catch {}
    setView('DASHBOARD');
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // If user is not logged in, strictly gate with LoginView so no projects or data are ever visible
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleUserLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-black">
      {/* Top Header Navigation with ☰ Hamburger Menu */}
      <Header
        currentView={view}
        onNavigate={(newView) => {
          setView(newView);
          if (newView === 'DASHBOARD') {
            setActiveProjectId(null);
          }
        }}
        projectName={activeProject?.name}
        onOpenMenu={() => setIsNavMenuOpen(true)}
        onOpenCollaboration={() => setIsCollabOpen(true)}
        onOpenReport={() => activeProject && setActiveReportProject(activeProject)}
        onOpenNotices={() => setIsNoticesOpen(true)}
        onLogout={handleUserLogout}
        currentUser={currentUser}
        unreadNoticesCount={unreadNoticesCount}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300 font-semibold text-base">Laddar lokal databas från enheten...</p>
          </div>
        ) : (
          <>
            {view === 'DASHBOARD' && (
              <DashboardView
                projects={projects}
                onOpenProject={handleOpenProject}
                onCreateNew={() => setView('CREATE_PROJECT')}
                onDeleteProject={handleDeleteProject}
                onOpenReportDirect={(proj) => setActiveReportProject(proj)}
                onOpenCollaboration={() => setIsCollabOpen(true)}
                onOpenTrashBin={() => setIsTrashBinOpen(true)}
                onOpenTutorial={(projId) => {
                  if (projId) setActiveProjectId(projId);
                  handleOpenToolWithProject('TUTORIAL');
                }}
                userSettings={userSettings}
              />
            )}

            {view === 'CREATE_PROJECT' && (
              <CreateProjectView
                onCancel={() => setView('DASHBOARD')}
                userSettings={userSettings}
                onProjectCreated={(newId) => {
                  setActiveProjectId(newId);
                  setView('CHECKLIST');
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
                onSaveNewProject={handleSaveNewProject}
              />
            )}

            {view === 'CHECKLIST' && activeProject && (
              <ChecklistView
                project={activeProject}
                userSettings={userSettings}
                onUpdateUserSettings={(newSettings) => {
                  setUserSettings(newSettings);
                  saveUserSettings(newSettings);
                }}
                onUpdateProject={handleUpdateProject}
                onOpenReport={() => setActiveReportProject(activeProject)}
                onBackToDashboard={() => setView('DASHBOARD')}
                onOpenRevisions={() => setIsRevisionsOpen(true)}
                onOpenTutorial={() => setIsTutorialOpen(true)}
              />
            )}

            {view === 'ACCOUNTS' && (
              <AccountsView
                currentUser={currentUser}
                onUserLoggedIn={handleUserLogin}
                onUserLoggedOut={handleUserLogout}
                onBack={() => setView('DASHBOARD')}
              />
            )}

            {view === 'APK_EXPORT' && (
              <APKExportView onBack={() => setView('DASHBOARD')} />
            )}
          </>
        )}
      </main>

      {/* Hamburgermeny Modal (☰) */}
      <NavigationMenuModal
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        userSettings={userSettings}
        onUpdateUserSettings={(newSettings) => {
          setUserSettings(newSettings);
          saveUserSettings(newSettings);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTrashBin={() => setIsTrashBinOpen(true)}
        onOpenNotices={() => setIsNoticesOpen(true)}
        onOpenAccounts={() => {
          setIsNavMenuOpen(false);
          setView('ACCOUNTS');
        }}
        onOpenAPKExport={() => {
          setIsNavMenuOpen(false);
          setView('APK_EXPORT');
        }}
        onOpenQRCodeModal={() => {
          setIsNavMenuOpen(false);
          setIsMobileInstallOpen(true);
        }}
        onOpenRevisions={() => handleOpenToolWithProject('REVISIONS')}
        onOpenTutorial={() => handleOpenToolWithProject('TUTORIAL')}
        onOpenPhotoArchive={() => handleOpenToolWithProject('PHOTO')}
        onOpenCollaboration={() => setIsCollabOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenCrossMeasure={() => setIsCrossMeasureOpen(true)}
        onOpenQuickNotes={() => handleOpenToolWithProject('NOTES')}
        onOpenFieldHelper={() => setIsFieldHelperOpen(true)}
        onNavigateToDashboard={() => {
          setActiveProjectId(null);
          setView('DASHBOARD');
        }}
        onNavigateToCreate={() => setView('CREATE_PROJECT')}
        onLogout={handleUserLogout}
        activeProject={activeProject}
        currentUser={currentUser}
        unreadNoticesCount={unreadNoticesCount}
      />

      {/* Inställningar Modal (Layout & Färgpalett) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userSettings={userSettings}
        onUpdateUserSettings={(newSettings) => {
          setUserSettings(newSettings);
          saveUserSettings(newSettings);
        }}
        onRerunWizard={() => {
          setIsSettingsOpen(false);
          setIsWizardOpen(true);
        }}
      />

      {/* Versionshistorik & Revisionshantering Modal (Tidsmaskin) */}
      {isRevisionsOpen && activeProject && (
        <ProjectRevisionsModal
          project={activeProject}
          onClose={() => setIsRevisionsOpen(false)}
          onUpdateProject={handleUpdateProject}
          currentUserRole={currentUser?.role}
          currentUserName={currentUser?.displayName}
        />
      )}

      {/* Papperskorg Modal (Borttagna projekt) */}
      <TrashBinModal
        isOpen={isTrashBinOpen}
        onClose={() => setIsTrashBinOpen(false)}
        onProjectsChanged={loadProjectsFromDB}
      />

      {/* Lärarnotiser Modal */}
      <TeacherNoticesModal
        isOpen={isNoticesOpen}
        onClose={() => {
          setIsNoticesOpen(false);
          checkNotices();
        }}
        currentUser={currentUser}
        onUnreadCountChanged={(count) => setUnreadNoticesCount(count)}
      />

      {/* Pre-Inspection Tutorial Modal */}
      {isTutorialOpen && activeProject && (
        <PreInspectionTutorialModal
          project={activeProject}
          onClose={() => setIsTutorialOpen(false)}
          onCompleteTutorial={handleCompleteTutorial}
        />
      )}

      {/* Kryssmåttsberäknare Modal */}
      {isCrossMeasureOpen && (
        <CrossMeasureCalculatorModal
          onClose={() => setIsCrossMeasureOpen(false)}
          onInsertToNotes={(text) => {
            if (activeProject) {
              const cur = activeProject.notes || '';
              handleUpdateProject({
                ...activeProject,
                notes: cur ? cur + '\n' + text : text,
              });
            }
          }}
        />
      )}

      {/* Snabbanteckningar / Fältblock Modal */}
      {isQuickNotesOpen && activeProject && (
        <QuickNotesModal
          project={activeProject}
          onUpdateProject={handleUpdateProject}
          onClose={() => setIsQuickNotesOpen(false)}
        />
      )}

      {/* FältKoll & Byggexpert Modal */}
      {isFieldHelperOpen && (
        <FieldHelperModal
          onClose={() => setIsFieldHelperOpen(false)}
        />
      )}

      {/* Collaboration Modal (Sharing between students / field workers) */}
      {isCollabOpen && (
        <CollaborationModal
          project={activeProject}
          onClose={() => setIsCollabOpen(false)}
          onProjectImported={handleProjectImported}
        />
      )}

      {/* Photo Archive / Folders Modal */}
      {isArchiveOpen && activeProject && (
        <PhotoArchiveModal
          project={activeProject}
          userSettings={userSettings}
          onUpdateUserSettings={(newSettings) => {
            setUserSettings(newSettings);
            saveUserSettings(newSettings);
          }}
          onClose={() => setIsArchiveOpen(false)}
          onOpenLightbox={(url, title) => setLightboxPhoto({ url, title })}
        />
      )}

      {/* Setup Wizard & Settings Modal */}
      {isWizardOpen && (
        <SetupWizardModal
          onClose={() => setIsWizardOpen(false)}
          onOpenDemoProject={() => {
            setIsWizardOpen(false);
            setView('CREATE_PROJECT');
          }}
          onCreateNewProject={handleCreateFromWizard}
          initialSettings={userSettings}
          onSettingsSaved={(newSettings) => {
            setUserSettings(newSettings);
            saveUserSettings(newSettings);
          }}
        />
      )}

      {/* Fullscreen Report Modal */}
      {activeReportProject && (
        <ReportModal
          project={activeReportProject}
          onClose={() => setActiveReportProject(null)}
        />
      )}

      {/* Backup and Cloud Export / Import Modal */}
      {isBackupOpen && (
        <BackupModal
          onClose={() => setIsBackupOpen(false)}
          onDataChanged={loadProjectsFromDB}
        />
      )}

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 p-4 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-white">
            <h4 className="font-semibold text-base truncate">{lightboxPhoto.title}</h4>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="p-2 bg-slate-800 rounded-xl text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
          <img
            src={lightboxPhoto.url}
            alt="Förstorad bild"
            className="max-h-[85vh] max-w-full object-contain rounded-xl border border-slate-700 shadow-2xl"
          />
        </div>
      )}
      {/* Mobilinstallation / QR-kod Modal */}
      <MobileInstallModal
        isOpen={isMobileInstallOpen}
        onClose={() => setIsMobileInstallOpen(false)}
      />
    </div>
  );
}
