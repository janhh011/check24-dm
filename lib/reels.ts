import type { Reel } from "./types";

// Vorbereitete Demo-"Reels". Bewusst ohne echte Creator, Videos oder Plattform-Branding.
export const DEMO_REELS: Reel[] = [
  {
    id: "ksamil",
    creator: "@wanderlust.lena",
    caption:
      "Karibik-Wasser für ’nen Bruchteil vom Preis 🤯🇦🇱 Wer hätte gedacht, dass Europa so aussehen kann? #hiddengem #balkans #budgettravel",
    locationTag: "Ksamil",
    audio: "Originalton – Wellen & Gitarre",
    likes: "248k",
    gradient: "linear-gradient(160deg,#36d1dc 0%,#1e7fc8 55%,#0b3b6f 100%)",
    emoji: "🏝️",
    hint: "Eindeutig: Ortsmarkierung + Flagge",
  },
  {
    id: "kotor",
    creator: "@two.backpacks",
    caption:
      "Altstadt, Berge und eine Bucht wie ein Fjord – und das mitten am Mittelmeer 😍 Die 1.350 Stufen hoch zur Festung haben sich gelohnt! #montenegro #roadtrip",
    audio: "Trending Sound – Summer Nights",
    likes: "91k",
    gradient: "linear-gradient(160deg,#f6d365 0%,#fda085 45%,#5b4a8b 100%)",
    emoji: "🏰",
    hint: "Ohne Ortsmarkierung, Ziel steckt im Text",
  },
  {
    id: "navagio",
    creator: "@greek.islands.daily",
    caption:
      "Das berühmte Schiffswrack, nur mit dem Boot erreichbar 🚤⚓ Tipp: Früh morgens hin, bevor die Ausflugsboote kommen! #griechenland #ionischesmeer",
    audio: "Originalton",
    likes: "1,2 Mio.",
    gradient: "linear-gradient(160deg,#a8edea 0%,#2bb3c0 45%,#e9d8a6 100%)",
    emoji: "⛵",
    hint: "Indirekt: Wahrzeichen statt Ortsname",
  },
  {
    id: "turquoise",
    creator: "@sunset.chaser",
    caption: "Türkisblaues Wasser und kein Mensch weit und breit 💙 Sagt euch nicht, wo das ist 🤫 #mittelmeer #paradise",
    audio: "Trending Sound – Ocean Eyes",
    likes: "37k",
    gradient: "linear-gradient(160deg,#48c6ef 0%,#6f86d6 100%)",
    emoji: "🌊",
    hint: "Mehrdeutig: Bot fragt nach",
  },
  {
    id: "cafe",
    creator: "@foodie.berlin",
    caption: "Bestes Bananenbrot der Stadt?! 🍌☕ Unbedingt die Hafermilch-Variante probieren #cafe #brunch",
    audio: "Lo-Fi Beats",
    likes: "12k",
    gradient: "linear-gradient(160deg,#c79081 0%,#dfa579 100%)",
    emoji: "☕",
    hint: "Kein Reiseziel: Bot reagiert ehrlich",
  },
];

export function findReel(id?: string): Reel | undefined {
  return DEMO_REELS.find((r) => r.id === id);
}
