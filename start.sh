#!/usr/bin/env bash
# Startet Reel-to-Trip lokal auf http://localhost:3000
#   ./start.sh
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js fehlt. Installieren mit: brew install node   (oder https://nodejs.org)"
  exit 1
fi

# API-Key einmalig abfragen und lokal in .env.local speichern (wird nie committet)
if [ ! -f .env.local ] || ! grep -q "ANTHROPIC_API_KEY=sk-" .env.local; then
  echo "🔑 Anthropic API-Key eingeben (leer lassen = Offline-Modus):"
  read -r -s KEY
  printf 'ANTHROPIC_API_KEY=%s\nCLAUDE_MODEL=claude-sonnet-5-5\n' "$KEY" > .env.local
  echo "✓ .env.local angelegt"
fi

if [ ! -d public/reels ] || [ -z "$(ls public/reels/*.mp4 2>/dev/null)" ]; then
  echo "⚠️  Keine Demo-Videos in public/reels/ – siehe README (scripts/prepare-reels.sh)."
fi

[ -d node_modules ] || npm install

# Browser nach dem Start öffnen
(sleep 4 && open "http://localhost:3000" >/dev/null 2>&1 || true) &
npm run dev
