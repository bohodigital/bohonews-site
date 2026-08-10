#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-043329"
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

make_lead "$ASSETS/ftc-building.jpg" "$ROOT/ftc-trend-deploy/ftc-building"
make_lead "$ASSETS/construction-worker.jpg" "$ROOT/osha-safe-sound/construction-worker"
make_lead "$ASSETS/arts-industries.jpg" "$ROOT/smithsonian-voices-votes/arts-industries"
make_lead "$ASSETS/nasa-columbia.jpg" "$ROOT/nasa-genesis-ai/nasa-supercomputer"
make_lead "$ASSETS/wind-power.jpeg" "$ROOT/ifc-green-bond/wind-power"
make_lead "$ASSETS/pumpjack.jpg" "$ROOT/doe-oil-gas-funding/pumpjack"

chart "$ROOT/ftc-trend-deploy/refund-scale/four-three.webp" "Trend Deploy refunds" "9,419 checks" "More than \$672,000 total" "Cash within 90 days" "Source: FTC, July 22, 2026"
chart "$ROOT/ftc-trend-deploy/refund-safety/four-three.webp" "How FTC refunds work" "No fee to receive payment" "No account information needed" "Questions: official administrator" "Source: Federal Trade Commission"

chart "$ROOT/osha-safe-sound/program-pillars/four-three.webp" "Three program pillars" "Management leadership" "Worker participation" "Find and fix hazards" "Source: OSHA recommended practices"
chart "$ROOT/osha-safe-sound/week-dates/four-three.webp" "Safe + Sound Week" "August 10–16, 2026" "Open to every industry" "Activities can run year-round" "Source: OSHA calendar and program page"

chart "$ROOT/smithsonian-voices-votes/exhibit-run/four-three.webp" "Voices and Votes" "June 16–September 7" "Arts and Industries Building" "Free Smithsonian exhibition" "Source: Smithsonian, June 9, 2026"
chart "$ROOT/smithsonian-voices-votes/traveling-reach/four-three.webp" "A traveling democracy exhibit" "154 communities by year-end" "25 states" "Touring since March 2020" "Source: Smithsonian Museum on Main Street"

chart "$ROOT/nasa-genesis-ai/data-scale/four-three.webp" "NASA's data opportunity" "More than 150 petabytes" "Decades of mission archives" "AI links missions + simulations" "Source: NASA, July 22, 2026"
chart "$ROOT/nasa-genesis-ai/mission-structure/four-three.webp" "Genesis Mission" "15+ federal agencies" "NASA + DOE computing" "Space systems + discovery" "Source: NASA release 26-054"

chart "$ROOT/ifc-green-bond/bond-terms/four-three.webp" "IFC green bond terms" "EUR 1 billion" "7-year maturity" "3.125% coupon" "Source: IFC, July 8, 2026"
chart "$ROOT/ifc-green-bond/investor-book/four-three.webp" "Investor demand" "EUR 2.7B orderbook" "56 investors" "70% official institutions" "Source: IFC transaction disclosure"

chart "$ROOT/doe-oil-gas-funding/funding-window/four-three.webp" "DOE funding window" "Up to \$65.5 million" "Applications due Sept. 22" "Cost sharing required" "Source: DOE, July 23, 2026"
chart "$ROOT/doe-oil-gas-funding/topic-areas/four-three.webp" "Three technology tracks" "Use stranded resources" "Strengthen infrastructure" "Digitalize operations" "Source: DOE notice DE-FOA-0003634"
