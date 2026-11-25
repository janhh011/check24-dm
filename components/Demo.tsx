"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_REELS } from "@/lib/reels";
import { DEFAULT_PROFILE, destinationKey, formatEUR, quoteOffer, simulateWeeks } from "@/lib/pricing";
import type { AnalyzeRequest, AnalyzeResponse, BucketItem, DestinationResult, Offer, Reel, UserProfile } from "@/lib/types";
import AccountPanel from "./AccountPanel";
import LoginSheet from "./LoginSheet";
import DeepLinkScreen from "./DeepLinkScreen";

// ---------- Typen für den Chat ----------

interface Visuals {
  caption: string;
  emoji: string;
  gradient: string;
}

type Chip =
  | { label: string; kind: "candidate"; value: string }
  | { label: string; kind: "otherPlace" }
  | { label: string; kind: "threshold"; itemId: string; value: number }
  | { label: string; kind: "noAlert" };

type Msg =
  | { id: string; from: "user"; kind: "reel"; reel: Reel }
  | { id: string; from: "user"; kind: "text"; text: string }
  | { id: string; from: "user"; kind: "image"; src: string; text?: string }
  | { id: string; from: "bot"; kind: "text"; text: string }
  | { id: string; from: "bot"; kind: "typing" }
  | { id: string; from: "bot"; kind: "result"; result: DestinationResult; offer: Offer; visuals: Visuals; used?: boolean }
  | { id: string; from: "bot"; kind: "chips"; chips: Chip[]; used?: boolean }
  | { id: string; from: "bot"; kind: "connect" }
  | { id: string; from: "system"; kind: "note"; text: string };

interface Banner {
  id: string;
  itemId: string;
  title: string;
  body: string;
}

const DAY = 86_400_000;
let idCounter = 0;
const uid = (p = "m") => `${p}${Date.now().toString(36)}${(idCounter++).toString(36)}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const round10 = (n: number) => Math.round(n / 10) * 10 - 1;

const WELCOME: Msg[] = [
  { id: "w1", from: "system", kind: "note", text: "Demo: Du bist Nutzer:in einer Social-Media-App und schreibst dem CHECK24-Account." },
  {
    id: "w2",
    from: "bot",
    kind: "text",
    text: "Hey 👋 Schick mir einfach ein Reel von einem Ort, an den du willst – ich finde raus, wo das ist, was es kostet, und sag dir Bescheid, wenn’s günstiger wird.",
  },
];

export default function Demo() {
  const [msgs, setMsgs] = useState<Msg[]>(WELCOME);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [log, setLog] = useState<AnalyzeResponse[]>([]);
  const [mode, setMode] = useState<{ mode: string; model: string } | null>(null);
  const [screen, setScreen] = useState<"chat" | "feed" | "login" | "deeplink">("chat");
  const [deepLinkItem, setDeepLinkItem] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [simOffset, setSimOffset] = useState(0);
  const [week, setWeek] = useState(0);
  const [dmUntil, setDmUntil] = useState(0);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [awaitingHint, setAwaitingHint] = useState(false);

  const lastReq = useRef<{ req: AnalyzeRequest; visuals: Visuals } | null>(null);
  const pending = useRef<{ resultMsgId: string; withAlert: boolean } | null>(null);
  const results = useRef<Record<string, { result: DestinationResult; visuals: Visuals }>>({});
  const chatEnd = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const simNow = useCallback(() => Date.now() + simOffset, [simOffset]);

  useEffect(() => {
    fetch("/api/analyze")
      .then((r) => r.json())
      .then(setMode)
      .catch(() => setMode({ mode: "fallback", model: "-" }));
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const push = (...m: Msg[]) => setMsgs((prev) => [...prev, ...m]);
  const markUsed = (id: string) =>
    setMsgs((prev) => prev.map((m) => (m.id === id && (m.kind === "chips" || m.kind === "result") ? { ...m, used: true } : m)));
  const openDmWindow = () => setDmUntil(Date.now() + simOffset + DAY);

  // ---------- Analyse ----------

  async function analyze(req: AnalyzeRequest, visuals: Visuals) {
    lastReq.current = { req, visuals };
    setBusy(true);
    const typingId = uid("t");
    push({ id: typingId, from: "bot", kind: "typing" });
    const t0 = Date.now();
    let resp: AnalyzeResponse | null = null;
    let error: string | null = null;
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const j = await r.json();
      if (!r.ok) error = j.error ?? "Unbekannter Fehler";
      else resp = j as AnalyzeResponse;
    } catch {
      error = "Server nicht erreichbar";
    }
    const elapsed = Date.now() - t0;
    if (elapsed < 1100) await sleep(1100 - elapsed); // Tipp-Indikator sichtbar lassen
    setMsgs((prev) => prev.filter((m) => m.id !== typingId));
    setBusy(false);

    if (error || !resp) {
      push({ id: uid(), from: "bot", kind: "text", text: `Hoppla, da ist was schiefgelaufen (${error}). Versuch’s gleich nochmal 🙏` });
      return;
    }
    setLog((prev) => [resp!, ...prev]);
    handleResult(resp.result, visuals);
  }

  function handleResult(r: DestinationResult, visuals: Visuals) {
    if (r.status === "identified") {
      setAwaitingHint(false);
      const id = uid("r");
      results.current[id] = { result: r, visuals };
      const offer = quoteOffer(r, profile ?? DEFAULT_PROFILE);
      // Liegt das Ziel schon auf der Bucket List, den aktuell beobachteten Preis zeigen
      const known = bucket.find((b) => destinationKey(b.result) === destinationKey(r));
      if (known) offer.pricePP = known.priceHistory[known.priceHistory.length - 1];
      push({ id, from: "bot", kind: "result", result: r, offer, visuals });
    } else if (r.status === "ambiguous") {
      setAwaitingHint(true);
      push(
        { id: uid(), from: "bot", kind: "text", text: r.clarifyingQuestion || "Hmm, da bin ich mir nicht sicher 🤔 Welcher Ort ist es?" },
        {
          id: uid("c"),
          from: "bot",
          kind: "chips",
          chips: [
            ...r.candidates.slice(0, 3).map((c) => ({ label: `${c.place}, ${c.country}`, kind: "candidate" as const, value: `${c.place}` })),
            { label: "✏️ Anderer Ort …", kind: "otherPlace" as const },
          ],
        },
      );
    } else {
      setAwaitingHint(false);
      push({
        id: uid(),
        from: "bot",
        kind: "text",
        text: "Sieht eher nach ’nem Tipp für zu Hause aus als nach Urlaub 😄 Schick mir gern ein Reel von einem Ort, an den du reisen willst!",
      });
    }
  }

  // ---------- Nutzeraktionen ----------

  function shareReel(reel: Reel) {
    if (busy) return;
    setScreen("chat");
    openDmWindow();
    push({ id: uid(), from: "user", kind: "reel", reel });
    analyze({ reelId: reel.id }, { caption: reel.caption, emoji: reel.emoji, gradient: reel.gradient });
  }

  function sendInput() {
    const text = input.trim();
    if (busy || (!text && !attachment)) return;
    openDmWindow();
    if (attachment) push({ id: uid(), from: "user", kind: "image", src: attachment, text: text || undefined });
    else push({ id: uid(), from: "user", kind: "text", text });

    const visuals: Visuals = { caption: text || "Screenshot", emoji: "📍", gradient: "linear-gradient(160deg,#8ec5fc,#3d7bd9)" };
    if (awaitingHint && lastReq.current && !attachment) {
      analyze({ ...lastReq.current.req, userHint: text }, lastReq.current.visuals);
    } else if (/^https?:\/\//i.test(text)) {
      analyze({ url: text }, visuals);
    } else {
      analyze({ caption: text || undefined, imageBase64: attachment ?? undefined }, visuals);
    }
    setInput("");
    setAttachment(null);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4_500_000) {
      setToast("Bild ist zu groß (max. 4,5 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachment(String(reader.result));
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  function onChip(msgId: string, chip: Chip) {
    if (busy) return;
    markUsed(msgId);
    openDmWindow();
    if (chip.kind === "candidate") {
      push({ id: uid(), from: "user", kind: "text", text: chip.label });
      if (lastReq.current) analyze({ ...lastReq.current.req, userHint: chip.value }, lastReq.current.visuals);
    } else if (chip.kind === "otherPlace") {
      setAwaitingHint(true);
      push({ id: uid(), from: "bot", kind: "text", text: "Klar! Schreib mir einfach, wo das ist – oder schick einen Screenshot mit mehr Infos." });
    } else if (chip.kind === "threshold") {
      push({ id: uid(), from: "user", kind: "text", text: chip.label });
      setAlert(chip.itemId, chip.value);
    } else if (chip.kind === "noAlert") {
      push(
        { id: uid(), from: "user", kind: "text", text: chip.label },
        { id: uid(), from: "bot", kind: "text", text: "Alles klar 👍 Deine Bucket List findest du jederzeit in der CHECK24-App." },
      );
    }
  }

  function onResultAction(msgId: string, action: "save" | "alert" | "wrong") {
    if (busy) return;
    const entry = results.current[msgId];
    if (!entry) return;
    openDmWindow();
    if (action === "wrong") {
      markUsed(msgId);
      setAwaitingHint(true);
      push(
        { id: uid(), from: "user", kind: "text", text: "Falscher Ort" },
        { id: uid(), from: "bot", kind: "text", text: "Ups, sorry! 🙈 Wo ist das denn? Schreib mir den Ort, dann korrigiere ich’s." },
      );
      return;
    }
    markUsed(msgId);
    push({ id: uid(), from: "user", kind: "text", text: action === "save" ? "Auf Bucket List ⭐" : "Preisalarm setzen 🔔" });
    if (!profile) {
      pending.current = { resultMsgId: msgId, withAlert: action === "alert" };
      push(
        {
          id: uid(),
          from: "bot",
          kind: "text",
          text: "Damit ich deine Bucket List speichern und dich bei Preisänderungen erreichen kann, verbinde kurz dein CHECK24-Konto 👇",
        },
        { id: uid(), from: "bot", kind: "connect" },
      );
      return;
    }
    addToBucket(msgId, profile, action === "alert");
  }

  function addToBucket(resultMsgId: string, p: UserProfile, withAlert: boolean) {
    const entry = results.current[resultMsgId];
    if (!entry) return;
    const offer = quoteOffer(entry.result, p);
    const key = destinationKey(entry.result);
    const existing = bucket.find((b) => destinationKey(b.result) === key);
    const itemId = existing?.id ?? uid("b");
    if (!existing) {
      const item: BucketItem = {
        id: itemId,
        result: entry.result,
        offer,
        addedAt: Date.now() + simOffset,
        reelCaption: entry.visuals.caption,
        emoji: entry.visuals.emoji,
        gradient: entry.visuals.gradient,
        priceHistory: [offer.pricePP],
      };
      setBucket((prev) => [item, ...prev]);
    }
    const price = existing ? existing.priceHistory[existing.priceHistory.length - 1] : offer.pricePP;
    const chips: Chip[] = [
      { label: `Unter ${formatEUR(round10(price * 0.9))}`, kind: "threshold", itemId, value: round10(price * 0.9) },
      { label: `Unter ${formatEUR(round10(price * 0.8))}`, kind: "threshold", itemId, value: round10(price * 0.8) },
    ];
    if (p.budget < price * 0.8) chips.push({ label: `Unter meinem Budget (${formatEUR(p.budget)})`, kind: "threshold", itemId, value: p.budget });
    if (!withAlert) chips.push({ label: "Nein, danke", kind: "noAlert" });

    push(
      {
        id: uid(),
        from: "bot",
        kind: "text",
        text: `${existing ? "☝️ Ist schon auf deiner Bucket List" : `✅ ${entry.result.place} ist auf deiner Bucket List`} – aktuell ab ${formatEUR(price)} p. P. (${offer.nights} Nächte, ab ${p.origin}, ${p.month}, ${p.travellers} Pers.). ${withAlert ? "Ab welchem Preis soll ich mich melden?" : "Soll ich dir Bescheid geben, wenn’s günstiger wird?"}`,
      },
      { id: uid("c"), from: "bot", kind: "chips", chips },
    );
  }

  function setAlert(itemId: string, threshold: number) {
    setBucket((prev) => prev.map((b) => (b.id === itemId ? { ...b, alert: { threshold, createdAt: Date.now() + simOffset } } : b)));
    const item = bucket.find((b) => b.id === itemId);
    push({
      id: uid(),
      from: "bot",
      kind: "text",
      text: `🔔 Preisalarm aktiv: Ich melde mich, sobald ${item?.result.place ?? "das Ziel"} unter ${formatEUR(threshold)} fällt – per Push in der CHECK24-App und per E-Mail. (Hier im Chat darf ich dir nach 24 Stunden nicht mehr automatisch schreiben.)`,
    });
  }

  function onLoginDone(p: UserProfile) {
    setProfile(p);
    setScreen("chat");
    push({ id: uid(), from: "system", kind: "note", text: `Konto verbunden: ${p.email} · Social-ID ↔ CHECK24-Kundenkonto verknüpft` });
    const pend = pending.current;
    pending.current = null;
    if (pend) setTimeout(() => addToBucket(pend.resultMsgId, p, pend.withAlert), 350);
  }

  // ---------- Simulation ----------

  function fastForward() {
    const newWeek = week + 1;
    const newOffset = simOffset + 7 * DAY;
    const nowSim = Date.now() + newOffset;
    const dmOpen = nowSim < dmUntil;
    const newBanners: Banner[] = [];
    const next = bucket.map((b) => {
      const last = b.priceHistory[b.priceHistory.length - 1];
      const [p] = simulateWeeks(last, b.offer.basePrice, 1, `${b.id}-${newWeek}`, !!b.alert && !b.alert.triggered);
      const updated: BucketItem = { ...b, priceHistory: [...b.priceHistory, p] };
      if (b.alert && !b.alert.triggered && p <= b.alert.threshold) {
        const channel = dmOpen ? "Direktnachricht (24-h-Fenster offen)" : "App-Push + E-Mail";
        updated.alert = { ...b.alert, triggered: { price: p, at: nowSim, channel } };
        const pct = Math.round((1 - p / b.offer.pricePP) * 100);
        newBanners.push({
          id: uid("n"),
          itemId: b.id,
          title: "CHECK24 Urlaub",
          body: `🔔 ${b.result.place} jetzt ab ${formatEUR(p)} p. P. (−${pct} %). Dein Preisalarm hat ausgelöst – jetzt ansehen!`,
        });
      }
      return updated;
    });
    setBucket(next);
    setWeek(newWeek);
    setSimOffset(newOffset);
    if (newBanners.length) {
      setToast(null);
      setBanners((prev) => [...newBanners, ...prev]);
    }
    else if (bucket.length) setToast(`Woche ${newWeek}: Preise aktualisiert – noch kein Alarm ausgelöst`);
    else setToast("Noch nichts auf der Bucket List – erst ein Reel teilen und speichern");
  }

  function reset() {
    setMsgs(WELCOME);
    setProfile(null);
    setBucket([]);
    setLog([]);
    setBanners([]);
    setScreen("chat");
    setSimOffset(0);
    setWeek(0);
    setDmUntil(0);
    setAwaitingHint(false);
    setInput("");
    setAttachment(null);
    pending.current = null;
    lastReq.current = null;
    results.current = {};
  }

  function openDeepLink(itemId: string) {
    setDeepLinkItem(itemId);
    setScreen("deeplink");
    setBanners((prev) => prev.filter((b) => b.itemId !== itemId));
  }

  const now = Date.now() + simOffset;
  const dmOpen = now < dmUntil;
  const dmHoursLeft = Math.max(0, Math.ceil((dmUntil - now) / 3_600_000));
  const deepItem = bucket.find((b) => b.id === deepLinkItem) ?? null;

  // ---------- Render ----------

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="wordmark">CHECK24</span>
          <span className="divider" />
          <span className="product">Reel-to-Trip</span>
          <span className="badge-concept">Konzept-Prototyp</span>
        </div>
        <div className="controls">
          <span className={`mode ${mode?.mode === "claude" ? "live" : "offline"}`}>
            {mode ? (mode.mode === "claude" ? `● Claude live · ${mode.model}` : "● Offline-Modus (vorbereitete Antworten)") : "…"}
          </span>
          <span className="simclock">📅 {week === 0 ? "Heute" : `+${week} Woche${week > 1 ? "n" : ""}`}</span>
          <button className="btn btn-yellow" onClick={fastForward} title="Simuliert eine Woche Preisbeobachtung">
            ⏩ 1 Woche vorspulen
          </button>
          <button className="btn btn-ghost" onClick={reset}>
            ↺ Zurücksetzen
          </button>
        </div>
      </header>

      <main className="stage">
        {/* ---------- Handy ---------- */}
        <section className="phone-wrap">
          <div className="phone">
            <div className="statusbar">
              <span>9:41</span>
              <span>●●● 5G 🔋</span>
            </div>

            {banners.length > 0 && (
              <div className="banners">
                {banners.slice(0, 2).map((b) => (
                  <button key={b.id} className="push" onClick={() => openDeepLink(b.itemId)}>
                    <span className="push-icon">C24</span>
                    <span className="push-text">
                      <strong>{b.title}</strong>
                      <span className="push-time">jetzt</span>
                      <span className="push-body">{b.body}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {screen === "deeplink" && deepItem ? (
              <DeepLinkScreen item={deepItem} profile={profile ?? DEFAULT_PROFILE} onBack={() => setScreen("chat")} onBook={() => setToast("Demo-Ende: Hier ginge es in die normale CHECK24-Buchungsstrecke ✈️")} />
            ) : (
              <>
                <div className="chat-header">
                  <div className="avatar">C24</div>
                  <div className="chat-title">
                    <strong>
                      check24 <span className="verified">✔</span>
                    </strong>
                    <span className={`dm-window ${dmOpen ? "open" : "closed"}`}>
                      {dmOpen ? `Antwortfenster offen · noch ${dmHoursLeft} h` : dmUntil ? "Antwortfenster geschlossen (24 h vorbei)" : "Business-Account"}
                    </span>
                  </div>
                </div>

                <div className="chat">
                  {msgs.map((m) => (
                    <MessageView key={m.id} m={m} onChip={onChip} onResultAction={onResultAction} onConnect={() => setScreen("login")} busy={busy} profile={profile} />
                  ))}
                  <div ref={chatEnd} />
                </div>

                <div className="composer">
                  {attachment && (
                    <div className="attach-preview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={attachment} alt="Anhang" />
                      <button onClick={() => setAttachment(null)}>✕</button>
                    </div>
                  )}
                  <div className="composer-row">
                    <button className="icon-btn share" onClick={() => setScreen("feed")} title="Reel aus dem Feed teilen" disabled={busy}>
                      🎬
                    </button>
                    <button className="icon-btn" onClick={() => fileRef.current?.click()} title="Screenshot anhängen" disabled={busy}>
                      📎
                    </button>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFile} />
                    <input
                      className="text-in"
                      value={input}
                      placeholder={awaitingHint ? "Wo ist das? z. B. „Kotor“" : "Nachricht, Link oder Bildunterschrift …"}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendInput()}
                      disabled={busy}
                    />
                    <button className="send" onClick={sendInput} disabled={busy || (!input.trim() && !attachment)}>
                      ➤
                    </button>
                  </div>
                </div>
              </>
            )}

            {screen === "feed" && (
              <div className="sheet">
                <div className="sheet-head">
                  <strong>Gespeicherte Reels</strong>
                  <button onClick={() => setScreen("chat")}>✕</button>
                </div>
                <p className="sheet-sub">Tippe auf „Senden“, um ein Reel an @check24 zu schicken.</p>
                <div className="reel-list">
                  {DEMO_REELS.map((r) => (
                    <div key={r.id} className="reel-row">
                      <div className="reel-thumb" style={{ background: r.gradient }}>
                        <span>{r.emoji}</span>
                        <span className="play">▶</span>
                      </div>
                      <div className="reel-info">
                        <span className="reel-creator">{r.creator}</span>
                        <span className="reel-caption">{r.caption}</span>
                        <span className="reel-hint">{r.hint}</span>
                      </div>
                      <button className="btn btn-blue small" onClick={() => shareReel(r)}>
                        Senden
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {screen === "login" && <LoginSheet onCancel={() => setScreen("chat")} onDone={onLoginDone} />}

            {toast && <div className="toast">{toast}</div>}
          </div>
          <p className="phone-caption">Kundensicht: Social-App-DM mit dem CHECK24-Account</p>
        </section>

        {/* ---------- Konto & Erklärung ---------- */}
        <AccountPanel profile={profile} bucket={bucket} log={log} week={week} onOpenItem={openDeepLink} />
      </main>
    </div>
  );
}

// ---------- Einzelne Nachricht ----------

function MessageView({
  m,
  onChip,
  onResultAction,
  onConnect,
  busy,
  profile,
}: {
  m: Msg;
  onChip: (id: string, c: Chip) => void;
  onResultAction: (id: string, a: "save" | "alert" | "wrong") => void;
  onConnect: () => void;
  busy: boolean;
  profile: UserProfile | null;
}) {
  if (m.kind === "note") return <div className="note">{m.text}</div>;

  if (m.kind === "typing")
    return (
      <div className="row bot">
        <div className="bubble bot typing">
          <span />
          <span />
          <span />
        </div>
      </div>
    );

  if (m.kind === "reel")
    return (
      <div className="row user">
        <div className="shared-reel">
          <div className="shared-thumb" style={{ background: m.reel.gradient }}>
            <span className="emoji">{m.reel.emoji}</span>
            <span className="play">▶</span>
            {m.reel.locationTag && <span className="loc">📍 {m.reel.locationTag}</span>}
          </div>
          <div className="shared-meta">
            <strong>{m.reel.creator}</strong>
            <span>{m.reel.caption}</span>
          </div>
        </div>
      </div>
    );

  if (m.kind === "image")
    return (
      <div className="row user">
        <div className="bubble user img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.src} alt="Screenshot" />
          {m.text && <span>{m.text}</span>}
        </div>
      </div>
    );

  if (m.kind === "text")
    return (
      <div className={`row ${m.from}`}>
        <div className={`bubble ${m.from}`}>{m.text}</div>
      </div>
    );

  if (m.kind === "chips")
    return (
      <div className="chips">
        {m.chips.map((c, i) => (
          <button key={i} className="chip" disabled={m.used || busy} onClick={() => onChip(m.id, c)}>
            {c.label}
          </button>
        ))}
      </div>
    );

  if (m.kind === "connect")
    return (
      <div className="row bot">
        <div className="connect-card">
          <div className="connect-logo">CHECK24</div>
          <p>Bucket List & Preisalarme im CHECK24-Konto speichern</p>
          <button className="btn btn-blue" onClick={onConnect} disabled={!!profile}>
            {profile ? "✔ Verbunden" : "Mit CHECK24 verbinden"}
          </button>
        </div>
      </div>
    );

  // Ergebnis-Karte
  const r = m.result;
  return (
    <div className="row bot">
      <div className="result-card">
        <div className="result-hero" style={{ background: m.visuals.gradient }}>
          <span className="emoji">{m.visuals.emoji}</span>
          <span className="conf">{Math.round(r.confidence * 100)} % sicher</span>
        </div>
        <div className="result-body">
          <div className="result-place">📍 {r.place}</div>
          <div className="result-region">
            {r.region ? `${r.region}, ` : ""}
            {r.country}
          </div>
          {r.teaser && <p className="result-teaser">{r.teaser}</p>}
          <div className="offer">
            <div>
              <span className="offer-from">Pauschalreise ab</span>
              <span className="offer-price">{formatEUR(m.offer.pricePP)}</span>
              <span className="offer-pp">p. P.</span>
            </div>
            <span className="offer-meta">
              {m.offer.nights} Nächte · ab {m.offer.origin} · {m.offer.month} · {"★".repeat(m.offer.hotelStars)} · {m.offer.board}
            </span>
            {r.nearestAirport && (
              <span className="offer-meta">
                ✈️ {r.nearestAirport.iata} – {r.nearestAirport.name}
              </span>
            )}
            <span className="demo-flag">Demo-Preis</span>
          </div>
          <div className="result-actions">
            <button className="btn btn-blue small" disabled={m.used || busy} onClick={() => onResultAction(m.id, "save")}>
              ⭐ Auf Bucket List
            </button>
            <button className="btn btn-yellow small" disabled={m.used || busy} onClick={() => onResultAction(m.id, "alert")}>
              🔔 Preisalarm
            </button>
            <button className="btn btn-ghost small" disabled={m.used || busy} onClick={() => onResultAction(m.id, "wrong")}>
              Falscher Ort
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
