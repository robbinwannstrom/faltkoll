import { MomentDefinition, ProjectType } from '../types';

export const ALL_MOMENTS: MomentDefinition[] = [
  // ==========================================
  // PROJEKT 1: HUSGRUND (PLATTA PÅ MARK) - ME LÄROMEDEL & AMA STANDARD
  // ==========================================
  {
    id: '1.1',
    projectType: 'HUSGRUND',
    order: 1,
    phaseNumber: 1,
    phaseName: 'FAS 1: Inmätning & Profiler',
    title: 'Inmätning & profiler',
    amaCode: 'BBC.31',
    instruction: 'Kontrollera ledningsanvisning via Ledningskollen.se innan markarbeten påbörjas. Märk ut befintliga ledningar enligt svensk färgstandard: El = gul (kabelskydd 15 cm över), Fiber = grön, Tele = orange, Fjärrvärme = lila. Maskingrävning är förbjuden inom 1 meter från anvisad elkabel (skall friläggas genom handschakt med spade). Vid luftledning hålls minst 6 m säkerhetsavstånd i sidled och 5,5 m i höjdled om spänning är okänd. Montera profilställningar utanför schaktområdet och spänn upp profilsnören. Kontrollera kryssmått med Pythagoras sats: mät diagonalt så att differensen mellan diagonalerna är maximalt ±3–5 mm.',
    studentTip: 'Maskingräv ALDRIG närmare än 1 meter från en elkabel (EBR/ME-standard). Frilägg alltid med spade för hand. En avgrävd högspänningskabel är direkt livsfarlig!',
    proTip: 'Lita aldrig blint på gamla ledningskartor. Slå ner profilerna med god marginal utanför schaktkanten och mät in mot fast höjdfix (RH2000) både morgon och kväll.',
    criticalValidationHint: 'Fota utsatta ledningsmarkeringar, spända profilsnören och kryssmått.'
  },
  {
    id: '1.2',
    projectType: 'HUSGRUND',
    order: 2,
    phaseNumber: 1,
    phaseName: 'FAS 1: Inmätning & Profiler',
    title: 'Avtäckning & Matjordsschakt',
    amaCode: 'CBB.1',
    instruction: 'Schakta bort all matjord och organiska jordlager inom byggnadsytan plus erforderlig frischakt (tumregel: minst 60 cm fritt utanför grundmuren runt om för dränering, ledningar och markisolering enligt ME-standard, bredare vid källare). Matjorden läggs i separat upplag med max 6 m bredd och 1,5–2,5 m höjd så att syretillförseln inte stryps och mikroorganismerna dör. Träd som ska bevaras skyddas med staket minst 2 m utanför trädkronans ytterkant (eller 15× stammens diameter).',
    studentTip: 'Läggs matjord i för höga högar (> 2,5 m) dör jordens mikroliv. Matjord får aldrig blandas med fyllnadsmassor eller lämnas under grunden, då multnar den och huset sätter sig.',
    proTip: 'Planera upplaget så du slipper flytta massorna i onödan. Se till att schaktbotten ges svagt fall bort från byggnaden så att schaktgropen inte vattenfylls vid skyfall.',
    criticalValidationHint: 'Fota schaktbotten ren från matjord samt separat matjordsupplag.'
  },
  {
    id: '1.3',
    projectType: 'HUSGRUND',
    order: 3,
    phaseNumber: 2,
    phaseName: 'FAS 2: Schakt & Geotextil',
    title: 'Schaktbotten',
    amaCode: 'CBE.1',
    instruction: 'Rensa schaktbotten ner till fast, orörd mineraljord eller berg. Schaktbotten ska vara jämn, bärkraftig och fri från löst material samt stenar större än 60 mm. Schaktbotten ska lutas svagt utåt sidorna mot dräneringsbädden så att vatten kan rinna bort från grunden. Vid bergschakt ska sprängsten tätas med krossmaterial 0/32 mm och packas ordentligt (inga berggaddar får sticka upp). Schaktbotten ska hållas fri från tjäle och länshållas vid vatteninträngning.',
    studentTip: 'Kör inte sönder en blöt lerbotten med maskinens larver. Är marken vattenkänslig (silt eller lera) läggs fiberduk och bärande kross ut direkt framför maskinen.',
    proTip: 'Vid övergång mellan berg och lera/morän måste utspetsning göras (minst 0,5 m djup kil, 3 m lång på var sida om brytpunkten) med bergkross för att förhindra ojämna sättningar.',
    criticalValidationHint: 'Fota laseravvägning och jämn schaktbotten utan stenar > 60 mm.'
  },
  {
    id: '1.4',
    projectType: 'HUSGRUND',
    order: 4,
    phaseNumber: 2,
    phaseName: 'FAS 2: Schakt & Geotextil',
    title: 'Fiberduk',
    amaCode: 'YJJ.1',
    instruction: 'Rulla ut geotextil (materialskiljande fiberduk klass N2, vid sämre bärighet eller lera klass N3) över hela schaktbotten. Skarva duken med minst 50 cm överlapp i alla fogar. Duken ska dras ut så att den även täcker hela frischakten på sidorna och viks upp mot schaktväggarna.',
    studentTip: 'Fiberdukens uppgift är att förhindra att det dränerande makadamskiktet trycks ner i undergrunden och att finjord inte tränger upp. Skarvarna måste hållas intakta.',
    proTip: 'Säkra skarvarna med spadtag av makadam omedelbart så att inte backande dumper eller vindkast rullar upp duken.',
    criticalValidationHint: 'Fota heltäckande fiberduk med minst 50 cm överlapp i frischakten.'
  },
  {
    id: '1.5',
    projectType: 'HUSGRUND',
    order: 5,
    phaseNumber: 3,
    phaseName: 'FAS 3: VA & Dränering',
    title: 'Dränering',
    amaCode: 'PBB.51',
    instruction: 'Lägg perforerade dräneringsrör runt grunden på en 10 cm tjock makadambädd (8/16 mm). Hjässan (överkanten) på dräneringsröret ska ligga minst 15 cm under nivån för makadam eller isolering under plattan (ME Läromedel s. 138-139). Ledningen läggs med jämnt fall på minst 5‰ (0,5 cm/m) från högpunkt mot dräneringsbrunn. Spolbrunn placeras vid varje högpunkt. Röret omsluts med 10–20 cm makadam/singel 8/16 mm inbäddat i fiberduk ända upp till marknivå.',
    studentTip: 'Ligger dräneringsrörets hjässa högre än 15 cm under plattans makadambädd sugs fukten in under huset innan den når dräneringen. Fota rörets läge med tumstock mot underkant kantelement!',
    proTip: 'Spolbrunn vid varje högpunkt är ett måste för att ledningen ska kunna spolas ren vid igenslamning. Kontrollera att fallet är kontinuerligt utan svackor.',
    criticalValidationHint: 'Fota dränrörets hjässa (minst 15 cm under isolering/bädd) och fall med vattenpass.'
  },
  {
    id: '1.6',
    projectType: 'HUSGRUND',
    order: 6,
    phaseNumber: 3,
    phaseName: 'FAS 3: VA & Dränering',
    title: 'Dagvatten & Spolbrunnar',
    amaCode: 'PBB.2',
    instruction: 'Montera separata täta markavloppsrör (orange 110 mm) för takavvattning (stuprör) med fall minst 10‰ (1 cm/m) till dagvattenbrunn med sandfång. Takvatten får ALDRIG anslutas till dräneringsledningen! Minsta fyllningshöjd över dräneringsledning är 0,4–0,6 m som skydd. Vid återfyllning mot husgrund ska marken alltid luta bort från grunden: tumregel 15 cm lägre 3 meter från huset (ME Läromedel s. 139).',
    studentTip: 'Takavlopp har enorma flöden vid skyfall – ansluts de till dräneringen trycks vattnet bakvägen in under plattan och förstör huset. Håll dem 100% åtskilda!',
    proTip: 'Märk locken tydligt: DV (dagvatten) respektive DR (dränering). Se till att marklutningen ut från fasad är minst 15 cm på 3 meters avstånd så inte ytvatten rinner mot grundmuren.',
    criticalValidationHint: 'Fota separata täta dagvattenledningar och anslutning till sandfångsbrunn.'
  },
  {
    id: '1.7',
    projectType: 'HUSGRUND',
    order: 7,
    phaseNumber: 3,
    phaseName: 'FAS 3: VA & Dränering',
    title: 'Bottenavlopp & Spillvatten',
    amaCode: 'PBB.1',
    instruction: 'Förlägg spillvattenledningar (110 mm PP/PVC) för wc, bad, kök och tvätt. Självfallsledningar med diameter 110 mm ska ha en lutning på minst 10‰ (10 mm/m / 1 cm/m). Schaktbotten i ledningsgraven ska ha en bredd om minst 35 cm på varje sida om ledningen (minst 70 cm + rördiameter). Ledningsbädd utförs 15 cm tjock (minst 10 cm under muff, kross max 0/16 mm för plaströr). Stödpackning utförs med tjocklek minst 5 cm (formel: 0,2 × Dy i mm) och understoppas noggrant för hand med vänd skyffel. Kringfyllning utförs i skikt om max 20 cm upp till 30 cm över rörets hjässa.',
    studentTip: 'Understoppning under rörets midja är helt avgörande: utan understoppning hänger röret i luften och knäcks när jorden packas ovanpå. Max förläggningsdjup för plaströr är 6 meter (betongrör 12 meter).',
    proTip: 'Sätt på fabriksrörproppar direkt vid varje uppstick så att inte grus eller betong ramlar ner. Provspola alltid med vatten och kontrollera fallet med rörlaser eller digitalt vattenpass.',
    criticalValidationHint: 'Fota rörbädd, understoppning, fallmätning och fixerade rörproppar.'
  },
  {
    id: '1.8',
    projectType: 'HUSGRUND',
    order: 8,
    phaseNumber: 3,
    phaseName: 'FAS 3: VA & Dränering',
    title: 'Inkommande vatten & el',
    amaCode: 'PBB.4',
    instruction: 'Förlägg inkommande vatten med tryckrör/PEM-slang (minst 32 mm för servisledning till villa, märkt med blå rand för dricksvatten) och montera servisventil vid anslutningspunkt. Förlägg kabelskyddsrör för el (gult), optofiber (grönt) och tele (orange) under grunden upp till teknikrum. Kabelgravar ska ha ett djup om 70–80 cm med 10 cm sandbädd och 10 cm kringfyllning (max 4 mm natursand/stenmjöl om kabel läggs utan skyddsrör, max 20 mm med rör). Gult markeringsband läggs 30–40 cm ovanför kabeln.',
    studentTip: 'Skyddsrör för el och vatten måste ha mjuka böjar (minst 1 meters radie) under grunden så att slangar och kablar går att dra igenom utan tvärstopp.',
    proTip: 'Surra dragtråden i båda ändarna med ståltråd så den inte sugs in vid återfyllning. Plugga ändarna med täta plastlock för att hålla lera och fukt ute.',
    criticalValidationHint: 'Fota tomrörsböjar med mjuka radier, dragtråd och servisventil.'
  },
  {
    id: '1.9',
    projectType: 'HUSGRUND',
    order: 9,
    phaseNumber: 4,
    phaseName: 'FAS 4: Grundfyllning & Packning',
    title: 'Radonsäkring',
    amaCode: 'DFD',
    instruction: 'Vid risk för markradon läggs godkänd radonduk mellan två av cellplastskikten i plattan alternativt perforerad radonslang i serpentinslingor i det kapillärbrytande makadamlagret med uppstick för framtida fläktanslutning. Täta alla rörgenomföringar lufttätt med godkända radontätningsmanschetter och butylband (ME Läromedel s. 126, 137).',
    studentTip: 'Radon är en osynlig, luktfri radioaktiv gas som bildas när radium sönderfaller och är den näst vanligaste orsaken till lungcancer. Tätheten i grunden är livsviktig!',
    proTip: 'Täta rörgenomföringarna med dubbla manschetter och butylfog. Kontrollera att duken inte har skadats eller punkterats av armering eller vassa stenar.',
    criticalValidationHint: 'Fota radontätning vid rörgenomföringar och radonduk/slang.'
  },
  {
    id: '1.10',
    projectType: 'HUSGRUND',
    order: 10,
    phaseNumber: 4,
    phaseName: 'FAS 4: Grundfyllning & Packning',
    title: 'Laserinvägning & Avdragningsbädd',
    amaCode: 'DCB.11',
    instruction: 'Väg av och finjustera det kapillärbrytande makadamlagret under kantelementens blivande fot med rotationslaser mot fastställd höjdfixpunkt (stompunkter/höjdfixar). Höjdavvikelsen under kantelementen får maximalt vara ±5 mm från projekterad plushöjd.',
    studentTip: 'Moderna husgrunder kräver millimeterprecision. Om makadambädden under kantelementen varierar mer än 5 mm blir grundsockeln vågig och väggarna sneda.',
    proTip: 'Kontrollera lasermottagarens kalibrering mot en fast fixpunkt (t.ex. berg eller betongsockel) både morgon och kväll. Vältar och tung trafik kan rubba stativet.',
    criticalValidationHint: 'Fota lasermottagare och mätdorn mot avdragen bädd under kantelement.'
  },
  {
    id: '1.11',
    projectType: 'HUSGRUND',
    order: 11,
    phaseNumber: 4,
    phaseName: 'FAS 4: Grundfyllning & Packning',
    title: 'Uppfyllnad & Packning',
    amaCode: 'CEB.21',
    instruction: 'Fyll upp med ett kapillärbrytande och dränerande lager av tvättad makadam eller singel utan nollfraktion (fraktion 8/16 mm eller 16/32 mm, minst 20 cm tjockt lager enligt ME Läromedel s. 137). Packa i skikt om max 20–30 cm med vibratorplatta (padda) med 6–10 överfarter per lager enligt tabell AMA CE/3 (ME s. 78). Materialet får inte innehålla stenar större än 2/3 av lagertjockleken före packning (ME s. 77).',
    studentTip: 'Lagret MÅSTE vara minst 20 cm tvättad makadam (8/16 eller 16/32 mm) utan sand för att bryta kapillärkraften så att inte markfukt sugs upp i plattan. Enligt AMA CE/3 krävs 6–10 överfarter.',
    proTip: 'Kör vibratorplattan i korsmönster över varje skikt. Stenar större än 2/3 av lagertjockleken (t.ex. max 20 cm sten i ett 30 cm lager) ska alltid plockas bort före packning.',
    criticalValidationHint: 'Fota packning i skikt med vibratorplatta och mätsticka för lagertjocklek.'
  },
  {
    id: '1.12',
    projectType: 'HUSGRUND',
    order: 12,
    phaseNumber: 5,
    phaseName: 'FAS 5: Form & Isolering',
    title: 'Form & Kantelement',
    amaCode: 'GSC.1',
    instruction: 'Sätt ut isolerade kantelement (sockelelement) exakt i våg och linje enligt profilsnörena. Rikta in alla 90-gradershörn och mät kryssmått så att diagonalerna stämmer inom ±3–5 mm. Lås elementens skarvar med skarvplåtar och fästkilar. Bygg upp ett yttre mothåll med makadam/massor eller skråstöttor mot kantelementens utsida för att stå emot betongens hydrostatiska formtryck under gjutning.',
    studentTip: 'Kantelementen utgör den synliga sockeln och ramen för hela grunden. Om yttre mothåll saknas kommer betongmassan (2,4 ton/m³) att pressa ut elementen så att sockeln buktar utåt.',
    proTip: 'Fäst kantelementens botten i underliggande cellplast med tandade plastkilar. Lägg en tung sträng makadam mot fotens utsida direkt.',
    criticalValidationHint: 'Fota kantelement i snörlinje, skarvlås samt yttre mothåll mot gjuttryck.'
  },
  {
    id: '1.13',
    projectType: 'HUSGRUND',
    order: 13,
    phaseNumber: 5,
    phaseName: 'FAS 5: Form & Isolering',
    title: 'Cellplastisolering',
    amaCode: 'DBG.1',
    instruction: 'Lägg ut cellplastisolering (EPS) i tre omlottliggande lager (totalt mellan 20 och 40 cm, normalt 300 mm för modern villa, ME Läromedel s. 137) med förskjutna brutna skarvar i alla riktningar. Lås skivorna mot varandra med plastspik/hullingar. Om radonduk föreskrivs läggs den mellan två av cellplastskikten.',
    studentTip: 'Skivorna läggs omlott med förskjutna skarvar för att bryta alla köldbryggor så att inte värmen från golvvärmen leds ut i marken.',
    proTip: 'Lås cellplastlagren med plastspik så att inte skivorna glider eller blåser iväg. Skär ur tajt runt rörgenomföringar och täta eventuella glipor med fogskum.',
    criticalValidationHint: 'Fota omlottlagda cellplastlager med brutna skarvar och plastspik.'
  },
  {
    id: '1.14',
    projectType: 'HUSGRUND',
    order: 14,
    phaseNumber: 6,
    phaseName: 'FAS 6: Armering & Gjutklar',
    title: 'Armering & Distanser',
    amaCode: 'EBB.1',
    instruction: 'Lägg ut armeringsjärn och byglar i kantbalk och bärande förstärkningar. Rulla ut armeringsnät över cellplasten och lyft upp nätet på armeringsdistanser (speedies/plastklossar, 3–5 cm höga) så att armeringen omsluts helt av betong med föreskrivet täckskikt (minst 30–50 mm). Najja skarvarna med minst två maskors överlapp. Fixera golvvärmeslingor och rörgenomföringar. Plattan gjuts med ett lager av 10 cm betong (grunden bygger totalt 50–70 cm från terrass till FG enligt ME Läromedel s. 137). FOTA ARMERINGEN INNAN BETONGBILEN ANLÄNDER!',
    studentTip: 'Armering som ligger platt mot cellplasten utan distanser ger noll hållfasthet och rostar sönder. Den MÅSTE vila på distansklossar mitt i betongskiktet.',
    proTip: 'Surra alla golvvärmerör och elslangar stenhårt i armeringsnätet så de inte flyter upp när betongen vibreras. Ta översikts- och detaljfoton av hela armeringsbädden innan betongbilen backar in!',
    criticalValidationHint: 'FOTA HELA ARMERINGSBÄDDEN PÅ DISTANSER INNAN BETONGEN ANLÄNDER!'
  },

  // ==========================================
  // PROJEKT 2: PLATTSÄTTNING & MARKSTEN - SKOLANPASSAD
  // (Faser för syn av grannfastigheter/staket borttagna)
  // ==========================================
  {
    id: '2.1',
    projectType: 'PLATTSATTNING',
    order: 1,
    phaseNumber: 1,
    phaseName: 'FAS 1: Höjdsättning & Vinkel',
    title: 'Riktsnöre & Laserhöjd',
    amaCode: 'BJB.3',
    instruction: 'Slå ner armeringsjärn och spänn upp ett spänt riktsnöre. Väg av höjden med laser så att stensättningen får rätt fall (lutning) bort från huset.',
    studentTip: 'Snöret styr både plattlinjen (så att fogarna blir spikraka) och höjden för hela stenläggningen.',
    proTip: 'Ett fall på minst 1–2 cm per meter UT från husväggen är ett absolut krav! Slarvar du med fallet kommer regnvattnet att rinna mot husgrunden istället för bort, vilket skapar fuktskador och källaröversvämning.',
    criticalValidationHint: 'Fota riktsnöre och fallmätning bort från husvägg.'
  },
  {
    id: '2.2',
    projectType: 'PLATTSATTNING',
    order: 2,
    phaseNumber: 1,
    phaseName: 'FAS 1: Höjdsättning & Vinkel',
    title: 'Kryssmätning & Vinkel',
    amaCode: 'BJB.3',
    instruction: 'Kontrollera att riktsnörena ligger i exakt 90 graders vinkel ut från byggnadens vägg med Pythagoras sats (3-4-5-metoden). Kontrollera kryssmått: mät diagonalerna mellan motstående hörn och säkerställ att måtten är identiska innan sättning påbörjas (differens max ±3–5 mm).',
    studentTip: 'Om du mäter 4 meter ut från huset (katet a) och 3 meter längs med huset (katet b), måste diagonalen (hypotenusan c) vara exakt 5 meter.',
    proTip: 'Om du sätter igång att lägga sten utan att ha gjort denna mätning kommer du att märka efter några meter att du måste kapa varenda sten snett i kanten mot huset. Det ser för jävligt ut och kostar massor av tid.',
    criticalValidationHint: 'Fota måttbandets kryssmätning och 90-gradersvinkeln.'
  },
  {
    id: '2.3',
    projectType: 'PLATTSATTNING',
    order: 3,
    phaseNumber: 2,
    phaseName: 'FAS 2: Bärlager & Avdragning',
    title: 'Rör & Avdragning',
    amaCode: 'DCB.32',
    instruction: 'Gräv ner parallella avdragningsrör (ca 30 mm ytterdiameter) i det packade stenfliset (fraktion 2–4 eller 2–5 mm). Mät in rörens ovansida med laser till exakt samma höjd som plattornas underkant. Dra sedan en rätskiva ovanpå rören för att få en helt slät yta.',
    studentTip: 'Att bara kratta eller raka ut gruset ger inte tillräcklig jämnhet. Plattorna kommer att "vingla" om underlaget inte dras av med rör och rätskiva.',
    proTip: 'Ta försiktigt bort rören när du är klar och fyll i spåren efter rören med lite extra flis med en slev eller spade. Trampa ALDRIG på den färdigdragna ytan!',
    criticalValidationHint: 'Fota den avdragna flisytan och ifyllda rörspår.'
  },
  {
    id: '2.4',
    projectType: 'PLATTSATTNING',
    order: 4,
    phaseNumber: 3,
    phaseName: 'FAS 3: Läggning & Passning',
    title: 'Utläggning av Plattor',
    amaCode: 'DEC.1',
    instruction: 'Lägg ut markstenen i önskat förband. Kontrollera att den fasade kanten är uppåt. Använd plattornas inbyggda distanser för att hålla en jämn fog på ca 3 mm.',
    studentTip: 'Använd en plattlyft om stenen är tung. Det skonar ryggen och ger ett betydligt snyggare och mer exakt resultat.',
    proTip: 'Stå alltid på de redan lagda plattorna när du arbetar dig framåt. Gå ALDRIG på den färdigdragna flisytan framför dig, då förstör du underlaget direkt och får börja om.',
    criticalValidationHint: 'Fota raka foglinjer och fogdistanser.'
  },
  {
    id: '2.5',
    projectType: 'PLATTSATTNING',
    order: 5,
    phaseNumber: 3,
    phaseName: 'FAS 3: Läggning & Passning',
    title: 'Kapning av Sten',
    amaCode: 'DEC.1',
    instruction: 'Mät ut passbitarna i kanterna noga, rita en linje med märkpenna och kapa stenen med en motorkap eller ett kapbord med vattenkylning.',
    studentTip: 'Det är livsviktigt att använda skyddsglasögon, hörselskydd och ett andningsskydd med P3-filter. Stendammet (kvartsdamm) orsakar silikos (stendammslunga) och är extremt farligt!',
    proTip: 'Planerar du läggningen smart och använder halvplattor i ändarna kan du slippa upp till 80% av all kapning. Det sparar tid, lungor och dyra diamantkapskivor.',
    criticalValidationHint: 'Fota rena kapade anslutningar och skyddsutrustning.'
  },
  {
    id: '2.6',
    projectType: 'PLATTSATTNING',
    order: 6,
    phaseNumber: 4,
    phaseName: 'FAS 4: Fogning & Slutförande',
    title: 'Fogning med Fogsand',
    amaCode: 'DEC.1',
    instruction: 'Häll ut fogsand (tvättad torkad fogsand fraktion 0–2 mm, ogräshämmande fogsand eller hårdgörande polymerfog) över ytan. Sopa sanden diagonalt över plattorna så att alla fogar fylls helt till toppen. Vibrera därefter ytan med en lätt markvibrator (ca 60–90 kg) utrustad med vulkollanplatta (skyddande gummimatta) så att stenarna sätter sig stumt och fogarna packas utan att stenarnas ytor eller fasade kanter spricker eller repas. Eftersopa med fogsand.',
    studentTip: 'Kör ALDRIG en markvibrator med ren stålplatta direkt på marksten! Utan vulkollanplatta (gummimatta) repas eller krossas stenarnas kanter omedelbart. Fogning ska alltid ske vid torr väderlek så sanden rinner lätt ner i fogarna.',
    proTip: 'Sanden sätter sig efter regn och trafik. Lämna alltid kvar en halv säck fogsand hos kunden/på bygget för eftersopning efter några veckor. En stensättning utan fyllda fogar rör på sig och kantstöts direkt vid belastning!',
    criticalValidationHint: 'Fota diagonalsopade fogar och vibratorplatta med vulkollanplatta (gummimatta).'
  },

  // ==========================================
  // PROJEKT 3: ENSKILT AVLOPP & INFILTRATION - SKOLANPASSAD
  // (Faser för syn av grannfastigheter/staket borttagna)
  // ==========================================
  {
    id: '3.1',
    projectType: 'ENSKILT_AVLOPP',
    order: 1,
    phaseNumber: 1,
    phaseName: 'FAS 1: Markförhållanden & Jordprov',
    title: 'Markbäddstest (Rulltest)',
    amaCode: 'BBC.13',
    instruction: 'Ta ett jordprov från schaktområdet i handen på det tänkta infiltrationsdjupet. Fukta jorden lite och försök rulla den till en smal korv eller ett fast klot i handen (perkolationsbedömning).',
    studentTip: 'Om jordprovet faller isär är marken sandig/grovkornig och perfekt för en infiltration. Om provet blir ett segt, blankt klot som håller ihop är det lera.',
    proTip: 'Om rulltestet visar lera fungerar det INTE med en vanlig infiltration! Vattnet kan inte sugas upp i marken. Då måste man ändra till en "Markbädd med tät botten och dränrör". Bygger man ändå blir det översvämning!',
    criticalValidationHint: 'Fota rulltestet i handflatan som bevis på jordart.'
  },
  {
    id: '3.2',
    projectType: 'ENSKILT_AVLOPP',
    order: 2,
    phaseNumber: 2,
    phaseName: 'FAS 2: Schakt & Nivåkontroll',
    title: 'Schakt för Brunn & Infiltration',
    amaCode: 'CBB.311',
    instruction: 'Gräv gropen för slamavskiljaren (trekammarbrunnen) samt schaktet för infiltrationens spridningslager enligt det beviljade miljötillståndet (vanligtvis 40–50 cm djupt schaktbotten).',
    studentTip: 'Läggs infiltrationen för djupt ner minskar syretillförseln i marken drastiskt, vilket slår ut den biologiska reningen i den syrekrävande biohuden.',
    proTip: 'Kör ALDRIG med grävmaskinen i bottnen av schaktet där infiltrationen ska ligga! Tyngden från skopan och larverna pressar ihop jorden och stänger till markens naturliga porer permanent.',
    criticalValidationHint: 'Fota orörd schaktbotten och djupmätning.'
  },
  {
    id: '3.3',
    projectType: 'ENSKILT_AVLOPP',
    order: 3,
    phaseNumber: 2,
    phaseName: 'FAS 2: Schakt & Nivåkontroll',
    title: 'Grundvattenavstånd (Minst 1m)',
    amaCode: 'BBC.14',
    instruction: 'Mät och kontrollera avståndet ner till grundvattenytan i schaktbotten. Det måste vara minst 1 meter fritt avstånd mellan spridningslagrets botten och högsta grundvattennivå eller berg. FOTA MÄTSTOCKEN!',
    studentTip: 'Detta är kommunens och miljöbalkens absolut viktigaste krav för att godkänna avloppet, annars förorenas grannars och din egen dricksvattenbrunn med bakterier.',
    proTip: 'Om det sipprar in vatten i botten eller om marken är gråblå med rostfläckar (visar högsta grundvattenyta): avbryt omedelbart! Du måste bygga en "upphöjd infiltration" med pumpstation.',
    criticalValidationHint: 'FOTA MÄTSTÄNGEL SOM VISAR MINST 1 METER TILL GRUNDVATTEN!'
  },
  {
    id: '3.4',
    projectType: 'ENSKILT_AVLOPP',
    order: 4,
    phaseNumber: 3,
    phaseName: 'FAS 3: Montage & Rörläggning',
    title: 'Etablering av Trekammarbrunn',
    amaCode: 'PDD.1',
    instruction: 'Sätt ner slamavskiljaren (trekammarbrunnen) i gropen på en avdragen bädd av stenfritt grus/flis. Väg av brunnen i våg med vattenpass och fyll brunnen med vatten direkt under tiden du återfyller runt omkring med sand/flis.',
    studentTip: 'Brunnen måste fyllas med vatten under återfyllningen för att jämna ut marktrycket på utsidan så att inte plasttanken trycks ihop och spricker.',
    proTip: 'Om du återfyller runt en tom plasttank i blöt mark eller lera kommer tanken att fungera som en båt och flyta upp ur gropen vid nästa höstregn! Vatten i tanken direkt, alltid!',
    criticalValidationHint: 'Fota vattenfylld slamavskiljare i våg under återfyllnad.'
  },
  {
    id: '3.5',
    projectType: 'ENSKILT_AVLOPP',
    order: 5,
    phaseNumber: 3,
    phaseName: 'FAS 3: Montage & Rörläggning',
    title: 'Spridningsledningar & Makadam',
    amaCode: 'PBB.531',
    instruction: 'Lägg ut spridningslagret med tvättad makadam utan nollfraktion (fraktion 16–32 mm, 11–16 mm eller 8–16 mm, ca 25–30 cm tjockt). Montera fördelningsbrunnen och lägg ut de slitsade 110 mm spridarrören med ett svagt, jämnt fall (ca 0,5–1 cm per meter).',
    studentTip: 'Rören får absolut inte ligga i bakfall, för då samlas avloppsvattnet i början och fördelas inte jämnt över hela infiltrationsytan.',
    proTip: 'Använd ett långt vattenpass eller laser. Gå försiktigt runt rören så du inte råkar trampa ner dem i gruset så att de tappar sitt exakta fall. Fota fördelningsbrunnens vattenutjämningsklockor!',
    criticalValidationHint: 'Fota fördelningsbrunn, spridarrör och makadambädd.'
  },
  {
    id: '3.6',
    projectType: 'ENSKILT_AVLOPP',
    order: 6,
    phaseNumber: 4,
    phaseName: 'FAS 4: Slutförande & Intyg',
    title: 'Luftningsrör & Geotextil',
    amaCode: 'YJJ.1',
    instruction: 'Montera upprättstående luftningsrör med ventilationshuvar i slutet av varje spridarledning (minst 50 cm över marknivå). Täck hela grusytan med geotextil (fiberduk klass N1/N2) innan återfyllnad med jordmassor. FOTA HELA SYSTEMET!',
    studentTip: 'Fiberduken förhindrar att de övre jordmassorna rinner ner och täpper till hålen i spridarrören och porerna mellan makadamstenarna.',
    proTip: 'Det här fotot är ditt officiella utförandeintyg till kommunens miljöinspektör! Syns fördelningsbrunn, spridarrör, luftningshuvar och fiberduk tydligt på bilden blir anläggningen godkänd direkt utan anmärkning.',
    criticalValidationHint: 'FOTA HELA ANLÄGGNINGEN MED FIBERDUK OCH VENTILATIONSHUVAR!'
  },

  // ==========================================
  // PROJEKT 4: ALTAN & TRÄDÄCK (TJÄLSKYDD & STABILITET)
  // Referens: AMA Anläggning 23 & Svenskt Trä
  // ==========================================
  {
    id: '4.1',
    projectType: 'ALTAN_TRADACK',
    order: 1,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Urgrävning & Avbaning',
    amaCode: 'CBB.11',
    instruction: 'Schakta bort all matjord, rötter och gräs under den planerade altanytan till ett djup av minst 15-20 cm eller till fast mineraljord.',
    studentTip: 'Matjord håller kvar vatten som fryser till is på vintern. Denna is-kaka expanderar och trycker upp hela altanen. Spara massorna för släntning.',
    proTip: 'Schakta tills ren mineraljord eller lera blottas. Skrapa inte för djupt i onödan och säkerställ att schaktbotten inte lutar mot husgrunden.',
    criticalValidationHint: 'Fota schaktbotten fri från matjord och rötter.'
  },
  {
    id: '4.2',
    projectType: 'ALTAN_TRADACK',
    order: 2,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Dränerande bärlager & Fiberduk',
    amaCode: 'DBB.11 / DCB.11',
    instruction: 'Rulla ut en materialskiljande fiberduk (Klass N2) över hela terrassen. Fyll på med ett 15 cm tjockt kapillärbrytande lager av tvättad makadam utan nollfraktion (t.ex. 8/16 mm, 11/16 mm eller 16/32 mm – i skolan och på mindre byggen används ofta 8/16 eller 11/16 med utmärkt resultat).',
    studentTip: 'Använd ALDRIG material med nollfraktion (t.ex. 0/32 eller 0/16 bergkross) under grunden/trallen! Det fina dammet suger upp fukt kapillärt. Välj istället tvättad makadam med öppna porer så vattnet rinner rakt igenom – 3 godkända exempel: 1) 8/16 mm (mycket vanligt i skolan och lätt att skotta/raka), 2) 11/16 mm, eller 3) 16/32 mm. Alla tre stoppar tjällyft och kapillärsugning helt.',
    proTip: 'Ta bild med tumstock som visar minst 150 mm makadam (t.ex. 8/16, 11/16 eller 16/32) och minst 30 cm överlapp på fiberduken.',
    criticalValidationHint: 'Kritiskt dold-moment: Fotokrav! Mät makadamtjocklek och fiberduksöverlapp.'
  },
  {
    id: '4.3',
    projectType: 'ALTAN_TRADACK',
    order: 3,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Plintgrund till tjälfritt djup',
    amaCode: 'CBF.1',
    instruction: 'Gräv eller borra ner betongplintar till frostfritt djup (minst 60-70 cm). Placera en bred bottenplatta eller en stor marksten under plinten innan återfyllning för att sprida ut lasten. Maxavstånd mellan plintar: 2,0 meter.',
    studentTip: 'Om plinten sätts för grunt (20-30 cm) hamnar botten av plinten i frys-zonen och tjälen kommer lyfta hela altanen. Fota djupet med tumstock i gropen!',
    proTip: 'Väg av plintarna noggrant i höjd med laser. En plint som sjunker eller skjuts av tjäle ger direkt svackor i trallen.',
    criticalValidationHint: 'Kritiskt dold-moment: Fota plintdjupet med tumstock i gropen före återfyllning.'
  },
  {
    id: '4.4',
    projectType: 'ALTAN_TRADACK',
    order: 4,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Dränerande återfyllning',
    amaCode: 'CEB.51',
    instruction: 'Återfyll håligheterna runt betongplintarna med ren, tvättad makadam eller singel (t.ex. 8/16 mm, 11/16 mm eller 16/32 mm). Packa materialet ordentligt i omgångar.',
    studentTip: 'Vanligaste felet hobbysnickare gör! Skottar man tillbaka leran eller jorden man nyss grävde upp runt plinten, fryser leran fast i betongväggen på vintern (sidofriktion) och drar med sig plinten uppåt. Ren makadam (t.ex. 8/16 mm som finns på skolan, 11/16 eller 16/32 mm) fryser inte fast och dränerar bort ytvattnet.',
    proTip: 'Packa i skikt om 15 cm. Fyll med tvättad makadam hela vägen upp.',
    criticalValidationHint: 'Verifiera och fota att endast ren makadam används vid återfyllning runt plintar.'
  },
  {
    id: '4.5',
    projectType: 'ALTAN_TRADACK',
    order: 5,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Justering av markfall',
    amaCode: 'CBB.31',
    instruction: 'Jämna till makadambädden under altanen så att marken har ett tydligt fall bort från bostadshuset/skolbyggnadens vägg. Fallet ska vara minst 1-2 cm per meter (1:100).',
    studentTip: 'Vatten som rinner ner mellan trallbrädorna får aldrig bli stående i pölar runt husgrunden eller plintarna. Lägg gärna ut markplast närmast väggen.',
    proTip: 'Kontrollera lutningen med vattenpass eller laser. Säkerställ att vatten leds ut i omgivande terräng.',
    criticalValidationHint: 'Fota avvägning av markfall från husgrunden.'
  },
  {
    id: '4.6',
    projectType: 'ALTAN_TRADACK',
    order: 6,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Kryssmätning & Diagonaler',
    amaCode: 'BEB.11',
    instruction: 'Kontrollera hörnpunkternas mått genom att mäta diagonalerna (kryssmätning) från hörn till hörn. Diagonalerna måste matcha exakt (max 5 mm avvikelse).',
    studentTip: 'Använd Pythagoras sats (3-4-5-metoden) för att kontrollera 90-gradersvinklar mot husväggen. Är stommen sned kommer trallbrädorna löpa snett i slutet.',
    proTip: 'Spänn kryssnören och mät diagonaler två gånger innan du skruvar fast första bärlinan i fasaden eller stolpskorna.',
    criticalValidationHint: 'Dokumentera kryssmått och räta vinklar mot byggnad.'
  },
  {
    id: '4.7',
    projectType: 'ALTAN_TRADACK',
    order: 7,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Montering av Bärlinor (NTR/A)',
    amaCode: 'GBC.11',
    instruction: 'Montera de bärande reglarna (Konstruktionsvirke, tryckimpregnerat, lägst dimension 45x170 mm eller 45x195 mm) i plintarnas stolpskor. Väg av stenhårt med långpass eller rotationslaser i våg.',
    studentTip: 'Lägg en bit syllpapp i botten av stolpskon mellan betongen/stålet och bärlinan så att fukt inte sugs in i träets ändträ. Allt bärande virke ska hålla skyddsklass NTR/A för markkontakt.',
    proTip: 'Använd genomgående varmförzinkad bult (M10/M12) med brickor eller godkända ankarskruvar i stolpskorna. Bärlinorna är konstruktionens ryggrad.',
    criticalValidationHint: 'Fota syllpapp i stolpsko och bärlinor i våg.'
  },
  {
    id: '4.8',
    projectType: 'ALTAN_TRADACK',
    order: 8,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Golvreglar & c/c-avstånd',
    amaCode: 'GBC.21',
    instruction: 'Montera golvreglarna (konstruktionsvirke 45x145 eller 45x170 mm) vinkelrätt ovanpå bärlinorna eller infällda med balkskor. c/c-avståndet (centrum till centrum) mellan reglarna får vara MAX 600 mm för 28 mm trall. Vid 22 mm trall eller om trallen ska läggas diagonalt (45°) är högsta tillåtna regelavstånd c/c 400 mm enligt Svenskt Trä.',
    studentTip: 'Regelavstånd enligt Svenskt Trä: 28 mm trall kräver max c/c 600 mm. Tunnare trall (22 mm eller 21 mm) eller diagonal trallläggning kräver ovillkorligen max c/c 400 mm. Slarvas det med c/c-avståndet kommer altanen att svikta kraftigt och trallskruvarna knäckas!',
    proTip: 'Fäst golvreglarna med vinkelbeslag eller skråskruvning med godkänd träbyggnadsskruv. Kontrollera att ovansidan är absolut plan.',
    criticalValidationHint: 'Fota tumstock som visar godkänt c/c-mått mellan golvreglar.'
  },
  {
    id: '4.9',
    projectType: 'ALTAN_TRADACK',
    order: 9,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Montering av Kortlingar',
    amaCode: 'GBC.22',
    instruction: 'Skruva in kortlingar (korta stödreglar av samma dimension) i regelverket där trallbrädor ska skarvas eller där en fris (ram runt altanen) ska ligga.',
    studentTip: 'Sätt dubbla kortlingar vid skarvar. Två tralländar får aldrig skruvas i samma enskilda 45 mm regel, eftersom ändträet då spricker, drar åt sig fukt och skruvarna släpper över tid.',
    proTip: 'Behandla alla sågade ändträn med penetrerande grundolja eller träskyddsmedel innan montering för maximal livslängd.',
    criticalValidationHint: 'Fota dubbla kortlingar vid skarvpunkter och frisram.'
  },
  {
    id: '4.10',
    projectType: 'ALTAN_TRADACK',
    order: 10,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Trallläggning & Skruvavstånd',
    amaCode: 'HSD.1',
    instruction: 'Skruva trallbrädorna (t.ex. 28x120 mm) i varje regel med rostfri trallskruv (Klass C4 eller A2). Lägg brädorna med ett fast brädavstånd (mellanrum på 3-5 mm) med hjälp av en trallman eller distansklossar.',
    studentTip: 'Kolla årsringarna! Lägg brädorna med den "glada" sidan uppåt (kärnsidan upp). När träet torkar kupar det sig som ett paraply och regnvattnet rinner av. Lägger man trall utan springor på våren kommer altanen resa sig och slå sig under höstregnen då träet sväller.',
    proTip: 'Förborra alltid i brädornas ändar för att undvika sprickbildning. Skruva med jämnt djup utan att dra ner skruvskallen så djupt att det bildas vattensamlingar.',
    criticalValidationHint: 'Fota jämn tralläggning med distanser och årsringar vända uppåt.'
  }
];

export const PROJECT_TYPE_LABELS: Record<ProjectType, { title: string; subtitle: string; icon: string; count: number }> = {
  HUSGRUND: {
    title: 'Husgrund (Platta på mark)',
    subtitle: '14 moment • Från utsättning & profiler till armering & gjutklar',
    icon: '🏗️',
    count: 14
  },
  ALTAN_TRADACK: {
    title: 'Altan & Trädäck',
    subtitle: '10 moment • Markarbete (AMA) & Snickeri (Svenskt Trä) mot tjäle',
    icon: '🪵',
    count: 10
  },
  PLATTSATTNING: {
    title: 'Plattsättning & Marksten',
    subtitle: '6 moment • Riktsnöre, Pythagoras, avdragning, plattor & fogsand',
    icon: '🧱',
    count: 6
  },
  ENSKILT_AVLOPP: {
    title: 'Enskilt Avlopp & Infiltration',
    subtitle: '6 moment • Rulltest, schakt, grundvattenavstånd, brunn & luftning',
    icon: '💧',
    count: 6
  }
};
