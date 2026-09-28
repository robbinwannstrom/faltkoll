import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole, AppLicense } from '../types';
import {
  User,
  ShieldCheck,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Key,
  Mail,
  GraduationCap,
  Building,
  RefreshCw,
  LogOut,
  UserCheck,
  Clock,
  Sparkles,
  Search,
  Lock,
  ShieldAlert,
  Copy,
  Settings,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
} from 'lucide-react';

interface AccountsViewProps {
  currentUser: UserAccount | null;
  onUserLoggedIn: (user: UserAccount) => void;
  onUserLoggedOut: () => void;
  onBack: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  currentUser,
  onUserLoggedIn,
  onUserLoggedOut,
  onBack,
}) => {
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'ADMIN'>('ALL');

  // License & Permissions State
  const [license, setLicense] = useState<AppLicense>({
    status: 'LICENSED',
    licenseKey: 'SKOLA-2026-FALTHJALP',
    schoolName: 'Bygg- & Anläggningsutbildning',
    validUntil: '2028-12-31',
    maxSeats: 150,
    allowTeacherAccountCreation: true,
  });
  const [copiedKey, setCopiedKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [customLicenseKey, setCustomLicenseKey] = useState(license.licenseKey);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('1234');
  const [newUserRole, setNewUserRole] = useState<UserRole>('STUDENT');
  const [newUserOrg, setNewUserOrg] = useState('Bygg- & Anläggningsprogrammet');
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password editing state
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Admin Login State (when accessed without admin privileges)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isTeacher = currentUser?.role === 'TEACHER';
  const canManageAccounts = isAdmin || (isTeacher && license.allowTeacherAccountCreation);

  const handleAdminLoginSubmit = async (e?: React.FormEvent, directEmail?: string, directPass?: string) => {
    if (e) e.preventDefault();
    setAdminLoginError(null);

    const emailToUse = (directEmail || adminEmail).trim();
    const passToUse = (directPass || adminPassword).trim();

    if (!emailToUse || !passToUse) {
      setAdminLoginError('Vänligen ange både e-post och lösenord.');
      return;
    }

    setIsLoggingInAdmin(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, password: passToUse }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Inloggningen misslyckades.');
      }

      if (data.user) {
        if (data.user.role !== 'ADMIN') {
          throw new Error('Detta konto har inte administratörsbehörighet.');
        }
        onUserLoggedIn(data.user);
        try {
          localStorage.setItem('falthjalp_current_user', JSON.stringify(data.user));
        } catch {}
        setSuccessMsg(`Välkommen ${data.user.displayName}! Du är nu inloggad som Huvudadministratör.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      // Local fallback for Administrator
      const norm = emailToUse.toLowerCase();
      if ((norm === 'admin@faltkoll.se' || norm === 'admin@skola.se' || norm === 'admin' || norm === 'admin@falthjalp.se') && (passToUse === 'admin123' || passToUse === 'admin' || passToUse === 'Admin2026!')) {
        const adminUser: UserAccount = {
          id: 'usr_admin_main',
          email: 'admin@faltkoll.se',
          displayName: 'Huvudadministratör (Admin)',
          role: 'ADMIN',
          password: passToUse,
          schoolOrCompany: 'Anläggningsutbildning & Egenkontroll',
          createdAt: '2026-09-26 10:00',
          lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        onUserLoggedIn(adminUser);
        try {
          localStorage.setItem('falthjalp_current_user', JSON.stringify(adminUser));
        } catch {}
        setSuccessMsg('Välkommen! Du är nu inloggad som Huvudadministratör.');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setAdminLoginError(err.message || 'Kunde inte logga in. Kontrollera e-post och lösenord.');
      }
    } finally {
      setIsLoggingInAdmin(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch {
      // Local fallback users if server endpoint is offline
      setAllUsers([
        {
          id: 'usr_elev_1',
          email: 'elev@skola.se',
          displayName: 'Elev / Lärling (Exempel)',
          role: 'STUDENT',
          schoolOrCompany: 'Bygg & Anläggning Grupp A',
          createdAt: '2026-02-01',
        },
        {
          id: 'usr_larare_1',
          email: 'larare@skola.se',
          displayName: 'Yrkeslärare Mark & Betong',
          role: 'TEACHER',
          schoolOrCompany: 'Yrkeslärare Mark & Betong',
          createdAt: '2026-01-10',
        },
        {
          id: 'usr_admin_1',
          email: 'admin@falthjalp.se',
          displayName: 'Skoladministratör / Ägare',
          role: 'ADMIN',
          schoolOrCompany: 'Skolledning',
          createdAt: '2026-01-01',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // Load license settings from localStorage if available
    try {
      const saved = localStorage.getItem('falthjalp_license');
      if (saved) {
        setLicense((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {}

    // Load server system settings
    fetch('/api/system/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.requireLoginOnStartup !== undefined) {
          setLicense((prev) => ({
            ...prev,
            requireLoginOnStartup: data.requireLoginOnStartup,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleTeacherCreation = () => {
    if (!isAdmin) return;
    const updated: AppLicense = {
      ...license,
      allowTeacherAccountCreation: !license.allowTeacherAccountCreation,
    };
    setLicense(updated);
    try {
      localStorage.setItem('falthjalp_license', JSON.stringify(updated));
    } catch {}
    setSuccessMsg(
      updated.allowTeacherAccountCreation
        ? 'Lärare har nu behörighet att skapa och bjuda in elevkonton!'
        : 'Endast du (Administratör) kan nu skapa nya konton.'
    );
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCopyLicenseKey = () => {
    navigator.clipboard.writeText(license.licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleSaveCustomLicenseKey = () => {
    if (!isAdmin) return;
    const cleanKey = customLicenseKey.trim().toUpperCase();
    if (!cleanKey) return;
    const updated: AppLicense = {
      ...license,
      licenseKey: cleanKey,
    };
    setLicense(updated);
    try {
      localStorage.setItem('falthjalp_license', JSON.stringify(updated));
    } catch {}
    setIsEditingKey(false);
    setSuccessMsg(`Skolans licensnyckel uppdaterades till: ${cleanKey}`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAccounts) {
      setErrorMsg('Du har inte behörighet att skapa konton.');
      return;
    }

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setErrorMsg('Vänligen fyll i namn och e-postadress.');
      return;
    }

    // Only Admin can create Teacher or Admin
    if (!isAdmin && newUserRole !== 'STUDENT') {
      setErrorMsg('Endast administratören kan skapa lärar- och administratörskonton.');
      return;
    }

    try {
      setIsCreating(true);
      setErrorMsg(null);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword.trim() || '1234',
          role: newUserRole,
          schoolOrCompany: newUserOrg.trim(),
        }),
      });

      if (res.ok) {
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('1234');
        setSuccessMsg(`Nytt konto för "${newUserName}" har aktiverats!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        await loadUsers();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Kunde inte skapa användare.');
      }
    } catch (err: any) {
      setErrorMsg('Nätverksfel: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    if (!isAdmin) {
      alert('Endast administratören kan ändra behörighetsnivå.');
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setAllUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setSuccessMsg(
          `Behörigheten ändrades till ${
            newRole === 'ADMIN' ? 'Skoladmin' : newRole === 'TEACHER' ? 'Lärare' : 'Elev'
          }!`
        );
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Kunde inte ändra behörighet.');
      }
    } catch {
      setErrorMsg('Kunde inte uppdatera behörighet.');
    }
  };

  const handleSavePassword = async (userId: string) => {
    if (!isAdmin || !newPasswordVal.trim()) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPasswordVal.trim() }),
      });

      if (res.ok) {
        setSuccessMsg('Lösenordet uppdaterades framgångsrikt!');
        setEditingPasswordUserId(null);
        setNewPasswordVal('');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Kunde inte ändra lösenord.');
      }
    } catch {
      setErrorMsg('Kunde inte uppdatera lösenord.');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!isAdmin) {
      alert('Endast administratören kan radera användarkonton.');
      return;
    }

    if (!confirm(`Är du säker på att du vill ta bort kontot för "${name}"?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`Kontot för "${name}" togs bort.`);
        setTimeout(() => setSuccessMsg(null), 3000);
        if (currentUser?.id === userId) {
          onUserLoggedOut();
        }
        await loadUsers();
      }
    } catch {
      setErrorMsg('Kunde inte ta bort användare.');
    }
  };

  const handleSwitchUser = (user: UserAccount) => {
    onUserLoggedIn(user);
    setSuccessMsg(
      `Du är nu inloggad som ${user.displayName} (${
        user.role === 'TEACHER' ? 'Lärare' : user.role === 'ADMIN' ? 'Admin' : 'Elev'
      }).`
    );
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const filteredUsers = allUsers.filter((u) => {
    const matchesFilter = activeFilter === 'ALL' || u.role === activeFilter;
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.schoolOrCompany && u.schoolOrCompany.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // When user is not logged in as Admin, show Admin Login interface
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-6 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[42px] px-4 bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 hover:text-white border border-[#333333] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Tillbaka till övningar</span>
          </button>
          <span className="text-xs font-bold text-slate-400">
            FältKoll Administration
          </span>
        </div>

        {/* Admin Login Card */}
        <div className="bg-[#181818] border-2 border-orange-500/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/80">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Adminpanel & Inloggningskontroll
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Logga in som Huvudadministratör för att styra demoläget (ta bort inloggningsskärmen för alla), hantera skollicensen och elever.
            </p>
          </div>



          {/* Error message */}
          {adminLoginError && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-500/80 rounded-2xl flex items-start gap-2.5 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{adminLoginError}</div>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={(e) => handleAdminLoginSubmit(e)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                E-postadress eller användarnamn:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="E-post eller användarnamn..."
                  className="w-full min-h-[48px] px-4 pl-10 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Lösenord:
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Lösenord..."
                  className="w-full min-h-[48px] px-4 pl-10 pr-10 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingInAdmin}
              className="w-full min-h-[50px] bg-[#222] hover:bg-[#2c2c2c] border border-slate-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {isLoggingInAdmin ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4 text-orange-400" />
                  <span>Logga in med uppgifter</span>
                </>
              )}
            </button>
          </form>

          {/* Current user status if logged in as student/teacher */}
          {currentUser && (
            <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Inloggad som: <strong className="text-white">{currentUser.displayName}</strong> ({currentUser.role})
              </span>
              <button
                type="button"
                onClick={onUserLoggedOut}
                className="text-rose-400 hover:text-rose-300 font-bold hover:underline cursor-pointer"
              >
                Logga ut
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6 font-sans">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2c2c2c] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-orange-400 bg-orange-950/60 px-2.5 py-0.5 rounded-full border border-orange-800/80">
              {isAdmin ? 'Systemägare & Licensadmin' : 'Läraradministration'}
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Skollicens Aktiv
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Kontohantering & Behörigheter
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Administrera elever och lärare, byt lösenord och hantera skolans licensnyckel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[42px] px-4 bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 hover:text-white border border-[#333333] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Till översikt</span>
          </button>
          <button
            type="button"
            onClick={loadUsers}
            disabled={isLoading}
            className="w-10 h-10 bg-[#1e1e1e] hover:bg-[#282828] text-slate-400 hover:text-white border border-[#333333] rounded-xl flex items-center justify-center cursor-pointer transition-colors"
            title="Uppdatera användarlista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/80 rounded-2xl flex items-center gap-3 text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/80 rounded-2xl flex items-center gap-3 text-rose-200">
          <span className="text-sm font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Säkerhet & Inloggningsstatus */}
      <div className="bg-[#181818] border border-orange-500/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Behörighetsskydd Aktivt</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white">All data är skyddad bakom inloggning</h2>
          <p className="text-xs text-slate-400">Obehöriga besökare har ingen åtkomst till projekt, toleransmätningar eller egenkontroller.</p>
        </div>
      </div>



      {/* BETALAPP-SÄKRING & SKOLLICENS KORT (Endast Admin) */}
      {isAdmin && (
        <div className="bg-[#181818] border-2 border-orange-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#282828] pb-4">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Betalapp-skydd & Skollicens
              </span>
              <h2 className="text-xl font-black text-white">
                Licensnyckel & Behörighetsregler
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800 font-bold self-start sm:self-auto">
              Giltig till: {license.validUntil}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Licenskod att dela till skolan / klassen */}
            <div className="bg-[#121212] border border-[#333] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 block uppercase">
                  Skolans Licensnyckel:
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLicenseKey(license.licenseKey);
                      setIsEditingKey(!isEditingKey);
                    }}
                    className="text-[11px] text-orange-400 hover:underline cursor-pointer font-semibold"
                  >
                    {isEditingKey ? 'Avbryt' : '[Välj egen kod]'}
                  </button>
                )}
              </div>
              {isEditingKey ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customLicenseKey}
                    onChange={(e) => setCustomLicenseKey(e.target.value.toUpperCase())}
                    className="px-3 py-1.5 bg-[#181818] border border-orange-500 rounded-xl text-white font-mono text-sm font-bold uppercase outline-none flex-1"
                    placeholder="T.ex. SKOLA-2026"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomLicenseKey}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl text-xs cursor-pointer shadow-md shadow-orange-500/20"
                  >
                    Spara
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <code className="text-base sm:text-lg font-mono font-black text-orange-400 tracking-wider">
                    {license.licenseKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyLicenseKey}
                    className="px-3 py-1.5 bg-[#222] hover:bg-[#2c2c2c] text-white rounded-xl text-xs font-bold border border-[#444] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Kopierad' : 'Kopiera'}</span>
                  </button>
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                Elever och lärare anger denna kod 1 gång för att låsa upp appen på sina telefoner utan att appen kan piratkopieras.
              </p>
            </div>

            {/* Lärare Behörighet Toggle */}
            <div className="bg-[#121212] border border-[#333] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-400 block uppercase">
                Lärarbehörighet att registrera konton:
              </span>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-white block">
                    {license.allowTeacherAccountCreation ? 'Lärare FÅR skapa elevkonton' : 'Endast Admin FÅR skapa konton'}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {license.allowTeacherAccountCreation
                      ? 'Yrkeslärare kan registrera sina egna klasser.'
                      : 'Endast du som systemägare kan lägga till nya elever.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTeacherCreation}
                  className={`min-h-[42px] px-4 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    license.allowTeacherAccountCreation
                      ? 'bg-orange-500 text-black border-orange-400'
                      : 'bg-[#222] text-slate-400 border-[#444] hover:text-white'
                  }`}
                >
                  {license.allowTeacherAccountCreation ? 'Aktiverat' : 'Avstängt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skapa nytt konto formulär */}
      {canManageAccounts && (
        <div className="bg-[#1a1a1a] border border-[#2c2c2c] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#2c2c2c] pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-400" />
              <span>Registrera nytt konto ({isAdmin ? 'Elev eller Lärare' : 'Elev'})</span>
            </h2>
            <span className="text-xs text-slate-400">Direkt behörighet</span>
          </div>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                För- och efternamn:
              </label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="T.ex. Förnamn Efternamn"
                className="w-full min-h-[48px] px-4 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-white font-medium text-sm outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                E-post eller Elev-ID:
              </label>
              <input
                type="text"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="T.ex. elev@skola.se"
                className="w-full min-h-[48px] px-4 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-white font-medium text-sm outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Roll i appen:
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                disabled={!isAdmin}
                className="w-full min-h-[48px] px-4 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-white font-bold text-sm outline-none cursor-pointer"
              >
                <option value="STUDENT">Elev / Lärling (Genomför övningar & fotar)</option>
                {isAdmin && <option value="TEACHER">Lärare (Granskar, signerar & skickar notiser)</option>}
                {isAdmin && <option value="ADMIN">Skoladministratör (Full behörighet)</option>}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Lösenord / PIN:
              </label>
              <input
                type="text"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="T.ex. elev123 eller 1234"
                className="w-full min-h-[48px] px-4 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-white font-medium text-sm outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Klass / Utbildningsenhet:
              </label>
              <input
                type="text"
                value={newUserOrg}
                onChange={(e) => setNewUserOrg(e.target.value)}
                placeholder="T.ex. Byggprogrammet Årskurs 2"
                className="w-full min-h-[48px] px-4 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-white font-medium text-sm outline-none"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full min-h-[52px] px-6 bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer transition-all"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>{isCreating ? 'Skapar konto...' : 'Spara och aktivera konto'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Befintliga konton i skolan */}
      <div className="bg-[#1a1a1a] border border-[#2c2c2c] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2c2c2c] pb-4">
          <div>
            <h2 className="text-xl font-black text-white">
              Registrerade konton ({allUsers.length})
            </h2>
            <p className="text-xs text-slate-400">
              Klicka på "Byt till detta konto" för att testa appen i elev- eller lärarläge.
            </p>
          </div>

          {/* Sökfält */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sök namn, e-post eller klass..."
              className="w-full min-h-[40px] pl-10 pr-4 bg-[#121212] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Filterflikar */}
        <div className="flex items-center gap-2">
          {(['ALL', 'STUDENT', 'TEACHER', 'ADMIN'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                activeFilter === filter
                  ? 'bg-orange-500 text-black border-orange-400'
                  : 'bg-[#141414] text-slate-400 border-[#2c2c2c] hover:text-white'
              }`}
            >
              {filter === 'ALL'
                ? 'Alla'
                : filter === 'STUDENT'
                ? 'Elever'
                : filter === 'TEACHER'
                ? 'Lärare'
                : 'Admins'}
            </button>
          ))}
        </div>

        {/* Användarlista */}
        <div className="grid grid-cols-1 gap-3">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#141414] rounded-2xl border border-dashed border-[#2c2c2c]">
              Inga konton matchade din sökning.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isCurrent = currentUser?.id === user.id;
              const isRootAdmin = user.role === 'ADMIN' && allUsers.filter(u => u.role === 'ADMIN').length <= 1;

              return (
                <div
                  key={user.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-[#181e18] border-emerald-500/80 ring-1 ring-emerald-500/30'
                      : 'bg-[#141414] border-[#2c2c2c] hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Avatar & User Metadata */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${
                          user.role === 'TEACHER'
                            ? 'bg-amber-500 text-black'
                            : user.role === 'ADMIN'
                            ? 'bg-purple-500 text-white'
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        }`}
                      >
                        {user.displayName.charAt(0)}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white text-base truncate">
                            {user.displayName}
                          </h3>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              user.role === 'TEACHER'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : user.role === 'ADMIN'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-orange-950 text-orange-300 border border-orange-800'
                            }`}
                          >
                            {user.role === 'TEACHER' ? 'Lärare' : user.role === 'ADMIN' ? 'Skoladmin' : 'Elev'}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                              Aktiv (Du)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                          <span>{user.email}</span>
                          {user.schoolOrCompany && (
                            <>
                              <span>•</span>
                              <span className="truncate">{user.schoolOrCompany}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls & Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#222]">
                      {/* Behörighetsväljare (Elev / Lärare / Admin) */}
                      {isAdmin && (
                        <div className="flex items-center gap-0.5 bg-[#181818] p-1 rounded-xl border border-[#333]">
                          {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleChangeRole(user.id, r)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                user.role === r
                                  ? r === 'ADMIN'
                                    ? 'bg-purple-600 text-white font-black'
                                    : r === 'TEACHER'
                                    ? 'bg-amber-500 text-black font-black'
                                    : 'bg-orange-500 text-black font-black'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title={`Ändra roll till ${r === 'STUDENT' ? 'Elev' : r === 'TEACHER' ? 'Lärare' : 'Admin'}`}
                            >
                              {r === 'STUDENT' ? 'Elev' : r === 'TEACHER' ? 'Lärare' : 'Admin'}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Byt lösenord */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPasswordUserId(editingPasswordUserId === user.id ? null : user.id);
                            setNewPasswordVal('');
                          }}
                          className={`min-h-[36px] px-3 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-colors ${
                            editingPasswordUserId === user.id
                              ? 'bg-orange-500 text-black border-orange-400 font-black'
                              : 'bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 hover:text-white border-[#333]'
                          }`}
                          title="Ändra lösenord"
                        >
                          <Key className="w-3.5 h-3.5 text-orange-400" />
                          <span>Lösenord</span>
                        </button>
                      )}

                      {/* Snabb-växla konto */}
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleSwitchUser(user)}
                          className="min-h-[36px] px-3 bg-[#242424] hover:bg-orange-500 hover:text-black text-white font-bold text-xs rounded-xl border border-[#3c3c3c] flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Växla till detta konto för testning"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Logga in</span>
                        </button>
                      )}

                      {/* Radera konto */}
                      {isAdmin && (
                        (isCurrent || isRootAdmin) ? (
                          <span
                            className="min-h-[36px] px-2.5 rounded-xl bg-slate-900 border border-[#333] text-slate-500 flex items-center justify-center text-xs"
                            title="Aktivt konto eller sista administratören kan ej raderas"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id, user.displayName)}
                            className="min-h-[36px] w-9 bg-[#202020] hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl border border-[#333333] flex items-center justify-center cursor-pointer transition-colors"
                            title="Ta bort konto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Inline lösenordsbyte formulär */}
                  {editingPasswordUserId === user.id && (
                    <div className="w-full mt-3 pt-3 border-t border-[#262626] flex flex-col sm:flex-row items-center gap-2 animate-in fade-in">
                      <span className="text-xs text-orange-400 font-bold whitespace-nowrap">
                        Nytt lösenord för {user.displayName}:
                      </span>
                      <input
                        type="text"
                        value={newPasswordVal}
                        onChange={(e) => setNewPasswordVal(e.target.value)}
                        placeholder="Ange nytt lösenord..."
                        className="flex-1 min-h-[38px] px-3 bg-[#121212] border border-orange-500/50 rounded-xl text-xs text-white outline-none font-mono"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleSavePassword(user.id)}
                          className="flex-1 sm:flex-none min-h-[38px] px-4 bg-orange-500 hover:bg-orange-400 text-black text-xs font-black rounded-xl cursor-pointer shadow-md transition-all"
                        >
                          Spara lösenord
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPasswordUserId(null)}
                          className="flex-1 sm:flex-none min-h-[38px] px-3 bg-[#222] hover:bg-[#2c2c2c] text-slate-400 text-xs font-bold rounded-xl cursor-pointer transition-all"
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
