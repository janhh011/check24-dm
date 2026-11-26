"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_REELS } from "@/lib/reels";
import type { Reel } from "@/lib/types";

export type CoachStep = "intro" | "swipe" | "share" | "pickContact" | "done";

const CONTACTS = [
  { id: "check24", name: "check24", avatar: "C24", active: true },
  { id: "lisa", name: "lisa.m", avatar: "L", active: false },
  { id: "max", name: "max_r", avatar: "M", active: false },
  { id: "jule", name: "jule.reist", avatar: "J", active: false },
  { id: "tom", name: "tom.b", avatar: "T", active: false },
  { id: "sara", name: "sara_k", avatar: "S", active: false },
];

/**
 * Vertikaler Reels-Feed im gewohnten Scroll-Format, endlos (nach dem letzten Reel kommt wieder das erste),
 * mit Ton, Teilen-Funktion und einer kurzen Einführung für die Bedienung des Prototyps.
 */
export default function ReelsFeed({
  onShare,
  onToast,
  disabled,
  step,
  onStep,
}: {
  onShare: (r: Reel) => void;
  onToast: (t: string) => void;
  disabled: boolean;
  step: CoachStep;
  onStep: (s: CoachStep) => void;
}) {
  const [muted, setMuted] = useState(true); // bis zum Klick auf „Los geht’s“ (Browser erlauben Ton erst nach einer Interaktion)
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [shareFor, setShareFor] = useState<Reel | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [cycles, setCycles] = useState(2);
  const feedRef = useRef<HTMLDivElement>(null);
  const lastIndex = useRef(0);
  const drag = useRef<{ startY: number; startTop: number; startIdx: number; moved: boolean; t0: number } | null>(null);
  const suppressClick = useRef(false);

  // Mit gedrückter linker Maustaste ziehen, wie Wischen auf dem Handy.
  // Zwei-Finger-Scrollen auf dem Trackpad bleibt unverändert (natives Scrollen).
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = feedRef.current;
    if (!el) return;
    drag.current = { startY: e.clientY, startTop: el.scrollTop, startIdx: Math.round(el.scrollTop / el.clientHeight), moved: false, t0: Date.now() };

    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dy = ev.clientY - d.startY;
      if (!d.moved && Math.abs(dy) > 6) {
        d.moved = true;
        el.style.scrollSnapType = "none";
        el.style.cursor = "grabbing";
      }
      if (d.moved) {
        ev.preventDefault();
        el.scrollTop = d.startTop - dy;
      }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const d = drag.current;
      drag.current = null;
      if (!d || !d.moved) return;
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 50);
      const dy = ev.clientY - d.startY;
      const fast = Math.abs(dy) / Math.max(1, Date.now() - d.t0) > 0.4; // schneller Wisch
      let target = d.startIdx;
      if (dy < -el.clientHeight * 0.15 || (fast && dy < -20)) target = d.startIdx + 1;
      else if (dy > el.clientHeight * 0.15 || (fast && dy > 20)) target = Math.max(0, d.startIdx - 1);
      el.style.cursor = "";
      el.scrollTo({ top: target * el.clientHeight, behavior: "smooth" });
      setTimeout(() => (el.style.scrollSnapType = ""), 450);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // Klick nach einem Zieh-Vorgang nicht als Klick werten (z. B. Ton umschalten, Teilen)
  function onClickCapture(e: React.MouseEvent) {
    if (suppressClick.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  // Wurde die Einführung schon durchlaufen (z. B. beim Zurückkehren in den Feed), direkt mit Ton starten
  useEffect(() => {
    if (step !== "intro") setMuted(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Endlos-Feed: Kommt man ans Ende, wird die Liste noch einmal angehängt
  function onScroll() {
    const el = feedRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight * 3 > el.scrollHeight) setCycles((c) => c + 1);
    const idx = Math.round(el.scrollTop / el.clientHeight);
    if (idx !== lastIndex.current) {
      lastIndex.current = idx;
      if (step === "swipe") onStep("share");
    }
  }

  function start() {
    setMuted(false);
    onStep("swipe");
    // Im Klick-Handler starten, damit der Browser den Ton erlaubt
    const el = feedRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    const v = el.querySelectorAll("video")[idx] as HTMLVideoElement | undefined;
    if (v) {
      v.currentTime = 0;
      v.muted = false;
      v.play().catch(() => undefined);
    }
  }

  function openShare(r: Reel) {
    if (disabled) return;
    setShareFor(r);
    if (step === "share" || step === "swipe") onStep("pickContact");
  }

  function send() {
    if (!shareFor || picked !== "check24") return;
    const r = shareFor;
    setShareFor(null);
    setPicked(null);
    if (step !== "done") onStep("done");
    onShare(r);
  }

  const items = Array.from({ length: cycles * DEMO_REELS.length }, (_, i) => ({
    reel: DEMO_REELS[i % DEMO_REELS.length],
    key: `${Math.floor(i / DEMO_REELS.length)}-${i}`,
  }));

  return (
    <div className="feed-wrap">
      <div className="feed-top">
        <strong>Reels</strong>
        <button className="mute" onClick={() => setMuted((m) => !m)} title={muted ? "Ton an" : "Ton aus"}>
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="feed" ref={feedRef} onScroll={onScroll} onPointerDown={onPointerDown} onClickCapture={onClickCapture} onDragStart={(e) => e.preventDefault()}>
        {items.map(({ reel, key }) => (
          <ReelItem
            key={key}
            reel={reel}
            muted={muted}
            liked={!!liked[reel.id]}
            onLike={() => setLiked((l) => ({ ...l, [reel.id]: !l[reel.id] }))}
            onToggleMute={() => setMuted((m) => !m)}
            onShare={() => openShare(reel)}
            onToast={onToast}
            disabled={disabled}
            coachShare={step === "share"}
            hold={step === "intro"}
          />
        ))}
      </div>

      {step === "intro" && (
        <div className="coach-intro">
          <div className="coach-card">
            <span className="coach-kicker">Prototyp · so geht’s</span>
            <h3>Vom Reel zur Reise</h3>
            <ol>
              <li>
                <b>👆</b>
                <span>Wische durch die Reels, wie du es gewohnt bist.</span>
              </li>
              <li>
                <b>➤</b>
                <span>
                  Traumziel entdeckt? Tippe auf <strong>Teilen</strong>.
                </span>
              </li>
              <li>
                <b>💬</b>
                <span>
                  Schick das Reel an <strong>check24</strong>. Den Rest macht die KI.
                </span>
              </li>
            </ol>
            <button className="btn btn-yellow wide" onClick={start}>
              Los geht’s 🔊
            </button>
          </div>
        </div>
      )}

      {step === "swipe" && (
        <div className="coach-swipe" aria-hidden>
          <span className="swipe-hand">👆</span>
          <span className="swipe-text">Nach oben wischen</span>
        </div>
      )}

      {shareFor && (
        <div className="share-sheet-bg" onClick={() => setShareFor(null)}>
          <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <div className="share-search">🔍 Suchen</div>
            <div className="contacts">
              {CONTACTS.map((c) => {
                const coach = step === "pickContact" && c.id === "check24" && !picked;
                return (
                  <button
                    key={c.id}
                    className={`contact ${picked === c.id ? "picked" : ""} ${c.active ? "" : "inactive"} ${coach ? "coach-target" : ""}`}
                    onClick={() => (c.active ? setPicked(picked === c.id ? null : c.id) : onToast("In der Demo ist nur check24 aktiv"))}
                  >
                    {coach && <span className="coach-bubble up">check24 auswählen</span>}
                    <span className={`contact-avatar ${c.id === "check24" ? "brand" : ""}`}>
                      {c.avatar}
                      {picked === c.id && <i>✓</i>}
                    </span>
                    <small>
                      {c.name}
                      {c.id === "check24" && <b className="verified"> ✔</b>}
                    </small>
                  </button>
                );
              })}
            </div>
            <button
              className={`btn btn-blue wide ${step === "pickContact" && picked === "check24" ? "coach-pulse" : ""}`}
              disabled={picked !== "check24"}
              onClick={send}
            >
              Senden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReelItem({
  reel,
  muted,
  liked,
  onLike,
  onToggleMute,
  onShare,
  onToast,
  disabled,
  coachShare,
  hold,
}: {
  reel: Reel;
  muted: boolean;
  liked: boolean;
  onLike: () => void;
  onToggleMute: () => void;
  onShare: () => void;
  onToast: (t: string) => void;
  disabled: boolean;
  coachShare: boolean;
  hold: boolean; // während der Einführung nicht abspielen
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const visible = useRef(false);
  const holdRef = useRef(hold);
  holdRef.current = hold;

  function playFromStart(v: HTMLVideoElement) {
    if (v.currentTime > 0.05) v.currentTime = 0;
    v.play().catch(() => {
      // Browser blockiert Ton ohne Interaktion: stumm weiterspielen
      v.muted = true;
      v.play().catch(() => undefined);
    });
  }

  // Abspielen, sobald das Reel überwiegend sichtbar wird, wie im echten Feed.
  // Nur beim Übergang unsichtbar → sichtbar reagieren, sonst springt das Video kurz zurück.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        const nowVisible = e.intersectionRatio > 0.6;
        if (nowVisible === visible.current) return;
        visible.current = nowVisible;
        if (nowVisible) {
          if (!holdRef.current) playFromStart(v);
        } else v.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  // Nach der Einführung: sichtbares Reel von Anfang an starten (falls start() es nicht schon getan hat)
  useEffect(() => {
    const v = ref.current;
    if (v && !hold && visible.current && v.paused) playFromStart(v);
  }, [hold]);

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  return (
    <div className="reel">
      <video ref={ref} src={reel.video} poster={reel.poster} muted={muted} loop playsInline preload="auto" onClick={onToggleMute} />
      <div className="reel-actions">
        <button onClick={onLike} className={liked ? "liked" : ""}>
          <span>{liked ? "❤️" : "🤍"}</span>
          <small>{reel.likes}</small>
        </button>
        <button onClick={() => onToast("Kommentare sind in der Demo deaktiviert")}>
          <span>💬</span>
          <small>{reel.comments}</small>
        </button>
        <button className={`share-btn ${coachShare ? "coach-target" : ""}`} onClick={onShare} disabled={disabled}>
          {coachShare && <span className="coach-bubble left">Da will ich hin? Hier teilen!</span>}
          <span className="share-icon">➤</span>
          <small>Teilen</small>
        </button>
      </div>
      <div className="reel-meta">
        <div className="reel-creator-row">
          <span className="mini-avatar">{reel.creator.slice(1, 2).toUpperCase()}</span>
          <strong>{reel.creator}</strong>
          <span className="follow">Folgen</span>
        </div>
        <p>{reel.caption}</p>
        <span className="audio">♫ Originalton · {reel.creator}</span>
      </div>
    </div>
  );
}
