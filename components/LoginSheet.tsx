"use client";

import { useState } from "react";
import { DEFAULT_PROFILE, formatEUR } from "@/lib/pricing";
import type { UserProfile } from "@/lib/types";

const AIRPORTS = ["BER", "HAM", "MUC", "FRA", "DUS", "LEJ"];
const MONTHS = ["Mai", "Juni", "Juli", "August", "September", "Oktober", "Flexibel"];

/** Simulierter Login + einmaliges Onboarding (Abflughafen, Zeitraum, Reisende, Budget). */
export default function LoginSheet({ onCancel, onDone }: { onCancel: () => void; onDone: (p: UserProfile) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [p, setP] = useState<UserProfile>({ ...DEFAULT_PROFILE, email: "jan.demo@beispiel.de", name: "Jan" });

  return (
    <div className="sheet login">
      <div className="sheet-head">
        <strong>{step === 1 ? "Bei CHECK24 anmelden" : "Kurz zu deinen Reiseplänen"}</strong>
        <button onClick={onCancel}>✕</button>
      </div>
      <div className="webview-url">🔒 Demo-Login · kein echtes Konto</div>

      {step === 1 ? (
        <div className="login-body">
          <div className="login-logo">CHECK24</div>
          <label>
            E-Mail
            <input value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} />
          </label>
          <label>
            Passwort
            <input type="password" value="demodemo" readOnly />
          </label>
          <button className="btn btn-blue wide" onClick={() => setStep(2)}>
            Anmelden & verbinden
          </button>
          <p className="fineprint">
            Demo: kein echter Login. Im Produkt würde hier die Social-Account-ID per Einmal-Token mit dem CHECK24-Kundenkonto verknüpft – inkl.
            Einwilligung zu Benachrichtigungen (Push/E-Mail).
          </p>
        </div>
      ) : (
        <div className="login-body">
          <p className="onb-intro">Einmalig – damit Preise & Alarme zu dir passen.</p>
          <div className="onb-label">Abflughafen</div>
          <div className="pill-row">
            {AIRPORTS.map((a) => (
              <button key={a} className={`pill ${p.origin === a ? "on" : ""}`} onClick={() => setP({ ...p, origin: a })}>
                {a}
              </button>
            ))}
          </div>
          <div className="onb-label">Wann ungefähr?</div>
          <div className="pill-row">
            {MONTHS.map((m) => (
              <button key={m} className={`pill ${p.month === m ? "on" : ""}`} onClick={() => setP({ ...p, month: m })}>
                {m}
              </button>
            ))}
          </div>
          <div className="onb-label">Reisende</div>
          <div className="stepper">
            <button onClick={() => setP({ ...p, travellers: Math.max(1, p.travellers - 1) })}>−</button>
            <span>{p.travellers} Erwachsene</span>
            <button onClick={() => setP({ ...p, travellers: Math.min(6, p.travellers + 1) })}>+</button>
          </div>
          <div className="onb-label">
            Was darf die Reise pro Person kosten? <strong>{formatEUR(p.budget)}</strong>
          </div>
          <input type="range" min={300} max={1500} step={50} value={p.budget} onChange={(e) => setP({ ...p, budget: Number(e.target.value) })} />
          <button className="btn btn-blue wide" onClick={() => onDone(p)}>
            Speichern & zurück zum Chat
          </button>
        </div>
      )}
    </div>
  );
}
