# SHA-256 Hash-verifiering och Dataintegritet

En fullständig arkitektur- och genomförandeplan för att införa automatisk kryptografisk SHA-256 hash-verifiering på alla foton, projektversioner och säkerhetskopior i FältKoll. Detta ger matematisk garanti för att ingen fil någonsin blir skadad, avhuggen eller förvanskad under synkning, samtidigt som det ger full juridisk beviskraft vid besiktningar.

---

### Användarval & Bekräftade Beslut

> [!IMPORTANT]
> **Bekräftat val från användaren:**
> Användaren har valt: *"Ja, lägg till automatisk SHA-256 hash på alla foton och projektversioner"*.
> Detta innebär att både bildfiler (kamera och uppladdningar) och hela projekttillstånd beräknas och valideras med kryptografisk SHA-256 kontrollsumma vid varje sparning, synkning och återställning.

- **Bekräftat beslut 1 (Kryptografisk algoritm):** Standardiserad SHA-256 via webbläsarens inbyggda hårdvaruaccelererade Web Crypto API (`crypto.subtle.digest`) och Node.js `crypto`-modul. Ingen extern tung dependency krävs.
- **Bekräftat beslut 2 (Bakåtkompatibilitet):** Äldre foton och projekt utan hash tilldelas hash automatiskt vid första läsning/sparning utan att bryta befintliga projekt.
- **Bekräftat beslut 3 (Juridisk stämpel):** Varje verifierad bild och momentrapport får en diskret grön integritetsindikator ("Integritet verifierad • SHA-256") i bildvisaren och PDF-rapporten för maximal trovärdighet gentemot beställare och besiktningsmän.

---

## 1. Översikt & Huvudkoncept

- **Vad funktionen gör:**
  Varje gång ett foto tas eller ett projekt sparas räknas en unik 64-teckens hexadecimal kontrollsumma ut direkt från rådatan. Innan ett foto sparas på servern eller i IndexedDB jämförs hashen. Stämmer hashen bekräftas filen som 100 % intakt; stämmer den inte upptäcks överföringsfelet direkt och filen repareras innan den skrivs till disk.
- **Målgrupp & Sammanhang:**
  Yrkesanläggare, snickare, markarbetare och yrkeslärare som arbetar i fält med varierande mobiluppkoppling (4G/5G).
- **Värde och trygghet:**
  1. **Noll korrupta bilder:** Eliminerar helt risken att brutna eller halvladdade bilder sparas.
  2. **Blixtsnabb fältsynk (Deduplicering):** Bilder med matchande hash behöver aldrig laddas upp två gånger, vilket sparar mobilsurf och batteri.
  3. **Juridisk beviskraft:** Enligt AMA och ABT 06 kan entreprenören bevisa att foton och dokumentation fanns i exakt detta skick vid kontrolltillfället och inte modifierats i efterhand.

---

## 2. Användarupplevelse & Visuell Design

### Användarflöden

1. **Fotografering i moment:**
   - Eleven eller hantverkaren tar ett foto med kameran.
   - I bakgrunden (inom ~1 ms) beräknas SHA-256 hashen.
   - Bilden sparas i både det lokala permanenta fotovalvet och projektet med sin hash bifogad (`photo.hash = "e3b0c442..."`).
   - I bildvisaren visas en diskret, professionell säkerhetsdetalj: `Integritet: SHA-256 Verifierad`.
2. **Synkning mot server & moln:**
   - Vid synkning skickar appen hashen före uppladdning.
   - Om servern redan har samma hash på disk (`data/photos/<hash>.jpg`), bekräftas bilden omedelbart utan att mega-bytes skickas över 4G.
3. **Projektversioner & Snapshots:**
   - Varje automatisk ögonblicksbild (snapshot) får en sammanställd tillståndshash.
   - Vid återställning i "Säkerhetskopia & Molnsynk" verifierar appen att den inlästa kopian har 100 % matchande kontrollsumma innan den appliceras.

### Visuell Identitet & Typografi

- **Färgpalett & Symboler:**
  - Utnyttjar FältKolls etablerade industriella mörka tema (`#121212`, `#171a22`, `#2b303c`).
  - Diskret verifieringsikon (`ShieldCheck` i smaragdgrön `#10b981` med text i `text-slate-400`).
  - Inga onödiga eller skrikiga element; verifieringen sker transparent i bakgrunden utan att störa arbetsflödet.
- **Typografi & Metadata:**
  - Hashen visas avkortad med monospace-stil (`font-mono text-[10px] text-slate-500`, t.ex. `SHA: 8f4a...9b12`).
  - Fullständig hash kan kopieras med ett klick om den behövs till ett besiktningsprotokoll.

---

## 3. Viktiga Produktbeslut & Avvägningar

### Beslut 1: Web Crypto API vs Externa npm-bibliotek
- **Vald metod:** Använd webbläsarens inbyggda `window.crypto.subtle.digest('SHA-256', ...)` på klientsidan och Node.js inbyggda `crypto.createHash('sha256')` på servern.
- **Varför:** 100 % hårdvaruaccelererat, noll extra bundle-storlek, noll externa beroenden, körs på ~1-2 ms per bild.
- **Alternativ som valdes bort:** Externa paket som `crypto-js` eller `js-sha256` som är långsammare och ökar JavaScript-storleken i onödan.

### Beslut 2: Fullständig Projekt-hash vs Separata Foton
- **Vald metod:** Båda två!
  - Varje enskilt foto får sin egen bild-hash (`photo.hash`).
  - Varje projektversion får en revision-hash (`revision.contentHash`) beräknad från alla moment, mått och anteckningar.
- **Varför:** Ger dubbelt skydd – foton kan flyttas, dedupliceras och kontrolleras individuellt, samtidigt som hela projektets historik blir manipulationssäkert.

---

## 4. Teknisk Arkitektur & Datastrategi

### Systemarkitektur & Dataflöde

```
┌─────────────────────────────────────────────────────────────────┐
│                      FÄLTKOLL KLIENT (WEB)                      │
│                                                                 │
│  [ Kamera / Filuppladdning ] ──> [ Web Crypto SHA-256 Hash ]   │
│                                          │                      │
│                                          ▼                      │
│                           [ PhotoItem med .hash ]               │
│                                   │       │                     │
│                ┌──────────────────┘       └─────────────────┐   │
│                ▼                                            ▼   │
│  [ FaltKoll_PermanentVault ]                   [ ChecklistView ]│
│  (IndexedDB råvalv + hash)                     (Projekt & moment│
│                │                               med versionshash)│
│                └──────────────────┬─────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────┘
                                    │ Synk via HTTP POST / JSON
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS SERVER (server.ts)                   │
│                                                                 │
│  1. Tar emot { id, hash, dataUrl }                              │
│  2. Beräknar sha256(dataUrl) på servern                         │
│  3. Validerar att klient-hash === server-hash                   │
│     ├─ Vid match: Sparar till data/photos/<hash>.jpg            │
│     └─ Vid avvikelse: Returnerar fel och begär omsynkning       │
│  4. Sparar rullande backuper med projekt-kontrollsummor         │
│  5. Speglar till Firestore                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Datamodell & Gränssnitt

1. **Utökat `MomentPhoto` (`src/types.ts`):**
   ```ts
   export interface MomentPhoto {
     id: string;
     dataUrl: string;
     capturedAt: string;
     category: string;
     caption?: string;
     weather?: string;
     hash?: string; // SHA-256 hexadecimal kontrollsumma (64 tecken)
     hashVerified?: boolean; // True om kontrollsumman validerats
   }
   ```

2. **Utökat `ProjectRevision` (`src/types.ts`):**
   ```ts
   export interface ProjectRevision {
     id: string;
     timestamp: number;
     createdAtFormatted: string;
     authorName: string;
     authorRole: string;
     summary: string;
     contentHash?: string; // SHA-256 checksum över projektets tillstånd
     momentsSnapshot: Record<string, any>;
     notesSnapshot?: string;
     fieldMeasurementsSnapshot?: any;
   }
   ```

3. **Ny hjälpmodul: `src/utils/cryptoHash.ts`:**
   - `calculateSha256(data: string | ArrayBuffer): Promise<string>`
   - `verifyPhotoIntegrity(photo: MomentPhoto): Promise<boolean>`
   - `calculateProjectContentHash(project: Project): Promise<string>`

4. **Servervalidering (`server.ts`):**
   - I `/api/sync/photos` och `savePhotoToDisk`: kontrollera SHA-256 innan filen skrivs till disk.
   - Spara filer namngivna efter innehållets hash för deduplicering (`data/photos/<hash>.jpg`).

---

## 5. Genomförandesteg (Planerade åtgärder vid godkännande)

1. **Skapa kryptotjänst:** Implementera `src/utils/cryptoHash.ts` med standardiserade funktioner för beräkning och verifiering via `crypto.subtle`.
2. **Uppdatera datamodeller:** Lägg till valfria `hash` och `contentHash` fält i `MomentPhoto`, `ProjectRevision` och `VaultPhotoRecord`.
3. **Koppla till kameran och fotovalvet:** Se till att alla nya foton får sin hash beräknad och sparad i både `FaltKoll_PermanentVault` och projektets moments.
4. **Serververifiering i `server.ts`:** Lägg till server-side hash-validering vid bildmottagning och backup-generering.
5. **Visuella integritetsindikatorer:** Lägg till en diskret verifieringsstämpel i `ChecklistView` (fotodetalj) och i `BackupModal`.
6. **Kompilering och verifiering:** Kör `compile_applet` och testa hash-generering på befintliga och nya projekt.
