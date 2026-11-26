# Reel-to-Trip – inoffizieller Konzept-Prototyp

**Idee:** Reiseinspiration entsteht im Feed, gebucht wird woanders oder gar nicht. Mit Reel-to-Trip teilt man ein Reise-Reel einfach per Direktnachricht an CHECK24. Die KI erkennt das Ziel direkt aus dem Video, der Bot zeigt ein passendes Angebot, speichert das Ziel auf der Bucket List und meldet sich per Preisalarm, wenn’s günstiger wird.

> Inoffizieller Prototyp von Jan-Hendrik Höltkemeier, keine CHECK24-Seite. **Echt** ist die KI: Bilder aus dem Video ziehen und das Ziel per Claude API erkennen (multimodal, Structured Outputs). **Simuliert** sind Social-App, Login, Preise und Hotelliste.

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

1. **Scrollen:** Links läuft ein Reels-Feed wie gewohnt. Kurz durchwischen.
2. **Teilen:** Bei Mallorca auf **➤ Teilen** tippen, **check24** wählen, **Senden**.
3. **KI bei der Arbeit:** Im Chat erscheinen live 8 Bilder aus dem Video, die KI liest Texteinblendungen („Caló des Moro“, „Valldemossa“ …) und erkennt Mallorca mit Flughafen PMI und den Spots im Video. Rechts unter **Idee & KI** steht, woran sie das Ziel erkannt hat.
4. **Bucket List & Alarm:** *Auf Bucket List* tippen, Konto verbinden (Demo), Preisschwelle wählen.
5. **⏩ 1 Woche vorspulen** (1–3 ×): Der Push kommt, ein Klick öffnet die vorausgefüllte Suche.
6. **Der Wow-Moment:** Unter *Idee & KI* **„Bildunterschrift mitschicken“ ausschalten** und das Shanghai-Reel teilen. Die KI erkennt Shanghai nur anhand der Skyline (Oriental Pearl Tower, Shanghai Tower).
7. **Unklarer Fall:** Das England-Reel zeigt Orte in England, Wales und Schottland. Die KI merkt den Widerspruch zur Bildunterschrift und fragt nach, welcher Ort gemeint ist.

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
