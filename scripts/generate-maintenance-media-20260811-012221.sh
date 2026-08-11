#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260811-012221"
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

make_lead "$ASSETS/coast-guard.jpg" "$ROOT/coast-guard-liabilities/cutter-base-boston" center
make_lead "$ASSETS/tribal-police.jpg" "$ROOT/tribal-crime-statistics/swinomish-police" center
make_lead "$ASSETS/jazz-band.jpg" "$ROOT/gil-evans-archive/navy-jazz-band" center
make_lead "$ASSETS/capitol.jpg" "$ROOT/cbo-2027-budget/capitol-night" center
make_lead "$ASSETS/dar-port.jpg" "$ROOT/tanzania-imf-reviews/dar-port" center
make_lead "$ASSETS/mlb-draft.jpg" "$ROOT/mlb-draft-2026/draft-stage" center

chart "$ROOT/coast-guard-liabilities/liability-breakdown/four-three.webp" "Reported liability" '$448 million total' '$228M aging structures' '$220M cleanup sites' "Source: U.S. GAO"
chart "$ROOT/coast-guard-liabilities/recommendations/four-three.webp" "GAO recommendations" "Expand Congress reports" "Set a long-term strategy" "DHS agreed" "Source: U.S. GAO"

chart "$ROOT/tribal-crime-statistics/offense-counts/four-three.webp" "Reported offenses" "2022: 4,250" "2023: 3,780" "Change: -11%" "Source: Bureau of Justice Statistics"
chart "$ROOT/tribal-crime-statistics/clearance-rates/four-three.webp" "2023 clearance rates" "All violent: 55%" "Homicide: 42%" "Robbery: 29%" "Source: Bureau of Justice Statistics"

chart "$ROOT/gil-evans-archive/inventory/four-three.webp" "Gil Evans archive" "About 350 scores" "35 lead sheets" "50 instrumental parts" "Source: Library of Congress"
chart "$ROOT/gil-evans-archive/unrecorded/four-three.webp" "Never recorded" "About 160 scores" "20 lead sheets" "35 instrumental parts" "Source: Library of Congress"

chart "$ROOT/cbo-2027-budget/spending-changes/four-three.webp" "2027-2036 changes" 'Defense: +$2.4T' 'Nondefense: -$2.6T' 'Mandatory: +$351B' "Source: Congressional Budget Office"
chart "$ROOT/cbo-2027-budget/analysis-limits/four-three.webp" "What CBO analyzed" "Spending proposals" "No revenue proposals" "No deficit or debt total" "Source: Congressional Budget Office"

chart "$ROOT/tanzania-imf-reviews/disbursements/four-three.webp" "Immediate financing" 'ECF: $154.1M' 'RSF: $289.7M' 'Combined: $443.9M' "Source: International Monetary Fund"
chart "$ROOT/tanzania-imf-reviews/outlook/four-three.webp" "Tanzania outlook" "2025 growth: 5.9%" "June inflation: 4%" "Mid-term growth: ~6.2%" "Source: International Monetary Fund"

chart "$ROOT/mlb-draft-2026/player-counts/four-three.webp" "Draft day one" "135 players selected" "First four rounds" "Plus associated picks" "Source: Major League Baseball"
chart "$ROOT/mlb-draft-2026/first-40/four-three.webp" "First 40 picks" "11 shortstops" "11 right-handed pitchers" "26 college / 14 high school" "Source: Major League Baseball"
