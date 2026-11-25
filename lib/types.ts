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
  candidates: Candidate[]; // bei status = ambiguous
  clarifyingQuestion: string;
  teaser: string; // ein lockerer Satz zum Ort, im CHECK24-Ton
}

export interface AnalyzeRequest {
  reelId?: string;
  url?: string;
  caption?: string;
  locationTag?: string;
  imageBase64?: string; // data URL eines Screenshots
  userHint?: string; // Korrektur des Nutzers ("Falscher Ort" → "das ist Kotor")
}

export interface AnalyzeResponse {
  result: DestinationResult;
  source: "claude" | "fallback";
  model?: string;
  latencyMs: number;
  inputSummary: string;
  note?: string;
}

export interface Reel {
  id: string;
  creator: string;
  caption: string;
  locationTag?: string;
  audio: string;
  likes: string;
  gradient: string;
  emoji: string;
  hint: string; // Beschreibung für die Demo-Steuerung
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
  emoji: string;
  gradient: string;
  alert?: PriceAlert;
  priceHistory: number[];
}

export interface PriceAlert {
  threshold: number;
  createdAt: number;
  triggered?: { price: number; at: number; channel: string };
}
