#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260811-001321"
ASSETS="$ROOT/assets"

make_lead() {
  src="$1"; dest="$2"; gravity="${3:-center}"
  mkdir -p "$dest"
  magick "$src" -auto-orient -resize '1600x900^' -gravity "$gravity" -extent 1600x900 -strip -quality 84 "$dest/lead.webp"
  magick "$src" -auto-orient -resize '900x600^' -gravity "$gravity" -extent 900x600 -strip -quality 82 "$dest/card.webp"
  magick "$src" -auto-orient -resize '1200x1200^' -gravity "$gravity" -extent 1200x1200 -strip -quality 82 "$dest/square-social.webp"
  magick "$src" -auto-orient -resize '1200x900^' -gravity "$gravity" -extent 1200x900 -strip -quality 82 "$dest/four-three.webp"
  magick "$src" -auto-orient -resize '1280x720^' -gravity "$gravity" -extent 1280x720 -strip -quality 82 "$dest/sixteen-nine.webp"
  magick "$src" -auto-orient -resize '1200x630^' -gravity "$gravity" -extent 1200x630 -strip -quality 82 "$dest/open-graph.webp"
  magick "$src" -auto-orient -resize '720x480^' -gravity "$gravity" -extent 720x480 -strip -quality 80 "$dest/compact-mobile.webp"
}

chart() {
  dest="$1"; title="$2"; line1="$3"; line2="$4"; line3="$5"; foot="$6"
  mkdir -p "$(dirname "$dest")"
  magick -size 1200x900 canvas:'#f3eee5' \
    -fill '#171717' -font Arial-Bold -pointsize 54 -gravity northwest -annotate +72+82 "$title" \
    -fill '#a43b2d' -draw 'roundrectangle 72,180 1128,194 7,7' \
    -fill '#171717' -font Arial-Bold -pointsize 42 -annotate +88+285 "$line1" \
    -fill '#171717' -font Arial-Bold -pointsize 42 -annotate +88+430 "$line2" \
    -fill '#171717' -font Arial-Bold -pointsize 42 -annotate +88+575 "$line3" \
    -fill '#5b554c' -font Arial -pointsize 24 -annotate +88+790 "$foot" \
    -strip -quality 84 "$dest"
  dir="$(dirname "$dest")"
  magick "$dest" -resize '1600x900^' -gravity center -extent 1600x900 -strip -quality 84 "$dir/lead.webp"
  magick "$dest" -resize '900x600^' -gravity center -extent 900x600 -strip -quality 82 "$dir/card.webp"
  magick "$dest" -resize '1200x1200^' -gravity center -extent 1200x1200 -strip -quality 82 "$dir/square-social.webp"
  magick "$dest" -resize '1280x720^' -gravity center -extent 1280x720 -strip -quality 82 "$dir/sixteen-nine.webp"
  magick "$dest" -resize '1200x630^' -gravity center -extent 1200x630 -strip -quality 82 "$dir/open-graph.webp"
  magick "$dest" -resize '720x480^' -gravity center -extent 720x480 -strip -quality 80 "$dir/compact-mobile.webp"
}

make_lead "$ASSETS/factory-worker.jpg" "$ROOT/bls-productivity/factory-worker" center
make_lead "$ASSETS/research-complex.jpg" "$ROOT/nsf-phd-pilot/research-complex" center
make_lead "$ASSETS/laboratory-researchers.jpg" "$ROOT/nih-brain-aging/laboratory-researchers" center
make_lead "$ASSETS/metallurgy-lab.jpg" "$ROOT/nsf-materials-platforms/metallurgy-lab" center
make_lead "$ASSETS/sikuliaq.jpg" "$ROOT/noaa-ocean-survey/sikuliaq" center
make_lead "$ASSETS/tennis-players.jpg" "$ROOT/usta-oura/tennis-players" center

chart "$ROOT/bls-productivity/output-hours/four-three.webp" "Productivity in Q2" "Output: +1.7%" "Hours: +0.3%" "Productivity: +1.4%" "Source: U.S. Bureau of Labor Statistics"
chart "$ROOT/bls-productivity/labor-share/four-three.webp" "Labor compensation" "Labor share: 52.9%" "Lowest since series began" "Real hourly comp: -3.1%" "Source: U.S. Bureau of Labor Statistics"

chart "$ROOT/nsf-phd-pilot/program-scale/four-three.webp" "Four-year Ph.D. pilot" '$47 million / 5 years' "250+ doctoral students" "Nearly 3 dozen universities" "Source: U.S. National Science Foundation"
chart "$ROOT/nsf-phd-pilot/four-year-model/four-three.webp" "Shared funding model" "Year 1: university" "Later years: NSF" "1+ placement year: industry" "Source: U.S. National Science Foundation"

chart "$ROOT/nih-brain-aging/sample-ages/four-three.webp" "Human hippocampus atlas" "40 healthy donors" "Ages 20 to 95" "Single-cell multi-omics" "Source: NIH / Science"
chart "$ROOT/nih-brain-aging/midlife-window/four-three.webp" "Midlife immune shift" "Approx. ages 50 to 75" "Microglia declined" "Other immune cells rose" "Source: NIH / Science"

chart "$ROOT/nsf-materials-platforms/awards/four-three.webp" "Materials platforms" "2 national facilities" '$25 million each' '$50 million total' "Source: U.S. National Science Foundation"
chart "$ROOT/nsf-materials-platforms/national-users/four-three.webp" "National user access" "Dozens of visitors yearly" "Academic + industry" "10-20% access target" "Source: U.S. National Science Foundation"

chart "$ROOT/noaa-ocean-survey/route-duration/four-three.webp" "West Coast survey" "30 days at sea" "261-foot Sikuliaq" "San Diego to Washington" "Source: NOAA PMEL"
chart "$ROOT/noaa-ocean-survey/measurements/four-three.webp" "Ocean observations" "Chemistry + physics" "Biology + plankton" "Environmental DNA" "Source: NOAA PMEL"

chart "$ROOT/usta-oura/partnership-terms/four-three.webp" "USTA wearable deal" "5-year partnership" "First for USTA" "All main-draw players" "Source: United States Tennis Association"
chart "$ROOT/usta-oura/player-support/four-three.webp" "Player support" "On-site fitting" "Recovery education" "2027 recovery area" "Source: United States Tennis Association"
