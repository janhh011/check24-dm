// Gemeinsame Typen für Frontend und API

export type DestinationStatus = "identified" | "ambiguous" | "not_travel";

export interface Airport {
  iata: string;
  name: string;
}

export interface Candidate {
  place: string;
  country: string;
}

/** Strukturierte Ausgabe der Zielerkennung (von Claude oder Offline-Fallback) */
export interface DestinationResult {
  status: DestinationStatus;
  place: string;
  region: string;
  country: string;
  countryCode: string;
  nearestAirport: Airport | null;
  tripType: "Strand" | "Stadt" | "Natur" | "Berge" | "Kultur" | "Mix";
  bestMonths: string[];
  confidence: number; // 0..1
  signals: string[]; // woran das Ziel erkannt wurde
  spots: string[]; // konkrete Orte/Sehenswürdigkeiten, die im Video zu sehen sind
  candidates: Candidate[]; // bei status = ambiguous
  clarifyingQuestion: string;
  teaser: string; // ein lockerer Satz zum Ort, im CHECK24-Ton
}

export interface AnalyzeRequest {
  reelId?: string;
  url?: string;
  caption?: string; // Bildunterschrift (kann im Demo-Modus „nur Bilder“ weggelassen werden)
  frames?: string[]; // Einzelbilder aus dem Video als data:image/jpeg;base64,…
  imageBase64?: string; // data URL eines Screenshots
  userHint?: string; // Korrektur/Antwort des Nutzers
}

export interface AnalyzeResponse {
  result: DestinationResult;
  source: "claude" | "fallback";
  model?: string;
  latencyMs: number;
  inputSummary: string;
  frameCount: number;
  usedCaption: boolean;
  note?: string;
  frames?: string[]; // nur clientseitig angehängt, für die Anzeige
}

export interface Reel {
  id: string;
  creator: string;
  caption: string;
  video: string;
  poster: string;
  likes: string;
  comments: string;
  emoji: string;
}

export interface Offer {
  destinationKey: string;
  pricePP: number;
  nights: number;
  origin: string;
  month: string;
  hotelStars: number;
  board: string;
  basePrice: number;
}

export interface UserProfile {
  name: string;
  email: string;
  origin: string;
  month: string;
  travellers: number;
  budget: number;
}

export interface BucketItem {
  id: string;
  result: DestinationResult;
  offer: Offer;
  addedAt: number;
  reelCaption: string;
  poster?: string;
  emoji: string;
  alert?: PriceAlert;
  priceHistory: number[];
}

export interface PriceAlert {
  threshold: number;
  createdAt: number;
  triggered?: { price: number; at: number; channel: string };
}
