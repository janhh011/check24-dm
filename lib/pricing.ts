import type { DestinationResult, Offer, UserProfile } from "./types";

// ⚠️ Demo-Preise. Im echten Produkt kämen diese Werte aus den internen CHECK24-Such-APIs
// (Pauschalreise, Flug + Hotel). Hier: deterministische Fantasiewerte, damit die Demo stabil ist.

const BASE_BY_COUNTRY: Record<string, number> = {
  AL: 489,
  ME: 559,
  GR: 649,
  HR: 619,
  IT: 729,
  ES: 599,
  PT: 639,
  TR: 529,
  EG: 579,
  CY: 689,
  MT: 619,
  FR: 789,
  TH: 1249,
  ID: 1399,
  MX: 1499,
  US: 1599,
  JP: 1699,
  VN: 1299,
  MA: 559,
  TN: 499,
  NO: 1099,
  IS: 1199,
  CN: 1149,
  BR: 1449,
  GB: 579,
};

const ORIGIN_FACTOR: Record<string, number> = { BER: 1, HAM: 1.02, MUC: 0.97, FRA: 0.98, DUS: 0.99, CGN: 0.99, LEJ: 1.04 };

const MONTH_FACTOR: Record<string, number> = {
  April: 0.9,
  Mai: 0.92,
  Juni: 1,
  Juli: 1.18,
  August: 1.2,
  September: 0.95,
  Oktober: 0.88,
  Flexibel: 0.9,
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "Demo-Nutzer",
  email: "demo@beispiel.de",
  origin: "BER",
  month: "Juni",
  travellers: 2,
  budget: 600,
};

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function destinationKey(r: DestinationResult): string {
  return `${r.place}|${r.countryCode}`.toLowerCase();
}

export function quoteOffer(r: DestinationResult, profile: UserProfile = DEFAULT_PROFILE): Offer {
  const key = destinationKey(r);
  const base = BASE_BY_COUNTRY[r.countryCode?.toUpperCase()] ?? 899;
  const jitter = (hash(key) % 120) - 50; // -50 … +69 €
  const price =
    (base + jitter) * (ORIGIN_FACTOR[profile.origin] ?? 1.03) * (MONTH_FACTOR[profile.month] ?? 1);
  const rounded = Math.round(price / 10) * 10 - 1;
  return {
    destinationKey: key,
    pricePP: rounded,
    basePrice: rounded,
    nights: 7,
    origin: profile.origin,
    month: profile.month,
    hotelStars: 3 + (hash(key + "s") % 2),
    board: ["Frühstück", "Halbpension", "All Inclusive"][hash(key + "b") % 3],
  };
}

/**
 * Simuliert die Preisentwicklung für ein paar Wochen (Random Walk mit leichtem Abwärtstrend,
 * damit in der Demo zuverlässig ein Alarm auslöst, wenn einer gesetzt ist).
 */
export function simulateWeeks(current: number, base: number, weeks: number, seed: string, biasDown: boolean): number[] {
  const out: number[] = [];
  let p = current;
  for (let w = 1; w <= weeks; w++) {
    const r = (hash(`${seed}-${w}-${p}`) % 1000) / 1000; // 0..1
    const drift = biasDown ? -0.075 : -0.01;
    const change = drift + (r - 0.5) * 0.08; // ca. -11 % … +3 % pro Woche
    p = Math.max(Math.round(base * 0.62), Math.round((p * (1 + change)) / 10) * 10 - 1);
    out.push(p);
  }
  return out;
}

export function formatEUR(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
