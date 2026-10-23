import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  FolderKanban,
  Camera,
  PenTool,
  Compass,
  FileText,
  Menu,
  HardHat,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Layers,
  GraduationCap,
  Users,
  Share2,
  Cloud,
  History,
  BookOpen,
  QrCode,
  Ruler,
  Phone,
  Truck,
  MessageSquare,
  Calculator,
} from 'lucide-react';

interface AppTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
  isInitialRegistration?: boolean;
}

export interface TutorialStep {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  keyPoints: string[];
  visualType:
    | 'PROJECTS'
    | 'MOMENTS'
    | 'CAMERA'
    | 'SIGNATURE'
    | 'CROSSMEASURE'
    | 'FIELD_NOTES'
    | 'SCHOOL_TEACHER'
    | 'COLLABORATION_SYNC'
    | 'ALL_TOOLS_MENU';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    badge: 'Steg 1 av 8 • Grund & Projekt',
    title: 'Projekt & Egenkontroller',
    subtitle: 'Skapa och hantera dina anläggningsbyggen på ett ställe',
    description:
      'I FältKoll samlar du alla dina mark- och anläggningsprojekt: platta på mark, krypgrund, altaner, VA-schakter, stödmurar och dräneringar. Varje projekt har en komplett digital egenkontrollmall med fördefinierade kontrollpunkter anpassade för svensk byggstandard.',
    keyPoints: [
      'Skapa nytt projekt med ett klick och välj projekttyp och entreprenadform',
      'Följ framstegsprocent och status (Grön = Godkänd, Gul = Pågår, Röd = Kvar)',
      'Fungerar 100% offline i schaktgropen – all data sparas direkt i enhetens minne',
    ],
    visualType: 'PROJECTS',
  },
  {
    id: 2,
    badge: 'Steg 2 av 8 • Byggkrav & AMA',
    title: 'Moment & Byggkrav (AMA Anläggning)',
    subtitle: 'Kvalitetssäkra enligt branschkrav och yrkeslärarens råd',
    description:
      'Varje egenkontroll är uppdelad i kronologiska byggfaser: etablering, grovschakt, bärlager, isolering, armering och gjutning. Momenten innehåller tydliga instruktioner, toleranser, AMA-koder och yrkeslärarens fälttips.',
    keyPoints: [
      'Tydliga AMA-koder (t.ex. CBE.1, DCL.1) och toleranskrav för varje moment',
      'Yrkeslärarens fältråd ger praktiska knep direkt på arbetsplatsen',
      'Strukturerade kontrollpunkter du kan bocka av allt eftersom bygget fortskrider',
    ],
    visualType: 'MOMENTS',
  },
  {
    id: 3,
    badge: 'Steg 3 av 8 • Fotobevis',
    title: 'Kamera & Kontrollfoton på varje rad',
    subtitle: 'Fota direkt på momentraden med automatisk tidsstämpel',
    description:
      'På varje momentrad finns en kamera-knapp. Klicka på den för att ta kontrollfoton med mobilen eller surfplattan direkt i gropen innan moment täcks över. Alla foton tidsstämplas automatiskt och kopplas juridiskt till rätt moment.',
    keyPoints: [
      'Snabbkamera på varje rad för att fota dolda moment (geotextil, makadam, rörfall, armering)',
      'Datum, klockslag och projektmärkning sparas automatiskt i fotot som juridiskt bevis',
      'Skol- & GDPR-anpassat: Fota schaktbotten, armering och mätstock utan personansikten',
    ],
    visualType: 'CAMERA',
  },
  {
    id: 4,
    badge: 'Steg 4 av 8 • Digital namnteckning',
    title: 'Signera med fingret (Pennknappen)',
    subtitle: 'Rita din namnteckning direkt på skärmen på varje momentrad',
    description:
      'Bredvid kameran finns en orange pennknapp på varje momentrad. När ett moment är kontrollerat klickar du på pennan och ritar din namnteckning direkt med fingret eller en pekpenna. Momentet blir grönt, låst och juridiskt signerat.',
    keyPoints: [
      'Klicka på pennan på momentraden för att öppna den digitala ritplattan',
      'Rita din namnteckning med pekfingret på mobilskärmen på 3 sekunder',
      'Ersätter blöta pappersprotokoll och skapar ett juridiskt bindande godkännande med tidsstämpel',
    ],
    visualType: 'SIGNATURE',
  },
  {
    id: 5,
    badge: 'Steg 5 av 8 • Raka vinklar & grund',
    title: 'Kryssmått & Pythagoras (3-4-5)',
    subtitle: 'Slipp sneda husgrunder och skeva altaner med automatisk räknare',
    description:
      'En sned gjutform eller grundmur kostar tiotusentals kronor att bila upp i efterhand. Med det inbyggda kryssmåttsverktyget matar du in Sida A och Sida B – appen räknar blixtsnabbt ut den exakta diagonalen med Pythagoras sats (A² + B² = C²) och hjälper dig kontrollera 90°-vinklar med 3-4-5 metoden.',
    keyPoints: [
      'Exakt beräkning med Pythagoras sats och toleranskontroll mot dina mätvärden',
      '3-4-5 snabbkontroll: Mät 3 m och 4 m längs sidorna – diagonalen ska vara exakt 5 m',
      'Måtten sparas automatiskt i projektet och skrivs med i PDF-protokollet',
      'Nås via menyn (☰) eller direkt från relevanta grund- och formmoment',
    ],
    visualType: 'CROSSMEASURE',
  },
  {
    id: 6,
    badge: 'Steg 6 av 8 • Minne i fickan',
    title: 'Fältblocket & Måttanteckningar',
    subtitle: 'Spara laserhöjder, rörfall, leveranser och telefonnummer på bygget',
    description:
      'Glöm papperslappar som blir blöta eller blåser bort i schaktgropen. Fältblocket är din digitala anteckningsbok, kopplad direkt till projektet. Här sparar du snabba laserhöjder, rörfall, maskintimmar och kontaktuppgifter till grävare eller betongbilar.',
    keyPoints: [
      'Färdiga kategorier: Mått & Höjd (laser/fall), Telefonnummer, Leveranser och Allmänt',
      'Smarta snabbknappar för laserhöjder (+42.15 RH), fall (10‰) och makadammängder',
      'Sparas automatiskt offline och synkas till molnet för resten av arbetslaget',
      'Kopiera noteringar direkt till SMS eller dela med kollegor med ett klick',
    ],
    visualType: 'FIELD_NOTES',
  },
  {
    id: 7,
    badge: 'Steg 7 av 8 • Skola & APL',
    title: 'Koppla ihop med din Yrkeslärare',
    subtitle: 'Digital handledning, återkoppling och godkännande direkt på APL',
    description:
      'Går du i skolan (Bygg- och anläggningsprogrammet) eller gör APL ute på ett företag? I FältKoll kan elever och yrkeslärare kopplas samman digitalt. Läraren kan se vad du bygger i fält, granska dina kontrollfoton och ge skriftlig återkoppling och godkännande i realtid.',
    keyPoints: [
      'Koppla till läraren med en enkel klasskod eller fältkod (t.ex. BYGG-2B)',
      'Läraren kan inspektera dina foton, mått och signaturer utan att behöva resa ut till gropen varje dag',
      'Få direkt skriftlig återkoppling och godkänt-stämpel på dina moment',
      'Yrkeslärare kan dela ut skräddarsydda övningsuppgifter och kontrollmoment',
    ],
    visualType: 'SCHOOL_TEACHER',
  },
  {
    id: 8,
    badge: 'Steg 8 av 8 • Samarbete & Verktyg',
    title: 'Molnsynk, Samarbete & Hamburgermenyn',
    subtitle: 'Jobba tillsammans, tidsmaskin och fler finurliga verktyg',
    description:
      'Jobba flera i samma bygge med automatisk molnsynk – dela projektet med en fältkod eller QR-kod. FältKoll har även tidsmaskin (versionshistorik), AMA-problemlösare och försynskontroll. Allt detta når du alltid via hamburgermenyn (☰) uppe till vänster!',
    keyPoints: [
      'Realtidssynk: När kollegan bockar av, fotar eller signerar uppdateras det direkt för alla',
      'Tidsmaskin & Historik: Se vem som ändrade vad och återskapa tidigare sparade versioner',
      'AMA Byggkrav & Försyn: Fackstöd för bärlager, dukar och förbesiktning av sockelsprickor före grävning',
      '4 smarta vyer (Lista, Tabell, Stora kort, Steg-vy) och professionell PDF-export',
      'Hamburgermenyn (☰): Klicka alltid uppe till vänster för att hitta alla verktyg och se om denna guide!',
    ],
    visualType: 'ALL_TOOLS_MENU',
  },
];

export const AppTutorialModal: React.FC<AppTutorialModalProps> = ({
  isOpen,
  onClose,
  onFinish,
  isInitialRegistration = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCompletionReminder, setShowCompletionReminder] = useState(false);
  const [hasStartedTutorial, setHasStartedTutorial] = useState(!isInitialRegistration);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setShowCompletionReminder(true);
    } else {
      setCurrentStepIndex((prev) => Math.min(TUTORIAL_STEPS.length - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleClose = () => {
    setShowCompletionReminder(false);
    if (onFinish) onFinish();
    onClose();
  };

  const handleSkip = () => {
    setShowCompletionReminder(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
      onClick={handleClose}
    >
      <div
        className="bg-[#121212] border-2 border-[#2b2b2b] rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl text-slate-200 overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#242424] bg-[#171717] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
              <HardHat className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>FältKoll • App-guide</span>
                {isInitialRegistration && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-black px-1.5 py-0.2 rounded font-mono">
                    Välkommen!
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Alla smarta funktioner och verktyg som underlättar ditt arbete
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showCompletionReminder && hasStartedTutorial && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-[#242424] transition-colors cursor-pointer"
              >
                Hoppa över
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-[#222] hover:bg-[#2c2c2c] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Stäng guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {!hasStartedTutorial && !showCompletionReminder ? (
            /* Välkomstfråga vid nyregistrering */
            <div className="py-4 sm:py-6 px-2 sm:px-4 text-center space-y-6 animate-in fade-in duration-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-orange-500/20 text-orange-400 border-2 border-orange-500/40 shadow-xl shadow-orange-500/10">
                <Sparkles className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full">
                  Välkommen som ny användare
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white pt-1">
                  Vill du se en snabb visuell guide?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Lär dig kryssmått med Pythagoras, fältblocket, finger-signering, hur du kopplar till lärare och synkar projekt i realtid.
                </p>
              </div>

              {/* Sammanfattning av de smarta finesserna i 6 rutor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-left max-w-xl mx-auto text-xs">
                <div className="p-3 rounded-xl bg-[#181818] border border-[#2a2a2a] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Projekt & Moment</div>
                    <div className="text-[11px] text-slate-400">Byggmallar & AMA-krav</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2a2a2a] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Kamera på raden</div>
                    <div className="text-[11px] text-slate-400">Tidsstämplat fotobevis</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-orange-500/30 bg-orange-500/5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-black flex items-center justify-center shrink-0 font-bold">
                    <PenTool className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="font-bold text-orange-300">Signera med finger</div>
                    <div className="text-[11px] text-slate-300">Godkänn direkt på skärmen</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-amber-500/30 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-300">Kryssmått & 3-4-5</div>
                    <div className="text-[11px] text-slate-400">Pythagoras vinkelräknare</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-teal-500/30 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-teal-300">Fältblocket</div>
                    <div className="text-[11px] text-slate-400">Mått, fall & telefonnr</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-emerald-500/30 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300">Skola & Molnsynk</div>
                    <div className="text-[11px] text-slate-400">Koppla lärare & jobba ihop</div>
                  </div>
                </div>
              </div>

              {/* Påminnelse om Hamburgermenyn i vänstra hörnet */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#161616] border border-[#2e2e2e] text-left max-w-xl mx-auto flex items-start gap-2.5 text-xs text-slate-300 shadow-inner">
                <Menu className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Bra att veta:</strong> Du kan när som helst se denna guide igen genom att klicka på <strong>hamburgermenyn (☰) uppe till vänster</strong>.
                </span>
              </div>

              {/* Val-knappar */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xl mx-auto w-full">
                <button
                  type="button"
                  onClick={() => setHasStartedTutorial(true)}
                  className="w-full sm:w-auto flex-1 min-h-[46px] px-6 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Ja, visa mig guiden</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompletionReminder(true)}
                  className="w-full sm:w-auto px-5 min-h-[46px] bg-[#1f1f1f] hover:bg-[#282828] text-slate-300 hover:text-white border border-[#333] text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Hoppa över för nu
                </button>
              </div>
            </div>
          ) : showCompletionReminder ? (
            /* Avslutande påminnelse om Hamburgermenyn och alla smarta funktioner */
            <div className="py-6 sm:py-8 px-4 text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Nu är du redo att köra igång!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Skapa ett nytt bygge eller öppna en befintlig egenkontroll och börja använda alla smarta verktyg direkt i fält.
                </p>
              </div>

              {/* Viktig påminnelse om hamburgermenyn (☰) uppe till vänster */}
              <div className="p-4 sm:p-5 rounded-2xl bg-orange-500/10 border-2 border-orange-500/40 text-left max-w-md mx-auto space-y-2 shadow-inner">
                <div className="flex items-center gap-2 text-orange-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <Menu className="w-4 h-4 stroke-[2.5]" />
                  <span>Kom ihåg hamburgermenyn (☰)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Vill du se denna tutorial igen, eller hitta <strong>kryssmått</strong>, <strong>fältblocket</strong>, <strong>lärarkopplingen</strong>, <strong>fotopärmen</strong> eller molnsynk?
                </p>
                <div className="p-2.5 rounded-xl bg-[#141414] border border-orange-500/30 flex items-center gap-2 text-xs font-bold text-orange-300">
                  <span className="w-6 h-6 rounded-lg bg-orange-500 text-black flex items-center justify-center text-xs font-black shrink-0">
                    ☰
                  </span>
                  <span>Klicka alltid på menyikonen i övre vänstra hörnet!</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full max-w-md min-h-[48px] px-6 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-sm rounded-xl cursor-pointer shadow-lg shadow-orange-500/20 transition-all mx-auto"
                >
                  Börja använda FältKoll nu
                </button>
              </div>
            </div>
          ) : (
            /* Ordinarie steg med bild och text */
            <>
              {/* Steg-indikator / framsteg */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-lg border border-orange-500/20">
                  {currentStep.badge}
                </span>
                <div className="flex items-center gap-1.5">
                  {TUTORIAL_STEPS.map((step, idx) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === currentStepIndex
                          ? 'w-6 bg-orange-500'
                          : idx < currentStepIndex
                          ? 'w-2 bg-emerald-500'
                          : 'w-2 bg-[#333]'
                      }`}
                      title={step.title}
                    />
                  ))}
                </div>
              </div>

              {/* Titel & Subtitle */}
              <div className="space-y-1">
                <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  {currentStep.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  {currentStep.subtitle}
                </p>
              </div>

              {/* Visuell illustration / Mockup för steget */}
              <div className="rounded-2xl border-2 border-[#262626] bg-[#0c0c0c] p-4 sm:p-5 shadow-inner overflow-hidden">
                {renderStepVisual(currentStep.visualType)}
              </div>

              {/* Textbeskrivning & Nyckelpunkter */}
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentStep.description}
                </p>

                <div className="space-y-2 pt-1">
                  {currentStep.keyPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-200"
                    >
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="leading-snug">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fälttips beroende på aktuellt steg */}
              {currentStep.visualType === 'CROSSMEASURE' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                  <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Byggarens 3-4-5-knep:</strong> Mät 3 meter på ena sidan och 4 meter på den andra. När diagonalen är exakt 5 meter vet du att du har en perfekt 90°-vinkel!
                  </span>
                </div>
              )}

              {currentStep.visualType === 'FIELD_NOTES' && (
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-2.5 text-xs text-teal-200">
                  <FileText className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tips för schaktbotten:</strong> Skriv upp laseravläsningen på formkanten i fältblocket så slipper du räkna om mot fixpunkten varje gång grävaren frågar.
                  </span>
                </div>
              )}

              {currentStep.visualType === 'SCHOOL_TEACHER' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
                  <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>För elever & APL:</strong> Be din yrkeslärare om klasskoden. När du kopplat koden kan läraren se dina framsteg i realtid och godkänna dina moment digitalt!
                  </span>
                </div>
              )}

              {currentStep.visualType === 'SIGNATURE' && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-2.5 text-xs text-orange-200">
                  <PenTool className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tips för mobilen:</strong> Du behöver ingen specialpenna – dra bara med pekfingret på skärmen så sparas din namnteckning med datum och klockslag.
                  </span>
                </div>
              )}

              {currentStep.visualType === 'ALL_TOOLS_MENU' && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-2.5 text-xs text-sky-200">
                  <Menu className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Hitta tillbaka:</strong> Klicka på hamburgermenyn (☰) uppe till vänster om du vill se denna guide igen eller nå fältblocket, kryssmått och molnsynk.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        {hasStartedTutorial && !showCompletionReminder && (
          <div className="px-5 py-3.5 border-t border-[#242424] bg-[#161616] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className={`min-h-[42px] px-4 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isFirst
                  ? 'border-transparent text-slate-600 opacity-40 cursor-not-allowed'
                  : 'bg-[#222] hover:bg-[#2c2c2c] text-slate-300 hover:text-white border-[#333] cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Föregående</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="min-h-[42px] px-5 sm:px-6 rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
            >
              <span>{isLast ? 'Slutför guide' : 'Nästa steg'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Hjälpfunktion för att rita stilrena, app-lika mockups för alla 8 steg
function renderStepVisual(type: TutorialStep['visualType']) {
  switch (type) {
    case 'PROJECTS':
      return (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-[#222] pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-orange-400" /> Mina Byggprojekt
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
              + Nytt bygge
            </span>
          </div>

          <div className="bg-[#181818] border border-orange-500/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Villagrund & Schaktbotten</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                85% Klart
              </span>
            </div>
            <div className="w-full bg-[#242424] h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-emerald-400 h-full w-[85%]" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>AMA Anläggning • 11 moment</span>
              <span>14 kontrollfoton sparade</span>
            </div>
          </div>
        </div>
      );

    case 'MOMENTS':
      return (
        <div className="space-y-2 font-sans">
          <div className="p-3 rounded-xl bg-[#181818] border border-[#2e2e2e] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-orange-400 bg-[#222] px-1.5 py-0.5 rounded">
                  Moment 2.1
                </span>
                <span className="font-bold text-xs text-white">Schaktbotten & Geotextil</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">AMA CBE.1</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Kontrollera schaktbotten mot fast mark. Rensa bort tjälfarlig lera och rulla ut fiberduk klass N2 med minst 0.5 m överlapp.
            </p>
            <div className="p-2 rounded-lg bg-[#111] border border-[#262626] flex items-center gap-2 text-[10px] text-amber-300">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span><strong>Yrkeslärarens fältråd:</strong> Lägg aldrig bärlagret direkt på blöt lera utan geotextil.</span>
            </div>
          </div>
        </div>
      );

    case 'CAMERA':
      return (
        <div className="space-y-2.5 font-sans">
          <div className="p-2.5 rounded-xl bg-[#181818] border border-[#2e2e2e] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-xs text-white truncate">
                2.2 Dräneringsledning & Fall
              </div>
              <div className="text-[10px] text-slate-400">
                Min 5‰ fall mot stenkista/brunn
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold text-xs flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                <span>Fota (2)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#1a1a1a] border border-[#333] p-2 flex flex-col justify-between h-20 relative overflow-hidden">
              <div className="text-[9px] font-mono text-emerald-400 bg-black/70 px-1 py-0.5 rounded w-max">
                ✓ Foto 1 • Fallmätning
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                2026-10-13 14:22
              </div>
            </div>
            <div className="rounded-lg bg-[#1a1a1a] border border-[#333] p-2 flex flex-col justify-between h-20 relative overflow-hidden">
              <div className="text-[9px] font-mono text-emerald-400 bg-black/70 px-1 py-0.5 rounded w-max">
                ✓ Foto 2 • Mätstock
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                2026-10-13 14:28
              </div>
            </div>
          </div>
        </div>
      );

    case 'SIGNATURE':
      return (
        <div className="space-y-2.5 font-sans">
          <div className="p-2.5 rounded-xl bg-[#181818] border border-orange-500/40 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-xs text-white truncate">
                3.1 Armering & Formstag
              </div>
              <div className="text-[10px] text-slate-400">
                Kontrollera täckskikt och bockning
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-orange-500 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/30">
              <PenTool className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Signera med finger</span>
            </div>
          </div>

          <div className="border border-dashed border-[#444] rounded-xl p-3 bg-[#111] text-center space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">
              Digital namnteckning (ritad med fingret)
            </div>
            <div className="h-12 flex items-center justify-center font-serif italic text-orange-400 text-lg font-bold tracking-widest">
              ✍️ Johan Bergqvist
            </div>
            <div className="text-[10px] font-mono text-emerald-400 font-bold">
              ✓ Godkänt & Låst • 2026-10-13 15:40
            </div>
          </div>
        </div>
      );

    case 'CROSSMEASURE':
      return (
        <div className="space-y-2.5 font-sans">
          <div className="p-3 rounded-xl bg-[#181818] border border-amber-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" /> Kryssmåttberäkning (Pythagoras)
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                ✓ 90.0° Vinkelrät
              </span>
            </div>

            {/* Måttvärden och beräkning */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
              <div className="p-2 rounded-lg bg-[#111] border border-[#2a2a2a]">
                <div className="text-[9px] text-slate-400">Sida A</div>
                <div className="text-xs font-bold text-white">8.00 m</div>
              </div>
              <div className="p-2 rounded-lg bg-[#111] border border-[#2a2a2a]">
                <div className="text-[9px] text-slate-400">Sida B</div>
                <div className="text-xs font-bold text-white">6.00 m</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/50">
                <div className="text-[9px] text-amber-300 font-bold">Diagonal C</div>
                <div className="text-xs font-black text-amber-400">10.00 m</div>
              </div>
            </div>

            {/* Formel & 3-4-5 visning */}
            <div className="p-2 rounded-lg bg-[#121212] border border-[#282828] flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-mono">
                Pythagoras: A² + B² = C² (64 + 36 = 100)
              </span>
              <span className="font-bold text-amber-400">3-4-5 metoden</span>
            </div>
          </div>
        </div>
      );

    case 'FIELD_NOTES':
      return (
        <div className="space-y-2.5 font-sans">
          <div className="p-3 rounded-xl bg-[#181818] border border-teal-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Fältblocket (Anteckningar)</span>
              </div>
              <span className="text-[10px] font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                Offline & Synkad
              </span>
            </div>

            {/* Flikar */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                Mått & Höjd
              </span>
              <span className="px-2 py-0.5 rounded bg-[#222] text-slate-400">Telefon</span>
              <span className="px-2 py-0.5 rounded bg-[#222] text-slate-400">Leverans</span>
            </div>

            {/* Exempel-anteckningar */}
            <div className="space-y-1.5 pt-1">
              <div className="p-2 rounded-lg bg-[#111] border border-[#262626] flex items-start justify-between text-[11px]">
                <div>
                  <div className="text-slate-200 font-mono font-bold">
                    📐 Sockel formkant: +42.85 m RH
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Laseravläst mot fixpunkt 1 • Kl 09:15
                  </div>
                </div>
                <span className="text-[9px] font-mono text-teal-400 bg-teal-950/60 px-1.5 py-0.5 rounded">
                  Kopiera
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#111] border border-[#262626] flex items-start justify-between text-[11px]">
                <div>
                  <div className="text-slate-200 font-mono font-bold">
                    🚛 14 ton kross 0-32 levererat
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Svevia bil #4 • Tippat vid garageinfart
                  </div>
                </div>
                <span className="text-[9px] font-mono text-slate-400">
                  Kl 10:30
                </span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'SCHOOL_TEACHER':
      return (
        <div className="space-y-2.5 font-sans">
          <div className="p-3 rounded-xl bg-[#181818] border border-emerald-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Skola & APL-koppling</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Kopplad till lärare
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#111] border border-[#292929] flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white">Göran Lindqvist</div>
                <div className="text-[10px] text-slate-400">
                  Yrkeslärare • Bygg & Anläggning
                </div>
              </div>
              <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/40 font-bold">
                Klass BYGG-2B
              </span>
            </div>

            {/* Lärarens återkoppling / inspektion */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Återkoppling från yrkesläraren:</span>
              </div>
              <p className="text-slate-300 text-[10px] italic leading-relaxed">
                ”Snyggt uppmätt schaktbotten och bra överlapp på fiberduken. Moment 2.1 är godkänt!”
              </p>
            </div>
          </div>
        </div>
      );

    case 'COLLABORATION_SYNC':
      return (
        <div className="space-y-2.5 font-sans">
          <div className="p-3 rounded-xl bg-[#181818] border border-sky-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>Grupparbete & Molnsynk</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                <span>Synkad i realtid</span>
              </span>
            </div>

            {/* Fältkod och anslutna */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#111] border border-[#2a2a2a]">
              <div>
                <div className="text-[9px] text-slate-400">Gemensam fältkod</div>
                <div className="font-mono text-xs font-black text-sky-400 tracking-wider">
                  SCHAKT-24
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-orange-500/30 text-orange-300 border border-orange-500/50 flex items-center justify-center text-[10px] font-bold">
                  Du
                </span>
                <span className="w-6 h-6 rounded-full bg-sky-500/30 text-sky-300 border border-sky-500/50 flex items-center justify-center text-[10px] font-bold">
                  EB
                </span>
                <span className="text-[10px] text-slate-400 font-bold">+1 i lag</span>
              </div>
            </div>

            {/* Tidsmaskin / versionshistorik */}
            <div className="p-2 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-between text-[10px]">
              <span className="text-slate-400 flex items-center gap-1">
                <History className="w-3 h-3 text-slate-400" />
                Tidsmaskin: Erik sparade foto kl 14:32
              </span>
              <span className="text-sky-400 font-bold">Återskapa</span>
            </div>
          </div>
        </div>
      );

    case 'ALL_TOOLS_MENU':
      return (
        <div className="space-y-2.5 font-sans">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-[#181818] border border-amber-500/30 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-white">AMA-Fackstöd</div>
                <div className="text-[9px] text-slate-400">Bärlager & toleranser</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#181818] border border-indigo-500/30 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Försyn & Skador</div>
                <div className="text-[9px] text-slate-400">Fota före schakt</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#181818] border border-emerald-500/30 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">4 Olika vyer</div>
                <div className="text-[9px] text-slate-400">Lista, tabell & kort</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#181818] border border-sky-500/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="font-bold text-white">PDF-Export</div>
                <div className="text-[9px] text-slate-400">Signerat protokoll</div>
              </div>
            </div>
          </div>

          {/* Menypåminnelse */}
          <div className="p-2.5 rounded-xl bg-[#141414] border border-orange-500/40 flex items-center gap-2.5 text-xs text-slate-300">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-black flex items-center justify-center font-black text-sm shrink-0">
              ☰
            </div>
            <div className="min-w-0">
              <div className="font-bold text-orange-300 text-[11px]">
                Hamburgermenyn (☰) uppe i vänstra hörnet
              </div>
              <div className="text-[10px] text-slate-400">
                Här når du alltid alla dessa smarta fältverktyg och guiden igen!
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
