# Privacy & AVG

Deze pagina legt uit hoe de Magister OOP-extensie omgaat met gegevens en waarom dat aansluit bij de AVG (Algemene Verordening Gegevensbescherming).

## Samenvatting

De extensie verwerkt leerling- en persoonsgegevens alleen in jouw browser. Er zijn geen eigen servers; alle communicatie gaat rechtstreeks naar Magister. Leerlingdata wordt niet permanent opgeslagen. Alleen jouw voorkeuren (filters, gekozen locaties) blijven bewaard in local storage.

**Zodra je de browser afsluit en het extensievenster sluit, zijn alle gecachte persoonsgegevens verloren.** Er blijft dan niets van leerling- of roosterdata over op je apparaat.

## Geen externe servers

De extensie heeft geen eigen backend of cloud. Alles draait lokaal in je browser. API-aanroepen gaan **rechtstreeks** naar Magister (magister.net); er is geen tussenliggende dienst die data ontvangt of doorstuurt. Geen leerling- of persoonsgegevens verlaten je browser richting servers van de extensie, omdat die niet bestaan.

## Communicatie alleen met Magister

De extensie praat uitsluitend met Magister via hun API. Dat gebeurt via een tab waarin je op magister.net bent ingelogd: de extensie gebruikt de cookies/sessie van die tab om geauthenticeerde requests te doen. Magister is daarmee de enige externe partij waarmee gegevens worden uitgewisseld; dat is dezelfde partij als wanneer je Magister normaal in de browser gebruikt.

## Conservatief met API-calls

Er wordt zuinig omgegaan met aanroepen naar de Magister-API. Waar mogelijk wordt hergebruikt wat al is opgehaald; alleen wat nodig is voor de actie die je op dat moment uitvoert wordt opgevraagd. Dat beperkt zowel de belasting op Magister als de hoeveelheid data die in de extensie circuleert.

## Niet-persistente cache

Om het aantal API-calls te beperken wordt een lokale cache gebruikt. Die cache staat in **session storage** en is **niet persistent**: zodra je de browser of het extensievenster sluit, wordt de cache gewist. Binnen een sessie worden eerder opgehaalde antwoorden (bijv. roosters, leerlinglijsten) hergebruikt waar dat kan. De cache bevat geen extra kopieën van data die langer blijven bestaan dan je sessie.

## Geen leerlingdata in local storage

Leerlinggegevens (namen, roosters, absenties, foto’s, enz.) worden **niet** in local storage weggeschreven. Ze bestaan alleen:

- in het geheugen van de extensie tijdens gebruik;
- in session storage (tot je de browser of het extensievenster sluit).

Na het sluiten verdwijnt die data. Er is geen permanente opslag van leerling- of persoonsgegevens op je apparaat.

## Local storage alleen voor voorkeuren

In local storage wordt uitsluitend bewaard wat je zelf kiest:

- **Geselecteerde opleidingen** — Het filter dat je in het tabblad Leerlingen hebt ingesteld (bijv. alleen 3B, 4K).
- **Geselecteerde bezettingslocaties** — Welke locaties je in het tabblad Bezetting wilt zien.

Dit zijn geen persoonsgegevens. Het zijn voorkeuren die het gebruik van de extensie vergemakkelijken; je kunt ze altijd wijzigen of de extensie verwijderen om alles te wissen.

## Wat wordt waar bewaard?

| Soort gegevens              | Session storage | Local storage | Na sluiten |
|----------------------------|-----------------|---------------|------------|
| Leerlinglijsten, roosters  | Ja (tijdelijk)  | Nee           | Verdwijnt  |
| API-cache (roosters, etc.) | Ja (tijdelijk)  | Nee           | Verdwijnt  |
| Zoekterm (Leerlingen)      | Ja (tijdelijk)  | Nee           | Verdwijnt  |
| Actieve Magister-tab ID    | Ja (tijdelijk)  | Nee           | Verdwijnt  |
| Filter opleidingen         | Nee             | Ja            | Blijft     |
| Filter bezettingslocaties  | Nee             | Ja            | Blijft     |

## AVG-uitgangspunten

Deze aanpak sluit aan bij:

- **Minimale gegevensverwerking** — Alleen wat nodig is voor de functionaliteit wordt verwerkt.
- **Geen onnodige persistentie** — Leerlingdata wordt niet langer bewaard dan nodig.
- **Geen doorsturen naar derden** — Geen eigen servers; alleen Magister als verwerker (zoals bij normaal Magister-gebruik).
- **Transparantie** — Deze documentatie legt uit wat er met gegevens gebeurt.

## Verwijderen van gegevens

- **Session storage** — Sluit de browser of het extensievenster; de tijdelijke data verdwijnt automatisch.
- **Local storage** — Verwijder de extensie in Chrome (`chrome://extensions/` → Verwijderen) om ook je opgeslagen voorkeuren te wissen. Je kunt ook handmatig de extensiegegevens wissen via de Chrome-instellingen.

## Vragen

Voor vragen over deze extensie: zie de [README](../README.md) en de [documentatie](getting-started.md) in deze repository. Voor vragen over hoe Magister zelf met gegevens omgaat, raadpleeg het privacybeleid van Magister.
