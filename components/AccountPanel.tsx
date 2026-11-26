"use client";

import { useEffect, useState } from "react";
import { formatEUR } from "@/lib/pricing";
import type { AnalyzeResponse, BucketItem, UserProfile } from "@/lib/types";
import type { LastAnalysis } from "./Demo";

type Tab = "ki" | "konto" | "log";

const FUNNEL = ["💭 Inspiration", "❤️ Wunsch", "💰 Sparen", "✅ Entscheidung", "🔍 Suche", "✈️ Buchung"];

export default function AccountPanel({
  profile,
  bucket,
  log,
  last,
  week,
  onOpenItem,
}: {
  profile: UserProfile | null;
  bucket: BucketItem[];
  log: AnalyzeResponse[];
  last: LastAnalysis | null;
  week: number;
  onOpenItem: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("ki");

  // Sobald etwas auf der Bucket List landet, die Kontoansicht zeigen
  useEffect(() => {
    if (bucket.length === 1) setTab("konto");
  }, [bucket.length]);

  return (
    <section className="panel">
      <nav className="tabs">
        <button className={tab === "ki" ? "on" : ""} onClick={() => setTab("ki")}>
          Idee & KI
        </button>
        <button className={tab === "konto" ? "on" : ""} onClick={() => setTab("konto")}>
          CHECK24-Konto {bucket.length > 0 && <span className="count">{bucket.length}</span>}
        </button>
        <button className={tab === "log" ? "on" : ""} onClick={() => setTab("log")}>
          KI-Log {log.length > 0 && <span className="count">{log.length}</span>}
        </button>
      </nav>

      <div className="panel-body">
        {tab === "ki" && <IdeeKI last={last} />}
        {tab === "konto" && <Konto profile={profile} bucket={bucket} week={week} onOpenItem={onOpenItem} />}
        {tab === "log" && <Log log={log} />}
      </div>
    </section>
  );
}

// ---------- Idee & KI ----------

function IdeeKI({ last }: { last: LastAnalysis | null }) {
  const r = last?.resp.result;
  return (
    <div className="idea">
      <div className="idea-hero">
        <span className="idea-kicker">Reel-to-Trip von CHECK24</span>
        <h2>„Boah, da will ich auch mal hin!“</h2>
        <p>
          Genau in diesem Moment ist CHECK24 heute noch nicht dabei. Wer bei CHECK24 nach einer Reise sucht, hat sich innerlich längst entschieden.
          Reel-to-Trip holt Kund:innen <strong>schon bei der Inspiration</strong> ab und nimmt die Emotion aus dem Feed mit: Reel teilen, Preis checken,
          auf die Bucket List, bis es ins Budget passt.
        </p>
        <div className="funnel-compare">
          {[
            { label: "Heute", from: 4 },
            { label: "Mit Reel-to-Trip", from: 0 },
          ].map((row) => (
            <div key={row.label} className="fc-row">
              <span className="fc-label">{row.label}</span>
              <div className="fc-stages">
                {FUNNEL.map((st, i) => (
                  <span key={st} className={`fc-stage ${i >= row.from ? "c24" : ""} ${i === row.from ? "entry" : ""}`}>
                    {st}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <p className="fc-note">
            <i className="fc-dot" /> CHECK24 ist dabei. Früher Zugang = mehr Kontaktpunkte, Daten zu Wunschzielen und Buchungen, die sonst woanders landen.
          </p>
        </div>
      </div>

      <h3>Was die KI gerade gesehen hat</h3>
      {!last ? (
        <div className="empty small-empty">
          <p>
            Teile links ein Reel an <strong>check24</strong>. Hier siehst du dann live, welche Bilder die KI aus dem Video zieht und woran sie das Ziel erkennt.
          </p>
        </div>
      ) : (
        <div className="live">
          <div className="live-col">
            <span className="live-label">① Bilder aus dem Video</span>
            {last.frames.length ? (
              <div className="live-frames">
                {last.frames.map((f, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={f} alt={`Bild ${i + 1}`} />
                ))}
              </div>
            ) : (
              <p className="muted small">Keine Videobilder (Text/Screenshot-Eingabe)</p>
            )}
            <span className="live-caption">{last.resp.usedCaption ? `+ Bildunterschrift: „${last.visuals.caption.slice(0, 90)}“` : "ohne Bildunterschrift, nur Bilder"}</span>
          </div>
          <div className="live-arrow">→</div>
          <div className="live-col">
            <span className="live-label">② Woran Claude das Ziel erkennt</span>
            <ul className="live-signals">
              {r?.signals.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="live-arrow">→</div>
          <div className="live-col result-col">
            <span className="live-label">③ Ergebnis</span>
            {r?.status === "identified" ? (
              <>
                <strong className="live-place">📍 {r.place}</strong>
                <span className="muted small">
                  {r.region ? `${r.region}, ` : ""}
                  {r.country}
                </span>
                {r.nearestAirport && <span className="small">✈️ {r.nearestAirport.iata}</span>}
                <div className="meter">
                  <div style={{ width: `${Math.round(r.confidence * 100)}%` }} />
                </div>
                <span className="small muted">{Math.round(r.confidence * 100)} % sicher</span>
              </>
            ) : r?.status === "ambiguous" ? (
              <>
                <strong className="live-place">🤔 Rückfrage</strong>
                <span className="small">{r.candidates.map((c) => c.place).join(" · ") || "Ort unklar"}</span>
              </>
            ) : (
              <strong className="live-place">Kein Reiseziel</strong>
            )}
            <span className="tag" style={{ marginTop: 6 }}>
              {last.resp.source === "claude" ? `${(last.resp.latencyMs / 1000).toFixed(1)} s · live` : "Offline-Antwort"}
            </span>
          </div>
        </div>
      )}

      <h3>So funktioniert die KI</h3>
      <div className="ai-steps">
        <div>
          <span className="step-n">1</span>
          <strong>Video in Bilder zerlegen</strong>
          <p>8 Einzelbilder, gleichmäßig über das Video verteilt. Im Produkt per Worker mit Szenenwechsel-Erkennung plus Audio-Transkript.</p>
        </div>
        <div>
          <span className="step-n">2</span>
          <strong>Multimodal verstehen</strong>
          <p>Claude liest Texteinblendungen, erkennt Wahrzeichen und Landschaften und gleicht alles mit der Bildunterschrift ab, inklusive Widersprüchen.</p>
        </div>
        <div>
          <span className="step-n">3</span>
          <strong>Strukturiert ausgeben</strong>
          <p>Ein festes JSON-Schema macht aus der Antwort Daten: Ort, Region, Zielflughafen, Spots, Sicherheit. Oder eine Rückfrage, wenn’s unklar ist.</p>
        </div>
        <div>
          <span className="step-n">4</span>
          <strong>Auf CHECK24 abbilden</strong>
          <p>Flughafen + Region → passende Pauschalreisen. Bucket List und Preisalarm laufen im Kundenkonto, der Push führt direkt in die Suche.</p>
        </div>
      </div>
      <p className="muted small footnote">
        Im Prototyp echt: Bilder aus dem Video ziehen + Zielerkennung über die Claude API. Simuliert: Social-App, Login, Preise, Hotelliste.
      </p>
    </div>
  );
}

// ---------- Konto ----------

function Konto({ profile, bucket, week, onOpenItem }: { profile: UserProfile | null; bucket: BucketItem[]; week: number; onOpenItem: (id: string) => void }) {
  return (
    <div>
      <div className="acct-head">
        <div>
          <h2>Meine Bucket List</h2>
          <p className="muted">So sieht’s im CHECK24-Kundenkonto aus (App & Web)</p>
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
            "Noch nicht verbunden"
          )}
        </div>
      </div>

      {bucket.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">🧳</div>
          <p>
            Noch leer. Teile links ein Reel an <strong>check24</strong> und tippe auf <strong>Auf Bucket List</strong>.
          </p>
        </div>
      ) : (
        <div className="bucket">
          {bucket.map((b) => {
            const cur = b.priceHistory[b.priceHistory.length - 1];
            const diff = Math.round((cur / b.offer.pricePP - 1) * 100);
            return (
              <button key={b.id} className="bucket-item" onClick={() => onOpenItem(b.id)}>
                <div className="bucket-thumb" style={b.poster ? { backgroundImage: `url(${b.poster})` } : undefined}>
                  {!b.poster && b.emoji}
                </div>
                <div className="bucket-info">
                  <strong>{b.result.place}</strong>
                  <span className="muted">
                    {b.result.region ? `${b.result.region}, ` : ""}
                    {b.result.country}
                    {b.result.nearestAirport ? ` · ✈️ ${b.result.nearestAirport.iata}` : ""}
                  </span>
                  {profile && <BudgetBar price={cur} budget={profile.budget} />}
                  <span className="bucket-alert">
                    {b.alert ? (
                      b.alert.triggered ? (
                        <span className="tag hit">🔔 Alarm ausgelöst · Push gesendet</span>
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
            {week === 0 ? "Oben „1 Woche vorspulen“ simuliert die tägliche Preisbeobachtung." : `${week} Woche(n) Preisbeobachtung simuliert.`} Klick auf ein Ziel öffnet
            die vorausgefüllte Suche.
          </p>
        </div>
      )}
    </div>
  );
}

/** Zeigt, wie weit ein Traumziel noch vom eigenen Budget entfernt ist. */
function BudgetBar({ price, budget }: { price: number; budget: number }) {
  const fits = price <= budget;
  const pct = Math.min(100, Math.round((budget / price) * 100));
  return (
    <span className={`budget ${fits ? "fits" : ""}`}>
      <span className="budget-track">
        <span style={{ width: `${fits ? 100 : pct}%` }} />
      </span>
      <small>{fits ? "✅ passt in dein Budget" : `💰 noch ${formatEUR(price - budget)} über Budget`}</small>
    </span>
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

// ---------- Log ----------

function Log({ log }: { log: AnalyzeResponse[] }) {
  if (log.length === 0)
    return (
      <div className="empty">
        <div className="empty-emoji">🧠</div>
        <p>Hier erscheint jede Analyse: Input, erkannte Signale und das strukturierte JSON, das Claude zurückgibt.</p>
      </div>
    );
  return (
    <div className="log">
      {log.map((l, i) => (
        <div key={i} className="log-entry">
          <div className="log-head">
            <span className={`tag ${l.source === "claude" ? "hit" : "off"}`}>{l.source === "claude" ? `Claude · ${l.model}` : "Offline-Antwort"}</span>
            <span className="muted">{(l.latencyMs / 1000).toFixed(1)} s</span>
            <span className={`tag status-${l.result.status}`}>{l.result.status}</span>
          </div>
          {l.frames && l.frames.length > 0 && (
            <div className="log-frames">
              {l.frames.map((f, j) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={j} src={f} alt="" />
              ))}
            </div>
          )}
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
