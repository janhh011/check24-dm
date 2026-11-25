import type { AnalyzeRequest, DestinationResult } from "./types";

// Offline-Modus: vorbereitete Antworten für die Demo-Reels, damit die Präsentation auch ohne
// API-Key oder WLAN funktioniert. Für eigene Eingaben gibt es eine einfache Stichwortsuche.

const base: Omit<DestinationResult, "place" | "region" | "country" | "countryCode"> = {
  status: "identified",
  nearestAirport: null,
  tripType: "Strand",
  bestMonths: [],
  confidence: 0.9,
  signals: [],
  candidates: [],
  clarifyingQuestion: "",
  teaser: "",
};

const PRESETS: Record<string, DestinationResult> = {
  ksamil: {
    ...base,
    place: "Ksamil",
    region: "Albanische Riviera, Region Vlora",
    country: "Albanien",
    countryCode: "AL",
    nearestAirport: { iata: "CFU", name: "Korfu (Griechenland), dann Fähre nach Saranda" },
    tripType: "Strand",
    bestMonths: ["Juni", "September"],
    confidence: 0.97,
    signals: ["Ortsmarkierung „Ksamil“", "Flaggen-Emoji 🇦🇱", "Hashtag #balkans"],
    teaser: "Türkises Wasser, kleine Inseln zum Rüberschwimmen – die Malediven des Balkans.",
  },
  kotor: {
    ...base,
    place: "Kotor",
    region: "Bucht von Kotor",
    country: "Montenegro",
    countryCode: "ME",
    nearestAirport: { iata: "TIV", name: "Tivat" },
    tripType: "Kultur",
    bestMonths: ["Mai", "Juni", "September"],
    confidence: 0.92,
    signals: ["Hashtag #montenegro", "„Bucht wie ein Fjord“", "„1.350 Stufen zur Festung“ (San Giovanni)"],
    teaser: "Mittelalterliche Altstadt direkt an einer fjordartigen Bucht – perfekt für Kultur + Strand.",
  },
  navagio: {
    ...base,
    place: "Navagio-Strand (Shipwreck Beach)",
    region: "Zakynthos, Ionische Inseln",
    country: "Griechenland",
    countryCode: "GR",
    nearestAirport: { iata: "ZTH", name: "Zakynthos" },
    tripType: "Strand",
    bestMonths: ["Mai", "Juni", "September", "Oktober"],
    confidence: 0.9,
    signals: ["„berühmtes Schiffswrack, nur per Boot“", "#griechenland", "#ionischesmeer"],
    teaser: "Das Schiffswrack in der Bucht ist eines der meistfotografierten Motive Griechenlands.",
  },
  turquoise: {
    ...base,
    status: "ambiguous",
    place: "",
    region: "",
    country: "",
    countryCode: "",
    tripType: "Strand",
    confidence: 0.3,
    signals: ["„türkisblaues Wasser“", "#mittelmeer", "Creator verrät den Ort absichtlich nicht"],
    candidates: [
      { place: "Balos-Lagune (Kreta)", country: "Griechenland" },
      { place: "Cala Macarella (Menorca)", country: "Spanien" },
      { place: "Ksamil", country: "Albanien" },
    ],
    clarifyingQuestion: "Der Creator verrät’s leider nicht 🤫 Welcher dieser Orte könnte es sein – oder weißt du’s?",
    teaser: "",
  },
  cafe: {
    ...base,
    status: "not_travel",
    place: "",
    region: "",
    country: "",
    countryCode: "",
    tripType: "Mix",
    confidence: 0.85,
    signals: ["Café/Brunch-Inhalt", "kein Reiseziel erkennbar"],
    teaser: "",
  },
};

const KEYWORDS: Array<[RegExp, string]> = [
  [/ksamil|albani|saranda/i, "ksamil"],
  [/kotor|montenegro|budva/i, "kotor"],
  [/navagio|zakynthos|schiffswrack|shipwreck/i, "navagio"],
];

const CANDIDATE_PRESETS: Record<string, DestinationResult> = {
  "balos-lagune (kreta)": {
    ...base,
    place: "Balos-Lagune",
    region: "Westkreta",
    country: "Griechenland",
    countryCode: "GR",
    nearestAirport: { iata: "CHQ", name: "Chania" },
    bestMonths: ["Mai", "Juni", "September"],
    confidence: 0.8,
    signals: ["Nutzer-Auswahl"],
    teaser: "Flache, türkise Lagune mit rosa schimmerndem Sand im Westen Kretas.",
  },
  "cala macarella (menorca)": {
    ...base,
    place: "Cala Macarella",
    region: "Menorca, Balearen",
    country: "Spanien",
    countryCode: "ES",
    nearestAirport: { iata: "MAH", name: "Menorca (Mahón)" },
    bestMonths: ["Juni", "September"],
    confidence: 0.8,
    signals: ["Nutzer-Auswahl"],
    teaser: "Kleine Bucht mit Pinienwald und glasklarem Wasser – die Postkarte Menorcas.",
  },
};

export function fallbackAnalyze(req: AnalyzeRequest): DestinationResult {
  const hint = (req.userHint ?? "").trim().toLowerCase();
  if (hint) {
    if (CANDIDATE_PRESETS[hint]) return CANDIDATE_PRESETS[hint];
    for (const [re, id] of KEYWORDS) if (re.test(hint)) return PRESETS[id];
  }
  if (req.reelId && PRESETS[req.reelId]) return PRESETS[req.reelId];
  const text = `${req.caption ?? ""} ${req.locationTag ?? ""} ${req.url ?? ""} ${hint}`;
  for (const [re, id] of KEYWORDS) if (re.test(text)) return PRESETS[id];
  return {
    ...PRESETS.turquoise,
    signals: ["Offline-Modus: ohne API-Key werden nur die Demo-Reels sicher erkannt"],
    clarifyingQuestion: "Im Offline-Modus erkenne ich nur die Demo-Reels. Welcher Ort könnte es sein?",
  };
}
