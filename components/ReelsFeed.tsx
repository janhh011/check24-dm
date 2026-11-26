"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_REELS } from "@/lib/reels";
import type { Reel } from "@/lib/types";

const CONTACTS = [
  { id: "check24", name: "check24", avatar: "C24", active: true },
  { id: "lisa", name: "lisa.m", avatar: "L", active: false },
  { id: "max", name: "max_r", avatar: "M", active: false },
  { id: "jule", name: "jule.reist", avatar: "J", active: false },
  { id: "tom", name: "tom.b", avatar: "T", active: false },
  { id: "sara", name: "sara_k", avatar: "S", active: false },
];

/** Vertikaler Reels-Feed im gewohnten Scroll-Format mit Teilen-Funktion. */
export default function ReelsFeed({ onShare, onToast, disabled }: { onShare: (r: Reel) => void; onToast: (t: string) => void; disabled: boolean }) {
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [shareFor, setShareFor] = useState<Reel | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Video abspielen, sobald es überwiegend sichtbar ist – wie im echten Feed
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.intersectionRatio > 0.6) v.play().catch(() => undefined);
          else v.pause();
        });
      },
      { threshold: [0, 0.6, 1] },
    );
    Object.values(videoRefs.current).forEach((v) => v && obs.observe(v));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    Object.values(videoRefs.current).forEach((v) => v && (v.muted = muted));
  }, [muted]);

  function send() {
    if (!shareFor || picked !== "check24") return;
    const r = shareFor;
    setShareFor(null);
    setPicked(null);
    onShare(r);
  }

  return (
    <div className="feed-wrap">
      <div className="feed-top">
        <strong>Reels</strong>
        <button className="mute" onClick={() => setMuted((m) => !m)} title={muted ? "Ton an" : "Ton aus"}>
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
      <div className="feed">
        {DEMO_REELS.map((r) => (
          <div key={r.id} className="reel">
            <video
              ref={(el) => {
                videoRefs.current[r.id] = el;
              }}
              src={r.video}
              poster={r.poster}
              muted
              loop
              playsInline
              preload="metadata"
              onClick={() => setMuted((m) => !m)}
            />
            <div className="reel-actions">
              <button onClick={() => setLiked((l) => ({ ...l, [r.id]: !l[r.id] }))} className={liked[r.id] ? "liked" : ""}>
                <span>{liked[r.id] ? "❤️" : "🤍"}</span>
                <small>{r.likes}</small>
              </button>
              <button onClick={() => onToast("Kommentare sind in der Demo deaktiviert")}>
                <span>💬</span>
                <small>{r.comments}</small>
              </button>
              <button className="share-btn" onClick={() => !disabled && setShareFor(r)} disabled={disabled}>
                <span>➤</span>
                <small>Teilen</small>
              </button>
              <button onClick={() => onToast("Gespeichert – aber gebucht wird so nie 😉")}>
                <span>🔖</span>
              </button>
            </div>
            <div className="reel-meta">
              <div className="reel-creator-row">
                <span className="mini-avatar">{r.creator.slice(1, 2).toUpperCase()}</span>
                <strong>{r.creator}</strong>
                <span className="follow">Folgen</span>
              </div>
              <p>{r.caption}</p>
              <span className="audio">♫ Originalton · {r.creator}</span>
            </div>
          </div>
        ))}
      </div>

      {shareFor && (
        <div className="share-sheet-bg" onClick={() => setShareFor(null)}>
          <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <div className="share-search">🔍 Suchen</div>
            <div className="contacts">
              {CONTACTS.map((c) => (
                <button
                  key={c.id}
                  className={`contact ${picked === c.id ? "picked" : ""} ${c.active ? "" : "inactive"}`}
                  onClick={() => (c.active ? setPicked(picked === c.id ? null : c.id) : onToast("In der Demo ist nur check24 aktiv"))}
                >
                  <span className={`contact-avatar ${c.id === "check24" ? "brand" : ""}`}>
                    {c.avatar}
                    {picked === c.id && <i>✓</i>}
                  </span>
                  <small>
                    {c.name}
                    {c.id === "check24" && <b className="verified"> ✔</b>}
                  </small>
                </button>
              ))}
            </div>
            <button className="btn btn-blue wide" disabled={picked !== "check24"} onClick={send}>
              Senden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
