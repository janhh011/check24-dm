"use client";

import { useState } from "react";
import { formatEUR } from "@/lib/pricing";
import type { AnalyzeResponse, BucketItem, UserProfile } from "@/lib/types";

type Tab = "konto" | "funktion" | "log";

export default function AccountPanel({
  profile,
  bucket,
  log,
  week,
  onOpenItem,
}: {
  profile: UserProfile | null;
  bucket: BucketItem[];
  log: AnalyzeResponse[];
  week: number;
  onOpenItem: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("konto");

  return (
    <section className="panel">
      <nav className="tabs">
        <button className={tab === "konto" ? "on" : ""} onClick={() => setTab("konto")}>
          CHECK24-Konto {bucket.length > 0 && <span className="count">{bucket.length}</span>}
        </button>
        <button className={tab === "funktion" ? "on" : ""} onClick={() => setTab("funktion")}>
          So funktioniert’s
        </button>
        <button className={tab === "log" ? "on" : ""} onClick={() => setTab("log")}>
          Claude-Log {log.length > 0 && <span className="count">{log.length}</span>}
        </button>
      </nav>

      <div className="panel-body">
        {tab === "konto" && <Konto profile={profile} bucket={bucket} week={week} onOpenItem={onOpenItem} />}
        {tab === "funktion" && <Funktion />}
        {tab === "log" && <Log log={log} />}
      </div>
    </section>
  );
}

function Konto({ profile, bucket, week, onOpenItem }: { profile: UserProfile | null; bucket: BucketItem[]; week: number; onOpenItem: (id: string) => void }) {
  return (
    <div>
      <div className="acct-head">
        <div>
          <h2>Meine Bucket List</h2>
          <p className="muted">Sicht im CHECK24-Kundenkonto (App & Web)</p>
        </div>
        <div className={`acct-status ${profile ? "ok" : ""}`}>
          {profile ? (
            <>
              ✔ {profile.email}
              <br />
              <span>
                ab {profile.origin} · {profile.month} · {profile.travellers} Pers. · Budget {formatEUR(profile.budget)}
              </span>
            </>
          ) : (
            "Noch nicht mit Social-Account verbunden"
          )}
        </div>
      </div>

      {bucket.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">🧳</div>
          <p>
            Noch leer. Teile im Handy links über <strong>🎬</strong> ein Reel an den CHECK24-Account und tippe auf <strong>Auf Bucket List</strong>.
          </p>
        </div>
      ) : (
        <div className="bucket">
          {bucket.map((b) => {
            const cur = b.priceHistory[b.priceHistory.length - 1];
            const diff = Math.round((cur / b.offer.pricePP - 1) * 100);
            return (
              <button key={b.id} className="bucket-item" onClick={() => onOpenItem(b.id)}>
                <div className="bucket-thumb" style={{ background: b.gradient }}>
                  {b.emoji}
                </div>
                <div className="bucket-info">
                  <strong>{b.result.place}</strong>
                  <span className="muted">
                    {b.result.region ? `${b.result.region}, ` : ""}
                    {b.result.country}
                    {b.result.nearestAirport ? ` · ✈️ ${b.result.nearestAirport.iata}` : ""}
                  </span>
                  <span className="bucket-alert">
                    {b.alert ? (
                      b.alert.triggered ? (
                        <span className="tag hit">🔔 ausgelöst · {b.alert.triggered.channel}</span>
                      ) : (
                        <span className="tag">🔔 Alarm unter {formatEUR(b.alert.threshold)}</span>
                      )
                    ) : (
                      <span className="tag off">kein Preisalarm</span>
                    )}
                  </span>
                </div>
                <div className="bucket-price">
                  <Sparkline values={b.priceHistory} threshold={b.alert?.threshold} />
                  <strong>{formatEUR(cur)}</strong>
                  {b.priceHistory.length > 1 && <span className={diff <= 0 ? "down" : "up"}>{diff > 0 ? `+${diff}` : diff} %</span>}
                </div>
              </button>
            );
          })}
          <p className="muted small">
            Preisbeobachtung: {week === 0 ? "startet – oben „1 Woche vorspulen“ simuliert den täglichen Preis-Job." : `${week} Woche(n) simuliert.`} Klick auf ein Ziel
            öffnet den Deep Link in die Suche.
          </p>
        </div>
      )}
    </div>
  );
}

function Sparkline({ values, threshold }: { values: number[]; threshold?: number }) {
  const w = 90;
  const h = 30;
  const all = threshold ? [...values, threshold] : values;
  const min = Math.min(...all) * 0.97;
  const max = Math.max(...all) * 1.03;
  const x = (i: number) => (values.length === 1 ? w / 2 : (i / (values.length - 1)) * w);
  const y = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg width={w} height={h} className="spark" aria-hidden>
      {threshold && <line x1={0} x2={w} y1={y(threshold)} y2={y(threshold)} className="spark-th" />}
      <polyline points={pts} className="spark-line" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={2.8} className="spark-dot" />
    </svg>
  );
}

const STEPS: Array<{ n: number; title: string; product: string; demo: string; real: boolean }> = [
  { n: 1, title: "Reel per DM teilen", product: "Meta Instagram Messaging API: Webhook liefert Anhang vom Typ ig_reel inkl. URL", demo: "simuliert (Social-App links)", real: false },
  { n: 2, title: "Signale einsammeln", product: "Bildunterschrift, Ortsmarkierung, Hashtags, Video-Frames, Audio-Transkript (Whisper)", demo: "Bildunterschrift, Ortsmarkierung, Screenshot; TikTok-Links live per oEmbed", real: true },
  { n: 3, title: "Ziel erkennen", product: "LLM mit Structured Output (JSON-Schema): Ort, Land, Flughafen, Sicherheit, Rückfrage", demo: "echt – Claude API mit Structured Outputs", real: true },
  { n: 4, title: "Auf buchbares Ziel mappen", product: "Ort → Region → Zielflughafen → Hotelgebiet im CHECK24-Inventar", demo: "Claude liefert IATA + Region", real: true },
  { n: 5, title: "Preis abfragen", product: "interne CHECK24-Such-APIs (Pauschalreise, Flug + Hotel)", demo: "Fantasiepreise (deterministisch)", real: false },
  { n: 6, title: "Konto verknüpfen", product: "Einmal-Token: Social-ID ↔ Kundenkonto, Profil + Einwilligung", demo: "simulierter Login + Onboarding", real: false },
  { n: 7, title: "Preise beobachten", product: "täglicher Job je Bucket-List-Ziel, Regeln: unter Schwelle / X % unter Ø / Last Minute", demo: "„1 Woche vorspulen“", real: false },
  { n: 8, title: "Benachrichtigen", product: "App-Push, E-Mail, WhatsApp (Opt-in) – DM nur im offenen 24-h-Fenster", demo: "Push-Banner auf dem Handy", real: false },
  { n: 9, title: "Buchen", product: "Deep Link in vorausgefüllte Suche mit Attribution (utm_source=social_dm)", demo: "Mock-Ergebnisliste", real: false },
];

function Funktion() {
  return (
    <div className="howto">
      <h2>Vom Reel zur Buchung</h2>
      <ol className="steps">
        {STEPS.map((s) => (
          <li key={s.n}>
            <span className="step-n">{s.n}</span>
            <div>
              <strong>{s.title}</strong>
              <span className="step-product">{s.product}</span>
              <span className={`step-demo ${s.real ? "real" : ""}`}>Demo: {s.demo}</span>
            </div>
          </li>
        ))}
      </ol>

      <h3>Plattform-Grenzen (wichtig fürs Produktdesign)</h3>
      <ul className="constraints">
        <li>
          <strong>24-Stunden-Fenster:</strong> Ein Business-Account darf nur bis 24 h nach der letzten Nutzernachricht automatisch antworten. Danach nur noch
          manuell mit HUMAN_AGENT-Tag (max. 7 Tage). Für Instagram gibt es keine One-Time-Notifications → Preisalarme müssen über eigene Kanäle laufen.
        </li>
        <li>
          <strong>Ausnahme Anzeigen:</strong> Chats, die über Click-to-Direct-Anzeigen starten, haben seit 28.09.2026 ein Fenster von bis zu 7 Tagen – gut für
          eine Launch-Kampagne.
        </li>
        <li>
          <strong>TikTok:</strong> Die Business Messaging API ist im EWR, der Schweiz und UK nicht verfügbar → TikTok-Nutzer teilen den Link per WhatsApp oder
          in der App (Share-Extension).
        </li>
        <li>
          <strong>Mensch erreichbar:</strong> Meta verlangt für Messaging-Apps einen Eskalationspfad zu einem menschlichen Mitarbeiter.
        </li>
        <li>
          <strong>Datenschutz:</strong> Hinweis zur Verarbeitung in der ersten Antwort, Videos nur verarbeiten und nicht speichern, Einwilligung für
          Benachrichtigungen beim Verknüpfen.
        </li>
      </ul>

      <h3>Funnel-KPIs für den MVP</h3>
      <div className="funnel">
        {["Reel geteilt", "Ziel erkannt", "Konto verknüpft", "Alarm gesetzt", "Alarm geklickt", "Buchung"].map((s, i) => (
          <div key={s} className="funnel-step" style={{ width: `${100 - i * 11}%` }}>
            {s}
          </div>
        ))}
      </div>
      <p className="muted small">Größtes Risiko: Abbruch beim Konto-Login. Deshalb zuerst Wert zeigen (Ziel + Preis), Login erst beim Speichern.</p>
    </div>
  );
}

function Log({ log }: { log: AnalyzeResponse[] }) {
  if (log.length === 0)
    return (
      <div className="empty">
        <div className="empty-emoji">🧠</div>
        <p>Hier erscheint, was Claude aus jedem geteilten Beitrag herausliest – als strukturiertes JSON.</p>
      </div>
    );
  return (
    <div className="log">
      {log.map((l, i) => (
        <div key={i} className="log-entry">
          <div className="log-head">
            <span className={`tag ${l.source === "claude" ? "hit" : "off"}`}>{l.source === "claude" ? `Claude · ${l.model}` : "Offline-Fallback"}</span>
            <span className="muted">{(l.latencyMs / 1000).toFixed(1)} s</span>
            <span className={`tag status-${l.result.status}`}>{l.result.status}</span>
          </div>
          {l.inputSummary && <div className="log-input">Input: {l.inputSummary}</div>}
          {l.note && <div className="log-note">ℹ️ {l.note}</div>}
          <div className="log-signals">
            {l.result.signals.map((s, j) => (
              <span key={j} className="signal">
                {s}
              </span>
            ))}
          </div>
          <details>
            <summary>JSON anzeigen</summary>
            <pre>{JSON.stringify(l.result, null, 2)}</pre>
          </details>
        </div>
      ))}
    </div>
  );
}
