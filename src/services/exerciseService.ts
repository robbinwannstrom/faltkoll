import { TeacherExercise, Project, MomentRecord, ExerciseSettings } from '../types';
import { ALL_MOMENTS } from '../data/momentsData';
import { getFormattedCurrentTime } from '../db/indexedDb';
import { safeFetchJson } from './apiHelper';
import {
  saveExerciseToCloud,
  fetchAllExercisesFromCloud,
  deleteExerciseFromCloud,
} from './userService';

const LOCAL_EXERCISES_KEY = 'faltkoll_custom_exercises';
const LOCAL_ADMIN_SETTINGS_KEY = 'faltkoll_admin_settings';

export interface AdminSettingsConfig {
  allowTeacherCreateTeacherAccounts: boolean;
  schoolName: string;
}

export const DEFAULT_EXERCISE_SETTINGS: ExerciseSettings = {
  photoRequirementMode: 'MARKED_ONLY',
  minPhotosPerMoment: 1,
  requireWatermark: true,
  strictSequentialPhases: false,
  preInspectionRule: 'OPTIONAL',
  requireFingerSignature: true,
  requireWeatherLog: false,
  requireMeasurementInComment: false,
  examMode: false,
  allowAiHelper: true,
  showStudentTips: true,
  showProTips: true,
  allowCrossMeasureCalculator: true,
  allowGroupSync: true,
  gradingScale: 'PASS_FAIL',
  requireTeacherStopPointSignoff: false,
  estimatedDuration: '4 timmar',
  globalToleranceMm: 5,
  targetDepthCm: 35,
  materialFraction: 'Makadam 8/16 mm',
};

// Default pre-packaged exercise templates
export const DEFAULT_EXERCISES: TeacherExercise[] = [
  {
    id: 'ex_grund_standard_1',
    code: 'GRUND-1',
    title: 'Övning: Platta på mark - Schakt & Makadam',
    description:
      'Praktisk övning i anläggningshallen. Mät kryssmått och laseravväg makadambädd med max ±5 mm tolerans.',
    projectType: 'HUSGRUND',
    creationSource: 'TEMPLATE',
    targetGroup: 'Byggprogrammet',
    educationLevel: 'GYMNASIE',
    specialization: 'BYGGPROGRAMMET',
    difficulty: 'MEDEL',
    createdAt: '2026-09-20 08:30',
    createdByTeacherName: 'Yrkeslärare Mark & Betong',
    createdByTeacherId: 'usr_larare_1',
    instructions:
      '1. Kontrollera ledningsanvisning\n2. Mät ut profiler och beräkna diagonal\n3. Schakta och jämna av schaktbotten\n4. Lägg fiberduk och makadambädd',
    links: [
      {
        id: 'link_yt_1',
        title: 'Instruktionsfilm: Utsättning av profiler',
        url: 'https://www.youtube.com',
        category: 'VIDEO',
      },
      {
        id: 'link_ama_1',
        title: 'AMA Anläggning tabell för toleranser (PDF)',
        url: 'https://svenskbyggtjanst.se',
        category: 'AMA_REGEL',
      },
    ],
    customMoments: ALL_MOMENTS.filter((m) => m.projectType === 'HUSGRUND').slice(0, 8),
    fieldMeasurements: {
      sideA: 10.0,
      sideB: 8.0,
      diagonal: 12.81,
      fallCmPerM: 1.0,
    },
    exerciseSettings: {
      ...DEFAULT_EXERCISE_SETTINGS,
      globalToleranceMm: 5,
      targetDepthCm: 40,
      materialFraction: 'Makadam 8/16 mm',
    },
  },
  {
    id: 'ex_sten_standard_1',
    code: 'PLATTA-2',
    title: 'Övning: Marksten & Plattsättning Garageinfart',
    description:
      'Övning i sättsand, fall 2 cm/meter och fogning enligt AMA Anläggning.',
    projectType: 'PLATTSATTNING',
    creationSource: 'TEMPLATE',
    targetGroup: 'Anläggare',
    educationLevel: 'ALL',
    specialization: 'ANLAGGARE',
    difficulty: 'MEDEL',
    createdAt: '2026-09-22 09:00',
    createdByTeacherName: 'Yrkeslärare Mark & Betong',
    createdByTeacherId: 'usr_larare_1',
    instructions:
      'Säkerställ att bärlagret är väl paddat. Dra av sättsanden med rätskiva och kontrollera fall bort från sockel.',
    links: [
      {
        id: 'link_sten_1',
        title: 'Monteringsanvisning marksten & kantstöd',
        url: 'https://www.benders.se',
        category: 'RITNING',
      },
    ],
    customMoments: ALL_MOMENTS.filter((m) => m.projectType === 'PLATTSATTNING'),
    fieldMeasurements: {
      sideA: 6.0,
      sideB: 4.0,
      diagonal: 7.21,
      fallCmPerM: 2.0,
    },
    exerciseSettings: {
      ...DEFAULT_EXERCISE_SETTINGS,
      globalToleranceMm: 3,
      targetDepthCm: 25,
      materialFraction: 'Stenmjöl 0/4 mm & Bärlager 0/32',
    },
  },
  {
    id: 'ex_enskilt_avlopp_infiltration',
    code: 'AVLOPP-1',
    title: 'Enskilt avlopp med infiltration',
    description:
      'Arbetsbeskrivning och kontroll för slamavskiljare NEO/BL26 och infiltration enligt dokumentets anvisningar.',
    projectType: 'ENSKILT_AVLOPP',
    creationSource: 'PDF_IMPORT',
    targetGroup: 'Anläggare (Mark & Anläggning)',
    educationLevel: 'ALL',
    specialization: 'MARK_VA',
    difficulty: 'MEDEL',
    createdAt: '2026-10-04 18:00',
    createdByTeacherName: 'Yrkeslärare Mark & VA',
    createdByTeacherId: 'usr_admin_main',
    instructions:
      '1. Följ arbetsbeskrivning och tillverkaranvisning fas för fas.\n2. Utför kontroller innan schaktning.\n3. Montera slamavskiljare och utför därefter infiltration.\n4. Fotodokumentera alla moment och besikta innan övertäckning!',
    links: [],
    customMoments: ([
      {
        id: '1.1',
        order: 1,
        phaseNumber: 1,
        phaseName: 'Fas 1: 1. Material och utrustning',
        title: 'Material och utrustning',
        amaCode: 'CBB.1',
        instruction: 'Kontrollera att föreskrivet material finns på plats:\n\nMaterial: Bergkross, avstängningsgrindar, PP-rör, rör-böjar och markduk.\n\nMaskiner: Grävmaskin för schaktningsarbete och hjullastare.\n\nVerktyg: Laser, spade, raka, padda, tumstock, måttband, såg, märkspray, vattenpass, kniv, märkpenna, stamp och fyllhacka.',
        studentTip: 'Gå igenom hela listan för material, maskiner och verktyg innan arbetet påbörjas.',
        proTip: 'Kontrollera att alla verktyg är funktionsdugliga och att laser är kalibrerad.',
        tolerance: 'Komplett material & utrustning',
        inspectionItem: 'Material, maskiner och verktyg på plats',
        method: 'Visuell kontroll mot punktlista',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Material: Bergkross, avstängningsgrindar, PP-rör, rör-böjar och markduk',
          'Maskiner: Grävmaskin för schaktningsarbete och hjullastare',
          'Verktyg: Laser, spade, raka, padda, tumstock, måttband, såg, märkspray, vattenpass, kniv, märkpenna, stamp och fyllhacka',
        ],
      },
      {
        id: '2.1',
        order: 2,
        phaseNumber: 2,
        phaseName: 'Fas 2: 2. Innan du börjar schakta!',
        title: 'Innan du börjar schakta!',
        amaCode: 'CBB.1',
        instruction: 'Kontrollera att du har:\n- Tillverkarens installationsanvisning\n- Ritning/projektering\n- Grindar för avstängning av schakt (schaktet ska spärras av så fort arbetet pausas!)\n- Inkommande ledningshöjd\n- Tankens inlopps- och utloppsnivå\n- Bestämd utloppspunkt\n- Schaktmått\n- Mark- och grundvattenförhållanden\n- Plan för återfyllning och packning',
        studentTip: 'Schaktet ska alltid spärras av med grindar så fort arbetet pausas.',
        proTip: 'Mät inkommande ledningshöjd med laser innan grävning påbörjas.',
        tolerance: 'Samtliga punkter kontrollerade',
        inspectionItem: 'Kontroller och förberedelser inför schaktning',
        method: 'Avstämning mot kontrollista & Laser',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Tillverkarens installationsanvisning',
          'Ritning/projektering',
          'Grindar för avstängning av schakt (schaktet ska spärras av så fort arbetet pausas!)',
          'Inkommande ledningshöjd',
          'Tankens inlopps- och utloppsnivå',
          'Bestämd utloppspunkt',
          'Schaktmått',
          'Mark- och grundvattenförhållanden',
          'Plan för återfyllning och packning',
        ],
      },
      {
        id: '3.1',
        order: 3,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 1: Läs tillverkarens instruktioner',
        amaCode: 'PBB.1',
        instruction: 'Läs tillverkarens installations- och monteringsanvisningar för Slamavskiljare NEO och BL26. Kontrollera särskilt:\n- Tankens mått\n- Inloppsnivå\n- Utloppets placering/nivå\n- Krav på kringfyllnad\n- Krav på grundvattennivå\n- Krav på överfyllnad\n- Krav på åtkomlighet för service/slamtömning',
        studentTip: 'Följ tillverkarens monteringsanvisning noggrant.',
        proTip: 'Dokumentera tankens serienummer och modell.',
        tolerance: 'Enligt tillverkarens manual',
        inspectionItem: 'Genomgång av installations- och monteringsanvisningar',
        method: 'Dokumentstudie',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Tankens mått',
          'Inloppsnivå',
          'Utloppets placering/nivå',
          'Krav på kringfyllnad',
          'Krav på grundvattennivå',
          'Krav på överfyllnad',
          'Krav på åtkomlighet för service/slamtömning',
        ],
      },
      {
        id: '3.2',
        order: 4,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 2: Kontrollera förutsättningarna på plats',
        amaCode: 'PBB.1',
        instruction: '- Lokalisera avloppsledningen från huset\n- Kontrollera var tanken ska placeras\n- Kontrollera vart det renade vattnet ska ledas\n- Kontrollera höjderna på inlopp och utlopp\n- Kontrollera att placeringen fungerar för slamtömning/service',
        studentTip: 'Kontrollera att slamtömningsfordon kan nå tanken.',
        proTip: 'Mät avstånd och höjdskillnader noggrant före schakt.',
        tolerance: 'Enligt ritning & projektering',
        inspectionItem: 'Platsförutsättningar och placering',
        method: 'Visuell kontroll & Mätning',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Avloppsledning från huset lokaliserad',
          'Tankens placering kontrollerad',
          'Riktning för renat vatten kontrollerad',
          'Höjder på inlopp och utlopp kontrollerade',
          'Placering för slamtömning/service kontrollerad',
        ],
      },
      {
        id: '3.3',
        order: 5,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 3: Mottagningskontroll',
        amaCode: 'PBB.1',
        instruction: 'Kontrollera att leveransen är komplett och att inga delar är skadade.',
        studentTip: 'Inspektera tank och delar före montering.',
        proTip: 'Ta bild på leveransen som kvitto på felfritt gods.',
        tolerance: 'Komplett och oskadat gods',
        inspectionItem: 'Mottagningskontroll av leverans',
        method: 'Okulärbesiktning',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: ['Leveransen är komplett', 'Inga delar är skadade'],
      },
      {
        id: '3.4',
        order: 6,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 4: Mät ut schaktets yta',
        amaCode: 'CBB.1',
        instruction: 'Mät ut schaktets yta på marken. Läs tillverkarens anvisning och glöm inte släntlutningen.',
        studentTip: 'Räkna med släntlutning så att schaktet blir säkert att arbeta i.',
        proTip: 'Märk ut schaktlinjer tydligt med märkspray.',
        tolerance: 'Mått enligt tillverkaranvisning och släntregler',
        inspectionItem: 'Schaktets yta och släntlutning',
        method: 'Måttband och märkspray',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Schaktets yta uppmätt på marken',
          'Tillverkarens anvisning kontrollerad',
          'Släntlutning inräknad',
        ],
      },
      {
        id: '3.5',
        order: 7,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 5: Bestäm schaktdjupet genom höjdsättning',
        amaCode: 'CBB.1',
        instruction: 'Kontrollera höjden på den inkommande spillvattenledningen från huset. Tankens inlopp ska placeras så att ledningen kan anslutas med erforderligt fall enligt projektering och tillverkarens anvisningar. Utgå från tankens angivna inloppsnivå och beräkna därefter tankens bottennivå. Kontrollera samtidigt att tankens utlopp hamnar på rätt nivå i förhållande till den efterföljande ledningen och utsläppspunkten. Schaktdjupet bestäms alltså av höjdsättningen, inte enbart av tankens totala höjd.',
        studentTip: 'Schaktdjupet styrs av höjdsättningen och erforderligt rörfall.',
        proTip: 'Väg av inlopp och utlopp med rotationslaser.',
        tolerance: 'Beräknade nivåer stämda mot laser',
        inspectionItem: 'Höjdsättning och schaktdjup',
        method: 'Rotationslaser med avvägningsstång',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Inkommande spillvattenlednings höjd kontrollerad',
          'Tankens inloppsnivå och bottennivå beräknade med erforderligt fall',
          'Tankens utloppsnivå kontrollerad mot efterföljande ledning/utloppspunkt',
        ],
      },
      {
        id: '3.6',
        order: 8,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 6: Schakta för tanken',
        amaCode: 'CBB.1',
        instruction: '- Schakta till beräknad nivå, slänta schaktet enligt regler.\n- Kontrollera schaktbotten mot projekterad nivå.\n- Kontrollera att schaktbotten är stabil och fri från sten och andra föremål som kan skada tanken.\n- Säkerställ erforderligt arbetsutrymme runt tanken.',
        studentTip: 'Schaktbotten ska vara jämn och fri från vassa stenar.',
        proTip: 'Kontrollera bottennivån löpande med laser under grävningen.',
        tolerance: 'Schaktbotten i nivå, fri från sten',
        inspectionItem: 'Schaktning, släntning och schaktbotten',
        method: 'Laser & Okulärkontroll',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Schaktat till beräknad nivå med släntning enligt regler',
          'Schaktbotten kontrollerad mot projekterad nivå',
          'Schaktbotten stabil och fri från sten/skadande föremål',
          'Erforderligt arbetsutrymme runt tanken säkerställt',
        ],
      },
      {
        id: '3.7',
        order: 9,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 7: Gör i ordning botten',
        amaCode: 'DCB.1',
        instruction: '- Följ den aktuella installationsanvisningen för material och tjocklek av grusbädd.\n- Lägg ut bäddmaterial. Jämna av. Kontrollera nivå i våg.\n- Kontrollera fall och riktning för anslutande ledningar.',
        studentTip: 'Grusbädden måste ligga helt i våg så att tanken står plant.',
        proTip: 'Dra av bädden med rätskiva och kontrollera med vattenpass/laser.',
        tolerance: 'Bädd i våg enligt tillverkaranvisning',
        inspectionItem: 'Bäddmaterial, avjämning och nivå i våg',
        method: 'Rotationslaser / Vattenpass & Rätskiva',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Material och tjocklek på grusbädd enligt anvisning',
          'Bäddmaterial utlagt, avjämnat och i våg',
          'Fall och riktning för anslutande ledningar kontrollerade',
        ],
      },
      {
        id: '3.8',
        order: 10,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 8: Lyft ner tanken',
        amaCode: 'PBB.1',
        instruction: '- Kontrollera lyftpunkterna på tanken.\n- Använd godkänd lyftutrustning.\n- Sänk tanken försiktigt på bädden.\n- Kontrollera att den står rätt i plan och höjd.\n- Kontrollera att inlopp och utlopp är åt rätt håll.',
        studentTip: 'Använd alltid godkända lyftstroppar och kontrollera lyftpunkterna.',
        proTip: 'Kontrollera flödesriktning på tanken före nedsänkning.',
        tolerance: 'Tank i plan och höjd, in-/utlopp rätt vända',
        inspectionItem: 'Lyft, nedsänkning, planhet och orientering',
        method: 'Vattenpass & Visuell kontroll',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Lyftpunkter kontrollerade och godkänd lyftutrustning använd',
          'Tanken försiktigt sänkt på bädden',
          'Tankens plan och höjd kontrollerade',
          'Inlopp och utlopp vända åt rätt håll',
        ],
      },
      {
        id: '3.9',
        order: 11,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 9: Anslut ledningarna',
        amaCode: 'PBB.1',
        instruction: '- Hus -> BL26: Anslut inkommande spillvattenledning med rätt dimension, tätning och fall enligt projektering/tillverkarens instruktion.\n- BL26 -> efterföljande rening/utsläpp: Anslut utloppet till den lösning som anläggningen är projekterad för.',
        studentTip: 'Kontrollera att packningar sluter tätt och att ledningen har rätt fall.',
        proTip: 'Använd smörjmedel på gummimuffar för säker och tät anslutning.',
        tolerance: 'Täta anslutningar med fall enligt projektering',
        inspectionItem: 'Röranslutningar inlopp och utlopp',
        method: 'Vattenpass / Laser & Okulärkontroll',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Inkommande ledning ansluten med rätt dimension, tätning och fall',
          'Utlopp anslutet till efterföljande rening/utsläpp enligt projektering',
        ],
      },
      {
        id: '3.10',
        order: 12,
        phaseNumber: 3,
        phaseName: 'Fas 3: 3. Arbetsbeskrivning',
        title: 'Steg 10: Förankring och kringfyllning',
        amaCode: 'PBB.1',
        instruction: '- Fyll tanken med vatten och kringfyll enligt tillverkarens instruktioner.\n- Kringfyllningen utförs lagervis med föreskrivet material och packas enligt instruktioner.\n- Kontrollera fortlöpande tankens läge och höjd så att den inte förskjuts under arbetet.',
        studentTip: 'Fyll vatten i tanken parallellt med kringfyllningen enligt anvisning.',
        proTip: 'Packa jämnt runt tanken i tunna lager för att undvika sättningar.',
        tolerance: 'Lagervis kringfyllning och vattenfyllning enligt manual',
        inspectionItem: 'Vattenfyllning, lagervis kringfyllning och lägeskontroll',
        method: 'Visuell kontroll och packningsavstämning',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Tanken fylld med vatten enligt tillverkarens instruktioner',
          'Kringfyllt lagervis med föreskrivet material och packat enligt instruktioner',
          'Tankens läge och höjd fortlöpande kontrollerade',
        ],
      },
      {
        id: '4.1',
        order: 13,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 1: Kontrollera förutsättningarna för infiltration',
        amaCode: 'PBB.51',
        instruction: '- Läs igenom aktuell monteringsanvisning från tillverkaren.\n- Kontrollera markens infiltrationsförmåga enligt projektering/markundersökning.\n- Bestäm infiltrationens placering och höjdläge.\n- Kontrollera att anläggningen kan placeras på frostfritt djup enligt projekteringen.\n\nVIKTIGT: Infiltrationens storlek ska bestämmas utifrån belastningen och markens förmåga att ta emot avloppsvattnet. Ändra inte antalet moduler utan att det är projekterat.',
        studentTip: 'Ändra aldrig antalet moduler utan att det är projekterat.',
        proTip: 'Stäm av markundersökning och projekteringshandlingar noggrant.',
        tolerance: 'Enligt projektering & monteringsanvisning',
        inspectionItem: 'Förutsättningar, placering och höjdläge för infiltration',
        method: 'Dokumentstudie & Granskning',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Aktuell monteringsanvisning genomläst',
          'Markens infiltrationsförmåga kontrollerad mot projektering',
          'Infiltrationens placering och höjdläge bestämda',
          'Frostfritt djup kontrollerat enligt projekteringen',
          'Antal moduler stämt mot projektering (ej ändrat utan godkännande)',
        ],
      },
      {
        id: '4.2',
        order: 14,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 2: Mät ut infiltrationen',
        amaCode: 'BBC.31',
        instruction: 'Mät ut infiltrationens placering på marken. Markera:\n- Infiltrationens längd och bredd\n- Schaktets gränser\n- Höjder och fall\n- Anslutande ledningar\n\nFör aktuellt fabrikat anger monteringsanvisningen:\n- 7 biomoduler för ett hushåll med BDT+WC (BDT=Bad-, disk- och tvättvatten, WC=skithus)\n- 5 biomoduler för enbart BDT\n\n7 moduler motsvarar ca 8,8 m. 5 moduler motsvarar ca 5,5 m.\nKontrollera alltid aktuellt projekt eftersom dimensioneringen kan vara annorlunda.',
        studentTip: '7 moduler motsvarar ca 8,8 m (BDT+WC); 5 moduler ca 5,5 m (enbart BDT).',
        proTip: 'Märk ut längd, bredd och fall tydligt på marken.',
        tolerance: 'Längd och bredd enligt modulantal och projektering',
        inspectionItem: 'Utsättning av infiltrationens placering och schaktgränser',
        method: 'Måttband, märkspray och avvägning',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Infiltrationens längd och bredd markerade',
          'Schaktets gränser markerade',
          'Höjder och fall markerade',
          'Anslutande ledningar markerade',
          'Rätt modulantal kontrollerat mot projektering (7 st BDT+WC / 5 st BDT)',
        ],
      },
      {
        id: '4.3',
        order: 15,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 3: Schakta ur',
        amaCode: 'CBB.1',
        instruction: 'Schakta bort matjord och andra olämpliga massor. Botten ska:\n- Vara stabil\n- Vara fri från stora stenar\n- Inte vara tjälad\n- Ha rätt höjd enligt projekteringen\n- Ha rätt förutsättningar för infiltration\n\nUndvik att köra sönder eller packa infiltrationsytan i onödan med maskinen.\n\nVIKTIGT: Infiltrationsytan är den del av anläggningen där avloppsvattnet ska kunna filtreras ned i marken. Den får därför inte förstöras eller tätas genom onödig packning. KÖR EJ ÖVER TANK ELLER MODULERNA FÖR INFILTRATION.',
        studentTip: 'KÖR EJ ÖVER TANK ELLER MODULERNA FÖR INFILTRATION!',
        proTip: 'Packa inte schaktbotten i onödan med maskinen – infiltrationsytan måste behålla sin genomsläpplighet.',
        tolerance: 'Botten stabil, fri från sten och tjäle, rätt nivå',
        inspectionItem: 'Schaktning och skydd av infiltrationsytan',
        method: 'Laser & Okulärkontroll',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Matjord och olämpliga massor bortschahtade',
          'Botten stabil och fri från stora stenar',
          'Botten fri från tjäle',
          'Rätt höjd enligt projekteringen',
          'Infiltrationsytan skyddad från maskinkörning och onödig packning',
        ],
      },
      {
        id: '4.4',
        order: 16,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 4: Förbered infiltrationsbädden',
        amaCode: 'DCB.1',
        instruction: '- Om marken har tillräcklig infiltrationsförmåga kan biomodulerna enligt monteringsanvisningen placeras direkt på spridarlagret/infiltrationsytan.\n- Vid förstärkt infiltration läggs ca 300 mm markbäddssand, 0,2–8 mm, under spridarplattorna.\n- Fördelningslagret ska vara jämnt och ha rätt nivå. Kontrollera höjden innan modulerna placeras ut.',
        studentTip: 'Vid förstärkt infiltration läggs ca 300 mm markbäddssand (0,2–8 mm).',
        proTip: 'Kontrollera att fördelningslagret är jämnt och i rätt höjd före modulläggning.',
        tolerance: 'Jämnt lager i rätt nivå (ev. 300 mm markbäddssand)',
        inspectionItem: 'Infiltrationsbädd och fördelningslager',
        method: 'Laser och rätskiva',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Placering direkt på spridarlager alt. ca 300 mm markbäddssand 0,2-8 mm utförd',
          'Fördelningslagret jämnt avjämnat',
          'Höjdnivå kontrollerad innan moduler placeras ut',
        ],
      },
      {
        id: '4.5',
        order: 17,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 5: Lägg ut spridarplattorna',
        amaCode: 'PBB.51',
        instruction: 'För aktuellt system används 14 spridarplattor till 7 biomoduler. Placera:\n- Två spridarplattor under varje biomodul\n- Placera 7 st mot varandra\n- Plattorna stabilt och jämnt på marken\n\nKontrollera att spridarplattorna ligger rätt innan biomodulerna läggs på plats.',
        studentTip: 'Två spridarplattor under varje biomodul (totalt 14 st för 7 moduler).',
        proTip: 'Se till att plattorna ligger stabilt och jämnt.',
        tolerance: '14 st plattor, stabilt och jämnt underlag',
        inspectionItem: 'Spridarplattornas antal, placering och stabilitet',
        method: 'Visuell kontroll och räkning',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          '14 spridarplattor använda till 7 biomoduler (2 under varje modul)',
          '7 st placerade mot varandra',
          'Plattorna ligger stabilt och jämnt på marken',
          'Placering kontrollerad innan biomoduler läggs på',
        ],
      },
      {
        id: '4.6',
        order: 18,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 6: Placera biomodulerna',
        amaCode: 'PBB.51',
        instruction: 'Biomodulerna placeras på spridarplattorna. Aktuell biomodul har enligt monteringsanvisningen ungefär följande mått:\n- Höjd: 275 mm\n- Längd: 1 100 mm\n- Bredd: 550 mm\n\nPlacera modulerna i rad med kortsidorna mot varandra.\nKontrollera under arbetets gång att:\n- Modulerna ligger rakt\n- De står stabilt\n- Rätt antal moduler används\n- De ligger på rätt plats enligt ritning/projektering',
        studentTip: 'Mått på biomodul: ca 275 mm hög, 1 100 mm lång, 550 mm bred.',
        proTip: 'Placera modulerna i rak rad med kortsidorna tätt mot varandra.',
        tolerance: 'Raka rader, stabilt placerade',
        inspectionItem: 'Biomodulernas placering, rakhet och stabilitet',
        method: 'Snörslå, vattenpass och måttband',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Biomodulerna placerade på spridarplattorna',
          'Modulerna lagda i rad med kortsidorna mot varandra',
          'Modulerna ligger rakt och står stabilt',
          'Rätt antal moduler använda på rätt plats enligt ritning',
        ],
      },
      {
        id: '4.7',
        order: 19,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 7: Montera ventilationen',
        amaCode: 'PBB.51',
        instruction: 'Ventilation ska monteras i ändarna av biomodulerna. Monteringsanvisningen anger ventilationsrör dim 40 x 2 mm, ett i vardera änden.\n\nVentilationen bör placeras så att den ena änden är högre och den andra lägre. Det ger möjlighet till luftcirkulation genom anläggningen.\nTänk på att ventilationen ska:\n- Mynna på lämplig höjd\n- Inte hamna under framtida marknivå\n- Vara tillräckligt hög för att inte täckas av snö\n- Inte kapas av för kort\n\nMonteringsanvisningen anger även att ca 12 hål med 10 mm diameter borras i ventilationsröret. Följ alltid den aktuella tillverkarens placering och antal hål.',
        studentTip: 'Ventilationsrör dim 40x2 mm i vardera änden. Ca 12 hål med 10 mm diameter.',
        proTip: 'Se till att ena änden är högre än den andra för att driva luftcirkulationen.',
        tolerance: 'Rör 40x2 mm, ca 12 st 10 mm hål, mynning över snönivå',
        inspectionItem: 'Ventilationsrör, hålborrning och mynning',
        method: 'Måttband, borrkontroll och visuell inspektion',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Ventilationsrör dim 40x2 mm monterat i vardera änden',
          'Höjdskillnad mellan ändarna för luftcirkulation',
          'Mynnar på lämplig höjd över framtida marknivå och snö',
          'Ca 12 hål med 10 mm diameter borrade enligt anvisning',
        ],
      },
      {
        id: '4.8',
        order: 20,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 8: Montera spridarrören',
        amaCode: 'PBB.51',
        instruction: 'Spridarrören placeras ovanpå biomodulerna. Enligt monteringsanvisningen används spridarrör med:\n- Diameter 110 mm\n- Längd ca 1,1 m\n\nRören läggs på modulerna och kopplas samman enligt tillverkarens anvisning. Rören ska bindas fast så att de inte kan flytta sig under återfyllningen. Kontrollera att rören ligger rätt och har den placering som anges i monteringsanvisningen.',
        studentTip: 'Spridarrör dim 110 mm, längd ca 1,1 m. Bind fast ordentligt!',
        proTip: 'Kontrollera att rören inte kan förskjutas vid masspåläggning.',
        tolerance: 'Rör 110 mm, sammankopplade och fastbundna',
        inspectionItem: 'Spridarrör, sammankoppling och fastbindning',
        method: 'Måttband och mekanisk kontroll',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Spridarrör dim 110 mm (L=ca 1,1 m) placerade ovanpå biomodulerna',
          'Rören sammankopplade enligt tillverkarens anvisning',
          'Rören fastbundna så de inte kan flytta sig under återfyllning',
          'Rörens placering stämmer mot monteringsanvisningen',
        ],
      },
      {
        id: '4.9',
        order: 21,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 9: Kontrollera anläggningen innan återfyllningen',
        amaCode: 'PBB.51',
        instruction: 'Innan något fylls igen ska hela anläggningen kontrolleras. Kontrollera:\n- Rätt antal biomoduler\n- Spridarplattorna ligger rätt\n- Biomodulerna ligger stabilt och rakt\n- Spridarrören är korrekt placerade\n- Spridarrören är fastbundna\n- Ventilationsrören är monterade\n- Ventilationsrören är utförda enligt anvisningen\n- Anslutningarna är rätt utförda\n- Rätt höjder och nivåer\n- Inga stora stenar finns där de kan skada anläggningen\n- Anläggningen är dokumenterad innan den täcks över\n\nDet här är sista möjligheten att enkelt upptäcka och rätta fel.',
        studentTip: 'Sista möjligheten att enkelt upptäcka och rätta fel!',
        proTip: 'Fotografera hela den öppna bädden från alla vinklar.',
        tolerance: 'Samtliga kontrollpunkter godkända',
        inspectionItem: 'Slutkontroll av hela anläggningen före övertäckning',
        method: 'Gemensam okulär- och mätkontroll',
        requirePhoto: true,
        isStopPoint: true,
        customChecklist: [
          'Rätt antal biomoduler',
          'Spridarplattorna ligger rätt',
          'Biomodulerna ligger stabilt och rakt',
          'Spridarrören är korrekt placerade och fastbundna',
          'Ventilationsrören är monterade och utförda enligt anvisning',
          'Anslutningarna är rätt utförda',
          'Rätt höjder och nivåer',
          'Inga stora stenar kan skada anläggningen',
          'Anläggningen dokumenterad innan övertäckning',
        ],
      },
      {
        id: '4.10',
        order: 22,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 10: Skydda biomodulerna',
        amaCode: 'PBB.51',
        instruction: 'När anläggningen är kontrollerad ska biomodulerna skyddas innan återfyllning:\n- Fyll försiktigt runt modulerna så att de inte flyttas eller skadas.\n- Använd lämpliga massor närmast anläggningen och följ tillverkarens anvisningar.\n- Lägg geotextil (markduk) ovanpå för att förhindra att finjord tränger ner.',
        studentTip: 'Lägg geotextil (markduk) ovanpå för att förhindra att finjord tränger ner.',
        proTip: 'Fyll försiktigt närmast modulerna så att de inte rubbas.',
        tolerance: 'Skonsam fyllning, geotextil utlagd',
        inspectionItem: 'Skyddsåtgärder och geotextil',
        method: 'Okulärbesiktning',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Försiktig fyllning runt modulerna utan skador/förskjutning',
          'Lämpliga massor använda närmast anläggningen enligt anvisning',
          'Geotextil (markduk) utlagd ovanpå som skydd mot finjord',
        ],
      },
      {
        id: '4.11',
        order: 23,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 11: Återfyll',
        amaCode: 'CBB.1',
        instruction: 'Återfyll försiktigt runt och ovanför infiltrationen. Enligt monteringsanvisningen ska det vara ca 60 cm täckning av befintliga jordmassor.\n\nVid återfyllningen:\n- Använd inte stora stenar direkt mot anläggningen\n- Undvik att flytta spridarrör och ventilationsrör\n- Fyll jämnt runt konstruktionen\n- Packa inte direkt ovanpå biomodulerna på ett sätt som kan skada dem\n- Se till att ventilationen fortfarande är fri\n\nStora stenar ska sorteras bort.',
        studentTip: 'Ca 60 cm täckning av befintliga jordmassor. Stora stenar ska sorteras bort.',
        proTip: 'Packa inte direkt ovanpå modulerna så att de skadas.',
        tolerance: 'Täckning ca 60 cm, fri från stora stenar',
        inspectionItem: 'Återfyllning och täckningsdjup',
        method: 'Måttband och visuell kontroll',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Ca 60 cm täckning av befintliga jordmassor',
          'Inga stora stenar direkt mot anläggningen (bortsorterade)',
          'Spridarrör och ventilationsrör ej flyttade',
          'Jämn fyllning runt konstruktionen utan skadlig packning ovanpå',
          'Ventilationen hålls fri',
        ],
      },
      {
        id: '4.12',
        order: 24,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 12: Slutför marken',
        amaCode: 'CBB.1',
        instruction: 'När infiltrationen är täckt färdigställs marken. Kontrollera att:\n- Marken leder bort ytvatten från infiltrationen\n- Inga gropar där vatten kan samlas finns över anläggningen\n- Ventilationsrören fortfarande är fria\n- Marknivån stämmer med projekteringen\n\nÅterställ området så långt det är möjligt.',
        studentTip: 'Marken ska leda bort ytvatten från infiltrationen.',
        proTip: 'Säkerställ att ventilationsrören mynnar fritt och oskadat ovan mark.',
        tolerance: 'Ytvattenfall bort från anläggning, fria rör',
        inspectionItem: 'Markplanering, ytvattenavrinning och ventilationskontroll',
        method: 'Laser, vattenpass och visuell inspektion',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Marken leder bort ytvatten från infiltrationen',
          'Inga gropar där vatten kan samlas över anläggningen',
          'Ventilationsrören är fria',
          'Marknivån stämmer med projekteringen',
          'Området återställt så långt det är möjligt',
        ],
      },
      {
        id: '4.13',
        order: 25,
        phaseNumber: 4,
        phaseName: 'Fas 4: 4. Infiltration',
        title: 'Steg 13: Dokumentera arbetet',
        amaCode: 'YJJ.1',
        instruction: 'Innan schaktet fylls igen ska arbetet dokumenteras. Dokumentera:\n- Infiltrationens placering\n- Höjder\n- Antal moduler\n- Spridarplattornas placering\n- Spridarrörens placering\n- Ventilationens utförande\n- Anslutningar\n- Fotografier före återfyllning\n\nDokumentationen är viktig för framtida service och felsökning.',
        studentTip: 'Dokumentationen är viktig för framtida service och felsökning.',
        proTip: 'Sammanställ relationsmått och fotobevis i appen.',
        tolerance: 'Fullständig dokumentation och fotobevis',
        inspectionItem: 'Slutdokumentation och fotobevis',
        method: 'Dokumentation i appen & Signering',
        requirePhoto: true,
        isStopPoint: true,
        customChecklist: [
          'Infiltrationens placering dokumenterad',
          'Höjder och antal moduler dokumenterade',
          'Spridarplattornas och spridarrörens placering dokumenterad',
          'Ventilationens utförande och anslutningar dokumenterade',
          'Fotografier före återfyllning sparade',
        ],
      },
    ]).map((m) => ({ ...m, projectType: 'ENSKILT_AVLOPP' as const })),
    fieldMeasurements: {
      sideA: 8.8,
      sideB: 2.5,
      fallCmPerM: 1.0,
    },
    exerciseSettings: {
      ...DEFAULT_EXERCISE_SETTINGS,
      globalToleranceMm: 5,
      targetDepthCm: 150,
      materialFraction: 'Spridarlager & Markbäddssand',
    },
  },
];

export const getLocalExercises = (): TeacherExercise[] => {
  try {
    const raw = localStorage.getItem(LOCAL_EXERCISES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_EXERCISES;
};

export const saveLocalExercises = (list: TeacherExercise[]): void => {
  try {
    localStorage.setItem(LOCAL_EXERCISES_KEY, JSON.stringify(list));
  } catch {}
};

// Fetch all exercises from server & Cloud Firestore (with offline fallback)
export const fetchTeacherExercises = async (): Promise<TeacherExercise[]> => {
  let serverExercises: TeacherExercise[] = [];
  try {
    const res = await safeFetchJson<{ exercises: TeacherExercise[] }>('/api/exercises');
    if (res.ok && Array.isArray(res.data?.exercises)) {
      serverExercises = res.data.exercises;
    }
  } catch {}

  // Fetch from Google Cloud Firestore directly
  let cloudExercises: TeacherExercise[] = [];
  try {
    cloudExercises = await fetchAllExercisesFromCloud();
  } catch {}

  const localExercises = getLocalExercises();

  // Combine and de-duplicate by ID and Code
  const seen = new Set<string>();
  const combined: TeacherExercise[] = [];

  for (const ex of [
    ...cloudExercises,
    ...serverExercises,
    ...localExercises,
    ...DEFAULT_EXERCISES,
  ]) {
    const key = (ex.id || ex.code || '').trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      combined.push(ex);
    }
  }

  saveLocalExercises(combined);
  return combined;
};

// Lookup exercise by code
export const fetchExerciseByCode = async (code: string): Promise<TeacherExercise | null> => {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const res = await safeFetchJson<{ exercise: TeacherExercise }>(
      `/api/exercises/${encodeURIComponent(cleanCode)}`
    );
    if (res.ok && res.data?.exercise) {
      return res.data.exercise;
    }
  } catch {}

  // Fallback to local storage, Cloud, or default exercise templates
  const localList = await fetchTeacherExercises();
  const match = localList.find((e) => e.code.trim().toUpperCase() === cleanCode);
  if (match) return match;

  const defaultMatch = DEFAULT_EXERCISES.find((e) => e.code.trim().toUpperCase() === cleanCode);
  return defaultMatch || null;
};

// Save exercise (create or update)
export const saveTeacherExercise = async (
  exercise: TeacherExercise
): Promise<TeacherExercise> => {
  let saved = exercise;
  try {
    const res = await safeFetchJson<{ exercise: TeacherExercise }>('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise),
    });
    if (res.ok && res.data?.exercise) {
      saved = res.data.exercise;
    }
  } catch {}

  // Save directly to Google Cloud Firestore
  try {
    await saveExerciseToCloud(saved);
  } catch (err) {
    console.warn('Could not save exercise to Firestore:', err);
  }

  // Update local storage
  const current = getLocalExercises();
  const idx = current.findIndex((e) => e.id === saved.id || e.code === saved.code);
  let updatedList: TeacherExercise[];
  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = saved;
  } else {
    updatedList = [saved, ...current];
  }
  saveLocalExercises(updatedList);
  return saved;
};

// Delete exercise
export const deleteTeacherExercise = async (id: string, code?: string): Promise<boolean> => {
  try {
    await safeFetchJson(`/api/exercises/${id}`, { method: 'DELETE' });
  } catch {}

  // Delete from Google Cloud Firestore
  try {
    await deleteExerciseFromCloud(id, code);
  } catch {}

  const current = getLocalExercises();
  const updated = current.filter((e) => e.id !== id && e.code !== id);
  saveLocalExercises(updated);
  return true;
};

// Admin Settings
export const fetchAdminSettings = async (): Promise<AdminSettingsConfig> => {
  try {
    const res = await safeFetchJson<{ settings: AdminSettingsConfig }>('/api/admin/settings');
    if (res.ok && res.data?.settings) {
      localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(res.data.settings));
      return res.data.settings;
    }
  } catch {}

  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    allowTeacherCreateTeacherAccounts: false,
    schoolName: 'Bygg- & Anläggningsutbildning',
  };
};

export const saveAdminSettings = async (
  settings: Partial<AdminSettingsConfig>
): Promise<AdminSettingsConfig> => {
  try {
    const res = await safeFetchJson<{ settings: AdminSettingsConfig }>('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok && res.data?.settings) {
      localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(res.data.settings));
      return res.data.settings;
    }
  } catch {}

  const current = await fetchAdminSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};

// Clone a teacher exercise into an active student project
export const convertExerciseToProject = (
  exercise: TeacherExercise,
  studentName: string,
  customGroupCode?: string
): Project => {
  const initialMoments: Record<string, MomentRecord> = {};
  const momentsToUse =
    exercise.customMoments && exercise.customMoments.length > 0
      ? exercise.customMoments
      : ALL_MOMENTS.filter((m) => m.projectType === exercise.projectType);

  momentsToUse.forEach((m) => {
    initialMoments[m.id] = {
      momentId: m.id,
      status: 'RED',
      comment: '',
      signature: '',
      photos: [],
      structuredChecks: [],
    };
  });

  const now = getFormattedCurrentTime();
  const settings = exercise.exerciseSettings || DEFAULT_EXERCISE_SETTINGS;
  const preInspectDone = settings.preInspectionRule === 'DISABLED' || settings.preInspectionRule === 'OPTIONAL';
  const cleanGroupCode = (customGroupCode || exercise.code || '').trim().toUpperCase();

  return {
    id: 'proj_ex_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: exercise.title,
    projectType: exercise.projectType,
    propertyDesignation: `Övningskod: ${exercise.code}${exercise.targetGroup ? ' • ' + exercise.targetGroup : ''}`,
    clientName: exercise.createdByTeacherName || 'Yrkeslärare',
    contractorName: studentName || 'Elev / Lärling',
    projectNumber: exercise.code,
    applicableDocs: 'AMA Anläggning 20 / Lärarens instruktioner',
    createdAt: now,
    updatedAt: now,
    notes: exercise.description || exercise.instructions || '',
    moments: initialMoments,
    exerciseCode: exercise.code,
    groupCode: cleanGroupCode || exercise.code,
    isGroupProject: true,
    syncEnabled: true,
    isTeacherExercise: true,
    exerciseInstructions: exercise.instructions,
    customMoments: exercise.customMoments,
    externalLinks: exercise.links,
    attachedPdf: exercise.attachedPdf,
    fieldMeasurements: exercise.fieldMeasurements,
    exerciseSettings: settings,
    preInspectionCompleted: preInspectDone,
    preInspectionExempted: settings.preInspectionRule === 'DISABLED',
    preInspectionExemptReason:
      settings.preInspectionRule === 'DISABLED'
        ? 'Försyn avstängd av läraren för denna övning'
        : undefined,
    preInspectionPhotos: [],
  };
};

export interface PdfImportResponse {
  ok: boolean;
  exerciseDraft: Partial<TeacherExercise>;
  attachedPdf?: {
    name: string;
    sizeFormatted: string;
    dataUrl: string;
    uploadedAt: string;
  };
  error?: string;
  source?: string;
}

export interface FormsImportResponse {
  ok: boolean;
  exerciseDraft: Partial<TeacherExercise>;
  error?: string;
  source?: string;
}

export interface ExerciseImportOptions {
  targetGroup?: string;
  specialization?: string;
  difficulty?: string;
  textContent?: string;
  fileType?: 'PDF' | 'TXT' | 'PASTE' | 'FORMS' | 'IMAGE';
  strictMode?: boolean;
}

export const importExerciseFromPdf = async (
  pdfBase64: string,
  fileName: string,
  fileSize: number,
  options?: ExerciseImportOptions
): Promise<PdfImportResponse> => {
  try {
    const res = await safeFetchJson<PdfImportResponse>('/api/exercises/import-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64,
        fileName,
        fileSize,
        textContent: options?.textContent,
        fileType: options?.fileType,
        strictMode: options?.strictMode ?? true,
        ...options,
      }),
    });

    if (res.ok && res.data) {
      return res.data;
    }
    return {
      ok: false,
      exerciseDraft: {},
      error: res.error || 'Kunde inte importera eller tolka underlaget.',
    };
  } catch (err: any) {
    return {
      ok: false,
      exerciseDraft: {},
      error: err?.message || 'Ett nätverksfel uppstod vid uppladdning av underlag.',
    };
  }
};

export const importExerciseFromForms = async (
  formsContent: string,
  fileName: string,
  fileFormat: string,
  options?: {
    targetGroup?: string;
    specialization?: string;
    difficulty?: string;
  }
): Promise<FormsImportResponse> => {
  try {
    const res = await safeFetchJson<FormsImportResponse>('/api/exercises/import-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formsContent,
        fileName,
        fileFormat,
        ...options,
      }),
    });

    if (res.ok && res.data) {
      return res.data;
    }
    return {
      ok: false,
      exerciseDraft: {},
      error: res.error || 'Kunde inte tolka eller importera formulärdata.',
    };
  } catch (err: any) {
    return {
      ok: false,
      exerciseDraft: {},
      error: err?.message || 'Ett nätverksfel uppstod vid import av formulär.',
    };
  }
};

export interface SampleDocItem {
  id: string;
  title: string;
  type: 'FORMS_CSV' | 'FORMS_TEXT' | 'FORMS_JSON' | 'PDF_MOCK';
  fileName: string;
  description: string;
  content: string;
}

export const SAMPLE_FORMS_DOCUMENTS: SampleDocItem[] = [
  {
    id: 'sample_avlopp_infiltration_doc',
    title: 'PDF-underlag: Enskilt avlopp med infiltration (NEO / BL26)',
    type: 'FORMS_TEXT',
    fileName: 'Enskilt_avlopp_med_infiltration.txt',
    description: 'Komplett underlag med 5 faser (Material, Innan du börjar schakta, Arbetsbeskrivning, Infiltration, Dokumentera) och samtliga 26 delsteg.',
    content: `Enskilt avlopp med infiltration
1. Material och utrustning
Material:
Bergkross
Avstängningsgrindar
PP-rör
Rör-böjar
Markduk
Maskiner:
Grävmaskin för schaktningsarbete
Hjullastare för frambärning av material
Verktyg:
Laser
Spade
Raka
Padda (vibratorplatta)
Tumstock
Måttband
Såg
Märkspray
Vattenpass
Kniv
Märkpenna
Stamp
Fyllhacka
Ritning och tillverkarens instruktioner:
https://www.avloppscenter.se/shop/216613365-206be9-Neo_slamavskiljare_installationsmanual.pdf
Hus - självfallsledning - BL26 - renat vatten - utsläppspunkt/efterbehandling
-----------------------------------------------------------------------------
---------------------------------------------------------------------------
2. Innan du börjar schakta!
Kontrollera att du har:
Tillverkarens installationsanvisning
Ritning/projektering
Grindar för avstängning av schakt, schaktet ska spärras av så fort arbetet pausas.
Inkommande ledningshöjd
Tankens inloppsnivå
Tankens utlopp och utloppsnivå
Bestämd utloppspunkt/efterföljande rening
Schaktmått
Schaktdjup
Mark- och grundvattenförhållanden
Plan för återfyllning och packning
-----------------------------------------------------------------------------
---------------------------------------------------------------------------
3 .Arbetsbeskrivning 
Steg 1
Läs tillverkarens instruktioner
Rewatec Installations- och monteringsanvisningar
Slamavskiljare NEO och BL26
Kontrollera särskilt: Tankens mått, inloppsnivå, utloppets placering/nivå, krav på kringfyllnad, krav på grundvattennivå, krav på överfyllnad, krav på återkomlighet för service/slamtömning.
Steg 2
Kontrollera förutsättningarna på plats
Lokalisera avloppsledningen från huset, kontrollera var tanken ska placeras, kontrollera vart de renade vattnet ska ledas, kontrollera höjderna på inlopp och utlopp, kontrollera att placeringen fungerar för slamtömning/service
Steg 3
Gör mottagningskontroll
Kontrollera att leveransen är komplett och att inga delar är skadade
Steg 4
Mät ut schaktets yta
Läs tillverkarens anvisning, glöm inte släntlutningen
Steg 5
Bestäm schaktdjupet genom höjdsättning
Kontrollera höjden på den inkommande spillvattenledningen från huset. Tankens inlopp ska placeras så att ledningen kan anslutas med erforderligt fall enligt projektering och tillverkarens anvisningar.
Utgår från tankens angivna inloppsnivå och beräkna därefter tankens bottennivå.
Kontrollera samtidigt att tankens utlopp hamnar på rätt nivå i förhållande till den efterföljande ledningen och utsläppspunkten.
Schaktdjupet bestäms alltså av höjdsättningen, inte enbart av tankens totala höjd.
Steg 6
Schakta
Schakta till beräknad nivå, slänta schaktet enligt regler. Kontrollera schaktbotten mot projekterad nivå. Kontrollera att schaktbotten är stabil och fri från sten och andra föremål som kan skada tanken. Säkerställ erforderligt arbetsutrymme runt tanken
Steg 7
Gör i ordning botten
Följ den aktuella installationsanvisning för material och tjocklek av grusbädd
Lägg ut bäddmaterial. Jämna av. Kontrollera nivå. Kontrollera fall/riktning för anslutande ledningar.
Steg 8
Lyft ner tanken
Kontrollera lyftpunkterna. Använd godkänd lyftutrustning. Sänk tanken försiktigt på bädden. Kontrollera att den står rätt i plan och höjd. Kontrollera att inlopp och utlopp är åt rätt håll.
Steg 9
Anslut ledningarna
Hus -> BL26. Anslut inkommande spillvattenledning med rätt dimension, tätning och fall enligt projektering/tillverkarens instruktion.
BL26 -> efterföljande rening/utsläpp. Anslut utloppet till den lösning som anläggningen är projekterad för.
Steg 10
Förankring och kringfyllning
Fyll tanken och kringfyll enligt tillverkarens instruktioner. Kringfyllningen utförs lagervis med föreskrivet material och packas enligt instruktioner. Kontrollera fortlöpande tankens läge och höjd så att den inte förskjuts under arbetet.
-----------------------------------------------------------------------------
---------------------------------------------------------------------------
4. Infiltration:
Steg 1:
Kontrollera förutsättningarna
Läs igenom aktuell monteringsanvisning från tillverkaren
Kontrollera markens infiltrationsförmåga enligt projektering/markundersökning
Bestäm infiltrationens placering och höjdläge
Kontrollera att anläggningen kan placeras på frostfritt djup enligt projekteringen
Viktigt: Infiltrationens storlek ska bestämmas utifrån belastningen och markens förmåga att ta emot avloppsvattnet. Ändra inte antalet moduler utan att det är projekterat.
Steg 2
Mät ut infiltrationen
Mät ut infiltrationens placering på marken
Markera: Infiltrationens längd och bredd, Schaktets gränser, Höjder och fall, Anslutande ledningar
För aktuellt fabrikat anger monteringsanvisningen:
7 biomoduler för ett hushåll med BDT+WC (BDT= Bad- disk och tvättvatten, WC=skithus)
5 biomoduler för enbart BDT
7 moduler motsvarar ca 8,8 m
5 moduler motsvarar ca 5,5 m
Kontrollera alltid aktuellt projekt eftersom dimensioneringen kan vara annorlunda
Steg 3
Schakta ur
Schakta bort matjord och andra olämpliga massor
Botten ska: Vara stabil, Vara fri från stora stenar, Inte vara tjälad, Ha rätt höjd enligt projekteringen, Har rätt förutsättningar för infiltration
Undvik att köra sönder eller packa infiltrationsytan i onödan med maskinen
Viktigt: Infiltrationsytan är den del av anläggningen där avloppsvattnet ska kunna filtreras ned i marken. Den får därför inte förstöras eller tätas genom onödig packning. Kör ej över tank eller modulerna för infiltration.
Steg 4
Förbered infiltrationsbädden
Om marken har tillräcklig infiltrationsförmåga kan biomodulerna enligt monteringsanvisningen placeras direkt på spridarlagret/infiltrationsytan.
Vid förstärkt infiltration läggs ca 300 mm markbäddssand, 0,2-8 mm, under spridarplattorna.
Fördelningslagret ska vara jämnt och ha rätt nivå. Kontrollera höjden innan modulerna placeras ut.
Steg 5
Lägg ut spridarplattorna
För aktuellt system används 14 spridarplattor till 7 biomoduler.
Placera: Två spridarplattor under varje biomodul, Placera 7 st mot varandra, Plattorna stabilt och jämnt på marken. Kontrollera att spridarplattorna ligger rätt innan biomodulerna läggs på plats
Steg 6
Placera biomodulerna
Biomodulerna placeras på spridarplattorna
Aktuell biomodul har enligt monteringsanvisningen ungefär följande mått: Höjd: 275 mm, Längd: 1 100 mm, Bredd: 550 mm
Placera modulerna i rad med kortsidorna mot varandra.
Kontrollera under arbetets gång att: Modulerna ligger rakt, De står stabilt, Rätt antal moduler används, De ligger på rätt plats enligt ritning/projektering
6.Steg 7
Montera ventilationen
Ventilation ska monteras i ändarna av biomodulerna.
Monteringsanvisningen anger ventilationsrör dim 40 x 2 mm, ett i vardera änden.
Ventilationen bör placeras så att den ena änden är högre och den andra lägre. Det ger möjlighet till luftcirkulation genom anläggningen.
Tänk på att ventilationen ska: Mynna på lämplig höjd, Inte hamna under framtida marknivå, Vara tillräckligt hög för att inte täckas av snö, Inte kapas av för kort. Monteringsanvisningen anger även att ca 12 hål med 10 mm diameter borras i ventilationsröret. Följ alltid den aktuella tillverkarens placering och antal hål.
Steg 8
Montera spridarrören
Spridarrören placeras ovanpå biomodulerna.
Enligt monteringsanvisningen används spridarrör med: Diameter 110 mm, Längd ca 1,1 m
Rörens läggs på modulerna och kopplas samman enligt tillverkarens anvisning. Rören ska bindas fast så att de inte kan flyttas sig under återfyllningen. Kontrollera att rören ligger rätt och har den placering som anges i monteringsanvisningen.
Steg 9
Kontrollera anläggningen innan återfyllningen
Innan något fylls igen ska hela anläggningen kontrolleras.
Kontrollera: Rätt antal biomoduler, Spridarplattorna ligger rätt, Biomodulerna ligger stabilt och rakt, Spridarrören är korrekt placerade, Spridarrören är fastbundna, Ventilationsrören är monterade, Ventilationsrören är utförda enligt anvisningen, Anslutningarna är rätt utförda, Rätt höjder och nivåer, Inga stora stenar finns där de kan skada anläggnigen, Anläggningen är dokumenterad innan den täcks över. Det här är sista möjligheten att enkelt upptäcka och rätta fel.
Steg 10
Skydda biomodulerna
När anläggningen är kontrollerad ska biomodulerna skyddas innan återfyllning. Fyll försiktigt runt modulerna så att de inte flyttas eller skadas. Använd lämpliga massor närmast anläggningen och följ tillverkarens anvisningar.
Steg 11
Återfyll
Återfyll försiktigt runt och ovanför infiltrationen. Enligt monteringsanvisningen ska det vara ca 60 cm täckning av befintliga jordmassor.
Vid återfyllningen: Använd inte stora stenar direkt mot anläggningen, undvik att flytta spridarrör och ventilationsrör, Fyll jämnt runt konstruktionen, Packa inte direkt ovanpå biomodulerna på ett sätt som kan skada dom, Se till att ventilationen fortfarande är fri, Stora stenar ska sorteras bort.
Steg 12
Slutför marken
När infiltrationen är täckt färdigställs marken.
Kontrollera att: Marken leder bort ytvatten från infiltrationen, Inga gropar där vatten kan samlas finns över anläggningen, Ventilationsrören fortfarande är fria, Marknivån stämmer med projekteringen, Återställ området så långt det är möjligt.
Steg 13
Dokumentera arbetet
Innan schaktet fylls igen ska arbetet dokumenteras.
-----------------------------------------------------------------------------
---------------------------------------------------------------------------
5. Dokumentera:
Infiltrationens placering
Höjder
Antal moduler
Spridarplattornas placering
Spridarrörens placering
Ventilationens utförande
Anslutningar
Fotografier före återfyllning
Dokumentationen är viktig både för beställaren vid framtida service och felsökning, men också för godkännande hos kommunens enhet.`,
  },
  {
    id: 'sample_forms_csv',
    title: 'Google Forms / CSV: Egenkontroll Husgrund & Schakt',
    type: 'FORMS_CSV',
    fileName: 'Google_Forms_Egenkontroll_Husgrund.csv',
    description: 'Typiskt exporterat Google Forms-kalkylark med frågor, delmoment och AMA-toleranser.',
    content: `Tidsstämpel;Moment;Kontrollfråga;AMA-kod;Krav och tolerans;Stoppunkt
1;Utsättning;Utsättning av grundprofiler och kryssmått med stålband;BBC.31;Kryssmått max ±5 mm;Nej
2;Schaktbotten;Borttagning av all matjord ner till bärkraftig moränbotten;CBB.1;Fast botten utan vattenfickor eller tjäle;Ja
3;Fiberduk & Makadam;Geotextil N2 med 50 cm överlapp samt makadam 8/16 mm;DCB.1;Bädd laseravvägd i 8 kontrollpunkter;Nej
4;Bottenavlopp & VA;Spillvattenrör 110 mm förlagda med jämnt fall;PBB.1;Fall minst 10-20 promille (1-2 cm/m);Ja
5;Armering & Form;Kantelement i våg samt armering och distansklossar;GBD.1;Täckskikt betong 30 mm min;Ja`,
  },
  {
    id: 'sample_forms_text',
    title: 'Google Forms / Frågetext: Trädäck & Altan 35 kvm',
    type: 'FORMS_TEXT',
    fileName: 'Google_Forms_Trädäck_Frågebatteri.txt',
    description: 'Kopierade frågor och svarsalternativ direkt ur ett Google Forms-prov.',
    content: `Google Forms: Egenkontroll och Arbetsberedning - Altan & Trädäck 35 kvm

Avsnitt 1: Förberedelser och Utsättning
Fråga 1: Har utsättning skett med profiler och linor i 90 graders vinkel?
- Ja, kryssmått har kontrollerats med stålbandmått och stämmer
- Profilställningar är snedsträvade och förankrade i marken
- Höjdfixpunkt är inmätt med rotationslaser

Fråga 2: Är betongplintarna gjutna på frostfritt djup med justerbara stolpskor?
- Schaktdjup är minst 80 cm (frostfritt djup)
- Stolpskor är justerade i lod och våg
[Stoppunkt: Läraren ska kontrollera stolpskor före återfyllning!]

Avsnitt 2: Bärlinor och Bjälklag
Fråga 3: Vilken dimension och c/c-avstånd har använts för bärlina och golvbjälkar?
- Bärlina 45x170 mm monterad i våg med laser
- Golvbjälkar c/c 600 mm monterade med balkskor och ankarspik
- Träskyddsklass NTR/A för markkontakt och NTR/AB för trall

Avsnitt 3: Trall och Infästning
Fråga 4: Hur har trallvirket monterats och skruvats?
- Trall 28x120 mm monterad med kärnsidan (glada sidan) uppåt
- Avstånd mellan brädor 3-5 mm med distanskloss/trallman
- Rostfri trallskruv A2 eller C4 dragen jäms med ytan utan att spräcka träet`,
  },
  {
    id: 'sample_forms_json',
    title: 'Besiktningsformulär (JSON): Plattsättning & Marksten',
    type: 'FORMS_JSON',
    fileName: 'Forms_Plattsättning_Egenkontroll.json',
    description: 'JSON-strukturerat besiktningsformulär med krav, fall och underbyggnad.',
    content: JSON.stringify(
      {
        formTitle: "Besiktningsformulär: Marksten & Plattsättning",
        category: "PLATTSATTNING",
        sections: [
          {
            phase: "Fas 1: Bärlager & Fall",
            question: "Bärlager 0/32 mm komprimerat och avvägt",
            checklist: [
              "Bärlager packat med 450 kg vibratorplatta (minst 6 överfarter)",
              "Fall på bärlagret 20 mm/m bort från byggnad verifierat med laser",
              "Höjdkontroll före sättsand"
            ],
            isStopPoint: true
          },
          {
            phase: "Fas 2: Sättsand & Stenläggning",
            question: "Sättsand 0/4 mm avdragen med rätskiva och sten monterad",
            checklist: [
              "Sättsand tjocklek jämn 30 mm",
              "Kantstöd i betong stadigt monterat med bakstöd",
              "Fogbredd 2-3 mm hålls konstant över hela ytan"
            ],
            isStopPoint: false
          },
          {
            phase: "Fas 3: Fogning & Vibrering",
            question: "Fogsand och slutkontroll",
            checklist: [
              "Hård ogräshämmande fogsand borstad i alla fogar",
              "Ytan avsopad före avvibrering med gummiklädd platta",
              "Fotobevis på färdig yta med rätskiva för toleranskontroll (±3 mm)"
            ],
            isStopPoint: false
          }
        ]
      },
      null,
      2
    ),
  },
];
