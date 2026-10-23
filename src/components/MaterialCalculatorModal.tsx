import React, { useState } from 'react';
import {
  X,
  Calculator,
  Truck,
  Layers,
  Sparkles,
  Copy,
  Check,
  Save,
  Trash2,
  Info,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { FieldCalculationRecord, MaterialCategory, Project } from '../types';

interface MaterialCalculatorModalProps {
  onClose: () => void;
  project?: Project;
  onSaveCalculation?: (calc: FieldCalculationRecord) => void;
  onDeleteCalculation?: (calcId: string) => void;
  onInsertToNotes?: (text: string) => void;
}

interface KrossPreset {
  id: string;
  name: string;
  fraction: string;
  density: number; // ton / m3
  compaction: number; // t.ex. 20%
  description: string;
  defaultDepthCm: number;
}

const KROSS_PRESETS: KrossPreset[] = [
  {
    id: 'barlager',
    name: 'Bärlager',
    fraction: '0-32 mm',
    density: 1.80,
    compaction: 20,
    description: 'Bärande skikt under asfalt, marksten eller husgrund.',
    defaultDepthCm: 15,
  },
  {
    id: 'forstarkning',
    name: 'Förstärkningslager',
    fraction: '0-63 / 0-90 mm',
    density: 1.85,
    compaction: 20,
    description: 'Undre bärande lager vid sämre bärighet eller hög belastning.',
    defaultDepthCm: 30,
  },
  {
    id: 'dranering',
    name: 'Dräneringsmakadam',
    fraction: '8-16 mm (tvättad)',
    density: 1.50,
    compaction: 10,
    description: 'Kapillärbrytande skikt under platta eller runt dräneringsrör.',
    defaultDepthCm: 15,
  },
  {
    id: 'grof_makadam',
    name: 'Dräneringsmakadam grov',
    fraction: '16-32 mm',
    density: 1.50,
    compaction: 8,
    description: 'Dränerings- och fyllnadsskikt med hög vattengenomsläpplighet.',
    defaultDepthCm: 20,
  },
  {
    id: 'sattsand',
    name: 'Sättsand / Stenmjöl',
    fraction: '0-4 mm',
    density: 1.65,
    compaction: 15,
    description: 'Traditionellt avdragningslager under marksten och betongplattor (3 cm).',
    defaultDepthCm: 3,
  },
  {
    id: 'stenflis',
    name: 'Stenflis (Sättlager AMA DCB.32)',
    fraction: '2-4 / 2-5 mm',
    density: 1.55,
    compaction: 10,
    description: 'Dränerande och myrsäkert sättlager under marksten/plattor (3 cm). Rekommenderas av AMA.',
    defaultDepthCm: 3,
  },
  {
    id: 'matjord',
    name: 'Anläggningsjord / Matjord',
    fraction: 'Harpad matjord',
    density: 1.30,
    compaction: 20,
    description: 'Gräsytor och planteringar.',
    defaultDepthCm: 10,
  },
  {
    id: 'custom',
    name: 'Anpassat / Eget material',
    fraction: 'Valfri fraktion',
    density: 1.70,
    compaction: 15,
    description: 'Mata in egen densitet och packningsgrad.',
    defaultDepthCm: 10,
  },
];

interface StonePreset {
  id: string;
  name: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  piecesPerM2: number;
  description: string;
}

const STONE_PRESETS: StonePreset[] = [
  {
    id: 'byasten',
    name: 'Klassisk Marksten (Byasten)',
    lengthMm: 210,
    widthMm: 140,
    thicknessMm: 50,
    piecesPerM2: 34,
    description: 'Standardsten för uppfarter, gångar och uteplatser.',
  },
  {
    id: 'platta_350',
    name: 'Trädgårdsplatta 350',
    lengthMm: 350,
    widthMm: 350,
    thicknessMm: 50,
    piecesPerM2: 8.16,
    description: 'Vanlig kvadratisk platta för trädgårdsgångar och altaner.',
  },
  {
    id: 'platta_400',
    name: 'Slät Markplatta 400',
    lengthMm: 400,
    widthMm: 400,
    thicknessMm: 50,
    piecesPerM2: 6.25,
    description: 'Modern slät platta för uteplatser och entréer.',
  },
  {
    id: 'platta_500',
    name: 'Slät Storplatta 500',
    lengthMm: 500,
    widthMm: 500,
    thicknessMm: 50,
    piecesPerM2: 4.0,
    description: 'Större format för stilrena och generösa ytor.',
  },
  {
    id: 'gras_armering',
    name: 'Gräsarmering / H-sten',
    lengthMm: 200,
    widthMm: 165,
    thicknessMm: 80,
    piecesPerM2: 35,
    description: 'För parkeringsytor och tung belastning.',
  },
  {
    id: 'granithall',
    name: 'Granithäll 600x300',
    lengthMm: 600,
    widthMm: 300,
    thicknessMm: 60,
    piecesPerM2: 5.56,
    description: 'Natursten i slitstark granit för exklusiva ytor.',
  },
  {
    id: 'custom_stone',
    name: 'Eget format / Valfri sten',
    lengthMm: 200,
    widthMm: 100,
    thicknessMm: 50,
    piecesPerM2: 50,
    description: 'Ange egna dimensioner i millimeter.',
  },
];

interface SchaktSoilPreset {
  id: string;
  name: string;
  swellPercent: number; // Svällning fast till lös %
  looseDensity: number; // ton / lös m3
  description: string;
}

const SCHAKT_SOILS: SchaktSoilPreset[] = [
  {
    id: 'moran',
    name: 'Morän / Pinnmo / Normaljord',
    swellPercent: 25,
    looseDensity: 1.60,
    description: 'Vanligaste marktypen i Sverige. Fast morän sväller ca 25% vid schakt.',
  },
  {
    id: 'lera',
    name: 'Lera / Silt',
    swellPercent: 30,
    looseDensity: 1.50,
    description: 'Kohesionsjord som binder fukt och sväller kraftigt.',
  },
  {
    id: 'sand',
    name: 'Sand / Grus',
    swellPercent: 15,
    looseDensity: 1.70,
    description: 'Friktionsjord med lägre svällning.',
  },
  {
    id: 'berg',
    name: 'Sprängt berg / Stenblock',
    swellPercent: 50,
    looseDensity: 1.80,
    description: 'Fast berg ökar med 40-50% i volym efter sprängning eller knäckning.',
  },
  {
    id: 'matjord',
    name: 'Matjord / Torv',
    swellPercent: 20,
    looseDensity: 1.20,
    description: 'Lätta organiska massor som schaktas bort före underbyggnad.',
  },
];

export const MaterialCalculatorModal: React.FC<MaterialCalculatorModalProps> = ({
  onClose,
  project,
  onSaveCalculation,
  onDeleteCalculation,
  onInsertToNotes,
}) => {
  const [activeTab, setActiveTab] = useState<MaterialCategory>('MASSOR_KROSS');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // -------------------------------------------------------------
  // TAB 1: MASSOR & KROSS (Bärlager, Sättsand, Makadam)
  // -------------------------------------------------------------
  const [selectedKross, setSelectedKross] = useState<string>('barlager');
  const [inputModeKross, setInputModeKross] = useState<'AREA' | 'DIMENSIONS'>('AREA');
  const [areaM2Kross, setAreaM2Kross] = useState<string>('50');
  const [lengthMKross, setLengthMKross] = useState<string>('10.0');
  const [widthMKross, setWidthMKross] = useState<string>('5.0');
  const [depthCmKross, setDepthCmKross] = useState<string>('15');
  const [customDensityKross, setCustomDensityKross] = useState<string>('1.80');
  const [customCompactionKross, setCustomCompactionKross] = useState<string>('20');

  const currentKrossPreset = KROSS_PRESETS.find((p) => p.id === selectedKross) || KROSS_PRESETS[0];
  const activeDensity = selectedKross === 'custom'
    ? parseFloat(customDensityKross) || 1.8
    : currentKrossPreset.density;
  const activeCompaction = selectedKross === 'custom'
    ? parseFloat(customCompactionKross) || 20
    : currentKrossPreset.compaction;

  const krossArea = inputModeKross === 'AREA'
    ? parseFloat(areaM2Kross) || 0
    : (parseFloat(lengthMKross) || 0) * (parseFloat(widthMKross) || 0);
  const krossDepthM = (parseFloat(depthCmKross) || 0) / 100;

  // Net compact volume (m3)
  const krossNetVolumeM3 = krossArea * krossDepthM;
  // Loose volume including compaction factor
  const krossCompactionFactor = 1 + activeCompaction / 100;
  const krossLooseVolumeM3 = krossNetVolumeM3 * krossCompactionFactor;
  // Total weight in tons
  const krossTotalTons = krossLooseVolumeM3 * activeDensity;

  // Truck loads
  const krossTruckBoogie = Math.ceil(krossTotalTons / 13); // 13 ton standard boogie
  const krossTruckTridem = Math.ceil(krossTotalTons / 17); // 17 ton tridem
  const krossTruckTrailer = Math.ceil(krossTotalTons / 28); // 28 ton kassett / släp

  // -------------------------------------------------------------
  // TAB 2: MARKSTEN & PLATTOR
  // -------------------------------------------------------------
  const [selectedStone, setSelectedStone] = useState<string>('byasten');
  const [inputModeStone, setInputModeStone] = useState<'AREA' | 'DIMENSIONS'>('AREA');
  const [areaM2Stone, setAreaM2Stone] = useState<string>('45');
  const [lengthMStone, setLengthMStone] = useState<string>('9.0');
  const [widthMStone, setWidthMStone] = useState<string>('5.0');
  const [wastePercentStone, setWastePercentStone] = useState<string>('7'); // 5-10% standard
  const [includeBeddingSand, setIncludeBeddingSand] = useState<boolean>(true);
  const [beddingDepthCm, setBeddingDepthCm] = useState<string>('3.5');
  const [jointSandType, setJointSandType] = useState<'NORMAL' | 'HARD'>('NORMAL');

  // Custom stone dimensions
  const [customStoneLength, setCustomStoneLength] = useState<string>('210');
  const [customStoneWidth, setCustomStoneWidth] = useState<string>('140');
  const [customStoneThick, setCustomStoneThick] = useState<string>('50');

  const currentStonePreset = STONE_PRESETS.find((s) => s.id === selectedStone) || STONE_PRESETS[0];
  const stoneArea = inputModeStone === 'AREA'
    ? parseFloat(areaM2Stone) || 0
    : (parseFloat(lengthMStone) || 0) * (parseFloat(widthMStone) || 0);

  let piecesPerM2 = currentStonePreset.piecesPerM2;
  if (selectedStone === 'custom_stone') {
    const l = (parseFloat(customStoneLength) || 200) / 1000;
    const w = (parseFloat(customStoneWidth) || 100) / 1000;
    piecesPerM2 = l > 0 && w > 0 ? 1 / (l * w) : 34;
  }

  const wastePercent = parseFloat(wastePercentStone) || 0;
  const stoneCountNet = Math.round(stoneArea * piecesPerM2);
  const stoneCountGross = Math.ceil(stoneCountNet * (1 + wastePercent / 100));
  const palletsNeeded = Math.ceil((stoneArea * (1 + wastePercent / 100)) / 10.5); // ca 10.5 m2 per pall

  // Joint sand calculation
  // Normal sand ~ 2.5 kg/m2, Hard polymer sand ~ 3.5 kg/m2
  const jointKgPerM2 = jointSandType === 'NORMAL' ? 2.5 : 3.8;
  const jointSandTotalKg = Math.round(stoneArea * jointKgPerM2);
  const jointSandBags20kg = Math.ceil(jointSandTotalKg / 20);

  // Bedding sand 0-4 mm
  const beddingDepthM = (parseFloat(beddingDepthCm) || 3.5) / 100;
  const beddingSandNetM3 = stoneArea * beddingDepthM;
  const beddingSandLooseM3 = beddingSandNetM3 * 1.15; // 15% packning
  const beddingSandTons = beddingSandLooseM3 * 1.65; // 1.65 ton/m3

  // -------------------------------------------------------------
  // TAB 3: SCHAKT & SVÄLLNING (Borttransport)
  // -------------------------------------------------------------
  const [selectedSoil, setSelectedSoil] = useState<string>('moran');
  const [schaktLengthM, setSchaktLengthM] = useState<string>('12.0');
  const [schaktWidthM, setSchaktWidthM] = useState<string>('6.0');
  const [schaktDepthM, setSchaktDepthM] = useState<string>('0.40');

  const currentSoilPreset = SCHAKT_SOILS.find((s) => s.id === selectedSoil) || SCHAKT_SOILS[0];
  const sLen = parseFloat(schaktLengthM) || 0;
  const sWid = parseFloat(schaktWidthM) || 0;
  const sDep = parseFloat(schaktDepthM) || 0;

  const schaktFastVolumeM3 = sLen * sWid * sDep;
  const schaktLooseVolumeM3 = schaktFastVolumeM3 * (1 + currentSoilPreset.swellPercent / 100);
  const schaktTotalTons = schaktLooseVolumeM3 * currentSoilPreset.looseDensity;

  const schaktTruckBoogie = Math.ceil(schaktTotalTons / 13);
  const schaktTruckTridem = Math.ceil(schaktTotalTons / 17);
  const schaktTruckTrailer = Math.ceil(schaktTotalTons / 28);

  // -------------------------------------------------------------
  // SAMMANFATTNING & ACTIONS
  // -------------------------------------------------------------
  const generateCurrentSummary = (): { title: string; text: string; details: any } => {
    if (activeTab === 'MASSOR_KROSS') {
      const title = `${currentKrossPreset.name} (${currentKrossPreset.fraction}): ${krossTotalTons.toFixed(1)} ton`;
      const text = `FÄLTKALKYL: KROSS & MASSOR
Material: ${currentKrossPreset.name} ${currentKrossPreset.fraction}
Yta: ${krossArea.toFixed(1)} m² | Tjocklek: ${depthCmKross} cm
Fast volym: ${krossNetVolumeM3.toFixed(2)} m³
Packningsmån: +${activeCompaction}% -> Lös volym: ${krossLooseVolumeM3.toFixed(2)} m³
Densitet: ${activeDensity.toFixed(2)} t/m³ -> TOTALVIKT: ${krossTotalTons.toFixed(1)} ton
Erforderlig transport:
• 13t boogie: ${krossTruckBoogie} lass
• 17t tridem: ${krossTruckTridem} lass
• 28t bil & släp: ${krossTruckTrailer} lass`;
      return {
        title,
        text,
        details: {
          materialName: `${currentKrossPreset.name} ${currentKrossPreset.fraction}`,
          areaM2: krossArea,
          depthCm: parseFloat(depthCmKross),
          volumeM3: Number(krossNetVolumeM3.toFixed(2)),
          looseVolumeM3: Number(krossLooseVolumeM3.toFixed(2)),
          compactionPercent: activeCompaction,
          densityTonM3: activeDensity,
          totalWeightTons: Number(krossTotalTons.toFixed(1)),
          truckLoadsBoogie: krossTruckBoogie,
          truckLoadsTridem: krossTruckTridem,
          truckLoadsTrailer: krossTruckTrailer,
        },
      };
    } else if (activeTab === 'MARKSTEN_PLATTOR') {
      const title = `${currentStonePreset.name}: ${stoneCountGross} st (${stoneArea.toFixed(1)} m²)`;
      const text = `FÄLTKALKYL: MARKSTEN & PLATTOR
Stenformat: ${currentStonePreset.name} (${piecesPerM2.toFixed(1)} st/m²)
Läggningsyta: ${stoneArea.toFixed(1)} m² | Spillmån: ${wastePercent}%
Antal stenar netto: ${stoneCountNet} st
TOTALT INKL. SPILL: ${stoneCountGross} st (ca ${palletsNeeded} pallar á ~10.5 m²)
Fogsand (${jointSandType === 'NORMAL' ? 'Standard 0-2 mm' : 'Hård polymersand'}):
• Totalt: ${jointSandTotalKg} kg (ca ${jointSandBags20kg} st 20-kilos säckar)
${
  includeBeddingSand
    ? `Sättsand 0-4 mm (${beddingDepthCm} cm sättlager):
• Volym: ${beddingSandLooseM3.toFixed(2)} m³ (${beddingSandTons.toFixed(1)} ton)`
    : ''
}`;
      return {
        title,
        text,
        details: {
          stoneFormat: currentStonePreset.name,
          areaM2: stoneArea,
          wastePercent,
          stoneCountNet,
          stoneCountGross,
          pallets: palletsNeeded,
          jointSandKg: jointSandTotalKg,
          beddingSandTons: includeBeddingSand ? Number(beddingSandTons.toFixed(1)) : undefined,
          beddingSandM3: includeBeddingSand ? Number(beddingSandLooseM3.toFixed(2)) : undefined,
        },
      };
    } else {
      const title = `Schaktning & Borttransport: ${schaktLooseVolumeM3.toFixed(1)} m³ (${schaktTotalTons.toFixed(1)} ton)`;
      const text = `FÄLTKALKYL: SCHAKT & BORTTRANSPORT
Massor: ${currentSoilPreset.name}
Mått: ${sLen} × ${sWid} m | Medeldjup: ${sDep} m
Fast schaktvolym: ${schaktFastVolumeM3.toFixed(1)} m³
Svällningsgrad: +${currentSoilPreset.swellPercent}% -> Lös transportvolym: ${schaktLooseVolumeM3.toFixed(1)} m³
Uppskattad vikt: ${schaktTotalTons.toFixed(1)} ton
Erforderlig borttransport:
• 13t boogie: ${schaktTruckBoogie} lass
• 17t tridem: ${schaktTruckTridem} lass
• 28t kassettekipage: ${schaktTruckTrailer} lass`;
      return {
        title,
        text,
        details: {
          materialName: currentSoilPreset.name,
          lengthM: sLen,
          widthM: sWid,
          depthCm: Math.round(sDep * 100),
          volumeM3: Number(schaktFastVolumeM3.toFixed(1)),
          looseVolumeM3: Number(schaktLooseVolumeM3.toFixed(1)),
          compactionPercent: currentSoilPreset.swellPercent,
          totalWeightTons: Number(schaktTotalTons.toFixed(1)),
          truckLoadsBoogie: schaktTruckBoogie,
          truckLoadsTridem: schaktTruckTridem,
          truckLoadsTrailer: schaktTruckTrailer,
        },
      };
    }
  };

  const handleCopySummary = () => {
    const { text } = generateCurrentSummary();
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToProject = () => {
    if (!onSaveCalculation) return;
    const { title, text, details } = generateCurrentSummary();
    const newCalc: FieldCalculationRecord = {
      id: `calc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toLocaleString('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      category: activeTab,
      title,
      summary: text,
      details,
    };
    onSaveCalculation(newCalc);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendToNotes = () => {
    if (!onInsertToNotes) return;
    const { text } = generateCurrentSummary();
    onInsertToNotes(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const savedCalculations = project?.fieldCalculations || [];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#10131c] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#151c2d] to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Calculator className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Fältkalkyler & Materialberäknare</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase tracking-wider">
                  AMA & Fältstandard
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Massor, packningsgrad, marksten, spill, ton & lastbilsflak direkt i mobilen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation med tydlig sektionsrubrik */}
        <div className="border-b border-slate-800 bg-slate-950/80 p-2 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Kalkylatorflikar (3 fältberäknare):</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Välj flik för att byta verktyg
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('MASSOR_KROSS')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                activeTab === 'MASSOR_KROSS'
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black ring-1 ring-amber-400/50'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>1. Kross & Bärlager</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MARKSTEN_PLATTOR')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                activeTab === 'MARKSTEN_PLATTOR'
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black ring-1 ring-amber-400/50'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>2. Marksten & Plattor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SCHAKT_SVALLNING')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                activeTab === 'SCHAKT_SVALLNING'
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black ring-1 ring-amber-400/50'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>3. Schakt & Bortforsling</span>
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: KROSS & BÄRLAGER */}
          {activeTab === 'MASSOR_KROSS' && (
            <div className="space-y-4">
              {/* Välj material */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                  1. Välj krossmaterial & fraktion
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {KROSS_PRESETS.map((preset) => {
                    const isSelected = selectedKross === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedKross(preset.id);
                          if (preset.id !== 'custom') {
                            setDepthCmKross(String(preset.defaultDepthCm));
                          }
                        }}
                        className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{preset.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </div>
                        <div className="text-[11px] text-orange-300/80 font-mono mt-0.5">
                          {preset.fraction}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {preset.density} t/m³ • +{preset.compaction}% packning
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inmatning: Mått & Tjocklek */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Yta & Packat lagerdjup
                  </span>
                  <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setInputModeKross('AREA')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                        inputModeKross === 'AREA'
                          ? 'bg-orange-500 text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ange m² direkt
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputModeKross('DIMENSIONS')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                        inputModeKross === 'DIMENSIONS'
                          ? 'bg-orange-500 text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Längd × Bredd
                    </button>
                  </div>
                </div>

                {inputModeKross === 'AREA' ? (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Total yta som ska täckas (m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={areaM2Kross}
                        onChange={(e) => setAreaM2Kross(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                        placeholder="t.ex. 60"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">m²</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Längd (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={lengthMKross}
                        onChange={(e) => setLengthMKross(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Bredd (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={widthMKross}
                        onChange={(e) => setWidthMKross(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Packat lagerdjup efter vibrering (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={depthCmKross}
                        onChange={(e) => setDepthCmKross(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                        placeholder="t.ex. 15"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">cm</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Standard: Bärlager 15 cm • Förstärkning 30 cm • Sättsand 3-4 cm
                    </span>
                  </div>

                  {selectedKross === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Densitet (t/m³)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={customDensityKross}
                          onChange={(e) => setCustomDensityKross(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Packning (%)</label>
                        <input
                          type="number"
                          step="1"
                          value={customCompactionKross}
                          onChange={(e) => setCustomCompactionKross(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resultat Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#182030] to-[#0d121c] border border-orange-500/40 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Kalkylresultat: {currentKrossPreset.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Yta: {krossArea.toFixed(1)} m²
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Fast volym (netto)
                    </span>
                    <span className="text-base font-black text-white font-mono">
                      {krossNetVolumeM3.toFixed(2)} m³
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Lös volym (+{activeCompaction}%)
                    </span>
                    <span className="text-base font-black text-amber-300 font-mono">
                      {krossLooseVolumeM3.toFixed(2)} m³
                    </span>
                  </div>

                  <div className="bg-orange-500/20 p-2.5 rounded-lg border border-orange-500/50 col-span-2 sm:col-span-2">
                    <span className="text-[10px] text-orange-300 uppercase font-bold block">
                      Erforderlig vikt att beställa
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-orange-400 font-mono">
                      {krossTotalTons.toFixed(1)} TON
                    </span>
                  </div>
                </div>

                {/* Lastbilsflak */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Truck className="w-4 h-4 text-slate-300" />
                    Transportbehov:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-950 px-2 py-1 rounded text-slate-300 font-mono border border-slate-800">
                      13t boogie: <strong className="text-white">{krossTruckBoogie} lass</strong>
                    </span>
                    <span className="bg-slate-950 px-2 py-1 rounded text-slate-300 font-mono border border-slate-800">
                      17t tridem: <strong className="text-white">{krossTruckTridem} lass</strong>
                    </span>
                    <span className="bg-slate-950 px-2 py-1 rounded text-slate-300 font-mono border border-slate-800">
                      28t bil & släp: <strong className="text-white">{krossTruckTrailer} lass</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARKSTEN & PLATTOR */}
          {activeTab === 'MARKSTEN_PLATTOR' && (
            <div className="space-y-4">
              {/* Välj format */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                  1. Välj sten- / plattformat
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STONE_PRESETS.map((stone) => {
                    const isSelected = selectedStone === stone.id;
                    return (
                      <button
                        key={stone.id}
                        type="button"
                        onClick={() => setSelectedStone(stone.id)}
                        className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{stone.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </div>
                        <div className="text-[11px] text-orange-300/80 font-mono mt-0.5">
                          {stone.lengthMm} × {stone.widthMm} × {stone.thicknessMm} mm
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {stone.piecesPerM2} st / m²
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedStone === 'custom_stone' && (
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Längd (mm)</label>
                    <input
                      type="number"
                      value={customStoneLength}
                      onChange={(e) => setCustomStoneLength(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Bredd (mm)</label>
                    <input
                      type="number"
                      value={customStoneWidth}
                      onChange={(e) => setCustomStoneWidth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Tjocklek (mm)</label>
                    <input
                      type="number"
                      value={customStoneThick}
                      onChange={(e) => setCustomStoneThick(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Yta & Spill */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Läggningsyta & Spillmån
                  </span>
                  <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setInputModeStone('AREA')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                        inputModeStone === 'AREA'
                          ? 'bg-orange-500 text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ange m² direkt
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputModeStone('DIMENSIONS')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                        inputModeStone === 'DIMENSIONS'
                          ? 'bg-orange-500 text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Längd × Bredd
                    </button>
                  </div>
                </div>

                {inputModeStone === 'AREA' ? (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Total läggningsyta (m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={areaM2Stone}
                        onChange={(e) => setAreaM2Stone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">m²</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Längd (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={lengthMStone}
                        onChange={(e) => setLengthMStone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Bredd (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={widthMStone}
                        onChange={(e) => setWidthMStone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Spillmån snabbknappar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400">
                      Spillmån för kapningar och passbitar
                    </label>
                    <span className="text-xs font-mono font-bold text-orange-400">{wastePercent}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { val: '3', label: '3% Rak/enkel' },
                      { val: '5', label: '5% Standard' },
                      { val: '8', label: '8% Vinklar' },
                      { val: '12', label: '12% Kurvor' },
                    ].map((sp) => (
                      <button
                        key={sp.val}
                        type="button"
                        onClick={() => setWastePercentStone(sp.val)}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          wastePercentStone === sp.val
                            ? 'bg-orange-500 text-black border-orange-400 font-black'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sättsand & Fog */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 font-bold block mb-1">
                      Fogsandstyp
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setJointSandType('NORMAL')}
                        className={`p-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          jointSandType === 'NORMAL'
                            ? 'bg-orange-500 text-black border-orange-400 font-black'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Standard 0-2 mm (2.5 kg/m²)
                      </button>
                      <button
                        type="button"
                        onClick={() => setJointSandType('HARD')}
                        className={`p-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          jointSandType === 'HARD'
                            ? 'bg-orange-500 text-black border-orange-400 font-black'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Hård ogräsfog (3.8 kg/m²)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-300 font-bold">
                        Räkna med sättsand 0-4 mm
                      </label>
                      <input
                        type="checkbox"
                        checked={includeBeddingSand}
                        onChange={(e) => setIncludeBeddingSand(e.target.checked)}
                        className="w-4 h-4 accent-orange-500 rounded"
                      />
                    </div>
                    {includeBeddingSand && (
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          value={beddingDepthCm}
                          onChange={(e) => setBeddingDepthCm(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                          placeholder="3.5"
                        />
                        <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-bold">
                          cm djup
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resultat Marksten */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#182030] to-[#0d121c] border border-orange-500/40 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Beställningsunderlag: {currentStonePreset.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Yta: {stoneArea.toFixed(1)} m²
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Netto antal sten
                    </span>
                    <span className="text-base font-black text-white font-mono">
                      {stoneCountNet} st
                    </span>
                  </div>

                  <div className="bg-orange-500/20 p-2.5 rounded-lg border border-orange-500/50">
                    <span className="text-[10px] text-orange-300 uppercase font-bold block">
                      Beställ (+{wastePercent}% spill)
                    </span>
                    <span className="text-xl font-black text-orange-400 font-mono">
                      {stoneCountGross} st
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Uppskattat antal pall
                    </span>
                    <span className="text-base font-black text-amber-300 font-mono">
                      ~{palletsNeeded} pallar
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Fogsand
                    </span>
                    <span className="text-base font-black text-sky-300 font-mono">
                      {jointSandTotalKg} kg
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      ({jointSandBags20kg} säckar á 20kg)
                    </span>
                  </div>
                </div>

                {includeBeddingSand && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">
                      Sättsand 0-4 mm ({beddingDepthCm} cm):
                    </span>
                    <span className="text-amber-300 font-mono font-bold">
                      {beddingSandLooseM3.toFixed(2)} m³ • {beddingSandTons.toFixed(1)} ton
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SCHAKT & BORTFORSLING */}
          {activeTab === 'SCHAKT_SVALLNING' && (
            <div className="space-y-4">
              {/* Jordtyp */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                  1. Välj schaktmassornas art & svällningsgrad
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SCHAKT_SOILS.map((soil) => {
                    const isSelected = selectedSoil === soil.id;
                    return (
                      <button
                        key={soil.id}
                        type="button"
                        onClick={() => setSelectedSoil(soil.id)}
                        className={`p-3 rounded-xl text-left border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{soil.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">
                            +{soil.swellPercent}% svällning
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{soil.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schaktmått */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  2. Schaktgropens mått
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Längd (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={schaktLengthM}
                      onChange={(e) => setSchaktLengthM(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Bredd (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={schaktWidthM}
                      onChange={(e) => setSchaktWidthM(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Medeldjup (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={schaktDepthM}
                      onChange={(e) => setSchaktDepthM(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Resultat Schakt */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#182030] to-[#0d121c] border border-orange-500/40 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Transportkalkyl: {currentSoilPreset.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Schaktyta: {(sLen * sWid).toFixed(1)} m²
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Fast volym i mark
                    </span>
                    <span className="text-base font-black text-white font-mono">
                      {schaktFastVolumeM3.toFixed(1)} m³
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Svälld volym på flak
                    </span>
                    <span className="text-base font-black text-amber-300 font-mono">
                      {schaktLooseVolumeM3.toFixed(1)} m³
                    </span>
                  </div>

                  <div className="bg-orange-500/20 p-2.5 rounded-lg border border-orange-500/50 col-span-2">
                    <span className="text-[10px] text-orange-300 uppercase font-bold block">
                      Total uppskattad bortforsling
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-orange-400 font-mono">
                      {schaktTotalTons.toFixed(1)} TON
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Truck className="w-4 h-4 text-slate-300" />
                    Flakbehov för bortforsling:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-950 px-2 py-1 rounded text-slate-300 font-mono border border-slate-800">
                      13t boogie: <strong className="text-white">{schaktTruckBoogie} lass</strong>
                    </span>
                    <span className="bg-slate-950 px-2 py-1 rounded text-slate-300 font-mono border border-slate-800">
                      17t tridem: <strong className="text-white">{schaktTruckTridem} lass</strong>
                    </span>
                    <span className="bg-slate-950 px-2 py-1 rounded text-slate-300 font-mono border border-slate-800">
                      28t bil & släp: <strong className="text-white">{schaktTruckTrailer} lass</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sparade kalkyler i projektet */}
          {savedCalculations.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Sparade materialberäkningar i projektet ({savedCalculations.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {savedCalculations.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-400">{c.createdAt}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(c.summary);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Kopiera sammanfattning"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteCalculation && (
                        <button
                          type="button"
                          onClick={() => onDeleteCalculation(c.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          title="Ta bort sparad kalkyl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Kopierad!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kopiera kalkyl</span>
                </>
              )}
            </button>

            {onInsertToNotes && (
              <button
                type="button"
                onClick={handleSendToNotes}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Klistra in kalkylen i projektets fältblock"
              >
                <span>Till Fältblocket</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onSaveCalculation && (
              <button
                type="button"
                onClick={handleSaveToProject}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Sparad i projektet!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 stroke-[2.2]" />
                    <span>Spara i projektet</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold cursor-pointer"
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
