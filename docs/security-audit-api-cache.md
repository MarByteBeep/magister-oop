# Security audit: API-endpoints & tijdelijke leerlingopslag

Overzicht van waar de Magister OOP-extensie Magister-API’s aanroept, welke endpoints dat zijn, en waar leerling-/persoonsgegevens tijdelijk worden opgeslagen. Bedoeld als technische referentie voor een security audit.

Gerelateerd: [privacy.md](./privacy.md).

---

## 1. Architectuur

### 1.1 Extensie-rechten (`public/manifest.json`)

| Onderdeel | Waarde | Betekenis |
|-----------|--------|-----------|
| `permissions` | `scripting`, `storage` | Script-injectie in tabs; `chrome.storage` |
| `host_permissions` | `*://*.magister.net/*` | Alleen Magister-hosts (http en https) |
| CSP `extension_pages` | `script-src 'self'; object-src 'self'; connect-src 'self';` | Extensiepagina’s kunnen **zelf geen** netwerkverzoeken naar Magister doen |
| Content scripts | geen | Er wordt niets automatisch in pagina’s geïnjecteerd |

**Geen browsegeschiedenis.** De extensie leest geen browsegeschiedenis en heeft daar ook geen rechten voor: het manifest vraagt geen `history`-permissie en geen `tabs`-permissie. Zonder `tabs`-permissie geeft Chrome de URL en titel van een tabblad alleen door voor hosts in `host_permissions`. De extensie ziet dus alleen van open `*.magister.net`-tabbladen welke URL ze hebben, en gebruikt dat om de ingelogde school-tab te vinden (`src/popup-utils/tabs.ts`). Andere tabbladen vraagt ze niet op. Eerder bezochte pagina’s en zoekgeschiedenis zijn voor de extensie niet zichtbaar.

### 1.2 Hoe requests lopen

| Laag | Pad | Rol |
|------|-----|-----|
| Endpoint-definities | `src/magister/endpoints.ts` | Pad-templates |
| HTTP-client | `src/magister/api.ts` | `getJson` / `postJson` / `putJson` / `deleteJson` / `getBlob` |
| In-page JSON-fetch | `src/magister/magisterTabJsonInPage.ts` | `fetch` uitgevoerd in de Magister-tab |
| In-page blob-fetch | `src/magister/fetchBlobInMagisterTab.ts` | Foto’s, uitgevoerd in de Magister-tab |
| Tabselectie | `src/popup-utils/tabs.ts` (`isSchoolSessionUrl`) | Bepaalt in welke tab wordt geïnjecteerd |
| Storage-wrapper | `src/lib/shared/storage.ts` | `chrome.storage.session` / `chrome.storage.local` |

Omdat de CSP directe verbindingen blokkeert, voert de extensie elke request uit via `chrome.scripting.executeScript` (`world: 'MAIN'`) in een ingelogde school-tab. Die tab moet voldoen aan `{school}.magister.net`; `accounts.`, `www.`, `attendance.` en `lockers.magister.net` zijn uitgesloten. Het tab-ID wordt bewaard als `activeTabId` in session storage.

Authenticatie per request:

- **`cookies`**: school-API’s op `{school}.magister.net`. De sessiecookies van de tab gaan mee (`credentials: 'include'`).
- **`bearer`**: `attendance.magister.net`. Het OIDC access token wordt in de tab gelezen uit `sessionStorage`/`localStorage` (keys `oidc.user:*`) en als `Authorization`-header meegestuurd. Het token wordt alleen binnen de tab gebruikt en **niet** teruggegeven aan of opgeslagen door de extensie.
- **geen**: de lockers-call stuurt geen cookies (`credentials: 'omit'`) en geen token.

Alleen de response-body (JSON of blob) gaat terug naar de extensie. Er is geen eigen backend; alle verkeer gaat naar Magister-hosts.

### 1.3 Sessiestatus en afscherming

De sessiestatus staat als `magisterSession` in session storage (`src/lib/session/magisterSession.ts`) en kent vier waarden: `checking`, `connecting`, `ready` en `cancelled`. `src/App.tsx` toont alleen bij `ready` tabbladinhoud en tellers; in alle andere gevallen staat er alleen een melding (`src/components/MagisterSessionNotice.tsx`). Gecachete leerlingdata blijft in opslag staan, maar wordt zonder geldige sessie niet getoond.

| Moment | Gedrag | Code |
|--------|--------|------|
| Nieuw extensievenster | Een eerdere `ready` wordt `checking` tot de sessie opnieuw is gecontroleerd | `src/background.ts`: `markSessionUnverified` |
| Elke 60 s en bij focus van het venster | Popup vraagt de background de sessie te controleren | `src/context/MagisterSessionProvider.tsx` |
| API-call geeft sessie-verlopen of token-ontbreekt, of de school-tab is gesloten, herladen of weg-genavigeerd (na één nieuwe poging) | Idem | `src/magister/api.ts`: `executeInActiveMagisterTab`; meldingen in `src/magister/sessionErrors.ts` |
| Controle faalt | Status wordt `connecting`; de background opent of focust de Magister-logintab en wacht op een nieuwe login | `src/background.ts`: `recheckReadySession` → `startConnecting` |
| Login voltooid | Status wordt `ready`; data uit de cache is direct zichtbaar en wordt op de achtergrond ververst | `src/hooks/students/useStudentsInit.ts` |

De controle is `checkSchoolSessionReadyInPage` (OIDC-token aanwezig én `GET /api/account` slaagt). Een gewone 404 van een school-API geeft dezelfde foutmelding als een verlopen sessie; dat leidt alleen tot een extra controle en verandert niets zolang de sessie geldig is.

Endpoints zonder host in de tabellen hieronder zijn relatief en worden aangeroepen op de origin van de school-tab (`https://{school}.magister.net`).

---

## 2. Endpoint-overzicht

### 2.1 Actief aangeroepen

#### Sessie

| Methode | Endpoint | Auth | `getJson`-cache | Call-site |
|---------|----------|------|-----------------|-----------|
| GET | `/api/account` | cookies (vereist ook aanwezig OIDC-token in de tab) | n.v.t. (eigen `fetch`) | `src/popup-utils/tabs.ts`: `checkSchoolSessionReadyInPage`. Alleen statuscheck, de response wordt niet bewaard. |

#### Leerlingen (lijst & profiel)

| Methode | Endpoint | Auth | `getJson`-cache | Call-site |
|---------|----------|------|-----------------|-----------|
| GET | `/api/leerlingen/zoeken?q=**&…&velden=stamnummer&velden=naam&velden=klassen&velden=studies&velden=emailadres&velden=telefoonnummer&velden=KlassenMentor1` | cookies | `no-cache` | `src/hooks/students/useStudentFetch.ts`: `fetchStudentsPaginated` (alle leerlingen, gepagineerd per 50) |
| GET | `https://lockers.magister.net/api/v1/lockers/details` | **geen** (`omit`, geen token) | `cache` → `jsonCache` | `src/hooks/students/useStudentFetch.ts`: `fetchLockers` |
| GET | `/api/leerlingen/{id}/personalia` | cookies | `cache` → `jsonCache` | `src/hooks/students/studentDetailsFetchers.ts` |
| GET | `/api/leerlingen/{id}/adresgegevens` | cookies | `cache` → `jsonCache` | idem |
| GET | `/api/leerlingen/{id}/ouders` | cookies | `cache` → `jsonCache` | idem |
| GET | `/api/ouders/{id}/contactgegevens` | cookies | `cache` → `jsonCache` | idem (per ouder/verzorger) |
| GET | `student.links.foto.href` uit de API-response (typisch `/api/leerlingen/{id}/foto`) | cookies (`credentials: 'include'`) | n.v.t.; object-URL in geheugen | `studentDetailsFetchers.ts` → `src/lib/shared/blobUtils.ts` → `getBlob` |

Twee URL’s komen uit de Magister-response in plaats van uit `endpoints.ts`: de volgende pagina bij leerlingenzoeken (`links.next.href`) en de foto (`links.foto.href`). Ze worden ongewijzigd opgevraagd vanuit de school-tab.

#### Agenda

| Methode | Endpoint | Auth | `getJson`-cache | Call-site |
|---------|----------|------|-----------------|-----------|
| GET | `/api/leerlingen/{id}/afspraken?begin=&einde=&status=actief` | cookies | `no-cache` | `src/hooks/agenda/useAgendaLoader.ts` |
| POST | `/api/medewerkers/afspraken/{appointmentId}/verantwoordingen` | cookies | n.v.t. | `src/lib/agenda/tardyUtils.ts`: registreert een te-laat-melding |

#### Registraties (ongeoorloofd)

| Methode | Endpoint | Auth | `getJson`-cache | Call-site |
|---------|----------|------|-----------------|-----------|
| GET | `/api/m6/verantwoordingen/ongeoorloofderegistraties?datum=` | cookies | `no-cache` | `src/lib/registrations/fetch.ts` |
| DELETE | `/api/medewerkers/afspraken/verantwoordingen/{id}` | cookies | n.v.t. | `src/lib/registrations/delete.ts`: verwijdert een registratie |

#### Terugkommaatregelen

| Methode | Endpoint | Auth | `getJson`-cache | Call-site |
|---------|----------|------|-----------------|-----------|
| GET | `/api/m6/leerlingen/terugkomers?begin=&einde=&Status=Alles` | cookies | `no-cache` | `src/lib/return-measure/fetch.ts` |
| POST | `/api/leerlingen/{id}/verantwoordingen/terugkommaatregelen` | cookies | n.v.t. | `src/lib/return-measure/create.ts`: maakt een maatregel aan |
| PUT | `/api/terugkommaatregelen/{id}/melding` | cookies | n.v.t. | `src/lib/return-measure/report.ts`: meldt `Tijdig` / `NietTijdig` |

#### Afwezigheid (attendance.magister.net)

| Methode | Endpoint | Auth | `getJson`-cache | Call-site |
|---------|----------|------|-----------------|-----------|
| GET | `https://attendance.magister.net/api/v2/absence-notices/today?roles=Ondersteuner&date=` | **bearer** | `no-cache` | `src/lib/absence-notice/fetch.ts` |
| GET | `https://attendance.magister.net/api/v2/student/{uuid}/attendance-types?active=true` | **bearer** | `no-cache` | `src/lib/absence-notice/attendanceTypes.ts` (één keer, met UUID van de eerste leerling) |
| POST | `https://attendance.magister.net/api/v2/student/{uuid}/absence-notices` | **bearer** | n.v.t. | `src/lib/absence-notice/create.ts`: maakt een afwezigheidsmelding aan |
| DELETE | `https://attendance.magister.net/api/v2/student/{uuid}/absence-notices/{id}` | **bearer** | n.v.t. | `src/lib/absence-notice/delete.ts`: verwijdert een afwezigheidsmelding |

### 2.2 Gedefinieerd maar niet aangeroepen

Deze helpers staan in `endpoints.ts` zonder call-site:

| Categorie | Helper | Pad |
|-----------|--------|-----|
| Sessie | `account` | `/api/account` (de sessiecheck gebruikt een hardcoded pad in `tabs.ts`) |
| Medewerkers | `searchStaff` | `/api/medewerkers/zoeken?…` |
| Leerlingen | `studentPhoto` | `/api/leerlingen/{id}/foto` (foto’s gebruiken de `href` uit de API-response) |
| Ouders | `parentChildren` | `/api/ouders/{id}/kinderen` |
| Ouders | `parentAddress` | `/api/ouders/{id}/adresgegevens` |
| LVS | `unreadLog` | `/api/lvs/logboekformulieren/ongelezen?…` |

---

## 3. Waar calls worden gedaan (per domein)

```
src/magister/
  endpoints.ts                 ← pad-templates
  api.ts                       ← centrale HTTP-laag + jsonCache
  magisterTabJsonInPage.ts     ← JSON-fetch in de Magister-tab
  fetchBlobInMagisterTab.ts    ← blob-fetch in de Magister-tab

src/popup-utils/tabs.ts        ← tabselectie + GET /api/account (sessiecheck)
src/background.ts              ← sessie-hercontrole en login-flow (zie §1.3)

src/hooks/students/
  useStudentFetch.ts           ← zoeken + lockers
  studentDetailsFetchers.ts    ← personalia, adres, ouders, contact, foto

src/hooks/agenda/
  useAgendaLoader.ts           ← agenda (+ orchestreert afwezigheid/terugkom/registraties)

src/lib/agenda/tardyUtils.ts   ← POST te-laat
src/lib/registrations/         ← GET + DELETE
src/lib/return-measure/        ← GET + POST + PUT
src/lib/absence-notice/        ← GET + POST + DELETE + attendance-types
src/lib/shared/blobUtils.ts    ← getBlob voor foto’s
```

---

## 4. Tijdelijke opslag van leerlingdata

Er zijn drie lagen: `chrome.storage.session`, geheugen van de extensiepagina, en `chrome.storage.local` (alleen voorkeuren, geen leerlingdata).

**Levensduur van `chrome.storage.session`:** de data staat in het geheugen van de browser en wordt niet naar schijf geschreven. Ze blijft bestaan na het sluiten van het extensievenster, en wordt gewist bij het afsluiten van de browser en bij herladen, bijwerken of uitschakelen van de extensie. Er is geen expliciete toegangsniveau-instelling (`setAccessLevel`), dus alleen extensiecontexten hebben toegang (standaard `TRUSTED_CONTEXTS`).

### 4.1 Leerlingstore (`studentData`, session storage)

| | |
|--|--|
| In geheugen | `src/lib/students/dataStore.ts`: singleton `studentDataStore` |
| Persistentie | `src/lib/students/dataStorePersistence.ts`: key `studentData` in `chrome.storage.session` |
| Laden | `loadStudentDataFromSession()` vanuit `src/hooks/students/useStudentsInit.ts` |
| Wegschrijven | `useStudentStore` → `queuePersistStudentDataToSession()` na elke wijziging (debounce 300 ms) |
| Wissen | `clearStudentStore()` bij handmatig verversen (`useStudentFetch.refresh`); niet bij uitloggen uit Magister |
| Weergave | Alleen bij sessie `ready` (zie §1.3); het laden uit session storage gebeurt wel al vóór de sessiecheck |

Inhoud (`StudentDataSnapshot`):

- Voor **alle** leerlingen uit de zoekcall: `id`, `externeId` (UUID), stamnummer (`code`), voorletters, roepnaam, tussenvoegsel, achternaam, **e-mailadres**, **telefoonnummer**, klassen, lesgroepen, studies, link naar de foto, lockercode.
- Agenda per dag per leerling: lessen met docenten en groepen, afwezigheidsmeldingen, registraties, terugkommaatregelen.
- Laadstatus van afwezigheidsmeldingen per dag.

**Omvang van de agenda.** De agenda wordt niet alleen voor bekeken leerlingen opgehaald. `src/hooks/agenda/useAutoLoadAgenda.ts` laadt bij sessie `ready` elke 250–500 ms op de achtergrond de werkweek van de volgende leerling die nog niet geladen is. Dat geldt voor alle leerlingen in de gekozen opleidingen (`selectedStudies`), en voor **alle leerlingen van de school** als er geen opleidingsfilter staat. Daarnaast laadt `src/hooks/registrations/useRegistrationsAgendaLoader.ts`, zodra het tabblad Registraties open is, de werkweek van elke leerling binnen het opleidingsfilter met een ongeoorloofde registratie van vandaag. Alles komt in `studentData`.

### 4.2 JSON-responsecache (`jsonCache`, session storage)

| | |
|--|--|
| Code | `src/lib/shared/cache.ts` |
| Key | `jsonCache` in `chrome.storage.session`, LZString-gecomprimeerd |
| Gebruik | `getJson` in `src/magister/api.ts` met cache-optie `cache` (default) |
| Laden | `await loadJsonCache()` bij import van `api.ts` |
| Wissen | Geen code die de cache wist; alleen het einde van de browsersessie of herladen van de extensie |

Inhoud: volledige responses van **personalia, adresgegevens, ouders, oudercontactgegevens** (per bekeken leerling) en **lockers** (alle lockers). De cache-key is de relatieve URL, zonder school-origin.

Calls met `'no-cache'` (zoeken, agenda, registraties, terugkomers, afwezigheid, attendance-types) komen niet in deze cache.

### 4.3 Caches alleen in geheugen

Deze data verdwijnt als het extensievenster sluit en wordt niet naar `chrome.storage` geschreven.

| Module | Structuur | Data |
|--------|-----------|------|
| `src/lib/registrations/fetch.ts` | `Map<dateKey, RegistrationsResponse>` | Ongeoorloofde registraties per dag |
| `src/lib/return-measure/fetch.ts` | `Map<monthKey, ReturnMeasureStudent[]>` | Terugkommaatregelen per maand, inclusief leerlinggegevens |
| `src/lib/return-measure/report.ts` | `Map<measureId, action>` | Lokaal bijgehouden meldstatus na een PUT |
| `src/lib/absence-notice/fetch.ts` | `Map<dateKey, AbsenceNotice[]>` | Afwezigheidsmeldingen per dag |
| `src/lib/absence-notice/attendanceTypes.ts` | module-variabele | Schoolbrede afwezigheidscodes (geen persoonsgegevens) |
| `src/lib/bulk-lists/registry.ts` | `Map<listId, snapshot>` | Lijstweergaven van vandaag (registraties, terugkommaatregelen) |
| `src/lib/shared/blobUtils.ts` | `Map<href, objectUrl>` | Leerlingfoto’s als object-URL |

### 4.4 Overige storage-keys

**`chrome.storage.session`** (geen leerlingdata):

| Key | Code | Inhoud |
|-----|------|--------|
| `activeTabId` | `src/magister/api.ts`, `src/background.ts` | Tab-ID van de Magister-tab voor injectie |
| `loginTabId` | `src/popup-utils/tabs.ts` | Tab-ID van de login-tab |
| `magisterSession` | `src/background.ts`, `src/context/MagisterSessionProvider.tsx` | Status: `checking` / `connecting` / `ready` / `cancelled` |
| `popupWindowId` | `src/background.ts` | Venster-ID van het extensievenster |
| `studentsSearchTerm` | `src/components/Students.tsx` via `useSearchTermStorage` | Ingevoerde zoekterm (kan een leerlingnaam zijn) |

**`chrome.storage.local`** (blijft bewaard):

| Key | Code | Inhoud |
|-----|------|--------|
| `magisterSchoolOrigin` | `src/popup-utils/tabs.ts` | School-URL, bijv. `https://school.magister.net` |
| `selectedStudies` | `src/hooks/shared/useSelectedStudiesStorage.ts` | Gekozen opleidingsfilter |
| `occupancySelectedLocations` | `src/components/occupancy/useOccupancyLocationSelection.ts` | Gekozen bezettingslocaties |
| `themePreference` | `src/lib/theme/preference.ts` | Licht/donker thema |

---

## 5. Cache-gedrag van `getJson`

Opties in `src/magister/api.ts`:

| Optie | Lezen uit `jsonCache` | Schrijven naar `jsonCache` | Gebruikt |
|-------|----------------------|----------------------------|----------|
| `cache` (default) | ja | ja | ja (studentdetails, lockers) |
| `cache-write-only` | nee | ja | nee |
| `no-cache` | nee | nee | ja |

Mutaties (`postJson` / `putJson` / `deleteJson`) worden niet gecachet.

---

## 6. Aandachtspunten voor de audit

1. **Transport:** alle requests lopen via de ingelogde school-tab, met de cookies of het OIDC-token van die tab. Er is geen tussenserver.
2. **Lockers zonder authenticatie:** `lockers.magister.net/api/v1/lockers/details` wordt zonder cookies en zonder token opgevraagd en levert lockercodes gekoppeld aan leerling-ID’s.
3. **Persoonsgegevens in session storage:** `studentData` (naam, e-mail, telefoon en klas van alle leerlingen, plus de werkweekagenda van alle leerlingen in de gekozen opleidingen, of van de hele school zonder filter) en `jsonCache` (personalia, adres, ouders en hun contactgegevens van bekeken leerlingen, plus lockers).
4. **Wissen:** `jsonCache` wordt nooit expliciet gewist, ook niet bij verversen. Geen van beide keys wordt gewist bij uitloggen uit Magister; ze blijven tot de browser sluit of de extensie herlaadt. Zonder geldige sessie wordt de data niet getoond (§1.3).
5. **Cache-key zonder school:** `jsonCache` gebruikt relatieve URL’s; bij wisselen van school binnen één browsersessie kan een response van de vorige school voor hetzelfde ID worden teruggegeven.
6. **URL’s uit responses:** `links.next.href` en `links.foto.href` worden zonder validatie opgevraagd vanuit de school-tab (foto met `credentials: 'include'`).
7. **Schrijfacties:** te-laat-melding, registratie verwijderen, terugkommaatregel aanmaken/melden, afwezigheidsmelding aanmaken/verwijderen. Alle met de rechten van de ingelogde gebruiker.
8. **Logging:** bij een cache-hit logt `api.ts` de URL (`[JSON CACHE] …`, met leerling-ID) naar de console; foutmeldingen loggen leerling-ID’s en foto-URL’s.
9. **Geen leerlingdata in `chrome.storage.local`.** De opgeslagen zoekterm staat in session storage.
10. **Dode code:** zes ongebruikte endpoint-helpers (WIP code) in `endpoints.ts` en de ongebruikte cache-optie `cache-write-only`.

---

## 7. Open vraag voor de audit: versleutelde cache op schijf

**Vraag:** mag de leerlingcache versleuteld op schijf staan, met een sleutel die alleen in `chrome.storage.session` staat, zodat de data na het sluiten van de browser nooit meer leesbaar is? Voldoet dat aan de AVG?

**Aanleiding.** `chrome.storage.session` heeft een limiet van 10 MB. Met de werkweekagenda van alle leerlingen (§4.1) plus `jsonCache` loopt de extensie daar tegenaan. Opslag op schijf, zoals IndexedDB of `chrome.storage.local` met de permissie `unlimitedStorage`, heeft die limiet niet. Daar staat de data echter ook na het sluiten van de browser.

**Voorgestelde opzet:**

- Bij de eerste `ready`-sessie maakt de extensie een willekeurige AES-GCM-sleutel van 256 bits (WebCrypto) en zet de ruwe sleutelbytes alleen in `chrome.storage.session`.
- `studentData` en `jsonCache` worden versleuteld (met een unieke IV per record) en staan in IndexedDB.
- Bij het afsluiten van de browser, of bij herladen, bijwerken of uitschakelen van de extensie, verdwijnt de sleutel. De ciphertext op schijf is daarna niet meer te ontsleutelen.
- De database wordt gewist bij het opstarten van de browser (`chrome.runtime.onStartup`) en bij elke start van de extensie waarbij de sleutel ontbreekt. Zo verdwijnt ook wat na een crash of geforceerd afsluiten is blijven staan. Pas daarna maakt de extensie een nieuwe sleutel.
- Wissen bij het afsluiten van de browser kan niet betrouwbaar: Chrome heeft daar geen extensie-event voor. `chrome.runtime.onSuspend` gaat af als de service worker stopt, niet zeker bij afsluiten, en een asynchrone wis-actie in IndexedDB is dan niet gegarandeerd klaar. Bij afsluiten verdwijnt alleen de sleutel; de onleesbare ciphertext wordt bij de volgende start gewist.
- De afscherming uit §1.3 blijft gelden: zonder `ready`-sessie wordt niets ontsleuteld of getoond.

**Punten om te beoordelen:**

1. **Status van de ciphertext.** Versleutelde gegevens blijven persoonsgegevens zolang er een sleutel bestaat. Is ciphertext waarvan de sleutel aantoonbaar vernietigd is ("crypto-shredding") voldoende gewist of geanonimiseerd in de zin van de AVG (artikel 5 lid 1 sub e, artikel 17)?
2. **Sleutel in het geheugen.** `chrome.storage.session` schrijft niet naar schijf, maar het besturingssysteem kan browsergeheugen wel naar schijf schrijven: in het wisselbestand, het slaapstandbestand of een crashdump. Is dat restrisico acceptabel, bijvoorbeeld met volledige schijfversleuteling (BitLocker) op schoolapparaten als randvoorwaarde?
3. **Levensduur van de sessie.** Als Chrome op de achtergrond doordraait of het apparaat in slaapstand gaat, blijft de sleutel bestaan. Is een extra maximale levensduur nodig, waarbij sleutel en data na bijvoorbeeld één werkdag worden gewist?
4. **Achtergebleven ciphertext.** Tussen het afsluiten en de volgende start van de browser staat onleesbare ciphertext op schijf; de sleutel bestaat dan al niet meer. Wordt de browser niet meer gestart, of wordt de extensie verwijderd zonder opnieuw te starten, dan blijft die staan tot Chrome de extensiedata opruimt. Is dat acceptabel?
5. **Vergelijking met de huidige situatie.** Is deze opzet minstens zo veilig als de huidige opslag, die alleen in het geheugen staat en niet versleuteld is? Moet dit in de DPIA van de school worden opgenomen?

---

*Opgesteld op basis van de codebase; bij wijzigingen in API-calls of opslag dit document bijwerken.*
