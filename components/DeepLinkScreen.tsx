"use client";

import { useEffect, useRef } from "react";
import { formatEUR, hash, quoteOffer } from "@/lib/pricing";
import type { BucketItem, DestinationResult, SimilarTrip, UserProfile } from "@/lib/types";

const HOTEL_NAMES = ["Hotel Aurora", "Blue Bay Resort", "Villa Sol", "Seaside Suites", "Hotel Panorama", "Olive Garden Apartments"];
const SIMILAR_GRADIENTS = [
  "linear-gradient(160deg,#36d1dc,#1e7fc8)",
  "linear-gradient(160deg,#f6d365,#fda085)",
  "linear-gradient(160deg,#a18cd1,#5b4a8b)",
];

/** Simulierter Deep Link in die CHECK24-Suche, vorausgefüllt mit Ziel + Profil, plus ähnliche Reisen. */
export default function DeepLinkScreen({
  item,
  profile,
  onBack,
  onBook,
  onSimilar,
}: {
  item: BucketItem;
  profile: UserProfile;
  onBack: () => void;
  onBook: () => void;
  onSimilar: (s: SimilarTrip) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [item.id]);

  const current = item.priceHistory[item.priceHistory.length - 1];
  const h = hash(item.id + item.result.place);
  const hotels = [0, 1, 2].map((i) => ({
    name: HOTEL_NAMES[(h + i * 2) % HOTEL_NAMES.length],
    stars: 3 + ((h + i) % 3 === 0 ? 1 : 0) + (i === 2 ? 1 : 0),
    price: current + i * 40 + ((h >> i) % 3) * 10,
    board: ["Frühstück", "Halbpension", "All Inclusive"][(h + i) % 3],
    rating: (4.1 + ((h >> (i + 2)) % 8) / 10).toFixed(1),
  }));

  const similar = item.result.similar ?? [];

  return (
    <div className="deeplink" ref={scrollRef}>
      <div className="dl-header">
        <button onClick={onBack}>‹</button>
        <span className="wordmark small">CHECK24</span>
        <span className="dl-tag">Urlaub</span>
      </div>
      <div className="dl-url">check24.de/urlaub?ziel={encodeURIComponent(item.result.place)}&amp;ab={profile.origin}&amp;utm_source=social_dm</div>
      <div className="dl-search">
        <div>
          <span>Ziel</span>
          <strong>
            {item.result.place}, {item.result.country}
          </strong>
        </div>
        <div>
          <span>Abflug</span>
          <strong>{profile.origin}</strong>
        </div>
        <div>
          <span>Zeitraum</span>
          <strong>{profile.month}</strong>
        </div>
        <div>
          <span>Reisende</span>
          <strong>{profile.travellers} Erw.</strong>
        </div>
      </div>
      {item.alert?.triggered && (
        <div className="dl-alert">
          🔔 Preisalarm ausgelöst: −{Math.round((1 - item.alert.triggered.price / item.offer.pricePP) * 100)} % seit dem Speichern
        </div>
      )}
      <div className="dl-list">
        {hotels.map((ho, i) => (
          <div key={i} className="dl-hotel">
            <div
              className="dl-img"
              style={item.poster ? { backgroundImage: `url(${item.poster})`, backgroundPosition: `center ${20 + i * 30}%` } : { background: SIMILAR_GRADIENTS[i % 3] }}
            >
              {!item.poster && item.emoji}
            </div>
            <div className="dl-info">
              <strong>{ho.name}</strong>
              <span>
                {"★".repeat(ho.stars)} · {ho.board} · ⭐ {ho.rating}
              </span>
              <span>
                {item.offer.nights} Nächte inkl. Flug ab {profile.origin}
              </span>
            </div>
            <div className="dl-price">
              <span>{formatEUR(ho.price)}</span>
              <small>p. P.</small>
              <button className="btn btn-yellow small" onClick={onBook}>
                Zum Angebot
              </button>
            </div>
          </div>
        ))}
      </div>

      {similar.length > 0 && (
        <div className="dl-similar">
          <h4>Ähnliche Reisen</h4>
          <div className="dl-similar-row">
            {similar.map((s, i) => {
              const price = quoteOffer({ place: s.place, countryCode: s.countryCode } as DestinationResult, profile).pricePP;
              return (
                <button key={s.place} className="dl-sim-card" onClick={() => onSimilar(s)}>
                  <span className="dl-sim-img" style={{ background: SIMILAR_GRADIENTS[i % 3] }}>
                    ✈️
                  </span>
                  <strong>{s.place}</strong>
                  <small className="dl-sim-country">{s.country}</small>
                  <small className="dl-sim-reason">{s.reason}</small>
                  <span className="dl-sim-price">ab {formatEUR(price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <p className="fineprint center">Demo-Daten. Im Produkt: echte Ergebnisliste der CHECK24-Suche</p>
    </div>
  );
}
