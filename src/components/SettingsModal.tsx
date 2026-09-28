import React, { useState, useEffect } from 'react';
import {
  UserSettings,
  AppLayoutMode,
  AppColorPalette,
  PreInspectionPreference,
  ProjectType,
} from '../types';
import {
  X,
  Sliders,
  Check,
  Palette,
  Layers,
  ShieldCheck,
  Camera,
  User,
  Sparkles,
  Sun,
  Flame,
  Zap,
  Compass,
  AlertTriangle,
  RotateCcw,
  QrCode,
  Smartphone,
  Copy,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import { getAppUrl } from '../utils/appUrl';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  onUpdateUserSettings: (newSettings: UserSettings) => void;
  onRerunWizard?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userSettings,
  onUpdateUserSettings,
  onRerunWizard,
}) => {
  const [activeTab, setActiveTab] = useState<'QR_MOBILE' | 'LAYOUT' | 'PALETTE' | 'PREINSPECTION' | 'PHOTO' | 'PROFILE'>('QR_MOBILE');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>(userSettings.customDeployUrl || '');

  const activeUrl = getAppUrl(customUrl);

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(activeUrl, {
        width: 440,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Kunde inte generera QR-kod:', err));
    }
  }, [isOpen, activeUrl]);

  // Form states initialized from userSettings
  const [layoutMode, setLayoutMode] = useState<AppLayoutMode>(userSettings.appLayoutMode || 'FIELD_CLEAR');
  const [palette, setPalette] = useState<AppColorPalette>(userSettings.colorPalette || 'ORANGE_WORK');
  const [preInspPref, setPreInspPref] = useState<PreInspectionPreference>(userSettings.preInspectionPreference || 'ALWAYS_ASK');
  const [requirePhoto, setRequirePhoto] = useState<boolean>(!!userSettings.requirePhotoToComplete);
  const [saveToGallery, setSaveToGallery] = useState<boolean>(!!userSettings.saveToDeviceGallery);
  const [watermark, setWatermark] = useState<boolean>(userSettings.featurePhotoWatermark !== false);
  const [userName, setUserName] = useState<string>(userSettings.userName || '');
  const [companyName, setCompanyName] = useState<string>(userSettings.companyName || '');
  const [preferredType, setPreferredType] = useState<ProjectType | 'ALL'>(userSettings.preferredProjectType || 'ALL');

  if (!isOpen) return null;

  const handleApplyChanges = (partial?: Partial<UserSettings>) => {
    const updated: UserSettings = {
      ...userSettings,
      appLayoutMode: layoutMode,
      colorPalette: palette,
      preInspectionPreference: preInspPref,
      requirePhotoToComplete: requirePhoto,
      saveToDeviceGallery: saveToGallery,
      featurePhotoWatermark: watermark,
      userName: userName.trim(),
      companyName: companyName.trim(),
      preferredProjectType: preferredType,
      customDeployUrl: customUrl.trim(),
      ...partial,
    };
    onUpdateUserSettings(updated);
  };

  const handleSelectLayout = (mode: AppLayoutMode) => {
    setLayoutMode(mode);
    handleApplyChanges({ appLayoutMode: mode });
  };

  const handleSelectPalette = (pal: AppColorPalette) => {
    setPalette(pal);
    handleApplyChanges({ colorPalette: pal });
  };

  const handleSelectPreInsp = (pref: PreInspectionPreference) => {
    setPreInspPref(pref);
    handleApplyChanges({ preInspectionPreference: pref });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#121212] border-2 border-[#2c2c2c] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Inställningar & Appanpassning
              </h2>
              <p className="text-xs text-slate-400">
                Anpassa layout, tydlighet, färgpalett och försyn för fältarbetet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#222222] hover:bg-[#2e2e2e] text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#262626] bg-[#141414] px-3 overflow-x-auto gap-1 py-1.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('QR_MOBILE')}
            className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'QR_MOBILE'
                ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                : 'text-orange-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Mobil & QR-kod</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LAYOUT')}
            className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'LAYOUT'
                ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Layout & Tydlighet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PALETTE')}
            className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'PALETTE'
                ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Färgpalett</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PREINSPECTION')}
            className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'PREINSPECTION'
                ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Försyn & Skador</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PHOTO')}
            className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'PHOTO'
                ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Foto & Kamera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'PROFILE'
                ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil & Namn</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 0: MOBIL & QR-KOD */}
          {activeTab === 'QR_MOBILE' && (
            <div className="space-y-4 flex flex-col items-center text-center">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Öppna appen i mobilen
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Skanna QR-koden med mobilens vanliga kamera för att öppna och testa appen direkt i telefonen.
                </p>
              </div>

              {/* QR Container */}
              <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-orange-500/40 inline-flex flex-col items-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR-kod till appen"
                    className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-black font-bold text-sm">
                    Genererar QR-kod...
                  </div>
                )}
                <span className="text-[11px] font-mono font-bold text-slate-800 mt-2">
                  Kameraskanning • Direkt till mobilen
                </span>
              </div>

              {/* URL & Quick copy */}
              <div className="w-full max-w-md space-y-3">
                {/* Custom URL Input Field */}
                <div className="p-3 bg-[#181818] border border-[#2e2e2e] rounded-xl text-left space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">
                    Anpassad webbadress för QR-kod:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://ditt-projektnamn.netlify.app"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyChanges({ customDeployUrl: customUrl.trim() })}
                      className="px-3 py-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs rounded-lg cursor-pointer transition-colors shrink-0"
                    >
                      Spara
                    </button>
                  </div>
                  {customUrl.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomUrl('');
                        handleApplyChanges({ customDeployUrl: '' });
                      }}
                      className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Återställ till standardadress
                    </button>
                  )}
                </div>

                {/* Display Current URL */}
                <div className="flex items-center gap-2 bg-[#181818] border border-[#2e2e2e] p-2 rounded-xl text-left">
                  <div className="min-w-0 flex-1 px-2 font-mono text-xs text-orange-400 truncate">
                    {activeUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(activeUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="min-h-[36px] px-3 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopierad!' : 'Kopiera'}</span>
                  </button>
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[36px] px-2.5 bg-[#262626] hover:bg-[#333333] text-slate-200 rounded-lg flex items-center justify-center shrink-0"
                    title="Öppna i ny flik"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-xl text-left text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-white block flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-orange-400" /> Tips för mobilskärmen:
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    När du öppnat länken i mobilen, klicka på webbläsarens meny och välj <strong>Lägg till på hemskärmen</strong> eller <strong>Installera app</strong>. Då körs den i fullskärm som en vanlig app!
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* TAB 1: LAYOUT & TYDLIGHET */}
          {activeTab === 'LAYOUT' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-white">Välj App-Layout</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bestäm hur information och knappar ska presenteras. Du kan när som helst byta för att få maximal läsbarhet.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* 1. Fältläge (Maximal Tydlighet) */}
                <button
                  type="button"
                  onClick={() => handleSelectLayout('FIELD_CLEAR')}
                  className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    layoutMode === 'FIELD_CLEAR'
                      ? 'bg-orange-500/10 border-orange-500 text-white ring-1 ring-orange-500/50'
                      : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-white">
                          🚜 Fältläge (Maximal Tydlighet)
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500 text-black px-2 py-0.5 rounded-full">
                          Standard
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Extra stora touch-ytor, alltid fulla svenska texter på alla knappar (inga svårtolkade miniatyrikoner) och extra kontrast för arbete utomhus med handskar.
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        layoutMode === 'FIELD_CLEAR'
                          ? 'border-orange-500 bg-orange-500 text-black'
                          : 'border-[#444] bg-[#121212]'
                      }`}
                    >
                      {layoutMode === 'FIELD_CLEAR' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>

                {/* 2. Kompakt Arbetsledarläge */}
                <button
                  type="button"
                  onClick={() => handleSelectLayout('COMPACT')}
                  className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    layoutMode === 'COMPACT'
                      ? 'bg-orange-500/10 border-orange-500 text-white ring-1 ring-orange-500/50'
                      : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-white">
                          📋 Kompakt Arbetsledarläge
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Tätare rader och mer koncentrerad översikt. Passar vana användare som snabbt vill granska flera moment samtidigt utan onödigt rullande.
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        layoutMode === 'COMPACT'
                          ? 'border-orange-500 bg-orange-500 text-black'
                          : 'border-[#444] bg-[#121212]'
                      }`}
                    >
                      {layoutMode === 'COMPACT' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>

                {/* 3. Guidat Läge (Steg-för-steg) */}
                <button
                  type="button"
                  onClick={() => handleSelectLayout('GUIDED_STEP')}
                  className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    layoutMode === 'GUIDED_STEP'
                      ? 'bg-orange-500/10 border-orange-500 text-white ring-1 ring-orange-500/50'
                      : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-white">
                          🎓 Guidat Steg-för-steg (Utbildning)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Maximalt pedagogiskt stöd med fällande hjälprutor, yrkeslärarens råd och AMA-tolkningar förklarade i detalj direkt vid varje delmoment.
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        layoutMode === 'GUIDED_STEP'
                          ? 'border-orange-500 bg-orange-500 text-black'
                          : 'border-[#444] bg-[#121212]'
                      }`}
                    >
                      {layoutMode === 'GUIDED_STEP' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FÄRGPALETT */}
          {activeTab === 'PALETTE' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-white">Välj Färgpalett</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Välj det färgtema som ger bäst kontrast i den miljö du arbetar (inomhus, gråväder eller starkt solljus).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Varselorange */}
                <button
                  type="button"
                  onClick={() => handleSelectPalette('ORANGE_WORK')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    palette === 'ORANGE_WORK'
                      ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500'
                      : 'bg-[#181818] border-[#2c2c2c] hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-orange-500 shadow-sm border border-orange-300"></span>
                      <span className="font-bold text-sm text-white">Varselorange & Grafit</span>
                    </div>
                    {palette === 'ORANGE_WORK' && <Check className="w-4 h-4 text-orange-400 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Klassisk svensk byggstandard i mörkton med skarp varselorange.
                  </p>
                </button>

                {/* 2. Varselgul */}
                <button
                  type="button"
                  onClick={() => handleSelectPalette('SAFETY_YELLOW')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    palette === 'SAFETY_YELLOW'
                      ? 'bg-yellow-500/15 border-yellow-400 text-white ring-1 ring-yellow-400'
                      : 'bg-[#181818] border-[#2c2c2c] hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-yellow-400 shadow-sm border border-yellow-200"></span>
                      <span className="font-bold text-sm text-white">Varselgul / Hi-Vis</span>
                    </div>
                    {palette === 'SAFETY_YELLOW' && <Check className="w-4 h-4 text-yellow-400 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Vägarbetsstandard med extremt hög synlighet mot asfalt.
                  </p>
                </button>

                {/* 3. Dagsljus Ljus */}
                <button
                  type="button"
                  onClick={() => handleSelectPalette('DAYLIGHT_HIGH_CONTRAST')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    palette === 'DAYLIGHT_HIGH_CONTRAST'
                      ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500'
                      : 'bg-[#181818] border-[#2c2c2c] hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white shadow-sm border border-slate-400 flex items-center justify-center text-[10px]">☀️</span>
                      <span className="font-bold text-sm text-white">Högkontrast Dagsljus</span>
                    </div>
                    {palette === 'DAYLIGHT_HIGH_CONTRAST' && <Check className="w-4 h-4 text-orange-400 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Ljust läge för direkt solsken på bygget där mörka skärmar speglar sig.
                  </p>
                </button>

                {/* 4. Proffsblå */}
                <button
                  type="button"
                  onClick={() => handleSelectPalette('NORDIC_BLUE')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    palette === 'NORDIC_BLUE'
                      ? 'bg-sky-500/15 border-sky-400 text-white ring-1 ring-sky-400'
                      : 'bg-[#181818] border-[#2c2c2c] hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-500 shadow-sm border border-sky-300"></span>
                      <span className="font-bold text-sm text-white">Nordisk Proffsblå</span>
                    </div>
                    {palette === 'NORDIC_BLUE' && <Check className="w-4 h-4 text-sky-400 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Stålgrå och marinblå företagsstil för entreprenader och besiktning.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FÖRSYN & SKADEGUIDE */}
          {activeTab === 'PREINSPECTION' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-white">Standard för Försyn & Skadeguide</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bestäm om du vill bli påmind om att fota fasad och tomtgränser, eller hoppa över det automatiskt vid privat bygge.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Hoppa över försyn som standard */}
                <button
                  type="button"
                  onClick={() => handleSelectPreInsp('SKIP_DEFAULT')}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    preInspPref === 'SKIP_DEFAULT'
                      ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500'
                      : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>🏡 Hoppa över försyn som standard (Privat bruk / Altan)</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Inga tvingande eller tjatiga påminnelser om att fota grannens fasad vid projektstart. Perfekt för privatpersoner som bygger altan eller fixar på egen tomt.
                      </p>
                    </div>
                    {preInspPref === 'SKIP_DEFAULT' && <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0" />}
                  </div>
                </button>

                {/* 2. Fråga varje gång */}
                <button
                  type="button"
                  onClick={() => handleSelectPreInsp('ALWAYS_ASK')}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    preInspPref === 'ALWAYS_ASK'
                      ? 'bg-orange-500/10 border-orange-500 text-white ring-1 ring-orange-500'
                      : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>⚖️ Fråga vid varje nytt projekt (Standard)</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Ett enkelt val visas när du skapar ett projekt där du kan välja att göra eller hoppa över försynen med ett klick.
                      </p>
                    </div>
                    {preInspPref === 'ALWAYS_ASK' && <Check className="w-4 h-4 text-orange-400 stroke-[3] shrink-0" />}
                  </div>
                </button>

                {/* 3. Gör alltid försyn */}
                <button
                  type="button"
                  onClick={() => handleSelectPreInsp('ALWAYS_DO')}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    preInspPref === 'ALWAYS_DO'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>🛡️ Gör alltid försyn (Entreprenad & Maskinister)</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Rekommenderat för företag och anläggare för att säkra bevis mot skadeståndskrav från grannfastigheter innan tunga maskiner startar.
                      </p>
                    </div>
                    {preInspPref === 'ALWAYS_DO' && <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />}
                  </div>
                </button>
              </div>

              {/* Varning & Info */}
              <div className="p-3.5 rounded-2xl bg-[#1e1710] border border-amber-600/40 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Viktig information om konsekvenser:</span>
                </div>
                <p className="leading-relaxed text-amber-100/90">
                  Om du hoppar över försynen kan du när som helst göra den senare under schakt- eller förberedelsemomentet i checklistan.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: FOTO & KAMERA */}
          {activeTab === 'PHOTO' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-white">Foto & Dokumentation</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bestäm hur kameran fungerar och om foton är obligatoriska för att godkänna moment.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#181818] border border-[#2c2c2c] flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-sm text-white block">Kräv foto före godkännande</span>
                    <span className="text-xs text-slate-400">
                      Om avstängd kan du signera moment grönt direkt utan att ladda upp fotobevis.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !requirePhoto;
                      setRequirePhoto(next);
                      handleApplyChanges({ requirePhotoToComplete: next });
                    }}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      requirePhoto ? 'bg-orange-500' : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        requirePhoto ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#181818] border border-[#2c2c2c] flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-sm text-white block">Spara kopia i mobilens kamerarulle</span>
                    <span className="text-xs text-slate-400">
                      Laddar ner en extra kopia av varje taget foto till telefonens bildgalleri.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !saveToGallery;
                      setSaveToGallery(next);
                      handleApplyChanges({ saveToDeviceGallery: next });
                    }}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      saveToGallery ? 'bg-orange-500' : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        saveToGallery ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#181818] border border-[#2c2c2c] flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-sm text-white block">Inbränd tidsstämpel & vattenstämpel</span>
                    <span className="text-xs text-slate-400">
                      Bränner in datum, klockslag och momentnamn i fotot för juridiskt bevisvärde.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !watermark;
                      setWatermark(next);
                      handleApplyChanges({ featurePhotoWatermark: next });
                    }}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      watermark ? 'bg-orange-500' : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        watermark ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROFIL & NAMN */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-white">Användarprofil & Signatur</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dessa uppgifter förifylls automatiskt vid signering och på kontrollrapporter.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ditt Namn (Signatur)
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      handleApplyChanges({ userName: e.target.value });
                    }}
                    placeholder="Förnamn Efternamn"
                    className="w-full min-h-[46px] px-3.5 bg-[#181818] border border-[#333333] focus:border-orange-500 rounded-xl text-white text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Företag, Skola eller Fastighet
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      handleApplyChanges({ companyName: e.target.value });
                    }}
                    placeholder="T.ex. Mark & Bygg / Privatfastighet"
                    className="w-full min-h-[46px] px-3.5 bg-[#181818] border border-[#333333] focus:border-orange-500 rounded-xl text-white text-sm outline-none"
                  />
                </div>
              </div>

              {/* Rerun Wizard Button */}
              {onRerunWizard && (
                <div className="pt-4 border-t border-[#262626]">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRerunWizard();
                    }}
                    className="w-full min-h-[46px] px-4 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-slate-300 hover:text-white border border-[#383838] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-orange-400" />
                    <span>Kör startguiden / Wizarden igen</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#161616] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-sm rounded-xl cursor-pointer shadow-md shadow-orange-500/20 transition-all"
          >
            Stäng & Spara
          </button>
        </div>
      </div>
    </div>
  );
};
