import { NextResponse } from "next/server";
import { analyzeWithClaude, MODEL, type ClaudeInput } from "@/lib/claude";
import { fallbackAnalyze } from "@/lib/fallback";
import { findReel } from "@/lib/reels";
import type { AnalyzeRequest, AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_CHARS = 7_000_000; // ~5 MB Base64 je Bild
const MAX_FRAMES = 10;

// Einfaches Anfragelimit pro IP (best effort, pro Server-Instanz), schützt das API-Budget,
// wenn der Demo-Link weitergeleitet wird.
const RATE_LIMIT = 40;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

/** TikTok bietet einen öffentlichen oEmbed-Endpoint: liefert Bildunterschrift, Creator und Vorschaubild. */
async function tiktokOEmbed(url: string): Promise<{ caption?: string; author?: string; thumbnail?: string } | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    return { caption: j.title, author: j.author_name, thumbnail: j.thumbnail_url };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const started = Date.now();
  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const frames = (body.frames ?? []).slice(0, MAX_FRAMES);
  if ([body.imageBase64, ...frames].some((s) => s && s.length > MAX_IMAGE_CHARS)) {
    return NextResponse.json({ error: "Bild ist zu groß (max. ca. 5 MB)." }, { status: 413 });
  }

  // 1) Signale einsammeln
  const reel = findReel(body.reelId);
  const input: ClaudeInput = {
    caption: body.caption,
    author: reel?.creator,
    url: body.url,
    userHint: body.userHint,
    frames,
    imageDataUrl: body.imageBase64,
  };
  let note: string | undefined;

  if (body.url && /tiktok\.com/i.test(body.url)) {
    const meta = await tiktokOEmbed(body.url);
    if (meta) {
      input.caption = input.caption || meta.caption;
      input.author = meta.author;
      input.imageUrl = meta.thumbnail;
      note = "TikTok-oEmbed: Bildunterschrift + Vorschaubild geladen";
    } else {
      note = "TikTok-oEmbed nicht erreichbar, nur Link-Text ausgewertet";
    }
  }

  const inputSummary = [
    frames.length ? `🎞️ ${frames.length} Einzelbilder` : null,
    input.caption ? `„${input.caption.slice(0, 70)}${input.caption.length > 70 ? "…" : ""}“` : "ohne Bildunterschrift",
    input.imageDataUrl && "🖼️ Screenshot",
    input.imageUrl && "🖼️ Vorschaubild",
    input.userHint && `💬 ${input.userHint}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const meta = { inputSummary, frameCount: frames.length, usedCaption: Boolean(input.caption) };

  // 2) Claude oder Offline-Fallback
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (process.env.ANTHROPIC_API_KEY && !rateLimited(ip)) {
    try {
      const result = await analyzeWithClaude(input);
      const res: AnalyzeResponse = { result, source: "claude", model: MODEL, latencyMs: Date.now() - started, note, ...meta };
      return NextResponse.json(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      note = `Claude-Aufruf fehlgeschlagen (${msg.slice(0, 120)}), Offline-Antwort genutzt`;
    }
  } else if (process.env.ANTHROPIC_API_KEY) {
    note = "Anfragelimit für diese Demo erreicht, Offline-Antwort genutzt";
  } else {
    note = note ? `${note} · kein API-Key → Offline-Modus` : "Kein API-Key gesetzt → Offline-Modus";
  }

  const result = fallbackAnalyze({ ...body, caption: input.caption });
  const res: AnalyzeResponse = { result, source: "fallback", latencyMs: Date.now() - started, note, ...meta };
  return NextResponse.json(res);
}

export async function GET() {
  return NextResponse.json({ mode: process.env.ANTHROPIC_API_KEY ? "claude" : "fallback", model: MODEL });
}
