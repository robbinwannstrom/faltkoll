# Implementationsplan: Strikt Skolintegritet & Klasskoder (GDPR-anpassning)

## Bakgrund & Syfte
När skolor utvärderar och köper in digitala verktyg ställer rektorer och dataskyddsombud (GDPR) hårda krav på **personuppgiftsbiträdesavtal (DPA)** och teknisk rollseparation:
- **Huvudadministratören (Systemägaren)** agerar teknisk driftleverantör och licensansvarig, men **får inte ha insyn i elevers personliga texter, kommentarer, loggböcker och fältfoton**.
- **Lärare** ska endast ha tillgång till sina egna elevers och klassers arbeten.
- **Elever** ska enkelt och säkert kopplas till rätt lärare och klass via en **klasskod** eller **lärarkod** vid registrering.

---

## 1. Klass- och Lärarkoppling via Registreringskoder
### Mål:
Låta lärare enkelt skapa engångs- eller klasskoder som elever anger vid registrering, vilket automatiskt knyter eleven till läraren och klassen utan manuell administration.

### Ändringar:
- **Utöka `InviteCodeItem` i `src/types.ts` och `server.ts`**:
  - `schoolClass`: Den klass som koden ger tillhörighet till (t.ex. "BA24").
  - `teacherId`: ID för den lärare som skapade koden och som ska ha mentorskap/fältansvar.
  - `schoolOrCompany`: Skolans namn.
  - `codeType`: `'ONE_TIME_STUDENT'` (1-gångskod) eller `'CLASS_JOIN_CODE'` (klasskod för hela klassen).
- **Lärarens kodhanterare i UI**:
  - Lärare kan direkt i sitt gränssnitt generera en klasskod (t.ex. `BA24-BYGG`) eller en lista med 1-gångskoder för sina elever.
- **Elevregistrering (`LoginView.tsx`)**:
  - När en elev registrerar sig och anger klasskoden/lärarkoden kopplas elevkontot automatiskt till lärarens `teacherId`, rätt `schoolClass` och `schoolOrCompany`.

---

## 2. Strikt Integritetsvägg (Privacy Wall) mot Huvudadministratör
### Mål:
Garantera att huvudadministratören (även om administratören skapar testkonton eller går in i fältvyer) inte kan se elevers privata loggboksanteckningar, reflektioner och fältbilder.

### Ändringar i Backend (`server.ts` & `src/services/studentWorkService.ts`):
- **Skydd på `/api/field/student-work`**:
  - Anrop kontrolleras mot anroparens roll och identitet.
  - **För ADMIN**: Elevers privata fältarbeten med foton, kommentarer och signaturer maskeras eller returneras med integritetsstatus. Admin ser endast aggregerad/anonymiserad systemstatistik (antal konton, licensanvändning, databasanvändning) – **noll tillgång till elevinnehåll och bilder**.
  - **För TEACHER**: Endast projekt och elever som tillhör lärarens egna klasser (`schoolClass`) eller lärarens ID (`teacherId`) returneras. Lärare A kan inte se Lärare B:s elever.
- **Skydd på `/api/sync/projects` & `/api/sync/projects/:id`**:
  - Projekt knutna till en specifik skola/klass skyddas så att obehöriga inte kan dra ner projekt med bilder genom att gissa projekt-ID.

---

## 3. Gränssnitt och Upplevelse (UI / UX)
### Ändringar i Frontend:
1. **Fältöversikten (`TeacherFieldInspectionView.tsx`)**:
   - Lärare ser en tydlig banner: *"Integritetsskyddad fältvy för [Skolans namn] – Endast du och tilldelade lärare har behörighet"*.
   - Filter begränsat till lärarens egna klasser.
   - Om en ren administratör öppnar fältvyn visas ett **Integritetslås (Privacy Wall)**: Ett informativt kort som bekräftar att elevinnehåll är krypterat/spärrat för administratörer i enlighet med GDPR och skolavtalet.
2. **Klass- och Elevhantering (`AccountsView.tsx`)**:
   - Lärare har en egen flik för "Mina elever & Klasskoder" där de ser sina elever och genererar klasskoder med ett klick.
   - Administratörens kontovy fokuserar på licenser, skolor och systemkonton utan att exponera elevers fältanteckningar.
3. **GDPR- & Rektorsinformation (Skolintyg)**:
   - En dedikerad informationsknapp/modal: *"GDPR & Skolintegritet – Information för Rektor & IT-avdelning"*.
   - Beskriver exakt hur appen uppfyller kraven:
     - Dataminimering (elever behöver endast ange förnamn/användarnamn).
     - Ingen kommersiell dataanalys eller spårning.
     - Strikt integritetsvägg mellan systemägare och elevinnehåll.
     - Automatisk rensning och lokal gallring.

---

## 4. Verifiering & Testning
1. **Klasskod-test**:
   - Skapa en klasskod som lärare.
   - Registrera en ny elev med koden.
   - Verifiera att eleven direkt syns hos rätt lärare under rätt klass.
2. **Integritetstest (Admin)**:
   - Logga in som huvudadministratör (`admin`).
   - Försök nå fältarbeten och foton.
   - Verifiera att integritetsväggen blockerar visning av elevernas loggar och bilder.
3. **Isoleringstest mellan lärare**:
   - Verifiera att lärare endast ser sina egna klassers elever och projekt.
4. **App-kompilering**:
   - Köra `compile_applet` för att säkerställa 100% felfri TypeScript- och Vite-byggnation.
