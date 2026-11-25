"use client";

import { formatEUR, hash } from "@/lib/pricing";
import type { BucketItem, UserProfile } from "@/lib/types";

const HOTEL_NAMES = ["Hotel Aurora", "Blue Bay Resort", "Villa Sol", "Seaside Suites", "Hotel Panorama", "Olive Garden Apartments"];

/** Simulierter Deep Link in die CHECK24-Suche, vorausgefüllt mit Ziel + Profil. */
export default function DeepLinkScreen({
  item,
  profile,
  onBack,
  onBook,
}: {
  item: BucketItem;
  profile: UserProfile;
  onBack: () => void;
  onBook: () => void;
}) {
  const current = item.priceHistory[item.priceHistory.length - 1];
  const h = hash(item.id);
  const hotels = [0, 1, 2].map((i) => ({
    name: HOTEL_NAMES[(h + i * 2) % HOTEL_NAMES.length],
    stars: 3 + ((h + i) % 3 === 0 ? 1 : 0) + (i === 2 ? 1 : 0),
    price: current + i * 40 + ((h >> i) % 3) * 10,
    board: ["Frühstück", "Halbpension", "All Inclusive"][(h + i) % 3],
    rating: (4.1 + ((h >> (i + 2)) % 8) / 10).toFixed(1),
  }));

  return (
    <div className="deeplink">
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
            <div className="dl-img" style={{ background: item.gradient }}>
              {item.emoji}
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
      <p className="fineprint center">Demo-Daten – im Produkt: echte Ergebnisliste der CHECK24-Suche</p>
    </div>
  );
}
