# Reel-to-Trip von CHECK24: Feature-Konzept & Prototyp

> **„Boah, da will ich auch mal hin!“**

Viele Reisewünsche entstehen heute beim Scrollen durch Social Media, oft lange bevor jemand stöbert oder konkret sucht. **Reel-to-Trip ist eine Idee, wie CHECK24 schon in diesem Moment dabei sein könnte**, und zwar mit der Emotion aus dem Feed: Reel per DM an CHECK24 teilen, die KI erkennt das Ziel direkt aus dem Video, Preis checken, auf die Bucket List, bis es ins Budget passt. Dann kommt der Push, und gebucht wird bei CHECK24.

```
Heute:            Inspiration → Wunsch → Sparen → [CHECK24: Stöbern → Suche → Buchung]
Mit Reel-to-Trip: [neu: Inspiration → Wunsch → Sparen] → [CHECK24: Stöbern → Suche → Buchung]
```

Reel-to-Trip ergänzt den bestehenden Weg um einen früheren Einstieg, es ersetzt ihn nicht.

> Inoffizielles Konzept von Jan-Hendrik Höltkemeier, keine CHECK24-Seite. **Echt** ist die KI: Bilder aus dem Video ziehen und das Ziel per Claude API erkennen (multimodal, Structured Outputs). **Simuliert** sind Social-App, Login, Preise und Hotelliste.

## Schnellstart

```bash
npm install
cp .env.example .env.local                  # ANTHROPIC_API_KEY eintragen
./scripts/prepare-reels.sh ~/Pfad/zu/videos  # Demo-Videos nach public/reels/ (siehe unten)
npm run dev                                 # http://localhost:3000
```

Ohne API-Key läuft die App im **Offline-Modus** mit vorbereiteten Antworten für die sechs Demo-Reels. Das ist das Backup, falls im Gespräch WLAN oder API haken. Der Modus steht oben in der Leiste.

### Demo-Videos

Die sechs Reels (Mallorca, Shanghai, Albanien, England, Rio, Athen) sind **nicht im Repo**, weil die Rechte bei den Creators liegen. `scripts/prepare-reels.sh` erwartet einen Ordner mit MP4-Dateien, deren Name das jeweilige Stichwort enthält. Das Skript erzeugt `public/reels/<id>.mp4` (fürs Web optimiert) und ein Posterbild.

## Demo-Ablauf (ca. 3 Minuten)

1. **Einstieg:** Die Einführung im Handy erklärt die Bedienung. „Los geht’s“ startet den Feed mit Ton.
2. **Scrollen:** Der Reels-Feed läuft endlos, nach dem letzten Reel kommt wieder das erste.
3. **Der Moment:** Beim Shanghai-Reel denkt man „Boah, da will ich hin!“. Also auf **➤ Teilen** tippen, **check24** wählen, **Senden**.
4. **KI bei der Arbeit:** Im Chat erscheinen live 8 Bilder aus dem Video. Die KI erkennt Shanghai an der Skyline (Oriental Pearl Tower, Shanghai Tower) und zeigt einen Preis. Rechts unter **Idee & KI** steht, woran sie das Ziel erkannt hat.
5. **Bucket List statt Buchung:** *Auf Bucket List* tippen, Konto verbinden (Demo, Budget 800 €). Der Bot sagt, wie weit das Ziel noch über dem Budget liegt, dann **„Sobald’s in mein Budget passt“** wählen.
6. **⏩ 1 Woche vorspulen** (2 bis 4 ×): Im Konto füllt sich der Budget-Balken, dann kommt der Push „Dein Traumziel passt jetzt in dein Budget“. Ein Klick öffnet die vorausgefüllte Suche.
7. **Unklarer Fall:** Das England-Reel zeigt Orte in England, Wales und Schottland. Die KI merkt den Widerspruch zur Bildunterschrift und fragt nach.

## Wie die KI funktioniert

```
Reel ──▶ 8 Einzelbilder (Browser, <canvas>)  ─┐
         Bildunterschrift (optional)         ─┼─▶ /api/analyze ──▶ Claude (multimodal)
         Antwort/Korrektur des Nutzers       ─┘                    │  festes JSON-Schema
                                                                   ▼
             Ort · Region · Land · Flughafen · Spots · Sicherheit · Rückfrage
                                                                   │
                         Demo-Preis ◀── Abbildung auf CHECK24 ◀────┘
                         Bucket List · Preisalarm · Push · Deep Link
```

| Datei | Inhalt |
| --- | --- |
| `lib/frames.ts` | Zieht Einzelbilder aus dem Video, direkt im Browser |
| `lib/claude.ts` | Prompt + JSON-Schema, multimodaler Aufruf |
| `app/api/analyze/route.ts` | API-Route: Claude-Aufruf, Anfragelimit, Offline-Antwort |
| `lib/fallback.ts` | Vorbereitete Antworten für den Offline-Modus |
| `lib/pricing.ts` | Demo-Preise + Preis-Simulation |
| `components/ReelsFeed.tsx` | Reels-Feed mit Teilen-Funktion |
| `components/Demo.tsx` | Chat-Logik, Konto, Vorspulen |
| `components/AccountPanel.tsx` | Idee & KI, Bucket List, KI-Log |

Im echten Produkt würde ein Worker die Bilder mit ffmpeg ziehen (mit Szenenwechsel-Erkennung) und zusätzlich den Ton transkribieren. Die Zuordnung zum Ziel liefe gegen das echte CHECK24-Inventar.

## Deployment

Auf Vercel importieren und `ANTHROPIC_API_KEY` als Environment Variable setzen. Der Key bleibt auf dem Server. Ein einfaches Anfragelimit (40 Analysen pro IP und Stunde) schützt das Budget. Zusätzlich in der Anthropic Console ein Ausgabenlimit setzen. Die Seite ist per `noindex` für Suchmaschinen gesperrt.
