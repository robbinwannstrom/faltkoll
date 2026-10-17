# Implementeringsplan: 110% Driftsäkerhet, Konstant Fotosynk & PDF-Export

Denna reviderade plan specificerar den exakta tekniska mekaniken för att foton och fältmätningar konstant och oåterkalleligt ska lagras på servern och i molnet, så att inga bilder kan försvinna vid appuppdateringar, rensad webbläsarcache eller enhetsbyte. Dessutom införs direkt PDF-generering och robust offline-kö.

---

## 1. Djupanalys: Hur foton hanteras idag och varför de riskerar att försvinna

### Nuvarande flöde i appen:
1. **Fotografering via kamera:** När eleven trycker på kameraknappen triggas ett dolt `<input type="file" capture="environment">`. Mobilens operativsystem (iOS/Android) sparar fotot automatiskt i mobilens kamerarulle.
2. **Vattenstämpling och komprimering:** Bilden skalas ned till max 1024×1024 px i en canvas och får en juridisk vattenstämpel med datum, tid, väder och moment (i `fileToBase64Optimized`).
3. **Automatisk filnedladdning (`savePhotoToDeviceGallery`):** Appen skapar en syntetisk `<a download>`-länk som laddar ned bilden till enhetens Nedladdningar/Kamerarulle.
4. **Molnuppladdning (`uploadPhotoToDedicatedCloud`):** Appen gör ett anrop mot `/api/sync/photos` och Firestore, men har en `catch(() => {})` som tyst ignorerar felet om enheten för tillfället har svag täckning.

### Risker vid appuppdatering eller cache-tömning:
- Om eleven tar foton offline och sedan uppdaterar sidan (eller PWA-appen uppdateras) innan synkningen gått igenom, kan ändringar i enbart arbetsminne eller temporär webbläsarcache gå förlorade.
- `localStorage` har en gräns på 5 MB på mobiler. Flera högupplösta foton kan orsaka `QuotaExceededError`.
- På servern har foton tidigare lagrats i en stor gemensam JSON-fil, vilket blir instabilt vid serveromstart eller stora datamängder.

---

## 2. Den exakta lösningen: Konstant och feltolerant fotosynkning

För att säkerställa att foton **aldrig** försvinner införs ett 3-stegs skyddsnät:

```
[ Elev tar foto i fält ]
        │
        ▼
1. Vattenstämplas och komprimeras (~90 KB JPEG)
        │
        ├─────────────────────────────────────────────────┐
        ▼                                                 ▼
[ Sparas omedelbart i ]                       [ Läggs i Persistent Offline-kö ]
[ IndexedDB 'photos_cache' ]                  [ 'photo_sync_queue' (IndexedDB) ]
(Överlever appuppdatering & reload)                      │
                                                         ▼
                                              Bakgrundssynk skickar till:
                                              1. Server: /api/sync/photos
                                                 (Sparas som diskfil i data/photos/)
                                              2. Google Cloud Firestore
                                                 (/projects/{id}/photos/{photoId})
                                                         │
                                              Vid bekräftad HTTP 200 OK:
                                              Markerad som 'CLOUD_SAFE'
```

### Exakta tekniska åtgärder för fotosynk:
1. **Persistent fotokö i IndexedDB (`photoSyncQueue`):** Varje taget foto får ett unikt UUID och sparas först i IndexedDB. Även om eleven stänger webbläsaren, uppdaterar appen eller startar om telefonen ligger fotot kvar i kön.
2. **Aktiv bakgrundssynkroniserare med Auto-Retry:** En bakgrundstjänst (`offlineQueueService.ts`) bevakar nätverket (`navigator.onLine`) och laddar upp foton styckvis med exponentiell backoff tills servern kvitterar.
3. **Robust filbaserad fotolagring på servern (`data/photos/`):**
   - Servern sparar inkommande foton som separata filer på disk (`data/photos/[photoId].jpg`) istället för att trycka in alla gigabyte i en enda JSON-fil.
   - Ett atomärt index uppdateras så att serveromstarter eller krascher inte skadar befintliga bilder.
4. **Inställning för kamerarulle:** Behåll sparande till kamerarulle som standard dubbelt skyddsnät, men lägg till en enkel toggle i Inställningar för de som vill stänga av dubbla nedladdningar.

---

## 3. Direkt PDF-generering (Utan utskriftsdialog)

### Nuvarande problem:
Knappen "Skriv ut / PDF" i `ReportModal.tsx` anropar `window.print()`, vilket öppnar webbläsarens systemdialog. Detta är krångligt på mobiler och kan ge dålig sidbrytning och kapade bilder.

### Lösning:
- Installera `jspdf` och `jspdf-autotable`.
- Bygga `src/services/pdfReportGenerator.ts`:
  - Skapar ett A4-dokument med professionell svensk byggstandard (AMA).
  - Skriver ut projekthuvud (Projektnamn, Fastighet, Entreprenör, Skola/Klass, Datum).
  - Genererar tabell över samtliga moment med kravmått, uppmätt värde, tolerans ($\pm 5\text{ mm}$ etc.) och status (Godkänd / Avvikelse).
  - Bäddar in alla verifierade foton direkt i PDF-filen med tidsstämpel och bildtext.
  - Genererar signaturfält för elev, handledare och yrkeslärare.
  - Knappen **"Ladda ner PDF"** laddar ned filen `FaltKoll_Slutbesiktning_[Projekt].pdf` direkt till enheten på under 2 sekunder.

---

## 4. Ändringar och berörda filer

| Komponent | Åtgärd | Fil |
| :--- | :--- | :--- |
| **Server fotolagring** | Skapa filbaserad bildlagring (`data/photos/`) med säker disk-persistering | `server.ts` |
| **Fotokö & Synkmotor** | Skapa persistent `offlineQueueService.ts` som garanterar uppladdning av foton och projektdata | `src/services/offlineQueueService.ts` |
| **Fotohantering fält** | Koppla `ChecklistView.tsx` till den nya kön så att foto aldrig kan gå förlorat vid appuppdatering | `src/components/ChecklistView.tsx` |
| **PDF-generator** | Skapa `pdfReportGenerator.ts` för direkt export till `.pdf` med inbäddade foton och AMA-tabell | `src/services/pdfReportGenerator.ts` |
| **Rapportgränssnitt** | Uppdatera `ReportModal.tsx` med "Ladda ner PDF-rapport"-knapp | `src/components/ReportModal.tsx` |
| **Synkstatus i gränssnittet** | Lägga till diskret indikator i headern: "✓ Allt synkat till molnet" / "⚡ 1 foto köas" | `src/components/SyncStatusBanner.tsx`, `src/App.tsx` |
| **Dependencies** | Installera `jspdf` och `@types/jspdf` | `package.json` |

---

## 5. Verifiering för 110% driftsäkerhet

1. **Test av appuppdatering:** Ta ett foto och spara ett moment i fält. Göra full reload/cache-rensning i webbläsaren. Verifiera att bilden automatiskt återställs från servern.
2. **Test av nätverksbortfall:** Koppla från nätverket helt (flygplansläge), ta 3 foton och signera moment. Återanslut och verifiera att kön automatiskt töms och alla 3 foton ligger säkrade på servern och i Firestore.
3. **Test av direkt PDF-export:** Klicka på "Ladda ner PDF" i rapporten och verifiera att filen laddas ned med rätt layout, skarpa fotobevis och AMA-tabell.
