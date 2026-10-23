# Genomförandeplan: Permanent Skydd mot Förlorade Foton & Robust Molnsynk

Denna plan åtgärdar grundorsakerna till att bilder försvann vid synkning eller omladdning av sidan och implementerar ett absolut skydd mot dataförlust ("Zero Photo Loss Invariant").

## Problembeskrivning & Grundorsaksanalys

1. **Smitta och spridning av `deletedPhotoIds`**:
   - När ett foto togs bort (eller ersattes) lades dess ID till i `project.deletedPhotoIds`.
   - Både klientens `mergeProjectSafely` och serverns `mergeServerProjectSafely` slog ihop projektets raderade ID:n med alla momentens raderade ID:n och propagerade dem till samtliga moment.
   - Om ett äldre foto hade standard-ID `'p_1'`, ledde radering i *ett* moment till att samtliga moment i hela projektet förlorade sina `photoBase64`-bilder.
2. **Klippning av foton vid Firestore-dokumentgräns (>900KB)**:
   - I `studentWorkService.ts` (`saveProjectToFirestore`) nollställdes `dataUrl` till tom sträng (`''`) för alla foton över 50KB om dokumentets totala storlek närmade sig 900KB.
   - Realtidslyssnaren i `App.tsx` (`subscribeToFirestoreProjects`) och periodisk polling (`pullProjectsFromCloud`) hämtade detta nollställda dokument och skrev över lokala högupplösta foton i IndexedDB med tomma strängar.
3. **Avsaknad av bekräftelse vid radering**:
   - Papperskorg-ikonen (`<Trash2 />`) i `ChecklistView.tsx` och `PhotoArchiveModal.tsx` raderade foton direkt vid ett enda klick/feltryck utan någon bekräftelsedialog.
   - I `PhotoArchiveModal.tsx` låg raderaknappen precis bredvid "Spara" (ladda ner), vilket orsakade oavsiktliga raderingar på mobila pekskärmar.
4. **Ensidig överskrivning vid sammanslagning**:
   - Om ett inkommande projekt från molnet saknade fotodata för ett moment skrevs det lokala fotot ibland över eller filtrerades bort istället för att bevaras.

---

## Föreslagna Åtgärder

### 1. Absolut Skydd vid Sammanslagning ("Zero Photo Loss Invariant")
- **`src/utils/photoUtils.ts`**:
  - Säkerställ att ett giltigt, lokalt högupplöst foto (`isGoodPhotoData`) ALDRIG kan skrivas över eller nollställas av en inkommande tom eller trunkerad bild från molnet.
  - Begränsa raderings-ID:n strikt per moment och isolera bort det generiska ID:t `'p_1'` från globala raderingslistor.
  - Om molnet saknar bilddata för ett moment ska det lokala fotot behållas till 100% och automatiskt laddas upp till molnet på nytt.

### 2. Omedelbar och Icke-destruktiv Molnuppladdning
- **`src/services/studentWorkService.ts`**:
  - Ta bort den destruktiva nollställningen av `dataUrl` till `''`.
  - Inför en dedikerad serverendpoint `/api/sync/photos` som sparar foton separat om projekt-JSON blir för stor, så att fullupplösta foton alltid finns tillgängliga och kan återhydreras.
  - Vid fotografering/uppladdning: spara direkt i IndexedDB och trigga omedelbar uppladdning till både Express-servern och Firestore.
  - Vid offline-läge: markera foton som lokalt säkrade och synka upp dem automatiskt så fort nätverk finns.

### 3. Serverns Sammanslagningslogik (`server.ts`)
- **`server.ts`**:
  - Korrigera `mergeServerProjectSafely` så att `deletedPhotoIds` inte sprids korsvis mellan olika moment.
  - Säkerställ att servern aldrig tar bort ett foto om en inkommande klient skickar ett giltigt foto.
  - Lägg till stöd för dedikerad fotolagring och leverans under `/api/sync/photos/:photoId`.

### 4. Säkerhetsbekräftelse vid Radering & Förbättrad UX
- **`src/components/ChecklistView.tsx` & `src/components/PhotoArchiveModal.tsx`**:
  - Inför en tydlig bekräftelsedialog ("Vill du ta bort detta foto permanent?") innan någon radering genomförs.
  - Separera "Spara/Ladda ner"-knappen från "Ta bort"-knappen i `PhotoArchiveModal.tsx` för att omöjliggöra feltryck på pekskärmar.
  - Som standard sparas alltid en kopia till enhetens kamerarulle/nedladdningar via `savePhotoToDeviceGallery`.

---

## Verifieringsplan

1. **Fotografering & Omedelbar Molnlagring**:
   - Ta ett foto i ett moment.
   - Verifiera att fotot sparas i IndexedDB och omedelbart skickas till Express-servern och Firestore.
2. **Omladdning & Utloggning**:
   - Ladda om sidan (F5 / browser refresh) och verifiera att fotot finns kvar intakt.
   - Logga ut och logga in igen; verifiera att fotot inte försvinner.
3. **Flera Foton & Dokumentstorlek**:
   - Lägg till 4-5 foton i olika moment för att överstiga 1MB.
   - Verifiera att ingen bild klipps eller ersätts med tom sträng.
4. **Bekräftelse vid Radering**:
   - Klicka på papperskorgen för ett foto och kontrollera att bekräftelsedialog visas.
   - Avbryt: kontrollera att fotot kvarstår.
   - Bekräfta: kontrollera att enbart det specifika fotot tas bort, och att inga andra moment påverkas.
