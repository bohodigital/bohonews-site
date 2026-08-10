#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-174920"
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

make_lead "$ASSETS/moab.jpg" "$ROOT/gao-moab-cleanup/remediation-site" center
make_lead "$ASSETS/courthouse.jpg" "$ROOT/ussc-mandatory-minimums/kentucky-courthouse" center
make_lead "$ASSETS/times-square.jpg" "$ROOT/census-population/times-square-crowd" center
make_lead "$ASSETS/satellite.jpg" "$ROOT/nasa-commercial-data/goes-t-cleanroom" center
make_lead "$ASSETS/drought.jpg" "$ROOT/drought-monitor/texas-corn-field" center
make_lead "$ASSETS/tashkent.jpg" "$ROOT/imf-uzbekistan/tashkent-city" center

chart "$ROOT/gao-moab-cleanup/cleanup-cost/four-three.webp" "Moab cleanup cost" '$970M through FY2025' '$1.16B expected total' "Federal share: 100%" "Source: U.S. Government Accountability Office"
chart "$ROOT/gao-moab-cleanup/waste-timeline/four-three.webp" "Moab cleanup progress" "16M+ tons removed" "Completion planned: 2029" "Groundwater work continues" "Source: U.S. Government Accountability Office"

chart "$ROOT/ussc-mandatory-minimums/case-share/four-three.webp" "Mandatory minimums" "66,662 federal cases" "13,926 carried a minimum" "15% subject at sentencing" "Source: U.S. Sentencing Commission"
chart "$ROOT/ussc-mandatory-minimums/sentence-length/four-three.webp" "Average sentences" "158 months subject" "74 months with relief" "28 months without conviction" "Source: U.S. Sentencing Commission"

chart "$ROOT/census-population/growth-rate/four-three.webp" "Population growth" "1.8 million in 2025" "0.5% annual growth" "3.2 million in 2024" "Source: U.S. Census Bureau"
chart "$ROOT/census-population/net-migration/four-three.webp" "Net migration" "1.3 million in 2025" "2.7 million a year earlier" "Down 53.8%" "Source: U.S. Census Bureau"

chart "$ROOT/nasa-commercial-data/provider-count/four-three.webp" "Commercial data pool" "Eight new providers" "Six existing providers" "14 listed awardees" "Source: NASA"
chart "$ROOT/nasa-commercial-data/contract-window/four-three.webp" "Contract framework" '$476 million ceiling' "Performance began in 2023" "Runs through Nov. 15, 2028" "Source: NASA"

chart "$ROOT/drought-monitor/area-share/four-three.webp" "Drought area" "48.54% of Lower 48" "40.72% of U.S. + P.R." "Up 1.6% in one week" "Source: U.S. Drought Monitor, Aug. 4"
chart "$ROOT/drought-monitor/population-states/four-three.webp" "Drought exposure" "94.4 million people" "91.5 million in Lower 48" "45 states at D1 or worse" "Source: U.S. Drought Monitor, Aug. 4"

chart "$ROOT/imf-uzbekistan/growth-path/four-three.webp" "Uzbekistan growth" "7.7% in 2025" "6.8% projected in 2026" "6.0% projected in 2027" "Source: International Monetary Fund"
chart "$ROOT/imf-uzbekistan/inflation-external/four-three.webp" "Inflation and trade" "7.0% inflation in April" "3.2% current-account gap" "5% inflation target in 2027" "Source: International Monetary Fund"
