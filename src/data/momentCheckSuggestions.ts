// Realistic Swedish construction egenkontroller according to AMA Anläggning & AMA Hus
export interface CheckSuggestion {
  id: string;
  label: string;
  category: 'LASER_MÅTT' | 'MATERIAL' | 'KVALITET' | 'SÄKERHET';
}

export const MOMENT_CHECK_SUGGESTIONS: Record<string, CheckSuggestion[]> = {
  // 1.1 Ledningskoll & Utsättning
  '1.1': [
    { id: '1.1_1', label: 'Ledningskollen genomförd och svar mottaget', category: 'SÄKERHET' },
    { id: '1.1_2', label: 'Elkabel, fiber & VA utmärkta på marken', category: 'SÄKERHET' },
    { id: '1.1_3', label: 'Profilställningar monterade utanför schakt', category: 'KVALITET' },
    { id: '1.1_4', label: 'Kryssmått kontrollerat (diff < 5 mm)', category: 'LASER_MÅTT' },
    { id: '1.1_5', label: 'Fast fixpunkt (referenshöjd) etablerad', category: 'LASER_MÅTT' },
  ],
  // 1.2 Avtäckning & Matjordsschakt
  '1.2': [
    { id: '1.2_1', label: 'All matjord avtäckt till minst 1,5m utanför sockel', category: 'KVALITET' },
    { id: '1.2_2', label: 'Matjord lagd i separat upplag utan föroreningar', category: 'MATERIAL' },
    { id: '1.2_3', label: 'Inga rötter eller stubbar kvar i schaktbotten', category: 'KVALITET' },
    { id: '1.2_4', label: 'Schaktlutning anordnad så regnvatten avleds', category: 'LASER_MÅTT' },
  ],
  // 1.3 Schaktbotten & Bärighet
  '1.3': [
    { id: '1.3_1', label: 'Schaktbotten avvägd mot laser med millimeterprecision', category: 'LASER_MÅTT' },
    { id: '1.3_2', label: 'Fast orörd mineraljord / berg framgrävt', category: 'KVALITET' },
    { id: '1.3_3', label: 'Bärighet okulärbesiktigad (inget gung eller lersoppa)', category: 'KVALITET' },
    { id: '1.3_4', label: 'Mjuk lera urschaktad och ersatt med kross', category: 'MATERIAL' },
  ],
  // 1.4 Geotextil (Fiberduk)
  '1.4': [
    { id: '1.4_1', label: 'Geotextil klass N2/N3 utrullad heltäckande', category: 'MATERIAL' },
    { id: '1.4_2', label: 'Minst 50 cm överlapp i alla skarvar', category: 'KVALITET' },
    { id: '1.4_3', label: 'Duken uppdragen minst 30 cm mot schaktkant', category: 'KVALITET' },
    { id: '1.4_4', label: 'Inga revor eller stenar som punkterat duken', category: 'SÄKERHET' },
  ],
  // 1.5 Dräneringsrör & Fall
  '1.5': [
    { id: '1.5_1', label: 'Dränrör lagt under kantbalkens underkant', category: 'LASER_MÅTT' },
    { id: '1.5_2', label: 'Kontinuerligt fall mot brunn (minst 5 mm/m)', category: 'LASER_MÅTT' },
    { id: '1.5_3', label: 'Rör omslutet av minst 15 cm tvättad makadam 8-16', category: 'MATERIAL' },
    { id: '1.5_4', label: 'Dräneringsrör omsvept med fiberduk (inget slam)', category: 'KVALITET' },
  ],
  // 1.6 Dagvattenrör & Spolbrunnar
  '1.6': [
    { id: '1.6_1', label: 'Täta orange markrör 110 mm monterade för takvatten', category: 'MATERIAL' },
    { id: '1.6_2', label: 'Dagvatten helt separerat från dräneringssystem', category: 'SÄKERHET' },
    { id: '1.6_3', label: 'Rens- och spolbrunnar monterade i hörn med lock', category: 'KVALITET' },
    { id: '1.6_4', label: 'Fall mot dagvattenbrunn kontrollerat (minst 10‰)', category: 'LASER_MÅTT' },
  ],
  // 1.7 Bottenavlopp & Spillvatten
  '1.7': [
    { id: '1.7_1', label: 'Avloppsrör lagda med fall 1:50 till 1:100 (1-2 cm/m)', category: 'LASER_MÅTT' },
    { id: '1.7_2', label: 'Rör fixerade i makadam så fall inte rubbas', category: 'KVALITET' },
    { id: '1.7_3', label: 'Provspolat och täthetskontrollerat utan läckage', category: 'KVALITET' },
    { id: '1.7_4', label: 'Rörproppar monterade i alla avstick inför gjutning', category: 'SÄKERHET' },
  ],
  // 1.8 Kapillärbrytande makadambädd
  '1.8': [
    { id: '1.8_1', label: 'Tvättad makadam fraktion 8-16 mm utlagd', category: 'MATERIAL' },
    { id: '1.8_2', label: 'Packad i skikt om max 20 cm med markvibrator (min 4 överfarter)', category: 'KVALITET' },
    { id: '1.8_3', label: 'Laseravvägd planhet (tolerans ± 5 mm)', category: 'LASER_MÅTT' },
    { id: '1.8_4', label: 'Total bäddtjocklek minst 150-200 mm', category: 'LASER_MÅTT' },
  ],
  // 1.9 Kantelement & Utsättning
  '1.9': [
    { id: '1.9_1', label: 'Kantelement uppställda i rak linje mot profilsnöre', category: 'LASER_MÅTT' },
    { id: '1.9_2', label: 'Kryssmått och räta vinklar kontrollerade', category: 'LASER_MÅTT' },
    { id: '1.9_3', label: 'Hörnelement låsta med skarvplåtar/plastlås', category: 'KVALITET' },
    { id: '1.9_4', label: 'Mothåll och stöttor monterade mot betongtryck', category: 'SÄKERHET' },
  ],
  // 1.10 Cellplastisolering
  '1.10': [
    { id: '1.10_1', label: 'Cellplast EPS/XPS lagd i förband (min 200 mm skarvförskjutning)', category: 'KVALITET' },
    { id: '1.10_2', label: 'Isoleringstjocklek enligt konstruktionsritning (t.ex. 300 mm)', category: 'MATERIAL' },
    { id: '1.10_3', label: 'Inga genomgående glipor mellan skivorna', category: 'KVALITET' },
    { id: '1.10_4', label: 'Extra tryckhållfast XPS lagd under bärande väggar/pelare', category: 'MATERIAL' },
  ],
  // 1.11 Radonspärr & Tätning
  '1.11': [
    { id: '1.11_1', label: 'Radonslang perforerad förlagd i makadambädd', category: 'MATERIAL' },
    { id: '1.11_2', label: 'Tätmanschetter monterade och tejpade runt alla rör', category: 'KVALITET' },
    { id: '1.11_3', label: 'Åldersbeständig folie lagd med minst 300 mm tejpade skarvar', category: 'KVALITET' },
    { id: '1.11_4', label: 'Genomföringar för el och inkommande vatten gastäta', category: 'SÄKERHET' },
  ],
  // 1.12 Armering & Najning
  '1.12': [
    { id: '1.12_1', label: 'Armeringsstolar (distanser) utplacerade 3-4 st/m²', category: 'KVALITET' },
    { id: '1.12_2', label: 'Armeringsjärn i kantbalk najade enligt armeringsritning', category: 'KVALITET' },
    { id: '1.12_3', label: 'Armeringsnät med minst 1-2 rutors överlapp i skarv', category: 'MATERIAL' },
    { id: '1.12_4', label: 'Täckskikt betong min 30-35 mm säkrat runt all armering', category: 'LASER_MÅTT' },
    { id: '1.12_5', label: 'Extra hörnjärn och kantskor monterade i alla ytterhörn', category: 'KVALITET' },
  ],
  // 1.13 Golvvärme & Trycktest
  '1.13': [
    { id: '1.13_1', label: 'Golvvärmerör najade med korrekt c/c-avstånd mot nät', category: 'MATERIAL' },
    { id: '1.13_2', label: 'Bockfixturer monterade vid uppgång till fördelarskåp', category: 'KVALITET' },
    { id: '1.13_3', label: 'Trycktest med luft/vatten utfört (minst 3 bar i 24h)', category: 'SÄKERHET' },
    { id: '1.13_4', label: 'Manometer avläst och fotograferad utan tryckfall', category: 'LASER_MÅTT' },
  ],
  // 1.14 Gjutning & Efterbehandling
  '1.14': [
    { id: '1.14_1', label: 'Följesedel betongbil kontrollerad (kvalitet C25/30, vct)', category: 'MATERIAL' },
    { id: '1.14_2', label: 'Stavvibrator körd systematiskt för att undvika luftfickor', category: 'KVALITET' },
    { id: '1.14_3', label: 'Laseravvägd höjd och fall mot golvbrunnar i våtrum', category: 'LASER_MÅTT' },
    { id: '1.14_4', label: 'Yta glättad och eftervattning/plasttäckning applicerad direkt', category: 'KVALITET' },
  ],
};

// Default generic check suggestions for any unmapped moment
export const GENERIC_CHECK_SUGGESTIONS: CheckSuggestion[] = [
  { id: 'gen_1', label: 'Laserhöjd kontrollerad mot ritning (± 5 mm)', category: 'LASER_MÅTT' },
  { id: 'gen_2', label: 'Fall kontrollerat med laser / vattenpass', category: 'LASER_MÅTT' },
  { id: 'gen_3', label: 'Material godkänt enligt AMA & följesedel', category: 'MATERIAL' },
  { id: 'gen_4', label: 'Okulärbesiktning utförd utan anmärkning', category: 'KVALITET' },
  { id: 'gen_5', label: 'Mothåll och säkerhetsavstånd säkrade', category: 'SÄKERHET' },
  { id: 'gen_6', label: 'Foto taget med referensmåttstock', category: 'KVALITET' },
];

export function getSuggestionsForMoment(momentId: string): CheckSuggestion[] {
  return MOMENT_CHECK_SUGGESTIONS[momentId] || GENERIC_CHECK_SUGGESTIONS;
}
