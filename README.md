# Reel-to-Trip – Konzept-Prototyp für CHECK24

**Idee:** Nutzer:innen schicken ein Reise-Reel per Direktnachricht an den CHECK24-Account. Claude erkennt das Reiseziel, der Bot zeigt sofort ein passendes Angebot, speichert das Ziel auf der Bucket List im CHECK24-Konto und meldet sich per Preisalarm, wenn’s günstiger wird.

> ⚠️ Konzept-Prototyp. Social-App, Login, Preise und Ergebnisliste sind simuliert. **Echt** ist die Zielerkennung über die Claude API (Structured Outputs) – inkl. Screenshot-Analyse und TikTok-Links (oEmbed).

## Schnellstart

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY eintragen
npm run dev                  # http://localhost:3000
```

Ohne API-Key läuft die App im **Offline-Modus** mit vorbereiteten Antworten für die fünf Demo-Reels – gut als Backup, falls im Gespräch WLAN oder API haken. Der Modus steht oben rechts in der Leiste.

### Deployment (optional)

Auf Vercel importieren, `ANTHROPIC_API_KEY` als Environment Variable setzen, fertig. Der Key bleibt serverseitig (`/api/analyze`), er landet nie im Browser.

## Demo-Ablauf fürs Gespräch (ca. 4 Minuten)

1. **Problem (20 s):** „Jeder speichert Reise-Reels – gebucht wird davon fast nichts. Zwischen Inspiration und Buchung fehlt ein Schritt.“
2. **Reel teilen:** 🎬 → *@wanderlust.lena (Ksamil)* → Senden. Claude erkennt Ort, Flughafen (CFU + Fähre) und Sicherheit, der Bot zeigt direkt einen Preis.
3. **Wert vor Login:** Erst jetzt *Auf Bucket List* → *Mit CHECK24 verbinden* → Onboarding (Abflughafen, Monat, Budget). Punkt: Login-Abbruch ist das größte Funnel-Risiko, deshalb erst Wert zeigen.
4. **Preisalarm:** Schwelle wählen → Hinweis im Chat: *„Nach 24 h darf ich hier nicht mehr automatisch schreiben“*. Das ist die Meta-Regel, die das ganze Produktdesign bestimmt.
5. **⏩ 1 Woche vorspulen** (1–3 ×) → Push-Banner → Klick → Deep Link in die vorausgefüllte Suche mit `utm_source=social_dm`.
6. **Grenzfälle:** *@sunset.chaser* (mehrdeutig → Rückfrage mit Kandidaten) und *@foodie.berlin* (kein Reiseziel → ehrliche Antwort). Optional: eigenen Screenshot über 📎 schicken.
7. **Tab „Claude-Log“:** strukturiertes JSON + Signale, woran das Ziel erkannt wurde.
8. **Tab „So funktioniert’s“:** Pipeline (was echt, was simuliert ist), Plattform-Grenzen, Funnel-KPIs.

## Architektur

```
Social-DM (simuliert)            Next.js App
┌───────────────┐   POST    ┌──────────────────────────────┐
│ Reel / Link / │ ────────▶ │ /api/analyze                 │
│ Screenshot    │           │  1. Signale sammeln          │
└───────────────┘           │     (Caption, Ortsmarkierung,│
        ▲                   │      Screenshot, TikTok-oEmbed)
        │                   │  2. Claude: JSON-Schema-     │
        │                   │     Output (Ziel, IATA, …)   │
        │                   │  3. Fallback ohne Key        │
        │                   └──────────────────────────────┘
        │  Ergebnis + Demo-Preis (lib/pricing.ts)
        │
  Bucket List · Preisalarm · Push · Deep Link (Client-State, simuliert)
```

| Datei | Inhalt |
| --- | --- |
| `app/api/analyze/route.ts` | API-Route: Signale sammeln, Claude aufrufen, Fallback |
| `lib/claude.ts` | Prompt + JSON-Schema (Structured Outputs) |
| `lib/fallback.ts` | Offline-Antworten für die Demo-Reels |
| `lib/pricing.ts` | Deterministische Demo-Preise + Preis-Simulation |
| `lib/reels.ts` | Die fünf Demo-Reels |
| `components/Demo.tsx` | Chat-Logik, Konto-Verknüpfung, Vorspulen |
| `components/AccountPanel.tsx` | Bucket List, „So funktioniert’s“, Claude-Log |

## Was im echten Produkt anders wäre

- **Eingang:** Instagram Messaging API (Webhook mit `ig_reel`-Anhang), Antwort nur im 24-h-Fenster. TikTok-DMs gehen im EWR nicht, deshalb dort WhatsApp oder die Share-Extension der App.
- **Signale:** zusätzlich Video-Frames und Audio-Transkript, dann Geocoding (z. B. Google Places) und Zuordnung zum CHECK24-Inventar.
- **Preise:** interne Such-APIs, täglicher Beobachtungs-Job, Regeln (Schwelle, X % unter Durchschnitt, Last Minute).
- **Benachrichtigung:** App-Push, E-Mail oder WhatsApp mit Opt-in, nicht per DM.
- **Pflichten:** Weiterleitung an einen Menschen (Meta-Vorgabe), Datenschutzhinweis, Videos nicht speichern.
