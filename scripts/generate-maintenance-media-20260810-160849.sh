#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-160849"
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

make_lead "$ASSETS/exam-room.jpg" "$ROOT/gao-program-integrity/exam-room" center
make_lead "$ASSETS/courthouse.jpg" "$ROOT/ussc-national-defense/courthouse" center
make_lead "$ASSETS/house-key.jpg" "$ROOT/cbo-federal-credit/house-key" center
make_lead "$ASSETS/quantum-lab.jpg" "$ROOT/nsf-project-triad/quantum-lab" center
make_lead "$ASSETS/wildfire-smoke.jpg" "$ROOT/nasa-brown-carbon/wildfire-smoke" center
make_lead "$ASSETS/astana-skyline.jpg" "$ROOT/imf-kazakhstan/astana-skyline" center

chart "$ROOT/gao-program-integrity/payment-estimates/four-three.webp" "Improper-payment estimates" "VA Community Care: \$608M" "Medicare Advantage: \$23.7B" "Fiscal year 2025" "Source: GAO-26-107946"
chart "$ROOT/gao-program-integrity/open-actions/four-three.webp" "GAO recommendations" "Three open actions" "One for VA" "Two for CMS" "Source: U.S. Government Accountability Office"

chart "$ROOT/ussc-national-defense/case-count/four-three.webp" "National-defense cases" "517 cases in FY2025" "66,662 total federal cases" "Up 132% since FY2021" "Source: U.S. Sentencing Commission"
chart "$ROOT/ussc-national-defense/sentences/four-three.webp" "Sentencing outcomes" "85% received prison" "Average: 21 months" "Category-wide figures" "Source: U.S. Sentencing Commission"

chart "$ROOT/cbo-federal-credit/methods/four-three.webp" "Two cost methods" "FCRA: \$15.3B savings" "Fair value: \$51.9B cost" "Difference: \$67.2B" "Source: Congressional Budget Office"
chart "$ROOT/cbo-federal-credit/volume/four-three.webp" "Federal credit in 2027" "94 programs" "\$1.9 trillion" "87% mortgages & student loans" "Source: Congressional Budget Office"

chart "$ROOT/nsf-project-triad/domains/four-three.webp" "Three quantum domains" "Quantum sensing" "Quantum networking" "Quantum computing" "Source: U.S. National Science Foundation"
chart "$ROOT/nsf-project-triad/programs/four-three.webp" "Project Triad programs" "National Quantum Virtual Lab" "NSF X-Labs" "NSF Quantum+X" "Source: U.S. National Science Foundation"

chart "$ROOT/nasa-brown-carbon/window/four-three.webp" "Wildfire brown carbon" "July 14 through July 20" "One modeled week" "Across North America" "Source: NASA Earth Observatory"
chart "$ROOT/nasa-brown-carbon/model-inputs/four-three.webp" "GEOS model inputs" "Satellite & aircraft" "Ground observations" "Weather data" "Source: NASA Earth Observatory"

chart "$ROOT/imf-kazakhstan/growth-inflation/four-three.webp" "Kazakhstan outlook" "Growth: about 4.6%" "Inflation: around 10%" "2026 staff projections" "Source: International Monetary Fund staff"
chart "$ROOT/imf-kazakhstan/external-balance/four-three.webp" "Current account" "2025: -4.1% of GDP" "2026: marginal surplus" "Projected" "Source: International Monetary Fund staff"
