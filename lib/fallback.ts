import type { AnalyzeRequest, DestinationResult } from "./types";

// Offline-Modus: vorbereitete Antworten für die Demo-Reels, damit die Präsentation auch ohne
// API-Key oder WLAN funktioniert. Für eigene Eingaben gibt es eine einfache Stichwortsuche.

const base: DestinationResult = {
  status: "identified",
  place: "",
  region: "",
  country: "",
  countryCode: "",
  nearestAirport: null,
  tripType: "Mix",
  bestMonths: [],
  confidence: 0.9,
  signals: [],
  spots: [],
  candidates: [],
  similar: [],
  clarifyingQuestion: "",
  teaser: "",
};

const PRESETS: Record<string, DestinationResult> = {
  mallorca: {
    ...base,
    place: "Mallorca",
    region: "Balearen",
    country: "Spanien",
    countryCode: "ES",
    nearestAirport: { iata: "PMI", name: "Palma de Mallorca" },
    tripType: "Strand",
    bestMonths: ["Mai", "Juni", "September"],
    confidence: 0.98,
    signals: ["Texteinblendungen „Caló des Moro“, „Valldemossa“, „Deià“, „Sóller“", "Hashtags #mallorca #spaintravel", "türkise Buchten, Natursteindörfer"],
    spots: ["Caló des Moro", "Valldemossa", "Deià", "Sóller", "Restaurant Illeta", "Gran Folies Beach Club"],
    teaser: "Türkise Buchten, Bergdörfer und die Holzbahn nach Sóller: Mallorca kann so viel mehr als Ballermann.",
    similar: [{ place: "Menorca", country: "Spanien", countryCode: "ES", reason: "ruhigere Buchten, gleiches Wasser" }, { place: "Kreta", country: "Griechenland", countryCode: "GR", reason: "Strände und Bergdörfer" }, { place: "Sardinien", country: "Italien", countryCode: "IT", reason: "türkise Buchten, weniger Trubel" }],
  },
  shanghai: {
    ...base,
    place: "Shanghai",
    region: "Pudong & The Bund",
    country: "China",
    countryCode: "CN",
    nearestAirport: { iata: "PVG", name: "Shanghai Pudong" },
    tripType: "Stadt",
    bestMonths: ["April", "Mai", "Oktober"],
    confidence: 0.97,
    signals: ["Oriental Pearl Tower im Bild", "Shanghai Tower + World Financial Center", "Bildunterschrift nennt Shanghai"],
    spots: ["Oriental Pearl Tower", "Shanghai Tower", "The Bund", "Yan’an-Hochstraße"],
    teaser: "Neon-Skyline am Huangpu: Shanghai fühlt sich wirklich an wie 2088. 🌃",
    similar: [{ place: "Tokio", country: "Japan", countryCode: "JP", reason: "Neon-Skyline und Großstadtgefühl" }, { place: "Hongkong", country: "China", countryCode: "CN", reason: "Skyline am Wasser" }, { place: "Singapur", country: "Singapur", countryCode: "SG", reason: "futuristische Architektur" }],
  },
  albanien: {
    ...base,
    place: "Albanische Riviera",
    region: "Küste zwischen Vlora und Saranda",
    country: "Albanien",
    countryCode: "AL",
    nearestAirport: { iata: "TIA", name: "Tirana, dann ca. 3 h Fahrt" },
    tripType: "Natur",
    bestMonths: ["Juni", "September"],
    confidence: 0.86,
    signals: ["Texteinblendung „Reise nach ALBANIEN“", "albanisches Kennzeichen", "Küstenpanorama, Kiesstrand, Wasserfall"],
    spots: ["Llogara-Pass", "Kiesstrände am Ionischen Meer", "Wasserfall in der Schlucht"],
    teaser: "Wilde Küste, Bergstraßen und leere Strände: Albanien ist Roadtrip-Abenteuer pur. 🚙",
    similar: [{ place: "Montenegro", country: "Montenegro", countryCode: "ME", reason: "wilde Küste, kleine Buchten" }, { place: "Korfu", country: "Griechenland", countryCode: "GR", reason: "direkt gegenüber, ähnliches Meer" }, { place: "Kroatien", country: "Kroatien", countryCode: "HR", reason: "Roadtrip entlang der Adria" }],
  },
  england: {
    ...base,
    status: "ambiguous",
    country: "Vereinigtes Königreich",
    countryCode: "GB",
    tripType: "Mix",
    confidence: 0.55,
    signals: ["Texteinblendung „England“", "Fachwerkhäuser + Stocherkähne (Canterbury?)", "Staudamm wirkt wie Elan Valley, das wäre Wales", "Mehrere Orte in einem Video"],
    spots: ["Canterbury", "Elan Valley (Wales)", "Gotisches Universitätsgebäude"],
    candidates: [
      { place: "Canterbury", country: "England" },
      { place: "Elan Valley", country: "Wales" },
      { place: "Cotswolds", country: "England" },
    ],
    clarifyingQuestion: "Das Video zeigt mehrere Orte, und nicht alle liegen in England 😉 Welcher hat’s dir angetan?",
  },
  rio: {
    ...base,
    place: "Rio de Janeiro",
    region: "Ipanema & Zuckerhut",
    country: "Brasilien",
    countryCode: "BR",
    nearestAirport: { iata: "GIG", name: "Rio de Janeiro Galeão" },
    tripType: "Strand",
    bestMonths: ["Mai", "Juni", "September"],
    confidence: 0.96,
    signals: ["Morro Dois Irmãos hinter dem Strand (Ipanema)", "Christusstatue", "Brasilien-Flagge im Text"],
    spots: ["Ipanema", "Morro Dois Irmãos", "Christus der Erlöser", "Rocinha"],
    teaser: "Fußball am Strand, Sonnenuntergang über Ipanema: Rio lebt draußen. 🇧🇷",
    similar: [{ place: "Salvador da Bahia", country: "Brasilien", countryCode: "BR", reason: "Strand, Musik, Lebensgefühl" }, { place: "Kapstadt", country: "Südafrika", countryCode: "ZA", reason: "Berg trifft Strand" }, { place: "Cartagena", country: "Kolumbien", countryCode: "CO", reason: "karibisches Stadtleben" }],
  },
  athen: {
    ...base,
    place: "Athen",
    region: "Attika",
    country: "Griechenland",
    countryCode: "GR",
    nearestAirport: { iata: "ATH", name: "Athen" },
    tripType: "Kultur",
    bestMonths: ["April", "Mai", "Oktober"],
    confidence: 0.98,
    signals: ["Parthenon und Propyläen", "Texteinblendung „Akropolis“", "Athener Metro + Markthalle"],
    spots: ["Akropolis", "Parthenon", "Zentrale Markthalle", "Plaka"],
    teaser: "Morgens Akropolis, mittags Markthalle, abends Plaka. Athen ist der perfekte Städtetrip. 🏛️",
    similar: [{ place: "Rom", country: "Italien", countryCode: "IT", reason: "antike Geschichte pur" }, { place: "Istanbul", country: "Türkei", countryCode: "TR", reason: "Kultur und Märkte" }, { place: "Thessaloniki", country: "Griechenland", countryCode: "GR", reason: "griechisches Stadtleben, entspannter" }],
  },
};

const CANDIDATE_PRESETS: Record<string, DestinationResult> = {
  canterbury: {
    ...base,
    place: "Canterbury",
    region: "Kent",
    country: "England",
    countryCode: "GB",
    nearestAirport: { iata: "LGW", name: "London Gatwick, dann ca. 1,5 h" },
    tripType: "Kultur",
    bestMonths: ["Mai", "Juni", "September"],
    confidence: 0.85,
    signals: ["Nutzer-Auswahl", "Fachwerkhäuser und Stocherkähne am Fluss Stour"],
    spots: ["Canterbury Cathedral", "Stocherkahnfahrt auf dem Stour"],
    teaser: "Fachwerk, Blumen und Stocherkähne: Canterbury ist England wie aus dem Bilderbuch.",
    similar: [{ place: "York", country: "England", countryCode: "GB", reason: "mittelalterliche Altstadt" }, { place: "Bath", country: "England", countryCode: "GB", reason: "historische Stadt am Fluss" }, { place: "Brügge", country: "Belgien", countryCode: "BE", reason: "Kanäle und Giebelhäuser" }],
  },
  "elan valley": {
    ...base,
    place: "Elan Valley",
    region: "Powys",
    country: "Wales",
    countryCode: "GB",
    nearestAirport: { iata: "BHX", name: "Birmingham, dann ca. 2 h Fahrt" },
    tripType: "Natur",
    bestMonths: ["Mai", "Juni", "September"],
    confidence: 0.8,
    signals: ["Nutzer-Auswahl", "viktorianische Staumauern mit Überlauf"],
    spots: ["Caban-Coch-Damm", "Craig-Goch-Damm"],
    teaser: "Viktorianische Staudämme mitten in grünen Hügeln. Wales von seiner wildesten Seite.",
    similar: [{ place: "Lake District", country: "England", countryCode: "GB", reason: "Seen und grüne Hügel" }, { place: "Snowdonia", country: "Wales", countryCode: "GB", reason: "Wandern in Wales" }, { place: "Schottische Highlands", country: "Schottland", countryCode: "GB", reason: "raue Natur" }],
  },
};

const KEYWORDS: Array<[RegExp, string]> = [
  [/mallorca|majorca|sóller|valldemossa/i, "mallorca"],
  [/shanghai/i, "shanghai"],
  [/albani/i, "albanien"],
  [/rio de janeiro|brazil|brasil/i, "rio"],
  [/athen|athens|akropolis/i, "athen"],
  [/england|\buk\b/i, "england"],
];

export function fallbackAnalyze(req: AnalyzeRequest): DestinationResult {
  const hint = (req.userHint ?? "").trim().toLowerCase();
  if (hint) {
    for (const key of Object.keys(CANDIDATE_PRESETS)) if (hint.includes(key)) return CANDIDATE_PRESETS[key];
    if (hint.includes("cotswolds")) return { ...CANDIDATE_PRESETS.canterbury, place: "Cotswolds", region: "Südwestengland", spots: ["Bibury", "Castle Combe"] };
    for (const [re, id] of KEYWORDS) if (re.test(hint)) return PRESETS[id];
  }
  if (req.reelId && PRESETS[req.reelId]) return PRESETS[req.reelId];
  const text = `${req.caption ?? ""} ${req.url ?? ""}`;
  for (const [re, id] of KEYWORDS) if (re.test(text)) return PRESETS[id];
  return {
    ...base,
    status: "ambiguous",
    confidence: 0.2,
    signals: ["Offline-Modus: ohne API-Key werden nur die Demo-Reels erkannt"],
    clarifyingQuestion: "Im Offline-Modus erkenne ich nur die Demo-Reels. Wo ist das denn?",
  };
}
