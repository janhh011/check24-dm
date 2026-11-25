import { NextResponse } from "next/server";
import { analyzeWithClaude, MODEL, type ClaudeInput } from "@/lib/claude";
import { fallbackAnalyze } from "@/lib/fallback";
import { findReel } from "@/lib/reels";
import type { AnalyzeRequest, AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_CHARS = 7_000_000; // ~5 MB Base64

/** TikTok bietet ein öffentliches oEmbed-Endpoint: liefert Bildunterschrift, Creator und Vorschaubild. */
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

  if (body.imageBase64 && body.imageBase64.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ error: "Screenshot ist zu groß (max. ca. 5 MB)." }, { status: 413 });
  }

  // 1) Signale einsammeln
  const reel = findReel(body.reelId);
  const input: ClaudeInput = {
    caption: body.caption ?? reel?.caption,
    locationTag: body.locationTag ?? reel?.locationTag,
    author: reel?.creator,
    url: body.url,
    userHint: body.userHint,
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
      note = "TikTok-oEmbed nicht erreichbar – nur Link-Text ausgewertet";
    }
  } else if (body.url && /instagram\.com/i.test(body.url)) {
    note = "Instagram-Inhalte sind ohne Meta-API nicht abrufbar – im echten Produkt kommt die Bildunterschrift über den DM-Webhook";
  }

  const inputSummary = [
    input.locationTag && `📍 ${input.locationTag}`,
    input.caption && `„${input.caption.slice(0, 80)}${input.caption.length > 80 ? "…" : ""}“`,
    input.imageDataUrl && "🖼️ Screenshot",
    input.imageUrl && "🖼️ Vorschaubild",
    input.userHint && `💬 Hinweis: ${input.userHint}`,
  ]
    .filter(Boolean)
    .join(" · ");

  // 2) Claude oder Offline-Fallback
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await analyzeWithClaude(input);
      const res: AnalyzeResponse = { result, source: "claude", model: MODEL, latencyMs: Date.now() - started, inputSummary, note };
      return NextResponse.json(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      note = `Claude-Aufruf fehlgeschlagen (${msg.slice(0, 120)}) – Offline-Fallback genutzt`;
    }
  } else {
    note = note ? `${note} · kein API-Key → Offline-Modus` : "Kein ANTHROPIC_API_KEY gesetzt → Offline-Modus";
  }

  const result = fallbackAnalyze({ ...body, caption: input.caption, locationTag: input.locationTag });
  const res: AnalyzeResponse = { result, source: "fallback", latencyMs: Date.now() - started, inputSummary, note };
  return NextResponse.json(res);
}

export async function GET() {
  return NextResponse.json({ mode: process.env.ANTHROPIC_API_KEY ? "claude" : "fallback", model: MODEL });
}
