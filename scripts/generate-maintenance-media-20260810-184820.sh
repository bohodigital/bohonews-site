#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-184820"
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

make_lead "$ASSETS/boston-fed.jpg" "$ROOT/gao-main-street-lending/boston-fed" center
make_lead "$ASSETS/courthouse.tif" "$ROOT/ussc-financial-fraud/davenport-courthouse" center
make_lead "$ASSETS/museum.jpg" "$ROOT/smithsonian-in-pursuit/nmah-aerial" center
make_lead "$ASSETS/exercise-bike.png" "$ROOT/nih-prediabetes/exercise-bike" center
make_lead "$ASSETS/track.jpg" "$ROOT/world-athletics-qualification/track-race" center
make_lead "$ASSETS/treasury.jpg" "$ROOT/cbo-excise-taxes/treasury-building" center

chart "$ROOT/gao-main-street-lending/loan-status/four-three.webp" "Main Street loan status" "1,830 loans made" "1,277 fully repaid" "251 still outstanding" "Source: U.S. Government Accountability Office"
chart "$ROOT/gao-main-street-lending/losses-controls/four-three.webp" "Losses and controls" '$1.3B charged off' '$1.4B sold-back amounts' "20 controls addressed" "Source: U.S. Government Accountability Office"

chart "$ROOT/ussc-financial-fraud/cases-loss/four-three.webp" "Financial-instrument fraud" "718 federal cases" '$152,596 median loss' "Down 8% from FY2021" "Source: U.S. Sentencing Commission"
chart "$ROOT/ussc-financial-fraud/sentences/four-three.webp" "Sentencing outcomes" "28-month average" "95% received prison" "45% within guidelines" "Source: U.S. Sentencing Commission"

chart "$ROOT/smithsonian-in-pursuit/scale/four-three.webp" "Museum-wide scale" "250 objects" "250,000 square feet" "All three public floors" "Source: National Museum of American History"
chart "$ROOT/smithsonian-in-pursuit/object-access/four-three.webp" "Objects and access" "76 newly or rarely shown" "Opened May 14, 2026" "Through the end of 2026" "Source: National Museum of American History"

chart "$ROOT/nih-prediabetes/risk/four-three.webp" "Lower long-term risk" "21% lower: two conditions" "25% lower: three conditions" "Compared with placebo" "Source: National Institutes of Health"
chart "$ROOT/nih-prediabetes/trial-design/four-three.webp" "Long-term trial" "1,173 participants" "27 U.S. sites" "Followed through 2021" "Source: National Institutes of Health"

chart "$ROOT/world-athletics-qualification/split/four-three.webp" "Beijing 2027 pathways" "60% via world rankings" "40% via entry standards" "Four individual routes" "Source: World Athletics"
chart "$ROOT/world-athletics-qualification/windows/four-three.webp" "Qualification windows" "Marathon: May 2, 2027" "Most events: Aug. 22" "12 + 4 relay places" "Source: World Athletics"

chart "$ROOT/cbo-excise-taxes/revenue-share/four-three.webp" "Excise tax receipts" '$106 billion in 2025' "2% of federal revenue" "0.3% of GDP" "Source: Congressional Budget Office"
chart "$ROOT/cbo-excise-taxes/sources-trusts/four-three.webp" "Concentrated receipts" "88% from four sources" "70% dedicated to trusts" "Per-unit taxes lose share" "Source: Congressional Budget Office"
