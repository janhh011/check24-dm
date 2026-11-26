#!/usr/bin/env bash
# Bereitet die Demo-Videos für den Browser vor:
#   ./scripts/prepare-reels.sh <ordner-mit-mp4s>
# Erwartet Dateien, deren Name das Stichwort enthält (mallorca, shanghai, albanien, england, rio, athen).
# Ergebnis: public/reels/<id>.mp4 (Faststart, ohne Cover-Stream) + public/reels/<id>.jpg (Posterbild)
set -euo pipefail
SRC="${1:?Bitte Ordner mit den Videos angeben}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/reels"
mkdir -p "$OUT"
declare -A KEYS=( [mallorca]=mallorca [shanghai]=shanghai [albanien]=albanien [england]=england [rio]=rio [athen]=athen )
for f in "$SRC"/*.mp4; do
  name="$(basename "$f" | tr '[:upper:]' '[:lower:]')"
  for k in "${!KEYS[@]}"; do
    if [[ "$name" == *"$k"* ]]; then
      id="${KEYS[$k]}"
      ffmpeg -v error -y -i "$f" -map 0:v:0 -map 0:a:0? -c copy -movflags +faststart "$OUT/$id.mp4"
      ffmpeg -v error -y -ss 1 -i "$f" -map 0:v:0 -frames:v 1 -vf scale=480:-2 -q:v 4 "$OUT/$id.jpg"
      echo "✓ $id"
    fi
  done
done
