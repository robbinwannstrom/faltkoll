export interface MomentAiQuestionItem {
  id: string;
  question: string;
  tag: 'VERKTYG' | 'MATERIAL' | 'MÅTT & AVSTÅND' | 'REGLER & AMA' | 'METOD';
  instantAnswer: string;
}

export interface MomentAiSuggestionConfig {
  momentId: string;
  greetingText: string;
  questions: MomentAiQuestionItem[];
}

export const MOMENT_AI_SUGGESTIONS_DB: Record<string, MomentAiQuestionItem[]> = {
  // ============================================================
  // PROJEKT 4: ALTAN & TRÄDÄCK (Moments 4.1 - 4.10)
  // ============================================================
  '4.10': [
    {
      id: '4.10_1',
      question: 'Vad är en trallman?',
      tag: 'VERKTYG',
      instantAnswer:
        'En trallman är ett specialtillverkat verktyg (en ställbar metall- eller plastmall) som man hakar fast över regeln och mellan trallbrädorna. Den håller brädan rak med ett exakt förinställt mellanrum (oftast 3–5 mm) medan du skruvar fast brädan. Det gör att du slipper mäta för hand och sparar massor av tid.'
    },
    {
      id: '4.10_2',
      question: 'Vad är distanskloss?',
      tag: 'VERKTYG',
      instantAnswer:
        'Distansklossar (eller distansbrickor) är små klossar i fasta mått (ofta 3, 4 eller 5 mm) som du sätter in i springan mellan trallbrädorna under monteringen. De garanterar att spalten blir helt parallell och millimeterjämn över hela trädäcket.'
    },
    {
      id: '4.10_3',
      question: 'Varför just dessa mått (28x120 mm & 3–5 mm mellanrum)?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        '• 28x120 mm: Tjockleken 28 mm ger maximal böjstyvhet vid standardavståndet c/c 600 mm mellan golvreglarna, vilket gör att trallen inte sviktar när folk går på den.\n• 3–5 mm mellanrum: Trä är ett levande material! På hösten suger trallen åt sig regn och sväller med upp till 3–4 mm i bredd. Utan springa pressas brädorna mot varandra och reser sig som ett tält. Dessutom måste vatten och smuts kunna rinna ner fritt.'
    },
    {
      id: '4.10_4',
      question: 'Vad skiljer rostfri trallskruv klass C4 och A2?',
      tag: 'MATERIAL',
      instantAnswer:
        '• Klass C4: Kolstål med kraftig rostskyddande ytbehandling. Lämpligt för vanliga altaner i inlandsklimat och tryckimpregnerat virke.\n• Klass A2 (Rostfritt): Äkta rostfritt stål (AISI 304). Skruven är segare och klarar träets kraftiga sväll- och krymprörelser utan att skruvskallarna knäcks av spänningen. Rekommenderas starkt för större altaner och ädelträ.\n• Tips: Vid saltvattenkust eller runt pool med klor krävs alltid syrafast skruv (Klass A4).'
    },
    {
      id: '4.10_5',
      question: 'Vad betyder att lägga med den "glada sidan" (kärnsidan uppåt)?',
      tag: 'METOD',
      instantAnswer:
        'Titta på brädans kortsida och årsringarna! Om årsringarna ser ut som en leende mun (böjda uppåt) ligger kärnsidan uppåt. När virket torkar krymper det mest längs årsringarna, vilket gör att brädan kupar sig som ett litet paraply (konvext). Då rinner regnvattnet av åt sidorna istället för att bilda en pöl mitt på brädan som ger röta och sprickor.'
    },
    {
      id: '4.10_6',
      question: 'Varför måste man förborra i brädornas ändar?',
      tag: 'METOD',
      instantAnswer:
        'Ändträet i en regel eller trallbräda är sprött och spjälkar mycket lätt när skruven tränger undan träfibrerna. Förborrar du med en smal träborr (ca 3–4 mm) minskar spänningen och träet spricker inte när skruven dras åt.'
    }
  ],

  '4.2': [
    {
      id: '4.2_1',
      question: 'Vilka fraktioner av makadam kan jag använda (t.ex. 8/16 som finns på skolan)?',
      tag: 'MATERIAL',
      instantAnswer:
        'Du kan använda tvättad makadam i flera godkända dimensioner:\n1) 8/16 mm – Mycket vanligt på skolor och mindre byggen. Det är lätt att skotta, raka och jämna till för hand.\n2) 11/16 mm – Mycket populärt och stabilt dräneringsmaterial.\n3) 16/32 mm – Något grövre makadam som är standard vid maskinell utläggning.\nAlla tre fungerar alldeles utmärkt eftersom ingen av dem innehåller sand/nollfraktion!'
    },
    {
      id: '4.2_2',
      question: 'Varför får man absolut inte använda bergskross 0/32 med nollfraktion?',
      tag: 'MATERIAL',
      instantAnswer:
        'Nollfraktionen ("nollan" i 0/32) består av krossat stenmjöl och fint damm. När det blir fuktigt suger det fina dammet upp vatten underifrån genom kapillärkraft (ungefär som en sockerbit i kaffe). När vintern kommer fryser detta vatten till iskristaller som expanderar och skjuter upp hela altanen av tjäle! Tvättad makadam (utan nollfraktion) har stora hålrum som bryter kapillärkraften helt.'
    },
    {
      id: '4.2_3',
      question: 'Vad innebär fiberduk klass N2?',
      tag: 'MATERIAL',
      instantAnswer:
        'Fiberduk (geotextil) klass N2 är en stark nålad fiberduk avsedd för markseparation. Den läggs mellan undergrunden (leran/jorden) och makadamen. Den släpper igenom vatten men hindrar makadamstenarna från att tryckas ner i leran över tid.'
    },
    {
      id: '4.2_4',
      question: 'Hur mycket ska fiberduken överlappa i skarvarna?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        'Enligt AMA Anläggning ska fiberduk överlappas med minst 30–50 cm. Vid mjuk lera eller blöt mark rekommenderas minst 50 cm. Lägg lite makadam direkt på skarvarna så inte duken glider isär när ni kärrar ut massorna.'
    }
  ],

  '4.3': [
    {
      id: '4.3_1',
      question: 'Vad innebär tjälfritt djup och hur djupt måste man gräva plintarna?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        'Tjälfritt djup är det markdjup där tjälen inte når under den kallaste vintern. I södra Sverige är det ca 60–80 cm, i Mellansverige 1,0–1,5 meter och i Norrland upp till 2 meter. För en altan ska plintarna ner minst 60–70 cm, eller stå på en tjälisolerad makadambädd med cellplastskivor.'
    },
    {
      id: '4.3_2',
      question: 'Varför lägger man en bottenplatta eller marksten under plinten?',
      tag: 'METOD',
      instantAnswer:
        'En plint har en relativt smal bottenyta. En bred betongplatta (eller 35x35 cm marksten) under plintens fot sprider ut hela altanens tyngd över en mycket större markyta så att plinten inte sjunker ner i marken när altanen belastas med möbler och människor.'
    },
    {
      id: '4.3_3',
      question: 'Varför är maxavståndet 2,0 meter mellan plintarna?',
      tag: 'REGLER & AMA',
      instantAnswer:
        'Om spännvidden mellan plintarna blir längre än 2,0 meter böjer sig bärlinan under tyngden och hela altanen börjar gunga. 2,0 meter är den dimensionerande maxspännvidden för standardbärlinor i 45x170 mm NTR/A-virke.'
    }
  ],

  '4.4': [
    {
      id: '4.4_1',
      question: 'Varför ska man återfylla med enbart ren makadam runt plintarna?',
      tag: 'MATERIAL',
      instantAnswer:
        'Om du skottar tillbaka leran eller jorden som grävdes upp, fryser leran fast mot betongplintens råa yta under vintern (så kallad sidofriktion). När marken tjälar lyfter leran med sig plinten uppåt! Ren makadam (t.ex. 8/16 mm på skolan, 11/16 eller 16/32) släpper igenom vattnet och fryser inte fast mot betongen.'
    },
    {
      id: '4.4_2',
      question: 'Hur packar man makadamen runt plinten för att den ska stå stadigt?',
      tag: 'METOD',
      instantAnswer:
        'Fyll inte hela gropen på en gång! Häll i makadam i lager om ca 15–20 cm. Packa varje lager noga med en handstöt eller en kraftig träregel runt alla plintens fyra sidor så att den hålls helt stum i lod.'
    }
  ],

  '4.6': [
    {
      id: '4.6_1',
      question: 'Vad är kryssmätning och varför är det så viktigt?',
      tag: 'METOD',
      instantAnswer:
        'Kryssmätning innebär att du mäter de diagonala avstånden mellan motsatta hörn (hörn A till C, och hörn B till D). Om båda diagonalerna är exakt lika långa på millimetern (max 5 mm avvikelse) är alla fyra hörn garanterat 90 grader vinkelräta. Om diagonalerna skiljer sig är stommen sned, och då kommer trallbrädorna att löpa snett i slutet!'
    },
    {
      id: '4.6_2',
      question: 'Hur fungerar 3-4-5-metoden (Pythagoras sats)?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        'För att kontrollera 90 graders vinkel mot husväggen:\n1) Mät ut 3 meter längs husväggen och sätt ett märke.\n2) Mät ut 4 meter rakt ut längs altanens kantregel.\n3) Mät avståndet mellan dessa två märken. Om vinkeln är exakt 90 grader ska diagonalen vara precis 5,00 meter! (3² + 4² = 9 + 16 = 25, √25 = 5).'
    }
  ],

  '4.7': [
    {
      id: '4.7_1',
      question: 'Vad innebär tryckimpregneringsklass NTR/A?',
      tag: 'MATERIAL',
      instantAnswer:
        'NTR/A är den högsta skyddsklassen för tryckimpregnerat trä och krävs för allt bärande konstruktionsvirke som har markkontakt eller riskerar permanent fukt. Bärlinor och stolpar ska alltid vara NTR/A. Vanliga trallbrädor är oftast NTR/AB (för virke ovan mark).'
    },
    {
      id: '4.7_2',
      question: 'Varför lägger man en remsa syllpapp i stolpskon?',
      tag: 'METOD',
      instantAnswer:
        'Stolpskon är av stål eller gjuten i betong. Där stål och betong möter trä bildas fukt och kondens. En bit syllpapp (asfaltpapp) bryter kontakten och hindrar bärlinans känsliga ändträ och undersida från att suga upp fukten och ruttna.'
    }
  ],

  '4.8': [
    {
      id: '4.8_1',
      question: 'Vad betyder c/c 600 mm och hur mäter man det?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        'c/c står för "centrum till centrum". Det betyder att avståndet från mitten av en regel till mitten av nästa regel ska vara exakt 600 mm (60 cm). Vid c/c 600 mm sviktar inte 28 mm trall. Mäter du från regelns vänsterkant till nästa regels vänsterkant får du exakt samma mått (600 mm).'
    },
    {
      id: '4.8_2',
      question: 'Varför måste c/c-måttet minskas till 400 mm om man har 22 mm trall?',
      tag: 'REGLER & AMA',
      instantAnswer:
        '22 mm trall är tunnare och har betydligt lägre böjhållfasthet än 28 mm trall. Om man lägger 22 mm trall med 600 mm mellan reglarna kommer altanen att svikta kraftigt och kännas som en studsmatta när man går på den. Därför kräver Svenskt Trä c/c 400 mm för 22 mm trall.'
    }
  ],

  '4.9': [
    {
      id: '4.9_1',
      question: 'Vad är en kortling och varför behövs den?',
      tag: 'VERKTYG',
      instantAnswer:
        'En kortling är en kort bit regelvirke av samma dimension som skruvas in vinkelrätt mellan två golvreglar. Den fungerar som extra stöd under trallen där brädor ska skarvas, eller runt stolpar och frisramar.'
    },
    {
      id: '4.9_2',
      question: 'Varför måste man sätta dubbla kortlingar vid trallskarvar?',
      tag: 'METOD',
      instantAnswer:
        'Två tralländar får ALDRIG skruvas i samma enkla 45 mm regel. Då hamnar skruvarna för nära brädornas ändträ (mindre än 15–20 mm från kanten), vilket gör att träet spricker och skruvarna släpper efter ett år. Med två kortlingar får varje brädände en hel och egen 45 mm regel att skruvas i med säkert avstånd.'
    }
  ],

  // ============================================================
  // PROJEKT 1: HUSGRUND (PLATTA PÅ MARK)
  // ============================================================
  '1.1': [
    {
      id: '1.1_1',
      question: 'Vad är matjord och varför måste all matjord schaktas bort?',
      tag: 'MATERIAL',
      instantAnswer:
        'Matjord är det översta organiska jordlagret med rötter, maskar och förmultnande växtrester. Matjord kan inte packas, förmultnar över tid vilket skapar hålrum, och håller kvar fukt som fryser till tjäle. En husgrund måste alltid vila på ren, orörd mineraljord (grus, morän, sand eller berg).'
    },
    {
      id: '1.1_2',
      question: 'Hur vet man att man nått fast mineraljord?',
      tag: 'METOD',
      instantAnswer:
        'Färgen ändras tydligt från svart/mörkbrun till ljusare gulbrun morän, sand eller fast grå lera. Ytan känns stum och hård när du trycker ner skopspetsen eller känner med foten, och inga växtrötter finns kvar.'
    }
  ],

  '1.5': [
    {
      id: '1.5_1',
      question: 'Vad är en profil och hur sätts en byggnadsprofil upp?',
      tag: 'VERKTYG',
      instantAnswer:
        'En profil består av träpålar och en vågrät tvärslå i trä som slås ner utanför schakten i varje hörn av huset. På tvärslån slås spikar eller sågas jack där murarsnören spänns upp. Skärningspunkten mellan snörena visar exakt var grundens ytterhörn ska ligga.'
    },
    {
      id: '1.5_2',
      question: 'Varför sätter man profilerna minst 1,5 meter utanför grunden?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        'För att grävmaskiner, dumpers och vibratorplattor ska kunna arbeta och schakta utan att köra på profilerna eller rubba snörena under markarbetet.'
    }
  ],

  '1.8': [
    {
      id: '1.8_1',
      question: 'Varför måste dräneringsröret ligga lägre än plattans isolering?',
      tag: 'REGLER & AMA',
      instantAnswer:
        'Enligt AMA Anläggning ska dräneringsrörets högsta punkt (hjässa) alltid ligga under underkanten på husgrundens bärande isolering. Om röret ligger för högt kommer grundvatten eller smältvatten att tränga in i isoleringen och blöta ner betongplattan.'
    },
    {
      id: '1.8_2',
      question: 'Vilken makadam och fiberduk ska omsluta dräneringsröret?',
      tag: 'MATERIAL',
      instantAnswer:
        'Dräneringsröret ska omslutas av minst 15 cm tvättad makadam (t.ex. 8–16 mm eller 11–16 mm) och hela schaktgraven svepas in med fiberduk (Klass N2). Detta hindrar finkornigt slam från att sätta igen slitsarna i röret.'
    }
  ],

  '1.11': [
    {
      id: '1.11_1',
      question: 'Vilken makadam kan användas under husgrunden (t.ex. 8/16 i skolan)?',
      tag: 'MATERIAL',
      instantAnswer:
        'Tvättad makadam utan nollfraktion ska användas: 8–16 mm, 11–16 mm eller 16–32 mm. På skolan och i utbildningshallar används ofta 8–16 mm eftersom den är smidig att hantera och finjustera höjden på med laser. Det viktiga är att materialet är tvättat så porerna bryter kapillärsugningen.'
    },
    {
      id: '1.11_2',
      question: 'Hur tjocka skikt ska man padda med vibratorplatta?',
      tag: 'METOD',
      instantAnswer:
        'Packa i skikt om max 20–30 cm. Kör minst 4–5 överfarter i kors över varje lager. Lägger man på 50 cm makadam på en gång orkar paddans vibrationer inte komprimera botten, vilket kan leda till att grunden sätter sig senare.'
    }
  ],

  '1.12': [
    {
      id: '1.12_1',
      question: 'Vad är ett L-element och hur sätts det i linje?',
      tag: 'VERKTYG',
      instantAnswer:
        'Ett L-element är ett fabrikstillverkat kantelement av cellplast med en hård fibercementyta på utsidan. Det bildar både form och isolering för husets kantbalk. Det ställs upp längs profilsnörena och vägs av med millimeterprecision med laser.'
    },
    {
      id: '1.12_2',
      question: 'Hur gjutsäkrar man kantelement så de inte kalvar utåt?',
      tag: 'METOD',
      instantAnswer:
        'När betongbilen pumpar i den tunga betongen blir trycket enormt! För att elementen inte ska välta utåt (kalva) återfyller man med makadam eller jord som ett tungt mothåll på utsidan, sätter skråstöttor i trä och fäster plastkilar mellan elementets fot och cellplastbotten.'
    }
  ],

  '1.14': [
    {
      id: '1.14_1',
      question: 'Vad är armeringsdistanser (armeringsklossar)?',
      tag: 'VERKTYG',
      instantAnswer:
        'Armeringsdistanser är plast- eller betongklossar (ofta 30, 40 eller 50 mm höga) som placeras under armeringsnäten. De lyfter upp armeringen från cellplasten så att betongen kan rinna runt under stålet och ge föreskrivet täckskikt mot korrosion.'
    },
    {
      id: '1.14_2',
      question: 'Hur mycket ska armeringsnät överlappa vid skarv?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        'Enligt svensk betongstandard ska armeringsnät överlappas med minst 2 hela maskor (ca 200–300 mm beroende på nättyp). Skarvarna nystas eller najas fast med najtråd så att näten inte förskjuts under gjutningen.'
    }
  ],

  // ============================================================
  // PROJEKT 2: PLATTSÄTTNING & MARKSTEN
  // ============================================================
  '2.1': [
    {
      id: '2.1_1',
      question: 'Vad skiljer bärlager (0–32 mm) från sättsand (0–4 mm)?',
      tag: 'MATERIAL',
      instantAnswer:
        'Bärlager 0–32 mm innehåller krossad sten från damm upp till 32 mm. När det packas med padda låser stenarna varandra till en stenhård, bärande "betongliknande" kaka. Sättlager (0–4 mm sand eller 2–5 mm flis) är ett tunt, mjukt justerskikt (ca 3 cm) som man drar av jämnt för att bädda in plattorna i.'
    },
    {
      id: '2.1_2',
      question: 'Hur mycket fall krävs bort från husgrunden vid plattsättning?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        'Minst 1:50 till 1:100 (dvs 1–2 cm fall per meter). Vatten får aldrig rinna mot husväggen eller samlas i pölar på gången.'
    }
  ],

  '2.3': [
    {
      id: '2.3_1',
      question: 'Vad är avdragsbanor och hur fungerar en rätskiva?',
      tag: 'VERKTYG',
      instantAnswer:
        'Avdragsbanor är raka järnrör eller reglar som man väger in i sättsanden med laser eller vattenpass. Sedan drar man en lång rätskiva (aluminiumbalk) över rören med sågande rörelser. När rören tas bort fylls spåren försiktigt igen med sättsand utan att man trampar på ytan.'
    },
    {
      id: '2.3_2',
      question: 'Varför får man absolut inte gå på den avdragna sanden?',
      tag: 'METOD',
      instantAnswer:
        'Varje fotspår packar sanden lokalt. Även om man krattar igen spåret har sanden olika densitet, vilket gör att plattan som läggs ovanpå kommer att sjunka ojämnt och ge en ful sättning i markbeläggningen.'
    }
  ],

  '2.5': [
    {
      id: '2.5_1',
      question: 'Vad är ogräshämmande fogsand och hur fyller man fogarna?',
      tag: 'MATERIAL',
      instantAnswer:
        'Ogräshämmande fogsand har ett naturligt högt pH-värde och speciell mineralblandning som gör att ogräs och mossa inte trivs. Sanden sopas ner diagonalt över plattorna i torrt väder, och packas sedan med en vibratorplatta med gummimatta.'
    }
  ],

  // ============================================================
  // PROJEKT 3: ENSKILT AVLOPP & INFILTRATION
  // ============================================================
  '3.1': [
    {
      id: '3.1_1',
      question: 'Vad är ett rulltest för markart och hur görs det?',
      tag: 'METOD',
      instantAnswer:
        'Rulltestet är en enkel geoteknisk fältmetod: Fukta lite av den uppgrävda jorden och rulla den mellan handflatorna till en korv. Om du kan rulla en 3 mm smal tråd utan att den spricker innehåller jorden mycket lera (tät, dålig infiltration). Om den smular sig och inte håller ihop är det sand/grus (god infiltration).'
    }
  ],

  '3.3': [
    {
      id: '3.3_1',
      question: 'Vilken makadam ska användas i spridningslagret?',
      tag: 'MATERIAL',
      instantAnswer:
        'Spridningslagret ska bestå av tvättad makadam utan nollfraktion. Standard är 16–32 mm eller 11–16 mm (ca 25–30 cm tjockt lager). Det måste vara helt rent från jord och stenmjöl så att inte mikroorganismer och avloppsvatten sätter igen porerna.'
    },
    {
      id: '3.3_2',
      question: 'Hur fungerar en fördelningsbrunn med utjämningsklockor?',
      tag: 'VERKTYG',
      instantAnswer:
        'Fördelningsbrunnen tar emot det renade vattnet från slamavskiljaren och fördelar det jämnt till spridarledningarna. I utloppen sitter ställbara plastklockor som vrids så att exakt lika mycket vatten rinner ut i varje rörslinga.'
    }
  ]
};

/**
 * Smart getter that returns the most relevant questions for a moment.
 * If specific curated questions exist, they are returned.
 * If not, it parses keywords from the instruction and student tips to build custom questions!
 */
export function getSmartAiSuggestionsForMoment(
  momentId: string,
  momentTitle: string,
  instruction: string,
  studentTip?: string,
  proTip?: string
): MomentAiQuestionItem[] {
  if (MOMENT_AI_SUGGESTIONS_DB[momentId] && MOMENT_AI_SUGGESTIONS_DB[momentId].length > 0) {
    return MOMENT_AI_SUGGESTIONS_DB[momentId];
  }

  // Dynamic extraction based on text contents
  const questions: MomentAiQuestionItem[] = [];
  const fullText = `${instruction} ${studentTip || ''} ${proTip || ''}`.toLowerCase();

  if (fullText.includes('makadam') || fullText.includes('bärlager') || fullText.includes('singel')) {
    questions.push({
      id: 'dyn_makadam',
      question: 'Vilka makadamfraktioner (t.ex. 8/16, 11/16, 16/32) kan användas här?',
      tag: 'MATERIAL',
      instantAnswer:
        'Tvättad makadam i fraktionerna 8/16 mm, 11/16 mm eller 16/32 mm kan användas. 8/16 mm är särskilt vanlig på skolor och mindre projekt. Undvik alltid bergskross med nollfraktion (t.ex. 0/32) som suger upp vatten kapillärt.'
    });
  }

  if (fullText.includes('fiberduk') || fullText.includes('geotextil')) {
    questions.push({
      id: 'dyn_fiberduk',
      question: 'Vad innebär fiberduksklassen och hur mycket ska den överlappa?',
      tag: 'REGLER & AMA',
      instantAnswer:
        'Fiberduk (geotextil) klass N1, N2 eller N3 används för separation och filtrering. Vid omlottläggning ska skarvarna överlappa minst 30–50 cm för att förhindra att massor tränger igenom vid belastning.'
    });
  }

  if (fullText.includes('laser') || fullText.includes('avvägning') || fullText.includes('plushöjd')) {
    questions.push({
      id: 'dyn_laser',
      question: 'Hur fungerar laseravvägning och vilken tolerans tillåts?',
      tag: 'METOD',
      instantAnswer:
        'Rotationslasern ställs upp i centrum av bygget och kalibreras. Mottagaren på laserstången piper när rätt plushöjd nås. Toleransen är normalt ±5 mm under bärande konstruktioner enligt AMA Anläggning.'
    });
  }

  if (fullText.includes('fall') || fullText.includes('promille') || fullText.includes('lutning')) {
    questions.push({
      id: 'dyn_fall',
      question: 'Hur mycket fall krävs och varför får det inte vara bakfall?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        'Minsta fall är vanligen 1:50 till 1:100 (1–2 cm per meter). Bakfall innebär att vatten rinner bakåt eller stannar i pölar, vilket kan ge fuktskador, sättningar och frostsprängning på vintern.'
    });
  }

  if (fullText.includes('padda') || fullText.includes('packa') || fullText.includes('komprimering')) {
    questions.push({
      id: 'dyn_padda',
      question: 'Hur tjocka skikt ska packas och hur många överfarter krävs med paddan?',
      tag: 'METOD',
      instantAnswer:
        'Packa i skikt om max 20–30 cm. Kör minst 4–6 överfarter i kors över varje lager. Vid dålig packning kommer marken att sätta sig när byggnaden belastas.'
    });
  }

  // Generic fallback if empty
  if (questions.length === 0) {
    questions.push({
      id: 'dyn_gen_1',
      question: `Vad är de viktigaste kraven och fällorna för ${momentTitle}?`,
      tag: 'REGLER & AMA',
      instantAnswer:
        `För ${momentTitle} är det kritiskt att följa toleranser i AMA, kontrollera underlagets bärighet och fota utförd åtgärd med tidsstämpel och tumstock/laser före övertäckning.`
    });
    questions.push({
      id: 'dyn_gen_2',
      question: 'Vilka verktyg och kontrollmått behöver jag ha redo här?',
      tag: 'VERKTYG',
      instantAnswer:
        'Ha laser/vattenpass, tumstock, rätt skruv/fästdon och personlig skyddsutrustning redo. Kontrollera alltid mått mot ritning innan montering eller gjutning.'
    });
  }

  return questions;
}
