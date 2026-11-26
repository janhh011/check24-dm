import type { Reel } from "./types";

// Die Demo-Reels. Videos liegen unter public/reels/ (nicht im Git-Repo, siehe README).
export const DEMO_REELS: Reel[] = [
  {
    id: "mallorca",
    creator: "@island.diaries",
    caption: "10 places to visit in Mallorca 🌊 #mallorca #majorca #mallorcatravel #spaintravel #spaintrip",
    video: "/reels/mallorca.mp4",
    poster: "/reels/mallorca.jpg",
    likes: "184k",
    comments: "1.204",
    emoji: "🏝️",
  },
  {
    id: "shanghai",
    creator: "@citylights.film",
    caption: "Welcome to futuristic Shanghai City 2088 🌃",
    video: "/reels/shanghai.mp4",
    poster: "/reels/shanghai.jpg",
    likes: "412k",
    comments: "3.871",
    emoji: "🌃",
  },
  {
    id: "albanien",
    creator: "@roadtrip.vibes",
    caption: "5 Dinge, die du vor einer Reise nach Albanien wissen solltest 🇦🇱",
    video: "/reels/albanien.mp4",
    poster: "/reels/albanien.jpg",
    likes: "57k",
    comments: "689",
    emoji: "🚙",
  },
  {
    id: "england",
    creator: "@wanderlust.uk",
    caption: "Places that don’t feel real in England 😨 #travel #nature #england #uk",
    video: "/reels/england.mp4",
    poster: "/reels/england.jpg",
    likes: "98k",
    comments: "2.016",
    emoji: "🏰",
  },
  {
    id: "rio",
    creator: "@longwayfromhome",
    caption: "This is Brazil 🇧🇷 | Living in Rio de Janeiro",
    video: "/reels/rio.mp4",
    poster: "/reels/rio.jpg",
    likes: "231k",
    comments: "1.543",
    emoji: "🏖️",
  },
  {
    id: "athen",
    creator: "@zwei.unterwegs",
    caption: "ATHEN mini-Vlog: ein Tag in Griechenlands Hauptstadt 🇬🇷",
    video: "/reels/athen.mp4",
    poster: "/reels/athen.jpg",
    likes: "23k",
    comments: "312",
    emoji: "🏛️",
  },
];

export function findReel(id?: string): Reel | undefined {
  return DEMO_REELS.find((r) => r.id === id);
}
